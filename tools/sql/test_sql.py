import io, json, os, sys, threading, time, unittest, contextlib
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sql as S

STATE = {"fn": None, "seen": []}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        STATE["seen"].append((self.headers.get("Authorization"), body))
        if self.headers.get("Authorization") != "Bearer good":
            return self.out(401, {"message": "Unauthorized"})
        st, j = STATE["fn"](body)
        self.out(st, j)

    def out(self, st, j):
        d = json.dumps(j).encode()
        self.send_response(st); self.send_header("Content-Length", str(len(d))); self.end_headers(); self.wfile.write(d)


def run(argv, stdin=None):
    out, err = io.StringIO(), io.StringIO()
    old = sys.stdin
    if stdin is not None:
        sys.stdin = io.StringIO(stdin)
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                rc = S.main(argv)
            except SystemExit as e:
                rc = e.code if isinstance(e.code, int) else (print(e.code) or 1)
    finally:
        sys.stdin = old
    return rc, out.getvalue() + err.getvalue()


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        S.API = "http://127.0.0.1:%d/q" % cls.srv.server_port
        os.environ["SQLPY_ALLOW_PIPE"] = "1"
        os.environ["SUPABASE_ACCESS_TOKEN"] = "good"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        STATE["seen"] = []
        STATE["fn"] = lambda b: (201, [])

    # ---- check ----
    def test_check_rules(self):
        e, _ = S.check_text("-- a\n不是註解的第二行\ncreate table t();")
        self.assertTrue(any("檔頭" in x for x in e))
        e, _ = S.check_text("-- a\ncreate function f() returns int as $$ begin return 1; end;")
        self.assertTrue(any("$$" in x for x in e))
        e, w = S.check_text("-- a\ncreate function f() returns int as $$ declare x int; begin return 1; end; $$ language plpgsql;")
        self.assertTrue(any("`x`" in z for z in e))
        bad = "-- a\ncreate function f() returns int as $$ begin\n if random() < case when true then .2 else .6 end then null; end if; return 1; end; $$ language plpgsql;"
        self.assertTrue(any("case" in z for z in S.check_text(bad)[0]))
        good = bad.replace("case when true then .2 else .6 end", "(case when true then .2 else .6 end)")
        self.assertEqual(S.check_text(good)[0], [])
        g = "-- a\ncreate function f(a bigint, b text default 'x') returns int as $$ begin return 1; end; $$ language plpgsql;\n"
        self.assertEqual(S.check_text(g + "grant execute on function public.f(bigint,text) to anon;")[0], [])
        self.assertTrue(S.check_text(g + "grant execute on function public.f(bigint) to anon;")[0])

    def test_check_manifest(self):
        idx = S.mf_index(S.load_manifest())
        self.assertTrue(S.check_text("-- a\n", "nope.sql", idx)[0])
        self.assertTrue(S.check_text("-- a\n", "town_quest.sql", idx)[0] == [])

    def test_all_repo_files_pass(self):
        m = S.load_manifest()
        for e in m["files"]:
            if e["kind"] != "test":
                self.assertEqual(S.check_text(S.read(e["file"]), e["file"], S.mf_index(m))[0], [], e["file"])

    # ---- apply ----
    def test_dry_run_sends_nothing(self):
        rc, out = run(["apply", "town_quest.sql"])
        self.assertEqual(rc, 0); self.assertIn("dry-run", out); self.assertEqual(STATE["seen"], [])

    def test_apply_needs_APPLY(self):
        rc, out = run(["apply", "town_quest.sql", "--prod"], "no\n")
        self.assertEqual(rc, 1); self.assertEqual(STATE["seen"], [])
        rc, out = run(["apply", "town_quest.sql", "--prod"], "APPLY\n")
        self.assertEqual(rc, 0); self.assertEqual(len(STATE["seen"]), 1)

    def test_pipe_refused_without_env(self):
        os.environ.pop("SQLPY_ALLOW_PIPE")
        try:
            rc, out = run(["apply", "town_quest.sql", "--prod"], "APPLY\n")
        finally:
            os.environ["SQLPY_ALLOW_PIPE"] = "1"
        self.assertNotEqual(rc, 0); self.assertEqual(STATE["seen"], [])

    def test_destructive_double_confirm(self):
        self.assertTrue(S.destructive("drop function if exists public.f(int); delete from t where a=1; update t set a=1 where b=2;"))
        self.assertEqual(S.destructive("select 1; -- drop table x\n"), [])
        rc, out = run(["apply", "town_account.sql", "--prod"], "APPLY\nnope\n")
        self.assertIn("破壞性", out); self.assertEqual(rc, 1); self.assertEqual(STATE["seen"], [])
        rc, out = run(["apply", "town_account.sql", "--prod"], "APPLY\nDESTRUCTIVE\n")
        self.assertEqual(rc, 0); self.assertEqual(len(STATE["seen"]), 1)

    def test_refuse_unknown_and_superseded(self):
        rc, out = run(["apply", "zzz.sql"])
        self.assertEqual(rc, 2); self.assertIn("不在 manifest", out)
        rc, out = run(["apply", "town_authfix.sql", "--prod"], "APPLY\n")
        self.assertEqual(rc, 2); self.assertIn("town_device", out); self.assertEqual(STATE["seen"], [])
        rc, out = run(["apply", "town_authfix.sql", "town_account.sql"])
        self.assertEqual(rc, 0)
        rc, out = run(["apply", "town_account.sql", "town_authfix.sql"])
        self.assertEqual(rc, 2)

    def test_needs_warning(self):
        rc, out = run(["apply", "town_quest.sql"])
        self.assertIn("town.sql", out)

    def test_apply_error_stops(self):
        STATE["fn"] = lambda b: (400, {"message": "syntax error at or near x"})
        rc, out = run(["apply", "town_quest.sql", "--prod"], "APPLY\n")
        self.assertEqual(rc, 1); self.assertIn("syntax error", out)

    def test_report_ok_and_fail(self):
        def fn(rep):
            return lambda b: (400, {"message": "ERROR: P0001: " + rep}) if "REPORT" in b["query"] or b["query"].startswith("-- 小豬鎮：市政廳") is False and False else (201, [])
        t = "town_quest_test.sql"
        orig = S.read
        def fake_read(f):
            return "-- t\nREPORT" if f == t else orig(f)
        S.read = fake_read
        try:
            for rep, want in (("REPORT\n✓ 全過", 0), ("REPORT\n❌ 第 3 項 FAIL", 1)):
                STATE["fn"] = lambda b, rep=rep: (400, {"message": "ERROR: P0001: " + rep}) if "REPORT" in b["query"] else (201, [])
                rc, out = run(["apply", "town_quest.sql", "--test", t, "--prod"], "APPLY\n")
                self.assertEqual(rc, want); self.assertIn(rep.split("\n")[1], out)
        finally:
            S.read = orig
        self.assertTrue(os.listdir(os.path.join(S.HERE, "logs")))

    # ---- 後端 ----
    def test_401_and_timeout(self):
        os.environ["SUPABASE_ACCESS_TOKEN"] = "bad"
        try:
            rc, out = run(["query", "select 1"])
            self.assertEqual(rc, 1); self.assertIn("401", out)
        finally:
            os.environ["SUPABASE_ACCESS_TOKEN"] = "good"
        STATE["fn"] = lambda b: (time.sleep(1.5), (201, []))[1]
        os.environ["SQLPY_TIMEOUT"] = "0.3"
        try:
            rc, out = run(["query", "select 1"])
        finally:
            os.environ.pop("SQLPY_TIMEOUT")
        self.assertEqual(rc, 1); self.assertIn("逾時", out)

    # ---- query ----
    def test_query_readonly(self):
        for q in ("update t set a=1", "select 1; drop table t", "with a as (delete from t returning *) select * from a",
                  "select * into x from t", "select * from t for update", "delete from t"):
            self.assertFalse(S.readonly_ok(q)[0], q)
        for q in ("select 1", "with a as (select 1) select * from a", "explain select 1", "select 'drop table' as x"):
            self.assertTrue(S.readonly_ok(q)[0], q)
        STATE["fn"] = lambda b: (201, [{"a": 1}])
        rc, out = run(["query", "select 1"])
        self.assertEqual(rc, 0); self.assertTrue(STATE["seen"][0][1].get("read_only"))
        n = len(STATE["seen"])
        rc, _ = run(["query", "delete from t"])
        self.assertEqual(rc, 2); self.assertEqual(len(STATE["seen"]), n)

    # ---- drift ----
    def test_drift(self):
        fake = {
            "town.sql": "-- a\ncreate or replace function public.town_a(rid bigint) returns int as $$\nbegin return 1; end; $$ language plpgsql;\n",
            "town_authfix.sql": "-- b\ncreate or replace function public.town_dev(a int, b text) returns int as $$ begin return 9; end; $$ language plpgsql;\n",
            "town_account.sql": "-- c\ncreate or replace function public.town_dev(a int, b text, c text) returns int as $$ begin return 2; end; $$ language plpgsql;\n",
        }
        man = {"files": [{"file": "town.sql", "kind": "base"},
                         {"file": "town_authfix.sql", "kind": "patch", "superseded_funcs": ["town_dev"]},
                         {"file": "town_account.sql", "kind": "patch"}]}
        final = S.repo_final(man, fake.__getitem__)
        self.assertEqual(len(final), 2)
        def row(n, a, body):
            return {"name": n, "args": a, "def": "CREATE OR REPLACE FUNCTION public.%s(%s)\n RETURNS integer\n LANGUAGE plpgsql\nAS $function$ %s $function$\n" % (n, a, body)}
        rows = [row("town_a", "rid bigint", "-- hi\n  begin   return 1;   end;"),  # 只差空白與註解 → 一致
                row("town_dev", "a integer", "begin return 1; end;"),            # 舊簽名 overload
                row("town_dev", "a integer, b text, c text", "begin return 3; end;")]  # 內容不同
        diff, over, prod_only, repo_only = S.compare(rows, final)
        self.assertEqual([k[0] for k in diff], ["town_dev"])
        self.assertIn("town_dev", over)
        self.assertEqual(prod_only, [(("town_dev", ("integer",)))])
        self.assertEqual(repo_only, [])
        STATE["fn"] = lambda b: (201, rows)
        rc, out = run(["drift"])
        self.assertEqual(rc, 1); self.assertIn("overload", out)

    def test_setup_plan(self):
        self.assertEqual(run(["setup"])[0], 0)
        self.assertEqual(run(["plan"])[0], 0)


if __name__ == "__main__":
    unittest.main()

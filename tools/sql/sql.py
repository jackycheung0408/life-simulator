#!/usr/bin/env python3
"""小豬鎮 SQL 套用工具（只用標準庫）。用法見 `python3 tools/sql/sql.py -h`、`setup`。
不經過 Claude：套用正式站 SQL、跑回滾實測、檢查正式站與 repo 是否一致。"""
import argparse, datetime, json, os, re, sys, urllib.error, urllib.request, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SQLDIR = os.path.join(ROOT, "supabase")
REF = "gerqdagicybtyilihvvm"
API = os.environ.get("SQLPY_API", "https://api.supabase.com") + "/v1/projects/%s/database/query" % REF
RED, GRN, YEL, RST = "\033[31m", "\033[32m", "\033[33m", "\033[0m"


def c(col, s):
    return col + s + RST if sys.stdout.isatty() or os.environ.get("SQLPY_COLOR") else s


class SqlError(Exception):
    def __init__(self, msg, status=None):
        super().__init__(msg)
        self.status = status


# ---------- 後端 ----------
class ApiBackend:
    name = "Management API"

    def __init__(self, token, timeout=120):
        self.token, self.timeout = token, timeout

    def run(self, sql, read_only=False):
        body = {"query": sql}
        if read_only:
            body["read_only"] = True
        req = urllib.request.Request(API, data=json.dumps(body).encode(), method="POST", headers={
            "Authorization": "Bearer " + self.token, "Content-Type": "application/json",
            "User-Agent": "town-sql-tool/1"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                txt = r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            txt = e.read().decode("utf-8", "replace")
            msg = txt
            try:
                j = json.loads(txt)
                if isinstance(j, dict):
                    msg = j.get("message") or j.get("error") or txt
            except ValueError:
                pass
            if e.code == 401:
                msg = "401 金鑰無效或過期（SUPABASE_ACCESS_TOKEN）：" + str(msg)
            raise SqlError(str(msg), e.code)
        except (TimeoutError, OSError) as e:
            raise SqlError("連線逾時或失敗：%s（結果未知，請先用 query 確認再重試）" % e)
        try:
            return json.loads(txt) if txt.strip() else []
        except ValueError:
            return txt


class PgBackend:
    name = "DATABASE_URL (pg8000)"

    def __init__(self, url):
        import pg8000.native as pg, urllib.parse as up
        u = up.urlparse(url)
        self.conn = pg.Connection(up.unquote(u.username or ""), host=u.hostname, port=u.port or 5432,
                                  database=(u.path or "/postgres")[1:], password=up.unquote(u.password or ""))

    def run(self, sql, read_only=False):
        try:
            rows = self.conn.run(sql)
            cols = [x["name"] for x in (self.conn.columns or [])]
            return [dict(zip(cols, r)) for r in rows or []]
        except Exception as e:  # pg8000.DatabaseError 的 args[0] 是 dict
            a = e.args[0] if e.args else e
            msg = a.get("M", str(a)) if isinstance(a, dict) else str(a)
            raise SqlError(msg)


def get_backend():
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if tok:
        return ApiBackend(tok, float(os.environ.get("SQLPY_TIMEOUT", "120")))
    url = os.environ.get("DATABASE_URL")
    if url:
        try:
            import pg8000.native  # noqa
        except ImportError:
            sys.exit("有 DATABASE_URL 但沒裝 pg8000。要用的話自己執行：pip install pg8000（或改用 SUPABASE_ACCESS_TOKEN，見 setup）")
        return PgBackend(url)
    sys.exit("沒有設定 SUPABASE_ACCESS_TOKEN。先跑：python3 tools/sql/sql.py setup")


# ---------- manifest ----------
def load_manifest():
    with open(os.path.join(HERE, "manifest.json"), encoding="utf-8") as f:
        return json.load(f)


def mf_index(m):
    return {e["file"]: e for e in m["files"]}


def read(file):
    with open(os.path.join(SQLDIR, file), encoding="utf-8") as f:
        return f.read()


def first_comment(text):
    for ln in text.splitlines():
        if ln.strip():
            return ln.strip()[2:].strip() if ln.strip().startswith("--") else "(無檔頭註解)"
    return ""


# ---------- SQL 文字處理 ----------
def strip_sql(s):
    """去掉註解與單引號字串內容（保留換行與長度大致結構），供靜態檢查用。"""
    out, i, n = [], 0, len(s)
    while i < n:
        ch = s[i]
        if s.startswith("--", i):
            j = s.find("\n", i)
            i = n if j < 0 else j
        elif s.startswith("/*", i):
            j = s.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("\n" * s.count("\n", i, j))
            i = j
        elif ch == "'":
            j = i + 1
            while j < n:
                if s[j] == "'":
                    if j + 1 < n and s[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            out.append("''" + "\n" * s.count("\n", i, j))
            i = j + 1
        else:
            out.append(ch)
            i += 1
    return "".join(out)


STMT_START = re.compile(r"^(create|alter|drop|insert|update|delete|do|select|grant|revoke|with|begin|commit|rollback|set|comment|truncate|\$\$|notify|call)\b", re.I)


def norm_type(t):
    t = re.sub(r"\s+", "", t.lower())
    t = t.replace("public.", "")
    return {"int": "integer", "int4": "integer", "int8": "bigint", "bool": "boolean", "float8": "doubleprecision"}.get(t, t)


def split_top(s, sep=","):
    parts, d, cur = [], 0, ""
    for ch in s:
        if ch == "(":
            d += 1
        elif ch == ")":
            d -= 1
        if ch == sep and d == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


def param_types(arglist, names=True):
    res = []
    for p in split_top(arglist):
        p = re.split(r"\s+default\s+|\s*=\s*", p.strip(), flags=re.I)[0].strip()
        p = re.sub(r"^(in|inout|variadic)\s+", "", p, flags=re.I)
        if names:
            m = re.match(r"(\w+|\"[^\"]+\")\s+(.+)$", p, re.S)
            # 只有型別（含空白的型別如 double precision 例外）時 names 解析會失敗
            p = m.group(2) if m else p
        res.append(norm_type(p))
    return res


FUNC_RE = re.compile(r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(", re.I)


def find_funcs(text):
    """回傳 [(name, types, header_start, full_text, body)]；body = $$ 之間的內容。"""
    res = []
    for m in FUNC_RE.finditer(text):
        i, d = m.end(), 1
        while i < len(text) and d:
            d += {"(": 1, ")": -1}.get(text[i], 0)
            i += 1
        args = text[m.end():i - 1]
        dm = re.compile(r"\$(\w*)\$").search(text, i)
        if not dm:
            continue
        tag = dm.group(0)
        e = text.find(tag, dm.end())
        if e < 0:
            continue
        end = text.find(";", e + len(tag))
        end = len(text) if end < 0 else end + 1
        res.append((m.group(1), tuple(param_types(args)), m.start(), text[m.start():end], text[dm.end():e]))
    return res


def norm_body(b):
    b = re.sub(r"/\*.*?\*/", " ", b, flags=re.S)
    b = re.sub(r"--[^\n]*", " ", b)
    return re.sub(r"\s+", " ", b).strip().lower()


# ---------- check ----------
def check_text(text, file="", man=None):
    errs, warns = [], []
    lines = text.splitlines()
    # 1 檔頭：註解行後面接的不是註解、也不是敘述開頭 → 多半是拆行沒補 --
    seen_c = False
    for i, ln in enumerate(lines[:40], 1):
        t = ln.strip()
        if not t:
            if seen_c:
                break
            continue
        if t.startswith("--"):
            seen_c = True
        elif seen_c and not STMT_START.match(t):
            errs.append("第 %d 行：檔頭註解後出現非註解文字（拆行沒補 `-- `？）：%s" % (i, t[:40]))
            break
        else:
            break
    s = strip_sql(text)
    # 2 $$ 成對
    for tag in set(re.findall(r"\$\w*\$", s)):
        if s.count(tag) % 2:
            errs.append("%s 出現奇數次（沒成對）" % tag)
    # 3 plpgsql 變數撞名
    for dm in re.finditer(r"\bdeclare\b(.*?)\bbegin\b", s, re.S | re.I):
        for v in re.finditer(r"^\s*(x|y|k)\s+[a-z]", dm.group(1), re.M | re.I):
            (warns if v.group(1).lower() == "k" else errs).append(
                "plpgsql 變數 `%s` 可能和 town_residents 欄位撞名（改個名字）" % v.group(1))
    # 4 if…then 條件含 case 必須括號
    for m in re.finditer(r"^\s*(?:if|elsif|elseif)\b", s, re.M | re.I):
        i, d, buf = m.end(), 0, ""
        while i < len(s):
            ch = s[i]
            if ch == "(":
                d += 1
            elif ch == ")":
                d -= 1
            elif d == 0 and re.match(r"then\b", s[i:i + 5], re.I) and not re.match(r"\w", s[i - 1]):
                break
            if d == 0:
                buf += ch
            i += 1
        if re.search(r"\bcase\b", buf, re.I):
            errs.append("第 %d 行：if 條件含未括號的 case（要整段包括號）" % (s.count("\n", 0, m.start()) + 1 + 1))
    # 5 grant/revoke 簽名
    defs = collections.defaultdict(list)
    for name, types, *_ in find_funcs(text):
        defs[name].append(types)
    for m in re.finditer(r"\b(?:grant|revoke)\b[^;]*?\bon\s+function\s+(?:public\.)?(\w+)\s*\(([^)]*)\)", s, re.I):
        name, types = m.group(1), tuple(param_types(m.group(2), names=False)) if m.group(2).strip() else ()
        if name in defs and types not in defs[name]:
            errs.append("grant/revoke %s(%s) 和檔內 create function 簽名不一致" % (name, ",".join(types)))
    # 6 manifest
    if man is not None and file:
        e = man.get(file)
        if e is None:
            errs.append("不在 manifest（也不在 ignore）")
        elif isinstance(e.get("superseded"), str):
            errs.append("已被 %s 取代，不要再套用" % e["superseded"])
        elif e.get("superseded_funcs"):
            warns.append("含已被取代的函式 %s（見 manifest）；套用時必須和取代它的檔一起" % ",".join(e["superseded_funcs"]))
    return errs, warns


def cmd_check(a):
    m = load_manifest()
    idx = mf_index(m)
    bad = 0
    for f in a.files:
        f = os.path.basename(f)
        if not os.path.exists(os.path.join(SQLDIR, f)):
            print(c(RED, "✗ %s：檔案不存在" % f))
            bad += 1
            continue
        if f in m.get("ignore", []):
            e = idx.get(f) or {"file": f}
            errs, warns = check_text(read(f))
        else:
            errs, warns = check_text(read(f), f, idx)
        for w in warns:
            print(c(YEL, "! %s：%s" % (f, w)))
        for e in errs:
            print(c(RED, "✗ %s：%s" % (f, e)))
        if not errs:
            print(c(GRN, "✓ %s" % f))
        bad += bool(errs)
    return 1 if bad else 0


# ---------- plan ----------
def cmd_plan(a):
    m = load_manifest()
    print("標準套用順序（後面的檔蓋掉前面）：\n")
    for n, e in enumerate(m["files"], 1):
        if e["kind"] == "test" and not a.all:
            continue
        mark = {"base": "底", "patch": "補", "once": "一次性", "test": "實測"}[e["kind"]]
        sup = ""
        if isinstance(e.get("superseded"), str):
            sup = c(RED, "  [已被 %s 取代，勿套]" % e["superseded"])
        elif e.get("superseded_funcs"):
            sup = c(YEL, "  [%s 段已被 %s 取代]" % (",".join(e["superseded_funcs"]), e.get("superseded_by", "?")))
        print("%2d. [%s] %s%s" % (n, mark, e["file"], sup))
        print("      " + first_comment(read(e["file"]))[:90])
        if e.get("needs"):
            print("      需要：" + ", ".join(e["needs"]))
        if e.get("note"):
            print("      註：" + e["note"])
    print("\n(--all 連實測檔一起列；實測檔共 %d 個)" % sum(e["kind"] == "test" for e in m["files"]))
    return 0


# ---------- apply ----------
DESTR = [("drop", re.compile(r"\bdrop\s+(function|table|index|trigger|policy|view|column|schema|type)\b[^;]*", re.I)),
         ("truncate", re.compile(r"\btruncate\b[^;]*", re.I)),
         ("delete", re.compile(r"\bdelete\s+from\b[^;]*", re.I)),
         ("update", re.compile(r"\bupdate\s+[\w.\"]+\s+set\b[^;]*", re.I)),
         ("alter-drop", re.compile(r"\balter\s+table\b[^;]*\bdrop\b[^;]*", re.I))]


def destructive(text):
    s = strip_sql(text)
    res = []
    for kind, rx in DESTR:
        for m in rx.finditer(s):
            res.append((kind, re.sub(r"\s+", " ", m.group(0))[:90]))
    return res


def confirm(word, prompt):
    if not sys.stdin.isatty() and not os.environ.get("SQLPY_ALLOW_PIPE"):
        sys.exit("需要在終端機互動輸入確認（不接受管線輸入）。")
    return input(prompt).strip() == word


REPORT_BAD = re.compile(r"❌|失敗|FAIL", re.I)


def extract_report(msg):
    i = msg.find("REPORT")
    return msg[i:] if i >= 0 else None


def run_test(be, tfile, log):
    print("\n── 實測 %s ──" % tfile)
    try:
        be.run(read(tfile))
    except SqlError as e:
        rep = extract_report(str(e))
        if rep is None:
            print(c(RED, "實測失敗（非 REPORT 錯誤）：%s" % e))
            log("TEST %s ERROR %s" % (tfile, e))
            return 1
        bad = bool(REPORT_BAD.search(rep))
        print(c(RED if bad else GRN, rep))
        log("TEST %s %s\n%s" % (tfile, "FAIL" if bad else "OK", rep))
        return 1 if bad else 0
    print(c(YEL, "實測沒有丟 REPORT（沒有 raise exception？）：結果未知。注意它可能沒有回滾！"))
    log("TEST %s no REPORT" % tfile)
    return 1


def cmd_apply(a):
    m = load_manifest()
    idx = mf_index(m)
    files = [os.path.basename(f) for f in a.files]
    problems = []
    for f in files:
        e = idx.get(f)
        if e is None:
            problems.append("%s 不在 manifest（拒絕）" % f)
            continue
        if e["kind"] == "test":
            problems.append("%s 是實測檔，請用 --test" % f)
        if isinstance(e.get("superseded"), str):
            problems.append("%s 已被 %s 取代（拒絕）" % (f, e["superseded"]))
        by = e.get("superseded_by")
        if e.get("superseded_funcs") and not (by in files and files.index(by) > files.index(f)):
            problems.append("%s 含已被取代的 %s；要一起套用且 %s 排在它後面（apply %s %s）" % (
                f, ",".join(e["superseded_funcs"]), by, f, by))
        errs, _ = check_text(read(f), f, idx) if os.path.exists(os.path.join(SQLDIR, f)) else (["檔案不存在"], [])
        problems += ["%s：%s" % (f, x) for x in errs if "取代" not in x and "manifest" not in x]
    if a.test:
        t = os.path.basename(a.test)
        if t not in idx or idx[t]["kind"] != "test":
            problems.append("--test %s 不是 manifest 裡的 test 檔" % t)
    if problems:
        for p in problems:
            print(c(RED, "✗ " + p))
        return 2
    for f in files:
        for n in idx[f].get("needs", []):
            if n not in files[:files.index(f)]:
                print(c(YEL, "! %s 需要 %s 已先套用過（本次沒包含，請確認正式站已有）" % (f, n)))
    dest_all = False
    for f in files:
        text = read(f)
        d = destructive(text)
        print("\n• %s  (%s)  %d 字元  %s" % (f, idx[f]["kind"], len(text), first_comment(text)[:60]))
        if d:
            dest_all = True
            cnt = collections.Counter(k for k, _ in d)
            print(c(YEL, "  破壞性語句：" + ", ".join("%s×%d" % kv for kv in cnt.items())))
            for k, s in d[:12]:
                print(c(YEL, "    [%s] %s" % (k, s)))
            if len(d) > 12:
                print(c(YEL, "    …還有 %d 個" % (len(d) - 12)))
    if a.test:
        print("\n之後會跑實測：%s" % a.test)
    if not a.prod:
        print("\n（dry-run：沒有送出任何東西。要真的套用請加 --prod）")
        return 0
    be = get_backend()
    print("\n將套用到正式站 %s（%s）" % (REF, be.name))
    if any(idx[f]["kind"] == "once" for f in files):
        print(c(YEL, "含「一次性」檔：已套用過就不要再套。"))
    if getattr(a, "yes", False):
        print(c(YEL, "--yes：略過 APPLY 輸入（只在使用者已於對話按核准按鈕時由 Claude 加上；含破壞性語句仍要手動輸入 DESTRUCTIVE）"))
    elif not confirm("APPLY", "輸入 APPLY 繼續（其他任何字取消）："):
        print("已取消")
        return 1
    if dest_all and getattr(a, "destructive_ok", False):
        print(c(YEL, "--destructive-ok：略過 DESTRUCTIVE 輸入（使用者已在對話明確授權；只在授權後由 Claude 加上）"))
    elif dest_all and not confirm("DESTRUCTIVE", "含破壞性語句，再輸入 DESTRUCTIVE："):
        print("已取消")
        return 1
    os.makedirs(os.path.join(HERE, "logs"), exist_ok=True)
    lp = os.path.join(HERE, "logs", datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + ".log")

    def log(s):
        with open(lp, "a", encoding="utf-8") as fh:
            fh.write("%s %s\n" % (datetime.datetime.now().isoformat(timespec="seconds"), s))

    for f in files:
        try:
            be.run(read(f))
            print(c(GRN, "✓ 已套用 %s" % f))
            log("APPLY %s OK" % f)
        except SqlError as e:
            print(c(RED, "✗ %s 失敗：%s" % (f, e)))
            log("APPLY %s FAIL %s" % (f, e))
            print("後面的檔不套用。log：" + lp)
            return 1
    rc = run_test(be, os.path.basename(a.test), log) if a.test else 0
    print("log：" + lp)
    return rc


# ---------- query ----------
RO = re.compile(r"^\s*\(*\s*(select|with|explain|show|values)\b", re.I)
BAD_KW = re.compile(r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|execute|vacuum|merge|set|lock|comment|refresh|reindex|cluster|listen|notify)\b", re.I)


def readonly_ok(q):
    s = strip_sql(q).strip().rstrip(";")
    if ";" in s:
        return False, "只允許單一敘述"
    if not RO.match(s):
        return False, "只允許 select／with／explain"
    # CTE 內的寫入（with x as (delete …)）與 select … for update、select into
    m = BAD_KW.search(s) or re.search(r"\bfor\s+(update|share|no key update)\b|\binto\b", s, re.I)
    if m:
        return False, "含非唯讀關鍵字：" + m.group(0)
    return True, ""


def cmd_query(a):
    ok, why = readonly_ok(a.sql)
    if not ok:
        print(c(RED, "✗ 拒絕：" + why))
        return 2
    try:
        r = get_backend().run(a.sql, read_only=True)
    except SqlError as e:
        print(c(RED, "✗ %s" % e))
        return 1
    print(json.dumps(r, ensure_ascii=False, indent=1, default=str) if not isinstance(r, str) else r)
    return 0


# ---------- drift ----------
DRIFT_SQL = ("select p.proname as name, pg_get_function_identity_arguments(p.oid) as args, "
             "pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on n.oid=p.pronamespace "
             "where n.nspname='public' and p.proname like 'town\\_%' order by 1,2")


def repo_final(m=None, reader=read):
    """依 manifest 順序算每個函式的最終版本：{(name,types): (body_norm, file)}"""
    m = m or load_manifest()
    final = {}
    for e in m["files"]:
        if e["kind"] in ("test", "once") or isinstance(e.get("superseded"), str):
            continue
        skip = set(e.get("superseded_funcs", []))
        text = reader(e["file"])
        for name, types, _, _, body in find_funcs(text):
            if name in skip:
                continue
            final[(name, types)] = (norm_body(body), e["file"])
    return final


def compare(rows, final):
    prod, byname = {}, collections.defaultdict(list)
    for r in rows:
        types = tuple(param_types(r["args"])) if r["args"].strip() else ()
        dm = re.search(r"\$(\w*)\$(.*)\$\1\$", r["def"], re.S)
        prod[(r["name"], types)] = norm_body(dm.group(2) if dm else r["def"])
        byname[r["name"]].append(types)
    over = {n: t for n, t in byname.items() if len(t) > 1}
    diff = sorted(k for k in prod if k in final and prod[k] != final[k][0])
    prod_only = sorted(k for k in prod if k not in final)
    repo_only = sorted(k for k in final if k not in prod)
    return diff, over, prod_only, repo_only


def cmd_drift(a):
    try:
        rows = get_backend().run(DRIFT_SQL, read_only=True)
    except SqlError as e:
        print(c(RED, "✗ %s" % e))
        return 1
    return report_drift(rows)


def report_drift(rows):
    final = repo_final()
    diff, over, prod_only, repo_only = compare(rows, final)
    sig = lambda k: "%s(%s)" % (k[0], ",".join(k[1]))
    print("正式站函式 %d 個，repo 最終版本 %d 個" % (len(rows), len(final)))
    print(c(RED if diff else GRN, "\n不一致（正式站 ≠ repo）：%d" % len(diff)))
    for k in diff:
        print("  " + sig(k) + "   ← 最後定義在 " + final[k][1])
    print(c(RED if over else GRN, "\n簽名重複（overload）：%d" % len(over)))
    for n, t in over.items():
        print("  %s：%s" % (n, " / ".join("(%s)" % ",".join(x) for x in t)))
    print(c(YEL if prod_only else GRN, "\n只在正式站、repo 找不到：%d" % len(prod_only)))
    for k in prod_only[:30]:
        print("  " + sig(k))
    print(c(YEL if repo_only else GRN, "\n只在 repo、正式站沒有：%d" % len(repo_only)))
    for k in repo_only[:30]:
        print("  %s   (%s)" % (sig(k), final[k][1]))
    return 1 if (diff or over) else 0


# ---------- setup ----------
SETUP = """一次性設定（約 2 分鐘）：
1. 開 https://supabase.com/dashboard/account/tokens
   用「擁有專案 gerqdagicybtyilihvvm 的那個 Supabase 帳號」登入。
2. Generate new token，名字隨意（例如 town-sql），複製（只顯示一次）。
3. 終端機執行（把 sbp_xxx 換成你的）：
     echo 'export SUPABASE_ACCESS_TOKEN=sbp_xxx' >> ~/.zshrc && source ~/.zshrc
   這串金鑰永遠不要貼給 Claude 或任何人。
4. 驗證：
     python3 tools/sql/sql.py query "select 1"
   看到 [{"?column?": 1}] 就成功。
常用：
     python3 tools/sql/sql.py plan
     python3 tools/sql/sql.py check supabase/town_xxx.sql
     python3 tools/sql/sql.py apply town_xxx.sql --test town_xxx_test.sql --prod
     python3 tools/sql/sql.py drift
(備案：設 DATABASE_URL 並自行 pip install pg8000，best-effort 未實測)"""


def main(argv=None):
    p = argparse.ArgumentParser(description="小豬鎮 SQL 套用工具")
    sp = p.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("plan"); s.add_argument("--all", action="store_true"); s.set_defaults(f=cmd_plan)
    s = sp.add_parser("check"); s.add_argument("files", nargs="+"); s.set_defaults(f=cmd_check)
    s = sp.add_parser("apply"); s.add_argument("files", nargs="+"); s.add_argument("--test"); s.add_argument("--prod", action="store_true"); s.add_argument("--yes", action="store_true"); s.add_argument("--destructive-ok", action="store_true"); s.set_defaults(f=cmd_apply)
    s = sp.add_parser("query"); s.add_argument("sql"); s.set_defaults(f=cmd_query)
    s = sp.add_parser("drift"); s.set_defaults(f=cmd_drift)
    s = sp.add_parser("setup"); s.set_defaults(f=lambda a: print(SETUP) or 0)
    a = p.parse_args(argv)
    return a.f(a)


if __name__ == "__main__":
    sys.exit(main())

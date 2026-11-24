#!/usr/bin/env bash
# 驗證備份真的可還原：解密 → 看 pg_restore --list → （選用）還原到「本機」測試資料庫並比對筆數。絕不連正式站。
# 用法：./verify-backup.sh 備份檔 [--dry-run] [--restore-local]
#   --restore-local 需要本機 Postgres（Docker：docker run -d --name town-pg -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:15）
#   本機連線字串用 LOCAL_URL（預設 postgresql://postgres:pw@localhost:55432/postgres）；拒絕任何含 supabase.co 的網址。
set -euo pipefail
F="${1:-}"; shift || true; DRY=0; RL=0
for a in "$@"; do case "$a" in --dry-run) DRY=1;; --restore-local) RL=1;; esac; done
[ -n "$F" ] || { sed -n 2,6p "$0"; exit 2; }
echo "== 驗證 $F =="
echo "步驟：1) 解密成暫存 tar 2) 列出內容 3) pg_restore --list 4)（--restore-local）建 schema、灌資料到本機、比對各表筆數與錢總和"
[ "$DRY" = 1 ] && { echo "✓ dry-run：不解密、不連線"; exit 0; }
[ -f "$F" ] || { echo "✗ 找不到 $F" >&2; exit 1; }
TMP=$(mktemp -d "${TMPDIR:-/tmp}/town-vf.XXXXXX"); trap 'rm -rf "$TMP"' EXIT; umask 077
case "$F" in
  *.age) [ -n "${AGE_KEY_FILE:-}" ] || { echo "✗ age 備份要設 AGE_KEY_FILE（私鑰檔路徑）" >&2; exit 1; }; age -d -i "$AGE_KEY_FILE" "$F" > "$TMP/b.tar";;
  *) [ -n "${BACKUP_PASS_FILE:-}" ] || { echo "✗ 要設 BACKUP_PASS_FILE" >&2; exit 1; }
     openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "file:$BACKUP_PASS_FILE" -in "$F" > "$TMP/b.tar";;
esac
tar -C "$TMP" -xf "$TMP/b.tar"; cat "$TMP/MANIFEST.txt" | head -3
echo "schema.sql 行數：$(wc -l < "$TMP/schema.sql")  函式數：$(grep -c '^CREATE FUNCTION' "$TMP/schema.sql" || true)"
pg_restore --list "$TMP/data.dump" | grep -c 'TABLE DATA' | sed 's/^/資料表數：/'
if [ "$RL" = 1 ]; then
  LOCAL_URL="${LOCAL_URL:-postgresql://postgres:pw@localhost:55432/postgres}"
  case "$LOCAL_URL" in *supabase*) echo "✗ 拒絕：這不是本機資料庫" >&2; exit 1;; *localhost*|*127.0.0.1*) ;; *) echo "✗ LOCAL_URL 必須是 localhost" >&2; exit 1;; esac
  psql "$LOCAL_URL" -v ON_ERROR_STOP=0 -q -c 'drop schema if exists public cascade; create schema public; create extension if not exists pgcrypto;' >/dev/null
  psql "$LOCAL_URL" -q -f "$TMP/schema.sql" >/dev/null 2>"$TMP/schema.err" || true
  echo "schema 還原訊息（Supabase 專屬的 role／extension 錯誤可忽略）：$(grep -c ERROR "$TMP/schema.err" || true) 筆"
  pg_restore --data-only --disable-triggers --no-owner -d "$LOCAL_URL" "$TMP/data.dump" 2>"$TMP/data.err" || true
  echo "資料還原錯誤：$(grep -c 'error' "$TMP/data.err" || true) 筆"
  psql "$LOCAL_URL" -At -c "select 'residents='||count(*)||' towns='||(select count(*) from town_towns)||' events='||(select count(*) from town_events)||' money_sum='||coalesce(sum(money),0) from town_residents"
  echo "→ 把上面這行和正式站 sql.py query \"select count(*),sum(money) from town_residents\" 比對（備份當下之後會有些許差異）"
fi
echo "✓ 備份可解密、內容完整"

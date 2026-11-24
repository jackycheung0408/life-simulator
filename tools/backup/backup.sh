#!/usr/bin/env bash
# 小豬鎮每日加密備份（pg_dump → 加密 → 滾動保留 14 份）。bash 3.2（macOS 內建）可跑。
# 用法：./backup.sh [--dry-run] [--out 資料夾] [--keep N]
# 必要環境變數（只放你自己的 ~/.zshenv 或 ~/.config/town-backup.env，絕對不要放 repo）：
#   DATABASE_URL        Supabase 連線字串（Dashboard → Connect → Session pooler；含密碼，自己保管）
#   BACKUP_PASS_FILE    加密密語的檔案路徑（檔案內容是一行長密語；不放 repo、不放備份資料夾）
#   （或）AGE_RECIPIENT age 公鑰（有裝 age 就優先用；私鑰自己離線保管）
# 選用：BACKUP_DIR（預設 iCloud Drive/town-backups）、BACKUP_KEEP（預設 14）、EXTRA_TABLES（空白分隔，例 "fb_players lives"）
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DRY=0; OUT="${BACKUP_DIR:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/town-backups}"; KEEP="${BACKUP_KEEP:-14}"
while [ $# -gt 0 ]; do case "$1" in
  --dry-run) DRY=1;; --out) OUT="$2"; shift;; --keep) KEEP="$2"; shift;;
  -h|--help) sed -n 2,12p "$0"; exit 0;; *) echo "不認得的參數：$1" >&2; exit 2;; esac; shift; done
[ -f "$HOME/.config/town-backup.env" ] && . "$HOME/.config/town-backup.env"   # 可選：把變數放這個檔（chmod 600）
TABLES=$(grep -v '^[[:space:]]*#' "$HERE/tables.txt" | grep -v '^[[:space:]]*$' | tr '\n' ' ')
TABLES="$TABLES ${EXTRA_TABLES:-}"
STAMP=$(TZ=Asia/Taipei date +%Y%m%d-%H%M)
if command -v age >/dev/null 2>&1 && [ -n "${AGE_RECIPIENT:-}" ]; then ENC=age; EXT=age
elif [ -n "${BACKUP_PASS_FILE:-}" ]; then ENC=openssl; EXT=enc
else ENC=none; EXT=enc; fi
echo "== 小豬鎮備份 $STAMP =="
echo "資料表（$(echo $TABLES | wc -w | tr -d ' ')）：$TABLES"
echo "輸出：$OUT/town-$STAMP.tar.$EXT（保留最新 $KEEP 份）"
echo "加密：$ENC（age 公鑰＝AGE_RECIPIENT；openssl aes-256-cbc pbkdf2 600000 次，密語檔＝BACKUP_PASS_FILE）"
echo "步驟：1) pg_dump --schema-only（函式、觸發器、表結構）2) pg_dump -Fc --data-only 只含上列表 3) tar 4) 加密 5) 刪除原檔 6) 驗證可解密並 pg_restore --list 7) 刪除第 $((KEEP+1)) 份以後"
miss=""
for v in DATABASE_URL; do [ -n "${!v:-}" ] || miss="$miss $v"; done
[ "$ENC" != none ] || miss="$miss BACKUP_PASS_FILE(或 AGE_RECIPIENT)"
command -v pg_dump >/dev/null 2>&1 || miss="$miss pg_dump(brew install libpq；PATH 加 /opt/homebrew/opt/libpq/bin)"
if [ "$DRY" = 1 ]; then
  [ -z "$miss" ] && echo "✓ dry-run：環境齊全，不會連線" || echo "! dry-run：缺少$miss（真的跑會停在這裡）"; exit 0; fi
[ -z "$miss" ] || { echo "✗ 缺少$miss" >&2; exit 1; }
[ "$ENC" != openssl ] || [ -f "$BACKUP_PASS_FILE" ] || { echo "✗ 找不到密語檔 $BACKUP_PASS_FILE" >&2; exit 1; }
case "$OUT" in "$HERE"*|*sim-life-town*) echo "✗ 輸出資料夾不能在 repo 內" >&2; exit 1;; esac
mkdir -p "$OUT"; umask 077
TMP=$(mktemp -d "${TMPDIR:-/tmp}/town-bk.XXXXXX"); trap 'rm -rf "$TMP"' EXIT
pg_dump "$DATABASE_URL" --schema=public --schema-only --no-owner --no-privileges -f "$TMP/schema.sql"
args=(); for t in $TABLES; do args+=(--table="public.$t"); done
pg_dump "$DATABASE_URL" -Fc --data-only --no-owner --no-privileges "${args[@]}" -f "$TMP/data.dump"
printf 'time=%s\ntables=%s\nhost_hint=supabase\n' "$STAMP" "$TABLES" > "$TMP/MANIFEST.txt"
tar -C "$TMP" -cf "$TMP/bundle.tar" schema.sql data.dump MANIFEST.txt
FINAL="$OUT/town-$STAMP.tar.$EXT"
if [ "$ENC" = age ]; then age -r "$AGE_RECIPIENT" -o "$FINAL" "$TMP/bundle.tar"
else openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "file:$BACKUP_PASS_FILE" -in "$TMP/bundle.tar" -out "$FINAL"; fi
SIZE=$(wc -c < "$FINAL" | tr -d ' ')
[ "$SIZE" -gt 1000 ] || { echo "✗ 備份檔太小（$SIZE bytes），刪除" >&2; rm -f "$FINAL"; exit 1; }
# 驗證：openssl 版可以立刻解密並列出內容（age 要私鑰，見 verify-backup.sh）
if [ "$ENC" = openssl ]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "file:$BACKUP_PASS_FILE" -in "$FINAL" | tar -tf - >/dev/null || { echo "✗ 解密驗證失敗" >&2; exit 1; }
fi
echo "✓ 完成 $FINAL（$SIZE bytes）"
# 滾動保留
ls -1t "$OUT"/town-*.tar.* 2>/dev/null | tail -n +$((KEEP+1)) | while read -r f; do echo "刪除舊備份 $f"; rm -f "$f"; done

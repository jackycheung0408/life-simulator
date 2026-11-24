# 小豬鎮每日加密備份

Supabase Free 沒有備份，這是唯一的保險。每天一份，加密後放 iCloud Drive，保留最新 14 份。

## 你要做的 3 步（約 15 分鐘）
1. **取得連線字串**：Supabase Dashboard → 專案 → Connect → **Session pooler**，複製 URI，把 `[YOUR-PASSWORD]` 換成資料庫密碼（Settings → Database 可重設）。這串＝完整權限，只放自己電腦。
2. **設環境變數**（裝 `brew install libpq age` 後 `echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc`）：
   ```bash
   mkdir -p ~/.config && umask 077
   openssl rand -base64 48 > ~/.config/town-backup.pass     # 加密密語，另外抄一份到密碼管理器！
   cat > ~/.config/town-backup.env <<'X'
   export DATABASE_URL='postgresql://postgres.xxxx:密碼@aws-0-xxx.pooler.supabase.com:5432/postgres'
   export BACKUP_PASS_FILE="$HOME/.config/town-backup.pass"
   X
   chmod 600 ~/.config/town-backup.env
   tools/backup/backup.sh --dry-run     # 先看會做什麼
   tools/backup/backup.sh               # 手動跑第一份
   ```
3. **載入 launchd**（每天 04:30）：複製 `com.townpig.backup.plist.example` 到 `~/Library/LaunchAgents/com.townpig.backup.plist`，把 `YOU`／`REPO` 換成路徑，然後
   ```bash
   launchctl load ~/Library/LaunchAgents/com.townpig.backup.plist
   ```
   跑完第一份後，用 `verify-backup.sh` 驗證（見 `restore-drill.md`）。

## 檔案
- `backup.sh`：`pg_dump`（schema 含函式觸發器＋指定表資料）→ tar → 加密（有 `age`＋`AGE_RECIPIENT` 用 age，否則 `openssl aes-256-cbc -pbkdf2 -iter 600000` 搭配密語檔）→ 滾動保留。`--dry-run` 不需要任何環境變數。
- `verify-backup.sh`：解密、列內容、（選用）還原到**本機** Docker Postgres 並比對筆數。
- `tables.txt`：備份的表。`node tools/backup/verify-tables.mjs` 比對 `supabase/*.sql`，新增表忘了列會報錯（`node town/test.js` 也會跑它）。
- `restore-drill.md`：還原演練（每季一次）與真的出事時的還原步驟。

## 保管規則
- 連線字串、密語、age 私鑰**不進 repo、不放在備份資料夾**；備份檔本身是加密的，可放 iCloud。密語遺失＝備份作廢，請存密碼管理器。
- repo 的 `.gitignore` 已排除 `.env`、`*.enc`、`*.age`、`town-backups/`。
- 只備份 `town_*` 表（小豬鎮）；足球／人生模擬器共用同一個資料庫，要一起備份就設 `EXTRA_TABLES="fb_xxx lives"`（表名用 Dashboard 查）。
- 風險：Mac 睡眠／沒開機那天會漏備（launchd 醒來後補跑）；備份 ≤ 24 小時舊（RPO 24h）。玩家變多後改成每 6 小時：plist 的 `StartCalendarInterval` 換成 `StartInterval` 21600。
- 提醒：備份只含 `public` schema，不含 Supabase Auth 使用者（帳號救援用的 Email OTP 紀錄，影響很小）與 Edge Function 設定（在 repo）。

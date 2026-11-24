# 還原演練（每季一次）與真的出事時的還原

**鐵則：只還原到本機或另一個測試專案，絕對不要對正式站直接 `pg_restore`／覆蓋。** 真的要救正式站，先停下來，和協調者討論，用新專案接手最安全。

## A. 演練（約 20 分鐘，零風險）
1. 開本機 Postgres（需 Docker，第一次要下載映像，使用者核准）：
   ```bash
   docker run -d --name town-pg -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:15
   ```
2. 驗證最新備份並還原到本機：
   ```bash
   source ~/.config/town-backup.env
   tools/backup/verify-backup.sh "$HOME/Library/Mobile Documents/com~apple~CloudDocs/town-backups/town-最新.tar.enc" --restore-local
   ```
   看到「✓ 備份可解密、內容完整」與 `residents=… money_sum=…`。
3. 比對正式站：`python3 tools/sql/sql.py query "select count(*), sum(money) from town_residents"`，居民數應相同、錢總和差在備份後 24 小時內的玩家活動。
4. 記錄耗時與結果到 side-session-notes 或這份文件底部；`docker rm -f town-pg` 收尾。
- 演練標準：解密成功、`schema.sql` 有函式（`town_state` 等）、資料表數 = `tables.txt` 的表數、居民數吻合。

## B. 真的出事（誤刪資料／專案壞掉）
1. **先別動**：停止寫入（鎮長可關功能），確認是哪些表壞、壞多久。
2. 小範圍（某幾張表被誤改）：解密備份 → 還原到本機（A 的步驟）→ 用 `psql` 把需要的列 `COPY` 出來 → 用 SQL Editor 針對性補回（先回滾交易試）。
3. 整個專案壞掉：建新 Supabase 專案（需核准）→ 照 `tools/sql/manifest.json` 順序套所有 SQL（`sql.py plan`）→ `pg_restore --data-only --disable-triggers -d <新專案 URL> data.dump`（新專案才可）→ 更新 `town/` 裡的 `SB`／`SBK` 並 `node tools/town-bump.mjs` 發版（玩家的登入金鑰是資料庫內雜湊，資料還原後仍有效）。
4. 事後：寫一份事件記錄，補強備份頻率。

## 檢查項目（每次演練打勾）
- [ ] 最新備份檔日期 ≤ 2 天
- [ ] 解密成功（密語檔還在、密碼管理器也有一份）
- [ ] `schema.sql` 含 `town_state`、`town_act`、`town_casino`
- [ ] 資料表數 = `tables.txt` 表數
- [ ] 居民數、錢總和和正式站接近
- [ ] iCloud 空間夠（每份約 數百 KB～數 MB）

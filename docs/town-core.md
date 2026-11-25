> 小豬鎮後端／登入鎖定／留存／資安、加設施清單、路線圖、備份壓測：改後端結構或新增設施前讀（從 CLAUDE.md 整段搬出，原文未改）

## 小豬鎮（`town/`）：多人類模擬市民小鎮
- 前端：`town/index.html`（CSS 全在裡面）、`town/town.js`（地圖、面板、小遊戲）、`town/icons.js`（12×12 像素圖示，emoji → 圖示名對照）。
- 後端：`supabase/town.sql`，全部邏輯在 plpgsql security definer 函式（`town_state/create/join/login/device/find/act/mayor/features/game/duel/push_sub`）。資料表全開 RLS、不給直接權限。這個檔可重複執行。
- 推播：`supabase/functions/town-push`（Verify JWT 要保持關閉）＋ `supabase/town_push.sql`。function 內的消耗速率、離線保護要和 `town_tick` 同步；改了要重新部署：`supabase functions deploy town-push --project-ref gerqdagicybtyilihvvm --no-verify-jwt`（需要 CLI 登入；自動模式會擋，要使用者自己跑）。
- 登入：免密碼，每台裝置一把金鑰（只存雜湊在 `town_devices`），新裝置用邀請碼。
- 登入鎖定（`town_auth`，2026-11-22 修正）：只有舊 4 碼 pin 算暴力猜測，錯 5 次鎖 10 分鐘，之後每多 5 次失敗鎖定時間加倍（上限 24 小時）；**鎖定中連正確的 4 碼 pin 也不放行**（以前正確的會通過，等於鎖定擋不住暴力猜測）；長隨機裝置金鑰不受鎖定影響，登入成功會清零。實測 `supabase/town_authfix_test.sql`。
- 留存機制（`supabase/town_retention.sql`，2026-11-22；實測 `town_retention_test.sql`）：連續上線日曆（第 3／7／14／21／30／60／100 天給零食、限定造型、稱號；每週一次保護盾）、新人保護（登入未滿 7 天的居民每天被同一人打架／丟蛋／惡作劇最多 2 次、全部人最多 4 次，超過整個動作回滾，由 `town_events` 上的觸發器 `town_newcomer_guard` 擋）、每日收成（信箱＝零食、花圃＝€150、小豬雕像＝€500，隔天沒上線補領最多 3 天份）、午間市集 12～14 點與夜市 21～23 點打工薪水 +10%（`town_wd_pct`，開張時 `town_happy_touch` 公告一次）、登入隨機事件好壞各半。**獎勵與公告走小鎮動態；午間市集／夜市的 +10% 在畫面上方的事件橫幅（`#wev`，`happyAt`）顯示，和全鎮事件可同時出現（前端 `happyAt` 的時段要和 SQL `town_wd_pct` 一致）；打工薪水的數字本身（`payOf`）和全鎮事件一樣不含倍率，沒有另外加註。** 推播新增「連續上線快斷了」「市集開張」（`town_push_log` 每人每天每種一次）。
- 小鎮人氣禮（邀請朋友獎勵，`town_retention.sql` 的 `town_pop_touch`，2026-11-22）：活躍居民（登入滿 3 天）累積到 3／4／6／8／12 位，小鎮動態公告，全鎮每位居民下次登入領禮（零食、€3000、限定造型「小豬耳朵」「洋裝」、稱號、€20000；已有的造型改領零食）。`town_towns.pop` 記已達成的最高門檻，`items.al.pm` 記個人領過的門檻（`town_al_touch` 重建 al 時要保留 `pm`，否則每天重領）。前端沒有畫面，走小鎮動態。
- 資安補強（`supabase/town_hardening_1122.sql`）：`town_pw_ok/bad/blocked`、`town_push_notify` 收掉 anon／authenticated 執行權；`town_rec_eh` 只接受已驗證 Email。**在 Supabase，`revoke ... from public` 擋不住 anon／authenticated，要寫 `from public, anon, authenticated`**。`fb_guard`、`lives_guard` 屬於另外兩個遊戲的 repo，補強要寫在那邊。

## 加一個新設施的清單（全都要改）
0. **使用者規則（2026-11-23）：之後所有新設施（有建築門的）一律要有「內部畫面」與「室內互動」**：`ROOMS[地點]` 場景（12×5 格、裝潢要有該設施的特色物件與氣氛、白天夜晚配色）、`town_fi.sql` 白名單、`town_need_in` 進館檢查涵蓋、互動物件對應面板按鈕（點物件＝按按鈕）與動畫、店員或常客 NPC、進出門流程、`tools/visual` 室內情境與基準圖。公園、廣場等戶外開放區例外。賭場（`casino`）補室內是目前唯一缺的（見「小豬賭場」）。
1. `town.js`：`PLACES`（座標 r、door、block:1）、`HOURS`、`FEATS`（讓鎮長能開關）、面板按鈕、`buildMap` 的 `bld(...)` 與 `sign(...)`、`ACT_FX`。
2. `town.sql`：`town_place_name`、`town_closed`（已取消營業時間，保留函式）、`town_feature`（對應開關）、`town_act` 的 move 白名單與位置上限（`px >`）、動作本身（冷卻存在 `items.cd`）、`town_features` 的白名單。
3. `COLS` 不夠就加大（目前 71），server 的 `px >` 要同步（目前 71）；`layout3` 遷移是把站在新建築上的人移到廣場，再加大地圖要照樣加一個遷移。
4. 前後端的價格、冷卻要一致。

## 建議下一步（CTA）統計
`town_cta` 表記錄「建議下一步」的顯示與點擊（`town_track`），鎮長面板用 `town_mayor(act='stats')` 看近 7 天各建議的顯示／點擊／點擊率。前端在 `renderPanel` 顯示時記 show、在按鈕點擊時記 click。

## 小豬鎮路線圖（使用者已確認，一項一項做，不要同時改同一批檔案）
1. ✅ 已完成：個性特質＋心情（見下方「個性特質與心情」）
2. ✅ 已完成：房子升級＋室內家具＋自由擺放（見下方「房子與室內」）
3. 賺錢方式（咖啡廳／餐廳／健身房打工、每日任務板、擺攤賣東西、存款利息）
4. 寵物（寵物店領養、餵食玩耍、離線也會餓、跟在主人旁邊）
5. 購物（食品／服飾／家具／寵物店、每日特價、背包分類）
6. 城市架構（鎮基金抽 5%、鎮長花基金蓋設施、小鎮等級、公告欄；**任何居民都能發起投票事件**，例如「要不要蓋格鬥場？」，24 小時結束，結果寫進動態；鎮長可否決的規則另訂）
每一項都要處理舊角色：不重置、缺欄位用預設、必要時第一次上線彈一次選單。

## 下週待辦（使用者列的，尚未開始；細節還要和使用者確認）
1. ✅ 已完成：睡眠比例、快速睡覺、待機回家睡（見「睡眠與進屋」）
2. 21 點加花色（牌面顯示 ♠♥♦♣；`town_card` 目前只回點數）
3. 多加幾個賭場遊戲與單機遊戲（期望值要略負，規則見「金錢平衡」）
4. 扁人與和好的平衡（扁人好感 −6、和好 +8、冷卻不同，要重新對齊）
5. ✅ 已完成：站在路上的壞事、進屋／出門（見「睡眠與進屋」）
6. ✅ 已完成（見「其他工作與拉菲的辦公室」）：工作多種類型、新增「拉菲的辦公室」
7. 交通工具、交通規則、事故、道路（體量大，拆三階段；第 1 階段道路與交通工具已寫好，見「交通」，三階段 SQL 都已套用到正式站，2026-11-16 唯讀查 `pg_proc` 確認函式存在）
建議順序：1＋4（小調整）→ 2＋3（遊戲）→ 5＋6（世界與工作）→ 7（交通，拆開做）。

## 2026-11-18 沒收汽車（**已取消，從未執行**）
- 鎮長（使用者）2026-11-23 決定「不沒收車子」：`town_confiscate_car_1118.sql`（以及更早含扣錢的 `town_confiscate_1118.sql`）都已刪除、從未在正式站執行（2026-11-23 唯讀確認居民 26 仍有汽車、機車、腳踏車）。補發 `town_grant_3150_1118.sql`（居民 26 現金 +3150，標記 `grant_3150_1118`）是否已執行，以使用者回報為準。


## 備份、壓測、錯誤紀錄（2026-11-24）
- **備份**（Free 方案無內建備份）：`tools/backup/`（`backup.sh` pg_dump→加密→保留 14 份、`verify-backup.sh`、`restore-drill.md`、launchd plist 範例、`tables.txt`）。連線字串／密語放使用者 `~/.config/town-backup.env`，**不進 repo**；`node tools/backup/verify-tables.mjs` 比對 `supabase/*.sql` 的新表（`node town/test.js` 會跑）。新增表要加進 `tables.txt`。
- **壓測**：`supabase/town_stress_test.sql`（108 人回滾實測，貼 SQL Editor）、`node tools/stress/stress.mjs`（負載模型）；`town_state` 瘦身設計見 `docs/town-state-slimming.md`（尚未改）。每鎮上限 12 人。
- **錯誤紀錄**：`supabase/town_errlog.sql`（表、限速每 ua 每分鐘 3 筆、截 300 字、遮 Email／網址參數、2% 機率清 7 天前；`town_errlog_view` 鎮長用）；前端 `ERR`（town.js，不走 `rpc()`）、鎮長面板「錯誤紀錄」。實測 `town_errlog_test.sql`。


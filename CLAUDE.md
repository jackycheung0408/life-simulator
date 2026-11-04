# 生活模擬器 repo

GitHub Pages：https://jackycheung0408.github.io/life-simulator/　Supabase 專案：`gerqdagicybtyilihvvm`
使用者用繁體中文溝通，偏好簡短、手機優先、復古 Capcom 像素風、不要 emoji（用 `town/icons.js` 的像素圖示）。

## 小豬鎮（`town/`）：多人類模擬市民小鎮
- 前端：`town/index.html`（CSS 全在裡面）、`town/town.js`（地圖、面板、小遊戲）、`town/icons.js`（12×12 像素圖示，emoji → 圖示名對照）。
- 後端：`supabase/town.sql`，全部邏輯在 plpgsql security definer 函式（`town_state/create/join/login/device/find/act/mayor/features/game/duel/push_sub`）。資料表全開 RLS、不給直接權限。這個檔可重複執行。
- 推播：`supabase/functions/town-push`（Verify JWT 要保持關閉）＋ `supabase/town_push.sql`。
- 登入：免密碼，每台裝置一把金鑰（只存雜湊在 `town_devices`），新裝置用邀請碼。

## 加一個新設施的清單（全都要改）
1. `town.js`：`PLACES`（座標 r、door、block:1）、`HOURS`、`FEATS`（讓鎮長能開關）、面板按鈕、`buildMap` 的 `bld(...)` 與 `sign(...)`、`ACT_FX`。
2. `town.sql`：`town_place_name`、`town_closed`（營業時間，台灣時間）、`town_feature`（對應開關）、`town_act` 的 move 白名單與位置上限（`px >`）、動作本身（冷卻存在 `items.cd`）、`town_features` 的白名單。
3. `COLS` 不夠就加大（目前 52），server 的 `px >` 要同步。
4. 前後端的營業時間、價格、冷卻要一致。

## 測試與部署（重要）
- 前端路線測試：`node town/test.js`（所有房子數量下每個設施走得到）。
- 改了 `town.js` 或 `icons.js`：到 `town/index.html` 把 `?v=` 加 1（快取）。
- 推上去前先 `git pull --rebase`：另一個 session 也在改這個資料夾（足球）。pre-push 會跑足球測試，偶爾不穩，重跑即可。
- SQL 不會自動套用：到 Supabase SQL Editor，抓 `raw.githubusercontent.com/jackycheung0408/life-simulator/<commit>/supabase/town.sql`，用 `monaco.editor.getModels()[0].setValue(...)` 貼上，按 ⌘↵，確認「Potential issue」對話框後執行。
- 資料庫實測：在同一段 SQL 後面接一個 `do $$ ... $$` 區塊（建測試鎮、呼叫 `town_act`、把結果寫進 `zz_town_test`、最後 `delete from town_towns`），看完結果就 `drop table zz_town_test`。plpgsql 變數不要和欄位／參數同名。
- **改 SQL 要特別小心**：一個語法錯就讓正式站所有人動不了（出過一次）。有 `= any(...)` 這類寫法先用小函式包起來測。
- 畫面測試：`tools/town-mock.js` 是假資料庫。複製 `town/` 到暫存資料夾，在 `index.html` 的 `town.js` 前面加 `<script src="mock.js">`，用 `python3 -m http.server` 開，網址 `?t=MOCK01`。不要在正式站建帳號或填密碼。

## 版面與字型
- 像素字型 Cubic 11 只在 11／16.5／22px 清楚，別用其他字級；字距保持 0。
- 手機（≤700px）分四塊：狀態列（`#needs`）、工具列（`#strip` + `.tools`）、地圖（`#stage`）、底部抽屜（`#panel`，有收起鈕）。
- 數值欄只在內容有變時重畫（`lastNeeds`），不要讓它閃。

## 遊戲平衡（目前數值）
每小時：睡覺精力 +20；清醒飽足 −4、精力 −3、膀胱 −5、清潔 −2.5、心情 −2。凌晨 0～7 點離線視為睡覺並移回家。打工 +€100（2 小時冷卻）。商店價格已 ×2.5。
營業時間（台灣）：公司 9–19、餐廳 11–22、超市 8–23、烤地瓜 16–24、咖啡廳 7–21、電影院 12–24、健身房 6–23、格鬥場 10–24；屠宰場全天。

## 省 token 建議
一個大功能一個對話；先讀這份檔再動手；改字／調數值可用較小的模型；少截圖，優先用 `node town/test.js` 與 SQL 實測。

# 小豬鎮與入口導覽頁（life-simulator）

純靜態網站，推到 main 就由 GitHub Pages 部署：https://jackycheung0408.github.io/life-simulator/（根目錄是三個遊戲的入口導覽頁 `index.html`／`hub/index.html`，小豬鎮在 `town/`，`football/` 只剩轉址頁）

> 這個遊戲和另外兩個已拆成各自的 GitHub repo（2026-11 拆分；原本同在 `jackycheung0408/life-simulator`）：
> - 小豬鎮（含入口導覽頁）：`jackycheung0408/life-simulator`，網址 `https://jackycheung0408.github.io/life-simulator/town/`（網址不變，玩家從主畫面開 web app）
> - 足球員模擬器：`jackycheung0408/football-life`，網址 `https://jackycheung0408.github.io/football-life/`
> - 人生模擬器：`jackycheung0408/life-sim`，網址 `https://jackycheung0408.github.io/life-sim/`
> 三個遊戲共用同一個 Supabase 專案 `gerqdagicybtyilihvvm`（各 repo 的 `supabase/` 只放自己那一份 SQL，見 `docs/supabase-shared.md`）和同一個網站網域（`jackycheung0408.github.io`，所以瀏覽器的 localStorage 存檔跨 repo 仍共用；各遊戲的鍵都有前綴 `life-`／`fb-`／`town-`，不要改名）。

## 規則
- 全遊戲（含入口導覽頁）維持像素風：Cubic 11（11／16.5／22px）、不用圓角（`clip-path` 4px 階梯）、不用模糊陰影與漸層，詳見「像素風規則」
- 改了 `town/` 的 js／css 後一律跑 `node tools/town-bump.mjs`（連 `version.json` 一起，見「自動更新」）
- 改 CSS 後確認大括號有配對（曾因多一個 `.ctrl{` 讓後面所有樣式失效）
- 互動一律用按鈕，不要用超連結
- 要擬真，不要偏袒玩家
- 回覆用繁體中文，簡短
- **套用正式站 SQL 與跑回滾實測一律用 `tools/sql/sql.py`（見「SQL 套用工具」），Claude 不再開瀏覽器 SQL Editor（省額度）**
- 需要使用者核准的步驟（套用正式站 SQL、對正式站資料庫寫入、建立或刪除 repo、推送別的 repo）一律用 AskUserQuestion 給按鈕（「可以，執行」「先不要」），不要要他打字；按鈕要由使用者本人點
- 改了檔案分工、部署流程或規則，就順手更新這份 CLAUDE.md（使用者不想手動維護）
- Supabase 專案 gerqdagicybtyilihvvm（三個遊戲共用）；SQL 放在 `supabase/`

## 自動更新（小豬鎮；玩家多半從主畫面開 web app，沒辦法重新整理）
- **改了 `town/` 的 js／css 後，不要手動改 `?v=`，一律跑 `node tools/town-bump.mjs`**：它把 `town/index.html` 裡 `town.js?v=N` 加 1，並把 `town/version.json` 寫成 `{"v":N}`（`--icons` 同時加 `icons.js` 的 `?v=`）。`node town/test.js` 會檢查 `version.json` 與 `?v` 一致。
- 前端（`town.js` 的 `MYV`／`checkVer`／`updShow`）：啟動、回到前景、每 5 分鐘 `fetch("version.json?t=…",{cache:"no-store"})`，比自己載入的 `town.js?v=` 新就在畫面上方顯示「小鎮有新版本［更新］［✕］」（`#upd`）；**按了才 `location.reload()`**，走路或開 modal 時延後顯示，不會強制重整。
- `town/sw.js`：`version.json` 不快取、首頁（navigate／index.html）用 `cache:"no-store"` 問伺服器；改了 `sw.js` 要把快取名 `C` 加版號。
- `tools/town-mock.js` 的 `fetch` 只攔 `/rpc/`，其他網址（如 `version.json`）照常載入；測更新提示時把暫存資料夾的 `version.json` 改大。

## 更新通知（每次改版必做）
- **每次改版（玩家看得到的改動）都要在 `town/town.js` 的 `UPDATES` 最前面加一則**：`{id, date, title, items:[1～3 條]}`，id 不可重複，繁體中文。**要簡述（使用者有 ADHD，要一眼讀完）：標題 ≤ 10 字、每條 ≤ 18 字，只講玩家看得到、能用的差別；不寫原因、技術名詞、數值細節、更新後怎麼做；相近的改動合成一則**（11/17 起；舊條目 3～6 條不動）。`node town/test.js` 會檢查。
- 玩家上線時彈「小鎮更新了」：已看過的 id 存在瀏覽器 localStorage（`town_ups_<角色id>`），沒有紀錄的舊玩家只彈最新一則，之後最多一次彈 3 則；選單「更新紀錄」可看全部。不需要 SQL。

## SQL 套用工具（`tools/sql/`，2026-11-18；使用者自己在終端機執行，不花 Claude 額度）
- **規則**：套用正式站 SQL、跑回滾實測、查正式站狀態，一律用 `python3 tools/sql/sql.py`。Claude 只負責寫檔、跑 `check`／離線測試，然後在回報裡列出「要貼給使用者在終端機執行的一行指令」（例：`python3 tools/sql/sql.py apply town_xxx.sql --test town_xxx_test.sql --prod`），使用者核准後自己執行並把 REPORT 貼回；Claude 沒有也不可要金鑰。瀏覽器 SQL Editor 只作備案（使用者沒設定金鑰時）。AskUserQuestion 核准規則不變。
- **2026-11-23 起：使用者在對話按 AskUserQuestion 核准按鈕後，Claude 用終端機分頁（`run_in_terminal`）執行 `python3 tools/sql/sql.py apply <檔…> --prod --yes`，`--yes` 只略過 APPLY 輸入；含 drop／delete／update 的檔仍要使用者手動輸入 DESTRUCTIVE；沒有核准按鈕就不加 `--yes`。** Claude 的 shell 沒有 `SUPABASE_ACCESS_TOKEN`，一律開終端機分頁（使用者環境）跑，再用 `read_terminal` 看結果。
- 指令：`plan`（標準順序與每檔做什麼）、`check <檔>`（離線靜態檢查：檔頭註解、`$$` 成對、if…case 括號、變數 x／y／k、grant 簽名、manifest）、`apply <檔…> [--test <實測檔>] [--prod]`（預設 dry-run；`--prod` 要在終端機輸入 `APPLY`，含 drop／delete／update 再輸入 `DESTRUCTIVE`；不接受管線；拒絕不在 manifest 或已被取代的檔；結果寫 `tools/sql/logs/`，REPORT 含 ❌／失敗／FAIL 則 exit 1）、`query "select…"`（唯讀）、`drift`（用 `pg_get_functiondef` 比對正式站與 repo 最終版本，列不一致與 overload，例如 4 與 6 參數 `town_device`）、`setup`（一次性設定金鑰）。
- `tools/sql/manifest.json` 是標準套用順序（後面蓋前面）；`kind` = base／patch／once／test，`needs` 前置，`superseded`（整檔作廢）或 `superseded_funcs`＋`superseded_by`（只有某些函式被取代：`town_authfix.sql` 的 `town_device` 被 `town_account.sql` 取代，所以 authfix 必須和 account 一起套用且 account 排後面）。**新增或改名 `supabase/*.sql` 要同步 manifest**（`node town/test.js` 會擋）；離線測試 `python3 tools/sql/test_sql.py`（假 API 伺服器，不連正式站）。
- 後端：`SUPABASE_ACCESS_TOKEN`（Management API `POST /v1/projects/<ref>/database/query`）；備案 `DATABASE_URL`＋自行 `pip install pg8000`（未實測）。API 的 SQL 錯誤本文格式官方沒寫，工具以 `{"message":…}` 或純文字解析，第一次真的跑時若 REPORT 沒印出要回報。

## 測試與部署（重要）
- 前端路線測試：`node town/test.js`（所有房子數量下每個設施走得到）。
- 改了 `town.js` 或 `icons.js`：跑 `node tools/town-bump.mjs`（`?v=` 加 1 並同步 `version.json`，icons 有改加 `--icons`）。
- 推上去前先 `git pull --rebase`（可能有別的 session 也在改這個資料夾）。pre-push（`.githooks/pre-push`，`git config core.hooksPath .githooks` 啟用）會跑 `node town/test.js`。
- SQL 不會自動套用：到 Supabase SQL Editor，抓 `raw.githubusercontent.com/jackycheung0408/life-simulator/<commit>/supabase/town.sql`，用 `monaco.editor.getModels()[0].setValue(...)` 貼上，按 ⌘↵，確認「Potential issue」對話框後執行。
- 資料庫實測：在同一段 SQL 後面接一個 `do $$ ... $$` 區塊（建測試鎮、呼叫 `town_act`、把結果寫進 `zz_town_test`、最後 `delete from town_towns`），看完結果就 `drop table zz_town_test`。plpgsql 變數不要和欄位／參數同名。
- **改 SQL 要特別小心**：一個語法錯就讓正式站所有人動不了（出過一次）。有 `= any(...)` 這類寫法先用小函式包起來測。
- 畫面測試：`tools/town-mock.js` 是假資料庫。複製 `town/` 到暫存資料夾，在 `index.html` 內嵌腳本的 `add("icons.js?v=…")` 前面加 `add("mock.js?v=N")`（首頁腳本是動態載入的，見「首頁與登入畫面」），用 `python3 -m http.server` 開，網址 `?t=MOCK01`。不要在正式站建帳號或填密碼。**2026-11-17 補充：首頁內嵌腳本會先用真的 `fetch` 預取 `town_state`，所以 mock 要放在複本 `index.html` 的 `<head>` 最前面當阻塞腳本（`<script src="mock.js?v=N"></script>`），只放在 `add("icons.js")` 前面會來不及接手、顯示「找不到這個小鎮」；進去後選角色、邀請碼填 `ABC123`。**

## 自動畫面測試（`tools/visual/`，2026-11-17）
- **改版面（town.js／index.html 的 CSS、面板、HUD）後必跑**：`cd tools/visual && npm run visual`（首次要 `npm install && npx playwright install chromium`，約 10MB＋150MB，只裝在該資料夾；`node_modules`／`out` 已 gitignore）。pre-push 仍只跑 `node town/test.js`（畫面測試較慢，不強制）。
- 做法：把 `town/` 複本＋`tools/town-mock.js` 注入 `<head>` 最前面，6 種尺寸（390x844、375x667、430x932、768x1024、1366x768、1920x1080）× 13 種畫面（街上、設施門口、咖啡廳裡、家裡、朋友家門口、朋友面板、打工動畫、動態／選單／更新紀錄／21 點彈窗、睡覺、入獄；情境改 mock 的 sessionStorage 後重載）。
- 檢查：橫向溢出、按鈕出視窗、手機按鈕 ≥44px、導覽列五顆等寬、訊息不壓 HUD、舞台占比、底部空白、字型 Cubic 11、字級 11／16.5／22、圓角、模糊陰影、漸層、`…` 截字、console／pageerror，並用 pixelmatch 對 `tools/visual/baseline/`（差異 >1.5% 才報）。截圖在 `out/<日期>/`。
- 旗標：`--update` 更新基準（版面改好、確認截圖沒問題後才更新並 commit）、`--only 情境`、`--size 390x844`、`--head`（用 git HEAD 的 town/ 而非工作目錄）。2026-11-23 清理後 192 情境失敗 83→0（含基準圖已更新）：被截字改短標籤（常用列 >5 字用 11px `b.sm`、說明列 ≤ 約 25 字，聊天／應徵（未達標）／看今日片只留名稱）、`#acts .ai` 16.5px；截字檢查現在列出元素與寬度。**之後每輪只用 `--only 情境 --size 尺寸` 重跑失敗項，收尾才跑一次完整。** 已知限制：沒模擬 iOS safe-area（桌面 Chromium 的 `env()` 為 0）；21 點情境找不到按鈕時略過。

## 省 token 建議
一個大功能一個對話；先讀這份檔再動手；改字／調數值可用較小的模型；少截圖，優先用 `node town/test.js` 與 SQL 實測。

## 改檔習慣
- 中文 Python heredoc 容易出現編碼錯誤：先寫成 .py 檔，再用 `exec(compile(open(f,encoding="utf-8").read(),"p","exec"))` 執行
- 小改動不用開瀏覽器驗證；邏輯改動才在推上去之後檢查線上版



## 其他主題（細節搬到 `docs/`，開工前依主題讀；原文未改）
- 小豬鎮後端／登入鎖定／留存／資安、加設施清單、路線圖、備份壓測 → docs/town-core.md
- 地圖排版、自由走動、路徑、路邊物件、點擊即互動、擴地圖與設施搬遷 → docs/map-walk.md
- 首頁、登入、密碼、鎖定、備份、帳號救援 → docs/home-login.md
- 版面、PC 版、底部列、像素風、音樂音效、按鈕效果表與分類 → docs/ui-layout.md
- 設施室內、進館、公共建設、房子家具、購買設施、莊園 → docs/facilities.md
- NPC、事件池、商品目錄、場館升級 → docs/npc-shops.md
- 監獄、砍人、前科、越獄 → docs/jail.md
- 鎮長管理權與市政廳投票 → docs/mayor-civic.md
- 好感、PK、惡趣味、人設、隨機事件、能力屬性、睡眠、揪團 → docs/social.md
- 貨幣、股市、金錢平衡、稅與基金、宏觀調控、莊園出口、全站平衡批 → docs/economy.md
- 賭場、街機 → docs/casino.md
- 交通、駕照、罰單、事故保險 → docs/traffic.md
- 等級、職階、個性、背包、成就、賽季、主線、新手引導 → docs/progression.md
- 三遊戲共用 Supabase → docs/supabase-shared.md；state 瘦身設計 → docs/town-state-slimming.md
- 商業化計畫（訂閱、免費版範圍、成功標準、不做清單）→ docs/monetization.md

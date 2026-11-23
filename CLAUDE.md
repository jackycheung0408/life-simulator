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

## 小豬鎮（`town/`）：多人類模擬市民小鎮
- 前端：`town/index.html`（CSS 全在裡面）、`town/town.js`（地圖、面板、小遊戲）、`town/icons.js`（12×12 像素圖示，emoji → 圖示名對照）。
- 後端：`supabase/town.sql`，全部邏輯在 plpgsql security definer 函式（`town_state/create/join/login/device/find/act/mayor/features/game/duel/push_sub`）。資料表全開 RLS、不給直接權限。這個檔可重複執行。
- 推播：`supabase/functions/town-push`（Verify JWT 要保持關閉）＋ `supabase/town_push.sql`。function 內的消耗速率、離線保護要和 `town_tick` 同步；改了要重新部署：`supabase functions deploy town-push --project-ref gerqdagicybtyilihvvm --no-verify-jwt`（需要 CLI 登入；自動模式會擋，要使用者自己跑）。
- 登入：免密碼，每台裝置一把金鑰（只存雜湊在 `town_devices`），新裝置用邀請碼。
- 登入鎖定（`town_auth`，2026-11-22 修正）：只有舊 4 碼 pin 算暴力猜測，錯 5 次鎖 10 分鐘，之後每多 5 次失敗鎖定時間加倍（上限 24 小時）；**鎖定中連正確的 4 碼 pin 也不放行**（以前正確的會通過，等於鎖定擋不住暴力猜測）；長隨機裝置金鑰不受鎖定影響，登入成功會清零。實測 `supabase/town_authfix_test.sql`。
- 留存機制（`supabase/town_retention.sql`，2026-11-22；實測 `town_retention_test.sql`）：連續上線日曆（第 3／7／14／21／30／60／100 天給零食、限定造型、稱號；每週一次保護盾）、新人保護（登入未滿 7 天的居民每天被同一人打架／丟蛋／惡作劇最多 2 次、全部人最多 4 次，超過整個動作回滾，由 `town_events` 上的觸發器 `town_newcomer_guard` 擋）、每日收成（信箱＝零食、花圃＝€150、小豬雕像＝€500，隔天沒上線補領最多 3 天份）、午間市集 12～14 點與夜市 21～23 點打工薪水 +10%（`town_wd_pct`，開張時 `town_happy_touch` 公告一次）、登入隨機事件好壞各半。**獎勵與公告走小鎮動態；午間市集／夜市的 +10% 在畫面上方的事件橫幅（`#wev`，`happyAt`）顯示，和全鎮事件可同時出現（前端 `happyAt` 的時段要和 SQL `town_wd_pct` 一致）；打工薪水的數字本身（`payOf`）和全鎮事件一樣不含倍率，沒有另外加註。** 推播新增「連續上線快斷了」「市集開張」（`town_push_log` 每人每天每種一次）。
- 小鎮人氣禮（邀請朋友獎勵，`town_retention.sql` 的 `town_pop_touch`，2026-11-22）：活躍居民（登入滿 3 天）累積到 3／4／6／8／12 位，小鎮動態公告，全鎮每位居民下次登入領禮（零食、€3000、限定造型「小豬耳朵」「洋裝」、稱號、€20000；已有的造型改領零食）。`town_towns.pop` 記已達成的最高門檻，`items.al.pm` 記個人領過的門檻（`town_al_touch` 重建 al 時要保留 `pm`，否則每天重領）。前端沒有畫面，走小鎮動態。
- 資安補強（`supabase/town_hardening_1122.sql`）：`town_pw_ok/bad/blocked`、`town_push_notify` 收掉 anon／authenticated 執行權；`town_rec_eh` 只接受已驗證 Email。**在 Supabase，`revoke ... from public` 擋不住 anon／authenticated，要寫 `from public, anon, authenticated`**。`fb_guard`、`lives_guard` 屬於另外兩個遊戲的 repo，補強要寫在那邊。

## 自動更新（小豬鎮；玩家多半從主畫面開 web app，沒辦法重新整理）
- **改了 `town/` 的 js／css 後，不要手動改 `?v=`，一律跑 `node tools/town-bump.mjs`**：它把 `town/index.html` 裡 `town.js?v=N` 加 1，並把 `town/version.json` 寫成 `{"v":N}`（`--icons` 同時加 `icons.js` 的 `?v=`）。`node town/test.js` 會檢查 `version.json` 與 `?v` 一致。
- 前端（`town.js` 的 `MYV`／`checkVer`／`updShow`）：啟動、回到前景、每 5 分鐘 `fetch("version.json?t=…",{cache:"no-store"})`，比自己載入的 `town.js?v=` 新就在畫面上方顯示「小鎮有新版本［更新］［✕］」（`#upd`）；**按了才 `location.reload()`**，走路或開 modal 時延後顯示，不會強制重整。
- `town/sw.js`：`version.json` 不快取、首頁（navigate／index.html）用 `cache:"no-store"` 問伺服器；改了 `sw.js` 要把快取名 `C` 加版號。
- `tools/town-mock.js` 的 `fetch` 只攔 `/rpc/`，其他網址（如 `version.json`）照常載入；測更新提示時把暫存資料夾的 `version.json` 改大。

## 預計路徑（小豬鎮前端，`frame()` 裡「預計路徑」區塊）
- 自己開始走（點地圖、設施、朋友）時，從腳下沿 `walkers[me].path` 每 0.5 格畫一個黃白交錯的小方塊（深色外框），終點是閃動的黃框；走過的 `path` 被 shift 掉，所以自然消失。別人的路徑不畫；畫在人物之下，不遮住角色。`bfs` 找不到路時 toast「走不到那裡，路被擋住了」。

## 自由走動（小豬鎮前端，`town.js` 的 `freePath`／`los`／`route`）
- **行人可以在地圖上任意走**：8 方向 A*（不切建築的角）→ 用 `los`（直線每 0.2 格取樣，左右各留 0.34 格身體寬）拉直成幾個轉折點，所以會斜斜穿過草地、公園、馬路，只繞開建築、房子、噴水池與地圖邊界（`blocked`）。路徑點是連續座標也沒問題（走路迴圈本來就朝下一個點直線前進）。`route(from,to,veh)`：有交通工具走原本的格子 `bfs`（路上成本 1、路外 2），沒有就走 `freePath`；點到建築仍然走到門口。
- **不再強制人行道與斑馬線**（`stepCost` 的行人成本只剩 `bfs` 備用）：行人不看紅綠燈、穿越馬路沒有風險判定（沒有行人事故；`isCross`／`CWX` 只剩畫斑馬線與交通工具「沒禮讓行人」判定用）。紅綠燈、速限、違規、事故仍只對騎車開車的人。
- **伺服器完全不用改**：`move` 用起點到終點的直線算踩便便（`town_seg_d`）、油錢依曼哈頓距離、違規用「先橫再直」估算，都不依賴實際路徑；位置只檢查 `px`／`py` 範圍。
- 測試：`node town/test.js` 檢查每個設施與房子的門行人自由走得到、隨機 300 組空格任兩點可達（三種房子排數）、路線不穿建築、起終點正確、不比規則路線長、廣場到公園是幾條直線、交通工具仍走格子。

## 更新通知（每次改版必做）
- **每次改版（玩家看得到的改動）都要在 `town/town.js` 的 `UPDATES` 最前面加一則**：`{id, date, title, items:[1～3 條]}`，id 不可重複，繁體中文。**要簡述（使用者有 ADHD，要一眼讀完）：標題 ≤ 10 字、每條 ≤ 18 字，只講玩家看得到、能用的差別；不寫原因、技術名詞、數值細節、更新後怎麼做；相近的改動合成一則**（11/17 起；舊條目 3～6 條不動）。`node town/test.js` 會檢查。
- 玩家上線時彈「小鎮更新了」：已看過的 id 存在瀏覽器 localStorage（`town_ups_<角色id>`），沒有紀錄的舊玩家只彈最新一則，之後最多一次彈 3 則；選單「更新紀錄」可看全部。不需要 SQL。

## 首頁與登入畫面（進入小鎮前；目標：回訪玩家 ≤ 0.2 秒可點）
- **首頁由 `town/index.html` 底部的內嵌腳本 `LP` 先畫，不等 `town.js`／`icons.js`／任何網路**：`LP.top(list)`（像素街景 SVG、住過的小鎮卡片、加入／建立入口）、`LP.scene(1)`（登入步驟用的矮版街景）、`LP.stepBar(n)`（1 邀請碼、2 選角色、3 進入）。`town.js` 與 `icons.js` 由 `LP` 在首頁畫好後 40ms 才動態載入（`?t=` 小鎮頁則立刻載入）；回訪玩家的卡片按下去直接 `location.search="?t=…"`（不用等 town.js）；按「加入／建立」時如果 town.js 還沒好，`LP.want` 記下要開哪個表單，載入後 `landing()` 會自動打開。`town.js` 的 `landing()` 用同一個 `LP.top()` 重畫，畫面不會跳動。主畫面（standalone）只住一個小鎮時，內嵌腳本直接 `location.replace` 進去，連首頁都不畫。
- **`town.js` 是晚載入的**：`init()` 一定要放在整支檔案**最後**才呼叫，而且要先檢查 `document.readyState`（不是 `loading` 就直接跑；曾因放在中間，`CUR` 還沒宣告就丟 "Cannot access 'CUR' before initialization"）；`init()` 裡不能在 `let CUR` 之前呼叫 `pxify`（已改成 `setTimeout`）。`node town/test.js` 會檢查。
- 快取：`sw.js` 對帶 `?v=` 的 js 用**快取優先**（網址每次改版都換，安全），首頁與 `version.json` 仍 `no-store`（自動更新要靠它）；`Cubic_11.woff2` 用 `preconnect`＋`preload`、`font-display:swap`（字型沒到先用系統字，不擋畫面）；載入畫面 `.ld` 延遲 0.2 秒才出現（`animation-delay`），回訪玩家看不到它。
- **量測方法**：`LP.t`（`performance.now()`，首頁可點的時間）；模擬網路用 `python3 tools/town-slow.py <town 資料夾的複本> <埠>`（延遲 150ms、約 1.6Mbps、gzip，等於 Fast 4G，`Cache-Control: no-store`＝冷啟動），瀏覽器開 `http://localhost:<埠>/index.html`，在 console 讀 `LP.t` 與 `performance.getEntriesByType("navigation")[0].responseEnd`。2026-11-10 量到（冷啟動，Fast 4G，其中 150ms 是模擬的延遲）：**舊版 911ms 才能點、新版 207ms**（HTML 206ms 到、遊戲程式在背景約 938ms 載完，不擋首頁）。`node town/test.js` 會擋：`index.html` 不能有阻塞的 `<script src>`、`LP.top`／`LP.t` 要在、`?v=` 各只能出現一次、HTML ≤ 45KB（目前約 38KB／gzip 11KB）、`.ld` 要延遲。改首頁不要再讓 `index.html` 變肥，大東西放進 `town.js`。
- **啟動畫面質感（2026-11-16）**：`LP.top` 的 hero 有像素豬 Logo（`PIG`）＋22px 粉紅大標題、圓角 16px＋立體陰影的卡片、粉紅漸層主按鈕（≥64px，按下去下沉）、CSS 淡入上移進場（`lpup`，不阻塞點擊，reduced-motion 關閉）、`#lg` 安全區 padding、底部 `.lpfoot`。實測 `LP.t` 224ms／HTML 到達 220ms（腳本本身只多約 4ms，HTML 39.6KB）。
- **進小鎮（`?t=`）預取（2026-11-16）**：內嵌腳本在載入 town.js 的同時就先 `fetch` `town_state` 與（住過時）`town_login`，放在 `LP.pre[fn]={b,t,f}`；`town.js` 的 `rpcF` 遇到相同 body、20 秒內、沒用過的預取就直接取用（只用一次），省掉「等 town.js 載完才開始發 RPC」與串行等待；`enter()` 若 3 秒內剛 `refresh` 過就不再重打 `town_state`（`refAt`）。
- **載入畫面（`?t=` 進小鎮，2026-11-23）**：`index.html` 內嵌腳本畫 `.ld`：像素豬、四格進度條（`LP.stage(n)`：1 載入程式、2 連線小鎮 `refresh`、3 讀取角色 `town_login`、4 進入 `enter`；`LP.stage(0)` 清掉計時器，`town.js` 在進遊戲或進登入頁時呼叫）、輪播小提示（3 秒）、6 秒後「網路比較慢」＋「再試一次」（`location.reload()`）。`index.html` 只剩幾位元組空間（≤45000）。量測／截圖：`cd tools/visual && node loading.mjs [git版本] [--slow]`（town.js 延遲 800ms、RPC 延遲 700ms；`--slow` RPC 7 秒看重試鈕；截圖在 `out/<日期>/loading-*.png`）。2026-11-23 實測進遊戲時間新版 907／997ms、舊版（af83552）894／899ms（差異在雜訊內，被模擬的 800ms town.js 延遲主導）。
- 住過的小鎮存在 `localStorage["town-mine"]`：`{tid,name,rid,pin,me,at}`（`at` = 最後上線時間，登入時與每 15 秒同步時更新，首頁卡片顯示「N 小時前上線」；舊資料沒有 `at` 就不顯示）。
- 登入流程三步：**1 邀請碼**（首頁「加入朋友的小鎮」→ 輸入邀請碼 →「下一步：選角色」，`town_find` 找小鎮）→ **2 選角色**（`townLogin`：我住在這裡的角色卡；或「用邀請碼搬進來」`joinStep` 選名字、空屋、造型）→ **3 進入**（`pinStep`：新裝置輸入一次邀請碼，之後這台裝置有金鑰就一鍵進入）。每一步上方有步驟條與矮版街景，輸入框用大字（`.lpcode`）。免密碼機制（每台裝置一把金鑰、邀請碼）沒動。
- 住過的小鎮：第一顆粉紅主按鈕「回到 XX」一鍵進入，其餘小鎮為一般按鈕；沒住過才是「加入朋友的小鎮」粉紅、「建立新小鎮」次要。主按鈕永遠只有一個。介紹只留標題＋一句。首頁不用 emoji（內嵌腳本用像素 SVG 圖示，標題的 🐷 由 `pxify` 換成像素圖示）。
- 錯誤訊息要說下一步（邀請碼打錯、網路斷線、進不去小鎮有「再試一次」）；`rpc` 網路失敗統一回「連不上小鎮，檢查網路後再按一次」；載入超過 6 秒顯示「網路比較慢」。
- 第一次進遊戲：全新角色不彈「小鎮更新了」（直接標記已看）；新手提示 `tipsWhenFree` 等沒有彈窗才出現，順序 = 個性 → 願望 → 提示。
- 看手機畫面時，本機常有其他 session 佔著 8765 等 port，開 `python3 -m http.server` 前先用 `curl` 確認回的是自己的版本（`?v=`）。`tools/town-mock.js` 已加 `town_find` 假回應（邀請碼 `ABC123`、小鎮代碼 `MOCK01`）；因為 `index.html` 的腳本是動態載入的，測試時要把複本裡 `add("icons.js?v=…")` 前面加上 `add("mock.js?v=N")`，不能再用 `<script src="mock.js">` 放在 town.js 前面。

## 互動按鈕一律第一層（不藏子選單）
- **（2026-11-17 修正）所有動作仍在面板內一次點擊可達；「分頁籤」（照顧／這裡／社交／玩樂／工作／移動）不算子選單、不再多開 modal，切換只是換面板內顯示哪一組。** 建議下一步（`tip`）永遠置頂（`#tipbox`，最多 2 顆）。面板（`renderPanel`）裡能做的事每一件都是一顆按鈕，**不要再用「更多互動」「整蠱他」「休息／睡覺」這類收納式按鈕**；只有真的要選對象或確認（和誰？、要不要動手砍人、買東西）才開 `choiceModal`，modal 裡不再多一層「更多」。
- 設施的 `FAC` 動作由 `facBtns(r)` 直接列在面板（原本的 `facModal` 已刪）；家裡快速休息／快速睡覺／睡覺、朋友家的惡作劇／丟雞蛋都是獨立按鈕；同地點有幾個人在，就各有一顆「邀請 X 一起…」。
- **不能按的按鈕照樣顯示、灰掉並寫原因**：按鈕物件加 `dis:"原因"`（`dbtn(label,sub,fn,left)` 會把冷卻剩餘時間轉成「剛做過，N 分鐘後再來」；`cdLeft(r,key,mins)` 讀 `items.cd`）；點灰掉的按鈕只會跳 toast 說原因。新增互動要同步冷卻分鐘數（`FACCD` 要和 `town_fac.sql` 的 `cdm` 一致）。
- 分組標題（`GROUP`／`GORD` 排序）：建議下一步、照顧自己、在這裡、吃喝、玩樂、社交、工作與任務、房子、在他家、面對面、線上、移動。新增互動指定 `g`（`FACG` 對照）；打工類標籤開頭是「打工」「應徵」會自動歸「工作與任務」。同一面板按鈕多時靠面板捲動，不要藏起來。

## 各設施更多互動、每日任務板、常客、坐下逗留（SQL 已套用 2026-11-09，實測通過：`supabase/town_fac.sql`，要在 `town.sql`、`town_social.sql` 之後；實測 `supabase/town_fac_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- **不改 `town_act`**：單一 RPC `town_fac(rid,pin,act,item,target)`，前端 `town.js` 的 `FAC` 表（價格、說明、地點）與 SQL 要一致，`node town/test.js` 會比對價格與任務數量。設施面板直接列出（`facBtns`，見「互動按鈕一律第一層」）；選單「每日任務」→ `taskModal`。
- 動作：餐廳 `special` 特餐 €200（飽足 +40、心情 +12、每天依日期換菜名）、`takeout` 打包 €120（零食 +1）；咖啡廳 `latte` €110（精力 +45、集點 +1）、`redeem` 滿 8 點免費、`treat` 請客 €200（對方心情 +10、好感 +3）、`song` 點歌 €50（在場的人心情 +3）；電影院 `film` €280（每天換片 4 種輪替）、`popcorn` €80；健身房 `spar` 對練（雙方精力 −12、好感 +2）、`checkin` 簽到（連續 3 天 +€60、7 天 +€200）；公園 `fish` 釣魚（餌 €30、期望 25.5，略負）、`picnic` €150；公園／廣場 `frisbee` 丟飛盤、`photo` 自拍／合照。
- 資料（缺值 = 預設，舊角色免遷移）：`items.fq` 各地點互動次數（≥5 −10%、≥15 −15%，只折該地點的花費）、`items.cs` 集點卡、`items.gy` 簽到、`items.fa` 今天的互動統計與已領任務、`items.sit` 坐下開始時間、冷卻在 `items.cd['f_'||act||對方id]`。
- 雙人互動好感走 `town_bond`（吃每日上限）、一起加成走 `town_tg`（每人每天 8 次，與設施小事件共用）。
- **每日任務**：每人每天三個（從 8 個任務挑，`(角色id%8 + 台灣日序) % 8` 起算，間隔 3、5），各 €500，三個全領再 +€1000（2026-11-16 起 ×10；對經濟的影響：一天最多 €2500，約等於實習生打工 13 次，所以比「勤勞獎金」大很多）。新增任務要同步 SQL `town_fac_done` 與前端 `TASKS／taskDone`。
- **坐下逗留**（餐廳、咖啡廳、公園、廣場）：`sit` 開始、`up` 結算，每分鐘精力 +0.5、心情 +0.4，上限 20 分鐘，不到 3 分鐘或換了地點沒有獎勵，有人在場心情多 +2。

## 地圖排版（2026-11 重排，設施間距 ≥ 2 格；SQL 的 `layout2` 遷移）
- `COLS` = 71（原 57 → 64 放監獄 → 71 放醫院、警察局、市政廳）。建築 `[x,y,w,h]`（門）：上排 公司 `[27,0,7,6]`（30,6）、咖啡廳 `[36,0,6,5]`（38,5）、證交所 `[44,0,4,5]`（45,5）、格鬥場 `[50,0,7,6]`（53,6）、監獄 `[59,0,5,5]`（61,5）；中排 餐廳 `[2,9,6,5]`、廣場 `[12,8,10,7]`、超市 `[24,9,8,5]`、電影院 `[36,9,8,5]`（40,14）、車行 `[46,10,2,4]`、屠宰場 `[50,9,7,5]`（53,14）；下排 公園 `[27,17,9,5]`（31,19）、健身房 `[38,17,6,4]`（40,21）、拉菲 `[46,17,7,4]`（49,21）。房子位置不變（x=2、9、20）。**2026-11-10 新增**：醫院 `[59,9,5,5]`（61,14）、警察局 `[56,17,6,4]`（58,21）、市政廳 `[66,0,5,5]`（68,5）。斑馬線 `CWX=[4,11,15,18,22,29,38,45,53]`。路邊物件座標沒動。
- 新增或搬動建築時，相鄰建築（含房子）至少留 2 格空地；`town.sql` 的 `layout2` 遷移會把站在設施裡的人移到新門口、站在新建築上的人移到廣場，改座標要同步它與 `px >`。

## 監獄與砍人（角色不會死；SQL 已套用 2026-11-09，實測通過：`town.sql` 的 `town_jailed`／入獄檢查／jail 地點＋`supabase/town_jail.sql`，實測 `supabase/town_jail_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- 監獄 `place='jail'`，位置 `[59,0,5,5]` 門 `[61,5]`（地圖東邊加寬後的空地，離格鬥場 2 格；地圖本身已沒有空位，所以 `COLS` 加大到 64，`town.sql` move 的 `px >` 同步 64），`FEATS` 可關（關掉後被關的人不再被擋）。前端 `JAIL`／`jlLeft`／`jailed`／`bailCost`／`doJail`／`slashModal`，SQL 獨立 RPC `town_jail(rid,pin,act,item,target)`（不改 `town_act` 的動作，只在開頭加入獄檢查：入獄中除了 `wake` 全擋）。
- 資料：`items.jl` = 出獄時間（`town_jailed(r)` 判斷，刑滿由 `town_tick` 清掉並寫「出獄」動態）、`items.sl` = `{d,n}` 今天被砍次數、冷卻 `items.cd.slash`／`cd['jv'||id]`。缺值 = 沒被關、沒被砍，舊角色不用遷移。
- **砍人**（`act='slash'`）：自己在街上、對方也在街上且 ≤ 2.5 格、雙方好感 < 0（有仇）、自己精力 ≥ 15、對方沒睡／沒住院／沒入獄；30 分鐘一次，每人每天最多被砍 2 次。對方精力 −35、心情 −20、鼻青臉腫 30 分鐘；自己精力 −10、心情 −8；好感 −6（走 `town_bond`，吃每日 −6 上限）。對方精力歸零 → 倒地住院 2 小時（`faint`＋`hosp`，醒來不再收 €1500），**醫藥費 €1500 由砍人的人付，付到 0 為止、不欠款**。**不會死**。
- **被巡警抓**：45%（倒地 80%；23～5 點 ×0.5）→ 關 1～3 小時（倒地至少 2 小時），人移到監獄門口、下車；入獄中不能移動、不能做 `town_act` 的任何動作，離線也不會被送回家睡（`town_tick` 的 `jld`）。
- **牢裡**：`labor` 勞動 €120（比最低的實習生 €190 低）、精力 −20、心情 −3，不再有打工冷卻（只受精力限制），刑期縮短 10 分鐘；`visit` 探監（探監的人心情 +3 精力 −2、受刑人心情 +10、好感 +2，同一人 1 小時一次）；`bail` 保釋金 = max(300, 剩餘分鐘 ×10)（1 小時 €600），自己或朋友（好感 +4）付，**錢不夠就保不了，不欠款**。
- 事件 kind：`slash`／`jail`／`bail`／`visitjail`／`jaillabor`。`node town/test.js` 會比對座標、勞動、保釋金、傷害與抓人機率和 SQL 是否一致。
- `town_jail.sql` 要在 `town.sql` 之後套用（`town.sql` 含 `town_jailed`、入獄檢查、jail 地點、`px > 64`，改了 `town_tick`／`town_act`，套用前先確認）。

### 牢裡情境（2026-11-09 擴充；SQL 已套用到正式站並實測通過：套用順序是**先 `supabase/town_jail.sql`，再 `town.sql`**（`town.sql` 會呼叫 `town_pr_pct`／`town_pr_mult`／`town_prior_set`，先套 `town.sql` 會出錯），`town_fi.sql` 白名單含 jail 也已重套；實測 `supabase/town_jail2_test.sql`，最後 rollback，結果在錯誤訊息 REPORT。2026-11-09 實測：前科 ×1.5 被抓 139／200 vs 99／200、越獄約 10%、通緝在街上 10 分鐘約 32% 被抓回／在家 0%、前科薪水 ×0.92、賭牌期望 −8、假釋與事件各條件都擋得住）
- 角色一樣**不會死**；新增的懲罰都不永久、缺值 = 沒有（舊角色不用遷移）。資料全在 `items`：`pr = {u 到期, n 累計}` 前科、`wt` 通緝到期、`pl` 假釋到期、`jp = {t 入獄, e 原定出獄, n 牢裡勞動次數, bad 惹事}` 服刑紀錄、`je = {nx,lp,d,n,q}` 獄友事件、`cd.yard／cd.esc` 冷卻。前端 `JAILX／JE／jpOf／priorOn／wantedOn／paroleOn／statLine／paroleWhy／escP`（數字和 SQL 一致，`node town/test.js` 會比對）。
- **前科**：入獄時 `pr.u` = 出獄時間 + 24 小時；提早出獄（勞動滿刑、保釋、假釋）改成「出獄當下 + 24 小時」（`town_prior_set`）。期間 **薪水 −8%**（`town_pr_pct`，`town.sql` 的公司打工、其他工作、加班都乘上它）、**巡警機率 ×1.5**（`town_pr_mult`：砍人被抓與 `town_traffic` 的 `nf`）。「我的人生」與各地點面板有一行 `statLine`。
- **放風** `yard`：心情 +6、精力 −3、30 分鐘一次。**假釋** `parole`：要做滿 2 次牢裡勞動、沒惹事（`jp.bad`）、服滿一半刑期，免費；成功後 `pl` 24 小時，期間再被關刑期加倍（最多 6 小時）且不能再假釋。灰掉的按鈕寫原因（`paroleWhy`）。
- **越獄** `escape`：精力 ≥ 30、1 小時一次；成功 12%（23～5 點 18%）回到街上、通緝 3 小時、精力 −20、記前科；失敗加刑 60 分鐘、罰款最多 €500（付到 0、不欠款）、精力 −15 心情 −10、算惹事。**通緝**：巡警機率 ×2.5；`town_tick` 對「上線中、不在家（home:）、不在牢裡」的通緝犯每分鐘約 3.5%（`1 - exp(-2.1 × 小時)`）抓回牢裡關 90 分鐘、不能假釋；躲在家不會被抓。
- **獄友事件** `town_jail_ev(rid,pin,op,item)`（poll／pick，和設施小事件同格式）：4 個事件（聊天、被欺負、交換物品、幫忙）× 2 個選項，效果表 `town_jail_ev_eff`（12 欄：心情、精力、錢、好感、成功%、失敗心情／精力／錢／好感、成功刑期分、失敗刑期分、惹事），前端 `JE` 文字順序要一致；每天最多 8 個、約 5～10 分鐘一個；賭的選項金錢期望值 ≤ 0（牌 −10）、減刑到 0 就出獄。
- **監獄室內**：`ROOMS.jail`（鐵窗、通風口、探監窗口、大門、保釋櫃檯、上下鋪、勞動工作台、放風場）。**入獄中的人自動算在裡面**（`fin` 對 `place=="jail" && jailed(r)` 為 true，面板不顯示「出門」）；探監的人用 `town_fi` 的「進去」。動畫 `ROOM_ACT`：勞動→工作台敲打、放風→曬太陽、探望→窗口冒愛心、越獄→通風口搖晃、假釋→大門透光、保釋→櫃檯數錢。新圖示 `bars／hammer／glass／vent`。
- **教訓（SQL 檔開頭註解）**：把一行註解拆成兩行時，第二行一定要補 `-- `，否則整份 SQL 在 SQL Editor 語法錯誤（2026-11-10 `town_wake_out.sql` 犯過一次，整段沒套上去、正式站沒變動）；`node town/test.js` 現在檢查 `town_wake_out.sql`、`town_civic.sql` 開頭每行都是註解。
- **教訓（SQL）**：plpgsql 裡查詢的表別名不要叫 `x`／`y`（和 `town_residents` 的位置欄撞名，`town_jailed(x)` 會被當成 `town_jailed(real)` 而報「function does not exist」）；同一個交易裡 `now()` 不會動，測試要讓 tick 動起來要把 `updated_at` 設成 `now() - interval '1 minute'`（`h <= 0` 會直接 return）。**`if ... then` 的條件裡有 `case when ... then ...` 一定要整段包括號**（`if random() < (case when a then .25 else .6 end) then`）：plpgsql 掃到第一個沒括號的 `then` 就當 IF 的結尾，會報 "syntax error at end of input"，整包 SQL 套不上去（2026-11-10 `town.sql` 的 fight 趕人那段犯過）；本機沒有 Postgres，寫 plpgsql 時要特別留意這種寫法。另外 `target` 這類參數名和資料表欄位同名（`town_events.target`）時，函式開頭加 `#variable_conflict use_variable` 並把欄位都加表別名。
- **教訓（頂層函式只看得到頂層）**：`town.js` 的 `function init(){` 以前的程式是頂層，**不可用 `init()` 裡才宣告的 `me`／`$`／`esc`／`pxify`／`toast`／`pin`／`R`／`S`**（會在畫面丟 "me is not defined" 紅字、整個面板畫不出來；曾因 `offTxt`、更新通知的 `updModal` 犯過）。要用就把函式放進 `init()`（`enter()` 前面那一段），或把值當參數傳進去（`roomOf(r,R)`）；`node town/test.js` 有靜態掃描會擋。
- **教訓**：頂層函式（`init()` 外面的，例如 `jlLeft`）不能用 `init()` 裡的 `now()`（沒有定義，只要有人被關著就會出錯）；用頂層的 `nowFn()`（`init()` 建好 `now` 後指到它）。

## 進到室內，主畫面就是室內（2026-11-10，前端）
- 自己人在室內（設施裡 `fin`、自己家屋裡 `inside`、朋友家屋裡 `vin`；住院、坐牢睡著的人也算）而且沒在走路時，`frame()` 開頭 `drawRoomStage()` 把室內放大畫在主畫面（`stageRoom()` 判斷；站在朋友家門口只看得到室內的 `visit` 模式仍是面板上的小畫布），整張地圖不畫，走路時才回到地圖。面板的小畫布 `#room` 在這種情況下不顯示（`drawRoom` 仍然畫它，主畫面是把它放大 `drawImage`）。
- 點擊：主畫面走 `stageTap` → `roomTap(fx,fy)`（面板小畫布也用同一個函式）：點人 = 選他（面板出現面對面互動；人的身體畫在腳的上一格，所以兩格都算點到）、點物件 = 按面板上對應的按鈕、點空白處提示「點下面的『出門』離開」。室內時拖曳、縮放地圖都停用。
- 睡著的人（住院、牢裡）躺在病床 `hbed`／上下鋪 `bunk` 上（沒有床就躺在站位上），頭上飄 Z、名字。
- 看畫面時別忘了：只有「你自己」在室內才換主畫面；朋友在室內、你在街上，地圖照舊。

## 走進設施裡面（咖啡廳、餐廳、健身房、監獄、醫院、警察局、市政廳；SQL 已套用 2026-11-09，實測通過：`supabase/town_fi.sql`，要在 `town.sql`、`town_social.sql` 之後；實測 `supabase/town_fi_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- 獨立 RPC `town_fi(rid,pin,op,place)`（op = enter／exit），不改 `town_act`。資料 `items.fi` = 地點代號（`cafe`／`restaurant`／`gym`），**只有 `fi` 等於現在的 `place` 才算在裡面**（SQL `town_fin`、前端 `fin(r)`），走到別處 place 一變就自動失效（離線超過一小時回家睡也一樣），舊角色缺值 = 在外面；和自家進屋的 `items.dr` 互不相干。**2026-11-17 起前端要求進去才能用設施功能**：有室內的地點（咖啡廳、餐廳、健身房、醫院、警察局、市政廳、監獄）門口的面板只留「進去」（`g:"pin"`，置頂醒目）＋非設施動作（移動、朋友互動、車輛、清便便等），設施動作一律不出現；店裡置頂有「出門」。**2026-11-18 起連伺服器也要求進館**（見下一節「所有設施都要進館」）；有室內的地點增加到 咖啡廳、餐廳、健身房、超市、電影院、公司、拉菲、證交所、格鬥場、車行、屠宰場＋醫院、警察局、市政廳、監獄。
- 流程：走到設施門口（`arrived`）自動呼叫 enter（失敗就留在門口，面板第一顆是「進去」）；面板在裡面時標題加「（店裡）」並多一顆「出門」；`walkTo` 一開始會先 exit（`leaveRoomLocal`）；在裡面的人地圖上不畫（`draw` 的 `fin` 過濾）、設施兩扇窗戶亮燈。
- 畫面：面板標題下方的 `<canvas id="room">`（12×5 格、每格 24px，第 0 列是牆，`drawRoom`）。**室內格子系統**（之後家裡擺家具可共用）：物件 = `[代號,格x,格y]`，代號查 `ITEM`（`[像素圖示, 名稱, 對應面板按鈕的文字（null = 裝飾）, 是否擋住站位]`）；場景 `ROOMS[地點] = {floor, wall, items:[[代號,x,y]…]}`。點物件 = 按面板上文字比對到的那顆按鈕；同在裡面的人（`fin` 且醒著）由 `roomSpots` 依離中央遠近排在沒被擋住的地板格，一人一格不重疊，名字在頭上。
- **互動動畫**：地圖上 `FAC_FX`（設施互動 → `spawnFx` 類型，新增 steam／notes／check／disc／fishing／flash，電影院、公園、廣場也有）；室內 `ROOM_ACT`（互動 → 物件代號）＋`playRoomFx`／`roomFxDraw`：角色走到物件旁（0.4 秒）→ 播動畫（0.9 秒）→ 走回（0.3 秒）。新增動畫用像素方塊或 `PIXICON_NAME`，不要用 emoji 文字。`node town/test.js` 檢查：地點存在、物件在格內不重疊、每個物件對得到按鈕、SQL 白名單和 `ROOMS` 一致、`fin` 判斷。
- **新增可進入的設施**：`ROOMS` 加一列（物件要用 `ITEM` 已有的代號，新物件先加進 `ITEM`）、`town_fi.sql` 白名單（`pl not in (...)`，測試會比對）加地點、用 `tools/town-mock.js`（已有 `town_fi` 假回應）看畫面。目前有咖啡廳、餐廳、健身房、醫院、警察局、市政廳、監獄（醫院：昏倒／住院的人由 `town_admit` 直接寫 `items.fi = 'hospital'`，所以睡著的病人也算在裡面；監獄：入獄的人自動算在裡面，探監的人才需要「進去」；`town_fi.sql` 白名單含 jail），其餘設施之後陸續開放。

## 所有設施都要進館（2026-11-18；前端已上線 v240；SQL **已套用正式站 2026-11-18（順序 town_fi→town_infac→town.sql→town_fac→town_stock；回滾實測 town_infac_test.sql：62 項全過、0 錯，含不在室內被擋、進去可做、出門又被擋、入獄者先被監獄擋、開關關閉後不擋、錢 3884 不為負）**）
- **範圍**：有建築門的設施全要進館（`ROOMS` 有場景）；公園、廣場與路邊物件是戶外，不用進。`ROOMS` 新增 超市／電影院／公司／拉菲／證交所／格鬥場／車行／屠宰場（物件對應面板按鈕文字；新圖示 `till／screen／seat／pc／ring／cleaver`；動畫 `wk_type／wk_scan／wk_docs／screen／till／pcs／ring／vcar／cleaver`，`ROOM_ALT` 讓 `spar` 在格鬥場找擂台）。打工動畫 `WORK_FX` 公司、拉菲、超市改在室內桌子／收銀台播。
- **前端**：走到門口自動進去（沿用 `arrived`→`enterRoom`）；門口只留「進去」＋非設施按鈕；`act`（`FACTS` 清單）、`doFac`、股票買賣一開始都會 `ensureIn()` 自動先進去再做（建議下一步、鍵盤、點擊即互動都經過這裡）。**舊伺服器相容**：`town_fi` 回「這裡還不能進去」就記 `NOENTER[place]`，該地點門口照舊顯示全部設施動作，不會卡住玩家。
- **伺服器**（`supabase/town_infac.sql`）：`town_infac_on()`（表 `town_flags` 的 `infac` 列，沒有 = 開；緊急關：`insert into town_flags values('infac',false) on conflict (k) do update set v=false`）、`town_need_in_pl(r,pl)`、`town_need_in(r,act,item)`。呼叫點（各一行）：`town_act` 在入獄與設施開關檢查之後（work、cowork、job、buy、browse、movie、spar、sneak、vbuy、license、insure、vfix、vsell、dine、coffee、workout）、`town_fac`（`pl := r.place` 之後，`claim`／`up` 除外）、`town_stock_trade`。例外：公園／廣場、入獄者、監獄／醫院／警察局／市政廳（各自的 RPC）、格鬥場邀約 PK（不檢查）。
- **套用順序**（先確認前端 v240 已上線）：`town_fi.sql` → `town_infac.sql` → `town.sql` → `town_fac.sql` → `town_stock.sql`（後三份含 `town_need_in` 呼叫，所以一定要在 `town_infac.sql` 之後）；實測 `supabase/town_infac_test.sql`（回滾，REPORT）。要用 AskUserQuestion 讓使用者核准。
- `tools/visual/run.mjs` 新增 8 個 `in-<地點>` 情境；基準圖尚未更新（`--update` 前先看截圖）。已知：390 寬時 note／職階副標被截成「…」、rafi 的 `span.ai` 18px，屬既有樣式。

## 公共建設：醫院、警察局、市政廳（2026-11-10；SQL **已套用到正式站並實測通過**：順序 `town.sql` → `town_fi.sql` → `town_jail.sql` → `supabase/town_civic.sql` → `town_wake_out.sql`，實測 `supabase/town_civic_test.sql`，最後 rollback，結果在錯誤訊息 REPORT。實測結果：送醫、看診 €150 一天一次、探病、出院、9 折繳罰單、自首、報案點 ×1.1、公告最多 3 則、建設案通過／票數不夠／基金不夠、重複投票被擋、建好的長椅 +15 精力 +3 心情不給錢，全部符合預期）
- 全是獨立 RPC：`town_hospital(rid,pin,op,target)`、`town_police(rid,pin,op,item)`、`town_civic(rid,pin,op,item,note)`、`town_civic_use`、`town_civic_proj_list(tid)`；`town.sql` 只加了地點白名單、`px > 71`、`layout3` 遷移，和送醫小幫手 `town_admit`（定義在 `town.sql`，所以三處呼叫它不會因為沒套 `town_civic.sql` 而壞）。三個地點都在 `FEATS`（鎮長可關）與 `town_fi.sql` 白名單，面板與室內場景 `ROOMS.hospital／police／townhall`。前端常數 `HOSP／POLICE／CIVIC／CIVQ`，`node town/test.js` 比對 SQL。角色都不會死。
- **醫院**：昏倒（餓到、車禍住院、被砍倒地）由 `town_admit` 送到醫院門口（61,14）並 `items.fi='hospital'`（住院期間 `faint` 照舊 1～2 小時；醫院被鎮長關掉、人在監獄就不搬）；醫藥費規則沿用（車禍當下結清、被砍由砍人的人付、餓昏倒醒來 €1500，付到 0、不欠款）。`consult` 掛號看診 €150（一天一次 `items.hp.d`、精力 +20、清潔 +40、傷好了、心情 +5；住院中不能看）、`discharge` 出院（醒來後才能，人移到 62,15 街上）、`visit` 探病（朋友在住院、60 分鐘一次、探病者心情 +3 精力 −2、病人心情 +10、好感 +2，事件 kind `visithosp`）。事件 kind `hospital`。
- **警察局**：`pay` 繳罰單 9 折（面板原本的「罰單」鈕仍是原價）、`surrender` 自首（通緝中才行：解除通緝、關 30 分鐘、不算惹事、不加刑、前科照記）、`report` 報案（對方 24 小時內對你扁人／砍人／丟蛋／惡作劇／惡趣味；每人每天 1 次、同一人 7 天 1 次；對方 `items.rp={n,u}` 記 1 點、7 天內每點巡警機率 +10%（`town_pr_mult`，在 `town_jail.sql`），最多 5 點；**不會自動入獄**，避免被當武器）、`stats` 今日治安。事件 kind `report`。
- **市政廳**：新表 `town_civic`（RLS 全關）：`ann` 公告（鎮長發、最多 3 則、1～40 字）、`proj` 已蓋好的建設案、`vote` 進行中的投票（同時只有一個，24 小時）、`hist`。建設案（鎮長才能提，花**鎮基金**）：新長椅 15000（48,8）、路燈 20000（24,21）、涼亭 30000（35,21）、小豬雕像 50000（21,13）；居民一人一票，**贊成多於反對且總票數 ≥ 3（居民不到 5 人的小鎮 ≥ 2）**才通過，結算時基金不夠就否決；**基金只能花在建設案、不能轉給任何人**。居民也能發起「是非題」投票（1～20 字，只是民意調查，結果寫進動態，沒有自動效果）。結算是惰性的：每次有人呼叫 `town_civic` 就先結算到期的投票（`town_civic_close`），寫 `civic` 動態。建好的設施路邊 ≤ 2 格可用（`town_civic_use`，10 分鐘一次 `items.cd.c_代號`，只給心情／精力不給錢）；前端 `civSync()` 每分鐘問 `town_civic_proj_list` 取得已蓋好的清單，`drawCivic()` 每幀畫在地圖上。
- 新增建設案：`town_civic_proj`（SQL，[費用,x,y,心情,精力]）＋前端 `CIVIC`＋`drawCivic` 畫圖；座標要非建築、非馬路（`node town/test.js` 檢查）。

## 鎮長管理權（2026-11-16；SQL `supabase/town_powers.sql` **已套用到正式站（2026-11-16）**，實測 `supabase/town_powers_test.sql`（最後 rollback，結果在錯誤訊息 REPORT）**已在正式站跑過並通過**：關人／放人／罰款／補助／彈劾、各條安全閥、申訴推翻、投票通過的補助、錢與基金不變負全部符合預期；套用順序接在 `town_civic.sql` 之後）
- 資料驅動：新增一個權力 = ① SQL `town_pw_def` 加一列＋`town_pw_name` 加名稱＋`town_pw_do`（與必要時 `town_pw_check`）加一個分支 ② 前端 `town.js` 的 `POWERS`／`PWORD` 加一列（`pwWhy`／`pwWhyT` 補原因）③ `town_powers_test.sql` 補實測。不改 `town_act`／`town_mayor`／`town_civic`。`node town/test.js` 比對 `def` 陣列、名稱、每個權力有執行分支與實測。
- 登錄表 `def` = `[mode 0 鎮長／1 投票／2 鎮長可選, min, max, 全鎮每天, 每人每天, 冷卻分鐘, 要對象, 動用基金, 可申訴, 在別處行使(ext), 不能關]`。ext=1 的（公告 `announce`、建設案 `build`、設施開關 `feat`）只是登錄：前端 `go` 轉到 `civicModal`／`mayorPanel`，SQL 的 `town_pw_do` 不執行。
- RPC `town_power(rid,pin,op,pk,tg,num,note)`：`view`（所有居民）／`use`／`appeal`（note = 紀錄 id）／`vote`（note = yes|no）／`toggle`（note = 逗號分隔要關的代號）／`ack`（清掉通知）。表 `town_powers`（RLS 全關）：`off` 被關掉的權力、`log` 最近 60 筆 `{id,k,by,bn,t,tn,n,at,via,ap,undone,appealed}`、`vote` 一次只有一個（申訴或彈劾）、`hist`。被行使的人 `items.pwn`（最多 5 則，缺值 = 沒有）。所有安全閥都在 `town_pw_check`／`town_pw_do`，直接下令、投票發起、投票通過三條路都會跑。
- 安全閥數值：關人 10～120 分鐘、全鎮每天 3 人、每人每天 1 次、冷卻 10 分鐘，不能關自己／鎮長／睡覺或住院的人／已被關的人，不記前科（`jp.mj=1`），被關的人照常保釋、勞動、越獄、假釋；罰款 100～2000、全鎮每天 5 次、每人每天 1 次、付到 0 為止、進鎮基金、身上沒錢不能罰；補助 100～3000、花鎮基金、每人每天 1 次、不能給自己、`mode=2`（`note='vote'` 交居民投票）；放人要有人被關；**小鎮不到 3 人，關人／罰款／補助不能用**。
- 申訴：任何居民（鎮長除外）24 小時內可對關人、罰款申訴，投票 12 小時，贊成多於反對、至少 2 票、而且多於「非鎮長居民」的一半才推翻；推翻關人 = 還在服那筆刑（`jp.mj`）才提前放人，推翻罰款 = 從鎮基金退回（基金不夠退多少算多少）；補助、放人不能申訴。彈劾：任何居民提名一位鎮民接任，24 小時，贊成多於反對、至少 3 票、多於全部居民一半才換人，3 天內只能發起一次。權力開關：鎮長可關 jail／free／fine／grant，彈劾與建設案（lock）關不掉。
- 透明：每次寫 `town_events` kind `mayor`（公開）；前端選單「鎮長管理權」（`powBtn`，所有居民）與鎮長面板的按鈕都開 `powersModal`（權力清單、投票、使用紀錄、申訴）；被行使者上線時 `checkPwn` 彈窗（可直接申訴）；不能用的權力照樣顯示、灰掉並寫原因。`tools/town-mock.js` 有 `town_power` 假回應（簡化版）。
- 教訓：`town_powers.sql` 裡 plpgsql 變數不要叫 `x`／`y`（和 `town_residents` 的位置欄撞名，已改 `en`）。

## 鎮上隨機事件（2026-11-16；SQL **已套用到正式站（2026-11-16，套的是 `d2af599` 版 `town.sql`＋`town_world.sql`，不含之後第二批取消限制／能力屬性）並實測通過**：5 種倍率、每日 10 次上限、錢不為負都對；順序 `town.sql` → `supabase/town_world.sql`，實測 `supabase/town_world_test.sql`（最後 rollback，結果在錯誤訊息 REPORT））
- **全鎮事件**：每鎮同時 1 個，60～120 分，結束後隔 60～180 分；新鎮 30 分鐘後才有第一個；惰性結算（有人 `town_world` poll 才補算）。5 種：market 市集日（吃喝價 85%）、boom 景氣好（薪水 115%）、bust 景氣差（薪水 90%、價 110%）、blackout 停電（薪水 95%）、festival 慶典（價 90%、薪水 105%）。開始／結束寫公開動態 kind `world`（actor 為 null）。
- `town.sql`：表 `town_worlds`（RLS 全關）、`town_wd_pct(tid)`（乘在公司／其他打工／加班／cowork 薪水）、`town_px(tid,base)`（餐廳 250、咖啡 90、電影 300 的檢查與扣款）。只套 `town.sql` 也不會壞（沒事件 = 100%）。
- **個人突發事件**：`town_world(rid,pin,'luck')`，前端戶外（街上、廣場、公園）醒著、沒走路沒開 modal 時每 3 分鐘呼叫；伺服器擋：間隔 8 分、每天 10 次（`items.lk={d,n,at}`）、被關／睡覺／昏倒不觸發、35% 機率；8 種，錢只扣到 0、期望 ≤ 0，不會死；寫 kind `luck`（前端既有的 luck 動態 toast 會顯示）。
- 前端：`wevPoll`／`wevDraw`（`#wev` 橫幅，每 60 秒 poll、切換時 toast）、`luckPoll`、`WEV` 文字；`node town/test.js` 比對 SQL 倍率與前端文字。鎮長開關（FEATS）這版沒做。

## 取消互動限制、能力屬性、隨機互動（2026-11-16；SQL **已套用到正式站 2026-11-16（回滾實測 `supabase/town_batch2_test.sql`：能力屬性 10 點／每項 0～5／不能改／spend 都對、roll fun／mis 各 10 次全成功、擊掌連按 30 次沒被擋、入獄與睡覺擋住 roll、dcap 不擋、錢與欠款無負；昏倒會同時 sleeping，roll／act／mischief 都擋（`town_faint_test.sql` 已確認，先前疑點是測試只設 faint 沒設 sleeping，非 bug））**：順序 `town.sql` → `town_social.sql` → `town_mischief.sql` → `town_tweaks.sql` → `town_stats.sql` → `town_roll.sql`（隨機事件的 `town_world.sql` 同樣要在 `town.sql` 之後，已套用）），
- **使用者明確要求：除了五條需求不足、入獄、睡覺／昏倒、背包上限、錢不夠、鎮長權力安全閥、報案規則、現金不變負，其餘次數與冷卻上限全取消，連賺錢上限也取消**（所以本 CLAUDE.md 其他節寫的冷卻、每日上限、防印鈔機若與此節衝突，以此節為準）。做法是檢查改成永遠通過（函式簽名與舊資料不動）：好感每日 +12／−6（`town_bond`）、`town_ecap` 精力補充 200、`town_dcap`（屠宰場 3 次、單機心情 10 次）、郵筒垃圾桶每天 3 次、街機一天 40 局、擂台友誼賽獎金 30 分鐘、朋友互動冷卻（`town_act` 的 `if false and exists`）、惡趣味冷卻與每天被整 6 次、PK 每小時 3 場與 3 分鐘、邀請一起做、`town_tg` 每天 12 次、設施小事件每天 12 個、喪屍豬每天 €600、考駕照 30 分鐘。**保留**：監獄相關（放風、越獄、砍人、探監、保釋冷卻）、叫不醒的 3 分鐘、設施小事件的 10～20 分鐘節奏、打工遞減、財產稅階梯。前端 `cdLeft` 只對 `esc／yard／jv／slash／lic` 開頭的鍵回傳剩餘時間，其他一律 0（灰掉的冷卻按鈕不再出現）。**通膨風險**：賺錢只靠精力限制，後期可能通膨。
- **能力屬性**：`items.at={st,ag,ch,iq,lk,init,sp}`（缺值 = 0），`town_at(r,k)` 夾 0～5、`town_agm(r)` 在 `town.sql`。效果：力量 打架／PK／擂台 +1／點、敏捷 巡警抓人與車禍機率 ×(1−2%)／點、魅力 好感增加 +2%／點（乘進 `town.bm`）、智力 打工薪水 +1%／點、運氣 `town_world` 的壞事件 1%／點改好事件。**越獄成功率與考駕照容錯沒做**（越獄在 `town_jail.sql`，它比 `town.sql` 先套用，不能呼叫 `town_at`）。RPC `town_stats(rid,pin,op,note)`（view／set 10 點、各 0～5、不能改／spend 每升一級活躍等級 +1 點），前端 `statsModal`、選單「能力屬性」、第一次進遊戲會彈。
- **隨機互動**：`town_roll(rid,pin,kind,target)`（fun = 擊掌／道謝／傳訊息、mis = 8 種惡趣味），洗牌後依序呼叫原本的 `town_act`／`town_mischief`，第一個成功的就是結果（數值是原規則，**沒有 ±20% 隨機**），多一句隨機 flavor；前端 `rollDo`，面對面面板「隨機互動 🎲」「隨機惡趣味 🎲」。

## 能力屬性的獲得與減少（2026-11-17；SQL **已套用正式站（2026-11-17，只貼 town_at／town_agm 片段＋town_stats2.sql，沒整份重貼 town.sql）**：`supabase/town_stats2.sql`＋`town.sql` 的新版 `town_at`／`town_agm`（改 stable），順序 `town.sql` → `town_social.sql` → `town_stats.sql` → `town_stats2.sql`；實測 `supabase/town_stats2_test.sql`，最後 rollback，結果在錯誤訊息 REPORT，**已跑並通過**：舉重 6 次 $4100、力量 +1、各種擋、暫時減益與解除都對；每日 8 進度上限因測試被精力先擋，未直接驗到）
- 獨立 RPC `town_train(rid,pin,kind)`（kind = view／lift／run／read／chat／pray），不改 `town_act`。累積「進度」`items.at.p`，滿 `need = 6 + 3×目前點數` 就 +1 永久點（每項仍 ≤ 5）；每天全部合計最多 +8 進度（`items.at.td`）。
- 情境：舉重（健身房，€150，精力 −15）力量、慢跑（公園，精力 −12）敏捷、讀書（自家屋裡，精力 −6 心情 −3）智力、聊天（廣場／咖啡廳，要有人醒著在場，精力 −3）魅力、許願池（廣場，€100 只出不進）運氣。入獄、睡著、錢不夠、精力不足擋住。
- **減少一律暫時、不存資料**：`town_at` 即時扣——鼻青臉腫 力量 −1 敏捷 −1、心情低落 魅力 −2、發臭 魅力 −1、精力 < 10 智力 −2、事故欠款 運氣 −1；狀態解除就恢復，永久點不動。
- 前端 `TRN`／`trainBtns`（面板「玩樂」組）／`doTrain`，`statsModal` 顯示進度與「暫時 −N」；`node town/test.js` 比對 need 公式與價格。

## 加一個新設施的清單（全都要改）
0. **使用者規則（2026-11-23）：之後所有新設施（有建築門的）一律要有「內部畫面」與「室內互動」**：`ROOMS[地點]` 場景（12×5 格、裝潢要有該設施的特色物件與氣氛、白天夜晚配色）、`town_fi.sql` 白名單、`town_need_in` 進館檢查涵蓋、互動物件對應面板按鈕（點物件＝按按鈕）與動畫、店員或常客 NPC、進出門流程、`tools/visual` 室內情境與基準圖。公園、廣場等戶外開放區例外。賭場（`casino`）補室內是目前唯一缺的（見「小豬賭場」）。
1. `town.js`：`PLACES`（座標 r、door、block:1）、`HOURS`、`FEATS`（讓鎮長能開關）、面板按鈕、`buildMap` 的 `bld(...)` 與 `sign(...)`、`ACT_FX`。
2. `town.sql`：`town_place_name`、`town_closed`（已取消營業時間，保留函式）、`town_feature`（對應開關）、`town_act` 的 move 白名單與位置上限（`px >`）、動作本身（冷卻存在 `items.cd`）、`town_features` 的白名單。
3. `COLS` 不夠就加大（目前 71），server 的 `px >` 要同步（目前 71）；`layout3` 遷移是把站在新建築上的人移到廣場，再加大地圖要照樣加一個遷移。
4. 前後端的價格、冷卻要一致。

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

## 建議下一步（CTA）統計
`town_cta` 表記錄「建議下一步」的顯示與點擊（`town_track`），鎮長面板用 `town_mayor(act='stats')` 看近 7 天各建議的顯示／點擊／點擊率。前端在 `renderPanel` 顯示時記 show、在按鈕點擊時記 click。

## 路邊物件
`town.js` 的 `OBJS`（座標或綁定地點）＋ `town.sql` 的 `town_obj_near` 與 `town_act` 的 `obj` 分支，兩邊座標、距離（≤2 格）要一致；`town/test.js` 會檢查每個物件都走得到。新增物件要在 `buildMap` 畫圖、`OBJ_FX` 設動畫。目前：人型靶（廣場東邊，免費隨便揍、沒冷卻、每 10 下體能 +1、計數 `items.dm`）、自動販賣機、垃圾桶、烤地瓜攤、噴水池、鞦韆、流浪貓、長椅、飲水機、公廁、郵筒、報攤、夾娃娃機、刮刮樂、街頭藝人、池塘餵鴨。

## 貨幣
**2026-11-16 起全小鎮統一用「$」（名字叫「豬幣」）**：前端 `CUR` 固定 `$`、不讀 `town_towns.currency`（欄位與 `town_currency` RPC 保留但沒人用，預設值改 `$`），鎮長面板與建鎮表單沒有貨幣選項。程式與資料庫字串仍一律寫 `€`，前端 `pxify` 在畫面文字裡把 `€` 換成 `$`；SQL 字串不要寫死 `NT$`。浮動數字等畫布文字要自己用 `${CUR}`。只改顯示，沒動任何數值。足球、人生模擬器是各自獨立的遊戲，沒有改（人生模擬器用各國貨幣有擬真意義）。

## 股市（證券交易所，`place='stock'`，位置 `[44,0,4,5]` 門 `[45,5]`，`FEATS` 可關）
使用者嫌真實台股版「太專業」，已改成大富翁 6 式的簡單版（虛構股票、全天開、沒手續費沒稅、賣了馬上拿錢）。**不要再加回手續費、T+2、真實股價。**
- 檔案：`supabase/town_stock.sql`（要在 `town.sql` 之後套用，可重複執行，開頭會清掉舊版資料表）、實測 `supabase/town_stock_test.sql`（最後 rollback）。前端 `town.js` 的 `stockModal`。沒有 Edge Function、沒有排程。
- 8 檔虛構股票存 `town_market`（豬肉公司、咖啡連鎖、小豬銀行、蛋蛋食品、泥巴建設、豬豬電子、雲朵航空、月亮科技；基準價 20～150、波動倍率 0.5～1.8）。價格每 10 分鐘走一步（`town_market_step`，有人看盤或買賣時才補算，最多補 6 小時，用 `for update` 鎖列），每步 2% 機率利多／利空（±5～12%，寫進 `town_market_news`，面板顯示「今日消息」），**純隨機漫步、期望報酬 0**（2026-11-16：取消買賣上限後，原本「輕微拉回基準價」會讓低檔大額買進變成穩賺——蒙地卡羅 100 萬路徑「買在近期最低 20%、持 6 小時」平均 +0.7～+1.8%、買在 0.7 倍以下 +3～+5%；改成 `exp(σz − σ²/2)` 的無偏移後 0.00%±0.04%）；邊界放寬成基準價的 0.05～20 倍，只防數字跑掉。**不要再加回拉回基準價或任何可預測的偏移**。走勢存 `hist`（最近 36 步 = 6 小時），畫面漲跌幅跟 6 小時前比，紅漲綠跌。
- 持股 `items.st = {h:{代號:{q,c}}, dv:{d,v}}`，缺值用預設。買賣用 `town_stock_trade(rid,pin,op,code,qty)`（要在交易所、鎮長沒關），價格用整數 `town_px`。賣股賺 ≥ 2000 寫 `luck` 動態。
- 防洗錢：價格與玩家買賣無關、沒有玩家間交易；**2026-11-16 起沒有單筆與單日上限**（買受現金限制、賣受持股限制；`town_stock_trade` 的金額與成本都用 bigint 防溢位，賣出加總過 21 億時錢封頂在 int 上限；舊的 `items.st.dv` 不再寫，舊資料留著）。零期望值（沒有手續費，但也沒有偏袒）。
- 舊版待入帳款函式 `town_stock_settle` 已從 `town.sql`／`town_stock.sql` 移除（2026-11-16 唯讀查正式站 `items.st.pend` 為 0 位）；兩檔都套用過新版後，可手動 `drop function if exists public.town_stock_settle(public.town_residents);`（現在正式站還留著舊函式，沒人呼叫、無害）。
- **持股市值先不納入首富願望**（`town_wish_*` 只算現金），等和使用者討論後再決定。

## 小豬鎮路線圖（使用者已確認，一項一項做，不要同時改同一批檔案）
1. ✅ 已完成：個性特質＋心情（見下方「個性特質與心情」）
2. ✅ 已完成：房子升級＋室內家具＋自由擺放（見下方「房子與室內」）
3. 賺錢方式（咖啡廳／餐廳／健身房打工、每日任務板、擺攤賣東西、存款利息）
4. 寵物（寵物店領養、餵食玩耍、離線也會餓、跟在主人旁邊）
5. 購物（食品／服飾／家具／寵物店、每日特價、背包分類）
6. 城市架構（鎮基金抽 5%、鎮長花基金蓋設施、小鎮等級、公告欄；**任何居民都能發起投票事件**，例如「要不要蓋格鬥場？」，24 小時結束，結果寫進動態；鎮長可否決的規則另訂）
每一項都要處理舊角色：不重置、缺欄位用預設、必要時第一次上線彈一次選單。

## 好感與社交互動（對同一個人；SQL `town_bond`／`town_act`，前端文字在 `town.js` 兩段說明與各按鈕副標）
- 好感增加：送禮 +4（浪漫 ×2）、煮飯／洗澡 +3、請吃大餐 +4、串門子／一起加班／外送／道謝 +2、擊掌／傳訊息／打電話 +1、和好 +8。倍率（社交達人、心情、魅力、不洗澡減半）：正數乘以倍率、**負數除以倍率**（2026-11-22 起；心情差的人更傷感情），最少 ±1。**每天 04:10（台灣）排程 `town-bond-recover`：好感低於 0 的一對，若昨天以來沒有負向互動就 +1（≤ −50 則 +2）往 0 回復**（`supabase/town_bond_recover.sql`）。關係等級門檻：生死之交 ≥ 60、好麻吉 ≥ 30、好朋友 ≥ 10、有點不爽 ≤ **−8**（原 −5）、死對頭 ≤ −20、宿敵 ≤ −50（SQL `town_tier` 與前端 `bondLabel` 要一致）。
- 好感減少：扁人 −3（好朋友 ≥10 只 −1、好麻吉 ≥30 為 0）、格鬥場扁人 −1（好朋友以上 0）、丟雞蛋 −1、惡作劇 −2、叫醒／吵醒電話 −1。
- **每對朋友每天（台灣日）正向好感最多 +12、負向最多 −6**（`town_bonds.dday/dpos/dneg`），超過的部分好感不變，心情與體力效果照給。
- 冷卻（對同一人）：扁人 10 分鐘（格鬥場 5 分鐘）、丟雞蛋／惡作劇 30 分鐘、加班／請吃大餐／擊掌／訊息／電話／叫醒 1 小時、道謝／和好 2 小時、其他 30 分鐘。和好要好感 < 0 才能用。
- 叫醒睡著的人有 25%～70% 叫不醒（越累睡越沉）。**格鬥場不能直接扁人了**（2026-11-10 起要走邀約 PK，見「格鬥場邀約 PK」）；友誼賽贏的人 €100、每人 30 分鐘領一次（`items.cd.afp`，防兩人互打印錢）的規則沿用。
- 隨機相遇（`town_encounter`，`town_act` 的 `together` 區塊呼叫）：在同地點做事（吃飯／工作／咖啡／電影／健身等）有人醒著時約 20% 觸發，6 種小事件（聊天／分零食／大笑／共同興趣 好感 +1、+1、+1、+2；撞到／搶位子 −1），心情 ±3～6；每一對 1 小時最多一次、走 `town_bond` 吃每日上限；事件 kind = `encounter`。
- 實測：`supabase/town_bond_test.sql`（最後 rollback，結果在錯誤訊息 REPORT）。2026-11 已套用並通過：每日上限 +12／−6、隔天重算、扁人 −3／−1／0、和好冷卻、全天營業。

## 格鬥場邀約 PK、惡趣味、室內扁人（免整牌已於 2026-11-16 取消）（2026-11-10；SQL 已套用到正式站並實測通過：先 `town.sql`、再 `supabase/town_mischief.sql`；實測 `supabase/town_mischief_test.sql`，最後 rollback，結果在錯誤訊息 REPORT。實測結果：PK 邀約／接受／婉拒／3 分鐘冷卻／每小時 3 場／下注 1000 贏 5950 輸 4000、鎮基金 +50、格鬥場不能直接扁；8 種惡趣味條件與冷卻都對、偷零食理論期望 −6、免整牌擋住惡搞丟蛋扁人、每天被整 6 次上限、報復好感 0、原諒只能一次、坐牢不能整人；室內扁屋主 100 次訪客被趕出門 37～40 次，睡著的屋主不能扁）
- **角色都不會死**。`town.sql` 的 `town_act` 通用互動區塊多兩條：（免整牌已取消，`items.sh` 舊資料不用清、也不再檢查）；`fight` 在格鬥場（雙方都在 `arena`）被擋，要走邀約 PK。`fight` 在別人家屋裡：訪客（`items.fv`）動手，屋主有機率把訪客趕出門（訪客輸 60%、贏 25%；屋主主動打訪客則反過來），清掉 `fv`、寫 `kick` 動態；睡著的人仍然不能被扁。
- **室內也能面對面**（前端 `sameRoom(a,b)`）：你進了他家（屋主在屋裡、你有 `fv`）、屋主與訪客、同在咖啡廳／餐廳／健身房裡（`fin`）都算「同一個室內」，`isNear` 與選人面板（`inRoom`）認它，所以擊掌、扁人、惡趣味、和好都能用；設施面板直接列出在場的人（最多 3 個）的面對面按鈕。站在門口（沒進去）仍只能留言、放禮物、丟雞蛋、惡作劇、按門鈴、假便便。伺服器的 `near` 本來就接受同地點，沒另外改。動畫：`PAIR_FX`（互動 → 動畫代號）＋`playRoomFx(a,target)`：我走到他旁邊、在他身上播 1.7 秒（`roomFxDraw` 的 `A.tgt`）；位置來自 `lastSpots`（`drawRoom` 每次記），動手前先存 `spotsBefore`（動手後被趕出門也能播完）。
- **走去有室內的地方時面板不跳**：`drawRoom` 在走路中如果目的地是有室內的設施或屋主在屋裡的朋友家，會先保留畫布位置（`hold`，畫深色底），到了才畫內容，面板高度不變（曾因畫布到達才出現，面板突然變高，整個畫面跳一下）。`node town/test.js` 有檢查。
- **格鬥場邀約 PK**（獨立 RPC `town_pk(rid,pin,op,target,bet)`；入口：面板「線上」組「邀請 X 去格鬥場 PK」、格鬥場裡面對面時「邀請 X 打一場」；前端 `pkModal／pkWatch／checkPk／pkAnim`）：`send` 下戰帖（下注 0～€2000，雙方都要付得起、精力 ≥ 15、對方醒著沒入獄、同一對每小時最多 3 場、同一人 3 分鐘一次），寫進對方 `items.pk`（3 分鐘內有效，對方畫面 `checkPk` 每次 refresh 彈窗：接受／婉拒）；`accept` 兩人被帶到格鬥場門口（`place='arena'`、位置 53,6／54,6，清 `dr／fv／fi`、下車），三回合分勝負（公式同 `fight`：精力、心情、體能、運動家、鼻青臉腫、心情加成），回合結果 `rounds`（W = 邀約的人贏該回合）存進兩人 `items.pkr`；`poll` 邀約的人每 4 秒問一次（最多 190 秒），讀一次就清；`decline` 通知對方。錢：下注時輸的付、贏的拿 95%、5% 進鎮基金（`town_fund_add(..., 'pk', fee)`，期望值 −2.5%）；沒下注時贏的人 €100，每人 30 分鐘一次（`items.cd.afp`，防互刷）。體力：輸 −12、贏 −8，輸的人鼻青臉腫 1 小時；心情贏 +10、輸 −8；兩人好感 +1（切磋，吃每日上限）。動態 kind：`pk`／`pkno`／`kick`；下注 ≥ 1000 另寫 `luck`。擂台打機器人（`spar`）與人型靶照舊。
- **8 種惡趣味**（獨立 RPC `town_mischief(rid,pin,act,target)`；前端 `MIS`／`misBtn／misActs／doorMisActs／doMis`，分組「惡趣味」`g:"mis"`；冷卻在 `items.cd['ms'||act||對方id]`，前後端要一致，`node town/test.js` 會比對）：潑水 30 分（他清潔 −15、心情 −3；好感 −1）、貼「踢我」紙條 60 分（`items.sk` 到期 1 小時，名牌掛「踢我」，心情 −4）、假裝告白 60 分（一半他害羞：他心情 +5、好感 +1；一半氣炸：他心情 −10、好感 −2）、偷零食 60 分（他要有零食；55% 被抓賠 €60 且好感 −3、沒被抓拿到一包，期望值 ≤ 0）、拍醜照 60 分（寫 `photo` 動態、他心情 −5、好感 −2）、換座位 30 分（要同在咖啡廳／餐廳裡面、他精力 −3、心情 −4）、按門鈴逃跑 30 分（要站在他家門口，睡著的 40% 被吵醒）、門口擺假便便 60 分（他清潔 −5、心情 −6）。面對面的要他醒著；按門鈴與假便便睡著也行。你自己心情 +3～6。好感變化走 `town_bond`（吃每日 −6 上限）。動態 kind：`mischief`（拍醜照是 `photo`）。
- **防霸凌**：每人每天最多被惡搞 6 次（`items.ms={d,n}`）；**報復不扣好感**（他三天內對你整過／丟蛋／惡作劇／扁過／拍醜照，你整回去好感變化歸 0，其他效果照給）；**原諒**（`act='forgive'`：他三天內整過你且你還沒原諒，好感 +2、兩人心情 +3，前端 `shouldForgive` 從動態找，找得到才顯示按鈕）；**免整牌已取消**（2026-11-16 使用者決定：面板按鈕、`shield`／`unshield` 動作、`items.sh` 的檢查都拿掉，舊資料不用清）；被關著的人整不到也不能整人。
- **教訓（2026-11-16）**：取消免整牌時誤刪了 `town_mischief` 開頭「載入對象 `t`」與「原諒」，所有惡趣味都報錯；已還原（SQL 已重套到正式站、使用者實測可用），`node town/test.js` 會檢查。改 SQL 刪功能時，只刪那個功能的行，刪完要讀一遍函式前後文。
- 新增惡趣味：`MIS` 加一列（`[標題,說明,冷卻分鐘]`）、`town_ms_cd` 與 `town_mischief` 加分支、`PAIR_FX`／`roomFxDraw` 加動畫、`MIS_FX` 加地圖動畫；`tools/town-mock.js` 已有 `town_mischief`／`town_pk` 假回應（接受邀約時隨機勝負）。

## 2026-11-16 小調整（使用者貼的七項；SQL：`town.sql`／`town_fac.sql`／`town_mischief.sql`／`town_stock.sql` 的修改＋新檔 `supabase/town_tweaks.sql`（喪屍豬）；實測 `supabase/town_tweaks_test.sql`，最後 rollback，結果在錯誤訊息 REPORT；**SQL 已套用到正式站（2026-11-16，順序 `town.sql` → `town_fac.sql` → `town_mischief.sql` → `town_stock.sql` → `town_tweaks.sql`），實測 `town_tweaks_test.sql` 通過並回滾**：白天 0 隻／夜間刷出、被碰到精力 −8 心情 −8 清潔 −10 且 60 秒內不重複、睡著／在店裡／被關著不被打、打倒 30 隻拿 €600（上限）、賣豬肉 €30、連打 3 次工沒被擋、咖啡第 5 杯被精力上限擋、屠宰場第 4 次被擋）
- **教訓：使用者會直接在 GitHub 網頁改檔**（2026-11-13 的 `Update town.js` 一系列 commit，其中最後一個 `0e94134` 把 `town_fac.sql` 的內容整個貼進 `town/town.js`，線上整個壞掉，已還原成 `ea12a2d` 再補完）。推上去前 `git pull --rebase`，開工先 `node --check town/town.js` 與 `node town/test.js`；使用者手動改的東西（喪屍豬圖、任務獎金文字、`cdLeft`／`wkLeft` 回 0 等）要保留意圖、補完伺服器端並修掉副作用（例如他把 `cdLeft` 一律回 0，會讓朋友冷卻、牢裡冷卻的按鈕顯示失真，已還原）。
- **喪屍豬（Minecraft 風）**：**全天隨機生成**（2026-11-16 使用者要求，原本只有夜間）：每 40 秒一次機會，白天 25%、夜間（台灣 20:00～06:00，SQL `hr >= 20 or hr < 6`，實測可用 `set_config('town.hour',…)` 覆蓋）50% 刷一隻，白天最多 2 隻、夜間最多 4 隻；每隻活 8～16 分鐘（`8 + (id % 5) * 2` 分）就消失（取代天亮燒掉）。出現在街上、廣場、公園（`place in ('street','plaza','park')`）的綠皮小豬。獨立 RPC `town_zombie(rid,pin,op,target)`：`poll`（前端有喪屍時每 4 秒、沒有時每 12 秒）、`hit`、`sell`；資料表 `town_zombies`（RLS 全關，惰性結算：每次 poll 補算移動，最多補 60 秒）。**上限**＝戶外醒著上線中的人數（白天最多 2 隻、夜間最多 4 隻），刷在隨機玩家左右 8～12 格；緩慢（1.2 格／秒）追向最近目標；碰到（≤ 1.5 格）：精力 −8、心情 −8、清潔 −10，同一人 60 秒最多一次（`items.zb.at`），寫 `zombie` 動態，不會死、不扣錢。**不會被打**：在屋裡（包含自家門口，`place` 是 `home:`）、設施室內（`town_fin`）、醫院、監獄、睡覺、昏倒、離線 10 分鐘以上。鎮長關掉 `zombie` 會把全小鎮的喪屍刪光。**打**：精力 −5、要在牠 3 格內、牠 3 點血、25% 反擊（心情 −3）；打倒領 €20～60，**每人每天最多 €600**（`items.zk={d,m}`），35% 掉「生豬肉」（`items.zp` +1），到超市 `sell` €30／塊。前端：`ZB`／`zbPoll`／`zbHit`／`zbSell`、`drawZpig`（每幀畫、平滑移動）、面板按鈕「打喪屍豬」（走近 3 格才有，14 格內有喪屍會有灰掉的「附近有喪屍豬」）、市場「賣生豬肉」；`FEATS` 有 `zombie`；`town_features` 白名單也加了 `zombie`；`tools/town-mock.js` 有 `town_zombie` 假回應（`window.__night=false` 可關夜間）。沒有專屬像素圖示（按鈕純文字）。**還沒做**：料理（生豬肉做菜）。
- **取消的東西**：免整牌（見「格鬥場邀約 PK、惡趣味」）、各種時間冷卻（見「遊戲平衡」，含防印鈔機）、股票單筆／單日上限（見「股市」）。**比大小 A 最小、K 最大**：SQL 本來就是（`p := case when choice = 'hi' then 13 - d1 else d1 - 1 end`，A = 1、K = 13，A 猜更小、K 猜更大沒得賠），沒有把 A 當 14 的地方，`town/test.js` 補了檢查。**任務獎金 ×10**：每個 €500、全勤 +€1000（前端文字也是），一天最多 €2500；勤勞獎金（第 3 次 +€500、第 6 次 +€1000）**還沒 ×10**，使用者若也要請另外說（任務板加打工獎金已經遠大於基本房租）。
- **LF 入獄已取消**（使用者 2026-11-16 說「先拉掉」，`town_lf_jail.sql` 已刪、從未執行；改成做「鎮長管理權」，見下一節）。

## 下週待辦（使用者列的，尚未開始；細節還要和使用者確認）
1. ✅ 已完成：睡眠比例、快速睡覺、待機回家睡（見「睡眠與進屋」）
2. 21 點加花色（牌面顯示 ♠♥♦♣；`town_card` 目前只回點數）
3. 多加幾個賭場遊戲與單機遊戲（期望值要略負，規則見「金錢平衡」）
4. 扁人與和好的平衡（扁人好感 −6、和好 +8、冷卻不同，要重新對齊）
5. ✅ 已完成：站在路上的壞事、進屋／出門（見「睡眠與進屋」）
6. ✅ 已完成（見「其他工作與拉菲的辦公室」）：工作多種類型、新增「拉菲的辦公室」
7. 交通工具、交通規則、事故、道路（體量大，拆三階段；第 1 階段道路與交通工具已寫好，見「交通」，三階段 SQL 都已套用到正式站，2026-11-16 唯讀查 `pg_proc` 確認函式存在）
建議順序：1＋4（小調整）→ 2＋3（遊戲）→ 5＋6（世界與工作）→ 7（交通，拆開做）。

## 版面與字型
- 像素字型 Cubic 11 只在 11／16.5／22px 清楚，別用其他字級；字距保持 0。
- 手機（≤700px）分四塊：狀態列（`#needs`）、工具列（`#strip` + `.tools`）、地圖（`#stage`）、底部抽屜（`#panel`，有收起鈕）。
- 數值欄只在內容有變時重畫（`lastNeeds`），不要讓它閃。
- **狀態條的「條」不能被壓扁**：`body.ingame .need` 是固定高度（`--hud`）的直排 flex，圖示格 `span` 曾因行高 24.75px（16.5px×1.5）擠掉 `i` 條，條被壓成 2px、填色 0px，看起來像「能力條不見」。現在 `span` 固定 16px 高、`i` `flex:none` 6px；錢格在遊戲中（`body.ingame`）只顯示數字（貨幣符號 `u.cu` 隱藏、完整金額在 title），手機 `--hud` 為 64px 才放得下第二行禮物／零食；`#strip` 右緣用 mask 淡出提示可滑動；面板分組標題自己家門口不是「在他家」（`dg` 排除 `home:`+自己）。改狀態列內容或字級後要用 `getBoundingClientRect` 量 `.need i` 高度，`node town/test.js` 會檢查這兩條 CSS 還在。
- 手機觸控：按鈕高度 ≥ 44px（工具列 `--tb:52px`、`#strip` 與 `.tools` 的按鈕 44px、`#grip`、`#menuClose`）；`#strip` 寬度要預留 `.tools` 的寬（目前 `calc(100% - 184px)`），改了工具列按鈕要重量。modal 裡用 `class="act"` 的選項按鈕（`choiceModal`）由 `#mbody button.act` 排版，標題與說明上下兩行。字距一律 0（`.dsec` 已改）。狀態列錢格（`.need.money`）寬只有約 49px：≥10000 顯示 `12.3k`，禮物／零食數量換行顯示，格子用 `minmax(0,1fr)` 防止撐開。iPhone Safari 底部工具列區域會露出頁面底色，不是排版錯誤。

## PC 版（2026-11-17，≥ 900px；手機 ≤ 700px 完全不動）
- 規則全在 `town.js` 第 3 行注入的 `#pccss`（`@media (min-width:900px)`）：整體最大寬 1600px 置中（`--L`），右側欄 `--sw`＝clamp(380,28vw,420) 放面板（頂到底、內部可捲）＋底部 24px 按鍵提示 `#kbh`＋56px 導覽列；左邊 `#stage` 改 `position:fixed` 撐滿剩餘寬高；`#needs` HUD 最大 720px 在舞台上方置中；modal 最大 520px。`resize()` 在 PC 也用舞台實際高度（`isPC()`）。700～900px 維持舊版。
- 地圖滑鼠：滾輪直接縮放（以游標為中心，室內不縮）、拖曳平移（原本就有）、hover 人物／建築／房子／路邊物件顯示 `#tip2` 名稱並變 pointer。
- 鍵盤（無輸入框聚焦、無 modal、非社交頁才作用）：方向鍵／WASD 走一格、`E`／`Enter` 建議第一顆、`1`～`9` 目前分頁第 N 顆、`Esc` 關 modal；`Tab` 不攔。
- 改版後手機數字（390x844）：`#stage` 390x378、`#panel` 390x354，與改前相同。

## 遊戲中版面 ui2（2026-11-17，地圖優先；設計稿見 side-session-notes `town-ui-design.md`）
- 樣式放在 `town.js` 的 `init()` 開頭注入的 `<style id="ui2css">`（index.html 有 45KB 上限），覆蓋下面舊的減擠規則。HUD `--hud`＝安全區＋40px 單列（需求只有圖示＋迷你條，<20 紅框閃；錢留數字）；`.tools` 與 `#menuBtn` 是右側浮動 44px 圓鈕（文字用 `font-size:0` 隱藏，靠 `aria-label`），`#strip` 人物條浮在地圖左上，沒有第二列工具列。
- 面板 `#panel` 高度 ≤ min(32vh,300px)（矮螢幕 34vh、隱藏 `#note`）：`#tipbox`（建議置頂）→ `#ptabs`（分頁籤＋可做數量，`TABOF`／`TABS`，預設「這裡」，換地點或換選人時重設）→ `#acts`（唯一可捲動區，2 欄圖示磚，價格 `.pc`、灰掉的只顯示原因一行）。`roomTap` 若按鈕在別的分頁會先 `panelFnTab` 切過去。舊的分組收合（`town-gc`）已不用。
- 訊息槽：`#toast` 在 HUD 下方一行（`toast` 是佇列，一次一則、最多排 3 則）、`#wev` 事件橫幅在它下一行、`#upd` 更新提示在 HUD 下；都不碰 HUD 與面板。
- 右側圓鈕 52px（圖示＋11px 字）、室內主畫面 `drawRoomStage` 左右上都避開圓鈕與人物條、`#fb` 完成提示浮在面板上緣；`html`/`body` 在遊戲中底色同面板（iOS 底部露出的區域不再是黑條）。
- 量測（mock，無安全區）：地圖佔比 390x844 56%→65%、375x667 約 50%→62%、768x1024 58%。
- 改版時遵守：字級只用 11／16.5／22px、間距 8px 倍數（`--g`）、觸控 ≥44px、面板不可水平溢出。

- **2026-11-17 晚改成「實心分列」**（覆蓋上面 HUD／圓鈕敘述）：由上到下全是不透明獨立列、互不重疊——狀態列 `#needs`（0～安全區＋46px）→ 人物頁籤 `#strip`（52px）→ 訊息槽（28px，`#wev` 事件橫幅與 `#toast` 共用同一個位置，toast 蓋過橫幅）→ 地圖 `#stage`（`top:var(--top)`，`bottom:phpx+56px`，**canvas 只有這塊可視範圍，鏡頭置中、`pt/pb` 只留 8px**；`resize()` 由 ResizeObserver 觸發）→ 工具列（選單／我／看全鎮／動態，4 等寬鈕，56px，`.bar`＋`.tools`）→ 面板（固定高度 `--ph`，整體可捲、`#panel>*{flex-shrink:0}`、置頂的 `pin`／`tip` 按鈕 sticky）。不用 backdrop-filter／filter／漸層。面板內的小室內畫布 `#room` 遊戲中一律隱藏（改看主畫面）；進去／出門（朋友家、設施）是 `g:"pin"` 置頂。灰色「❯」是 iOS 系統的邊緣返回提示，不是遊戲元素。
- **2026-11-17 深夜「手機遊戲標準版型」（覆蓋上面的列結構）**：頂 `#needs` 44px 實心 HUD（＋安全區）→ 舞台 `#stage`（地圖／室內，`top:hud`，`bottom:phpx+nav`，canvas 只用這塊）→ 面板 `#panel`（`bottom:var(--nav)`，高 `--ph=clamp(250px,32vh,340px)`；`--phpx` 由 `fit()`／ResizeObserver 寫入實際高度，**注意舊規則 `max-height:30vh` 已用 `max-height:none` 蓋掉**）→ 底部導覽列 56px（選單、我、看全鎮、朋友、動態；`.bar`＋`.tools`，背景是 `body::after`）。人物頁籤 `#strip` 平常隱藏，按「朋友」才顯示在面板上緣（`body.fr`）。面板結構：標題單行（`#here`，進去／出門 `#pinbox` 在右側）→ 一行小字 `#note` → 建議 `#tipbox`（≤2）→ 分類頁籤 `#ptabs`（不隨內容捲）→ 按鈕區 `#acts`（3 欄、`grid-auto-rows:60px`、`fit()` 把高度裁成整排、scroll-snap、底部淡出 `.more`）。訊息 `#toast`／`#wev` 是舞台上緣的實心膠囊（toast 蓋過橫幅）。`#room` 小畫布遊戲中隱藏。尺寸實測（mock）：390x844 地圖 56%、375x667 48%、430x932 57%，各尺寸按鈕區都是整排。
## 底部主動作列與導覽（2026-11-23，B 案「拇指區優先」；以此節為準，覆蓋上面 ui2／拇指版型的尺寸敘述）
- 面板固定高度（手機 ≤ 面板上限 50% 視窗高，PC 80%；`fit()` 的 `maxP`），**沒有收合、沒有搜尋、沒有 grip**（使用者 2026-11-23 要求；`#grip` 隱藏、`#srch` 已刪、不再預設 `.min`）。
- `#mainrow`（`mainRow()`）：面板最底 3 顆——建議下一步（≤2）→ 最近用（`localStorage town-recent`，`recentAdd`）→ 其他可按的；第 3 格固定進去／出門（pin，粉紅）。`#tipbox`／`#pinbox` 保留 DOM、CSS 隱藏。抽屜操作 `UT.hit("drawer:main|list")`。樣式在 `drawcss`（town.js 第 3～4 行）。
- **兩層導覽要長得不同**：底部「全站導覽」＝選單／我／朋友／動態四顆等寬（深色 `#05060f` 底、頂 4px 亮邊、圖示在上字在下，目前頁＝`body.fr`／`body.social` 亮底＋頂部粉紅條）；「看全鎮」改浮在舞台右上角（≤899px）。面板內「這個地點的分頁」（`#ptabs`）＝扁平文字頁籤（無底色、選中黃字＋黃底線），標題 `#here` 寫地點名。兩者顏色形狀不可相近。
- 面板按鈕：晶片最多 2 顆（`tile()`），賭場 19 款去掉「玩」前綴並分 牌桌／骰盤／單人 小標（`casinoGroups`，超過 8 顆才分），`集點卡換一杯`→`換咖啡`；`#acts` 的 `grid-auto-rows` 一律 auto（fxcss 也是），否則小標會佔 76px。
- **常用列規則**：`#mainrow` 前面有黃色「常用」標籤；順序＝釘選（長按按鈕開說明卡，卡內「釘選到常用」，最多 4 顆，`localStorage town-fav`）→ 建議下一步 → 需求智慧（需求 <35 才套：餓→吃、精力→睡／咖啡、膀胱→廁所、清潔→洗澡、心情→電視／電影）→ 最近用 → 其他；最後一格固定進去／出門。`UT.hit("fav:on|off")`、`drawer:main`。
- **面板不位移**：有分頁（`#ptabs` 顯示）時面板高度固定為上限（`fit()`），切分頁高度不變；面板 `overflow:hidden`，只有 `#acts` 可捲；牌桌 modal（含 `.garea`／`.gmenu`）整張卡 `touch-action:none`、只有清單區可捲。`tools/visual` 的 `shift-cafe` 情境量測切分頁＋等待後 `#panel／#stage／.tools／#mainrow` rect 差，必須 0。
- **通知中心**：底部「通知」（原「動態」，badge ＝別人對我做的未讀）→ 動態頁籤多「要回應」（可道謝／可和好的事件，帶數字）與「系統」（全鎮事件、升級、鎮長、市政）過濾、「全部已讀」（有未讀才出現）；toast／#wev／#upd 維持短暫提示。邀請、PK、鎮長權力、叫醒仍是彈窗（要回應的優先）。`UT.hit("notif:*")`。尚未做：彈窗佇列整合進中心、已讀狀態分類型。
- **PC 版（≥900px，`pc2css`）**：全站導覽（選單／我／看全鎮／朋友／通知）移到右側欄**頂部**（56px、亮底線）；面板從導覽下方到底部提示列上方（`top:56px;bottom:76px`），內部 `#acts` 唯一可捲、`#mainrow`（常用）貼面板底；面板內分頁是文字頁籤（同手機）；`#info` 在 PC 改成導覽列下方一行 24px 小字（職階、薪水、今天打工次數，`#panel` top 80px）；「最近動態」不在側欄，由底部「通知」涵蓋（`#info .ev` 隱藏）。
- 尚未做：其餘標籤縮短與合併（小睡／睡覺）、室內舞台按內容放大、PC 橫向版細修。

## 像素風規則（2026-11-17）
- 全遊戲維持像素風：字型只 Cubic 11（11／16.5／22px、不用粗體、字距 0），`-webkit-font-smoothing:none`；canvas 文字也用 Cubic 11，`fillText` 座標取整，`strokeText` 被改成 1px 四向硬描邊（`town.js` 開頭 `pxcss` 與 prototype 補丁）。
- canvas 一律 `imageSmoothingEnabled=false`＋`image-rendering:pixelated`；地圖縮放 `snapS` 對齊整數裝置像素，鏡頭偏移 `ox/oy` 取整到裝置像素。
- CSS：不用 `border-radius`（`pxcss` 全域設 0，按鈕／面板用 `clip-path` 4px 階梯角）、不用模糊陰影（blur 一律 0）、不用漸層遮罩、不用 `backdrop-filter`、動畫用 `steps()`。新增樣式要遵守。

## 按鈕效果與門檻（2026-11-18，純前端）
- 面板磚（`tile()`）高 76px：圖示、名稱、下方「晶片列」（`.fr`）。晶片＝12px 像素圖示（沿用需求 emoji：🍚飽足⚡精力🚽膀胱🛁清潔🎉心情💰錢💗好感💪體能）＋帶號數字；綠＋紅－錢黃；手機最多 2 顆、PC 3 顆。未滿足的門檻（需$N、精力≥N、冷卻剩餘）以紅標籤放最前（＋1 顆晶片）；已滿足不顯示；磚上不再有右上角價格。
- **資料單一來源是 `town/town.js` 頂層的 `RULES`**（`/*RULES:START*/` 到 `/*RULES:END*/`）：每列 `k／m（標籤比對或 "fac:代號"）／fx／need／p／sql／chk`；晶片、門檻、長按卡、設施 `FAC` 的價格與說明都從它取，沒有規則的按鈕不顯示晶片（`nofx:1`、`NOFXRE`，或列在 `RULES_TODO` 待確認）。**改互動數值只改 `RULES`＋對應 SQL，再跑 `node tools/town-rules-doc.mjs`**（重寫下方「按鈕效果表」標記區）。`node town/test.js` 檢查 `sql` 檔與字串存在、`chk` 正規式從 SQL 抽出的數字與前端一致、每顆 `btn()` 要有規則或在清單內。
- 長按（手機 400ms）／PC hover（350ms）開 `#fxcard`：完整副標、所有效果、所有門檻（可／要）；不用 `title`、不擋點擊、點別處關閉。`node town/test.js` 檢查 `parseFx` 樣式。
- 還沒做：RULES_TODO 清單裡的按鈕（叫醒、旅人、商人、自首、出院、場館升級各動作、朋友互動、惡趣味、牢裡其餘動作等）還沒對照 SQL 填規則。

### 按鈕效果表
<!-- RULES:START -->
（由 `node tools/town-rules-doc.mjs` 從 `town/town.js` 的 `RULES` 產生，請勿手改；共 72 筆）

| 互動 | 效果 | 門檻 | 機率／備註 | SQL 出處 |
|---|---|---|---|---|
| 在家吃飯 | 錢 −60、飽足 +32、精力 +15、心情 −3（有家具：錢 −30、飽足 +48、精力 +15） | — | — | `town.sql#act = 'eat' then n := 60` |
| 上廁所 | 膀胱 滿、清潔 −10、心情 −3（有家具：膀胱 滿） | — | — | `town.sql#act = 'toilet' then r.bladder := 100` |
| 洗澡 | 清潔 +70%缺口、心情 +3（有家具：清潔 滿、精力 +10、心情 +3） | — | — | `town.sql#act = 'shower' then` |
| 看電視 | 心情 +6（有家具：心情 +22、精力 −3） | — | — | `town.sql#act = 'tv' then` |
| 快速休息 | 精力 +50（有家具：精力 +100） | — | — | `town.sql#act = 'nap' then` |
| 吃零食 | 飽足 +20、心情 +3 | 零食 1 包 | — | `town.sql#act = 'snack' then` |
| 玩一下 | 心情 +20、精力 −5 | — | — | `town.sql#act = 'play' then` |
| 餐廳吃一頓 | 錢 −250、飽足 +55、精力 +20、心情 +10 | — | — | `town.sql#act = 'dine' then` |
| 喝咖啡 | 錢 −90、精力 +50、心情 +3、膀胱 −10 | — | — | `town.sql#act = 'coffee' then` |
| 看電影 | 錢 −300、心情 +35、精力 −5 | — | — | `town.sql#act = 'movie' then` |
| 健身 | 精力 −15、飽足 −10、清潔 −15、心情 +10 | 精力≥15 | — | `town.sql#太累了，先休息` |
| 公司打工 | 錢 +0、精力 −25、心情 −10、飽足 −8 | 精力≥25 | 薪水為職階底薪，實發另乘心情、個性、事件、前科、智力 | `town.sql#act = 'work' then if r.energy < 25` |
| 今日特餐 | 錢 −200、飽足 +40、心情 +12 | — | — | `town_fac.sql#act = 'special'` |
| 打包帶走 | 錢 −120、心情 +3 | 背包未滿 | 另得零食 1 包 | `town_fac.sql#act = 'takeout'` |
| 特調咖啡 | 錢 −300、精力 +45、心情 +4 | — | 另得集點 +1 | `town_fac.sql#act = 'latte'` |
| 換咖啡 | 精力 +45、心情 +6 | 集點卡 8 點 | — | `town_fac.sql#act = 'redeem'` |
| 請客 | 錢 −200、心情 +4、好感 +3 | 要有人在場 | 對方心情 +10 | `town_fac.sql#act = 'treat'` |
| 點歌 | 錢 −50、心情 +6 | — | 在場的人心情 +3 | `town_fac.sql#act = 'song'` |
| 看今日片 | 錢 −280、心情 +16～22、精力 −4～0 | — | 每天換片 | `town_fac.sql#act = 'film'` |
| 爆米花 | 錢 −80、飽足 +12、心情 +4 | — | — | `town_fac.sql#act = 'popcorn'` |
| 健身房對練 | 精力 −12、心情 +6、好感 +2 | 精力≥25、要有人在場 | 雙方精力都要 ≥25 | `town_fac.sql#act = 'spar'` |
| 每日簽到 | 心情 +3 | 每天 1 次 | 連續 3 天 +$60、7 天 +$200 | `town_fac.sql#act = 'checkin'` |
| 丟飛盤 | 精力 −4、心情 +8、好感 +1 | 精力≥10、要有人在場 | — | `town_fac.sql#act = 'frisbee'` |
| 釣魚 | 錢 −30、心情 +4 | — | 15% 賣 $100、35% 賣 $30、其餘空手 | `town_fac.sql#act = 'fish'` |
| 野餐 | 錢 −150、飽足 +25、心情 +12 | — | 有人在場好感 +1 | `town_fac.sql#act = 'picnic'` |
| 高級套餐 | 錢 −3000、飽足 +40、心情 +30 | — | — | `town_fac.sql#act = 'feast'` |
| 溫泉 SPA | 錢 −2000、精力 +30、心情 +25、清潔 +40 | — | — | `town_fac.sql#act = 'spa'` |
| 小旅行 | 錢 −8000、心情 +60、精力 −10、飽足 −10 | — | — | `town_fac.sql#act = 'trip'` |
| 自拍 | 心情 +5 | — | — | `town_fac.sql#act = 'photo'` |
| 合照 | 心情 +6、好感 +1 | 要有人在場 | — | `town_fac.sql#act = 'photo'` |
| 掛號看診 | 錢 −150、精力 +20、清潔 +40、心情 +5 | 每天 1 次 | — | `town_civic.sql#if op = 'consult' then` |
| 放風 | 心情 +6、精力 −3 | 30 分鐘 1 次 | — | `town_jail.sql#if act = 'yard' then` |
| 拉花小遊戲 | 錢 −150、精力 +15～40、心情 +2～10 | — | 點對時機的品質 0～100 決定；品質 ≥80 集點 +1 | `town_venues1.sql#act = 'art' then` |
| 共點一壺 | 錢 −240、精力 +25、心情 +6、好感 +3 | 要有人在場 | 對方精力 +25、心情 +6 | `town_venues1.sql#act = 'share' then` |
| 主餐＋飲料套餐 | 錢 −320、飽足 +50、心情 +16 | — | — | `town_venues1.sql#act = 'combo' then` |
| 外帶給朋友 | 錢 −200、心情 +3、好感 +3 | 要選一位朋友 | 對方飽足 +20、心情 +6 | `town_venues1.sql#act = 'bring' then` |
| 情侶座看片 | 錢 −360、心情 +20、好感 +4 | 要有人在場 | 對方心情 +20 | `town_venues1.sql#act = 'seat' then` |
| 看完聊劇情 | 心情 +6、好感 +2 | 要有人在場 | 對方心情 +6 | `town_venues1.sql#act = 'chat' then` |
| 今日特價零食 | 錢 −42、心情 +2 | 背包未滿 | 零食 +1、會員點數 +1 | `town_venues1.sql#act = 'sale' then` |
| 試吃 | 飽足 +6、心情 +1 | — | — | `town_venues1.sql#act = 'sample' then` |
| 牢裡勞動 | 錢 +120、精力 −20、心情 −3 | 精力≥20 | 刑期縮短 10 分鐘 | `town_jail.sql#if act = 'labor' then` |
| 付保釋金 | 錢 −保釋金 | — | 保釋金 = max(300, 剩餘分鐘×10)，錢不夠就保不了；替朋友付好感 +4、他心情 +10 | `town_jail.sql#act = 'bail' then` |
| 越獄 | 精力 −20（成功）／−15（失敗） | 精力≥30 | 成功 12%（23～5 點 18%）：逃出但通緝 3 小時、精力 −20；失敗加刑 60 分、罰款最多 $500、精力 −15 心情 −10；1 小時一次 | `town_jail.sql#act = 'escape' then` |
| 探病 | 心情 +3、精力 −2、好感 +2 | — | 對方心情 +10；同一人 60 分鐘一次 | `town_civic.sql#elsif op = 'visit' then` |
| 繳罰單（9 折） | 錢 −罰單 ×0.9 | — | — | `town_civic.sql#if op = 'pay' then` |
| 潑水 | 心情 +4 | 面對面、他醒著 | 他清潔 −15、心情 −3、好感 −1；30 分鐘一次 | `town_mischief.sql#if act = 'splash' then` |
| 貼「踢我」紙條 | 心情 +5 | 面對面、他醒著 | 他名牌掛「踢我」1 小時、心情 −4、好感 −1；60 分鐘一次 | `town_mischief.sql#elsif act = 'sticker' then` |
| 假裝告白 | 心情 +3 | 面對面、他醒著 | 一半他害羞（他心情 +5、好感 +1）；一半氣炸（他心情 −10、好感 −2、你心情 −2） | `town_mischief.sql#elsif act = 'fakelove' then` |
| 偷零食 | 心情 +6（成功）／−5（被抓） | 面對面、他有零食、你背包未滿 | 55% 被抓：賠他 $60（付到 0）、你心情 −5、他 −2、好感 −3；45% 成功拿到 1 包、你心情 +6、他 −3、好感 −1 | `town_mischief.sql#elsif act = 'snack' then` |
| 拍醜照貼到動態 | 心情 +4 | 面對面、他醒著 | 全鎮看得到；他心情 −5、好感 −2 | `town_mischief.sql#elsif act = 'photo' then` |
| 換掉他的座位 | 心情 +5 | 同在咖啡廳或餐廳裡面 | 他精力 −3、心情 −4、好感 −1 | `town_mischief.sql#elsif act = 'swapseat' then` |
| 按門鈴逃跑 | 心情 +4 | 站在他家門口 | 他心情 −5、好感 −1；睡著的 40% 被吵醒（精力 −5） | `town_mischief.sql#elsif act = 'doorbell' then` |
| 門口擺假便便 | 心情 +4 | 站在他家門口 | 他清潔 −5、心情 −6、好感 −1 | `town_mischief.sql#elsif act = 'fakepoop' then` |
| 丟雞蛋 | 心情 +8、好感 −1 | 站在他家門口 | 他在屋裡才被砸中：清潔 −10、心情 −5 | `town.sql#elsif act = 'egg' then` |
| 煮飯給他 | 錢 −60、心情 +5、好感 +3 | 進了他家、他在屋裡 | 他飽足 +35（好感 ≥30 ×1.3） | `town.sql#if act = 'feed' then if r.money < 60` |
| 幫他洗澡 | 好感 +3 | 進了他家、他在屋裡 | 他清潔 +45（好感 ≥30 ×1.3） | `town.sql#elsif act = 'wash' then t.hygiene` |
| 叫醒他 | 好感 −1 | 進了他家、他睡著 | 叫不醒機率 = min(70%, 25% + (100−他精力)/2 %)，叫不醒擋 3 分鐘；成功他心情 −5；成功後 1 小時內不能再叫 | `town.sql#t.sleeping := false; t.fun := t.fun - 5` |
| 串門子 | 心情 +15、好感 +2 | 進了他家、他醒著 | 他心情也 +15（好感 ≥30 ×1.3） | `town.sql#elsif act = 'visit' then if t.sleeping` |
| 惡作劇 | 心情 +12、好感 −2 | 站在他家門口 | 他心情 −8 | `town.sql#在 ' || tn || ' 家門口放了一個臭屁` |
| 送禮物 | 心情 +5、好感 +4 | 背包有禮物 | 他心情 +20、拿到一份未拆禮物；浪漫個性效果加倍；用手機寄送要運費 $60、你沒有心情加成 | `town.sql#elsif act = 'egg' then` |
| 打擂台 | 精力 −12、飽足 −8、錢 +100＋連勝×50、心情 +15（贏）／−10（輸） | 精力≥15 | 勝負看精力、心情、體能、力量；輸了鼻青臉腫 1 小時、清潔 −10；每小時獎金超過 $600 後只給 25% | `town.sql#elsif act = 'spar' then` |
| 叫醒到門外 | 好感 −1 | 站在他家門口、他睡著 | 叫不醒機率 = min(70%, 25% + (100−他精力)/2 %)，叫不醒擋 3 分鐘；成功他心情 −3、走到門口（精力不補）；成功後 1 小時內不能再叫 | `town_wake_out.sql#t.sleeping := false; t.fun := t.fun - 3` |
| 買禮物 | 錢 −300、心情 +3 | 背包未滿 | 禮物 +1，可送朋友 | `town.sql#n := case item when 'gift' then 300 else 60 end;` |
| 買零食 | 錢 −60、心情 +3 | 背包未滿 | 零食 +1 | `town.sql#n := case item when 'gift' then 300 else 60 end;` |
| 清掉便便 | 錢 +30 | 便便 2 格內、2 小時內 | — | `town.sql#elsif act = 'sweep' then` |
| 打喪屍豬 | 精力 −5、錢 +60～140（打倒時） | 精力≥5 | 牠 3 點血，要在 3 格內；25% 反咬心情 −3；每人每天獎勵最多 $600；打倒 35% 掉生豬肉 | `town_tweaks.sql#if op = 'hit' then` |
| 賣生豬肉 | 錢 +30／塊 | 生豬肉 | — | `town_tweaks.sql#elsif op = 'sell' then` |
| 逛超市 | 心情 +6 | — | — | `town.sql#else r.fun := r.fun + 6; end if;` |
| 道謝 | 好感 +2 | — | 他三天內照顧過你才能謝；他心情 +8 | `town.sql#if act = 'thank' then` |
| 裝潢 | 錢 −300、心情 +8 | 在自家屋裡 | 換屋頂或牆壁顏色 | `town.sql#elsif act = 'paint' then` |
| 溜進去偷飼料 | 錢 −400、精力 −10 | 精力≥10 | 3% 翻到 $3000；45% 賣 $500～900；30% 被追（精力 −15、清潔 −25、心情 −10）；22% 被抓賠 min($1200, 現金)；每天最多 3 次 | `town.sql#elsif act = 'sneak' then` |
| 探監 | 心情 +3、精力 −2、好感 +2 | 對方在牢裡 | 受刑人心情 +10；同一人 60 分鐘一次 | `town_jail.sql#if act = 'visit' then` |
<!-- RULES:END -->

## 按鈕分類（2026-11-17 整理；`GORD`／`TABOF`／`btn(...,g)`）
| 分頁（標籤） | 內含的 g | 內容 |
|---|---|---|
| 置頂 | `pin`／`tip` | 進去・出門（標題右側）、建議下一步（≤2） |
| 生活 | `self`／`eat` | 吃飯、上廁所、洗澡、看電視、睡覺、快速休息／睡覺、吃零食 |
| 地點名（家＝「房子」、他家＝他家名） | `place`／`home`／`friend`（未指定 g 的預設） | 設施動作（含 FAC 吃喝玩樂簽到）、旅人、流動商人、清便便、喪屍豬、佈置裝潢、在他家的動作 |
| 成長 | `train` | 舉重、慢跑、讀書、聊天、許願池 |
| 朋友 | `soc`／`face`／`mis`／`online` | 面對面（紅色＝危險）、惡趣味（紅色左邊條）、線上互動、請客／對練 |
| 玩樂 | `fun` | 其他玩樂（目前幾乎都歸地點頁） |
| 賺錢 | `work` | 職階卡（資訊條）、打工、每日任務板 |
| 移動 | `move` | 走去、車輛上下車、罰單、欠款 |
- 沒有 `TABOF` 對照的 g 一律歸「地點」（`(TABOF[g]||"here")`），不會被藏起來；按鈕 ≤6 個時不分頁。新增按鈕：能指定 g 就指定，設施專屬動作不要指定（預設進地點頁）。

## 減擠版面（2026-11-17，已被上面 ui2 取代大半）
- 手機面板預設 `max-height:30vh`（拉高 70vh）、工具列 `--tb:48px`；實測 390x844 地圖可見約 475px（面板上緣以上，原本約 36vh 面板）。面板按鈕 `min-height:44px`、標題與副標各一行（超出 `…`，完整文字在 `title`），`.poor` 灰掉的按鈕副標（原因）可 2 行。
- 分組標題是按鈕（`button.grp[data-g]`）可收合，狀態存 localStorage `town-gc`（try/catch），預設收合 `mis`、`online`；`tip`（建議下一步）永遠展開。收合只加 `.gh` 隱藏，按鈕仍在 DOM、互動仍是第一層。
- toast 在遊戲中固定在工具列下方（`top:var(--hud)+var(--tb)+8px`），不蓋面板。

## 遊戲平衡（目前數值）
每小時（消耗已 ×2，寵物雞式照顧節奏；`town_tick` 與前端 `tickLocal` 要一致）：醒著飽足 −8、精力 −5、膀胱 −10、清潔 −5、心情 −4；睡覺飽足 −5、膀胱 −7、清潔 −2.4、心情 −1.6、精力 +80。又餓／憋／髒（<20）時心情每小時再 −3。特質／家具倍率照舊疊加。吃飯／大餐的數值見「金錢平衡」；原本的需求量：吃飯 +15、大餐 +20、洗澡 +10、快速休息 +70、咖啡 +50、長椅 +20 精力。凌晨 0～7 點離線視為睡覺並移回家。打工見「金錢平衡」（新台幣，不限時間、不限次數）。物價已對照 2025 台灣。
離線保護：最後動作（`seen_at`）30 分鐘之後的時間，消耗 ×0.4，且需求最低停在 30（2026-11-22 由 15 改 30，讓幾分鐘的短上線不用先處理緊急狀態；睡覺精力回復不打折；上線中自己沒照顧而歸零不受此限）。舊角色第一次上線自然適用，不會全歸零。
歸零後果（只在上線中會發生，`town_tick`）：
- 膀胱歸零：在家 → 弄髒房間（清潔歸零、心情 −15）；在外 → 原地留下便便（表 `town_poops`，存活 2 小時，`town_state` 回傳 `poops`；本人清潔歸零、心情 −25，同地點醒著的人心情 −5）。別人走路線經過便便（距離 <0.6 格，`town_seg_d`）會踩到：清潔 −20、心情 −5、便便消失；走近 ≤2 格可 `act='sweep'`（item = 便便 id）清掉領 €30。膀胱 <20 名牌冒泡「快憋不住」。
- 飽足歸零（醒著）：昏倒，`items.faint` = 1 小時後的時間，期間強制睡著、不能起床；醒來扣 €1500（不夠扣到 0）。
- 清潔歸零：發臭（前端 `stink`），朋友互動好感增加減半（`town.bm` ÷2），剛歸零那次同地點醒著的人心情 −2。
- 心情歸零：`items.sad`，`town_mood` 回 `sad`（薪水 −30%，取代 low 的 −10%，不重複扣；打架 −8、好感 ×0.7），心情回到 ≥20 才解除。
- 同地點別人的心情扣分在 tick 裡走 `town_hit`／`town_apply_hits`（town_state 迴圈結束才套用，避免改到迴圈裡還沒處理的列）。
**時間冷卻（2026-11-16 使用者決定，已取消）**：打工（`town_wk_check` 變成空函式，精力 −25 是自然上限）、設施互動（`town_fac` 的 `cdm := 0`、前端 `FACCD = {}`）、洗澡、電視、快速休息、快速睡覺、咖啡、電影、健身、打擂台、屠宰場、路邊物件、單機遊戲的心情獎勵。**保留**：對朋友的冷卻（扁人、惡作劇、擊掌、訊息、電話、和好等，見「好感與社交互動」）、考駕照 30 分鐘、擂台友誼賽獎金每人 30 分鐘一次、PK 與牢裡放風／越獄冷卻。**防印鈔機（取消冷卻後新增）**：① `town_ecap`（`town.sql`，`town_act` 與 `town_fac` 結尾都呼叫）：靠吃飯、咖啡、快速休息、洗澡、設施互動等「睡覺以外」補的精力，每個台灣日最多 200（`items.ec={d,n}`，約 8 次打工；超過就報「今天靠吃喝休息補的精力已經夠多了」，睡覺不算）；② `town_dcap(r,鍵,上限)`：屠宰場每天最多 3 次（沒錢的人偷飼料輸了也賠不多，不限次數是印鈔機）；單機遊戲心情 +2 每天最多 10 次（`items.dn={d,鍵:次數}`）；③ 其他（郵筒、垃圾桶每天 3 次、噴水池、夾娃娃機、刮刮樂期望值 ≤ 1）本來就不賺錢。街機一天 40 局、押注 €50～€1000（種類與期望值見「街機」）；戰帖最高 €2000；背包上限 20。
營業時間：已取消，所有設施全天營業（`town_closed` 永遠回 null、前端 `HOURS` 為空）；鎮長 `FEATS` 開關仍可關設施。

## 小豬賭場（2026-11-22 階段 A，11-23 改籌碼制；`supabase/town_casino.sql`、實測 `town_casino_test.sql`；位置 `PLACES.casino` `[66,9,5,5]` 門 `(68,14)`，鎮長功能開關 `casino`）
- **押錢遊戲（比大小、輪盤、21 點、骰子、老虎機、賓果、百家樂、射龍門、妞妞）搬進賭場，廣場街機只留猜拳、打地鼠、記憶翻牌與戰帖。** 前端統一呼叫 RPC `town_casino(rid,pin,game,bet,choice)`（`game` 用原本的名稱：`hl_start／hl_guess／wheel／bj_start／bj_hit／bj_stand／dice／slots／bingo／bacc／niu／dg_info／dg_start／dg_play`），它再呼叫 `town_game`／`town_game2`（交易設定 `town.casino=1`）；直接呼叫舊入口玩押錢遊戲會被擋。`town_casino.sql` 開頭的 `do` 區塊**就地修改**正式站目前的 `town_game`／`town_game2`／`town_rent`（不複製整個函式，所以舊電腦改過的版本也能套用，可重複執行）。
- **籌碼制（使用者 2026-11-23 決定）**：進賭場用現金 1:1 換籌碼（`town_casino_state` 的 `buy`），遊戲全部用籌碼押（`town_casino` 在呼叫內部函式前把 `money` 暫時換成籌碼、結束後換回現金），換回現金（`sell`）時抽 1.5%（無條件進位）。手續費一半進鎮基金（`fund_log.casino`）、一半銷毀。籌碼在 `items.cas.ch`，財產稅基礎 = 現金 + 籌碼。**不設預算、不設單注上限、不設每日淨輸上限**，只受籌碼數量限制（妞妞、射龍門仍要有押注 3 倍的籌碼）。（早期版本誤用 `items.cs`，和咖啡集點卡撞名，已由 town_casino.sql 的遷移區塊搬到 `cas`）
- 遊戲本身不再抽 5%：猜拳 ×2；百家樂免佣（莊贏 ×2，但莊以 6 點贏只賠 ×1.5，期望 0.9857）。其他遊戲賠率不動，沿用正式站現況（輪盤 0.90、21 點開局 ×2.5、骰子大小三顆一樣通殺、賓果中 3 ×6／中 2 退本金等，來自舊電腦直接改在正式站的版本，倉庫的 `town.sql`／`town_arcade2.sql` 文字比正式站舊）。
- **籌碼面額與百家樂路單（2026-11-23）**：賭場下注改成面額籌碼（`CHIPD`：50／100／500／1K／5K／1萬／5萬／10萬／50萬／100萬，點籌碼累加、清除、全押，押注用堆疊籌碼顯示）。百家樂結果由 `town_casino` 寫進 `items.cas.bh`（P 閒／B 莊／T 和，最近 72 局），`town_casino`／`town_casino_state` 回傳 `bh`，前端畫珠盤路與大路（`baccBead`／`baccBig`，規則見 town.js 註解，test_casino2.js 有護欄）。
- **賭場防晃動（2026-11-23）**：晃動主因 = `#modal` 垂直置中，面板高度一變整張卡就上下跳；加上 `dealFx` 在牌桌最上面插入又移除「莊家發牌中」、`.felt` 才加框線／內距。修法（town.js 的 chipcss 區塊）：含 `.garea`／`.gmenu` 的視窗靠上對齊、`.gshow` 固定框線與最小高度、`.dealer` 絕對定位浮在牌桌上、`scrollbar-gutter:stable`；百家樂按鈕移到牌桌上方。沒有籌碼時遊戲面板顯示「請先到櫃台換籌碼」。本機驗證用 `tools/town-mock.js`（已加 `town_casino`／`town_casino_state` 假資料：bacc／wheel／dice／slots）。
- **離場強制換回現金、取消休息時間（使用者 2026-11-23）**：`items.cas.ch` 剩下的籌碼在居民 `place` 離開 `casino` 時自動換回現金（1.5% 無條件進位，一半進鎮基金、一半銷毀，動態寫「X 離開賭場，籌碼換回現金 €N（手續費 €F）」；沒籌碼不寫、歸零不重複結算）。用資料表觸發器 `town_casino_leave`（BEFORE UPDATE OF place）統一處理，所以走出去、回家、睡覺、入獄、送醫、離線自動回家等任何改 place 的路徑都涵蓋；刪除居民（踢出鎮）不會結算籌碼。30 分鐘連輸強制休息（冷靜）已取消，無限玩。**自我排除已取消（使用者決定）**，只保留開局間隔 3 秒（防腳本連點）。
- **牌桌精簡與咪牌（2026-11-23）**：進牌桌後標題列一行（遊戲名、籌碼、「規則」鈕），遊戲區第一段說明由 `foldRules` 搬進規則浮層（絕對定位，不推版面）；路單收進摺疊。百家樂與妞妞的發牌改成 `squeezeDeal`：牌一張張蓋著發進來（每張間隔 `SQ_IN`=520ms），按住牌面往上拖慢慢掀（拖遠翻開、放手彈回），不動作會自動一張張翻（最後兩張更慢），「直接開牌」全翻，最多等 25 秒；點數、結果、籌碼數字翻完才顯示。結果在伺服器已決定，咪牌只是前端演出，關掉頁面不影響結算。
- **賭場室內與牌桌 v2（2026-11-23；SQL `supabase/town_casino_fi.sql` **已套用正式站 2026-11-23**，要在 `town_fi.sql`、`town_infac.sql`、`town_casino3.sql` 之後；前端已含 `ROOMS.casino`（12×5、紅地毯暗色，老虎機×3、輪盤、百家樂桌×2、21 點桌、骰寶桌、籌碼櫃台、荷官小莉），舊伺服器不認 casino 時 `NOENTER` 自動退回門口全顯示）**：補丁重建 `town_fi`（白名單加 casino）與 `town_need_in_pl`（加 casino），並用 `pg_get_functiondef` 就地在 `town_casino`／`town_casino_state` 開頭加 `town_need_in_pl(r,'casino')`（已加過就跳過）；`town_casino_leave` 觸發器沒動，離場強制換回現金不變。`town/test.js` 的 town_fi／town_infac 白名單檢查改為扣掉 casino，另比對 `town_casino_fi.sql` 全名單。點室內物件 = 面板「玩輪盤／玩老虎機／玩百家樂／玩21點／玩骰寶／小豬賭場（櫃台）」→ `casinoOpen(遊戲)`（先 `ensureIn`）。牌桌：標題列（遊戲名、籌碼、「換桌」浮層切換 13 款、「規則」）、賠率一行、遊戲區、底部固定下注列 `.betbar`（本局押注堆疊、上局輸贏 `lastWin`、面額籌碼 44px 像素八角、撤銷／同上注／清除／全押，`betHist`／`lastBet`）；換籌碼一鍵不再跳確認，按鈕寫扣多少手續費；走出賭場前端 toast「籌碼換回現金」。開牌加速：`DEAL_MS` 170、`SQ_IN` 240、自動翻牌間隔約減半、咪牌等待上限 12 秒，咪牌與「直接開牌」保留。`tools/visual` 新增 `in-casino`、`modal-casino` 情境（基準圖尚未 `--update`）。
- **發牌臨場感（前端）**：`town.js` 的 `dealFx`（`MutationObserver` 監看 `#gShow`）讓新出現的牌從牌堆滑進來、蓋牌翻面、一張一張發（`DEAL_MS`），結果文字等牌發完才出現，牌桌是綠色呢面、有「莊家發牌中…」與發牌／結果音效；每個畫面只動新的牌（`DEALT` 紀錄），`playGame` 開新一局會清掉；系統設定「減少動態效果」時不做。CSS 在 `town.js` 的 `dealcss`（`index.html` 有 45KB 上限）。
- **階段 B＋C（2026-11-23；`supabase/town_casino2.sql`、實測 `town_casino2_test.sql`、前端護欄 `town/test_casino2.js`）**：`town_casino` 把輪盤、21 點、骰寶、老虎機、基諾、射龍門路由到新函式 `town_cgame`（比大小、百家樂、妞妞仍走 `town_game`／`town_game2`）。期望值（拿回／押注，精確窮舉）：**美式輪盤** 0／00／1～36 共 38 格，外圍 1:1、一打 2:1、單號 35:1，全部 0.9474（`wheel` 的 `choice`：`red／black／odd／even／low／high／d1／d2／d3／n:0／n:00／n:1～n:36`）；**21 點** 莊家軟 17 要牌、天生 21 點 6:5（×2.2）、無加倍分牌，玩家最佳策略 0.9600；**骰寶**（`dice`，`choice`：`big／small／any3／1～6／s4～s17`）大小 0.9722、任意三顆一樣 30:1 0.8611、單點 1／2／3 顆賠 1／2／3 倍 0.9213、總和 4～17 賠 6～60 倍 0.81～0.90；**老虎機** 圖案權重 1／2／3／4／5／5、三個一樣 ×100／30／15／10／7／5、兩個一樣 ×1.2，0.9231；**基諾**（`keno`，取代賓果；1～80 選 5 開 20，中 2 ×1、3 ×3、4 ×16、5 ×200）0.8447；**射龍門改莊家制**（`dg_info／dg_start／dg_play`：沒有入場費、彩池與抽成，可免費放棄，贏的淨賺倍數 `town_dg_m(n)` = 13.6／6.3／3.85／2.65／1.9／1.4／1.05／0.8／0.6／0.45／0.3／0.2，n 是贏的點數個數，撞柱輸 2 倍、龍門同點又撞中輸 3 倍，押注要有 3 倍籌碼，兩張龍門分佈下最佳選擇平均 -3.8%）。舊的彩池函式（`town_pots`、`town_dg_*`）和賓果、舊輪盤／骰子規則留在 `town_game`／`town_game2` 但已經不會被賭場呼叫。改賠率要同步 `town_casino2.sql`、`town.js` 的 `DGM／SLW／SLPAY／KPAY／DSUM／RWHEEL`、`test_casino2.js`。

- **階段 D 四款（2026-11-23；`supabase/town_casino3.sql`、實測 `town_casino3_test.sql`、前端護欄 `town/test_casino3.js`；SQL **已套用正式站 2026-11-23（回滾實測通過：期望值在樣本誤差內、擋規則都擋住、錢不為負；測試的「6 張不重複=false」是腳本運算子優先順序寫錯，非遊戲錯）**，要在 `town_casino.sql`／`town_casino2.sql` 之後，會重建 `town_casino`（只多四款路由）；RPC 路由：`sangong／shiba／pigrace／pj_start／pj_play` → `town_cgame3`）**：期望值（拿回／押注）皆精確窮舉：**三公** 同一副 52 張各 3 張，大三公（三條）＞小三公（三張都是 JQK）＞點數 9～0（A=1、2～9 原點、10JQK=0、加總取個位），同點比最大牌，仍同則平手退注；贏 ×1.95 → **0.9753**。**十八啦** 擲 4 顆，一對＋兩不同＝兩顆和、兩對＝較大對兩顆和、四同通殺最大、三同／全不同重擲（有效 816 種）；贏 ×1.95、平手退注 → **0.9779**。**賽豬** 勝率 30／25／20／13／8／4%（Plackett–Luce 依序抽名次）；單勝賠率 ×3.1／3.8／4.7／7.3／11.8／23.7（= floor(0.95/勝率) 取 1 位，期望 0.930～0.950）、前二名 ×1.7／1.9／2.3／3.4／5.3／10.5（0.929～0.949）；賽道動畫結果由伺服器先決定，`reduced-motion` 直接顯示。**牌九（簡化版）** 32 張（11 種文牌各 2 張＋10 種武牌各 1 張，牌表在 SQL `town_pj_*` 與前端 `PJHALF`），各 4 張分兩墩，墩大小 至尊（丁三＋二四）＞文牌對子＞點數（同點比大牌），墩平手算莊；兩墩皆贏 ×1.75、一勝一負退注、兩墩皆輸輸掉；莊家固定選前墩最大的分法；玩家看牌後選 3 種分法之一（`pj_start` 扣押注並發牌存 `items.pj`、`pj_play` 結算）；C(32,4)=35960 手×莊家 20475 手窮舉，**玩家最佳策略 0.9795**。改賠率要同步 SQL 檔頭、`town.js`（`PIGW／PIGO1／PIGO2／PJ*`）、`test_casino3.js`。

- **階段 E 六款（2026-11-23；`supabase/town_casino4.sql`、實測 `town_casino4_test.sql`、前端護欄 `town/test_casino4.js`；SQL **已套用正式站 2026-11-23（回滾實測通過：各款樣本期望在誤差內、擋規則都擋住、錢不為負）**，順序在 `town_casino3`／`town_casino_fi`／`town_casino_fee` 之後；會重建 `town_casino`（含進館檢查）與 `town_casino_norm`，新遊戲全在 `town_cgame4`）**：期望值（拿回／押注，精確窮舉）：**地雷**（5×5、開局選 1～6 雷、倍率 = 0.97×C(25,k)／C(25−m,k)，任何收手策略 0.97，至少翻 1 格、單筆封頂 21 億；狀態 `items.mn`，開局時有未結束的就擋、`mn_state` 可續玩）；**彈珠台**（12 層二項分佈，低 0.9641／中 0.9574／高 0.9652，表在 SQL `PL_*` 與前端 `PLK`）；**飛行器**（墜毀點 X=97/u，P(X≥m)=0.97/m，收手期望 0.97；倍率 floor(100·exp(0.1·秒)) 上限 1000 倍；狀態 `items.cr`；收手時玩家送自己要的倍率 m'，必須 ≤ 伺服器現在的倍率且 m' ≤ X 才贏，`cr_poll` 發現已墜毀就當場結束（不能看到墜毀再補領之前的倍率）；開局後關頁面算輸、重開覆蓋）；**猜杯子**（×2.88 → 0.96）；**刮刮樂**（獎表 ×2／3／5／10／50／500 機率萬分之 1400／600／330／120／31／1，期望 0.9500，先決定獎項再排盤面，盤面只會有獎項那組三連）；**開寶箱**（5 箱 0／0.5／0.9／1.2／2.2，莊家隨機打開另一箱，保留或換箱期望都 = 0.96；狀態 `items.cx`，`ch_state` 可續）。`town_casino` 的 `v_pend` 加 mn／cr／cx。改賠率要同步 SQL 檔頭、`town.js`（`PLK／SCM／SCP／CHV／mnMult／crM`）、`test_casino4.js`。新增 6 個 12×12 圖示（`g_mn／g_plk／g_cr／g_cp／g_sc／g_ch`），賭場室內加 6 個桌子物件（地雷桌、彈珠台、飛行器、猜杯子桌、刮刮樂機、寶箱桌，點物件開遊戲）。未驗證：SQL 未在 Postgres 跑過（等套用後的回滾實測）、真人手感與音效。
- **手續費再降到 0.5%＋注碼可單顆取消（2026-11-23）**：`supabase/town_casino_fee2.sql`（`town_casino_state` 的 `val::bigint * 15 + 999) / 1000` → `* 5`，`town_casino_leave` 重建；要在 `town_casino_fee.sql` 之後，manifest 標 fee.sql 的 `town_casino_leave` 段被取代）**尚未套用正式站**；`town_casino.sql` 本體與前端文字（1.5% → 0.5%、預估手續費 `Math.ceil(v*0.005)`）已同步。下注列改成「桌上注碼清單」`betChips`：點面額籌碼加一顆（第一次取代預設 50），點桌上某顆 `.chip.u[data-un]` 只取消那顆（44px、短閃後移除），撤銷＝移除最後一顆，全押＝一顆大籌碼，同上注＝上局整排。
- **換回現金手續費 1.5%（2026-11-23）**：`supabase/town_casino_fee.sql` **已套用正式站 2026-11-23**（唯讀確認：`town_casino_state` 含 15/1000、無舊 5/100；`town_casino_leave` 含 15 + 999）。上面各處寫的「5%」以此為準。**正式站實測（每款約 2000 局回滾）**：輪盤、骰寶、老虎機、基諾、三公、十八啦、賽豬、百家樂、妞妞皆在理論值誤差內，無偏離。

## 街機（廣場，`gamesModal`／`town_game`／`town_score`）
- 選單分「賭場」「單機」。賭場共用押注 50～1000、一天 40 局、淨賺 ≥1000 才寫動態、`arcade` 開關；單機不押錢，只有 `town_score`（要在廣場、`arcade` 開著）。
- 牌編碼：`花色*100+點數`（1 黑桃 2 紅心 3 方塊 4 梅花）；只有這一種格式，點數 = 編碼 % 100；舊格式（點數 < 100）的進行中牌局在 `town_game` 開頭退回押注並作廢。比大小比的是點數。花色用像素圖示 `suitS/H/D/C`（不要用文字 ♠，會被 pxify 換成牌圖示）。
- 賠率（2026-11-10 重調：平手不再算輸、贏率提高；期望值 = 拿回／押注，精確機率，21 點為 500 萬手模擬；每款都 ≤ 1）：
  - 猜拳 1.000（平手全退，贏 ×2；對電腦隨機出拳沒有策略可贏）。
  - 比大小 0.972（一樣大退回押注；贏的賠率 = 11.64／贏的點數數，每個選項都 0.972；K 猜更大、A 猜更小按鈕灰掉）。
  - 輪盤 0.950（10 格：銘謝 4、×0.5、×1 三格、×2、×4）。
  - 21 點 0.996（最佳策略；開局 21 點 ×3，莊家同為 21 點平手退回；莊家 17 停牌，無加倍分牌）。
  - 骰子大／小 0.986（三顆一樣退一半，贏 ×2）；單點 0.958（出現 1、2 顆賠 ×2、×3，三顆 ×12）。
  - 老虎機 0.954（6 種圖案，三個一樣 ×40／20／12／10／8／8，剛好兩個一樣 ×1.2）。
  - 賓果 0.958（1～10 選 3、開 5：中 2 個 ×1.5、中 3 個 ×4）。刮刮樂（路邊）0.725 不動。
- **2026-11-18 起街機不限局數**（賭場與單機都不限；`town_score` 心情每次 +2、不再有每天 10 次），押注 50～1000、錢不夠不能下注、現金不變負照舊。
- **第二批三款（SQL **已套用正式站 2026-11-18（回滾實測：樣本小只能看趨勢，閒／莊／和 RTP 1.02／0.97／0.90、射龍門最佳策略 0.91、妞妞 1.03（n=400～500，標準差約 0.05～0.07，皆在理論值誤差內）；彩池 ≥ 0、上限 10 萬超出進鎮基金、彩池不足／現金不足／押注範圍／彩池種子由第一次 `dg_info` 或下注時寫入 3000 都對，連玩 60 局錢不變負；SQL Editor 約 60 秒逾時，測試樣本別加大）**：`supabase/town_arcade2.sql`，在 `town.sql` 之後，RPC `town_game2`；實測 `supabase/town_arcade2_test.sql`，最後 rollback，REPORT）**，期望值皆為精確窮舉（寫在 SQL 檔頭）：
  - 百家樂 `bacc`（無限副牌，每張牌獨立；閒 0.4461／莊 0.4584／和 0.0954）：押閒 ×2 期望 0.9877、押莊 ×1.95 期望 0.9894、押和 ×9 期望 0.8588；和局押閒莊退回押注。
  - **射龍門定案：維持莊家制（使用者 2026-11-23 決定），不再套用彩池版；賭場實際走 `town_casino2.sql` 的莊家制 `dg_*`（見「小豬賭場」階段 B＋C），下面的彩池版（含第六版 `town_arcade2.sql`）僅留作歷史，不要套用。**
  - 射龍門（2026-11-18 **第六版，SQL 尚未套用正式站（第五版已套用）、需重新套用 `town_arcade2.sql`**：彩池 = 玩家輸的錢累積、從 0 開始、沒有系統發錢）`dg_info`／`dg_start`（付入場費 F=50 進彩池，發兩張龍門；相鄰差 1 自動重發、不收費）→ `dg_play`（`bet`＋`choice` in／hi／lo／pass）：pass 只損失入場費；贏 = 從彩池拿 1 倍押注，其中 5%（四捨五入）進鎮基金（`town_fund_add(..,'dg',..)`）、玩家實拿 95%；輸 1 倍、撞 1 柱 2 倍、撞 2 柱（龍門同點且第三張同點）3 倍，輸家付的錢全進彩池。**押注上限 = min(彩池 − 自己剛付的入場費 50, floor(現金/3))**（自己的入場費不能立刻押回來；回傳 `maxBet`／`why` = pot／cash）；可押池 < 50 時只能放棄，前端顯示「彩池太少，等其他玩家輸了才有得賭」。彩池 `town_pots`：每鎮一個、**種子 0、沒有自動加碼**（第五版的 3000 種子、每 10 分鐘 +10%、`last_tick`、倒數都已移除）、上限 100000 超出進鎮基金；一次性遷移 `town_migrations.id='dgpot0'` 把既有彩池歸零（2026-11-18 唯讀查正式站：只有 1 個彩池、餘額 0，所以遷移實際沒有影響）。資金流純玩家對玩家，系統只拿 5% 抽成與超出上限的部分。精確窮舉（145 組非相鄰龍門）：含抽成每單位期望 (1.95W−15)/13（W = 贏的點數個數，同點取較大一邊），W ≥ 8 為正；最佳策略 = W ≥ 8 押到上限、其餘放棄；M = 0.050928、玩的機率 20.69%。**已知風險（使用者選擇不設上限，維持）**：損益平衡單注約 982；最佳策略每手淨：$800 −9.3、$1000 +0.9、$5000 +204.6（回報率 1.189）、$20000 +968.6——看完龍門才下注的聰明玩家期望為正，賺的是其他玩家輸進池的錢；一手最多只能贏走池內餘額，池空時沒得賭；要設上限可改 SQL `town_dg_cap()` 與前端。`town/test_arcade2.js`（由 `town/test.js` 呼叫）重算：$50～$800 淨期望必須為負、不能再有加碼／種子。
  - 妞妞 `niu`（一副 52 張、各 5 張）：不比花色，同級比最大一張點數，連最大牌也同點 = 平手退押注；純贏倍數由贏家牌型決定、輸家付同樣倍數（沒妞與妞 1～6 = 1、妞 7～9 = 2、妞妞 = 3）；**莊家優勢**：玩家沒妞且最大牌 < Q → 無條件輸（照莊家牌型倍數付；莊家無此限制）。精確窮舉：無條件輸 14.02%、平手 2.37%、正常贏 47.93%，回報率 0.9824（= 1 − P(雙方都沒妞且最大牌 < Q)，與倍數表無關；無條件輸若只付 1 倍會是 1.0309 > 1 不可用）；現金要 ≥ 3 倍押注。
- 單機：打地鼠 `whack`（30 秒、最多 40 次出現，上限 40 分）、記憶翻牌 `memory`（16 張，分數 = 100 − (步數−8)×5，上限 100）。最佳分數存 `items.sp[game]`，每次心情 +2、一天最多 10 次（`items.dn.sp`，2026-11-16 取消 5 分鐘冷卻）；排行榜（`renderRank`）直接讀居民的 `items.sp` 顯示前三名。新增單機遊戲：`SOLO` 加一列、`town_score` 的 cap 加上限。
- 實測：`supabase/town_arcade_test.sql`（最後 rollback，結果在錯誤訊息 REPORT；模擬次數別加大，SQL Editor 約 60 秒會 upstream timeout）。SQL 已套用、實測通過（比大小只押「更大」期望 0.85 是原本設計：點數 K 時沒得賠）。

## 交通（第 1 階段：道路與交通工具；第 2 階段規則與罰單，見本節末；第 3 階段事故、保險、維修見本節末）
- 道路：`isRoad` 不變（橫路每 2 格高、中間一條直路 x=16～17）。`isSide` 人行道（路邊的磚）、`isCross` 斑馬線（橫路的 `CWX` 欄、直路的 `CWY` 列）；騎車開車用 `bfs(from,to,veh)` 依成本最短路徑（路上 1、其他 2）。**行人已改成自由走動，不再繞人行道與斑馬線（見「自由走動」）。**`COLS`、建築座標沒動。
- 車行（`place='carshop'`，位置 `[46,10,2,4]` 門 `[46,14]`，在電影院與屠宰場之間，`FEATS` 可關）：`act='vbuy'`（item = bike/moto/car，要在車行）、`mount`（item = 車種，要在屋外、已擁有）、`dismount`。走回自己家（`move` 到 `home:自己`）或 `enter` 會自動下車。
- 資料：`items.veh = {own:[已買的車], k:現在騎的}`（缺值 = 沒有車，絕不重置）。前端 `VEH`／`vehOwn`／`vehOf`，SQL 寫死在 `vbuy` 與 `move`，要一致。在屋裡（`inside`）時 `vehOf` 回 null。
- 價格與油錢（遊戲內價格，非真實台幣）：腳踏車 3000（約 4 天實習生收入）、機車 30000（組長約 3 週）、汽車 90000（2026-11 降價；介於獨棟與豪宅，經理約 2～3 個月）。速度 ×1.5／×2.5／×3（前端走路動畫 `sp=4.5×倍率`，其他人的畫面也依對方有沒有騎車套用）。油錢在 `move` 依曼哈頓距離扣：機車 0.4／格、汽車 1／格、腳踏車 0（一趟約 20 格 = 機車 8、汽車 20）；錢不夠就付到 0 並被迫下車。保養與事故見第 3 階段。
- 畫面：`icons.js` 的 `bike／moto／car`（emoji 🚲🏍️🚗 對照）；`person()` 把車畫在人腳下（汽車畫在人前面），`w.fx` 記左右方向。
- 實測：`supabase/town_traffic_test.sql`（接在 `town.sql` 之後貼上，最後回滾，結果在錯誤訊息 REPORT）。

### 交通第 2 階段：規則、駕照、罰單（SQL 已套用，`town.sql` 的 `town_light／town_traffic／town_ticket` 等，前端 `town.js` 的 `lightG／FINE／licModal／ticketModal`）
- **紅綠燈**：路口 = x 16～17 與橫路列相交。每 12 秒換一次，`lightG(ms,y)` = (floor(ms/12000) + 該組雙線道起始列) % 2（0 東西綠、1 南北綠），SQL `town_light` 同公式，各用自己的時鐘不即時同步。畫在 `drawLights`（每幀）。
- **速限**：鬧區（y 6～16）×2、住宅區 ×2.5（`zoneLim`）；腳踏車 1.5 不受限。
- **兩種模式**（`items.veh.f`，面板按鈕切換）：預設「守規矩」= 紅燈會停（前端 walker 在路口前等）、機車汽車在分區速限內走，不會被開闖燈／超速／不禮讓；「衝」= 全速不等燈，伺服器在 `move` 用「先橫再直」的路線估算違規再擲巡邏機率（簡化估算，不是真實路徑）。
- **駕照**：`items.lic = {moto:1,car:1}`，缺值 = 無照；腳踏車免照。在車行 `act='license'`（item = moto/car，note = 三題答案如 "120"）：機車 800、汽車 1500，三題對兩題過，沒過費用不退、30 分鐘冷卻（`cd.lic`）。答案和題目在 SQL 與 `LICQ` 要一致（機車 1,2,0；汽車 2,0,1）。可以無照上車，被抓才罰。
- **罰單與抓到機率**（金額約為台灣罰款的一半，因為遊戲日收入只有 600～3600；每趟最多 3 張闖燈單）：闖紅燈 腳踏車 300／機車 900／汽車 1350（40%，記 2 點）、超速 600／900（25%，1 點）、沒禮讓行人 1200／1800（35%，2 點；路線上的斑馬線有醒著的步行者）、停在人行道 600／900（30%，1 點；目的地是路邊非路面格）、無照 3000（15%，3 點；走 8 格以上才查）。23～5 點機率 ×0.5。
- **記點與暫停**（2026-11-23 起「溫和調整」：門檻 6 → 10 點、暫停 24 小時 → 6 小時，單檔 `supabase/town_ticket_sus.sql`；**已套用正式站 2026-11-23**，唯讀確認函式內容含 `pn >= 10`、`6 hours`、沒有舊的 `pn >= 6`）：每台灣日累計 ≥ 10 點 → `items.sus` = 6 小時，車被收（下車）、不能上車。**罰單**存 `items.tk = [{id,k,a,at,due,o}]`，開單 24 小時內沒繳 `o=1` 並加罰 50%（`town_tk_tick`，每次 `town_act` 開頭跑），欠款 ≥ 3000 不能上車；`act='paytk'`（item = 罰單 id 或 all）隨時可繳（面板「罰單」按鈕）。事件 kind = `ticket`（開單、繳款、考照沒過、暫停）。
- **第 3 階段預留**：`items.tv = {n,red,spd,yld,sw,nl}` 累計違規次數、`items.tk`、`items.pts`、`items.sus`。
- 實測：`supabase/town_traffic2_test.sql`（接在 `town.sql` 之後貼上，最後回滾）；前端 `node town/test.js` 檢查燈號公式與路口位置。

### 交通第 3 階段：事故、保險、維修（SQL 已套用；`town.sql` 的 `town_crash／town_prem／town_owe`，`town_act` 的 `vfix／vsell／insure／paydebt`；前端 `garageModal／vspd／premOf`）
- **事故**在 `move` 騎車開車時判定（`town_crash`，接在 `town_traffic` 後）。每格機率：機車 0.08%、汽車 0.06%、腳踏車 0.04%，乘「衝」×3、夜間 22～5 點 ×1.5、耗損 ×(1+耗損/50)、無照 ×1.8（沒有天氣系統，只算夜間）。守規矩 20 格約 1.6%，衝約 4.7%。每趟另加耗損：機車 0.1／汽車 0.06／腳踏車 0.05 每格。
- 種類（衝時偏重）：擦撞 65%（車損 8～16、精力 −3）、小車禍 28%（車損 15～30、醫藥費 300～1500、精力 −15、心情 −15、下車並暫停上車 30 分 `veh.lk`）、嚴重 7%（車損 40～60、醫藥費 3000～8000、住院 2 小時 `faint`＋`hosp`＝醒來不再收固定 €1500、車送修 3 小時 `veh.rp`）。35% 機率撞到同在路上、醒著、也騎車的另一人：責任比 = (自己扣分+1)／(雙方扣分+2)，衝 +2、無照 +1，互相依責任賠對方車損，雙方都寫 `crash` 動態；對方只付到錢為 0，不欠款。
- **欠款** `items.db.a`（上限 30000）：付不出就付到 0、剩下記帳，`paydebt` 可分期（item = 金額或 all）；欠 ≥ 5000 不能上機車汽車（腳踏車不受限）。事故次數 `items.ac.n`。
- **保險**（車行 `act='insure'`，item = `車種:險種:天數`，7 或 30 天可疊加；每種車各自一份，`items.ins[車種] = {c:到期, f:到期}`）。費用（7 天／30 天）：強制險 機車 150／500、汽車 300／1000；任意險 機車 400／1400、汽車 900／3000（要先有強制險）。保費倍率 = 1 + 0.05×累計違規（最多 6）+ 0.1×事故次數（最多 4），最高 ×1.8。強制險付醫藥費全額；任意險當場把車修好、自付 20%，並付賠償對方的錢，**無照任意險不賠**。沒強制險醫藥費自付，無照又沒保險 ×1.5。腳踏車沒有保險。
- **維修／折舊**：耗損 `items.veh.w[車種]` 0～100。修車（`vfix`）= 車價 ×15% ×耗損%（機車全壞 4500、汽車 18000、腳踏車 450）。耗損 ≥60 速度 ×0.8、≥85 ×0.6（前端 `vspd`，其他人畫面一樣）。賣車（`vsell`）= 車價 ×60% ×(1 − 耗損/200)，保險一起作廢。
- 前端：車行面板「保險、維修、賣車」開 `garageModal`；上車按鈕顯示車況與保險；有欠款時面板有「事故欠款」鈕；事故動畫 `EV_FX.crash`，動態新 kind = `crash`；圖示 `wrench／shield`。順手修掉走路動畫 `vm` 用 const 又重新賦值的錯。
- 實測：`supabase/town_traffic3_test.sql`（接在 `town.sql` 之後貼上，最後回滾，結果在錯誤訊息 REPORT）。

## 活躍天數等級（SQL 已套用 2026-11-09，實測通過）
- 資料 `items.al = {n:累計活躍天, d:最後活躍台灣日, s:連續天數, lv}`（**注意 `items.ac` 是事故次數，不要混用**）。缺值 = 0，舊角色不回填、從 0 開始；`town_al_touch` 在 `town_state`（每日一次）與 `town_act` 開頭呼叫，當天第一次動作算活躍一天。斷了只是連續天數歸 1，累計與等級不掉。
- 5 級（門檻天／（打工冷卻，已取消、欄位只留著）／背包上限／房租折扣／每日登入禮）：Lv1 新居民 0／10／20／0%／0；Lv2 熟面孔 3／10／24／5%／€30；Lv3 老鄰居 10／9／26／8%／€60；Lv4 鎮上名人 30／8／28／12%／€100；Lv5 小鎮元老 60／8／30／15%／€150。升級送稱號（接在 `items.titles` 後）、寫 `level` 動態；登入禮寫 `luck` 動態。
- SQL：`town_lv_of／town_lv／town_wk_min／town_bag_max／town_rent_pct`，`town_wk_check`、`town_rent`、背包上限（買零食禮物、regift、拆禮物）都讀等級。收到的禮物 `rg` 上限仍是 20。前端 `AL` 表、`alOf／wkLeft／rentOf／alHtml／lvUpModal` 要同步。實測 `supabase/town_level_test.sql`（接在 `town.sql` 之後，最後回滾）。

## 省 token 建議
一個大功能一個對話；先讀這份檔再動手；改字／調數值可用較小的模型；少截圖，優先用 `node town/test.js` 與 SQL 實測。

## 職業升遷與人生願望
資料全存在 `town_residents.items`（缺值用預設，絕不重置）：`works` 累計打工次數、`wish`（`{k,m}`；k = rich/pop/fight/food/work，`none` = 跳過；m = 已達成里程碑數）、`titles` 稱號陣列、`meals` 吃飯／大餐次數。
- 職稱門檻（累計打工）與薪水：實習生 0／€190、員工 10／€260、組長 30／€350、經理 70／€520、主管 150／€800。`town_act` 的 `work` 依職稱發薪、升職寫 `promo` 動態；`cowork` 兩人各拿自己薪水的 2 倍（不計入 works）。前端 `JOBS` 要和 `town_job_lv`／`town_wage` 一致。
- 願望門檻、稱號、獎金（2000／5000／10000）在 SQL `town_wish_ms／town_wish_titles／town_wish_check`，前端 `WISHES`。`town_act` 結尾自動檢查里程碑（發獎金、給稱號、寫 `wish` 動態）；選願望用 `town_wish`（跳過 = k 'skip'；三關達成後可換新願望）。第一次上線沒有 `wish` 就彈出選單。
- 舊角色：`town_migrations` 表記 `career1`，只補一次——`works` 取 `town_events` 裡 kind='work' 的筆數，並送「元老居民」稱號。
- 還沒做：第 6 個願望「社交蝴蝶」（去過所有地點）。

## 個性特質與心情
- 特質存 `items.tr`（2 個代號；`[]` = 跳過；缺值 = 還沒選，第一次上線彈選單，選完接願望選單；選過不能改，跳過後可在「我的人生」再選）。RPC：`town_traits(rid,pin,ks)`。新建角色／搬進來後第一次進遊戲就會彈選單。
- 8 種：foodie 吃貨（吃東西飽足 ×1.3）、athlete 運動家（健身 fit +2、打架／擂台 +5）、social 社交達人（好感增加 ×1.3）、workaholic 工作狂（薪水 +10%）、nightowl 夜貓子（台灣 22～6 點清醒精力每小時少掉 1）、clean 愛乾淨（清潔掉速 ×0.7）、lucky 幸運兒（路上壞事重擲一次、路邊物件好事機率 ×1.33）、romantic 浪漫（送禮心情與好感加倍）。
- 心情不存，由五條需求即時算（SQL `town_mood`、前端 `moodOf`，要一致）：a = 五項平均、m = 最低、fun = 心情。low：a<35 或 fun<20；annoyed：a<55 或 m<20 或 fun<40；happy：a≥75 且 fun≥65 且 m≥40；其餘 normal。
- 心情效果：薪水 +10%／0／−5%／−10%（`town_pay`、前端 `payOf`，整數百分比四捨五入）；打架與擂台力量 +5／0／−3／−8；好感增加 ×1.2／1／0.8／0.7（只放大正數）。好感倍率由 `town_act` 開頭 `set_config('town.bm')` 傳給 `town_bond`。
- 名牌與需求欄用心情圖示（😊🙂😤🥺 對應 `face:*`）。

## 房子與室內（2026-11 起家具自由擺放；SQL 已套用 2026-11-09（先 `town_home.sql` 再 `town.sql`），實測通過；`supabase/town_home.sql`，實測 `supabase/town_home_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- 存在 `items`：`hl` 房子等級（缺值 = 1）、`f` 已買家具與小道具、**`fp` 擺放座標 `[[代號,x,y],…]`**（新）、`fu` 已擺出來的代號清單（`town_fu`／前端 `hasF` 照舊讀它，效果「有擺出來才有效」不變；舊角色的 `fu` 是 9 格陣列帶 `""`，照樣有效）。門口擺飾 `d` 仍是 4 樣上限，與家具無關。
- **舊資料**：沒有 `fp` 的舊角色，`town_fp`／前端 `fpOf` 用舊 9 格 `fu` 換算（格 i → x=1+(i%3)*2、y=1+⌊i/3⌋），`town_migrations` 的 `home1` 一次性寫進 `fp`；沒有家具的人不寫。第一次在新版擺放時 `fu` 會被整理成乾淨的代號清單。**絕不重置、不丟家具。**
- **房間大小**（寬×地板列數，另有第 0 列牆；`HOME_DIM`／SQL `town_home_w/h`）與可放件數（`HOUSES[..][2]`／`town_home_cap`，含家具和小道具）：小屋 6×3／6 件、公寓 8×3／10、獨棟 9×4／15、豪宅 10×4／20。**上限都 ≥ 舊的 4／6／8／9 格，舊家具一定放得下**。升級房子 €20000／€150000／€400000，房間跟著變大。
- 4 級外觀：小屋（免費）、公寓、獨棟、豪宅；地圖外觀在 `buildMap` 的房子迴圈（2 級窗台花盆、3 級煙囪＋圍籬、4 級金屋脊＋門柱）。
- 家具（超市 `town_shop` kind='furn'，買用 `buy` item `f:代號`，每種一件）：好床 €3500 睡覺精力 +90/小時（`town_tick`）、冰箱 €4500 吃飯 €30 且飽足 +48、按摩椅 €6000 快速休息 +100、書櫃 €2500 先佔位、沙發 €4000 看電視心情 +22、電視櫃 €3000 電視冷卻 10 分、地毯 €1000、盆栽 €500。**小道具**（新，一次性購買，純裝飾）：相框 €300、掛畫 €900（這兩個只能掛第 0 列牆）、檯燈 €600、玩具 €400、書堆 €500。SQL 用 `town_fu(r,代號)`，前端 `hasF`、`FURN`，兩邊數值要一致。
- **擺放**：`town_act(act='furn', item='put:代號:x:y' | 'clr:代號')`（要在屋裡）。`put` 同時是擺新的和移動；一格一件；牆上道具（`WALLF`：frame、painting）y 必須是 0、其他 y ≥ 1；超出房間、沒買、格子有東西、超過件數都會被擋，移動已放的不算新增。SQL `town_furn`（獨立函式，`town_act` 只呼叫它）；**舊格式 `set:格:代號`／`clr:格` 已取消**（舊畫面會提示重新整理）。
- **畫面**：前端 `interiorModal(id,sel)`（自己的家可擺、移動、收回、升級；朋友的家「看室內」只能看）＝一張 canvas（`drawHomeEdit`，每格 24px 原圖放大、點格子），點家具選取（黃框）→ 點空格移動，背包的家具點名字 → 點空格放下；選取時空格顯示白點、牆道具只能點牆。面板在家屋裡時標題下也有同一張小畫面（`drawRoom`，共用「走進設施裡面」的格子系統：`roomOf(r)` = 設施裡（`fin`）或自家屋裡（`inside`）；家裡的 `homeRoom` 物件 = `[代號,x,y]` 用 `furnDraw` 畫、`FLAT`（地毯、玩具、書堆）和 `WALLF` 不擋人站、站位 `roomSpots`），點家具就是做對應互動（`HACT`：床 = 睡覺、冰箱 = 吃飯、沙發／電視櫃 = 看電視、按摩椅 = 快速休息），點裝飾或空地開「佈置」。
- **互動動畫**（`HOME_ACT`／`playRoomFx`／`roomFxDraw`，約 1.7 秒）：吃飯 → 走到冰箱前，冰箱開門透光、食物飄；看電視 → 走到沙發坐下（沒有沙發就走到電視櫃前），電視櫃螢幕閃；快速休息 → 坐上按摩椅，震動；快速睡覺／睡覺 → 走到床躺下（`drawRoom` 睡著時一律畫成躺在床上，沒有床就躺地板，飄 Z）。沒有對應家具就在房間中央演、不會卡住。
- **沒家具＝陽春版（2026-11-09，不送基本款、不擋互動、舊角色不扣錢；SQL 已套用（2026-11-16 查 `town_tick` 含 `bedg`），實測 `supabase/town_furnfx_test.sql`）**：在家互動不需要家具，缺對應家具就打折。睡覺：沒好床睡地上，精力每小時 +64（好床 90）、清潔多掉 1／小時、醒來（`wake`、快速睡覺到時）心情 −3，快速睡覺同比例（約 +40，好床 +56）；吃飯：沒冰箱冷食飽足 +32、心情 −3、價格 €60 不變（有冰箱 +48、€30）；上廁所：沒馬桶清潔 −10、心情 −3；洗澡：沒淋浴間水桶，清潔只回 70% 缺口、精力不加（有才回滿 +10）；看電視：沒電視櫃只發呆心情 +6、15 分鐘冷卻（有電視櫃 +15，再加沙發 +7、冷卻 10 分鐘）；快速休息：按摩椅 +100、沙發 +70、都沒有 +50。新家具馬桶 `toilet` €2000、淋浴間 `shower` €3000（超市，`town_home.sql`）。面板按鈕副標寫「沒有冰箱：冷食…」，不灰掉。SQL 在 `town.sql` 的 `town_tick`（`bedg`）與 `town_act` 的 `eat／toilet／shower／tv／nap`；前端 `tickLocal`（`bed`、`hb`）、面板、`FURN`、`HACT`、`furnDraw`；`node town/test.js` 比對。注意：`town_tick` 的睡眠回復也用 `town_fu`，離線睡覺同樣適用。
- 新增家具／小道具：`FURN` 加一列、`furnDraw` 畫圖、`FIC` 背包圖示（emoji → 圖示名）、`town_home.sql` 的 `town_shop` 與（掛牆才需要）`town_furn` 的 `k in (...)`；效果型家具再加進 `HACT`／`HOME_ACT`。`node town/test.js` 會比對房間大小、件數上限、小道具價格、掛牆清單和舊 `fu` 換算。
- 套用順序：`town_home.sql` 先，再 `town.sql`（`town.sql` 的 `furn` 分支呼叫 `town_furn`，只套 `town.sql` 的話擺家具會報錯）。

## 背包與實物購物
- 背包是**讀取層**，不搬舊資料：食物 = `items.snack`、禮物 = `items.gift`（自己買的、可送人）＋`items.rg`（收到未拆的）、服飾 = `w`、家具 = `f`（`fu` 有的算已擺放）、擺飾 = `d`。前端 `bagModal(tab)`／`bagCount`，選單「背包」開。
- `items.rg`：`[{id, from, name, at}]`，上限 20。送禮（`town_act` gift，面對面或寄送）會呼叫 `town_rg_add` 寫進對方 `rg`，對方立刻有 +20 心情照舊；`unwrap` 拆開（40% €10～60、35% 一包零食、其餘心情 +10，寫 `luck` 動態）、`regift` 轉成自己的 `gift` +1（上限 20）。item = 禮物 id。
- 買服飾後前端 `wearOn(id)` 自動穿上（走 `town_login` 換造型，不用 SQL）；買完 `act('buy')` 會彈「已放進背包」與動畫。
- 新增物品種類時：加進 `bagModal` 對應分類與 `icons.js`（家具／擺飾圖示用 emoji → `MAP` 對照）。

## 金錢平衡（2025 台灣物價，新台幣；改數字要前後端＋SQL 一起改）
貨幣：小豬鎮統一用 $（豬幣），見「貨幣」一節；以下數字原本以新台幣物價為基準。物價重整在 `town.sql` 的 `price2025` 遷移：舊居民的錢 ×10（以前一天生活費約 €100、現在約 NT$600）、開著的戰帖押金 ×10、貨幣還是 € 的小鎮改 NT$，只跑一次；新角色起始 2000。
- 每日計數 `items.dc = {d:台灣日期, work, mail, trash}`，SQL `town_dc_get/town_dc_inc`，前端 `workToday/workPct`。
- **打工**（一次 = 一小時）：實習生 190／員工 260／組長 350／經理 520／主管 800（門檻 0／10／30／70／150 次，SQL `town_wage`、前端 `JOBS`）。（SQL 已套用 2026-11-09，實測 `supabase/town_workcd_test.sql` 通過）**不遞減**：每次全額，改用 10 分鐘真實冷卻 `items.cd.wk`（所有打工＋加班共用，`town_wk_check／town_wk_set`，前端 `wkLeft`）；`town_work_pct` 固定回 100、`items.dc.work` 仍累計但不影響薪水。精力是自然上限：公司／加班 −25、咖啡師 −19、服務生 −22、健身教練 −32、店員 −16、拉菲 −25（精力 < 25 不能做公司）。
- **每日房租水電**：小屋 400／公寓 800／獨棟 1500／豪宅 3000（2026-11 調降：原 1800／4000，主管日存才會比經理高）（`town_rent_amt`、前端 `RENT`），每個台灣日第一次登入或動作扣一次，最多扣到 0。
- **吃喝**：在家吃飯 60（有冰箱 30）、餐廳 250、請吃大餐 600、煮飯給朋友 60、咖啡 90、電影 300、外送 200、超市零食 60／禮物 300／寄禮物運費 60、販賣機 30、烤地瓜 60、報紙 20、夾娃娃 30、刮刮樂 100、街頭藝人 50、噴水池 10、裝潢換色 300、清便便領 30、昏倒醫藥費 1500。
- **房子**：公寓 20000／獨棟 150000／豪宅 400000（2026-11 加價，配合打工不遞減）。家具：好床 3500、冰箱 4500、按摩椅 6000、書櫃 2500、沙發 4000、電視櫃 3000、地毯 1000、盆栽 500（全套約 25000，約 1.25 個公寓價；小額消費以可樂 NT$29 為物價錨點，已和台灣實際相近，大額資產是遊戲壓縮比例）。擺飾：花圃 600、信箱 500、路燈 1500、長椅 2000、小樹 1200、小豬雕像 8000。造型：雙馬尾／刺蝟頭 1200、西裝 4500、球衣 1800、洋裝 2400、皇冠 12000、小豬耳朵 800、耳機 3000、圍巾 900。
- **願望**：首富門檻 30000／100000／300000，里程碑獎金 2000／5000／10000。
- **免費錢**：路上撿到 20～100、郵筒 30～90、垃圾桶 20～60（郵筒、垃圾桶每天各最多 3 次）、噴水池許願 1.5% 得 500、拆禮物 40% 得 100～600；擂台獎金 100 + 連勝數×50，每小時超過 600 後只給 25%，友誼賽贏的人 100（每人 30 分鐘一次）；屠宰場守衛 400，3% 得 3000、45% 得 500～900、30% 被追、22% 被抓賠 min(1200, 現金)。
- **街機**：押注 50～1000、一天 40 局；期望值見「街機」一節（猜拳 1.0、比大小 0.972、輪盤 0.95、21 點 0.996、骰子 0.986／0.958、老虎機 0.954、賓果 0.958）；淨賺 ≥1000 才寫動態。戰帖 50～2000。刮刮樂期望 0.725（最大獎 2500）。
- 估算（每天 6 次打工 = 4 全額 + 2 半額 = 4.5 倍時薪；日常開銷 = 房租 + 4 餐×60 = 小屋 590）：實習生 855 收入、小賺約 265；員工 1170；組長 1575；經理 2340；主管 3600（公寓／獨棟日常開銷 840／1440）。依升職節奏，公寓約 14 天、獨棟約 2 個月、豪宅約 5 個月存得到。
- 不動任何人現有的錢（除了一次性 ×10），只對新動作生效。

## 金錢出口：財產稅、鎮基金、奢侈品（SQL 已套用 2026-11-09，實測通過 `supabase/town_sink_test.sql`、補測 `town_sink_test2.sql`（錢不夠不變負、舊角色、薪水不抽基金），接在 `town.sql`、`town_fac.sql` 之後）
- **財產稅**：在 `town_rent`（每台灣日第一次登入或動作，與房租同一次）扣完房租後，現金超過 100000 的部分扣 0.5%（`floor((money-100000)*0.005)`，前端 `taxOf`），記 `items.tx={d,a}`、寫 `rent` 動態，「我的人生」顯示一行。不追溯、不動現有的錢。
- **鎮基金**：`town_towns.fund`（bigint）＋`fund_log`（{rent,tax,lux} 累計），`town_fund_add`。來源：房租 5%、財產稅 100%、奢侈品 5%；**薪水不抽**。鎮長面板顯示餘額與累計流入（`town_mayor` act='fund'）。花基金蓋設施、公告欄尚未做。
- **奢侈品**（`town_fac` 新動作，FEATS 開關 `lux`，不打折、不算常客）：高級套餐 `feast` 3000（餐廳、12 小時，飽足 +40 心情 +30）、溫泉 `spa` 2000（健身房、10 小時，精力 +30 心情 +25 清潔 +40）、旅行 `trip` 8000（廣場、24 小時，心情 +60 精力 −10 飽足 −10）。只給心情，沒有實質累積。

## 生活補助與勤勞獎金（2026-11-10，使用者決定；SQL 實測 `supabase/town_gov_test.sql`、`town_sub_test.sql`，接在 `town.sql`、`town_social.sql`、`town_fac.sql` 之後，最後 rollback）
- **一次性 €20000**：`town_migrations` 的 `gift20k`，所有現有居民 +20000（已跑，不收回）。
- **每日生活補助 €600**：`town_rent`（每台灣日第一次登入或動作）先發再扣房租，**只在現金 < 10000 才發**（有錢人不領，避免躺著賺），寫 `luck` 動態。曾經發過每天 €3000（太高，已改）。日淨收入（含補助）：不工作新手約 +80，打工 3 次約 +1030，6 次約 +2550；組長／經理／主管不打工且沒補助時會賠房租（−800／−1500／−3000），要打工才賺。
- **打工額外好處**：今天累計打工第 3 次 +€500、第 6 次 +€1000（`town_wk_bonus`，在公司與其他打工；加班不觸發；前端公司面板 note 有寫）。
- **突發支出**：`town_rent` 每個台灣日一次，30% 機率、現金 > 10000 時損失 3～8%（上限 6000），寫 `luck` 動態；街上小偷 3～8%、上限 6000（原 500）。都是「相對」現金，不動現有的錢。
- **一起做加成加強**：`town_tg` 每天上限 8 → 12，設施小事件選擇加成心情 +2 → +4、精力 +1 → +2，邀請一起做 +8／+3 → +12／+5；小事件每天上限 8 → 12（`town_social.sql`，`town_fac.sql` 的雙人互動加成同步）。

## 2026-11-16 收入重盤（**SQL 已套用到正式站，2026-11-16 唯讀查 `pg_proc` 確認**：`town_fac` 任務獎金 €500、`town_work_pct` 遞減、`town_tax` 階梯都在；）（使用者按「照這樣改」；SQL 實測 `supabase/town_balance_test.sql`，接在 `town.sql`、`town_fac.sql` 之後，最後 rollback）
- 原因：取消冷卻、任務 ×10 之後，不打工的新手日淨收入約 +2580（任務 2500 + 補助 600 − 房租、吃飯），極限玩家一天可打約 77 次（睡覺每小時 +80 精力，每次 −25）、新手日入約 1.35 萬、主管約 4.8 萬，後期沒有出口。
- **每日任務**：維持每個 €500、全勤 +€1000（一天最多 €2500）。**使用者 2026-11-16 在收入重盤後明確要求維持 ×10**，所以重盤原本建議的 €200／+€400 沒採用；代價：不打工的新手日淨收入約 +2580，注意通膨，打工遞減與財產稅階梯是另外兩條防線。
- **打工遞減回來（不是冷卻）**：每天（台灣日）累計打工，前 12 次全額、13～24 次 50%、之後 10%（`town_work_pct(n)`，n = 今天已打的次數；前端 `workPct`；公司、其他打工、加班都算，`dc.work`）。一般玩家 12 次以內完全沒感覺。
- **財產稅階梯**：`town_tax(m)`：10 萬～100 萬 0.5%、100 萬～500 萬 1%、500 萬以上 2%（前端 `taxOf`）。
- 其他不變：補助 600、勤勞獎金、房租、奢侈品。日淨收入（建議值）：一般玩家（6～12 次）新手約 +3500～4400；極限 77 次新手約 3100、主管約 8900；不打工的新手約 +1080。

## 每小時期望值（粗估，新）
| 來源 | 每小時 |
|---|---|
| 打工（全額、沒有冷卻、精力 −25） | 每打工小時最多 6 次：新手 1140／員工 1560／組長 2100／經理 3120／主管 4800；實際受精力限制，一般玩家約 8 次/天，日存新手約 300、員工 600、組長 600、經理 1300、主管 1600 |
| 郵筒／垃圾桶 | 每天各 ≤ €120／€90，不再是每小時 |
| 屠宰場 | 約 −€25（有錢人）～ 0（沒錢） |
| 擂台 | 超過 €200/小時後 25% |
| 噴水池 | 約 −€0.25/次 |
| 街機 | 猜拳 0、比大小 −3%、輪盤 −5%、21 點 −0.4%、骰子 −1.4%／−4%、老虎機 −5%、賓果 −4% |
| 支出 | 房租水電 €60～300/天、吃飯／咖啡／電影等照舊 |

## 睡眠與進屋
- **在門外叫醒（2026-11-10；SQL 已套用並實測通過：`supabase/town_wake_out.sql`，實測 `town_wake_out_test.sql`：精力 0 時 40 次成功 9 次、成功後 dr=1／醒著／精力不補／心情 −3、失敗只擋 3 分鐘、成功 1 小時內擋住、醒著／已在門口／昏倒／已進屋／不在他家都擋、門口可擊掌）**：獨立 RPC `town_wake_out(rid,pin,target)`。你站在他家門口（沒進屋），他在屋裡睡著 → 「叫醒到門外」：成功率與冷卻和進屋叫醒一樣（25%～70% 叫不醒、叫不醒 `wakefail` 擋 3 分鐘、成功 `wakeup` 1 小時內不能再叫），昏倒／住院中叫不醒。成功後他醒著走到自家門口（`items.dr = 1`），精力不補、心情 −3、好感 −1（走 `town_bond`），記 `items.wo = {f,at}`；他上線時前端 `checkWoken` 彈「X 把你叫醒了」（`localStorage town_wo_<id>`）。**他的最後動作時間 `seen_at` 要重設成現在**（2026-11-10 補：離線很久的人如果不重設，下一次結算（`town_tick`：60 分鐘無動作就回家睡、清掉 `dr`）會立刻又把他送回屋裡睡著，人就不會真的站在門外）。這個補丁已套用到正式站並實測通過（離線 2 小時的人叫醒後再結算一次：醒著、在他家門口 `dr=1`）。之後兩人都在他家門口（同地點），門口面板（他醒著時）直接列出面對面互動（擊掌、聊天、送禮、邀請、扁人、惡趣味，`faceActs`）；離線者 60 分鐘無動作仍會回家睡。「進去叫醒」保留。
- **叫他出來（2026-11-10；SQL 已套用並實測通過：`town_wake_out.sql` 的醒著分支，實測 `town_wake_out_test.sql` 第 7 段：好感約 −6 時 40 次肯 23 次、成功後 `dr=1`／`wo`／最後動作 0 秒前、已在門口擋住、10 分鐘內再喊擋住、不肯出來後 3 分鐘內擋住、4 分鐘後可再喊）**：同一個 RPC `town_wake_out`，朋友**醒著**待在屋裡（離線、或在休息）時，站在他家門口按「叫他出來」：成功率看好感（≥0 九成、−20～0 六成、< −20 三成；好感太差「進去」被擋的人也叫得出來），成功後他站到門口（`dr=1`、`wo`、`seen_at` 重設，不扣好感與心情），成功 10 分鐘一次（事件 `callout`）、不肯出來擋 3 分鐘（`calloutfail`）。之後門口面板列出面對面互動。前端按鈕「叫他出來」（`!vin(r)` 分支、`t.sleeping` 時改顯示「叫醒到門外」）。
- **在家休息的畫面與互動**（前端）：**屋頂只有真的睡著（`sleeping`）的人才飄 Z**（`draw` 住宅迴圈；曾經離線超過 10 分鐘醒著待在家的人也飄 Z，別人看了以為睡著卻沒有「叫醒他」）；離線超過 10 分鐘但醒著的人，面板 note 會寫「離線 N 分鐘，人醒著在家休息」（`offTxt`）。**叫醒他要同時滿足：你已按「進去」（`vin`）、他在屋裡（`inside`）、他真的睡著。**他在屋裡（`inside(t)`）時，點他的頭像只剩「傳訊息」「去他家」，不能面對面互動、打電話、叫外送、送禮、下戰帖；要到他家叫醒他（`wakeup`／`visit`）。伺服器端沒另外擋，之後要擋再補。
- **叫醒與看室內（朋友在家睡覺）**（2026-11-09 修，SQL 已套用到正式站並實測通過：40 次叫醒成功 11／失敗 29、失敗只寫 wakefail 擋 3 分鐘、4 分鐘後可再試、成功後 1 小時內擋住、朋友醒著／在門口／自己不在他家都擋住；`town.sql` 的 `wakeup` 分支，實測 `supabase/town_wake_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）：叫醒要走到他家門口，他在屋裡（沒有 `dr`）才叫得到；成功率 = 1 − min(70%, 25% + (100−精力)/200)（越累睡越沉），面板「叫醒他」按鈕副標寫這次約幾成。**叫不醒的那次寫 `wakefail` 事件，只擋 3 分鐘**；成功叫醒寫 `wakeup` 事件，同一人 1 小時內不能再叫（曾經叫不醒也寫 `wakeup`，被鎖 1 小時而再也叫不醒）。前端：站在朋友家門口、他在屋裡時，面板下方直接顯示他家室內（`roomOf(r,R)` 的 `visit` 室內，只畫屋主：睡著躺在床上、醒著站著，**不畫你自己（你人在門外，不在屋裡）**；點室內開唯讀的「看室內」），「看室內」彈窗也畫出屋主（`drawOwner`）。**`roomOf` 是頂層函式，拿不到 `init()` 裡的 `R`，要由呼叫的人傳居民表**（曾因直接用 `R` 在街上也丟 "R is not defined"，`node town/test.js` 有防呆）。
- **走進朋友家**（2026-11-09 SQL 已套用並實測通過：先 `supabase/town_visit.sql`、再整份 `town.sql`；門口煮飯／洗澡／叫醒／串門子被擋、惡作劇／丟雞蛋／留言可以、屋主在門口或關係 −30 進不去、進去後煮飯洗澡可以、走開或出門清掉 `fv`；實測 `supabase/town_visit_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）：獨立 RPC `town_visit(rid,pin,op,target)`（op = enter／exit），資料 `items.fv` = 屋主 id，**只有「人在 home:屋主 且 fv = 屋主 id」才算在他家屋裡**（SQL `town_vin`、前端 `vin(r)`；缺值＝在門外，舊角色不受影響，和自己家的 `items.dr`、設施的 `items.fi` 互不相干）。進去要：站在他家門口、你沒睡、沒入獄、他在屋裡（`town_inside`）、好感 ≥ −20（太差不讓進）。`town.sql` 的移動、離線回家睡、入獄都會清掉 `fv`；`town_act` 的 `feed／wash／wakeup／visit` 要求 `fv` = 對方，**門口只能留言、放禮物、丟雞蛋、惡作劇、看室內**。前端：門口面板只有「進去」＋門口那幾顆，進去後才有煮飯、洗澡、叫醒、串門子、面對面互動與「出門」；面板下方的室內畫面（`roomOf` 的 `visit`、`inn`）**站門口只畫屋主，進去後才畫你**（`drawRoom` 的 `here` 加上 `vin` 的訪客），進屋的訪客不畫在地圖街上（`frame` 過濾）；朋友互動走到家具旁播動畫（`HOME_ACT` 加 `feed→fridge`、`wakeup→bed`、`visit→sofa`）。
- **睡眠**：恢復量嚴格與睡眠時數成正比（每 15 分鐘一段累加，線上離線都一樣，睡 20／40／60 分鐘 = +26.7／+53.3／+80，好床 90/小時）。`town_tick` 與前端 `tickLocal` 要一致。
- **快速睡覺**（`act='qsleep'`，要在屋裡）：睡 15 分鐘自動醒（`items.qs` = 醒來時間），速率 ×2.5（15 分鐘約 +50、好床 +56），30 分鐘冷卻（`items.cd.qsleep`）；提早按起床就照睡到的時間比例結算。快速休息 `nap` 維持原樣（瞬間 +70、不會睡著）。
- **待機太久回去睡**：最後動作（`seen_at`）60 分鐘後，任何時間都視為回家睡覺（離線 ×0.4 與保底 15 照舊，所以不會便便／昏倒）；半夜 0～7 點仍是 30 分鐘。回來時人在自己屋裡，夜間（22～8 點）或精力 <90 還在睡，否則醒著；**睡著的人白天也不會自然醒**（2026-11-10 SQL 已套用並實測通過 `supabase/town_nowake_test.sql`：台灣白天睡著離線 3 小時、精力 100 仍是睡著；2026-11 取消原本「8～21 點精力 ≥90 自然醒」，睡著就一直睡到朋友叫醒或自己上線按起床，朋友才有機會叫醒他）。
- **進屋**：`items.dr = 1` 表示站在自家門口（SQL `town_inside(r)`、前端 `inside(r)`）；沒有 `dr` 的舊角色視為在屋裡。走到自己家 `move` 會設 `dr=1`，`act='enter'` 清掉、`act='exit'` 設回；離開 `home:` 或半夜離線自動回家睡會清掉。吃飯／廁所／洗澡／電視／睡覺／快速睡／快速休息／家具／升級／裝潢都要在屋裡。朋友的 `feed/wash/wakeup/visit/prank` 要求對方在屋裡（在門口只能留言、放禮物、丟雞蛋）。膀胱歸零：在屋裡才是「弄髒房間」，在門口算路上便便。地圖上在屋裡的人不畫、窗戶亮燈。
- **路上壞事**（`town_tick`）：`place='street'`、醒著、上線中（距 `seen_at` <30 分鐘），每 15 分鐘約 20%（幸運兒 10%）：野狗（精力 −10）、鳥大便（清潔 −15）、大雨（清潔 −10、心情 −8）、小偷（現金 3～8%，上限 €500）、機車擦撞（鼻青臉腫 30 分鐘、心情 −10、精力 −5），寫 `luck` 動態。已有的「走到外面地點 12% 隨機事件」不變。面板在路上會提醒。

## 職階擴大（2026-11-17；SQL **已套用正式站 2026-11-17（回滾實測通過：各階薪水單調、最高 ×1.875、舊角色缺值正常、249→250 得「資深主管」、cafe 79→80 得「咖啡廳領班」、重複不重複給稱號、錢不為負）**：改在 `town.sql`（`town_job_lv／name／wage`、`town_pjob_tier／rafi_tier／wage／name`、`town_rank_title`、`town_act` 的 work／job 分支），套用整份 `town.sql`（順序不變）；實測 `supabase/town_ranks_test.sql`，最後 rollback，結果在錯誤訊息 REPORT，**已跑並通過**）
- 舊職階、門檻、薪水完全不動，只往上加。公司 9 階：…主管 150／800、資深主管 250／920、協理 400／1050、副總 650／1250、總經理 1000／1500（最高 ×1.875 主管）。咖啡師／服務生／健身教練／店員 7 階：累計 0／15／40／80／140／220／350 次，倍率 ~~100／115／130／140／152／165／180%~~ → **100／118／138／160／185／210／240%**（2026-11-22 全部往上調，沒人被降薪；健身教練底薪 €230 → €260，咖啡師 200／服務生 210／店員 195 不變；最高 ×2.4，測試上限同步放寬到 ×2.5；拉菲 10 階不動）（前 3 階名稱「（熟手）（資深）」不變；之後 咖啡廳領班／副店長／店長／區經理、餐廳領班／副理／經理／餐飲總監、健身房領班／副理／經理／區總監、超市領班／副店長／店長／區經理）。拉菲's office（原「拉菲的辦公室」，2026-11-18 改名）10 階：0／15／40／60／80／150／260／400／600／900 次，320／450／650／690／740／840／950／1050／1200／1400（行政專員／企劃／業務經理／資深業務經理／部門主任／協理／業務總監／業務負責人／總經理／董事長）；SQL 在 `town.sql` 並另有單檔 `supabase/town_rafi2.sql`（只含 town_rafi_tier／town_pjob_wage／town_pjob_name／town_place_name，test.js 比對一致；town_act 未改，稱號從第 3 階資深業務經理起給），實測 `town_rafi2_test.sql`（回滾，REPORT）；**單檔 `town_rafi2.sql` 已套用正式站 2026-11-18（回滾實測：10 階薪水單調、≤1500、舊 5 階不變、`town_place_name('rafi')`＝拉菲's office、缺值角色打工 jw=1、59→60 得「資深業務經理」稱號、79→80「部門主任」、899→900「董事長」、已有稱號不重複、錢不為負）**；不要整份重套 town.sql。SQL 字串裡的 `'` 要寫成 `''`。
- 升階寫 `promo` 動態；公司 ≥ 資深主管、其他工作 ≥ 第 4 階（領班等）送同名稱號（`town_rank_title`，不重複）；**沒有一次性獎金**。薪水疊加（個性、心情、事件、前科、智力）沿用，沒重複套。前端 `JOBS／PJT／PJM／PJN／RFT／RFW／pjTier`（`town.js` 頂層），`pjNote` 顯示下一階門檻與薪水；`node town/test.js` 比對 SQL。

## 其他工作與拉菲的辦公室
- `act='job'`，item = cafe／rest／gym／shop／rafi；要在對應地點（咖啡廳／餐廳／健身房／超市／拉菲）、營業時間內（沿用 `town_closed`，經 `town_pjob_key` 對應）、設施沒被鎮長關。SQL `town_pjob_place／key／fx／wage／name`，前端 `PJ／pjWage／pjName`，要一致。
- 每種各自計數 `items.jw[k]`（缺值 0），**疲勞與公司共用 `dc.work`**（換工作不能繞過）；`works`（公司職稱、願望）不受影響，原本「公司」打工照舊。熟練：15 次 ×1.15（熟手）、40 次 ×1.3（資深），升級寫 `promo` 動態。
- 底薪與每次消耗（精力／飽足／心情／清潔）：咖啡師 200（−12／−6／−6／−3）、服務生 210（−14／−3／−8／−8）、健身教練 260（2026-11-22 由 230 調高；−20／−12／−4／−15，體能 +1）、店員 195（−10／−6／−10／−2）；精力不足（< max(15, 消耗)）不能做。
- 拉菲's office（建築名，`place='rafi'`，位置 `[46,17,7,4]` 門 `[49,21]`，全天營業，`FEATS` 可關）：要公司累計打工 ≥ 10 次（員工）；行政專員 320／企劃（15 次）450／業務經理（40 次）650；每次精力 −15、飽足 −8、心情 −18、清潔 −4。
- 實測腳本：`supabase/town_jobs_test.sql`（整段最後 rollback，會把 `town_closed` 暫時改成永遠營業，不留痕跡，結果在錯誤訊息裡）。

## 設施小事件、一起加成、邀請一起做（SQL 已套用（2026-11-09，實測通過）：`supabase/town_social.sql`，要在 `town.sql` 之後）
- **不改 `town_act`**：全是獨立 RPC `town_pevent(rid,pin,op,item)`、`town_invite(rid,pin,op,target)`。實測 `supabase/town_social_test.sql`（最後 rollback，結果在錯誤訊息 REPORT）。
- **設施小事件**：13 個地點（餐廳、超市、咖啡廳、電影院、健身房、公園、廣場、公司、格鬥場、證交所、拉菲、車行、屠宰場）各 3 個事件、2 個選項。文字在前端 `PEV`（`[標題,說明,A,A提示,B,B提示]`），效果在 SQL `town_pe_eff`（`[心情,精力,錢,好感,成功%,失敗心情,失敗精力,失敗錢,失敗好感]`），兩邊順序要一致；新增地點要同步 `town_pe_place`、`PEV`、`JT`。每個賭的選項金錢期望值 ≤ 0、安全選項不給錢，`node town/test.js` 會檢查。
- 流程：前端畫面開著、在設施裡、沒在走路時每 20 秒 `poll`；進地點或超過 5 分鐘沒回報（離線）會重新計時 10～20 分鐘（不累積）；每天（台灣日）最多 8 個；事件 5 分鐘內要選（`pick`），關掉不會重跳（`peSeen`）。資料 `items.pe = {pl,nx,lp,d,n,q}`。好感是對同地點醒著的隨機一人，走 `town_bond`（吃每日上限）。
- **同地點加成**：只在「選事件」與「邀請被接受」時給，`town_tg`：事件 +2 心情／+1 精力（要有別人醒著在同地點），邀請 +8／+3；**每人每天最多 8 次**（`items.tg = {d,n}`），防兩人互刷。地圖：同設施 ≥2 人醒著，名牌加「正在一起」、泡泡 50% 說 `TOGETHER_LINES`（`togetherAt`）。
- **邀請一起做**：設施面板「邀請 X 一起…」（`inviteBtns`，活動文字 `JT`）。`send` 寫進對方 `items.iv = {f,at,p}`，1 分鐘內有效；對方畫面（`checkInvite`，每次 refresh 檢查）彈窗，`yes` 兩人加成＋好感 +1（`town_bond` 吃每日上限）、寫 `joint` 動態；同一對 30 分鐘一次（`items.cd['jt'||id]`）、發邀請對同一人 3 分鐘一次。不動擊掌／扁人／整蠱的冷卻。
- 畫面測試：`tools/town-mock.js` 已加 `town_pevent`／`town_invite` 假回應；瀏覽器會快取 mock.js，改了要在 script 加 `?v=N`。


## 改檔習慣
- 中文 Python heredoc 容易出現編碼錯誤：先寫成 .py 檔，再用 `exec(compile(open(f,encoding="utf-8").read(),"p","exec"))` 執行
- 小改動不用開瀏覽器驗證；邏輯改動才在推上去之後檢查線上版


## 2026-11-17 金錢平衡二（SQL 尚未套用正式站；順序 `town.sql` → `town_fac.sql` → `town_tweaks.sql`，實測 `supabase/town_balance2_test.sql`，純函式不寫資料）
- **打工薪水不遞減、沒有任何次數與收入上限**（使用者決定）：`town_work_pct` 永遠 100、前端 `workPct` 同。覆蓋本檔「收入重盤」「打工遞減」舊說法。
- 出口：財產稅階梯改 5～10 萬 0.3%、10～100 萬 0.8%、100～500 萬 1.5%、500 萬以上 3%（`town_tax`／`taxOf`；存 100 萬每天 7350、500 萬 67350）；特調咖啡 €110→€300（+45 精力 ≈ 1.8 次打工，新手收入 342 剛好打平；主管仍賺但每天稅會吃掉）。
- 喪屍豬打倒 €20～60 → €60～140（3 拳 −15 精力 ≈ 0.6 次打工，平均 €100＋豬肉期望 €10，每精力約 7 元，略低於實習生打工 7.6），一天上限 €600 不變。
- 好感：已無每日上限與冷卻（`town_bond` 取消、`cdLeft` 只留牢裡）；說明文字仍有「每日 +12／−6」的舊段落，以「取消互動限制」節為準。
- 每日任務獎金（€500／+€1000）**沒改**；建議觀察通膨後再降（不打工新手一天 +2500 仍是最大進項）。

## 店員 NPC（2026-11-17，純前端，不動資料庫與數值）
- `town.js` 的 `ROOMS.<地點>.npc=[x,y]`＋`NPCS`／`NPC_LINES`／`npcSay`／`npcModal`：咖啡廳小咪、餐廳阿福、健身房阿力、醫院、警察局、市政廳各一位固定店員，畫在室內（`drawRoom`，不佔玩家站位：`roomSpots` 把 npc 格當擋住），頭上每 9 秒冒 4 秒對話泡泡（依時段、店內人數換句）。點店員（`roomTap`）開 `npcModal`：問候、今日價格（餐廳 250／咖啡 90 乘全鎮事件 `wevK` 倍率；其他地點顯示事件消息）、聽八卦（讀 `S.events` 最近 3 則）。地圖門口沒畫店員、超市沒有室內場景所以沒有店員（之後可補）。

## 流動商人 NPC（2026-11-17；SQL **已套用正式站 2026-11-17（回滾實測通過：不同地點擋、補品／手冊可買、重複買擋、錢不夠擋、商人離開後擋，錢 5000→1500 不變負）**：`supabase/town_npc.sql`，順序在 `town.sql`、`town_stats.sql` 之後；實測 `supabase/town_npc_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- 新表 `town_npcs`（RLS 全關）、RPC `town_npc(rid,pin,op,item)`（view／buy）。每鎮每個台灣日惰性結算一次：9～19 點隨機開始，在廣場或公園待 60～120 分。商品每人每天每種限買 1（`items.np={d,b}`）：特調補品 €1500（心情 +30、清潔 +30）、小豬玩偶 €2500（`items.col` +1，純收藏）、訓練手冊 €2000（隨機一項能力進度 `items.at.p` +2）。只花錢不賺錢、錢不夠擋、不欠款、不會死。
- 前端：`NPCV`／`npcPoll`（每 60 秒）／`npcShop`／`NPCI`；地圖上商人固定畫在廣場（20,12）或公園（33,19）；在同地點時面板出現「找流動商人」。`tools/town-mock.js` 有 `town_npc` 假回應。


## 登入備份（2026-11-17）
- iOS 會清主畫面 web app 的 localStorage，登入鑰匙（`town-mine`，裝置金鑰就是裡面的 `pin`）另存 IndexedDB `town-bk`/`k`/`mine`，只存 `tid,name,rid,pin,me,at`。`index.html` 的 `LP.bk(list)` 寫入（空清單 = 刪除，並嘗試 `navigator.storage.persist()`），`town.js` 的 `saveMine`／`dropMine` 都呼叫它，所以登出、搬離會刪備份、不會被還原。
- 啟動：localStorage 有 `town-mine` 就照舊同步畫首頁（3 秒後補備份）；沒有才讀 IndexedDB，有備份先還原再畫（最多等 700ms），沒備份就立刻畫。首頁主體包在 `main()`。

## 巡警 NPC（2026-11-17，純前端表現）
- `town.js` 畫地圖處（流動商人那段前面）：一位巡警沿第 3 條橫路（`roadRowsAt`）以 1.5 格／秒時間決定位置來回走（所有人畫面同步、不存資料）；騎車開車中的人（`vehOf` 且在走）經過他 1.6 格內，頭上閃紅色驚嘆號。只是提示，罰單、抓人的機率判定仍在伺服器（`town_traffic`），沒改任何數值，沒有 SQL。

## 訪客旅人 NPC（2026-11-17；SQL **已套用正式站 2026-11-17（回滾實測通過：不同地點擋、買藏寶圖 250→350 錢算對、重複擋）**：`supabase/town_traveler.sql`（只新增一個函式、不建表），在 `town.sql` 之後；實測 `supabase/town_traveler_test.sql`，最後 rollback，結果在錯誤訊息 REPORT，要台灣 8～22 點才有旅人）
- RPC `town_traveler(rid,pin,op,item)`（view／pick）：每人每天一位旅人，8～22 點，單日出現在廣場、雙日公園；題目 `hashtext(日期||角色id)%4`：問路、賣藏寶圖（€200，一半挖到 €300，期望 −50）、說故事、請喝一杯（€100）。只動心情與錢、錢不夠擋、不欠款、不會死；`items.vz={d,a}`。前端 `TRV`／`trvPoll`／`TRQ`／`trvTalk`，地圖畫在廣場（14,13）或公園（29,20），同地點面板出現「和旅人聊聊」；題目文字順序要和 SQL 一致。

## 公告欄委託（任務發布者 NPC，2026-11-17；SQL **已套用正式站 2026-11-17（回滾實測通過：不在市政廳擋、未達成擋、達成領 €600（Lv2）且豬肉 −2、重複擋）**：`supabase/town_quest.sql`（只新增一個函式），在 `town.sql` 之後；實測 `supabase/town_quest_test.sql`，最後 rollback，結果在錯誤訊息 REPORT）
- RPC `town_quest(rid,pin,op,item)`（view／claim）：每人每天一個額外委託（`hashtext('q'||日期||id)%3`）：打工今天達 3 次（300×Lv）、交 1 包零食（200×Lv）、交 2 塊生豬肉（300×Lv）；Lv 由 `items.works` 門檻 0／10／30／70／150。要在市政廳交付，`items.qd={d,a}`，**不動每日任務板（仍 $500）**。前端入口：市政廳櫃員（`npcModal` 的「公告欄委託」）。


## 大量事件池（2026-11-17；SQL **已套用正式站 2026-11-17（`b3e2faa`，回滾實測通過：池 320／120／624、C 標題不重複、錢期望 ≤ 0 且不為負、不重複抽、睡覺／入獄被擋）；**修正版 36c1c53 已套用正式站 2026-11-17（回滾實測：A 觸發 502／1000 次、錢平均每次 −1.97、不為負、C 錢期望最大 0、B 抽 5 個並可執行；實測腳本 7c 把選項放錯參數位置，`fpick` item 為空時不報錯也不做事，前端不受影響）**：`supabase/town_pool.sql`，在 `town.sql`、`town_social.sql`、`town_stats2.sql` 之後，可重複執行；實測 `supabase/town_pool_test.sql`，最後 rollback，結果在錯誤訊息 REPORT，**已跑並通過**）
- 取代「只骰 8 種／6 取 1」：文字與效果全由伺服器用模板＋變數產生並回傳，前端只顯示字串（`town.js` 的 `PEV` 只剩地點清單）。獨立 RPC `town_pool(rid,pin,op,target,item)`，不改 `town_act`／`town_world`／`town_pevent`（舊函式保留不用）。
- 三池（id 範圍）：**A 個人突發 320 種**（id 1～320＝40 場景 × 8 開場，op=`luck`，戶外 50%、5 分鐘一次、每天 ≤ 15）；**B 朋友互動 120 種**（id 1001～1120＝40 活動 × 輕鬆／冒險／大膽，op=`draw` 抽 5 個不同活動 → `do` 選一個，面板「隨機互動」開 choiceModal；對方要同地點醒著）；**C 設施情境 624 種**（id 2001～2624＝13 設施 × 6 人物 × 8 情節，每個 2 選項，op=`fpoll`／`fpick`，取代 `town_pevent` 每地點 3 個）。合計 1064。
- **分級表只在一處**：`town_pl_scale`（小 100%／中 170%／大 260%）與 `town_pl_tier`（機率 60／30／10）；基準值在 A 的 `amt` 那段（心情 4、精力 4、飽足 5、清潔 6、錢 25、好感 1）、B 的 `town_pl_bfx`、C 的 `town_pl_arch_e`（情節效果表）。文字在 `town_pl_scenes／open／acts／subj／arch_t`。
- 抽樣：每人最近 20 個 id 存 `items.rc`（缺值＝空）會避開；A 依地點類（街上／公園／廣場）、時段（不合 ×0.4）、運氣（好事 +4%／點）、心情（< 30 好事 ×1.4）加權；C 低心情少抽挑戰／偷看／賭。
- 平衡：錢期望 ≤ 0（A 賺錢場景 2／40 且小額、花錢 3／40；B 只花錢；C 賭局 30%×+100 對 70%×−60）、錢不變負、不欠款、不會死；入獄／睡覺擋；能力只給進度（`town_pl_prog`，沿用 town_stats2：每天合計 ≤ 8、每項 ≤ 5）；好感走 `town_bond`。`node town/test.js` 檢查池大小、格式、錢場景比例。

## 打工動畫（2026-11-17，純前端）
- `town.js` 的 `WORK_FX`／`wkKey`／`wkPlay`：`act()` 在 RPC 成功後、`apply` 前 `await wkPlay`（約 1.8 秒，`busy` 擋重複按；動畫完才更新數值、浮動金額與 toast；無冷卻可連點接續）。公司／共同加班／超市／拉菲在地圖畫（`spawnFx` 的 `wk_desk`／`wk_scan`／`wk_docs`，書桌電腦打字、掃描收銀叮、文件翻頁，結尾 +$）；咖啡廳／餐廳／健身房在室內（`roomFxDraw` 的 `wk_cafe`／`wk_serve`／`wk_lift`）。牢裡勞動仍是 `ROOM_ACT.labor`。新增打工種類要補 `WORK_FX`。未在內建瀏覽器實際看過（窗格 0x0）。


## 登入備份（2026-11-17）
- iOS 會清主畫面 web app 的 localStorage，登入鑰匙（`town-mine`，裝置金鑰就是裡面的 `pin`）另存 IndexedDB `town-bk`/`k`/`mine`，只存 `tid,name,rid,pin,me,at`。`index.html` 的 `LP.bk(list)` 寫入（空清單 = 刪除，並嘗試 `navigator.storage.persist()`），`town.js` 的 `saveMine`／`dropMine` 都呼叫它，所以登出、搬離會刪備份、不會被還原。
- 啟動：localStorage 有 `town-mine` 就照舊同步畫首頁（3 秒後補備份）；沒有才讀 IndexedDB，有備份先還原再畫（最多等 700ms），沒備份就立刻畫。首頁主體包在 `main()`。


## 登入備份（2026-11-17）
- iOS 會清主畫面 web app 的 localStorage，登入鑰匙（`town-mine`，裝置金鑰就是裡面的 `pin`）另存 IndexedDB `town-bk`/`k`/`mine`，只存 `tid,name,rid,pin,me,at`。`index.html` 的 `LP.bk(list)` 寫入（空清單 = 刪除，並嘗試 `navigator.storage.persist()`），`town.js` 的 `saveMine`／`dropMine` 都呼叫它，所以登出、搬離會刪備份、不會被還原。
- 啟動：localStorage 有 `town-mine` 就照舊同步畫首頁（3 秒後補備份）；沒有才讀 IndexedDB，有備份先還原再畫（最多等 700ms），沒備份就立刻畫。首頁主體包在 `main()`。


## 登入備份（2026-11-17）
- iOS 會清主畫面 web app 的 localStorage，登入鑰匙（`town-mine`，裝置金鑰就是裡面的 `pin`）另存 IndexedDB `town-bk`/`k`/`mine`，只存 `tid,name,rid,pin,me,at`。`index.html` 的 `LP.bk(list)` 寫入（空清單 = 刪除，並嘗試 `navigator.storage.persist()`），`town.js` 的 `saveMine`／`dropMine` 都呼叫它，所以登出、搬離會刪備份、不會被還原。
- 啟動：localStorage 有 `town-mine` 就照舊同步畫首頁（3 秒後補備份）；沒有才讀 IndexedDB，有備份先還原再畫（最多等 700ms），沒備份就立刻畫。首頁主體包在 `main()`。


## 帳號救援（Email，2026-11-17；**入口預設關閉**：`index.html` 的 `window.RECOVERY_ON=false` 隱藏首頁「找回我的角色」與選單「帳號救援」。要開啟的前提：SQL 已套用＋Dashboard 設定完成＋有人實際收信驗證成功（需要使用者或測試信箱）；SQL 已於 2026-11-17 套用正式站並回滾實測通過、Dashboard 已設 OTP 6 位 600 秒與範本、SMTP 使用者已存，見 side-session-notes `town-email-design.md`）
- Supabase Auth Email OTP 驗證 Email，JWT 帶去呼叫 `supabase/town_recovery.sql`（`town_recovery_status／bind／unbind／list／claim`，只存 Email SHA-256 雜湊與遮蔽提示，RLS 全關，同鎮一個角色）。實測 `town_recovery_test.sql`（回滾，REPORT）。不動免密碼裝置金鑰與邀請碼；救援成功＝多一把裝置金鑰。
- 前端 `town.js`：`recAsk`（Email→6 位碼）、`recFind`（首頁「找回我的角色」`#cRec`，`LP.want="r"`）、`recBindModal`（選單「帳號救援」`#recBtn`）；錯 5 次鎖 30 分鐘存 localStorage `town-recf`。mock 的驗證碼是 `123456`。
- 上線前提：Dashboard 開 Email OTP（6 位、600 秒）、範本顯示 `{{ .Token }}`、設 Custom SMTP（內建 SMTP 只寄團隊成員）。

## 8-bit 音效與音樂（2026-11-17，純前端）
- `town/sfx.js`（≤12KB，Web Audio 合成，無音檔）由 `index.html` 的 `load()` 在 town.js 後載入（`sfx.js?v=N`，改了跑 `node tools/town-bump.mjs --sfx`）。`SFX.play(name)`、`music(on)`、`vol(0~2)`、`mute(b)`；22 種音效（≤0.4 秒、同名 80ms 去重）、2 首音樂（白天輕快、台灣 20～6 點安靜）。第一次點擊才解鎖 AudioContext，之前靜默；頁面隱藏自動靜音。設定 `localStorage town-snd`，預設音效開、音樂關；選單「聲音」（`sndModal`）有開關、音量三檔、逐一試聽。
- 掛接都在既有入口：`toast`、`spawnFx`、走路 `path.shift`、`wkPlay`、`act` 成功／失敗、`enterRoom`、`lvUpModal`、`zbSet`；彈窗與按鈕點擊音由 sfx.js 自己監聽。呼叫一律 `window.SFX&&…`。**沒有真人聽過**，只以假 AudioContext 驗證不丟錯。

## 點擊即互動（2026-11-17，純前端，無 SQL）
點地圖目標 → `walkTo` 帶 `pendingThen`，走到後自動做；點空地或點別的目標會取消前一個（`walkTo` 開頭消耗 `pendingThen`）。函式 `tapPlace／tapObj／tapNpc／tapConfirm／tapTab`（`town.js`，`arrived` 後面）；資料 `TAP_DEF`（`OBJS` 後面，物件主要動作與花費；`ok:1` 直接做、沒有 `ok` 且有 `cost` 的（夾娃娃 $30、刮刮樂 $100、街頭藝人 $50）先跳確認條 `#tapc`［做］［取消］；餵鴨／餵貓要有零食）。`node town/test.js` 檢查 `TAP_DEF` 涵蓋全部 `OBJS`、價格與 OBJS 說明一致、> $60 一定要確認。
| 目標 | 走到哪 | 到了自動做 |
|---|---|---|
| 路邊物件、噴水池 | 物件旁 | `act('obj')` 主要動作（見 TAP_DEF） |
| 有室內的設施 | 門口（`arrived` 自動進去） | 面板切「地點」頁，不花錢 |
| 公司、拉菲 | 門口 | 面板切「賺錢」頁，不自動打工 |
| 自己的家 | 門口 | 自動進屋 |
| 朋友的家 | 他家門口 | 面板切「地點」頁（進去／叫醒等） |
| 朋友 | 他旁邊 | 選他並切「朋友」頁 |
| 旅人／流動商人 | 旁邊 | 開對話／購買視窗 |
睡著、入獄不自動做。面板會把「擊掌」（點朋友）、「打工…」（公司、拉菲）置頂（`tapHi`）；在自家門口再點家＝出門。**未做**：建議下一步（`nextStep`）還沒改用 `TAP_DEF`；巡警與店員點擊維持原樣。

## 吃喝社交場館升級（2026-11-18，咖啡廳／餐廳／電影院／超市；SQL `supabase/town_venues1.sql` **已套用正式站 2026-11-18（回滾實測 town_venues1_test.sql：拉花／共點／套餐／外帶／情侶座／聊劇情／特價／試吃／點數兌換／常客委託各動作都成功，錢都不為負）**，在 `town.sql`、`town_fac.sql`、`town_pool.sql`、`town_infac.sql` 之後；實測 `town_venues1_test.sql`（回滾，REPORT）**尚未跑**）
- 獨立 RPC `town_venue(rid,pin,act,target,num)`（不改 `town_act`／`town_fac`），前端 `VENACT` 集合的動作 `doFac` 會改打它；按鈕仍由 `FAC` 表產生（`node town/test.js` 比對價格與 SQL）。動作：咖啡廳 `art` 拉花小遊戲（€150，`artModal` 點對時機，num=品質 0～100，精力 15＋品質/4、心情 2＋品質/12、≥80 集點 +1）、`share` 共點一壺（€240，雙方精力 +25 心情 +6 好感 +3）；餐廳 `combo` 套餐 €320（飽足 +50 心情 +16）、`bring` 外帶給朋友 €200；電影院 `seat` 情侶座 €360（雙方心情 +20 好感 +4）、`chat` 聊劇情 €0（雙方心情 +6 好感 +2）；超市 `sale` 特價零食 €42（每天輪替名稱、會員點數 `items.mp` +1）、`sample` 試吃、`mredeem` 滿 10 點換 2 包零食；四間店員都有「常客」（`REG`，依日期輪替）`reg` 常客委託：付 €90／200／280／60、拿 €80／170／240／50，淨 −10～−40、心情 +6。價格走 `town_px`（全鎮事件）與常客折扣（`items.fq`），`sale`／`reg` 不打折。
- 室內：咖啡廳加拉花台、茶壺桌（動畫 `latteart`／`pot`），電影院 `seat`、超市 `mshelf` 動畫，電影院與超市新增店員（小映、阿珍）；室內台灣 19～6 點加暗色疊層（`drawRoom`）。**還沒做**：人多時座位坐滿、每間 ≥12 個專屬事件情節（事件池 C 型仍是通用模板）、餐廳／超市新增物件、視覺基準圖更新。


## 角色密碼登入（2026-11-18；SQL `supabase/town_account.sql` **已套用正式站 2026-11-18（回滾實測 `town_account_test.sql` 全過：初值＝邀請碼、設密碼後邀請碼失效、舊客戶端沒帶 pw 被擋並提示、同組連錯 5 次鎖、鎖定中密碼正確仍放行、全域 30 次限速、鎮長重設與臨時密碼、非鎮長被擋、舊 4 參數函式已刪；第一次測試失敗是測試腳本把 6 字密碼當角色名稱，已修）**；順序：`town.sql` → `town_authfix.sql` → `town_account.sql`（它會刪掉舊 4 參數 `town_device` 並重建 6 參數版；之後若重套 `town.sql`／`town_authfix.sql`，要再套一次這個檔，否則舊版沒密碼檢查的 `town_device` 會回來）
- **新裝置三步＋第 4 步**：① 邀請碼 → ② 選角色 → ③ 輸入密碼 → ④ 設定新密碼（`pinStep`／`newPwStep`，步驟條 `LP.stepBar(4)`；沒設過密碼或是臨時密碼就一定要先設，不能略過，設好才 `enter()`）。**已登入的裝置（有效裝置金鑰）不再詢問**，開 app 直接進城鎮（原本的行為沒動；金鑰失效才走「登入失效」畫面）。
- **密碼**：每個角色都有。還沒設過的初始密碼＝小鎮邀請碼（第 3 步小字提示）；`town_device(tid,invite,rid,key,pw default null,cid default null)`：角色已設密碼 → 必須帶正確 `pw`（沒帶回「這個角色已設密碼，請更新遊戲後輸入密碼」，所以舊客戶端進不來）；沒設密碼 → 邀請碼正確即可。設好後邀請碼就不能再當密碼（`town_acct_pwok` 也禁止密碼＝邀請碼或角色名稱，≥6 字）。前端若偵測到舊 SQL（「Could not find」）會退回 4 參數呼叫，所以前端和 SQL 誰先上都不會壞登入。
- **強制設密碼**：已登入裝置沒有密碼，或密碼是鎮長發的臨時密碼（`temp`）時，進遊戲後 `acctModal(1)` 彈出不能關的視窗（沒有關閉鈕；`acctForce` 讓 `refresh` 在被其他視窗蓋掉時重開）；`town_acct` op：`status／init（第一次設，免舊密碼）／setpw（要舊密碼）／reset（鎮長）`。選單「帳號與密碼」也能改。
- **鎖定**：表 `town_pw_tries(rid,cid,…)`；`cid` = `localStorage town-cid`（前端隨機產生）。同一角色＋同一 cid 連錯 5 次鎖 30 分鐘；同一角色每小時全域錯 30 次限速 10 分鐘；**密碼正確一律放行並清零**；訊息統一「密碼不對」。長隨機裝置金鑰失效不計入（`town_auth`，見 `town_authfix.sql`）。
- **重設**：鎮長面板「重設密碼」（`data-pw`，`op:"reset"`）產生 6 碼臨時密碼，明碼只給鎮長看一次；忘記密碼（要 Email 驗證）＝第 3 步「忘記密碼？」→ `recAsk` → `town_recovery_list`（只留本鎮）→ 選角色 → `town_recovery_reset` 設新密碼並取得金鑰。**「忘記密碼」與選單的「綁定 Email」只在 `window.RECOVERY_ON` 為 true 時出現（預設 false，要等真實寄信驗證成功）；在那之前鎮長重設是唯一重設途徑。**
- 沒有「用帳號密碼登入」入口也沒有自訂帳號名（帳號＝選人物）。`town_accounts(rid,pw,temp,changed_at)`，RLS 全關。

## 登入鎖定規則（2026-11-18；SQL `supabase/town_authfix.sql` **已套用正式站 2026-11-18**，回滾實測 `town_authfix_test.sql`（REPORT）：失效金鑰連打 30 次不鎖、4 碼 pin 錯 5 次才鎖且鎖中正確金鑰可登入、邀請碼錯 19 次不鎖／20 次鎖並回明確訊息、錢不變；一次性解鎖 `town_unlock_once.sql` 已跑，清了 1 個角色、0 個小鎮）
- `town_auth` 先驗憑證：金鑰或舊 pin 對就放行並清零 `fails`／`lock_until`（鎖定中也行）。長隨機金鑰（非 4 碼）失敗**不計次、不鎖**，raise「這台裝置的登入失效了，請重新登入」；只有舊 4 碼 pin 錯 5 次才鎖 10 分鐘（訊息含剩餘分鐘）。`town_device` 整鎮鎖改成邀請碼錯 20 次。
- 前端 `rpc` 認得「登入失效」：`window.__lost` 停掉所有帶 pin 的 RPC、清 `town-mine` 該鎮的 `pin`（保留卡片與備份）、顯示「重新登入」畫面。mock：`sessionStorage.mockLost=1` 模擬失效。

## 比大小狀態鍵修正（2026-11-18；SQL **已套用正式站 2026-11-18（整份 town.sql＋town_hlfix.sql；回滾實測 town_hlfix_test.sql：舊寫法報錯重現、退回押注 1000、hl 已清；居民 26 的 items.hl 已不存在）**；town.sql 已移除舊 4 參數 town_device，test.js 擋 town.sql 的 town_device／town_auth 與單檔不一致）
- 比大小進行中的牌局原本存 `items.hl`，和房子等級 `items.hl` 同鍵：牌局開著時 `town_login`／`town_rent` 讀 `(items->>'hl')::int` 報「invalid input syntax for type integer」，玩家登不進去（H7CE2M 居民 26 實例）。已改存 `items.hlg`（`town.sql`），清理檔 `supabase/town_hlfix.sql`（退回押注、移除物件型 hl），實測 `town_hlfix_test.sql`。套用順序：`town.sql` → `town_hlfix.sql` → `town_account.sql`。

## 2026-11-18 沒收汽車（**已取消，從未執行**）
- 鎮長（使用者）2026-11-23 決定「不沒收車子」：`town_confiscate_car_1118.sql`（以及更早含扣錢的 `town_confiscate_1118.sql`）都已刪除、從未在正式站執行（2026-11-23 唯讀確認居民 26 仍有汽車、機車、腳踏車）。補發 `town_grant_3150_1118.sql`（居民 26 現金 +3150，標記 `grant_3150_1118`）是否已執行，以使用者回報為準。


## 金錢宏觀調控（2026-11-23；SQL `supabase/town_econ.sql`＋`town_econ_sink.sql` **已套用正式站 2026-11-23（兩份回滾實測通過：第 1 天 kt 1.02、16 天上限 1.2、活躍 <3 人凍結、回流基金 100000→33267 並發補差金／慶典／蓋長椅、同天不重複、關閉後係數 1.0；遊艇／莊園／捐款／拍賣會各條件與錢不為負都對）**；實測 `town_econ_test.sql`、`town_econ_sink_test.sql`（回滾，REPORT）；設計與試算見 `tools/econ-sim.py`）
- **自動調節器**（`town_econ_tick`，每個台灣日在 `town_rent` 第一次跑時惰性結算；表 `town_econ`）：依活躍居民（近 3 天上線）的人均現金（含籌碼）、首富占比、窮人比例（<1 萬）調 `kt` 財產稅 0.8～1.2、`kp` 奢侈品價格 0.9～1.2、`ks` 生活補助金額與門檻 0.8～1.3，每天最多 ±2%，起算 1.0；活躍 < 3 人凍結並每天 2% 回到 1.0。係數只乘在之後發生的稅（`town_tax_k`）、補助（`town_econ_sub`／`_thr`）、奢侈品價（`town_econ_px`），不回頭扣錢；變動 ≥ 1% 寫 `world` 動態。**`town_rent`、`town_fac` 是用 pg_get_functiondef 就地改文字（同 town_casino.sql 做法）；重套 `town.sql`／`town_retention.sql`／`town_fac.sql` 後要再套 `town_econ.sql`。**
- **鎮基金週回流**（同一個 tick，每 7 天、活躍 ≥ 3 人、基金 ≥ 3000）：可動用 = 基金 70%：40% 補差金（只發活躍且 `al.n` ≥ 3 的居民，額度 max(0, 2×中位數 − 現金籌碼)，單人 ≤ 補差金 40%，存 `town_econ.pend`，居民下次 `town_rent` 領，14 天沒領退回基金）、30% 全鎮慶典 24 小時、30% 累積到夠就自動蓋下一個建設案（bench2→lamp→gazebo→statue，全蓋完就不扣）。事件 kind `fund`。
- **開關**：`town_flags` 的 `econ` 列（緊急：`insert into public.town_flags(k,v) values ('econ',false) on conflict (k) do update set v=false;`）與每鎮 `town_econ.enabled`（鎮長在選單「小鎮經濟」開關）；關掉 = 係數視為 1.0、不結算、不回流、新出口也擋。報表 `town_econ_view(rid,pin,op)`（view 所有居民、on／off 鎮長）。
- **大額出口**（`town_econ_use(rid,pin,op,item,num)`，op = view／buy／donate／bid）：遊艇 $200,000（稱號「遊艇船長」）、莊園 $600,000（「莊園主人」），價格乘 `kp`，7 成銷毀 3 成進基金；捐款 ≥ $1000 全進基金，累計 1 萬／10 萬／100 萬給稱號，不減稅；每週拍賣會（`town_auction`，台灣週一起算）：一件限量稱號、底價 max(5000, 活躍人均 5%)、加價 ≥ 5%（至少 +500）、出價先托管被超過即退回、週結算得標金進基金。
- 前端：選單「小鎮經濟」（`econBtn` 由 JS 動態插在 `powBtn` 後，因 index.html 已近 45KB 上限）→ `econModal`。奢侈品面板價格仍是固定文字，`kp` ≠ 1 時實際價以伺服器為準（錯誤訊息會寫要多少）。
- 套用：`python3 tools/sql/sql.py apply town_econ.sql town_econ_sink.sql --test town_econ_test.sql --prod`（先 dry-run），實測檔各自貼 SQL Editor 或用 `--test`。

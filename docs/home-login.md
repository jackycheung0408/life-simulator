> 首頁、登入、密碼、鎖定、備份、帳號救援：改首頁或登入流程時讀（從 CLAUDE.md 整段搬出，原文未改）

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

## 登入備份（2026-11-17）
- iOS 會清主畫面 web app 的 localStorage，登入鑰匙（`town-mine`，裝置金鑰就是裡面的 `pin`）另存 IndexedDB `town-bk`/`k`/`mine`，只存 `tid,name,rid,pin,me,at`。`index.html` 的 `LP.bk(list)` 寫入（空清單 = 刪除，並嘗試 `navigator.storage.persist()`），`town.js` 的 `saveMine`／`dropMine` 都呼叫它，所以登出、搬離會刪備份、不會被還原。
- 啟動：localStorage 有 `town-mine` 就照舊同步畫首頁（3 秒後補備份）；沒有才讀 IndexedDB，有備份先還原再畫（最多等 700ms），沒備份就立刻畫。首頁主體包在 `main()`。

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


## 多鎮與邀請（2026-11-26）
- 沒帶 `?t=` ＝首頁：住過的鎮清單（第一顆「回到 XX」）＋加入（邀請碼或連結）＋建立；遊戲內選單「我的小鎮」回首頁；主畫面 web app 只住一個鎮時原本會自動轉回該鎮，現在網址帶 `t=`（含空的 `?t=`）就不轉，所以可以換鎮。
- 邀請：`shareModal`（複製訊息／只複製連結／只複製邀請碼／系統分享 `navigator.share`）；連結 `?t=鎮&i=邀請碼`，`i` 存 sessionStorage `town-inv-<鎮>` 後從網址拿掉。
- localStorage 按鎮分開：`town-shelfn-<鎮>`、`town-shelf-<鎮>-<店>`、`town-recent2-<鎮>`、`town-seen-<鎮>`；`town-ob_`／`town_ups_` 用角色 id（全站唯一）；`town-mine`、`town-tips`、`town-snd`、`town-bet*`、`town-cid` 是跨鎮共用的裝置設定。

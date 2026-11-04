# life-simulator

純靜態網站，推到 main 就由 GitHub Pages 部署：https://jackycheung0408.github.io/life-simulator/

## 三個遊戲
- **人生模擬器**（根目錄）：`index.html`，主要邏輯在 `life.js`、`events.js`、`events2.js`、`story.js`、`foreshadow.js`、`realism.js`；國家資料 `countries.js`、`taiwan.js`；測試 `node tests/life.js`
- **足球員模擬器**（`football/`）：
  - `js/data.js`：國家、聯賽、球會、能力（FACE／DPW 權重、ovr、rateAt、value）
  - `js/events.js`：問答視窗 ask、關鍵時刻、機率動畫、訓練成長
  - `js/career.js`：每季流程 season、轉會、國家隊、同世代球星（STARS、LEGENDS、STAR_BORN）、真實足壇大事（REAL_EV、REAL_WC）
  - `js/ui.js`：畫面、陣容、場上意向、報表
  - `js/home.js`：首頁（玩法、搜尋 picker、捏人、出生年份、存檔與 migrate）
  - 測試：`node football/test/run.js`（pre-push hook 會自動跑，要看到「✅ 全部通過」）
- **小豬鎮**（`town/`）：多人小鎮，詳見下方「小豬鎮」一節

## 規則
- 改 CSS 後確認大括號有配對（曾因多一個 `.ctrl{` 讓後面所有樣式失效）
- 改了 js／css，要把對應 `index.html` 裡所有的 `?v=N` 加 1（快取）
- 舊存檔要能繼續玩；平衡改動用 `football/js/home.js` 的 migrate（SAVE_VER）
- 互動一律用按鈕，不要用超連結
- 球員一律用英文名字
- 要擬真，不要偏袒玩家
- 回覆用繁體中文，簡短
- 改了檔案分工、部署流程或規則，就順手更新這份 CLAUDE.md（使用者不想手動維護）
- Supabase 專案 gerqdagicybtyilihvvm；SQL 放在 `supabase/`

## 改檔習慣
- 中文 Python heredoc 容易出現編碼錯誤：先寫成 .py 檔，再用 `exec(compile(open(f,encoding="utf-8").read(),"p","exec"))` 執行
- 小改動不用開瀏覽器驗證；邏輯改動才在推上去之後檢查線上版

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

## 建議下一步（CTA）統計
`town_cta` 表記錄「建議下一步」的顯示與點擊（`town_track`），鎮長面板用 `town_mayor(act='stats')` 看近 7 天各建議的顯示／點擊／點擊率。前端在 `renderPanel` 顯示時記 show、在按鈕點擊時記 click。

## 路邊物件
`town.js` 的 `OBJS`（座標或綁定地點）＋ `town.sql` 的 `town_obj_near` 與 `town_act` 的 `obj` 分支，兩邊座標、距離（≤2 格）要一致；`town/test.js` 會檢查每個物件都走得到。新增物件要在 `buildMap` 畫圖、`OBJ_FX` 設動畫。目前：自動販賣機、垃圾桶、烤地瓜攤、噴水池、鞦韆、流浪貓、長椅、飲水機、公廁、郵筒、報攤、夾娃娃機、刮刮樂、街頭藝人、池塘餵鴨。

## 貨幣
`town_towns.currency`（鎮長在建鎮或鎮長面板選，`town_currency`），只影響顯示：程式與資料庫字串一律寫 `€`，前端 `pxify` 在畫面文字裡把 `€` 換成 `CUR`。浮動數字等畫布文字要自己用 `${CUR}`。

## 小豬鎮路線圖（使用者已確認，一項一項做，不要同時改同一批檔案）
1. ✅ 已完成：個性特質＋心情（見下方「個性特質與心情」）
2. ✅ 已完成：房子升級＋室內家具（見下方「房子與室內」）
3. 賺錢方式（咖啡廳／餐廳／健身房打工、每日任務板、擺攤賣東西、存款利息）
4. 寵物（寵物店領養、餵食玩耍、離線也會餓、跟在主人旁邊）
5. 購物（食品／服飾／家具／寵物店、每日特價、背包分類）
6. 城市架構（鎮基金抽 5%、鎮長花基金蓋設施、小鎮等級、公告欄；**任何居民都能發起投票事件**，例如「要不要蓋格鬥場？」，24 小時結束，結果寫進動態；鎮長可否決的規則另訂）
每一項都要處理舊角色：不重置、缺欄位用預設、必要時第一次上線彈一次選單。

## 版面與字型
- 像素字型 Cubic 11 只在 11／16.5／22px 清楚，別用其他字級；字距保持 0。
- 手機（≤700px）分四塊：狀態列（`#needs`）、工具列（`#strip` + `.tools`）、地圖（`#stage`）、底部抽屜（`#panel`，有收起鈕）。
- 數值欄只在內容有變時重畫（`lastNeeds`），不要讓它閃。

## 遊戲平衡（目前數值）
每小時：睡覺精力 +20、飽足 −2.5、膀胱 −3.5、清潔 −1.2、心情 −0.8（睡一整晚醒來會餓會憋）；清醒飽足 −4、精力 −2.5、膀胱 −5、清潔 −2.5、心情 −2，又餓／憋／髒（<20）時心情再 −1.5。自然醒要精力 ≥90。吃飯 +5、大餐 +8、洗澡 +4、小睡 +20 精力。凌晨 0～7 點離線視為睡覺並移回家。打工 +€100（1 小時冷卻）。商店價格已 ×2.5。
冷卻（放寬後）：洗澡 10 分、電視 15 分、小睡 30 分、咖啡 30 分、電影／健身 1 小時、打擂台 15 分、屠宰場 1 小時、路上物件 10 分；對朋友：打架 2 小時（格鬥場 30 分）、加班／大餐 2 小時、道謝／和好 6 小時、其他 1 小時。街機一天 60 局、押注 €5～€100；戰帖最高 €200；背包上限 20。
營業時間（台灣）：公司 9–19、餐廳 11–22、超市 8–23、烤地瓜 16–24、咖啡廳 7–21、電影院 12–24、健身房 6–23、格鬥場 10–24；屠宰場全天。

## 省 token 建議
一個大功能一個對話；先讀這份檔再動手；改字／調數值可用較小的模型；少截圖，優先用 `node town/test.js` 與 SQL 實測。

## 職業升遷與人生願望
資料全存在 `town_residents.items`（缺值用預設，絕不重置）：`works` 累計打工次數、`wish`（`{k,m}`；k = rich/pop/fight/food/work，`none` = 跳過；m = 已達成里程碑數）、`titles` 稱號陣列、`meals` 吃飯／大餐次數。
- 職稱門檻（累計打工）與薪水：實習生 0／€100、員工 10／€130、組長 30／€170、經理 70／€220、主管 150／€300。`town_act` 的 `work` 依職稱發薪、升職寫 `promo` 動態；`cowork` 兩人各拿自己薪水的 2 倍（不計入 works）。前端 `JOBS` 要和 `town_job_lv`／`town_wage` 一致。
- 願望門檻、稱號、獎金（200／500／1000）在 SQL `town_wish_ms／town_wish_titles／town_wish_check`，前端 `WISHES`。`town_act` 結尾自動檢查里程碑（發獎金、給稱號、寫 `wish` 動態）；選願望用 `town_wish`（跳過 = k 'skip'；三關達成後可換新願望）。第一次上線沒有 `wish` 就彈出選單。
- 舊角色：`town_migrations` 表記 `career1`，只補一次——`works` 取 `town_events` 裡 kind='work' 的筆數，並送「元老居民」稱號。
- 還沒做：第 6 個願望「社交蝴蝶」（去過所有地點）。

## 個性特質與心情
- 特質存 `items.tr`（2 個代號；`[]` = 跳過；缺值 = 還沒選，第一次上線彈選單，選完接願望選單；選過不能改，跳過後可在「我的人生」再選）。RPC：`town_traits(rid,pin,ks)`。新建角色／搬進來後第一次進遊戲就會彈選單。
- 8 種：foodie 吃貨（吃東西飽足 ×1.3）、athlete 運動家（健身 fit +2、打架／擂台 +5）、social 社交達人（好感增加 ×1.3）、workaholic 工作狂（薪水 +10%）、nightowl 夜貓子（台灣 22～6 點清醒精力每小時少掉 1）、clean 愛乾淨（清潔掉速 ×0.7）、lucky 幸運兒（路上壞事重擲一次、路邊物件好事機率 ×1.33）、romantic 浪漫（送禮心情與好感加倍）。
- 心情不存，由五條需求即時算（SQL `town_mood`、前端 `moodOf`，要一致）：a = 五項平均、m = 最低、fun = 心情。low：a<35 或 fun<20；annoyed：a<55 或 m<20 或 fun<40；happy：a≥75 且 fun≥65 且 m≥40；其餘 normal。
- 心情效果：薪水 +10%／0／−5%／−10%（`town_pay`、前端 `payOf`，整數百分比四捨五入）；打架與擂台力量 +5／0／−3／−8；好感增加 ×1.2／1／0.8／0.7（只放大正數）。好感倍率由 `town_act` 開頭 `set_config('town.bm')` 傳給 `town_bond`。
- 名牌與需求欄用心情圖示（😊🙂😤🥺 對應 `face:*`）。

## 房子與室內
- 存在 `items`：`hl` 房子等級（缺值 = 1）、`f` 已買家具、`fu` 擺放（9 格陣列，空格 `""`）。門口擺飾 `d` 仍是 4 樣上限，與家具無關。
- 4 級：小屋（免費，4 格）、公寓 €1500（6 格）、獨棟 €5000（8 格）、豪宅 €15000（9 格）。`town_act` 的 `upgrade`；前端 `HOUSES`；地圖外觀在 `buildMap` 的房子迴圈（2 級窗台花盆、3 級煙囪＋圍籬、4 級金屋脊＋門柱）。
- 家具（超市 `town_shop` kind='furn'，買用 `buy` item `f:代號`，每種一件，要擺出來才有效）：好床 €600 睡覺精力 +26/小時（`town_tick`）、冰箱 €500 吃飯 €5 且飽足 +48、按摩椅 €700 小睡 +40、書櫃 €400 先佔位、沙發 €350 看電視心情 +22、電視櫃 €450 電視冷卻 10 分、地毯 €150、盆栽 €120。SQL 用 `town_fu(r,代號)`，前端 `hasF`、`FURN`，兩邊數值要一致。
- 擺放：`town_act(act='furn', item='set:格:代號' | 'clr:格')`，數量上限看等級。前端 `interiorModal(id)`：自己的家可擺、可升級；朋友的家（面板「看室內」）只能看。

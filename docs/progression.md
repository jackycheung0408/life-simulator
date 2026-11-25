> 等級、職階、個性、背包、成就、賽季、主線、新手引導：改長期目標時讀（從 CLAUDE.md 整段搬出，原文未改）

## 活躍天數等級（SQL 已套用 2026-11-09，實測通過）
- 資料 `items.al = {n:累計活躍天, d:最後活躍台灣日, s:連續天數, lv}`（**注意 `items.ac` 是事故次數，不要混用**）。缺值 = 0，舊角色不回填、從 0 開始；`town_al_touch` 在 `town_state`（每日一次）與 `town_act` 開頭呼叫，當天第一次動作算活躍一天。斷了只是連續天數歸 1，累計與等級不掉。
- 5 級（門檻天／（打工冷卻，已取消、欄位只留著）／背包上限／房租折扣／每日登入禮）：Lv1 新居民 0／10／20／0%／0；Lv2 熟面孔 3／10／24／5%／€30；Lv3 老鄰居 10／9／26／8%／€60；Lv4 鎮上名人 30／8／28／12%／€100；Lv5 小鎮元老 60／8／30／15%／€150。升級送稱號（接在 `items.titles` 後）、寫 `level` 動態；登入禮寫 `luck` 動態。
- SQL：`town_lv_of／town_lv／town_wk_min／town_bag_max／town_rent_pct`，`town_wk_check`、`town_rent`、背包上限（買零食禮物、regift、拆禮物）都讀等級。收到的禮物 `rg` 上限仍是 20。前端 `AL` 表、`alOf／wkLeft／rentOf／alHtml／lvUpModal` 要同步。實測 `supabase/town_level_test.sql`（接在 `town.sql` 之後，最後回滾）。

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

## 背包與實物購物
- 背包是**讀取層**，不搬舊資料：食物 = `items.snack`、禮物 = `items.gift`（自己買的、可送人）＋`items.rg`（收到未拆的）、服飾 = `w`、家具 = `f`（`fu` 有的算已擺放）、擺飾 = `d`。前端 `bagModal(tab)`／`bagCount`，選單「背包」開。
- `items.rg`：`[{id, from, name, at}]`，上限 20。送禮（`town_act` gift，面對面或寄送）會呼叫 `town_rg_add` 寫進對方 `rg`，對方立刻有 +20 心情照舊；`unwrap` 拆開（40% €10～60、35% 一包零食、其餘心情 +10，寫 `luck` 動態）、`regift` 轉成自己的 `gift` +1（上限 20）。item = 禮物 id。
- 買服飾後前端 `wearOn(id)` 自動穿上（走 `town_login` 換造型，不用 SQL）；買完 `act('buy')` 會彈「已放進背包」與動畫。
- 新增物品種類時：加進 `bagModal` 對應分類與 `icons.js`（家具／擺飾圖示用 emoji → `MAP` 對照）。

## 職階擴大（2026-11-17；SQL **已套用正式站 2026-11-17（回滾實測通過：各階薪水單調、最高 ×1.875、舊角色缺值正常、249→250 得「資深主管」、cafe 79→80 得「咖啡廳領班」、重複不重複給稱號、錢不為負）**：改在 `town.sql`（`town_job_lv／name／wage`、`town_pjob_tier／rafi_tier／wage／name`、`town_rank_title`、`town_act` 的 work／job 分支），套用整份 `town.sql`（順序不變）；實測 `supabase/town_ranks_test.sql`，最後 rollback，結果在錯誤訊息 REPORT，**已跑並通過**）
- 舊職階、門檻、薪水完全不動，只往上加。公司 9 階：…主管 150／800、資深主管 250／920、協理 400／1050、副總 650／1250、總經理 1000／1500（最高 ×1.875 主管）。咖啡師／服務生／健身教練／店員 7 階：累計 0／15／40／80／140／220／350 次，倍率 ~~100／115／130／140／152／165／180%~~ → **100／118／138／160／185／210／240%**（2026-11-22 全部往上調，沒人被降薪；健身教練底薪 €230 → €260，咖啡師 200／服務生 210／店員 195 不變；最高 ×2.4，測試上限同步放寬到 ×2.5；拉菲 10 階不動）（前 3 階名稱「（熟手）（資深）」不變；之後 咖啡廳領班／副店長／店長／區經理、餐廳領班／副理／經理／餐飲總監、健身房領班／副理／經理／區總監、超市領班／副店長／店長／區經理）。拉菲's office（原「拉菲的辦公室」，2026-11-18 改名）10 階：0／15／40／60／80／150／260／400／600／900 次，320／450／650／690／740／840／950／1050／1200／1400（行政專員／企劃／業務經理／資深業務經理／部門主任／協理／業務總監／業務負責人／總經理／董事長）；SQL 在 `town.sql` 並另有單檔 `supabase/town_rafi2.sql`（只含 town_rafi_tier／town_pjob_wage／town_pjob_name／town_place_name，test.js 比對一致；town_act 未改，稱號從第 3 階資深業務經理起給），實測 `town_rafi2_test.sql`（回滾，REPORT）；**單檔 `town_rafi2.sql` 已套用正式站 2026-11-18（回滾實測：10 階薪水單調、≤1500、舊 5 階不變、`town_place_name('rafi')`＝拉菲's office、缺值角色打工 jw=1、59→60 得「資深業務經理」稱號、79→80「部門主任」、899→900「董事長」、已有稱號不重複、錢不為負）**；不要整份重套 town.sql。SQL 字串裡的 `'` 要寫成 `''`。
- 升階寫 `promo` 動態；公司 ≥ 資深主管、其他工作 ≥ 第 4 階（領班等）送同名稱號（`town_rank_title`，不重複）；**沒有一次性獎金**。薪水疊加（個性、心情、事件、前科、智力）沿用，沒重複套。前端 `JOBS／PJT／PJM／PJN／RFT／RFW／pjTier`（`town.js` 頂層），`pjNote` 顯示下一階門檻與薪水；`node town/test.js` 比對 SQL。

## 其他工作與拉菲的辦公室
- `act='job'`，item = cafe／rest／gym／shop／rafi；要在對應地點（咖啡廳／餐廳／健身房／超市／拉菲）、營業時間內（沿用 `town_closed`，經 `town_pjob_key` 對應）、設施沒被鎮長關。SQL `town_pjob_place／key／fx／wage／name`，前端 `PJ／pjWage／pjName`，要一致。
- 每種各自計數 `items.jw[k]`（缺值 0），**疲勞與公司共用 `dc.work`**（換工作不能繞過）；`works`（公司職稱、願望）不受影響，原本「公司」打工照舊。熟練：15 次 ×1.15（熟手）、40 次 ×1.3（資深），升級寫 `promo` 動態。
- 底薪與每次消耗（精力／飽足／心情／清潔）：咖啡師 200（−12／−6／−6／−3）、服務生 210（−14／−3／−8／−8）、健身教練 260（2026-11-22 由 230 調高；−20／−12／−4／−15，體能 +1）、店員 195（−10／−6／−10／−2）；精力不足（< max(15, 消耗)）不能做。
- 拉菲's office（建築名，`place='rafi'`，位置 `[46,17,7,4]` 門 `[49,21]`，全天營業，`FEATS` 可關）：要公司累計打工 ≥ 10 次（員工）；行政專員 320／企劃（15 次）450／業務經理（40 次）650；每次精力 −15、飽足 −8、心情 −18、清潔 −4。
- 實測腳本：`supabase/town_jobs_test.sql`（整段最後 rollback，會把 `town_closed` 暫時改成永遠營業，不留痕跡，結果在錯誤訊息裡）。

## 新手引導與 PWA（2026-11-24，前端 v362；SQL `supabase/town_onboard.sql` **已套用正式站 2026-11-24**，實測 `town_onboard_test.sql`）
- 全新角色（`enter()` 的 `fresh`）第一次進遊戲：`obIntro` 4 格開場 → 個性 → 願望 → 能力 → 提示 → 底部任務條 `#obbar`（`obTick` 每 2.5 秒；5 步：超市買零食／咖啡廳／打工／點一位鄰居／回家睡，按鈕加 `.obhl` 高亮）。進度 `localStorage town-ob_<id>`={d:[已完成步],sk,fin}；選單「新手引導」重看。獎勵 RPC `town_onboard(rid,pin,step)` 每步一次共 $1300（`items.ob.s`）；SQL 沒套用時只 toast 不給錢。舊角色不觸發。
- PWA：`pwa.js`（town.js 結尾延後載入，改了要把那行 `pwa.js?v=` 加 1）：iOS Safari 非 standalone 顯示三步橫幅、Android `beforeinstallprompt` 安裝鈕、可永久關閉（`town-pwa-x`）、standalone 時 `storage.persist()`。`sw.js` 快取名 v7：`offline.html` 像素離線頁、CDN 字型快取優先。manifest 加 id／shortcuts。
- 套用：`python3 tools/sql/sql.py apply town_onboard.sql --test town_onboard_test.sql --prod`

## 長期目標批 1：成就系統（2026-11-24，前端 v365；SQL `supabase/town_goal.sql` **已套用正式站 2026-11-24（成就已上線）**，實測 `town_goal_test.sql`（回滾，REPORT），在 `town.sql`、`town_fac.sql`、`town_casino4.sql` 之後；設計稿見 side-session-notes `long-goals-design.md`）
- 使用者決策：主線不給錢；賽季造型只限當季；賽季賭神榜要（只算淨贏、每日上限）；四批獨立上線（成就→圖鑑→賽季→主線）。本批只做成就與共用掛鉤。
- **計數器放獨立表**（不放 `items.ach`，避免和動作函式整列回寫互蓋）：`town_ach_c(rid,k,n)`、`town_ach_u(rid,u,k,nw)`（解鎖階數、已領階數、待 toast）。來源三條：① `town_events` AFTER INSERT 觸發器 `town_goal_ev`（kind／msg 對應，整段 exception 吞掉，不影響遊戲）；② `town_goal_hook(r,'act'|'fac',act)` 補丁在 `town_act`／`town_fac` 的 `town_ecap` 後（睡覺、洗澡、坐下、凌晨上線每日一次）；③ `town_goal_casino` 補丁在 `town_casino` 的 `v_delta := ...` 後（局數、款式、單次拿回 ≥5000／10 萬、累計下注）。**圖鑑、賽季、主線之後也從 `town_goal_hook` 進，不用再碰 town_act。** 就地補丁找不到錨點整檔失敗、已補過略過；重套 `town.sql`／`town_fac.sql`／`town_casino*.sql` 後要再套本檔。
- 80 個成就全在 `town_ach_def()`（六類 16／14／12／14／12／12，共 190 階；src：`c:` 計數器、`i:` items 路徑、`@` 特殊讀取）。**與設計稿的差異**：需要新計數器但難掛的（旅人／商人／委託次數、地點、NPC、股票買賣次數、拍賣、賭場連勝類）改成讀取層或次數型（例：股票大戶＝持股數、出手闊綽＝累計下注、贏面＝拿回大於 0 的次數）；「圖鑑 50／80／100%」改成「成就新手／達人／大師」（成就階數 30／80／150）。**造型獎勵批 1 不發**（留待圖鑑批）。
- RPC `town_ach(rid,pin,op,id)`：`view`（算新解鎖、回清單與 new）／`claim`（鎖列領下一階：多階 銅＝零食 1 包、銀＝稱號「名稱・銀」、金＝稱號「名稱・金」；單階＝稱號＋零食，背包滿只給稱號）／`seen`。不給錢、能力、精力；計數上限 9999（下注累計 100 億）。老玩家讀取層成就上線即解鎖，前端只彈一則合併 toast；賭場等計數器從 0 開始。
- 前端：選單「🏆 成就」→ `achModal`（六分頁、徽章方塊、進度條、領取鈕）、`achPoll` 每 60 秒＋進遊戲 7 秒後（SQL 沒套用時偵測 404 就停）；`UT.hit("ach:*")`；mock 有 `town_ach`；視覺情境 `modal-ach`。`node town/test.js` 檢查 80 個／六類數量／門檻遞增／名稱不重複／計數器有來源／觸發器 exception／RPC 不碰錢與能力／錨點／前端／manifest。
- 套用：`python3 tools/sql/sql.py apply town_goal.sql --test town_goal_test.sql --prod`（含 trigger 與就地補丁，先 dry-run）。

## 長期目標批 3：賽季（2026-11-24，前端 v379；SQL `supabase/town_season.sql` **已套用正式站 2026-11-24（回滾實測通過：積分封頂防壟斷、結算冪等、頒獎、領獎、圖鑑絕版格）**，實測 `town_season_test.sql`（回滾，REPORT），在 town_goal／town_dex／town_meet／town_fix_rest／town_casino 之後）
- 台灣月份一季，惰性結算（`town_season` 每次呼叫先補算上季、補開季與剩 7 天公告，動態 kind `season`）。積分五項各自封頂：打工（每日最多計 40 次）÷2 上限 80、賭神（`town_casino_log` 每日淨贏最多計 5 萬，每 1000 籌碼 1 分，≥20 局，上限 80）、揪團（每日最多計 3 次）×15 上限 90、街機（打地鼠＋翻牌÷2 的本季最高）上限 90、成就（本季新解鎖階數）×2 上限 60；門檻 30 分；活躍（≥30 分）≥3 人才發名次獎：前三名稱號＋當季限定造型＋零食，其餘達標者參與稱號＋零食，不給錢。上限常數在 `town_season_caps()`，前端 `SEA_CAP`，test.js 比對。
- 表 `town_season_score`（含 `k@日期` 每日計數列）、`town_seasons`；造型 `s2611` 楓葉髮飾、`s2612` 聖誕帽、`s2701` 煙火髮箍（town_shop unlock='season'，買不到，領獎寫進 items.w，圖鑑標「已絕版」不計核心）。新增一季：`town_season_def` 加一列＋town_shop＋WEAR／drawChar。就地補丁 town_goal_hook／town_meet_settle／town_score／town_ach_check／town_dex_list；重套那些檔後要再套本檔。
- 前端：選單「賽季」`seasonModal`、榜單最上方「本季」、領獎彈窗 `seaAward`（`seasonPoll` 每 5 分鐘）、歷史賽季。試算（11 月現有資料近似）：每人打工都封頂 80，差別在街機／成就／揪團，沒有一人壟斷。

## 成就數字修復（2026-11-24；SQL `supabase/town_fix_numbers.sql`＋實測 `town_fix_numbers_test.sql`，**已套用正式站 2026-11-24（回滾實測通過；成就計數器回填 87 列）**，在 `town_goal.sql`、`town_bj2.sql` 之後；前端 v369 已上線）
- 打工達人＝`works`＋`items.jw` 加總、升官＝公司與各工作職階取最高；賭場「贏」改單局淨贏（多步驟遊戲用 ach_c `cacc` 記押注，結算判定），出手闊綽＝累計下注 `cwag`；`town_goal_casino` 改 5 參數；faint 只計「倒下了」、hospital 只計看診、luck 排除補助／登入禮等、jail 加「抓回監獄」（越獄失敗、刑期滿不計）；事件規則集中在 `town_goal_ev_k`（觸發器與回填共用）；能力者 20／28／36、單項專精 6／7／8、全能 3／5／8。
- 一次性回填 `town_goal_backfill()`（`town_migrations` `ach_backfill1`）：事件型與賭場局數／款式／累計下注整批重算，睡覺／洗澡／坐下／夜貓與單局淨贏類無歷史、從 0 起算；不給獎。**重套 `town_goal.sql`／`town.sql`／`town_casino*.sql` 後要再套本檔。**
- 前端：小鎮頁首富含籌碼、「最勤勞（7天）」、榜單視窗「打工（累計）」；錯誤紀錄濾 ResizeObserver；使用統計 `ui:act／ui:tab` 去掉職階名稱。

## 體檢修復（其餘區塊，2026-11-24，前端 v372；SQL `supabase/town_fix_rest.sql` **已套用正式站 2026-11-24（回滾實測通過）**，實測 `town_fix_rest_test.sql`（回滾，REPORT））
- 就地補丁 `town_act` obj 分支（垃圾桶、郵筒每天各 3 次，用 `dc.trash／dc.mail`，每次翻都算，第 4 次回「今天這個垃圾桶已經翻過了」；長椅與飲水機共用每天 100 精力 `dc.bench`）、`town_pk` 死碼；重建 `town_score`（新 RPC `town_score_start` 記 `items.sg={g,t}`：打地鼠要 ≥25 秒且分數 ≤ 秒數/0.7、記憶翻牌每步 ≥0.9 秒；沒開局紀錄用保守上限 25／70）與 `town_onboard`（步驟 1、2、4、5 驗事實，步驟 4 前端改成要有互動事件）。重套 `town.sql`／`town_mischief.sql` 後要再套本檔。
- 幸運兒：垃圾桶 3 次期望約 $32、郵筒約 $72（一般 $24／$54），已寫進 `RULES`。前端我的人生：刪打工冷卻字樣、財產稅含籌碼與 kt（`moneyAll`＋`town_econ_view`）、新增「車險與事故」列（`vehLife`）。驗證腳本 `tools/visual/fix-rest-verify.mjs`。

## 主線劇情（長期目標批 4，2026-11-24；前端 v390 已上線，SQL `supabase/town_story.sql` **尚未套用正式站**，實測 `town_story_test.sql`（回滾，REPORT）；順序在 `town_goal`／`town_dex`／`town_season`／`town_catalog2`／`town_fix_numbers` 之後）
- 8 章各 4 任務依序解鎖（`town_story_def` 與前端 `STORY` 要一致，`town/test_story.js` 比對）；資料 `items.mq`；RPC `town_story(rid,pin,op,id,choice)`：view／start／pause／talk／advance／choose／claim。任務種類：talk（`dexMark` 順手呼叫 `stTalk`，伺服器驗地點）、at、do（`town_goal_hook`／`town_goods` 補丁呼叫 `town_story_hook`）、n（讀 `town_ach_val`）、ch 選擇題（第 8 章三結局各一稱號）。
- 獎勵只有稱號、零食、限定造型 mq3／mq6／mq8（第 3／6／8 章，`town_shop` unlock='story'）；不給錢。成就 81～86（`town_ach_def` 補丁）。前端：選單「主線」、祕書小雅「主線劇情」、`#stbar` 追蹤條、`stScene` 劇情畫面。驗證腳本 `tools/visual/story-verify.mjs`；視覺情境 `modal-story`／`story-chapter1`／`story-clear`。

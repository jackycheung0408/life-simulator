> 版面、PC 版、底部列、像素風、音樂音效、按鈕效果表與分類：改畫面與按鈕時讀（從 CLAUDE.md 整段搬出，原文未改）

## 互動按鈕一律第一層（不藏子選單）
- **（2026-11-17 修正）所有動作仍在面板內一次點擊可達；「分頁籤」（照顧／這裡／社交／玩樂／工作／移動）不算子選單、不再多開 modal，切換只是換面板內顯示哪一組。** 建議下一步（`tip`）永遠置頂（`#tipbox`，最多 2 顆）。面板（`renderPanel`）裡能做的事每一件都是一顆按鈕，**不要再用「更多互動」「整蠱他」「休息／睡覺」這類收納式按鈕**；只有真的要選對象或確認（和誰？、要不要動手砍人、買東西）才開 `choiceModal`，modal 裡不再多一層「更多」。
- 設施的 `FAC` 動作由 `facBtns(r)` 直接列在面板（原本的 `facModal` 已刪）；家裡快速休息／快速睡覺／睡覺、朋友家的惡作劇／丟雞蛋都是獨立按鈕；同地點有幾個人在，就各有一顆「邀請 X 一起…」。
- **不能按的按鈕照樣顯示、灰掉並寫原因**：按鈕物件加 `dis:"原因"`（`dbtn(label,sub,fn,left)` 會把冷卻剩餘時間轉成「剛做過，N 分鐘後再來」；`cdLeft(r,key,mins)` 讀 `items.cd`）；點灰掉的按鈕只會跳 toast 說原因。新增互動要同步冷卻分鐘數（`FACCD` 要和 `town_fac.sql` 的 `cdm` 一致）。
- 分組標題（`GROUP`／`GORD` 排序）：建議下一步、照顧自己、在這裡、吃喝、玩樂、社交、工作與任務、房子、在他家、面對面、線上、移動。新增互動指定 `g`（`FACG` 對照）；打工類標籤開頭是「打工」「應徵」會自動歸「工作與任務」。同一面板按鈕多時靠面板捲動，不要藏起來。

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
- **兩層導覽要長得不同**：底部「全站導覽」＝選單／我／朋友／動態四顆等寬（深色 `#05060f` 底、頂 4px 亮邊、圖示在上字在下，目前頁＝`body.fr`／`body.social` 亮底＋頂部粉紅條）；「看全鎮」「回家」（`#zoom`、`#homeBtn`）≤899px 是 60×44 的頁籤鈕，貼在面板上緣右側（`bottom:var(--phpx)+var(--nav)`、跟面板同色、無下框），不再浮在地圖右上角擋畫面（2026-11-25）；PC 仍在舞台右上。面板內「這個地點的分頁」（`#ptabs`）＝扁平文字頁籤（無底色、選中黃字＋黃底線），標題 `#here` 寫地點名。兩者顏色形狀不可相近。
- 面板按鈕：晶片最多 2 顆（`tile()`），賭場 19 款去掉「玩」前綴並分 牌桌／骰盤／單人 小標（`casinoGroups`，超過 8 顆才分），`集點卡換一杯`→`換咖啡`；`#acts` 的 `grid-auto-rows` 一律 auto（fxcss 也是），否則小標會佔 76px。
- **常用列規則（2026-11-24 方案 D，v373；覆蓋舊的釘選版）**：固定三格 `[現在最需要][這個地點最近做的][粉紅 進去／出門]`。第 1 格＝需求 <35 時補最低那項（餓→吃、精力→睡／咖啡、膀胱→廁所、清潔→洗澡、心情→電視／電影），沒有緊急需求用「建議下一步」第一顆，再沒有就是第一顆可按的；第 2 格＝這個地點（`plKey`，`home:*` 併成 `home`）最近按過的動作（`localStorage town-recent2` ＝ `{地點:[標題…]}`，每地點 5 筆），沒有就補第一顆可按的；沒有可放的格子放空的 `span.mrx` 佔位（位置不位移）。**釘選與長按釘選已拿掉**（`town-fav`／`fav:on／off`／`#favbtn`），長按說明卡 `#fxcard` 保留。**2026-11-25 修正：常用列只是額外快捷，`#acts` 各分頁永遠完整保留所有按鈕（順序、位置不因常用列變動；被放進常用列的按鈕加 `.inmr` 右上 11px ★ 標示，不改尺寸）。** 驗證 `tools/visual/home-verify.mjs`。統計：常用列按鈕 `UT` key＝`main:<標題>`（`ctx` 先判 `#mainrow`），`drawer:main|list` 照舊。視覺情境新增 `in-hospital`、`low-hunger`。
- **面板不位移**：有分頁（`#ptabs` 顯示）時面板高度固定為上限（`fit()`），切分頁高度不變；面板 `overflow:hidden`，只有 `#acts` 可捲；牌桌 modal（含 `.garea`／`.gmenu`）整張卡 `touch-action:none`、只有清單區可捲。`tools/visual` 的 `shift-cafe` 情境量測切分頁＋等待後 `#panel／#stage／.tools／#mainrow` rect 差，必須 0。
- **通知中心**：底部「通知」（原「動態」，badge ＝別人對我做的未讀）→ 動態頁籤多「要回應」（可道謝／可和好的事件，帶數字）與「系統」（全鎮事件、升級、鎮長、市政）過濾、「全部已讀」（有未讀才出現）；toast／#wev／#upd 維持短暫提示。邀請、PK、鎮長權力、叫醒仍是彈窗（要回應的優先）。`UT.hit("notif:*")`。尚未做：彈窗佇列整合進中心、已讀狀態分類型。
- **PC 版（≥900px，`pc2css`）**：全站導覽（選單／我／看全鎮／朋友／通知）移到右側欄**頂部**（56px、亮底線）；面板從導覽下方到底部提示列上方（`top:56px;bottom:76px`），內部 `#acts` 唯一可捲、`#mainrow`（常用）貼面板底；面板內分頁是文字頁籤（同手機）；`#info` 在 PC 改成導覽列下方一行 24px 小字（職階、薪水、今天打工次數，`#panel` top 80px）；「最近動態」不在側欄，由底部「通知」涵蓋（`#info .ev` 隱藏）。
- 尚未做：其餘標籤縮短與合併（小睡／睡覺）、室內舞台按內容放大、PC 橫向版細修。

## 背景音樂 v2（2026-11-24，純前端）
- `town/music.js`（≤30KB）：資料化的原創流行風格曲＋程式合成引擎（多聲部：方波／電鋼琴／吉他／鋼琴／貝斯／pad／鈴／琶音、鼓組、殘響、dotted-8th 延遲、壓縮器、swing、隨機變奏與程式生成旋律）。**由 `sfx.js` 在音樂開啟後才動態載入（`index.html` 不可載入它，test.js 擋）**。主題 `street`（街上白天）、`cafe`（咖啡廳，爵士 7th）、`night`（20～6 點，小調 pad＋鈴）；格式說明見 music.js 檔頭。新增主題＝加一個 `TH` 物件，`node town/test.js` 會檢查格式。
- **不得使用或翻奏現成流行歌**（旋律受版權保護）；只做原創、流行和弦進行（I–V–vi–IV、vi–IV–I–V）。外部 CC0 真曲要逐首查授權並經使用者核准才可進 repo。
- 自適應：`town.js` 每 5 秒 `SFX.ctx({mood,crowd,place})`；心情 sad／low 只留貝斯＋pad、慢 10%；happy 加琶音、快 4%；同地點人數 ≥2 加 hat、≥3 加鼓、≥5 旋律加厚且快 5%。在咖啡廳切咖啡廳曲，夜間夜晚曲（切換在小節組邊界）。
- 本機試聽：瀏覽器開 `tools/music-preview.html`（每主題一顆鈕，可調心情與人數）。沒有真人試聽過，音質評估靠 Playwright 量測 RMS／peak 無爆音。
- 之後可加：賭場、監獄、市政廳、PK、慶典主題（資料格式相同）。

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
（由 `node tools/town-rules-doc.mjs` 從 `town/town.js` 的 `RULES` 產生，請勿手改；共 80 筆）

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
| 撿垃圾 | 心情 +4、錢 +$20～60 | — | 每天最多 3 次（第 4 次起「今天這個垃圾桶已經翻過了」）；每次 20% 撿到 $20～60、5% 撿到禮物（幸運兒機率 ×1.33）；一天期望約 $24（幸運兒約 $32）加禮物 | `town_fix_rest.sql#今天這個垃圾桶已經翻過了` |
| 查信箱 | 心情 +2、錢 +$30～90 | — | 每天最多 3 次；每次 30% 收到 $30～90（幸運兒 40%）；一天期望約 $54（幸運兒約 $72） | `town_fix_rest.sql#今天這個郵筒已經看過了` |
| 坐長椅 | 精力 +20、心情 +2 | — | 每天靠長椅與飲水機最多補 100 精力，用完要睡覺才補得回來 | `town_fix_rest.sql#今天坐夠長椅了` |
| 喝杯水 | 精力 +3、飽足 +3 | — | 和長椅共用每天 100 精力額度 | `town_fix_rest.sql#今天喝太多水了` |
| 打喪屍豬 | 精力 −5、錢 +60～140（打倒時） | 精力≥5 | 牠 3 點血，要在 3 格內；25% 反咬心情 −3；每人每天獎勵最多 $600；打倒 35% 掉生豬肉 | `town_tweaks.sql#if op = 'hit' then` |
| 賣生豬肉 | 錢 +30／塊 | 生豬肉 | — | `town_tweaks.sql#elsif op = 'sell' then` |
| 逛超市 | 心情 +6 | — | — | `town.sql#else r.fun := r.fun + 6; end if;` |
| 道謝 | 好感 +2 | — | 他三天內照顧過你才能謝；他心情 +8 | `town.sql#if act = 'thank' then` |
| 裝潢 | 錢 −300、心情 +8 | 在自家屋裡 | 換屋頂或牆壁顏色 | `town.sql#elsif act = 'paint' then` |
| 溜進去偷飼料 | 錢 −400、精力 −10 | 精力≥10 | 3% 翻到 $3000；45% 賣 $500～900；30% 被追（精力 −15、清潔 −25、心情 −10）；22% 被抓賠 min($1200, 現金)；每天最多 3 次 | `town.sql#elsif act = 'sneak' then` |
| 探監 | 心情 +3、精力 −2、好感 +2 | 對方在牢裡 | 受刑人心情 +10；同一人 60 分鐘一次 | `town_jail.sql#if act = 'visit' then` |
| 快速睡覺 | 精力 +50（有好床 +56） | 在自家屋裡 | 睡 15 分鐘自動醒，速率 ×2.5；提早起床按睡到的時間比例；30 分鐘冷卻 | `town.sql#elsif act = 'qsleep' then` |
| 邀請一起做 | 心情 +12、精力 +5、好感 +1 | 對方同地點醒著 | 對方 1 分鐘內接受才生效，雙方都加成；同一對 30 分鐘一次 | `town_social.sql#r := public.town_tg(r, 12, 5)` |
| 坐下逗留 | 精力 +0.5／分鐘、心情 +0.4／分鐘 | 在餐廳、咖啡廳、公園或廣場 | 滿 20 分鐘封頂；不到 3 分鐘或換了地點沒有獎勵；有人在場心情多 +2；起身時才結算 | `town_fac.sql#if act = 'sit' then` |
| 起身 | 精力 +0.5×分鐘、心情 +0.4×分鐘 | — | 坐越久恢復越多，上限 20 分鐘；不到 3 分鐘沒有效果 | `town_fac.sql#elsif act = 'up' then` |
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

## 8-bit 音效與音樂（2026-11-17，純前端）
- `town/sfx.js`（≤12KB，Web Audio 合成，無音檔）由 `index.html` 的 `load()` 在 town.js 後載入（`sfx.js?v=N`，改了跑 `node tools/town-bump.mjs --sfx`）。`SFX.play(name)`、`music(on)`、`vol(0~2)`、`mute(b)`；22 種音效（≤0.4 秒、同名 80ms 去重）、2 首音樂（白天輕快、台灣 20～6 點安靜）。第一次點擊才解鎖 AudioContext，之前靜默；頁面隱藏自動靜音。設定 `localStorage town-snd`，預設音效開、**音樂開**（2026-11-25：沒有 `mc`（使用者明確選過）欄位一律預設開，按「聲音」開關才寫 `mc:1` 並尊重；第一次點擊解鎖後自動開始，驗證 `tools/visual/snd-default-verify.mjs`）；**切主題不重疊**：`music.js` 每個主題有獨立 bus 組（`swap`），換主題時舊組在新小節開始時淡出並斷線，`TMUSIC.dbg()` 回傳 `{themes,fading,srcs,timers}`，迴歸 `tools/visual/music-verify.mjs`（10 種場景快切＋開關 8 次，同時只能 1 個主題）；**回家快捷**：地圖右上「回家」鈕 `#homeBtn`（`goHome`，睡著／入獄灰掉寫原因）、PC 鍵 `H`，`UT.hit("home:btn|key")`；選單「聲音」（`sndModal`）有開關、音量三檔、逐一試聽。
- 掛接都在既有入口：`toast`、`spawnFx`、走路 `path.shift`、`wkPlay`、`act` 成功／失敗、`enterRoom`、`lvUpModal`、`zbSet`；彈窗與按鈕點擊音由 sfx.js 自己監聽。呼叫一律 `window.SFX&&…`。**沒有真人聽過**，只以假 AudioContext 驗證不丟錯。


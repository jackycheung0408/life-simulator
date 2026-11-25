> 監獄、砍人、前科、越獄：改監獄相關時讀（從 CLAUDE.md 整段搬出，原文未改）

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


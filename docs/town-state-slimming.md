# town_state 瘦身設計（只是設計，**尚未改 `town_state`**）

## 現況（讀 `supabase/town.sql` `town_state`）
- 每次 poll（每人 15 秒）：鎖該鎮全部居民列（`for update`）→ 對每人跑 `town_tick`、**UPDATE 全部列** → 回傳整鎮居民（`town_pub`，含完整 `items`）、羈絆、戰帖、每週榜、近 60 筆動態。
- 一個鎮最多 12 人，所以規模是「鎮數 × 12」，不是單鎮 100 人。單次回傳 ≈ 12 × items（約 3～5KB）＋動態 ≈ 40～70KB（待 `town_stress_test.sql` 實測確認）。
- 瓶頸排序：① 每鎮每次 12 筆 UPDATE（同鎮 12 人同時在線 ⇒ 每秒約 10 筆寫入，且互相鎖列序列化）② 回傳大小（100 鎮約 4～5MB/s 出流量）③ 排行／週榜子查詢掃 `town_events`。

## 方案（由便宜到貴，建議照順序）
1. **tick 只在有變才寫**（最便宜）：`town_tick` 回傳後比對 `hunger/energy/…/items`，沒變就不 UPDATE；`updated_at` 沒到 1 分鐘不重算。預期寫入 −60～80%。
2. **items 只回必要欄位**：`town_pub` 目前整包 `items`；改成白名單（`tr、at、w、d、veh、lx.estate、fi、fv、dr、jl、wt、sk、al.lv、titles、sit、qs…` 前端畫面與名牌真的用到的），其餘（`inv、cl、cd、cas、sp、pk、pe、tk…`）只回「自己」那一列。預期回傳 −50～70%。需先 grep `town.js` 找 `R[...].items.` 的所有讀取點，避免漏欄。
3. **動態與週榜拆出**：`events`／`week` 改 `town_state_lite`（不含）＋ `town_feed(since_id)` 增量（前端只拿 id > 上次的）。週榜每分鐘快取一次（`town_cache` 表或 `town_towns.week_json`）。
4. **差量回傳**：前端帶 `since`（上次 `now`）；伺服器只回 `updated_at > since` 的居民與新動態；沒變回 `{ "same": true }`（約 100 位元組）。這是最大的省，但前端 `refresh()`／`apply()` 要改成合併。
5. **鎖粒度**：`for update` 改成只鎖「自己那列」，別人的列由各自 poll 時 tick（別人離線的列也不用算：離線結算改成對方上線時才補，`town_tick` 本來就是惰性）。

## 順序與風險
- 先做 1＋2（SQL 改動小、可回滾實測 `town_stress_test.sql` 前後對比）；3、4 需要前端同步，舊客戶端要相容（新參數預設空 = 舊行為）。
- 動 `town_state` 前必做：`town_stress_test.sql` 取基準 → 改 → 再量 → `node town/test.js`。**不得整份重貼 `town.sql`**（見 CLAUDE.md 的重套警告），用 pg_get_functiondef 就地改。
- 判斷是否真要做：看實測 avg。若 `town_state` < 20ms 且玩家 < 300 鎮，1 號就夠。

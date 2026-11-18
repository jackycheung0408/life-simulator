-- 修「invalid input syntax for type integer」：比大小的牌局狀態曾存在 items.hl（和房子等級同一個鍵），
--   進行中的牌局會讓 town_login／town_rent 把 {"bet":..,"card":..} 轉成整數而報錯，玩家登不進去。
-- 這個檔只做資料清理（可重複執行）：把 items.hl 是物件的角色，退回押注、移除 hl（房子等級缺值 = 1）。
--   函式修正在 town.sql（改存 items.hlg）；要先套 town.sql，再套這個檔，再套 town_account.sql。
update public.town_residents
   set money = money + coalesce((items->'hl'->>'bet')::int, 0),
       items = items - 'hl'
 where jsonb_typeof(items->'hl') = 'object';

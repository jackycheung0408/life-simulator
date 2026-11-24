-- 小豬賭場：取消「每局至少間隔 3 秒」（2026-11-24 使用者決定）。可重複執行。
-- 需要 town_casino4.sql（town_casino）；建議在 town_casino_resume.sql 之後套用。用 pg_get_functiondef 就地改文字，已改過就略過，找不到錨點整檔失敗。
-- 只拿掉 town_casino 裡 v_gate 區塊的 3 秒檢查那一行（籌碼不夠的檢查、items.cas.t 的寫入都留著，t 只是不再有人讀）。
-- 為什麼拿掉後重複操作仍安全：
--   1) 同一居民的呼叫會被序列化：town_casino 一開頭 town_auth 就 select ... from town_residents where id = rid for update（town_authfix.sql），
--      列鎖到交易結束才放，第二個連線要等第一個做完才讀得到新的籌碼與牌局，不會雙花。
--   2) 有狀態遊戲開新局會擋：21 點 bj_start／牌九 pj_start／比大小 hl_start（town_casino_resume.sql）、地雷 mn_start、開寶箱 ch_start 遇到未結束就報錯。
--      飛行器 cr_start 照舊（設計：關頁面算輸、重開覆蓋，舊注已付、新注另扣，不會多領）；射龍門 dg_start 不收費（等同放棄重發，已在 dg_play pass 的最佳策略內）。
--   3) 老虎機獎池每次都是 insert ... on conflict do update ... returning／update ... returning 原子更新，上限 100000 在中獎前補丁處理。
-- 略過標記：nogap_1124（只出現在新內容的註解裡；舊內容與函式名稱都沒有這個字串）。

do $patch$
declare def text; old text := $o$    if (cs->>'t') is not null and now() - (cs->>'t')::timestamptz < interval '3 seconds' then raise exception '慢一點，每局至少間隔 3 秒'; end if;
$o$; fix text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'town_casino' and p.pronargs = 5 limit 1;
  if def is null then raise exception '找不到 town_casino，先套 town_casino4.sql'; end if;
  if position('nogap_1124' in def) > 0 then raise notice 'town_casino 已取消 3 秒間隔，略過'; return; end if;
  if position(old in def) = 0 then raise exception 'town_casino 找不到 3 秒間隔那一行，請人工處理'; end if;
  fix := replace(def, old, '    -- nogap_1124：已取消每局間隔（同一居民的呼叫由 town_auth 的 for update 序列化）' || E'\n');
  if position('3 seconds' in fix) > 0 then raise exception 'town_casino 還有別處用到 3 seconds，請人工處理'; end if;
  execute fix;
end $patch$;

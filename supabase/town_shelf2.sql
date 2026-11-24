-- 小豬鎮：餐廳「今日特餐」與咖啡廳「特調」的名字改讀 town_shelf_special（每天依日期＋小鎮換，和貨架「今日推薦」同一個名字）。
-- 要在 town_shelf1.sql、town_fac.sql 之後套用；可重複執行；用 pg_get_functiondef 就地改 town_fac 的兩段文字（已改過就跳過，找不到錨點整檔失敗）。
-- 只換名字，價格與效果數值不變（特餐 €200、飽足 +40、心情 +12；特調 €300、精力 +45、心情 +4）。
create or replace function public.town_shelf2_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;
select public.town_shelf2_patch('town_fac', 5, 'specs[doy % 5 + 1]', 'public.town_shelf_special(''restaurant'', to_char(now() at time zone ''Asia/Taipei'', ''YYYY-MM-DD''), r.town_id)', 'town_shelf_special(''restaurant''');
select public.town_shelf2_patch('town_fac', 5, '''喝了一杯特調，集點卡蓋了一格''', '''喝了一杯今日特調「'' || public.town_shelf_special(''cafe'', to_char(now() at time zone ''Asia/Taipei'', ''YYYY-MM-DD''), r.town_id) || ''」，集點卡蓋了一格''', 'town_shelf_special(''cafe''');
drop function public.town_shelf2_patch(text, int, text, text, text);

-- 小豬鎮：購買一律在設施（第二批）：家具行 furnshop（家具、小道具、門口擺飾）、服飾店 wearshop（造型服飾）。
-- 要在 town_shops1.sql 之後套用，可重複執行；用 pg_get_functiondef 就地改文字，已改過就跳過，找不到錨點就整檔失敗（不會半套）。
-- 內容：
--   1) 地點白名單：town_place_name、town_feature、town_features、town_fi、town_need_in_pl、town_act（move）加 furnshop／wearshop。
--   2) town_act 的 buy（item 為 w:／d:／f:）：人在家具行（f:、d:）或服飾店（w:）裡面才能買；
--      旗標 shops_in 關著時超市仍可買（舊客戶端相容），開著時一定要到新店。超市的食品、禮物、目錄商品不動。
--      開旗標：insert into public.town_flags(k,v) values ('shops_in',true) on conflict (k) do update set v=true;
--   3) layout5 遷移：站在新建築位置上的人移到廣場。

create or replace function public.town_shops2_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;

select public.town_shops2_patch('town_place_name', 1, 'else ''路上''', 'when p = ''furnshop'' then ''家具行'' when p = ''wearshop'' then ''服飾店'' else ''路上''', 'furnshop');
select public.town_shops2_patch('town_feature', 1, '''realty'',''harbor''', '''realty'',''harbor'',''furnshop'',''wearshop''', 'furnshop');
select public.town_shops2_patch('town_features', 3, '''realty'',''harbor''', '''realty'',''harbor'',''furnshop'',''wearshop''', 'furnshop');
select public.town_shops2_patch('town_fi', 4, '''realty'',''harbor''', '''realty'',''harbor'',''furnshop'',''wearshop''', 'furnshop');
select public.town_shops2_patch('town_need_in_pl', 2, '''realty'',''harbor''', '''realty'',''harbor'',''furnshop'',''wearshop''', 'furnshop');
select public.town_shops2_patch('town_act', 9, '''realty'',''harbor'')', '''realty'',''harbor'',''furnshop'',''wearshop'')', 'furnshop');
select public.town_shops2_patch('town_act', 9,
  E'if r.place <> ''market'' then raise exception ''要在超市才能買''; end if;\n    select price into n from public.town_shop',
  E'if r.place = (case when item like ''w:%'' then ''wearshop'' else ''furnshop'' end) then perform public.town_need_in_pl(r, r.place);\n    elsif not (r.place = ''market'' and not public.town_shops_on()) then raise exception ''請到%購買'', case when item like ''w:%'' then ''服飾店'' else ''家具行'' end; end if;\n    select price into n from public.town_shop',
  'wearshop'' then');
drop function public.town_shops2_patch(text, int, text, text, text);

-- layout5：地圖新區再加兩棟（家具行 [73,9,6,5]、服飾店 [81,9,4,5]）：站在新建築位置上的人移到廣場
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'layout5') then
    update public.town_residents r set place = 'plaza', x = 14, y = 11
      from (values (73,9,6,5),(81,9,4,5)) as b(bx,by,bw,bh)
      where r.place = 'street' and r.x >= b.bx and r.x < b.bx + b.bw and r.y >= b.by and r.y < b.by + b.bh;
    insert into public.town_migrations(id) values ('layout5');
  end if;
end $mig$;

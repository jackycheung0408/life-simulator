-- 小豬鎮：購買一律在設施（第一批）：不動產公司 realty（房子升級、莊園）、碼頭船行 harbor（遊艇）。
-- 要在 town.sql、town_fi.sql、town_infac.sql、town_casino_fi.sql、town_econ_sink.sql 之後套用，可重複執行。
-- 全部用 pg_get_functiondef 就地改文字（同 town_casino.sql 做法），已改過就跳過，找不到錨點就整檔失敗（不會半套）。
-- 內容：
--   1) 地圖加寬到 85 欄（town_act move 的 px > 71 → 85）、move 白名單加 realty／harbor。
--   2) town_place_name、town_feature、town_features 白名單、town_fi 白名單、town_need_in_pl 白名單加 realty／harbor。
--   3) 功能旗標 shops_in（town_flags，預設關）：開了之後，房子升級要在不動產公司裡、遊艇／莊園要在船行／不動產公司裡、
--      拍賣出價與捐款要在市政廳裡；關著時舊入口照舊可用（舊客戶端相容）。
--      開：insert into public.town_flags(k,v) values ('shops_in',true) on conflict (k) do update set v=true;
--      關：insert into public.town_flags(k,v) values ('shops_in',false) on conflict (k) do update set v=false;
--   4) layout4 遷移：把站在新建築位置上的人移到廣場。

create table if not exists public.town_flags (k text primary key, v boolean not null default true);
alter table public.town_flags enable row level security;
revoke all on public.town_flags from public, anon, authenticated;

create or replace function public.town_shops_on() returns boolean language sql stable as $$
  select coalesce((select f.v from public.town_flags f where f.k = 'shops_in'), false)
$$;
revoke all on function public.town_shops_on() from public, anon, authenticated;

-- 旗標開著時，這件事要站在該設施裡面才能做
create or replace function public.town_shop_need(r public.town_residents, pl text) returns void language plpgsql stable as $$
declare nm text;
begin
  if not public.town_shops_on() then return; end if;
  nm := public.town_place_name(pl);
  if r.place is distinct from pl then raise exception '請到%購買', nm; end if;
  if public.town_jailed(r) then return; end if;
  if public.town_is_off(r.town_id, public.town_feature(pl)) then raise exception '這個小鎮沒有開這個設施'; end if;
  if not public.town_fin(r) then raise exception '要先進去%才能購買', nm; end if;
end $$;
revoke all on function public.town_shop_need(public.town_residents, text) from public, anon, authenticated;

-- 就地改函式文字的小幫手：fn 名、舊文字、新文字；已含 chk 就跳過；找不到舊文字就丟錯
create or replace function public.town_shops1_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;

select public.town_shops1_patch('town_place_name', 1, 'else ''路上''', 'when p = ''realty'' then ''不動產公司'' when p = ''harbor'' then ''碼頭船行'' else ''路上''', 'realty');
select public.town_shops1_patch('town_feature', 1, 'else null end', 'when what in (''realty'',''harbor'') then what else null end', 'realty');
select public.town_shops1_patch('town_features', 3, '''zombie''', '''zombie'',''realty'',''harbor''', 'realty');
select public.town_shops1_patch('town_fi', 4, '''casino'',''slaughter''', '''casino'',''slaughter'',''realty'',''harbor''', 'realty');
select public.town_shops1_patch('town_need_in_pl', 2, '''casino'',''slaughter''', '''casino'',''slaughter'',''realty'',''harbor''', 'realty');
-- town_act：移動白名單與位置上限
select public.town_shops1_patch('town_act', 9, '''police'',''townhall'')', '''police'',''townhall'',''realty'',''harbor'')', 'realty');
select public.town_shops1_patch('town_act', 9, 'px > 71', 'px > 85', 'px > 85');
-- town_act：房子升級改在不動產公司（人在不動產公司、或旗標開著時，不必在屋裡；旗標開著時一定要在不動產公司裡）
select public.town_shops1_patch('town_act', 9,
  E'4 豪宅 €400000\n    if not public.town_inside(r) then raise exception ''要先進屋''; end if;',
  E'4 豪宅 €400000\n    if public.town_shops_on() or r.place = ''realty'' then perform public.town_shop_need(r, ''realty''); elsif not public.town_inside(r) then raise exception ''要先進屋''; end if;',
  'town_shop_need(r, ''realty'')');
-- town_econ_use：遊艇／莊園在船行／不動產公司買，拍賣與捐款在市政廳
select public.town_shops1_patch('town_econ_use', 5, 'if op = ''buy'' then', 'if op = ''buy'' then perform public.town_shop_need(r, case when item = ''estate'' then ''realty'' else ''harbor'' end);', 'town_shop_need');
select public.town_shops1_patch('town_econ_use', 5, 'elsif op = ''donate'' then', 'elsif op = ''donate'' then perform public.town_shop_need(r, ''townhall'');', 'town_shop_need(r, ''townhall'')');
select public.town_shops1_patch('town_econ_use', 5, 'elsif op = ''bid'' then', 'elsif op = ''bid'' then perform public.town_shop_need(r, ''townhall'');', 'town_shop_need(r, ''townhall'')');
drop function public.town_shops1_patch(text, int, text, text, text);

-- layout4：地圖加寬（不動產公司 [73,0,6,5]、碼頭船行 [73,17,6,4]）：站在新建築位置上的人移到廣場
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'layout4') then
    update public.town_residents r set place = 'plaza', x = 14, y = 11
      from (values (73,0,6,5),(73,17,6,4)) as b(bx,by,bw,bh)
      where r.place = 'street' and r.x >= b.bx and r.x < b.bx + b.bw and r.y >= b.by and r.y < b.by + b.bh;
    insert into public.town_migrations(id) values ('layout4');
  end if;
end $mig$;

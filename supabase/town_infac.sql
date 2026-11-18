-- 小豬鎮：設施互動一定要「進館」（走進室內）才能做；要在 town_fi.sql 之後套用，可重複執行。
-- 順序：town_fi.sql → town_infac.sql → town.sql → town_fac.sql → town_stock.sql（後三份有呼叫這裡的函式）。
-- 前端要先上線（town.js v239 以後：設施動作會自動先進館、舊伺服器不認的地點門口照舊可用）才建議開啟。
-- 開關：表 town_flags 的 infac 列，沒有這一列 = 開。緊急關閉：
--   insert into public.town_flags(k, v) values ('infac', false) on conflict (k) do update set v = false;
-- 重新開啟：把 v 改成 true 或刪掉那列。
-- 要求進館的地點：咖啡廳、餐廳、健身房、電影院、超市、公司、拉菲、證交所、格鬥場、車行、屠宰場。
-- 例外：公園、廣場與路邊物件（戶外）、監獄、醫院、警察局、市政廳（有自己的函式）、入獄者（town_act 開頭先擋）。

create table if not exists public.town_flags (k text primary key, v boolean not null default true);
alter table public.town_flags enable row level security;
revoke all on public.town_flags from public, anon, authenticated;

create or replace function public.town_infac_on() returns boolean language sql stable as $$
  select coalesce((select f.v from public.town_flags f where f.k = 'infac'), true)
$$;

-- 這個地點有室內、人在這個地點卻沒進去 → 擋掉
create or replace function public.town_need_in_pl(r public.town_residents, pl text) returns void language plpgsql stable as $$
begin
  if pl is null or r.place is distinct from pl then return; end if;
  if pl not in ('cafe','restaurant','gym','market','cinema','office','rafi','stock','arena','carshop','slaughter') then return; end if;
  if not public.town_infac_on() then return; end if;
  if public.town_jailed(r) then return; end if;
  if public.town_fin(r) then return; end if;
  raise exception '要先進去才能用';
end $$;

-- town_act 的設施動作 → 對應地點
create or replace function public.town_need_in(r public.town_residents, a text, it text default null) returns void language plpgsql stable as $$
declare want text;
begin
  want := case
    when a in ('work','cowork') then 'office'
    when a = 'job' then public.town_pjob_place(it)
    when a in ('buy','browse') then 'market'
    when a = 'movie' then 'cinema'
    when a = 'spar' then 'arena'
    when a = 'sneak' then 'slaughter'
    when a in ('vbuy','license','insure','vfix','vsell') then 'carshop'
    when a = 'dine' then 'restaurant'
    when a = 'coffee' then 'cafe'
    when a = 'workout' then 'gym'
    else null end;
  perform public.town_need_in_pl(r, want);
end $$;

revoke all on function public.town_infac_on() from public, anon, authenticated;
revoke all on function public.town_need_in_pl(public.town_residents, text) from public, anon, authenticated;
revoke all on function public.town_need_in(public.town_residents, text, text) from public, anon, authenticated;

-- 小豬鎮：賭場「玩家人氣排行」（近 7 天每款遊戲的開局數，前端用來排熱門）。要在 town_usage.sql、town_casino4.sql、town_casino_fi.sql 之後套用，可重複執行。
-- 1) 計數寫進全站匿名統計表 town_usage（見 town_usage.sql），事件代號 play:<遊戲代號>（hl、bj、dg、pj、mines、crash、chest…）；全站合計，不分小鎮。
-- 2) town_casino_pop_add：只在「開局那次」呼叫 +1（hl_start、bj_start、dg_play（放棄 pass 不算）、pj_start、mn_start、cr_start、ch_start 與一次下注完成的各款）。
-- 3) town_casino_pop_top：近 7 天局數前 8 名的遊戲代號（JSON 陣列），沒資料回 []，前端退回固定熱門清單。
-- 4) 用 pg_get_functiondef 就地改 town_casino（在進館檢查後加一行累加）與 town_casino_state（回傳多一個 pop），已改過就跳過，不重建整個函式。
-- 開局若失敗（錢不夠、被擋）整筆交易回滾，累加也一起回滾，所以只算成功的局。

create or replace function public.town_casino_pop_key(g text, choice text) returns text language sql immutable as $$
  select case
    when g = 'hl_start' then 'hl'
    when g = 'bj_start' then 'bj'
    when g = 'dg_play' then case when coalesce(choice, '') = 'pass' then null else 'dg' end
    when g = 'pj_start' then 'pj'
    when g = 'mn_start' then 'mines'
    when g = 'cr_start' then 'crash'
    when g = 'ch_start' then 'chest'
    when g in ('wheel','dice','slots','keno','bacc','niu','sangong','shiba','pigrace','plinko','cups','scratch') then g
    else null end
$$;
revoke all on function public.town_casino_pop_key(text, text) from public, anon, authenticated;

create or replace function public.town_casino_pop_add(tid text, g text, choice text default null) returns void
language plpgsql security definer set search_path = public as $$
declare gk text := public.town_casino_pop_key(g, choice);
begin
  if gk is null then return; end if;
  perform public.town_usage_hit_int('play:' || gk, 1);
end $$;
revoke all on function public.town_casino_pop_add(text, text, text) from public, anon, authenticated;

create or replace function public.town_casino_pop_top(tid text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(t.game order by t.s desc, t.game), '[]'::json) from (
    select substr(u.k, 6) as game, sum(u.n) as s from public.town_usage u
    where u.k like 'play:%' and u.day >= (now() at time zone 'Asia/Taipei')::date - 6
    group by u.k order by sum(u.n) desc, u.k limit 8) t
$$;
revoke all on function public.town_casino_pop_top(text) from public, anon, authenticated;

do $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'town_casino';
  if def is null then raise notice '找不到 town_casino，先套 town_casino4.sql'; 
  elsif position('town_casino_pop_add' in def) = 0 then
    if position('perform public.town_need_in_pl(r, ''casino'');' in def) = 0 then raise exception 'town_casino 找不到插入點（要先套 town_casino_fi.sql）'; end if;
    def := replace(def, 'perform public.town_need_in_pl(r, ''casino'');', 'perform public.town_need_in_pl(r, ''casino'');' || E'\n  ' || 'perform public.town_casino_pop_add(r.town_id, game, choice);');
    execute def;
  end if;

  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'town_casino_state';
  if def is null then raise notice '找不到 town_casino_state，先套 town_casino.sql';
  elsif position('town_casino_pop_top' in def) = 0 then
    if position('''jp'', coalesce(' in def) = 0 then raise exception 'town_casino_state 找不到插入點'; end if;
    def := replace(def, '''jp'', coalesce(', '''pop'', public.town_casino_pop_top(r.town_id), ''jp'', coalesce(');
    execute def;
  end if;
end $$;

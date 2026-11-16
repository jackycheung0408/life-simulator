-- 使用者要求：把名叫「LF」的居民關進監獄 4 小時（一次性對正式站寫入；用 town_migrations 的 lfjail1 防重複）。
-- 要在 town.sql、town_jail.sql、town_civic.sql 之後。**只有名字含 LF 的居民剛好 1 位才會動手**；0 位或多位會直接報錯並列出名單，什麼都不改。
-- 作法和 town_civic.sql 的自首一樣：items.jl = 出獄時間、items.jp 服刑紀錄、前科（出獄後 24 小時，town_prior_set）、人移到監獄門口、下車、寫 jail 動態。
do $lf$
declare r public.town_residents; n int; names text; ra public.town_residents;
begin
  if exists (select 1 from public.town_migrations where id = 'lfjail1') then raise exception 'lfjail1 已經跑過了，不重複執行'; end if;
  select count(*), string_agg(name || '（id ' || id || '，小鎮 ' || town_id || '）', '、') into n, names from public.town_residents where name ilike '%LF%';
  if n <> 1 then raise exception '名字含 LF 的居民有 % 位：%。請告訴我是哪一位（id）再改', n, coalesce(names, '（沒有）'); end if;
  select * into r from public.town_residents where name ilike '%LF%';
  r.items := jsonb_set(r.items - 'wt' - 'pl' - 'dr' - 'fi' - 'fv', '{jl}', to_jsonb((now() + interval '4 hours')::text));
  r.items := jsonb_set(r.items, '{jp}', jsonb_build_object('t', now(), 'e', now() + interval '4 hours', 'n', 0, 'bad', 0));
  r := public.town_prior_set(r, now() + interval '4 hours', true);
  if r.items#>>'{veh,k}' is not null then r.items := jsonb_set(r.items, '{veh}', (r.items->'veh') - 'k'); end if;
  r.place := 'jail'; r.x := 61; r.y := 5; r.sleeping := false;
  insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, r.id, 'jail', r.name || ' 被關進監獄 4 小時');
  perform public.town_save_r(r);
  update public.town_residents set place = r.place, x = r.x, y = r.y where id = r.id;
  insert into public.town_migrations(id) values ('lfjail1');
end $lf$;

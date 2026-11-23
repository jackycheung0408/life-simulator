-- 小豬鎮：遊艇出海、莊園派對（2026-11-23）。新增獨立 RPC town_econ_fun，不動 town_econ_use。要在 town_econ_sink.sql 之後套用，可重複執行。
-- 遊艇「出海」€2000：要有遊艇、人在碼頭附近（街上，離碼頭中心 x 6 格、y 5 格內）；自動帶最多 3 位同在碼頭附近、上線中（5 分鐘內）、醒著、沒入獄的居民（隨機挑），至少要有 1 位。
--   每人（含船主）心情 +25（上限 100），船主對每位乘客好感 +3（走 town_bond）；船主 1 小時一次；乘客不用同意也不花錢，只有心情好處，所以沒有被濫用的空間。
-- 莊園「辦派對」€5000：要有莊園、人在自己家（place = home:自己）；全鎮上線中（10 分鐘內）醒著沒入獄的其他居民心情 +15，船主自己 +15、對每位好感 +2；每個台灣日 1 次。
-- 花費 7 成銷毀、3 成進鎮基金（fund_log.econ_lux）；錢不夠就擋、不欠款；入獄、睡覺不能辦；小鎮經濟關閉（town_flags.econ／town_econ.enabled）時擋。不追溯。
create or replace function public.town_econ_fun(rid bigint, pin text, op text) returns json language plpgsql security definer set search_path = public as $$
declare r public.town_residents; tid text; cost int; g public.town_residents; n int := 0; today text; last_y bigint; lc jsonb; ids bigint[] := '{}'; names text := '';
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  tid := r.town_id;
  if not public.town_econ_on(tid) then raise exception '小鎮經濟功能暫時關閉'; end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你在監獄裡'; end if;
  today := to_char(now() at time zone 'Asia/Taipei', 'YYYY-MM-DD');
  lc := coalesce(r.items->'lxc', '{}'::jsonb);
  if op = 'yacht' then
    cost := 2000;
    if coalesce(r.items->'lx'->>'yacht', '') = '' then raise exception '你還沒有遊艇'; end if;
    if r.place <> 'street' or abs(r.x - 68.5) > 6 or abs(r.y - 18.5) > 5 then raise exception '要在碼頭附近才能出海'; end if;
    last_y := coalesce((lc->>'y')::bigint, 0);
    if extract(epoch from now())::bigint - last_y < 3600 then raise exception '剛出過海，1 小時後再來'; end if;
    if r.money < cost then raise exception '錢不夠，要 €%', cost; end if;
    for g in select p.* from public.town_residents p where p.town_id = tid and p.id <> rid and p.place = 'street' and abs(p.x - 68.5) <= 6 and abs(p.y - 18.5) <= 5
      and p.seen_at > now() - interval '5 minutes' and not p.sleeping and not public.town_jailed(p) order by random() limit 3 loop
      ids := ids || g.id; names := names || case when names = '' then '' else '、' end || g.name;
    end loop;
    if coalesce(array_length(ids, 1), 0) = 0 then raise exception '碼頭附近沒有可以一起出海的朋友（要上線、醒著）'; end if;
    update public.town_residents p set money = p.money - cost, fun = least(100, p.fun + 25),
      items = jsonb_set(p.items, '{lxc}', lc || jsonb_build_object('y', extract(epoch from now())::bigint)) where p.id = rid and p.money >= cost;
    if not found then raise exception '錢不夠，要 €%', cost; end if;
    update public.town_residents p set fun = least(100, p.fun + 25) where p.id = any(ids);
    foreach last_y in array ids loop perform public.town_bond(tid, rid, last_y, 3); end loop;
    perform public.town_fund_add(tid, 'econ_lux', floor(cost * 0.3)::int);
    insert into public.town_events(town_id, actor, kind, msg) values (tid, rid, 'fund', r.name || ' 開遊艇帶 ' || names || ' 出海玩（€' || cost || '）');
    return json_build_object('ok', true, 'msg', '帶 ' || names || ' 出海，大家心情 +25');
  elsif op = 'party' then
    cost := 5000;
    if coalesce(r.items->'lx'->>'estate', '') = '' then raise exception '你還沒有莊園'; end if;
    if r.place <> 'home:' || rid then raise exception '要在自己的莊園（家）才能辦派對'; end if;
    if coalesce(lc->>'p', '') = today then raise exception '今天辦過派對了，明天再來'; end if;
    if r.money < cost then raise exception '錢不夠，要 €%', cost; end if;
    update public.town_residents p set money = p.money - cost, fun = least(100, p.fun + 15),
      items = jsonb_set(p.items, '{lxc}', lc || jsonb_build_object('p', today)) where p.id = rid and p.money >= cost;
    if not found then raise exception '錢不夠，要 €%', cost; end if;
    for g in select p.* from public.town_residents p where p.town_id = tid and p.id <> rid and p.seen_at > now() - interval '10 minutes' and not p.sleeping and not public.town_jailed(p) loop
      update public.town_residents p set fun = least(100, p.fun + 15) where p.id = g.id;
      perform public.town_bond(tid, rid, g.id, 2); n := n + 1;
    end loop;
    perform public.town_fund_add(tid, 'econ_lux', floor(cost * 0.3)::int);
    insert into public.town_events(town_id, actor, kind, msg) values (tid, rid, 'fund', r.name || ' 在莊園辦派對（€' || cost || '），' || n || ' 位居民心情變好');
    return json_build_object('ok', true, 'msg', '派對開始！' || n || ' 位居民心情 +15');
  end if;
  raise exception '沒有這個操作';
end $$;
grant execute on function public.town_econ_fun(bigint, text, text) to anon, authenticated;

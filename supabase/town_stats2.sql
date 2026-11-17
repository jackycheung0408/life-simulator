-- 小豬鎮：能力屬性的獲得與減少。要在 town.sql（含新版 town_at）、town_social.sql（town_save_r）、town_stats.sql 之後套用，可重複執行。不改 town_act。
-- 獲得：訓練累積「進度」items.at.p，進度滿了 +1 永久點（每項仍最多 5 點）。每升到下一點所需進度 need = 6 + 3×目前點數（0→1 要 6、4→5 要 18）。
--   每天（台灣日）全部能力加起來最多 +8 進度（items.at.td = {d,n}），防止掛機刷滿；其餘只受精力、錢、地點限制。
--   lift 健身房舉重 力量：$150、精力 −15（要 ≥ 25）、飽足 −6、清潔 −8
--   run  公園慢跑 敏捷：免費、精力 −12（要 ≥ 20）、飽足 −5、清潔 −6
--   read 在自家屋裡讀書 智力：免費、精力 −6、心情 −3、飽足 −2
--   chat 廣場或咖啡廳和另一個醒著的居民聊天 魅力：免費、精力 −3、心情 +2（要有人在場）
--   pray 廣場許願池投幣 運氣：$100（錢只出不進，期望值 < 0）、精力 −2
-- 減少（暫時、不存資料、由 town.sql 的 town_at 即時扣）：鼻青臉腫 力量 −1 敏捷 −1、心情低落 魅力 −2、發臭 魅力 −1、精力 < 10 智力 −2、事故欠款 運氣 −1。狀態解除就恢復，永久點不會被扣。
-- 角色不會死、錢只扣到 0 以下不行（不夠就擋）、不影響街機賠率。op='view' 回傳 {at,p,need,tmp,td}。
create or replace function public.town_train(rid bigint, pin text, kind text default 'view') returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; a jsonb; ks text[] := array['st','ag','ch','iq','lk']; k text; cur int; need int; pr int; dn int; today text; cost int := 0; en real := 0; msg text := ''; cnt int; up boolean := false;
  p jsonb; td jsonb; tmp jsonb := '{}'::jsonb; nd jsonb := '{}'::jsonb; i int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  today := to_char(now() at time zone 'Asia/Taipei', 'YYYY-MM-DD');
  if kind <> 'view' then
    if r.sleeping then raise exception '睡著了，先起床'; end if;
    if public.town_jailed(r) then raise exception '入獄中不能訓練'; end if;
    k := case kind when 'lift' then 'st' when 'run' then 'ag' when 'read' then 'iq' when 'chat' then 'ch' when 'pray' then 'lk' else null end;
    if k is null then raise exception '不認得的訓練'; end if;
    if kind = 'lift' then
      if r.place <> 'gym' then raise exception '要在健身房才能舉重'; end if; cost := 150; en := 15;
      if r.energy < 25 then raise exception '精力不到 25，先休息'; end if;
      r.hunger := greatest(0, r.hunger - 6); r.hygiene := greatest(0, r.hygiene - 8);
    elsif kind = 'run' then
      if r.place <> 'park' then raise exception '要在公園才能慢跑'; end if; en := 12;
      if r.energy < 20 then raise exception '精力不到 20，先休息'; end if;
      r.hunger := greatest(0, r.hunger - 5); r.hygiene := greatest(0, r.hygiene - 6);
    elsif kind = 'read' then
      if r.place <> 'home:' || r.id or not public.town_inside(r) then raise exception '要在自己家屋裡才能讀書'; end if; en := 6;
      if r.energy < 6 then raise exception '太累了，讀不進去'; end if;
      r.fun := greatest(0, r.fun - 3); r.hunger := greatest(0, r.hunger - 2);
    elsif kind = 'chat' then
      if r.place not in ('plaza','cafe') then raise exception '要在廣場或咖啡廳才能聊天'; end if; en := 3;
      select count(*) into cnt from public.town_residents o where o.town_id = r.town_id and o.id <> r.id and o.place = r.place and not o.sleeping and not public.town_jailed(o) and o.seen_at > now() - interval '10 minutes';
      if cnt = 0 then raise exception '這裡沒有別人可以聊天'; end if;
      r.fun := least(100, r.fun + 2);
    else
      if r.place <> 'plaza' then raise exception '要在廣場的許願池才能投幣'; end if; cost := 100; en := 2;
    end if;
    if r.energy < en then raise exception '精力不夠'; end if;
    if r.money < cost then raise exception '錢不夠（要 €%）', cost; end if;
    a := coalesce(r.items->'at', '{}'::jsonb); td := coalesce(a->'td', '{}'::jsonb);
    dn := case when td->>'d' = today then coalesce((td->>'n')::int, 0) else 0 end;
    if dn >= 8 then raise exception '今天練得夠多了（每天最多 8 點進度），明天再來'; end if;
    cur := least(5, coalesce((a->>k)::int, 0));
    if cur >= 5 then raise exception '這項已經練到最高了'; end if;
    r.money := r.money - cost; r.energy := r.energy - en;
    p := coalesce(a->'p', '{}'::jsonb); pr := coalesce((p->>k)::int, 0) + 1; need := 6 + 3 * cur;
    if pr >= need then cur := cur + 1; pr := 0; up := true; a := a || jsonb_build_object(k, cur); end if;
    p := p || jsonb_build_object(k, pr);
    a := a || jsonb_build_object('p', p, 'td', jsonb_build_object('d', today, 'n', dn + 1));
    r.items := jsonb_set(r.items, '{at}', a);
    perform public.town_save_r(r);
    msg := case when up then '練成了！這項能力 +1 點' else '進度 +1（' || pr || '／' || need || '）' end;
  end if;
  a := coalesce(r.items->'at', '{}'::jsonb); p := coalesce(a->'p', '{}'::jsonb); td := coalesce(a->'td', '{}'::jsonb);
  for i in 1..5 loop
    k := ks[i]; cur := least(5, coalesce((a->>k)::int, 0));
    tmp := tmp || jsonb_build_object(k, cur - public.town_at(r, k));
    nd := nd || jsonb_build_object(k, case when cur >= 5 then 0 else 6 + 3 * cur end);
  end loop;
  return json_build_object('msg', msg, 'up', up, 'p', p, 'need', nd, 'tmp', tmp,
    'td', case when td->>'d' = today then coalesce((td->>'n')::int, 0) else 0 end, 'max', 8,
    'at', json_build_object('st', least(5,coalesce((a->>'st')::int,0)), 'ag', least(5,coalesce((a->>'ag')::int,0)), 'ch', least(5,coalesce((a->>'ch')::int,0)), 'iq', least(5,coalesce((a->>'iq')::int,0)), 'lk', least(5,coalesce((a->>'lk')::int,0))));
end $$;
revoke all on function public.town_train(bigint,text,text) from public;
grant execute on function public.town_train(bigint,text,text) to anon, authenticated;

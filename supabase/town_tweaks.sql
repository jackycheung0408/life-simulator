-- 小豬鎮 2026-11 小調整：喪屍豬（Minecraft 風）。要在 town.sql、town_social.sql、town_fi.sql 之後套用，可重複執行。
-- 規則：
--   全天都有、隨機生成（2026-11-16 起；原本只有 20:00～06:00）：每 40 秒一次機會，白天 25%、夜間（台灣 20:00～06:00）50% 刷一隻；白天最多 2 隻、夜間最多 4 隻（再受「戶外醒著上線中的人數」限制）。
--   每隻活 8～16 分鐘（依 id 不同）就消失（取代天亮燒掉）。
--   緩慢（約 1.2 格／秒）追向最近的戶外玩家；碰到（≤ 1.5 格）：精力 −8、心情 −8、清潔 −10，同一人 60 秒最多一次。不會死、不扣錢。
--   在屋裡、設施室內、醫院、監獄、睡覺、昏倒、離線 10 分鐘以上的人不會被打。鎮長可用 FEATS 的 zombie 關掉。
--   玩家可以「打」：精力 −5，牠有 3 點血，25% 反擊（心情 −3）；打倒領 €60～140（每人每天最多 €600，items.zk={d,m}），35% 掉「生豬肉」items.zp +1，到超市賣 €30／塊。
--   資料：town_zombies（RLS 全關，只走這個 RPC）。除了領獎和被打的資料，不動任何人原有的錢。
create table if not exists public.town_zombies (
  id bigint generated always as identity primary key, town_id text not null, x real not null, y real not null,
  hp int not null default 3, at timestamptz not null default now(), moved timestamptz not null default now()
);
create index if not exists town_zombies_town on public.town_zombies(town_id);
alter table public.town_zombies enable row level security;
revoke all on public.town_zombies from anon, authenticated;

create or replace function public.town_zombie(rid bigint, pin text, op text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; z public.town_zombies; p public.town_residents; tid text; hr int; day boolean; ep int; cap int; cnt int;
  el real; dx real; dy real; dd real; stp real; tx real; ty real; best real; hurt boolean := false; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  zk jsonb; got int; rew int; msg text; killed boolean := false; pork int; ex boolean; sx real; sy real; zl json;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  tid := r.town_id;
  -- town.hour 只給實測用（同一個交易裡 set_config 才有效，玩家從 API 設不了）
  hr := coalesce(nullif(current_setting('town.hour', true), '')::int, extract(hour from now() at time zone 'Asia/Taipei')::int); day := not (hr >= 20 or hr < 6);
  if public.town_is_off(tid, 'zombie') then
    delete from public.town_zombies where town_id = tid;
    if op = 'hit' then raise exception '這個小鎮關掉了喪屍豬'; end if;
    if op = 'sell' then null; else return json_build_object('z', '[]'::json, 'night', not day, 'hit', false, 'pork', coalesce((r.items->>'zp')::int, 0)); end if;
  end if;
  delete from public.town_zombies where town_id = tid and at < now() - make_interval(mins => (8 + (id % 5) * 2)::int);  -- 每隻活 8～16 分鐘
  if op <> 'sell' then
    -- 在戶外、醒著、上線中的人（喪屍豬的目標）
    select count(*) into ep from public.town_residents q where q.town_id = tid and q.place in ('street','plaza','park') and not q.sleeping and not public.town_jailed(q)
      and (q.items->>'faint') is null and not public.town_fin(q) and q.seen_at > now() - interval '10 minutes';
    -- 刷怪：每個在戶外的人讓上限 +1（最多 4 隻），40 秒最多刷一隻，刷在隨機一位玩家左右 8～12 格
    cap := least(case when day then 2 else 4 end, ep);
    select count(*) into cnt from public.town_zombies where town_id = tid;
    if cap > cnt and (select coalesce(max(at), 'epoch'::timestamptz) from public.town_zombies where town_id = tid) < now() - interval '40 seconds' and random() < (case when day then .25 else .5 end) then
      select * into p from public.town_residents q where q.town_id = tid and q.place in ('street','plaza','park') and not q.sleeping and not public.town_jailed(q)
        and (q.items->>'faint') is null and not public.town_fin(q) and q.seen_at > now() - interval '10 minutes' order by random() limit 1;
      if p.id is not null then
        sx := greatest(1, least(69, p.x + (case when random() < .5 then -1 else 1 end) * (8 + random() * 4)));
        sy := greatest(1, least(39, p.y));
        insert into public.town_zombies(town_id, x, y) values (tid, sx, sy);
      end if;
    end if;
    -- 移動：朝最近的目標走（最多補 60 秒）；碰到的人被打
    for z in select * from public.town_zombies where town_id = tid order by id loop
      el := least(60, extract(epoch from now() - z.moved))::real;
      select q.x, q.y into tx, ty from public.town_residents q where q.town_id = tid and q.place in ('street','plaza','park') and not q.sleeping and not public.town_jailed(q)
        and (q.items->>'faint') is null and not public.town_fin(q) and q.seen_at > now() - interval '10 minutes' order by abs(q.x - z.x) + abs(q.y - z.y) limit 1;
      if tx is not null and el > 0 then
        dx := tx - z.x; dy := ty - z.y; dd := sqrt(dx * dx + dy * dy); stp := least(dd, 1.2 * el);
        if dd > 0.01 then z.x := z.x + dx / dd * stp; z.y := z.y + dy / dd * stp; end if;
      end if;
      update public.town_zombies set x = z.x, y = z.y, moved = now() where id = z.id;
      for p in select * from public.town_residents q where q.town_id = tid and q.place in ('street','plaza','park') and not q.sleeping and not public.town_jailed(q)
        and (q.items->>'faint') is null and not public.town_fin(q) and q.seen_at > now() - interval '10 minutes' and abs(q.x - z.x) + abs(q.y - z.y) <= 1.5 loop
        if (p.items->'zb'->>'at') is null or (p.items->'zb'->>'at')::timestamptz < now() - interval '60 seconds' then
          update public.town_residents set energy = greatest(0, energy - 8), fun = greatest(0, fun - 8), hygiene = greatest(0, hygiene - 10),
            items = jsonb_set(items, '{zb}', jsonb_build_object('at', now())) where id = p.id;
          insert into public.town_events(town_id, actor, target, kind, msg) values (tid, p.id, p.id, 'zombie', p.name || ' 被喪屍豬打到了（精力、心情、清潔都掉了一點）');
          if p.id = rid then hurt := true; end if;
        end if;
      end loop;
    end loop;
    r := public.town_auth(rid, pin);
  end if;
  if op = 'hit' then
    if r.sleeping or public.town_jailed(r) or r.place not in ('street','plaza','park') or public.town_fin(r) then raise exception '現在打不到喪屍豬'; end if;
    if r.energy < 5 then raise exception '精力不夠，打不動了'; end if;
    select * into z from public.town_zombies where id = target and town_id = tid;
    if z.id is null then raise exception '喪屍豬不見了'; end if;
    if abs(z.x - r.x) + abs(z.y - r.y) > 3 then raise exception '離牠太遠，走過去再打'; end if;
    r.energy := r.energy - 5;
    msg := '揍了喪屍豬一拳';
    if random() < .25 then r.fun := r.fun - 3; msg := msg || '，牠反咬一口（心情 −3）'; end if;
    if z.hp <= 1 then
      delete from public.town_zombies where id = z.id; killed := true;
      zk := case when (r.items->'zk'->>'d') = today then r.items->'zk' else jsonb_build_object('d', today, 'm', 0) end;
      got := coalesce((zk->>'m')::int, 0); rew := greatest(0, (60 + floor(random() * 81)::int));
      r.money := r.money + rew; r.items := jsonb_set(r.items, '{zk}', jsonb_build_object('d', today, 'm', got + rew));
      msg := '打倒了一隻喪屍豬' || case when rew > 0 then '，掉了 €' || rew else '（今天領的獎勵已達上限 €600）' end;
      if random() < .35 then r.items := jsonb_set(r.items, '{zp}', to_jsonb(coalesce((r.items->>'zp')::int, 0) + 1)); msg := msg || '，還掉了一塊生豬肉'; end if;
      insert into public.town_events(town_id, actor, kind, msg) values (tid, rid, 'zombie', r.name || ' 打倒了一隻喪屍豬');
    else
      update public.town_zombies set hp = hp - 1 where id = z.id;
    end if;
    perform public.town_save_r(r);
  elsif op = 'sell' then
    pork := coalesce((r.items->>'zp')::int, 0);
    if r.place <> 'market' then raise exception '生豬肉要拿到超市去賣'; end if;
    if pork < 1 then raise exception '你沒有生豬肉'; end if;
    r.money := r.money + 30 * pork; r.items := r.items - 'zp';
    msg := '賣了 ' || pork || ' 塊生豬肉，拿到 €' || (30 * pork);
    perform public.town_save_r(r);
  elsif op <> 'poll' then raise exception '不知道要做什麼';
  end if;
  select coalesce(json_agg(json_build_object('id', q.id, 'x', q.x, 'y', q.y, 'hp', q.hp) order by q.id), '[]'::json) into zl from public.town_zombies q where q.town_id = tid;
  return json_build_object('z', zl, 'night', not day, 'hit', hurt, 'killed', killed, 'msg', msg, 'pork', coalesce((r.items->>'zp')::int, 0));
end $$;
revoke all on function public.town_zombie(bigint,text,text,bigint) from public;
grant execute on function public.town_zombie(bigint,text,text,bigint) to anon, authenticated;

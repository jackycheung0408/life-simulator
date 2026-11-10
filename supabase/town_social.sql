-- 小豬鎮：設施小事件、同地點加成、邀請一起做（要在 town.sql 之後套用，可重複執行）
-- 不改 town_act：三個新函式都是獨立 RPC（town_pevent／town_invite），資料全存 items：
--   items.pe = {pl 目前地點, nx 下次事件時間, lp 最後一次回報上線, d 台灣日, n 今天已出現次數, q {k,at} 等待回答的事件}
--   items.tg = {d, n}   今天已拿過幾次「一起」加成（每人每天最多 8 次，防互相刷）
--   items.iv = {f 邀請人, at, p 地點}   收到的邀請（1 分鐘內有效）
--   items.cd['jt'||對方id] = 一起做的冷卻（30 分鐘）、items.cd['iv'||對方id] = 發邀請的冷卻（3 分鐘）

-- ── 事件效果表 ──
-- 地點 → 3 個事件 → 2 個選項 → [心情, 精力, 錢, 好感, 成功機率%, 失敗心情, 失敗精力, 失敗錢, 失敗好感]
-- 好感是對「同地點醒著的某人」（沒人就不算）。每個賭的選項期望值都略負，安全選項不給錢。
create or replace function public.town_pe_eff(pl text, k int, o int) returns int[] language sql immutable as $$
  select array(select jsonb_array_elements_text(('{
   "restaurant":[[[6,0,0,1,100,0,0,0,0],[12,0,-150,1,100,0,0,0,0]],[[10,0,0,0,50,-6,0,0,0],[3,0,-30,0,100,0,0,0,0]],[[15,0,340,0,10,-2,0,-60,0],[3,0,0,0,100,0,0,0,0]]],
   "market":[[[5,0,0,0,100,0,0,0,0],[8,0,-60,0,100,0,0,0,0]],[[10,-5,0,0,50,-6,-8,0,-1],[2,0,0,0,100,0,0,0,0]],[[12,0,200,0,30,-3,0,-120,0],[1,0,0,0,100,0,0,0,0]]],
   "cafe":[[[6,-3,0,1,100,0,0,0,0],[4,2,0,0,100,0,0,0,0]],[[12,-2,-90,0,100,0,0,0,0],[3,0,0,0,100,0,0,0,0]],[[5,0,-20,0,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]]],
   "cinema":[[[10,0,-90,0,100,0,0,0,0],[5,0,0,-1,100,0,0,0,0]],[[6,0,0,1,60,-5,0,0,-1],[1,-2,0,0,100,0,0,0,0]],[[12,0,250,0,15,-2,0,-50,0],[0,0,0,0,100,0,0,0,0]]],
   "gym":[[[4,-8,0,0,100,0,0,0,0],[6,2,0,1,100,0,0,0,0]],[[6,6,-60,0,100,0,0,0,0],[2,2,0,0,100,0,0,0,0]],[[12,-8,0,0,50,-8,-12,0,0],[3,0,0,1,100,0,0,0,0]]],
   "park":[[[8,0,0,1,100,0,0,0,0],[3,0,0,0,100,0,0,0,0]],[[10,-5,0,0,100,0,0,0,0],[4,0,0,0,100,0,0,0,0]],[[8,3,-60,0,100,0,0,0,0],[2,0,0,0,100,0,0,0,0]]],
   "plaza":[[[14,-3,0,0,50,-6,-3,0,0],[5,0,0,0,100,0,0,0,0]],[[6,-4,0,1,100,0,0,0,0],[-1,0,0,0,100,0,0,0,0]],[[12,0,260,0,12,-1,0,-40,0],[0,0,0,0,100,0,0,0,0]]],
   "office":[[[5,0,0,1,100,0,0,0,0],[0,-3,0,0,100,0,0,0,0]],[[4,-3,0,0,50,-6,-3,0,0],[8,-4,0,0,30,-4,-4,0,0]],[[8,3,-70,1,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]]],
   "arena":[[[14,-10,0,0,55,-8,-12,0,0],[5,0,0,1,100,0,0,0,0]],[[3,6,-50,0,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]],[[8,0,100,0,45,-4,0,-100,0],[1,0,0,0,100,0,0,0,0]]],
   "stock":[[[8,0,0,0,40,-6,0,0,0],[0,0,0,0,100,0,0,0,0]],[[5,-2,0,1,100,0,0,0,0],[1,0,0,0,100,0,0,0,0]],[[8,3,-90,1,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]]],
   "rafi":[[[8,-4,0,0,50,-8,-6,0,0],[-1,-2,0,0,100,0,0,0,0]],[[6,4,-100,0,100,0,0,0,0],[-3,0,0,0,100,0,0,0,0]],[[6,-2,0,1,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]]],
   "carshop":[[[10,-2,0,0,70,-6,-4,0,0],[2,0,0,0,100,0,0,0,0]],[[3,-3,0,1,100,0,0,0,0],[-1,0,0,0,100,0,0,0,0]],[[8,0,-100,0,100,0,0,0,0],[0,0,0,0,100,0,0,0,0]]],
   "slaughter":[[[10,-4,0,0,50,-10,-6,0,0],[0,0,0,0,100,0,0,0,0]],[[8,0,0,0,70,-8,0,0,0],[0,0,0,0,100,0,0,0,0]],[[8,0,-30,0,100,0,0,0,0],[-2,0,0,0,100,0,0,0,0]]]
  }'::jsonb) #> array[pl, k::text, o::text]))::int[]
$$;
create or replace function public.town_pe_place(pl text) returns boolean language sql immutable as $$
  select pl in ('restaurant','market','cafe','cinema','gym','park','plaza','office','arena','stock','rafi','carshop','slaughter')
$$;

-- 一起加成：每人每天最多 8 次，每次心情／精力小幅增加（只動記憶體裡的 r，呼叫端負責存檔）
create or replace function public.town_tg(r public.town_residents, f int, e int) returns public.town_residents language plpgsql as $$
declare day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); n int := 0;
begin
  if r.items->'tg'->>'d' = day then n := coalesce((r.items->'tg'->>'n')::int, 0); end if;
  if n >= 12 then return r; end if;
  r.items := jsonb_set(r.items, '{tg}', jsonb_build_object('d', day, 'n', n + 1));
  r.fun := least(100, r.fun + f); r.energy := least(100, r.energy + e);
  return r;
end $$;
create or replace function public.town_tg_left(r public.town_residents) returns int language sql immutable as $$
  select case when r.items->'tg'->>'d' = to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD') then greatest(0, 12 - coalesce((r.items->'tg'->>'n')::int, 0)) else 12 end
$$;

create or replace function public.town_save_r(r public.town_residents) returns void language sql as $$
  update public.town_residents set items = r.items, money = greatest(0, r.money), hunger = least(100, greatest(0, r.hunger)), energy = least(100, greatest(0, r.energy)),
    bladder = least(100, greatest(0, r.bladder)), hygiene = least(100, greatest(0, r.hygiene)), fun = least(100, greatest(0, r.fun)),
    sleeping = r.sleeping, bruised_until = r.bruised_until, updated_at = now() where id = r.id
$$;

-- ── 設施小事件：poll 看有沒有新事件（前端只在畫面開著時每 20 秒問一次），pick 選 0 或 1 ──
create or replace function public.town_pevent(rid bigint, pin text, op text default 'poll', item text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; pe jsonb; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  k int; o int; ef int[]; hit boolean; f int; e int; m int; b int; xid bigint; xname text; tgb boolean := false; dn int; q jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  pe := coalesce(r.items->'pe', '{}'::jsonb);
  dn := case when pe->>'d' = today then coalesce((pe->>'n')::int, 0) else 0 end;
  if op = 'poll' then
    if r.sleeping or not public.town_pe_place(r.place) then
      if pe <> '{}'::jsonb then update public.town_residents set items = items - 'pe' where id = rid; end if;
      return json_build_object('ev', null);
    end if;
    -- 換地點、或超過 5 分鐘沒回報（離線）：重新計時，不累積
    if pe->>'pl' is distinct from r.place or pe->>'lp' is null or (pe->>'lp')::timestamptz < now() - interval '5 minutes' then
      pe := jsonb_build_object('pl', r.place, 'nx', now() + (10 + random() * 10) * interval '1 minute', 'lp', now(), 'd', today, 'n', dn);
      update public.town_residents set items = jsonb_set(items, '{pe}', pe) where id = rid;
      return json_build_object('ev', null);
    end if;
    pe := pe || jsonb_build_object('lp', now(), 'd', today, 'n', dn);
    q := pe->'q';
    if q is not null and (q->>'at')::timestamptz < now() - interval '5 minutes' then pe := pe - 'q'; q := null; end if;
    if q is null and now() >= (pe->>'nx')::timestamptz and dn < 12 then
      q := jsonb_build_object('k', floor(random() * 3)::int, 'at', now());
      pe := pe || jsonb_build_object('q', q, 'nx', now() + (10 + random() * 10) * interval '1 minute', 'n', dn + 1);
    elsif q is null and now() >= (pe->>'nx')::timestamptz then
      pe := pe || jsonb_build_object('nx', now() + interval '20 minutes');
    end if;
    update public.town_residents set items = jsonb_set(items, '{pe}', pe) where id = rid;
    return json_build_object('ev', case when q is null then null else json_build_object('pl', r.place, 'k', (q->>'k')::int, 'at', q->>'at') end);
  elsif op = 'pick' then
    q := pe->'q';
    if q is null or pe->>'pl' is distinct from r.place or (q->>'at')::timestamptz < now() - interval '5 minutes' then raise exception '這個事件已經過去了'; end if;
    if item not in ('0','1') then raise exception '選項不對'; end if;
    o := item::int; k := (q->>'k')::int;
    ef := public.town_pe_eff(r.place, k, o);
    if least(ef[3], ef[8]) < 0 and r.money < -least(ef[3], ef[8]) then raise exception '錢不夠，這個選項最多要花 €%', -least(ef[3], ef[8]); end if;
    hit := random() * 100 < ef[5];
    f := case when hit then ef[1] else ef[6] end; e := case when hit then ef[2] else ef[7] end;
    m := case when hit then ef[3] else ef[8] end; b := case when hit then ef[4] else ef[9] end;
    r.fun := r.fun + f; r.energy := r.energy + e; r.money := r.money + m;
    select id, name into xid, xname from public.town_residents where town_id = r.town_id and place = r.place and id <> rid and not sleeping order by random() limit 1;
    if xid is not null then
      if b <> 0 then perform public.town_bond(r.town_id, rid, xid, b); end if;
      tgb := public.town_tg_left(r) > 0; r := public.town_tg(r, 4, 2);   -- 有人一起：加成（每天最多 12 次）
    end if;
    pe := (pe - 'q') || jsonb_build_object('lp', now());
    r.items := jsonb_set(r.items, '{pe}', pe);
    perform public.town_save_r(r);
    return json_build_object('hit', hit, 'f', f, 'e', e, 'm', m, 'b', case when xid is null then 0 else b end, 'who', xname, 'tg', tgb);
  end if;
  raise exception '不明的操作';
end $$;
revoke all on function public.town_pevent(bigint,text,text,text) from public;
grant execute on function public.town_pevent(bigint,text,text,text) to anon, authenticated;

-- ── 邀請一起做：send（target = 對方）、yes（target = 邀請人）、no ──
create or replace function public.town_invite(rid bigint, pin text, op text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; iv jsonb; ra int; ta int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if not public.town_pe_place(r.place) then raise exception '要在設施或公園、廣場才能邀請'; end if;
  if target is null or target = rid then raise exception '要選一位鄰居'; end if;
  select * into t from public.town_residents where id = target and town_id = r.town_id for update;
  if not found then raise exception '找不到這位鄰居'; end if;
  t := public.town_tick(t);
  if op = 'send' then
    if t.sleeping or t.place is distinct from r.place then raise exception '% 不在這裡，或在睡覺', t.name; end if;
    if (r.items->'cd'->>('jt' || t.id))::timestamptz > now() - interval '30 minutes' then raise exception '你們剛一起做過了，30 分鐘後再約'; end if;
    if (r.items->'cd'->>('iv' || t.id))::timestamptz > now() - interval '3 minutes' then raise exception '剛邀請過了，等他回覆'; end if;
    iv := t.items->'iv';
    if iv is not null and (iv->>'at')::timestamptz > now() - interval '1 minute' and (iv->>'f')::bigint <> rid then raise exception '% 正在回覆別人的邀請', t.name; end if;
    update public.town_residents set items = jsonb_set(items, '{iv}', jsonb_build_object('f', rid, 'at', now(), 'p', r.place)) where id = t.id;
    update public.town_residents set items = jsonb_set(items, '{cd}', coalesce(items->'cd','{}'::jsonb) || jsonb_build_object('iv' || t.id, now())) where id = rid;
    return json_build_object('sent', true);
  elsif op = 'no' then
    update public.town_residents set items = items - 'iv' where id = rid;
    return json_build_object('ok', true);
  elsif op = 'yes' then
    iv := r.items->'iv';
    if iv is null or (iv->>'f')::bigint <> target or (iv->>'at')::timestamptz < now() - interval '1 minute' then raise exception '邀請已經過期了'; end if;
    if t.sleeping or t.place is distinct from r.place or iv->>'p' is distinct from r.place then raise exception '% 已經離開了', t.name; end if;
    ra := public.town_tg_left(r); ta := public.town_tg_left(t);
    r := public.town_tg(r, 12, 5); t := public.town_tg(t, 12, 5);
    perform public.town_bond(r.town_id, rid, t.id, 1);
    r.items := (r.items - 'iv') || jsonb_build_object('cd', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('jt' || t.id, now()));
    t.items := jsonb_set(t.items, '{cd}', coalesce(t.items->'cd','{}'::jsonb) || jsonb_build_object('jt' || rid, now()));
    perform public.town_save_r(r); perform public.town_save_r(t);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, target, rid, 'joint', t.name || ' 和 ' || r.name || ' 在' || public.town_place_name(r.place) || '一起度過了一段時光');
    return json_build_object('ok', true, 'bonus', ra > 0, 'who', t.name);
  end if;
  raise exception '不明的操作';
end $$;
revoke all on function public.town_invite(bigint,text,text,bigint) from public;
grant execute on function public.town_invite(bigint,text,text,bigint) to anon, authenticated;
revoke all on function public.town_pe_eff(text,int,int), public.town_pe_place(text), public.town_tg(public.town_residents,int,int), public.town_tg_left(public.town_residents), public.town_save_r(public.town_residents) from public, anon, authenticated;

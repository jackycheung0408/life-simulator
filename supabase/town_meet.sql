-- 小豬鎮：揪團（約吃約玩）。要在 town.sql 之後套用，可重複執行；不改 town_act。
-- 類型→集合地點：meal 餐廳、cafe 咖啡廳、movie 電影院、gym 健身房、pk 格鬥場、casino 賭場、free 廣場。
-- 發起：時間 10/30/60/120 分鐘後、人數上限 2～8、備註 ≤20 字且禁網址；同時只能發起 1 團、同時最多參加 3 團（含自己發起的）、每天最多發起 5 團。
-- 出席：集合時間起 15 分鐘內，報名且 place 與集合地點相符才記出席（claim，自己呼叫或 list/join 時順帶補記）；時間到後惰性結算：
--   出席 >= 2 人成團，每位出席者心情 +10、精力 +3、對其他出席者好感 +1（town_bond）、items.mt={n,last,d,dn}；每人每天最多 3 次獎勵（超過仍累計 n 但不給效果）；
--   沒人到或只有 1 人流團，寫動態。不給錢。稱號：出席 1／10／25 次 揪團新手／人氣王／團長。
create table if not exists public.town_meets (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  host bigint not null, k text not null, place text not null,
  at timestamptz not null, cap int not null, note text not null default '',
  members bigint[] not null default '{}', attended bigint[] not null default '{}',
  status text not null default 'open', created_at timestamptz not null default now()
);
alter table public.town_meets enable row level security;
create index if not exists town_meets_town on public.town_meets(town_id, status, at);

create or replace function public.town_meet_place(k text) returns text language sql immutable as $$
  select case k when 'meal' then 'restaurant' when 'cafe' then 'cafe' when 'movie' then 'cinema' when 'gym' then 'gym'
    when 'pk' then 'arena' when 'casino' then 'casino' when 'free' then 'plaza' else null end
$$;
create or replace function public.town_meet_name(k text) returns text language sql immutable as $$
  select case k when 'meal' then '聚餐' when 'cafe' then '喝咖啡' when 'movie' then '看電影' when 'gym' then '運動'
    when 'pk' then 'PK 賽' when 'casino' then '賭場夜' else '自訂聚會' end
$$;

-- 結算到期的團（集合時間 + 15 分鐘後）
create or replace function public.town_meet_settle(tid text) returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare m public.town_meets; a bigint; b bigint; p public.town_residents; mt jsonb; n int; dn int; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  ttl jsonb; tt text; names text;
begin
  for m in select * from public.town_meets where town_id = tid and status = 'open' and at + interval '15 minutes' <= now() order by id for update loop
    if cardinality(m.attended) >= 2 then
      foreach a in array m.attended loop
        select * into p from public.town_residents where id = a for update;
        if p.id is null then continue; end if;
        mt := coalesce(p.items->'mt', '{}'::jsonb);
        n := coalesce((mt->>'n')::int, 0) + 1;
        dn := case when mt->>'d' = today then coalesce((mt->>'dn')::int, 0) else 0 end;
        if dn < 3 then
          dn := dn + 1;
          p.fun := least(100, p.fun + 10); p.energy := least(100, p.energy + 3);
        end if;
        p.items := jsonb_set(p.items, '{mt}', jsonb_build_object('n', n, 'last', m.id, 'd', today, 'dn', dn));
        tt := case when n = 25 then '團長' when n = 10 then '人氣王' when n = 1 then '揪團新手' else null end;
        if tt is not null then
          ttl := coalesce(p.items->'titles', '[]'::jsonb);
          if not (ttl ? tt) then p.items := jsonb_set(p.items, '{titles}', ttl || to_jsonb(tt)); end if;
        end if;
        perform public.town_save_r(p);
      end loop;
      foreach a in array m.attended loop foreach b in array m.attended loop
        if a < b then perform public.town_bond(tid, a, b, 1); end if;
      end loop; end loop;
      select string_agg(name, '、') into names from public.town_residents where id = any(m.attended);
      insert into public.town_events(town_id,actor,kind,msg) values (tid, m.host, 'meet', left(public.town_meet_name(m.k) || '成團！' || cardinality(m.attended) || ' 人到場：' || names, 120));
      update public.town_meets set status = 'done' where id = m.id;
    else
      select name into names from public.town_residents where id = m.host;
      insert into public.town_events(town_id,actor,kind,msg) values (tid, m.host, 'meet', left(coalesce(names,'') || ' 揪的' || public.town_meet_name(m.k) || '流團了（到場不到 2 人）', 120));
      update public.town_meets set status = 'fail' where id = m.id;
    end if;
  end loop;
end $$;
revoke all on function public.town_meet_settle(text) from public, anon, authenticated;

create or replace function public.town_meet(rid bigint, pin text, op text default 'list', id bigint default null, k text default null, num int default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; m public.town_meets; today_start timestamptz := (date_trunc('day', now() at time zone 'Asia/Taipei')) at time zone 'Asia/Taipei';
  pl text; cnt int; nt text; mins int; hid bigint; got boolean := false;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  perform public.town_meet_settle(r.town_id);
  -- 順帶補記自己的出席（在時間窗內、報名了、人在集合地點）
  update public.town_meets t set attended = attended || r.id
    where t.town_id = r.town_id and t.status = 'open' and r.id = any(t.members) and not (r.id = any(t.attended))
      and now() >= t.at and now() < t.at + interval '15 minutes' and r.place = t.place and not r.sleeping and not public.town_jailed(r);
  get diagnostics cnt = row_count; got := cnt > 0;
  if op = 'claim' then
    return json_build_object('ok', true, 'claimed', got);
  elsif op = 'create' then
    pl := public.town_meet_place(k);
    if pl is null then return json_build_object('error','不認識的聚會類型'); end if;
    mins := num / 1000;   -- num = 分鐘數 × 1000 + 人數上限（例：30 分鐘、6 人 = 30006）
    cnt := num % 1000;
    if mins not in (10,30,60,120) then return json_build_object('error','時間要選 10／30／60／120 分鐘後'); end if;
    if cnt < 2 or cnt > 8 then return json_build_object('error','人數上限是 2～8 人'); end if;
    nt := btrim(coalesce(note, ''));
    if char_length(nt) > 20 then return json_build_object('error','備註最多 20 字'); end if;
    if nt ~* '(https?:|www\.|://|[a-z0-9-]+\.(com|net|org|tw|io|co|me|cc|gg|ly|xyz|app|dev)|line\.me|@)' then return json_build_object('error','備註不能放網址'); end if;
    if public.town_jailed(r) then return json_build_object('error','你在牢裡，不能揪團'); end if;
    if exists (select 1 from public.town_meets t where t.host = r.id and t.status = 'open') then return json_build_object('error','你已經有一團進行中，先等它結束或取消'); end if;
    if (select count(*) from public.town_meets t where t.host = r.id and t.created_at >= today_start) >= 5 then return json_build_object('error','今天最多發起 5 團'); end if;
    if (select count(*) from public.town_meets t where t.status = 'open' and r.id = any(t.members)) >= 3 then return json_build_object('error','你同時最多參加 3 團'); end if;
    insert into public.town_meets(town_id,host,k,place,at,cap,note,members) values (r.town_id, r.id, k, pl, now() + make_interval(mins => mins), cnt, nt, array[r.id]) returning * into m;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'meet', left(r.name || ' 揪了' || public.town_meet_name(k) || '，' || mins || ' 分鐘後在' || public.town_place_name(pl) || '集合（上限 ' || cnt || ' 人）', 120));
    return json_build_object('ok', true, 'id', m.id);
  elsif op = 'join' then
    select * into m from public.town_meets t where t.id = id and t.town_id = r.town_id for update;
    if m.id is null or m.status <> 'open' then return json_build_object('error','這團已經結束了'); end if;
    if now() >= m.at then return json_build_object('error','集合時間到了，不能再報名'); end if;
    if r.id = any(m.members) then return json_build_object('error','你已經報名了'); end if;
    if cardinality(m.members) >= m.cap then return json_build_object('error','人數滿了'); end if;
    if public.town_jailed(r) then return json_build_object('error','你在牢裡'); end if;
    if (select count(*) from public.town_meets t where t.status = 'open' and r.id = any(t.members)) >= 3 then return json_build_object('error','你同時最多參加 3 團'); end if;
    update public.town_meets t set members = members || r.id where t.id = m.id;
    return json_build_object('ok', true);
  elsif op = 'leave' then
    select * into m from public.town_meets t where t.id = id and t.town_id = r.town_id for update;
    if m.id is null or m.status <> 'open' or not (r.id = any(m.members)) then return json_build_object('error','你沒有報名這團'); end if;
    if m.host = r.id then return json_build_object('error','發起人要用「取消整團」'); end if;
    if now() >= m.at then return json_build_object('error','集合時間到了'); end if;
    update public.town_meets t set members = array_remove(members, r.id) where t.id = m.id;
    return json_build_object('ok', true);
  elsif op = 'cancel' then
    select * into m from public.town_meets t where t.id = id and t.town_id = r.town_id for update;
    if m.id is null or m.status <> 'open' or m.host <> r.id then return json_build_object('error','只有發起人能取消進行中的團'); end if;
    if now() >= m.at then return json_build_object('error','集合時間到了，不能取消'); end if;
    update public.town_meets t set status = 'cancel' where t.id = m.id;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'meet', left(r.name || ' 取消了' || public.town_meet_name(m.k), 120));
    return json_build_object('ok', true);
  elsif op <> 'list' then
    return json_build_object('error','未知動作');
  end if;
  return json_build_object('now', now(), 'claimed', got,
    'meets', coalesce((select json_agg(json_build_object('id', t.id, 'host', t.host, 'hn', h.name, 'k', t.k, 'place', t.place, 'at', t.at, 'cap', t.cap, 'note', t.note,
        'members', t.members, 'attended', t.attended, 'status', t.status) order by t.at)
      from public.town_meets t join public.town_residents h on h.id = t.host
      where t.town_id = r.town_id and t.status = 'open'), '[]'::json),
    'mt', coalesce(r.items->'mt', '{}'::jsonb));
end $$;
revoke all on function public.town_meet(bigint,text,text,bigint,text,int,text) from public;
grant execute on function public.town_meet(bigint,text,text,bigint,text,int,text) to anon, authenticated;

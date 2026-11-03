-- 小豬鎮（多個小鎮）：任何人都能建立自己的小鎮，拿到邀請碼的人才能搬進來
-- 每鎮最多 12 人；房子一排 3 間，住滿就自動擴建新街（最多 4 排）
-- 所有改動都經過下面的資料庫函式，網頁不能直接改數字。這個檔案可以重複執行，不會清掉資料

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.town_towns (
  id text primary key,                                   -- 網址上的小鎮代碼
  name text not null check (char_length(name) between 1 and 16),
  invite text not null,                                  -- 邀請碼：只有鎮長看得到
  rows int not null default 2 check (rows between 2 and 4),
  created_at timestamptz not null default now()
);
create table if not exists public.town_residents (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  mayor boolean not null default false,
  slot int not null check (slot between 0 and 11),
  look jsonb not null default '{}'::jsonb,
  pin_hash text not null,
  fails int not null default 0,
  lock_until timestamptz,
  x real not null, y real not null,
  place text not null,
  sleeping boolean not null default false,
  hunger real not null default 80, energy real not null default 80, bladder real not null default 80,
  hygiene real not null default 80, fun real not null default 80,
  money int not null default 200,
  updated_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  unique (town_id, slot)
);
create unique index if not exists town_residents_name on public.town_residents(town_id, lower(name));
create table if not exists public.town_events (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  at timestamptz not null default now(),
  actor bigint, target bigint, kind text not null,
  msg text not null check (char_length(msg) <= 120)
);
create index if not exists town_events_town_at on public.town_events(town_id, at desc);

alter table public.town_towns enable row level security;
alter table public.town_residents enable row level security;
alter table public.town_events enable row level security;
revoke all on public.town_towns, public.town_residents, public.town_events from anon, authenticated;

-- ── 工具 ──
create or replace function public.town_code(n int) returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random()*31)::int, 1), '') from generate_series(1, n)
$$;
-- 第幾間房子的門口位置（和網頁上的地圖一致）
create or replace function public.town_door(slot int, out dx real, out dy real) language sql immutable as $$
  select ((array[2,9,20])[slot % 3 + 1] + 2)::real,
         ((case slot / 3 when 0 then 1 when 1 then 17 else 24 + 7 * (slot / 3 - 2) end) + 4)::real
$$;
create or replace function public.town_street(k int) returns text language sql immutable as $$
  select (array['小豬大道','豬尾巴街','豬鼻子街','豬蹄巷'])[k + 1]
$$;
create or replace function public.town_place_name(p text) returns text language sql stable as $$
  select case
    when p like 'home:%' then coalesce((select name from public.town_residents where id = substr(p,6)::bigint), '空屋') || ' 家'
    when p = 'plaza' then '廣場' when p = 'restaurant' then '餐廳' when p = 'market' then '超市'
    when p = 'office' then '公司' when p = 'park' then '公園' else '路上' end
$$;
create or replace function public.town_name_ok(t text) returns boolean language sql immutable as $$
  select char_length(trim(t)) between 1 and 12 and trim(t) !~ '[<>"]' and not public.has_bad_words(t)
$$;

-- 需求隨時間變化（每小時）；醒著掉得快、睡覺時精力回升。累到 0 會原地睡著、膀胱到 0 會尿褲子
create or replace function public.town_tick(r public.town_residents) returns public.town_residents
language plpgsql as $$
declare h real := least(72, greatest(0, extract(epoch from now() - r.updated_at) / 3600));
begin
  if h <= 0 then return r; end if;
  if r.sleeping then
    r.energy := r.energy + 14*h; r.hunger := r.hunger - 1.5*h; r.bladder := r.bladder - 1.5*h; r.hygiene := r.hygiene - .5*h; r.fun := r.fun - .3*h;
  else
    r.hunger := r.hunger - 4*h; r.energy := r.energy - 3*h; r.bladder := r.bladder - 5*h; r.hygiene := r.hygiene - 2.5*h; r.fun := r.fun - 2*h;
  end if;
  if r.bladder <= 0 then
    r.bladder := 100; r.hygiene := 0; r.fun := r.fun - 15;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'accident', r.name || ' 來不及上廁所，尿褲子了');
  end if;
  if not r.sleeping and r.energy <= 0 then
    r.sleeping := true; r.energy := 0;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'passout', r.name || ' 累到在' || public.town_place_name(r.place) || '直接睡著了');
  end if;
  r.hunger := least(100, greatest(0, r.hunger)); r.energy := least(100, greatest(0, r.energy)); r.bladder := least(100, greatest(0, r.bladder));
  r.hygiene := least(100, greatest(0, r.hygiene)); r.fun := least(100, greatest(0, r.fun));
  r.updated_at := now();
  return r;
end $$;

create or replace function public.town_pub(r public.town_residents) returns json language sql stable as $$
  select json_build_object('id',r.id,'name',r.name,'mayor',r.mayor,'slot',r.slot,'look',r.look,'x',r.x,'y',r.y,'place',r.place,
    'sleeping',r.sleeping,'hunger',r.hunger,'energy',r.energy,'bladder',r.bladder,'hygiene',r.hygiene,'fun',r.fun,
    'money',r.money,'updated_at',r.updated_at,'seen_at',r.seen_at)
$$;

-- 讀整個小鎮（順便把每個人的需求更新到現在）＋最近的動態
create or replace function public.town_state(tid text) returns json
language plpgsql security definer set search_path = public as $$
declare t public.town_towns; r public.town_residents; acc json[] := '{}';
begin
  select * into t from public.town_towns where id = upper(trim(tid));
  if not found then raise exception '找不到這個小鎮，確認一下代碼'; end if;
  for r in select * from public.town_residents where town_id = t.id order by slot for update loop
    r := public.town_tick(r);
    update public.town_residents set hunger=r.hunger,energy=r.energy,bladder=r.bladder,hygiene=r.hygiene,fun=r.fun,sleeping=r.sleeping,updated_at=r.updated_at where id=r.id;
    acc := acc || public.town_pub(r);
  end loop;
  return json_build_object('now',now(),'town',json_build_object('id',t.id,'name',t.name,'rows',t.rows),'residents',array_to_json(acc),
    'events',(select coalesce(json_agg(e order by e.at desc, e.id desc),'[]') from
      (select id,at,actor,target,kind,msg from public.town_events where town_id = t.id order by at desc, id desc limit 60) e));
end $$;

-- 驗證密碼：連錯 5 次鎖 10 分鐘。錯的時候回傳 id 是 null（不用 raise，raise 會把錯誤次數一起復原）
create or replace function public.town_auth(rid bigint, pin text) returns public.town_residents
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  select * into r from public.town_residents where id = rid for update;
  if not found then raise exception '找不到這位居民，可能已經搬走了'; end if;
  if r.lock_until is not null and r.lock_until > now() then raise exception '密碼錯太多次，請 10 分鐘後再試'; end if;
  if extensions.crypt(coalesce(pin,''), r.pin_hash) <> r.pin_hash then
    update public.town_residents set fails = fails + 1, lock_until = case when fails + 1 >= 5 then now() + interval '10 minutes' end where id = rid;
    r.id := null; return r;
  end if;
  if r.fails > 0 then update public.town_residents set fails = 0, lock_until = null where id = rid; end if;
  return public.town_tick(r);
end $$;

-- 建立新小鎮：自己當鎮長，住第 1 間
create or replace function public.town_create(town_name text, my_name text, pin text, look jsonb default '{}'::jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare tid text; inv text := public.town_code(6); d record; rid bigint;
begin
  if pin !~ '^\d{4}$' then raise exception '密碼要是 4 位數字'; end if;
  if char_length(trim(town_name)) not between 1 and 16 or trim(town_name) ~ '[<>"]' or public.has_bad_words(town_name) then raise exception '小鎮名稱要 1～16 個字'; end if;
  if not public.town_name_ok(my_name) then raise exception '名字要 1～12 個字'; end if;
  if (select count(*) from public.town_towns where created_at > now() - interval '1 hour') >= 30 then raise exception '現在建立小鎮的人太多了，晚點再試'; end if;
  loop tid := public.town_code(6); exit when not exists (select 1 from public.town_towns where id = tid); end loop;
  insert into public.town_towns(id,name,invite) values (tid, trim(town_name), inv);
  select * into d from public.town_door(0);
  insert into public.town_residents(town_id,name,mayor,slot,look,pin_hash,x,y,place)
    values (tid, trim(my_name), true, 0, case when pg_column_size(look) < 600 then look else '{}'::jsonb end, extensions.crypt(pin, extensions.gen_salt('bf')), d.dx, d.dy, 'home:0')
    returning id into rid;
  update public.town_residents set place = 'home:' || rid where id = rid;
  insert into public.town_events(town_id,actor,kind,msg) values (tid, rid, 'found', trim(my_name) || ' 建立了「' || trim(town_name) || '」，當上鎮長');
  return json_build_object('town_id',tid,'resident_id',rid,'invite',inv);
end $$;

-- 用邀請碼搬進來：可以指定空屋，沒指定就住最前面的空屋；住滿一排會自動擴建新街
create or replace function public.town_join(tid text, invite text, my_name text, pin text, look jsonb default '{}'::jsonb, want_slot int default null) returns json
language plpgsql security definer set search_path = public as $$
declare t public.town_towns; s int; d record; rid bigint; need int;
begin
  select * into t from public.town_towns where id = upper(trim(tid)) for update;
  if not found then raise exception '找不到這個小鎮'; end if;
  if upper(trim(coalesce(invite,''))) <> t.invite then raise exception '邀請碼不對，請問鎮長'; end if;
  if pin !~ '^\d{4}$' then raise exception '密碼要是 4 位數字'; end if;
  if not public.town_name_ok(my_name) then raise exception '名字要 1～12 個字'; end if;
  if exists (select 1 from public.town_residents where town_id = t.id and lower(name) = lower(trim(my_name))) then raise exception '鎮上已經有人叫 %，換一個名字', trim(my_name); end if;
  if (select count(*) from public.town_residents where town_id = t.id) >= 12 then raise exception '小鎮已經住滿 12 人了'; end if;
  if want_slot is not null and want_slot between 0 and 11 and not exists (select 1 from public.town_residents where town_id = t.id and slot = want_slot) then s := want_slot;
  else select min(g) into s from generate_series(0,11) g where not exists (select 1 from public.town_residents where town_id = t.id and slot = g); end if;
  need := greatest(t.rows, s / 3 + 1);
  if need > t.rows then
    update public.town_towns set rows = need where id = t.id;
    insert into public.town_events(town_id,kind,msg) values (t.id, 'expand', '小鎮擴建了' || public.town_street(need - 1) || '！');
  end if;
  select * into d from public.town_door(s);
  insert into public.town_residents(town_id,name,slot,look,pin_hash,x,y,place)
    values (t.id, trim(my_name), s, case when pg_column_size(look) < 600 then look else '{}'::jsonb end, extensions.crypt(pin, extensions.gen_salt('bf')), d.dx, d.dy, 'home:0')
    returning id into rid;
  update public.town_residents set place = 'home:' || rid where id = rid;
  insert into public.town_events(town_id,actor,kind,msg) values (t.id, rid, 'join', trim(my_name) || ' 搬進了' || public.town_street(s / 3));
  return json_build_object('town_id',t.id,'resident_id',rid);
end $$;

-- 登入（也用來換造型）
create or replace function public.town_login(rid bigint, pin text, new_look jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if new_look is not null and pg_column_size(new_look) < 600 then update public.town_residents set look = new_look where id = rid; end if;
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok',true,'town_id',r.town_id,'last_seen',r.seen_at);
end $$;

-- 鎮長：看邀請碼、換邀請碼、請人搬走
create or replace function public.town_mayor(rid bigint, pin text, act text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; inv text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if not r.mayor then raise exception '只有鎮長可以做這件事'; end if;
  if act = 'invite' then select invite into inv from public.town_towns where id = r.town_id;
  elsif act = 'newinvite' then inv := public.town_code(6); update public.town_towns set invite = inv where id = r.town_id;
  elsif act = 'kick' then
    select * into t from public.town_residents where id = target and town_id = r.town_id;
    if not found or t.id = r.id then raise exception '不能請這位搬走'; end if;
    delete from public.town_residents where id = t.id;
    update public.town_residents set place = 'street' where town_id = r.town_id and place = 'home:' || t.id;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'leave', t.name || ' 搬離了小鎮');
  else raise exception '不知道要做什麼'; end if;
  return json_build_object('ok',true,'invite',inv);
end $$;

-- 所有動作：移動、自己家裡的事、公共場所、對朋友做的事
create or replace function public.town_act(rid bigint, pin text, act text, target bigint default null, px real default null, py real default null, dest text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; others text; tn text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if act = 'move' then
    if dest is null or not (dest in ('plaza','restaurant','market','office','park','street')
       or (dest ~ '^home:\d+$' and exists (select 1 from public.town_residents where id = substr(dest,6)::bigint and town_id = r.town_id))) then raise exception '去不了那裡'; end if;
    if px is null or py is null or px < 0 or px > 34 or py < 0 or py > 40 then raise exception '位置不對'; end if;
    r.x := px; r.y := py; r.place := dest; r.sleeping := false;
    if dest in ('plaza','restaurant','market','park') then
      select string_agg(name, '、') into others from public.town_residents where town_id = r.town_id and place = dest and id <> rid;
      if others is not null and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'meet' and e.at > now() - interval '2 hours') then
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'meet', r.name || ' 在' || public.town_place_name(dest) || '遇到了 ' || others);
        r.fun := r.fun + 10;
      end if;
    end if;
  elsif act in ('eat','toilet','shower','tv','sleep') then
    if r.place <> 'home:' || rid then raise exception '要先回家'; end if;
    if act = 'eat' then if r.money < 10 then raise exception '錢不夠買食材，去公司打工吧'; end if; r.hunger := r.hunger + 40; r.money := r.money - 10;
    elsif act = 'toilet' then r.bladder := 100;
    elsif act = 'shower' then r.hygiene := 100; r.fun := r.fun + 3;
    elsif act = 'tv' then r.fun := r.fun + 25; r.energy := r.energy - 3;
    elsif act = 'sleep' then r.sleeping := true; end if;
  elsif act = 'wake' then r.sleeping := false;
  elsif act in ('dine','work','play','browse') then
    if (act = 'dine' and r.place <> 'restaurant') or (act = 'work' and r.place <> 'office') or (act = 'play' and r.place not in ('park','plaza')) or (act = 'browse' and r.place <> 'market') then raise exception '不在那個地方'; end if;
    if act = 'dine' then if r.money < 30 then raise exception '錢不夠，去公司打工吧'; end if; r.hunger := r.hunger + 55; r.fun := r.fun + 10; r.money := r.money - 30;
    elsif act = 'work' then if r.energy < 15 then raise exception '太累了，先回家睡覺'; end if; r.money := r.money + 120; r.energy := r.energy - 15; r.fun := r.fun - 10; r.hunger := r.hunger - 8;
    elsif act = 'play' then r.fun := r.fun + 20; r.energy := r.energy - 5;
    else r.fun := r.fun + 6; end if;
  elsif act in ('feed','wash','wakeup','visit','prank') then
    if target is null or target = rid then raise exception '要選一位朋友'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    if r.place <> 'home:' || target then raise exception '要先走到他家'; end if;
    if t.place <> 'home:' || target then raise exception '% 不在家，在%', t.name, public.town_place_name(t.place); end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = act and e.at > now() - interval '2 hours') then raise exception '剛剛才做過，等一下再來'; end if;
    t := public.town_tick(t); tn := t.name;
    if act = 'feed' then if r.money < 10 then raise exception '錢不夠買食材'; end if; t.hunger := t.hunger + 35; r.money := r.money - 10; r.fun := r.fun + 5;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 煮了一餐給 ' || tn || ' 吃');
    elsif act = 'wash' then t.hygiene := t.hygiene + 45;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 幫 ' || tn || ' 洗了澡');
    elsif act = 'wakeup' then if not t.sleeping then raise exception '% 醒著', tn; end if; t.sleeping := false; t.fun := t.fun - 5;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 把 ' || tn || ' 叫醒了');
    elsif act = 'visit' then t.fun := t.fun + 15; r.fun := r.fun + 15;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 去 ' || tn || ' 家串門子');
    else t.fun := t.fun - 8; r.fun := r.fun + 12;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口放了一個臭屁');
    end if;
    update public.town_residents set hunger=least(100,t.hunger),energy=t.energy,bladder=t.bladder,hygiene=least(100,t.hygiene),fun=least(100,greatest(0,t.fun)),sleeping=t.sleeping,updated_at=t.updated_at where id=t.id;
  else raise exception '不知道要做什麼';
  end if;
  update public.town_residents set x=r.x,y=r.y,place=r.place,sleeping=r.sleeping,
    hunger=least(100,greatest(0,r.hunger)),energy=least(100,greatest(0,r.energy)),bladder=least(100,greatest(0,r.bladder)),
    hygiene=least(100,greatest(0,r.hygiene)),fun=least(100,greatest(0,r.fun)),money=greatest(0,r.money),updated_at=now(),seen_at=now() where id=rid;
  return public.town_state(r.town_id);
end $$;

revoke all on function public.town_tick(public.town_residents), public.town_pub(public.town_residents), public.town_auth(bigint,text),
  public.town_code(int), public.town_door(int), public.town_street(int), public.town_place_name(text), public.town_name_ok(text) from public, anon, authenticated;
revoke all on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text) from public;
grant execute on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text) to anon, authenticated;

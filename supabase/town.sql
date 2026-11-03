-- 小豬鎮：6 位居民、需求隨現實時間下降、所有改動都經過資料庫函式（網頁不能直接改數字）
-- 邀請碼不放在這個檔案：第一次入住要輸入邀請碼，邀請碼另外用
--   insert into public.town_config(k,v) values ('invite', extensions.crypt('邀請碼', extensions.gen_salt('bf')))
--   on conflict (k) do update set v = excluded.v;
-- 設定

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.town_config (k text primary key, v text not null);

create table if not exists public.town_residents (
  id text primary key check (id in ('jacky','abel','cerina','bear','mike','rafael')),
  name text not null,
  look jsonb not null default '{}'::jsonb,
  pin_hash text,
  fails int not null default 0,
  lock_until timestamptz,
  x real not null, y real not null,
  place text not null,
  sleeping boolean not null default false,
  hunger real not null default 80, energy real not null default 80, bladder real not null default 80,
  hygiene real not null default 80, fun real not null default 80,
  money int not null default 200,
  updated_at timestamptz not null default now(),
  seen_at timestamptz
);
insert into public.town_residents(id,name,x,y,place) values
 ('jacky','Jacky',4,5,'home:jacky'),('abel','Abel',11,5,'home:abel'),('cerina','Cerina',22,5,'home:cerina'),
 ('bear','Bear',4,21,'home:bear'),('mike','Mike',11,21,'home:mike'),('rafael','Rafael',22,21,'home:rafael')
on conflict (id) do nothing;

create table if not exists public.town_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null, target text, kind text not null,
  msg text not null check (char_length(msg) <= 120)
);
create index if not exists town_events_at on public.town_events(at desc);

alter table public.town_config enable row level security;
alter table public.town_residents enable row level security;
alter table public.town_events enable row level security;
revoke all on public.town_config, public.town_residents, public.town_events from anon, authenticated;

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
    insert into public.town_events(actor,kind,msg) values (r.id,'accident', r.name || ' 來不及上廁所，尿褲子了');
  end if;
  if not r.sleeping and r.energy <= 0 then
    r.sleeping := true; r.energy := 0;
    insert into public.town_events(actor,kind,msg) values (r.id,'passout', r.name || ' 累到在' || public.town_place_name(r.place) || '直接睡著了');
  end if;
  r.hunger := least(100, greatest(0, r.hunger)); r.energy := least(100, greatest(0, r.energy)); r.bladder := least(100, greatest(0, r.bladder));
  r.hygiene := least(100, greatest(0, r.hygiene)); r.fun := least(100, greatest(0, r.fun));
  r.updated_at := now();
  return r;
end $$;

create or replace function public.town_place_name(p text) returns text language sql stable as $$
  select case
    when p like 'home:%' then (select name from public.town_residents where id = substr(p,6)) || ' 家'
    when p = 'plaza' then '廣場' when p = 'restaurant' then '餐廳' when p = 'market' then '超市'
    when p = 'office' then '公司' when p = 'park' then '公園' else '路上' end
$$;

create or replace function public.town_pub(r public.town_residents) returns json language sql stable as $$
  select json_build_object('id',r.id,'name',r.name,'look',r.look,'joined',r.pin_hash is not null,'x',r.x,'y',r.y,'place',r.place,
    'sleeping',r.sleeping,'hunger',r.hunger,'energy',r.energy,'bladder',r.bladder,'hygiene',r.hygiene,'fun',r.fun,
    'money',r.money,'updated_at',r.updated_at,'seen_at',r.seen_at)
$$;

-- 讀整個小鎮（順便把每個人的需求更新到現在）＋最近的動態
create or replace function public.town_state() returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; acc json[] := '{}';
begin
  for r in select * from public.town_residents order by id for update loop
    -- 還沒入住的人不扣需求
    if r.pin_hash is null then r.updated_at := now(); else r := public.town_tick(r); end if;
    update public.town_residents set hunger=r.hunger,energy=r.energy,bladder=r.bladder,hygiene=r.hygiene,fun=r.fun,sleeping=r.sleeping,updated_at=r.updated_at where id=r.id;
    acc := acc || public.town_pub(r);
  end loop;
  return json_build_object('now',now(),'residents',array_to_json(acc),
    'events',(select coalesce(json_agg(e order by e.at desc),'[]') from (select id,at,actor,target,kind,msg from public.town_events order by at desc limit 60) e));
end $$;

-- 驗證密碼：連錯 5 次鎖 10 分鐘
create or replace function public.town_auth(rid text, pin text) returns public.town_residents
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  select * into r from public.town_residents where id = rid for update;
  if not found then raise exception '沒有這位居民'; end if;
  if r.pin_hash is null then raise exception '還沒入住'; end if;
  if r.lock_until is not null and r.lock_until > now() then raise exception '密碼錯太多次，請 10 分鐘後再試'; end if;
  if extensions.crypt(pin, r.pin_hash) <> r.pin_hash then
    -- 不用 raise：raise 會把錯誤次數的更新一起復原
    update public.town_residents set fails = fails + 1, lock_until = case when fails + 1 >= 5 then now() + interval '10 minutes' end where id = rid;
    r.id := null; return r;
  end if;
  if r.fails > 0 then update public.town_residents set fails = 0, lock_until = null where id = rid; end if;
  return public.town_tick(r);
end $$;

-- 入住或登入：第一次要邀請碼並設定 4 位數密碼
create or replace function public.town_login(rid text, pin text, invite text default null, new_look jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; inv text; first boolean := false; last_seen timestamptz;
begin
  if pin !~ '^\d{4}$' then raise exception '密碼要是 4 位數字'; end if;
  select * into r from public.town_residents where id = rid for update;
  if not found then raise exception '沒有這位居民'; end if;
  if r.pin_hash is null then
    select v into inv from public.town_config where k = 'invite';
    if inv is null or invite is null or extensions.crypt(upper(trim(invite)), inv) <> inv then raise exception '邀請碼不對，請問 Jacky'; end if;
    update public.town_residents set pin_hash = extensions.crypt(pin, extensions.gen_salt('bf')), updated_at = now(),
      hunger = 80, energy = 80, bladder = 80, hygiene = 80, fun = 80, sleeping = false where id = rid;
    insert into public.town_events(actor,kind,msg) values (rid,'join', r.name || ' 搬進了小豬鎮');
    first := true;
  else
    if (public.town_auth(rid, pin)).id is null then return json_build_object('error','密碼不對'); end if;
  end if;
  last_seen := r.seen_at;
  if new_look is not null and pg_column_size(new_look) < 600 then update public.town_residents set look = new_look where id = rid; end if;
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok',true,'first',first,'last_seen',last_seen);
end $$;

-- 所有動作：移動、自己家裡的事、公共場所、對朋友做的事
create or replace function public.town_act(rid text, pin text, act text, target text default null, px real default null, py real default null, dest text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; others text; tn text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if act = 'move' then
    if dest is null or not (dest in ('plaza','restaurant','market','office','park','street') or dest ~ '^home:(jacky|abel|cerina|bear|mike|rafael)$') then raise exception '去不了那裡'; end if;
    if px is null or py is null or px < 0 or px > 34 or py < 0 or py > 22 then raise exception '位置不對'; end if;
    r.x := px; r.y := py; r.place := dest; r.sleeping := false;
    if dest in ('plaza','restaurant','market','park') then
      select string_agg(name, '、') into others from public.town_residents where place = dest and id <> rid and pin_hash is not null;
      if others is not null and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'meet' and e.at > now() - interval '2 hours') then
        insert into public.town_events(actor,kind,msg) values (rid,'meet', r.name || ' 在' || public.town_place_name(dest) || '遇到了 ' || others);
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
    select * into t from public.town_residents where id = target for update;
    if not found or t.pin_hash is null then raise exception '這位朋友還沒入住'; end if;
    if r.place <> 'home:' || target then raise exception '要先走到他家'; end if;
    if t.place <> 'home:' || target then raise exception '% 不在家，在%', t.name, public.town_place_name(t.place); end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = act and e.at > now() - interval '2 hours') then raise exception '剛剛才做過，等一下再來'; end if;
    t := public.town_tick(t); tn := t.name;
    if act = 'feed' then if r.money < 10 then raise exception '錢不夠買食材'; end if; t.hunger := t.hunger + 35; r.money := r.money - 10; r.fun := r.fun + 5;
      insert into public.town_events(actor,target,kind,msg) values (rid,target,act, r.name || ' 煮了一餐給 ' || tn || ' 吃');
    elsif act = 'wash' then t.hygiene := t.hygiene + 45;
      insert into public.town_events(actor,target,kind,msg) values (rid,target,act, r.name || ' 幫 ' || tn || ' 洗了澡');
    elsif act = 'wakeup' then if not t.sleeping then raise exception '% 醒著', tn; end if; t.sleeping := false; t.fun := t.fun - 5;
      insert into public.town_events(actor,target,kind,msg) values (rid,target,act, r.name || ' 把 ' || tn || ' 叫醒了');
    elsif act = 'visit' then t.fun := t.fun + 15; r.fun := r.fun + 15;
      insert into public.town_events(actor,target,kind,msg) values (rid,target,act, r.name || ' 去 ' || tn || ' 家串門子');
    else t.fun := t.fun - 8; r.fun := r.fun + 12;
      insert into public.town_events(actor,target,kind,msg) values (rid,target,act, r.name || ' 在 ' || tn || ' 家門口放了一個臭屁');
    end if;
    update public.town_residents set hunger=least(100,t.hunger),energy=t.energy,bladder=t.bladder,hygiene=least(100,t.hygiene),fun=least(100,greatest(0,t.fun)),sleeping=t.sleeping,updated_at=t.updated_at where id=t.id;
  else raise exception '不知道要做什麼';
  end if;
  update public.town_residents set x=r.x,y=r.y,place=r.place,sleeping=r.sleeping,
    hunger=least(100,greatest(0,r.hunger)),energy=least(100,greatest(0,r.energy)),bladder=least(100,greatest(0,r.bladder)),
    hygiene=least(100,greatest(0,r.hygiene)),fun=least(100,greatest(0,r.fun)),money=greatest(0,r.money),updated_at=now(),seen_at=now() where id=rid;
  return public.town_state();
end $$;

revoke all on function public.town_tick(public.town_residents), public.town_place_name(text), public.town_pub(public.town_residents), public.town_auth(text,text) from public, anon, authenticated;
revoke all on function public.town_state(), public.town_login(text,text,text,jsonb), public.town_act(text,text,text,text,real,real,text) from public;
grant execute on function public.town_state(), public.town_login(text,text,text,jsonb), public.town_act(text,text,text,text,real,real,text) to anon, authenticated;

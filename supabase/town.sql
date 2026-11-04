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
-- 每台裝置一把金鑰（只存雜湊）；舊的 4 位數密碼也還能用
create table if not exists public.town_devices (
  id bigint generated always as identity primary key,
  resident_id bigint not null references public.town_residents(id) on delete cascade,
  key_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.town_devices enable row level security;
revoke all on public.town_devices from anon, authenticated;
create table if not exists public.town_events (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  at timestamptz not null default now(),
  actor bigint, target bigint, kind text not null,
  msg text not null check (char_length(msg) <= 120)
);
create index if not exists town_events_town_at on public.town_events(town_id, at desc);
-- 背包（禮物、零食）與兩人之間的好感度（a < b，-100～100）
alter table public.town_residents add column if not exists items jsonb not null default '{}'::jsonb;
alter table public.town_residents add column if not exists bruised_until timestamptz;
create table if not exists public.town_bonds (
  town_id text not null references public.town_towns(id) on delete cascade,
  a bigint not null references public.town_residents(id) on delete cascade,
  b bigint not null references public.town_residents(id) on delete cascade,
  score int not null default 0 check (score between -100 and 100),
  primary key (a, b), check (a < b)
);
alter table public.town_bonds enable row level security;
-- 商品目錄：造型（wear）與門口擺飾（deco）；unlock 不是 null 的造型要達成條件才能穿（bandage：被扁 10 次；couple：有好麻吉）
create table if not exists public.town_shop (id text primary key, kind text not null, slot text, name text not null, price int not null default 0, unlock text);
insert into public.town_shop(id,kind,slot,name,price,unlock) values
 ('twintail','wear','hair','雙馬尾',250,null),('mohawk','wear','hair','刺蝟頭',250,null),
 ('suit','wear','top','西裝',600,null),('jersey','wear','top','球衣',380,null),('dress','wear','top','洋裝',380,null),('couple','wear','top','情侶 T',0,'couple'),
 ('crown','wear','acc','皇冠',800,null),('pigears','wear','acc','小豬耳朵',200,null),('headphones','wear','acc','耳機',300,null),('scarf','wear','acc','圍巾',150,null),('bandage','wear','acc','繃帶頭',0,'bandage'),
 ('flowers','deco',null,'花圃',100,null),('mailbox','deco',null,'信箱',80,null),('lamp','deco',null,'路燈',150,null),('bench','deco',null,'長椅',200,null),('tree','deco',null,'小樹',120,null),('pigstatue','deco',null,'小豬雕像',500,null)
on conflict (id) do update set kind=excluded.kind, slot=excluded.slot, name=excluded.name, price=excluded.price, unlock=excluded.unlock;
alter table public.town_shop enable row level security;
revoke all on public.town_shop from anon, authenticated;
revoke all on public.town_bonds from anon, authenticated;

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

create or replace function public.town_obj_near(o text, x real, y real, place text) returns boolean language sql immutable as $$
  select case o when 'vend' then abs(x-19)+abs(y-5) <= 2 when 'trash' then abs(x-8)+abs(y-14) <= 2 when 'stall' then abs(x-22)+abs(y-14) <= 2
    when 'well' then place = 'plaza' when 'swing' then place = 'park' when 'cat' then place = 'park' else false end
$$;

-- 營業時間（台灣時間）：回傳 null 表示營業中，否則回傳休息說明
create or replace function public.town_closed(what text) returns text language sql stable as $$
  select case
    when what in ('work','cowork') and not (h between 9 and 18) then '公司下班了，營業時間 9:00～19:00'
    when what in ('dine','feast') and not (h between 11 and 21) then '餐廳休息中，營業時間 11:00～22:00'
    when what in ('buy','browse') and not (h between 8 and 22) then '超市休息中，營業時間 8:00～23:00'
    when what = 'stall' and not (h between 16 and 23) then '烤地瓜攤還沒開，營業時間 16:00～24:00'
    else null end
  from (select extract(hour from (now() at time zone 'Asia/Taipei'))::int h) x
$$;

-- 好感度 7 階；跨過一階會上小鎮動態
create or replace function public.town_tier(v int) returns text language sql immutable as $$
  select case when v >= 60 then '生死之交' when v >= 30 then '好麻吉' when v >= 10 then '好朋友'
    when v <= -50 then '宿敵' when v <= -20 then '死對頭' when v <= -5 then '有點不爽' else '普通鄰居' end
$$;
create or replace function public.town_bond_get(x bigint, y bigint) returns int language sql stable as $$
  select coalesce((select score from public.town_bonds where a = least(x,y) and b = greatest(x,y)), 0)
$$;
create or replace function public.town_bond(tid text, x bigint, y bigint, d int) returns void language plpgsql as $$
declare o int := public.town_bond_get(x,y); n int := greatest(-100, least(100, o + d)); na text; nb text;
begin
  insert into public.town_bonds(town_id,a,b,score) values (tid, least(x,y), greatest(x,y), n) on conflict (a,b) do update set score = n;
  if public.town_tier(o) <> public.town_tier(n) and public.town_tier(n) <> '普通鄰居' then
    select name into na from public.town_residents where id = town_bond.x; select name into nb from public.town_residents where id = town_bond.y;
    insert into public.town_events(town_id,actor,target,kind,msg) values (tid, x, y, 'tier',
      na || ' 和 ' || nb || case when n > o then ' 的關係升級成「' else ' 的關係變成「' end || public.town_tier(n) || '」' ||
      case public.town_tier(n) when '生死之交' then ' 🤝' when '好麻吉' then ' 💞' when '好朋友' then ' 😊' when '宿敵' then ' ⚔️' when '死對頭' then ' 😤' else ' 😒' end);
  end if;
end $$;

-- 需求隨時間變化（每小時）；醒著掉得快、睡覺時精力回升。累到 0 會原地睡著、膀胱到 0 會尿褲子
create or replace function public.town_tick(r public.town_residents) returns public.town_residents
language plpgsql as $$
declare h real := least(72, greatest(0, extract(epoch from now() - r.updated_at) / 3600)); sh real := 0; ah real := 0; t timestamptz; step real; hr int; d record; nightoff boolean := false;
begin
  if h <= 0 then return r; end if;
  -- 每 15 分鐘一段：睡著的、或台灣時間 0～7 點且已經 30 分鐘沒動作（等於回家睡了）照睡覺算，其他照醒著算
  t := now() - make_interval(secs => h*3600);
  while t < now() loop
    step := least(.25, extract(epoch from now() - t) / 3600);
    hr := extract(hour from (t at time zone 'Asia/Taipei'))::int;
    if r.sleeping then sh := sh + step; elsif hr < 7 and t > r.seen_at + interval '30 minutes' then sh := sh + step; nightoff := true; else ah := ah + step; end if;
    t := t + make_interval(secs => step*3600);
  end loop;
  r.energy := r.energy + 14*sh - 3*ah; r.hunger := r.hunger - 1.5*sh - 4*ah; r.bladder := r.bladder - 1.5*sh - 5*ah; r.hygiene := r.hygiene - .5*sh - 2.5*ah; r.fun := r.fun - .3*sh - 2*ah;
  hr := extract(hour from (now() at time zone 'Asia/Taipei'))::int;
  -- 半夜沒上線的人回家睡了：人在家裡；現在還是半夜就繼續睡，天亮（8 點後）就在家醒來
  if nightoff or (not r.sleeping and hr < 7 and now() > r.seen_at + interval '30 minutes') then
    select * into d from public.town_door(r.slot);
    r.place := 'home:' || r.id; r.x := d.dx; r.y := d.dy;
    r.sleeping := hr < 8;
  elsif r.sleeping and hr between 8 and 11 and now() > r.seen_at + interval '30 minutes' and r.energy >= 80 then
    r.sleeping := false;  -- 早上自然醒
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
    'money',r.money,'items',r.items,'bruised',coalesce(r.bruised_until > now(), false),'updated_at',r.updated_at,'seen_at',r.seen_at)
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
    update public.town_residents set hunger=r.hunger,energy=r.energy,bladder=r.bladder,hygiene=r.hygiene,fun=r.fun,sleeping=r.sleeping,place=r.place,x=r.x,y=r.y,updated_at=r.updated_at where id=r.id;
    acc := acc || public.town_pub(r);
  end loop;
  return json_build_object('now',now(),'town',json_build_object('id',t.id,'name',t.name,'rows',t.rows),'residents',array_to_json(acc),
    'bonds',(select coalesce(json_agg(json_build_object('a',a,'b',b,'s',score)),'[]') from public.town_bonds where town_id = t.id),
    -- 每週排行（最近 7 天）：最勤勞、最受歡迎、最欠扁、最愛照顧人
    'week',(select json_build_object(
      'work',(select coalesce(json_agg(x),'[]') from (select actor id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('work','cowork') and actor is not null group by actor order by n desc limit 3) x),
      'popular',(select coalesce(json_agg(x),'[]') from (select target id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('feed','wash','visit','gift','note','thank','greet','feast','delivery','call') and target is not null group by target order by n desc limit 3) x),
      'punched',(select coalesce(json_agg(x),'[]') from (select target id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('fight','egg','prank') and target is not null group by target order by n desc limit 3) x),
      'kind',(select coalesce(json_agg(x),'[]') from (select actor id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('feed','wash','visit','gift','note','feast','delivery') and actor is not null group by actor order by n desc limit 3) x))),
    'events',(select coalesce(json_agg(e order by e.at desc, e.id desc),'[]') from
      (select id,at,actor,target,kind,msg from public.town_events where town_id = t.id and kind <> 'work' order by at desc, id desc limit 60) e));
end $$;

-- 驗證密碼：連錯 5 次鎖 10 分鐘。錯的時候回傳 id 是 null（不用 raise，raise 會把錯誤次數一起復原）
create or replace function public.town_auth(rid bigint, pin text) returns public.town_residents
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  select * into r from public.town_residents where id = rid for update;
  if not found then raise exception '找不到這位居民，可能已經搬走了'; end if;
  if r.lock_until is not null and r.lock_until > now() then raise exception '密碼錯太多次，請 10 分鐘後再試'; end if;
  if extensions.crypt(coalesce(pin,''), r.pin_hash) <> r.pin_hash
     and not exists (select 1 from public.town_devices d where d.resident_id = rid and extensions.crypt(coalesce(pin,''), d.key_hash) = d.key_hash) then
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
  if pin !~ '^(\d{4}|[A-Za-z0-9]{24,64})$' then raise exception '裝置金鑰格式不對'; end if;
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
  if pin !~ '^(\d{4}|[A-Za-z0-9]{24,64})$' then raise exception '裝置金鑰格式不對'; end if;
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

alter table public.town_towns add column if not exists fails int not null default 0;
alter table public.town_towns add column if not exists lock_until timestamptz;
create or replace function public.town_device(tid text, invite text, rid bigint, key text) returns json
language plpgsql security definer set search_path = public as $$
declare t public.town_towns;
begin
  select * into t from public.town_towns where id = upper(trim(tid)) for update;
  if not found then raise exception '找不到這個小鎮'; end if;
  if t.lock_until is not null and t.lock_until > now() then raise exception '邀請碼錯太多次，請 10 分鐘後再試'; end if;
  if key !~ '^[A-Za-z0-9]{24,64}$' then raise exception '裝置金鑰格式不對'; end if;
  if upper(trim(coalesce(invite,''))) <> t.invite then
    update public.town_towns set fails = fails + 1, lock_until = case when fails + 1 >= 5 then now() + interval '10 minutes' end where id = t.id;
    return json_build_object('error','邀請碼不對，請問鎮長');
  end if;
  if t.fails > 0 then update public.town_towns set fails = 0, lock_until = null where id = t.id; end if;
  if not exists (select 1 from public.town_residents where id = rid and town_id = t.id) then raise exception '這個小鎮沒有這位居民'; end if;
  insert into public.town_devices(resident_id, key_hash) values (rid, extensions.crypt(key, extensions.gen_salt('bf')));
  -- 每人最多留 6 台裝置
  delete from public.town_devices where resident_id = rid and id not in (select id from public.town_devices where resident_id = rid order by created_at desc limit 6);
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok', true);
end $$;

-- 用小鎮代碼或邀請碼找到小鎮（兩組碼都是 6 碼，很容易搞混）
create or replace function public.town_find(code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('town_id', id, 'by_invite', id <> upper(trim(code)))
  from public.town_towns where id = upper(trim(code)) or invite = upper(trim(code)) order by (id = upper(trim(code))) desc limit 1
$$;
revoke all on function public.town_find(text) from public;
grant execute on function public.town_find(text) to anon, authenticated;

-- 登入（也用來換造型）
create or replace function public.town_login(rid bigint, pin text, new_look jsonb default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if new_look is not null and pg_column_size(new_look) < 800 then
    -- 特別款要買過或達成條件
    if exists (select 1 from public.town_shop w where w.kind = 'wear' and w.id in (new_look->>'style', new_look->>'top', new_look->>'acc')
       and not (coalesce(r.items->'w','[]'::jsonb) ? w.id)
       and not (w.unlock = 'bandage' and (select count(*) from public.town_events e where e.target = rid and e.kind = 'fight') >= 10)
       and not (w.unlock = 'couple' and exists (select 1 from public.town_bonds b where (b.a = rid or b.b = rid) and b.score >= 30))) then
      raise exception '這個造型還沒買或還沒解鎖';
    end if;
    if r.look is distinct from new_look and r.look <> '{}'::jsonb and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'look' and e.at > now() - interval '1 hour') then
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'look', r.name || ' 換了新造型 ✨');
    end if;
    update public.town_residents set look = new_look where id = rid;
  end if;
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

-- 所有動作：移動、自己家裡的事、公共場所、對朋友做的事（朋友不在家也能留言、放禮物）、道謝、擊掌
drop function if exists public.town_act(bigint,text,text,bigint,real,real,text);
create or replace function public.town_act(rid bigint, pin text, act text, target bigint default null, px real default null, py real default null, dest text default null, item text default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; others text; tn text; n int; near boolean; pa real; pb real; bond int; m real; pub text[] := array['plaza','restaurant','market','park','office'];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping and act not in ('wake') then raise exception '你在睡覺，先起床'; end if;
  if public.town_closed(case when act = 'obj' then item else act end) is not null then raise exception '%', public.town_closed(case when act = 'obj' then item else act end); end if;
  if act = 'move' then
    if dest is null or not (dest in ('plaza','restaurant','market','office','park','street')
       or (dest ~ '^home:\d+$' and exists (select 1 from public.town_residents where id = substr(dest,6)::bigint and town_id = r.town_id))) then raise exception '去不了那裡'; end if;
    if px is null or py is null or px < 0 or px > 34 or py < 0 or py > 40 then raise exception '位置不對'; end if;
    r.x := px; r.y := py; r.place := dest;
    -- 隨機事件：出門走到外面的地方時偶爾發生（家裡不會）
    if dest !~ '^home:' and random() < .12 then
      pa := random();
      if pa < .25 then n := 5 + floor(random()*26)::int; r.money := r.money + n; tn := r.name || ' 在路上撿到 €' || n || ' 💰';
      elsif pa < .40 then r.hygiene := r.hygiene - 20; tn := r.name || ' 一不小心踩到狗屎 💩';
      elsif pa < .52 then r.hygiene := r.hygiene - 15; tn := r.name || ' 被鳥大便打中頭 🐦';
      elsif pa < .67 then r.fun := r.fun + 10; tn := r.name || ' 遇到街頭藝人表演，看得很開心 🎸';
      elsif pa < .80 then r.hygiene := r.hygiene - 10; r.fun := r.fun - 5; tn := r.name || ' 突然下大雨，被淋成落湯雞 🌧️';
      elsif pa < .90 then r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 1)); tn := r.name || ' 在路上被試吃攤送了一包零食 🍪';
      elsif pa < .97 then r.energy := r.energy - 10; tn := r.name || ' 被野狗追著跑了一條街 🐕';
      else r.money := r.money + 300; tn := r.name || ' 買刮刮樂中了 €300！🎉'; end if;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', tn); tn := null;
    end if;
    if dest in ('plaza','restaurant','market','park') then
      select string_agg(name, '、') into others from public.town_residents where town_id = r.town_id and place = dest and id <> rid and not sleeping;
      if others is not null and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'meet' and e.at > now() - interval '2 hours') then
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'meet', r.name || ' 在' || public.town_place_name(dest) || '遇到了 ' || others);
        r.fun := r.fun + 10;
      end if;
    end if;
  elsif act in ('eat','toilet','shower','tv','sleep') then
    if r.place <> 'home:' || rid then raise exception '要先回家'; end if;
    if act = 'eat' then if r.money < 10 then raise exception '錢不夠買食材，去公司打工吧'; end if; r.hunger := r.hunger + 40; r.money := r.money - 10;
    elsif act = 'toilet' then r.bladder := 100;
    elsif act = 'shower' then
      if (r.items->'cd'->>'shower') is not null and (r.items->'cd'->>'shower')::timestamptz > now() - interval '15 minutes' then raise exception '剛洗完澡，等一下再洗'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('shower', now())); r.hygiene := 100; r.fun := r.fun + 3;
    elsif act = 'tv' then
      if (r.items->'cd'->>'tv') is not null and (r.items->'cd'->>'tv')::timestamptz > now() - interval '30 minutes' then raise exception '剛看完電視，休息一下眼睛'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('tv', now())); r.fun := r.fun + 15; r.energy := r.energy - 3;
    elsif act = 'sleep' then r.sleeping := true; end if;
  elsif act = 'wake' then r.sleeping := false;
  elsif act = 'obj' then
    if not public.town_obj_near(item, r.x, r.y, r.place) then raise exception '要走到旁邊才能用'; end if;
    if (r.items->'cd'->>item) is not null and (r.items->'cd'->>item)::timestamptz > now() - interval '20 minutes' then raise exception '剛剛才用過，等一下再來'; end if;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(item, now()));
    pa := random();
    if item = 'vend' then
      if r.money < 10 then raise exception '錢不夠，一罐 €10'; end if; r.money := r.money - 10; r.energy := r.energy + 12; r.fun := r.fun + 3;
      if pa < .08 then r.energy := r.energy + 12; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 投了一罐飲料，結果掉出兩罐 🥤🥤'); end if;
    elsif item = 'trash' then r.fun := r.fun + 4;
      if pa < .05 then r.items := jsonb_set(r.items, '{gift}', to_jsonb(coalesce((r.items->>'gift')::int,0) + 1)); insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 撿垃圾時發現一個沒拆的禮物 🎁');
      elsif pa < .25 then n := 10 + floor(random()*21)::int; r.money := r.money + n; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 撿垃圾時撿到 €' || n || ' 💰'); end if;
    elsif item = 'stall' then
      if r.money < 8 then raise exception '錢不夠，烤地瓜 €8'; end if; r.money := r.money - 8; r.hunger := r.hunger + 25; r.fun := r.fun + 3;
    elsif item = 'well' then
      if r.money < 1 then raise exception '連 €1 都沒有了'; end if; r.money := r.money - 1;
      if pa < .1 then r.fun := r.fun + 20; r.money := r.money + 50; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 在小豬噴水池許願，願望成真，天上掉下 €50 ✨');
      else r.fun := r.fun + 2; end if;
    elsif item = 'swing' then r.fun := r.fun + 12; r.energy := r.energy - 3;
    elsif item = 'cat' then
      if coalesce((r.items->>'snack')::int,0) > 0 and note = 'feed' then
        r.items := jsonb_set(r.items, '{snack}', to_jsonb((r.items->>'snack')::int - 1)); r.fun := r.fun + 15;
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 餵了公園的流浪貓，牠一直蹭過來 🐱');
      else r.fun := r.fun + 8; if pa < .15 then r.hygiene := r.hygiene - 10; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 想摸流浪貓，被抓了一下 🐱💢'); end if; end if;
    else raise exception '這裡沒有這個東西'; end if;
  elsif act = 'snack' then
    if coalesce((r.items->>'snack')::int,0) < 1 then raise exception '背包裡沒有零食，去超市買'; end if;
    r.items := jsonb_set(r.items, '{snack}', to_jsonb((r.items->>'snack')::int - 1)); r.hunger := r.hunger + 20; r.fun := r.fun + 3;
  elsif act = 'buy' and (item like 'w:%' or item like 'd:%') then
    if r.place <> 'market' then raise exception '要在超市才能買'; end if;
    select price into n from public.town_shop where id = substr(item,3) and kind = case when item like 'w:%' then 'wear' else 'deco' end and price > 0;
    if n is null then raise exception '超市沒有賣這個'; end if;
    if coalesce(r.items->(left(item,1)),'[]'::jsonb) ? substr(item,3) then raise exception '你已經有了'; end if;
    if item like 'd:%' and jsonb_array_length(coalesce(r.items->'d','[]'::jsonb)) >= 4 then raise exception '門口最多放 4 樣擺飾'; end if;
    if r.money < n then raise exception '錢不夠，去公司打工吧'; end if;
    r.money := r.money - n; r.fun := r.fun + 5;
    r.items := jsonb_set(r.items, array[left(item,1)], coalesce(r.items->(left(item,1)),'[]'::jsonb) || to_jsonb(substr(item,3)));
  elsif act = 'paint' then
    -- 裝潢：換屋頂或牆壁顏色（€50）
    if r.place <> 'home:' || rid then raise exception '要先回家'; end if;
    if not (item ~ '^(roof|wall):#[0-9a-f]{6}$') then raise exception '顏色不對'; end if;
    if r.money < 50 then raise exception '錢不夠，去公司打工吧'; end if;
    r.money := r.money - 50; r.fun := r.fun + 8; r.items := jsonb_set(r.items, array[split_part(item,':',1)], to_jsonb(split_part(item,':',2)));
  elsif act = 'buy' then
    if r.place <> 'market' then raise exception '要在超市才能買'; end if;
    if item not in ('gift','snack') then raise exception '超市沒有賣這個'; end if;
    n := case item when 'gift' then 20 else 15 end;
    if r.money < n then raise exception '錢不夠，去公司打工吧'; end if;
    if coalesce((r.items->>item)::int,0) >= 9 then raise exception '背包放不下了'; end if;
    r.money := r.money - n; r.items := jsonb_set(r.items, array[item], to_jsonb(coalesce((r.items->>item)::int,0) + 1)); r.fun := r.fun + 3;
  elsif act in ('dine','work','play','browse') then
    if (act = 'dine' and r.place <> 'restaurant') or (act = 'work' and r.place <> 'office') or (act = 'play' and r.place not in ('park','plaza')) or (act = 'browse' and r.place <> 'market') then raise exception '不在那個地方'; end if;
    if act = 'dine' then if r.money < 30 then raise exception '錢不夠，去公司打工吧'; end if; r.hunger := r.hunger + 55; r.fun := r.fun + 10; r.money := r.money - 30;
    elsif act = 'work' then if r.energy < 15 then raise exception '太累了，先回家睡覺'; end if;
      if (r.items->'cd'->>'work') is not null and (r.items->'cd'->>'work')::timestamptz > now() - interval '2 hours' then raise exception '剛下班，2 小時後才能再打工'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('work', now())); r.money := r.money + 100; r.energy := r.energy - 15; r.fun := r.fun - 10; r.hunger := r.hunger - 8;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'work', r.name || ' 打工賺了 €100');
    elsif act = 'play' then r.fun := r.fun + 20; r.energy := r.energy - 5;
    else r.fun := r.fun + 6; end if;
    -- 有人在同一個地方：大家一起做，在場的人心情都變好
    if act in ('dine','play','work') then
      select string_agg(name, '、') into others from public.town_residents where town_id = r.town_id and place = r.place and id <> rid and not sleeping;
      if others is not null then
        update public.town_residents set fun = least(100, fun + 5) where town_id = r.town_id and place = r.place and id <> rid and not sleeping;
        r.fun := r.fun + 5;
        if not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'together' and e.at > now() - interval '2 hours') then
          insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'together', r.name || ' 和 ' || others || ' 一起' || case act when 'dine' then '在餐廳吃飯' when 'work' then '加班' else '在' || public.town_place_name(r.place) || '玩' end);
        end if;
      end if;
    end if;
  elsif act in ('feed','wash','wakeup','visit','prank','gift','note','thank','greet','fight','egg','makeup','cowork','feast','call','delivery') then
    if target is null or target = rid then raise exception '要選一位朋友'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = act and e.at > now() - case act when 'thank' then interval '12 hours' when 'makeup' then interval '12 hours' when 'fight' then interval '6 hours' when 'cowork' then interval '4 hours' when 'feast' then interval '4 hours' else interval '2 hours' end) then raise exception '剛剛才做過，等一下再來'; end if;
    t := public.town_tick(t); tn := t.name; bond := public.town_bond_get(rid, t.id);
    -- 面對面：在同一個地方（不算路上），或在路上距離 2 格以內
    near := (r.place = t.place and r.place <> 'street') or (abs(r.x - t.x) + abs(r.y - t.y) <= 2.5);
    if act = 'thank' then
      -- 道謝：對方三天內有照顧過你才能謝
      if not exists (select 1 from public.town_events e where e.actor = t.id and e.target = rid and e.kind in ('feed','wash','visit','gift','note','greet','delivery','call','feast') and e.at > now() - interval '3 days') then raise exception '% 最近沒有照顧你', tn; end if;
      t.fun := t.fun + 8; perform public.town_bond(r.town_id, rid, t.id, 2);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 謝謝 ' || tn || ' 的照顧 💗');
    elsif act = 'fight' then
      -- 扁他：比精力、心情和運氣；被他欺負過（3 天內）報仇加成；鼻青臉腫的人比較弱
      if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
      if r.energy < 10 then raise exception '你太累了，打不動'; end if;
      pa := 30 + r.energy*.4 + r.fun*.2 + random()*45 - case when r.bruised_until > now() then 15 else 0 end
        + case when exists (select 1 from public.town_events e where e.actor = t.id and e.target = rid and e.kind in ('fight','egg','prank') and e.at > now() - interval '3 days') then 15 else 0 end;
      pb := 30 + t.energy*.4 + t.fun*.2 + random()*45 - case when t.bruised_until > now() then 15 else 0 end;
      r.energy := r.energy - 8; t.energy := t.energy - 8;
      if pa >= pb then t.fun := t.fun - 12; t.hygiene := t.hygiene - 15; t.bruised_until := now() + interval '2 hours'; r.fun := r.fun + 10;
      else r.fun := r.fun - 12; r.hygiene := r.hygiene - 15; r.bruised_until := now() + interval '2 hours'; t.fun := t.fun + 10; end if;
      -- 好麻吉之間是打打鬧鬧，感情反而更好
      perform public.town_bond(r.town_id, rid, t.id, case when bond >= 30 then 1 else -6 end);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act,
        case when bond >= 30 then r.name || ' 和 ' || tn || ' 打打鬧鬧，' || case when pa >= pb then tn else r.name end || ' 被壓在地上求饒 😂'
             when pa >= pb then r.name || ' 把 ' || tn || ' 扁了一頓 👊 ' || tn || ' 鼻青臉腫'
             else r.name || ' 想扁 ' || tn || '，反被扁回去 🤕' end);
    elsif act = 'makeup' then
      if not near then raise exception '要和 % 面對面才能和好', tn; end if;
      if bond >= 0 then raise exception '你們本來就沒有不合'; end if;
      t.fun := t.fun + 5; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 8);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 向 ' || tn || ' 伸出手，兩人握手言和 🤝');
    elsif act in ('cowork','feast') then
      if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
      if act = 'cowork' then
        if r.place <> 'office' then raise exception '要一起在公司才能加班'; end if;
        if r.energy < 15 or t.energy < 15 then raise exception '有人太累了，加不了班'; end if;
        r.money := r.money + 200; t.money := t.money + 200; r.energy := r.energy - 15; t.energy := t.energy - 15; perform public.town_bond(r.town_id, rid, t.id, 3);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 和 ' || tn || ' 一起加班，薪水加倍 💼 各賺 €200');
      else
        if r.place <> 'restaurant' then raise exception '要一起在餐廳才能請吃大餐'; end if;
        if r.money < 60 then raise exception '錢不夠，大餐要 €60'; end if;
        r.money := r.money - 60; r.hunger := r.hunger + 70; t.hunger := t.hunger + 70; r.fun := r.fun + 15; t.fun := t.fun + 15; perform public.town_bond(r.town_id, rid, t.id, 4);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 請 ' || tn || ' 吃大餐 🍖');
      end if;
    elsif act = 'greet' then
      if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
      t.fun := t.fun + 8; r.fun := r.fun + 8; perform public.town_bond(r.town_id, rid, t.id, 2);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 和 ' || tn || ' 在' || public.town_place_name(r.place) || '擊掌 🙌');
    elsif act in ('note','call','delivery') or (act = 'gift' and r.place <> 'home:' || target) then
      -- 線上互動：用手機就能做，不用走過去（像現實生活：傳訊息、打電話、叫外送、寄禮物）
      if act = 'note' then
        note := trim(coalesce(note,''));
        if char_length(note) not between 1 and 30 or note ~ '[<>]' or public.has_bad_words(note) then raise exception '訊息要 1～30 個字'; end if;
        perform public.town_bond(r.town_id, rid, t.id, 1);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 傳訊息給 ' || tn || '：「' || note || '」');
      elsif act = 'call' then
        if t.sleeping then t.sleeping := false; t.fun := t.fun - 3; perform public.town_bond(r.town_id, rid, t.id, -1);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 打電話把 ' || tn || ' 吵醒了 📞');
        else t.fun := t.fun + 5; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 1);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 和 ' || tn || ' 講了一通電話 📞');
        end if;
      elsif act = 'delivery' then
        if r.money < 25 then raise exception '錢不夠，外送要 €25'; end if;
        r.money := r.money - 25; t.hunger := t.hunger + 30; perform public.town_bond(r.town_id, rid, t.id, 3);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 幫 ' || tn || ' 叫了外送 🛵');
      else
        if coalesce((r.items->>'gift')::int,0) < 1 then raise exception '背包裡沒有禮物，去超市買'; end if;
        if r.money < 5 then raise exception '寄送要 €5 運費'; end if;
        r.items := jsonb_set(r.items, '{gift}', to_jsonb((r.items->>'gift')::int - 1)); r.money := r.money - 5; t.fun := t.fun + 20; perform public.town_bond(r.town_id, rid, t.id, 5);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 寄了一份禮物給 ' || tn || ' 📦');
      end if;
    else
      if r.place <> 'home:' || target then raise exception '要先走到他家'; end if;
      if act = 'gift' then
        if coalesce((r.items->>'gift')::int,0) < 1 then raise exception '背包裡沒有禮物，去超市買'; end if;
        r.items := jsonb_set(r.items, '{gift}', to_jsonb((r.items->>'gift')::int - 1)); t.fun := t.fun + 20; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 5);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || case when t.place = 'home:' || target then ' 送了一份禮物給 ' || tn || ' 🎁' else ' 在 ' || tn || ' 家門口放了一份禮物 🎁' end);
      elsif act = 'egg' then
        if t.place = 'home:' || target then t.hygiene := t.hygiene - 10; t.fun := t.fun - 5; end if; r.fun := r.fun + 8;
        perform public.town_bond(r.town_id, rid, t.id, -2);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口丟雞蛋 🥚' || case when t.place = 'home:' || target then '，' || tn || ' 一開門就被砸中' else '' end);
      elsif act = 'note' then
        note := trim(coalesce(note,''));
        if char_length(note) not between 1 and 30 or note ~ '[<>]' or public.has_bad_words(note) then raise exception '留言要 1～30 個字'; end if;
        perform public.town_bond(r.town_id, rid, t.id, 1);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口留言：「' || note || '」');
      else
        if t.place <> 'home:' || target then raise exception '% 不在家，在%。可以留言或放禮物', tn, public.town_place_name(t.place); end if;
        m := case when bond >= 30 then 1.3 else 1 end;
        if act = 'feed' then if r.money < 10 then raise exception '錢不夠買食材'; end if; t.hunger := t.hunger + 35*m; r.money := r.money - 10; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 4);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 煮了一餐給 ' || tn || ' 吃');
        elsif act = 'wash' then t.hygiene := t.hygiene + 45*m; perform public.town_bond(r.town_id, rid, t.id, 4);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 幫 ' || tn || ' 洗了澡');
        elsif act = 'wakeup' then if not t.sleeping then raise exception '% 醒著', tn; end if; t.sleeping := false; t.fun := t.fun - 5; perform public.town_bond(r.town_id, rid, t.id, -1);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 把 ' || tn || ' 叫醒了');
        elsif act = 'visit' then if t.sleeping then raise exception '% 在睡覺，不方便串門子', tn; end if; t.fun := t.fun + 15*m; r.fun := r.fun + 15*m; perform public.town_bond(r.town_id, rid, t.id, 3);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 去 ' || tn || ' 家串門子');
        else t.fun := t.fun - 8; r.fun := r.fun + 12; perform public.town_bond(r.town_id, rid, t.id, -3);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口放了一個臭屁');
        end if;
      end if;
    end if;
    update public.town_residents set money=greatest(0,t.money),hunger=least(100,t.hunger),energy=greatest(0,t.energy),bladder=t.bladder,hygiene=least(100,greatest(0,t.hygiene)),fun=least(100,greatest(0,t.fun)),sleeping=t.sleeping,bruised_until=t.bruised_until,updated_at=t.updated_at where id=t.id;
  else raise exception '不知道要做什麼';
  end if;
  update public.town_residents set x=r.x,y=r.y,place=r.place,sleeping=r.sleeping,items=r.items,bruised_until=r.bruised_until,
    hunger=least(100,greatest(0,r.hunger)),energy=least(100,greatest(0,r.energy)),bladder=least(100,greatest(0,r.bladder)),
    hygiene=least(100,greatest(0,r.hygiene)),fun=least(100,greatest(0,r.fun)),money=greatest(0,r.money),updated_at=now(),seen_at=now() where id=rid;
  return public.town_state(r.town_id);
end $$;

revoke all on function public.town_tick(public.town_residents), public.town_pub(public.town_residents), public.town_auth(bigint,text), public.town_bond(text,bigint,bigint,int), public.town_tier(int), public.town_bond_get(bigint,bigint),
  public.town_code(int), public.town_door(int), public.town_street(int), public.town_place_name(text), public.town_name_ok(text) from public, anon, authenticated;
revoke all on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text,text,text) from public;
revoke all on function public.town_device(text,text,bigint,text) from public;
grant execute on function public.town_device(text,text,bigint,text) to anon, authenticated;
revoke all on function public.town_obj_near(text,real,real,text) from public, anon, authenticated;
revoke all on function public.town_closed(text) from public, anon, authenticated;
grant execute on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text,text,text) to anon, authenticated;

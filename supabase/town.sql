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
 ('twintail','wear','hair','雙馬尾',1200,null),('mohawk','wear','hair','刺蝟頭',1200,null),
 ('suit','wear','top','西裝',4500,null),('jersey','wear','top','球衣',1800,null),('dress','wear','top','洋裝',2400,null),('couple','wear','top','情侶 T',0,'couple'),
 ('crown','wear','acc','皇冠',12000,null),('pigears','wear','acc','小豬耳朵',800,null),('headphones','wear','acc','耳機',3000,null),('scarf','wear','acc','圍巾',900,null),('bandage','wear','acc','繃帶頭',0,'bandage'),
 ('flowers','deco',null,'花圃',600,null),('mailbox','deco',null,'信箱',500,null),('lamp','deco',null,'路燈',1500,null),('bench','deco',null,'長椅',2000,null),('tree','deco',null,'小樹',1200,null),('pigstatue','deco',null,'小豬雕像',8000,null),
 ('bed','furn',null,'好床',5000,null),('fridge','furn',null,'冰箱',8000,null),('massage','furn',null,'按摩椅',9000,null),('shelf','furn',null,'書櫃',4000,null),('sofa','furn',null,'沙發',6000,null),('tvcab','furn',null,'電視櫃',5000,null),('rug','furn',null,'地毯',1500,null),('plant','furn',null,'盆栽',800,null)
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
    when p = 'office' then '公司' when p = 'park' then '公園' when p = 'cafe' then '咖啡廳' when p = 'cinema' then '電影院' when p = 'gym' then '健身房' when p = 'arena' then '格鬥場' when p = 'slaughter' then '屠宰場' when p = 'rafi' then '拉菲的辦公室' when p = 'stock' then '證券交易所' else '路上' end
$$;
create or replace function public.town_name_ok(t text) returns boolean language sql immutable as $$
  select char_length(trim(t)) between 1 and 12 and trim(t) !~ '[<>"]' and not public.has_bad_words(t)
$$;

create or replace function public.town_obj_near(o text, x real, y real, place text) returns boolean language sql immutable as $$
  select case o when 'vend' then abs(x-19)+abs(y-5) <= 2 when 'trash' then abs(x-8)+abs(y-14) <= 2 when 'stall' then abs(x-22)+abs(y-14) <= 2
    when 'well' then place = 'plaza' when 'swing' then place = 'park' when 'cat' then place = 'park'
    when 'dummy' then abs(x-22)+abs(y-11) <= 2 when 'busker' then place = 'plaza' when 'pond' then place = 'park'
    when 'bench' then abs(x-14)+abs(y-5) <= 2 when 'mailbox' then abs(x-34)+abs(y-5) <= 2 when 'cooler' then abs(x-10)+abs(y-14) <= 2
    when 'claw' then abs(x-33)+abs(y-14) <= 2 when 'news' then abs(x-14)+abs(y-19) <= 2 when 'pwc' then abs(x-18)+abs(y-19) <= 2 when 'lottery' then abs(x-8)+abs(y-19) <= 2 else false end
$$;

-- 營業時間（台灣時間）：回傳 null 表示營業中，否則回傳休息說明
create or replace function public.town_closed(what text) returns text language sql stable as $$
  select case
    when what in ('dine','feast') and not (h between 11 and 21) then '餐廳休息中，營業時間 11:00～22:00'
    when what in ('buy','browse') and not (h between 8 and 22) then '超市休息中，營業時間 8:00～23:00'
    when what = 'stall' and not (h between 16 and 23) then '烤地瓜攤還沒開，營業時間 16:00～24:00'
    when what = 'coffee' and not (h between 7 and 20) then '咖啡廳休息中，營業時間 7:00～21:00'
    when what = 'movie' and not (h between 12 and 23) then '電影院休息中，營業時間 12:00～24:00'
    when what = 'workout' and not (h between 6 and 22) then '健身房休息中，營業時間 6:00～23:00'
    when what = 'spar' and not (h between 10 and 23) then '格鬥場休息中，營業時間 10:00～24:00'
    when what = 'rafi' and not (h between 9 and 18) then '拉菲的辦公室休息中，營業時間 9:00～19:00'
    when what = 'stock' and not (dw between 1 and 5 and h*60+mi between 540 and 809) then '證券交易所休息中，營業時間 週一～週五 9:00～13:30'
    else null end
  from (select extract(hour from (now() at time zone 'Asia/Taipei'))::int h, extract(minute from (now() at time zone 'Asia/Taipei'))::int mi, extract(isodow from (now() at time zone 'Asia/Taipei'))::int dw) x
$$;

-- 鎮長可以關掉的設施（off 裡面的就是沒開）
alter table public.town_towns add column if not exists off text[] not null default '{}';
-- 鎮長選的貨幣符號（只影響畫面顯示，金額不變）
alter table public.town_towns add column if not exists currency text not null default 'NT$';
create or replace function public.town_feature(what text) returns text language sql immutable as $$
  select case when what in ('cafe','coffee') then 'cafe' when what in ('cinema','movie') then 'cinema' when what in ('gym','workout') then 'gym'
    when what in ('arena','spar') then 'arena' when what in ('slaughter','sneak') then 'slaughter' when what = 'rafi' then 'rafi' when what in ('stock','trade') then 'stock' else null end
$$;
create or replace function public.town_is_off(tid text, f text) returns boolean language sql stable as $$
  select coalesce((select f = any(off) from public.town_towns where id = tid), false)
$$;
revoke all on function public.town_is_off(text,text) from public, anon, authenticated;
create or replace function public.town_features(rid bigint, pin text, off text[]) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if not r.mayor then raise exception '只有鎮長可以做這件事'; end if;
  if exists (select 1 from unnest(coalesce(off,'{}')) f where f not in ('cafe','cinema','gym','arena','slaughter','arcade','rafi','stock')) then raise exception '沒有這個設施'; end if;
  update public.town_towns set off = coalesce(town_features.off,'{}') where id = r.town_id;
  -- 關掉的地方有人在，請他們回到路上
  update public.town_residents set place = 'street' where town_id = r.town_id and place = any(coalesce(town_features.off,'{}'));
  return json_build_object('ok',true);
end $$;
-- 「建議下一步」(CTA) 統計：顯示了幾次、被點了幾次（只記建議名稱，不記個人內容）
create table if not exists public.town_cta (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  resident_id bigint,
  kind text not null check (kind in ('show','click')),
  key text not null check (char_length(key) between 1 and 24),
  at timestamptz not null default now()
);
create index if not exists town_cta_town_at on public.town_cta(town_id, at desc);
alter table public.town_cta enable row level security;
revoke all on public.town_cta from anon, authenticated;
create or replace function public.town_track(rid bigint, pin text, kind text, key text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if kind not in ('show','click') or key is null or char_length(key) not between 1 and 24 then return json_build_object('ok',false); end if;
  -- 每人每天最多記 400 筆，避免被灌爆
  if (select count(*) from public.town_cta c where c.resident_id = rid and c.at > now() - interval '1 day') >= 400 then return json_build_object('ok',false); end if;
  insert into public.town_cta(town_id, resident_id, kind, key) values (r.town_id, rid, kind, key);
  if random() < .01 then delete from public.town_cta c where c.at < now() - interval '30 days'; end if;
  return json_build_object('ok',true);
end $$;
revoke all on function public.town_track(bigint,text,text,text) from public;
grant execute on function public.town_track(bigint,text,text,text) to anon, authenticated;
create or replace function public.town_currency(rid bigint, pin text, cur text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if not r.mayor then raise exception '只有鎮長可以做這件事'; end if;
  if cur is null or cur !~ '^[^<>&"''\s]{1,4}$' then raise exception '貨幣符號 1～4 個字，不能有空白或特殊符號'; end if;
  update public.town_towns set currency = cur where id = r.town_id;
  return json_build_object('ok',true);
end $$;
revoke all on function public.town_currency(bigint,text,text) from public;
grant execute on function public.town_currency(bigint,text,text) to anon, authenticated;
revoke all on function public.town_features(bigint,text,text[]) from public;
grant execute on function public.town_features(bigint,text,text[]) to anon, authenticated;

-- 好感度 7 階；跨過一階會上小鎮動態
create or replace function public.town_tier(v int) returns text language sql immutable as $$
  select case when v >= 60 then '生死之交' when v >= 30 then '好麻吉' when v >= 10 then '好朋友'
    when v <= -50 then '宿敵' when v <= -20 then '死對頭' when v <= -5 then '有點不爽' else '普通鄰居' end
$$;
create or replace function public.town_bond_get(x bigint, y bigint) returns int language sql stable as $$
  select coalesce((select score from public.town_bonds where a = least(x,y) and b = greatest(x,y)), 0)
$$;
-- ── 個性特質（items.tr：2 個代號；[] = 跳過；缺值 = 還沒選）與心情（由需求即時算，不存）──
-- 特質：foodie 吃貨（吃東西飽足 +30%）、athlete 運動家（健身 fit +2、打架／擂台 +5）、social 社交達人（好感增加 +30%）、
--       workaholic 工作狂（薪水 +10%）、nightowl 夜貓子（22～6 點清醒精力少掉 1/小時）、clean 愛乾淨（清潔掉 70% 速度）、
--       lucky 幸運兒（路上壞事重擲一次、路邊物件好事機率 ×1.33）、romantic 浪漫（送禮效果加倍）
-- 心情：五條需求平均 a、最低 m、心情 fun。low：a<35 或 fun<20；annoyed：a<55 或 m<20 或 fun<40；happy：a>=75 且 fun>=65 且 m>=40；其餘 normal
-- 心情影響：薪水 +10%／0／−5%／−10%；打架與擂台力量 +5／0／−3／−8；好感增加 ×1.2／1／0.8／0.7
create or replace function public.town_fu(r public.town_residents, k text) returns int language sql stable as $$
  select case when coalesce(r.items->'fu','[]'::jsonb) ? k then 1 else 0 end $$;
create or replace function public.town_has(r public.town_residents, k text) returns boolean language sql stable as $$
  select coalesce(jsonb_typeof(r.items->'tr') = 'array' and (r.items->'tr') ? k, false)
$$;
create or replace function public.town_mood(r public.town_residents) returns text language sql stable as $$
  select case when coalesce(r.items->>'sad','') = 'true' then 'sad' when a < 35 or r.fun < 20 then 'low' when a < 55 or m < 20 or r.fun < 40 then 'annoyed'
    when a >= 75 and r.fun >= 65 and m >= 40 then 'happy' else 'normal' end
  from (select (r.hunger + r.energy + r.bladder + r.hygiene + r.fun) / 5 a, least(r.hunger, r.energy, r.bladder, r.hygiene, r.fun) m) x
$$;
create or replace function public.town_mood_wage(m text) returns int language sql immutable as $$ select case m when 'happy' then 110 when 'annoyed' then 95 when 'low' then 90 when 'sad' then 70 else 100 end $$;
create or replace function public.town_mood_pow(m text) returns int language sql immutable as $$ select case m when 'happy' then 5 when 'annoyed' then -3 when 'low' then -8 when 'sad' then -8 else 0 end $$;
create or replace function public.town_mood_bond(m text) returns int language sql immutable as $$ select case m when 'happy' then 120 when 'annoyed' then 80 when 'low' then 70 when 'sad' then 70 else 100 end $$;
-- 薪水（百分比整數運算，四捨五入；前端 wageOf 要一致）
create or replace function public.town_pay(base int, m text, workaholic boolean) returns int language sql immutable as $$
  select (base * public.town_mood_wage(m) * (case when workaholic then 110 else 100 end) * 2 + 10000) / 20000
$$;
-- 好感增加的倍率由 town_act 開頭存在交易設定 town.bm（百分比 ×100：心情 × 社交達人）；只放大正數
create or replace function public.town_bond(tid text, x bigint, y bigint, d int) returns void language plpgsql as $$
declare o int := public.town_bond_get(x,y); n int; na text; nb text; bmp int := coalesce(nullif(current_setting('town.bm', true), ''), '10000')::int;
begin
  if d > 0 then d := greatest(1, (d * bmp * 2 + 10000) / 20000); end if;
  n := greatest(-100, least(100, o + d));
  insert into public.town_bonds(town_id,a,b,score) values (tid, least(x,y), greatest(x,y), n) on conflict (a,b) do update set score = n;
  if public.town_tier(o) <> public.town_tier(n) and public.town_tier(n) <> '普通鄰居' then
    select name into na from public.town_residents where id = town_bond.x; select name into nb from public.town_residents where id = town_bond.y;
    insert into public.town_events(town_id,actor,target,kind,msg) values (tid, x, y, 'tier',
      na || ' 和 ' || nb || case when n > o then ' 的關係升級成「' else ' 的關係變成「' end || public.town_tier(n) || '」' ||
      case public.town_tier(n) when '生死之交' then ' 🤝' when '好麻吉' then ' 💞' when '好朋友' then ' 😊' when '宿敵' then ' ⚔️' when '死對頭' then ' 😤' else ' 😒' end);
  end if;
end $$;

-- ── 職業階梯與人生願望：資料都存在 items（works 累計打工、wish 願望、titles 稱號、meals 吃飯次數）──
create or replace function public.town_job_lv(n int) returns int language sql immutable as $$
  select case when n >= 150 then 4 when n >= 70 then 3 when n >= 30 then 2 when n >= 10 then 1 else 0 end
$$;
create or replace function public.town_job_name(lv int) returns text language sql immutable as $$
  select (array['實習生','員工','組長','經理','主管'])[lv + 1]
$$;
create or replace function public.town_wage(lv int) returns int language sql immutable as $$
  select (array[190,260,350,520,800])[lv + 1]
$$;
create or replace function public.town_wish_ms(k text) returns int[] language sql immutable as $$
  select case k when 'rich' then array[30000,100000,300000] when 'pop' then array[5,10,20] when 'fight' then array[3,7,15]
    when 'food' then array[30,100,300] when 'work' then array[2,3,4] end
$$;
create or replace function public.town_wish_titles(k text) returns text[] language sql immutable as $$
  select case k when 'rich' then array['小富翁','大富翁','小豬首富'] when 'pop' then array['交友廣闊','萬人迷','人氣王']
    when 'fight' then array['擂台新秀','擂台猛將','格鬥冠軍'] when 'food' then array['老饕','美食家','食神'] when 'work' then array['勤勞蜜蜂','職場達人','打工王'] end
$$;
create or replace function public.town_wish_val(r public.town_residents, k text) returns int language plpgsql stable as $$
begin
  return case k when 'rich' then r.money
    when 'pop' then (select count(*) from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score >= 10)::int
    when 'fight' then coalesce((r.items->>'best')::int,0)
    when 'food' then coalesce((r.items->>'meals')::int,0)
    when 'work' then public.town_job_lv(coalesce((r.items->>'works')::int,0)) else 0 end;
end $$;
-- 達成里程碑：發獎金、給稱號、寫公告（一次可以連跳幾個）
create or replace function public.town_wish_check(r public.town_residents) returns public.town_residents language plpgsql as $$
declare k text := r.items->'wish'->>'k'; m int := coalesce((r.items->'wish'->>'m')::int,0); ms int[]; ts text[]; bonus int[] := array[2000,5000,10000];
begin
  if k is null or k = 'none' then return r; end if;
  ms := public.town_wish_ms(k); ts := public.town_wish_titles(k);
  while m < 3 and public.town_wish_val(r, k) >= ms[m + 1] loop
    m := m + 1;
    r.money := r.money + bonus[m];
    r.items := jsonb_set(r.items, '{titles}', coalesce(r.items->'titles','[]'::jsonb) || to_jsonb(ts[m]));
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'wish', r.name || ' 達成願望里程碑，獲得稱號「' || ts[m] || '」，獎金 €' || bonus[m]);
  end loop;
  r.items := jsonb_set(r.items, '{wish}', jsonb_build_object('k', k, 'm', m));
  return r;
end $$;

-- 需求隨時間變化（每小時）。醒著：飽足 −8、精力 −5、膀胱 −10、清潔 −5、心情 −4；睡覺：飽足 −5、膀胱 −7、清潔 −2.4、心情 −1.6、精力 +80
-- 離線保護：最後動作 30 分鐘之後的時間，消耗 ×0.4，而且需求最低停在 15（上線中自己沒照顧而歸零不受此限）
-- 歸零後果：膀胱（在外大在路上、在家弄髒房間）、飽足（昏倒 1 小時，醒來扣醫藥費 €1500）、清潔（發臭）、心情（低落，薪水 −30%）
create or replace function public.town_seg_d(px real, py real, ax real, ay real, bx real, by2 real) returns real language sql immutable as $$
  select sqrt(power(px - (ax + u*(bx-ax)), 2) + power(py - (ay + u*(by2-ay)), 2))::real
  from (select case when power(bx-ax,2) + power(by2-ay,2) = 0 then 0::real
    else greatest(0, least(1, ((px-ax)*(bx-ax) + (py-ay)*(by2-ay)) / (power(bx-ax,2) + power(by2-ay,2))))::real end u) s
$$;
-- 同地點醒著的人心情受影響：tick 在 town_state 的迴圈裡跑，不能直接改別人那一列，所以先記在交易設定，迴圈結束後再一次套用
create or replace function public.town_hit(r public.town_residents, d int) returns void language plpgsql as $$
begin perform set_config('town.hits', coalesce(current_setting('town.hits', true), '') || r.town_id || '|' || r.place || '|' || r.id || '|' || d || ';', true); end $$;
create or replace function public.town_apply_hits() returns void language plpgsql as $$
declare s text := coalesce(current_setting('town.hits', true), ''); h text; p text[];
begin
  if s = '' then return; end if;
  perform set_config('town.hits', '', true);
  foreach h in array string_to_array(rtrim(s, ';'), ';') loop
    p := string_to_array(h, '|');
    update public.town_residents set fun = greatest(0, fun - p[4]::int) where town_id = p[1] and place = p[2] and id <> p[3]::bigint and not sleeping;
  end loop;
end $$;
revoke all on function public.town_hit(public.town_residents,int), public.town_apply_hits() from public, anon, authenticated;

-- 在屋裡：人在自己家、而且沒有「在門口」旗標（items.dr = 1 代表站在門口）。舊角色沒有旗標，視為在屋裡
create or replace function public.town_inside(r public.town_residents) returns boolean language sql immutable as $$
  select r.place = 'home:' || r.id and coalesce(r.items->>'dr','') <> '1'
$$;
revoke all on function public.town_inside(public.town_residents) from public, anon, authenticated;

create or replace function public.town_tick(r public.town_residents) returns public.town_residents
language plpgsql as $$
declare h real := least(72, greatest(0, extract(epoch from now() - r.updated_at) / 3600));
  sho real := 0; shf real := 0; aho real := 0; ahf real := 0; nho real := 0; nhf real := 0; sqo real := 0; sqf real := 0; ps real := 0; qe timestamptz := nullif(r.items->>'qs','')::timestamptz; ev real; bk int; bn text; bm int; was_in boolean := public.town_inside(r);  -- 睡覺／醒著／夜間醒著的小時數（o = 上線中，f = 離線）
  t timestamptz; step real; hr int; d record; nightoff boolean := false; off boolean; fa boolean; hyg0 real := r.hygiene; hm real; bedg real; v real; dl real; exo real := 0; exf real := 0;
begin
  if h <= 0 then return r; end if;
  fa := (r.items->>'faint') is not null and (r.items->>'faint')::timestamptz > now();
  if fa then r.sleeping := true; end if;
  -- 每 15 分鐘一段：睡著的、或台灣時間 0～7 點且已經 30 分鐘沒動作（等於回家睡了）照睡覺算，其他照醒著算
  t := now() - make_interval(secs => h*3600);
  while t < now() loop
    step := least(.25, extract(epoch from now() - t) / 3600);
    if r.sleeping and qe is not null and t < qe and t + make_interval(secs => step*3600) > qe then step := extract(epoch from qe - t) / 3600; end if;
    hr := extract(hour from (t at time zone 'Asia/Taipei'))::int;
    off := t > r.seen_at + interval '30 minutes';
    if r.sleeping and qe is not null and t < qe then if off then sqf := sqf + step; else sqo := sqo + step; end if;  -- 快速睡覺（睡到 qe 為止）
    elsif r.sleeping and qe is null then if off then shf := shf + step; else sho := sho + step; end if;
    elsif not r.sleeping and (t > r.seen_at + interval '60 minutes' or (hr < 7 and off)) then shf := shf + step; nightoff := true;  -- 待機超過 60 分鐘、或半夜離線：回家睡了
    else
      if off then ahf := ahf + step; else aho := aho + step; if r.place = 'street' and not r.sleeping then ps := ps + step; end if; end if;
      if hr >= 22 or hr < 6 then if off then nhf := nhf + step; else nho := nho + step; end if; end if;
    end if;
    t := t + make_interval(secs => step*3600);
  end loop;
  sho := sho + sqo; shf := shf + sqf;
  bedg := 80 + 10*public.town_fu(r,'bed'); hm := case when public.town_has(r,'clean') then .7 else 1 end;
  -- 睡覺也會餓、會想上廁所、會出汗；睡覺精力回升不受離線影響。離線那段 ×0.4 且停在 15
  r.hunger := r.hunger - 5*sho - 8*aho;  r.hunger := greatest(r.hunger - .4*(5*shf + 8*ahf), least(r.hunger, 15));
  r.bladder := r.bladder - 7*sho - 10*aho; r.bladder := greatest(r.bladder - .4*(7*shf + 10*ahf), least(r.bladder, 15));
  r.hygiene := r.hygiene - (2.4*sho + 5*aho)*hm; r.hygiene := greatest(r.hygiene - .4*(2.4*shf + 5*ahf)*hm, least(r.hygiene, 15));
  v := r.energy + bedg*sho + 1.5*bedg*sqo - 5*aho + case when public.town_has(r,'nightowl') then 1.0*nho else 0 end;
  dl := bedg*shf + 1.5*bedg*sqf - .4*5*ahf + case when public.town_has(r,'nightowl') then .4*1.0*nhf else 0 end;
  r.energy := greatest(v + dl, least(v, 15));
  -- 又餓又髒又憋的時候心情掉更快（額外 −3／小時）
  if r.hunger < 20 or r.bladder < 20 or r.hygiene < 20 then exo := 3*aho; exf := .4*3*ahf; end if;
  v := r.fun - 1.6*sho - 4*aho - exo;  r.fun := greatest(v - .4*(1.6*shf + 4*ahf) - exf, least(v, 15));
  hr := extract(hour from (now() at time zone 'Asia/Taipei'))::int;
  -- 半夜沒上線的人回家睡了：人在家裡；現在還是半夜就繼續睡，天亮（8 點後）就在家醒來
  -- 快速睡覺時間到：自動醒來
  if qe is not null and now() >= qe then
    if r.sleeping and not fa then r.sleeping := false; end if;
    r.items := r.items - 'qs'; qe := null;
  end if;
  -- 待機超過 60 分鐘（或半夜離線 30 分鐘）的人回家睡了：人在自己屋裡；夜間（22～8 點）或精力不到 90 就繼續睡，否則在家醒著
  if nightoff or (not r.sleeping and now() > r.seen_at + interval '30 minutes' and (hr < 7 or now() > r.seen_at + interval '60 minutes')) then
    select * into d from public.town_door(r.slot);
    r.place := 'home:' || r.id; r.x := d.dx; r.y := d.dy; r.items := r.items - 'dr';
    r.sleeping := hr < 8 or hr >= 22 or r.energy < 90;
  elsif r.sleeping and qe is null and not fa and hr between 8 and 21 and now() > r.seen_at + interval '30 minutes' and r.energy >= 90 then
    r.sleeping := false;  -- 睡飽了自然醒
  end if;
  if fa then r.sleeping := true; end if;
  -- 昏倒滿 1 小時：醒來，扣醫藥費 €1500（不夠就扣到 0）
  if (r.items->>'faint') is not null and not fa then
    r.sleeping := false; r.items := r.items - 'faint';
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'faint', r.name || ' 在醫院醒來，付了醫藥費 €' || least(1500, greatest(0, r.money)));
    r.money := greatest(0, r.money - 1500);
  end if;
  -- 清潔歸零：發臭，同地點醒著的人心情 −2（只在剛歸零那一次）
  if hyg0 > 0 and r.hygiene <= 0 then
    perform public.town_hit(r, 2);
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'stink', r.name || ' 好幾天沒洗澡，身上開始發臭了');
  end if;
  -- 站在路上（上線中）每 15 分鐘約 20% 遇到壞事；幸運兒機率減半。離線、在家、在設施裡不會發生
  ev := ps * .8 * case when public.town_has(r,'lucky') then .5 else 1 end;
  if ev > 0 and not r.sleeping and random() < ev then
    bk := 1 + floor(random()*5)::int;
    if bk = 1 then r.energy := r.energy - 10; bn := ' 被野狗追著跑了一條街 🐕';
    elsif bk = 2 then r.hygiene := r.hygiene - 15; bn := ' 站在路邊被鳥大便打中 🐦';
    elsif bk = 3 then r.hygiene := r.hygiene - 10; r.fun := r.fun - 8; bn := ' 突然下大雨，被淋成落湯雞 🌧️';
    elsif bk = 4 then bm := least(500, floor(greatest(0, r.money) * (.03 + random()*.05))::int); r.money := r.money - bm; bn := ' 站在路邊被小偷摸走了 €' || bm || ' 🦹';
    else r.bruised_until := now() + interval '30 minutes'; r.fun := r.fun - 10; r.energy := r.energy - 5; bn := ' 被機車擦撞，鼻青臉腫 🛵'; end if;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'luck', r.name || bn);
  end if;
  -- 膀胱歸零：在家弄髒房間；在外面大在路上（留一坨便便 2 小時，同地點醒著的人心情 −5）
  if r.bladder <= 0 then
    r.bladder := 100; r.hygiene := 0;
    if public.town_inside(r) then
      r.fun := r.fun - 15;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'accident', r.name || ' 來不及上廁所，把房間弄髒了');
    else
      r.fun := r.fun - 25;
      if not exists (select 1 from public.town_poops p where p.maker = r.id and p.at > now() - interval '1 minute') then
        insert into public.town_poops(town_id,x,y,maker) values (r.town_id, round(r.x), round(r.y), r.id);
        perform public.town_hit(r, 5);
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'poop', r.name || ' 憋不住了，直接大在' || public.town_place_name(r.place) || '，附近的人都皺起眉頭');
      end if;
    end if;
  end if;
  -- 飽足歸零（醒著）：餓到昏倒，原地睡著 1 小時
  if r.hunger <= 0 and not r.sleeping then
    r.sleeping := true; r.hunger := 10; r.items := jsonb_set(r.items, '{faint}', to_jsonb((now() + interval '1 hour')::text));
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'faint', r.name || ' 餓到昏倒，在' || public.town_place_name(r.place) || '倒下了');
  end if;
  if not r.sleeping and r.energy <= 0 then
    r.sleeping := true; r.energy := 0;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'passout', r.name || ' 累到在' || public.town_place_name(r.place) || '直接睡著了');
  end if;
  -- 心情歸零：低落（薪水 −30%），要回到 20 以上才解除
  if r.fun <= 0 and coalesce(r.items->>'sad','') <> 'true' then
    r.items := jsonb_set(r.items, '{sad}', 'true'::jsonb);
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, r.id, 'sad', r.name || ' 心情跌到谷底，整個人提不起勁');
  elsif r.fun >= 20 and coalesce(r.items->>'sad','') = 'true' then
    r.items := r.items - 'sad';
  end if;
  r.hunger := least(100, greatest(0, r.hunger)); r.energy := least(100, greatest(0, r.energy)); r.bladder := least(100, greatest(0, r.bladder));
  r.hygiene := least(100, greatest(0, r.hygiene)); r.fun := least(100, greatest(0, r.fun));
  r.updated_at := now();
  return r;
end $$;
revoke all on function public.town_seg_d(real,real,real,real,real,real) from public, anon, authenticated;

create table if not exists public.town_poops (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  x real not null, y real not null, maker bigint, at timestamptz not null default now()
);
create index if not exists town_poops_town on public.town_poops(town_id, at desc);
alter table public.town_poops enable row level security;
revoke all on public.town_poops from anon, authenticated;

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
  delete from public.town_poops where town_id = t.id and at < now() - interval '2 hours';
  for r in select * from public.town_residents where town_id = t.id order by slot for update loop
    r := public.town_tick(r);
    update public.town_residents set hunger=r.hunger,energy=r.energy,bladder=r.bladder,hygiene=r.hygiene,fun=r.fun,sleeping=r.sleeping,place=r.place,x=r.x,y=r.y,items=r.items,money=r.money,bruised_until=r.bruised_until,updated_at=r.updated_at where id=r.id;
    acc := acc || public.town_pub(r);
  end loop;
  perform public.town_apply_hits();
  return json_build_object('now',now(),'town',json_build_object('id',t.id,'name',t.name,'rows',t.rows,'off',t.off,'cur',t.currency),'residents',array_to_json(acc),'poops',(select coalesce(json_agg(json_build_object('id',id,'x',x,'y',y,'at',at)),'[]') from public.town_poops where town_id = t.id),
    'bonds',(select coalesce(json_agg(json_build_object('a',a,'b',b,'s',score)),'[]') from public.town_bonds where town_id = t.id),
    'duels',(select coalesce(json_agg(json_build_object('id',id,'a',a,'b',b,'bet',bet,'at',created_at)),'[]') from public.town_duels where town_id = t.id and status = 'open' and created_at > now() - interval '24 hours'),
    -- 每週排行（最近 7 天）：最勤勞、最受歡迎、最欠扁、最愛照顧人
    'week',(select json_build_object(
      'work',(select coalesce(json_agg(x),'[]') from (select actor id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('work','cowork') and actor is not null group by actor order by n desc limit 12) x),
      'popular',(select coalesce(json_agg(x),'[]') from (select target id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('feed','wash','visit','gift','note','thank','greet','feast','delivery','call') and target is not null group by target order by n desc limit 12) x),
      'punched',(select coalesce(json_agg(x),'[]') from (select target id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('fight','egg','prank') and target is not null group by target order by n desc limit 12) x),
      'kind',(select coalesce(json_agg(x),'[]') from (select actor id, count(*) n from public.town_events where town_id = t.id and at > now() - interval '7 days' and kind in ('feed','wash','visit','gift','note','feast','delivery') and actor is not null group by actor order by n desc limit 12) x))),
    'events',(select coalesce(json_agg(e order by e.at desc, e.id desc),'[]') from
      (select id,at,actor,target,kind,msg from (
        (select id,at,actor,target,kind,msg from public.town_events where town_id = t.id and kind not in ('work','rent') order by at desc, id desc limit 60)
        union all (select id,at,actor,target,kind,msg from public.town_events where town_id = t.id and kind = 'rent' and at > now() - interval '36 hours')) u) e));
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
  -- 每日生活費：只動錢和 items.rent，不碰其他欄位
  if coalesce(r.items->>'rent','') <> to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD') then
    r := public.town_rent(r);
    update public.town_residents set money = greatest(0, r.money), items = jsonb_set(items, '{rent}', r.items->'rent') where id = rid;
  end if;
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
  elsif act = 'stats' then
    return json_build_object('ok',true,'stats',(select coalesce(json_agg(x),'[]') from (
      select c.key, count(*) filter (where c.kind = 'show') shows, count(*) filter (where c.kind = 'click') clicks
      from public.town_cta c where c.town_id = r.town_id and c.at > now() - interval '7 days' group by c.key order by shows desc, clicks desc limit 12) x));
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
-- 背包：收到的禮物放在對方 items.rg（未拆禮物，上限 20，最舊的先丟）
create or replace function public.town_rg_add(tid bigint, fid bigint, fname text) returns void
language plpgsql security definer set search_path = public as $$
declare g jsonb;
begin
  select coalesce(items->'rg','[]'::jsonb) into g from public.town_residents where id = tid;
  g := g || jsonb_build_array(jsonb_build_object('id', left(md5(random()::text),8), 'from', fid, 'name', fname, 'at', extract(epoch from now())::bigint));
  while jsonb_array_length(g) > 20 loop g := g - 0; end loop;
  update public.town_residents set items = jsonb_set(items, '{rg}', g) where id = tid;
end $$;
revoke all on function public.town_rg_add(bigint,bigint,text) from public, anon, authenticated;

-- 每日計數（台灣時間 0 點重置）：items.dc = {d:日期, work:打工次數, mail:郵筒領到錢次數, trash:垃圾桶領到錢次數}
create or replace function public.town_dc_get(r public.town_residents, k text) returns int language sql stable as $$
  select case when r.items->'dc'->>'d' = to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD') then coalesce((r.items->'dc'->>k)::int,0) else 0 end
$$;
create or replace function public.town_dc_inc(r public.town_residents, k text) returns public.town_residents language plpgsql stable as $$
declare dc jsonb; day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
begin
  dc := case when r.items->'dc'->>'d' = day then r.items->'dc' else jsonb_build_object('d', day) end;
  dc := jsonb_set(dc, array[k], to_jsonb(coalesce((dc->>k)::int,0) + 1));
  r.items := jsonb_set(r.items, '{dc}', dc);
  return r;
end $$;
-- ── 其他工作（咖啡師／服務生／健身教練／店員／拉菲的辦公室）：各自計數 items.jw[k]，疲勞和公司共用 dc.work ──
-- 熟練度：0 次 ×1.0、15 次 ×1.15、40 次 ×1.3；拉菲三個職位（行政專員／企劃／業務經理）底薪 320／450／650
create or replace function public.town_pjob_place(k text) returns text language sql immutable as $$
  select case k when 'cafe' then 'cafe' when 'rest' then 'restaurant' when 'gym' then 'gym' when 'shop' then 'market' when 'rafi' then 'rafi' end
$$;
create or replace function public.town_pjob_key(k text) returns text language sql immutable as $$
  select case k when 'cafe' then 'coffee' when 'rest' then 'dine' when 'gym' then 'workout' when 'shop' then 'browse' when 'rafi' then 'rafi' end
$$;
-- 消耗 {精力,飽足,心情,清潔}
create or replace function public.town_pjob_fx(k text) returns int[] language sql immutable as $$
  select case k when 'cafe' then array[-12,-6,-6,-3] when 'rest' then array[-14,-3,-8,-8] when 'gym' then array[-20,-12,-4,-15]
    when 'shop' then array[-10,-6,-10,-2] when 'rafi' then array[-15,-8,-18,-4] end
$$;
create or replace function public.town_pjob_wage(k text, n int) returns int language sql immutable as $$
  select case when k = 'rafi' then (case when n >= 40 then 650 when n >= 15 then 450 else 320 end)
    else (case k when 'cafe' then 200 when 'rest' then 210 when 'gym' then 230 when 'shop' then 195 end) * (case when n >= 40 then 130 when n >= 15 then 115 else 100 end) / 100 end
$$;
create or replace function public.town_pjob_name(k text, n int) returns text language sql immutable as $$
  select case k when 'rafi' then (case when n >= 40 then '業務經理' when n >= 15 then '企劃' else '行政專員' end)
    else (case k when 'cafe' then '咖啡師' when 'rest' then '服務生' when 'gym' then '健身教練' when 'shop' then '店員' end) || (case when n >= 40 then '（資深）' when n >= 15 then '（熟手）' else '' end) end
$$;
revoke all on function public.town_pjob_place(text), public.town_pjob_key(text), public.town_pjob_fx(text), public.town_pjob_wage(text,int), public.town_pjob_name(text,int) from public, anon, authenticated;
-- 打工疲勞：今天前 4 次全額、第 5～8 次 50%、之後 25%（打工與加班都算）
create or replace function public.town_work_pct(n int) returns int language sql immutable as $$
  select case when n < 4 then 100 when n < 8 then 50 when n < 16 then 25 else 10 end
$$;
-- 每日生活費（房租＋水電）：每個台灣日第一次上線扣一次，最多扣到 0，離線的日子不補扣
create or replace function public.town_rent_amt(lv int) returns int language sql immutable as $$
  select (array[350,600,1200,2500])[least(4, greatest(1, lv))]
$$;
-- 股市 T+2 交割：賣股的錢要等 2 個平日才入帳（items.st.pend = [{d:到帳日, a:金額}]）；town_state／town_act 和股票交易會呼叫（登入那條路只存錢，不能在 town_rent 裡入帳）
create or replace function public.town_stock_settle(r public.town_residents) returns public.town_residents language plpgsql as $$
declare today date := (now() at time zone 'Asia/Taipei')::date; due int := 0; keep jsonb := '[]'::jsonb; e jsonb; pend jsonb := r.items->'st'->'pend';
begin
  if pend is null or jsonb_typeof(pend) <> 'array' or jsonb_array_length(pend) = 0 then return r; end if;
  for e in select x from jsonb_array_elements(pend) x loop
    if (e->>'d')::date <= today then due := due + coalesce((e->>'a')::int,0); else keep := keep || jsonb_build_array(e); end if;
  end loop;
  if jsonb_array_length(keep) <> jsonb_array_length(pend) then
    r.money := r.money + due; r.items := jsonb_set(r.items, '{st,pend}', keep);
  end if;
  return r;
end $$;
revoke all on function public.town_stock_settle(public.town_residents) from public, anon, authenticated;
create or replace function public.town_rent(r public.town_residents) returns public.town_residents language plpgsql as $$
declare day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); a int; p int;
begin
  if coalesce(r.items->>'rent','') = day then return r; end if;
  a := public.town_rent_amt(coalesce((r.items->>'hl')::int,1)); p := least(a, greatest(0, r.money));
  r.money := r.money - p; r.items := jsonb_set(r.items, '{rent}', to_jsonb(day));
  insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'rent', r.name || ' 繳了今天的房租水電 €' || p || case when p < a then '（錢不夠，只扣到 0）' else '' end);
  return r;
end $$;
revoke all on function public.town_dc_get(public.town_residents,text), public.town_dc_inc(public.town_residents,text), public.town_work_pct(int), public.town_rent_amt(int), public.town_rent(public.town_residents) from public, anon, authenticated;

create or replace function public.town_act(rid bigint, pin text, act text, target bigint default null, px real default null, py real default null, dest text default null, item text default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; others text; tn text; n int; w int; near boolean; pa real; pb real; bond int; m real; pub text[] := array['plaza','restaurant','market','park','office'];
  fm real := 1; gm int := 1; mo text; lk boolean; jl int; jf jsonb; fx int[];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  fm := case when public.town_has(r,'foodie') then 1.3 else 1 end; gm := case when public.town_has(r,'romantic') then 2 else 1 end; lk := public.town_has(r,'lucky'); mo := public.town_mood(r);
  perform set_config('town.bm', (public.town_mood_bond(mo) * case when public.town_has(r,'social') then 130 else 100 end / case when r.hygiene < 1 then 2 else 1 end)::text, true);
  r := public.town_rent(r);
  r := public.town_stock_settle(r);
  if r.sleeping and act not in ('wake') then raise exception '你在睡覺，先起床'; end if;
  if public.town_closed(case when act = 'obj' then item when act = 'job' then public.town_pjob_key(item) else act end) is not null then raise exception '%', public.town_closed(case when act = 'obj' then item when act = 'job' then public.town_pjob_key(item) else act end); end if;
  if public.town_is_off(r.town_id, public.town_feature(case when act = 'move' then dest when act = 'job' then public.town_pjob_key(item) else act end)) then raise exception '這個小鎮沒有開這個設施'; end if;
  if act = 'move' then
    if dest is null or not (dest in ('plaza','restaurant','market','office','park','street','cafe','cinema','gym','arena','slaughter','rafi','stock')
       or (dest ~ '^home:\d+$' and exists (select 1 from public.town_residents where id = substr(dest,6)::bigint and town_id = r.town_id))) then raise exception '去不了那裡'; end if;
    if px is null or py is null or px < 0 or px > 52 or py < 0 or py > 40 then raise exception '位置不對'; end if;
    -- 走過別人留下的便便會踩到（路線離便便不到 0.6 格）
    select p.id::int into n from public.town_poops p where p.town_id = r.town_id and p.maker is distinct from rid and p.at > now() - interval '2 hours' and public.town_seg_d(p.x, p.y, r.x, r.y, px, py) < .6 order by p.at limit 1;
    if n is not null then
      delete from public.town_poops where id = n; r.hygiene := r.hygiene - 20; r.fun := r.fun - 5;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'step', r.name || ' 一腳踩到了便便');
    end if;
    r.x := px; r.y := py; r.place := dest;
    r.items := case when dest = 'home:' || rid then jsonb_set(r.items, '{dr}', '1'::jsonb) else r.items - 'dr' end;  -- 走到自己家門口：站在門外，要按「進屋」
    -- 隨機事件：出門走到外面的地方時偶爾發生（家裡不會）
    if dest !~ '^home:' and random() < .12 then
      pa := random();
      if lk and ((pa >= .25 and pa < .52) or (pa >= .67 and pa < .80) or (pa >= .90 and pa < .97)) then pa := random(); end if;
      if pa < .25 then n := 20 + floor(random()*81)::int; r.money := r.money + n; tn := r.name || ' 在路上撿到 €' || n || ' 💰';
      elsif pa < .40 then r.hygiene := r.hygiene - 20; tn := r.name || ' 一不小心踩到狗屎 💩';
      elsif pa < .52 then r.hygiene := r.hygiene - 15; tn := r.name || ' 被鳥大便打中頭 🐦';
      elsif pa < .67 then r.fun := r.fun + 10; tn := r.name || ' 遇到街頭藝人表演，看得很開心 🎸';
      elsif pa < .80 then r.hygiene := r.hygiene - 10; r.fun := r.fun - 5; tn := r.name || ' 突然下大雨，被淋成落湯雞 🌧️';
      elsif pa < .90 then r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 1)); tn := r.name || ' 在路上被試吃攤送了一包零食 🍪';
      elsif pa < .97 then r.energy := r.energy - 10; tn := r.name || ' 被野狗追著跑了一條街 🐕';
      else r.money := r.money + 2000; tn := r.name || ' 買刮刮樂中了 €2000！🎉'; end if;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', tn); tn := null;
    end if;
    if dest in ('plaza','restaurant','market','park','cafe','cinema','gym','arena','slaughter','rafi','stock') then
      select string_agg(name, '、') into others from public.town_residents where town_id = r.town_id and place = dest and id <> rid and not sleeping;
      if others is not null and not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'meet' and e.at > now() - interval '2 hours') then
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'meet', r.name || ' 在' || public.town_place_name(dest) || '遇到了 ' || others);
        r.fun := r.fun + 10;
      end if;
    end if;
  elsif act = 'enter' then
    if r.place <> 'home:' || rid then raise exception '要先走到自己家門口'; end if;
    r.items := r.items - 'dr';
  elsif act = 'exit' then
    if not public.town_inside(r) then raise exception '你不在屋裡'; end if;
    r.items := jsonb_set(r.items, '{dr}', '1'::jsonb);
  elsif act in ('eat','toilet','shower','tv','sleep','nap','qsleep') then
    if not public.town_inside(r) then raise exception '要先進屋才能做這個'; end if;
    if act = 'eat' then n := 60 - 30*public.town_fu(r,'fridge'); if r.money < n then raise exception '錢不夠買食材，去公司打工吧'; end if; r.hunger := r.hunger + (40 + 8*public.town_fu(r,'fridge'))*fm; r.energy := r.energy + 15; r.money := r.money - n;
    elsif act = 'toilet' then r.bladder := 100;
    elsif act = 'shower' then
      if (r.items->'cd'->>'shower') is not null and (r.items->'cd'->>'shower')::timestamptz > now() - interval '10 minutes' then raise exception '剛洗完澡，等一下再洗'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('shower', now())); r.hygiene := 100; r.energy := r.energy + 10; r.fun := r.fun + 3;
    elsif act = 'tv' then
      if (r.items->'cd'->>'tv') is not null and (r.items->'cd'->>'tv')::timestamptz > now() - make_interval(mins => 15 - 5*public.town_fu(r,'tvcab')) then raise exception '剛看完電視，休息一下眼睛'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('tv', now())); r.fun := r.fun + 15 + 7*public.town_fu(r,'sofa'); r.energy := r.energy - 3;
    elsif act = 'sleep' then r.sleeping := true; r.items := r.items - 'qs';
    elsif act = 'qsleep' then
      -- 快速睡覺：睡 15 分鐘自動醒，睡眠速率 ×2.5（一般每小時 80、好床 90；這裡每小時 200／好床 225，15 分鐘約 +50／+56）；30 分鐘冷卻
      if (r.items->'cd'->>'qsleep') is not null and (r.items->'cd'->>'qsleep')::timestamptz > now() - interval '30 minutes' then raise exception '剛睡過，等一下再睡'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('qsleep', now()));
      r.items := jsonb_set(r.items, '{qs}', to_jsonb((now() + interval '15 minutes')::text)); r.sleeping := true;
    elsif act = 'nap' then
      if (r.items->'cd'->>'nap') is not null and (r.items->'cd'->>'nap')::timestamptz > now() - interval '15 minutes' then raise exception '剛休息過，等一下再休息'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('nap', now())); r.energy := r.energy + 70 + 30*public.town_fu(r,'massage'); end if;
  elsif act = 'wake' then
    if (r.items->>'faint') is not null then raise exception '餓到昏倒了，還醒不過來'; end if;
    r.sleeping := false; r.items := r.items - 'qs';
  elsif act = 'sweep' then
    delete from public.town_poops p where p.id = nullif(item,'')::bigint and p.town_id = r.town_id and abs(p.x - r.x) + abs(p.y - r.y) <= 2 and p.at > now() - interval '2 hours' returning p.id into n;
    if n is null then raise exception '便便不見了，或是離太遠'; end if;
    r.money := r.money + 30;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'sweep', r.name || ' 把路上的便便清掉了，領了 €30');
  elsif act = 'obj' then
    if not public.town_obj_near(item, r.x, r.y, r.place) then raise exception '要走到旁邊才能用'; end if;
    if item <> 'dummy' then
      if (r.items->'cd'->>item) is not null and (r.items->'cd'->>item)::timestamptz > now() - interval '10 minutes' then raise exception '剛剛才用過，等一下再來'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(item, now()));
    end if;
    pa := random(); if lk and item <> 'cat' then pa := pa * .75; end if;
    if item = 'vend' then
      if r.money < 30 then raise exception '錢不夠，一罐 €30'; end if; r.money := r.money - 30; r.energy := r.energy + 12; r.fun := r.fun + 3;
      if pa < .08 then r.energy := r.energy + 12; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 投了一罐飲料，結果掉出兩罐 🥤🥤'); end if;
    elsif item = 'trash' then r.fun := r.fun + 4;
      if pa < .05 then r.items := jsonb_set(r.items, '{gift}', to_jsonb(coalesce((r.items->>'gift')::int,0) + 1)); insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 撿垃圾時發現一個沒拆的禮物 🎁');
      elsif pa < .25 and public.town_dc_get(r,'trash') < 3 then r := public.town_dc_inc(r,'trash'); n := 20 + floor(random()*41)::int; r.money := r.money + n; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 撿垃圾時撿到 €' || n || ' 💰'); end if;
    elsif item = 'stall' then
      if r.money < 60 then raise exception '錢不夠，烤地瓜 €60'; end if; r.money := r.money - 60; r.hunger := r.hunger + 25*fm; r.fun := r.fun + 3;
    elsif item = 'well' then
      if r.money < 10 then raise exception '連 €10 都沒有了'; end if; r.money := r.money - 10;
      if pa < .015 then r.fun := r.fun + 20; r.money := r.money + 500; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 在小豬噴水池許願，願望成真，天上掉下 €500 ✨');
      else r.fun := r.fun + 2; end if;
    elsif item = 'swing' then r.fun := r.fun + 12; r.energy := r.energy - 3;
    elsif item = 'cat' then
      if coalesce((r.items->>'snack')::int,0) > 0 and note = 'feed' then
        r.items := jsonb_set(r.items, '{snack}', to_jsonb((r.items->>'snack')::int - 1)); r.fun := r.fun + 15;
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 餵了公園的流浪貓，牠一直蹭過來 🐱');
      else r.fun := r.fun + 8; if pa < .15 then r.hygiene := r.hygiene - 10; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 想摸流浪貓，被抓了一下 🐱💢'); end if; end if;
    elsif item = 'dummy' then
      -- 新手村的人型靶：隨便揍，不會還手也沒有冷卻；每揍 10 下體能 +1（最多 10）
      if r.energy < 5 then raise exception '你太累了，打不動'; end if;
      r.energy := r.energy - 3; r.fun := r.fun + 5; r.hygiene := r.hygiene - 1;
      n := coalesce((r.items->>'dm')::int,0) + 1; r.items := jsonb_set(r.items, '{dm}', to_jsonb(n));
      if n % 10 = 0 and coalesce((r.items->>'fit')::int,0) < 10 then
        r.items := jsonb_set(r.items, '{fit}', to_jsonb(coalesce((r.items->>'fit')::int,0) + 1));
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 狂揍人型靶，體能變強了 💪');
      end if;
    elsif item = 'bench' then r.energy := r.energy + 20; r.fun := r.fun + 2;
    elsif item = 'cooler' then r.energy := r.energy + 3; r.hunger := r.hunger + 3; r.bladder := r.bladder - 3;
    elsif item = 'pwc' then r.bladder := 100; r.hygiene := r.hygiene - 3;
    elsif item = 'mailbox' then r.fun := r.fun + 2;
      if pa < .3 and public.town_dc_get(r,'mail') < 3 then r := public.town_dc_inc(r,'mail'); n := 30 + floor(random()*61)::int; r.money := r.money + n; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 打開郵筒，收到一筆 €' || n || ' 的退款 💌'); end if;
    elsif item = 'news' then
      if r.money < 20 then raise exception '錢不夠，報紙 €20'; end if; r.money := r.money - 20; r.fun := r.fun + 8;
      if pa < .08 then r.money := r.money + 150; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 翻報紙時掉出一張折價券，換了 €150 📰'); end if;
    elsif item = 'claw' then
      if r.money < 30 then raise exception '錢不夠，夾一次 €30'; end if; r.money := r.money - 30;
      if pa < .22 then r.items := jsonb_set(r.items, '{gift}', to_jsonb(coalesce((r.items->>'gift')::int,0) + 1)); r.fun := r.fun + 20; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 在夾娃娃機夾到一個大娃娃 🎁');
      else r.fun := r.fun + 5; end if;
    elsif item = 'lottery' then
      if r.money < 100 then raise exception '錢不夠，刮刮樂 €100'; end if; r.money := r.money - 100; r.fun := r.fun + 5;
      if pa < .005 then r.money := r.money + 2500; r.fun := r.fun + 25; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 刮刮樂刮中頭獎 €2500！🍀');
      elsif pa < .155 then r.money := r.money + 200; elsif pa < .455 then r.money := r.money + 100; end if;
    elsif item = 'busker' then
      if r.money < 50 then raise exception '錢不夠，打賞 €50'; end if; r.money := r.money - 50; r.fun := r.fun + 15;
    elsif item = 'pond' then
      if coalesce((r.items->>'snack')::int,0) < 1 then raise exception '背包沒有零食，去超市買'; end if;
      r.items := jsonb_set(r.items, '{snack}', to_jsonb((r.items->>'snack')::int - 1)); r.fun := r.fun + 12;
      if pa < .08 then r.money := r.money + 100; insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', r.name || ' 餵池塘的鴨子，鴨子叼來 €100 🐦'); end if;
    else raise exception '這裡沒有這個東西'; end if;
  elsif act = 'spar' then
    -- 格鬥場：打擂台挑戰對手，連勝越多對手越強、獎金越高；30 分鐘打一場
    if r.place <> 'arena' then raise exception '要在格鬥場才能打擂台'; end if;
    if r.energy < 15 then raise exception '你太累了，打不動'; end if;
    if (r.items->'cd'->>'spar') is not null and (r.items->'cd'->>'spar')::timestamptz > now() - interval '15 minutes' then raise exception '剛打完一場，喘口氣再上'; end if;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('spar', now()));
    n := coalesce((r.items->>'streak')::int,0);
    pa := 30 + r.energy*.4 + r.fun*.2 + random()*45 + coalesce((r.items->>'fit')::int,0)*2 - case when r.bruised_until > now() then 15 else 0 end + public.town_mood_pow(mo) + case when public.town_has(r,'athlete') then 5 else 0 end;
    pb := 55 + n*6 + random()*45;
    tn := (array['沙包王阿肥','鐵拳野豬','蒙面山豬','肌肉豬大哥','傳說中的豬魔王'])[least(5, n/2 + 1)];
    r.energy := r.energy - 12; r.hunger := r.hunger - 8;
    if pa >= pb then
      n := n + 1; w := 100 + n*50;
      -- 每小時獎金上限：這一小時已經領超過 €600，之後只給 25%
      if (r.items->'ar'->>'t') is null or (r.items->'ar'->>'t')::timestamptz < now() - interval '1 hour' then r.items := jsonb_set(r.items, '{ar}', jsonb_build_object('t', now(), 's', 0)); end if;
      if (r.items->'ar'->>'s')::int >= 600 then w := w / 4; end if;
      r.items := jsonb_set(r.items, '{ar,s}', to_jsonb((r.items->'ar'->>'s')::int + w));
      r.money := r.money + w; r.fun := r.fun + 15;
      r.items := jsonb_set(r.items, '{streak}', to_jsonb(n));
      r.items := jsonb_set(r.items, '{best}', to_jsonb(greatest(n, coalesce((r.items->>'best')::int,0))));
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'spar', r.name || ' 在格鬥場打贏 ' || tn || '，' || n || ' 連勝 🥊 拿到 €' || w);
    else
      r.fun := r.fun - 10; r.hygiene := r.hygiene - 10; r.bruised_until := now() + interval '1 hour';
      r.items := jsonb_set(r.items, '{streak}', to_jsonb(0));
      if n >= 2 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'spar', r.name || ' 的 ' || n || ' 連勝被 ' || tn || ' 終結了 🤕'); end if;
    end if;
  elsif act = 'sneak' then
    -- 屠宰場：溜進去偷飼料，有賺有賠；3 小時一次
    if r.place <> 'slaughter' then raise exception '要在屠宰場門口'; end if;
    if r.energy < 10 then raise exception '你太累了，跑不動'; end if;
    if (r.items->'cd'->>'sneak') is not null and (r.items->'cd'->>'sneak')::timestamptz > now() - interval '1 hour' then raise exception '屠夫還在找你，1 小時後再來'; end if;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('sneak', now()));
    -- 要先花 €400 買通守衛；期望值略負（有錢的人被抓會賠 €1200，健身越多越跑得掉）
    if r.money < 400 then raise exception '錢不夠，買通守衛要 €400'; end if;
    r.money := r.money - 400;
    pa := random() - coalesce((r.items->>'fit')::int,0)*.01; r.energy := r.energy - 10;
    if pa < .03 then r.money := r.money + 3000; r.fun := r.fun + 30; tn := r.name || ' 溜進屠宰場，翻到屠夫藏的私房錢 €3000 💰 全身而退！';
    elsif pa < .48 then n := 500 + floor(random()*401)::int; r.money := r.money + n; r.fun := r.fun + 20; tn := r.name || ' 溜進屠宰場偷了一袋飼料，轉手賣了 €' || n || ' 🐷💨';
    elsif pa < .78 then r.energy := r.energy - 15; r.hygiene := r.hygiene - 25; r.fun := r.fun - 10; tn := r.name || ' 被屠夫發現，拿著刀追了三條街 🔪🏃 嚇到腿軟';
    else n := least(1200, r.money); r.money := r.money - n; r.fun := r.fun - 20; r.hygiene := r.hygiene - 20; r.bruised_until := now() + interval '2 hours';
      tn := r.name || ' 被屠夫抓住，差點被做成香腸 🌭 付了 €' || n || ' 才被放出來'; end if;
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,rid,'luck', tn); tn := null;
  elsif act = 'snack' then
    if coalesce((r.items->>'snack')::int,0) < 1 then raise exception '背包裡沒有零食，去超市買'; end if;
    r.items := jsonb_set(r.items, '{snack}', to_jsonb((r.items->>'snack')::int - 1)); r.hunger := r.hunger + 20*fm; r.fun := r.fun + 3;
  elsif act in ('unwrap','regift') then
    -- 背包：拆收到的禮物（隨機小獎勵）或轉成自己的禮物再送人；item = 禮物 id
    jf := coalesce(r.items->'rg','[]'::jsonb); n := null;
    select i-1 into n from jsonb_array_elements(jf) with ordinality a(e,i) where e->>'id' = item limit 1;
    if n is null then raise exception '背包裡沒有這份禮物'; end if;
    tn := jf->n->>'name'; jf := jf - n;
    if act = 'regift' then
      if coalesce((r.items->>'gift')::int,0) >= 20 then raise exception '背包放不下了'; end if;
      r.items := jsonb_set(jsonb_set(r.items, '{rg}', jf), '{gift}', to_jsonb(coalesce((r.items->>'gift')::int,0) + 1));
    else
      pa := random(); r.items := jsonb_set(r.items, '{rg}', jf);
      if pa < .4 then n := 100 + floor(random()*501)::int; r.money := r.money + n; mo := '€' || n;
      elsif pa < .75 and coalesce((r.items->>'snack')::int,0) < 20 then r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 1)); mo := '一包零食';
      else r.fun := r.fun + 10; mo := '滿滿的好心情'; end if;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 拆開了 ' || tn || ' 送的禮物，裡面是' || mo || ' 🎁');
    end if;
  elsif act = 'buy' and (item like 'w:%' or item like 'd:%' or item like 'f:%') then
    if r.place <> 'market' then raise exception '要在超市才能買'; end if;
    select price into n from public.town_shop where id = substr(item,3) and kind = case when item like 'w:%' then 'wear' when item like 'd:%' then 'deco' else 'furn' end and price > 0;
    if n is null then raise exception '超市沒有賣這個'; end if;
    if coalesce(r.items->(left(item,1)),'[]'::jsonb) ? substr(item,3) then raise exception '你已經有了'; end if;
    if item like 'd:%' and jsonb_array_length(coalesce(r.items->'d','[]'::jsonb)) >= 4 then raise exception '門口最多放 4 樣擺飾'; end if;
    if r.money < n then raise exception '錢不夠，去公司打工吧'; end if;
    r.money := r.money - n; r.fun := r.fun + 5;
    r.items := jsonb_set(r.items, array[left(item,1)], coalesce(r.items->(left(item,1)),'[]'::jsonb) || to_jsonb(substr(item,3)));
  elsif act = 'furn' then
    -- 室內家具：set:格:代號 放進 3x3 的某一格，clr:格 收回；擺放數量看房子等級（4/6/8/9）
    if not public.town_inside(r) then raise exception '要先進屋'; end if;
    jl := coalesce((r.items->>'hl')::int,1); jf := coalesce(r.items->'fu','[]'::jsonb);
    while jsonb_array_length(jf) < 9 loop jf := jf || '""'::jsonb; end loop;
    if item ~ '^clr:[0-8]$' then jf := jsonb_set(jf, array[substr(item,5)], '""'::jsonb);
    elsif item ~ '^set:[0-8]:[a-z]+$' then
      if not (coalesce(r.items->'f','[]'::jsonb) ? split_part(item,':',3)) then raise exception '你還沒有這個家具'; end if;
      if jf ? split_part(item,':',3) then raise exception '這個家具已經放在家裡了'; end if;
      if jf->>(split_part(item,':',2)::int) <> '' then raise exception '那一格已經有家具了'; end if;
      if (select count(*) from jsonb_array_elements_text(jf) e where e <> '') >= (array[4,6,8,9])[jl] then raise exception '房子太小放不下了，升級房子吧'; end if;
      jf := jsonb_set(jf, array[split_part(item,':',2)], to_jsonb(split_part(item,':',3)));
    else raise exception '家具指令不對'; end if;
    r.items := jsonb_set(r.items, '{fu}', jf);
  elsif act = 'upgrade' then
    -- 房子升級：1 小屋、2 公寓 €10000、3 獨棟 €100000、4 豪宅 €200000
    if not public.town_inside(r) then raise exception '要先進屋'; end if;
    jl := coalesce((r.items->>'hl')::int,1);
    if jl >= 4 then raise exception '已經是豪宅了'; end if;
    n := (array[0,13000,100000,200000])[jl+1];
    if r.money < n then raise exception '錢不夠，升級要 €%', n; end if;
    r.money := r.money - n; r.fun := r.fun + 15; r.items := jsonb_set(r.items, '{hl}', to_jsonb(jl+1));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 把家升級成' || (array['小屋','公寓','獨棟','豪宅'])[jl+1] || '了');
  elsif act = 'paint' then
    -- 裝潢：換屋頂或牆壁顏色（€300）
    if not public.town_inside(r) then raise exception '要先進屋'; end if;
    if not (item ~ '^(roof|wall):#[0-9a-f]{6}$') then raise exception '顏色不對'; end if;
    if r.money < 300 then raise exception '錢不夠，去公司打工吧'; end if;
    r.money := r.money - 300; r.fun := r.fun + 8; r.items := jsonb_set(r.items, array[split_part(item,':',1)], to_jsonb(split_part(item,':',2)));
  elsif act = 'buy' then
    if r.place <> 'market' then raise exception '要在超市才能買'; end if;
    if item not in ('gift','snack') then raise exception '超市沒有賣這個'; end if;
    n := case item when 'gift' then 300 else 60 end;
    if r.money < n then raise exception '錢不夠，去公司打工吧'; end if;
    if coalesce((r.items->>item)::int,0) >= 20 then raise exception '背包放不下了'; end if;
    r.money := r.money - n; r.items := jsonb_set(r.items, array[item], to_jsonb(coalesce((r.items->>item)::int,0) + 1)); r.fun := r.fun + 3;
  elsif act = 'job' then
    if item is null or item not in ('cafe','rest','gym','shop','rafi') then raise exception '沒有這份工作'; end if;
    if r.place <> public.town_pjob_place(item) then raise exception '要在%才能做這份工作', public.town_place_name(public.town_pjob_place(item)); end if;
    if item = 'rafi' and coalesce((r.items->>'works')::int,0) < 10 then raise exception '拉菲的辦公室要先在公司升到「員工」（累計打工 10 次）才能應徵'; end if;
    fx := public.town_pjob_fx(item);
    if r.energy < greatest(15, -fx[1]) then raise exception '太累了，先回家睡覺'; end if;
    n := coalesce((r.items->'jw'->>item)::int,0);
    w := public.town_pay(public.town_pjob_wage(item, n), mo, public.town_has(r,'workaholic')) * public.town_work_pct(public.town_dc_get(r,'work')) / 100;
    r := public.town_dc_inc(r,'work');
    r.items := jsonb_set(r.items, '{jw}', coalesce(r.items->'jw','{}'::jsonb) || jsonb_build_object(item, n + 1));
    r.money := r.money + w; r.energy := r.energy + fx[1]; r.hunger := r.hunger + fx[2]; r.fun := r.fun + fx[3]; r.hygiene := r.hygiene + fx[4];
    if item = 'gym' then r.items := jsonb_set(r.items, '{fit}', to_jsonb(least(10, coalesce((r.items->>'fit')::int,0) + 1))); end if;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'work', r.name || ' 在' || public.town_place_name(r.place) || '當' || public.town_pjob_name(item, n) || '，賺了 €' || w);
    if public.town_pjob_name(item, n + 1) <> public.town_pjob_name(item, n) then
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'promo', r.name || ' 在' || public.town_place_name(r.place) || '升職了！成為「' || public.town_pjob_name(item, n + 1) || '」，每次 €' || public.town_pjob_wage(item, n + 1));
    end if;
  elsif act in ('dine','work','play','browse','coffee','movie','workout') then
    if (act = 'dine' and r.place <> 'restaurant') or (act = 'work' and r.place <> 'office') or (act = 'play' and r.place not in ('park','plaza')) or (act = 'browse' and r.place <> 'market')
       or (act = 'coffee' and r.place <> 'cafe') or (act = 'movie' and r.place <> 'cinema') or (act = 'workout' and r.place <> 'gym') then raise exception '不在那個地方'; end if;
    if act = 'dine' then if r.money < 250 then raise exception '錢不夠，去公司打工吧'; end if; r.items := jsonb_set(r.items, '{meals}', to_jsonb(coalesce((r.items->>'meals')::int,0) + 1)); r.hunger := r.hunger + 55*fm; r.energy := r.energy + 20; r.fun := r.fun + 10; r.money := r.money - 250;
    elsif act = 'work' then if r.energy < 15 then raise exception '太累了，先回家睡覺'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('work', now())); n := coalesce((r.items->>'works')::int,0);
      w := public.town_pay(public.town_wage(public.town_job_lv(n)), mo, public.town_has(r,'workaholic')) * public.town_work_pct(public.town_dc_get(r,'work')) / 100;
      r := public.town_dc_inc(r,'work');
      r.items := jsonb_set(r.items, '{works}', to_jsonb(n + 1)); r.money := r.money + w; r.energy := r.energy - 15; r.fun := r.fun - 10; r.hunger := r.hunger - 8;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'work', r.name || ' 打工賺了 €' || w);
      if public.town_job_lv(n + 1) > public.town_job_lv(n) then
        insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'promo', r.name || ' 升職了！成為「' || public.town_job_name(public.town_job_lv(n + 1)) || '」，每次打工 €' || public.town_wage(public.town_job_lv(n + 1)));
      end if;
    elsif act = 'play' then r.fun := r.fun + 20; r.energy := r.energy - 5;
    elsif act in ('coffee','movie','workout') then
      if (r.items->'cd'->>act) is not null and (r.items->'cd'->>act)::timestamptz > now() - (case act when 'coffee' then interval '30 minutes' else interval '1 hour' end) then raise exception '剛剛才去過，晚點再來'; end if;
      r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(act, now()));
      if act = 'coffee' then if r.money < 90 then raise exception '錢不夠，咖啡 €90'; end if; r.money := r.money - 90; r.energy := r.energy + 50; r.fun := r.fun + 3; r.bladder := r.bladder - 10;
      elsif act = 'movie' then if r.money < 300 then raise exception '錢不夠，電影票 €300'; end if; r.money := r.money - 300; r.fun := r.fun + 35; r.energy := r.energy - 5;
      else if r.energy < 15 then raise exception '太累了，先休息'; end if; r.energy := r.energy - 15; r.hunger := r.hunger - 10; r.hygiene := r.hygiene - 15; r.fun := r.fun + 10;
        -- 健身：越練打架越強（最多 +20）
        r.items := jsonb_set(r.items, '{fit}', to_jsonb(least(10, coalesce((r.items->>'fit')::int,0) + case when public.town_has(r,'athlete') then 2 else 1 end)));
      end if;
    else r.fun := r.fun + 6; end if;
    -- 有人在同一個地方：大家一起做，在場的人心情都變好
    if act in ('dine','play','work','coffee','movie','workout') then
      select string_agg(name, '、') into others from public.town_residents where town_id = r.town_id and place = r.place and id <> rid and not sleeping;
      if others is not null then
        update public.town_residents set fun = least(100, fun + 5) where town_id = r.town_id and place = r.place and id <> rid and not sleeping;
        r.fun := r.fun + 5;
        if not exists (select 1 from public.town_events e where e.actor = rid and e.kind = 'together' and e.at > now() - interval '2 hours') then
          insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'together', r.name || ' 和 ' || others || ' 一起' || case act when 'dine' then '在餐廳吃飯' when 'work' then '加班' when 'coffee' then '喝咖啡' when 'movie' then '看電影' when 'workout' then '健身' else '在' || public.town_place_name(r.place) || '玩' end);
        end if;
      end if;
    end if;
  elsif act in ('feed','wash','wakeup','visit','prank','gift','note','thank','greet','fight','egg','makeup','cowork','feast','call','delivery') then
    if target is null or target = rid then raise exception '要選一位朋友'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = act and e.at > now() - case act when 'thank' then interval '2 hours' when 'makeup' then interval '30 minutes' when 'fight' then case when r.place = 'arena' then interval '5 minutes' else interval '10 minutes' end when 'egg' then interval '10 minutes' when 'prank' then interval '10 minutes' when 'cowork' then interval '1 hour' when 'feast' then interval '1 hour' else interval '30 minutes' end) then raise exception '剛剛才做過，等一下再來'; end if;
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
      pa := 30 + r.energy*.4 + r.fun*.2 + random()*45 + coalesce((r.items->>'fit')::int,0)*2 - case when r.bruised_until > now() then 15 else 0 end + public.town_mood_pow(mo) + case when public.town_has(r,'athlete') then 5 else 0 end
        + case when exists (select 1 from public.town_events e where e.actor = t.id and e.target = rid and e.kind in ('fight','egg','prank') and e.at > now() - interval '3 days') then 15 else 0 end;
      pb := 30 + t.energy*.4 + t.fun*.2 + random()*45 + coalesce((t.items->>'fit')::int,0)*2 - case when t.bruised_until > now() then 15 else 0 end + public.town_mood_pow(public.town_mood(t)) + case when public.town_has(t,'athlete') then 5 else 0 end;
      r.energy := r.energy - 8; t.energy := t.energy - 8;
      if pa >= pb then t.fun := t.fun - 12; t.hygiene := t.hygiene - 15; t.bruised_until := now() + interval '2 hours'; r.fun := r.fun + 10;
      else r.fun := r.fun - 12; r.hygiene := r.hygiene - 15; r.bruised_until := now() + interval '2 hours'; t.fun := t.fun + 10; end if;
      -- 好麻吉之間是打打鬧鬧，感情反而更好
      perform public.town_bond(r.town_id, rid, t.id, case when bond >= 30 then 1 when r.place = 'arena' and t.place = 'arena' then -1 else -4 end);
      -- 擂台上的友誼賽：贏的人 €100，每人 30 分鐘最多領一次（不然兩個人互打就能無限印錢）
      if r.place = 'arena' and t.place = 'arena' then
        if pa >= pb and not (r.items->'cd'->>'afp' is not null and (r.items->'cd'->>'afp')::timestamptz > now() - interval '30 minutes') then
          r.money := r.money + 100; r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('afp', now()));
        elsif pa < pb and not (t.items->'cd'->>'afp' is not null and (t.items->'cd'->>'afp')::timestamptz > now() - interval '30 minutes') then
          t.money := t.money + 100; t.items := jsonb_set(t.items, '{cd}', coalesce(t.items->'cd','{}'::jsonb) || jsonb_build_object('afp', now()));
        end if;
      end if;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act,
        case when bond >= 30 then r.name || ' 和 ' || tn || ' 打打鬧鬧，' || case when pa >= pb then tn else r.name end || ' 被壓在地上求饒 😂'
             when pa >= pb then r.name || ' 把 ' || tn || ' 扁了一頓 👊 ' || tn || ' 鼻青臉腫'
             else r.name || ' 想扁 ' || tn || '，反被扁回去 🤕' end);
    elsif act = 'makeup' then
      if not near then raise exception '要和 % 面對面才能和好', tn; end if;
      if bond >= 0 then raise exception '你們本來就沒有不合'; end if;
      t.fun := t.fun + 5; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 10);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 向 ' || tn || ' 伸出手，兩人握手言和 🤝');
    elsif act in ('cowork','feast') then
      if not near or t.sleeping then raise exception '要和 % 面對面，而且他醒著', tn; end if;
      if act = 'cowork' then
        if r.place <> 'office' then raise exception '要一起在公司才能加班'; end if;
        if r.energy < 15 or t.energy < 15 then raise exception '有人太累了，加不了班'; end if;
        r.money := r.money + 2 * public.town_pay(public.town_wage(public.town_job_lv(coalesce((r.items->>'works')::int,0))), mo, public.town_has(r,'workaholic')) * public.town_work_pct(public.town_dc_get(r,'work')) / 100;
        t.money := t.money + 2 * public.town_pay(public.town_wage(public.town_job_lv(coalesce((t.items->>'works')::int,0))), public.town_mood(t), public.town_has(t,'workaholic')) * public.town_work_pct(public.town_dc_get(t,'work')) / 100;
        r := public.town_dc_inc(r,'work'); t := public.town_dc_inc(t,'work'); r.energy := r.energy - 15; t.energy := t.energy - 15; perform public.town_bond(r.town_id, rid, t.id, 3);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 和 ' || tn || ' 一起加班，薪水加倍 💼');
      else
        if r.place <> 'restaurant' then raise exception '要一起在餐廳才能請吃大餐'; end if;
        if r.money < 600 then raise exception '錢不夠，大餐要 €600'; end if;
        r.money := r.money - 600; r.items := jsonb_set(r.items, '{meals}', to_jsonb(coalesce((r.items->>'meals')::int,0) + 1)); r.hunger := r.hunger + 70*fm; t.hunger := t.hunger + 70; r.fun := r.fun + 15; t.fun := t.fun + 15; perform public.town_bond(r.town_id, rid, t.id, 4);
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
        if r.money < 200 then raise exception '錢不夠，外送要 €200'; end if;
        r.money := r.money - 200; t.hunger := t.hunger + 30; perform public.town_bond(r.town_id, rid, t.id, 3);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 幫 ' || tn || ' 叫了外送 🛵');
      else
        if coalesce((r.items->>'gift')::int,0) < 1 then raise exception '背包裡沒有禮物，去超市買'; end if;
        if r.money < 60 then raise exception '寄送要 €60 運費'; end if;
        r.items := jsonb_set(r.items, '{gift}', to_jsonb((r.items->>'gift')::int - 1)); r.money := r.money - 60; t.fun := t.fun + 20*gm; perform public.town_bond(r.town_id, rid, t.id, 5*gm); perform public.town_rg_add(t.id, rid, r.name);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 寄了一份禮物給 ' || tn || ' 📦');
      end if;
    else
      if r.place <> 'home:' || target then raise exception '要先走到他家'; end if;
      if act = 'gift' then
        if coalesce((r.items->>'gift')::int,0) < 1 then raise exception '背包裡沒有禮物，去超市買'; end if;
        r.items := jsonb_set(r.items, '{gift}', to_jsonb((r.items->>'gift')::int - 1)); t.fun := t.fun + 20*gm; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 5*gm); perform public.town_rg_add(t.id, rid, r.name);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || case when public.town_inside(t) then ' 送了一份禮物給 ' || tn || ' 🎁' else ' 在 ' || tn || ' 家門口放了一份禮物 🎁' end);
      elsif act = 'egg' then
        if public.town_inside(t) then t.hygiene := t.hygiene - 10; t.fun := t.fun - 5; end if; r.fun := r.fun + 8;
        perform public.town_bond(r.town_id, rid, t.id, -1);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口丟雞蛋 🥚' || case when public.town_inside(t) then '，' || tn || ' 一開門就被砸中' else '' end);
      elsif act = 'note' then
        note := trim(coalesce(note,''));
        if char_length(note) not between 1 and 30 or note ~ '[<>]' or public.has_bad_words(note) then raise exception '留言要 1～30 個字'; end if;
        perform public.town_bond(r.town_id, rid, t.id, 1);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口留言：「' || note || '」');
      else
        if not public.town_inside(t) then raise exception '% %。可以留言或放禮物', tn, case when t.place = 'home:' || target then '還在家門口，沒進屋' else '不在家，在' || public.town_place_name(t.place) end; end if;
        m := case when bond >= 30 then 1.3 else 1 end;
        if act = 'feed' then if r.money < 60 then raise exception '錢不夠買食材'; end if; t.hunger := t.hunger + 35*m; r.money := r.money - 60; r.fun := r.fun + 5; perform public.town_bond(r.town_id, rid, t.id, 4);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 煮了一餐給 ' || tn || ' 吃');
        elsif act = 'wash' then t.hygiene := t.hygiene + 45*m; perform public.town_bond(r.town_id, rid, t.id, 4);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 幫 ' || tn || ' 洗了澡');
        elsif act = 'wakeup' then if not t.sleeping then raise exception '% 醒著', tn; end if;
          -- 越累睡越沉：精力低的人比較叫不醒（25%～70%），叫不醒就繼續睡
          if random() < least(.7, .25 + (100 - t.energy) / 200) then
            insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 搖了 ' || tn || ' 半天，' || tn || ' 翻個身繼續睡');
          else
            t.sleeping := false; t.fun := t.fun - 5; perform public.town_bond(r.town_id, rid, t.id, -1);
            insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 把 ' || tn || ' 叫醒了');
          end if;
        elsif act = 'visit' then if t.sleeping then raise exception '% 在睡覺，不方便串門子', tn; end if; t.fun := t.fun + 15*m; r.fun := r.fun + 15*m; perform public.town_bond(r.town_id, rid, t.id, 3);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 去 ' || tn || ' 家串門子');
        else t.fun := t.fun - 8; r.fun := r.fun + 12; perform public.town_bond(r.town_id, rid, t.id, -2);
          insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id,rid,target,act, r.name || ' 在 ' || tn || ' 家門口放了一個臭屁');
        end if;
      end if;
    end if;
    update public.town_residents set money=greatest(0,t.money),hunger=least(100,t.hunger),energy=greatest(0,t.energy),bladder=t.bladder,hygiene=least(100,greatest(0,t.hygiene)),fun=least(100,greatest(0,t.fun)),sleeping=t.sleeping,bruised_until=t.bruised_until,items=t.items,updated_at=t.updated_at where id=t.id;
  else raise exception '不知道要做什麼';
  end if;
  r := public.town_wish_check(r);
  update public.town_residents set x=r.x,y=r.y,place=r.place,sleeping=r.sleeping,items=r.items,bruised_until=r.bruised_until,
    hunger=least(100,greatest(0,r.hunger)),energy=least(100,greatest(0,r.energy)),bladder=least(100,greatest(0,r.bladder)),
    hygiene=least(100,greatest(0,r.hygiene)),fun=least(100,greatest(0,r.fun)),money=greatest(0,r.money),updated_at=now(),seen_at=now() where id=rid;
  return public.town_state(r.town_id);
end $$;

revoke all on function public.town_tick(public.town_residents), public.town_pub(public.town_residents), public.town_auth(bigint,text), public.town_bond(text,bigint,bigint,int), public.town_tier(int), public.town_bond_get(bigint,bigint),
  public.town_code(int), public.town_door(int), public.town_street(int), public.town_place_name(text), public.town_name_ok(text) from public, anon, authenticated;
-- 選願望（只能選一次；跳過也算選了；三個里程碑都達成後可以換新願望）
create or replace function public.town_wish(rid bigint, pin text, k text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; cur text; m int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if k not in ('rich','pop','fight','food','work','skip') then raise exception '沒有這個願望'; end if;
  cur := r.items->'wish'->>'k'; m := coalesce((r.items->'wish'->>'m')::int,0);
  if cur is not null and cur <> 'none' and m < 3 then raise exception '你已經有願望了，先達成它'; end if;
  r.items := jsonb_set(r.items, '{wish}', case when k = 'skip' then jsonb_build_object('k','none','m',0) else jsonb_build_object('k',k,'m',0) end);
  r := public.town_wish_check(r);
  update public.town_residents set items = r.items, money = least(2147483647, r.money) where id = rid;
  return public.town_state(r.town_id);
end $$;
revoke all on function public.town_wish(bigint,text,text) from public;
grant execute on function public.town_wish(bigint,text,text) to anon, authenticated;
revoke all on function public.town_job_lv(int), public.town_job_name(int), public.town_wage(int), public.town_wish_ms(text), public.town_wish_titles(text),
  public.town_wish_val(public.town_residents,text), public.town_wish_check(public.town_residents) from public, anon, authenticated;

-- 選個性特質（挑 2 個，或跳過 = 空陣列；選過就不能改）
create or replace function public.town_traits(rid bigint, pin text, ks text[]) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if jsonb_typeof(r.items->'tr') = 'array' and jsonb_array_length(r.items->'tr') > 0 then raise exception '你已經選過特質了'; end if;
  ks := coalesce(ks, '{}');
  if cardinality(ks) not in (0,2) then raise exception '挑 2 個特質，或先跳過'; end if;
  if cardinality(ks) = 2 and (ks[1] = ks[2] or exists (select 1 from unnest(ks) k where k not in ('foodie','athlete','social','workaholic','nightowl','clean','lucky','romantic'))) then raise exception '沒有這個特質'; end if;
  update public.town_residents set items = jsonb_set(items, '{tr}', to_jsonb(ks)) where id = rid;
  return public.town_state(r.town_id);
end $$;
revoke all on function public.town_traits(bigint,text,text[]) from public;
grant execute on function public.town_traits(bigint,text,text[]) to anon, authenticated;
revoke all on function public.town_has(public.town_residents,text), public.town_mood(public.town_residents), public.town_mood_wage(text), public.town_mood_pow(text), public.town_mood_bond(text), public.town_pay(int,text,boolean) from public, anon, authenticated;

-- 一次性補算：舊居民的累計打工次數（從歷史事件）＋「元老居民」稱號。用 town_migrations 記錄，只做一次，不動錢和數值
create table if not exists public.town_migrations (id text primary key);
alter table public.town_migrations enable row level security;
revoke all on public.town_migrations from anon, authenticated;
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'career1') then
    update public.town_residents r set items = jsonb_set(jsonb_set(r.items, '{works}', to_jsonb((select count(*) from public.town_events e where e.actor = r.id and e.kind = 'work')::int)),
        '{titles}', coalesce(r.items->'titles','[]'::jsonb) || '["元老居民"]'::jsonb)
      where not (r.items ? 'works');
    insert into public.town_migrations(id) values ('career1');
  end if;
end $mig$;

-- 物價重整（2025 台灣物價）：一次性把舊居民的錢 ×10（以前一天的生活費約 €100，現在約 €600），並把還是 € 的小鎮貨幣改成 NT$
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'price2025') then
    update public.town_residents set money = least(2147483647, money::bigint * 10)::int;
    update public.town_duels set bet = least(2147483647, bet::bigint * 10)::int where status = 'open';
    update public.town_towns set currency = 'NT$' where currency = '€';
    insert into public.town_migrations(id) values ('price2025');
  end if;
end $mig$;
alter table public.town_residents alter column money set default 2000;
alter table public.town_towns alter column currency set default 'NT$';

revoke all on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text,text,text) from public;
revoke all on function public.town_device(text,text,bigint,text) from public;
grant execute on function public.town_device(text,text,bigint,text) to anon, authenticated;
revoke all on function public.town_obj_near(text,real,real,text) from public, anon, authenticated;
revoke all on function public.town_closed(text) from public, anon, authenticated;
grant execute on function public.town_state(text), public.town_create(text,text,text,jsonb), public.town_join(text,text,text,text,jsonb,int),
  public.town_login(bigint,text,jsonb), public.town_mayor(bigint,text,text,bigint), public.town_act(bigint,text,text,bigint,real,real,text,text,text) to anon, authenticated;

-- ── 小遊戲：廣場的街機（和莊家玩，結果由伺服器決定），以及朋友之間的猜拳戰帖 ──
-- 押注 €50～€1000，一天最多 40 局；整體期望值略低於 1，不會變成印鈔機
create or replace function public.town_card() returns int language sql volatile as $$ select (1 + floor(random()*4)::int) * 100 + 1 + floor(random()*13)::int $$;
-- 牌的編碼：花色*100 + 點數（花色 1=黑桃 2=紅心 3=方塊 4=梅花），點數 = 編碼 % 100。只有這一種格式；舊格式（只有點數 1～13）的進行中牌局在 town_game 開頭退回押注並作廢
create or replace function public.town_bj_total(cs jsonb) returns int language plpgsql immutable as $$
declare t int := 0; aces int := 0; c int;
begin
  for c in select (x)::int % 100 from jsonb_array_elements_text(cs) x loop
    if c = 1 then aces := aces + 1; t := t + 11; else t := t + least(c, 10); end if;
  end loop;
  while t > 21 and aces > 0 loop t := t - 10; aces := aces - 1; end loop;
  return t;
end $$;

create or replace function public.town_game(rid bigint, pin text, game text, bet int default 0, choice text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); n int; res json; win int := 0; house text; c int; c2 int; mult real; st jsonb; p int; d int; dc jsonb; d1 int; d2 int; d3 int; k int; pk int[]; dr int[]; sy int[]; ch text; m int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  -- 舊格式（沒有花色，點數 < 100）的進行中牌局：退回押注、清掉，請重開
  if game in ('hl_guess','bj_hit','bj_stand') and ((game = 'hl_guess' and (r.items->'hl'->>'card')::int < 100) or (game <> 'hl_guess' and (r.items->'bj'->'p'->>0)::int < 100)) then
    update public.town_residents set money = money + coalesce((r.items->(case when game = 'hl_guess' then 'hl' else 'bj' end)->>'bet')::int,0), items = items - (case when game = 'hl_guess' then 'hl' else 'bj' end) where id = rid;
    return json_build_object('error','舊版牌局已作廢，押注已退回，請重新開局');
  end if;
  -- 開新一局才要檢查押注與次數；21 點和比大小的後續動作不用
  if game in ('rps','hl_start','wheel','bj_start','dice','slots','bingo') then
    if bet is null or bet < 50 or bet > 1000 then raise exception '押注要在 €50～€1000 之間'; end if;
    if r.money < bet then raise exception '錢不夠'; end if;
    n := case when r.items->'games'->>'day' = day then coalesce((r.items->'games'->>'n')::int,0) else 0 end;
    if n >= 40 then raise exception '今天玩夠多了，明天再來（一天 40 局）'; end if;
    r.items := jsonb_set(r.items, '{games}', jsonb_build_object('day', day, 'n', n + 1));
    r.money := r.money - bet;
  end if;
  if game = 'rps' then
    if choice not in ('r','p','s') then raise exception '出剪刀、石頭或布'; end if;
    house := (array['r','p','s'])[1 + floor(random()*3)::int];
    if choice = house then win := floor(bet*.9); elsif (choice,house) in (('r','s'),('s','p'),('p','r')) then win := bet*2; end if;
    res := json_build_object('you',choice,'house',house,'win',win);
  elsif game = 'hl_start' then
    c := public.town_card(); r.items := jsonb_set(r.items, '{hl}', jsonb_build_object('bet',bet,'card',c));
    res := json_build_object('card',c);
  elsif game = 'hl_guess' then
    if r.items->'hl' is null then raise exception '先開一局'; end if;
    c := (r.items->'hl'->>'card')::int; bet := (r.items->'hl'->>'bet')::int; c2 := public.town_card();
    d1 := c % 100; d2 := c2 % 100; -- 比的是點數，花色只是好看
    -- 賠率看機率：猜中的牌越少賠越多（期望值 0.92）
    if coalesce(choice,'') not in ('hi','lo') then raise exception '猜更大或更小'; end if;
    p := case when choice = 'hi' then 13 - d1 else d1 - 1 end;
    if p > 0 and ((choice = 'hi' and d2 > d1) or (choice = 'lo' and d2 < d1)) then win := floor(bet * .92 * 13 / p); end if;
    r.items := r.items - 'hl';
    res := json_build_object('card',c,'next',c2,'win',win);
  elsif game = 'wheel' then
    -- 10 格：銘謝惠顧 ×6、×0.5、×1、×2、×5
    c := floor(random()*10)::int; mult := (array[0,0,0,0,0,0,.5,1,2,5])[c+1]; win := floor(bet*mult);
    res := json_build_object('slot',c,'mult',mult,'win',win);
  elsif game = 'bj_start' then
    st := jsonb_build_object('bet',bet,'p',jsonb_build_array(public.town_card(),public.town_card()),'d',jsonb_build_array(public.town_card()));
    if public.town_bj_total(st->'p') = 21 then
      -- 開局就 21 點：莊家補牌比一比
      dc := st->'d'; while public.town_bj_total(dc) < 17 loop dc := dc || to_jsonb(public.town_card()); end loop;
      win := case when public.town_bj_total(dc) = 21 and jsonb_array_length(dc) = 2 then bet else floor(bet*2.5) end;
      res := json_build_object('p',st->'p','d',dc,'done',true,'win',win,'bj',true);
    else r.items := jsonb_set(r.items, '{bj}', st); res := json_build_object('p',st->'p','d',st->'d','done',false); end if;
  elsif game in ('bj_hit','bj_stand') then
    st := r.items->'bj'; if st is null then raise exception '先開一局'; end if; bet := (st->>'bet')::int;
    if game = 'bj_hit' then
      st := jsonb_set(st, '{p}', (st->'p') || to_jsonb(public.town_card())); p := public.town_bj_total(st->'p');
      if p > 21 then r.items := r.items - 'bj'; res := json_build_object('p',st->'p','d',st->'d','done',true,'win',0,'bust',true);
      else r.items := jsonb_set(r.items, '{bj}', st); res := json_build_object('p',st->'p','d',st->'d','done',false); end if;
    else
      dc := st->'d'; while public.town_bj_total(dc) < 17 loop dc := dc || to_jsonb(public.town_card()); end loop;
      p := public.town_bj_total(st->'p'); d := public.town_bj_total(dc);
      win := case when d > 21 or p > d then bet*2 when p = d then bet else 0 end;
      r.items := r.items - 'bj'; res := json_build_object('p',st->'p','d',dc,'done',true,'win',win);
    end if;
  elsif game = 'dice' then
    -- 三顆骰：大（11～17）／小（4～10）三顆一樣莊家通吃，賠 1 倍（期望 0.972）；押單一點數：出現幾顆賠幾倍（期望 0.921）
    if coalesce(choice,'') not in ('big','small','1','2','3','4','5','6') then raise exception '押大、小或一個點數'; end if;
    d1 := 1 + floor(random()*6)::int; d2 := 1 + floor(random()*6)::int; d3 := 1 + floor(random()*6)::int; p := d1 + d2 + d3;
    if choice = 'big' then if p >= 11 and not (d1 = d2 and d2 = d3) then win := bet*2; end if;
    elsif choice = 'small' then if p <= 10 and not (d1 = d2 and d2 = d3) then win := bet*2; end if;
    else k := (d1 = choice::int)::int + (d2 = choice::int)::int + (d3 = choice::int)::int; if k > 0 then win := bet * (k + 1); end if; end if;
    res := json_build_object('dice',json_build_array(d1,d2,d3),'win',win);
  elsif game = 'slots' then
    -- 三輪各 6 種圖案（0=7 1=鈴 2=星 3=櫻桃 4=檸檬 5=西瓜）：三個一樣 ×40／20／12／10／8／8，剛好兩個一樣 ×1.1（期望 0.912）
    sy := array[floor(random()*6)::int, floor(random()*6)::int, floor(random()*6)::int];
    if sy[1] = sy[2] and sy[2] = sy[3] then win := floor(bet * (array[40,20,12,10,8,8])[sy[1]+1]);
    elsif sy[1] = sy[2] or sy[2] = sy[3] or sy[1] = sy[3] then win := floor(bet * 1.1); end if;
    res := json_build_object('reels',to_json(sy),'win',win);
  elsif game = 'bingo' then
    -- 賓果：1～10 自己選 3 個，開 5 個號碼；中 2 個 ×1.4、中 3 個 ×4（期望 0.917）
    begin pk := string_to_array(choice, ',')::int[]; exception when others then raise exception '選 3 個號碼'; end;
    if coalesce(array_length(pk,1),0) <> 3 or (select count(distinct x) from unnest(pk) x) <> 3 or exists (select 1 from unnest(pk) x where x < 1 or x > 10) then raise exception '選 3 個不同的號碼（1～10）'; end if;
    select array_agg(x) into dr from (select x from generate_series(1,10) x order by random() limit 5) q;
    select count(*) into k from unnest(pk) x where x = any(dr);
    win := case k when 3 then bet*4 when 2 then floor(bet*1.4) else 0 end;
    res := json_build_object('pick',to_json(pk),'draw',to_json(dr),'hit',k,'win',win);
  else raise exception '沒有這個遊戲'; end if;
  r.money := r.money + win; r.fun := least(100, r.fun + 3);
  -- 只有淨賺 ≥100 才公告（淨賺 = 拿回的錢 − 押注），平手不公告
  if win - bet >= 1000 then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 在街機淨賺了 €' || (win - bet) || ' 🕹️'); end if;
  update public.town_residents set money = r.money, fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('game', res, 'money', r.money);
end $$;

-- 單機遊戲（打地鼠 whack、記憶翻牌 memory）：前端自己玩，伺服器只收個人最佳分數並檢查上限；不給錢，每 5 分鐘最多一次心情 +2
create or replace function public.town_score(rid bigint, pin text, game text, score int) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; cap int; best int; gain int := 0; cd timestamptz;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  if r.place <> 'plaza' then raise exception '街機在小豬廣場，走過去再玩'; end if;
  cap := case game when 'whack' then 40 when 'memory' then 100 else null end;
  if cap is null then raise exception '沒有這個遊戲'; end if;
  if score is null or score < 0 or score > cap then raise exception '分數不合理'; end if;
  best := coalesce((r.items->'sp'->>game)::int, 0);
  if score > best then best := score; r.items := jsonb_set(r.items, '{sp}', coalesce(r.items->'sp','{}'::jsonb) || jsonb_build_object(game, best)); end if;
  cd := (r.items->'cd'->>'sp')::timestamptz;
  if cd is null or cd < now() - interval '5 minutes' then gain := 2; r.fun := least(100, r.fun + 2); r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('sp', now())); end if;
  update public.town_residents set fun = r.fun, items = r.items, seen_at = now() where id = rid;
  return json_build_object('best', best, 'gain', gain);
end $$;

-- 猜拳戰帖：發起的人先押錢並出拳，對方應戰時出拳立刻比；24 小時沒回就退錢
create table if not exists public.town_duels (
  id bigint generated always as identity primary key,
  town_id text not null references public.town_towns(id) on delete cascade,
  a bigint not null references public.town_residents(id) on delete cascade,
  b bigint not null references public.town_residents(id) on delete cascade,
  bet int not null, a_move text not null, status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.town_duels enable row level security;
revoke all on public.town_duels from anon, authenticated;

create or replace function public.town_duel(rid bigint, pin text, act text, target bigint default null, bet int default 0, choice text default null, duel bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; du public.town_duels; nm text := '{"r":"石頭","p":"布","s":"剪刀"}';
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if act <> 'decline' and public.town_is_off(r.town_id, 'arcade') then raise exception '這個小鎮沒有開街機'; end if;
  -- 過期的戰帖退錢
  for du in select * from public.town_duels where town_id = r.town_id and status = 'open' and created_at < now() - interval '24 hours' loop
    update public.town_residents set money = money + du.bet where id = du.a; update public.town_duels set status = 'expired' where id = du.id;
  end loop;
  if act = 'challenge' then
    if choice not in ('r','p','s') then raise exception '出剪刀、石頭或布'; end if;
    if bet is null or bet < 50 or bet > 2000 then raise exception '戰帖押注要在 €50～€2000 之間'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id;
    if not found or t.id = rid then raise exception '要選一位鄰居'; end if;
    if r.money < bet then raise exception '錢不夠'; end if;
    if exists (select 1 from public.town_duels where a = rid and b = t.id and status = 'open') then raise exception '你已經對他下過戰帖了，等他回應'; end if;
    update public.town_residents set money = money - bet, seen_at = now() where id = rid;
    insert into public.town_duels(town_id,a,b,bet,a_move) values (r.town_id, rid, t.id, bet, choice);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, t.id, 'duel', r.name || ' 向 ' || t.name || ' 下戰帖：猜拳賭 €' || bet || ' ✊');
  elsif act in ('accept','decline') then
    select * into du from public.town_duels where id = duel and b = rid and status = 'open' for update;
    if not found then raise exception '這張戰帖已經結束了'; end if;
    select * into t from public.town_residents where id = du.a;
    if act = 'decline' then
      update public.town_residents set money = money + du.bet where id = du.a; update public.town_duels set status = 'declined' where id = du.id;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, du.a, 'duel', r.name || ' 拒絕了 ' || t.name || ' 的戰帖');
    else
      if choice not in ('r','p','s') then raise exception '出剪刀、石頭或布'; end if;
      if r.money < du.bet then raise exception '錢不夠應戰（要 €%）', du.bet; end if;
      update public.town_residents set money = money - du.bet where id = rid;
      if choice = du.a_move then
        update public.town_residents set money = money + du.bet where id in (rid, du.a);
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, du.a, 'duel', r.name || ' 和 ' || t.name || ' 猜拳都出' || (nm::json->>choice) || '，平手退錢');
      elsif (choice, du.a_move) in (('r','s'),('s','p'),('p','r')) then
        update public.town_residents set money = money + du.bet*2 where id = rid;
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, du.a, 'duel', r.name || ' 出' || (nm::json->>choice) || '贏了 ' || t.name || ' 的' || (nm::json->>du.a_move) || '，拿走 €' || du.bet*2 || ' 🏆');
      else
        update public.town_residents set money = money + du.bet*2 where id = du.a;
        insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, du.a, rid, 'duel', t.name || ' 出' || (nm::json->>du.a_move) || '贏了 ' || r.name || ' 的' || (nm::json->>choice) || '，拿走 €' || du.bet*2 || ' 🏆');
      end if;
      update public.town_duels set status = 'done' where id = du.id;
    end if;
  else raise exception '不知道要做什麼'; end if;
  return public.town_state(r.town_id);
end $$;

revoke all on function public.town_card(), public.town_bj_total(jsonb) from public, anon, authenticated;
revoke all on function public.town_score(bigint,text,text,int) from public;
grant execute on function public.town_score(bigint,text,text,int) to anon, authenticated;
revoke all on function public.town_game(bigint,text,text,int,text), public.town_duel(bigint,text,text,bigint,int,text,bigint) from public;
grant execute on function public.town_game(bigint,text,text,int,text), public.town_duel(bigint,text,text,bigint,int,text,bigint) to anon, authenticated;

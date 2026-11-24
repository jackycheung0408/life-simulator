-- 小豬鎮：長期目標批 1「成就系統」＋共用掛鉤 town_goal_hook（圖鑑、賽季、主線之後共用）。要在 town.sql、town_fac.sql、town_casino4.sql 之後套用，可重複執行。
-- 設計：計數器不放 items（避免和動作函式的 r 整列回寫互蓋），放獨立表 town_ach_c；解鎖與領取進度放 town_ach_u。
-- 1) 計數來源：a) 資料表 town_events 的 AFTER INSERT 觸發器（town_goal_ev，依 kind／msg 對應，整段包 exception 絕不影響遊戲）；
--    b) 就地補丁 town_act／town_fac 結尾（town_goal_hook：睡覺、洗澡、坐下、夜間上線）；c) 就地補丁 town_casino（town_goal_casino：局數、款式、單次拿回、累計下注）。
-- 2) 80 個成就定義全在 town_ach_def()（加成就只改這個函式）。大部分直接讀 items 既有欄位（讀取層），不搬資料。
-- 3) RPC town_ach(rid,pin,op,id)：view（算新解鎖並回清單）／claim（領下一個可領階）／seen（清 toast 清單）。
--    獎勵只有零食與稱號：多階成就 銅=1 包零食、銀=稱號「名稱・銀」、金=稱號「名稱・金」；單階成就 = 稱號＋零食（背包滿就只給稱號）。不給錢、不給能力、不給精力、不發造型（造型留待圖鑑批）。
--    領取是獨立動作（鎖列後才改 items），所有計數都不給錢，所以沒有可重複觸發的收益；計數上限 9999（下注累計 100 億）。
-- 4) 重套 town.sql／town_fac.sql／town_casino*.sql 會還原補丁，要再套一次本檔（找不到錨點整檔失敗；已補過就略過）。
-- 在 Supabase，revoke ... from public 擋不住 anon／authenticated，要連 anon、authenticated 一起收回。

create table if not exists public.town_ach_c (
  rid bigint not null references public.town_residents(id) on delete cascade,
  k text not null,
  n bigint not null default 0,
  primary key (rid, k)
);
alter table public.town_ach_c enable row level security;
revoke all on public.town_ach_c from public, anon, authenticated;

create table if not exists public.town_ach_u (
  rid bigint primary key references public.town_residents(id) on delete cascade,
  u jsonb not null default '{}'::jsonb,   -- {成就id: 已解鎖階數}
  k jsonb not null default '{}'::jsonb,   -- {成就id: 已領階數}
  nw jsonb not null default '[]'::jsonb   -- 待 toast 的 [[id,階]]
);
alter table public.town_ach_u enable row level security;
revoke all on public.town_ach_u from public, anon, authenticated;

-- 計數：upsert，上限 p_cap
create or replace function public.town_goal_bump(p_rid bigint, p_k text, p_n bigint default 1, p_cap bigint default 9999) returns void language sql security definer set search_path = public as $$
  insert into public.town_ach_c(rid, k, n) values (p_rid, p_k, least(p_cap, greatest(0, p_n)))
  on conflict (rid, k) do update set n = least(p_cap, public.town_ach_c.n + excluded.n);
$$;
-- 每台灣日只計一次（用 k@日期 當標記列）
create or replace function public.town_goal_bump_day(p_rid bigint, p_k text) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.town_ach_c(rid, k, n) values (p_rid, p_k || '@' || to_char(now() at time zone 'Asia/Taipei','YYYYMMDD'), 1) on conflict do nothing;
  if found then perform public.town_goal_bump(p_rid, p_k); end if;
end $$;
revoke all on function public.town_goal_bump(bigint,text,bigint,bigint), public.town_goal_bump_day(bigint,text) from public, anon, authenticated;

-- 共用掛鉤（動作函式結尾呼叫；圖鑑、賽季、主線之後也從這裡進）。src = 'act'／'fac'；絕不丟錯、不改 r
create or replace function public.town_goal_hook(r public.town_residents, src text, act text) returns public.town_residents language plpgsql security definer set search_path = public as $$
declare hr int := extract(hour from now() at time zone 'Asia/Taipei');
begin
  begin
    if src = 'act' and act in ('sleep','qsleep') then perform public.town_goal_bump(r.id, 'slp');
    elsif src = 'act' and act = 'shower' then perform public.town_goal_bump(r.id, 'shw');
    elsif src = 'fac' and act = 'up' then perform public.town_goal_bump(r.id, 'sit');
    end if;
    if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;
  exception when others then null;
  end;
  return r;
end $$;
revoke all on function public.town_goal_hook(public.town_residents,text,text) from public, anon, authenticated;

-- 賭場掛鉤：局數、各款局數、款式、單次拿回門檻、累計下注
create or replace function public.town_goal_casino(p_rid bigint, p_game text, p_round boolean, p_delta bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  begin
    if p_round then
      perform public.town_goal_bump(p_rid, 'cp'); perform public.town_goal_bump(p_rid, 'cp_' || p_game);
      insert into public.town_ach_c(rid, k, n) values (p_rid, 'cg_' || p_game, 1) on conflict do nothing;
    end if;
    if p_delta > 0 then perform public.town_goal_bump(p_rid, 'cwin');
      if p_delta >= 5000 then perform public.town_goal_bump(p_rid, 'cw5k'); end if;
      if p_delta >= 100000 then perform public.town_goal_bump(p_rid, 'cw100k'); end if;
    elsif p_delta < 0 then perform public.town_goal_bump(p_rid, 'closs', -p_delta, 10000000000);
    end if;
  exception when others then null;
  end;
end $$;
revoke all on function public.town_goal_casino(bigint,text,boolean,bigint) from public, anon, authenticated;

-- 事件觸發器：依 kind／msg 對應計數（actor 為做事的人；pk、joint 雙方都算）
create or replace function public.town_goal_ev() returns trigger language plpgsql security definer set search_path = public as $$
declare kx text;
begin
  begin
    if new.actor is null then return new; end if;
    kx := case
      when new.kind = 'zombie' and new.msg like '%打倒%' then 'zk'
      when new.kind = 'jail' and (new.msg like '%關進監獄%' or new.msg like '%抓走%') then 'jail'
      when new.kind = 'escape' then 'esc'
      when new.kind = 'parole' then 'par'
      when new.kind = 'jaillabor' then 'jlb'
      when new.kind in ('visitjail','visithosp') then 'vis'
      when new.kind = 'hospital' then 'hsp'
      when new.kind = 'report' then 'rpt'
      when new.kind = 'faint' then 'flt'
      when new.kind = 'luck' then 'luck'
      when new.kind = 'gift' then 'gft'
      when new.kind = 'thank' then 'thk'
      when new.kind = 'makeup' then 'mku'
      when new.kind = 'forgive' then 'frg'
      when new.kind = 'visit' then 'vst'
      when new.kind = 'persona' then 'psn'
      when new.kind = 'pk' then 'pk'
      when new.kind = 'joint' then 'jnt'
      when new.kind = 'meet' and new.msg like '%成團！%' then 'host'
      when new.kind = 'rent' and new.msg like '%財產稅%' then 'tax'
      else null end;
    if kx is not null then
      perform public.town_goal_bump(new.actor, kx);
      if kx in ('pk','jnt') and new.target is not null and new.target <> new.actor then perform public.town_goal_bump(new.target, kx); end if;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
revoke all on function public.town_goal_ev() from public, anon, authenticated;
drop trigger if exists town_goal_ev_t on public.town_events;
create trigger town_goal_ev_t after insert on public.town_events for each row execute function public.town_goal_ev();

-- 80 個成就。src：c:計數器、i:items 路徑（數字；日期字串算 1）、@特殊讀取。th = 各階門檻（1～3 階）
create or replace function public.town_ach_def() returns jsonb language sql immutable as $$
  select jsonb_agg(jsonb_build_object('id', id, 'cat', cat, 'nm', nm, 'src', src, 'th', to_jsonb(th)) order by id) from (values
  (1,'life','打工達人','i:works',array[10,50,250]),
  (2,'life','咖啡師傅','i:jw.cafe',array[15,40,140]),
  (3,'life','服務生','i:jw.rest',array[15,40,140]),
  (4,'life','健身教練','i:jw.gym',array[15,40,140]),
  (5,'life','店員','i:jw.shop',array[15,40,140]),
  (6,'life','拉菲助理','i:jw.rafi',array[15,40,140]),
  (7,'life','美食家','i:meals',array[20,100,500]),
  (8,'life','常客','@fqmax',array[5,15,40]),
  (9,'life','老鄰居','i:al.n',array[3,30,100]),
  (10,'life','全勤','i:al.s',array[3,14,60]),
  (11,'life','願望家','i:wish.m',array[1,2,3]),
  (12,'life','睡飽飽','c:slp',array[10,50,200]),
  (13,'life','乾淨豬','c:shw',array[10,60,300]),
  (14,'life','坐一下','c:sit',array[5,30,100]),
  (15,'life','跨行達人','@jwkinds',array[2,4,5]),
  (16,'life','升官','@rank',array[2,5,8]),
  (17,'soc','交朋友','@b10',array[1,3,6]),
  (18,'soc','麻吉','@b30',array[1,2,4]),
  (19,'soc','生死之交','@b60',array[1]),
  (20,'soc','送禮王','c:gft',array[5,30,100]),
  (21,'soc','道謝','c:thk',array[5,30,100]),
  (22,'soc','和好','c:mku',array[1,5,15]),
  (23,'soc','原諒','c:frg',array[1,5,15]),
  (24,'soc','揪團新手','i:mt.n',array[1,10,25]),
  (25,'soc','團長','c:host',array[1,5,20]),
  (26,'soc','一起做','c:jnt',array[5,30,100]),
  (27,'soc','PK 挑戰者','c:pk',array[1,10,40]),
  (28,'soc','人設','c:psn',array[1]),
  (29,'soc','串門子','c:vst',array[5,30,100]),
  (30,'soc','探望','c:vis',array[1,5,20]),
  (31,'eco','小富','@money',array[50000,500000,3000000]),
  (32,'eco','納稅人','c:tax',array[1,10,60]),
  (33,'eco','投資新手','@stkn',array[1,3,6]),
  (34,'eco','股票大戶','@stkq',array[10,100,1000]),
  (35,'eco','房東','@hl',array[2,3,4]),
  (36,'eco','傢俱控','@furn',array[4,8,13]),
  (37,'eco','遊艇船長','i:lx.yacht',array[1]),
  (38,'eco','莊園主人','i:lx.estate',array[1]),
  (39,'eco','慈善','i:chr',array[10000,100000,1000000]),
  (40,'eco','駕駛','@lic',array[1,2]),
  (41,'eco','上險','@ins',array[1,2]),
  (42,'eco','車主','@vehn',array[1,2,3]),
  (43,'adv','獵豬人','c:zk',array[10,60,250]),
  (44,'adv','事故倖存','i:ac.n',array[1,5,20]),
  (45,'adv','牢獄體驗','c:jail',array[1,3,10]),
  (46,'adv','越獄','c:esc',array[1]),
  (47,'adv','假釋','c:par',array[1,3,10]),
  (48,'adv','勞動改造','c:jlb',array[1,10,50]),
  (49,'adv','看診','c:hsp',array[1,5,20]),
  (50,'adv','熱心市民','c:rpt',array[1,3,10]),
  (51,'adv','小鎮奇遇','c:luck',array[20,150,600]),
  (52,'adv','倒下又起','c:flt',array[1,3,10]),
  (53,'adv','能力者','@at',array[10,20,32]),
  (54,'adv','單項專精','@atmax',array[3,5,8]),
  (55,'adv','常客遍地','@fqn5',array[3,6,10]),
  (56,'adv','夜貓','c:nite',array[5,30,100]),
  (57,'cas','初入賭場','c:cp',array[1,10,50]),
  (58,'cas','百發百中','c:cp',array[100,500,2000]),
  (59,'cas','全場通','@cgn',array[5,10,15]),
  (60,'cas','賭神之路','c:cw5k',array[1,5,20]),
  (61,'cas','大贏家','c:cw100k',array[1]),
  (62,'cas','地雷客','c:cp_mn_start',array[5,30,100]),
  (63,'cas','賽豬','c:cp_pigrace',array[5,30,100]),
  (64,'cas','百家樂','c:cp_bacc',array[10,50,200]),
  (65,'cas','出手闊綽','c:closs',array[100000,1000000,10000000]),
  (66,'cas','刮刮樂','c:cp_scratch',array[5,30,100]),
  (67,'cas','老虎機','c:cp_slots',array[10,50,200]),
  (68,'cas','贏面','c:cwin',array[20,100,500]),
  (69,'col','扭蛋迷','@clc',array[6,12,24]),
  (70,'col','卡牌手','@clk',array[5,10,20]),
  (71,'col','小玩偶','@clp',array[1,3,6]),
  (72,'col','紀念品','@clm',array[1,3,6]),
  (73,'col','時尚','@w',array[3,6,12]),
  (74,'col','稱號收藏','@ttl',array[5,15,30]),
  (75,'col','布置達人','@fu',array[3,6,10]),
  (76,'col','認識鄰居','@bany',array[1,3,8]),
  (77,'col','全能','@atmin',array[1,2,4]),
  (78,'col','成就新手','@achsum',array[30]),
  (79,'col','成就達人','@achsum',array[80]),
  (80,'col','成就大師','@achsum',array[150])
  ) v(id, cat, nm, src, th)
$$;

-- 讀取一個成就的目前數值
create or replace function public.town_ach_val(r public.town_residents, src text, cnt jsonb, u jsonb) returns bigint language plpgsql stable security definer set search_path = public as $$
declare it jsonb := coalesce(r.items, '{}'::jsonb); v text; xv bigint; nm text;
begin
  if src like 'c:%' then return coalesce((cnt->>substr(src, 3))::bigint, 0); end if;
  if src like 'i:%' then
    v := it #>> string_to_array(substr(src, 3), '.');
    return case when v is null or v = '' then 0 when v ~ '^-?[0-9]+$' then v::bigint else 1 end;
  end if;
  nm := substr(src, 2);
  if nm = 'fqmax' then select coalesce(max(value::bigint), 0) into xv from jsonb_each_text(coalesce(it->'fq', '{}')) where value ~ '^[0-9]+$';
  elsif nm = 'fqn5' then select count(*) into xv from jsonb_each_text(coalesce(it->'fq', '{}')) where value ~ '^[0-9]+$' and value::bigint >= 5;
  elsif nm = 'jwkinds' then select count(*) into xv from jsonb_each_text(coalesce(it->'jw', '{}')) where value ~ '^[0-9]+$' and value::bigint > 0;
  elsif nm = 'rank' then xv := public.town_job_lv(coalesce((it->>'works')::int, 0));
  elsif nm = 'b10' then select count(*) into xv from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score >= 10;
  elsif nm = 'b30' then select count(*) into xv from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score >= 30;
  elsif nm = 'b60' then select count(*) into xv from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score >= 60;
  elsif nm = 'bany' then select count(*) into xv from public.town_bonds b where (b.a = r.id or b.b = r.id) and b.score <> 0;
  elsif nm = 'money' then xv := coalesce(r.money, 0) + coalesce((it->'cas'->>'ch')::bigint, 0);
  elsif nm = 'hl' then xv := greatest(1, coalesce((it->>'hl')::int, 1));
  elsif nm = 'furn' then xv := jsonb_array_length(case when jsonb_typeof(it->'f') = 'array' then it->'f' else '[]'::jsonb end);
  elsif nm = 'fu' then select count(*) into xv from jsonb_array_elements_text(case when jsonb_typeof(it->'fu') = 'array' then it->'fu' else '[]'::jsonb end) e where e <> '';
  elsif nm = 'w' then xv := jsonb_array_length(case when jsonb_typeof(it->'w') = 'array' then it->'w' else '[]'::jsonb end);
  elsif nm = 'ttl' then xv := jsonb_array_length(case when jsonb_typeof(it->'titles') = 'array' then it->'titles' else '[]'::jsonb end);
  elsif nm = 'lic' then select count(*) into xv from jsonb_object_keys(case when jsonb_typeof(it->'lic') = 'object' then it->'lic' else '{}'::jsonb end);
  elsif nm = 'ins' then select count(*) into xv from jsonb_object_keys(case when jsonb_typeof(it->'ins') = 'object' then it->'ins' else '{}'::jsonb end);
  elsif nm = 'vehn' then xv := jsonb_array_length(case when jsonb_typeof(it->'veh'->'own') = 'array' then it->'veh'->'own' else '[]'::jsonb end);
  elsif nm = 'stkn' then select count(*) into xv from jsonb_object_keys(case when jsonb_typeof(it->'st'->'h') = 'object' then it->'st'->'h' else '{}'::jsonb end);
  elsif nm = 'stkq' then select coalesce(sum((e.value->>'q')::bigint), 0) into xv from jsonb_each(case when jsonb_typeof(it->'st'->'h') = 'object' then it->'st'->'h' else '{}'::jsonb end) e where (e.value->>'q') ~ '^[0-9]+$';
  elsif nm = 'clc' then select count(*) into xv from jsonb_object_keys(coalesce(it->'cl', '{}')) k where k ~ '^c[0-9]{2}$';
  elsif nm = 'clk' then select count(*) into xv from jsonb_object_keys(coalesce(it->'cl', '{}')) k where k ~ '^k[0-9]{2}$';
  elsif nm = 'clp' then select count(*) into xv from jsonb_object_keys(coalesce(it->'cl', '{}')) k where k ~ '^p[0-9]{2}$';
  elsif nm = 'clm' then select count(*) into xv from jsonb_object_keys(coalesce(it->'cl', '{}')) k where k !~ '^[ckp][0-9]{2}$';
  elsif nm = 'at' then xv := (select coalesce(sum(greatest(0, least(8, coalesce((it->'at'->>k)::int, 0)))), 0) from unnest(array['st','ag','ch','iq','lk']) k);
  elsif nm = 'atmax' then xv := (select coalesce(max(greatest(0, least(8, coalesce((it->'at'->>k)::int, 0)))), 0) from unnest(array['st','ag','ch','iq','lk']) k);
  elsif nm = 'atmin' then xv := (select coalesce(min(greatest(0, least(8, coalesce((it->'at'->>k)::int, 0)))), 0) from unnest(array['st','ag','ch','iq','lk']) k);
  elsif nm = 'cgn' then select count(*) into xv from jsonb_object_keys(cnt) k where k like 'cg\_%';
  elsif nm = 'achsum' then select coalesce(sum(value::int), 0) into xv from jsonb_each_text(u) where key::int < 78;
  else xv := 0; end if;
  return coalesce(xv, 0);
exception when others then return 0;
end $$;
revoke all on function public.town_ach_val(public.town_residents,text,jsonb,jsonb) from public, anon, authenticated;

-- 算新解鎖（不發獎勵）。回傳新增階數；新達成的放進 nw 給前端 toast，並寫一則 ach 動態（每次最多列 3 個名稱）
create or replace function public.town_ach_check(r public.town_residents) returns int language plpgsql security definer set search_path = public as $$
declare cnt jsonb; cu jsonb; cnw jsonb; a jsonb; v bigint; t int; o int; n int := 0; nms text[] := '{}'; ths jsonb;
begin
  insert into public.town_ach_u(rid) values (r.id) on conflict do nothing;
  select coalesce(jsonb_object_agg(c.k, c.n), '{}'::jsonb) into cnt from public.town_ach_c c where c.rid = r.id;
  select z.u, z.nw into cu, cnw from public.town_ach_u z where z.rid = r.id;
  for a in select e from jsonb_array_elements(public.town_ach_def()) e loop
    v := public.town_ach_val(r, a->>'src', cnt, cu);
    ths := a->'th';
    select count(*) into t from jsonb_array_elements_text(ths) q where q::bigint <= v;
    o := coalesce((cu->>(a->>'id'))::int, 0);
    if t > o then
      cu := jsonb_set(cu, array[a->>'id'], to_jsonb(t));
      for i in o + 1 .. t loop
        if jsonb_array_length(cnw) < 60 then cnw := cnw || jsonb_build_array(jsonb_build_array((a->>'id')::int, i)); end if;
      end loop;
      n := n + (t - o);
      if cardinality(nms) < 3 then nms := nms || (a->>'nm'); end if;
    end if;
  end loop;
  if n > 0 then
    update public.town_ach_u z set u = cu, nw = cnw where z.rid = r.id;
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, r.id, r.id, 'ach', left(r.name || ' 達成 ' || n || ' 個成就階段（' || array_to_string(nms, '、') || case when n > 3 then '…' else '' end || '）', 120));
  end if;
  return n;
end $$;
revoke all on function public.town_ach_check(public.town_residents) from public, anon, authenticated;

-- RPC：view／claim／seen
create or replace function public.town_ach(rid bigint, pin text, op text default 'view', id int default null) returns json language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; u jsonb; kj jsonb; nw jsonb; cnt jsonb; a jsonb; v bigint; lst jsonb := '[]'::jsonb; nt int; kk int; uu int; ttl jsonb; ti text; sn int; tot int := 0; got int := 0; gv text; msg text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op = 'claim' then
    select * into r from public.town_residents p where p.id = r.id for update;
    perform public.town_ach_check(r);
    select x.u, x.k into u, kj from public.town_ach_u x where x.rid = r.id for update;
    select e into a from jsonb_array_elements(public.town_ach_def()) e where (e->>'id')::int = id;
    if a is null then raise exception '沒有這個成就'; end if;
    nt := jsonb_array_length(a->'th'); kk := coalesce((kj->>id::text)::int, 0); uu := coalesce((u->>id::text)::int, 0);
    if uu <= kk then raise exception '目前沒有可領的獎勵'; end if;
    kk := kk + 1;
    ttl := coalesce(r.items->'titles', '[]'::jsonb); sn := coalesce((r.items->>'snack')::int, 0);
    if nt = 1 then
      ti := a->>'nm'; gv := '稱號「' || ti || '」';
      if sn < public.town_bag_max(r) then r.items := jsonb_set(r.items, '{snack}', to_jsonb(sn + 1)); gv := gv || '、零食 1 包'; end if;
    elsif kk = 1 then
      if sn >= public.town_bag_max(r) then raise exception '背包滿了，先吃掉零食再領'; end if;
      r.items := jsonb_set(r.items, '{snack}', to_jsonb(sn + 1)); gv := '零食 1 包';
    else
      ti := (a->>'nm') || case when kk = 2 then '・銀' else '・金' end; gv := '稱號「' || ti || '」';
    end if;
    if ti is not null and not (ttl ? ti) then r.items := jsonb_set(r.items, '{titles}', ttl || to_jsonb(ti)); end if;
    update public.town_residents p set items = r.items where p.id = r.id;
    update public.town_ach_u x set k = jsonb_set(x.k, array[id::text], to_jsonb(kk)) where x.rid = r.id;
    return json_build_object('ok', true, 'got', gv, 'tier', kk, 'id', id);
  end if;
  perform public.town_ach_check(r);
  if op = 'seen' then update public.town_ach_u x set nw = '[]'::jsonb where x.rid = r.id; end if;
  select x.u, x.k, x.nw into u, kj, nw from public.town_ach_u x where x.rid = r.id;
  select coalesce(jsonb_object_agg(c.k, c.n), '{}'::jsonb) into cnt from public.town_ach_c c where c.rid = r.id;
  for a in select e from jsonb_array_elements(public.town_ach_def()) e loop
    v := public.town_ach_val(r, a->>'src', cnt, u);
    lst := lst || jsonb_build_array(jsonb_build_object('id', (a->>'id')::int, 'cat', a->>'cat', 'nm', a->>'nm', 'th', a->'th', 'v', v,
      'u', coalesce((u->>(a->>'id'))::int, 0), 'k', coalesce((kj->>(a->>'id'))::int, 0)));
    tot := tot + jsonb_array_length(a->'th'); got := got + coalesce((u->>(a->>'id'))::int, 0);
  end loop;
  return json_build_object('ok', true, 'list', lst, 'new', case when op = 'seen' then '[]'::jsonb else nw end, 'total', tot, 'got', got);
end $$;
revoke all on function public.town_ach(bigint,text,text,int) from public;
grant execute on function public.town_ach(bigint,text,text,int) to anon, authenticated;

-- 就地補丁：town_act／town_fac 結尾掛 town_goal_hook；town_casino 掛 town_goal_casino。找不到錨點整檔失敗，已補過略過
do $do$
declare rec record; f record; d text; cnt int;
begin
  for rec in select * from (values
    ('town_act', $o$r := public.town_ecap(r, e0, act);$o$, $n$r := public.town_ecap(r, e0, act);
  r := public.town_goal_hook(r, 'act', act);$n$),
    ('town_fac', $o$r := public.town_ecap(r, e0, act);$o$, $n$r := public.town_ecap(r, e0, act);
  r := public.town_goal_hook(r, 'fac', act);$n$),
    ('town_casino', $o$v_delta := m1 - v_chips;$o$, $n$v_delta := m1 - v_chips;
    perform public.town_goal_casino(rid, game, v_round, v_delta);$n$)
  ) as t(fname, o, nw) loop
    cnt := 0;
    for f in select p.oid, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname loop
      if position('town_goal_' in f.prosrc) > 0 then cnt := cnt + 1;
      elsif position(rec.o in f.prosrc) > 0 then
        d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d; cnt := cnt + 1;
      end if;
    end loop;
    if cnt = 0 then raise exception '% 找不到要補的文字，請人工處理', rec.fname; end if;
  end loop;
end $do$;

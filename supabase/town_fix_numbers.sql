-- 小豬鎮：全盤體檢數字修復（成就部分）。要在 town_goal.sql（與 town_bj2.sql）之後套用，可重複執行；不改 town_goal.sql 原檔，用本檔覆蓋。不給錢、不發獎、不動 items。
-- 1) 打工達人讀 works＋items.jw 加總（與打工榜一致）；升官取公司與各工作職階的最高者。
-- 2) 賭場成就「贏」改淨贏（派彩−押注）：一般遊戲看單次 delta；多步驟遊戲（21 點、地雷、飛行器、開寶箱、牌九、比大小）開局記押注（ach_c 'cacc'），結算（非開局且 delta>0）才判定 delta−cacc。
--    出手闊綽改累計下注 cwag（與 town_casino_log.wagered 同義）。town_casino 呼叫點改傳 bet。
-- 3) 事件去重：faint 只計「倒下」、hospital 只計看診、luck 排除補助／登入禮／勤勞獎金／人氣禮／連續上線／保護盾／升級、jail 另計通緝被抓回（越獄失敗仍在牢裡、刑期滿是出獄，不計以免同一次入獄算兩次）。
-- 4) 能力類門檻調高：能力者 20／28／36、單項專精 6／7／8、全能 3／5／8（開局 10 點最多 5 個單項、最低 2，不會開局就達成）。扭蛋 24、卡牌 20、小玩偶 6 與 town_catalog 的 nk 一致，不動。
-- 5) 一次性回填（town_migrations 'ach_backfill1'）：事件型計數從 town_events 重算（覆蓋）、賭場局數／款式／累計下注從 town_casino_log 重算；單次淨贏類（cwin／cw5k／cw100k）沒有歷史資料，歸 0 重算。
--    睡覺／洗澡／坐下／夜貓沒有事件來源，無法回填。不給任何獎勵（只改計數器，解鎖階數只增不減）。

create or replace function public.town_ach_def() returns jsonb language sql immutable as $$
  select jsonb_agg(jsonb_build_object('id', id, 'cat', cat, 'nm', nm, 'src', src, 'th', to_jsonb(th)) order by id) from (values
  (1,'life','打工達人','@worksall',array[10,50,250]),
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
  (53,'adv','能力者','@at',array[20,28,36]),
  (54,'adv','單項專精','@atmax',array[6,7,8]),
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
  (65,'cas','出手闊綽','c:cwag',array[100000,1000000,10000000]),
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
  (77,'col','全能','@atmin',array[3,5,8]),
  (78,'col','成就新手','@achsum',array[30]),
  (79,'col','成就達人','@achsum',array[80]),
  (80,'col','成就大師','@achsum',array[150])
  ) v(id, cat, nm, src, th)
$$;

-- 事件對應計數鍵（觸發器與回填共用，只有這裡改規則）
create or replace function public.town_goal_ev_k(p_kind text, p_msg text) returns text language sql immutable as $$
  select case
    when p_kind = 'zombie' and p_msg like '%打倒%' then 'zk'
    when p_kind = 'jail' and (p_msg like '%關進監獄%' or p_msg like '%抓走%' or p_msg like '%抓回監獄%') then 'jail'
    when p_kind = 'escape' then 'esc'
    when p_kind = 'parole' then 'par'
    when p_kind = 'jaillabor' then 'jlb'
    when p_kind in ('visitjail','visithosp') then 'vis'
    when p_kind = 'hospital' and p_msg like '%掛號看診%' then 'hsp'
    when p_kind = 'report' then 'rpt'
    when p_kind = 'faint' and p_msg like '%倒下了%' then 'flt'
    when p_kind = 'luck' and p_msg not like '%生活補助%' and p_msg not like '%登入小禮%' and p_msg not like '%勤勞獎金%'
      and p_msg not like '%人氣禮%' and p_msg not like '%連續上線%' and p_msg not like '%保護盾%' and p_msg not like '%升級成%' then 'luck'
    when p_kind = 'gift' then 'gft'
    when p_kind = 'thank' then 'thk'
    when p_kind = 'makeup' then 'mku'
    when p_kind = 'forgive' then 'frg'
    when p_kind = 'visit' then 'vst'
    when p_kind = 'persona' then 'psn'
    when p_kind = 'pk' then 'pk'
    when p_kind = 'joint' then 'jnt'
    when p_kind = 'meet' and p_msg like '%成團！%' then 'host'
    when p_kind = 'rent' and p_msg like '%財產稅%' then 'tax'
    else null end
$$;
revoke all on function public.town_goal_ev_k(text,text) from public, anon, authenticated;

create or replace function public.town_goal_ev() returns trigger language plpgsql security definer set search_path = public as $$
declare v_k text;
begin
  begin
    if new.actor is null then return new; end if;
    v_k := public.town_goal_ev_k(new.kind, new.msg);
    if v_k is not null then
      perform public.town_goal_bump(new.actor, v_k);
      if v_k in ('pk','jnt') and new.target is not null and new.target <> new.actor then perform public.town_goal_bump(new.target, v_k); end if;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
revoke all on function public.town_goal_ev() from public, anon, authenticated;

-- 賭場掛鉤（5 參數；舊 4 參數呼叫仍可用，p_bet 缺值時由開局的負 delta 推）
drop function if exists public.town_goal_casino(bigint,text,boolean,bigint);
create or replace function public.town_goal_casino(p_rid bigint, p_game text, p_round boolean, p_delta bigint, p_bet bigint default null) returns void language plpgsql security definer set search_path = public as $$
declare v_net bigint := null; v_acc bigint;
begin
  begin
    if p_round then
      perform public.town_goal_bump(p_rid, 'cp'); perform public.town_goal_bump(p_rid, 'cp_' || p_game);
      insert into public.town_ach_c(rid, k, n) values (p_rid, 'cg_' || p_game, 1) on conflict do nothing;
      perform public.town_goal_bump(p_rid, 'cwag', coalesce(p_bet, greatest(0, -p_delta)), 10000000000);
      -- 開局：記下這局押注；單步遊戲 delta 本身就是淨贏
      insert into public.town_ach_c(rid, k, n) values (p_rid, 'cacc', greatest(0, -p_delta))
        on conflict (rid, k) do update set n = excluded.n;
      v_net := p_delta;
    elsif p_delta < 0 then
      -- 中途加注（加倍、分牌）：併入這局成本
      perform public.town_goal_bump(p_rid, 'cacc', -p_delta, 10000000000);
    elsif p_delta > 0 then
      select c.n into v_acc from public.town_ach_c c where c.rid = p_rid and c.k = 'cacc';
      v_net := p_delta - coalesce(v_acc, 0);
      update public.town_ach_c c set n = 0 where c.rid = p_rid and c.k = 'cacc';
    end if;
    if v_net > 0 then
      perform public.town_goal_bump(p_rid, 'cwin');
      if v_net >= 5000 then perform public.town_goal_bump(p_rid, 'cw5k'); end if;
      if v_net >= 100000 then perform public.town_goal_bump(p_rid, 'cw100k'); end if;
    end if;
  exception when others then null;
  end;
end $$;
revoke all on function public.town_goal_casino(bigint,text,boolean,bigint,bigint) from public, anon, authenticated;

-- 就地補丁：town_ach_val（打工達人、升官）與 town_casino 呼叫點傳 bet。找不到錨點整檔失敗，已補過略過
do $do$
declare rec record; f record; d text; cnt int;
begin
  for rec in select * from (values
    ('town_ach_val', 'worksall', $o$elsif nm = 'rank' then xv := public.town_job_lv(coalesce((it->>'works')::int, 0));$o$,
$n$elsif nm = 'worksall' then xv := coalesce((it->>'works')::bigint, 0) + coalesce((select sum(case when e.value ~ '^[0-9]+$' then e.value::bigint else 0 end) from jsonb_each_text(case when jsonb_typeof(it->'jw') = 'object' then it->'jw' else '{}'::jsonb end) e), 0);
  elsif nm = 'rank' then xv := greatest(public.town_job_lv(coalesce((it->>'works')::int, 0)),
    public.town_pjob_tier(coalesce((it#>>'{jw,cafe}')::int, 0)), public.town_pjob_tier(coalesce((it#>>'{jw,rest}')::int, 0)),
    public.town_pjob_tier(coalesce((it#>>'{jw,gym}')::int, 0)), public.town_pjob_tier(coalesce((it#>>'{jw,shop}')::int, 0)),
    public.town_rafi_tier(coalesce((it#>>'{jw,rafi}')::int, 0)));$n$),
    ('town_casino', 'v_round, v_delta, bet', $o$perform public.town_goal_casino(rid, game, v_round, v_delta);$o$, $n$perform public.town_goal_casino(rid, game, v_round, v_delta, bet);$n$)
  ) as t(fname, mark, o, nw) loop
    cnt := 0;
    for f in select p.oid, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname loop
      if position(rec.mark in f.prosrc) > 0 then cnt := cnt + 1;
      elsif position(rec.o in f.prosrc) > 0 then
        d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d; cnt := cnt + 1;
      end if;
    end loop;
    if cnt = 0 then raise exception '% 找不到要補的文字，請人工處理', rec.fname; end if;
  end loop;
end $do$;


-- 賭場紀錄的遊戲名（town_casino_norm）對回「開局那一步」的原始代號，與即時計數鍵一致
create or replace function public.town_goal_graw(g text) returns text language sql immutable as $$
  select case g when 'hl' then 'hl_start' when 'bj' then 'bj_start' when 'dg' then 'dg_play' when 'pj' then 'pj_start'
    when 'mn' then 'mn_start' when 'cr' then 'cr_start' when 'ch' then 'ch_start' else g end
$$;
revoke all on function public.town_goal_graw(text) from public, anon, authenticated;

-- 一次性回填（冪等：town_migrations 記一次；只改計數器，不給獎）
create table if not exists public.town_migrations (id text primary key);
create or replace function public.town_goal_backfill(p_force boolean default false) returns int language plpgsql security definer set search_path = public as $$
begin
  if not p_force and exists (select 1 from public.town_migrations where id = 'ach_backfill1') then return 0; end if;
  -- 事件型：整批重算並覆蓋（舊規則留下的值也一併修正）
  delete from public.town_ach_c where k in ('zk','jail','esc','par','jlb','vis','hsp','rpt','flt','luck','gft','thk','mku','frg','vst','psn','pk','jnt','host','tax');
  insert into public.town_ach_c(rid, k, n)
  select x.rid, x.k, least(9999, count(*)) from (
    select e.actor as rid, public.town_goal_ev_k(e.kind, e.msg) as k from public.town_events e where e.actor is not null
    union all
    select e.target, public.town_goal_ev_k(e.kind, e.msg) from public.town_events e
      where e.kind in ('pk','joint') and e.target is not null and e.actor is not null and e.target <> e.actor
  ) x join public.town_residents r on r.id = x.rid
  where x.k is not null group by x.rid, x.k;
  -- 賭場：局數、款式、累計下注；單次淨贏類無歷史，歸 0
  delete from public.town_ach_c where k in ('cp','cwag','cwin','cw5k','cw100k','closs','cacc') or k like 'cp\_%' or k like 'cg\_%';
  insert into public.town_ach_c(rid, k, n)
  select l.rid, 'cp', least(9999, sum(l.rounds)) from public.town_casino_log l join public.town_residents r on r.id = l.rid group by l.rid having sum(l.rounds) > 0;
  insert into public.town_ach_c(rid, k, n)
  select l.rid, 'cwag', least(10000000000, sum(l.wagered)) from public.town_casino_log l join public.town_residents r on r.id = l.rid group by l.rid having sum(l.wagered) > 0;
  insert into public.town_ach_c(rid, k, n)
  select l.rid, 'cp_' || public.town_goal_graw(l.game), least(9999, sum(l.rounds)) from public.town_casino_log l join public.town_residents r on r.id = l.rid
    group by l.rid, public.town_goal_graw(l.game) having sum(l.rounds) > 0;
  insert into public.town_ach_c(rid, k, n)
  select l.rid, 'cg_' || public.town_goal_graw(l.game), 1 from public.town_casino_log l join public.town_residents r on r.id = l.rid
    group by l.rid, public.town_goal_graw(l.game) having sum(l.rounds) > 0;
  insert into public.town_migrations(id) values ('ach_backfill1') on conflict do nothing;
  return 1;
end $$;
revoke all on function public.town_goal_backfill(boolean) from public, anon, authenticated;
select public.town_goal_backfill();

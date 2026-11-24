-- 小豬鎮：長期目標批 3「賽季」。要在 town_goal.sql、town_dex.sql、town_meet.sql、town_fix_rest.sql（town_score）、town_casino.sql 之後套用，可重複執行。
-- 規則：以台灣月份為一季（Asia/Taipei）；沒有排程，惰性結算（任何人呼叫 town_season 就補算到上季）。獎勵只有稱號、當季限定造型、零食，不給錢。
-- 積分 = 五項各自封頂後相加（一項再多也只能拿到該項上限，要多項都參與才拿得到高分，避免一人壟斷）：
--   打工 work：本季打工次數（公司＋其他工作＋加班，每台灣日最多計 40 次）÷2，上限 80 分
--   賭神 casino：本季每日淨籌碼輸贏（每日最多計 5 萬）加總，負的不計，每 1000 籌碼 1 分，上限 80 分；要玩 ≥ 20 局才算；只讀 town_casino_log，換籌碼手續費不在內
--   揪團 meet：本季成團出席次數（每日最多計 3 次）×15，上限 90 分
--   街機 arcade：本季打地鼠最高分＋翻牌最高分÷2，上限 90 分（打地鼠最高 40、翻牌最高 100）
--   成就 ach：本季新解鎖成就階數 ×2，上限 60 分
--   參與門檻 30 分；結算時活躍（≥30 分）居民 ≥ 3 人才發名次獎；前三名：稱號（冠軍／亞軍／季軍）＋當季限定造型＋零食 1 包；其餘達門檻者：參與稱號＋零食 1 包。
-- 資料：town_season_score(ym,rid,k,v)（k 含 @ 的是每日上限用的當日計數列）、town_seasons(tid,ym,closed,ann,result)；居民端 items.sn = {ym: 1}（領過）。RLS 全關。
-- 造型：town_shop 的 wear、unlock='season'（買不到、只能得獎領取、領了寫進 items.w；town_login 驗證本來就要求已擁有）。圖鑑造型頁標「已絕版」。
-- 就地補丁（找不到錨點整檔失敗、已補過略過）：town_goal_hook（打工）、town_meet_settle（揪團）、town_score（街機）、town_ach_check（成就）、town_dex_list（賽季造型不計入核心）。
-- 測試可用 set_config('town.date','2026-11-30 12:00:00',true) 覆蓋「現在」（台灣時間 timestamp）。
-- 在 Supabase，revoke ... from public 擋不住 anon／authenticated，要連 anon、authenticated 一起收回。

create table if not exists public.town_season_score (
  ym text not null,
  rid bigint not null references public.town_residents(id) on delete cascade,
  k text not null,
  v bigint not null default 0,
  primary key (ym, rid, k)
);
alter table public.town_season_score enable row level security;
revoke all on public.town_season_score from public, anon, authenticated;

create table if not exists public.town_seasons (
  tid text not null,
  ym text not null,
  closed boolean not null default false,
  ann jsonb not null default '{}'::jsonb,
  result jsonb,
  primary key (tid, ym)
);
alter table public.town_seasons enable row level security;
revoke all on public.town_seasons from public, anon, authenticated;

-- 「現在」（台灣時間）：測試可用 town.date 覆蓋
create or replace function public.town_season_clock() returns timestamp language sql stable as $$
  select coalesce(nullif(current_setting('town.date', true), '')::timestamp, now() at time zone 'Asia/Taipei')
$$;
create or replace function public.town_season_ym() returns text language sql stable as $$
  select to_char(public.town_season_clock(), 'YYYYMM')
$$;

-- 每季主題與限定造型。cid/cnm = 造型代號與名稱（沒有 = 這季只發稱號）
create or replace function public.town_season_def(p_ym text) returns jsonb language sql immutable as $$
  select case p_ym
    when '202611' then '{"nm":"楓葉季","th":"楓葉紛飛的十一月","cid":"s2611","cnm":"楓葉髮飾"}'::jsonb
    when '202612' then '{"nm":"雪夜季","th":"白雪與燈飾的十二月","cid":"s2612","cnm":"聖誕帽"}'::jsonb
    when '202701' then '{"nm":"煙火季","th":"新年煙火的一月","cid":"s2701","cnm":"煙火髮箍"}'::jsonb
    else jsonb_build_object('nm', (substr(p_ym, 5, 2)::int) || '月賽季', 'th', (substr(p_ym, 5, 2)::int) || '月賽季', 'cid', null, 'cnm', null)
  end
$$;
-- 積分上限與門檻（前端、測試要一致）
create or replace function public.town_season_caps() returns jsonb language sql immutable as $$
  select '{"w":80,"c":80,"m":90,"a":90,"h":60,"need":30,"wday":40,"cday":50000,"mday":3,"cgames":20}'::jsonb
$$;
revoke all on function public.town_season_clock(), public.town_season_ym(), public.town_season_def(text), public.town_season_caps() from public, anon, authenticated;

-- 賽季造型（只能得獎領取）
insert into public.town_shop(id, kind, slot, name, price, unlock) values
  ('s2611', 'wear', 'acc', '楓葉髮飾', 0, 'season'),
  ('s2612', 'wear', 'acc', '聖誕帽', 0, 'season'),
  ('s2701', 'wear', 'acc', '煙火髮箍', 0, 'season')
on conflict (id) do update set kind = excluded.kind, slot = excluded.slot, name = excluded.name, price = excluded.price, unlock = excluded.unlock;

-- 計分：p_daycap 非 null = 每台灣日最多計入這麼多；p_max = 取最大值（街機最佳分）。絕不丟錯
create or replace function public.town_season_add(p_rid bigint, p_k text, p_n bigint, p_daycap bigint default null, p_max boolean default false) returns void language plpgsql security definer set search_path = public as $$
declare v_ym text := public.town_season_ym(); v_day text := to_char(public.town_season_clock(), 'YYYYMMDD'); v_cur bigint; v_add bigint;
begin
  begin
    if p_n is null or p_n <= 0 then return; end if;
    if p_max then
      insert into public.town_season_score(ym, rid, k, v) values (v_ym, p_rid, p_k, p_n)
        on conflict (ym, rid, k) do update set v = greatest(public.town_season_score.v, excluded.v);
      return;
    end if;
    v_add := p_n;
    if p_daycap is not null then
      select s.v into v_cur from public.town_season_score s where s.ym = v_ym and s.rid = p_rid and s.k = p_k || '@' || v_day;
      v_add := least(p_n, p_daycap - coalesce(v_cur, 0));
      if v_add <= 0 then return; end if;
      insert into public.town_season_score(ym, rid, k, v) values (v_ym, p_rid, p_k || '@' || v_day, v_add)
        on conflict (ym, rid, k) do update set v = public.town_season_score.v + excluded.v;
    end if;
    insert into public.town_season_score(ym, rid, k, v) values (v_ym, p_rid, p_k, v_add)
      on conflict (ym, rid, k) do update set v = public.town_season_score.v + excluded.v;
  exception when others then null;
  end;
end $$;
revoke all on function public.town_season_add(bigint,text,bigint,bigint,boolean) from public, anon, authenticated;

-- 某鎮某季的排行：[{rid,name,pts,w,c,m,a,h}]，只列 pts > 0，依分數大到小
create or replace function public.town_season_board(p_tid text, p_ym text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_caps jsonb := public.town_season_caps(); v_mo text := substr(p_ym, 1, 4) || '-' || substr(p_ym, 5, 2); v_out jsonb;
begin
  select coalesce(jsonb_agg(z.x order by (z.x->>'pts')::int desc, (z.x->>'rid')::bigint), '[]'::jsonb) into v_out from (
    select jsonb_build_object('rid', q.id, 'name', q.name, 'pts', q.w + q.c + q.m + q.a + q.h, 'w', q.w, 'c', q.c, 'm', q.m, 'a', q.a, 'h', q.h) as x
    from (
      select p.id, p.name,
        least((v_caps->>'w')::int, floor(coalesce((sc.j->>'work')::numeric, 0) / 2)::int) as w,
        case when cs.rd >= (v_caps->>'cgames')::int then least((v_caps->>'c')::int, floor(cs.nt / 1000.0)::int) else 0 end as c,
        least((v_caps->>'m')::int, 15 * coalesce((sc.j->>'meet')::int, 0)) as m,
        least((v_caps->>'a')::int, coalesce((sc.j->>'ar_whack')::int, 0) + floor(coalesce((sc.j->>'ar_memory')::numeric, 0) / 2)::int) as a,
        least((v_caps->>'h')::int, 2 * coalesce((sc.j->>'ach')::int, 0)) as h
      from public.town_residents p
      cross join lateral (select coalesce(jsonb_object_agg(s.k, s.v), '{}'::jsonb) as j from public.town_season_score s where s.ym = p_ym and s.rid = p.id and position('@' in s.k) = 0) sc
      cross join lateral (select coalesce(sum(d.rounds), 0)::int as rd, greatest(0, coalesce(sum(d.dn), 0))::bigint as nt from (
          select sum(l.rounds) as rounds, least((v_caps->>'cday')::bigint, sum(l.net)) as dn from public.town_casino_log l where l.rid = p.id and left(l.day, 7) = v_mo group by l.day) d) cs
      where p.town_id = p_tid
    ) q where q.w + q.c + q.m + q.a + q.h > 0
  ) z;
  return v_out;
end $$;
revoke all on function public.town_season_board(text,text) from public, anon, authenticated;

-- 結算（冪等）：補算到「本季以前」所有還沒結算且有分數的月份
create or replace function public.town_season_settle(p_tid text) returns void language plpgsql security definer set search_path = public as $$
declare v_cur text := public.town_season_ym(); v_ym text; v_row public.town_seasons; v_bd jsonb; v_def jsonb; v_aw jsonb; v_e jsonb; v_i int := 0; v_act int; v_need int := (public.town_season_caps()->>'need')::int; v_top jsonb := '[]'::jsonb; v_msg text; v_rk int;
begin
  for v_ym in
    select distinct m from (
      select s.ym as m from public.town_season_score s join public.town_residents p on p.id = s.rid where p.town_id = p_tid and s.ym < v_cur
      union select replace(left(l.day, 7), '-', '') from public.town_casino_log l join public.town_residents p on p.id = l.rid where p.town_id = p_tid and replace(left(l.day, 7), '-', '') < v_cur
    ) t order by m
  loop
    insert into public.town_seasons(tid, ym) values (p_tid, v_ym) on conflict do nothing;
    select * into v_row from public.town_seasons x where x.tid = p_tid and x.ym = v_ym for update;
    if v_row.closed then continue; end if;
    v_bd := public.town_season_board(p_tid, v_ym); v_def := public.town_season_def(v_ym);
    if jsonb_array_length(v_bd) = 0 then
      update public.town_seasons x set closed = true, result = jsonb_build_object('nm', v_def->>'nm', 'top', '[]'::jsonb, 'aw', '{}'::jsonb, 'active', 0) where x.tid = p_tid and x.ym = v_ym;
      continue;
    end if;
    select count(*) into v_act from jsonb_array_elements(v_bd) e where (e->>'pts')::int >= v_need;
    v_aw := '{}'::jsonb; v_top := '[]'::jsonb; v_i := 0;
    for v_e in select e from jsonb_array_elements(v_bd) e loop
      v_i := v_i + 1;
      if (v_e->>'pts')::int >= v_need then
        v_rk := case when v_act >= 3 and v_i <= 3 then v_i else 0 end;
        v_aw := v_aw || jsonb_build_object(v_e->>'rid', case when v_rk > 0 then v_rk::text else 'p' end);
      end if;
      if v_i <= 10 then v_top := v_top || jsonb_build_array(v_e || jsonb_build_object('rank', v_i)); end if;
    end loop;
    update public.town_seasons x set closed = true, result = jsonb_build_object('nm', v_def->>'nm', 'top', v_top, 'aw', v_aw, 'active', v_act, 'cid', v_def->>'cid') where x.tid = p_tid and x.ym = v_ym;
    v_msg := (v_def->>'nm') || '結算：';
    if v_act >= 3 then
      v_msg := v_msg || '冠軍 ' || (v_top->0->>'name') || '（' || (v_top->0->>'pts') || ' 分）、亞軍 ' || (v_top->1->>'name') || '、季軍 ' || (v_top->2->>'name') || '。到選單「賽季」領獎';
    else
      v_msg := v_msg || '活躍的人不到 3 位，只發參與獎。到選單「賽季」領獎';
    end if;
    insert into public.town_events(town_id, actor, kind, msg) values (p_tid, null, 'season', left(v_msg, 120));
  end loop;
end $$;
revoke all on function public.town_season_settle(text) from public, anon, authenticated;

-- 本季公告（冪等）：開季一次、剩 7 天一次
create or replace function public.town_season_announce(p_tid text) returns void language plpgsql security definer set search_path = public as $$
declare v_ym text := public.town_season_ym(); v_row public.town_seasons; v_def jsonb := public.town_season_def(public.town_season_ym()); v_left int; v_ann jsonb;
begin
  insert into public.town_seasons(tid, ym) values (p_tid, v_ym) on conflict do nothing;
  select * into v_row from public.town_seasons x where x.tid = p_tid and x.ym = v_ym for update;
  v_ann := v_row.ann;
  v_left := ((date_trunc('month', public.town_season_clock()) + interval '1 month')::date - public.town_season_clock()::date);
  if not (v_ann ? 'open') then
    insert into public.town_events(town_id, actor, kind, msg) values (p_tid, null, 'season', left('新賽季開始：' || (v_def->>'th') || '。打工、賭場、揪團、街機、成就都算分' || case when v_def->>'cnm' is not null then '，前三名可得限定造型「' || (v_def->>'cnm') || '」' else '' end, 120));
    v_ann := v_ann || '{"open":1}'::jsonb;
  end if;
  if v_left <= 7 and not (v_ann ? 'w7') then
    insert into public.town_events(town_id, actor, kind, msg) values (p_tid, null, 'season', left((v_def->>'nm') || '剩 ' || v_left || ' 天，衝刺最後積分！', 120));
    v_ann := v_ann || '{"w7":1}'::jsonb;
  end if;
  if v_ann is distinct from v_row.ann then update public.town_seasons x set ann = v_ann where x.tid = p_tid and x.ym = v_ym; end if;
end $$;
revoke all on function public.town_season_announce(text) from public, anon, authenticated;

-- RPC：view（本季＋待領獎）／claim（id = 年月 YYYYMM）／hist（歷史賽季）
create or replace function public.town_season(rid bigint, pin text, op text default 'view', id text default null) returns json language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; v_ym text := public.town_season_ym(); v_def jsonb; v_bd jsonb; v_top jsonb := '[]'::jsonb; v_me jsonb; v_rk int := 0; v_i int := 0; v_e jsonb;
  v_pend jsonb := '[]'::jsonb; v_row public.town_seasons; v_aw text; v_d2 jsonb; v_ttl jsonb; v_ti text; v_gv text; v_sn int; v_left int; v_hist jsonb := '[]'::jsonb; v_my jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error', '密碼不對'); end if;
  perform public.town_season_settle(r.town_id);
  perform public.town_season_announce(r.town_id);
  if op = 'claim' then
    if id is null or id !~ '^[0-9]{6}$' then raise exception '賽季代號不對'; end if;
    select * into r from public.town_residents p where p.id = r.id for update;
    select * into v_row from public.town_seasons x where x.tid = r.town_id and x.ym = id;
    if v_row.tid is null or not v_row.closed then raise exception '這一季還沒結算'; end if;
    v_aw := v_row.result->'aw'->>(r.id::text);
    if v_aw is null then raise exception '這一季你沒有達到領獎門檻'; end if;
    if coalesce(r.items->'sn', '{}'::jsonb) ? id then raise exception '這一季的獎勵已經領過了'; end if;
    v_def := public.town_season_def(id);
    v_ti := (v_def->>'nm') || case v_aw when '1' then '冠軍' when '2' then '亞軍' when '3' then '季軍' else '參與' end;
    v_ttl := coalesce(r.items->'titles', '[]'::jsonb); v_gv := '稱號「' || v_ti || '」';
    if not (v_ttl ? v_ti) then r.items := jsonb_set(r.items, '{titles}', v_ttl || to_jsonb(v_ti)); end if;
    if v_aw in ('1','2','3') and v_def->>'cid' is not null and jsonb_typeof(coalesce(r.items->'w', '[]'::jsonb)) = 'array' and not (coalesce(r.items->'w', '[]'::jsonb) ? (v_def->>'cid')) then
      r.items := jsonb_set(r.items, '{w}', coalesce(r.items->'w', '[]'::jsonb) || to_jsonb(v_def->>'cid'), true);
      v_gv := v_gv || '、限定造型「' || (v_def->>'cnm') || '」';
    end if;
    v_sn := coalesce((r.items->>'snack')::int, 0);
    if v_sn < public.town_bag_max(r) then r.items := jsonb_set(r.items, '{snack}', to_jsonb(v_sn + 1)); v_gv := v_gv || '、零食 1 包'; end if;
    r.items := jsonb_set(r.items, '{sn}', coalesce(r.items->'sn', '{}'::jsonb) || jsonb_build_object(id, 1), true);
    update public.town_residents p set items = r.items where p.id = r.id;
    insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, r.id, r.id, 'season', left(r.name || ' 領了' || (v_def->>'nm') || '的獎勵：' || v_ti, 120));
    return json_build_object('ok', true, 'got', v_gv, 'title', v_ti, 'award', v_aw, 'cid', case when v_aw in ('1','2','3') then v_def->>'cid' else null end);
  end if;
  -- 待領獎（最近 6 筆結算）
  for v_row in select * from public.town_seasons x where x.tid = r.town_id and x.closed order by x.ym desc limit 12 loop
    v_aw := v_row.result->'aw'->>(r.id::text);
    v_d2 := public.town_season_def(v_row.ym);
    v_my := null; v_i := 0;
    for v_e in select e from jsonb_array_elements(coalesce(v_row.result->'top', '[]'::jsonb)) e loop
      if (v_e->>'rid')::bigint = r.id then v_my := v_e; end if;
    end loop;
    if op = 'hist' then
      v_hist := v_hist || jsonb_build_array(jsonb_build_object('ym', v_row.ym, 'nm', v_d2->>'nm', 'cnm', v_d2->>'cnm', 'top', (select coalesce(jsonb_agg(t), '[]') from (select e as t from jsonb_array_elements(coalesce(v_row.result->'top', '[]'::jsonb)) e limit 3) q),
        'me', v_my, 'award', v_aw, 'claimed', coalesce(r.items->'sn', '{}'::jsonb) ? v_row.ym, 'active', v_row.result->'active'));
    elsif v_aw is not null and not (coalesce(r.items->'sn', '{}'::jsonb) ? v_row.ym) then
      v_pend := v_pend || jsonb_build_array(jsonb_build_object('ym', v_row.ym, 'nm', v_d2->>'nm', 'award', v_aw, 'cnm', case when v_aw in ('1','2','3') then v_d2->>'cnm' else null end, 'cid', case when v_aw in ('1','2','3') then v_d2->>'cid' else null end));
    end if;
  end loop;
  if op = 'hist' then return json_build_object('ok', true, 'hist', v_hist); end if;
  v_def := public.town_season_def(v_ym);
  v_bd := public.town_season_board(r.town_id, v_ym);
  v_i := 0;
  for v_e in select e from jsonb_array_elements(v_bd) e loop
    v_i := v_i + 1;
    if (v_e->>'rid')::bigint = r.id then v_rk := v_i; v_me := v_e; end if;
    if v_i <= 10 then v_top := v_top || jsonb_build_array(v_e || jsonb_build_object('rank', v_i)); end if;
  end loop;
  v_left := ((date_trunc('month', public.town_season_clock()) + interval '1 month')::date - public.town_season_clock()::date);
  return json_build_object('ok', true, 'ym', v_ym, 'nm', v_def->>'nm', 'th', v_def->>'th', 'cid', v_def->>'cid', 'cnm', v_def->>'cnm', 'days_left', v_left,
    'top', v_top, 'n', jsonb_array_length(v_bd), 'me', coalesce(v_me || jsonb_build_object('rank', v_rk), jsonb_build_object('rank', null, 'pts', 0, 'w', 0, 'c', 0, 'm', 0, 'a', 0, 'h', 0)),
    'caps', public.town_season_caps(), 'pend', v_pend);
end $$;
revoke all on function public.town_season(bigint,text,text,text) from public;
grant execute on function public.town_season(bigint,text,text,text) to anon, authenticated;

-- 就地補丁：找不到錨點整檔失敗，已補過略過
do $do$
declare rec record; f record; d text; cnt int;
begin
  for rec in select * from (values
    ('town_goal_hook', $o$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;$o$, $n$if hr < 5 then perform public.town_goal_bump_day(r.id, 'nite'); end if;
    if src = 'act' and act in ('work','job','cowork') then perform public.town_season_add(r.id, 'work', 1, 40); end if;$n$),
    ('town_meet_settle', $o$tt := case when n = 25 then '團長'$o$, $n$perform public.town_season_add(a, 'meet', 1, 3);
        tt := case when n = 25 then '團長'$n$),
    ('town_score', $o$v_gain := 2; r.fun := least(100, r.fun + 2);$o$, $n$v_gain := 2; r.fun := least(100, r.fun + 2);
  perform public.town_season_add(r.id, 'ar_' || game, score, null, true);$n$),
    ('town_ach_check', $o$update public.town_ach_u z set u = cu, nw = cnw where z.rid = r.id;$o$, $n$update public.town_ach_u z set u = cu, nw = cnw where z.rid = r.id;
    perform public.town_season_add(r.id, 'ach', n);$n$),
    ('town_dex_list', $o$'got', w ? s.id, 'seas', false,$o$, $n$'got', w ? s.id, 'seas', coalesce(s.unlock, '') = 'season',$n$),
    ('town_dex_list', $o$'hint', case when s.unlock = 'couple'$o$, $n$'hint', case when s.unlock = 'season' then (case when right(s.id, 4) = right(public.town_season_ym(), 4) then '本季賽季獎勵' else '賽季限定（已絕版）' end) when s.unlock = 'couple'$n$)
  ) as t(fname, o, nw) loop
    cnt := 0;
    for f in select p.oid, p.prosrc from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname loop
      if position(rec.nw in f.prosrc) > 0 then cnt := cnt + 1;
      elsif position(rec.o in f.prosrc) > 0 then
        d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d; cnt := cnt + 1;
      end if;
    end loop;
    if cnt = 0 then raise exception '% 找不到要補的文字，請人工處理', rec.fname; end if;
  end loop;
end $do$;

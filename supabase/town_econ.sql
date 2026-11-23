-- 小豬鎮：金錢宏觀調控（2026-11-23）。要在 town.sql、town_retention.sql、town_casino.sql、town_fac.sql、town_world.sql、town_civic.sql、town_infac.sql 之後套用，可重複執行。
-- ① 自動調節器：每個台灣日惰性結算一次（town_rent 第一次跑時順便做），依活躍居民（近 3 天上線）的人均現金、首富占比、窮人比例，
--    微調 財產稅係數 kt（0.8～1.2）、奢侈品價格係數 kp（0.9～1.2）、生活補助係數 ks（0.8～1.3），每天最多 ±2%，起算全部 1.0；活躍人數 < 3 就凍結並慢慢回到 1.0。
--    係數只乘在「之後」發生的稅／補助／奢侈品價格，不回頭扣任何人的錢。變動 >= 1% 寫公開動態 kind 'world'。
-- ② 鎮基金週回流：每 7 天結算（活躍 >= 3 人、基金 >= 3000）。可動用 = 基金 70%：40% 公平補差金、30% 全鎮慶典（24 小時）、30% 自動蓋公共建設（累積到夠才蓋）。
--    補差金只發給活躍且登入滿 3 天的居民，額度 = max(0, 2×中位數 − 現金籌碼)，單人最多占補差金 40%，記在 town_econ.pend，居民下次登入領（14 天沒領退回基金）。
-- 開關：town_flags 的 econ 列（沒有 = 開）；每鎮 town_econ.enabled。關掉 = 係數視為 1.0、不結算、不回流。
--   緊急關閉：insert into public.town_flags(k, v) values ('econ', false) on conflict (k) do update set v = false;
-- town_rent 用就地改文字（和 town_casino.sql 同做法）：已改過就跳過；若重套了 town.sql／town_retention.sql／town_fac.sql，要再套一次本檔。
create table if not exists public.town_flags (k text primary key, v boolean not null default true);
alter table public.town_flags enable row level security;
revoke all on public.town_flags from public, anon, authenticated;

create table if not exists public.town_econ (
  town_id text primary key references public.town_towns(id) on delete cascade,
  enabled boolean not null default true,
  kt numeric not null default 1, kp numeric not null default 1, ks numeric not null default 1,
  day text, wk text, build bigint not null default 0,
  ann jsonb not null default '{}'::jsonb, hist jsonb not null default '[]'::jsonb,
  pend jsonb not null default '{}'::jsonb, pays jsonb not null default '[]'::jsonb
);
alter table public.town_econ enable row level security;
revoke all on public.town_econ from public, anon, authenticated;

create or replace function public.town_econ_on(tid text) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select f.v from public.town_flags f where f.k = 'econ'), true)
     and coalesce((select e.enabled from public.town_econ e where e.town_id = tid), true)
$$;
create or replace function public.town_econ_k(tid text, w text) returns numeric language sql stable security definer set search_path = public as $$
  select case when not public.town_econ_on(tid) then 1::numeric
    else coalesce((select case w when 't' then e.kt when 'p' then e.kp else e.ks end from public.town_econ e where e.town_id = tid), 1::numeric) end
$$;
-- 財產稅 = 原階梯 × 係數；補助金額與門檻、奢侈品價格 × 係數
create or replace function public.town_tax_k(tid text, m numeric) returns int language sql stable security definer set search_path = public as $$
  select floor(public.town_tax(m) * public.town_econ_k(tid, 't'))::int
$$;
create or replace function public.town_econ_sub(tid text) returns int language sql stable security definer set search_path = public as $$
  select round(600 * public.town_econ_k(tid, 's'))::int
$$;
create or replace function public.town_econ_sub_thr(tid text) returns int language sql stable security definer set search_path = public as $$
  select round(10000 * public.town_econ_k(tid, 's'))::int
$$;
create or replace function public.town_econ_px(tid text, base int) returns int language sql stable security definer set search_path = public as $$
  select round(base * public.town_econ_k(tid, 'p'))::int
$$;
revoke all on function public.town_econ_on(text), public.town_econ_k(text,text), public.town_tax_k(text,numeric), public.town_econ_sub(text), public.town_econ_sub_thr(text), public.town_econ_px(text,int) from public, anon, authenticated;

-- 每日結算（調節器）＋每週回流。任何人呼叫都安全：同一天只做一次，用 for update 鎖列
create or replace function public.town_econ_tick(tid text) returns void language plpgsql security definer set search_path = public as $$
declare e public.town_econ; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  n int; tot numeric; top numeric; poor numeric; med numeric; m numeric; g numeric := 0; prev numeric; shr numeric;
  nkt numeric; nkp numeric; nks numeric; msg text; h jsonb; fnd bigint; pool bigint; pay bigint; fest bigint; bld bigint; paid bigint := 0;
  pj jsonb; pn int := 0; med2 numeric; pr record; codes text[] := array['bench2','lamp','gazebo','statue']; code text; cost int; built text := ''; spent bigint;
  c public.town_civic;
begin
  if not public.town_econ_on(tid) then return; end if;
  if exists (select 1 from public.town_econ z where z.town_id = tid and z.day = today) then return; end if;
  insert into public.town_econ(town_id, wk) values (tid, today) on conflict (town_id) do nothing;
  select * into e from public.town_econ where town_id = tid for update;
  if e.day = today then return; end if;
  -- 指標：活躍居民 = 近 3 天上線；錢 = 現金 + 賭場籌碼
  select count(*), coalesce(sum(v), 0), coalesce(max(v), 0), coalesce(avg((v < 10000)::int), 0), coalesce(percentile_cont(0.5) within group (order by v), 0)
    into n, tot, top, poor, med
    from (select (p.money + coalesce((p.items->'cas'->>'ch')::numeric, 0)) v from public.town_residents p where p.town_id = tid and p.seen_at > now() - interval '3 days') s;
  m := case when n > 0 then tot / n else 0 end;
  shr := case when tot > 0 then top / tot else 0 end;
  select (x->>'m')::numeric into prev from jsonb_array_elements(e.hist) x where (x->>'d')::date <= today::date - 7 order by x->>'d' desc limit 1;
  if prev is not null and prev > 0 then g := (m - prev) / prev; end if;
  if n >= 3 then
    nkt := least(1.2, greatest(0.8, e.kt * case when shr > 0.6 or g > 0.08 then 1.02 when shr < 0.4 and g < 0 then 0.98 else 1 end));
    nkp := least(1.2, greatest(0.9, e.kp * case when g > 0.05 then 1.02 when g < -0.02 then 0.98 else 1 end));
    nks := least(1.3, greatest(0.8, e.ks * case when poor > 0.3 then 1.02 when poor < 0.1 then 0.99 else 1 end));
  else
    nkt := 1 + (e.kt - 1) * 0.98; nkp := 1 + (e.kp - 1) * 0.98; nks := 1 + (e.ks - 1) * 0.98;
  end if;
  nkt := round(nkt, 3); nkp := round(nkp, 3); nks := round(nks, 3);
  if abs(nkt - coalesce((e.ann->>'t')::numeric, 1)) >= 0.01 or abs(nkp - coalesce((e.ann->>'p')::numeric, 1)) >= 0.01 or abs(nks - coalesce((e.ann->>'s')::numeric, 1)) >= 0.01 then
    msg := '小鎮經濟調整：財產稅係數 ' || nkt || '、奢侈品價格係數 ' || nkp || '、生活補助係數 ' || nks || '（活躍 ' || n || ' 人，人均 €' || round(m) || '，首富占 ' || round(shr * 100) || '%）';
    insert into public.town_events(town_id, actor, kind, msg) values (tid, null, 'world', msg);
    e.ann := jsonb_build_object('t', nkt, 'p', nkp, 's', nks);
  end if;
  h := e.hist || jsonb_build_array(jsonb_build_object('d', today, 'm', round(m), 'top', round(shr, 3), 'poor', round(poor, 3), 'g', round(g, 3), 'n', n, 'kt', nkt, 'kp', nkp, 'ks', nks,
        'f', (select coalesce(t.fund, 0) from public.town_towns t where t.id = tid)));
  while jsonb_array_length(h) > 90 loop h := h - 0; end loop;
  -- 過期沒領的補差金退回基金
  for pr in select k.key, k.value from jsonb_each(e.pend) k where (k.value->>'at')::date < today::date - 14 loop
    perform public.town_fund_add(tid, 'econ_back', (pr.value->>'a')::int);
    e.pend := e.pend - pr.key;
  end loop;
  -- 每週回流
  if today::date - e.wk::date >= 7 and n >= 3 then
    select coalesce(t.fund, 0) into fnd from public.town_towns t where t.id = tid;
    if fnd >= 3000 then
      pool := floor(fnd * 0.7); pay := floor(pool * 0.4); fest := floor(pool * 0.3); bld := pool - pay - fest;
      select coalesce(percentile_cont(0.5) within group (order by v), 0) into med2 from (select (p.money + coalesce((p.items->'cas'->>'ch')::numeric, 0)) v
        from public.town_residents p where p.town_id = tid and p.seen_at > now() - interval '3 days' and coalesce((p.items->'al'->>'n')::int, 0) >= 3) s2;
      select coalesce(jsonb_object_agg(w.id::text, w.a), '{}'::jsonb), coalesce(sum(w.a), 0), count(*) into pj, paid, pn from (
        select y.id, floor(least(y.need, pay::numeric * y.need / nullif(y.s, 0), pay * 0.4)) a from (
          select z.id, greatest(0, 2 * med2 - z.v) need, sum(greatest(0, 2 * med2 - z.v)) over () s from (
            select p.id, (p.money + coalesce((p.items->'cas'->>'ch')::numeric, 0)) v from public.town_residents p
            where p.town_id = tid and p.seen_at > now() - interval '3 days' and coalesce((p.items->'al'->>'n')::int, 0) >= 3) z) y where y.need > 0) w where w.a >= 1;
      for pr in select k.key, k.value from jsonb_each(pj) k loop
        e.pend := jsonb_set(e.pend, array[pr.key], jsonb_build_object('a', coalesce((e.pend->pr.key->>'a')::bigint, 0) + (pr.value #>> '{}')::bigint, 'at', today));
      end loop;
      -- 慶典：24 小時（價格 90%、薪水 105%）
      insert into public.town_worlds(town_id) values (tid) on conflict (town_id) do nothing;
      update public.town_worlds set k = 'festival', until = now() + interval '24 hours', next_at = now() + interval '25 hours' where town_id = tid;
      -- 建設基金：累積到夠就蓋下一個建設案
      insert into public.town_civic(town_id) values (tid) on conflict (town_id) do nothing;
      select * into c from public.town_civic where town_id = tid for update;
      code := null;
      foreach built in array codes loop
        if not (c.proj ? built) then code := built; exit; end if;
      end loop;
      built := '';
      if code is not null then
        e.build := e.build + bld; cost := (public.town_civic_proj(code))[1];
        if e.build >= cost then
          e.build := e.build - cost; update public.town_civic set proj = proj || to_jsonb(code) where town_id = tid; built := public.town_civic_pname(code);
        end if;
      else
        bld := 0;
      end if;
      spent := paid + fest + bld;
      update public.town_towns set fund = fund - spent where id = tid and fund >= spent;
      e.wk := today;
      e.pays := jsonb_build_array(jsonb_build_object('d', today, 'pay', paid, 'n', pn, 'fest', fest, 'bld', bld, 'built', built)) || e.pays;
      while jsonb_array_length(e.pays) > 12 loop e.pays := e.pays - 12; end loop;
      msg := '鎮基金週結算：補差金共 €' || paid || '，發給 ' || pn || ' 位居民（下次登入領）；全鎮慶典 24 小時（花 €' || fest || '）；建設基金 +€' || bld
        || case when built <> '' then '，蓋好了「' || built || '」' else '' end;
      insert into public.town_events(town_id, actor, kind, msg) values (tid, null, 'fund', msg);
    end if;
  end if;
  update public.town_econ set kt = nkt, kp = nkp, ks = nks, day = today, wk = e.wk, build = e.build, ann = e.ann, hist = h, pend = e.pend, pays = e.pays where town_id = tid;
end $$;
revoke all on function public.town_econ_tick(text) from public, anon, authenticated;

-- 領補差金（town_rent 開頭呼叫，只動這個居民的錢）
create or replace function public.town_econ_claim(r public.town_residents) returns public.town_residents language plpgsql security definer set search_path = public as $$
declare a bigint;
begin
  if not public.town_econ_on(r.town_id) then return r; end if;
  select (e.pend->(r.id::text)->>'a')::bigint into a from public.town_econ e where e.town_id = r.town_id;
  if a is null or a <= 0 then return r; end if;
  perform 1 from public.town_econ e where e.town_id = r.town_id for update;
  update public.town_econ e set pend = e.pend - r.id::text where e.town_id = r.town_id;
  r.money := least(2000000000, r.money + a)::int;
  insert into public.town_events(town_id, actor, target, kind, msg) values (r.town_id, r.id, r.id, 'fund', r.name || ' 領到鎮基金補差金 €' || a);
  return r;
end $$;
revoke all on function public.town_econ_claim(public.town_residents) from public, anon, authenticated;

-- 報表（所有居民可看）與開關（鎮長）：op = view／on／off
create or replace function public.town_econ_view(rid bigint, pin text, op text default 'view') returns json language plpgsql security definer set search_path = public as $$
declare r public.town_residents; e public.town_econ; w json;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op in ('on','off') then
    if not r.mayor then raise exception '只有鎮長可以開關'; end if;
    insert into public.town_econ(town_id, wk) values (r.town_id, to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')) on conflict (town_id) do nothing;
    update public.town_econ set enabled = (op = 'on') where town_id = r.town_id;
    insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, r.id, 'mayor', '鎮長' || case when op = 'on' then '開啟' else '關閉' end || '了小鎮經濟調節');
  end if;
  select * into e from public.town_econ where town_id = r.town_id;
  return json_build_object('ok', true, 'on', public.town_econ_on(r.town_id), 'global_on', coalesce((select f.v from public.town_flags f where f.k = 'econ'), true),
    'kt', coalesce(e.kt, 1), 'kp', coalesce(e.kp, 1), 'ks', coalesce(e.ks, 1), 'build', coalesce(e.build, 0), 'wk', e.wk,
    'hist', coalesce(e.hist, '[]'::jsonb), 'pays', coalesce(e.pays, '[]'::jsonb), 'mine', coalesce(e.pend->(r.id::text)->>'a', '0')::bigint,
    'fund', (select t.fund from public.town_towns t where t.id = r.town_id), 'log', (select t.fund_log from public.town_towns t where t.id = r.town_id));
end $$;
revoke all on function public.town_econ_view(bigint,text,text) from public;
grant execute on function public.town_econ_view(bigint,text,text) to anon, authenticated;

-- 就地改 town_rent（稅 × 係數、補助 × 係數、結算＋領補差金）與 town_fac（奢侈品價格 × 係數）
do $do$
declare rec record; f record; d text;
begin
  for rec in select * from (values
    ('town_rent', $o$if coalesce(r.items->>'rent','') = day then return r; end if;$o$, $n$if coalesce(r.items->>'rent','') = day then return r; end if;
  perform public.town_econ_tick(r.town_id); r := public.town_econ_claim(r);$n$, $c$town_econ_tick$c$),
    ('town_rent', $o$if r.money < 10000 then$o$, $n$if r.money < public.town_econ_sub_thr(r.town_id) then$n$, $c$town_econ_sub_thr$c$),
    ('town_rent', $o$r.money := r.money + 600;$o$, $n$r.money := r.money + public.town_econ_sub(r.town_id);$n$, $c$town_econ_sub(r.town_id);$c$),
    ('town_rent', $o$' 領到政府今天的生活補助 €600'$o$, $n$' 領到政府今天的生活補助 €' || public.town_econ_sub(r.town_id)$n$, $c$town_econ_sub(r.town_id))$c$),
    ('town_rent', $o$tx := public.town_tax($o$, $n$tx := public.town_tax_k(r.town_id, $n$, $c$town_tax_k$c$),
    ('town_fac', $o$when 'feast' then 3000 when 'trip' then 8000 when 'spa' then 2000 else 0 end;$o$, $n$when 'feast' then public.town_econ_px(r.town_id, 3000) when 'trip' then public.town_econ_px(r.town_id, 8000) when 'spa' then public.town_econ_px(r.town_id, 2000) else 0 end;$n$, $c$town_econ_px$c$)
  ) as t(fname, o, nw, chk) loop
    for f in select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = rec.fname
        and position(rec.o in p.prosrc) > 0 and position(rec.chk in p.prosrc) = 0 loop
      d := replace(pg_get_functiondef(f.oid), rec.o, rec.nw); execute d;
    end loop;
  end loop;
  if exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_rent' and position('town_econ_tick' in p.prosrc) = 0)
     or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_rent' and position('town_tax_k' in p.prosrc) = 0)
     or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'town_fac' and position('town_econ_px' in p.prosrc) = 0) then
    raise exception 'town_rent 或 town_fac 找不到要改的文字，請人工處理';
  end if;
end $do$;

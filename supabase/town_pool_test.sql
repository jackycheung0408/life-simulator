-- 事件池實測：接在 town_pool.sql 之後執行，最後以錯誤訊息 REPORT 回報（交易自動回滾，測試鎮最後也刪掉）。
-- 檢查：1) 池大小；2) 標題重複率；3) 設施池每個選項金錢期望 ≤ 0；4) 抽 1000 次 A 的錢期望值與重複；5) 連抽不重複最近 20 個；6) B 抽 5 個不重複並可執行；7) C 輪詢與選擇；8) 睡覺／入獄擋住、錢不為負。
do $$
declare cr json; ra bigint; rb bigint; tid text; rep text := ''; j json; i int; eid int; o int; ce int[]; ev numeric; worst numeric := 0; r1 public.town_residents; tot numeric := 0; cnt int := 0; dup int := 0; seen int[] := '{}'::int[];
  ids int[]; ttl int; neg boolean := false; sum_m numeric := 0; cm int; tt text; msgs int; tmp jsonb; lastids int[]; clash int := 0; cc int;
begin
  j := public.town_pool(0, 'x', 'stat'); rep := rep||'1) 池大小 '||j::text||E'\n';
  select count(distinct (public.town_pl_ctext(g))[1]||(public.town_pl_ctext(g))[7]), count(*) into ttl, cc from generate_series(2001, 2624) g;
  rep := rep||'2) C 標題不重複 '||ttl||'／'||cc||E'\n';
  for eid in 2001..2624 loop for o in 0..1 loop
    ce := public.town_pl_ceff(eid, o); ev := ce[5]/100.0*ce[3] + (1 - ce[5]/100.0)*ce[8];
    if ev > worst then worst := ev; end if;
  end loop; end loop;
  rep := rep||'3) C 全部選項錢期望的最大值 '||worst||'（期望 ≤ 0）'||E'\n';
  cr := public.town_create('ZZPL','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=90, fun=50, hygiene=90, bladder=90, money=500, items='{}'::jsonb, seen_at=now(), updated_at=now() where id = ra;
  select * into r1 from public.town_residents where id = ra;
  for i in 1..1000 loop
    eid := public.town_pl_pickA(r1, seen[greatest(1, coalesce(array_length(seen,1),0) - 19):coalesce(array_length(seen,1),0)]);
    if eid = any(seen[greatest(1, coalesce(array_length(seen,1),0) - 19):coalesce(array_length(seen,1),0)]) then clash := clash + 1; end if;
    seen := seen || eid;
  end loop;
  rep := rep||'4a) 抽 1000 次 A，與前 20 個重複 '||clash||' 次（期望 0）；不同 id '||(select count(distinct u) from unnest(seen) u)||'／320'||E'\n';
  for i in 1..1000 loop
    update public.town_residents set items = '{}'::jsonb, money = 500, energy = 90, fun = 50 where id = ra;
    j := public.town_pool(ra,'1234','luck');
    if j->>'title' is not null then cnt := cnt + 1; end if;
    select * into r1 from public.town_residents where id = ra; sum_m := sum_m + (r1.money - 500); if r1.money < 0 then neg := true; end if;
  end loop;
  rep := rep||'4b) 1000 次呼叫觸發 '||cnt||' 次，錢淨變化平均每次觸發 '||round(sum_m / greatest(cnt,1), 2)||'（期望 ≤ 0）；錢曾為負 '||neg||E'\n';
  -- 連抽（保留 rc）不重複
  update public.town_residents set items = '{}'::jsonb, energy = 90 where id = ra; lastids := '{}'::int[]; clash := 0;
  for i in 1..60 loop
    update public.town_residents set items = jsonb_set(items, '{pl}', '{}'::jsonb, true), energy = 90, fun = 50 where id = ra;
    j := public.town_pool(ra,'1234','luck');
    if j->>'id' is not null then
      if (j->>'id')::int = any(lastids) then clash := clash + 1; end if;
      lastids := (lastids || (j->>'id')::int); if array_length(lastids,1) > 20 then lastids := lastids[2:21]; end if;
    end if;
  end loop;
  rep := rep||'5) 連抽 60 次與最近 20 個重複 '||clash||' 次（期望 0）'||E'\n';
  -- B 朋友互動
  cr := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (cr->>'resident_id')::bigint;
  if rb is null then rep := rep||'6) 找不到第二位居民，略過 B'||E'\n'; else
    update public.town_residents set place='street', sleeping=false, energy=90, fun=50, money=500, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra, rb);
    j := public.town_pool(ra,'1234','draw', rb);
    rep := rep||'6a) 抽到 '||json_array_length(j->'list')||' 個（期望 5），第一個：'||(j->'list'->0)::text||E'\n';
    eid := ((j->'list'->0)->>'id')::int;
    j := public.town_pool(ra,'1234','do', rb, eid::text); rep := rep||'6b) 執行：'||j::text||E'\n';
    begin j := public.town_pool(ra,'1234','do', rb, eid::text); rep := rep||'6c) 重複執行沒被擋（錯）'||E'\n'; exception when others then rep := rep||'6c) 重複執行被擋：'||SQLERRM||E'\n'; end;
    update public.town_residents set sleeping = true where id = rb;
    begin j := public.town_pool(ra,'1234','draw', rb); rep := rep||'6d) 對方睡著沒被擋（錯）'||E'\n'; exception when others then rep := rep||'6d) 對方睡著被擋：'||SQLERRM||E'\n'; end;
    update public.town_residents set sleeping = false where id = rb;
    -- B 全池錢期望：只有花錢（bfx[4] >= 0）
    rep := rep||'6e) B 全池最小花費 '||(select min((public.town_pl_bfx(g))[4]) from generate_series(1001,1120) g)||'（期望 ≥ 0）'||E'\n';
  end if;
  -- C 設施
  update public.town_residents set place='cafe', sleeping=false, items='{}'::jsonb, energy=90, fun=50, money=500 where id = ra;
  j := public.town_pool(ra,'1234','fpoll'); rep := rep||'7a) 進咖啡廳第一次 poll：'||j::text||'（期望 ev null）'||E'\n';
  update public.town_residents set items = jsonb_set(items, '{pe,nx}', to_jsonb(now() - interval '1 minute')) where id = ra;
  j := public.town_pool(ra,'1234','fpoll'); rep := rep||'7b) 到時間 poll：'||j::text||E'\n';
  if j->'ev' is not null and j->>'ev' <> '' then
    j := public.town_pool(ra,'1234','fpick','0'); rep := rep||'7c) 選 A：'||j::text||E'\n';
    begin j := public.town_pool(ra,'1234','fpick','0'); rep := rep||'7d) 重選沒被擋（錯）'||E'\n'; exception when others then rep := rep||'7d) 重選被擋：'||SQLERRM||E'\n'; end;
  end if;
  update public.town_residents set sleeping = true where id = ra;
  begin j := public.town_pool(ra,'1234','luck'); rep := rep||'8a) 睡覺沒被擋（錯）'||E'\n'; exception when others then rep := rep||'8a) 睡覺被擋：'||SQLERRM||E'\n'; end;
  update public.town_residents set sleeping = false, items = jsonb_set(items, '{jl}', to_jsonb(now() + interval '1 hour')::jsonb, true) where id = ra;
  begin j := public.town_pool(ra,'1234','luck'); rep := rep||'8b) 入獄沒被擋（錯）'||E'\n'; exception when others then rep := rep||'8b) 入獄被擋：'||SQLERRM||E'\n'; end;
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

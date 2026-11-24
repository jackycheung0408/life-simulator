-- 小豬鎮：壓測（回滾交易內，單連線；不寫入正式站——整段最後 rollback，結果在錯誤訊息 REPORT）。
-- 建 9 個測試鎮 × 12 人（每鎮上限 12 人）= 108 人，每人帶約 3～4KB 的 items（背包、收藏、冷卻、賭場等），
-- 量各 RPC 單次平均／最大耗時（ms）與 town_state 回傳大小。只測單連線 CPU，測不到鎖競爭。
-- SQL Editor 約 60 秒逾時，次數別加大；跑完看 REPORT。
do $$
declare
  rep text := ''; t text; i int; k int; rid bigint; rids bigint[] := '{}'; first_rid bigint;
  t0 timestamptz; ms numeric; mx numeric; sm numeric; j json; sz int; szs int; reps int := 20; r public.town_residents; ec int; bigitems jsonb; inv jsonb := '{}'::jsonb; cl jsonb := '{}'::jsonb; cd jsonb := '{}'::jsonb;
begin
  for i in 1..30 loop inv := inv || jsonb_build_object('g'||i, i); cl := cl || jsonb_build_object('c'||lpad(i::text,2,'0'), i); cd := cd || jsonb_build_object('f_act'||i, extract(epoch from now())::bigint); end loop;
  bigitems := jsonb_build_object('inv', inv, 'cl', cl, 'cd', cd, 'works', 120, 'f', '["bed","fridge","sofa","tv"]'::jsonb,
    'fp', '[["bed",1,1],["fridge",3,1],["sofa",5,1],["tv",7,1]]'::jsonb, 'al', jsonb_build_object('n',30,'s',5,'d','2026-11-24'),
    'cas', jsonb_build_object('ch', 100000, 'bh', (select jsonb_agg('PBT'::text) from generate_series(1,72))),
    'sp', '{"whack":30,"memory":80}'::jsonb, 'at', '{"st":3,"ag":3,"ch":3,"iq":3,"lk":3,"p":4}'::jsonb, 'fi', 'casino',
    'titles', (select jsonb_agg('稱號'||g) from generate_series(1,8) g));
  for i in 0..8 loop
    t := 'ZZSTR' || i;
    insert into public.town_towns(id, name, invite) values (t, '壓測鎮' || i, 'ZZSTRI' || i) on conflict do nothing;
    for k in 0..11 loop
      insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items)
        values (t,'測'||i||'_'||k,500000,k,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),bigitems) returning id into rid;
      rids := rids || rid;
      if first_rid is null then first_rid := rid; end if;
    end loop;
  end loop;
  select pg_column_size(items) into sz from public.town_residents where id = first_rid;
  rep := rep || 'residents=' || array_length(rids,1) || '  items bytes(pg)=' || sz || E'\n';

  -- town_state（12 人一鎮）
  sm := 0; mx := 0; ec := 0;
  for i in 1..reps loop
    t0 := clock_timestamp();
    begin j := public.town_state('ZZSTR0'); exception when others then ec := ec + 1; end;
    ms := extract(epoch from clock_timestamp() - t0) * 1000; sm := sm + ms; mx := greatest(mx, ms);
  end loop;
  szs := length(j::text);
  rep := rep || 'town_state x' || reps || ' avg=' || round(sm/reps,1) || 'ms max=' || round(mx,1) || 'ms errors=' || ec || ' payload_bytes=' || coalesce(szs,0) || E'\n';
  -- 回傳大小隨人數：1、4、8、12 人（看 residents 陣列 bytes）
  rep := rep || 'residents[] bytes=' || length((j->'residents')::text) || ' (per person ~' || (length((j->'residents')::text)/12) || ')  events bytes=' || length((j->'events')::text) || E'\n';

  -- town_act（nap：在街上會被擋也算一次完整呼叫成本；混合 tv）
  sm := 0; mx := 0; ec := 0;
  for i in 1..reps loop
    t0 := clock_timestamp();
    begin perform public.town_act(rid => rids[1 + (i % 12)], pin => 'x', act => 'thank', target => rids[1 + ((i+1) % 12)]); exception when others then ec := ec + 1; end;
    ms := extract(epoch from clock_timestamp() - t0) * 1000; sm := sm + ms; mx := greatest(mx, ms);
  end loop;
  rep := rep || 'town_act(thank) x' || reps || ' avg=' || round(sm/reps,1) || 'ms max=' || round(mx,1) || 'ms errors(含規則擋)=' || ec || E'\n';

  -- town_casino（骰寶 50）
  sm := 0; mx := 0; ec := 0;
  for i in 1..reps loop
    t0 := clock_timestamp();
    begin perform public.town_casino(rids[1 + (i % 12)], 'x', 'dice', 50, 'big'); exception when others then ec := ec + 1; end;
    ms := extract(epoch from clock_timestamp() - t0) * 1000; sm := sm + ms; mx := greatest(mx, ms);
  end loop;
  rep := rep || 'town_casino(dice) x' || reps || ' avg=' || round(sm/reps,1) || 'ms max=' || round(mx,1) || 'ms errors=' || ec || E'\n';

  -- town_rank
  sm := 0; mx := 0; ec := 0;
  for i in 1..reps loop
    t0 := clock_timestamp();
    begin j := public.town_rank(rids[1], 'x'); exception when others then ec := ec + 1; end;
    ms := extract(epoch from clock_timestamp() - t0) * 1000; sm := sm + ms; mx := greatest(mx, ms);
  end loop;
  rep := rep || 'town_rank x' || reps || ' avg=' || round(sm/reps,1) || 'ms max=' || round(mx,1) || 'ms errors=' || ec || ' bytes=' || coalesce(length(j::text),0) || E'\n';

  -- town_tick（updated_at 設一小時前，每次都要真的結算）
  sm := 0; mx := 0; ec := 0;
  for i in 1..reps loop
    update public.town_residents set updated_at = now() - interval '1 hour', place = 'street', items = items - 'fi' where id = rids[1 + (i % 12)];
    select * into r from public.town_residents where id = rids[1 + (i % 12)];
    t0 := clock_timestamp();
    begin perform public.town_tick(r); exception when others then ec := ec + 1; end;
    ms := extract(epoch from clock_timestamp() - t0) * 1000; sm := sm + ms; mx := greatest(mx, ms);
  end loop;
  rep := rep || 'town_tick x' || reps || ' avg=' || round(sm/reps,1) || 'ms max=' || round(mx,1) || 'ms errors=' || ec || E'\n';

  -- 估算：每鎮 town_state 會對 12 人各 UPDATE 一次，12 人同時在線每 15 秒 poll 一次 ⇒ 每鎮每秒約 0.8 次 state。
  rep := rep || '估算：若 town_state avg=X ms，100 鎮同時在線（1200 人）每 15 秒 1200 次 ⇒ 80 次/秒 × X ms（單核）。';
  raise exception 'REPORT%', E'\n' || rep;
end $$;

do $$
declare cr json; rid bigint; rep text := ''; g json; i int; tot numeric; bet int := 100; n int; w int; e text; r public.town_residents; cnt int[]; k int; nm text;
begin
  cr := public.town_create('ZZARC','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false, items='{}'::jsonb where id = rid;
  -- 期望值模擬（每局重設局數、補錢）
  foreach nm in array array['dice:big','dice:small','dice:3','slots:','bingo:1,5,9','rps:r','wheel:','hl:hi'] loop
    tot := 0; n := case when split_part(nm,':',1)='slots' then 12000 else 5000 end;
    for i in 1..n loop
      update public.town_residents set money=100000, items=items - 'games' - 'hl' where id = rid;
      if split_part(nm,':',1)='hl' then
        g := public.town_game(rid,'1234','hl_start',bet); g := public.town_game(rid,'1234','hl_guess',bet,'hi');
      else
        g := public.town_game(rid,'1234',split_part(nm,':',1),bet,nullif(split_part(nm,':',2),''));
      end if;
      tot := tot + coalesce((g->'game'->>'win')::int,0);
    end loop;
    rep := rep || nm || ' RTP=' || round(tot/(n*bet),4) || ' n='||n||E'\n';
  end loop;
  -- 21 點：基本策略（<17 要牌）模擬 + 花色檢查
  tot := 0; n := 4000; cnt := array[0,0,0,0,0];
  for i in 1..n loop
    update public.town_residents set money=100000, items=items - 'games' - 'bj' where id = rid;
    g := public.town_game(rid,'1234','bj_start',bet);
    k := (g->'game'->'p'->>0)::int / 100; cnt[k+1] := cnt[k+1] + 1;
    while not (g->'game'->>'done')::boolean loop
      if public.town_bj_total((g->'game'->'p')::jsonb) < 17 then g := public.town_game(rid,'1234','bj_hit'); else g := public.town_game(rid,'1234','bj_stand'); end if;
    end loop;
    tot := tot + coalesce((g->'game'->>'win')::int,0);
  end loop;
  rep := rep || 'bj(<17 hit) RTP=' || round(tot/(n*bet),4) || ' suits first card (0=none,1S,2H,3D,4C)=' || cnt::text || E'\n';
  -- 舊格式相容
  update public.town_residents set money=1000, items='{"hl":{"bet":100,"card":7}}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','hl_guess',0,'hi'); rep := rep || 'old hl: ' || g::text || E'\n';
  update public.town_residents set money=1000, items='{"bj":{"bet":100,"p":[10,6],"d":[9]}}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','bj_hit'); rep := rep || 'old bj hit: ' || g::text || E'\n';
  update public.town_residents set items=jsonb_set(items,'{bj}','{"bet":100,"p":[10,9],"d":[9]}'::jsonb) where id = rid;
  g := public.town_game(rid,'1234','bj_stand'); rep := rep || 'old bj stand (mixed old/new dealer): ' || g::text || E'\n';
  -- 押注與局數上限
  update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
  foreach w in array array[49,1001,-5] loop
    begin perform public.town_game(rid,'1234','slots',w); rep := rep||'bet '||w||' ALLOWED'||E'\n'; exception when others then rep := rep||'bet '||w||': '||sqlerrm||E'\n'; end;
  end loop;
  update public.town_residents set items='{}'::jsonb where id = rid;
  for i in 1..40 loop perform public.town_game(rid,'1234','dice',50,'big'); end loop;
  foreach nm in array array['dice','slots','bingo'] loop
    begin perform public.town_game(rid,'1234',nm,50,case nm when 'dice' then 'big' when 'bingo' then '1,2,3' else null end); rep := rep||'41st '||nm||' ALLOWED'||E'\n'; exception when others then rep := rep||'41st '||nm||': '||sqlerrm||E'\n'; end;
  end loop;
  update public.town_residents set items='{}'::jsonb where id = rid;
  foreach nm in array array['dice:7','dice:','bingo:1,1,2','bingo:1,2','bingo:0,1,2','bingo:1,2,11','bingo:a,b,c','hl_bad:'] loop
    begin perform public.town_game(rid,'1234',split_part(nm,':',1),50,nullif(split_part(nm,':',2),'')); rep := rep||'bad '||nm||' ALLOWED'||E'\n'; exception when others then rep := rep||'bad '||nm||': '||sqlerrm||E'\n'; end;
  end loop;
  -- 單機分數
  update public.town_residents set items='{}'::jsonb, fun=50 where id = rid;
  g := public.town_score(rid,'1234','whack',25); rep := rep||'score whack 25: '||g::text||E'\n';
  g := public.town_score(rid,'1234','whack',10); rep := rep||'score whack 10 (best stays): '||g::text||E'\n';
  select * into r from public.town_residents where id = rid; rep := rep||'items.sp='||(r.items->'sp')::text||' fun='||r.fun||' money='||r.money||E'\n';
  foreach w in array array[41,-1,100000] loop
    begin perform public.town_score(rid,'1234','whack',w); rep := rep||'whack '||w||' ALLOWED'||E'\n'; exception when others then rep := rep||'whack '||w||': '||sqlerrm||E'\n'; end;
  end loop;
  g := public.town_score(rid,'1234','memory',100); rep := rep||'memory 100: '||g::text||E'\n';
  begin perform public.town_score(rid,'1234','memory',101); rep := rep||'memory 101 ALLOWED'||E'\n'; exception when others then rep := rep||'memory 101: '||sqlerrm||E'\n'; end;
  begin perform public.town_score(rid,'1234','xx',1); rep := rep||'xx ALLOWED'||E'\n'; exception when others then rep := rep||'xx: '||sqlerrm||E'\n'; end;
  -- 地點不對、鎮長關街機
  update public.town_residents set place='park' where id = rid;
  begin perform public.town_score(rid,'1234','whack',5); rep := rep||'park score ALLOWED'||E'\n'; exception when others then rep := rep||'park score: '||sqlerrm||E'\n'; end;
  begin perform public.town_game(rid,'1234','dice',50,'big'); rep := rep||'park dice ALLOWED'||E'\n'; exception when others then rep := rep||'park dice: '||sqlerrm||E'\n'; end;
  update public.town_residents set place='plaza' where id = rid;
  update public.town_towns set off = array['arcade'] where id = 'ZZARC';
  foreach nm in array array['dice:big','slots:','bingo:1,2,3'] loop
    begin perform public.town_game(rid,'1234',split_part(nm,':',1),50,nullif(split_part(nm,':',2),'')); rep := rep||'off '||nm||' ALLOWED'||E'\n'; exception when others then rep := rep||'off '||nm||': '||sqlerrm||E'\n'; end;
  end loop;
  begin perform public.town_score(rid,'1234','whack',5); rep := rep||'off score ALLOWED'||E'\n'; exception when others then rep := rep||'off score: '||sqlerrm||E'\n'; end;
  raise exception E'REPORT\n%', rep;
end $$;

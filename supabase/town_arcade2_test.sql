-- 街機第二批實測（接在 town.sql、town_arcade2.sql 之後貼上，最後 rollback，結果在錯誤訊息 REPORT）
do $$
declare cr json; rid bigint; rep text := ''; g json; i int; tot numeric; bet int := 100; n int; nm text; a int; neg int := 0; ties int := 0; cnt int[];
begin
  cr := public.town_create('ZZARC2','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false, items='{}'::jsonb where id = rid;
  -- 百家樂：三種押法 RTP（理論 閒 0.9877／莊 0.9894／和 0.8588），並檢查和局退注
  foreach nm in array array['p','b','t'] loop
    tot := 0; n := 3000; ties := 0;
    for i in 1..n loop
      update public.town_residents set money=100000 where id = rid;
      g := public.town_game2(rid,'1234','bacc',bet,nm); tot := tot + (g->'game'->>'win')::int;
      if (g->'game'->>'pt') = (g->'game'->>'bt') then ties := ties + 1; if nm <> 't' and (g->'game'->>'win')::int <> bet then rep := rep || 'TIE NOT REFUNDED'||E'\n'; end if; end if;
    end loop;
    rep := rep || 'bacc '||nm||' RTP='||round(tot/(n*bet),4)||' ties='||ties||E'\n';
  end loop;
  -- 射龍門：重複發牌，各種龍門都試；放棄不扣錢；相鄰自動放棄；撞柱扣 2 倍
  tot := 0; n := 0; neg := 0;
  for i in 1..1500 loop
    update public.town_residents set money=100000 where id = rid;
    g := public.town_game2(rid,'1234','dg_start');
    if (g->'game'->>'abandon')::boolean then
      if (select money from public.town_residents where id=rid) <> 100000 then rep := rep||'ABANDON CHARGED'||E'\n'; end if; continue;
    end if;
    if i % 7 = 0 then g := public.town_game2(rid,'1234','dg_play',0,'pass'); if (select money from public.town_residents where id=rid) <> 100000 then rep := rep||'PASS CHARGED'||E'\n'; end if; continue; end if;
    g := public.town_game2(rid,'1234','dg_play',bet,case when (g->'game'->>'same')::boolean then (case when (g->'game'->'gates'->>0)::int % 100 >= 7 then 'lo' else 'hi' end) else 'in' end);
    n := n + 1; tot := tot + (g->'game'->>'win')::int - (g->'game'->>'pen')::int;
    if (g->'game'->>'hit')::boolean and (g->'game'->>'pen')::int <> bet then rep := rep||'PILLAR PEN WRONG'||E'\n'; end if;
  end loop;
  rep := rep||'dg played='||n||' avg RTP='||round(1+tot/(n*bet)-1,4)||' (含撞柱多扣，理論每種龍門 <= 0.96)'||E'\n';
  -- 射龍門：現金不足押注 2 倍要被擋；沒先發牌要被擋；押注範圍
  update public.town_residents set money=150, items='{}'::jsonb where id = rid;
  begin perform public.town_game2(rid,'1234','dg_play',100,'in'); rep := rep||'no gates ALLOWED'||E'\n'; exception when others then rep := rep||'no gates: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','dg_play',100,'in'); exception when others then null; end;
  begin perform public.town_game2(rid,'1234','bacc',49,'p'); rep := rep||'bet 49 ALLOWED'||E'\n'; exception when others then rep := rep||'bet 49: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','bacc',1001,'p'); rep := rep||'bet 1001 ALLOWED'||E'\n'; exception when others then rep := rep||'bet 1001: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','niu',100); rep := rep||'niu need 2x ALLOWED'||E'\n'; exception when others then rep := rep||'niu 150 money bet 100: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=40 where id = rid;
  begin perform public.town_game2(rid,'1234','bacc',50,'p'); rep := rep||'broke ALLOWED'||E'\n'; exception when others then rep := rep||'broke: '||sqlerrm||E'\n'; end;
  -- 妞妞：理論 RTP 1.000（贏妞妞 ×3、輸妞妞賠 2 倍）；錢不變負、不限局數連玩 60 局
  tot := 0; n := 4000; neg := 0; cnt := array[0,0,0,0,0,0,0,0,0,0,0];
  for i in 1..n loop
    update public.town_residents set money=100000 where id = rid;
    g := public.town_game2(rid,'1234','niu',bet);
    tot := tot + (g->'game'->>'win')::int - (g->'game'->>'pen')::int;
    cnt[(g->'game'->>'pcl')::int + 1] := cnt[(g->'game'->>'pcl')::int + 1] + 1;
  end loop;
  rep := rep||'niu RTP='||round(tot/(n*bet),4)||' player class dist (0..10)='||cnt::text||E'\n';
  update public.town_residents set money=3000 where id = rid; neg := 0;
  for i in 1..60 loop
    begin
      g := public.town_game2(rid,'1234',(array['bacc','niu'])[1+i%2],bet,'b');
    exception when others then
      update public.town_residents set money=3000 where id = rid;
    end;
    if (select money from public.town_residents where id=rid) < 0 then neg := neg + 1; end if;
  end loop;
  rep := rep||'60 games negative money count='||neg||E'\n';
  -- 舊 town_game 仍可連玩超過 40 局
  update public.town_residents set money=1000000, items='{}'::jsonb where id = rid;
  for i in 1..60 loop g := public.town_game(rid,'1234','rps',50,'r'); end loop; rep := rep||'town_game 60 rounds ok'||E'\n';
  update public.town_towns set off = array['arcade'] where id = (select town_id from public.town_residents where id = rid);
  begin perform public.town_game2(rid,'1234','bacc',50,'p'); rep := rep||'off ALLOWED'||E'\n'; exception when others then rep := rep||'off: '||sqlerrm||E'\n'; end;
  raise exception E'REPORT\n%', rep;
end $$;

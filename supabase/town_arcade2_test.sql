-- 街機第二批實測（接在 town.sql、town_arcade2.sql 之後貼上，最後 rollback，結果在錯誤訊息 REPORT）
do $$
declare cr json; rid bigint; rep text := ''; g json; i int; tot numeric; bet int := 100; n int; nm text; a int; neg int := 0; ties int := 0; cnt int[];
begin
  cr := public.town_create('ZZARC2','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false, items='{}'::jsonb where id = rid;
  -- 百家樂：三種押法 RTP（理論 閒 0.9877／莊 0.9894／和 0.8588），並檢查和局退注
  foreach nm in array array['p','b','t'] loop
    tot := 0; n := 500; ties := 0;
    for i in 1..n loop
      update public.town_residents set money=100000 where id = rid;
      g := public.town_game2(rid,'1234','bacc',bet,nm); tot := tot + (g->'game'->>'win')::int;
      if (g->'game'->>'pt') = (g->'game'->>'bt') then ties := ties + 1; if nm <> 't' and (g->'game'->>'win')::int <> bet then rep := rep || 'TIE NOT REFUNDED'||E'\n'; end if; end if;
    end loop;
    rep := rep || 'bacc '||nm||' RTP='||round(tot/(n*bet),4)||' ties='||ties||E'\n';
  end loop;
  -- 射龍門（入場費 50、自訂押注、單注上限 800、贏的抽 5%）：最佳策略 W>=8 押 800、其餘放棄，理論回報率 0.957、每手淨 -9.26
  update public.town_residents set money=1000000, items='{}'::jsonb where id = rid;
  tot := 0; n := 0; neg := 0; cnt := array[0,0];
  for i in 1..500 loop
    update public.town_residents set money=1000000 where id = rid;
    update public.town_pots set amt = 50000, last_tick = now() where town_id = (select town_id from public.town_residents where id=rid);
    g := public.town_game2(rid,'1234','dg_start',0);
    a := (g->'game'->'gates'->>1)::int % 100 - (g->'game'->'gates'->>0)::int % 100;
    if a = 1 then rep := rep||'ADJACENT NOT REDEALT'||E'\n'; end if;
    if (select money from public.town_residents where id=rid) <> 1000000 - 50 then rep := rep||'ENTRY FEE WRONG'||E'\n'; end if;
    n := n + 1;
    if a = 0 then nm := case when (g->'game'->'gates'->>0)::int % 100 >= 7 then 'lo' else 'hi' end; a := greatest(13-(g->'game'->'gates'->>0)::int % 100, (g->'game'->'gates'->>0)::int % 100 - 1);
    else nm := 'in'; a := a - 1; end if;
    if a < 8 then
      g := public.town_game2(rid,'1234','dg_play',0,'pass');
      if (select money from public.town_residents where id=rid) <> 1000000 - 50 then rep := rep||'PASS CHARGED MORE THAN ENTRY'||E'\n'; end if;
    else
      g := public.town_game2(rid,'1234','dg_play',800,nm); cnt[2] := cnt[2] + 1;
    end if;
    cnt[1] := cnt[1] + 50 + case when a >= 8 then 800 else 0 end;
    tot := tot + (select money from public.town_residents where id=rid) - 1000000;
    if (select amt from public.town_pots where town_id=(select town_id from public.town_residents where id=rid)) < 0 then neg := neg + 1; end if;
  end loop;
  rep := rep||'dg best-policy RTP='||round(1 + tot/cnt[1]::numeric,4)||' (理論 0.957，樣本 500 手、標準差約 0.1) played='||cnt[2]||' neg pot='||neg||E'\n';
  -- 抽成：贏一手押 100，鎮基金 +5、玩家實拿 95
  update public.town_towns set fund = 0 where id = (select town_id from public.town_residents where id=rid);
  for i in 1..60 loop
    update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
    g := public.town_game2(rid,'1234','dg_start',0);
    if (g->'game'->>'same')::boolean then g := public.town_game2(rid,'1234','dg_play',0,'pass'); continue; end if;
    g := public.town_game2(rid,'1234','dg_play',100,'in');
    if (g->'game'->>'win')::boolean then
      rep := rep||'win net='||(g->'game'->>'net')||' fund='||(select fund from public.town_towns where id=(select town_id from public.town_residents where id=rid))||E'\n'; exit;
    end if;
  end loop;
  -- 自訂金額範圍：49、801 被擋；超過彩池被擋；現金 ÷ 3 被擋
  update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
  update public.town_pots set amt = 500, last_tick = now() where town_id = (select town_id from public.town_residents where id=rid);
  g := public.town_game2(rid,'1234','dg_start',0);
  rep := rep||'maxBet info='||(g->'game'->>'maxBet')||' why='||(g->'game'->>'why')||E'\n';
  begin perform public.town_game2(rid,'1234','dg_play',49,'in'); rep := rep||'bet 49 ALLOWED'||E'\n'; exception when others then rep := rep||'dg bet 49: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','dg_play',801,'in'); rep := rep||'bet 801 ALLOWED'||E'\n'; exception when others then rep := rep||'dg bet 801: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','dg_play',700,'in'); rep := rep||'bet>pot ALLOWED'||E'\n'; exception when others then rep := rep||'dg bet 700 pot ~550: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=300 where id = rid;
  begin perform public.town_game2(rid,'1234','dg_play',150,'in'); rep := rep||'cash<3x ALLOWED'||E'\n'; exception when others then rep := rep||'dg cash 300 bet 150: '||sqlerrm||E'\n'; end;
  g := public.town_game2(rid,'1234','dg_play',0,'pass'); rep := rep||'pass ok'||E'\n';
  -- 加碼（惰性，每 10 分鐘 +10%，最多 144 步，封頂 100000、種子下限 3000、加碼不進基金）
  update public.town_towns set fund = 0 where id = (select town_id from public.town_residents where id=rid);
  update public.town_pots set amt = 3000, last_tick = now() - interval '25 minutes' where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'tick 2 steps from 3000 (expect 3630): '||public.town_pot_get((select town_id from public.town_residents where id=rid))||E'\n';
  update public.town_pots set amt = 3000, last_tick = now() - interval '48 hours' where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'tick 144 steps (expect 100000 cap): '||public.town_pot_get((select town_id from public.town_residents where id=rid))||' fund='||(select fund from public.town_towns where id=(select town_id from public.town_residents where id=rid))||' (expect 0)'||E'\n';
  update public.town_pots set amt = 1000, last_tick = now() - interval '11 minutes' where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'tick floor 3000 then +10% (expect 3300): '||public.town_pot_get((select town_id from public.town_residents where id=rid))||E'\n';
  update public.town_pots set amt = 100000, last_tick = now() - interval '11 minutes' where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'tick at cap stays 100000: '||public.town_pot_get((select town_id from public.town_residents where id=rid))||E'\n';
  update public.town_pots set amt = 99999, last_tick = now() where town_id = (select town_id from public.town_residents where id=rid);
  perform public.town_pot_add((select town_id from public.town_residents where id=rid), 5000);
  rep := rep||'pot cap: '||(select amt from public.town_pots where town_id=(select town_id from public.town_residents where id=rid))||' fund='||(select fund from public.town_towns where id=(select town_id from public.town_residents where id=rid))||' (expect 4999)'||E'\n';
  update public.town_residents set money=40, items='{}'::jsonb where id = rid;
  begin perform public.town_game2(rid,'1234','dg_start',0); rep := rep||'entry broke ALLOWED'||E'\n'; exception when others then rep := rep||'entry money 40: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=100000 where id = rid;
  begin perform public.town_game2(rid,'1234','dg_play',100,'in'); rep := rep||'no gates ALLOWED'||E'\n'; exception when others then rep := rep||'no gates: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','bacc',49,'p'); rep := rep||'bet 49 ALLOWED'||E'\n'; exception when others then rep := rep||'bet 49: '||sqlerrm||E'\n'; end;
  begin perform public.town_game2(rid,'1234','bacc',1001,'p'); rep := rep||'bet 1001 ALLOWED'||E'\n'; exception when others then rep := rep||'bet 1001: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=150, items='{}'::jsonb where id = rid;
  begin perform public.town_game2(rid,'1234','niu',100); rep := rep||'niu need 3x ALLOWED'||E'\n'; exception when others then rep := rep||'niu 150 money bet 100: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=40 where id = rid;
  begin perform public.town_game2(rid,'1234','bacc',50,'p'); rep := rep||'broke ALLOWED'||E'\n'; exception when others then rep := rep||'broke: '||sqlerrm||E'\n'; end;
  -- 妞妞：理論 RTP 0.9824（莊家優勢：沒妞且最大牌 < Q 無條件輸；平手 2.37% 退注）；錢不變負、不限局數連玩 60 局
  tot := 0; n := 600; neg := 0; cnt := array[0,0,0,0,0,0,0,0,0,0,0];
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

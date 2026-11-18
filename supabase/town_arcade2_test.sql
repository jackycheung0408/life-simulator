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
  -- 射龍門第六版（彩池從 0、玩家輸的錢累積、無系統加碼）：先看一個新鎮的彩池
  update public.town_residents set money=1000000, items='{}'::jsonb where id = rid;
  delete from public.town_pots where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'new pot (expect 0): '||public.town_pot_get((select town_id from public.town_residents where id=rid))||E'\n';
  g := public.town_game2(rid,'1234','dg_start',0);
  rep := rep||'after entry: pot='||(g->'game'->>'pot')||' (expect 50) maxBet='||(g->'game'->>'maxBet')||' (expect 0, 自己的入場費不能押回來) why='||(g->'game'->>'why')||E'\n';
  begin perform public.town_game2(rid,'1234','dg_play',50,case when (g->'game'->>'same')::boolean then 'lo' else 'in' end); rep := rep||'EMPTY POOL BET ALLOWED'||E'\n'; exception when others then rep := rep||'empty pool bet: '||sqlerrm||E'\n'; end;
  g := public.town_game2(rid,'1234','dg_play',0,'pass'); rep := rep||'pass ok, pot='||(g->'game'->>'pot')||E'\n';
  -- 最佳策略 W>=8 押 800、其餘放棄（彩池手動設 50000 讓大注可下），理論每手淨 -9.3；輸家的錢進池、贏家只拿池內的錢
  tot := 0; n := 0; neg := 0; cnt := array[0,0];
  for i in 1..300 loop
    update public.town_residents set money=1000000 where id = rid;
    update public.town_pots set amt = 50000 where town_id = (select town_id from public.town_residents where id=rid);
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
  rep := rep||'dg best-policy RTP='||round(1 + tot/cnt[1]::numeric,4)||' (理論 0.957，樣本 300 手、標準差約 0.12) played='||cnt[2]||' neg pot='||neg||E'\n';
  -- 零和檢查：玩家總損益 = -(彩池變化 + 鎮基金變化)（鎮基金只收 5% 抽成）
  update public.town_towns set fund = 0 where id = (select town_id from public.town_residents where id=rid);
  update public.town_pots set amt = 5000 where town_id = (select town_id from public.town_residents where id=rid);
  update public.town_residents set money=1000000, items='{}'::jsonb where id = rid;
  for i in 1..40 loop
    g := public.town_game2(rid,'1234','dg_start',0);
    if (g->'game'->>'same')::boolean then g := public.town_game2(rid,'1234','dg_play',100,'lo'); else g := public.town_game2(rid,'1234','dg_play',100,'in'); end if;
  end loop;
  rep := rep||'zero-sum: player money change='||((select money from public.town_residents where id=rid)-1000000)||' pot change='||((select amt from public.town_pots where town_id=(select town_id from public.town_residents where id=rid))-5000)||' fund='||(select fund from public.town_towns where id=(select town_id from public.town_residents where id=rid))||' (expect money+pot+fund = 0)'||E'\n';
  -- 大注可下（彩池 60000、現金 300000 押 20000）；超過可押池被擋
  update public.town_residents set money=300000, items='{}'::jsonb where id = rid;
  update public.town_pots set amt = 60000 where town_id = (select town_id from public.town_residents where id=rid);
  g := public.town_game2(rid,'1234','dg_start',0);
  rep := rep||'big info maxBet='||(g->'game'->>'maxBet')||' why='||(g->'game'->>'why')||' (expect 60000 pot)'||E'\n';
  begin perform public.town_game2(rid,'1234','dg_play',60050,case when (g->'game'->>'same')::boolean then 'lo' else 'in' end); rep := rep||'bet>pot ALLOWED'||E'\n'; exception when others then rep := rep||'dg bet 60050 > 可押池: '||sqlerrm||E'\n'; end;
  g := public.town_game2(rid,'1234','dg_play',20000,case when (g->'game'->>'same')::boolean then (case when (g->'game'->'gates'->>0)::int % 100 >= 7 then 'lo' else 'hi' end) else 'in' end);
  rep := rep||'big bet 20000 ok net='||(g->'game'->>'net')||' pot='||(g->'game'->>'pot')||E'\n';
  -- 低於 50 被擋；現金 ÷ 3 被擋
  update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
  update public.town_pots set amt = 5000 where town_id = (select town_id from public.town_residents where id=rid);
  g := public.town_game2(rid,'1234','dg_start',0);
  begin perform public.town_game2(rid,'1234','dg_play',49,'in'); rep := rep||'bet 49 ALLOWED'||E'\n'; exception when others then rep := rep||'dg bet 49: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=300 where id = rid;
  begin perform public.town_game2(rid,'1234','dg_play',150,'in'); rep := rep||'cash<3x ALLOWED'||E'\n'; exception when others then rep := rep||'dg cash 300 bet 150: '||sqlerrm||E'\n'; end;
  g := public.town_game2(rid,'1234','dg_play',0,'pass'); rep := rep||'pass ok'||E'\n';
  -- 沒有加碼：把時間往前撥也不會變（欄位已移除，餘額不變）
  update public.town_pots set amt = 777 where town_id = (select town_id from public.town_residents where id=rid);
  rep := rep||'no tick (expect 777): '||public.town_pot_get((select town_id from public.town_residents where id=rid))||E'\n';
  update public.town_pots set amt = 99999 where town_id = (select town_id from public.town_residents where id=rid);
  update public.town_towns set fund = 0 where id = (select town_id from public.town_residents where id=rid);
  perform public.town_pot_add((select town_id from public.town_residents where id=rid), 5000);
  rep := rep||'pot cap: '||(select amt from public.town_pots where town_id=(select town_id from public.town_residents where id=rid))||' fund='||(select fund from public.town_towns where id=(select town_id from public.town_residents where id=rid))||' (expect 100000 / 4999)'||E'\n';
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

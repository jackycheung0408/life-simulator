-- 小豬賭場 21 點擬真規則回滾實測：結果在錯誤訊息 REPORT。接在 town_bj2.sql 之後貼上，全部回滾。
-- 直接呼叫 town_cgame（設旗標 town.casino=1，居民 money 當籌碼）。確定性場景用手動塞 items.bj；樣本小只看趨勢（理論最佳策略 0.9927）。
do $$
declare t text := 'ZZBJ2'; a bigint; rep text := ''; g jsonb; i int; n int; ret numeric; m0 bigint; bad int := 0; wag numeric; tot int; k int; act text; up int;
  pbj int := 0; dbj int := 0; bothbj int := 0; pbjwin numeric := 0; st jsonb;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZBJ2') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{}'::jsonb) returning id into a;
  perform set_config('town.casino','1',true);
  -- 1) 確定性：停牌 20 vs 莊家 10＋7 = 17 贏 2 倍
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(110),'h',107,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(110,210),'b',100)))) where id = a;
  g := (public.town_cgame(a,'x','bj_stand',0,null))::jsonb->'game'; rep := rep || ' 停20贏=' || (g->>'win') || '／押' || (g->>'bet') || '（200／100）';
  -- 2) 加倍：籌碼夠，押注變 200、結束、錢不為負
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(105,206),'b',100)))) where id = a;
  g := (public.town_cgame(a,'x','bj_double',0,null))::jsonb->'game'; rep := rep || ' 加倍押=' || (g->>'bet') || ' done=' || (g->>'done') || '（200 true）';
  select money into m0 from public.town_residents where id = a; rep := rep || ' 錢=' || m0 || '（扣100再加贏，最少9900）';
  -- 3) 加倍籌碼不夠被擋；三張牌不能加倍
  update public.town_residents set money = 50, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(105,206),'b',100)))) where id = a;
  begin perform public.town_cgame(a,'x','bj_double',0,null); rep := rep || ' 籌碼不夠加倍=沒擋'; exception when others then rep := rep || ' 籌碼不夠加倍=擋'; end;
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(102,203,204),'b',100)))) where id = a;
  begin perform public.town_cgame(a,'x','bj_double',0,null); rep := rep || ' 三張加倍=沒擋'; exception when others then rep := rep || ' 三張加倍=擋'; end;
  -- 4) 分牌：非對子擋；籌碼不夠擋；對子成功變 2 手、押注 200；分 A 兩手都結束
  begin perform public.town_cgame(a,'x','bj_split',0,null); rep := rep || ' 非對子分牌=沒擋'; exception when others then rep := rep || ' 非對子分牌=擋'; end;
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(108,308),'b',100)))) where id = a;
  g := (public.town_cgame(a,'x','bj_split',0,null))::jsonb->'game'; rep := rep || ' 分8手數=' || jsonb_array_length(g->'hs') || ' 押=' || (g->>'bet') || '（2、200）';
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',0,'hs',jsonb_build_array(jsonb_build_object('c',jsonb_build_array(101,301),'b',100)))) where id = a;
  g := (public.town_cgame(a,'x','bj_split',0,null))::jsonb->'game'; rep := rep || ' 分A done=' || (g->>'done') || ' 手數=' || jsonb_array_length(g->'hs') || '（true、2；分A每手一張牌不能再要）';
  rep := rep || ' 分A每手張數=' || (g->'hs'->0->'c')::text || (g->'hs'->1->'c')::text;
  -- 5) 最多 4 手
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'d',jsonb_build_array(106),'h',110,'i',3,'hs',jsonb_build_array(
    jsonb_build_object('c',jsonb_build_array(108,308),'b',100,'f',1), jsonb_build_object('c',jsonb_build_array(108,308),'b',100,'f',1), jsonb_build_object('c',jsonb_build_array(108,308),'b',100,'f',1), jsonb_build_object('c',jsonb_build_array(108,308),'b',100)))) where id = a;
  begin perform public.town_cgame(a,'x','bj_split',0,null); rep := rep || ' 第5手=沒擋'; exception when others then rep := rep || ' 第5手=擋'; end;
  -- 6) 開局：天生 21 點 3:2、莊家天生 21 點只輸原注、雙方都 21 平手（統計 4000 局）
  n := 4000; ret := 0;
  for i in 1..n loop
    update public.town_residents set money = 100000, items = items - 'bj' - 'games' - 'cas' where id = a;
    g := (public.town_cgame(a,'x','bj_start',100,null))::jsonb->'game';
    if (g->>'bj')::boolean is true then pbj := pbj + 1; if (g->>'dbj')::boolean is true then bothbj := bothbj + 1; if (g->>'win')::int <> 100 then bad := bad + 1; end if; else pbjwin := pbjwin + (g->>'win')::int; if (g->>'win')::int <> 250 then bad := bad + 1; end if; end if; end if;
    if (g->>'bj')::boolean is not true and (g->>'dbj')::boolean is true then dbj := dbj + 1; if (g->>'win')::int <> 0 or (g->>'bet')::int <> 100 then bad := bad + 1; end if; end if;
  end loop;
  rep := rep || ' 玩家BJ=' || pbj || '（約' || round(n*0.0475) || '）／莊BJ=' || dbj || '（約' || round(n*0.0475) || '）／同時=' || bothbj || ' 賠付異常=' || bad || '（0；BJ=250、莊BJ=0、同時=100）';
  -- 7) 約 2000 局簡化策略（不是最佳；停 17、10／11 加倍、A 與 8 分牌、其餘 <17 要牌）：拿回率只看趨勢，必須 < 1；錢不為負
  n := 2000; ret := 0; wag := 0; bad := 0;
  update public.town_residents set money = 1000000000 where id = a;
  for i in 1..n loop
    update public.town_residents set items = items - 'bj' where id = a;
    g := (public.town_cgame(a,'x','bj_start',100,null))::jsonb->'game'; wag := wag + 100;
    k := 0;
    while (g->>'done')::boolean is not true and k < 40 loop
      k := k + 1; st := g->'hs'->((g->>'i')::int); tot := public.town_bj_total(st->'c'); up := public.town_bj_total(g->'d');
      if (g->>'spl')::boolean and (((st->'c'->>0)::int % 100) in (1, 8)) then act := 'bj_split';
      elsif (g->>'dbl')::boolean and tot in (10, 11) and not ((st->'c'->>0)::int % 100 = 1) then act := 'bj_double';
      elsif tot >= 17 or (tot >= 13 and up <= 6) then act := 'bj_stand'; else act := 'bj_hit'; end if;
      begin g := (public.town_cgame(a,'x',act,0,null))::jsonb->'game'; exception when others then bad := bad + 1; g := (public.town_cgame(a,'x','bj_stand',0,null))::jsonb->'game'; end;
    end loop;
    ret := ret + (g->>'win')::numeric; wag := wag + (g->>'bet')::numeric - 100;
  end loop;
  rep := rep || ' 簡化策略拿回/起始押注=' || round(ret / (n*100), 3) || '（約0.98，必須<1）拿回/總押注=' || round(ret / wag, 3) || ' 動作錯誤=' || bad;
  select money into m0 from public.town_residents where id = a; rep := rep || ' 錢=' || m0 || '（不為負=' || (m0 >= 0) || '）';
  -- 8) 舊單手牌局照舊結算（p 欄）
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'p',jsonb_build_array(110,210),'d',jsonb_build_array(110))) where id = a;
  g := (public.town_cgame(a,'x','bj_stand',0,null))::jsonb->'game'; rep := rep || ' 舊牌局停牌 done=' || (g->>'done') || ' win=' || (g->>'win');
  update public.town_residents set money = 10000, items = jsonb_build_object('bj', jsonb_build_object('bet',100,'p',jsonb_build_array(110,210),'d',jsonb_build_array(110))) where id = a;
  begin perform public.town_cgame(a,'x','bj_double',0,null); rep := rep || ' 舊牌局加倍=沒擋'; exception when others then rep := rep || ' 舊牌局加倍=擋'; end;
  raise exception 'REPORT:%', rep;
end $$;

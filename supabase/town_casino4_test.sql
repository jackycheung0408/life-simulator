-- 小豬賭場階段 E 回滾實測：結果在錯誤訊息 REPORT。接在 town_casino4.sql 之後貼上，全部回滾。
-- 直接呼叫 town_cgame4（設交易旗標 town.casino=1，居民 money 當籌碼）；樣本小只看趨勢，理論值見 town_casino4.sql 檔頭與 town/test_casino4.js。SQL Editor 約 60 秒逾時，每款樣本 ≤ 1500。
do $$
declare t text := 'ZZCAS4'; a bigint; rep text := ''; g jsonb; i int; n int; ret numeric; m0 bigint; bad int := 0; k int; j int; hit int;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZCAS4') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{}'::jsonb) returning id into a;
  perform set_config('town.casino','',true);
  begin perform public.town_cgame4(a,'x','cups',50,'0'); rep := rep || ' 無旗標=沒擋'; exception when others then rep := rep || ' 無旗標=擋'; end;
  perform set_config('town.casino','1',true);
  begin perform public.town_cgame4(a,'x','cups',49,'0'); rep := rep || ' 押49=沒擋'; exception when others then rep := rep || ' 押49=擋'; end;
  update public.town_residents set money = 60 where id = a;
  begin perform public.town_cgame4(a,'x','plinko',100,'low'); rep := rep || ' 籌碼不夠=沒擋'; exception when others then rep := rep || ' 籌碼不夠=擋'; end;
  update public.town_residents set money = 1000000000 where id = a;
  -- 猜杯子 1500 局（理論 0.96）
  n := 1500; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame4(a,'x','cups',100,(i % 3)::text))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 猜杯子=' || round(ret / (n*100), 3) || '（0.960）';
  begin perform public.town_cgame4(a,'x','cups',100,'3'); rep := rep || ' 杯3=沒擋'; exception when others then rep := rep || ' 杯3=擋'; end;
  -- 彈珠台：三種風險各 1200 局（理論 0.964／0.957／0.965，高風險變異大）
  n := 1200; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame4(a,'x','plinko',100,'low'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 彈珠低=' || round(ret / (n*100), 3);
  ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame4(a,'x','plinko',100,'mid'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 中=' || round(ret / (n*100), 3);
  ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame4(a,'x','plinko',100,'high'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 高=' || round(ret / (n*100), 3);
  begin perform public.town_cgame4(a,'x','plinko',100,'wild'); rep := rep || ' 風險wild=沒擋'; exception when others then rep := rep || ' 風險wild=擋'; end;
  -- 刮刮樂 1500 局（理論 0.950）：盤面 9 格，且只會有獎項那一組三連
  n := 1500; ret := 0; for i in 1..n loop g := (public.town_cgame4(a,'x','scratch',100,null))::jsonb->'game'; ret := ret + (g->>'win')::numeric;
    if (select count(*) from (select v from jsonb_array_elements_text(g->'cells') v group by v having count(*) >= 3) q) <> (case when (g->>'tier')::int >= 0 then 1 else 0 end) then bad := bad + 1; end if; end loop;
  rep := rep || ' 刮刮樂=' || round(ret / (n*100), 3) || '（0.950，盤面異常=' || bad || '）';
  -- 開寶箱 1200 局：永遠保留／永遠換（理論都 0.960）
  n := 1200; ret := 0; for i in 1..n loop perform public.town_cgame4(a,'x','ch_start',100,null); g := (public.town_cgame4(a,'x','ch_pick',0,(i % 5)::text))::jsonb->'game';
    g := (public.town_cgame4(a,'x','ch_final',0,(g->>'pick')))::jsonb->'game'; ret := ret + (g->>'win')::numeric; end loop; rep := rep || ' 寶箱保留=' || round(ret / (n*100), 3);
  ret := 0; for i in 1..n loop perform public.town_cgame4(a,'x','ch_start',100,null); g := (public.town_cgame4(a,'x','ch_pick',0,(i % 5)::text))::jsonb->'game';
    g := (public.town_cgame4(a,'x','ch_final',0,(select e::text from generate_series(0,4) e where e <> (g->>'pick')::int and e <> (g->>'rev')::int limit 1)))::jsonb->'game'; ret := ret + (g->>'win')::numeric; end loop; rep := rep || ' 換箱=' || round(ret / (n*100), 3);
  perform public.town_cgame4(a,'x','ch_start',100,null);
  begin perform public.town_cgame4(a,'x','ch_start',100,null); rep := rep || ' 寶箱重開=沒擋'; exception when others then rep := rep || ' 寶箱重開=擋'; end;
  begin perform public.town_cgame4(a,'x','ch_final',0,'1'); rep := rep || ' 沒選先換=沒擋'; exception when others then rep := rep || ' 沒選先換=擋'; end;
  g := (public.town_cgame4(a,'x','ch_pick',0,'2'))::jsonb->'game';
  begin perform public.town_cgame4(a,'x','ch_final',0,(g->>'rev')); rep := rep || ' 選已開的箱=沒擋'; exception when others then rep := rep || ' 選已開的箱=擋'; end;
  perform public.town_cgame4(a,'x','ch_final',0,'2');
  begin perform public.town_cgame4(a,'x','ch_final',0,'2'); rep := rep || ' 重複結算=沒擋'; exception when others then rep := rep || ' 重複結算=擋'; end;
  -- 地雷：每種地雷數玩「翻 3 格就收手」各 ≤ 400 局（理論 0.97；翻到雷輸）
  for k in 1..6 loop
    n := 250; ret := 0;
    for i in 1..n loop
      perform public.town_cgame4(a,'x','mn_start',100,k::text);
      hit := 0;
      for j in 0..2 loop
        g := (public.town_cgame4(a,'x','mn_pick',0,(((i*7) + j*9) % 25)::text))::jsonb->'game';
        if (g->>'hit')::boolean then hit := 1; exit; end if;
      end loop;
      if hit = 0 then ret := ret + ((public.town_cgame4(a,'x','mn_cash',0,null))::jsonb->'game'->>'win')::numeric; end if;
    end loop;
    rep := rep || ' 地雷' || k || '=' || round(ret / (n*100), 3) || '（0.970）';
  end loop;
  begin perform public.town_cgame4(a,'x','mn_start',100,'0'); rep := rep || ' 雷0=沒擋'; exception when others then rep := rep || ' 雷0=擋'; end;
  begin perform public.town_cgame4(a,'x','mn_start',100,'7'); rep := rep || ' 雷7=沒擋'; exception when others then rep := rep || ' 雷7=擋'; end;
  perform public.town_cgame4(a,'x','mn_start',100,'3');
  begin perform public.town_cgame4(a,'x','mn_start',100,'3'); rep := rep || ' 地雷重開=沒擋'; exception when others then rep := rep || ' 地雷重開=擋'; end;
  begin perform public.town_cgame4(a,'x','mn_cash',0,null); rep := rep || ' 沒翻先收=沒擋'; exception when others then rep := rep || ' 沒翻先收=擋'; end;
  begin perform public.town_cgame4(a,'x','mn_pick',0,'25'); rep := rep || ' 格25=沒擋'; exception when others then rep := rep || ' 格25=擋'; end;
  rep := rep || ' 倍率 3雷翻1=' || round(public.town_mn_mult(3,1),4) || ' 6雷翻19=' || round(public.town_mn_mult(6,19),1);
  -- 飛行器：1500 局都在 1.5 倍（x2 = 150）收手（理論 0.97）；伺服器時間未到就領擋住；墜毀後 poll 結束
  n := 1500; ret := 0;
  for i in 1..n loop
    perform public.town_cgame4(a,'x','cr_start',100,null);
    update public.town_residents set items = jsonb_set(items, '{cr,t}', to_jsonb(extract(epoch from clock_timestamp()) - 4.1)) where id = a;  -- exp(0.41)=1.50 倍
    ret := ret + ((public.town_cgame4(a,'x','cr_cash',0,'150'))::jsonb->'game'->>'win')::numeric;
  end loop;
  rep := rep || ' 飛行器1.5倍=' || round(ret / (n*100), 3) || '（0.970）';
  perform public.town_cgame4(a,'x','cr_start',100,null);
  begin perform public.town_cgame4(a,'x','cr_cash',0,'500'); rep := rep || ' 還沒到5倍=沒擋'; exception when others then rep := rep || ' 還沒到5倍=擋'; end;
  begin perform public.town_cgame4(a,'x','cr_cash',0,'99'); rep := rep || ' 倍率99=沒擋'; exception when others then rep := rep || ' 倍率99=擋'; end;
  update public.town_residents set items = jsonb_set(jsonb_set(items, '{cr,t}', to_jsonb(extract(epoch from clock_timestamp()) - 30)), '{cr,x}', '250') where id = a;  -- 30 秒 = 20 倍，墜毀點 2.50
  g := (public.town_cgame4(a,'x','cr_poll',0,null))::jsonb->'game'; rep := rep || ' 墜毀poll=' || (g->>'crashed') || ' x=' || (g->>'x');
  begin perform public.town_cgame4(a,'x','cr_cash',0,'200'); rep := rep || ' 墜毀後補領=沒擋'; exception when others then rep := rep || ' 墜毀後補領=擋'; end;
  perform public.town_cgame4(a,'x','cr_start',100,null);
  update public.town_residents set items = jsonb_set(jsonb_set(items, '{cr,t}', to_jsonb(extract(epoch from clock_timestamp()) - 30)), '{cr,x}', '250') where id = a;
  g := (public.town_cgame4(a,'x','cr_cash',0,'300'))::jsonb->'game'; rep := rep || ' 領3.00倍(墜2.50)=' || (g->>'win');
  perform public.town_cgame4(a,'x','cr_start',100,null);
  update public.town_residents set items = jsonb_set(jsonb_set(items, '{cr,t}', to_jsonb(extract(epoch from clock_timestamp()) - 30)), '{cr,x}', '250') where id = a;
  g := (public.town_cgame4(a,'x','cr_cash',0,'250'))::jsonb->'game'; rep := rep || ' 領2.50倍(墜2.50)=' || (g->>'win');
  select money into m0 from public.town_residents where id = a; rep := rep || ' 錢=' || m0 || '（不為負=' || (m0 >= 0) || '）';
  raise exception 'REPORT:%', rep;
end $$;

-- 小豬賭場階段 D 回滾實測：結果在錯誤訊息 REPORT。接在 town_casino3.sql 之後貼上，全部回滾。
-- 直接呼叫 town_cgame3（設交易旗標 town.casino=1，居民 money 當籌碼）；樣本小只看趨勢，理論值見 town_casino3.sql 檔頭與 town/test_casino3.js。SQL Editor 約 60 秒逾時，樣本別加大。
do $$
declare t text := 'ZZCAS3'; a bigint; rep text := ''; g jsonb; i int; n int; ret numeric; cnt int; m0 bigint; ok boolean; tiles int[]; bad int := 0; pw int := 0;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZCAS3') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{}'::jsonb) returning id into a;
  perform set_config('town.casino','',true);
  begin perform public.town_cgame3(a,'x','sangong',50,null); rep := rep || ' 無旗標=沒擋'; exception when others then rep := rep || ' 無旗標=擋'; end;
  perform set_config('town.casino','1',true);
  begin perform public.town_cgame3(a,'x','sangong',49,null); rep := rep || ' 押49=沒擋'; exception when others then rep := rep || ' 押49=擋'; end;
  update public.town_residents set money = 60 where id = a;
  begin perform public.town_cgame3(a,'x','shiba',100,null); rep := rep || ' 籌碼不夠=沒擋'; exception when others then rep := rep || ' 籌碼不夠=擋'; end;
  update public.town_residents set money = 1000000000 where id = a;
  -- 三公 700 局（理論 0.975）：6 張牌不重複
  n := 700; ret := 0; ok := true;
  for i in 1..n loop g := (public.town_cgame3(a,'x','sangong',100,null))::jsonb->'game'; ret := ret + (g->>'win')::numeric;
    if (select count(distinct v) from jsonb_array_elements_text(g->'p' || g->'b') v) <> 6 then ok := false; end if; end loop;
  rep := rep || ' 三公=' || round(ret / (n*100), 3) || '（理論 0.975，6 張不重複=' || ok || '）';
  -- 十八啦 1000 局（理論 0.978）
  n := 1000; ret := 0; for i in 1..n loop g := (public.town_cgame3(a,'x','shiba',100,null))::jsonb->'game'; ret := ret + (g->>'win')::numeric;
    if (g->>'pv')::int not between 4 and 12 and (g->>'pv')::int <> 100 and (g->>'pv')::int not between 3 and 11 then bad := bad + 1; end if; end loop;
  rep := rep || ' 十八啦=' || round(ret / (n*100), 3) || '（理論 0.978，點數異常=' || bad || '）';
  -- 賽豬：單勝押 1 號與 6 號、前二押 2 號（理論 0.93／0.948／0.929）
  n := 900; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame3(a,'x','pigrace',100,'w:1'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 賽豬單勝1=' || round(ret / (n*100), 3) || '（0.930）';
  n := 1200; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame3(a,'x','pigrace',100,'w:6'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 單勝6=' || round(ret / (n*100), 3) || '（0.948，變異大）';
  n := 900; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame3(a,'x','pigrace',100,'t:2'))::jsonb->'game'->>'win')::numeric; end loop; rep := rep || ' 前二2=' || round(ret / (n*100), 3) || '（0.929）';
  g := (public.town_cgame3(a,'x','pigrace',100,'w:1'))::jsonb->'game'; rep := rep || ' 名次=' || (g->>'order');
  begin perform public.town_cgame3(a,'x','pigrace',100,'w:7'); rep := rep || ' 7號=沒擋'; exception when others then rep := rep || ' 7號=擋'; end;
  -- 牌九：發 8 張不重複、分法 0～2、無效分法擋、莊家分法固定；隨機分法 500 局回報（理論 < 0.98，最佳策略 0.9795）
  g := (public.town_cgame3(a,'x','pj_start',100,null))::jsonb->'game'; rep := rep || ' 牌九發牌=' || (g->>'p');
  begin perform public.town_cgame3(a,'x','pj_play',0,'3'); rep := rep || ' 分法3=沒擋'; exception when others then rep := rep || ' 分法3=擋'; end;
  g := (public.town_cgame3(a,'x','pj_play',0,'0'))::jsonb->'game'; rep := rep || ' 結果=' || (g->>'win') || ' 莊=' || (g->>'d');
  begin perform public.town_cgame3(a,'x','pj_play',0,'0'); rep := rep || ' 重複結算=沒擋'; exception when others then rep := rep || ' 重複結算=擋'; end;
  n := 500; ret := 0; for i in 1..n loop perform public.town_cgame3(a,'x','pj_start',100,null); ret := ret + ((public.town_cgame3(a,'x','pj_play',0,(i % 3)::text))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 牌九輪流分法=' || round(ret / (n*100), 3) || '（隨便分 < 0.98）';
  rep := rep || ' 至尊墩=' || public.town_pj_dun(30, 31) || ' 天牌對=' || public.town_pj_dun(0, 1) || ' 零霖六對=' || public.town_pj_dun(20, 21) || ' 雜九+雜九=' || public.town_pj_dun(22, 23);
  select money into m0 from public.town_residents where id = a; rep := rep || ' 錢=' || m0 || '（不為負=' || (m0 >= 0) || '）';
  -- 走完整個 wrapper：不在賭場擋
  raise exception 'REPORT:%', rep;
end $$;

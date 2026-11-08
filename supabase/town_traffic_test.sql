-- 交通第 1 階段實測：接在 town.sql 之後貼上執行；最後 raise exception 回滾，結果在錯誤訊息 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; nm text; t text;
begin
  cr := public.town_create('ZZVEH','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='market', sleeping=false, money=200000, items='{}'::jsonb where id = rid;
  -- 不在車行買
  begin perform public.town_act(rid,'1234','vbuy',null,null,null,null,'bike'); rep := rep||'buy at market ALLOWED'||E'\n'; exception when others then rep := rep||'buy at market: '||sqlerrm||E'\n'; end;
  perform public.town_act(rid,'1234','move',null,43,14,'carshop');
  foreach nm in array array['bike','moto','car','car','plane'] loop
    begin perform public.town_act(rid,'1234','vbuy',null,null,null,null,nm); select * into r from public.town_residents where id = rid; rep := rep||'buy '||nm||' ok money='||r.money||' veh='||(r.items->'veh')::text||E'\n';
    exception when others then rep := rep||'buy '||nm||': '||sqlerrm||E'\n'; end;
  end loop;
  -- 沒錢
  update public.town_residents set money=10, items=items - 'veh' where id = rid;
  begin perform public.town_act(rid,'1234','vbuy',null,null,null,null,'bike'); rep := rep||'poor ALLOWED'||E'\n'; exception when others then rep := rep||'poor: '||sqlerrm||E'\n'; end;
  -- 上車／下車
  update public.town_residents set money=1000, items='{"veh":{"own":["bike","moto","car"]}}'::jsonb, place='street', x=10, y=6 where id = rid;
  begin perform public.town_act(rid,'1234','mount',null,null,null,null,'plane'); rep := rep||'mount plane ALLOWED'||E'\n'; exception when others then rep := rep||'mount plane: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(rid,'1234','dismount'); rep := rep||'dismount w/o ride ALLOWED'||E'\n'; exception when others then rep := rep||'dismount w/o ride: '||sqlerrm||E'\n'; end;
  -- 腳踏車：免油錢；機車 20 格 = 8；汽車 20 格 = 20
  foreach nm in array array['bike','moto','car'] loop
    update public.town_residents set money=1000, place='street', x=10, y=6 where id = rid;
    perform public.town_act(rid,'1234','mount',null,null,null,null,nm);
    perform public.town_act(rid,'1234','move',null,20,6,'street'); perform public.town_act(rid,'1234','move',null,20,16,'street');
    select * into r from public.town_residents where id = rid; rep := rep||nm||' 20+10 tiles money='||r.money||' k='||coalesce(r.items#>>'{veh,k}','-')||E'\n';
    perform public.town_act(rid,'1234','dismount');
  end loop;
  -- 沒油錢：汽車 40 格但只有 15 塊 → 扣到 0 並下車
  update public.town_residents set money=15, place='street', x=0, y=6 where id = rid;
  perform public.town_act(rid,'1234','mount',null,null,null,null,'car'); perform public.town_act(rid,'1234','move',null,40,6,'street');
  select * into r from public.town_residents where id = rid; rep := rep||'car out of money: money='||r.money||' k='||coalesce(r.items#>>'{veh,k}','-')||' own='||(r.items->'veh'->'own')::text||E'\n';
  -- 走回自己家自動下車
  update public.town_residents set money=500, place='street', x=0, y=6 where id = rid;
  perform public.town_act(rid,'1234','mount',null,null,null,null,'moto'); perform public.town_act(rid,'1234','move',null,4,5,'home:'||rid);
  select * into r from public.town_residents where id = rid; rep := rep||'home: k='||coalesce(r.items#>>'{veh,k}','-')||' money='||r.money||E'\n';
  -- 屋裡不能上車；鎮長關車行
  begin update public.town_residents set items=items - 'dr' where id = rid; perform public.town_act(rid,'1234','mount',null,null,null,null,'bike'); rep := rep||'mount inside ALLOWED'||E'\n'; exception when others then rep := rep||'mount inside: '||sqlerrm||E'\n'; end;
  update public.town_towns set off = array['carshop'] where id = (select town_id from public.town_residents where id = rid);
  update public.town_residents set place='street', money=100000 where id = rid;
  begin perform public.town_act(rid,'1234','move',null,43,14,'carshop'); rep := rep||'closed carshop move ALLOWED'||E'\n'; exception when others then rep := rep||'closed carshop: '||sqlerrm||E'\n'; end;
  raise exception E'REPORT\n%', rep;
end $$;

-- 交通第 2 階段實測：接在 town.sql 之後貼上執行；最後 raise exception 回滾，結果在錯誤訊息 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; c_red int := 0; c_any int := 0; c_obey int := 0; tn int;
begin
  -- 燈號公式（要和 town.js 的 lightG 一致）
  rep := rep||'light(0,6)='||public.town_light(0,6)||' light(12000,6)='||public.town_light(12000,6)||' light(0,7)='||public.town_light(0,7)||' light(0,15)='||public.town_light(0,15)||' light(0,16)='||public.town_light(0,16)||' light(0,22)='||public.town_light(0,22)||' (預期 0 1 0 1 1 0)'||E'\n';
  cr := public.town_create('ZZTR2','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='carshop', sleeping=false, money=5000, items='{"veh":{"own":["bike","moto","car"]}}'::jsonb where id = rid;
  -- 考照：答錯（扣報名費、30 分鐘冷卻）→ 冷卻中不能再考 → 清冷卻答對
  perform public.town_act(rid,'1234','license',null,null,null,null,'moto','000');
  select * into r from public.town_residents where id = rid; rep := rep||'moto exam fail money='||r.money||' lic='||coalesce((r.items->'lic')::text,'-')||' (預期 4200、無照)'||E'\n';
  begin perform public.town_act(rid,'1234','license',null,null,null,null,'moto','120'); rep := rep||'retake in cd ALLOWED'||E'\n'; exception when others then rep := rep||'retake in cd: '||sqlerrm||E'\n'; end;
  update public.town_residents set items = items #- '{cd,lic}' where id = rid;
  perform public.town_act(rid,'1234','license',null,null,null,null,'moto','120');
  select * into r from public.town_residents where id = rid; rep := rep||'moto exam pass money='||r.money||' lic='||(r.items->'lic')::text||' (預期 3400、moto)'||E'\n';
  begin perform public.town_act(rid,'1234','license',null,null,null,null,'moto','120'); rep := rep||'dup lic ALLOWED'||E'\n'; exception when others then rep := rep||'dup lic: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(rid,'1234','license',null,null,null,null,'car','20'); rep := rep||'2 answers ALLOWED'||E'\n'; exception when others then rep := rep||'2 answers: '||sqlerrm||E'\n'; end;
  -- 罰單：記點、暫停、逾期、繳款
  update public.town_residents set place='street', x=10, y=6, money=10000, items='{"veh":{"own":["moto"],"k":"moto"},"lic":{"moto":1}}'::jsonb where id = rid;
  select * into r from public.town_residents where id = rid;
  r := public.town_ticket(r,'red',900,2,'闖紅燈'); r := public.town_ticket(r,'red',900,2,'闖紅燈');
  rep := rep||'2 tickets pts='||(r.items->'pts'->>'n')||' sus='||coalesce(r.items->>'sus','-')||' veh.k='||coalesce(r.items#>>'{veh,k}','-')||' debt='||public.town_tk_debt(r)||E'\n';
  r := public.town_ticket(r,'red',900,2,'闖紅燈');
  rep := rep||'3 tickets pts='||(r.items->'pts'->>'n')||' sus='||(r.items->>'sus')||' veh.k='||coalesce(r.items#>>'{veh,k}','-')||' tv='||(r.items->'tv')::text||' (預期 6 點、暫停、車被收、debt 2700)'||E'\n';
  update public.town_residents set items = r.items where id = rid;
  begin perform public.town_act(rid,'1234','mount',null,null,null,null,'moto'); rep := rep||'mount while sus ALLOWED'||E'\n'; exception when others then rep := rep||'mount while sus: '||sqlerrm||E'\n'; end;
  update public.town_residents set items = (items - 'sus') || jsonb_build_object('tk', (select jsonb_agg(e || jsonb_build_object('due', now() - interval '1 hour')) from jsonb_array_elements(items->'tk') e)) where id = rid;
  perform public.town_act(rid,'1234','vmode',null,null,null,null,'0');
  select * into r from public.town_residents where id = rid; rep := rep||'overdue tickets='||(r.items->'tk')::text||' (預期每張 1350、o=1)'||E'\n';
  perform public.town_act(rid,'1234','vmode',null,null,null,null,'0');
  begin perform public.town_act(rid,'1234','mount',null,null,null,null,'moto'); rep := rep||'mount with debt ALLOWED'||E'\n'; exception when others then rep := rep||'mount with debt: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=1500 where id = rid;
  perform public.town_act(rid,'1234','paytk',null,null,null,null,'all');
  select * into r from public.town_residents where id = rid; rep := rep||'pay all with 1500: money='||r.money||' left='||jsonb_array_length(r.items->'tk')||' (預期 150、剩 2 張)'||E'\n';
  begin perform public.town_act(rid,'1234','paytk',null,null,null,null,'all'); rep := rep||'broke pay ALLOWED'||E'\n'; exception when others then rep := rep||'broke pay: '||sqlerrm||E'\n'; end;
  update public.town_residents set money=9999 where id = rid;
  perform public.town_act(rid,'1234','paytk',null,null,null,null,'all');
  select * into r from public.town_residents where id = rid; rep := rep||'pay rest: money='||r.money||' left='||jsonb_array_length(r.items->'tk')||E'\n';
  -- 統計：衝模式從 (0,6) 騎到 (40,6) 要過一個紅燈路口與鬧區；守規矩模式不該有闖燈／超速
  update public.town_residents set place='street', x=0, y=6, money=99999, items='{"veh":{"own":["moto"],"k":"moto","f":1},"lic":{"moto":1}}'::jsonb where id = rid;
  for i in 1..60 loop
    update public.town_residents set x=0, y=6, items = items - 'tk' - 'tv' - 'pts' - 'sus' || '{"veh":{"own":["moto"],"k":"moto","f":1}}'::jsonb where id = rid;
    perform public.town_act(rid,'1234','move',null,40,6,'street');
    select * into r from public.town_residents where id = rid; tn := coalesce(jsonb_array_length(r.items->'tk'),0); c_any := c_any + (case when tn > 0 then 1 else 0 end); c_red := c_red + coalesce((r.items->'tv'->>'red')::int,0);
  end loop;
  rep := rep||'衝 60 趟：被開單 '||c_any||' 趟，闖紅燈單 '||c_red||' 張（期望闖燈約每趟 0.5 個燈 × 40%）'||E'\n';
  for i in 1..60 loop
    update public.town_residents set x=0, y=6, items = items - 'tk' - 'tv' - 'pts' - 'sus' || '{"veh":{"own":["moto"],"k":"moto","f":0}}'::jsonb where id = rid;
    perform public.town_act(rid,'1234','move',null,40,6,'street');
    select * into r from public.town_residents where id = rid; c_obey := c_obey + coalesce((r.items->'tv'->>'red')::int,0) + coalesce((r.items->'tv'->>'spd')::int,0) + coalesce((r.items->'tv'->>'yld')::int,0);
  end loop;
  rep := rep||'守規矩 60 趟：闖燈／超速／不禮讓單 '||c_obey||' 張（預期 0）'||E'\n';
  -- 無照（走遠才查）與人行道
  update public.town_residents set items = '{"veh":{"own":["moto"],"k":"moto"}}'::jsonb where id = rid; c_any := 0;
  for i in 1..60 loop
    update public.town_residents set x=0, y=6, items = items - 'tk' - 'tv' - 'pts' - 'sus' where id = rid;
    perform public.town_act(rid,'1234','move',null,20,6,'street');
    select * into r from public.town_residents where id = rid; c_any := c_any + coalesce((r.items->'tv'->>'nl')::int,0);
  end loop;
  rep := rep||'無照 60 趟：無照單 '||c_any||' 張（期望約 9）'||E'\n';
  delete from public.town_towns where id = (select town_id from public.town_residents where id = rid);
  raise exception 'REPORT%', E'\n'||rep;
end $$;

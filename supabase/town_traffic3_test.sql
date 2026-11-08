-- 交通第 3 階段實測：接在 town.sql 之後貼上執行；最後 raise exception 回滾，結果在錯誤訊息 REPORT
do $$
declare cr json; rid bigint; rid2 bigint; rep text := ''; r public.town_residents; i int; n int; c1 int := 0; c2 int := 0; c3 int := 0; crashes int; nev int; m0 int;
begin
  cr := public.town_create('ZZTR3','甲','1234'); rid := (cr->>'resident_id')::bigint;
  -- 保險：要在車行、強制險先於任意險、保費
  update public.town_residents set place='carshop', sleeping=false, money=20000, items='{"veh":{"own":["moto","car"]},"lic":{"moto":1,"car":1}}'::jsonb where id = rid;
  begin perform public.town_act(rid,'1234','insure',null,null,null,null,'moto:f:30'); rep := rep||'f without c ALLOWED'||E'\n'; exception when others then rep := rep||'f without c: '||sqlerrm||E'\n'; end;
  perform public.town_act(rid,'1234','insure',null,null,null,null,'moto:c:30');
  perform public.town_act(rid,'1234','insure',null,null,null,null,'moto:f:7');
  select * into r from public.town_residents where id = rid; rep := rep||'moto c30 + f7: money='||r.money||' (預期 20000-500-400=19100) ins='||(r.items->'ins')::text||E'\n';
  -- 維修與賣車
  update public.town_residents set items = jsonb_set(items,'{veh,w}','{"moto":50}'::jsonb) where id = rid;
  perform public.town_act(rid,'1234','vfix',null,null,null,null,'moto');
  select * into r from public.town_residents where id = rid; rep := rep||'fix moto wear50: money='||r.money||' (預期 19100-2250=16850) wear='||public.town_wear(r,'moto')||E'\n';
  update public.town_residents set items = jsonb_set(items,'{veh,w}','{"car":40}'::jsonb) where id = rid;
  perform public.town_act(rid,'1234','vsell',null,null,null,null,'car');
  select * into r from public.town_residents where id = rid; rep := rep||'sell car wear40: money='||r.money||' (預期 16850+57600=74450) own='||(r.items->'veh'->'own')::text||E'\n';
  -- 事故取樣：衝＋無照＋夜間不好控，只量 1000 趟 20 格的機車；比較守規矩有照、衝有照、衝無照
  update public.town_residents set place='street', x=0, y=6, money=99999, energy=100, fun=100, items='{"veh":{"own":["moto"],"k":"moto","f":0},"lic":{"moto":1}}'::jsonb where id = rid;
  for i in 1..400 loop
    update public.town_residents set x=0, y=6, money=99999, sleeping=false, energy=100, items = items - 'faint' - 'hosp' - 'ac' - 'db' || '{"veh":{"own":["moto"],"k":"moto","f":0},"lic":{"moto":1}}'::jsonb where id = rid;
    r := public.town_crash((select t from public.town_residents t where id = rid), 'moto', 20, 6);
    c1 := c1 + coalesce((r.items->'ac'->>'n')::int,0);
  end loop;
  rep := rep||'守規矩有照 400 趟×20 格：事故 '||c1||' 次（期望約 400×1.6% = 6）'||E'\n';
  for i in 1..400 loop
    update public.town_residents set x=0, y=6, money=99999, sleeping=false, energy=100, items = items - 'faint' - 'hosp' - 'ac' - 'db' || '{"veh":{"own":["moto"],"k":"moto","f":1},"lic":{"moto":1}}'::jsonb where id = rid;
    r := public.town_crash((select t from public.town_residents t where id = rid), 'moto', 20, 6);
    c2 := c2 + coalesce((r.items->'ac'->>'n')::int,0);
  end loop;
  rep := rep||'衝有照 400 趟：事故 '||c2||' 次（期望約 400×4.7% = 19）'||E'\n';
  for i in 1..400 loop
    update public.town_residents set x=0, y=6, money=99999, sleeping=false, energy=100, items = items - 'faint' - 'hosp' - 'ac' - 'db' || '{"veh":{"own":["moto"],"k":"moto","f":1}}'::jsonb where id = rid;
    r := public.town_crash((select t from public.town_residents t where id = rid), 'moto', 20, 6);
    c3 := c3 + coalesce((r.items->'ac'->>'n')::int,0);
  end loop;
  rep := rep||'衝無照 400 趟：事故 '||c3||' 次（期望約 400×8% = 32）'||E'\n';
  -- 保險折抵：沒保險 vs 有強制險＋任意險，各撞一次（用極高耗損讓機率接近 1）
  update public.town_residents set x=0, y=6, money=1000, sleeping=false, items='{"veh":{"own":["moto"],"k":"moto","f":1,"w":{"moto":100}},"lic":{"moto":1}}'::jsonb where id = rid;
  loop
    update public.town_residents set x=0, y=6, money=1000, sleeping=false, items = items - 'ac' - 'db' - 'faint' - 'hosp' - 'ins' || '{"veh":{"own":["moto"],"k":"moto","f":1,"w":{"moto":100}}}'::jsonb where id = rid;
    r := public.town_crash((select t from public.town_residents t where id = rid), 'moto', 40, 40);
    exit when coalesce((r.items->'ac'->>'n')::int,0) > 0;
  end loop;
  rep := rep||'沒保險撞一次：money='||r.money||' 欠款='||coalesce((r.items->'db'->>'a'),'0')||' wear='||public.town_wear(r,'moto')||' (錢 1000 不夠時應付到 0、記欠款)'||E'\n';
  loop
    update public.town_residents set x=0, y=6, money=1000, sleeping=false, items = items - 'ac' - 'db' - 'faint' - 'hosp' || ('{"veh":{"own":["moto"],"k":"moto","f":1,"w":{"moto":100}},"ins":{"moto":{"c":"'||(now()+interval '5 days')||'","f":"'||(now()+interval '5 days')||'"}}}')::jsonb where id = rid;
    r := public.town_crash((select t from public.town_residents t where id = rid), 'moto', 40, 40);
    exit when coalesce((r.items->'ac'->>'n')::int,0) > 0;
  end loop;
  rep := rep||'有強制險＋任意險撞一次：money='||r.money||' 欠款='||coalesce((r.items->'db'->>'a'),'0')||' wear='||public.town_wear(r,'moto')||'（醫藥費全免、車自動修好只付 20%）'||E'\n';
  -- 還款
  update public.town_residents set money=1500, items = items || '{"db":{"a":3000}}'::jsonb where id = rid;
  perform public.town_act(rid,'1234','paydebt',null,null,null,null,'all');
  select * into r from public.town_residents where id = rid; rep := rep||'paydebt all with 1500 (扣完房租水電後的錢先全還): money='||r.money||' debt='||coalesce(r.items->'db'->>'a','-')||' (預期 money 0、欠款 = 3000 − 1500 + 房租)'||E'\n';
  -- 上車限制：欠款 ≥ 5000 不能開機車，但腳踏車可以
  update public.town_residents set place='street', money=100, items='{"veh":{"own":["bike","moto"]},"lic":{"moto":1},"db":{"a":6000}}'::jsonb where id = rid;
  begin perform public.town_act(rid,'1234','mount',null,null,null,null,'moto'); rep := rep||'mount moto with debt ALLOWED'||E'\n'; exception when others then rep := rep||'mount moto with debt: '||sqlerrm||E'\n'; end;
  perform public.town_act(rid,'1234','mount',null,null,null,null,'bike');
  rep := rep||'bike with debt: ok'||E'\n';
  -- 兩輛車撞：另一人同在路上，N 次取樣看雙方動態與錢
  cr := public.town_join((select town_id from public.town_residents where id = rid), (select invite from public.town_towns where id = (select town_id from public.town_residents where id = rid)), '乙', '1234');
  rid2 := (cr->>'resident_id')::bigint;
  update public.town_residents set place='street', sleeping=false, seen_at=now(), money=5000, items='{"veh":{"own":["moto"],"k":"moto"},"lic":{"moto":1}}'::jsonb where id = rid2;
  nev := 0;
  for i in 1..300 loop
    update public.town_residents set place='street', x=0, y=6, money=99999, sleeping=false, items='{"veh":{"own":["moto"],"k":"moto","f":1,"w":{"moto":100}},"lic":{"moto":1}}'::jsonb where id = rid;
    update public.town_residents set seen_at=now(), money=5000, place='street' where id = rid2;
    perform public.town_crash((select t from public.town_residents t where id = rid), 'moto', 40, 40);
  end loop;
  select count(*) into nev from public.town_events where kind='crash' and target = rid2;
  rep := rep||'300 趟衝、爛車、旁邊有一台：撞到乙 '||nev||' 次（期望約事故數 × 35%）'||E'\n';
  rep := rep||'範例動態：'||coalesce((select msg from public.town_events where kind='crash' and target = rid2 order by id desc limit 1),'-')||E'\n';
  delete from public.town_towns where id = (select town_id from public.town_residents where id = rid);
  raise exception 'REPORT%', E'\n'||rep;
end $$;

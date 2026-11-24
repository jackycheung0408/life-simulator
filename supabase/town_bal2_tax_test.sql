-- 平衡批 2 實測：新稅階數值、kt 可超過 1.2 且不超過 2.0。最後 rollback，結果在 REPORT。
do $$
declare tid text; rep text := ''; e public.town_econ; i int; v int;
begin
  v := public.town_tax(50000); rep := rep||'5萬='||v||case when v=0 then ' OK' else ' BAD' end||E'\n';
  v := public.town_tax(100000); rep := rep||'10萬='||v||case when v=150 then ' OK' else ' BAD' end||E'\n';
  v := public.town_tax(1000000); rep := rep||'100萬='||v||case when v=7350 then ' OK' else ' BAD' end||E'\n';
  v := public.town_tax(5000000); rep := rep||'500萬='||v||case when v=127350 then ' OK' else ' BAD' end||E'\n';
  v := public.town_tax(10000000); rep := rep||'1000萬='||v||case when v=377350 then ' OK' else ' BAD' end||E'\n';
  tid := 'ZZB2T';
  insert into public.town_towns(id,name,invite,fund) values (tid,'測試鎮','ZZB2T1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,mayor,pin_hash,items) values (tid,'甲',9000000,0,10,10,'street',true,extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb);
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (tid,'乙',10000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb);
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (tid,'丙',10000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb);
  insert into public.town_econ(town_id, wk) values (tid, to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')) on conflict (town_id) do nothing;
  update public.town_econ set kt=1.19, day='x' where town_id=tid;
  perform public.town_econ_tick(tid);
  select * into e from public.town_econ where town_id=tid;
  rep := rep||'首富占比高時 kt 1.19→'||e.kt||case when e.kt>1.19 and e.kt<=2.0 then ' OK' else ' BAD' end||E'\n';
  update public.town_econ set kt=1.99, day='x' where town_id=tid;
  perform public.town_econ_tick(tid);
  select * into e from public.town_econ where town_id=tid;
  rep := rep||'1.99→'||e.kt||case when e.kt<=2.0 then ' OK' else ' BAD' end||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

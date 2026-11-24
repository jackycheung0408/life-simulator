-- 平衡批 5 實測：稀有好事件（跑 3000 次看觸發率與每日 1 次、錢不為負）、景氣差隨首富占比。最後 rollback，結果在 REPORT。
do $$
declare t text := 'ZZB5'; a bigint; rep text := ''; i int; j json; hits int := 0; r1 public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); v int; mn bigint;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZB5X1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,mayor,pin_hash,items) values (t,'甲',1000,0,10,10,'street',true,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  for i in 1..400 loop
    update public.town_residents set place='street', sleeping=false, energy=50, hunger=60, fun=60, hygiene=60, bladder=60, seen_at=now(), items=items - 'rg' - 'pl' where id=a;
    j := public.town_pool(a,'x','luck');
    if (j->>'id') is not null and (j->>'id')::int > 9000 then hits := hits + 1; end if;
  end loop;
  rep := rep||'400 次 luck 中稀有好事='||hits||'（約 400×0.5?×0.015 ≈ 3，0～12 都合理；每次重置每日旗標）'||E'\n';
  -- 每日 1 次：連續觸發直到第一次稀有，之後同一天不再有
  update public.town_residents set items=jsonb_set(items - 'pl','{rg}',to_jsonb(today)) where id=a;
  hits := 0;
  for i in 1..300 loop
    update public.town_residents set items=items - 'pl' where id=a;
    j := public.town_pool(a,'x','luck');
    if (j->>'id') is not null and (j->>'id')::int > 9000 then hits := hits + 1; end if;
  end loop;
  rep := rep||'已領今日後 300 次稀有='||hits||case when hits=0 then ' OK' else ' BAD' end||E'\n';
  select money into mn from public.town_residents where id=a; rep := rep||'錢='||mn||case when mn>=0 then ' OK' else ' BAD' end||E'\n';
  -- 景氣差
  insert into public.town_worlds(town_id,k,until) values (t,'bust',now()+interval '1 hour') on conflict (town_id) do update set k='bust', until=now()+interval '1 hour';
  v := public.town_wd_pct(t); rep := rep||'景氣差無 econ 資料 wd='||v||case when v in (90,99) then ' OK' else ' BAD' end||E'\n';
  insert into public.town_econ(town_id, wk, hist) values (t, today, jsonb_build_array(jsonb_build_object('d',today,'top',0.9))) on conflict (town_id) do update set hist=jsonb_build_array(jsonb_build_object('d',today,'top',0.9));
  v := public.town_wd_pct(t); rep := rep||'景氣差 top 0.9 wd='||v||' (85，午間市集時段會 ×1.1 = 93)'||case when v in (85,93) then ' OK' else ' BAD' end||E'\n';
  delete from public.town_towns where id = t;
  raise exception E'REPORT\n%', rep;
end $$;

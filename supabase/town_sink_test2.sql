-- 財產稅／基金／奢侈品補測：錢不夠不變負、舊角色缺欄位、薪水不抽基金。接在 town.sql、town_fac.sql 之後，整段 rollback，結果在 REPORT
do $$
declare cr json; ra bigint; rep text := ''; tid text; j json; r public.town_residents; f0 bigint; f1 bigint;
begin
  cr := public.town_create('ZZS2','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  -- 舊角色：items 幾乎是空的，現金 100（房租 400 付不起）
  update public.town_residents set money = 100, items = '{}'::jsonb where id = ra;
  select * into r from public.town_residents where id = ra; r := public.town_rent(r);
  rep := rep||'poor rent money '||r.money||' (期望 0) tx='||coalesce((r.items->'tx')::text,'null')||E'\n';
  -- 剛好 100000：不扣稅；100200 扣房租後 99800：不扣稅
  update public.town_residents set money = 100400, items = '{}'::jsonb where id = ra;
  select * into r from public.town_residents where id = ra; r := public.town_rent(r); rep := rep||'at 100400 money '||r.money||' (期望 100000，無稅)'||E'\n';
  -- 奢侈品錢不夠
  update public.town_residents set money = 2999, energy = 80, hunger = 40, fun = 20, sleeping = false, seen_at = now(), place = 'restaurant', items = '{}'::jsonb where id = ra;
  begin perform public.town_fac(ra,'1234','feast'); rep := rep||'feast poor NOT BLOCKED'||E'\n'; exception when others then rep := rep||'feast poor: '||sqlerrm||E'\n'; end;
  select * into r from public.town_residents where id = ra; rep := rep||'money still '||r.money||' (期望 2999)'||E'\n';
  update public.town_residents set money = 3000 where id = ra;
  perform public.town_fac(ra,'1234','feast'); select * into r from public.town_residents where id = ra; rep := rep||'feast exact money '||r.money||' (期望 0，不為負)'||E'\n';
  -- 薪水不抽基金
  select fund into f0 from public.town_towns where id = tid;
  update public.town_residents set place = 'office', money = 1000, energy = 80, hunger = 80, items = items - 'cd' where id = ra;
  begin perform public.town_act(ra,'1234','work'); exception when others then rep := rep||'work err: '||sqlerrm||E'\n'; end;
  select * into r from public.town_residents where id = ra; select fund into f1 from public.town_towns where id = tid;
  rep := rep||'work money '||r.money||' (應 >1000) fund '||f0||' -> '||f1||' (期望不變)'||E'\n';
  raise exception 'REPORT%', E'\n'||rep;
end $$;

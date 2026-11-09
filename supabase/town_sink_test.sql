-- 財產稅、鎮基金、奢侈品實測：接在 town.sql、town_social.sql、town_fac.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rep text := ''; tid text; j json; r public.town_residents;
begin
  cr := public.town_create('ZZSK','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  -- 財產稅：現金 200000、小屋房租 400 → 剩 199600 → 稅 floor(99600*0.005)=498
  update public.town_residents set money = 200000, items = items - 'rent' - 'tx' where id = ra;
  select * into r from public.town_residents where id = ra; r := public.town_rent(r);
  rep := rep||'tax money '||r.money||' (期望 199102) tx='||(r.items->'tx')::text||E'\n';
  r := public.town_rent(r); rep := rep||'same day again money '||r.money||' (不變)'||E'\n';
  update public.town_residents set money = 5000, items = items - 'rent' - 'tx' where id = ra;
  select * into r from public.town_residents where id = ra; r := public.town_rent(r);
  rep := rep||'poor money '||r.money||' (期望 4600，沒稅) tx='||coalesce((r.items->'tx')::text,'null')||E'\n';
  rep := rep||'fund '||(select fund||' '||fund_log::text from public.town_towns where id = tid)||' (期望 498+10+20 約 528)'||E'\n';
  -- 奢侈品
  update public.town_residents set money = 20000, energy = 80, hunger = 40, fun = 20, sleeping = false, seen_at = now(), place = 'restaurant', items = items - 'cd' where id = ra;
  j := public.town_fac(ra,'1234','feast'); select * into r from public.town_residents where id = ra; rep := rep||'feast '||j::text||' money '||r.money||' (期望 17000)'||E'\n';
  begin perform public.town_fac(ra,'1234','feast'); rep := rep||'feast cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'feast cd: '||sqlerrm||E'\n'; end;
  update public.town_residents set place = 'plaza' where id = ra;
  j := public.town_fac(ra,'1234','trip'); rep := rep||'trip '||j::text||E'\n';
  update public.town_residents set place = 'gym' where id = ra;
  j := public.town_fac(ra,'1234','spa'); select * into r from public.town_residents where id = ra; rep := rep||'spa '||j::text||' money '||r.money||' (期望 7000)'||E'\n';
  rep := rep||'fund after lux '||(select fund from public.town_towns where id = tid)||' (多 150+400+100=650)'||E'\n';
  update public.town_towns set off = array['lux'] where id = tid; update public.town_residents set place = 'restaurant', items = items - 'cd' where id = ra;
  begin perform public.town_fac(ra,'1234','feast'); rep := rep||'lux off NOT BLOCKED'||E'\n'; exception when others then rep := rep||'lux off: '||sqlerrm||E'\n'; end;
  raise exception 'REPORT%', E'\n'||rep;
end $$;

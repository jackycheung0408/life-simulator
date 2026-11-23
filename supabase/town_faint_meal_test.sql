-- 醒來供餐實測：昏倒期滿醒來後飽足 >= 50，連續 tick 不會再昏倒。最後 rollback，結果在 REPORT。
do $$
declare cr json; ra bigint; tid text; rep text := ''; r1 public.town_residents; n int;
begin
  cr := public.town_create('ZZFM','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  update public.town_residents set place='hospital', x=61, y=14, sleeping=true, energy=90, hunger=0, fun=90, hygiene=90, bladder=90, money=50000, items='{"fi":"hospital"}'::jsonb, seen_at=now(), updated_at=now()-interval '2 minutes' where id=ra;
  update public.town_residents set items=jsonb_set(items,'{faint}', to_jsonb((now()-interval '1 minute')::text)) where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'醒來：sleeping='||r1.sleeping||' hunger='||round(r1.hunger::numeric)||case when not r1.sleeping and r1.hunger>=49 then ' OK' else ' BAD' end||E'\n';
  update public.town_residents set updated_at=now()-interval '1 minute' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  select count(*) into n from public.town_events where actor=ra and msg like '%餓到昏倒%';
  rep := rep||'再 tick：昏倒事件='||n||case when n=0 then ' OK' else ' BAD' end||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

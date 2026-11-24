-- 平衡批 1 實測：自動吃預設開／明確關、醒來 30 分鐘保護、保護期滿又會昏倒。最後 rollback，結果在 REPORT。
do $$
declare cr json; ra bigint; tid text; rep text := ''; r1 public.town_residents; n int;
begin
  cr := public.town_create('ZZB1','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  -- 1 預設開（沒有 ae）：飽足 1、有 2 包零食 → 自動吃
  update public.town_residents set place='street', sleeping=false, energy=90, hunger=1, fun=90, hygiene=90, bladder=90, money=50000, items='{"snack":2}'::jsonb, seen_at=now(), updated_at=now()-interval '1 minute' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'預設開：零食='||coalesce(r1.items->>'snack','?')||case when (r1.items->>'snack')::int=1 then ' OK' else ' BAD' end||E'\n';
  -- 2 明確關
  update public.town_residents set hunger=1, items='{"snack":2,"ae":false}'::jsonb, updated_at=now()-interval '1 minute' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'明確關：零食='||coalesce(r1.items->>'snack','?')||case when (r1.items->>'snack')::int=2 then ' OK' else ' BAD' end||E'\n';
  -- 3 醒來後保護：昏倒期滿 → 醒來有 fg；馬上餓到 0 不昏倒
  update public.town_residents set place='hospital', x=61, y=14, sleeping=true, hunger=0, items='{"fi":"hospital","ae":false}'::jsonb, updated_at=now()-interval '2 minutes' where id=ra;
  update public.town_residents set items=jsonb_set(items,'{faint}', to_jsonb((now()-interval '1 minute')::text)) where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'醒來：fg='||coalesce(r1.items->>'fg','無')||case when r1.items->>'fg' is not null then ' OK' else ' BAD' end||E'\n';
  update public.town_residents set sleeping=false, hunger=0, place='street', items=items - 'faint' - 'hosp', updated_at=now()-interval '1 minute' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  select count(*) into n from public.town_events where actor=ra and msg like '%餓到昏倒%';
  rep := rep||'保護中：sleeping='||r1.sleeping||' 昏倒事件='||n||case when not r1.sleeping and n=0 then ' OK' else ' BAD' end||E'\n';
  -- 4 保護過期
  update public.town_residents set hunger=0, items=jsonb_set(items,'{fg}', to_jsonb((now()-interval '1 minute')::text)), updated_at=now()-interval '1 minute' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'過期後：sleeping='||r1.sleeping||case when r1.sleeping then ' OK' else ' BAD' end||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

-- 餓昏倒減頻實測：自動吃零食（開／關／沒零食）、醫藥費階梯 500／1000／1500、付到 0。最後 rollback，結果在 REPORT。
do $$
declare cr json; ra bigint; tid text; rep text := ''; r1 public.town_residents; m0 int; m1 int; n int;
begin
  cr := public.town_create('ZZFR','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=1, fun=90, hygiene=90, bladder=90, money=50000, items='{"snack":2}'::jsonb, seen_at=now(), updated_at=now()-interval '3 minutes' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'沒開設定：昏倒 sleeping='||r1.sleeping||' 零食='||(r1.items->>'snack')||case when r1.sleeping and (r1.items->>'snack')='2' then ' OK' else ' BAD' end||E'\n';
  update public.town_residents set sleeping=false, hunger=1, items='{"snack":2,"ae":true}'::jsonb, updated_at=now()-interval '2 minutes', place='street' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'開了設定：sleeping='||r1.sleeping||' hunger='||round(r1.hunger::numeric)||' 零食='||(r1.items->>'snack')||case when not r1.sleeping and (r1.items->>'snack')='1' and r1.hunger>=15 then ' OK' else ' BAD' end||E'\n';
  update public.town_residents set sleeping=false, hunger=1, items='{"snack":0,"ae":true}'::jsonb, updated_at=now()-interval '3 minutes', place='street' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'開了但沒零食：sleeping='||r1.sleeping||case when r1.sleeping then ' OK' else ' BAD' end||E'\n';
  -- 醫藥費階梯：連續 4 次醒來
  update public.town_residents set items='{}'::jsonb, money=50000 where id=ra;
  for n in 1..4 loop
    update public.town_residents set items=jsonb_set(items,'{faint}', to_jsonb((now()-interval '1 minute')::text)), sleeping=true, updated_at=now()-interval '2 minutes', seen_at=now(), hunger=50 where id=ra;
    select money into m0 from public.town_residents where id=ra;
    select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
    select money into m1 from public.town_residents where id=ra;
    rep := rep||'第 '||n||' 次醒來扣 '||(m0-m1)||case when m0-m1 = (case n when 1 then 500 when 2 then 1000 else 1500 end) then ' OK' else ' BAD' end||E'\n';
  end loop;
  -- 付到 0 為止
  update public.town_residents set items=jsonb_set(items,'{faint}', to_jsonb((now()-interval '1 minute')::text)), sleeping=true, updated_at=now()-interval '2 minutes', seen_at=now(), hunger=50, money=200 where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  select money into m1 from public.town_residents where id=ra;
  rep := rep||'只有 200 時：錢='||m1||case when m1=0 then ' OK' else ' BAD' end||E'\n';
  -- 設定 RPC
  perform public.town_autoeat(ra,'1234',true);
  rep := rep||'town_autoeat 開：ae='||coalesce((select items->>'ae' from public.town_residents where id=ra),'null')||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

-- 昏倒重複寫入修正實測：連續呼叫兩次 town_tick（含只讀不存的路徑）只昏倒一次、醒來只扣一次醫藥費。最後 rollback，結果在 REPORT。
do $$
declare cr json; ra bigint; tid text; rep text := ''; r1 public.town_residents; n1 int; n2 int; m0 int; m1 int; m2 int;
begin
  cr := public.town_create('ZZFX','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  -- 餓到 0、醒著、在街上、剛剛有動作：下一次 tick 會昏倒
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=0, fun=90, hygiene=90, bladder=90, money=50000, items='{}'::jsonb, seen_at=now(), updated_at=now()-interval '2 minutes' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);          -- 第一次：昏倒（呼叫者不存檔）
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);          -- 第二次：不可再昏倒
  select count(*) into n1 from public.town_events where actor=ra and kind='faint' and msg like '%餓到昏倒%';
  rep := rep||'昏倒事件筆數（應為 1）：'||n1||case when n1=1 then ' OK' else ' BAD' end||E'\n';
  select * into r1 from public.town_residents where id=ra;
  rep := rep||'DB 狀態 sleeping='||r1.sleeping||' faint='||coalesce(r1.items->>'faint','null')||' place='||r1.place||E'\n';
  -- 昏倒滿 1 小時：醒來付醫藥費，連續兩次 tick 只能扣一次
  update public.town_residents set items=jsonb_set(items,'{faint}', to_jsonb((now()-interval '1 minute')::text)), money=50000, updated_at=now()-interval '2 minutes', seen_at=now(), hunger=50 where id=ra;
  select money into m0 from public.town_residents where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  select money into m1 from public.town_residents where id=ra;
  select count(*) into n2 from public.town_events where actor=ra and kind='faint' and msg like '%醫院醒來%';
  rep := rep||'醒來事件筆數（應為 1）：'||n2||'；錢 '||m0||' → '||m1||'（應扣 1500）'||case when n2=1 and m0-m1=1500 then ' OK' else ' BAD' end||E'\n';
  -- 走正式入口：town_state 連呼叫兩次
  update public.town_residents set hunger=0, sleeping=false, items='{}'::jsonb, money=50000, updated_at=now()-interval '2 minutes', seen_at=now() where id=ra;
  perform public.town_state(tid); perform public.town_state(tid);
  select count(*) into n1 from public.town_events where actor=ra and kind='faint' and msg like '%餓到昏倒%';
  rep := rep||'town_state 兩次後昏倒總筆數（應為 2：先前 1＋這次 1）：'||n1||case when n1=2 then ' OK' else ' BAD' end||E'\n';
  select money into m2 from public.town_residents where id=ra;
  rep := rep||'錢不為負：'||m2||case when m2>=0 then ' OK' else ' BAD' end||E'\n';
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

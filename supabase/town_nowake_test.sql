-- 白天不自然醒實測：接在 town.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮）
-- 現在是台灣白天（8～21 點）才有意義；半夜會顯示「現在不是白天，無法驗證白天」
do $$
declare cr json; ra bigint; rep text := ''; r1 public.town_residents; hr int := extract(hour from (now() at time zone 'Asia/Taipei'))::int;
begin
  cr := public.town_create('ZZNW','甲','1234'); ra := (cr->>'resident_id')::bigint;
  update public.town_residents set place='home:'||ra, sleeping=true, energy=100, hunger=90, fun=90, hygiene=90, bladder=90, items='{}'::jsonb, seen_at=now()-interval '3 hours', updated_at=now()-interval '3 hours' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'現在台灣 '||hr||' 點；睡著離線 3 小時、精力 100 → tick 後 sleeping = '||r1.sleeping||'（白天期望 true）'||E'\n';
  if hr not between 8 and 21 then rep := rep||'（現在不是白天，無法驗證白天）'||E'\n'; end if;
  raise exception E'REPORT\n%', rep;
end $$;

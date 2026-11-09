-- 沒家具的陽春互動實測：接在 town_home.sql、town.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback（測試鎮，不碰真人）
-- 檢查：沒家具 vs 有家具的吃飯、上廁所、洗澡、看電視、快速休息、睡覺數值；舊角色（items = {}）沒家具也能做、不被擋、不扣錢
do $$
declare cr json; ra bigint; rep text := ''; r1 public.town_residents; m0 int;
begin
  cr := public.town_create('ZZFX','甲','1234'); ra := (cr->>'resident_id')::bigint;
  update public.town_residents set place='home:'||ra, sleeping=false, energy=10, hunger=10, fun=50, hygiene=40, bladder=10, money=5000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id=ra;
  perform public.town_act(ra,'1234','eat');   select * into r1 from public.town_residents where id=ra;
  rep := rep||'無冰箱吃飯：飽足 '||r1.hunger||'（期望約 42，含心情倍率）心情 '||r1.fun||'（期望 47）錢 '||(5000-r1.money)||'（期望 60）'||E'\n';
  update public.town_residents set bladder=10, hygiene=60, fun=50 where id=ra;
  perform public.town_act(ra,'1234','toilet'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'無馬桶：膀胱 '||r1.bladder||'（100）清潔 '||r1.hygiene||'（50）心情 '||r1.fun||'（47）'||E'\n';
  update public.town_residents set hygiene=40, energy=10, fun=50 where id=ra;
  perform public.town_act(ra,'1234','shower'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'無淋浴間：清潔 '||r1.hygiene||'（約 82）精力 '||r1.energy||'（10）'||E'\n';
  update public.town_residents set fun=50 where id=ra;
  perform public.town_act(ra,'1234','tv'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'無電視櫃：心情 '||r1.fun||'（56）'||E'\n';
  update public.town_residents set energy=10 where id=ra;
  perform public.town_act(ra,'1234','nap'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'無沙發按摩椅快速休息：精力 '||r1.energy||'（60）'||E'\n';
  -- 有家具：數值照舊
  update public.town_residents set items='{"fu":["fridge","toilet","shower","tvcab","massage","bed"]}'::jsonb, hunger=10, bladder=10, hygiene=40, fun=50, energy=10, money=5000 where id=ra;
  perform public.town_act(ra,'1234','eat');   select * into r1 from public.town_residents where id=ra;
  rep := rep||'有冰箱吃飯：飽足 '||r1.hunger||'（約 58）心情 '||r1.fun||'（50）錢 '||(5000-r1.money)||'（30）'||E'\n';
  perform public.town_act(ra,'1234','toilet'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'有馬桶：清潔 '||r1.hygiene||'（40）'||E'\n';
  perform public.town_act(ra,'1234','shower'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'有淋浴間：清潔 '||r1.hygiene||'（100）'||E'\n';
  update public.town_residents set fun=50, energy=10, items=jsonb_set(items,'{cd}','{}') where id=ra;
  perform public.town_act(ra,'1234','tv'); perform public.town_act(ra,'1234','nap'); select * into r1 from public.town_residents where id=ra;
  rep := rep||'有電視櫃（無沙發）：心情 '||r1.fun||'（65）有按摩椅精力 '||r1.energy||'（約 107→100 封頂，含看電視 −3）'||E'\n';
  -- 睡覺回精力：睡地上 64／小時
  update public.town_residents set items='{}'::jsonb, sleeping=true, energy=0, seen_at=now(), updated_at=now() - interval '1 hour' where id=ra;
  select * into r1 from public.town_residents where id=ra; r1 := public.town_tick(r1);
  rep := rep||'睡地上 1 小時：精力 '||r1.energy||'（期望約 64，清潔多掉 1）'||E'\n';
  raise exception 'REPORT%', E'\n'||rep;
end $$;

-- 小豬鎮金錢宏觀調控回滾實測：結果在錯誤訊息 REPORT（整段最後 rollback）。接在 town_econ.sql 之後貼上。
do $$
declare t text := 'ZZECO'; a bigint; b bigint; c bigint; d bigint; ra public.town_residents; rb public.town_residents; rc public.town_residents; e public.town_econ;
  rep text := ''; i int; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); f0 bigint; f1 bigint; m0 bigint; m1 bigint; msg text; tx0 int; tx1 int; v json; mn int;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZECO1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,mayor,pin_hash,items) values (t,'甲',1000000,0,10,10,'street',true,extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',150000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',30000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',0,3,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{"al":{"n":9}}'::jsonb) returning id into d;
  -- 1 起算係數 1.0
  rep := rep || ' 起算k=' || public.town_econ_k(t,'t') || '/' || public.town_econ_k(t,'p') || '/' || public.town_econ_k(t,'s') || ' 補助=' || public.town_econ_sub(t) || ' 稅(100萬)=' || public.town_tax_k(t, 1000000) || '=' || public.town_tax(1000000);
  -- 2 第一次結算：首富占 85% → 稅係數 +2%；補助：窮人比例 0.25 不動
  perform public.town_econ_tick(t); select * into e from public.town_econ where town_id = t;
  rep := rep || ' 第1天kt=' || e.kt || ' kp=' || e.kp || ' ks=' || e.ks || '';
  perform public.town_econ_tick(t);
  select * into e from public.town_econ where town_id = t; rep := rep || ' 重複後kt=' || e.kt;
  -- 3 連續 15 天：不超過 1.2（每日 ±2%）
  for i in 1..15 loop update public.town_econ set day = 'x' where town_id = t; perform public.town_econ_tick(t); end loop;
  select * into e from public.town_econ where town_id = t; rep := rep || ' 16天後kt=' || e.kt || '(上限1.2) hist=' || jsonb_array_length(e.hist);
  -- 4 活躍 < 3：凍結並慢慢回 1.0
  update public.town_residents set seen_at = now() - interval '10 days' where id in (c, d);
  update public.town_econ set day = 'x' where town_id = t; perform public.town_econ_tick(t); select * into e from public.town_econ where town_id = t; rep := rep || ' 活躍2人kt=' || e.kt;
  update public.town_residents set seen_at = now() where id in (c, d);
  -- 5 公開動態
  rep := rep || ' world動態=' || (select count(*) from public.town_events where town_id = t and kind = 'world');
  -- 6 週回流：基金 100000、上次結算 8 天前
  update public.town_econ set kt = 1, day = null, wk = to_char((now() at time zone 'Asia/Taipei')::date - 8, 'YYYY-MM-DD'), build = 0 where town_id = t;
  update public.town_towns set fund = 100000 where id = t; select fund into f0 from public.town_towns where id = t;
  perform public.town_econ_tick(t); select * into e from public.town_econ where town_id = t; select fund into f1 from public.town_towns where id = t;
  rep := rep || ' 回流 基金' || f0 || '→' || f1 || ' pend=' || e.pend::text || ' pays=' || e.pays::text || ' 建設=' || (select proj::text from public.town_civic where town_id = t) || ' 慶典=' || coalesce((select k from public.town_worlds where town_id = t), 'null');
  rep := rep || ' fund動態=' || (select msg from public.town_events where town_id = t and kind = 'fund' order by id desc limit 1);
  perform public.town_econ_tick(t); rep := rep || ' 同天再結算=無動作';
  -- 7 領補差金（town_rent 開頭）：丁
  select * into rb from public.town_residents where id = d; m0 := rb.money;
  rb := public.town_rent(rb); rep := rep || ' 丁town_rent前' || m0 || '後' || rb.money || ' 領後pend=' || (select coalesce((pend->(d::text))::text,'無') from public.town_econ where town_id = t);
  -- 8 首富稅 = 階梯 × 係數
  update public.town_econ set kt = 1.2 where town_id = t;
  select * into ra from public.town_residents where id = a; ra := public.town_rent(ra); rep := rep || ' 首富稅=' || coalesce((ra.items->'tx'->>'a'), '0') || ' 基準=' || public.town_tax(1000000) || '×1.2';
  -- 9 開關：全域 flag 關掉 = 係數視為 1.0
  insert into public.town_flags(k,v) values ('econ', false) on conflict (k) do update set v = false;
  rep := rep || ' 關閉後kt=' || public.town_econ_k(t,'t') || ' 補助=' || public.town_econ_sub(t) || '';
  perform public.town_econ_tick(t);
  delete from public.town_flags where k = 'econ';
  -- 10 報表與鎮長開關
  v := public.town_econ_view(b, 'x', 'view'); rep := rep || ' 居民看報表on=' || (v->>'on') || ' mine=' || (v->>'mine');
  begin perform public.town_econ_view(b, 'x', 'off'); rep := rep || ' 非鎮長關=成功(錯)'; exception when others then rep := rep || ' 非鎮長關=擋(' || sqlerrm || ')'; end;
  v := public.town_econ_view(a, 'x', 'off'); rep := rep || ' 鎮長關on=' || (v->>'on'); v := public.town_econ_view(a, 'x', 'on'); rep := rep || ' 再開on=' || (v->>'on');
  -- 11 奢侈品價格
  update public.town_econ set kp = 1.1 where town_id = t; rep := rep || ' 奢侈品3000→' || public.town_econ_px(t, 3000);
  -- 12 不變負
  select min(money) into mn from public.town_residents where town_id = t; rep := rep || ' 最小現金=' || mn || ' 基金=' || (select fund from public.town_towns where id = t);
  raise exception 'REPORT %', rep;
end $$;

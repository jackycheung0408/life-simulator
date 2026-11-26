-- 搬家回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_home_move.sql 之後貼上。
-- 流程：玩家自費申請 → 預告 → 時間到惰性結算 → 人與家具不動、門口換位置；加入新居民不撞位置；鎮長搬自己免費立刻；搬回原位。
do $$
declare t text := 'ZZHM1'; a bigint; b bigint; c bigint; d bigint; e bigint; rb public.town_residents; rc public.town_residents; rd public.town_residents; rep text := ''; v json; f0 bigint; j json; dr record; s0 bigint; jn json; ns int;
begin
  insert into public.town_towns(id,name,invite,fund,rows) values (t,'測試鎮','ZZHM11',500000,3) on conflict do nothing;
  insert into public.town_residents(town_id,name,mayor,money,slot,x,y,place,pin_hash,items) values (t,'鎮長',true,1000,0,75,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',100000,1,11,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{"fp":[["bed",1,1]],"fu":["bed"],"hl":2,"lx":{"estate":"2026-11-01"}}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',100000,2,22,5,'home:0',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',1000,3,11,22,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;
  update public.town_residents set place = 'realty', x = 75, y = 5 where id in (b, c);
  perform public.town_fi(a,'x','enter','realty'); perform public.town_fi(b,'x','enter','realty'); perform public.town_fi(c,'x','enter','realty');
  -- 檢視：空位 = 0～8 扣掉自己現在的位置與有人住的（slot 0,2,3 有人）→ 乙看到 4,5,6,7,8
  j := public.town_hmove(b,'x','view'); rep := rep || ' view.free=' || (j->>'free') || '(應[4,5,6,7,8]) cur=' || (j->>'cur') || ' cost=' || (j->>'cost');
  begin perform public.town_hmove(b,'x','apply',4,1); rep := rep || ' 舊版=成功(錯)'; exception when others then rep := rep || ' 舊版=擋'; end;
  begin perform public.town_hmove(b,'x','apply',9,999); rep := rep || ' 第 4 條街未開=成功(錯)'; exception when others then rep := rep || ' 未開放位置=擋'; end;
  begin perform public.town_hmove(b,'x','apply',2,999); rep := rep || ' 有人住=成功(錯)'; exception when others then rep := rep || ' 有人住=擋'; end;
  begin perform public.town_hmove(b,'x','apply',1,999); rep := rep || ' 原位=成功(錯)'; exception when others then rep := rep || ' 原位=擋'; end;
  update public.town_residents set place = 'street' where id = b;
  begin perform public.town_hmove(b,'x','apply',4,999); rep := rep || ' 不在不動產=成功(錯)'; exception when others then rep := rep || ' 不在不動產=擋'; end;
  update public.town_residents set place = 'realty', x = 75, y = 5 where id = b; perform public.town_fi(b,'x','enter','realty');
  update public.town_residents set money = 1000 where id = b;
  begin perform public.town_hmove(b,'x','apply',4,999); rep := rep || ' 錢不夠=成功(錯)'; exception when others then rep := rep || ' 錢不夠=擋「' || sqlerrm || '」'; end;
  update public.town_residents set money = 100000 where id = b;
  v := public.town_hmove(b,'x','apply',4,999); rep := rep || ' 乙申請=' || v::text;
  select money into f0 from public.town_residents where id = b; rep := rep || ' 乙錢=' || f0 || '(應60000)';
  select fund into f0 from public.town_towns where id = t; rep := rep || ' 基金=' || f0 || '(應500000)';
  begin perform public.town_hmove(b,'x','apply',5,999); rep := rep || ' 已有預告再申請=成功(錯)'; exception when others then rep := rep || ' 已有預告=擋'; end;
  begin perform public.town_hmove(c,'x','apply',4,999); rep := rep || ' 丙搶預約位置=成功(錯)'; exception when others then rep := rep || ' 位置被預約=擋'; end;
  j := public.town_state(t); rep := rep || ' 預告時 layout=' || coalesce(j->'town'->>'layout','null') || ' hmv=' || coalesce(j->'town'->>'hmv','null') || '(應有乙的預告)';
  -- 時間到：乙在自己家門口（place home:乙）、丙去乙家門口玩（place home:乙）、丁站在新房子範圍上（site 4 = x 9, y 17 → 範圍 9..13, 17..20）
  update public.town_residents set place = 'home:' || b, x = 4, y = 5 where id = b;
  update public.town_residents set place = 'home:' || b, x = 5, y = 5 where id = c;
  update public.town_residents set x = 10, y = 18 where id = d;
  update public.town_towns set hmv = jsonb_set(hmv, array[b::text,'at'], to_jsonb(floor(extract(epoch from now()))::bigint - 5)) where id = t;
  j := public.town_state(t); rep := rep || ' 結算後 layout=' || (j->'town'->>'layout') || ' hmv=' || coalesce(j->'town'->>'hmv','null');
  select * into rb from public.town_residents where id = b; select * into rc from public.town_residents where id = c; select * into rd from public.town_residents where id = d;
  rep := rep || ' 乙=' || rb.x || ',' || rb.y || '(應11,21) 丙=' || rc.x || ',' || rc.y || '(應12,21) 丁=' || rd.x || ',' || rd.y || '(應12,21) 乙家具=' || (rb.items->>'fp') || ' fu=' || (rb.items->>'fu') || ' 莊園=' || (rb.items->'lx'->>'estate') || ' hl=' || (rb.items->>'hl');
  v := public.town_state(t); rep := rep || ' 冪等:事件數=' || (select count(*) from public.town_events where town_id = t and kind = 'relocate') || '(應2)';
  select * into dr from public.town_hdoor(t, b, 1); rep := rep || ' hdoor=' || dr.dx || ',' || dr.dy || '(應11,21)';
  begin perform public.town_hmove(b,'x','apply',5,999); rep := rep || ' 冷卻中=成功(錯)'; exception when others then rep := rep || ' 冷卻=擋「' || sqlerrm || '」'; end;
  -- 加入新居民：想要 slot 4（位置被乙占著）→ 應給 slot 5
  jn := public.town_join(t,'ZZHM11','新人','1234','{}'::jsonb,4); e := (jn->>'resident_id')::bigint;
  select slot into ns from public.town_residents where id = e; rep := rep || ' 新人 slot=' || ns || '(應5)';
  -- 鎮長：搬自己的家，免費立刻，不受冷卻
  v := public.town_hmove(a,'x','apply',7,999); rep := rep || ' 鎮長=' || v::text;
  j := public.town_state(t); rep := rep || ' 鎮長後 layout=' || (j->'town'->>'layout') || ' hmv=' || coalesce(j->'town'->>'hmv','null');
  select money into f0 from public.town_residents where id = a; rep := rep || ' 鎮長錢=' || f0 || '(應1000)';
  -- 乙冷卻過後搬回原位（site 1）：預告 → 結算後 layout.h 沒有乙
  update public.town_towns set hlast = jsonb_set(hlast, array[b::text], to_jsonb(floor(extract(epoch from now()))::bigint - 90000)) where id = t;
  update public.town_residents set place = 'realty', x = 75, y = 5 where id = b; perform public.town_fi(b,'x','enter','realty');
  v := public.town_hmove(b,'x','apply',1,999); rep := rep || ' 乙搬回=' || v::text;
  update public.town_towns set hmv = jsonb_set(hmv, array[b::text,'at'], to_jsonb(floor(extract(epoch from now()))::bigint - 5)) where id = t;
  j := public.town_state(t); rep := rep || ' 搬回後 layout=' || (j->'town'->>'layout') || ' hmv=' || coalesce(j->'town'->>'hmv','null');
  -- 功能開關
  update public.town_towns set off = array['relocate'] where id = t;
  begin perform public.town_hmove(a,'x','apply',6,999); rep := rep || ' 關閉後=成功(錯)'; exception when others then rep := rep || ' 關閉後=擋'; end;
  update public.town_towns set off = '{}' where id = t;
  rep := rep || ' 居民總錢=' || (select sum(money) from public.town_residents where town_id = t and id <> e) || '(不含新人；原 202000，乙兩次自費各 40000 銷毀 → 應 122000)';
  raise exception 'REPORT %', rep;
end $$;

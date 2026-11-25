-- 設施搬遷回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_move.sql 之後貼上。
-- 流程：玩家自費申請 → 預告 → 時間到惰性結算（把 mv.at 改成過去）→ 人移到新門口、室內 fi 保持、PK 門口讀 layout。
do $$
declare t text := 'ZZMV1'; a bigint; b bigint; c bigint; d bigint; ra public.town_residents; rb public.town_residents; rc public.town_residents; rd public.town_residents; rep text := ''; v json; f0 bigint; j json;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZMV11',500000) on conflict do nothing;
  insert into public.town_residents(town_id,name,mayor,money,slot,x,y,place,pin_hash,items) values (t,'鎮長',true,1000,0,75,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',1000,1,38,5,'cafe',extensions.crypt('x', extensions.gen_salt('bf')),'{"fi":"cafe"}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',1000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',1000,3,40,5,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;
  perform public.town_fi(a,'x','enter','realty');
  -- 檢視、舊版本、非法位置、玩家不在不動產（鎮長 a、玩家 c）
  j := public.town_move(c,'x','view'); rep := rep || ' view.layout=' || (j->>'layout') || ' mv=' || coalesce(j->>'mv','null');
  begin perform public.town_move(a,'x','apply','cafe',88,0,1); rep := rep || ' 舊版=成功(錯)'; exception when others then rep := rep || ' 舊版=擋'; end;
  begin perform public.town_move(a,'x','apply','cafe',89,0,999); rep := rep || ' 非候選=成功(錯)'; exception when others then rep := rep || ' 非候選=擋'; end;
  begin perform public.town_move(a,'x','apply','townhall',88,0,999); rep := rep || ' 市政廳=成功(錯)'; exception when others then rep := rep || ' 市政廳=擋'; end;
  begin perform public.town_move(a,'x','apply','cafe',36,0,999); rep := rep || ' 原位=成功(錯)'; exception when others then rep := rep || ' 原位=擋'; end;
  begin perform public.town_move(c,'x','apply','cafe',88,0,999); rep := rep || ' 玩家不在不動產=成功(錯)'; exception when others then rep := rep || ' 玩家不在不動產=擋'; end;
  -- 玩家 c 進不動產公司：錢不夠被擋，錢夠自費申請（咖啡廳 6×5×2000 = 60000）
  update public.town_residents set place = 'realty', x = 75, y = 5 where id = c; perform public.town_fi(c,'x','enter','realty');
  begin perform public.town_move(c,'x','apply','cafe',88,0,999); rep := rep || ' 玩家錢不夠=成功(錯)'; exception when others then rep := rep || ' 玩家錢不夠=擋「' || sqlerrm || '」'; end;
  update public.town_residents set money = 100000 where id = c;
  v := public.town_move(c,'x','apply','cafe',88,0,999); rep := rep || ' 玩家申請=' || v::text;
  select money into f0 from public.town_residents where id = c; rep := rep || ' 玩家錢剩=' || f0 || '(應40000)';
  select fund into f0 from public.town_towns where id = t; rep := rep || ' 基金=' || f0 || '(應500000 沒動)';
  begin perform public.town_move(c,'x','apply','gym',88,17,999); rep := rep || ' 預告中玩家再申請=成功(錯)'; exception when others then rep := rep || ' 預告中玩家再申請=擋'; end;
  -- 預告期間設施仍在原位
  j := public.town_state(t); rep := rep || ' 預告時 layout=' || coalesce(j->'town'->>'layout','null') || ' mv.k=' || coalesce(j->'town'->'mv'->>'k','null');
  select * into rb from public.town_residents where id = b; rep := rep || ' 乙座標=' || rb.x || ',' || rb.y;
  -- 時間到：把 at 改成過去，town_state 觸發結算
  update public.town_towns set mv = jsonb_set(mv, '{at}', to_jsonb(floor(extract(epoch from now()))::bigint - 5)) where id = t;
  update public.town_residents set x = 90, y = 2 where id = d;  -- 丁站在新建築範圍上
  j := public.town_state(t); rep := rep || ' 結算後 layout=' || (j->'town'->>'layout') || ' mv=' || coalesce(j->'town'->>'mv','null');
  select * into rb from public.town_residents where id = b; select * into rd from public.town_residents where id = d;
  rep := rep || ' 乙(在咖啡廳)=' || rb.x || ',' || rb.y || ' fi=' || coalesce(rb.items->>'fi','無') || '(應90,5 fi=cafe) 丁(站新範圍)=' || rd.x || ',' || rd.y || '(應90,5)';
  v := public.town_state(t); rep := rep || ' 冪等:事件數=' || (select count(*) from public.town_events where town_id = t and kind = 'relocate') || '(應2)';
  -- 玩家冷卻 24 小時
  begin perform public.town_move(c,'x','apply','gym',88,17,999); rep := rep || ' 玩家冷卻中=成功(錯)'; exception when others then rep := rep || ' 玩家冷卻中=擋「' || sqlerrm || '」'; end;
  -- 鎮長：冷卻中也能立刻搬、免費、基金與自己的錢不動、不留預告
  v := public.town_move(a,'x','apply','gym',88,17,999); rep := rep || ' 鎮長立刻搬=' || v::text;
  j := public.town_state(t); rep := rep || ' 鎮長搬後 layout=' || (j->'town'->>'layout') || ' mv=' || coalesce(j->'town'->>'mv','null');
  select money into f0 from public.town_residents where id = a; rep := rep || ' 鎮長錢=' || f0 || '(應1000)';
  begin perform public.town_move(a,'x','apply','restaurant',88,0,999); rep := rep || ' 餐廳搬到咖啡廳新位置=成功(錯)'; exception when others then rep := rep || ' 重疊=擋「' || sqlerrm || '」'; end;
  -- 乙（玩家）申請電影院搬東區中段；鎮長不能搬進那個預告位置；鎮長把電影院立刻搬到別處 → 預告取消並退費給乙
  update public.town_towns set mvlast = now() - interval '25 hours' where id = t;
  update public.town_residents set money = 100000, place = 'realty', x = 75, y = 5 where id = b; perform public.town_fi(b,'x','enter','realty');
  v := public.town_move(b,'x','apply','cinema',88,9,999); rep := rep || ' 乙申請電影院=' || v::text;
  begin perform public.town_move(a,'x','apply','restaurant',88,9,999); rep := rep || ' 搬進預告位置=成功(錯)'; exception when others then rep := rep || ' 搬進預告位置=擋「' || sqlerrm || '」'; end;
  v := public.town_move(a,'x','apply','gym',38,17,999);  -- 鎮長先把健身房搬回原位，空出東區南段
  v := public.town_move(a,'x','apply','cinema',88,17,999); rep := rep || ' 鎮長搬走預告中的電影院=' || v::text;
  select money into f0 from public.town_residents where id = b; rep := rep || ' 乙錢=' || f0 || '(應100000 已退費)';
  j := public.town_state(t); rep := rep || ' 預告=' || coalesce(j->'town'->>'mv','null') || '(應null)';
  -- 功能開關
  update public.town_towns set mv = null, mvlast = null, off = array['relocate'] where id = t;
  begin perform public.town_move(a,'x','apply','gym',88,9,999); rep := rep || ' 關閉後=成功(錯)'; exception when others then rep := rep || ' 關閉後=擋'; end;
  update public.town_towns set off = '{}' where id = t;
  -- PK 門口讀 layout（格鬥場先搬到 88,0 → 門 91,6）
  update public.town_towns set layout = coalesce(layout,'{}'::jsonb) || '{"arena":[88,0]}'::jsonb where id = t;
  rep := rep || ' arena門=' || (public.town_mv_door(t,'arena'))[1] || ',' || (public.town_mv_door(t,'arena'))[2] || '(應91,6) 預設cafe門=' || (public.town_mv_door('NOPE','cafe') is null);
  rep := rep || ' 居民總錢=' || (select sum(money) from public.town_residents where town_id = t) || '(玩家自費 60000 銷毀，其餘不變)';
  raise exception 'REPORT %', rep;
end $$;

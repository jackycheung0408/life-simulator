-- 莊園獨立一棟回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_estate_plot.sql 之後貼上。
do $$
declare t text := 'ZZEST'; a bigint; b bigint; c bigint; ra public.town_residents; rep text := ''; v json; m0 bigint; hl0 int;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZES1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',2000000,0,75,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{"hl":3}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',100000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',2000000,2,75,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{"hl":1}'::jsonb) returning id into c;
  insert into public.town_flags(k,v) values ('shops_in', true) on conflict (k) do update set v = true;
  -- 甲、丙買莊園：序號 0、1，家不變，錢扣 60 萬
  v := public.town_fi(a,'x','enter','realty'); v := public.town_fi(c,'x','enter','realty');
  select money into m0 from public.town_residents where id = a;
  perform public.town_econ_use(a,'x','buy','estate'); perform public.town_econ_use(c,'x','buy','estate');
  select * into ra from public.town_residents where id = a;
  rep := rep || ' 甲 花=' || (m0 - ra.money) || '(應約600000) ep=' || (ra.items->'lx'->>'ep') || '(應0) hl=' || (ra.items->>'hl') || '(應3不變)';
  select * into ra from public.town_residents where id = c;
  rep := rep || ' 丙 ep=' || (ra.items->'lx'->>'ep') || '(應1)';
  -- 地點名
  rep := rep || ' 地點名=' || public.town_place_name('estate:' || a);
  -- 走去莊園（甲）、進去
  perform public.town_act(a,'x','move',null,3,80,'estate:' || a);
  v := public.town_fi(a,'x','enter','estate:' || a);
  select * into ra from public.town_residents where id = a;
  rep := rep || ' 甲進自己莊園 fi=' || coalesce(ra.items->>'fi','無');
  -- 乙走去甲的莊園：甲在裡面 → 可進
  update public.town_residents set place = 'estate:' || a, x = 3, y = 80 where id = b;
  v := public.town_fi(b,'x','enter','estate:' || a);
  rep := rep || ' 乙(甲在)進=可';
  -- 乙去丙的莊園：丙不在 → 擋
  update public.town_residents set place = 'estate:' || c, x = 12, y = 80, items = items - 'fi' where id = b;
  begin v := public.town_fi(b,'x','enter','estate:' || c); rep := rep || ' 乙進丙(不在)=成功(錯)'; exception when others then rep := rep || ' 乙進丙(不在)=擋「' || sqlerrm || '」'; end;
  -- 派對：甲在自己莊園室內可辦；不在室內擋
  select money into m0 from public.town_residents where id = a;
  v := public.town_econ_fun(a,'x','party'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 派對 花=' || (m0 - ra.money) || '(應5000) pt=' || coalesce(ra.items->'lxc'->>'pt','無');
  begin v := public.town_econ_fun(c,'x','party'); rep := rep || ' 丙不在莊園辦派對=成功(錯)'; exception when others then rep := rep || ' 丙不在莊園辦派對=擋「' || sqlerrm || '」'; end;
  -- 派對進行中，乙可進丙的莊園？（丙沒辦）→ 擋；甲的莊園（派對中，甲離開）→ 可
  update public.town_residents set place = 'street', items = items - 'fi' where id = a;
  update public.town_residents set place = 'estate:' || a, x = 3, y = 80, items = items - 'fi' where id = b;
  begin v := public.town_fi(b,'x','enter','estate:' || a); rep := rep || ' 派對中甲不在，乙進=可'; exception when others then rep := rep || ' 派對中乙進=擋(錯)' || sqlerrm; end;
  -- 不是莊園主人的地點
  begin perform public.town_act(b,'x','move',null,3,80,'estate:' || b); rep := rep || ' 走去沒莊園的人的莊園=成功(錯)'; exception when others then rep := rep || ' 走去沒莊園的人的莊園=擋'; end;
  -- 一次性遷移冪等：再配一次不會改序號
  perform public.town_estate_assign(t, a); select * into ra from public.town_residents where id = a;
  rep := rep || ' 重複配 ep=' || (ra.items->'lx'->>'ep') || '(應0)';
  raise exception 'REPORT:%', rep;
end $$;

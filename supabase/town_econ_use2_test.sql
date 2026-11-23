-- 遊艇出海／莊園派對回滾實測：結果在 REPORT（最後 rollback）。接在 town_econ_use2.sql 之後貼上。
do $$
declare t text := 'ZZFUN'; a bigint; b bigint; c bigint; d bigint; ra public.town_residents; rb public.town_residents; rep text := ''; v json; f0 bigint; s0 bigint;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZFUN1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,fun,pin_hash,items) values (t,'甲',500000,0,68,18,'street',40,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,fun,pin_hash,items) values (t,'乙',1000,1,67,19,'street',40,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,fun,pin_hash,items) values (t,'丙',1000,2,10,10,'street',40,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,fun,sleeping,pin_hash,items) values (t,'丁',1000,3,68,19,'street',40,true,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;
  begin perform public.town_econ_fun(a,'x','yacht'); rep := rep || ' 沒遊艇=成功(錯)'; exception when others then rep := rep || ' 沒遊艇=擋'; end;
  perform public.town_econ_use(a,'x','buy','yacht');
  select sum(money) into s0 from public.town_residents where town_id = t; select fund into f0 from public.town_towns where id = t;
  begin perform public.town_econ_fun(b,'x','yacht'); rep := rep || ' 乙沒遊艇=成功(錯)'; exception when others then rep := rep || ' 乙沒遊艇=擋'; end;
  update public.town_residents set x = 10, y = 10 where id = a;
  begin perform public.town_econ_fun(a,'x','yacht'); rep := rep || ' 不在碼頭=成功(錯)'; exception when others then rep := rep || ' 不在碼頭=擋'; end;
  update public.town_residents set x = 68, y = 18 where id = a;
  v := public.town_econ_fun(a,'x','yacht'); select * into ra from public.town_residents where id = a; select * into rb from public.town_residents where id = b;
  rep := rep || ' 出海=' || v::text || ' 甲心情=' || ra.fun || '(應65) 乙心情=' || rb.fun || '(應65) 丙=' || (select fun from public.town_residents where id = c) || '(應40) 丁睡著=' || (select fun from public.town_residents where id = d) || '(應40) 好感甲乙=' || public.town_bond_get(a, b) || ' 基金+' || ((select fund from public.town_towns where id = t) - f0) || '(應600) 甲錢少=' || (500000 - 200000 - ra.money) || '(應2000)';
  begin perform public.town_econ_fun(a,'x','yacht'); rep := rep || ' 1小時內再出=成功(錯)'; exception when others then rep := rep || ' 1小時內再出=擋'; end;
  update public.town_residents set items = items - 'lxc' where id = a; update public.town_residents set x = 10, y = 10 where id = b;
  begin perform public.town_econ_fun(a,'x','yacht'); rep := rep || ' 沒人在碼頭=成功(錯)'; exception when others then rep := rep || ' 沒人在碼頭=擋'; end;
  update public.town_residents set money = 1000, x = 68, y = 19 where id = a; update public.town_residents set x = 67 where id = b;
  begin perform public.town_econ_fun(a,'x','yacht'); rep := rep || ' 錢不夠=成功(錯)'; exception when others then rep := rep || ' 錢不夠=擋 錢=' || (select money from public.town_residents where id = a); end;
  -- 莊園
  update public.town_residents set money = 500000 where id = a;
  begin perform public.town_econ_fun(a,'x','party'); rep := rep || ' 沒莊園=成功(錯)'; exception when others then rep := rep || ' 沒莊園=擋'; end;
  update public.town_residents set money = 1000000 where id = a; perform public.town_econ_use(a,'x','buy','estate'); update public.town_residents set money = 500000, fun = 40 where id = a;
  begin perform public.town_econ_fun(a,'x','party'); rep := rep || ' 不在家=成功(錯)'; exception when others then rep := rep || ' 不在家=擋'; end;
  update public.town_residents set place = 'home:' || a where id = a; update public.town_residents set fun = 40 where id <> a;
  v := public.town_econ_fun(a,'x','party');
  rep := rep || ' 派對=' || v::text || ' 乙=' || (select fun from public.town_residents where id = b) || '(應55) 丙=' || (select fun from public.town_residents where id = c) || '(應55) 丁睡著=' || (select fun from public.town_residents where id = d) || '(應40) 甲=' || (select fun from public.town_residents where id = a) || '(應55)';
  begin perform public.town_econ_fun(a,'x','party'); rep := rep || ' 同天再辦=成功(錯)'; exception when others then rep := rep || ' 同天再辦=擋'; end;
  insert into public.town_flags(k,v) values ('econ', false) on conflict (k) do update set v = false;
  begin perform public.town_econ_fun(a,'x','party'); rep := rep || ' 關閉=成功(錯)'; exception when others then rep := rep || ' 關閉=擋'; end;
  delete from public.town_flags where k = 'econ';
  rep := rep || ' 最小現金=' || (select min(money) from public.town_residents where town_id = t) || ' 最大心情=' || (select max(fun) from public.town_residents where town_id = t);
  raise exception 'REPORT %', rep;
end $$;

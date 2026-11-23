-- 揪團回滾實測：結果在錯誤訊息 REPORT。接在 town_meet.sql 之後貼上。
do $$
declare t text := 'ZZMET'; a bigint; b bigint; c bigint; d bigint; m bigint; rep text := ''; j json; i int; ra public.town_residents; rb public.town_residents; m0 bigint; m1 bigint;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZMET1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',1000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',1000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',1000,3,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;
  -- 建立：壞參數
  rep := rep || ' 網址=' || (public.town_meet(a,'x','create',null,'meal',30002,'來 www.a.com'))::text;
  rep := rep || ' 太長=' || (public.town_meet(a,'x','create',null,'meal',30002,'一二三四五六七八九十一二三四五六七八九十一'))::text;
  rep := rep || ' 時間錯=' || (public.town_meet(a,'x','create',null,'meal',15002,''))::text;
  rep := rep || ' 人數錯=' || (public.town_meet(a,'x','create',null,'meal',30009,''))::text;
  j := public.town_meet(a,'x','create',null,'meal',30002,'一起吃'); m := (j->>'id')::bigint; rep := rep || ' 建立=' || j::text;
  rep := rep || ' 同時發起第2團=' || (public.town_meet(a,'x','create',null,'cafe',30002,''))::text;
  rep := rep || ' 乙報名=' || (public.town_meet(b,'x','join',m))::text;
  rep := rep || ' 乙重複=' || (public.town_meet(b,'x','join',m))::text;
  rep := rep || ' 丙報名(滿人)=' || (public.town_meet(c,'x','join',m))::text;
  rep := rep || ' 乙退出=' || (public.town_meet(b,'x','leave',m))::text;
  rep := rep || ' 丙報名=' || (public.town_meet(c,'x','join',m))::text;
  rep := rep || ' 發起人退出=' || (public.town_meet(a,'x','leave',m))::text;
  -- 人數上限：丁想加 → 已滿(甲丙)
  rep := rep || ' 丁(滿)=' || (public.town_meet(d,'x','join',m))::text;
  -- 到點：甲在餐廳、丙不在
  update public.town_meets set at = now() - interval '1 minute' where id = m;
  update public.town_residents set place='restaurant' where id = a;
  rep := rep || ' 甲claim=' || (public.town_meet(a,'x','claim'))::text;
  rep := rep || ' 丙未到claim=' || (public.town_meet(c,'x','claim'))::text;
  update public.town_meets set at = now() - interval '20 minutes' where id = m;
  perform public.town_meet(d,'x','list');
  select status into rep from public.town_meets where id = m; -- 暫存
  rep := ''; select ' 只有1人到=' || status || ' attended=' || attended::text into rep from public.town_meets where id = m;
  rep := ' 流團' || rep;
  -- 成團：乙、甲同到餐廳
  update public.town_residents set place='street' where id in (a,b,c);
  j := public.town_meet(a,'x','create',null,'cafe',30004,''); m0 := (j->>'id')::bigint;
  perform public.town_meet(b,'x','join',m0); perform public.town_meet(c,'x','join',m0);
  update public.town_meets set at = now() - interval '1 minute' where id = m0;
  update public.town_residents set place='cafe' where id in (a,b);
  perform public.town_meet(a,'x','claim'); perform public.town_meet(b,'x','claim'); perform public.town_meet(c,'x','claim');
  update public.town_meets set at = now() - interval '20 minutes' where id = m0;
  update public.town_residents set fun = 50, energy = 50, money = 1000 where id in (a,b,c);
  perform public.town_meet(d,'x','list');
  select * into ra from public.town_residents where id = a; select * into rb from public.town_residents where id = c;
  rep := rep || ' 成團:甲fun=' || ra.fun || ' 精力=' || ra.energy || ' 錢=' || ra.money || ' mt=' || (ra.items->'mt')::text || ' 稱號=' || coalesce((ra.items->'titles')::text,'無');
  rep := rep || ' 丙(未到)fun=' || rb.fun || ' mt=' || coalesce((rb.items->'mt')::text,'無');
  rep := rep || ' 好感甲乙=' || public.town_bond_get(a,b) || ' 好感甲丙=' || public.town_bond_get(a,c);
  -- 獎勵每天上限 3：連做 4 團，第 4 次不加心情
  update public.town_residents set items = jsonb_set(items,'{mt}', jsonb_build_object('n',3,'d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'dn',3)) where id in (a,b);
  update public.town_residents set fun = 50, place='gym' where id in (a,b);
  j := public.town_meet(a,'x','create',null,'gym',30002,''); m1 := (j->>'id')::bigint; perform public.town_meet(b,'x','join',m1);
  update public.town_meets set at = now() - interval '1 minute' where id = m1;
  perform public.town_meet(a,'x','claim'); perform public.town_meet(b,'x','claim');
  update public.town_meets set at = now() - interval '20 minutes' where id = m1;
  perform public.town_meet(d,'x','list');
  select * into ra from public.town_residents where id = a;
  rep := rep || ' 上限後甲fun=' || ra.fun || '(應為50) n=' || (ra.items->'mt'->>'n');
  -- 每天發起 5 團上限 / 同時參加 3 團
  for i in 1..5 loop insert into public.town_meets(town_id,host,k,place,at,cap,members,status) values (t,d,'free','plaza',now()+interval '1 hour',4,array[d],'cancel'); end loop;
  rep := rep || ' 第6團=' || (public.town_meet(d,'x','create',null,'free',30002,''))::text;
  -- 取消
  j := public.town_meet(c,'x','create',null,'free',30002,''); m := (j->>'id')::bigint;
  rep := rep || ' 非發起人取消=' || (public.town_meet(b,'x','cancel',m))::text || ' 發起人取消=' || (public.town_meet(c,'x','cancel',m))::text;
  raise exception 'REPORT %', rep;
end $$;

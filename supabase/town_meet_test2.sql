-- 揪團補測（驗證與人數上限）：回滾，結果在錯誤訊息 REPORT。接在 town_meet.sql 之後貼上。
do $$
declare t text := 'ZZMT2'; a bigint; b bigint; c bigint; d bigint; m bigint; rep text := ''; j json;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZMT21') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',1000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',1000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',1000,3,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into d;
  rep := rep || E'\n網址www=' || public.town_meet(a,'x','create',null,'meal',30002,'來 www.a.com')::text;
  rep := rep || E'\n網址http=' || public.town_meet(a,'x','create',null,'meal',30002,'http://x')::text;
  rep := rep || E'\n過長=' || public.town_meet(a,'x','create',null,'meal',30002,'一二三四五六七八九十一二三四五六七八九十一')::text;
  rep := rep || E'\n時間15=' || public.town_meet(a,'x','create',null,'meal',15002,'')::text;
  rep := rep || E'\n人數9=' || public.town_meet(a,'x','create',null,'meal',30009,'')::text;
  rep := rep || E'\n人數1=' || public.town_meet(a,'x','create',null,'meal',30001,'')::text;
  rep := rep || E'\n壞類型=' || public.town_meet(a,'x','create',null,'zzz',30002,'')::text;
  j := public.town_meet(a,'x','create',null,'meal',30002,'一起吃'); m := (j->>'id')::bigint; rep := rep || E'\n正常建立=' || j::text;
  rep := rep || E'\n同時第2團=' || public.town_meet(a,'x','create',null,'cafe',30002,'')::text;
  rep := rep || E'\n乙報名=' || public.town_meet(b,'x','join',m)::text;
  rep := rep || E'\n乙重複=' || public.town_meet(b,'x','join',m)::text;
  rep := rep || E'\n丙(滿人)=' || public.town_meet(c,'x','join',m)::text;
  rep := rep || E'\n發起人退出=' || public.town_meet(a,'x','leave',m)::text;
  rep := rep || E'\n乙退出=' || public.town_meet(b,'x','leave',m)::text;
  rep := rep || E'\n丙報名(退出後)=' || public.town_meet(c,'x','join',m)::text;
  raise exception 'REPORT %', rep;
end $$;

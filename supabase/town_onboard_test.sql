-- 新手引導獎勵回滾實測：結果在錯誤訊息 REPORT。接在 town_onboard.sql 之後貼上。
do $$
declare t text := 'ZZOBD'; a bigint; ra public.town_residents; rep text := '';
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZOBD1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',100,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  rep := rep || ' s1=' || public.town_onboard(a,'x',1)::text;
  rep := rep || ' 重複=' || public.town_onboard(a,'x',1)::text;
  rep := rep || ' 沒打工s3=' || public.town_onboard(a,'x',3)::text;
  update public.town_residents set items = items || '{"works":1}'::jsonb where id=a;
  rep := rep || ' s3=' || public.town_onboard(a,'x',3)::text;
  rep := rep || ' s2=' || public.town_onboard(a,'x',2)::text || ' s4=' || public.town_onboard(a,'x',4)::text || ' s5=' || public.town_onboard(a,'x',5)::text;
  rep := rep || ' s9=' || public.town_onboard(a,'x',9)::text;
  select * into ra from public.town_residents where id=a;
  rep := rep || ' 錢=' || ra.money || '（應 1400）';
  raise exception 'REPORT %', rep;
end $$;

-- 訪客旅人回滾實測：結果在錯誤訊息 REPORT。接在 town_traveler.sql 之後貼上（需台灣 8～22 點）。
do $$
declare t text := 'ZZTRV'; a bigint; ra public.town_residents; rep text := ''; pl text; q int;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZTRV1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash) values (t,'甲',250,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf'))) returning id into a;
  rep := rep || ' view=' || public.town_traveler(a,'x','view')::text;
  pl := (public.town_traveler(a,'x','view')::jsonb)->>'place'; q := ((public.town_traveler(a,'x','view')::jsonb)->>'q')::int;
  rep := rep || ' 不同地點=' || public.town_traveler(a,'x','pick','0')::text;
  update public.town_residents set place=pl where id=a;
  rep := rep || ' 第一次(q=' || q || ')=' || public.town_traveler(a,'x','pick','0')::text;
  rep := rep || ' 重複=' || public.town_traveler(a,'x','pick','0')::text;
  select * into ra from public.town_residents where id=a;
  rep := rep || ' 剩錢=' || ra.money || ' 心情=' || ra.fun;
  raise exception 'REPORT %', rep;
end $$;

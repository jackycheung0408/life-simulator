-- 人設回滾實測：結果在錯誤訊息 REPORT。接在 town_persona.sql 之後貼上。
do $$
declare t text := 'ZZPFT'; a bigint; b bigint; c bigint; rb public.town_residents; rep text := ''; i int;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZPFT1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items,mayor) values (t,'甲',100,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb,true) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',100,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',100,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  rep := rep || ' 設定=' || public.town_persona(b,'x','set',null,'{"nick":"小乙","mt":["好耶","讚"]}')::text;
  rep := rep || ' 太長=' || public.town_persona(b,'x','set',null,'{"nick":"一二三四五六七"}')::text;
  begin perform public.town_persona(b,'x','set',null,'{"nick":"http://a"}'); rep := rep || ' 網址=未擋'; exception when others then rep := rep || ' 網址擋=' || sqlerrm; end;
  begin perform public.town_persona(b,'x','set',null,'{"nick":"a@b"}'); rep := rep || ' @=未擋'; exception when others then rep := rep || ' @擋=' || sqlerrm; end;
  rep := rep || ' 4句=' || public.town_persona(b,'x','set',null,'{"mt":["1","2","3","4"]}')::text;
  rep := rep || ' 全空白=' || public.town_persona(b,'x','set',null,'{"nick":"   "}')::text;
  rep := rep || ' 自己提議=' || public.town_persona(b,'x','propose',b,'x')::text;
  rep := rep || ' 提議=' || public.town_persona(a,'x','propose',b,'豬豬')::text;
  rep := rep || ' 1小時內再提=' || public.town_persona(a,'x','propose',b,'豬2')::text;
  rep := rep || ' 丙提=' || public.town_persona(c,'x','propose',b,'小丙取')::text;
  rep := rep || ' 接受=' || public.town_persona(b,'x','accept',a,null)::text;
  rep := rep || ' 重複接受=' || public.town_persona(b,'x','accept',a,null)::text;
  rep := rep || ' 拒絕丙=' || public.town_persona(b,'x','decline',c,null)::text;
  rep := rep || ' 非鎮長清除=' || public.town_persona(c,'x','clear',b,null)::text;
  rep := rep || ' 鎮長清除=' || public.town_persona(a,'x','clear',b,null)::text;
  select * into rb from public.town_residents where id=b;
  rep := rep || ' 乙items=' || rb.items::text;
  rep := rep || ' 動態=' || (select count(*) from public.town_events where town_id=t and kind in ('persona','mayor'));
  raise exception 'REPORT %', rep;
end $$;

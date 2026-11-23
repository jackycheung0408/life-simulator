-- 小豬鎮大額出口回滾實測：結果在錯誤訊息 REPORT（整段最後 rollback）。接在 town_econ.sql、town_econ_sink.sql 之後貼上。
do $$
declare t text := 'ZZSNK'; a bigint; b bigint; ra public.town_residents; rep text := ''; v json; f0 bigint; f1 bigint; s0 bigint; s1 bigint; au public.town_auction;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZSNK1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',50000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  v := public.town_econ_use(a,'x','view'); rep := rep || ' view=' || v::text;
  -- 遊艇：200000，30% 進基金
  v := public.town_econ_use(a,'x','buy','yacht'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 買遊艇錢=' || ra.money || ' 稱號=' || (ra.items->'titles')::text || ' 基金=' || (select fund from public.town_towns where id = t);
  begin perform public.town_econ_use(a,'x','buy','yacht'); rep := rep || ' 重買=成功(錯)'; exception when others then rep := rep || ' 重買=擋(' || sqlerrm || ')'; end;
  begin perform public.town_econ_use(b,'x','buy','estate'); rep := rep || ' 窮人買莊園=成功(錯)'; exception when others then rep := rep || ' 窮人買莊園=擋(' || sqlerrm || ')'; end;
  begin perform public.town_econ_use(b,'x','buy','boat'); rep := rep || ' 不存在商品=成功(錯)'; exception when others then rep := rep || ' 不存在商品=擋'; end;
  -- 價格係數
  insert into public.town_econ(town_id, kp, wk) values (t, 1.2, to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')) on conflict (town_id) do update set kp = 1.2;
  rep := rep || ' 莊園價(kp1.2)=' || ((public.town_econ_use(a,'x','view')::jsonb)->'items'->1->>'price');
  -- 捐款
  begin perform public.town_econ_use(a,'x','donate',null,500); rep := rep || ' 捐500=成功(錯)'; exception when others then rep := rep || ' 捐500=擋'; end;
  v := public.town_econ_use(a,'x','donate',null,20000); select * into ra from public.town_residents where id = a;
  rep := rep || ' 捐2萬 稱號=' || (ra.items->'titles')::text || ' chr=' || (ra.items->>'chr') || ' 基金=' || (select fund from public.town_towns where id = t);
  begin perform public.town_econ_use(b,'x','donate',null,60000); rep := rep || ' 捐超過現金=成功(錯)'; exception when others then rep := rep || ' 捐超過現金=擋'; end;
  -- 拍賣：甲、乙互相出價，錢守恆
  select * into au from public.town_auction where town_id = t; rep := rep || ' 拍賣=' || au.lot || ' 底價' || au.base;
  select sum(money) into s0 from public.town_residents where town_id = t; select fund into f0 from public.town_towns where id = t;
  begin perform public.town_econ_use(b,'x','bid',null,au.base - 1); rep := rep || ' 低於底價=成功(錯)'; exception when others then rep := rep || ' 低於底價=擋'; end;
  perform public.town_econ_use(b,'x','bid',null,au.base);
  begin perform public.town_econ_use(b,'x','bid',null,au.base * 2); rep := rep || ' 自己加價=成功(錯)'; exception when others then rep := rep || ' 自己加價=擋'; end;
  begin perform public.town_econ_use(a,'x','bid',null,au.base + 1); rep := rep || ' 加價不足=成功(錯)'; exception when others then rep := rep || ' 加價不足=擋'; end;
  perform public.town_econ_use(a,'x','bid',null,au.base + greatest(500, ceil(au.base * 0.05)::int));
  select * into ra from public.town_residents where id = b; rep := rep || ' 乙被超過後現金=' || ra.money || '(應=50000)';
  -- 結算：把週別改成上週
  update public.town_auction set wk = '2000-01-03' where town_id = t;
  perform public.town_auction_sync(t);
  select * into ra from public.town_residents where id = a; select fund into f1 from public.town_towns where id = t;
  rep := rep || ' 結算後甲稱號=' || (ra.items->'titles')::text || ' 基金+' || (f1 - f0) || ' 新拍賣=' || (select lot || '/' || base || '/' || coalesce(bidder::text,'無') from public.town_auction where town_id = t);
  select sum(money) into s1 from public.town_residents where town_id = t;
  rep := rep || ' 居民現金變化=' || (s1 - s0) || '(出價托管已扣，等於負得標金額) 最小現金=' || (select min(money) from public.town_residents where town_id = t);
  -- 流標
  update public.town_auction set wk = '2000-01-03' where town_id = t; perform public.town_auction_sync(t);
  rep := rep || ' 流標動態=' || (select msg from public.town_events where town_id = t and kind = 'fund' order by id desc limit 1 offset 1);
  -- 關閉
  insert into public.town_flags(k,v) values ('econ', false) on conflict (k) do update set v = false;
  begin perform public.town_econ_use(a,'x','donate',null,5000); rep := rep || ' 關閉後捐款=成功(錯)'; exception when others then rep := rep || ' 關閉後捐款=擋'; end;
  delete from public.town_flags where k = 'econ';
  raise exception 'REPORT %', rep;
end $$;

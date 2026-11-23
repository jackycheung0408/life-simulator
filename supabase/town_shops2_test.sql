-- 購買一律在設施（第二批）回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_shops2.sql 之後貼上。
do $$
declare t text := 'ZZSH2'; a bigint; ra public.town_residents; rep text := ''; v json; m0 bigint;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZSH21',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',500000,0,20,12,'market',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  rep := rep || ' 地點名=' || public.town_place_name('furnshop') || '/' || public.town_place_name('wearshop') || ' 開關=' || coalesce(public.town_feature('furnshop'),'null') || '/' || coalesce(public.town_feature('wearshop'),'null');
  delete from public.town_flags where k = 'shops_in';
  -- 旗標關：超市仍可買（舊相容）
  v := public.town_fi(a,'x','enter','market');
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:plant'); rep := rep || ' 關:超市買盆栽=可'; exception when others then rep := rep || ' 關:超市買盆栽=擋(錯)「' || sqlerrm || '」'; end;
  -- 旗標關：街上不行
  update public.town_residents set place = 'street', x = 10, y = 10, items = items - 'fi' where id = a;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:rug'); rep := rep || ' 街上買=成功(錯)'; exception when others then rep := rep || ' 街上買=擋「' || sqlerrm || '」'; end;
  -- 走去新店
  begin perform public.town_act(a,'x','move',null,75,14,'furnshop'); rep := rep || ' 走去家具行=可'; exception when others then rep := rep || ' 走去家具行=擋(錯)「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','move',null,82,14,'wearshop'); rep := rep || ' 走去服飾店=可'; exception when others then rep := rep || ' 走去服飾店=擋(錯)「' || sqlerrm || '」'; end;
  -- 在家具行：沒進去擋、進去可買、買錯店擋
  update public.town_residents set place = 'furnshop', x = 75, y = 14, items = items - 'fi' where id = a;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:bed'); rep := rep || ' 家具行沒進去=成功(錯)'; exception when others then rep := rep || ' 家具行沒進去=擋「' || sqlerrm || '」'; end;
  v := public.town_fi(a,'x','enter','furnshop'); rep := rep || ' 進館=' || v::text;
  select money into m0 from public.town_residents where id = a;
  perform public.town_act(a,'x','buy',null,null,null,null,'f:bed'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 買好床 花=' || (m0 - ra.money) || '(應3500) f=' || (ra.items->'f')::text;
  perform public.town_act(a,'x','buy',null,null,null,null,'d:flowers'); select * into ra from public.town_residents where id = a; rep := rep || ' 買花圃 d=' || (ra.items->'d')::text;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:bed'); rep := rep || ' 重複買=成功(錯)'; exception when others then rep := rep || ' 重複買=擋「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'w:crown'); rep := rep || ' 家具行買服飾=成功(錯)'; exception when others then rep := rep || ' 家具行買服飾=擋「' || sqlerrm || '」'; end;
  -- 服飾店
  update public.town_residents set place = 'wearshop', x = 82, y = 14, items = items - 'fi' where id = a; v := public.town_fi(a,'x','enter','wearshop');
  select money into m0 from public.town_residents where id = a;
  perform public.town_act(a,'x','buy',null,null,null,null,'w:crown'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 買皇冠 花=' || (m0 - ra.money) || '(應12000) w=' || (ra.items->'w')::text;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:sofa'); rep := rep || ' 服飾店買家具=成功(錯)'; exception when others then rep := rep || ' 服飾店買家具=擋「' || sqlerrm || '」'; end;
  -- 旗標開：超市擋、新店可
  insert into public.town_flags(k,v) values ('shops_in', true) on conflict (k) do update set v = true;
  update public.town_residents set place = 'market', x = 28, y = 14, items = items - 'fi' where id = a; v := public.town_fi(a,'x','enter','market');
  begin perform public.town_act(a,'x','buy',null,null,null,null,'f:rug'); rep := rep || ' 開:超市買家具=成功(錯)'; exception when others then rep := rep || ' 開:超市買家具=擋「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','buy',null,null,null,null,'w:scarf'); rep := rep || ' 開:超市買服飾=成功(錯)'; exception when others then rep := rep || ' 開:超市買服飾=擋「' || sqlerrm || '」'; end;
  perform public.town_act(a,'x','buy',null,null,null,null,'gift'); rep := rep || ' 開:超市買禮物=可';
  rep := rep || ' 最小現金=' || (select min(money) from public.town_residents where town_id = t);
  delete from public.town_flags where k = 'shops_in';
  raise exception 'REPORT %', rep;
end $$;

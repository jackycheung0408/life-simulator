-- 購買一律在設施（第一批）回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_shops1.sql 之後貼上。
do $$
declare t text := 'ZZSH1'; a bigint; b bigint; ra public.town_residents; rep text := ''; v json; m0 bigint; hl0 int;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZSH11',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',2000000,0,75,5,'realty',extensions.crypt('x', extensions.gen_salt('bf')),'{"hl":1}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',1000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  rep := rep || ' 地點名=' || public.town_place_name('realty') || '/' || public.town_place_name('harbor') || ' 開關名=' || coalesce(public.town_feature('realty'),'null') || '/' || coalesce(public.town_feature('harbor'),'null');
  delete from public.town_flags where k = 'shops_in';
  rep := rep || ' 旗標預設=' || public.town_shops_on();
  -- 旗標關：舊入口照舊（在屋外買遊艇可以；升級要在屋裡 → 擋）
  update public.town_residents set place = 'street', x = 10, y = 10 where id = a;
  begin perform public.town_econ_use(a,'x','buy','yacht'); rep := rep || ' 關:街上買遊艇=可'; exception when others then rep := rep || ' 關:街上買遊艇=擋(錯)' || sqlerrm; end;
  begin perform public.town_act(a,'x','upgrade'); rep := rep || ' 關:不在屋裡升級=成功(錯)'; exception when others then rep := rep || ' 關:不在屋裡升級=擋'; end;
  -- 旗標開
  insert into public.town_flags(k,v) values ('shops_in', true) on conflict (k) do update set v = true;
  begin perform public.town_econ_use(a,'x','buy','estate'); rep := rep || ' 開:街上買莊園=成功(錯)'; exception when others then rep := rep || ' 開:街上買莊園=擋「' || sqlerrm || '」'; end;
  update public.town_residents set place = 'realty', x = 75, y = 5, items = items - 'fi' where id = a;
  begin perform public.town_econ_use(a,'x','buy','estate'); rep := rep || ' 開:在不動產沒進去=成功(錯)'; exception when others then rep := rep || ' 開:沒進去=擋「' || sqlerrm || '」'; end;
  v := public.town_fi(a,'x','enter','realty'); rep := rep || ' 進館=' || v::text;
  begin perform public.town_econ_use(a,'x','buy','yacht'); rep := rep || ' 開:不動產買遊艇=成功(錯)'; exception when others then rep := rep || ' 開:不動產買遊艇=擋「' || sqlerrm || '」'; end;
  select money into m0 from public.town_residents where id = a;
  perform public.town_econ_use(a,'x','buy','estate'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 開:不動產買莊園 花=' || (m0 - ra.money) || ' lx=' || coalesce(ra.items->'lx'->>'estate','無');
  -- 升級要在不動產公司
  v := public.town_act(a,'x','upgrade'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 開:不動產升級 hl=' || coalesce(ra.items->>'hl','?') || '(應2)';
  -- 船行
  update public.town_residents set place = 'harbor', x = 74, y = 21, items = items - 'fi' where id = a;
  v := public.town_fi(a,'x','enter','harbor');
  perform public.town_econ_use(a,'x','buy','yacht'); select * into ra from public.town_residents where id = a;
  rep := rep || ' 開:船行買遊艇 lx=' || coalesce(ra.items->'lx'->>'yacht','無');
  -- 捐款在市政廳
  begin perform public.town_econ_use(a,'x','donate',null,10000); rep := rep || ' 開:船行捐款=成功(錯)'; exception when others then rep := rep || ' 開:船行捐款=擋「' || sqlerrm || '」'; end;
  update public.town_residents set place = 'townhall', x = 68, y = 5, items = items - 'fi' where id = a; v := public.town_fi(a,'x','enter','townhall');
  begin perform public.town_econ_use(a,'x','donate',null,10000); rep := rep || ' 開:市政廳捐款=可'; exception when others then rep := rep || ' 開:市政廳捐款=擋(錯)「' || sqlerrm || '」'; end;
  -- 移動到新地點、位置上限
  update public.town_residents set place = 'street', x = 10, y = 10, items = items - 'fi' where id = a;
  begin perform public.town_act(a,'x','move',null,75,6,'realty'); rep := rep || ' 走去不動產=可'; exception when others then rep := rep || ' 走去不動產=擋(錯)「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','move',null,74,21,'harbor'); rep := rep || ' 走去船行=可'; exception when others then rep := rep || ' 走去船行=擋(錯)「' || sqlerrm || '」'; end;
  begin perform public.town_act(a,'x','move',null,86,10,'street'); rep := rep || ' x=86=成功(錯)'; exception when others then rep := rep || ' x=86=擋'; end;
  begin perform public.town_act(a,'x','move',null,84,10,'street'); rep := rep || ' x=84=可'; exception when others then rep := rep || ' x=84=擋(錯)「' || sqlerrm || '」'; end;
  -- 鎮長關閉設施
  begin perform public.town_features(a,'x',array['realty']); rep := rep || ' 關realty白名單=可(需鎮長)'; exception when others then rep := rep || ' 關realty=' || sqlerrm; end;
  -- 沒進館的別人、睡覺不影響其他
  rep := rep || ' 最小現金=' || (select min(money) from public.town_residents where town_id = t);
  delete from public.town_flags where k = 'shops_in';
  raise exception 'REPORT %', rep;
end $$;

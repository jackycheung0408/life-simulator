-- 家裡自由佈置實測：先貼 town_home.sql 再貼 town.sql（或兩個都已套用），再執行這一段；結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; tid text; rep text := ''; r public.town_residents; fp jsonb;
begin
  cr := public.town_create('ZZHM','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  update public.town_residents set sleeping = false, seen_at = now(), place = 'home:'||id, money = 100000 where id in (ra, rb);

  -- 舊角色：只有舊的 9 格 fu、沒有 fp → town_fp 換算（格 i → x=1+(i%3)*2、y=1+i/3）
  update public.town_residents set items = items || '{"f":["bed","fridge","sofa","tvcab","rug"],"fu":["bed","","fridge","sofa","tvcab","","rug"]}'::jsonb where id = ra;
  select * into r from public.town_residents where id = ra;
  rep := rep||'舊 fu 換算 fp = '||public.town_fp(r)::text||E'\n   期望 [["bed",1,1],["fridge",5,1],["sofa",1,2],["tvcab",3,2],["rug",1,3]]'||E'\n';
  -- 一次性遷移（home1）：把標記拿掉重跑同一段更新
  delete from public.town_migrations where id = 'home1';
  update public.town_residents set items = jsonb_set(items, '{fp}', public.town_fp_legacy(items->'fu'), true) where items ? 'fu' and not (items ? 'fp');
  select * into r from public.town_residents where id = ra; rep := rep||'遷移後 items.fp = '||(r.items->'fp')::text||' fu 還在 = '||(r.items->'fu')::text||E'\n';
  rep := rep||'乙（沒有任何家具）fp = '||coalesce((select (items->'fp')::text from public.town_residents where id = rb),'null')||' (期望 null，沒有 fu 就不寫)'||E'\n';
  rep := rep||'town_fu(bed) = '||public.town_fu(r,'bed')||' (期望 1)'||E'\n';

  -- 移動、擺新的
  perform public.town_act(ra,'1234','furn', item => 'put:bed:5:3');
  select * into r from public.town_residents where id = ra; rep := rep||'移動床到 (5,3) 後 fp = '||(r.items->'fp')::text||' fu = '||(r.items->'fu')::text||' (期望 5 件、床在 5,3)'||E'\n';
  begin perform public.town_act(ra,'1234','furn', item => 'put:sofa:5:3'); rep := rep||'放在有東西的格 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'放在有東西的格: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'put:plant:1:1'); rep := rep||'沒買的家具 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'沒買的家具: '||sqlerrm||E'\n'; end;
  update public.town_residents set items = jsonb_set(items, '{f}', (items->'f') || '["frame","painting","toy","books","desklamp","plant"]'::jsonb) where id = ra;
  begin perform public.town_act(ra,'1234','furn', item => 'put:frame:2:1'); rep := rep||'相框放地板 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'相框放地板: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'put:toy:2:0'); rep := rep||'玩具掛牆 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'玩具掛牆: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'put:toy:99:3'); rep := rep||'超出房間 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'超出房間(小屋寬 6): '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'put:toy:1:9'); rep := rep||'超出列 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'超出列: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'set:0:bed'); rep := rep||'舊格式 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'舊格式 set:0:bed: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(ra,'1234','furn', item => 'put:BED:1:1'); rep := rep||'亂寫 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'亂寫: '||sqlerrm||E'\n'; end;

  -- 上限：小屋 6 件（目前 5 件 + 已放的小道具），再放第 7 件被擋；移動已放的不算新增
  perform public.town_act(ra,'1234','furn', item => 'put:frame:2:0');
  select * into r from public.town_residents where id = ra; rep := rep||'小屋已放 '||jsonb_array_length(public.town_fp(r))||' 件 (期望 6：5 件 + 相框)'||E'\n';
  begin perform public.town_act(ra,'1234','furn', item => 'put:books:0:3'); rep := rep||'超過上限 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'超過上限: '||sqlerrm||E'\n'; end;
  perform public.town_act(ra,'1234','furn', item => 'put:frame:3:0');
  select * into r from public.town_residents where id = ra; rep := rep||'滿了還能移動已放的，件數 '||jsonb_array_length(public.town_fp(r))||' (期望 6)'||E'\n';

  -- 收回：效果跟著消失
  perform public.town_act(ra,'1234','furn', item => 'clr:fridge');
  select * into r from public.town_residents where id = ra; rep := rep||'收回冰箱後 fu = '||(r.items->'fu')::text||' town_fu(fridge) = '||public.town_fu(r,'fridge')||' (期望 0)，件數 '||jsonb_array_length(public.town_fp(r))||E'\n';
  perform public.town_act(ra,'1234','furn', item => 'put:fridge:4:1');
  select * into r from public.town_residents where id = ra; rep := rep||'重新擺冰箱 town_fu(fridge) = '||public.town_fu(r,'fridge')||' (期望 1)'||E'\n';
  -- 在家吃飯還是用冰箱優惠
  update public.town_residents set hunger = 20, money = 1000, items = items - 'cd' where id = ra; perform public.town_act(ra,'1234','eat');
  select * into r from public.town_residents where id = ra; rep := rep||'有冰箱吃飯扣 30，錢 = '||r.money||' (期望 970)'||E'\n';

  -- 升級後房間變大：獨棟可放到 x=8、y=4
  update public.town_residents set items = jsonb_set(items, '{hl}', '3') where id = ra;
  perform public.town_act(ra,'1234','furn', item => 'put:plant:8:4');
  select * into r from public.town_residents where id = ra; rep := rep||'獨棟放 (8,4) 成功，件數 '||jsonb_array_length(public.town_fp(r))||E'\n';
  begin perform public.town_act(ra,'1234','furn', item => 'put:books:9:1'); rep := rep||'獨棟 x=9 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'獨棟 x=9 超出: '||sqlerrm||E'\n'; end;

  -- 要在屋裡；別人的家不能動
  update public.town_residents set items = items || '{"dr":1}'::jsonb where id = ra;
  begin perform public.town_act(ra,'1234','furn', item => 'put:books:0:2'); rep := rep||'在門口 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'在門口擺家具: '||sqlerrm||E'\n'; end;
  update public.town_residents set items = items - 'dr' where id = ra;
  update public.town_residents set place = 'home:'||rb where id = rb;
  begin perform public.town_act(rb,'1234','furn', item => 'put:bed:1:1'); rep := rep||'乙擺沒買的床 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'乙沒買不能擺: '||sqlerrm||E'\n'; end;

  -- 小道具在商店、價格
  rep := rep||'商店小道具 = '||(select string_agg(id||':'||price, ',' order by id) from public.town_shop where id in ('frame','painting','desklamp','toy','books'))||' (期望 books:500,desklamp:600,frame:300,painting:900,toy:400)'||E'\n';
  update public.town_residents set place = 'market', money = 5000 where id = rb;
  perform public.town_act(rb,'1234','buy', item => 'f:frame');
  select * into r from public.town_residents where id = rb; rep := rep||'乙買相框後 錢 = '||r.money||' f = '||(r.items->'f')::text||' (期望 4300：5000 − 當日第一次動作的小屋房租 400 − 相框 300，有 frame)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

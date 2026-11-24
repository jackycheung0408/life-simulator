-- 莊園自由回滾實測：結果在 REPORT（最後 raise exception → 全部回滾）。接在 town_estate_free.sql 之後貼上。
do $$
declare v_t text := 'ZZEFR'; v_a bigint; v_b bigint; v_c bigint; v_r public.town_residents; v_rep text := ''; v_j json; v_m0 bigint; v_h0 real; v_old jsonb;
begin
  insert into public.town_towns(id,name,invite,fund) values (v_t,'測試鎮','ZZEF1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'甲',50000,0,3,80,'street',extensions.crypt('x', extensions.gen_salt('bf')),
    '{"hl":2,"f":["bed","fridge","toilet","shower","tvcab","sofa","massage","rug","frame","books"],"lx":{"estate":"2026-11-24","ep":0}}'::jsonb) returning id into v_a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'乙',5000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into v_b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (v_t,'丙',5000,2,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into v_c;
  -- 甲進自己的莊園（舊莊園：沒有 gate／ro／efp）
  perform public.town_act(v_a,'x','move',null,3,80,'estate:' || v_a);
  v_j := public.town_fi(v_a,'x','enter','estate:' || v_a);
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 舊莊園進入 fi=' || coalesce(v_r.items->>'fi','無') || ' inside=' || public.town_inside(v_r);
  -- A1 沒擺家具：吃飯 €60（陽春版）
  update public.town_residents set hunger = 20, bladder = 20, hygiene = 20, fun = 20, energy = 30, items = items - 'cd' where id = v_a;
  select money, hunger into v_m0, v_h0 from public.town_residents where id = v_a;
  perform public.town_act(v_a,'x','eat'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 吃飯(無冰箱)花=' || (v_m0 - v_r.money) || '(應60) 飽足+' || round((v_r.hunger - v_h0)::numeric) || '(應約32)';
  -- 擺家具：冰箱、馬桶、淋浴、電視櫃、沙發、床、按摩椅
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:fridge:1:1');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:toilet:2:1');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:shower:3:1');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:tvcab:7:1');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:sofa:7:3');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:bed:11:1');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:massage:0:3');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:frame:9:0');
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 擺了=' || jsonb_array_length(v_r.items->'lx'->'efp') || '件(應8) 家裡fp不變=' || coalesce(v_r.items->>'fp','無') || ' fu=' || coalesce(v_r.items->>'fu','無');
  -- 擺放規則
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:5:2'); v_rep := v_rep || ' 擺在噴水池=成功(錯)'; exception when others then v_rep := v_rep || ' 擺在噴水池=擋「' || sqlerrm || '」'; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:12:2'); v_rep := v_rep || ' 超出=成功(錯)'; exception when others then v_rep := v_rep || ' 超出=擋'; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:frame:5:2'); v_rep := v_rep || ' 畫掛地上=成功(錯)'; exception when others then v_rep := v_rep || ' 畫掛地上=擋'; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:6:3'); v_rep := v_rep || ' 地毯上放地墊=可'; exception when others then v_rep := v_rep || ' 地毯上放地墊=擋(錯)' || sqlerrm; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:1:2'); v_rep := v_rep || ' 管家格=成功(錯)'; exception when others then v_rep := v_rep || ' 管家格(1,2)=擋'; end;
  -- 有家具的效果：吃飯 €30、廁所不扣清潔、洗澡回滿、電視 +22、休息 +100、睡覺在莊園
  update public.town_residents set hunger = 20, bladder = 20, hygiene = 20, fun = 20, energy = 30 where id = v_a;
  select money into v_m0 from public.town_residents where id = v_a;
  perform public.town_act(v_a,'x','eat'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 吃飯(有冰箱)花=' || (v_m0 - v_r.money) || '(應30)';
  perform public.town_act(v_a,'x','toilet'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 廁所 膀胱=' || round(v_r.bladder::numeric) || '(應100) 清潔=' || round(v_r.hygiene::numeric) || '(應20不扣)';
  perform public.town_act(v_a,'x','shower'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 洗澡 清潔=' || round(v_r.hygiene::numeric) || '(應100)';
  v_h0 := v_r.fun; perform public.town_act(v_a,'x','tv'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 電視 心情+' || round((v_r.fun - v_h0)::numeric) || '(應約22)';
  update public.town_residents set energy = 10 where id = v_a;
  perform public.town_act(v_a,'x','nap'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 快速休息 精力=' || round(v_r.energy::numeric) || '(應約100)';
  perform public.town_act(v_a,'x','qsleep'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 快速睡覺 sleeping=' || v_r.sleeping || ' place仍=' || (v_r.place = 'estate:' || v_a) || ' qs=' || coalesce(v_r.items->>'qs','無');
  perform public.town_act(v_a,'x','wake'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 起床 sleeping=' || v_r.sleeping || ' 仍在莊園=' || (v_r.place = 'estate:' || v_a and coalesce(v_r.items->>'fi','') = v_r.place);
  perform public.town_act(v_a,'x','sleep'); select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 睡覺 sleeping=' || v_r.sleeping;
  perform public.town_act(v_a,'x','wake');
  -- 離開莊園後不能做（不在屋裡）
  update public.town_residents set place = 'street', items = items - 'fi' where id = v_a;
  begin perform public.town_act(v_a,'x','eat'); v_rep := v_rep || ' 街上吃飯=成功(錯)'; exception when others then v_rep := v_rep || ' 街上吃飯=擋「' || sqlerrm || '」'; end;
  update public.town_residents set place = 'estate:' || v_a, items = jsonb_set(items,'{fi}',to_jsonb('estate:' || v_a)) where id = v_a;
  -- 錢不夠
  update public.town_residents set money = 10, items = jsonb_set(items, '{lx,efc}', '[]'::jsonb) where id = v_a;
  begin perform public.town_act(v_a,'x','eat'); v_rep := v_rep || ' 沒錢吃飯=成功(錯)'; exception when others then v_rep := v_rep || ' 沒錢吃飯=擋'; end;
  select money into v_m0 from public.town_residents where id = v_a; v_rep := v_rep || ' 錢=' || v_m0 || '(應10不變負)';
  update public.town_residents set money = 50000 where id = v_a;
  -- C 預設物件：移動、收回、還原、固定的不能動
  perform public.town_act(v_a,'x','furn',null,null,null,null,'mv:fount:4:4');
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 移噴水池 ro=' || (v_r.items->'lx'->>'ro');
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:4:4'); v_rep := v_rep || ' 擺到新噴水池位置=成功(錯)'; exception when others then v_rep := v_rep || ' 擺到新噴水池位置=擋'; end;
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:rug:5:2');
  v_rep := v_rep || ' 舊噴水池位置可擺=是';
  perform public.town_act(v_a,'x','furn',null,null,null,null,'rm:piano');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:books:10:4');
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'rs:piano'); v_rep := v_rep || ' 還原鋼琴(位置被占)=成功(錯)'; exception when others then v_rep := v_rep || ' 還原鋼琴(被占)=擋'; end;
  perform public.town_act(v_a,'x','furn',null,null,null,null,'clr:books');
  perform public.town_act(v_a,'x','furn',null,null,null,null,'rs:piano');
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 還原後 ro=' || (v_r.items->'lx'->>'ro');
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'mv:chand_a:3:3'); v_rep := v_rep || ' 動吊燈=成功(錯)'; exception when others then v_rep := v_rep || ' 動吊燈=擋「' || sqlerrm || '」'; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'rm:plant_a'); v_rep := v_rep || ' 收盆栽=成功(錯)'; exception when others then v_rep := v_rep || ' 收盆栽=擋'; end;
  begin perform public.town_act(v_a,'x','furn',null,null,null,null,'mv:table1:0:0'); v_rep := v_rep || ' 宴會桌放牆=成功(錯)'; exception when others then v_rep := v_rep || ' 宴會桌放牆=擋'; end;
  perform public.town_act(v_a,'x','furn',null,null,null,null,'mv:trophy1:0:0');
  v_rep := v_rep || ' 展示櫃可放牆=是';
  -- 家裡的擺放不受影響（甲在家：擺家具走原本規則）
  update public.town_residents set place = 'home:' || v_a, items = (items - 'fi') - 'dr' where id = v_a;
  perform public.town_act(v_a,'x','furn',null,null,null,null,'put:bed:1:1');
  select * into v_r from public.town_residents where id = v_a;
  v_rep := v_rep || ' 在家擺床 fp=' || (v_r.items->>'fp') || ' 莊園efp仍=' || jsonb_array_length(v_r.items->'lx'->'efp');
  update public.town_residents set place = 'estate:' || v_a, items = jsonb_set(items,'{fi}',to_jsonb('estate:' || v_a)) where id = v_a;
  -- B 進出控管
  update public.town_residents set place = 'estate:' || v_a, x = 3, y = 80, items = items - 'fi' where id = v_b;
  update public.town_residents set place = 'street' , items = items - 'fi' where id = v_a;
  begin v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' 預設(甲不在)乙進=成功(錯)'; exception when others then v_rep := v_rep || ' 預設(甲不在)乙進=擋'; end;
  v_j := public.town_estate_ctl(v_a,'x','gate',null,'open');
  v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' open(甲不在)乙進=可';
  update public.town_residents set items = items - 'fi' where id = v_b;
  update public.town_residents set place = 'estate:' || v_a, items = jsonb_set(items,'{fi}',to_jsonb('estate:' || v_a)) where id = v_a;
  v_j := public.town_estate_ctl(v_a,'x','gate',null,'lock');
  begin v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' lock(甲在)乙進=成功(錯)'; exception when others then v_rep := v_rep || ' lock(甲在)乙進=擋「' || sqlerrm || '」'; end;
  v_j := public.town_fi(v_a,'x','enter','estate:' || v_a); v_rep := v_rep || ' lock 莊主自己可進';
  v_j := public.town_estate_ctl(v_a,'x','gate',null,'list');
  begin v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' list 未受邀乙進（莊主在）=可'; exception when others then v_rep := v_rep || ' list 未受邀乙進（莊主在）=擋(錯)「' || sqlerrm || '」'; end;
  v_j := public.town_estate_ctl(v_a,'x','wl_add',v_b,null);
  v_rep := v_rep || ' 名單=' || (v_j->>'wl');
  v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' list 受邀乙進=可';
  begin v_j := public.town_estate_ctl(v_a,'x','wl_add',v_b,null); v_rep := v_rep || ' 重複加=成功(錯)'; exception when others then v_rep := v_rep || ' 重複加=擋'; end;
  begin v_j := public.town_estate_ctl(v_a,'x','wl_add',v_a,null); v_rep := v_rep || ' 加自己=成功(錯)'; exception when others then v_rep := v_rep || ' 加自己=擋'; end;
  begin v_j := public.town_estate_ctl(v_a,'x','gate',null,'zzz'); v_rep := v_rep || ' 亂模式=成功(錯)'; exception when others then v_rep := v_rep || ' 亂模式=擋'; end;
  update public.town_residents set place = 'estate:' || v_a, x = 3, y = 80, items = items - 'fi' where id = v_c;
  begin v_j := public.town_fi(v_c,'x','enter','estate:' || v_a); v_rep := v_rep || ' list 丙(未受邀，甲在)進=可'; exception when others then v_rep := v_rep || ' list 丙(未受邀，甲在)進=擋(錯)'; end;
  update public.town_residents set place = 'street', items = items - 'fi' where id = v_a;
  update public.town_residents set place = 'estate:' || v_a, x = 3, y = 80, items = items - 'fi' where id = v_c;
  begin v_j := public.town_fi(v_c,'x','enter','estate:' || v_a); v_rep := v_rep || ' list 丙(未受邀，甲不在)進=成功(錯)'; exception when others then v_rep := v_rep || ' list 丙(未受邀，甲不在)進=擋'; end;
  update public.town_residents set place = 'estate:' || v_a, x = 3, y = 80, items = items - 'fi' where id = v_b;
  begin v_j := public.town_fi(v_b,'x','enter','estate:' || v_a); v_rep := v_rep || ' list 乙(受邀，甲不在)進=可'; exception when others then v_rep := v_rep || ' list 乙(受邀，甲不在)進=擋(錯)'; end;
  update public.town_residents set place = 'estate:' || v_a, items = jsonb_set(items,'{fi}',to_jsonb('estate:' || v_a)) where id = v_a;
  v_j := public.town_estate_ctl(v_a,'x','wl_del',v_b,null); v_rep := v_rep || ' 刪後名單=' || (v_j->>'wl');
  begin v_j := public.town_estate_ctl(v_b,'x','gate',null,'open'); v_rep := v_rep || ' 乙(沒莊園)改模式=成功(錯)'; exception when others then v_rep := v_rep || ' 乙改模式=擋「' || sqlerrm || '」'; end;
  -- 派對期間 lock 也全員可進
  v_j := public.town_estate_ctl(v_a,'x','gate',null,'lock');
  v_j := public.town_econ_fun(v_a,'x','party');
  v_j := public.town_fi(v_c,'x','enter','estate:' || v_a); v_rep := v_rep || ' lock＋派對期間丙進=可';
  -- 還原預設
  v_j := public.town_estate_ctl(v_a,'x','gate',null,'default'); v_rep := v_rep || ' 還原預設 gate=' || (v_j->>'gate');
  raise exception 'REPORT:%', v_rep;
end $$;

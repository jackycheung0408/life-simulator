-- 設施新互動實測：接在 town.sql、town_social.sql、town_fac.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; rep text := ''; tid text; j json; r public.town_residents; i int; n int; got int := 0; ev numeric; st int; ids int[];
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); yday text := to_char((now() at time zone 'Asia/Taipei')::date - 1,'YYYY-MM-DD');
begin
  cr := public.town_create('ZZFC','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  update public.town_residents set money = 5000, energy = 80, hunger = 40, fun = 40, sleeping = false, seen_at = now(), place = 'restaurant', items = items - 'cd' - 'fa' - 'fq' where id in (ra, rb);
  -- 餐廳
  j := public.town_fac(ra,'1234','special'); select * into r from public.town_residents where id = ra;
  rep := rep||'special: '||j::text||' money '||r.money||' (期望 4800)'||E'\n';
  begin perform public.town_fac(ra,'1234','special'); rep := rep||'special cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'special cd: '||sqlerrm||E'\n'; end;
  j := public.town_fac(ra,'1234','takeout'); select * into r from public.town_residents where id = ra; rep := rep||'takeout snack='||coalesce(r.items->>'snack','0')||E'\n';
  begin perform public.town_fac(ra,'1234','latte'); rep := rep||'wrong place NOT BLOCKED'||E'\n'; exception when others then rep := rep||'wrong place: '||sqlerrm||E'\n'; end;
  -- 常客折扣：互動 5 次後 −10%
  update public.town_residents set items = jsonb_set(items,'{fq}','{"restaurant":5}'::jsonb) || jsonb_build_object('cd','{}'::jsonb), money = 1000 where id = ra;
  j := public.town_fac(ra,'1234','special'); select * into r from public.town_residents where id = ra;
  rep := rep||'regular disc: '||j::text||' money '||r.money||' (期望 1000-180=820)'||E'\n';
  update public.town_residents set items = jsonb_set(items,'{fq}','{"restaurant":15}'::jsonb) || jsonb_build_object('cd','{}'::jsonb), money = 1000 where id = ra;
  j := public.town_fac(ra,'1234','special'); select * into r from public.town_residents where id = ra; rep := rep||'vip money '||r.money||' (期望 1000-170=830)'||E'\n';
  -- 咖啡廳：集點、換免費、請客、點歌
  update public.town_residents set place='cafe', money=2000, items = (items - 'fq') || jsonb_build_object('cd','{}'::jsonb,'cs',7) where id in (ra, rb);
  j := public.town_fac(ra,'1234','latte'); select * into r from public.town_residents where id = ra; rep := rep||'latte cs='||(r.items->>'cs')||' (期望 8) money '||r.money||E'\n';
  update public.town_residents set items = items || jsonb_build_object('cd','{}'::jsonb) where id = ra;
  j := public.town_fac(ra,'1234','redeem'); select * into r from public.town_residents where id = ra; rep := rep||'redeem cs='||(r.items->>'cs')||' (期望 0) money '||r.money||' (不變)'||E'\n';
  begin perform public.town_fac(ra,'1234','redeem'); rep := rep||'redeem2 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'redeem2: '||sqlerrm||E'\n'; end;
  j := public.town_fac(ra,'1234','treat',target:=rb); select * into r from public.town_residents where id = rb;
  rep := rep||'treat: '||j::text||' 對方 fun '||r.fun||' bond '||public.town_bond_get(ra,rb)||E'\n';
  begin perform public.town_fac(ra,'1234','treat',target:=rb); rep := rep||'treat cd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'treat cd: '||sqlerrm||E'\n'; end;
  begin perform public.town_fac(ra,'1234','treat'); rep := rep||'treat no target NOT BLOCKED'||E'\n'; exception when others then rep := rep||'treat no target: '||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping = true where id = rb;
  begin perform public.town_fac(ra,'1234','song'); rep := rep||'song ok'||E'\n'; exception when others then rep := rep||'song: '||sqlerrm||E'\n'; end;
  begin update public.town_residents set items = items || jsonb_build_object('cd','{}'::jsonb) where id = ra; perform public.town_fac(ra,'1234','treat',target:=rb); rep := rep||'treat sleeping NOT BLOCKED'||E'\n'; exception when others then rep := rep||'treat sleeping: '||sqlerrm||E'\n'; end;
  update public.town_residents set sleeping = false where id = rb;
  -- 電影院
  update public.town_residents set place='cinema', items = items || jsonb_build_object('cd','{}'::jsonb) where id in (ra, rb);
  j := public.town_fac(ra,'1234','film'); rep := rep||'film: '||j::text||E'\n';
  j := public.town_fac(ra,'1234','popcorn'); rep := rep||'popcorn: '||j::text||E'\n';
  -- 健身房：對練、簽到連續
  update public.town_residents set place='gym', energy=80, items = items || jsonb_build_object('cd','{}'::jsonb) where id in (ra, rb);
  j := public.town_fac(ra,'1234','spar',target:=rb); select * into r from public.town_residents where id = rb; rep := rep||'spar: '||j::text||' 對方精力 '||r.energy||' (期望 68)'||E'\n';
  update public.town_residents set energy=10 where id = rb;
  begin update public.town_residents set items = items || jsonb_build_object('cd','{}'::jsonb) where id = ra; perform public.town_fac(ra,'1234','spar',target:=rb); rep := rep||'spar tired NOT BLOCKED'||E'\n'; exception when others then rep := rep||'spar tired: '||sqlerrm||E'\n'; end;
  update public.town_residents set money = 0, items = jsonb_set(items - 'fa','{gy}',jsonb_build_object('d',yday,'s',2)) where id = ra;
  j := public.town_fac(ra,'1234','checkin'); select * into r from public.town_residents where id = ra; rep := rep||'checkin s=3: '||j::text||' money '||r.money||' (期望 60)'||E'\n';
  begin perform public.town_fac(ra,'1234','checkin'); rep := rep||'checkin twice NOT BLOCKED'||E'\n'; exception when others then rep := rep||'checkin twice: '||sqlerrm||E'\n'; end;
  update public.town_residents set money = 0, items = jsonb_set(items - 'fa','{gy}',jsonb_build_object('d',yday,'s',6)) where id = ra;
  j := public.town_fac(ra,'1234','checkin'); select * into r from public.town_residents where id = ra; rep := rep||'checkin s=7 money '||r.money||' (期望 200)'||E'\n';
  -- 公園：釣魚期望（每次 30，大魚 100 機率 15%，小魚 30 機率 35% → 25.5）
  update public.town_residents set place='park', energy=80, money=100000, items = items || jsonb_build_object('cd','{}'::jsonb) where id = ra;
  for i in 1..400 loop
    update public.town_residents set items = items || jsonb_build_object('cd','{}'::jsonb) where id = ra;
    j := public.town_fac(ra,'1234','fish'); got := got + (j->>'m')::int;
  end loop;
  rep := rep||'fish avg net per cast '||round(got/400.0,2)||' (期望約 -4.5，必須 < 0)'||E'\n';
  update public.town_residents set place='park', energy=80, money=5000, items = items || jsonb_build_object('cd','{}'::jsonb) where id in (ra, rb);
  j := public.town_fac(ra,'1234','frisbee',target:=rb); rep := rep||'frisbee: '||j::text||E'\n';
  j := public.town_fac(ra,'1234','picnic'); rep := rep||'picnic: '||j::text||E'\n';
  j := public.town_fac(ra,'1234','photo'); rep := rep||'photo solo: '||j::text||E'\n';
  update public.town_residents set place='plaza' where id in (ra, rb);
  j := public.town_fac(ra,'1234','photo',target:=rb); rep := rep||'photo pair: '||j::text||E'\n';
  -- 坐下逗留
  update public.town_residents set place='plaza', energy=30, fun=30, items = jsonb_set(items,'{sit}',jsonb_build_object('pl','plaza','at',now()-interval '25 minutes')) where id = ra;
  j := public.town_fac(ra,'1234','up'); select * into r from public.town_residents where id = ra; rep := rep||'sit 25min -> '||j::text||' energy '||r.energy||' (期望 40) sit='||coalesce(r.items->>'sit','無')||E'\n';
  update public.town_residents set items = jsonb_set(items,'{sit}',jsonb_build_object('pl','plaza','at',now()-interval '1 minute')) where id = ra;
  j := public.town_fac(ra,'1234','up'); rep := rep||'sit 1min -> '||j::text||E'\n';
  begin update public.town_residents set place='market' where id = ra; perform public.town_fac(ra,'1234','sit'); rep := rep||'sit market NOT BLOCKED'||E'\n'; exception when others then rep := rep||'sit market: '||sqlerrm||E'\n'; end;
  -- 任務板：今天的三個任務，一個都沒做不能領；做完後領 50，三個領完 +100 一次
  st := (ra % 8 + extract(doy from now() at time zone 'Asia/Taipei')::int) % 8; ids := array[st, (st+3)%8, (st+5)%8];
  rep := rep||'tasks today: '||ids::text||E'\n';
  update public.town_residents set place='plaza', money=0, items = jsonb_set(items - 'fa','{dc}',jsonb_build_object('d',today,'work',3)) where id = ra;
  begin perform public.town_fac(ra,'1234','claim',item:='0'); rep := rep||'claim0 ok'||E'\n'; exception when others then rep := rep||'claim0: '||sqlerrm||E'\n'; end;
  -- 直接把今天的 fa 設成全部完成
  update public.town_residents set items = jsonb_set(items,'{fa}',jsonb_build_object('d',today,'n',5,'pl','["park","cafe","gym"]'::jsonb,'who','[1,2]'::jsonb,'k','{"checkin":true,"fish":true,"song":true,"special":true}'::jsonb,'tk','[]'::jsonb)) where id = ra;
  for i in 0..2 loop begin perform public.town_fac(ra,'1234','claim',item:=i::text); exception when others then rep := rep||'claim'||i||': '||sqlerrm||E'\n'; end; end loop;
  select * into r from public.town_residents where id = ra; rep := rep||'after 3 claims money '||r.money||' (期望 250 若三個都達成)'||E'\n';
  begin perform public.town_fac(ra,'1234','claim',item:='0'); rep := rep||'claim again NOT BLOCKED'||E'\n'; exception when others then rep := rep||'claim again: '||sqlerrm||E'\n'; end;
  -- 舊角色（沒有任何新欄位）直接可用
  update public.town_residents set place='restaurant', money=1000, items = items - 'fa' - 'fq' - 'cs' - 'gy' - 'sit' - 'cd' where id = rb;
  rep := rep||'old char at restaurant popcorn: '; begin j := public.town_fac(rb,'1234','special'); rep := rep||'ok '||j::text; exception when others then rep := rep||sqlerrm; end; rep := rep||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

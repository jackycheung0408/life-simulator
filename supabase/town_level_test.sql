-- 接在 town.sql 之後貼上；最後 raise exception 回滾，結果在 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; yday text := to_char((now() at time zone 'Asia/Taipei')::date - 1,'YYYY-MM-DD'); today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZLV','甲','1234'); rid := (cr->>'resident_id')::bigint;
  -- 門檻
  rep := rep||'lv_of 0/2/3/9/10/29/30/59/60/200 = '||public.town_lv_of(0)||public.town_lv_of(2)||public.town_lv_of(3)||public.town_lv_of(9)||public.town_lv_of(10)||public.town_lv_of(29)||public.town_lv_of(30)||public.town_lv_of(59)||public.town_lv_of(60)||public.town_lv_of(200)||' (期望 1122334455)'||E'\n';
  -- 舊角色（沒有 al）：動作一次 → n=1、無禮、不掉東西
  update public.town_residents set place='market',money=1000,items=items-'al'-'rent',seen_at=now(),updated_at=now() where id=rid;
  perform public.town_act(rid,'1234','buy',item:='snack'); select * into r from public.town_residents where id=rid;
  rep := rep||'old char first act: al='||(r.items->'al')::text||' money '||r.money||E'\n';
  -- 同一天再動作：n 不變
  perform public.town_act(rid,'1234','buy',item:='snack'); select * into r from public.town_residents where id=rid;
  rep := rep||'same day n='||(r.items->'al'->>'n')||' (期望 1)'||E'\n';
  -- 昨天 n=2 → 今天 n=3 升 Lv2：拿 30、稱號、連續 2、房租 5%
  update public.town_residents set money=5000,items=jsonb_set(items-'rent','{al}',jsonb_build_object('n',2,'d',yday,'s',1,'lv',1)) where id=rid;
  perform public.town_act(rid,'1234','buy',item:='snack'); select * into r from public.town_residents where id=rid;
  rep := rep||'to Lv2: al='||(r.items->'al')::text||' titles='||coalesce((r.items->'titles')::text,'-')||' money '||r.money||' (5000+30-房租380-零食60=4590)'||E'\n';
  rep := rep||'level events: '||(select count(*) from public.town_events where actor=rid and kind='level')||E'\n';
  -- 斷好幾天：連續歸 1、n 照加、不掉級
  update public.town_residents set items=jsonb_set(items-'rent','{al}',jsonb_build_object('n',11,'d','2020-01-01','s',9,'lv',3)) where id=rid;
  perform public.town_act(rid,'1234','buy',item:='snack'); select * into r from public.town_residents where id=rid;
  rep := rep||'gap: al='||(r.items->'al')::text||' (n=12 s=1 lv3)'||E'\n';
  -- 各級函式
  for i in 1..5 loop
    update public.town_residents set items=jsonb_set(items,'{al}',jsonb_build_object('n',(array[0,3,10,30,60])[i],'d',today)) where id=rid;
    select * into r from public.town_residents where id=rid;
    rep := rep||'Lv'||i||' wk '||public.town_wk_min(r)||' bag '||public.town_bag_max(r)||' rent% '||public.town_rent_pct(r)||E'\n';
  end loop;
  -- Lv5 打工冷卻 8 分：9 分鐘前打過可再打、5 分鐘前不行
  update public.town_residents set place='office',energy=100,hunger=90,fun=90,hygiene=90,sleeping=false,money=0,items=jsonb_set(items,'{works}','10') || jsonb_build_object('cd',jsonb_build_object('wk',now()-interval '5 minutes')) where id=rid;
  begin perform public.town_act(rid,'1234','work'); rep := rep||'Lv5 5min NOT BLOCKED'||E'\n'; exception when others then rep := rep||'Lv5 5min: '||sqlerrm||E'\n'; end;
  update public.town_residents set items=items || jsonb_build_object('cd',jsonb_build_object('wk',now()-interval '9 minutes')) where id=rid;
  perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id=rid;
  rep := rep||'Lv5 9min OK money '||r.money||E'\n';
  -- Lv1 背包上限 20、Lv5 到 30
  update public.town_residents set place='market',money=99999,items=jsonb_set(jsonb_set(items,'{al}',jsonb_build_object('n',0,'d',today)),'{snack}','20') where id=rid;
  begin perform public.town_act(rid,'1234','buy',item:='snack'); rep := rep||'Lv1 bag21 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'Lv1 bag: '||sqlerrm||E'\n'; end;
  update public.town_residents set items=jsonb_set(items,'{al}',jsonb_build_object('n',60,'d',today)) where id=rid;
  perform public.town_act(rid,'1234','buy',item:='snack'); select * into r from public.town_residents where id=rid;
  rep := rep||'Lv5 snack='||(r.items->>'snack')||' (期望 21)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

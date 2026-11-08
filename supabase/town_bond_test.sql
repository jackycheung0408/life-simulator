-- 好感平衡實測：接在 town.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; a bigint; b bigint; rep text := ''; i int; s int; r1 public.town_residents; jn json; tid text;
begin
  cr := public.town_create('ZZBOND','甲','1234'); a := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); b := (jn->>'resident_id')::bigint;
  update public.town_residents set place='plaza',x=10,y=10,energy=90,hunger=90,fun=90,hygiene=90,bladder=90,sleeping=false,seen_at=now(),updated_at=now(),items='{}'::jsonb where id in (a,b);
  -- 1 每日正向上限 +12
  for i in 1..20 loop perform public.town_bond(tid,a,b,2); end loop;
  rep := rep || 'pos20x2 -> ' || public.town_bond_get(a,b) || ' (expect 12)' || E'\n';
  -- 2 每日負向上限 −6
  for i in 1..10 loop perform public.town_bond(tid,a,b,-3); end loop;
  rep := rep || 'neg10x-3 -> ' || public.town_bond_get(a,b) || ' (expect 6)' || E'\n';
  -- 3 隔天重算（把日期改成昨天）
  update public.town_bonds set dday='2000-01-01' where a=least(a,b) and b=greatest(a,b);
  perform public.town_bond(tid,a,b,2); rep := rep || 'next day +2 -> ' || public.town_bond_get(a,b) || ' (expect 8)' || E'\n';
  -- 4 扁人：好朋友 −1、好麻吉 0
  for s in select unnest(array[0,15,40]) loop
    update public.town_bonds set score=s, dday='2000-01-01', dpos=0, dneg=0 where a=least(a,b) and b=greatest(a,b);
    update public.town_residents set place='plaza',x=10,y=10,energy=90,sleeping=false,items='{}'::jsonb where id in (a,b);
    delete from public.town_events where actor=a and kind='fight';
    perform public.town_act(a,'1234','fight',target:=b);
    rep := rep || 'fight from '||s||' -> '||public.town_bond_get(a,b)||E'\n';
  end loop;
  -- 5 和好 +8、冷卻 2 小時
  update public.town_bonds set score=-10, dday='2000-01-01', dpos=0, dneg=0 where a=least(a,b) and b=greatest(a,b);
  update public.town_residents set place='plaza',x=10,y=10,sleeping=false where id in (a,b);
  perform public.town_act(a,'1234','makeup',target:=b); rep := rep || 'makeup -10 -> '||public.town_bond_get(a,b)||' (expect -2)'||E'\n';
  update public.town_bonds set score=-10 where a=least(a,b) and b=greatest(a,b);
  begin perform public.town_act(a,'1234','makeup',target:=b); rep := rep||'makeup 2nd NOT BLOCKED'||E'\n'; exception when others then rep := rep||'makeup 2nd: '||sqlerrm||E'\n'; end;
  -- 6 營業時間：全天營業
  rep := rep || 'closed(dine)=' || coalesce(public.town_closed('dine'),'null') || E'\n';
  raise exception 'REPORT %', E'\n'||rep;
end $$;

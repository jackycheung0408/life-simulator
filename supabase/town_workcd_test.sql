-- 接在 town.sql 之後貼上；最後 raise exception 回滾，結果在 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; m0 int; i int;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZWK','甲','1234'); rid := (cr->>'resident_id')::bigint;
  -- 連做 10 次公司打工：每次都全額 260（員工），中間清掉冷卻
  for i in 1..10 loop
    update public.town_residents set place='office',energy=100,hunger=90,fun=90,hygiene=90,sleeping=false,money=0,items=jsonb_build_object('works',10,'dc',jsonb_build_object('d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'work',i*3)),seen_at=now(),updated_at=now() where id=rid;
    perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id=rid;
    if i in (1,5,10) then rep := rep||'work#'||i||' (dc.work='||(i*3+1)||') +'||r.money||' en '||round(r.energy)||E'\n'; end if;
  end loop;
  -- 冷卻：馬上再打
  begin perform public.town_act(rid,'1234','work'); rep := rep||'cd company NOT BLOCKED'||E'\n'; exception when others then rep := rep||'cd company: '||sqlerrm||E'\n'; end;
  -- 換工作繞不過
  update public.town_residents set place='cafe',energy=100,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','job',item:='cafe'); rep := rep||'cd cafe NOT BLOCKED'||E'\n'; exception when others then rep := rep||'cd cafe: '||sqlerrm||E'\n'; end;
  -- 11 分鐘後可打
  update public.town_residents set items=jsonb_set(items,'{cd,wk}',to_jsonb(now()-interval '11 minutes')),money=0 where id=rid;
  perform public.town_act(rid,'1234','job',item:='cafe'); select * into r from public.town_residents where id=rid;
  rep := rep||'cafe after 11min: +'||r.money||' en '||round(r.energy)||' (200, 100-19=81)'||E'\n';
  -- 精力不足
  update public.town_residents set place='office',energy=24,items=jsonb_build_object('works',10),seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','work'); rep := rep||'tired allowed'||E'\n'; exception when others then rep := rep||'tired: '||sqlerrm||E'\n'; end;
  -- 升級價與房租
  update public.town_residents set place='home:'||rid,money=1000000,items='{"hl":1}'::jsonb,seen_at=now(),updated_at=now() where id=rid;
  rep := rep||'rent '||public.town_rent_amt(1)||'/'||public.town_rent_amt(2)||'/'||public.town_rent_amt(3)||'/'||public.town_rent_amt(4)||' pct '||public.town_work_pct(99)||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

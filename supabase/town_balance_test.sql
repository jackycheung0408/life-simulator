-- 接在 town.sql、town_fac.sql 之後貼上；最後回滾，結果在 REPORT：打工 12 次後遞減、任務獎金 200／+400、階梯財產稅
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; m0 bigint; m1 bigint;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZBAL','甲','1234'); rid := (cr->>'resident_id')::bigint;
  rep := 'tax 100萬='||public.town_tax(1000000)||'(4500) 500萬='||public.town_tax(5000000)||'(4500+40000=44500) 1000萬='||public.town_tax(10000000)||'(44500+100000=144500) 5萬='||public.town_tax(50000)||'(0)'||E'\n';
  rep := rep||'pct 11/12/23/24/80 = '||public.town_work_pct(11)||'/'||public.town_work_pct(12)||'/'||public.town_work_pct(23)||'/'||public.town_work_pct(24)||'/'||public.town_work_pct(80)||' (100/50/50/10/10)'||E'\n';
  update public.town_residents set place='office',energy=100,hunger=90,fun=90,hygiene=90,sleeping=false,money=20000,items=jsonb_build_object('works',10,'dc',jsonb_build_object('d',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'),'work',0),'rent',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')),seen_at=now(),updated_at=now() where id=rid;
  for i in 1..26 loop
    update public.town_residents set energy=100,hunger=90,fun=90,hygiene=90 where id=rid;
    select money into m0 from public.town_residents where id=rid;
    perform public.town_act(rid,'1234','work'); select money into m1 from public.town_residents where id=rid;
    if i in (1,12,13,24,25,26) then rep := rep||'work#'||i||' +'||(m1-m0)||E'\n'; end if;
  end loop;
  rep := rep||'(員工 260×心情加成約 1.1：#1,#12 約 286；#13,#24 約 143；#25,#26 約 29；含第 3、6 次獎金不會在這幾次)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

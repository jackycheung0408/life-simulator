-- 接在 town.sql、town_social.sql、town_fac.sql 之後貼上；最後回滾，結果在 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; m0 bigint; m1 bigint;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  rep := 'gift20k migration: '||exists(select 1 from public.town_migrations where id='gift20k')||E'\n';
  cr := public.town_create('ZZGOV','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='office',energy=100,hunger=90,fun=90,hygiene=90,sleeping=false,money=0,items='{"works":10}'::jsonb,seen_at=now(),updated_at=now() where id=rid;
  -- 第一次動作：先 +3000、再扣房租 400；打工 +260
  perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id=rid;
  rep := rep||'day1 after 1st work: money '||r.money||' (期望約 3000-400+286=2886)'||E'\n';
  -- 同一天再來不會再發
  for i in 2..6 loop
    update public.town_residents set energy=100,hunger=90,fun=90,items=jsonb_set(items,'{cd,wk}',to_jsonb(now()-interval '11 minutes')) where id=rid;
    select money into m0 from public.town_residents where id=rid;
    perform public.town_act(rid,'1234','work'); select money into m1 from public.town_residents where id=rid;
    rep := rep||'work#'||i||' +'||(m1-m0)||case when i=3 then ' (期望 286+500)' when i=6 then ' (期望 286+1000)' else ' (期望 286)' end||E'\n';
  end loop;
  rep := rep||'gov events today: '||(select count(*) from public.town_events where actor=rid and msg like '%普發%')||' (期望 1)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

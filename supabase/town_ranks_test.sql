-- 職階擴大實測（接在 town.sql 之後貼上；最後 rollback，結果在錯誤訊息 REPORT）
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; k text; n int; prev int; w int; ths int[]; t text; bad int := 0;
begin
  -- 1 薪水序列單調遞增、最高階上限
  foreach k in array array['cafe','rest','gym','shop','rafi'] loop
    prev := 0;
    foreach n in array array[0,14,15,39,40,79,80,139,140,149,150,219,220,259,260,349,350,5000] loop
      w := public.town_pjob_wage(k, n);
      if w < prev then bad := bad + 1; rep := rep || 'DOWN '||k||' '||n||E'\n'; end if; prev := w;
    end loop;
    rep := rep || k||' 0='||public.town_pjob_wage(k,0)||' 15='||public.town_pjob_wage(k,15)||' 40='||public.town_pjob_wage(k,40)||' 80='||public.town_pjob_wage(k,80)||' 150='||public.town_pjob_wage(k,150)||' 260='||public.town_pjob_wage(k,260)||' 350='||public.town_pjob_wage(k,350)||' max='||public.town_pjob_wage(k,99999)||' '||public.town_pjob_name(k,99999)||E'\n';
  end loop;
  -- 2 原有前 3 階完全沒變
  rep := rep || 'old ok='||(public.town_pjob_wage('cafe',15)=230 and public.town_pjob_wage('cafe',40)=260 and public.town_pjob_wage('shop',15)=224 and public.town_pjob_wage('rest',40)=273 and public.town_pjob_wage('rafi',15)=450 and public.town_pjob_wage('rafi',40)=650 and public.town_pjob_name('cafe',15)='咖啡師（熟手）')||E'\n';
  -- 3 公司
  foreach n in array array[0,9,10,29,30,69,70,149,150,249,250,399,400,649,650,999,1000,9999] loop
    rep := rep || n||':'||public.town_job_name(public.town_job_lv(n))||'/'||public.town_wage(public.town_job_lv(n))||' ';
  end loop;
  rep := rep || E'\nmax ratio='||(public.town_wage(8)::numeric/800)||E'\n';
  -- 4 實際打工：舊角色缺值、跨門檻升階給稱號、錢不為負
  cr := public.town_create('ZZRANK','甲','1234'); rid := (cr->>'resident_id')::bigint;
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  update public.town_residents set place='office',energy=90,hunger=90,fun=90,hygiene=90,bladder=90,sleeping=false,items='{}'::jsonb,money=0,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id=rid; rep := rep||'缺值 works→'||(r.items->>'works')||' money '||r.money||E'\n';
  exception when others then rep := rep||'缺值 ERR '||sqlerrm||E'\n'; end;
  update public.town_residents set place='office',energy=90,items=jsonb_build_object('works',249),money=0,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id=rid; rep := rep||'249→250 titles='||coalesce(r.items->>'titles','-')||' money '||r.money||E'\n';
  exception when others then rep := rep||'work ERR '||sqlerrm||E'\n'; end;
  update public.town_residents set place=public.town_pjob_place('cafe'),energy=90,items='{"works":10,"jw":{"cafe":79}}'::jsonb,money=0,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','job',item:='cafe'); select * into r from public.town_residents where id=rid; rep := rep||'cafe 79→80 titles='||coalesce(r.items->>'titles','-')||' jw='||(r.items->'jw'->>'cafe')||' money '||r.money||E'\n';
  exception when others then rep := rep||'job ERR '||sqlerrm||E'\n'; end;
  -- 重複升階不重複稱號
  update public.town_residents set place=public.town_pjob_place('cafe'),energy=90,items=jsonb_build_object('works',10,'jw','{"cafe":79}'::jsonb,'titles','["咖啡廳領班"]'::jsonb),money=0,updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','job',item:='cafe'); select * into r from public.town_residents where id=rid; rep := rep||'dup titles='||(r.items->>'titles')||E'\n';
  exception when others then rep := rep||'dup ERR '||sqlerrm||E'\n'; end;
  select min(money) into n from public.town_residents where town_id=r.town_id; rep := rep||'min money '||n||' bad='||bad||E'\n';
  raise exception 'REPORT%', E'\n'||rep;
end $$;

-- 拉菲's office 職階實測（接在 town.sql 或 town_rafi2.sql 之後貼上；最後 rollback，結果在錯誤訊息 REPORT）
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; n int; prev int := 0; w int; bad int := 0; ths int[] := array[0,14,15,39,40,59,60,79,80,149,150,259,260,399,400,599,600,899,900,5000];
begin
  foreach n in array ths loop
    w := public.town_pjob_wage('rafi', n);
    if w < prev then bad := bad + 1; end if; prev := w;
    rep := rep || n||':'||public.town_pjob_name('rafi',n)||'/'||w||' ';
  end loop;
  rep := rep || E'\nbad='||bad||' max<=1500:'||(public.town_pjob_wage('rafi',99999) <= 1500)||' place='||public.town_place_name('rafi')||E'\n';
  rep := rep || 'old ok='||(public.town_pjob_wage('rafi',15)=450 and public.town_pjob_wage('rafi',40)=650 and public.town_pjob_wage('rafi',80)=740 and public.town_pjob_wage('rafi',150)=840 and public.town_pjob_wage('rafi',260)=950)||E'\n';
  cr := public.town_create('ZZRAFI','甲','1234'); rid := (cr->>'resident_id')::bigint;
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  update public.town_residents set place='rafi',energy=90,hunger=90,fun=90,hygiene=90,bladder=90,sleeping=false,items='{"works":10}'::jsonb,money=0,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','job',item:='rafi'); select * into r from public.town_residents where id=rid; rep := rep||'缺值 jw='||coalesce(r.items->'jw'->>'rafi','-')||' money '||coalesce(r.money::text,'-')||E'\n';
  exception when others then rep := rep||'缺值 ERR '||sqlerrm||E'\n'; end;
  foreach n in array array[59,79,899] loop
    update public.town_residents set place='rafi',energy=90,items=jsonb_build_object('works',10,'jw','{"rafi":0}'::jsonb||jsonb_build_object('rafi',n)),money=0,seen_at=now(),updated_at=now() where id=rid;
    begin perform public.town_act(rid,'1234','job',item:='rafi'); select * into r from public.town_residents where id=rid; rep := rep||(n+1)||'→ titles='||coalesce(r.items->>'titles','-')||' money '||coalesce(r.money::text,'-')||E'\n';
    exception when others then rep := rep||n||' ERR '||sqlerrm||E'\n'; end;
  end loop;
  update public.town_residents set place='rafi',energy=90,items=jsonb_build_object('works',10,'jw','{"rafi":79}'::jsonb,'titles','["部門主任"]'::jsonb),money=0,updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','job',item:='rafi'); select * into r from public.town_residents where id=rid; rep := rep||'dup titles='||coalesce(r.items->>'titles','-')||E'\n';
  exception when others then rep := rep||'dup ERR '||sqlerrm||E'\n'; end;
  select min(money) into n from public.town_residents where town_id=r.town_id; rep := rep||'min money '||coalesce(n::text,'-')||E'\n';
  raise exception 'REPORT%', E'\n'||rep;
end $$;

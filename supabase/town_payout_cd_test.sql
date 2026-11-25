-- 全民紅包冷卻修正實測：接在 town_powers2.sql、town_payout_cd.sql 之後，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; jn json; ra bigint; rb bigint; rc bigint; tid text; rep text := ''; j json; i int; m0 bigint; f0 bigint;
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZPCD','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'乙','1234'); rb := (jn->>'resident_id')::bigint;
  jn := public.town_join(tid,(select invite from public.town_towns where id = tid),'丙','1234'); rc := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=40, y=8, sleeping=false, energy=90, hunger=90, fun=50, hygiene=50, bladder=90, money=1000, items='{}'::jsonb, seen_at=now(), updated_at=now() where town_id=tid;
  update public.town_towns set fund = 100000, created_at = now() - interval '2 hours' where id = tid;
  rep := rep||'補丁在位：'||(position('pay_at' in pg_get_functiondef('public.town_pw2_do(text,public.town_residents,text,bigint,int,text,text)'::regprocedure))>0)||'（期望 true）'||E'\n';
  j := public.town_power(ra,'1234','use','payout',null,5);
  rep := rep||'第一次：'||(j->>'msg')||' pay_at 有值='||((select pay_at from public.town_powers where town_id = tid) is not null)||E'\n';
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'3 天內第二次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'3 天內第二次：'||sqlerrm||E'\n'; end;
  -- 把 log 灌到 70 筆其他紀錄（擠掉 payout）與清空 log
  update public.town_powers set log = (select jsonb_agg(jsonb_build_object('id','x'||g,'k','fine','at',now(),'t','0')) from generate_series(1,70) g) where town_id = tid;
  rep := rep||'log 筆數='||(select jsonb_array_length(log) from public.town_powers where town_id = tid)||' 含 payout='||(select count(*) from public.town_powers p, jsonb_array_elements(p.log) z(e) where p.town_id = tid and z.e->>'k' = 'payout')||'（期望 70／0）'||E'\n';
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'log 被灌滿後第二次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'log 被灌滿後仍被擋：'||sqlerrm||E'\n'; end;
  update public.town_powers set log = '[]'::jsonb where town_id = tid;
  begin perform public.town_power(ra,'1234','use','payout',null,5); rep := rep||'log 清空後第二次：沒被擋（錯）'||E'\n'; exception when others then rep := rep||'log 清空後仍被擋：'||sqlerrm||E'\n'; end;
  -- 滿 3 天
  update public.town_powers set pay_at = now() - interval '3 days 1 minute' where town_id = tid;
  m0 := (select sum(money) from public.town_residents where town_id = tid); f0 := (select fund from public.town_towns where id = tid);
  j := public.town_power(ra,'1234','use','payout',null,5);
  rep := rep||'滿 3 天可發：'||(j->>'msg')||' 守恆差='||((select sum(money) from public.town_residents where town_id = tid) + (select fund from public.town_towns where id = tid) - m0 - f0)||'（期望 0）'||E'\n';
  rep := rep||'錢最小='||(select min(money) from public.town_residents where town_id = tid)||' 基金='||(select fund from public.town_towns where id = tid)||'（期望 ≥ 0）'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

do $$
declare cr json; rid bigint; rep text := ''; o json; r public.town_residents; i int; k text; before_m int; e text;
  procedure_dummy int;
begin
  -- 前半：真實營業時間（現在若休息，各工作應回休息說明）
  cr := public.town_create('ZZJOB','甲','1234'); rid := (cr->>'resident_id')::bigint;
  rep := rep || 'HOUR=' || extract(hour from (now() at time zone 'Asia/Taipei')) || E'\n';
  foreach k in array array['cafe','rest','gym','shop','rafi'] loop
    update public.town_residents set place = public.town_pjob_place(k), energy=70,hunger=70,fun=70,hygiene=70,bladder=70,sleeping=false, items='{"works":10}'::jsonb, seen_at=now(), updated_at=now() where id = rid;
    begin perform public.town_act(rid,'1234','job',item:=k); rep := rep || 'real '||k||' ok'||E'\n';
    exception when others then rep := rep || 'real '||k||' ERR '||sqlerrm||E'\n'; end;
  end loop;
  -- 後半：把營業時間改成永遠營業（整段最後會 rollback）
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  foreach k in array array['cafe','rest','gym','shop','rafi'] loop
    update public.town_residents set place = public.town_pjob_place(k), energy=70,hunger=70,fun=70,hygiene=70,bladder=70,sleeping=false, items='{"works":10}'::jsonb, money=0, seen_at=now(), updated_at=now() where id = rid;
    begin perform public.town_act(rid,'1234','job',item:=k); select * into r from public.town_residents where id = rid;
      rep := rep || k||': money '||r.money||' en '||round(r.energy)||' hu '||round(r.hunger)||' fu '||round(r.fun)||' hy '||round(r.hygiene)||' fit '||coalesce(r.items->>'fit','-')||' works '||(r.items->>'works')||' jw '||(r.items->'jw')::text||E'\n';
    exception when others then rep := rep || k||' ERR '||sqlerrm||E'\n'; end;
  end loop;
  -- 跨工作疲勞：5 次不同工作
  update public.town_residents set items='{"works":10}'::jsonb, money=0 where id = rid;
  i := 0;
  foreach k in array array['cafe','shop','cafe','shop','cafe','shop','rest','shop','cafe'] loop
    i := i + 1;
    update public.town_residents set place = public.town_pjob_place(k), energy=70,hunger=70,fun=70,hygiene=70,sleeping=false,seen_at=now(),updated_at=now() where id = rid;
    select money into before_m from public.town_residents where id = rid;
    perform public.town_act(rid,'1234','job',item:=k); select * into r from public.town_residents where id = rid;
    rep := rep || 'fatigue#'||i||' '||k||' +'||(r.money-before_m)||E'\n';
  end loop;
  -- 公司打工也算同一個計數（現在已 9 次，第 10 次應 25%→ 打公司）
  update public.town_residents set place='office',energy=70,hunger=70,fun=70,hygiene=70,sleeping=false,seen_at=now(),updated_at=now() where id = rid;
  select money into before_m from public.town_residents where id = rid;
  perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id = rid;
  rep := rep || 'company after 9 jobs: +'||(r.money-before_m)||' works '||(r.items->>'works')||' (員工 260 × 25% = 65)'||E'\n';
  -- 拉菲門檻
  update public.town_residents set place='rafi',items='{"works":9}'::jsonb,energy=70,hunger=70,fun=70,hygiene=70,seen_at=now(),updated_at=now() where id = rid;
  begin perform public.town_act(rid,'1234','job',item:='rafi'); rep := rep||'rafi works9 NOT BLOCKED'||E'\n'; exception when others then rep := rep||'rafi works9: '||sqlerrm||E'\n'; end;
  -- 熟練度：cafe 15 次 / 40 次 / rafi 15 次 / 40 次
  foreach k in array array['cafe','rafi'] loop
    foreach i in array array[14,39] loop
      update public.town_residents set place=public.town_pjob_place(k),items=jsonb_build_object('works',10,'jw',jsonb_build_object(k,i)),money=0,energy=70,hunger=70,fun=70,hygiene=70,seen_at=now(),updated_at=now() where id = rid;
      perform public.town_act(rid,'1234','job',item:=k); select * into r from public.town_residents where id = rid;
      rep := rep||k||' n='||i||' -> +'||r.money||' jw '||(r.items->'jw')::text||E'\n';
    end loop;
  end loop;
  rep := rep || 'promo events: '||(select string_agg(msg,' | ') from public.town_events where actor=rid and kind='promo')||E'\n';
  -- 設施關閉
  update public.town_towns set off = array['rafi','cafe'] where id = (select town_id from public.town_residents where id=rid);
  foreach k in array array['rafi','cafe','gym'] loop
    update public.town_residents set place=public.town_pjob_place(k),items='{"works":10}'::jsonb,energy=70,hunger=70,fun=70,hygiene=70,seen_at=now(),updated_at=now() where id = rid;
    begin perform public.town_act(rid,'1234','job',item:=k); rep := rep||'off '||k||' allowed'||E'\n'; exception when others then rep := rep||'off '||k||': '||sqlerrm||E'\n'; end;
  end loop;
  -- 地點不對、不明工作、太累
  update public.town_residents set place='plaza',items='{}'::jsonb,seen_at=now(),updated_at=now() where id = rid;
  begin perform public.town_act(rid,'1234','job',item:='gym'); exception when others then rep := rep||'wrongplace: '||sqlerrm||E'\n'; end;
  begin perform public.town_act(rid,'1234','job',item:='xx'); exception when others then rep := rep||'badjob: '||sqlerrm||E'\n'; end;
  update public.town_residents set place='gym',energy=18,seen_at=now(),updated_at=now() where id = rid;
  begin perform public.town_act(rid,'1234','job',item:='gym'); rep := rep||'tired allowed'||E'\n'; exception when others then rep := rep||'tired: '||sqlerrm||E'\n'; end;
  -- 舊角色（沒有 jw）公司打工照舊
  update public.town_residents set place='office',energy=70,hunger=70,fun=70,hygiene=70,money=0,items='{"works":30}'::jsonb,seen_at=now(),updated_at=now() where id = rid;
  perform public.town_act(rid,'1234','work'); select * into r from public.town_residents where id = rid;
  rep := rep||'old char work: +'||r.money||' works '||(r.items->>'works')||' (組長 350)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

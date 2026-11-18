-- town_venue 實測：接在 town_venues1.sql 之後執行，結果在錯誤訊息 REPORT，整段 rollback
do $$
declare cr json; ra bigint; rb bigint; rep text := ''; tid text; j json; r public.town_residents; a text; pls text[] := array['cafe','cafe','restaurant','restaurant','cinema','cinema','market','market','market'];
  acts text[] := array['art','share','combo','bring','seat','chat','sale','sample','mredeem']; i int; m0 int;
begin
  cr := public.town_create('ZZV1','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  rb := ((public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'))->>'resident_id')::bigint;
  for i in 1..9 loop
    update public.town_residents set money = 5000, energy = 50, hunger = 40, fun = 40, sleeping = false, seen_at = now(), place = pls[i],
      items = jsonb_set(items - 'fq', '{fi}', to_jsonb(pls[i])) || jsonb_build_object('mp', 10) where id in (ra, rb);
    begin
      j := public.town_venue(ra,'1234',acts[i], rb, 90);
      select * into r from public.town_residents where id = ra;
      rep := rep || acts[i] || ': ' || j::text || ' money ' || r.money || E'\n';
    exception when others then rep := rep || acts[i] || ' ERR: ' || sqlerrm || E'\n'; end;
  end loop;
  update public.town_residents set money = 5000, place = 'cafe', items = jsonb_set(items,'{fi}','"cafe"') where id = ra;
  j := public.town_venue(ra,'1234','reg'); select * into r from public.town_residents where id = ra;
  rep := rep || 'reg: ' || j::text || ' money ' || r.money || ' (期望 4990)' || E'\n';
  begin perform public.town_venue(ra,'1234','combo'); rep := rep || 'wrong place NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'wrong place: ' || sqlerrm || E'\n'; end;
  update public.town_residents set money = 10 where id = ra;
  begin perform public.town_venue(ra,'1234','art',null,50); rep := rep || 'poor NOT BLOCKED' || E'\n'; exception when others then rep := rep || 'poor: ' || sqlerrm || E'\n'; end;
  raise exception 'REPORT%', E'\n' || rep;
end $$;

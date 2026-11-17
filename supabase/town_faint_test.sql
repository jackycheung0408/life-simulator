-- 昏倒（faint＋sleeping，照 town_tick 實際做法）時 town_roll／town_act／town_mischief 是否被擋。最後 rollback，結果在 REPORT。
do $$
declare cr json; jn json; ra bigint; rb bigint; tid text; rep text := '';
begin
  execute $f$create or replace function public.town_closed(what text) returns text language sql stable as 'select null::text'$f$;
  cr := public.town_create('ZZFT','甲','1234'); ra := (cr->>'resident_id')::bigint; tid := cr->>'town_id';
  jn := public.town_join(tid, (select invite from public.town_towns where id = tid), '乙','1234'); rb := (jn->>'resident_id')::bigint;
  update public.town_residents set place='street', x=20, y=7, sleeping=false, energy=90, hunger=90, fun=90, hygiene=90, bladder=90, money=50000, items='{}'::jsonb, seen_at=now(), updated_at=now() where id in (ra,rb);
  update public.town_residents set sleeping=true, items=jsonb_set(items,'{faint}', to_jsonb((now()+interval '1 hour')::text)) where id = ra;
  begin perform public.town_roll(ra,'1234','fun',rb); rep := rep||'roll fun 沒擋 BAD'||E'\n'; exception when others then rep := rep||'roll fun 擋住：'||SQLERRM||E'\n'; end;
  begin perform public.town_roll(ra,'1234','mis',rb); rep := rep||'roll mis 沒擋 BAD'||E'\n'; exception when others then rep := rep||'roll mis 擋住：'||SQLERRM||E'\n'; end;
  begin perform public.town_act(rid=>ra, pin=>'1234', act=>'greet', target=>rb); rep := rep||'town_act greet 沒擋 BAD'||E'\n'; exception when others then rep := rep||'town_act greet 擋住：'||SQLERRM||E'\n'; end;
  begin perform public.town_mischief(ra,'1234','splash',rb); rep := rep||'town_mischief 沒擋 BAD'||E'\n'; exception when others then rep := rep||'town_mischief 擋住：'||SQLERRM||E'\n'; end;
  delete from public.town_towns where id = tid;
  raise exception E'REPORT\n%', rep;
end $$;

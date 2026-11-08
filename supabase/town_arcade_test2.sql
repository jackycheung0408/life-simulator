do $$
declare cr json; rid bigint; rep text := ''; g json; m int;
begin
  cr := public.town_create('ZZARC','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false, money=1000, items='{"hl":{"bet":100,"card":7}}'::jsonb where id = rid;
  begin g := public.town_game(rid,'1234','hl_guess',0,'hi'); rep := rep||'old hl: '||g::text||E'\n'; exception when others then rep := rep||'old hl ERR '||sqlerrm||E'\n'; end;
  select money into m from public.town_residents where id = rid; rep := rep||'money after refund='||m||' hl cleared='||((select items->'hl' from public.town_residents where id=rid) is null)||E'\n';
  update public.town_residents set money=1000, items='{"bj":{"bet":200,"p":[10,6],"d":[9]}}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','bj_stand'); rep := rep||'old bj: '||g::text||E'\n';
  select money into m from public.town_residents where id = rid; rep := rep||'money after refund='||m||E'\n';
  update public.town_residents set money=1000, items='{}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','bj_start',100); rep := rep||'new bj: '||g::text||E'\n';
  g := public.town_game(rid,'1234','hl_start',100); g := public.town_game(rid,'1234','hl_guess',0,'lo'); rep := rep||'new hl: '||g::text||E'\n';
  raise exception E'REPORT3\n%', rep;
end $$;

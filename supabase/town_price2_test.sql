-- 接在 town.sql 之後貼上；最後回滾，結果在 REPORT
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; hit int := 0; tot bigint := 0; m0 bigint;
begin
  cr := public.town_create('ZZP2','甲','1234'); rid := (cr->>'resident_id')::bigint;
  rep := 'furn '||(select string_agg(id||'='||price, ',' order by id) from public.town_shop where kind='furn' and id in ('bed','fridge','massage','shelf','sofa','tvcab','rug','plant'))||E'\n';
  -- 升級價
  update public.town_residents set place='home:'||rid,money=36999,items='{"hl":1}'::jsonb,seen_at=now(),updated_at=now() where id=rid;
  begin perform public.town_act(rid,'1234','upgrade'); rep := rep||'upgrade 39999(含普發) NOT BLOCKED'||E'\n'; exception when others then rep := rep||'upgrade 39999(含普發): '||sqlerrm||E'\n'; end;
  update public.town_residents set money=37000,items=jsonb_set(items,'{rent}','"zz"'::jsonb) where id=rid;
  begin perform public.town_act(rid,'1234','upgrade'); select * into r from public.town_residents where id=rid; rep := rep||'upgrade 40000 ok, money '||r.money||' hl '||(r.items->>'hl')||E'\n'; exception when others then rep := rep||'upgrade 40000: '||sqlerrm||E'\n'; end;
  -- 突發支出：100 個不同日子，現金 100000
  select * into r from public.town_residents where id=rid;
  for i in 1..200 loop
    r.money := 100000; r.items := jsonb_set(r.items,'{rent}','"x"'::jsonb); r.items := jsonb_set(r.items,'{hl}','1'::jsonb);
    m0 := r.money; r := public.town_rent(r);
    -- 扣掉普發 +3000、房租 400、財產稅 0
    if r.money - m0 - 3000 + 400 < -100 then hit := hit + 1; tot := tot + (m0 + 3000 - 400 - r.money); end if;
  end loop;
  rep := rep||'突發支出 200 天中 '||hit||' 次（期望約 60），平均損失 '||(case when hit>0 then tot/hit else 0 end)||'（期望約 5500，上限 6000）'||E'\n';
  update public.town_residents set money=500 where id=rid; select * into r from public.town_residents where id=rid; r.items := jsonb_set(r.items,'{rent}','"x"'::jsonb); m0 := r.money; r := public.town_rent(r);
  rep := rep||'錢少（500）不觸發突發：money '||m0||' -> '||r.money||' (期望 500+3000-400=3100)'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

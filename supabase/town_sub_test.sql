-- 接在 town.sql 之後貼上；最後回滾，結果在 REPORT：生活補助 600（現金 < 10000 才發）與突發支出（現金 > 10000）
do $$
declare cr json; rid bigint; rep text := ''; r public.town_residents; i int; hit int := 0; tot bigint := 0; m0 bigint;
begin
  cr := public.town_create('ZZSB','甲','1234'); rid := (cr->>'resident_id')::bigint;
  select * into r from public.town_residents where id=rid;
  r.money := 5000; r.items := jsonb_set(r.items,'{rent}','"x"'::jsonb); m0 := r.money; r := public.town_rent(r);
  rep := rep||'窮人 5000 -> '||r.money||' (期望 5000+600-400=5200，沒有突發因為不到 10000)'||E'\n';
  r.money := 50000; r.items := jsonb_set(r.items,'{rent}','"x"'::jsonb); r.items := jsonb_set(r.items,'{hl}','1'::jsonb); m0 := r.money;
  for i in 1..200 loop
    r.money := 50000; r.items := jsonb_set(r.items,'{rent}','"x"'::jsonb);
    r := public.town_rent(r);
    if r.money < 50000 - 400 - 100 then hit := hit + 1; tot := tot + (50000 - 400 - r.money); end if;
    if r.money > 50000 then rep := rep||'有錢人領了補助？'||r.money||E'\n'; exit; end if;
  end loop;
  rep := rep||'有錢人 50000：200 天中突發 '||hit||' 次（期望約 60），平均損失 '||(case when hit>0 then tot/hit else 0 end)||'（期望約 3200）；沒領補助'||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

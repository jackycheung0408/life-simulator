-- 接在 town.sql 之後貼上；最後回滾，結果在 REPORT
do $$
declare rep text := '';
begin
  rep := 'rent '||public.town_rent_amt(1)||'/'||public.town_rent_amt(2)||'/'||public.town_rent_amt(3)||'/'||public.town_rent_amt(4)||' (400/800/1500/3000)'||E'\n';
  rep := rep||'car '||public.town_vprice('car')||' moto '||public.town_vprice('moto')||E'\n';
  rep := rep||'furn '||(select string_agg(id||'='||price, ',' order by id) from public.town_shop where kind='furn' and id in ('bed','fridge','massage','shelf','sofa','tvcab','rug','plant'))||E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

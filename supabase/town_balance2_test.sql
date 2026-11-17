-- 接在 town.sql、town_fac.sql、town_tweaks.sql 之後貼上；純函式檢查，不寫資料。結果在錯誤訊息 REPORT
do $$
declare rep text := '';
begin
  rep := 'pct 1/30/80 = '||public.town_work_pct(1)||'/'||public.town_work_pct(30)||'/'||public.town_work_pct(80)||' (100/100/100)'||E'\n';
  rep := rep||'tax 5萬/10萬/100萬/500萬/1000萬 = '||public.town_tax(50000)||'/'||public.town_tax(100000)||'/'||public.town_tax(1000000)||'/'||public.town_tax(5000000)||'/'||public.town_tax(10000000)||' (0/150/7350/67350/217350)'||E'\n';
  raise exception 'REPORT %', rep;
end $$;

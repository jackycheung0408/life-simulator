-- 平衡批 3 實測：和好 +10、好朋友薪水 +3%、cron 排程回復量。最後 rollback，結果在 REPORT。
do $$
declare t text := 'ZZB3'; a bigint; b bigint; ra public.town_residents; rep text := ''; v int; sc int; j text;
begin
  insert into public.town_towns(id,name,invite,fund) values (t,'測試鎮','ZZB3X1',0) on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,mayor,pin_hash,items) values (t,'甲',5000,0,10,10,'street',true,extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',5000,1,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  select * into ra from public.town_residents where id = a;
  v := public.town_pr_pct(ra); rep := rep||'沒朋友 pr_pct='||v||case when v=100 then ' OK' else ' BAD' end||E'\n';
  insert into public.town_bonds(town_id,a,b,score) values (t,least(a,b),greatest(a,b),30);
  v := public.town_pr_pct(ra); rep := rep||'好麻吉 pr_pct='||v||case when v=103 then ' OK' else ' BAD' end||E'\n';
  update public.town_bonds set score = 29 where a = least(a,b) and b = greatest(a,b);
  v := public.town_pr_pct(ra); rep := rep||'29 分 pr_pct='||v||case when v=100 then ' OK' else ' BAD' end||E'\n';
  -- 和好：好感 -20，同地點面對面，心情普通
  update public.town_bonds set score = -20 where a = least(a,b) and b = greatest(a,b);
  update public.town_residents set seen_at=now(), fun=70, energy=90, hunger=90, hygiene=90, bladder=90 where town_id = t;
  perform public.town_act(a,'x','makeup',target:=b);
  sc := public.town_bond_get(a,b); rep := rep||'和好 -20 → '||sc||' (預期約 -10，心情倍率可能略不同)'||E'\n';
  select command into j from cron.job where jobname = 'town-bond-recover';
  rep := rep||'cron：'||case when j like '%then 3 else 2%' then 'OK 回復 +2／+3' else 'BAD '||coalesce(j,'無') end||E'\n';
  delete from public.town_towns where id = t;
  raise exception E'REPORT\n%', rep;
end $$;

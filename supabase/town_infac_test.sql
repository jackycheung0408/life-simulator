-- 進館限制回滾實測：結果在錯誤訊息 REPORT。順序：town_fi.sql → town_infac.sql → town.sql → town_fac.sql → town_stock.sql 之後貼上，最後 rollback。
do $$
declare t text := 'ZZINF'; a bigint; ra public.town_residents; rep text := ''; m text; c record; n_ok int := 0; n_bad int := 0;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZINF1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,energy,hunger) values (t,'甲',5000,0,10,10,'street',extensions.crypt('x', extensions.gen_salt('bf')),100,100) returning id into a;
  -- 地點、動作、item：不在室內要被擋；進去後不能再被「要先進去」擋；出門後又被擋
  for c in select * from (values
    ('office','work',null),('office','cowork',null),('rafi','job','rafi'),('market','buy','snack'),('market','browse',null),('cinema','movie',null),
    ('arena','spar',null),('slaughter','sneak',null),('carshop','vbuy','bike'),('carshop','license','moto'),('carshop','insure','car:c:7'),('carshop','vfix','bike'),('carshop','vsell','bike'),
    ('restaurant','dine',null),('cafe','coffee',null),('gym','workout',null),('cafe','job','cafe'),('market','job','shop')) as v(pl, ac, it)
  loop
    update public.town_residents set place = c.pl, items = '{}'::jsonb, sleeping = false where id = a;
    m := ''; begin perform public.town_act(a,'x', act := c.ac, item := c.it); exception when others then m := sqlerrm; end;
    if m like '%要先進去%' then n_ok := n_ok + 1; else n_bad := n_bad + 1; rep := rep || ' [沒擋 ' || c.pl || '/' || c.ac || ':' || m || ']'; end if;
    update public.town_residents set items = jsonb_build_object('fi', c.pl) where id = a;
    m := ''; begin perform public.town_act(a,'x', act := c.ac, item := c.it); exception when others then m := sqlerrm; end;
    if m like '%要先進去%' then n_bad := n_bad + 1; rep := rep || ' [進去還被擋 ' || c.pl || '/' || c.ac || ']'; else n_ok := n_ok + 1; end if;
    update public.town_residents set items = items - 'fi' where id = a;
    m := ''; begin perform public.town_act(a,'x', act := c.ac, item := c.it); exception when others then m := sqlerrm; end;
    if m like '%要先進去%' then n_ok := n_ok + 1; else n_bad := n_bad + 1; rep := rep || ' [出門沒擋 ' || c.pl || '/' || c.ac || ']'; end if;
  end loop;
  -- 設施互動 town_fac（餐廳、咖啡廳、健身房、電影院）
  for c in select * from (values ('restaurant','special'),('cafe','latte'),('gym','checkin'),('cinema','popcorn')) as v(pl, ac) loop
    update public.town_residents set place = c.pl, items = '{}'::jsonb where id = a;
    m := ''; begin perform public.town_fac(a,'x', c.ac); exception when others then m := sqlerrm; end;
    if m like '%要先進去%' then n_ok := n_ok + 1; else n_bad := n_bad + 1; rep := rep || ' [fac 沒擋 ' || c.pl || ']'; end if;
    update public.town_residents set items = jsonb_build_object('fi', c.pl) where id = a;
    m := ''; begin perform public.town_fac(a,'x', c.ac); exception when others then m := sqlerrm; end;
    if m like '%要先進去%' then n_bad := n_bad + 1; rep := rep || ' [fac 進去還被擋 ' || c.pl || ']'; else n_ok := n_ok + 1; end if;
  end loop;
  -- 股票
  update public.town_residents set place = 'stock', items = '{}'::jsonb where id = a;
  m := ''; begin perform public.town_stock_trade(a,'x','buy','PIG',1); exception when others then m := sqlerrm; end;
  rep := rep || ' 股票不在室內=' || m;
  update public.town_residents set items = jsonb_build_object('fi','stock') where id = a;
  m := ''; begin perform public.town_stock_trade(a,'x','buy','PIG',1); exception when others then m := sqlerrm; end;
  rep := rep || ' 股票在室內=' || m;
  -- 戶外不受影響：公園廣場
  update public.town_residents set place = 'park', items = '{}'::jsonb where id = a;
  m := ''; begin perform public.town_fac(a,'x','fish'); exception when others then m := sqlerrm; end;
  rep := rep || ' 公園釣魚=' || (case when m like '%要先進去%' then '被擋(錯)' else 'OK ' || m end);
  -- 入獄者：先被監獄擋，不是進館
  update public.town_residents set place = 'office', items = jsonb_build_object('jl', (now() + interval '1 hour')::text) where id = a;
  m := ''; begin perform public.town_act(a,'x', act := 'work'); exception when others then m := sqlerrm; end;
  rep := rep || ' 入獄者=' || m;
  -- 離線超過一小時回家睡後清掉 fi：town_fin 只認 fi = place
  update public.town_residents set place = 'home:' || a, items = jsonb_build_object('fi','cafe') where id = a;
  select * into ra from public.town_residents where id = a;
  rep := rep || ' 走到別處 town_fin=' || public.town_fin(ra);
  -- 開關：關掉後不再擋
  insert into public.town_flags(k, v) values ('infac', false) on conflict (k) do update set v = false;
  update public.town_residents set place = 'office', items = '{}'::jsonb where id = a;
  m := ''; begin perform public.town_act(a,'x', act := 'work'); exception when others then m := sqlerrm; end;
  rep := rep || ' 開關關閉後work=' || (case when m like '%要先進去%' then '還在擋(錯)' else 'OK ' || m end);
  select * into ra from public.town_residents where id = a;
  rep := rep || ' 錢=' || ra.money || '(不可為負)';
  raise exception 'REPORT 通過 % 錯 % :%', n_ok, n_bad, rep;
end $$;

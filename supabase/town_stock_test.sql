-- 股市實測：先套用 town.sql 與 town_stock.sql，再貼這段執行；整段最後 rollback（會暫時把 town_closed 改成永遠營業），結果在錯誤訊息 REPORT
do $$
declare cr json; rid bigint; rep text := ''; o json; r public.town_residents; i int; e text; p numeric; real_closed text; n int;
begin
  cr := public.town_create('ZZSTK','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='stock', sleeping=false, money=100000, items='{}'::jsonb where id = rid;
  real_closed := public.town_closed('stock');
  rep := rep || 'real closed? ' || coalesce(real_closed,'OPEN') || E'\n';
  begin perform public.town_stock_trade(rid,'1234','buy','0050',1); rep := rep || 'real-hours buy: ' || case when real_closed is null then 'ok' else 'ALLOWED?!' end || E'\n';
  exception when others then rep := rep || 'real-hours buy: ' || sqlerrm || E'\n'; end;
  execute 'create or replace function public.town_closed(what text) returns text language sql stable as $f$ select null::text $f$';
  update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
  -- 價格：全部股票現價與參考價
  for e in select code || ' ' || public.town_stock_price(code) || ' ref=' || close || ' d=' || d from public.town_stocks order by code loop rep := rep || e || E'\n'; end loop;
  rep := rep || 'list: ' || left(public.town_stock_list()::text, 160) || E'\n';
  -- 買 100 股 0050
  p := public.town_stock_price('0050');
  o := public.town_stock_trade(rid,'1234','buy','0050',100); rep := rep || 'buy 100 0050 @' || p || ': ' || o::text || E'\n';
  select * into r from public.town_residents where id = rid; rep := rep || 'money=' || r.money || ' st=' || (r.items->'st')::text || E'\n';
  -- 賣 40 股（ETF 稅 0.1%），錢進 pend
  o := public.town_stock_trade(rid,'1234','sell','0050',40); rep := rep || 'sell 40: ' || o::text || E'\n';
  select * into r from public.town_residents where id = rid; rep := rep || 'money=' || r.money || ' st=' || (r.items->'st')::text || E'\n';
  -- 賣超過持股、錢不夠、單筆上限、每日上限
  begin perform public.town_stock_trade(rid,'1234','sell','0050',61); rep := rep || 'oversell ALLOWED' || E'\n'; exception when others then rep := rep || 'oversell: ' || sqlerrm || E'\n'; end;
  begin perform public.town_stock_trade(rid,'1234','buy','2454',100); rep := rep || 'big trade ALLOWED' || E'\n'; exception when others then rep := rep || 'big trade: ' || sqlerrm || E'\n'; end;
  update public.town_residents set money=10 where id = rid;
  begin perform public.town_stock_trade(rid,'1234','buy','0050',100); rep := rep || 'poor ALLOWED' || E'\n'; exception when others then rep := rep || 'poor: ' || sqlerrm || E'\n'; end;
  update public.town_residents set money=1000000 where id = rid;
  for i in 1..3 loop
    begin perform public.town_stock_trade(rid,'1234','buy','2308',25); rep := rep || 'daily buy ' || i || ' ok' || E'\n'; exception when others then rep := rep || 'daily buy ' || i || ': ' || sqlerrm || E'\n'; end;
  end loop;
  -- 地點、開關、睡覺
  update public.town_residents set place='plaza' where id = rid;
  begin perform public.town_stock_trade(rid,'1234','buy','0050',1); rep := rep || 'wrong place ALLOWED' || E'\n'; exception when others then rep := rep || 'wrong place: ' || sqlerrm || E'\n'; end;
  update public.town_residents set place='stock' where id = rid;
  update public.town_towns set off = array['stock'] where id = (select town_id from public.town_residents where id = rid);
  begin perform public.town_stock_trade(rid,'1234','buy','0050',1); rep := rep || 'off ALLOWED' || E'\n'; exception when others then rep := rep || 'off: ' || sqlerrm || E'\n'; end;
  update public.town_towns set off = '{}' where id = (select town_id from public.town_residents where id = rid);
  -- 移動白名單與 T+2 入帳（把 pend 改成已到期，town_act 任一動作就會入帳）
  o := public.town_act(rid,'1234','move',px:=42,py:=5,dest:='stock'); rep := rep || 'move stock ok' || E'\n';
  update public.town_residents set money=500, items=jsonb_set(items,'{st,pend}','[{"d":"2000-01-01","a":777},{"d":"2999-01-01","a":5}]'::jsonb) where id = rid;
  o := public.town_act(rid,'1234','move',px:=42,py:=5,dest:='stock');
  select * into r from public.town_residents where id = rid; rep := rep || 'settle: money=' || r.money || ' (expect 1277) pend=' || (r.items->'st'->'pend')::text || E'\n';
  rep := rep || 'bdays Fri+2=' || public.town_add_bdays('2026-11-06',2) || ' Wed+2=' || public.town_add_bdays('2026-11-04',2) || E'\n';
  -- 舊角色（沒有 st）不受影響
  update public.town_residents set items='{}'::jsonb where id = rid; o := public.town_act(rid,'1234','move',px:=42,py:=5,dest:='stock'); rep := rep || 'old resident move ok' || E'\n';
  -- town_stock_set
  rep := rep || 'set same: ' || public.town_stock_set('0050', 92.5, '2026-11-06') || ' / old: ' || public.town_stock_set('0050', 90, '2026-11-05') || ' / future: ' || public.town_stock_set('0050', 99, '2999-01-01') || ' / unknown: ' || public.town_stock_set('9999', 1, '2026-11-06') || ' / new: ' || public.town_stock_set('0050', 93, (now() at time zone 'Asia/Taipei')::date) || E'\n';
  select close || '/' || prev || '/' || d into e from public.town_stocks where code = '0050'; rep := rep || '0050 after new: ' || e || ' price=' || public.town_stock_price('0050') || E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

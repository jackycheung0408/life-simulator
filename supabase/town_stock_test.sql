-- 股市實測：先套用 town.sql 與 town_stock.sql，再貼這段執行；整段最後 rollback，結果在錯誤訊息 REPORT
do $$
declare cr json; rid bigint; rep text := ''; o json; r public.town_residents; i int; e text; n int; mn numeric; mx numeric; up int; dn int;
begin
  cr := public.town_create('ZZSTK','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='stock', sleeping=false, money=100000, items='{}'::jsonb where id = rid;
  rep := rep || 'list: ' || left(public.town_stock_list()::text, 300) || E'\n';
  -- 模擬 2 天（288 步）看價格範圍與消息數：把 stepped 往前撥再補算，一次最多補 36 步，所以分多次
  for i in 1..16 loop
    update public.town_market set stepped = now() - interval '6 hours';
    perform public.town_market_step();
  end loop;
  for e in select code || ' base=' || base || ' price=' || round(price,2) || ' hist_n=' || jsonb_array_length(hist) from public.town_market order by base loop rep := rep || e || E'\n'; end loop;
  select count(*), count(*) filter (where pct > 0), count(*) filter (where pct < 0) into n, up, dn from public.town_market_news; rep := rep || 'news(96h sim, 2 day keep) n=' || n || ' up=' || up || ' down=' || dn || E'\n';
  select min(price/base), max(price/base) into mn, mx from public.town_market; rep := rep || 'ratio range ' || round(mn,2) || '~' || round(mx,2) || E'\n';
  -- 買賣
  update public.town_market set price = 50 where code = 'pork';
  o := public.town_stock_trade(rid,'1234','buy','pork',10); rep := rep || 'buy 10: ' || o::text || E'\n';
  update public.town_market set price = 70 where code = 'pork';
  o := public.town_stock_trade(rid,'1234','sell','pork',4); rep := rep || 'sell 4 @70: ' || o::text || E'\n';
  select * into r from public.town_residents where id = rid; rep := rep || 'money=' || r.money || ' (expect 100000-500+280=99780) st=' || (r.items->'st')::text || E'\n';
  o := public.town_stock_trade(rid,'1234','sell','pork',6); rep := rep || 'sell rest: ' || o::text || E'\n';
  select * into r from public.town_residents where id = rid; rep := rep || 'money=' || r.money || ' st=' || (r.items->'st')::text || E'\n';
  begin perform public.town_stock_trade(rid,'1234','sell','pork',1); rep := rep || 'oversell ALLOWED' || E'\n'; exception when others then rep := rep || 'oversell: ' || sqlerrm || E'\n'; end;
  begin perform public.town_stock_trade(rid,'1234','buy','chip',250); rep := rep || 'big trade ALLOWED' || E'\n'; exception when others then rep := rep || 'big trade: ' || sqlerrm || E'\n'; end;
  update public.town_residents set money=10 where id = rid;
  begin perform public.town_stock_trade(rid,'1234','buy','pork',1); rep := rep || 'poor ALLOWED' || E'\n'; exception when others then rep := rep || 'poor: ' || sqlerrm || E'\n'; end;
  update public.town_residents set money=1000000 where id = rid;
  update public.town_market set price = 100 where code = 'moon';
  for i in 1..3 loop
    begin perform public.town_stock_trade(rid,'1234','buy','moon',200); rep := rep || 'daily buy ' || i || ' ok' || E'\n'; exception when others then rep := rep || 'daily buy ' || i || ': ' || sqlerrm || E'\n'; end;
  end loop;
  update public.town_residents set place='plaza' where id = rid;
  begin perform public.town_stock_trade(rid,'1234','buy','pork',1); rep := rep || 'wrong place ALLOWED' || E'\n'; exception when others then rep := rep || 'wrong place: ' || sqlerrm || E'\n'; end;
  update public.town_residents set place='stock' where id = rid;
  update public.town_towns set off = array['stock'] where id = (select town_id from public.town_residents where id = rid);
  begin perform public.town_stock_trade(rid,'1234','buy','pork',1); rep := rep || 'off ALLOWED' || E'\n'; exception when others then rep := rep || 'off: ' || sqlerrm || E'\n'; end;
  update public.town_towns set off = '{}' where id = (select town_id from public.town_residents where id = rid);
  o := public.town_act(rid,'1234','move',px:=42,py:=5,dest:='stock'); rep := rep || 'move stock ok, town_closed(stock)=' || coalesce(public.town_closed('stock'),'open') || E'\n';
  update public.town_residents set items='{}'::jsonb where id = rid; o := public.town_act(rid,'1234','move',px:=42,py:=5,dest:='stock'); rep := rep || 'old resident move ok' || E'\n';
  raise exception E'REPORT\n%', rep;
end $$;

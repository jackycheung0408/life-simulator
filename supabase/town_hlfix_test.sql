-- 實測（最後 rollback，結果在錯誤訊息 REPORT）：items.hl 是物件時，town_rent_amt 讀 hl 不再報錯
do $$ declare rep text := ''; rid bigint; tid text; m0 int; m1 int;
begin
  select id, town_id, money into rid, tid, m0 from public.town_residents order by id limit 1;
  update public.town_residents set items = jsonb_set(items, '{hl}', '{"bet":1000,"card":405}'::jsonb) where id = rid;
  begin perform (items->>'hl')::int from public.town_residents where id = rid; rep := rep||'舊寫法應報錯: 沒報錯(異常)'||E'\n';
  exception when others then rep := rep||'舊寫法報錯(符合預期): '||sqlerrm||E'\n'; end;
  update public.town_residents set money = money + coalesce((items->'hl'->>'bet')::int, 0), items = items - 'hl' where id = rid and jsonb_typeof(items->'hl') = 'object';
  select money into m1 from public.town_residents where id = rid;
  rep := rep||'退回押注 '||(m1-m0)||'（應 1000）, hl 已清='||((select items->'hl' from public.town_residents where id = rid) is null)||E'\n';
  raise exception 'REPORT%', E'\n'||rep;
end $$;

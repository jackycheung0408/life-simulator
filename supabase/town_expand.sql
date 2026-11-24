-- 小豬鎮：地圖東側加寬（階段 1，設施搬遷的前置）：COLS 85 → 100，新增東區空地 x 85～99（沒有任何設施，只是空地）。
-- 要在 town.sql、town_shops1.sql 之後套用，可重複執行。
-- 內容：
--   1) 就地把所有函式裡的位置上限 'px > 85' 改成 'px > 99'（用 pg_get_functiondef；全庫找不到任何一個就整檔失敗）。
--   2) layout6 遷移：新區域本來沒有人能站，所以不需要移人，只記遷移標記。
-- 重套 town.sql／town_shops1.sql 之後要再套一次本檔（它們會把上限改回 71／85）。

do $exp$
declare fr record; def text; hit int := 0;
begin
  for fr in
    select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%px > 85%'
  loop
    def := pg_get_functiondef(fr.oid);
    execute replace(def, 'px > 85', 'px > 99');
    hit := hit + 1;
  end loop;
  if hit = 0 and not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'town_act' and pg_get_functiondef(p.oid) like '%px > 99%') then
    raise exception '找不到任何含 px > 85 的函式，請先套用 town_shops1.sql';
  end if;
end $exp$;

do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'layout6') then
    insert into public.town_migrations(id) values ('layout6');
  end if;
end $mig$;

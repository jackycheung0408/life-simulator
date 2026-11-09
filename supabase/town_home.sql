-- 小豬鎮：家裡自由佈置（要在 town.sql 之後套用，可重複執行）
-- 資料：items.fp = 擺放座標 [[代號,x,y],...]（x 從 0、y = 0 是牆、地板從 1 起），items.fu = 已擺出來的代號清單（town_fu 照舊讀它，效果不變）。
-- 舊角色：沒有 fp 的人，town_fp 用舊的 9 格 fu 換算（格 i → x=1+(i%3)*2、y=1+i/3），home1 遷移一次性寫進 fp，不丟家具。
-- 房間大小（寬、地板列數、物品上限）：小屋 6×3／6、公寓 8×3／10、獨棟 9×4／15、豪宅 10×4／20（上限都 ≥ 舊的 4／6／8／9 格，舊家具一定放得下）。
-- 指令（town_act act='furn'）：item = put:代號:x:y（擺或移動）、clr:代號（收回背包）。

create or replace function public.town_home_w(hl int) returns int language sql immutable as $$ select (array[6,8,9,10])[least(greatest(coalesce(hl,1),1),4)] $$;
create or replace function public.town_home_h(hl int) returns int language sql immutable as $$ select (array[3,3,4,4])[least(greatest(coalesce(hl,1),1),4)] $$;
create or replace function public.town_home_cap(hl int) returns int language sql immutable as $$ select (array[6,10,15,20])[least(greatest(coalesce(hl,1),1),4)] $$;
revoke all on function public.town_home_w(int), public.town_home_h(int), public.town_home_cap(int) from public, anon, authenticated;

create or replace function public.town_fp_legacy(fu jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(jsonb_build_array(t.v, 1 + ((t.i - 1) % 3) * 2, 1 + (t.i - 1) / 3) order by t.i), '[]'::jsonb)
  from (select val #>> '{}' as v, i from jsonb_array_elements(coalesce(fu, '[]'::jsonb)) with ordinality as q(val, i)) t
  where t.v <> ''
$$;
revoke all on function public.town_fp_legacy(jsonb) from public, anon, authenticated;

create or replace function public.town_fp(r public.town_residents) returns jsonb language sql immutable as $$
  select case when r.items ? 'fp' then r.items->'fp' else public.town_fp_legacy(r.items->'fu') end
$$;
revoke all on function public.town_fp(public.town_residents) from public, anon, authenticated;

create or replace function public.town_furn(r public.town_residents, item text) returns public.town_residents
language plpgsql as $$
declare jl int; w int; h int; cap int; fp jsonb; nf jsonb; k text; x int; y int; codes jsonb;
begin
  jl := coalesce((r.items->>'hl')::int, 1); w := public.town_home_w(jl); h := public.town_home_h(jl); cap := public.town_home_cap(jl);
  fp := public.town_fp(r);
  if item ~ '^put:[a-z]+:[0-9]+:[0-9]+$' then
    k := split_part(item, ':', 2); x := split_part(item, ':', 3)::int; y := split_part(item, ':', 4)::int;
    if not (coalesce(r.items->'f', '[]'::jsonb) ? k) then raise exception '你還沒有這個家具'; end if;
    if k in ('frame', 'painting') then
      if y <> 0 then raise exception '這個要掛在牆上'; end if;
    elsif y < 1 then raise exception '這個要放在地上';
    end if;
    if x < 0 or x >= w or y > h then raise exception '超出房間了'; end if;
    nf := coalesce((select jsonb_agg(e) from jsonb_array_elements(fp) e where e->>0 <> k), '[]'::jsonb);
    if exists (select 1 from jsonb_array_elements(nf) e where (e->>1)::int = x and (e->>2)::int = y) then raise exception '那一格已經有東西了'; end if;
    if jsonb_array_length(nf) >= cap then raise exception '房子太小放不下了，升級房子吧'; end if;
    fp := nf || jsonb_build_array(jsonb_build_array(k, x, y));
  elsif item ~ '^clr:[a-z]+$' then
    k := substr(item, 5);
    fp := coalesce((select jsonb_agg(e) from jsonb_array_elements(fp) e where e->>0 <> k), '[]'::jsonb);
  else
    raise exception '家具指令不對，請重新整理頁面';
  end if;
  codes := coalesce((select jsonb_agg(e->>0) from jsonb_array_elements(fp) e), '[]'::jsonb);
  r.items := jsonb_set(jsonb_set(r.items, '{fp}', fp, true), '{fu}', codes, true);
  return r;
end $$;
revoke all on function public.town_furn(public.town_residents, text) from public, anon, authenticated;

-- 小道具（一次性購買，每種一件，超市「室內家具」區；ids 不可和 town_shop 既有的重複）
insert into public.town_shop(id, kind, slot, name, price, unlock) values
  ('frame', 'furn', null, '相框', 300, null),
  ('painting', 'furn', null, '掛畫', 900, null),
  ('desklamp', 'furn', null, '檯燈', 600, null),
  ('toy', 'furn', null, '玩具', 400, null),
  ('books', 'furn', null, '書堆', 500, null)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, price = excluded.price;

-- 一次性遷移：舊的 9 格 fu 換成座標 fp
do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'home1') then
    update public.town_residents set items = jsonb_set(items, '{fp}', public.town_fp_legacy(items->'fu'), true)
      where items ? 'fu' and not (items ? 'fp');
    insert into public.town_migrations(id) values ('home1');
  end if;
end $mig$;

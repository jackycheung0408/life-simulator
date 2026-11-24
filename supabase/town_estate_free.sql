-- 小豬鎮：莊園自由（莊主在莊園裡想幹嘛就幹嘛）。
-- 要在 town_estate_plot.sql 之後套用，可重複執行；用 pg_get_functiondef 就地改文字，已改過就跳過，找不到錨點就整檔失敗（不會半套）。
-- 內容：
--   A) 家居動作在莊園室內可用：town_inside 多認「自己的莊園室內」（place = estate:自己 且 fi = place），所以 eat／toilet／shower／tv／
--      nap／sleep／qsleep／furn 的「要進屋」檢查自動通過；價格與效果和在家一致（沒有額外限制，仍守睡覺／昏倒／入獄／錢不夠／背包／需求）。
--      睡著、醒來都留在莊園；離線太久自動回家睡仍回自己的家（town_tick 不動）。
--      莊園家具另外擺：items.lx.efp = [[代號,x,y]…]（≤30 件）、lx.efc = 代號清單；town_fu 在莊園裡看 efc（沒擺 = 陽春版，同在家）。
--      沿用家具清單（items.f），不新增購買項目。莊園室內 12 欄 × 地板 4 列（第 0 列是牆）。
--   B) 進出控管：items.lx.gate = open | lock | list，lx.wl = [居民id…]（≤20）；缺值 = 舊行為（莊主在裡面醒著才能進、派對時全員可進）。
--      open 任何人隨時可進；lock 只有莊主；list 只有白名單的人可進（莊主不必在）；派對期間（lx 的 lxc.pt）全員可進。
--      RPC town_estate_ctl(rid,pin,op,target,note)：view／gate（note = open|lock|list|default）／wl_add／wl_del（target = 居民 id）。
--   C) 室內佈局：預設物件（宴會桌 2、展示櫃 2、噴水池、鋼琴）可移動或收回：items.lx.ro = {鍵: [x,y] | null}，缺值 = 預設位置；
--      水晶吊燈、立燈、紅地毯、盆栽、管家固定。擺家具走原本的 town_act(act='furn')：put:代號:x:y／clr:代號（莊園家具），
--      mv:鍵:x:y／rm:鍵／rs:鍵（預設物件）。
-- 派對規則（$5000、全鎮 +15、每天 1 次）不動。

create or replace function public.town_estate_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;

-- 預設物件：m = 0 固定、1 可移動／收回、2 平的（地毯，不擋人也不擋家具）
create or replace function public.town_estate_def() returns jsonb language sql immutable as $$
  select '[{"k":"chand_a","c":"chand","x":2,"y":0,"m":0},{"k":"trophy1","c":"trophycase","x":4,"y":0,"m":1},{"k":"lamp_a","c":"lamp","x":6,"y":0,"m":0},
  {"k":"trophy2","c":"trophycase","x":8,"y":0,"m":1},{"k":"chand_b","c":"chand","x":10,"y":0,"m":0},{"k":"fount","c":"efount","x":5,"y":2,"m":1},
  {"k":"table1","c":"ptable","x":8,"y":2,"m":1},{"k":"table2","c":"ptable","x":3,"y":2,"m":1},{"k":"piano","c":"piano","x":10,"y":4,"m":1},
  {"k":"carpet_a","c":"ecarpet","x":6,"y":3,"m":2},{"k":"carpet_b","c":"ecarpet","x":6,"y":4,"m":2},{"k":"plant_a","c":"plant","x":0,"y":4,"m":0},{"k":"plant_b","c":"plant","x":11,"y":4,"m":0}]'::jsonb
$$;
revoke all on function public.town_estate_def() from public, anon, authenticated;

-- 預設物件現在的位置（被收回 = null）
create or replace function public.town_estate_pos(lx jsonb, d jsonb) returns int[] language sql immutable as $$
  select case when d->>'m' = '1' and coalesce(lx->'ro','{}'::jsonb) ? (d->>'k') then
      (case when jsonb_typeof(lx->'ro'->(d->>'k')) = 'array' then array[(lx->'ro'->(d->>'k')->>0)::int, (lx->'ro'->(d->>'k')->>1)::int] else null end)
    else array[(d->>'x')::int, (d->>'y')::int] end
$$;
revoke all on function public.town_estate_pos(jsonb, jsonb) from public, anon, authenticated;

-- 被佔住的格子（"x,y"）：固定物件、管家、可移動物件的現在位置、莊園家具；skipk 是正在移動的那一件（預設鍵或家具代號）
create or replace function public.town_estate_occ(lx jsonb, skipk text) returns text[] language plpgsql stable as $$
declare out text[] := array['1,2']; d jsonb; p int[]; e jsonb;
begin
  for d in select * from jsonb_array_elements(public.town_estate_def()) loop
    if d->>'m' = '2' or d->>'k' = coalesce(skipk, '') then continue; end if;
    p := public.town_estate_pos(lx, d);
    if p is not null then out := out || (p[1]::text || ',' || p[2]::text); end if;
  end loop;
  for e in select * from jsonb_array_elements(coalesce(lx->'efp', '[]'::jsonb)) loop
    if e->>0 = coalesce(skipk, '') then continue; end if;
    out := out || ((e->>1) || ',' || (e->>2));
  end loop;
  return out;
end $$;
revoke all on function public.town_estate_occ(jsonb, text) from public, anon, authenticated;

-- 莊園室內擺放：put／clr 是莊園家具，mv／rm／rs 是預設物件
create or replace function public.town_estate_furn(r public.town_residents, item text) returns public.town_residents language plpgsql as $$
declare lx jsonb; efp jsonb; nf jsonb; ro jsonb; k text; v_x int; v_y int; occ text[]; dd jsonb;
begin
  lx := coalesce(r.items->'lx', '{}'::jsonb); efp := coalesce(lx->'efp', '[]'::jsonb); ro := coalesce(lx->'ro', '{}'::jsonb);
  if item ~ '^put:[a-z]+:[0-9]+:[0-9]+$' then
    k := split_part(item, ':', 2); v_x := split_part(item, ':', 3)::int; v_y := split_part(item, ':', 4)::int;
    if not (coalesce(r.items->'f', '[]'::jsonb) ? k) then raise exception '你還沒有這個家具'; end if;
    if v_x < 0 or v_x > 11 or v_y < 0 or v_y > 4 then raise exception '超出莊園了'; end if;
    if k in ('frame', 'painting') then
      if v_y <> 0 then raise exception '這個要掛在牆上'; end if;
    elsif v_y < 1 then raise exception '這個要放在地上';
    end if;
    occ := public.town_estate_occ(lx, k);
    if occ @> array[v_x::text || ',' || v_y::text] then raise exception '那一格已經有東西了'; end if;
    nf := coalesce((select jsonb_agg(e) from jsonb_array_elements(efp) e where e->>0 <> k), '[]'::jsonb);
    if jsonb_array_length(nf) >= 30 then raise exception '莊園放不下了（最多 30 件）'; end if;
    efp := nf || jsonb_build_array(jsonb_build_array(k, v_x, v_y));
  elsif item ~ '^clr:[a-z]+$' then
    k := substr(item, 5);
    efp := coalesce((select jsonb_agg(e) from jsonb_array_elements(efp) e where e->>0 <> k), '[]'::jsonb);
  elsif item ~ '^mv:[a-z0-9_]+:[0-9]+:[0-9]+$' then
    k := split_part(item, ':', 2); v_x := split_part(item, ':', 3)::int; v_y := split_part(item, ':', 4)::int;
    select d into dd from jsonb_array_elements(public.town_estate_def()) d where d->>'k' = k and d->>'m' = '1';
    if dd is null then raise exception '這個是固定的，不能移動'; end if;
    if v_x < 0 or v_x > 11 or v_y < (case when dd->>'c' = 'trophycase' then 0 else 1 end) or v_y > 4 then raise exception '超出莊園了'; end if;
    occ := public.town_estate_occ(lx, k);
    if occ @> array[v_x::text || ',' || v_y::text] then raise exception '那一格已經有東西了'; end if;
    ro := ro || jsonb_build_object(k, jsonb_build_array(v_x, v_y));
  elsif item ~ '^rm:[a-z0-9_]+$' then
    k := substr(item, 4);
    if not exists (select 1 from jsonb_array_elements(public.town_estate_def()) d where d->>'k' = k and d->>'m' = '1') then raise exception '這個是固定的，不能收回'; end if;
    ro := ro || jsonb_build_object(k, 'null'::jsonb);
  elsif item ~ '^rs:[a-z0-9_]+$' then
    k := substr(item, 4);
    select d into dd from jsonb_array_elements(public.town_estate_def()) d where d->>'k' = k and d->>'m' = '1';
    if dd is null then raise exception '這個是固定的'; end if;
    occ := public.town_estate_occ(lx - 'ro' || jsonb_build_object('ro', ro - k), k);
    if occ @> array[(dd->>'x') || ',' || (dd->>'y')] then raise exception '原本的位置被占住了，先移走那裡的東西'; end if;
    ro := ro - k;
  else
    raise exception '家具指令不對，請重新整理頁面';
  end if;
  lx := lx || jsonb_build_object('efp', efp, 'efc', coalesce((select jsonb_agg(e->>0) from jsonb_array_elements(efp) e), '[]'::jsonb), 'ro', ro);
  r.items := jsonb_set(r.items, '{lx}', lx, true);
  return r;
end $$;
revoke all on function public.town_estate_furn(public.town_residents, text) from public, anon, authenticated;

-- A) 就地補丁
select public.town_estate_patch('town_inside', 1,
  'select r.place = ''home:'' || r.id and coalesce(r.items->>''dr'','''') <> ''1''',
  'select (r.place = ''home:'' || r.id and coalesce(r.items->>''dr'','''') <> ''1'') or (r.place = ''estate:'' || r.id and coalesce(r.items->>''fi'','''') = r.place)', 'estate:');
select public.town_estate_patch('town_fu', 2,
  'coalesce(r.items->''fu'',''[]''::jsonb) ? k',
  'coalesce(case when r.place = ''estate:'' || r.id then r.items->''lx''->''efc'' else r.items->''fu'' end,''[]''::jsonb) ? k', 'efc');
select public.town_estate_patch('town_furn', 2,
  'jl := coalesce((r.items->>''hl'')::int, 1);',
  'if r.place = ''estate:'' || r.id then return public.town_estate_furn(r, item); end if;
  jl := coalesce((r.items->>''hl'')::int, 1);', 'town_estate_furn');

-- B) 進出控管：插在 town_estate_gate 的「派對」判斷之後、「莊主在裡面」判斷之前
select public.town_estate_patch('town_estate_gate', 2,
  'if o.items->>''fi'' = pl and o.place = pl and not o.sleeping then return; end if;',
  'if coalesce(o.items->''lx''->>''gate'', '''') = ''open'' then return; end if;
  if coalesce(o.items->''lx''->>''gate'', '''') = ''lock'' then raise exception ''% 把莊園上鎖了，只有莊主能進去'', o.name; end if;
  if coalesce(o.items->''lx''->>''gate'', '''') = ''list'' then
    if coalesce(o.items->''lx''->''wl'', ''[]''::jsonb) @> to_jsonb(r.id) then return; end if;
    raise exception ''% 的莊園只開放給受邀的朋友'', o.name;
  end if;
  if o.items->>''fi'' = pl and o.place = pl and not o.sleeping then return; end if;', 'gate');
drop function public.town_estate_patch(text, int, text, text, text);

-- 莊主管理：view／gate（note = open|lock|list|default）／wl_add／wl_del（target = 居民 id）
create or replace function public.town_estate_ctl(rid bigint, pin text, op text, target bigint default null, note text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; lx jsonb; wl jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  lx := coalesce(r.items->'lx', '{}'::jsonb);
  if coalesce(lx->>'estate', '') = '' then raise exception '你還沒有莊園'; end if;
  wl := coalesce(lx->'wl', '[]'::jsonb);
  if op = 'gate' then
    if note is null or note not in ('open', 'lock', 'list', 'default') then raise exception '沒有這種進出模式'; end if;
    if note = 'default' then lx := lx - 'gate'; else lx := lx || jsonb_build_object('gate', note); end if;
  elsif op = 'wl_add' then
    if target is null or target = rid then raise exception '要選一位朋友'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id;
    if not found then raise exception '找不到這位鄰居'; end if;
    if wl @> to_jsonb(target) then raise exception '已經在名單上了'; end if;
    if jsonb_array_length(wl) >= 20 then raise exception '名單最多 20 人'; end if;
    wl := wl || to_jsonb(target); lx := lx || jsonb_build_object('wl', wl);
  elsif op = 'wl_del' then
    wl := coalesce((select jsonb_agg(e) from jsonb_array_elements(wl) e where e <> to_jsonb(target)), '[]'::jsonb);
    lx := lx || jsonb_build_object('wl', wl);
  elsif op <> 'view' then raise exception '不支援的操作';
  end if;
  if op <> 'view' then r.items := jsonb_set(r.items, '{lx}', lx, true); perform public.town_save_r(r); end if;
  return json_build_object('ok', true, 'gate', coalesce(lx->>'gate', 'default'),
    'wl', coalesce((select json_agg(json_build_object('id', p.id, 'name', p.name) order by p.id) from public.town_residents p where wl @> to_jsonb(p.id) and p.town_id = r.town_id), '[]'::json));
end $$;
revoke all on function public.town_estate_ctl(bigint, text, text, bigint, text) from public;
grant execute on function public.town_estate_ctl(bigint, text, text, bigint, text) to anon, authenticated;

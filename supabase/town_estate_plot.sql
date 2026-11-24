-- 小豬鎮：莊園改成獨立一棟（莊園區），原本的家不動。
-- 要在 town_econ_sink.sql、town_econ_use2.sql、town_shops1.sql、town_shops2.sql 之後套用，可重複執行；
-- 用 pg_get_functiondef 就地改文字，已改過就跳過，找不到錨點就整檔失敗（不會半套）。
-- 內容：
--   1) 地塊序號 items.lx.ep（從 0 起、同鎮不重複）；lx.estate 仍是購買日期字串（舊資料與 view 不受影響）。
--      town_estate_assign(tid, rid)：買莊園時由 town_econ_use 呼叫（鎖鎮列）。
--   2) 一次性遷移 estate_plot：已有莊園、沒有 ep 的居民，依（購買日期、id）排序配序號。不動錢、不退款。
--   3) 地點 estate:<居民id>：town_act move 白名單（對象要是同鎮、有莊園的居民）、py 上限 40 → 120（莊園帶在地圖最下方）、
--      town_place_name 回「X 的莊園」、town_fi 白名單接受 estate:%，進入規則 town_estate_gate：
--      莊主自己隨時可進；別人要「莊主在裡面（fi 等於這個地點、醒著）」或「派對進行中（lxc.pt 還沒到期）」。
--   4) 派對 town_econ_fun party 改在自己莊園室內（place = estate:自己 且 town_fin），派對開始 30 分鐘內朋友都能進（lxc.pt）；
--      其他效果與價格不變（$5000、全鎮上線醒著 +15 心情／+2 好感、每天 1 次）。
-- 莊園帶座標由前端依序號算（town.js 的 estPos），伺服器不存座標；位置只檢查 px／py 範圍。

create or replace function public.town_estate_assign(tid text, rid bigint) returns void language plpgsql as $$
declare nx int;
begin
  perform 1 from public.town_towns where id = tid for update;
  if exists (select 1 from public.town_residents p where p.id = rid and (p.items->'lx'->>'ep') is not null) then return; end if;
  select coalesce(max((p.items->'lx'->>'ep')::int), -1) + 1 into nx from public.town_residents p where p.town_id = tid and (p.items->'lx'->>'ep') is not null;
  update public.town_residents p set items = jsonb_set(p.items, '{lx}', coalesce(p.items->'lx', '{}'::jsonb) || jsonb_build_object('ep', nx)) where p.id = rid;
end $$;
revoke all on function public.town_estate_assign(text, bigint) from public, anon, authenticated;

-- 進入莊園的規則（莊主隨時；別人要莊主在裡面醒著，或派對進行中）
create or replace function public.town_estate_gate(r public.town_residents, pl text) returns void language plpgsql stable as $$
declare oid bigint; o public.town_residents;
begin
  if pl is null or pl not like 'estate:%' then return; end if;
  if pl !~ '^estate:\d+$' then raise exception '這裡還不能進去'; end if;
  oid := substr(pl, 8)::bigint;
  select * into o from public.town_residents where id = oid and town_id = r.town_id;
  if not found or coalesce(o.items->'lx'->>'estate', '') = '' then raise exception '這裡還不能進去'; end if;
  if oid = r.id then return; end if;
  if coalesce((o.items->'lxc'->>'pt')::bigint, 0) > extract(epoch from now())::bigint then return; end if;
  if o.items->>'fi' = pl and o.place = pl and not o.sleeping then return; end if;
  raise exception '% 不在莊園裡，只能在門口等', o.name;
end $$;
revoke all on function public.town_estate_gate(public.town_residents, text) from public, anon, authenticated;

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

-- 買莊園：配地塊序號
select public.town_estate_patch('town_econ_use', 5, '''econ_lux'', fundp);', '''econ_lux'', fundp); if item = ''estate'' then perform public.town_estate_assign(tid, rid); end if;', 'town_estate_assign');
-- 派對：改在自己的莊園室內，並開放 30 分鐘
select public.town_estate_patch('town_econ_fun', 3, 'if r.place <> ''home:'' || rid then raise exception ''要在自己的莊園（家）才能辦派對''; end if;', 'if r.place <> ''estate:'' || rid or not public.town_fin(r) then raise exception ''要先走進自己的莊園才能辦派對''; end if;', 'estate:');
select public.town_estate_patch('town_econ_fun', 3, 'jsonb_build_object(''p'', today)', 'jsonb_build_object(''p'', today, ''pt'', extract(epoch from now())::bigint + 1800)', '''pt''');
-- 進館：estate:<id> 走獨立分支（每個 patch 本身都要括號平衡，因為每次 execute 就會編譯）
select public.town_estate_patch('town_fi', 4, 'if op = ''enter'' then',
  'if op = ''enter'' and pl like ''estate:%'' then
    if r.place <> pl then raise exception ''要先走到門口''; end if;
    if r.sleeping then raise exception ''你在睡覺，先起床''; end if;
    if public.town_jailed(r) then raise exception ''你被關在監獄裡''; end if;
    perform public.town_estate_gate(r, pl);
    r.items := jsonb_set(r.items, ''{fi}'', to_jsonb(pl));
  elsif op = ''enter'' then', 'town_estate_gate');
-- 移動：白名單與 py 上限
select public.town_estate_patch('town_act', 9, 'or (dest ~ ''^home:\d+$''', 'or (dest ~ ''^estate:\d+$'' and exists (select 1 from public.town_residents where id = substr(dest,8)::bigint and town_id = r.town_id and (items->''lx''->>''estate'') is not null)) or (dest ~ ''^home:\d+$''', '^estate:');
select public.town_estate_patch('town_act', 9, 'py > 40', 'py > 120', 'py > 120');
select public.town_estate_patch('town_place_name', 1, 'when p = ''plaza'' then', 'when p like ''estate:%'' then coalesce((select name from public.town_residents where id = substr(p,8)::bigint), ''空地'') || '' 的莊園'' when p = ''plaza'' then', 'estate:');
drop function public.town_estate_patch(text, int, text, text, text);

-- 一次性遷移：已有莊園、沒有 ep 的居民，依（購買日期、id）配序號（不動錢）
do $mig$
declare g record; nx int;
begin
  if not exists (select 1 from public.town_migrations where id = 'estate_plot') then
    for g in select p.id, p.town_id from public.town_residents p
      where (p.items->'lx'->>'estate') is not null and (p.items->'lx'->>'ep') is null
      order by p.town_id, p.items->'lx'->>'estate', p.id loop
      perform public.town_estate_assign(g.town_id, g.id);
    end loop;
    insert into public.town_migrations(id) values ('estate_plot');
  end if;
end $mig$;

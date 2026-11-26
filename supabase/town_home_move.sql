-- 小豬鎮：搬自己的家（2026-11-26）。要在 town.sql、town_catalog1.sql（town_tick）、town_move.sql 之後套用，可重複執行。
-- 規則：
--   * 搬的是「自己的家」，新位置只能是鎮上現有 12 個住宅位置（site 0～11，和 town_door(slot) 同一套座標）裡沒人住、也沒人預約的空位，
--     而且那條街要已經開出來（site / 3 < town_towns.rows）。可以搬回自己原本的位置。
--   * 申請人要在不動產公司裡面（realty，已進館）；鎮長功能開關 relocate 同樣能關。
--   * 一般居民：費用 = 房子面積 5×4 × $2000 = $40,000，從自己現金付、直接銷毀；每人 24 小時只能申請一次、同時只能有一個預告；
--     預告 24 小時，時間到就搬（惰性結算：town_state／town_hmove 呼叫時補算，冪等）。
--   * 鎮長（使用者決定）：只能搬自己的家，免費、立刻搬、不受 24 小時限制；若自己正有預告，取消並退費。不能搬別人的家。
--   * 完成時：在這棟房子門口或屋裡的人（place = home:<主人>）移到新門口（主人站門口、別人門口旁），站在新房子範圍上的路人也移到新門口旁；
--     室內家具（items.fp／fu）、莊園（items.lx）、背包完全不動。其他地點的人不受影響。
--   * 資料：town_towns.layout.h = {"居民id": site}（缺值 = 原本 slot 的位置）、hmv = 預告中 {"居民id":{to,at,cost}}、hlast = {"居民id": 上次申請的 epoch 秒}。
--     用居民 id 當鍵（不是 slot），所以居民離開後 slot 讓給新人不會繼承舊位置。town_state 回傳 layout、hmv。
--   * 新居民加入（town_join）要挑「slot 沒人、位置也沒人占」的；town_tick 的「待機回家睡」讀新位置。
--   * 舊客戶端相容：申請要帶 cv，低於 town_hmv_minver() 擋。
-- 重套 town.sql／town_catalog1.sql／town_move.sql 後要再套一次本檔。

alter table public.town_towns add column if not exists hmv jsonb;
alter table public.town_towns add column if not exists hlast jsonb;

create or replace function public.town_hmv_minver() returns int language sql immutable as $$ select 418 $$;
revoke all on function public.town_hmv_minver() from public, anon, authenticated;

create or replace function public.town_hmv_cost() returns bigint language sql immutable as $$ select 5::bigint * 4 * 2000 $$;
revoke all on function public.town_hmv_cost() from public, anon, authenticated;

-- 居民目前住的位置（site）：layout.h 有就用，沒有就是原本的 slot
create or replace function public.town_hsite(lay jsonb, rid bigint, slot int) returns int language sql immutable as $$
  select coalesce((lay->'h'->>(rid::text))::int, slot)
$$;
revoke all on function public.town_hsite(jsonb,bigint,int) from public, anon, authenticated;

-- 某居民現在的門口座標（town_tick 待機回家用）
create or replace function public.town_hdoor(tid text, rid bigint, slot int) returns table(dx real, dy real) language plpgsql stable security definer set search_path = public as $$
declare v_lay jsonb;
begin
  select layout into v_lay from public.town_towns where id = tid;
  return query select d.dx, d.dy from public.town_door(public.town_hsite(v_lay, rid, slot)) d;
end $$;
revoke all on function public.town_hdoor(text,bigint,int) from public, anon, authenticated;

-- 這個位置有人住，或被別人的預告預約了？（except_rid：不算這個人自己）
create or replace function public.town_site_busy(tid text, site int, except_rid bigint default null) returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_lay jsonb; v_hmv jsonb;
begin
  select layout, hmv into v_lay, v_hmv from public.town_towns where id = tid;
  if exists (select 1 from public.town_residents r where r.town_id = tid and r.id is distinct from except_rid and public.town_hsite(v_lay, r.id, r.slot) = site) then return true; end if;
  if v_hmv is not null and exists (select 1 from jsonb_each(v_hmv) e where e.key <> coalesce(except_rid::text, '') and (e.value->>'to')::int = site) then return true; end if;
  return false;
end $$;
revoke all on function public.town_site_busy(text,int,bigint) from public, anon, authenticated;

-- 執行搬家：改 layout.h、把人移到新門口、寫事件（惰性結算與鎮長立刻搬共用）
create or replace function public.town_hmv_do(tid text, hrid bigint, site int) returns void language plpgsql security definer set search_path = public as $$
declare t public.town_towns; r public.town_residents; v_old int; v_nd record; v_hx real; v_hy real;
begin
  select * into t from public.town_towns where id = tid for update;
  select * into r from public.town_residents where id = hrid and town_id = tid;
  if not found then return; end if;
  v_old := public.town_hsite(t.layout, r.id, r.slot);
  if site = v_old then return; end if;
  if public.town_site_busy(tid, site, hrid) then return; end if;
  select * into v_nd from public.town_door(site);
  v_hx := v_nd.dx - 2; v_hy := v_nd.dy - 4;
  update public.town_towns set layout = case when site = r.slot
      then coalesce(layout, '{}'::jsonb) #- array['h', hrid::text]
      else jsonb_set(coalesce(layout, '{}'::jsonb), '{h}', coalesce(layout->'h', '{}'::jsonb) || jsonb_build_object(hrid::text, site)) end
    where id = tid;
  perform 1 from public.town_residents where town_id = tid and (place = 'home:' || hrid or place = 'street') for update;
  update public.town_residents set x = v_nd.dx + (case when id = hrid then 0 else 1 end), y = v_nd.dy
    where town_id = tid and (place = 'home:' || hrid or (place = 'street' and x >= v_hx and x < v_hx + 5 and y >= v_hy and y < v_hy + 4));
  insert into public.town_events(town_id, actor, kind, msg) values (tid, hrid, 'relocate',
    left(r.name || ' 把家搬到了' || public.town_street(site / 3) || ' ' || (site % 3 + 1) || ' 號', 120));
end $$;
revoke all on function public.town_hmv_do(text,bigint,int) from public, anon, authenticated;

-- 惰性結算：時間到的預告一律執行（冪等：預告清掉後不會再跑）
create or replace function public.town_hmv_settle(tid text) returns void language plpgsql security definer set search_path = public as $$
declare t public.town_towns; v_now bigint := floor(extract(epoch from now()))::bigint; e record;
begin
  select * into t from public.town_towns where id = tid;
  if not found or t.hmv is null then return; end if;
  if not exists (select 1 from jsonb_each(t.hmv) x where (x.value->>'at')::bigint <= v_now) then return; end if;
  select * into t from public.town_towns where id = tid for update;
  if t.hmv is null then return; end if;
  for e in select key, value from jsonb_each(t.hmv) loop
    if (e.value->>'at')::bigint <= v_now then
      update public.town_towns set hmv = nullif(hmv - e.key, '{}'::jsonb) where id = tid;
      perform public.town_hmv_do(tid, e.key::bigint, (e.value->>'to')::int);
    end if;
  end loop;
end $$;
revoke all on function public.town_hmv_settle(text) from public, anon, authenticated;

-- 申請與查看：op = view／apply；nsite = 新位置（0～11）；cv = 前端版本
create or replace function public.town_hmove(rid bigint, pin text, op text, nsite int default null, cv int default 0) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_towns; v_cur int; v_cost bigint := public.town_hmv_cost(); v_at bigint; v_now bigint := floor(extract(epoch from now()))::bigint; v_last bigint; v_free int[];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  perform public.town_hmv_settle(r.town_id);
  select * into t from public.town_towns where id = r.town_id;
  v_cur := public.town_hsite(t.layout, r.id, r.slot);
  v_last := (t.hlast->>(r.id::text))::bigint;
  if op = 'view' then
    select coalesce(array_agg(g order by g), '{}') into v_free from generate_series(0, least(t.rows * 3, 12) - 1) g
      where g <> v_cur and not public.town_site_busy(r.town_id, g, r.id);
    return json_build_object('cur', v_cur, 'slot', r.slot, 'free', v_free, 'hmv', t.hmv->(r.id::text), 'last', v_last, 'mayor', r.mayor, 'money', r.money,
      'cost', v_cost, 'minv', public.town_hmv_minver(), 'rows', t.rows, 'now', v_now);
  end if;
  if op <> 'apply' then raise exception '不認得的操作'; end if;
  if public.town_is_off(r.town_id, 'relocate') then raise exception '這個小鎮關閉了搬遷'; end if;
  if coalesce(cv, 0) < public.town_hmv_minver() then raise exception '請先更新遊戲版本，再申請搬家'; end if;
  if public.town_jailed(r) then raise exception '入獄中不能辦這件事'; end if;
  if r.place is distinct from 'realty' or not public.town_fin(r) then raise exception '要先到不動產公司裡面才能申請'; end if;
  if nsite is null or nsite < 0 or nsite > 11 or nsite / 3 >= t.rows then raise exception '那個位置還沒開放'; end if;
  if nsite = v_cur then raise exception '你已經住在那裡了'; end if;
  if public.town_site_busy(r.town_id, nsite, r.id) then raise exception '那個位置已經有人住（或有人預約）了'; end if;
  if r.mayor then
    -- 鎮長：搬自己的家，免費、立刻搬；自己正有預告就取消並退費
    if t.hmv ? (r.id::text) then
      update public.town_residents set money = money + coalesce((t.hmv->(r.id::text)->>'cost')::bigint, 0) where id = r.id;
      update public.town_towns set hmv = nullif(hmv - (r.id::text), '{}'::jsonb) where id = r.town_id;
    end if;
    perform public.town_hmv_do(r.town_id, r.id, nsite);
    return json_build_object('ok', true, 'now', true, 'cost', 0);
  end if;
  if t.hmv ? (r.id::text) then raise exception '你已經有一個預告中的搬家'; end if;
  if v_last is not null and v_last > v_now - 86400 then raise exception '24 小時內只能申請一次搬家'; end if;
  if r.money < v_cost then raise exception '你的錢不夠（要 €%，現在 €%）', v_cost, r.money; end if;
  v_at := v_now + 86400;
  update public.town_residents set money = money - v_cost where id = r.id;
  update public.town_towns set hlast = coalesce(hlast, '{}'::jsonb) || jsonb_build_object(r.id::text, v_now),
    hmv = coalesce(hmv, '{}'::jsonb) || jsonb_build_object(r.id::text, jsonb_build_object('to', nsite, 'at', v_at, 'cost', v_cost))
    where id = r.town_id;
  insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, r.id, 'relocate',
    left(r.name || ' 申請搬家到' || public.town_street(nsite / 3) || ' ' || (nsite % 3 + 1) || ' 號，24 小時後完成（自費 €' || v_cost || '）', 120));
  return json_build_object('ok', true, 'cost', v_cost, 'at', v_at);
end $$;
revoke all on function public.town_hmove(bigint,text,text,int,int) from public;
grant execute on function public.town_hmove(bigint,text,text,int,int) to anon, authenticated;

-- 就地補丁：town_state 結算並回傳 hmv；town_tick 待機回家讀新位置；town_join 挑位置沒人占的 slot
create or replace function public.town_hm_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;

select public.town_hm_patch('town_state', 1, $q$perform public.town_mv_settle(t.id);$q$, $q$perform public.town_mv_settle(t.id); perform public.town_hmv_settle(t.id);$q$, 'town_hmv_settle');
select public.town_hm_patch('town_state', 1, $q$'mv',t.mv)$q$, $q$'mv',t.mv,'hmv',t.hmv)$q$, $q$'hmv',t.hmv$q$);
select public.town_hm_patch('town_tick', 1, $q$select * into d from public.town_door(r.slot);$q$, $q$select * into d from public.town_hdoor(r.town_id, r.id, r.slot);$q$, 'town_hdoor');
select public.town_hm_patch('town_join', 6, $q$slot = want_slot) then s := want_slot;$q$, $q$slot = want_slot) and not public.town_site_busy(t.id, want_slot) then s := want_slot;$q$, 'town_site_busy(t.id, want_slot)');
select public.town_hm_patch('town_join', 6, $q$slot = g); end if;$q$, $q$slot = g) and not public.town_site_busy(t.id, g); if s is null then raise exception '小鎮暫時沒有空的住宅位置，請鎮長協調'; end if; end if;$q$, 'town_site_busy(t.id, g)');
drop function public.town_hm_patch(text, int, text, text, text);

do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'homemove1') then
    insert into public.town_migrations(id) values ('homemove1');
  end if;
end $mig$;

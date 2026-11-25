-- 小豬鎮：設施搬遷（最小可行版，階段 2）。要在 town.sql、town_mischief.sql、town_fi.sql、town_shops1.sql、town_expand.sql 之後套用，可重複執行。
-- 規則：只有 5 棟商業建築可搬（咖啡廳、餐廳、電影院、健身房、格鬥場），房子／莊園／市政廳／醫院／警察局／監獄／碼頭／公園／廣場都不能搬。
--   * 申請人＝任何居民（2026-11-25 起），人要在不動產公司裡面（realty，已進館）；鎮長功能開關 relocate 可關。
--   * 候選位置是寫死的清單（town_mv_slot_ok）：原位，或東區 x=88 的 y=0／9／17（格鬥場 y=0／8）。前端 MOVE_SLOTS 要一致，town/test.js 會檢查。
--   * 一般居民：費用 = 建築面積（寬×高）× $2000，從自己的現金付、直接銷毀（不進基金）；錢不夠就擋。鎮長：免費、立刻搬（不預告、不受 24 小時限制），
--     若同一棟正有預告，預告取消並把費用退給申請人；鎮長立刻搬的目標位置不能和別棟的預告位置重疊。
--   * 一般居民：全鎮 24 小時只能搬一棟（從申請算起）、一次只能有一個預告；預告期 24 小時，設施照常營業，時間到就搬（惰性結算：town_state／town_move 呼叫時補算，冪等）。
--   * 完成時：站在該設施（place＝該設施，含室內）的人、站在舊建築或新建築範圍上的路人，一起移到新門口；室內 items.fi 不動；其他地點的人不受影響。
--   * 資料：town_towns.layout（jsonb，缺值＝預設座標）、mv（預告中的搬遷）、mvlast（上次申請時間）。town_state 回傳 layout、mv。
--   * 舊客戶端相容：申請搬遷要帶 cv（前端版本），低於 town_mv_minver() 擋；沒更新的人看不到搬遷（town_state 多的欄位會被忽略）。
--   * 格鬥場 PK 把人放到門口的座標改讀 layout（就地補丁 town_pk）。
-- 重套 town.sql／town_mischief.sql 後要再套一次本檔。

alter table public.town_towns add column if not exists layout jsonb;
alter table public.town_towns add column if not exists mv jsonb;
alter table public.town_towns add column if not exists mvlast timestamptz;

-- 預設矩形：{x, y, w, h, 門的 x 位移}（門在建築正下方一格：y + h）
create or replace function public.town_mv_def(k text) returns int[] language sql immutable as $$
  select case k when 'cafe' then array[36,0,6,5,2] when 'restaurant' then array[2,9,6,5,3] when 'cinema' then array[36,9,8,5,4]
    when 'gym' then array[38,17,6,4,2] when 'arena' then array[50,0,7,6,3] else null end
$$;
revoke all on function public.town_mv_def(text) from public, anon, authenticated;

create or replace function public.town_mv_minver() returns int language sql immutable as $$ select 383 $$;
revoke all on function public.town_mv_minver() from public, anon, authenticated;

-- 候選位置：原位，或東區 x=88 的 y=0／9／17（格鬥場高 6，y=0／8）
create or replace function public.town_mv_slot_ok(k text, nx int, ny int) returns boolean language sql immutable as $$
  select public.town_mv_def(k) is not null and (
    (nx = 88 and (case when k = 'arena' then ny in (0, 8) else ny in (0, 9, 17) end))
    or (nx = (public.town_mv_def(k))[1] and ny = (public.town_mv_def(k))[2]))
$$;
revoke all on function public.town_mv_slot_ok(text,int,int) from public, anon, authenticated;

create or replace function public.town_mv_rect(lay jsonb, k text) returns int[] language plpgsql immutable as $$
declare d int[] := public.town_mv_def(k);
begin
  if d is null then return null; end if;
  if lay is not null and jsonb_exists(lay, k) then d[1] := (lay->k->>0)::int; d[2] := (lay->k->>1)::int; end if;
  return d;
end $$;
revoke all on function public.town_mv_rect(jsonb,text) from public, anon, authenticated;

-- 某鎮某棟建築現在的門口座標 {x,y}
create or replace function public.town_mv_door(tid text, k text) returns int[] language plpgsql stable security definer set search_path = public as $$
declare v_lay jsonb; v_r int[];
begin
  select layout into v_lay from public.town_towns where id = tid;
  v_r := public.town_mv_rect(v_lay, k);
  if v_r is null then return null; end if;
  return array[v_r[1] + v_r[5], v_r[2] + v_r[4]];
end $$;
revoke all on function public.town_mv_door(text,text) from public, anon, authenticated;

-- 執行搬遷（立刻改 layout、把人移到新門口、寫事件）；惰性結算與鎮長立刻搬共用
create or replace function public.town_mv_do(tid text, k text, nx int, ny int, actor bigint default null, who text default null) returns void language plpgsql security definer set search_path = public as $$
declare t public.town_towns; v_old int[]; v_new int[]; v_nd int[];
begin
  select * into t from public.town_towns where id = tid for update;
  v_old := public.town_mv_rect(t.layout, k);
  v_new := array[nx, ny, v_old[3], v_old[4], v_old[5]];
  update public.town_towns set layout = coalesce(layout, '{}'::jsonb) || jsonb_build_object(k, jsonb_build_array(v_new[1], v_new[2])) where id = tid;
  v_nd := array[v_new[1] + v_new[5], v_new[2] + v_new[4]];
  perform 1 from public.town_residents where town_id = tid and (place = k or place = 'street') for update;
  update public.town_residents set x = v_nd[1], y = v_nd[2]
    where town_id = tid and (place = k or (place = 'street' and (
      (x >= v_old[1] and x < v_old[1] + v_old[3] and y >= v_old[2] and y < v_old[2] + v_old[4]) or
      (x >= v_new[1] and x < v_new[1] + v_new[3] and y >= v_new[2] and y < v_new[2] + v_new[4]))));
  insert into public.town_events(town_id, actor, kind, msg) values (tid, actor, 'relocate',
    left(coalesce(who || ' 把', '') || public.town_place_name(k) || (case when who is null then ' 搬到新位置了' else '搬到新位置了' end), 120));
end $$;
revoke all on function public.town_mv_do(text,text,int,int,bigint,text) from public, anon, authenticated;

-- 惰性結算：預告時間到就搬（冪等：mv 清掉後不會再跑）
create or replace function public.town_mv_settle(tid text) returns void language plpgsql security definer set search_path = public as $$
declare t public.town_towns; v_now bigint := floor(extract(epoch from now()))::bigint;
begin
  select * into t from public.town_towns where id = tid;
  if not found or t.mv is null then return; end if;
  if (t.mv->>'at')::bigint > v_now then return; end if;
  select * into t from public.town_towns where id = tid for update;
  if t.mv is null or (t.mv->>'at')::bigint > v_now then return; end if;
  update public.town_towns set mv = null where id = tid;
  perform public.town_mv_do(tid, t.mv->>'k', (t.mv->'to'->>0)::int, (t.mv->'to'->>1)::int);
end $$;
revoke all on function public.town_mv_settle(text) from public, anon, authenticated;

-- 申請與查看：op = view（所有居民）／apply（任何居民；鎮長免費立刻搬）；kk = 地點代號，nx／ny = 新位置左上角，cv = 前端版本
create or replace function public.town_move(rid bigint, pin text, op text, kk text default null, nx int default null, ny int default null, cv int default 0) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_towns; v_d int[]; v_cur int[]; v_o int[]; o text; v_cost bigint; v_at bigint;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  perform public.town_mv_settle(r.town_id);
  select * into t from public.town_towns where id = r.town_id;
  if op = 'view' then
    return json_build_object('layout', coalesce(t.layout, '{}'::jsonb), 'mv', t.mv, 'last', t.mvlast, 'fund', coalesce(t.fund, 0), 'mayor', r.mayor, 'money', r.money, 'minv', public.town_mv_minver(), 'now', now());
  end if;
  if op <> 'apply' then raise exception '不認得的操作'; end if;
  if public.town_is_off(r.town_id, 'relocate') then raise exception '這個小鎮關閉了設施搬遷'; end if;
  if coalesce(cv, 0) < public.town_mv_minver() then raise exception '請先更新遊戲版本，再申請搬遷'; end if;
  if public.town_jailed(r) then raise exception '入獄中不能辦這件事'; end if;
  if r.place is distinct from 'realty' or not public.town_fin(r) then raise exception '要先到不動產公司裡面才能申請'; end if;
  v_d := public.town_mv_def(kk);
  if v_d is null then raise exception '這棟建築不能搬'; end if;
  if not r.mayor then
    if t.mv is not null then raise exception '已經有一棟在預告搬遷'; end if;
    if t.mvlast is not null and t.mvlast > now() - interval '24 hours' then raise exception '全鎮 24 小時內只能申請一棟'; end if;
  end if;
  if nx is null or ny is null or not public.town_mv_slot_ok(kk, nx, ny) then raise exception '那個位置不能搬'; end if;
  v_cur := public.town_mv_rect(t.layout, kk);
  if nx = v_cur[1] and ny = v_cur[2] then raise exception '已經在那個位置了'; end if;
  foreach o in array array['cafe','restaurant','cinema','gym','arena'] loop
    if o <> kk then
      v_o := public.town_mv_rect(t.layout, o);
      if r.mayor and t.mv is not null and t.mv->>'k' = o then
        v_o[1] := (t.mv->'to'->>0)::int; v_o[2] := (t.mv->'to'->>1)::int;
        if greatest(v_o[1] - (nx + v_d[3]), nx - (v_o[1] + v_o[3]), v_o[2] - (ny + v_d[4]), ny - (v_o[2] + v_o[4])) < 2 then
          raise exception '那裡是%預告要搬去的位置', public.town_place_name(o);
        end if;
        v_o := public.town_mv_rect(t.layout, o);
      end if;
      if greatest(v_o[1] - (nx + v_d[3]), nx - (v_o[1] + v_o[3]), v_o[2] - (ny + v_d[4]), ny - (v_o[2] + v_o[4])) < 2 then
        raise exception '那裡離%太近（建築要隔 2 格）', public.town_place_name(o);
      end if;
    end if;
  end loop;
  if r.mayor then
    -- 鎮長：免費、立刻搬；同一棟正有預告就取消並退費給申請人
    if t.mv is not null and t.mv->>'k' = kk then
      if (t.mv->>'rid') is not null and (t.mv->>'cost') is not null then
        update public.town_residents set money = money + (t.mv->>'cost')::bigint where id = (t.mv->>'rid')::bigint;
      end if;
      update public.town_towns set mv = null where id = r.town_id;
    end if;
    perform public.town_mv_do(r.town_id, kk, nx, ny, r.id, r.name);
    return json_build_object('ok', true, 'now', true, 'cost', 0);
  end if;
  v_cost := v_d[3]::bigint * v_d[4] * 2000;
  if r.money < v_cost then raise exception '你的錢不夠（要 €%，現在 €%）', v_cost, r.money; end if;
  v_at := floor(extract(epoch from now()))::bigint + 86400;
  update public.town_residents set money = money - v_cost where id = r.id;
  update public.town_towns set mvlast = now(),
    mv = jsonb_build_object('k', kk, 'to', jsonb_build_array(nx, ny), 'at', v_at, 'cost', v_cost, 'by', r.name, 'rid', r.id)
    where id = r.town_id;
  insert into public.town_events(town_id, actor, kind, msg) values (r.town_id, r.id, 'relocate',
    left(r.name || ' 申請把' || public.town_place_name(kk) || '搬到新位置，24 小時後完成（自費 €' || v_cost || '）', 120));
  return json_build_object('ok', true, 'cost', v_cost, 'at', v_at);
end $$;
revoke all on function public.town_move(bigint,text,text,text,int,int,int) from public;
grant execute on function public.town_move(bigint,text,text,text,int,int,int) to anon, authenticated;

-- 就地補丁：town_state 先結算再回傳 layout／mv；town_features 白名單加 relocate；town_pk 的格鬥場門口讀 layout
create or replace function public.town_mv_patch(fn text, nargs int, old text, new text, chk text) returns void language plpgsql as $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn and p.pronargs = nargs limit 1;
  if def is null then raise exception '找不到函式 %', fn; end if;
  if position(chk in def) > 0 then return; end if;
  if position(old in def) = 0 then raise exception '% 找不到要改的文字：%，請人工處理', fn, old; end if;
  execute replace(def, old, new);
end $$;

select public.town_mv_patch('town_state', 1, E'delete from public.town_poops where town_id = t.id and at < now() - interval ''2 hours'';',
  E'perform public.town_mv_settle(t.id); select * into t from public.town_towns where id = t.id;\n  delete from public.town_poops where town_id = t.id and at < now() - interval ''2 hours'';', 'town_mv_settle');
select public.town_mv_patch('town_state', 1, '''cur'',t.currency)', '''cur'',t.currency,''layout'',t.layout,''mv'',t.mv)', '''layout'',t.layout');
select public.town_mv_patch('town_features', 3, '''zombie''', '''zombie'',''relocate''', 'relocate');
select public.town_mv_patch('town_pk', 5, 'a.x := 53; a.y := 6; bb.place := ''arena''; bb.x := 54; bb.y := 6;',
  'a.x := (public.town_mv_door(r.town_id, ''arena''))[1]; a.y := (public.town_mv_door(r.town_id, ''arena''))[2]; bb.place := ''arena''; bb.x := a.x + 1; bb.y := a.y;', 'town_mv_door');
select public.town_mv_patch('town_pk', 5, 'set place = ''arena'', x = 53, y = 6 where id in (a.id, bb.id);',
  'set place = ''arena'', x = (public.town_mv_door(r.town_id, ''arena''))[1], y = (public.town_mv_door(r.town_id, ''arena''))[2] where id in (a.id, bb.id);', 'set place = ''arena'', x = (public.town_mv_door');
drop function public.town_mv_patch(text, int, text, text, text);

do $mig$ begin
  if not exists (select 1 from public.town_migrations where id = 'layout7') then
    insert into public.town_migrations(id) values ('layout7');
  end if;
end $mig$;

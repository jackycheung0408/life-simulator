-- 小豬鎮：走進朋友家（要在 town.sql 之後套用，可重複執行）
-- 不改 town_act 的動作，只加獨立 RPC town_visit(rid, pin, op, target)，op = 'enter' | 'exit'。
-- 資料：items.fv = 屋主 id；只有「人在 home:屋主 且 fv = 屋主 id」才算在他家屋裡（town_vin），缺值 = 在門外，舊角色不受影響。
-- town.sql 的 move、離線自動回家睡、入獄都會清掉 fv；town_act 的煮飯、洗澡、叫醒、串門子要求 fv = 對方（在門口只能留言、放禮物、丟雞蛋、惡作劇）。

create or replace function public.town_vin(r public.town_residents) returns boolean language sql immutable as $$
  select coalesce(r.items->>'fv','') <> '' and r.place = 'home:' || (r.items->>'fv') and (r.items->>'fv') <> r.id::text
$$;
revoke all on function public.town_vin(public.town_residents) from public, anon, authenticated;

create or replace function public.town_visit(rid bigint, pin text, op text, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op = 'enter' then
    if target is null or target = rid then raise exception '要選一位朋友'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id;
    if not found then raise exception '找不到這位鄰居'; end if;
    if r.place <> 'home:' || target then raise exception '要先走到他家門口'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
    t := public.town_tick(t);
    if not public.town_inside(t) then raise exception '% 不在屋裡，只能在門口留言或放禮物', t.name; end if;
    if public.town_bond_get(rid, target) < -20 then raise exception '% 和你的關係太差，不讓你進去，只能在門口留言', t.name; end if;
    r.items := jsonb_set(r.items, '{fv}', to_jsonb(target));
  elsif op = 'exit' then
    r.items := r.items - 'fv';
  else raise exception '不支援的操作';
  end if;
  perform public.town_save_r(r);
  return json_build_object('ok', true, 'fv', r.items->'fv');
end $$;
revoke all on function public.town_visit(bigint,text,text,bigint) from public;
grant execute on function public.town_visit(bigint,text,text,bigint) to anon, authenticated;

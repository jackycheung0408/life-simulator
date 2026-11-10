-- 小豬鎮：走進設施裡面（咖啡廳、餐廳、健身房、監獄（探監的人進去；入獄的人不用進，畫面自動算在裡面）；要在 town.sql、town_social.sql 之後套用，可重複執行）
-- 不改 town_act：獨立 RPC town_fi(rid, pin, op, place)，op = 'enter' | 'exit'。
-- 資料：items.fi = 所在設施代號；只有「fi = 現在的 place」才算在裡面（town_fin），走到別處 place 一變就自動失效，舊角色缺值 = 在外面。
-- 設施互動（town_fac）不要求一定在室內，所以沒進去也能照常用；室內只是畫面與「地圖上不畫在街上」。

create or replace function public.town_fin(r public.town_residents) returns boolean language sql immutable as $$
  select coalesce(r.items->>'fi','') <> '' and r.items->>'fi' = r.place
$$;
revoke all on function public.town_fin(public.town_residents) from public, anon, authenticated;

create or replace function public.town_fi(rid bigint, pin text, op text, pl text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op = 'enter' then
    if pl is null or pl not in ('cafe','restaurant','gym','jail','hospital','police','townhall') then raise exception '這裡還不能進去'; end if;
    if r.place <> pl then raise exception '要先走到門口'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
    if public.town_is_off(r.town_id, public.town_feature(pl)) then raise exception '這個小鎮沒有開這個設施'; end if;
    r.items := jsonb_set(r.items, '{fi}', to_jsonb(pl));
  elsif op = 'exit' then
    r.items := r.items - 'fi';
  else raise exception '不支援的操作';
  end if;
  perform public.town_save_r(r);
  return json_build_object('ok', true, 'fi', r.items->>'fi');
end $$;
revoke all on function public.town_fi(bigint,text,text,text) from public;
grant execute on function public.town_fi(bigint,text,text,text) to anon, authenticated;

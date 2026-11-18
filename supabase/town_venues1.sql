-- 吃喝社交場館升級（咖啡廳、餐廳、電影院、超市）：獨立 RPC town_venue，不改 town_act／town_fac
-- 順序：town.sql、town_fac.sql、town_pool.sql、town_infac.sql 之後；可重複執行；實測 town_venues1_test.sql（回滾）
-- 動作：art 拉花、share 共點一壺、combo 套餐、bring 外帶給朋友、seat 情侶座、chat 聊劇情、sale 特價、sample 試吃、mredeem 會員點數兌換、reg 常客委託
create or replace function public.town_venue(rid bigint, pin text, act text, target bigint default null, num int default 0)
returns json language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  r public.town_residents; t public.town_residents; pl text; base int := 0; price int := 0; fqn int := 0; disc int := 0;
  e0 real; e int := 0; h int := 0; f int := 0; b int := 0; gain int := 0; msg text := ''; pair boolean := false; sc int; ca int;
  doy int := extract(doy from now() at time zone 'Asia/Taipei')::int;
  sales text[] := array['餅乾','糖果','堅果'];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  e0 := r.energy; pl := r.place;
  perform public.town_need_in_pl(r, pl);
  if not (
    (act in ('art','share') and pl = 'cafe') or (act in ('combo','bring') and pl = 'restaurant') or
    (act in ('seat','chat') and pl = 'cinema') or (act in ('sale','sample','mredeem') and pl = 'market') or
    (act = 'reg' and pl in ('cafe','restaurant','cinema','market'))) then
    raise exception '這裡不能做這件事';
  end if;
  if public.town_is_off(r.town_id, public.town_feature(pl)) then raise exception '這個小鎮沒有開這個設施'; end if;
  pair := act in ('share','bring','seat','chat');
  if pair then
    if target is null then raise exception '要選一位鄰居'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id and id <> rid for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    t := public.town_tick(t);
    if t.sleeping or public.town_jailed(t) then raise exception '% 在睡覺或不方便', t.name; end if;
    if act <> 'bring' and t.place is distinct from pl then raise exception '% 不在這裡', t.name; end if;
  end if;
  base := case act when 'art' then 150 when 'share' then 240 when 'combo' then 320 when 'bring' then 200
    when 'seat' then 360 when 'sale' then 42 else 0 end;
  if act = 'reg' then base := case pl when 'cafe' then 90 when 'restaurant' then 200 when 'cinema' then 280 else 60 end; end if;
  if act in ('art','share','combo','bring','seat') or (act = 'reg' and pl <> 'market') then base := public.town_px(r.town_id, base); end if;
  fqn := coalesce((r.items->'fq'->>pl)::int, 0);
  disc := case when act in ('sale','reg') then 0 when fqn >= 15 then 15 when fqn >= 5 then 10 else 0 end;
  price := (base * (100 - disc) + 50) / 100;
  if price > r.money then raise exception '錢不夠，要 €%', price; end if;
  r.money := r.money - price;

  if act = 'art' then
    sc := greatest(0, least(100, num));
    e := 15 + sc / 4; f := 2 + sc / 12;
    if sc >= 80 then r.items := jsonb_set(r.items, '{cs}', to_jsonb(coalesce((r.items->>'cs')::int,0) + 1)); end if;
    msg := case when sc >= 90 then '拉出完美的愛心拉花' when sc >= 60 then '拉花還不錯' else '拉花糊成一團，味道還行' end;
  elsif act = 'share' then
    e := 25; f := 6; b := 3; t.energy := t.energy + 25; t.fun := t.fun + 6; msg := '和 ' || t.name || ' 共點一壺，聊了一會';
  elsif act = 'combo' then h := 50; f := 16; msg := '吃了主餐加飲料的套餐';
  elsif act = 'bring' then
    f := 3; b := 3; t.hunger := t.hunger + 20; t.fun := t.fun + 6; msg := '外帶一份給 ' || t.name;
  elsif act = 'seat' then
    f := 20; b := 4; t.fun := t.fun + 20; msg := '和 ' || t.name || ' 坐情侶座看了場電影';
  elsif act = 'chat' then
    f := 6; b := 2; t.fun := t.fun + 6; msg := '和 ' || t.name || ' 聊起剛看完的劇情';
  elsif act = 'sale' then
    ca := coalesce((r.items->>'snack')::int,0);
    if ca >= public.town_bag_max(r) then raise exception '背包滿了'; end if;
    r.items := jsonb_set(r.items, '{snack}', to_jsonb(ca + 1));
    r.items := jsonb_set(r.items, '{mp}', to_jsonb(coalesce((r.items->>'mp')::int,0) + 1));
    f := 2; msg := '買了特價的' || sales[doy % 3 + 1] || '，會員點數 +1';
  elsif act = 'sample' then h := 6; f := 1; msg := '吃了一口試吃品';
  elsif act = 'mredeem' then
    if coalesce((r.items->>'mp')::int,0) < 10 then raise exception '會員點數還沒滿 10 點'; end if;
    ca := coalesce((r.items->>'snack')::int,0);
    if ca + 2 > public.town_bag_max(r) then raise exception '背包放不下'; end if;
    r.items := jsonb_set(r.items, '{mp}', to_jsonb((r.items->>'mp')::int - 10));
    r.items := jsonb_set(r.items, '{snack}', to_jsonb(ca + 2)); msg := '點數換了 2 包零食';
  elsif act = 'reg' then
    gain := case pl when 'cafe' then 80 when 'restaurant' then 170 when 'cinema' then 240 else 50 end;
    r.money := r.money + gain; f := 6; msg := '幫常客跑腿，收到一點謝禮';
  end if;

  r.hunger := r.hunger + h; r.energy := r.energy + e; r.fun := r.fun + f;
  if pair then
    if b <> 0 then perform public.town_bond(r.town_id, rid, t.id, b); end if;
    perform public.town_save_r(t);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, t.id, 'joint', msg);
  end if;
  r.items := jsonb_set(r.items, '{fq}', coalesce(r.items->'fq','{}'::jsonb) || jsonb_build_object(pl, fqn + 1));
  r := public.town_ecap(r, e0, act);
  perform public.town_save_r(r);
  return json_build_object('m', gain - price, 'f', f, 'e', e, 'h', h, 'b', b, 'msg', msg, 'disc', disc);
end $$;
revoke all on function public.town_venue(bigint,text,text,bigint,int) from public;
grant execute on function public.town_venue(bigint,text,text,bigint,int) to anon, authenticated;

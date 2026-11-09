-- 小豬鎮：各設施更多互動、每日任務板、常客與坐下逗留（要在 town.sql、town_social.sql 之後套用，可重複執行）
-- 不改 town_act：全是獨立 RPC town_fac(rid, pin, act, item, target)。資料全存 items（缺值 = 預設，舊角色不重置）：
--   items.fq = {地點: 互動次數}     常客：≥5 次 −10%、≥15 次 −15%（只折該地點的花費）
--   items.cs = 咖啡集點卡點數       每買一杯特調 +1，滿 8 點換一杯（免費）
--   items.gy = {d 最後簽到日, s 連續天數}   健身房簽到：連續 3 天 +€60、7 天 +€200（滿 7 天重算）
--   items.fa = {d, n 今天互動次數, pl [去過的地點], who [互動過的人], k {今天做過的事}, tk [已領任務], all 全勤獎已領}
--   items.sit = {pl, at}            坐下逗留開始時間
--   items.cd['f_'||act] / ['f_'||act||對方id]  冷卻
-- 奢侈品（可重複買，只給心情，不打折、不算常客；5% 進鎮基金；鎮長可用 lux 開關關掉）：feast 高級套餐 3000（餐廳，12 小時）、spa 溫泉 2000（健身房，10 小時）、trip 旅行 8000（廣場，24 小時）
-- 價格與數值前端 town.js 的 FAC 表要一致。賭的只有釣魚：餌 30，期望 25.5（略負）。

create or replace function public.town_fac_done(r public.town_residents, fa jsonb, tid int) returns boolean language sql stable as $$
  select case tid
    when 0 then public.town_dc_get(r,'work') >= 3
    when 1 then coalesce((fa->>'n')::int,0) >= 3
    when 2 then jsonb_array_length(coalesce(fa->'pl','[]'::jsonb)) >= 3
    when 3 then jsonb_array_length(coalesce(fa->'who','[]'::jsonb)) >= 2
    when 4 then coalesce((fa->'k'->>'checkin')::boolean,false)
    when 5 then coalesce((fa->'k'->>'fish')::boolean,false)
    when 6 then coalesce((fa->'k'->>'song')::boolean,false) or coalesce((fa->'k'->>'treat')::boolean,false)
    when 7 then coalesce((fa->'k'->>'special')::boolean,false) or coalesce((fa->'k'->>'picnic')::boolean,false)
    else false end
$$;

create or replace function public.town_fac(rid bigint, pin text, act text, item text default null, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  yday text := to_char((now() at time zone 'Asia/Taipei') - interval '1 day','YYYY-MM-DD');
  doy int := extract(doy from now() at time zone 'Asia/Taipei')::int;
  pl text; base int := 0; price int := 0; disc int := 0; fqn int := 0; cdm int := 0; ckey text; pair boolean := false; need_t boolean := false;
  f int := 0; e int := 0; h int := 0; m int := 0; b int := 0; msg text := ''; evk text := null; evm text := null; fk text := null;
  fa jsonb; lux boolean := false; n int; s int; others int; xid bigint; xname text; pa numeric := random(); mins int; st int; ids int[]; tid int; i int; cl jsonb; fx jsonb;
  films text[] := array['感人劇情片','爆笑喜劇','熱血動作片','緊張驚悚片'];
  specs text[] := array['滷肉飯套餐','牛肉麵套餐','豬排飯套餐','咖哩飯套餐','雞腿便當套餐'];
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  pl := r.place;
  fa := case when r.items->'fa'->>'d' = today then r.items->'fa'
        else jsonb_build_object('d', today, 'n', 0, 'pl', '[]'::jsonb, 'who', '[]'::jsonb, 'k', '{}'::jsonb, 'tk', '[]'::jsonb) end;
  st := (rid % 8 + doy) % 8; ids := array[st, (st + 3) % 8, (st + 5) % 8];

  -- 領任務獎勵：item = 0～2（今天第幾個任務）
  if act = 'claim' then
    if item not in ('0','1','2') then raise exception '任務不對'; end if;
    tid := ids[item::int + 1];
    if fa->'tk' @> to_jsonb(tid) then raise exception '這個任務已經領過了'; end if;
    if not public.town_fac_done(r, fa, tid) then raise exception '這個任務還沒完成'; end if;
    fa := jsonb_set(fa, '{tk}', (fa->'tk') || to_jsonb(tid));
    m := 50; f := 3; r.money := r.money + 50; r.fun := r.fun + 3;
    if jsonb_array_length(fa->'tk') >= 3 and not coalesce((fa->>'all')::boolean, false) then
      fa := jsonb_set(fa, '{all}', 'true'::jsonb); m := m + 100; r.money := r.money + 100;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, rid, 'luck', r.name || ' 完成了今天的三個任務，領了任務板的全勤獎');
    end if;
    r.items := jsonb_set(r.items, '{fa}', fa);
    perform public.town_save_r(r);
    return json_build_object('m', m, 'f', f, 'msg', '領了任務獎勵');
  end if;

  -- 坐下逗留／起身
  if act = 'sit' then
    if pl not in ('restaurant','cafe','park','plaza') then raise exception '這裡沒有地方坐'; end if;
    r.items := jsonb_set(r.items, '{sit}', jsonb_build_object('pl', pl, 'at', now()));
    perform public.town_save_r(r);
    return json_build_object('msg', '坐下來休息了');
  elsif act = 'up' then
    if r.items->'sit' is null then return json_build_object('msg', '起身'); end if;
    if r.items->'sit'->>'pl' = pl then
      mins := least(20, floor(extract(epoch from (now() - (r.items->'sit'->>'at')::timestamptz)) / 60)::int);
      if mins >= 3 then
        e := round(mins * 0.5)::int; f := round(mins * 0.4)::int;
        select count(*) into others from public.town_residents where town_id = r.town_id and place = pl and id <> rid and not sleeping;
        if others > 0 then f := f + 2; end if;
        r.energy := r.energy + e; r.fun := r.fun + f; msg := '坐了 ' || mins || ' 分鐘，歇得不錯';
      else msg := '坐得太短，沒什麼感覺'; end if;
    else msg := '起身'; end if;
    r.items := r.items - 'sit';
    perform public.town_save_r(r);
    return json_build_object('e', e, 'f', f, 'msg', msg);
  end if;

  -- 一般互動：地點、冷卻、價格
  if not (
    (act in ('special','takeout','feast') and pl = 'restaurant') or (act in ('latte','redeem','treat','song') and pl = 'cafe') or
    (act in ('film','popcorn') and pl = 'cinema') or (act in ('spar','checkin','spa') and pl = 'gym') or
    (act in ('fish','picnic') and pl = 'park') or (act in ('frisbee','photo') and pl in ('park','plaza')) or (act = 'trip' and pl = 'plaza')) then
    raise exception '這裡不能做這件事';
  end if;
  if public.town_is_off(r.town_id, public.town_feature(pl)) then raise exception '這個小鎮沒有開這個設施'; end if;
  lux := act in ('feast','trip','spa');
  if lux and public.town_is_off(r.town_id, 'lux') then raise exception '這個小鎮沒有開奢侈品'; end if;
  need_t := act in ('treat','spar','frisbee'); pair := need_t or (act = 'photo' and target is not null);
  if need_t and target is null then raise exception '要選一位在場的鄰居'; end if;
  if pair then
    select * into t from public.town_residents where id = target and town_id = r.town_id and id <> rid for update;
    if not found then raise exception '找不到這位鄰居'; end if;
    t := public.town_tick(t);
    if t.sleeping or t.place is distinct from pl then raise exception '% 不在這裡，或在睡覺', t.name; end if;
  end if;
  ckey := 'f_' || act || case when pair then target::text else '' end;
  cdm := case act when 'special' then 20 when 'takeout' then 10 when 'latte' then 15 when 'redeem' then 15 when 'treat' then 30 when 'song' then 20
    when 'film' then 60 when 'popcorn' then 15 when 'spar' then 20 when 'frisbee' then 15 when 'fish' then 10 when 'picnic' then 30 when 'photo' then 30
    when 'feast' then 720 when 'trip' then 1440 when 'spa' then 600 else 0 end;
  if cdm > 0 and (r.items->'cd'->>ckey)::timestamptz > now() - cdm * interval '1 minute' then
    raise exception '還要等 % 分鐘', ceil(extract(epoch from ((r.items->'cd'->>ckey)::timestamptz + cdm * interval '1 minute' - now())) / 60)::int; end if;
  base := case act when 'special' then 200 when 'takeout' then 120 when 'latte' then 110 when 'treat' then 200 when 'song' then 50
    when 'film' then 280 when 'popcorn' then 80 when 'fish' then 30 when 'picnic' then 150
    when 'feast' then 3000 when 'trip' then 8000 when 'spa' then 2000 else 0 end;
  fqn := coalesce((r.items->'fq'->>pl)::int, 0);
  disc := case when lux then 0 when fqn >= 15 then 15 when fqn >= 5 then 10 else 0 end;
  price := (base * (100 - disc) + 50) / 100;
  if price > r.money then raise exception '錢不夠，要 €%', price; end if;
  r.money := r.money - price; m := -price;
  if lux then perform public.town_fund_add(r.town_id, 'lux', price * 5 / 100); end if;
  fk := act;

  if act = 'special' then h := 40; f := 12; msg := '吃了今日特餐「' || specs[doy % 5 + 1] || '」';
  elsif act = 'takeout' then
    if coalesce((r.items->>'snack')::int,0) >= public.town_bag_max(r) then raise exception '背包滿了'; end if;
    r.items := jsonb_set(r.items, '{snack}', to_jsonb(coalesce((r.items->>'snack')::int,0) + 1)); f := 3; msg := '打包了一份帶走';
  elsif act = 'latte' then
    e := 45; f := 4; r.items := jsonb_set(r.items, '{cs}', to_jsonb(coalesce((r.items->>'cs')::int,0) + 1)); msg := '喝了一杯特調，集點卡蓋了一格';
  elsif act = 'redeem' then
    if coalesce((r.items->>'cs')::int,0) < 8 then raise exception '集點卡還沒集滿 8 點'; end if;
    r.items := jsonb_set(r.items, '{cs}', to_jsonb((r.items->>'cs')::int - 8)); e := 45; f := 6; msg := '用集點卡換了一杯免費特調';
  elsif act = 'treat' then
    f := 4; b := 3; t.fun := t.fun + 10; msg := '請 ' || t.name || ' 喝了咖啡';
    evk := 'joint'; evm := r.name || ' 請 ' || t.name || ' 在咖啡廳喝了一杯';
  elsif act = 'song' then
    f := 6; update public.town_residents set fun = least(100, fun + 3) where town_id = r.town_id and place = pl and id <> rid and not sleeping; msg := '點了一首歌，大家都聽到了';
  elsif act = 'film' then
    i := doy % 4;
    f := (array[18,22,16,20])[i + 1]; e := (array[-2,0,0,-4])[i + 1]; msg := '看了今日放映的' || films[i + 1];
  elsif act = 'popcorn' then h := 12; f := 4; msg := '吃了一桶爆米花';
  elsif act = 'spar' then
    if r.energy < 25 or t.energy < 25 then raise exception '兩個人精力都要有 25 以上'; end if;
    e := -12; f := 6; b := 2; t.energy := t.energy - 12; t.fun := t.fun + 6; msg := '和 ' || t.name || ' 對練了一回合';
    evk := 'joint'; evm := r.name || ' 和 ' || t.name || ' 在健身房對練';
  elsif act = 'checkin' then
    if r.items->'gy'->>'d' = today then raise exception '今天已經簽到過了'; end if;
    s := case when r.items->'gy'->>'d' = yday then coalesce((r.items->'gy'->>'s')::int,0) + 1 else 1 end;
    f := 3; msg := '健身房簽到，連續 ' || s || ' 天';
    if s % 7 = 0 then m := m + 200; r.money := r.money + 200; msg := msg || '，領了 €200 獎勵';
    elsif s % 3 = 0 then m := m + 60; r.money := r.money + 60; msg := msg || '，領了 €60 獎勵'; end if;
    r.items := jsonb_set(r.items, '{gy}', jsonb_build_object('d', today, 's', s));
  elsif act = 'frisbee' then
    if r.energy < 10 or t.energy < 10 then raise exception '兩個人精力都要有 10 以上'; end if;
    e := -4; f := 8; b := 1; t.energy := t.energy - 4; t.fun := t.fun + 8; msg := '和 ' || t.name || ' 丟了一會兒飛盤';
    evk := 'joint'; evm := r.name || ' 和 ' || t.name || ' 在' || public.town_place_name(pl) || '丟飛盤';
  elsif act = 'fish' then
    f := 4;
    if pa < .15 then m := m + 100; r.money := r.money + 100; fk := 'fish'; msg := '釣到一條大魚，賣了 €100';
      evk := 'luck'; evm := r.name || ' 在公園釣到一條大魚';
    elsif pa < .50 then m := m + 30; r.money := r.money + 30; fk := 'fish'; msg := '釣到一條小魚，賣了 €30';
    else msg := '今天沒釣到'; fk := 'fishmiss'; end if;
  elsif act = 'picnic' then
    h := 25; f := 12; msg := '在草地上野餐';
    select id, name into xid, xname from public.town_residents where town_id = r.town_id and place = pl and id <> rid and not sleeping order by random() limit 1;
    if xid is not null then b := 1; end if;
  elsif act = 'feast' then h := 40; f := 30; msg := '在高級餐廳吃了一頓套餐';
    evk := 'luck'; evm := r.name || ' 在餐廳吃了一頓高級套餐';
  elsif act = 'spa' then e := 30; f := 25; r.hygiene := least(100, r.hygiene + 40); msg := '泡了溫泉做了 SPA';
  elsif act = 'trip' then e := -10; h := -10; f := 60; msg := '出門小旅行，玩得很開心';
    evk := 'luck'; evm := r.name || ' 出去旅行了一趟';
  elsif act = 'photo' then
    f := 5; msg := '拍了一張照片';
    if pair then f := 6; b := 1; t.fun := t.fun + 6; msg := '和 ' || t.name || ' 合拍了一張照片'; end if;
  else raise exception '不明的操作';
  end if;

  r.hunger := r.hunger + h; r.energy := r.energy + e; r.fun := r.fun + f;
  -- 和誰互動：好感走 town_bond（吃每日上限）；有人一起就拿一次「一起」加成（每人每天最多 8 次，與其他一起加成共用）
  if pair then
    if b <> 0 then perform public.town_bond(r.town_id, rid, t.id, b); end if;
    r := public.town_tg(r, 2, 1); t := public.town_tg(t, 2, 1);
    perform public.town_save_r(t);
    if not (fa->'who' @> to_jsonb(t.id)) then fa := jsonb_set(fa, '{who}', (fa->'who') || to_jsonb(t.id)); end if;
  elsif xid is not null then
    perform public.town_bond(r.town_id, rid, xid, b); r := public.town_tg(r, 2, 1);
    if not (fa->'who' @> to_jsonb(xid)) then fa := jsonb_set(fa, '{who}', (fa->'who') || to_jsonb(xid)); end if;
  end if;
  if evk is not null then insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, case when pair then t.id else rid end, evk, evm); end if;

  fa := jsonb_set(fa, '{n}', to_jsonb(coalesce((fa->>'n')::int,0) + 1));
  if not (fa->'pl' @> to_jsonb(pl)) then fa := jsonb_set(fa, '{pl}', (fa->'pl') || to_jsonb(pl)); end if;
  fa := jsonb_set(fa, ('{k,' || fk || '}')::text[], 'true'::jsonb);
  r.items := jsonb_set(r.items, '{fa}', fa);
  if not lux then r.items := jsonb_set(r.items, '{fq}', coalesce(r.items->'fq','{}'::jsonb) || jsonb_build_object(pl, fqn + 1)); end if;
  if cdm > 0 then r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(ckey, now())); end if;
  perform public.town_save_r(r);
  return json_build_object('m', m, 'f', f, 'e', e, 'h', h, 'b', b, 'msg', msg, 'disc', disc, 'fq', fqn + 1, 'who', case when pair then t.name else xname end);
end $$;
revoke all on function public.town_fac(bigint,text,text,text,bigint) from public;
grant execute on function public.town_fac(bigint,text,text,text,bigint) to anon, authenticated;
revoke all on function public.town_fac_done(public.town_residents,jsonb,int) from public, anon, authenticated;

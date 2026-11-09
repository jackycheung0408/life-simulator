-- 小豬鎮：監獄與砍人（角色不會死）。要在 town.sql（含 town_jailed、jail 地點與 town_act 的入獄檢查）、town_social.sql 之後套用，可重複執行。
-- 不改 town_act 的動作：全是獨立 RPC town_jail(rid, pin, act, item, target)。資料全存 items（缺值 = 預設，舊角色不重置）：
--   items.jl = 出獄時間（text 時間戳；在這之前算入獄中，town_jailed(r) 判斷）
--   items.sl = {d 台灣日, n 今天被砍次數}   被砍每天最多 2 次（防洗版）
--   items.cd.slash 砍人冷卻 30 分鐘；items.cd['jv'||id] 探監冷卻 60 分鐘；打工冷卻共用 items.cd.wk（town_wk_check／town_wk_set）
-- 動作（地點／條件）：
--   slash 砍人：在街上、對方也在街上且距離 ≤ 2.5 格、雙方好感 < 0（有仇）、自己精力 ≥ 15、對方沒睡著沒入獄沒住院。
--     對方 精力 −35、心情 −20、鼻青臉腫 30 分鐘；自己 精力 −10、心情 −8；好感 −6（走 town_bond，吃每日負向上限）。
--     對方精力歸零 → 倒地住院 2 小時（faint + hosp，醒來不再收 €1500），醫藥費 €1500 由砍人的人付（付到 0 為止，不欠款）。
--     被巡警抓到機率 45%（倒地 80%；23～5 點 ×0.5）：關 1～3 小時（倒地至少 2 小時），人移到監獄門口，期間不能移動、不能做任何 town_act。
--   labor 勞動：入獄中、在監獄。€120、精力 −20、心情 −3，共用打工 10 分鐘冷卻，刑期縮短 10 分鐘（比最低的實習生 €190 還少）。
--   visit 探監：自己沒入獄、在監獄、對方入獄中；60 分鐘一次；探監的人心情 +3 精力 −2、受刑人心情 +10；好感 +2。
--   bail 保釋：自己（入獄中）或幫別人（在監獄、自己沒入獄）付保釋金 = max(300, 剩餘分鐘 × 10)，一小時 €600；錢不夠就保不了（不欠款）。幫別人保釋好感 +4、他心情 +10。
-- 價格與數值前端 town.js 的 JAIL 表要一致。

create or replace function public.town_jail(rid bigint, pin text, act text, item text default null, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
  pa numeric := random(); n int; fee int; mins int; cost int; p numeric; msg text := ''; m int := 0; e int := 0; f int := 0; b int := 0; fall boolean := false; caught boolean := false;
  jl timestamptz; ckey text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'jail') then raise exception '這個小鎮沒有開監獄'; end if;

  -- 砍人
  if act = 'slash' then
    if public.town_jailed(r) then raise exception '你被關著，哪裡也去不了'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if r.place <> 'street' then raise exception '只能在路上動手，不能在屋裡或設施裡'; end if;
    if target is null or target = rid then raise exception '要選一個對象'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這個人'; end if;
    t := public.town_tick(t);
    if t.place <> 'street' or abs(t.x - r.x) + abs(t.y - r.y) > 2.5 then raise exception '%不在你旁邊', t.name; end if;
    if t.sleeping or (t.items->>'faint') is not null then raise exception '%已經倒在地上了', t.name; end if;
    if public.town_jailed(t) then raise exception '%被關著', t.name; end if;
    if public.town_bond_get(rid, target) >= 0 then raise exception '你和 % 沒有過節，只有有仇的人才會動手', t.name; end if;
    if r.energy < 15 then raise exception '精力不夠，至少要 15'; end if;
    if (r.items->'cd'->>'slash') is not null and (r.items->'cd'->>'slash')::timestamptz > now() - interval '30 minutes' then
      raise exception '剛動過手，還要等 % 分鐘', ceil(extract(epoch from ((r.items->'cd'->>'slash')::timestamptz + interval '30 minutes' - now())) / 60)::int; end if;
    if coalesce((t.items->'sl'->>'n')::int, 0) >= 2 and t.items->'sl'->>'d' = today then raise exception '% 今天已經被砍夠了，放過他吧', t.name; end if;
    -- 傷害（不會死）：精力 −35、心情 −20；歸零倒地送醫院
    r.energy := r.energy - 10; r.fun := r.fun - 8; e := -10; f := -8;
    t.energy := t.energy - 35; t.fun := t.fun - 20; t.bruised_until := now() + interval '30 minutes';
    t.items := jsonb_set(t.items, '{sl}', jsonb_build_object('d', today, 'n', case when t.items->'sl'->>'d' = today then coalesce((t.items->'sl'->>'n')::int, 0) + 1 else 1 end));
    perform public.town_bond(r.town_id, rid, target, -6);
    if t.energy <= 0 then
      fall := true; t.energy := 0; t.sleeping := true;
      t.items := jsonb_set(jsonb_set(t.items, '{faint}', to_jsonb((now() + interval '2 hours')::text)), '{hosp}', '1'::jsonb);
      fee := least(1500, greatest(0, r.money)); r.money := r.money - fee; m := -fee;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'slash', r.name || ' 砍了 ' || t.name || '，' || t.name || ' 倒在路上被送進醫院（醫藥費 €' || fee || ' 由 ' || r.name || ' 付）');
      msg := t.name || ' 被你砍倒了，送進醫院，醫藥費 €' || fee || ' 由你付';
    else
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'slash', r.name || ' 在路上砍了 ' || t.name || ' 一刀，' || t.name || ' 受了傷');
      msg := '砍了 ' || t.name || ' 一刀，他受傷了';
    end if;
    -- 巡警抓人：45%（倒地 80%），半夜減半；關 1～3 小時（倒地至少 2 小時）
    p := case when fall then .8 else .45 end * case when hr >= 23 or hr < 5 then .5 else 1 end;
    if pa < p then
      caught := true; mins := 60 * (1 + floor(random() * 3)::int); if fall then mins := greatest(mins, 120); end if;
      r.items := jsonb_set(r.items, '{jl}', to_jsonb((now() + make_interval(mins => mins))::text));
      if r.items#>>'{veh,k}' is not null then r.items := jsonb_set(r.items, '{veh}', (r.items->'veh') - 'k'); end if;
      r.items := r.items - 'dr';
      r.place := 'jail'; r.x := 61; r.y := 5;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'jail', r.name || ' 被巡警抓走，關進監獄 ' || mins / 60 || ' 小時');
      msg := msg || '；被巡警抓走，關 ' || mins / 60 || ' 小時';
    end if;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('slash', now()));
    perform public.town_save_r(t);
    perform public.town_save_r(r);
    -- town_save_r 不存位置：入獄要另外把人移到監獄門口
    if caught then update public.town_residents set place = r.place, x = r.x, y = r.y where id = r.id; end if;
    return json_build_object('m', m, 'e', e, 'f', f, 'msg', msg, 'fall', fall, 'caught', caught, 'mins', mins);
  end if;

  -- 以下都要在監獄門口
  if r.place <> 'jail' then raise exception '要先走到監獄'; end if;

  if act = 'labor' then
    if not public.town_jailed(r) then raise exception '你沒有被關，不能做牢裡的勞動'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if r.energy < 20 then raise exception '精力不夠，至少要 20'; end if;
    perform public.town_wk_check(r);
    r := public.town_wk_set(r);
    r.money := r.money + 120; r.energy := r.energy - 20; r.fun := r.fun - 3; m := 120; e := -20; f := -3;
    jl := (r.items->>'jl')::timestamptz - interval '10 minutes';
    if jl <= now() then r.items := r.items - 'jl'; msg := '做完勞動，刑期滿了，可以出獄了';
    else r.items := jsonb_set(r.items, '{jl}', to_jsonb(jl::text)); msg := '做了一小時勞動，領了 €120，刑期縮短 10 分鐘'; end if;
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'jaillabor', r.name || ' 在監獄裡做勞動，賺了 €120');
    perform public.town_save_r(r);
    return json_build_object('m', m, 'e', e, 'f', f, 'msg', msg);
  end if;

  if act = 'visit' then
    if public.town_jailed(r) then raise exception '你自己也被關著'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if target is null or target = rid then raise exception '要選一位受刑人'; end if;
    select * into t from public.town_residents where id = target and town_id = r.town_id for update;
    if not found then raise exception '找不到這個人'; end if;
    t := public.town_tick(t);
    if t.place <> 'jail' or not public.town_jailed(t) then raise exception '% 不在牢裡', t.name; end if;
    ckey := 'jv' || target;
    if (r.items->'cd'->>ckey) is not null and (r.items->'cd'->>ckey)::timestamptz > now() - interval '60 minutes' then
      raise exception '剛探過監，還要等 % 分鐘', ceil(extract(epoch from ((r.items->'cd'->>ckey)::timestamptz + interval '60 minutes' - now())) / 60)::int; end if;
    r.fun := r.fun + 3; r.energy := r.energy - 2; t.fun := t.fun + 10; f := 3; e := -2; b := 2;
    perform public.town_bond(r.town_id, rid, target, 2);
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object(ckey, now()));
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'visitjail', r.name || ' 到監獄探望 ' || t.name);
    perform public.town_save_r(t);
    perform public.town_save_r(r);
    return json_build_object('f', f, 'e', e, 'b', b, 'msg', '探望了 ' || t.name);
  end if;

  if act = 'bail' then
    if target is null or target = rid then
      if not public.town_jailed(r) then raise exception '你沒有被關著'; end if;
      t := r;
    else
      if public.town_jailed(r) then raise exception '你自己也被關著'; end if;
      select * into t from public.town_residents where id = target and town_id = r.town_id for update;
      if not found then raise exception '找不到這個人'; end if;
      t := public.town_tick(t);
      if t.place <> 'jail' or not public.town_jailed(t) then raise exception '% 不在牢裡', t.name; end if;
    end if;
    mins := greatest(1, ceil(extract(epoch from ((t.items->>'jl')::timestamptz - now())) / 60)::int);
    cost := greatest(300, mins * 10);
    if r.money < cost then raise exception '錢不夠，保釋金要 €%', cost; end if;
    r.money := r.money - cost; m := -cost;
    if target is null or target = rid then
      r.items := r.items - 'jl';
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'bail', r.name || ' 付了保釋金 €' || cost || ' 提早出獄');
      msg := '付了保釋金 €' || cost || '，提早出獄';
      perform public.town_save_r(r);
    else
      t.items := t.items - 'jl'; t.fun := t.fun + 10; b := 4;
      perform public.town_bond(r.town_id, rid, target, 4);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'bail', r.name || ' 替 ' || t.name || ' 付了保釋金 €' || cost || '，把他保出來了');
      msg := '替 ' || t.name || ' 付了保釋金 €' || cost;
      perform public.town_save_r(t);
      perform public.town_save_r(r);
    end if;
    return json_build_object('m', m, 'b', b, 'msg', msg, 'cost', cost);
  end if;

  raise exception '不明的操作';
end $$;
revoke all on function public.town_jail(bigint,text,text,text,bigint) from public;
grant execute on function public.town_jail(bigint,text,text,text,bigint) to anon, authenticated;

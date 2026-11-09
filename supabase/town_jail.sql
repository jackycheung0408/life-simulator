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
-- 2026-11 擴充（牢裡情境）：
--   前科 items.pr = {u 到期時間, n 累計次數}：入獄時 u = 出獄時間 + 24 小時，提早出獄（勞動滿刑、保釋、假釋）改成 出獄當下 + 24 小時；
--     前科期間薪水 −8%（town_pr_pct，town.sql 的打工／加班乘上它）、巡警抓人與盤查機率 ×1.5（town_pr_mult，砍人被抓與 town_traffic 的 nf）。不永久、缺值 = 沒有前科。
--   通緝 items.wt = 到期時間（越獄成功後 3 小時）：期間巡警機率 ×2.5，出了家門（不在 home:）每分鐘約 3.5% 被抓回去關 90 分鐘（town.sql 的 town_tick）。
--   假釋 items.pl = 到期時間（假釋 24 小時）：期間再被關刑期加倍（最多 6 小時）、不能再假釋。
--   服刑紀錄 items.jp = {t 入獄時間, e 原定出獄時間, n 牢裡勞動次數, bad 惹過事=1}：假釋要 n >= 2、沒惹事、服滿一半刑期。
--   放風 yard：30 分鐘一次，心情 +6 精力 −3。越獄 escape：精力 >= 30、1 小時一次，成功 12%（23～5 點 18%）回到街上並被通緝 3 小時；失敗加刑 60 分鐘、罰款最多 €500（付到 0）、精力 −15 心情 −10，並算惹事（不能假釋）。
--   獄友事件 town_jail_ev(rid,pin,op,item)：和設施小事件同格式（poll／pick），4 個事件 × 2 個選項，items.je = {nx,lp,d,n,q}，每天最多 8 個；效果表 town_jail_ev_eff（見下）。
--   這份要「先於 town.sql」套用（town.sql 的 town_tick／town_traffic／打工會呼叫 town_pr_pct／town_pr_mult／town_prior_set）；town_fi.sql 的白名單要有 jail。

-- ── 前科、通緝、假釋的小幫手（只讀 items）──
create or replace function public.town_pr_on(r public.town_residents) returns boolean language sql stable as $$
  select coalesce((r.items->'pr'->>'u') is not null and (r.items->'pr'->>'u')::timestamptz > now(), false)
$$;
create or replace function public.town_wanted(r public.town_residents) returns boolean language sql stable as $$
  select coalesce((r.items->>'wt') is not null and (r.items->>'wt')::timestamptz > now(), false)
$$;
create or replace function public.town_paroled(r public.town_residents) returns boolean language sql stable as $$
  select coalesce((r.items->>'pl') is not null and (r.items->>'pl')::timestamptz > now(), false)
$$;
create or replace function public.town_pr_pct(r public.town_residents) returns int language sql stable as $$
  select case when public.town_pr_on(r) then 92 else 100 end
$$;
create or replace function public.town_pr_mult(r public.town_residents) returns real language sql stable as $$
  select (case when public.town_wanted(r) then 2.5 when public.town_pr_on(r) then 1.5 else 1 end)::real
$$;
-- 記前科：from_ts + 24 小時；inc = 這次是新的一筆（累計次數 +1）
create or replace function public.town_prior_set(r public.town_residents, from_ts timestamptz, inc boolean) returns public.town_residents language plpgsql as $$
begin
  r.items := jsonb_set(r.items, '{pr}', jsonb_build_object('u', (from_ts + interval '24 hours')::text, 'n', coalesce((r.items->'pr'->>'n')::int, 0) + case when inc then 1 else 0 end));
  return r;
end $$;
revoke all on function public.town_pr_on(public.town_residents), public.town_wanted(public.town_residents), public.town_paroled(public.town_residents), public.town_pr_pct(public.town_residents), public.town_pr_mult(public.town_residents), public.town_prior_set(public.town_residents,timestamptz,boolean) from public, anon, authenticated;

create or replace function public.town_jail(rid bigint, pin text, act text, item text default null, target bigint default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents;
  today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  hr int := extract(hour from now() at time zone 'Asia/Taipei')::int;
  pa numeric := random(); n int; fee int; mins int; cost int; p numeric; msg text := ''; m int := 0; e int := 0; f int := 0; b int := 0; fall boolean := false; caught boolean := false;
  jl timestamptz; ckey text; par boolean := false; jt timestamptz; je timestamptz;
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
    p := least(.95, p * public.town_pr_mult(r));   -- 有前科 ×1.5、通緝中 ×2.5
    if pa < p then
      caught := true; mins := 60 * (1 + floor(random() * 3)::int); if fall then mins := greatest(mins, 120); end if;
      par := public.town_paroled(r);
      if par then mins := least(360, mins * 2); end if;   -- 假釋中犯事：刑期加倍
      r.items := jsonb_set(r.items - 'pl' - 'wt', '{jl}', to_jsonb((now() + make_interval(mins => mins))::text));
      r.items := jsonb_set(r.items, '{jp}', jsonb_build_object('t', now(), 'e', now() + make_interval(mins => mins), 'n', 0, 'bad', case when par then 1 else 0 end));
      r := public.town_prior_set(r, now() + make_interval(mins => mins), true);
      if r.items#>>'{veh,k}' is not null then r.items := jsonb_set(r.items, '{veh}', (r.items->'veh') - 'k'); end if;
      r.items := r.items - 'dr' - 'fi';
      r.place := 'jail'; r.x := 61; r.y := 5;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'jail', r.name || case when par then ' 假釋期間又犯事，被巡警抓走，刑期加倍關 ' else ' 被巡警抓走，關進監獄 ' end || (case when mins % 60 = 0 then (mins / 60)::text || ' 小時' else mins || ' 分鐘' end));
      msg := msg || case when par then '；假釋中犯事，刑期加倍，關 ' else '；被巡警抓走，關 ' end || (case when mins % 60 = 0 then (mins / 60)::text || ' 小時' else mins || ' 分鐘' end);
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
    r.items := jsonb_set(r.items, '{jp}', coalesce(r.items->'jp', '{}'::jsonb) || jsonb_build_object('n', coalesce((r.items->'jp'->>'n')::int, 0) + 1));
    jl := (r.items->>'jl')::timestamptz - interval '10 minutes';
    if jl <= now() then r.items := r.items - 'jl' - 'jp'; r := public.town_prior_set(r, now(), false); msg := '做完勞動，刑期滿了，可以出獄了';
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
      r.items := r.items - 'jl' - 'jp'; r := public.town_prior_set(r, now(), false);
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'bail', r.name || ' 付了保釋金 €' || cost || ' 提早出獄');
      msg := '付了保釋金 €' || cost || '，提早出獄';
      perform public.town_save_r(r);
    else
      t.items := t.items - 'jl' - 'jp'; t := public.town_prior_set(t, now(), false); t.fun := t.fun + 10; b := 4;
      perform public.town_bond(r.town_id, rid, target, 4);
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'bail', r.name || ' 替 ' || t.name || ' 付了保釋金 €' || cost || '，把他保出來了');
      msg := '替 ' || t.name || ' 付了保釋金 €' || cost;
      perform public.town_save_r(t);
      perform public.town_save_r(r);
    end if;
    return json_build_object('m', m, 'b', b, 'msg', msg, 'cost', cost);
  end if;

  if act = 'yard' then
    if not public.town_jailed(r) then raise exception '你沒有被關，不用放風'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if (r.items->'cd'->>'yard') is not null and (r.items->'cd'->>'yard')::timestamptz > now() - interval '30 minutes' then
      raise exception '剛放過風，還要等 % 分鐘', ceil(extract(epoch from ((r.items->'cd'->>'yard')::timestamptz + interval '30 minutes' - now())) / 60)::int; end if;
    r.fun := r.fun + 6; r.energy := r.energy - 3; f := 6; e := -3;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('yard', now()));
    perform public.town_save_r(r);
    return json_build_object('f', f, 'e', e, 'msg', '在放風場曬了太陽、走了一圈，心情好多了');
  end if;

  if act = 'parole' then
    if not public.town_jailed(r) then raise exception '你沒有被關著'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    jt := nullif(r.items->'jp'->>'t','')::timestamptz; je := nullif(r.items->'jp'->>'e','')::timestamptz;
    if jt is null or je is null then raise exception '沒有服刑紀錄，無法申請假釋（可以先做勞動、付保釋金）'; end if;
    if coalesce((r.items->'jp'->>'bad')::int, 0) = 1 then raise exception '你在牢裡惹過事（或假釋中犯事），這次不能假釋'; end if;
    n := coalesce((r.items->'jp'->>'n')::int, 0);
    if n < 2 then raise exception '表現還不夠，至少要做 2 次牢裡勞動（現在 % 次）', n; end if;
    if now() < jt + (je - jt) / 2 then raise exception '要服滿一半刑期才能申請假釋，還要等 % 分鐘', ceil(extract(epoch from (jt + (je - jt) / 2 - now())) / 60)::int; end if;
    r.items := jsonb_set(r.items - 'jl' - 'jp', '{pl}', to_jsonb((now() + interval '24 hours')::text));
    r := public.town_prior_set(r, now(), false);
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'parole', r.name || ' 表現良好，獲准假釋出獄（假釋 24 小時，期間再犯事刑期加倍）');
    perform public.town_save_r(r);
    return json_build_object('msg', '表現良好，獲准假釋！24 小時內別再犯事，否則刑期加倍', 'paroled', true);
  end if;

  if act = 'escape' then
    if not public.town_jailed(r) then raise exception '你沒有被關著'; end if;
    if r.sleeping then raise exception '你在睡覺，先起床'; end if;
    if r.energy < 30 then raise exception '精力不夠，越獄至少要 30'; end if;
    if (r.items->'cd'->>'esc') is not null and (r.items->'cd'->>'esc')::timestamptz > now() - interval '60 minutes' then
      raise exception '剛試過越獄，還要等 % 分鐘', ceil(extract(epoch from ((r.items->'cd'->>'esc')::timestamptz + interval '60 minutes' - now())) / 60)::int; end if;
    r.items := jsonb_set(r.items, '{cd}', coalesce(r.items->'cd','{}'::jsonb) || jsonb_build_object('esc', now()));
    p := case when hr >= 23 or hr < 5 then .18 else .12 end;
    if pa < p then
      r.items := jsonb_set(r.items - 'jl' - 'jp' - 'pl', '{wt}', to_jsonb((now() + interval '3 hours')::text));
      r := public.town_prior_set(r, now(), true);
      r.energy := r.energy - 20; e := -20;
      insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'escape', r.name || ' 越獄成功，逃出監獄，被通緝 3 小時！');
      perform public.town_save_r(r);
      update public.town_residents set place = 'street', x = 61, y = 5 where id = r.id;
      return json_build_object('e', e, 'msg', '越獄成功！被通緝 3 小時，出門被巡警抓回去的機率很高，躲回家比較安全', 'escaped', true);
    end if;
    fee := least(500, greatest(0, r.money)); r.money := r.money - fee; m := -fee;
    r.energy := r.energy - 15; r.fun := r.fun - 10; e := -15; f := -10;
    jl := (r.items->>'jl')::timestamptz + interval '60 minutes';
    r.items := jsonb_set(r.items, '{jl}', to_jsonb(jl::text));
    r.items := jsonb_set(r.items, '{jp}', coalesce(r.items->'jp', '{}'::jsonb) || '{"bad":1}'::jsonb);
    insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'jail', r.name || ' 越獄失敗被抓回牢房，加刑 1 小時');
    perform public.town_save_r(r);
    return json_build_object('m', m, 'e', e, 'f', f, 'msg', '越獄失敗，被獄警抓回來：加刑 1 小時、罰款 €' || fee, 'escaped', false);
  end if;

  raise exception '不明的操作';
end $$;
revoke all on function public.town_jail(bigint,text,text,text,bigint) from public;
grant execute on function public.town_jail(bigint,text,text,text,bigint) to anon, authenticated;

-- ── 獄友事件（牢裡）：poll 看有沒有新事件（前端在牢裡每 20 秒問一次），pick 選 0 或 1 ──
-- 4 個事件（0 聊天、1 被欺負、2 交換物品、3 幫忙）× 2 個選項 → [心情, 精力, 錢, 好感, 成功機率%, 失敗心情, 失敗精力, 失敗錢, 失敗好感, 成功刑期分鐘, 失敗刑期分鐘, 惹事(1 = 不能假釋)]
-- 好感是對「同在牢裡的某位獄友」。賭的選項期望值略負（牌：0.35×120 − 0.65×80 = −10），安全選項不給錢；刑期變動負 = 減刑。前端 town.js 的 JE 文字順序要一致。
create or replace function public.town_jail_ev_eff(k int, o int) returns int[] language sql immutable as $$
  select array(select jsonb_array_elements_text(('[
   [[6,0,0,1,100,0,0,0,0,0,0,0],[10,-3,0,0,70,-4,-3,0,0,0,0,0]],
   [[-8,0,0,0,100,0,0,0,0,0,0,0],[8,-5,0,-1,45,-12,-12,0,-1,0,15,1]],
   [[8,0,-50,1,100,0,0,0,0,0,0,0],[4,0,120,0,35,-3,0,-80,0,0,0,0]],
   [[4,-6,0,2,100,0,0,0,0,-5,0,0],[-3,0,0,-2,50,-3,0,0,-2,-20,10,0]]
  ]'::jsonb) #> array[k::text, o::text]))::int[]
$$;
revoke all on function public.town_jail_ev_eff(int,int) from public, anon, authenticated;

create or replace function public.town_jail_ev(rid bigint, pin text, op text default 'poll', item text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; jv jsonb; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  k int; o int; ef int[]; hit boolean; f int; e int; m int; b int; dl int; bad int; xid bigint; xname text; dn int; q jsonb; jl timestamptz; freed boolean := false;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if public.town_is_off(r.town_id, 'jail') then raise exception '這個小鎮沒有開監獄'; end if;
  jv := coalesce(r.items->'je', '{}'::jsonb);
  dn := case when jv->>'d' = today then coalesce((jv->>'n')::int, 0) else 0 end;
  if op = 'poll' then
    if r.place <> 'jail' or not public.town_jailed(r) or r.sleeping then
      if jv <> '{}'::jsonb then update public.town_residents set items = items - 'je' where id = rid; end if;
      return json_build_object('ev', null);
    end if;
    -- 超過 5 分鐘沒回報（離線）：重新計時，不累積
    if jv->>'lp' is null or (jv->>'lp')::timestamptz < now() - interval '5 minutes' then
      jv := jsonb_build_object('nx', now() + (4 + random() * 4) * interval '1 minute', 'lp', now(), 'd', today, 'n', dn);
      update public.town_residents set items = jsonb_set(items, '{je}', jv) where id = rid;
      return json_build_object('ev', null);
    end if;
    jv := jv || jsonb_build_object('lp', now(), 'd', today, 'n', dn);
    q := jv->'q';
    if q is not null and (q->>'at')::timestamptz < now() - interval '5 minutes' then jv := jv - 'q'; q := null; end if;
    if q is null and now() >= (jv->>'nx')::timestamptz and dn < 8 then
      q := jsonb_build_object('k', floor(random() * 4)::int, 'at', now());
      jv := jv || jsonb_build_object('q', q, 'nx', now() + (5 + random() * 5) * interval '1 minute', 'n', dn + 1);
    elsif q is null and now() >= (jv->>'nx')::timestamptz then
      jv := jv || jsonb_build_object('nx', now() + interval '20 minutes');
    end if;
    update public.town_residents set items = jsonb_set(items, '{je}', jv) where id = rid;
    return json_build_object('ev', case when q is null then null else json_build_object('k', (q->>'k')::int, 'at', q->>'at') end);
  elsif op = 'pick' then
    if r.place <> 'jail' or not public.town_jailed(r) then raise exception '你已經不在牢裡了'; end if;
    q := jv->'q';
    if q is null or (q->>'at')::timestamptz < now() - interval '5 minutes' then raise exception '這個事件已經過去了'; end if;
    if item not in ('0','1') then raise exception '選項不對'; end if;
    o := item::int; k := (q->>'k')::int;
    ef := public.town_jail_ev_eff(k, o);
    if least(ef[3], ef[8]) < 0 and r.money < -least(ef[3], ef[8]) then raise exception '錢不夠，這個選項最多要花 €%', -least(ef[3], ef[8]); end if;
    hit := random() * 100 < ef[5];
    f := case when hit then ef[1] else ef[6] end; e := case when hit then ef[2] else ef[7] end;
    m := case when hit then ef[3] else ef[8] end; b := case when hit then ef[4] else ef[9] end;
    dl := case when hit then ef[10] else ef[11] end; bad := ef[12];
    r.fun := r.fun + f; r.energy := r.energy + e; r.money := r.money + m;
    select x.id, x.name into xid, xname from public.town_residents x where x.town_id = r.town_id and x.place = 'jail' and x.id <> rid and public.town_jailed(x) order by random() limit 1;
    if xid is not null and b <> 0 then perform public.town_bond(r.town_id, rid, xid, b); end if;
    if dl <> 0 then
      jl := (r.items->>'jl')::timestamptz + make_interval(mins => dl);
      if jl <= now() then r.items := r.items - 'jl' - 'jp'; r := public.town_prior_set(r, now(), false); freed := true;
      else r.items := jsonb_set(r.items, '{jl}', to_jsonb(jl::text)); end if;
    end if;
    if bad = 1 and not freed then r.items := jsonb_set(r.items, '{jp}', coalesce(r.items->'jp', '{}'::jsonb) || '{"bad":1}'::jsonb); end if;
    jv := (jv - 'q') || jsonb_build_object('lp', now());
    r.items := jsonb_set(r.items, '{je}', jv);
    if freed then insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'jail', r.name || ' 幫了忙、表現良好，獲減刑提早出獄'); end if;
    perform public.town_save_r(r);
    return json_build_object('hit', hit, 'f', f, 'e', e, 'm', m, 'b', case when xid is null then 0 else b end, 'who', xname, 'dl', dl, 'freed', freed);
  end if;
  raise exception '不明的操作';
end $$;
revoke all on function public.town_jail_ev(bigint,text,text,text) from public;
grant execute on function public.town_jail_ev(bigint,text,text,text) to anon, authenticated;

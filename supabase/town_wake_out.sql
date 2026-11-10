-- 小豬鎮：在門外把睡著的朋友叫醒到門外（要在 town.sql 之後套用，可重複執行）
-- 獨立 RPC town_wake_out(rid, pin, target)：你站在他家門口（沒進屋），他在屋裡睡著 → 叫醒後他走出來站在門口（items.dr = 1），
-- 兩人在門口都能面對面互動。
-- 2026-11-10 補：他醒著待在屋裡（離線、或在休息）時也能「叫他出來」：成功率看好感（≥0 九成、−20～0 六成、< −20 三成），成功後一樣站到門口；沒好感也不用進屋，所以好感太差進不去的人也叫得出來。成功 10 分鐘一次、不肯出來擋 3 分鐘（事件 callout／calloutfail），不扣好感、心情。
-- 成功率、冷卻和「進去叫醒」（town_act 的 wakeup）一樣：25%～70% 叫不醒，叫不醒只擋 3 分鐘，成功叫醒 1 小時內不能再叫。
-- 精力不補、心情 −3、好感 −1（走 town_bond，吃每日負向上限）。他的最後動作時間（seen_at）設成現在，所以離線的人也會在門口站一陣子（60 分鐘沒動作才又回家睡），不會馬上被送回屋裡。他上線時前端看 items.wo = {f, at} 彈「X 把你叫醒了」。昏倒／住院中的人叫不醒。

create or replace function public.town_wake_out(rid bigint, pin text, target bigint) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; t public.town_residents; tn text; bd int; pc real;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if target is null or target = rid then raise exception '要選一位朋友'; end if;
  select * into t from public.town_residents where id = target and town_id = r.town_id for update;
  if not found then raise exception '找不到這位鄰居'; end if;
  if r.sleeping then raise exception '你在睡覺，先起床'; end if;
  if public.town_jailed(r) then raise exception '你被關在監獄裡'; end if;
  if r.place <> 'home:' || target then raise exception '要先走到他家門口'; end if;
  if public.town_vin(r) then raise exception '你已經在他家裡了，直接面對面就好'; end if;
  t := public.town_tick(t); tn := t.name;
  if not public.town_inside(t) then raise exception '% %', tn, case when t.place = 'home:' || target then '已經在門口了' else '不在家，在' || public.town_place_name(t.place) end; end if;
  if t.sleeping then
    -- 睡著的人：叫醒到門外
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = 'wakeup' and e.at > now() - interval '1 hour') then raise exception '剛剛才叫醒過他，等一下再來'; end if;
    if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = 'wakefail' and e.at > now() - interval '3 minutes') then raise exception '他睡得很沉，等 3 分鐘再試試'; end if;
    if (t.items->>'faint') is not null and (t.items->>'faint')::timestamptz > now() then raise exception '% 昏過去了，叫不醒', tn; end if;
    -- 越累睡越沉：精力低的人比較叫不醒（25%～70%）
    if random() < least(.7, .25 + (100 - t.energy) / 200) then
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'wakefail', r.name || ' 在門外喊 ' || tn || ' 半天，' || tn || ' 翻個身繼續睡');
      perform public.town_save_r(r);
      return json_build_object('ok', false, 'msg', tn || ' 睡得很沉，叫不醒（3 分鐘後再試）');
    end if;
    t.sleeping := false; t.fun := t.fun - 3;
    t.items := jsonb_set(jsonb_set(t.items, '{dr}', '1'::jsonb), '{wo}', jsonb_build_object('f', rid, 'at', now()));
    t.items := t.items - 'qs';
    perform public.town_save_r(t);
    -- 他可能離線很久：不重設最後動作時間的話，下一次結算（60 分鐘無動作就回家睡，town_tick）會立刻又把他送回屋裡睡著，人就不會真的出現在門外
    update public.town_residents set seen_at = now() where id = t.id;
    perform public.town_bond(r.town_id, rid, t.id, -1);
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'wakeup', r.name || ' 在門外把 ' || tn || ' 叫醒，' || tn || ' 揉著眼睛走出來');
    update public.town_residents set seen_at = now() where id = rid;
    return json_build_object('ok', true, 'msg', tn || ' 被你叫醒了，走到門口');
  end if;
  -- 醒著待在屋裡的人：喊他出來（好感決定他肯不肯）
  if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = 'callout' and e.at > now() - interval '10 minutes') then raise exception '剛剛才叫他出來過，等一下再來'; end if;
  if exists (select 1 from public.town_events e where e.actor = rid and e.target = t.id and e.kind = 'calloutfail' and e.at > now() - interval '3 minutes') then raise exception '他不想理你，等 3 分鐘再試試'; end if;
  bd := public.town_bond_get(rid, target);
  pc := case when bd >= 0 then .9 when bd >= -20 then .6 else .3 end;
  if random() >= pc then
    insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'calloutfail', r.name || ' 在 ' || tn || ' 家門口喊他出來，' || tn || ' 裝作沒聽到');
    perform public.town_save_r(r);
    return json_build_object('ok', false, 'msg', tn || ' 不想出來（3 分鐘後再試）');
  end if;
  t.items := jsonb_set(jsonb_set(t.items, '{dr}', '1'::jsonb), '{wo}', jsonb_build_object('f', rid, 'at', now()));
  perform public.town_save_r(t);
  update public.town_residents set seen_at = now() where id = t.id;   -- 離線的人也要站一陣子（理由同上）
  insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, rid, target, 'callout', r.name || ' 在門外把 ' || tn || ' 叫了出來');
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok', true, 'msg', tn || ' 開門走出來了');
end $$;
revoke all on function public.town_wake_out(bigint,text,bigint) from public;
grant execute on function public.town_wake_out(bigint,text,bigint) to anon, authenticated;

-- 小豬鎮：訪客旅人 NPC。要在 town.sql 之後套用，可重複執行。
-- 每人每天（台灣日）一位旅人，8～22 點出現在廣場（單日）或公園（雙日）；問一個選擇題，每題 2 個選項，只給心情與錢，
-- 金錢期望值 <= 0、現金不夠就擋、不欠款、角色不會死。資料 items.vz={d,a}（a = 已回答）。不建新表。
create or replace function public.town_traveler(rid bigint, pin text, op text default 'view', item text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; today text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD');
  hr int := extract(hour from now() at time zone 'Asia/Taipei')::int; dn int := extract(day from now() at time zone 'Asia/Taipei')::int;
  pl text; qi int; vz jsonb; done boolean; msg text; ok boolean;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  pl := case when dn % 2 = 1 then 'plaza' else 'park' end;
  qi := abs(hashtext(today || r.id::text)) % 4;
  vz := coalesce(r.items->'vz', '{}'::jsonb);
  done := vz->>'d' = today and coalesce((vz->>'a')::boolean, false);
  if op = 'view' then
    return json_build_object('here', hr >= 8 and hr < 22 and not done, 'place', pl, 'q', qi);
  end if;
  if op <> 'pick' then return json_build_object('error','未知動作'); end if;
  if done or hr < 8 or hr >= 22 then return json_build_object('error','旅人不在或已經聊過了'); end if;
  if public.town_jailed(r) or r.sleeping or r.place <> pl then return json_build_object('error','要在旅人那裡（醒著、不在牢裡）'); end if;
  if item not in ('0','1') then return json_build_object('error','沒有這個選項'); end if;
  if qi = 0 then
    if item = '0' then r.fun := least(100, r.fun + 8); msg := '親切地帶路，旅人道謝，心情變好';
    else r.fun := greatest(0, r.fun - 2); msg := '隨便指了個方向，有點過意不去'; end if;
  elsif qi = 1 then
    if item = '0' then
      if r.money < 200 then return json_build_object('error','錢不夠（要 €200）'); end if;
      r.money := r.money - 200;
      if random() < 0.5 then r.money := r.money + 300; r.fun := least(100, r.fun + 10); msg := '買了藏寶圖，真的挖到寶，賺回 €300';
      else r.fun := greatest(0, r.fun - 5); msg := '買了藏寶圖，什麼也沒挖到，白花 €200'; end if;
    else msg := '沒買地圖，繼續逛街'; end if;
  elsif qi = 2 then
    if item = '0' then r.fun := least(100, r.fun + 10); msg := '認真聽完旅人的故事，心情很好';
    else r.fun := greatest(0, r.fun - 3); msg := '打斷了旅人，氣氛有點尷尬'; end if;
  else
    if item = '0' then
      if r.money < 100 then return json_build_object('error','錢不夠（要 €100）'); end if;
      r.money := r.money - 100; r.fun := least(100, r.fun + 12); msg := '請旅人喝了一杯，聊得很開心';
    else msg := '婉拒了，旅人笑笑地走了'; end if;
  end if;
  r.items := jsonb_set(r.items, '{vz}', jsonb_build_object('d', today, 'a', true));
  insert into public.town_events(town_id,actor,kind,msg) values (r.town_id, rid, 'luck', r.name || ' ' || msg);
  perform public.town_save_r(r);
  return json_build_object('msg', msg);
end $$;
revoke all on function public.town_traveler(bigint,text,text,text) from public;
grant execute on function public.town_traveler(bigint,text,text,text) to anon, authenticated;

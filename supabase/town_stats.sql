-- 小豬鎮：能力屬性（力量 st、敏捷 ag、魅力 ch、智力 iq、運氣 lk）。要在 town.sql 之後套用（town.sql 含 town_at／town_agm 與各處效果），可重複執行。
-- 資料：items.at = {st,ag,ch,iq,lk, init:1 已選過, sp:已用升級點數}，缺值 = 全 0（舊角色不重置）。每項最多 5 點（town_at 夾在 0～5）。
-- 建角色後第一次進遊戲：10 點可分配（每項 0～5，也可全跳過），選完不能改（op='set'，note = "st,ag,ch,iq,lk" 五個數字）。
-- 之後每升一級活躍等級（items.al.lv）得 1 點，在「能力屬性」分配（op='spend'，note = 屬性代號）；沒有可用點數或該項已 5 點會被擋。
-- 效果（town.sql／town_mischief.sql／town_world.sql）：力量 打架／PK／擂台力量 +1／點；敏捷 巡警抓人與車禍機率 ×(1−2%)／點；魅力 好感增加 ×(1+2%)／點；
--   智力 打工薪水 +1%／點；運氣 隨機事件壞結果 1%／點改成好結果。（越獄成功率、考駕照容錯這版沒做。）
create or replace function public.town_stats(rid bigint, pin text, op text default 'view', note text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; a jsonb; ks text[] := array['st','ag','ch','iq','lk']; k text; v int[]; tot int := 0; i int; lv int; sp int; ini boolean;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  a := coalesce(r.items->'at', '{}'::jsonb);
  ini := coalesce((a->>'init')::int, 0) = 1;
  if op = 'set' then
    if ini then raise exception '能力已經選過了，之後只能用升級點數加強'; end if;
    if note is null or note = '' then v := array[0,0,0,0,0];
    else v := string_to_array(note, ',')::int[]; end if;
    if coalesce(array_length(v,1),0) <> 5 then raise exception '格式不對'; end if;
    for i in 1..5 loop
      if v[i] < 0 or v[i] > 5 then raise exception '每項 0～5 點'; end if;
      tot := tot + v[i];
    end loop;
    if tot > 10 then raise exception '最多分配 10 點'; end if;
    a := a || jsonb_build_object('st', v[1], 'ag', v[2], 'ch', v[3], 'iq', v[4], 'lk', v[5], 'init', 1);
    r.items := jsonb_set(r.items, '{at}', a);
    perform public.town_save_r(r);
  elsif op = 'spend' then
    k := note;
    if k is null or not (k = any(ks)) then raise exception '沒有這個能力'; end if;
    lv := coalesce((r.items->'al'->>'lv')::int, 1); sp := coalesce((a->>'sp')::int, 0);
    if lv - 1 - sp <= 0 then raise exception '沒有可用的點數，升級後會得到 1 點'; end if;
    if coalesce((a->>k)::int, 0) >= 5 then raise exception '這項已經是最高了'; end if;
    a := a || jsonb_build_object(k, coalesce((a->>k)::int, 0) + 1, 'sp', sp + 1, 'init', 1);
    r.items := jsonb_set(r.items, '{at}', a);
    perform public.town_save_r(r);
  elsif op <> 'view' then raise exception '不認得的操作';
  end if;
  lv := coalesce((r.items->'al'->>'lv')::int, 1); sp := coalesce((a->>'sp')::int, 0);
  return json_build_object('at', json_build_object('st', coalesce((a->>'st')::int,0), 'ag', coalesce((a->>'ag')::int,0), 'ch', coalesce((a->>'ch')::int,0), 'iq', coalesce((a->>'iq')::int,0), 'lk', coalesce((a->>'lk')::int,0)),
    'init', coalesce((a->>'init')::int, 0) = 1, 'avail', greatest(0, lv - 1 - sp));
end $$;
revoke all on function public.town_stats(bigint,text,text,text) from public;
grant execute on function public.town_stats(bigint,text,text,text) to anon, authenticated;

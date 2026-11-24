-- 小豬鎮：新手引導任務獎勵。要在 town.sql 之後套用，可重複執行，不建表。
-- 5 步各領一次（items.ob = {s:[已領步驟]}），獎金 100／100／500／300／300，合計 1300 ≤ 1500，每個角色只發一次。
-- 第 3 步（打工）伺服器驗證 items.works >= 1；其他步驟只是小額鼓勵，信任前端。角色不會死、不欠款。
create or replace function public.town_onboard(rid bigint, pin text, step int default 0) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; got jsonb; rew int;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  got := coalesce(r.items->'ob'->'s', '[]'::jsonb);
  if step = 0 then return json_build_object('got', got); end if;
  if step < 1 or step > 5 then return json_build_object('error','未知步驟'); end if;
  if got @> to_jsonb(step) then return json_build_object('got', got, 'msg', '已經領過了'); end if;
  if step = 3 and coalesce((r.items->>'works')::int, 0) < 1 then return json_build_object('error','還沒打過工'); end if;
  rew := case step when 1 then 100 when 2 then 100 when 3 then 500 when 4 then 300 else 300 end;
  r.money := r.money + rew;
  got := got || to_jsonb(step);
  r.items := jsonb_set(r.items, '{ob}', jsonb_build_object('s', got));
  perform public.town_save_r(r);
  return json_build_object('got', got, 'reward', rew, 'money', r.money);
end $$;
revoke all on function public.town_onboard(bigint,text,int) from public, anon, authenticated;
grant execute on function public.town_onboard(bigint,text,int) to anon, authenticated;

-- 小豬鎮：賭場內部（進館）補丁。要在 town_fi.sql、town_infac.sql、town_casino.sql／town_casino3.sql 之後套用，可重複執行。
-- 1) town_fi 白名單加 casino（其餘地點與原 town_fi.sql 相同）。
-- 2) town_need_in_pl 要求進館的地點加 casino。
-- 3) town_casino／town_casino_state 開頭加進館檢查（用 pg_get_functiondef 就地改，已改過就跳過）。
-- 不動 town_casino_leave 觸發器：離場（place 改變）強制換回現金的行為不變。

create or replace function public.town_fi(rid bigint, pin text, op text, pl text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  if op = 'enter' then
    if pl is null or pl not in ('cafe','restaurant','gym','jail','hospital','police','townhall','market','cinema','office','rafi','stock','arena','carshop','casino','slaughter') then raise exception '這裡還不能進去'; end if;
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

create or replace function public.town_need_in_pl(r public.town_residents, pl text) returns void language plpgsql stable as $$
begin
  if pl is null or r.place is distinct from pl then return; end if;
  if pl not in ('cafe','restaurant','gym','market','cinema','office','rafi','stock','arena','carshop','casino','slaughter') then return; end if;
  if not public.town_infac_on() then return; end if;
  if public.town_jailed(r) then return; end if;
  if public.town_fin(r) then return; end if;
  raise exception '要先進去才能用';
end $$;
revoke all on function public.town_need_in_pl(public.town_residents, text) from public, anon, authenticated;

do $$
declare fn text; def text;
begin
  foreach fn in array array['town_casino','town_casino_state'] loop
    select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn limit 1;
    if def is null then raise notice '找不到 %，先套 town_casino.sql', fn; continue; end if;
    if position('town_need_in_pl' in def) > 0 then continue; end if;
    if position('r := public.town_auth(rid, pin);' in def) = 0 then raise exception '% 找不到插入點', fn; end if;
    def := replace(def, 'r := public.town_auth(rid, pin);', 'r := public.town_auth(rid, pin);' || E'\n  ' || 'perform public.town_need_in_pl(r, ''casino'');');
    execute def;
  end loop;
end $$;

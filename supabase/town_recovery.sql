-- 小豬鎮：帳號救援（Email 綁定）。要在 town.sql 之後套用，可重複執行。
-- 驗證信由 Supabase Auth 的 Email OTP 寄出與驗證（6 位數、到期與寄信頻率在 Dashboard 設定），
-- 前端驗證成功拿到 JWT 後帶著它呼叫下面的函式；函式從 JWT 讀 Email，不信任前端傳來的 Email。
-- 資料表只存 Email 的 SHA-256 雜湊與遮蔽提示（a***@gmail.com），不存明碼。RLS 全關。
-- 一個 Email 可綁多個小鎮的角色，同一個小鎮最多一個（unique email_hash, town_id）。
-- 不動既有登入：裝置金鑰、邀請碼照舊；救援成功只是多一把裝置金鑰（town_devices，舊金鑰仍有效）。
create table if not exists public.town_recovery (
  id bigint generated always as identity primary key,
  email_hash text not null,
  hint text not null,
  town_id text not null references public.town_towns(id) on delete cascade,
  resident_id bigint not null references public.town_residents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (email_hash, town_id)
);
create index if not exists town_recovery_res on public.town_recovery(resident_id);
alter table public.town_recovery enable row level security;
revoke all on public.town_recovery from anon, authenticated;

-- 從 JWT 取出已驗證的 Email 雜湊；沒有登入或沒有 Email 回 null
create or replace function public.town_rec_eh() returns text
language plpgsql stable security definer set search_path = public as $$
declare em text;
begin
  em := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if em = '' or position('@' in em) < 2 then return null; end if;
  return encode(extensions.digest(em, 'sha256'), 'hex');
end $$;

create or replace function public.town_rec_hint() returns text
language plpgsql stable security definer set search_path = public as $$
declare em text;
begin
  em := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  return left(split_part(em, '@', 1), 1) || '***@' || split_part(em, '@', 2);
end $$;

-- 這個角色綁了沒（要裝置金鑰），回遮蔽提示
create or replace function public.town_recovery_status(rid bigint, pin text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; hints json;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  select coalesce(json_agg(hint), '[]') into hints from public.town_recovery where resident_id = rid;
  return json_build_object('ok', true, 'hints', hints);
end $$;

-- 綁定：要裝置金鑰（證明是本人）＋ Email 已驗證（JWT）
create or replace function public.town_recovery_bind(rid bigint, pin text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; eh text;
begin
  eh := public.town_rec_eh();
  if eh is null then return json_build_object('error','驗證碼還沒通過，請重新收信驗證'); end if;
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  insert into public.town_recovery(email_hash, hint, town_id, resident_id)
  values (eh, public.town_rec_hint(), r.town_id, r.id)
  on conflict (email_hash, town_id) do update set resident_id = excluded.resident_id, hint = excluded.hint;
  return json_build_object('ok', true, 'hint', public.town_rec_hint());
end $$;

-- 解除綁定（要裝置金鑰；解除這個角色綁的所有 Email）
create or replace function public.town_recovery_unbind(rid bigint, pin text) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  delete from public.town_recovery where resident_id = rid;
  return json_build_object('ok', true);
end $$;

-- 救援第一步：列出這個 Email 綁的小鎮與角色（沒綁過回空清單，與「Email 不存在」不可區分）
create or replace function public.town_recovery_list() returns json
language plpgsql security definer set search_path = public as $$
declare eh text;
begin
  eh := public.town_rec_eh();
  if eh is null then return json_build_object('error','驗證碼還沒通過，請重新收信驗證'); end if;
  return json_build_object('ok', true, 'list', (select coalesce(json_agg(q), '[]') from (
    select rc.town_id, t.name as town_name, rc.resident_id as rid, r.name as me
    from public.town_recovery rc
    join public.town_towns t on t.id = rc.town_id
    join public.town_residents r on r.id = rc.resident_id
    where rc.email_hash = eh order by r.seen_at desc limit 20) q));
end $$;

-- 救援第二步：選一個，這台裝置取得新金鑰（舊金鑰仍有效，每人最多留 6 台）
create or replace function public.town_recovery_claim(rid bigint, key text) returns json
language plpgsql security definer set search_path = public as $$
declare eh text;
begin
  eh := public.town_rec_eh();
  if eh is null then return json_build_object('error','驗證碼還沒通過，請重新收信驗證'); end if;
  if key !~ '^[A-Za-z0-9]{24,64}$' then raise exception '裝置金鑰格式不對'; end if;
  if not exists (select 1 from public.town_recovery where email_hash = eh and resident_id = rid) then
    return json_build_object('error','這個 Email 沒有綁這個角色');
  end if;
  insert into public.town_devices(resident_id, key_hash) values (rid, extensions.crypt(key, extensions.gen_salt('bf')));
  delete from public.town_devices where resident_id = rid and id not in (select id from public.town_devices where resident_id = rid order by created_at desc limit 6);
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok', true, 'town_id', (select town_id from public.town_residents where id = rid));
end $$;

revoke all on function public.town_rec_eh(), public.town_rec_hint() from public;
revoke all on function public.town_recovery_status(bigint,text), public.town_recovery_bind(bigint,text), public.town_recovery_unbind(bigint,text), public.town_recovery_list(), public.town_recovery_claim(bigint,text) from public;
grant execute on function public.town_recovery_status(bigint,text), public.town_recovery_unbind(bigint,text) to anon, authenticated;
grant execute on function public.town_recovery_bind(bigint,text), public.town_recovery_list(), public.town_recovery_claim(bigint,text) to authenticated;

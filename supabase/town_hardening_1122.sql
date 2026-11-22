-- 小豬鎮資安補強（2026-11-22 已套用到正式站；這個檔把當天的線上變更寫回 repo，可重複執行）
--   1. town_pw_ok／town_pw_bad／town_pw_blocked：只給 town_acct、town_device 內部呼叫，收掉 anon／authenticated 的執行權
--      （否則任何人都能清掉或累加別人的密碼失敗計數）
--   2. town_push_notify：觸發器函式，不該從 /rest/v1/rpc 被呼叫
--   3. town_rec_eh：Email 救援只接受「已驗證」的 Email（auth.users.email_confirmed_at 不為空，且 Email 一致）
-- 注意：Supabase 的 anon／authenticated 是預設權限，只寫 revoke ... from public 擋不住，要連 anon／authenticated 一起收
-- fb_guard、lives_guard 屬於足球員模擬器與人生模擬器，補強要寫在那兩個 repo 的 supabase/（本 repo 不處理）
-- 取代 town_recovery.sql 的 town_rec_eh

revoke all on function public.town_pw_ok(bigint, text), public.town_pw_bad(bigint, text), public.town_pw_blocked(bigint, text) from public, anon, authenticated;
revoke all on function public.town_push_notify() from public, anon, authenticated;

create or replace function public.town_rec_eh() returns text
 language plpgsql stable security definer set search_path = public
as $$
declare em text;
begin
  em := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if em = '' or position('@' in em) < 2 then return null; end if;
  -- 只接受已驗證的 Email：該 JWT 對應的 auth 使用者必須 email_confirmed_at 不為空，且 Email 一致
  if not exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null and lower(u.email) = em
  ) then return null; end if;
  return encode(extensions.digest(em, 'sha256'), 'hex');
end $$;

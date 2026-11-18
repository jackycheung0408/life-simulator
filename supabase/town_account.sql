-- 小豬鎮：角色密碼（登入第 3 步）。要在 town.sql、town_authfix.sql 之後套用，可重複執行；
--   之後若重新套用 town.sql 或 town_authfix.sql，要再套一次這個檔（它們含舊的 4 參數 town_device）。
-- 每個角色都有密碼：還沒設的角色，初始密碼 = 小鎮邀請碼；設好後邀請碼就不能再當這個角色的密碼。
-- 密碼只存 bcrypt 雜湊（town_accounts，RLS 全關）；town_device 新增 pw、cid 參數（向下相容：舊客戶端沒帶 pw，
--   角色已設密碼時被擋並提示更新遊戲）。鎖定：同一角色＋同一 client id 連錯 5 次鎖 30 分鐘；
--   同一角色每小時全域最多錯 30 次，超過限速 10 分鐘；密碼正確一律放行並清零；錯誤訊息統一「密碼不對」。
create table if not exists public.town_accounts (
  rid bigint primary key references public.town_residents(id) on delete cascade,
  pw text,
  temp boolean not null default false,
  changed_at timestamptz
);
alter table public.town_accounts enable row level security;
revoke all on public.town_accounts from anon, authenticated;
create table if not exists public.town_pw_tries (
  rid bigint not null references public.town_residents(id) on delete cascade,
  cid text not null,
  fails int not null default 0,
  locked_until timestamptz,
  hour_start timestamptz,
  hour_fails int not null default 0,
  primary key (rid, cid)
);
alter table public.town_pw_tries enable row level security;
revoke all on public.town_pw_tries from anon, authenticated;

create or replace function public.town_acct_rand(n int) returns text
language plpgsql volatile security definer set search_path = public as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; bytes bytea; res_s text := ''; i int;
begin
  bytes := extensions.gen_random_bytes(n);
  for i in 0 .. n - 1 loop
    res_s := res_s || substr(chars, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return res_s;
end $$;

-- 新密碼檢查：≥6 字、≤40、不可等於角色名稱或小鎮邀請碼
create or replace function public.town_acct_pwok(pw_in text, rname text, inv text) returns text
language plpgsql immutable set search_path = public as $$
begin
  if pw_in is null or char_length(pw_in) < 6 then return '密碼至少 6 個字'; end if;
  if char_length(pw_in) > 40 then return '密碼最多 40 個字'; end if;
  if lower(pw_in) = lower(rname) then return '密碼不能和角色名稱一樣'; end if;
  if upper(pw_in) = upper(coalesce(inv, '')) then return '密碼不能和邀請碼一樣'; end if;
  return null;
end $$;

create or replace function public.town_pw_blocked(rid bigint, cid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.town_pw_tries pt where pt.rid = town_pw_blocked.rid and pt.cid in (town_pw_blocked.cid, '*') and pt.locked_until > now())
$$;

create or replace function public.town_pw_bad(rid bigint, cid text) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin
  insert into public.town_pw_tries(rid, cid, fails, locked_until) values (rid, cid, 1, null)
    on conflict on constraint town_pw_tries_pkey do update set
      locked_until = (case when public.town_pw_tries.fails + 1 >= 5 then now() + interval '30 minutes' else public.town_pw_tries.locked_until end),
      fails = (case when public.town_pw_tries.fails + 1 >= 5 then 0 else public.town_pw_tries.fails + 1 end);
  insert into public.town_pw_tries(rid, cid, hour_start, hour_fails) values (rid, '*', now(), 1)
    on conflict on constraint town_pw_tries_pkey do update set
      hour_start = (case when public.town_pw_tries.hour_start < now() - interval '1 hour' then now() else public.town_pw_tries.hour_start end),
      locked_until = (case when public.town_pw_tries.hour_start >= now() - interval '1 hour' and public.town_pw_tries.hour_fails + 1 >= 30 then now() + interval '10 minutes' else public.town_pw_tries.locked_until end),
      hour_fails = (case when public.town_pw_tries.hour_start < now() - interval '1 hour' then 1
                         when public.town_pw_tries.hour_fails + 1 >= 30 then 0 else public.town_pw_tries.hour_fails + 1 end);
end $$;

create or replace function public.town_pw_ok(rid bigint, cid text) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin
  delete from public.town_pw_tries pt where pt.rid = rid and pt.cid <> '*';
  update public.town_pw_tries pt set hour_fails = 0, locked_until = null where pt.rid = rid and pt.cid = '*';
end $$;

-- 登入第 3 步：新裝置換一把裝置金鑰。舊客戶端只有 4 個參數時 pw 為 null。
drop function if exists public.town_device(text, text, bigint, text);
create or replace function public.town_device(tid text, invite text, rid bigint, key text, pw text default null, cid text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare t public.town_towns; hp text; cc text;
begin
  select * into t from public.town_towns tt where tt.id = upper(trim(tid)) for update;
  if not found then raise exception '找不到這個小鎮'; end if;
  if key !~ '^[A-Za-z0-9]{24,64}$' then raise exception '裝置金鑰格式不對'; end if;
  if not exists (select 1 from public.town_residents rr where rr.id = rid and rr.town_id = t.id) then raise exception '這個小鎮沒有這位居民'; end if;
  cc := left(coalesce(nullif(trim(cid), ''), 'none'), 40);
  select ac.pw into hp from public.town_accounts ac where ac.rid = rid and ac.pw is not null;
  if hp is not null then
    -- 已設密碼：只看密碼（邀請碼不再有用）
    if pw is null or pw = '' then return json_build_object('error','這個角色已設密碼，請更新遊戲後輸入密碼'); end if;
    if extensions.crypt(pw, hp) = hp then
      perform public.town_pw_ok(rid, cc);
    else
      if public.town_pw_blocked(rid, cc) then return json_build_object('error','密碼不對（嘗試太多次，請稍後再試）'); end if;
      perform public.town_pw_bad(rid, cc);
      return json_build_object('error','密碼不對');
    end if;
  else
    -- 還沒設密碼：初始密碼 = 邀請碼（輸入欄只有 pw 時也接受）
    if t.lock_until is not null and t.lock_until > now() then raise exception '這個小鎮暫時鎖住了（密碼被試錯太多次），請稍後再試，或請鎮長確認邀請碼'; end if;
    if t.lock_until is not null and t.lock_until <= now() then update public.town_towns set fails = 0, lock_until = null where id = t.id; t.fails := 0; end if;
    if upper(trim(coalesce(nullif(invite, ''), pw, ''))) <> t.invite then
      update public.town_towns set fails = fails + 1, lock_until = (case when fails + 1 >= 20 then now() + interval '10 minutes' end) where id = t.id;
      return json_build_object('error','密碼不對');
    end if;
    if t.fails > 0 then update public.town_towns set fails = 0, lock_until = null where id = t.id; end if;
  end if;
  insert into public.town_devices(resident_id, key_hash) values (rid, extensions.crypt(key, extensions.gen_salt('bf')));
  delete from public.town_devices dv where dv.resident_id = rid and dv.id not in (select d2.id from public.town_devices d2 where d2.resident_id = rid order by d2.created_at desc limit 6);
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok', true, 'has', hp is not null);
end $$;

-- 已登入用：op = status／init（第一次設密碼）／setpw（改密碼，要舊密碼）／reset（鎮長重設，回臨時密碼）
create or replace function public.town_acct(rid bigint, pin text, op text, note1 text default null, note2 text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; a public.town_accounts; t public.town_residents; msg text; newpw text; tid bigint; inv text;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','登入已失效，請重新進入小鎮'); end if;
  select * into a from public.town_accounts ac where ac.rid = r.id;
  select tt.invite into inv from public.town_towns tt where tt.id = r.town_id;
  if op = 'status' then
    return json_build_object('ok', true, 'has', a.pw is not null, 'temp', coalesce(a.temp, false));
  elsif op = 'init' then
    if a.pw is not null then return json_build_object('error','已經設過密碼了，要換請用「改密碼」'); end if;
    msg := public.town_acct_pwok(note1, r.name, inv);
    if msg is not null then return json_build_object('error', msg); end if;
    insert into public.town_accounts(rid, pw, temp, changed_at) values (r.id, extensions.crypt(note1, extensions.gen_salt('bf')), false, now())
      on conflict on constraint town_accounts_pkey do update set pw = excluded.pw, temp = false, changed_at = now();
    return json_build_object('ok', true);
  elsif op = 'setpw' then
    if a.pw is null then return json_build_object('error','還沒有密碼，請先設定密碼'); end if;
    if extensions.crypt(coalesce(note1, ''), a.pw) <> a.pw then
      if public.town_pw_blocked(r.id, 'acct') then return json_build_object('error','舊密碼錯太多次，請稍後再試'); end if;
      perform public.town_pw_bad(r.id, 'acct');
      return json_build_object('error','舊密碼不對');
    end if;
    perform public.town_pw_ok(r.id, 'acct');
    msg := public.town_acct_pwok(note2, r.name, inv);
    if msg is not null then return json_build_object('error', msg); end if;
    update public.town_accounts ac set pw = extensions.crypt(note2, extensions.gen_salt('bf')), temp = false, changed_at = now() where ac.rid = r.id;
    return json_build_object('ok', true);
  elsif op = 'reset' then
    if not r.mayor then return json_build_object('error','只有鎮長可以重設別人的密碼'); end if;
    begin tid := note1::bigint; exception when others then return json_build_object('error','找不到這位居民'); end;
    select * into t from public.town_residents tr where tr.id = tid and tr.town_id = r.town_id;
    if not found or t.id = r.id then return json_build_object('error','找不到這位居民'); end if;
    newpw := public.town_acct_rand(6);
    insert into public.town_accounts(rid, pw, temp, changed_at) values (t.id, extensions.crypt(newpw, extensions.gen_salt('bf')), true, now())
      on conflict on constraint town_accounts_pkey do update set pw = excluded.pw, temp = true, changed_at = now();
    delete from public.town_pw_tries pt where pt.rid = t.id;
    return json_build_object('ok', true, 'pw', newpw, 'name', t.name);
  end if;
  return json_build_object('error','不支援的操作');
end $$;

-- 忘記密碼（Email OTP 驗證後）：限已綁定的角色，設新密碼並取得這台裝置的金鑰。需要 town_recovery.sql。
create or replace function public.town_recovery_reset(rid bigint, key text, newpw text) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare eh text; r public.town_residents; inv text; msg text;
begin
  eh := public.town_rec_eh();
  if eh is null then return json_build_object('error','驗證碼還沒通過，請重新收信驗證'); end if;
  if key !~ '^[A-Za-z0-9]{24,64}$' then raise exception '裝置金鑰格式不對'; end if;
  if not exists (select 1 from public.town_recovery rc where rc.email_hash = eh and rc.resident_id = rid) then
    return json_build_object('error','這個 Email 沒有綁這個角色');
  end if;
  select * into r from public.town_residents rr where rr.id = rid;
  select tt.invite into inv from public.town_towns tt where tt.id = r.town_id;
  msg := public.town_acct_pwok(newpw, r.name, inv);
  if msg is not null then return json_build_object('error', msg); end if;
  insert into public.town_accounts(rid, pw, temp, changed_at) values (r.id, extensions.crypt(newpw, extensions.gen_salt('bf')), false, now())
    on conflict on constraint town_accounts_pkey do update set pw = excluded.pw, temp = false, changed_at = now();
  delete from public.town_pw_tries pt where pt.rid = r.id;
  insert into public.town_devices(resident_id, key_hash) values (r.id, extensions.crypt(key, extensions.gen_salt('bf')));
  delete from public.town_devices dv where dv.resident_id = r.id and dv.id not in (select d2.id from public.town_devices d2 where d2.resident_id = r.id order by d2.created_at desc limit 6);
  return json_build_object('ok', true, 'town_id', r.town_id);
end $$;

revoke all on function public.town_acct_rand(int), public.town_acct_pwok(text,text,text), public.town_pw_blocked(bigint,text), public.town_pw_bad(bigint,text), public.town_pw_ok(bigint,text) from public;
revoke all on function public.town_device(text,text,bigint,text,text,text), public.town_acct(bigint,text,text,text,text), public.town_recovery_reset(bigint,text,text) from public;
grant execute on function public.town_device(text,text,bigint,text,text,text), public.town_acct(bigint,text,text,text,text) to anon, authenticated;
grant execute on function public.town_recovery_reset(bigint,text,text) to authenticated;

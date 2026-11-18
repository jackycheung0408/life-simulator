-- 小豬鎮：帳號＋密碼登入（和免密碼裝置金鑰並存，沒人會被鎖在外面）。要在 town.sql 之後套用，可重複執行。
-- 帳號 = 小鎮代碼（或邀請碼）＋ 角色名稱，之後可改成自訂帳號名（同鎮唯一，2～12 字）。
-- 初始密碼：已登入的裝置在選單按「產生初始密碼」，伺服器隨機 6 碼只回傳一次，資料庫只存 bcrypt 雜湊；
--   鎮長可替居民重設成新的臨時密碼（明碼只給鎮長看一次）。臨時密碼登入後要求改成自己的。
-- 登入成功＝像新裝置一樣取得一把新裝置金鑰（town_devices，舊金鑰仍有效）；錯誤訊息一律「帳號或密碼不對」。
-- 同一角色連錯 5 次鎖 30 分鐘（只做角色層級；IP 層級擋不了）。資料表 RLS 全關。
create table if not exists public.town_accounts (
  rid bigint primary key references public.town_residents(id) on delete cascade,
  town_id text not null,
  uname text,
  pw text,
  temp boolean not null default false,
  fails int not null default 0,
  locked_until timestamptz,
  changed_at timestamptz
);
create unique index if not exists town_accounts_uname on public.town_accounts(town_id, lower(uname)) where uname is not null;
alter table public.town_accounts enable row level security;
revoke all on public.town_accounts from anon, authenticated;

-- 隨機字串（去掉容易混淆的 0 O 1 I l），n 碼
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

create or replace function public.town_acct_pwok(pw_in text, rname text) returns text
language plpgsql immutable set search_path = public as $$
begin
  if pw_in is null or length(pw_in) < 6 then return '密碼至少 6 個字'; end if;
  if length(pw_in) > 40 then return '密碼最多 40 個字'; end if;
  if lower(pw_in) = lower(rname) then return '密碼不能和角色名稱一樣'; end if;
  return null;
end $$;

-- 已登入（裝置金鑰）用：op = status／gen／setpw／setname／reset
create or replace function public.town_acct(rid bigint, pin text, op text, note1 text default null, note2 text default null) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; a public.town_accounts; t public.town_residents; msg text; nm text; newpw text; tid bigint;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','登入已失效，請重新進入小鎮'); end if;
  select * into a from public.town_accounts ac where ac.rid = r.id;
  if op = 'status' then
    return json_build_object('ok', true, 'has', a.pw is not null, 'uname', coalesce(a.uname, r.name), 'custom', a.uname is not null, 'temp', coalesce(a.temp, false));
  elsif op = 'gen' then
    if a.pw is not null then return json_build_object('error','已經有密碼了，要換請用「改密碼」'); end if;
    newpw := public.town_acct_rand(6);
    insert into public.town_accounts(rid, town_id, pw, temp, changed_at) values (r.id, r.town_id, extensions.crypt(newpw, extensions.gen_salt('bf')), true, now())
      on conflict (rid) do update set pw = excluded.pw, temp = true, fails = 0, locked_until = null, changed_at = now();
    return json_build_object('ok', true, 'pw', newpw, 'uname', coalesce(a.uname, r.name));
  elsif op = 'setpw' then
    if a.pw is null then return json_build_object('error','還沒有密碼，請先按「產生初始密碼」'); end if;
    if a.locked_until is not null and a.locked_until > now() then return json_build_object('error','舊密碼錯太多次，請 30 分鐘後再試'); end if;
    if extensions.crypt(coalesce(note1,''), a.pw) <> a.pw then
      update public.town_accounts ac set fails = case when ac.fails + 1 >= 5 then 0 else ac.fails + 1 end, locked_until = case when ac.fails + 1 >= 5 then now() + interval '30 minutes' end where ac.rid = r.id;
      return json_build_object('error','舊密碼不對');
    end if;
    msg := public.town_acct_pwok(note2, r.name);
    if msg is not null then return json_build_object('error', msg); end if;
    update public.town_accounts ac set pw = extensions.crypt(note2, extensions.gen_salt('bf')), temp = false, fails = 0, locked_until = null, changed_at = now() where ac.rid = r.id;
    return json_build_object('ok', true);
  elsif op = 'setname' then
    nm := trim(coalesce(note1, ''));
    if char_length(nm) < 2 or char_length(nm) > 12 then return json_build_object('error','帳號名要 2～12 個字'); end if;
    if nm ~ '[[:space:]@]' then return json_build_object('error','帳號名不能有空白或 @'); end if;
    if exists (select 1 from public.town_residents rr where rr.town_id = r.town_id and rr.id <> r.id and lower(rr.name) = lower(nm)) then
      return json_build_object('error','這個帳號名被用了，換一個'); end if;
    if exists (select 1 from public.town_accounts ac where ac.town_id = r.town_id and ac.rid <> r.id and lower(ac.uname) = lower(nm)) then
      return json_build_object('error','這個帳號名被用了，換一個'); end if;
    insert into public.town_accounts(rid, town_id, uname) values (r.id, r.town_id, nm)
      on conflict (rid) do update set uname = excluded.uname;
    return json_build_object('ok', true, 'uname', nm);
  elsif op = 'reset' then
    if not r.mayor then return json_build_object('error','只有鎮長可以重設別人的密碼'); end if;
    begin tid := note1::bigint; exception when others then return json_build_object('error','找不到這位居民'); end;
    select * into t from public.town_residents tr where tr.id = tid and tr.town_id = r.town_id;
    if not found or t.id = r.id then return json_build_object('error','找不到這位居民'); end if;
    newpw := public.town_acct_rand(6);
    insert into public.town_accounts(rid, town_id, pw, temp, changed_at) values (t.id, t.town_id, extensions.crypt(newpw, extensions.gen_salt('bf')), true, now())
      on conflict (rid) do update set pw = excluded.pw, temp = true, fails = 0, locked_until = null, changed_at = now();
    return json_build_object('ok', true, 'pw', newpw, 'name', t.name);
  end if;
  return json_build_object('error','不支援的操作');
end $$;

-- 未登入用：小鎮代碼或邀請碼 + 帳號（角色名稱或自訂帳號名）+ 密碼 → 新裝置金鑰
create or replace function public.town_acct_login(code text, uname text, pw text) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare tw public.town_towns; res public.town_residents; a public.town_accounts; fixed text := '帳號或密碼不對，請檢查後再試（連錯太多次會暫時鎖住）'; newkey text; dummy text;
begin
  select * into tw from public.town_towns tt where tt.id = upper(trim(code)) or tt.invite = upper(trim(code)) order by (tt.id = upper(trim(code))) desc limit 1;
  if found then
    select ac.* into a from public.town_accounts ac where ac.town_id = tw.id and lower(ac.uname) = lower(trim(uname));
    if not found then
      select ac.* into a from public.town_accounts ac join public.town_residents rr on rr.id = ac.rid
        where rr.town_id = tw.id and lower(rr.name) = lower(trim(uname));
    end if;
  end if;
  if a.rid is null or a.pw is null or (a.locked_until is not null and a.locked_until > now()) then
    dummy := extensions.crypt(coalesce(pw, ''), extensions.gen_salt('bf'));
    return json_build_object('error', fixed);
  end if;
  if extensions.crypt(coalesce(pw, ''), a.pw) <> a.pw then
    update public.town_accounts ac set fails = case when ac.fails + 1 >= 5 then 0 else ac.fails + 1 end,
      locked_until = case when ac.fails + 1 >= 5 then now() + interval '30 minutes' end where ac.rid = a.rid;
    return json_build_object('error', fixed);
  end if;
  update public.town_accounts ac set fails = 0, locked_until = null where ac.rid = a.rid;
  select * into res from public.town_residents rr where rr.id = a.rid;
  newkey := public.town_acct_rand(8) || public.town_acct_rand(8) || public.town_acct_rand(8) || public.town_acct_rand(8);
  insert into public.town_devices(resident_id, key_hash) values (res.id, extensions.crypt(newkey, extensions.gen_salt('bf')));
  delete from public.town_devices dv where dv.resident_id = res.id and dv.id not in (select d2.id from public.town_devices d2 where d2.resident_id = res.id order by d2.created_at desc limit 6);
  update public.town_residents rr set seen_at = now() where rr.id = res.id;
  return json_build_object('ok', true, 'key', newkey, 'rid', res.id, 'town_id', tw.id, 'town_name', tw.name, 'me', res.name, 'temp', a.temp);
end $$;

revoke all on function public.town_acct_rand(int), public.town_acct_pwok(text,text) from public;
revoke all on function public.town_acct(bigint,text,text,text,text), public.town_acct_login(text,text,text) from public;
grant execute on function public.town_acct(bigint,text,text,text,text), public.town_acct_login(text,text,text) to anon, authenticated;

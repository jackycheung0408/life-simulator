-- 登入鎖定修正：town_auth（長金鑰失效不鎖人）與 town_device（整鎮鎖放寬到 20 次）。
-- 內容必須與 town.sql 內的同名函式一致（node town/test.js 會比對）；可重複執行。
-- 之後若要解除現有鎖定，另外執行 town_unlock_once.sql（一次性）。

alter table public.town_towns add column if not exists fails int not null default 0;
alter table public.town_towns add column if not exists lock_until timestamptz;
create or replace function public.town_auth(rid bigint, pin text) returns public.town_residents
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare r public.town_residents; ok boolean; mins int;
begin
  select * into r from public.town_residents where id = rid for update;
  if not found then raise exception '找不到這位居民，可能已經搬走了'; end if;
  -- 先驗證憑證：比對成功就放行並清零（鎖定中也一樣）
  ok := extensions.crypt(coalesce(pin,''), r.pin_hash) = r.pin_hash
     or exists (select 1 from public.town_devices d where d.resident_id = rid and extensions.crypt(coalesce(pin,''), d.key_hash) = d.key_hash);
  if not ok then
    -- 長隨機金鑰失效：不累加、不鎖定，直接回明確錯誤（沒有狀態要保留，raise 無副作用）
    if coalesce(pin,'') !~ '^\d{4}$' then raise exception '這台裝置的登入失效了，請重新登入'; end if;
    -- 只有舊 4 碼 pin 才算暴力猜測：5 次鎖 10 分鐘
    if r.lock_until is not null and r.lock_until > now() then
      mins := greatest(1, ceil(extract(epoch from (r.lock_until - now())) / 60)::int);
      raise exception '密碼錯太多次，還要約 % 分鐘', mins;
    end if;
    update public.town_residents set fails = fails + 1, lock_until = (case when fails + 1 >= 5 then now() + interval '10 minutes' end) where id = rid;
    r.id := null; return r;
  end if;
  if r.fails > 0 or r.lock_until is not null then update public.town_residents set fails = 0, lock_until = null where id = rid; end if;
  return public.town_tick(r);
end $$;

create or replace function public.town_device(tid text, invite text, rid bigint, key text) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare t public.town_towns;
begin
  select * into t from public.town_towns where id = upper(trim(tid)) for update;
  if not found then raise exception '找不到這個小鎮'; end if;
  if t.lock_until is not null and t.lock_until > now() then raise exception '這個小鎮暫時鎖住了（邀請碼被試錯太多次），請稍後再試，或請鎮長確認邀請碼'; end if;
  if t.lock_until is not null and t.lock_until <= now() then update public.town_towns set fails = 0, lock_until = null where id = t.id; t.fails := 0; end if;
  if key !~ '^[A-Za-z0-9]{24,64}$' then raise exception '裝置金鑰格式不對'; end if;
  if upper(trim(coalesce(invite,''))) <> t.invite then
    update public.town_towns set fails = fails + 1, lock_until = (case when fails + 1 >= 20 then now() + interval '10 minutes' end) where id = t.id;
    return json_build_object('error','邀請碼不對，請問鎮長');
  end if;
  if t.fails > 0 then update public.town_towns set fails = 0, lock_until = null where id = t.id; end if;
  if not exists (select 1 from public.town_residents where id = rid and town_id = t.id) then raise exception '這個小鎮沒有這位居民'; end if;
  insert into public.town_devices(resident_id, key_hash) values (rid, extensions.crypt(key, extensions.gen_salt('bf')));
  -- 每人最多留 6 台裝置
  delete from public.town_devices where resident_id = rid and id not in (select id from public.town_devices where resident_id = rid order by created_at desc limit 6);
  update public.town_residents set seen_at = now() where id = rid;
  return json_build_object('ok', true);
end $$;

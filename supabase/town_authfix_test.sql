-- 回滾實測：town_authfix.sql 套用後貼上。最後 rollback，結果在錯誤訊息 REPORT
do $$
declare t text := 'ZZAUTH'; rid bigint; rep text := ''; i int; msg text; r public.town_residents; k text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'; m0 int; m1 int; tw public.town_towns;
begin
  insert into public.town_towns(id, name, invite) values (t, '測試鎮', 'INV123');
  insert into public.town_residents(town_id, name, slot, place, x, y, pin_hash, money) values (t, '甲', 0, 'street', 20, 7, extensions.crypt('1234', extensions.gen_salt('bf')), 3000) returning id into rid;
  insert into public.town_devices(resident_id, key_hash) values (rid, extensions.crypt(k, extensions.gen_salt('bf')));
  -- 1 失效長金鑰連打 30 次
  for i in 1..30 loop begin perform public.town_auth(rid, 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876'); exception when others then msg := sqlerrm; end; end loop;
  select * into r from public.town_residents where id = rid;
  rep := rep || format('1 失效金鑰30次 fails=%s lock=%s msg=%s; ', r.fails, r.lock_until, msg);
  r := public.town_auth(rid, k); rep := rep || '正確金鑰可登入=' || (r.id is not null) || '; ';
  -- 2 舊 4 碼 pin 錯 5 次鎖
  for i in 1..5 loop perform public.town_auth(rid, '9999'); end loop;
  select * into r from public.town_residents where id = rid;
  rep := rep || format('2 pin錯5次 fails=%s 鎖=%s; ', r.fails, r.lock_until is not null);
  begin perform public.town_auth(rid, '9999'); exception when others then rep := rep || '鎖中錯pin訊息=' || sqlerrm || '; '; end;
  begin perform public.town_auth(rid, '1234'); rep := rep || '鎖中正確4碼=通過(漏洞!); '; exception when others then rep := rep || '鎖中正確4碼=擋住(' || sqlerrm || '); '; end;
  r := public.town_auth(rid, k); rep := rep || '鎖中正確金鑰=' || (r.id is not null) || ' ';
  select * into r from public.town_residents where id = rid; rep := rep || format('清零後 fails=%s lock=%s; ', r.fails, r.lock_until);
  -- 3 town_device 錯 19 次不鎖、第 20 次鎖
  for i in 1..19 loop perform public.town_device(t, 'BAD', rid, k); end loop;
  select * into tw from public.town_towns where id = t; rep := rep || format('3 邀請碼錯19次 鎖=%s; ', tw.lock_until is not null);
  perform public.town_device(t, 'BAD', rid, k);
  select * into tw from public.town_towns where id = t; rep := rep || format('第20次 鎖=%s; ', tw.lock_until is not null);
  begin perform public.town_device(t, 'INV123', rid, k); exception when others then rep := rep || '鎖中正確邀請碼=' || sqlerrm || '; '; end;
  -- 4 一次性解鎖只清有鎖的
  update public.town_residents set fails = 2 where id = rid;
  update public.town_residents set fails = 0, lock_until = null where lock_until is not null or fails > 0;
  update public.town_towns set fails = 0, lock_until = null where lock_until is not null or fails > 0;
  select * into tw from public.town_towns where id = t; select * into r from public.town_residents where id = rid;
  rep := rep || format('4 解鎖後 town鎖=%s fails=%s 錢=%s', tw.lock_until is not null, r.fails, r.money);
  raise exception 'REPORT: %', rep;
end $$;

-- 帳號救援回滾實測：結果在錯誤訊息 REPORT。接在 town_recovery.sql 之後貼上。
do $$
declare t text := 'ZZREC'; a bigint; b bigint; rep text := ''; n int;
begin
  insert into public.town_towns(id,name,invite) values (t,'救援測試鎮','ZZREC1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash) values (t,'甲',100,0,10,10,'plaza',extensions.crypt('k1', extensions.gen_salt('bf'))) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash) values (t,'乙',100,1,10,10,'plaza',extensions.crypt('k2', extensions.gen_salt('bf'))) returning id into b;
  perform set_config('request.jwt.claims', '', true);
  rep := rep || ' 沒JWT綁定=' || public.town_recovery_bind(a,'k1')::text;
  perform set_config('request.jwt.claims', '{"email":"Test@Example.com"}', true);
  rep := rep || ' 金鑰錯=' || public.town_recovery_bind(a,'bad')::text;
  rep := rep || ' 綁甲=' || public.town_recovery_bind(a,'k1')::text;
  rep := rep || ' 同鎮改綁乙=' || public.town_recovery_bind(b,'k2')::text;
  select count(*) into n from public.town_recovery where town_id = t; rep := rep || ' 同鎮筆數=' || n || '(預期1)';
  rep := rep || ' 明碼=' || (select count(*) from public.town_recovery where email_hash like '%@%') || '(預期0)';
  rep := rep || ' list=' || public.town_recovery_list()::text;
  rep := rep || ' claim乙=' || public.town_recovery_claim(b, 'ABCDEFGHJKLMNPQRSTUVWXYZ23')::text;
  rep := rep || ' claim甲(沒綁)=' || public.town_recovery_claim(a, 'ABCDEFGHJKLMNPQRSTUVWXYZ23')::text;
  rep := rep || ' 新金鑰可登入=' || (public.town_auth(b,'ABCDEFGHJKLMNPQRSTUVWXYZ23')).id::text || ' 舊金鑰仍可=' || (public.town_auth(b,'k2')).id::text;
  perform set_config('request.jwt.claims', '{"email":"other@example.com"}', true);
  rep := rep || ' 別的Email list=' || public.town_recovery_list()::text || ' claim乙=' || public.town_recovery_claim(b,'ABCDEFGHJKLMNPQRSTUVWXYZ23')::text;
  rep := rep || ' status=' || public.town_recovery_status(b,'k2')::text;
  rep := rep || ' unbind=' || public.town_recovery_unbind(b,'k2')::text;
  rep := rep || ' 解除後=' || public.town_recovery_status(b,'k2')::text;
  raise exception 'REPORT %', rep;
end $$;

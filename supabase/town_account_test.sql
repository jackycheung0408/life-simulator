-- 帳號密碼回滾實測：結果在錯誤訊息 REPORT。接在 town_account.sql 之後貼上。
do $$
declare t text := 'ZZACC'; a bigint; b bigint; c bigint; j json; pw1 text; rep text := ''; n int; i int; kk text;
begin
  insert into public.town_towns(id,name,invite) values (t,'帳號測試鎮','ZZACC1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,mayor) values (t,'甲',100,0,10,10,'plaza',extensions.crypt('k1', extensions.gen_salt('bf')),true) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash) values (t,'乙乙',100,1,10,10,'plaza',extensions.crypt('k2', extensions.gen_salt('bf'))) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash) values (t,'丙丙',100,2,10,10,'plaza',extensions.crypt('k3', extensions.gen_salt('bf'))) returning id into c;
  j := public.town_acct(b,'k2','gen'); pw1 := j->>'pw'; rep := rep || ' 產生長度=' || length(pw1) || '(預期6)';
  rep := rep || ' 再產生=' || public.town_acct(b,'k2','gen')::text;
  rep := rep || ' 雜湊不外洩=' || (public.town_acct(b,'k2','status')::text like '%$2%');
  rep := rep || ' 資料庫是雜湊=' || ((select pw from public.town_accounts where rid=b) <> pw1);
  rep := rep || ' 改密碼舊密碼錯=' || public.town_acct(b,'k2','setpw','wrong1','abcdef1')::text;
  rep := rep || ' 新密碼太短=' || public.town_acct(b,'k2','setpw',pw1,'abc')::text;
  rep := rep || ' 密碼=名稱=' || public.town_acct(b,'k2','setpw',pw1,'乙乙乙乙乙乙')::text;
  rep := rep || ' 改密碼=' || public.town_acct(b,'k2','setpw',pw1,'mypass99')::text;
  rep := rep || ' 登入成功=' || (public.town_acct_login('ZZACC','乙乙','mypass99')->>'ok');
  j := public.town_acct_login('zzacc1','乙乙','mypass99'); kk := j->>'key';
  rep := rep || ' 邀請碼登入=' || (j->>'ok') || ' 新金鑰可用=' || ((public.town_auth(b,kk)).id is not null) || ' 舊金鑰仍可=' || ((public.town_auth(b,'k2')).id is not null);
  rep := rep || ' 金鑰長度=' || length(kk);
  rep := rep || ' 取名=' || public.town_acct(b,'k2','setname','阿乙')::text;
  rep := rep || ' 用自訂名登入=' || (public.town_acct_login('ZZACC','阿乙','mypass99')->>'ok');
  rep := rep || ' 取名撞角色名=' || public.town_acct(c,'k3','setname','甲')::text;
  rep := rep || ' 取名撞帳號名=' || public.town_acct(c,'k3','setname','阿乙')::text;
  rep := rep || ' 名稱太短=' || public.town_acct(c,'k3','setname','a')::text;
  rep := rep || ' 帳號不存在=' || public.town_acct_login('ZZACC','不存在','mypass99')::text;
  rep := rep || ' 沒設密碼的人=' || public.town_acct_login('ZZACC','丙丙','abcdef')::text;
  rep := rep || ' 小鎮不存在=' || public.town_acct_login('NOPE99','乙乙','mypass99')::text;
  for i in 1 .. 5 loop perform public.town_acct_login('ZZACC','乙乙','bad' || i); end loop;
  rep := rep || ' 連錯5次後密碼對也擋=' || public.town_acct_login('ZZACC','乙乙','mypass99')::text;
  update public.town_accounts set locked_until = now() - interval '1 minute' where rid = b;
  rep := rep || ' 鎖定到期=' || (public.town_acct_login('ZZACC','乙乙','mypass99')->>'ok');
  rep := rep || ' 非鎮長重設=' || public.town_acct(b,'k2','reset', c::text)::text;
  j := public.town_acct(a,'k1','reset', b::text); rep := rep || ' 鎮長重設=' || (j->>'ok') || ' 長度=' || length(j->>'pw');
  rep := rep || ' 重設後舊密碼失效=' || (public.town_acct_login('ZZACC','乙乙','mypass99')->>'ok' is null) || ' 臨時密碼可登入=' || (public.town_acct_login('ZZACC','乙乙',j->>'pw')->>'temp');
  rep := rep || ' 重設自己=' || public.town_acct(a,'k1','reset', a::text)::text;
  raise exception 'REPORT %', rep;
end $$;

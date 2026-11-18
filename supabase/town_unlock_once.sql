-- 一次性解鎖（只在 town_authfix.sql 套用之後執行一次）：清掉所有目前的登入鎖定
update public.town_residents set fails = 0, lock_until = null where lock_until is not null or fails > 0;
update public.town_towns set fails = 0, lock_until = null where lock_until is not null or fails > 0;

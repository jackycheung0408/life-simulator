-- 好感每日自然回復（2026-11-22 已套用到正式站；可重複執行）
-- 每天 04:10（台灣時間，= UTC 20:10）：好感低於 0 的一對，若昨天以來沒有負向互動（town_bonds.dday／dneg），
-- 就往 0 回復 +1（好感 ≤ −50 的深仇 +2）。有互動的一對不回復，所以持續吵架的不會被抵銷。
-- 為什麼要有：好感一旦壓到 −100 就沒有任何自然回復，輕度玩家一天只能互動幾次，很難挽回，新玩家容易被孤立。
-- 需要 pg_cron（town_push.sql 已啟用）。cron.schedule 同名會覆蓋舊排程，所以可重複執行。

create extension if not exists pg_cron;
select cron.schedule('town-bond-recover', '10 20 * * *',
  $c$ update public.town_bonds set score = least(0, score + case when score <= -50 then 2 else 1 end)
      where score < 0 and not (dday >= to_char((now() at time zone 'Asia/Taipei') - interval '1 day','YYYY-MM-DD') and dneg > 0) $c$);

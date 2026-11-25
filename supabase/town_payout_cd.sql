-- 小豬鎮：全民紅包 payout 冷卻修正（2026-11-25）：原本 3 天冷卻讀 town_powers.log 最近 60 筆，紀錄灌滿會把上次紅包擠掉、冷卻失效。
-- 做法：town_powers 加獨立欄位 pay_at（上次發紅包時間，缺值 = 沒發過），town_pw2_do 的 payout 分支讀它判斷 3 天、發放時寫入。
-- 用 pg_get_functiondef 就地補丁（找不到錨點整檔失敗；已補過就跳過，略過標記是只出現在新內容的字串 pay_at）；其他權力不動。
-- 順序在 town_powers2.sql 之後；重套 town_powers2.sql 後要再套一次。含一次性回填 pay_at（從 log 取最後一次 payout）。

alter table public.town_powers add column if not exists pay_at timestamptz;

do $pw$
declare def text; nd text; fn regprocedure := 'public.town_pw2_do(text,public.town_residents,text,bigint,int,text,text)'::regprocedure;
  a1 text := $q$    if num > 10 and via <> 'vote' then raise exception '動用基金超過 10%% 要交居民投票'; end if;$q$;
  a2 text := $q$    update public.town_residents set money = money + v_per where town_id = tid and seen_at > now() - interval '3 days';$q$;
begin
  def := pg_get_functiondef(fn);
  if position('pay_at' in def) > 0 then return; end if;
  if position(a1 in def) = 0 then raise exception '找不到錨點：town_pw2_do payout 冷卻'; end if;
  if position(a2 in def) = 0 then raise exception '找不到錨點：town_pw2_do payout 發放'; end if;
  nd := replace(def, a1, a1 || E'\n' || $q$    if exists (select 1 from public.town_powers where town_id = tid and pay_at is not null and pay_at > now() - interval '3 days') then
      raise exception '全民紅包 3 天內只能發一次，還要等 % 分鐘', (select ceil(extract(epoch from (pay_at + interval '3 days' - now())) / 60)::int from public.town_powers where town_id = tid); end if;$q$);
  nd := replace(nd, a2, $q$    update public.town_powers set pay_at = now() where town_id = tid;$q$ || E'\n' || a2);
  execute nd;
end $pw$;

-- 一次性回填：已發過紅包的鎮，pay_at 取 log 裡最後一次 payout
update public.town_powers p set pay_at = s.mx
  from (select pw.town_id, max((z.e->>'at')::timestamptz) as mx from public.town_powers pw, jsonb_array_elements(pw.log) as z(e) where z.e->>'k' = 'payout' group by 1) s
  where p.town_id = s.town_id and p.pay_at is null;

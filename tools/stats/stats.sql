-- 小豬鎮營運統計（唯讀，只出數量與時間，不含玩家個資）
-- 「活躍」定義：town_residents.seen_at（居民最後一次連線／同步時間）在近 7 天內。
--   活躍居民 = seen_at >= now()-7d 的居民；活躍鎮 = 至少有 1 位活躍居民的鎮。
-- 區塊：summary 總覽｜town 每鎮居民數與活躍居民數（鎮以序號代替，不出名稱／代碼）｜weekly 每週新增鎮數
with t as (
  select tw.id, tw.created_at,
         count(r.id) as residents,
         count(r.id) filter (where r.seen_at >= now() - interval '7 days') as active7
  from public.town_towns tw left join public.town_residents r on r.town_id = tw.id
  group by tw.id, tw.created_at
)
select 'summary' as section, '總鎮數' as k, count(*)::text as v1, '' as v2 from t
union all select 'summary', '近7天活躍鎮數', count(*) filter (where active7 > 0)::text, '' from t
union all select 'summary', '總居民數／近7天活躍居民', coalesce(sum(residents),0)::text, coalesce(sum(active7),0)::text from t
union all select 'town', '#' || row_number() over (order by active7 desc, residents desc, created_at)::text,
         residents::text, active7::text from t
union all select 'weekly', to_char(date_trunc('week', created_at), 'YYYY-MM-DD'), count(*)::text, '' from t
         group by date_trunc('week', created_at)
order by 1 desc, 2

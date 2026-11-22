-- 拉菲's office 職階擴大（2026-11-18）：10 階，新增 資深業務經理／業務負責人／總經理／董事長，「總監」改名「業務總監」。
-- 只含變動的函式，內容與 town.sql 一致（town/test.js 會比對）；可重複執行，接在 town.sql 之後貼上。
-- town_act 沒改：稱號仍是第 3 階（資深業務經理）起給，部門主任以上都有稱號。

create or replace function public.town_rafi_tier(n int) returns int language sql immutable as $$
  select case when n >= 900 then 9 when n >= 600 then 8 when n >= 400 then 7 when n >= 260 then 6 when n >= 150 then 5 when n >= 80 then 4 when n >= 60 then 3 when n >= 40 then 2 when n >= 15 then 1 else 0 end
$$;
create or replace function public.town_pjob_wage(k text, n int) returns int language sql immutable as $$
  select case when k = 'rafi' then (array[320,450,650,690,740,840,950,1050,1200,1400])[public.town_rafi_tier(n) + 1]
    else (case k when 'cafe' then 200 when 'rest' then 210 when 'gym' then 260 when 'shop' then 195 end) * (array[100,118,138,160,185,210,240])[public.town_pjob_tier(n) + 1] / 100 end
$$;
create or replace function public.town_pjob_name(k text, n int) returns text language sql immutable as $$
  select case k
    when 'rafi' then (array['行政專員','企劃','業務經理','資深業務經理','部門主任','協理','業務總監','業務負責人','總經理','董事長'])[public.town_rafi_tier(n) + 1]
    when 'cafe' then (array['咖啡師','咖啡師（熟手）','咖啡師（資深）','咖啡廳領班','咖啡廳副店長','咖啡廳店長','咖啡廳區經理'])[public.town_pjob_tier(n) + 1]
    when 'rest' then (array['服務生','服務生（熟手）','服務生（資深）','餐廳領班','餐廳副理','餐廳經理','餐飲總監'])[public.town_pjob_tier(n) + 1]
    when 'gym' then (array['健身教練','健身教練（熟手）','健身教練（資深）','健身房領班','健身房副理','健身房經理','健身房區總監'])[public.town_pjob_tier(n) + 1]
    when 'shop' then (array['店員','店員（熟手）','店員（資深）','超市領班','超市副店長','超市店長','超市區經理'])[public.town_pjob_tier(n) + 1] end
$$;
create or replace function public.town_place_name(p text) returns text language sql stable as $$
  select case
    when p like 'home:%' then coalesce((select name from public.town_residents where id = substr(p,6)::bigint), '空屋') || ' 家'
    when p = 'plaza' then '廣場' when p = 'restaurant' then '餐廳' when p = 'market' then '超市'
    when p = 'office' then '公司' when p = 'park' then '公園' when p = 'cafe' then '咖啡廳' when p = 'cinema' then '電影院' when p = 'gym' then '健身房' when p = 'arena' then '格鬥場' when p = 'slaughter' then '屠宰場' when p = 'rafi' then '拉菲''s office' when p = 'stock' then '證券交易所' when p = 'carshop' then '車行' when p = 'jail' then '監獄' when p = 'hospital' then '醫院' when p = 'police' then '警察局' when p = 'townhall' then '市政廳' when p = 'casino' then '賭場' else '路上' end
$$;

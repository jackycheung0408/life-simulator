-- 小豬鎮：排行榜加賭場榜「近 7 天淨贏」。要在 town_rank.sql、town_casino.sql 之後套用，可重複執行，不建表、唯讀。
-- 不動 town_casino／town_casino_state：賭場本來就把每人每天每遊戲的淨輸贏（籌碼）記在 town_casino_log，直接加總近 7 個台灣日即可，沒有新增累計欄位。
-- 本檔重建 town_rank（取代 town_rank.sql 的版本）：casino 榜只列淨贏 > 0 的前 10 名、只排本鎮、只回名字造型數值。
-- town_rank(rid,pin,kind)：kind = rich／streak／works／arcade／casino，或空白回傳全部 5 榜；每榜前 10 名，只排自己的小鎮。
--   rich = 現金 + 賭場籌碼（items.cas.ch）；streak = items.al.s；works = items.works；arcade = items.sp 各單機遊戲最高分加總。
--   每列 {id,n(名字),look(造型),v(數值)}；casino = town_casino_log 近 7 個台灣日 net 加總（只列 > 0）。
create or replace function public.town_rank(rid bigint, pin text, kind text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; res jsonb := '{}'::jsonb; k text; rows jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  foreach k in array array['rich','streak','works','arcade','casino'] loop
    if kind is not null and kind <> '' and kind <> k then continue; end if;
    select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'n', t.name, 'look', t.look, 'v', t.v) order by t.v desc, t.id), '[]'::jsonb) into rows
    from (
      select p.id, p.name, p.look,
        case k
          when 'rich' then p.money::bigint + coalesce((p.items->'cas'->>'ch')::bigint, 0)
          when 'streak' then coalesce((p.items->'al'->>'s')::bigint, 0)
          when 'works' then coalesce((p.items->>'works')::bigint, 0)
          when 'casino' then coalesce((select sum(l.net) from public.town_casino_log l where l.rid = p.id and l.day >= to_char((now() at time zone 'Asia/Taipei')::date - 6, 'YYYY-MM-DD')), 0)
          else coalesce((select sum(case when e.value ~ '^[0-9]+$' then e.value::bigint else 0 end) from jsonb_each_text(case when jsonb_typeof(p.items->'sp') = 'object' then p.items->'sp' else '{}'::jsonb end) e), 0)
        end as v
      from public.town_residents p where p.town_id = r.town_id
      order by 4 desc, p.id limit 10
    ) t where t.v > 0;
    res := res || jsonb_build_object(k, rows);
  end loop;
  return json_build_object('me', r.id, 'boards', res, 'at', extract(epoch from now())::bigint);
end $$;
revoke all on function public.town_rank(bigint,text,text) from public, anon, authenticated;
grant execute on function public.town_rank(bigint,text,text) to anon, authenticated;

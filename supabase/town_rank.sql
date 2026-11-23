-- 小豬鎮：廣場排行榜看板。要在 town.sql 之後套用，可重複執行，不建表、唯讀。
-- town_rank(rid,pin,kind)：kind = rich／streak／works／arcade，或空白回傳全部 4 榜；每榜前 10 名，只排自己的小鎮。
--   rich = 現金 + 賭場籌碼（items.cas.ch）；streak = items.al.s；works = items.works；arcade = items.sp 各單機遊戲最高分加總。
--   每列 {id,n(名字),look(造型),v(數值)}；casino 榜暫無「近 7 天淨贏」資料，先不做。
create or replace function public.town_rank(rid bigint, pin text, kind text default null) returns json
language plpgsql security definer set search_path = public as $$
declare r public.town_residents; res jsonb := '{}'::jsonb; k text; rows jsonb;
begin
  r := public.town_auth(rid, pin);
  if r.id is null then return json_build_object('error','密碼不對'); end if;
  foreach k in array array['rich','streak','works','arcade'] loop
    if kind is not null and kind <> '' and kind <> k then continue; end if;
    select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'n', t.name, 'look', t.look, 'v', t.v) order by t.v desc, t.id), '[]'::jsonb) into rows
    from (
      select p.id, p.name, p.look,
        case k
          when 'rich' then p.money::bigint + coalesce((p.items->'cas'->>'ch')::bigint, 0)
          when 'streak' then coalesce((p.items->'al'->>'s')::bigint, 0)
          when 'works' then coalesce((p.items->>'works')::bigint, 0)
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

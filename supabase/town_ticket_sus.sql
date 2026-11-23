-- 吊銷（車輛暫停）調整（2026-11-23，鎮長決定「溫和調整」）：一天違規累計門檻 6 → 10 點、暫停時間 24 小時 → 6 小時。
-- 只改 town_ticket（罰單 24 小時繳款期限、各項罰單機率與點數不變）。內容必須與 town.sql 內的 town_ticket 一致（town/test.js 比對）。
create or replace function public.town_ticket(r public.town_residents, kind text, amt int, pts int, what text) returns public.town_residents language plpgsql as $$
declare day text := to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD'); tk jsonb := coalesce(r.items->'tk','[]'::jsonb); pn int; tv jsonb := coalesce(r.items->'tv','{}'::jsonb);
begin
  if jsonb_array_length(tk) >= 12 then
    tk := jsonb_set(tk, '{11,a}', to_jsonb((tk->11->>'a')::int + amt));
  else
    tk := tk || jsonb_build_array(jsonb_build_object('id', (extract(epoch from clock_timestamp())*1000)::bigint, 'k', kind, 'a', amt, 'at', now(), 'due', now() + interval '24 hours', 'o', 0));
  end if;
  r.items := jsonb_set(r.items, '{tk}', tk);
  tv := jsonb_set(jsonb_set(tv, '{n}', to_jsonb(coalesce((tv->>'n')::int,0) + 1)), array[kind], to_jsonb(coalesce((tv->>kind)::int,0) + 1));
  r.items := jsonb_set(r.items, '{tv}', tv);
  insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'ticket', r.name || ' ' || what || '，被巡邏開了罰單 €' || amt);
  if pts > 0 then
    pn := case when coalesce(r.items->'pts'->>'d','') = day then coalesce((r.items->'pts'->>'n')::int,0) else 0 end + pts;
    r.items := jsonb_set(r.items, '{pts}', jsonb_build_object('d', day, 'n', pn));
    if pn >= 10 and (coalesce(r.items->>'sus','') = '' or (r.items->>'sus')::timestamptz < now()) then
      r.items := jsonb_set(r.items, '{sus}', to_jsonb(now() + interval '6 hours'));
      if r.items#>>'{veh,k}' is not null then r.items := jsonb_set(r.items, '{veh}', (r.items->'veh') - 'k'); end if;
      insert into public.town_events(town_id,actor,target,kind,msg) values (r.town_id, r.id, r.id, 'ticket', r.name || ' 今天違規記滿 10 點，車輛暫停使用 6 小時');
    end if;
  end if;
  return r;
end $$;

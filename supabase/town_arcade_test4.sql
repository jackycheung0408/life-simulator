do $$
declare cr json; rid bigint; rep text := ''; g json; i int; tot numeric; n int := 1200; nm text; bet int := 100; w int; ties int; k int;
begin
  cr := public.town_create('ZZARC','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false where id = rid;
  foreach nm in array array['rps:r','wheel:','dice:big','dice:3','slots:','bingo:1,5,9'] loop
    tot := 0; ties := 0;
    for i in 1..n loop
      update public.town_residents set money=100000, items=items - 'games' where id = rid;
      g := public.town_game(rid,'1234',split_part(nm,':',1),bet,nullif(split_part(nm,':',2),''));
      w := coalesce((g->'game'->>'win')::int,0); tot := tot + w; if w = bet then ties := ties + 1; end if;
      if (g->'game'->>'bet')::int <> bet then rep := rep||'BET MISSING '||g::text||E'\n'; end if;
    end loop;
    rep := rep || nm || ' RTP=' || round(tot/(n*bet),4) || ' push=' || ties || '/' || n || E'\n';
  end loop;
  -- 比大小：猜 lo 與 hi 各 n 次（K 猜 hi、A 猜 lo 不能贏，改猜另一邊）
  foreach nm in array array['hl_hi','hl_lo'] loop
    tot := 0; ties := 0;
    for i in 1..n loop
      update public.town_residents set money=100000, items=items - 'games' - 'hl' where id = rid;
      g := public.town_game(rid,'1234','hl_start',bet);
      k := (g->'game'->>'card')::int % 100;
      g := public.town_game(rid,'1234','hl_guess',0, case when k = 13 then 'lo' when k = 1 then 'hi' when nm = 'hl_hi' then 'hi' else 'lo' end);
      w := (g->'game'->>'win')::int; tot := tot + w; if w = bet then ties := ties + 1; end if;
    end loop;
    rep := rep || nm || ' RTP=' || round(tot/(n*bet),4) || ' push=' || ties || E'\n';
  end loop;
  -- 21 點：開局 21 點賠 3 倍
  update public.town_residents set money=100000, items='{"bj":{"bet":100,"p":[101,413],"d":[104]}}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','bj_stand'); rep := rep||'bj stand 21 vs dealer: '||g::text||E'\n';
  tot := 0; ties := 0;
  for i in 1..1500 loop
    update public.town_residents set money=100000, items=items - 'games' - 'bj' where id = rid;
    g := public.town_game(rid,'1234','bj_start',bet);
    if (g->'game'->>'bj')::boolean is true then tot := tot + 1; if (g->'game'->>'win')::int = 300 then ties := ties + 1; end if; end if;
  end loop;
  rep := rep||'natural 21 count='||tot||' paid x3='||ties||E'\n';
  raise exception E'REPORT5\n%', rep;
end $$;

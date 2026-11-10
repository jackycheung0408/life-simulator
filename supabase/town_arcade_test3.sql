do $$
declare cr json; rid bigint; rep text := ''; g json; i int; h jsonb; t text;
begin
  cr := public.town_create('ZZARC','甲','1234'); rid := (cr->>'resident_id')::bigint;
  update public.town_residents set place='plaza', sleeping=false where id = rid;
  -- 玩家手牌 / 莊家第一張 / 預期：用 bj_stand 的莊家補牌是隨機的，所以多跑幾次，逐次驗證 win 與雙方點數一致
  foreach t in array array['303,407,413|104','101,113|110','305,308,409|202','413,412|301','101,101,109|105'] loop
    for i in 1..30 loop
      update public.town_residents set money=100000, items=jsonb_build_object('bj', jsonb_build_object('bet',1000,'p',('['||split_part(t,'|',1)||']')::jsonb,'d',('['||split_part(t,'|',2)||']')::jsonb)) where id = rid;
      g := public.town_game(rid,'1234','bj_stand');
      if (g->'game'->>'win')::int <> case
          when public.town_bj_total((g->'game'->'d')::jsonb) > 21 or public.town_bj_total((g->'game'->'p')::jsonb) > public.town_bj_total((g->'game'->'d')::jsonb) then 2000
          when public.town_bj_total((g->'game'->'p')::jsonb) = public.town_bj_total((g->'game'->'d')::jsonb) then 1000 else 0 end
         or (g->'game'->>'bet')::int <> 1000
      then rep := rep || 'MISMATCH '||t||' '||g::text||E'\n'; end if;
    end loop;
    rep := rep || t || ' last: '||g::text||E'\n';
  end loop;
  -- 玩家 20 vs 莊家補到 17 的情形：莊家第一張 4，補牌隨機；統計 p=20 時是否有任何一次 win<2000 且莊家<=17
  -- 完整流程：開局 → 要牌 → 停牌，bet 回傳
  update public.town_residents set money=100000, items='{}'::jsonb where id = rid;
  g := public.town_game(rid,'1234','bj_start',200); rep := rep||'start: '||g::text||E'\n';
  if not (g->'game'->>'done')::boolean then g := public.town_game(rid,'1234','bj_stand',1000); rep := rep||'stand (param bet 1000 ignored): '||g::text||E'\n'; end if;
  raise exception E'REPORT4\n%', rep;
end $$;

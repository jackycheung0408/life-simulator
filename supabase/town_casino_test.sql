-- 小豬賭場（籌碼制）回滾實測：結果在錯誤訊息 REPORT。接在 town_casino.sql 之後貼上，全部回滾。
-- 檢查：直接呼叫 town_game／town_game2 玩押錢遊戲被擋、不在賭場被擋、猜拳仍在廣場、現金換籌碼 1:1、籌碼換回現金抽 5% 進位、
--       遊戲只動籌碼不動現金、沒有單注上限（只看籌碼）、籌碼不夠被擋、自我排除、回合間隔、輸贏記錄、百家樂莊家免佣的期望值、財產稅含籌碼。
do $$
declare t text := 'ZZCAS'; gname text; gn int := 0; gb int := 0; bh text; bhn int; d bigint; mg record; a bigint; b bigint; c bigint; rep text := ''; x jsonb; i int; fund0 bigint; fund1 bigint; lg record; g json;
  w6 bigint := 0; wb bigint := 0; ret numeric := 0; n int := 700; cash_before bigint; ch_before bigint;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZCAS1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',3000,1,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',100000,2,10,10,'plaza',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  -- 和咖啡集點卡（items.cs 整數）不撞名：換籌碼、玩一局後，cs 仍是 2、籌碼存在 items.cas
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丁',50000,3,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),'{"cs":2}'::jsonb) returning id into d;
  x := (public.town_casino_state(d,'x','buy',5000))::jsonb;
  perform public.town_casino(d,'x','slots',100,null);
  select items into x from public.town_residents where id = d;
  rep := rep || ' 集點卡相撞測試：cs=' || (x->>'cs') || '（應為 2） cas.ch 存在=' || ((x->'cas'->>'ch') is not null) || ' 查籌碼=' || ((public.town_casino_state(d,'x','view',null))::jsonb->>'chips') || '（應 ≥ 4900 且不是 0）';
  -- 遷移：資料庫裡預先放的壞資料（測試前 seed 的居民「壞」，cs=[2,{ch:32011},{ch:0}]）要被搬到 cas
  -- 百家樂路單：玩兩局後 cas.bh 有 2 個字元（P／B／T）；超過 72 局只留最近 72
  update public.town_residents set items = jsonb_set(items, '{cas,t}', to_jsonb((now() - interval '10 seconds')::text)) where id = d;
  perform public.town_casino(d,'x','bacc',50,'b');
  update public.town_residents set items = jsonb_set(items, '{cas,t}', to_jsonb((now() - interval '10 seconds')::text)) where id = d;
  perform public.town_casino(d,'x','bacc',50,'p');
  select items->'cas'->>'bh' into bh from public.town_residents where id = d;
  rep := rep || ' 路單=' || bh || '（應 2 個字元 PBT）';
  update public.town_residents set items = jsonb_set(items, '{cas}', (items->'cas') || jsonb_build_object('t', (now() - interval '10 seconds')::text, 'bh', repeat('B', 72))) where id = d;
  perform public.town_casino(d,'x','bacc',50,'p');
  select length(items->'cas'->>'bh') into bhn from public.town_residents where id = d;
  rep := rep || ' 超過72局後長度=' || bhn || '（應 72） state 有 bh=' || (((public.town_casino_state(d,'x','view',null))::jsonb->>'bh') is not null);
  -- 有現金沒籌碼：每一種押錢遊戲都被擋（籌碼不夠），現金一分不少；換籌碼後玩只動籌碼
  foreach gname in array array['hl_start','wheel','bj_start','dice','slots','keno','bacc','niu','dg_play'] loop
    gn := gn + 1;
    begin perform public.town_casino(b,'x',gname,500,case gname when 'wheel' then 'red' when 'dice' then 'big' when 'keno' then '1,2,3,4,5' when 'bacc' then 'p' when 'dg_play' then 'in' else 'r' end);
    exception when others then if sqlerrm like '籌碼不夠%' then gb := gb + 1; end if; end;
  end loop;
  rep := rep || ' 有現金沒籌碼：押錢遊戲 ' || gn || ' 種，被籌碼不夠擋下 ' || gb || '（應相同） 乙現金=' || (select money from public.town_residents where id = b) || '（應 3000）';
  select * into mg from public.town_residents where town_id = t and name = '壞';
  if mg.id is not null then rep := rep || ' 遷移後 cs=' || coalesce(mg.items->>'cs','無') || '（應 2） 籌碼=' || coalesce(mg.items->'cas'->>'ch','無') || '（應 32011）'; end if;
  select fund into fund0 from public.town_towns where id = t;
  begin perform public.town_game(a,'x','slots',50,null); rep := rep || ' 舊入口slots=沒擋'; exception when others then rep := rep || ' 舊入口slots=擋'; end;
  begin perform public.town_game2(a,'x','bacc',50,'p'); rep := rep || ' 舊入口bacc=沒擋'; exception when others then rep := rep || ' 舊入口bacc=擋'; end;
  begin perform public.town_game(c,'x','rps',50,'r'); rep := rep || ' 廣場猜拳=ok'; exception when others then rep := rep || ' 廣場猜拳=擋:' || sqlerrm; end;
  begin perform public.town_game(a,'x','rps',50,'r'); rep := rep || ' 賭場猜拳=沒擋'; exception when others then rep := rep || ' 賭場猜拳=擋'; end;
  begin perform public.town_casino(c,'x','slots',50,null); rep := rep || ' 在廣場玩老虎機=沒擋'; exception when others then rep := rep || ' 在廣場玩老虎機=擋'; end;
  begin perform public.town_casino(a,'x','slots',500,null); rep := rep || ' 沒籌碼玩=沒擋'; exception when others then rep := rep || ' 沒籌碼玩=擋:' || left(sqlerrm,8); end;
  x := (public.town_casino_state(a,'x','buy',300000))::jsonb;
  rep := rep || ' 換籌碼30萬 現金=' || (x->>'money') || ' 籌碼=' || (x->>'chips');
  begin perform public.town_casino_state(c,'x','buy',1000); rep := rep || ' 不在賭場換籌碼=沒擋'; exception when others then rep := rep || ' 不在賭場換籌碼=擋'; end;
  perform public.town_casino(a,'x','slots',100000,null);
  select (items->'cas'->>'ch')::bigint, money into ch_before, cash_before from public.town_residents where id = a;
  rep := rep || ' 押10萬後 現金=' || cash_before || '（應為 700000） 籌碼=' || ch_before;
  update public.town_residents set items = jsonb_set(items, '{cas,t}', to_jsonb((now() - interval '10 seconds')::text)) where id = a;
  begin perform public.town_casino(a,'x','slots', (ch_before + 1)::int, null); rep := rep || ' 押超過籌碼=沒擋'; exception when others then rep := rep || ' 押超過籌碼=擋:' || left(sqlerrm,8); end;
  begin perform public.town_casino(a,'x','slots',500,null); rep := rep || ' 連續開局=沒擋'; exception when others then rep := rep || ' 連續開局=擋:' || left(sqlerrm,8); end;
  select money into cash_before from public.town_residents where id = a;
  x := (public.town_casino_state(a,'x','sell',1001))::jsonb;
  rep := rep || ' 換回1001 現金+=' || ((x->>'money')::bigint - cash_before) || '（應為 950）';
  select fund into fund1 from public.town_towns where id = t;
  rep := rep || ' 鎮基金+=' || (fund1 - fund0) || '（含遊戲盈餘，至少 25）';
  begin perform public.town_casino_state(a,'x','sell', 2000000000); rep := rep || ' 換回超過籌碼=沒擋'; exception when others then rep := rep || ' 換回超過籌碼=擋'; end;
  select * into lg from public.town_casino_log where rid = a and game = 'slots';
  rep := rep || ' 記錄 局數=' || lg.rounds || ' 押注=' || lg.wagered;
  perform public.town_casino_state(b,'x','rest',24);
  begin perform public.town_casino_state(b,'x','buy',1000); rep := rep || ' 排除中換籌碼=沒擋'; exception when others then rep := rep || ' 排除中換籌碼=擋'; end;
  begin perform public.town_casino_state(b,'x','rest',5); rep := rep || ' 排除5小時=沒擋'; exception when others then rep := rep || ' 排除5小時=擋'; end;
  -- 百家樂莊家免佣：直接用內部函式（設旗標）玩 n 局押莊，量贏 200、贏 150（莊以 6 點贏）的次數與回報
  perform set_config('town.casino','1',true);
  update public.town_residents set money = 1000000000 where id = a;
  for i in 1..n loop
    g := public.town_game2(a,'x','bacc',100,'b');
    ret := ret + (g::jsonb->'game'->>'win')::numeric;
    if (g::jsonb->'game'->>'win')::int = 150 then w6 := w6 + 1; end if;
    if (g::jsonb->'game'->>'win')::int = 200 then wb := wb + 1; end if;
  end loop;
  rep := rep || ' 莊家免佣 ' || n || ' 局：贏200=' || wb || ' 贏150(6點)=' || w6 || ' 回報率=' || round(ret / (n * 100), 3) || '（理論 0.9857，樣本小只看趨勢）';
  rep := rep || ' 稅(現金0 籌碼200萬)=' || public.town_tax(0 + 2000000::bigint);
  raise exception 'REPORT %', rep;
end $$;

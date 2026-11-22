-- 小豬賭場回滾實測：結果在錯誤訊息 REPORT。接在 town_casino.sql（以及改過的 town_game／town_game2）之後貼上，全部回滾。
-- 檢查：直接呼叫 town_game／town_game2 玩押錢遊戲被擋、不在賭場被擋、押注上限隨財富、每日預算與淨輸上限、預算只能調低、自我排除、
--       回合間隔 3 秒、輸贏記錄、莊家盈餘 50% 進鎮基金、猜拳仍在廣場。
do $$
declare t text := 'ZZCAS'; a bigint; b bigint; c bigint; rep text := ''; x jsonb; e text; i int; fund0 bigint; fund1 bigint; lg record;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZCAS1') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into a;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'乙',3000,1,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into b;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'丙',100000,2,10,10,'plaza',extensions.crypt('x', extensions.gen_salt('bf')),'{}'::jsonb) returning id into c;
  select fund into fund0 from public.town_towns where id = t;

  -- 押注上限隨財富
  rep := rep || ' 上限(100萬)=' || public.town_casino_maxbet(1000000) || ' 上限(3000，最少 10000)=' || public.town_casino_maxbet(3000) || ' 上限(1億)=' || public.town_casino_maxbet(100000000);
  -- 直接呼叫舊入口玩押錢遊戲 => 被擋
  begin perform public.town_game(a,'x','slots',50,null); rep := rep || ' 舊入口slots=沒擋'; exception when others then rep := rep || ' 舊入口slots=擋:' || left(sqlerrm,12); end;
  begin perform public.town_game2(a,'x','bacc',50,'p'); rep := rep || ' 舊入口bacc=沒擋'; exception when others then rep := rep || ' 舊入口bacc=擋:' || left(sqlerrm,12); end;
  -- 猜拳仍在廣場、不在廣場被擋
  begin perform public.town_game(c,'x','rps',50,'r'); rep := rep || ' 廣場猜拳=ok'; exception when others then rep := rep || ' 廣場猜拳=擋:' || sqlerrm; end;
  begin perform public.town_game(a,'x','rps',50,'r'); rep := rep || ' 賭場猜拳=沒擋'; exception when others then rep := rep || ' 賭場猜拳=擋'; end;
  -- 不在賭場
  begin perform public.town_casino(c,'x','slots',50,null); rep := rep || ' 在廣場玩老虎機=沒擋'; exception when others then rep := rep || ' 在廣場玩老虎機=擋'; end;
  -- 超過財富上限的注
  begin perform public.town_casino(a,'x','slots',20000,null); rep := rep || ' 押2萬(上限' || public.town_casino_maxbet(1000000) || ')=沒擋'; exception when others then rep := rep || ' 押2萬=擋:' || left(sqlerrm,14); end;
  -- 狀態：預設預算 = 5%（100萬 => 5萬），上限 20% 起始現金 20萬
  x := (public.town_casino_state(a,'x','view'))::jsonb;
  rep := rep || ' 預算=' || (x->>'budget') || ' cap=' || (x->>'cap') || ' limit=' || (x->>'limit') || ' maxBet=' || (x->>'maxBet');
  -- 預算最少 500、不能超過 cap
  begin perform public.town_casino_state(a,'x','budget',100); rep := rep || ' 預算100=沒擋'; exception when others then rep := rep || ' 預算100=擋'; end;
  begin perform public.town_casino_state(a,'x','budget',999999); rep := rep || ' 預算超cap=沒擋'; exception when others then rep := rep || ' 預算超cap=擋'; end;
  -- 還沒玩可以調高到 cap：調到 1000 再玩
  perform public.town_casino_state(a,'x','budget',1000);
  -- 連玩老虎機（每局 50，最少間隔 3 秒：第二局應被擋）
  perform public.town_casino(a,'x','slots',500,null);
  begin perform public.town_casino(a,'x','slots',500,null); rep := rep || ' 連續開局=沒擋'; exception when others then rep := rep || ' 連續開局=擋:' || left(sqlerrm,10); end;
  -- 清掉間隔再玩，直到預算用完（預算 1000、每局 500，最多再玩 1 局就剩不到 500 左右）
  for i in 1..8 loop
    update public.town_residents set items = jsonb_set(items, '{cs,t}', to_jsonb((now() - interval '10 seconds')::text)) where id = a;
    begin perform public.town_casino(a,'x','slots',500,null); exception when others then e := sqlerrm; exit; end;
  end loop;
  rep := rep || ' 預算用完訊息=' || coalesce(left(e,30),'(沒擋)');
  -- 預算只能調低
  begin perform public.town_casino_state(a,'x','budget',5000); rep := rep || ' 玩後加碼=沒擋'; exception when others then rep := rep || ' 玩後加碼=擋'; end;
  select * into lg from public.town_casino_log where rid = a and game = 'slots';
  rep := rep || ' 記錄 局數=' || lg.rounds || ' 押注=' || lg.wagered || ' 淨輸贏=' || lg.net;
  -- 莊家盈餘進鎮基金（淨輸的 50%，向下取整）
  select fund into fund1 from public.town_towns where id = t;
  rep := rep || ' 鎮基金+=' || (fund1 - fund0) || '（淨輸 ' || greatest(0, -lg.net) || ' 的一半約 ' || floor(0.5 * greatest(0, -lg.net)) || '）';
  -- 自我排除
  perform public.town_casino_state(b,'x','rest',24);
  begin perform public.town_casino(b,'x','dice',50,'b'); rep := rep || ' 排除中玩=沒擋'; exception when others then rep := rep || ' 排除中玩=擋:' || left(sqlerrm,12); end;
  begin perform public.town_casino_state(b,'x','rest',5); rep := rep || ' 排除5小時=沒擋'; exception when others then rep := rep || ' 排除5小時=擋'; end;
  -- 小額玩家：預算至少 2000、cap 至少 500
  x := (public.town_casino_state(c,'x','view'))::jsonb;
  rep := rep || ' 丙預算=' || (x->>'budget') || ' cap=' || (x->>'cap');
  raise exception 'REPORT %', rep;
end $$;

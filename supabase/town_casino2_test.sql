-- 小豬賭場階段 B＋C 回滾實測：結果在錯誤訊息 REPORT。接在 town_casino2.sql 之後貼上，全部回滾。
-- 直接用內部函式（設交易旗標 town.casino=1，居民 money 當籌碼）抽樣各遊戲的回報率並檢查規則；樣本小只看趨勢（標準差約 0.02～0.1），理論值寫在 town_casino2.sql 檔頭。
-- SQL Editor 約 60 秒逾時（每次呼叫要驗證 bcrypt），樣本別加大；射龍門樣本小，實測 -12.8%（700 局，約 -2.2σ），精確窮舉與蒙地卡羅是 -3.7%～-4.1%，見 test_casino2.js。
do $$
declare t text := 'ZZCAS2'; a bigint; rep text := ''; g jsonb; i int; n int; ret numeric; w int; d jsonb; hands jsonb; dv jsonb; hit boolean; cnt int; nat int := 0; soft17 boolean; pay6 int := 0;
begin
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZCAS2') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf', 4)),'{}'::jsonb) returning id into a;
  perform set_config('town.casino','1',true);
  -- 沒有旗標的呼叫被擋（直接呼叫）
  perform set_config('town.casino','',true);
  begin perform public.town_cgame(a,'x','dice',50,'big'); rep := rep || ' 無旗標=沒擋'; exception when others then rep := rep || ' 無旗標=擋'; end;
  perform set_config('town.casino','1',true);
  -- 輪盤：紅色 2000 局（理論 0.9474）、單號 35:1 的賠額是 36 倍、外圍遇到 0／00 全輸
  n := 900; ret := 0; cnt := 0;
  for i in 1..n loop g := (public.town_cgame(a,'x','wheel',100,'red'))::jsonb->'game'; ret := ret + (g->>'win')::numeric; if g->>'color' = 'green' then cnt := cnt + 1; end if; end loop;
  rep := rep || ' 輪盤紅 ' || n || ' 局回報=' || round(ret / (n*100), 3) || '（理論 0.947） 0/00 出現=' || cnt || '（理論約 ' || round(n*2/38.0) || '）';
  for i in 1..300 loop g := (public.town_cgame(a,'x','wheel',100,'n:7'))::jsonb->'game'; if (g->>'win')::int > 0 then rep := rep || ' 單號中獎賠額=' || (g->>'win'); exit; end if; end loop;
  for i in 1..300 loop g := (public.town_cgame(a,'x','wheel',100,'n:00'))::jsonb->'game'; if (g->>'win')::int > 0 then rep := rep || ' 00中獎賠額=' || (g->>'win'); exit; end if; end loop;
  begin perform public.town_cgame(a,'x','wheel',100,'n:37'); rep := rep || ' 無效號碼=沒擋'; exception when others then rep := rep || ' 無效號碼=擋'; end;
  -- 骰寶：大 2000 局（0.972）、單點 6 2000 局（0.921）、任意三顆一樣（0.861）、總和 s7 2000 局（0.903）
  n := 900; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame(a,'x','dice',100,'big'))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 骰寶大=' || round(ret / (n*100), 3) || '（理論 0.972）';
  ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame(a,'x','dice',100,'6'))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 單點6=' || round(ret / (n*100), 3) || '（理論 0.921）';
  begin perform public.town_cgame(a,'x','dice',100,'s3'); rep := rep || ' 總和3=沒擋'; exception when others then rep := rep || ' 總和3=擋'; end;
  -- 老虎機 3000 局（0.9231，大獎 ×100 變異大）
  n := 1500; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame(a,'x','slots',100,null))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 老虎機=' || round(ret / (n*100), 3) || '（理論 0.923）';
  -- 基諾 2500 局（0.8447）
  n := 1000; ret := 0; for i in 1..n loop ret := ret + ((public.town_cgame(a,'x','keno',100,'3,17,29,44,70'))::jsonb->'game'->>'win')::numeric; end loop;
  rep := rep || ' 基諾=' || round(ret / (n*100), 3) || '（理論 0.845）';
  begin perform public.town_cgame(a,'x','keno',100,'1,2,3,4'); rep := rep || ' 基諾4個=沒擋'; exception when others then rep := rep || ' 基諾4個=擋'; end;
  begin perform public.town_cgame(a,'x','keno',100,'1,2,3,4,81'); rep := rep || ' 基諾81=沒擋'; exception when others then rep := rep || ' 基諾81=擋'; end;
  -- 21 點：莊家軟 17 要牌、硬 17 停牌、16 要牌；天生 21 點 6:5
  rep := rep || ' 莊家A+6(軟17)要牌=' || public.town_bj_dealer_hits('[101,206]'::jsonb) || ' 10+7(硬17)=' || public.town_bj_dealer_hits('[110,207]'::jsonb) || ' A+6+10(硬17)=' || public.town_bj_dealer_hits('[101,206,310]'::jsonb) || ' 10+6=' || public.town_bj_dealer_hits('[110,206]'::jsonb) || ' A+7(軟18)=' || public.town_bj_dealer_hits('[101,207]'::jsonb);
  n := 250;
  for i in 1..n loop
    g := (public.town_cgame(a,'x','bj_start',100,null))::jsonb->'game';
    if (g->>'bj')::boolean is true then nat := nat + 1; if (g->>'win')::int = 220 then pay6 := pay6 + 1; end if;
    else
      -- 簡單策略：16 以下要牌
      while (g->>'done')::boolean is false loop
        if public.town_bj_total(g->'p') < 17 then g := (public.town_cgame(a,'x','bj_hit',0,null))::jsonb->'game'; else g := (public.town_cgame(a,'x','bj_stand',0,null))::jsonb->'game'; end if;
      end loop;
    end if;
    ret := coalesce(ret,0) + 0;
  end loop;
  rep := rep || ' 21點 ' || n || ' 手：天生21點=' || nat || ' 其中拿回220=' || pay6 || '（其餘為莊家也 21 點平手）';
  -- 射龍門（莊家制）：不收入場費、沒有彩池；放棄免費；贏的賠額；撞柱賠 2 倍
  g := (public.town_cgame(a,'x','dg_start',0,null))::jsonb->'game';
  rep := rep || ' 龍門牌=' || (g->'gates')::text || ' 賠率=' || coalesce(g->>'pay', g->>'payHi');
  g := (public.town_cgame(a,'x','dg_play',0,'pass'))::jsonb->'game';
  rep := rep || ' 放棄=' || (g->>'pass');
  n := 700; ret := 0; w := 0;
  for i in 1..n loop
    g := (public.town_cgame(a,'x','dg_start',0,null))::jsonb->'game';
    if (g->>'same')::boolean then
      hit := (g->>'payHi') is not null and coalesce((g->>'payHi')::numeric,0) >= coalesce((g->>'payLo')::numeric,0);
      d := (public.town_cgame(a,'x','dg_play',100,case when hit then 'hi' else 'lo' end))::jsonb->'game';
    else d := (public.town_cgame(a,'x','dg_play',100,'in'))::jsonb->'game'; end if;
    ret := ret + (d->>'net')::numeric; if (d->>'mult')::int >= 2 and not (d->>'win')::boolean then w := w + 1; end if;
  end loop;
  rep := rep || ' 射龍門 ' || n || ' 局淨期望每注=' || round(ret / (n*100), 3) || '（理論約 -0.038） 撞柱輸>=2倍次數=' || w;
  raise exception 'REPORT %', rep;
end $$;

-- 老虎機累積大獎回滾實測（接在 town_casino2.sql 之後貼上）：把權重改成 7 幾乎必出，驗證獎池算式；結果在 REPORT，全部回滾
do $q$
declare f oid; d text; t text := 'ZZJP'; a bigint; g jsonb; rep text := '';
begin
  select p.oid into f from pg_proc p where p.proname = 'town_cgame' and p.pronamespace = 'public'::regnamespace;
  d := replace(pg_get_functiondef(f), 'array[1,2,3,4,5,5]', 'array[100000,1,1,1,1,1]'); execute d;
  insert into public.town_towns(id,name,invite) values (t,'測試鎮','ZZJP') on conflict do nothing;
  insert into public.town_residents(town_id,name,money,slot,x,y,place,pin_hash,items) values (t,'甲',1000000,0,10,10,'casino',extensions.crypt('x', extensions.gen_salt('bf',4)),'{}'::jsonb) returning id into a;
  perform set_config('town.casino','1',true);
  insert into public.town_jackpot(town_id, amount) values (t, 100000);
  g := (public.town_cgame(a,'x','slots',1000,null))::jsonb->'game';
  rep := rep || ' 押1000三個7：jp=' || (g->>'jp') || '（應 100010） 池剩=' || (g->>'pool') || '（應 0） win=' || (g->>'win') || '（應 200010）';
  update public.town_jackpot set amount = 100000 where town_id = t;
  g := (public.town_cgame(a,'x','slots',500,null))::jsonb->'game';
  rep := rep || ' 押500：jp=' || (g->>'jp') || '（應 50002） 池剩=' || (g->>'pool') || '（應 50003）';
  raise exception 'REPORT %', rep;
end $q$;

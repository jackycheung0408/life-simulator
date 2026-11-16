-- 小豬鎮：隨機互動／隨機惡趣味（系統幫你抽一個目前做得到的）。要在 town.sql、town_mischief.sql 之後套用，可重複執行。
-- town_roll(rid,pin,kind,target)：kind = fun（擊掌、道謝、傳訊息）或 mis（8 種惡趣味）。把候選順序洗牌，一個一個呼叫原本的 RPC（town_act／town_mischief），
-- 第一個成功的就是結果（效果、冷卻、好感都是原規則，不另外改數字）；全部都做不到就回報最後一個原因。結果多一句隨機文字 flavor。
create or replace function public.town_roll(rid bigint, pin text, kind text, target bigint) returns json
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare cand text[]; a text; res json; lastmsg text := '現在沒有可以做的'; i int; j int; tmp text; fl text[]; pickf text;
begin
  if kind = 'fun' then cand := array['greet','thank','note'];
  elsif kind = 'mis' then cand := array['splash','sticker','doorbell','fakepoop','swapseat','fakelove','snack','photo'];
  else raise exception '不認得的種類'; end if;
  for i in reverse array_length(cand,1)..2 loop
    j := 1 + floor(random() * i)::int; tmp := cand[i]; cand[i] := cand[j]; cand[j] := tmp;
  end loop;
  foreach a in array cand loop
    begin
      if kind = 'fun' then
        if a = 'note' then res := public.town_act(rid => rid, pin => pin, act => a, target => target, note => '隨機問候一下');
        else res := public.town_act(rid => rid, pin => pin, act => a, target => target); end if;
      else res := public.town_mischief(rid, pin, a, target); end if;
      fl := case kind when 'fun' then array['骰子轉出來了！','今天的運氣就是你了','系統幫你選好了','命運的安排'] else array['骰子轉出一個壞主意','系統替你想了個點子','就決定是你了','手癢的時候就該這樣'] end;
      pickf := fl[1 + floor(random() * array_length(fl,1))::int];
      return json_build_object('act', a, 'flavor', pickf, 'res', res);
    exception when others then lastmsg := SQLERRM;
    end;
  end loop;
  raise exception '%', lastmsg;
end $$;
revoke all on function public.town_roll(bigint,text,text,bigint) from public;
grant execute on function public.town_roll(bigint,text,text,bigint) to anon, authenticated;

// 主線劇情：前端 STORY 要和 supabase/town_story.sql 的 town_story_def 一致；由 test.js 呼叫
module.exports=(M,check)=>{const fs=require("fs"),sq=fs.readFileSync(__dirname+"/../supabase/town_story.sql","utf8"),js=fs.readFileSync(__dirname+"/town.js","utf8");
 const def=JSON.parse(sq.match(/select '(\[[\s\S]*?\])'::jsonb\s*\$\$/)[1]);
 check(def.length==8,"主線要 8 章");
 const i=js.indexOf("const STORY=["),j=js.indexOf("const ST_END=");const STORY=eval(js.slice(i+6,j).replace(/^STORY=/,"").replace(/;\s*$/,"").replace(/^\s*=/,""));
 check(STORY.length==8,"前端 STORY 要 8 章");
 def.forEach((c,n)=>{const f=STORY[n];check(f&&f.id==c.id&&f.nm==c.nm,"第 "+c.id+" 章名稱不一致");check(c.tk.length>=3&&c.tk.length<=5,"第 "+c.id+" 章任務要 3～5 個");
  check(f.tk.length==c.tk.length&&f.tk.every((t,k)=>t.id==c.tk[k].id),"第 "+c.id+" 章任務 id 前後端不一致");check(c.tk[c.tk.length-1].k=="ch","第 "+c.id+" 章最後要是選擇題");
  check(f.ti==c.rw.ti,"第 "+c.id+" 章稱號不一致");
  const wn=c.rw.w?(sq.match(new RegExp("'"+c.rw.w+"', 'wear', 'acc', '([^']+)'"))||[])[1]:null;check(!c.rw.w||(wn&&f.wear==wn),"第 "+c.id+" 章造型名稱不一致");
  if(c.rw.w){check(js.includes('["'+c.rw.w+'","'+wn+'",0,'),"WEAR 缺 "+c.rw.w);check(js.includes("  "+c.rw.w+":()=>{"),"造型沒有畫法 "+c.rw.w)}
  check(f.ch&&c.tk[3].o.every(k=>f.ch[k]),"第 "+c.id+" 章選擇題選項文字缺");
  check(f.intro.length>=1&&f.outro.length>=1,"第 "+c.id+" 章缺開場或結尾");
  // 文字限制：每章提示簡短
 });
 check(def.filter(c=>c.rw.w).map(c=>c.id).join()=="3,6,8","限定造型只能在第 3、6、8 章");
 check(!/money\s*[+-]|r\.money\s*:=/.test(sq.replace(/--.*$/gm,"").split("create or replace function public.town_story(")[1].split("revoke")[0].replace(/town_story_def[\s\S]*/,"")),"主線不能改錢");
 // 前端任務種類表與 SQL k 一致
 const kinds={talk:"ST_TALK",do:"ST_DO",n:"ST_N"};const get=n=>{const m=js.match(new RegExp("(?:const |,)"+n+"=(\\[[^\\]]*\\]|\\{[^}]*\\})"));return m?eval("("+m[1]+")"):null};
 const tk=get("ST_TALK"),dd=get("ST_DO"),nn=get("ST_N");
 def.forEach(c=>c.tk.forEach(t=>{if(t.k=="talk")check(tk[t.id]==t.a,"talk 任務對應不一致 "+t.id);if(t.k=="do")check(dd.includes(t.id),"do 任務沒在 ST_DO "+t.id);if(t.k=="n")check(nn.includes(t.id),"n 任務沒在 ST_N "+t.id)}));
 check(/story-1124/.test(js),"UPDATES 要有主線一則");
};

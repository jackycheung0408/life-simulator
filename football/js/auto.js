// 自動抉擇：風格、重大抉擇倒數、回顧
// 風格存 localStorage fb-autostyle（平衡／穩健／進取／隨性／依性格），重大抉擇提醒存 fb-automajor（"quiet" = 全自動不打擾）
const AUTO_STYLES=["平衡","穩健","進取","隨性","依性格"];
let autoStyle="平衡",autoQuiet=false;
try{const s=localStorage.getItem("fb-autostyle");if(AUTO_STYLES.includes(s))autoStyle=s;autoQuiet=localStorage.getItem("fb-automajor")=="quiet"}catch{}
// 從選項（[標籤,函式,副標,條件,機率]）抽出特徵
function autoFeat(o){
 const L=String(o[0]),S=String(o[2]||""),f={succ:null,gain:0,risk:0,move:0,stay:0,quit:0,dstr:0,dwage:0,nat:0,abroad:0};
 if(typeof o[4]=="number")f.succ=o[4];else{const m=S.match(/成功率約 (\d+)%/);if(m)f.succ=+m[1]/100}
 f.gain=(S.match(/↑/g)||[]).length-(S.match(/↓/g)||[]).length;
 f.risk=/風險|看運氣|兩極|失控|不一定|可能被|可能失/.test(S)?1:0;
 f.move=/^和.+談$|轉會到|同意轉去|接受，去|要求球隊放人|租借到|跟著他走|叫經紀人去談|去新球隊/.test(L)?1:0;
 f.stay=/續約|留下|忠於|留在|不換|婉拒|只想代表自己|先不簽|不轉|拒絕/.test(L)?1:0;
 f.quit=/退休|好好告別|最後一季/.test(L)?1:0;
 f.nat=/歸化|看看有哪些國家|代表(?!自己)/.test(L)&&!/只想/.test(L)?1:0;
 const p=typeof P!="undefined"?P:null,sm=S.match(/實力 (\d+)/);
 if(sm&&p&&p.clubObj)f.dstr=+sm[1]-p.clubObj.str;
 const wm=S.match(/[（(]([+-]?\d+)%[）)]/);if(wm)f.dwage=+wm[1];
 if(p&&p.clubObj&&f.move){const c=CLUBS.find(x=>L.includes(x.name));if(c){if(c.ct!=p.clubObj.ct)f.abroad=1;if(!sm)f.dstr=c.str-p.clubObj.str}}
 f.text=L+" "+S;return f}
const clampA=(x,a,b)=>Math.max(a,Math.min(b,x));
// 單一風格的分數與理由
function autoScoreOne(f,st){
 const p=P,s=f.succ,r=[];let v=0,why="";
 if(st=="穩健"){
  if(s!=null){v+=(s-.5)*3;why=`選成功率較高的（約 ${Math.round(s*100)}%）`}
  if(f.risk)v-=1;if(f.move){v-=.6}if(f.stay){v+=.7;why=why||"留在熟悉的環境，不冒險"}
  v+=.25*f.gain+clampA(f.dwage/60,-1,1)*.3;if(/安全|安心|休養|恢復|休息|穩|不回應|低調/.test(f.text))v+=.5;
  if(f.abroad)v-=.6;if(f.quit)v+=p&&p.age>=36?.6:-.3;
 }else if(st=="進取"){
  if(s!=null){v+=(1-s)*1.5-.2;why=s<.45?`選成功率 ${Math.round(s*100)}% 但回報最高`:`成功率 ${Math.round(s*100)}%，回報不錯`}
  if(f.risk)v+=.4;if(f.move){v+=.9;why=f.dstr>0?`挑戰更強的球隊（實力 +${f.dstr}）`:"想去新環境闖一闖"}if(f.stay)v-=.4;
  v+=clampA(f.dstr/10,-1.5,1.5)+.4*f.gain+clampA(f.dwage/50,-1,2)*.8;if(/挑戰|加練|硬談|證明|衝|拚|全力|拿下/.test(f.text))v+=.5;
  if(f.nat)v+=.4;if(f.quit)v+=p&&p.age>=37?.4:-.8;
 }else if(st=="依性格"){
  const m=p&&p.mind,cls=p&&((p.fam&&p.fam.cls)??p.cls);
  if(m=="好勝")return autoScoreOne(f,"進取");
  if(m=="冷靜")return autoScoreOne(f,"穩健");
  if(m=="外向"){v+=.6*f.move+.4*f.abroad+.5*f.gain;if(/名氣|粉絲|社群|代言|公開|出席|一起|聚會|派對|告白/.test(f.text))v+=.8;if(f.stay)v-=.2;if(s!=null)v+=(.5-s)*.5;why="外向的個性，愛熱鬧與新環境"}
  else{v+=.7*f.stay-.4*f.move+.5*f.gain;if(/休息|自己|專心|低調|練|家人|安靜|不回應/.test(f.text))v+=.8;if(s!=null)v+=(s-.5)*1.5;why="內向的個性，偏好熟悉與安靜"}
  if(cls!=null&&cls<=1)v+=clampA(f.dwage/50,-1,2)*.5;if(f.quit)v+=p&&p.age>=36?.5:-.4;
  return [v,(m||"")+"個性："+why.replace(/^.+?個性，?/,"")]
 }else{ // 平衡
  const a=autoScoreOne(f,"穩健"),b=autoScoreOne(f,"進取");return [(a[0]+b[0])/2+.15*f.gain,a[0]>=b[0]?a[1]:b[1]]}
 return [v,why||"綜合評估最划算"]}
function autoScore(o,st){const f=autoFeat(o),r=st=="隨性"?[0,"憑感覺隨便選"]:autoScoreOne(f,st||autoStyle);return {v:r[0]+(st=="隨性"?0:R()*.45),why:`${st=="依性格"?"":(st||autoStyle)+"風格："}${r[1]}`.replace(/^風格：/,"")}}
// 自動挑一個：隨性 = 純隨機（和以前一樣）
function autoPick(q,opts,avail){
 const pool=avail.length?avail:opts;if(autoStyle=="隨性"||pool.length==1){const o=pick(pool);return {o,why:"隨性風格：憑感覺隨便選"}}
 let best=null;for(const o of pool){const r=autoScore(o);if(!best||r.v>best.v)best={o,v:r.v,why:r.why}}return best}
// 重大抉擇：真的會改變人生的選擇才會打斷
const AUTO_IMPORTANT=/合約|轉會|報價|退休|最後一季|繼續踢|國家隊|歸化|代表|位置|外租|租借|想去什麼樣的球隊|經紀人|伴侶|想在哪|傷|手術|復出/;
function autoIsMajor(q,o){
 const f=autoFeat(o),L=String(o[0]);
 if(f.quit&&!/再踢|不退休/.test(L)&&/最後一季|繼續踢|退休/.test(q+L))return "退休";
 if(f.nat||/想代表哪個國家|足協打電話/.test(q))return f.stay?null:"歸化";
 if(f.move&&f.abroad)return "轉會到新國家";
 if(f.move&&f.dwage>=50)return "簽大合約";
 if(/合約到期|合約走到最後一年|自由球員/.test(q)&&f.move)return "拒絕續約";
 return null}
function autoRecord(q,o,why,major){
 if(!(major||AUTO_IMPORTANT.test(q)))return;const p=P;p.autoLog=p.autoLog||[];
 const cut=(s,n)=>{s=String(s).replace(/<[^>]*>/g,"");return s.length>n?s.slice(0,n-1)+"…":s};
 p.autoLog.push({age:p.age,q:cut(q,34),pick:cut(o[0],24),why:cut(why,36)});if(p.autoLog.length>40)p.autoLog.shift()}
function autoDo(q,o,why,major,isKey){
 say(`🤖 ${q.replace(/<[^>]*>/g,"")} → ${o[0]}`);autoRecord(q,o,why,major);o[1]();
 if(!toEnd&&(isKey||major))toast(`🤖 自動：選了「${o[0]}」`)}
// 重大抉擇卡片：8 秒倒數，沒按就採建議
function autoCard(q,opts,info,pk,major,avail){
 return new Promise(res=>{
  let left=8,done=false,tm=null;const sug=pk.o;
  $("mtag").textContent=`🤖 自動抉擇 · ${P.age} 歲`;$("mctx").textContent="重大抉擇：這個決定會改變你的人生";$("modal").classList.remove("hide");
  const draw=()=>{$("choice").innerHTML=`<h2 style="margin-top:10px">${q}</h2>${info?`<p class="mut">${info}</p>`:""}<p>🤖 建議：<b>${sug[0]}</b>（${major}）<br><span class="mut">${pk.why}</span></p><button class="opt" id="acYes">聽建議（${left}）</button><button class="opt" id="acNo">自己選</button>`;
   const y=$("acYes"),n=$("acNo");if(y)y.onclick=()=>fin(true);if(n)n.onclick=()=>fin(false)};
  const fin=yes=>{if(done)return;done=true;clearTimeout(tm);
   if(yes){autoDo(q,sug,pk.why,major,true);setTimeout(()=>{$("modal").classList.add("hide");try{render()}catch{}res()},200)}
   else askManual(q,opts,info).then(res)};
  const tick=()=>{if(done)return;left--;if(left<=0){fin(true);return}const y=$("acYes");if(y)y.textContent=`聽建議（${left}）`;tm=setTimeout(tick,1000)};
  draw();tm=setTimeout(tick,1000)})}
// 結局證書：自動抉擇回顧（折疊）
function autoReviewHtml(p){
 const L=p.autoLog;if(!L||!L.length)return "";const e=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
 return `<details class="auto-rv" style="margin-top:10px"><summary><b>🤖 自動抉擇回顧</b>（${L.length} 個重要決定）</summary><div class="tbl"><table><tr><th>年齡</th><th>問題</th><th>選了</th><th>理由</th></tr>${L.map(x=>`<tr><td>${x.age}</td><td style="text-align:left">${e(x.q)}</td><td style="text-align:left">${e(x.pick)}</td><td style="text-align:left">${e(x.why)}</td></tr>`).join("")}</table></div></details>`}

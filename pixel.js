// 像素風人物與家庭場景（全部用程式繪製）
// 依賴：REGION（index.html）

const SKIN={華:"#f1c9a5",日:"#f3cfae",韓:"#f3cfae",越:"#e8b98f",東南亞:"#d9a273",南亞:"#b9825a",中東:"#d4a57c",
 西非:"#6b4429",東非:"#6f472c",非洲之角:"#8a5a3a",南非:"#6b4429",中非:"#5e3b24",拉:"#d2a079",英:"#f2d0b5",歐:"#f2d0b5",斯:"#f4d6bf"};
const HAIR_POOL={英:["#3b2a1e","#7a5230","#c9a25a","#2a1d14"],歐:["#3b2a1e","#6b4a2b","#b8915a","#2a1d14"],斯:["#5a4028","#a07c4a","#3b2a1e"]};
// 用名字當種子，讓同一個人每次畫出來都一樣
function seedRand(str){let h=2166136261;for(const ch of str)h=Math.imul(h^ch.codePointAt(0),16777619);return()=>((h=Math.imul(h^h>>>15,2246822507)^Math.imul(h^h>>>13,3266489909))>>>0)/4294967296}
function look(name,sex,raw){
 const r=seedRand(name+raw),reg=REGION(raw);
 const shirts=["#c0392b","#2e86ab","#27ae60","#8e44ad","#e67e22","#16a085","#d35400","#34495e","#e84393"];
 return {skin:SKIN[reg]||"#d9a273",hair:(HAIR_POOL[reg]?HAIR_POOL[reg][Math.floor(r()*HAIR_POOL[reg].length)]:"#1d1611"),
  shirt:shirts[Math.floor(r()*shirts.length)],pants:["#2c3e50","#3d3d3d","#5d4037","#1f3a5f"][Math.floor(r()*4)],
  long:sex=="女"?r()<.8:r()<.08,glasses:r()<.15,sex};
}
// 畫一個人：x 為腳底中心，y 為地面；age 決定身高與造型
function drawPerson(g,x,y,lk,age){
 const P=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+px),Math.round(y-py-h),w,h)};
 const baby=age<3,child=age<13,elder=age>=65;
 const H=baby?7:age<7?11:child?14:age<18?17:elder?17:18; // 總高度（像素）
 const hair=elder?"#cfcfcf":age>=50&&lk.hair!="#cfcfcf"?blend(lk.hair,"#bdbdbd",.35):lk.hair;
 const head=baby?4:5,bodyH=Math.round((H-head)*.5),legH=H-head-bodyH;
 const hw=head,bw=baby?4:child?5:6;
 // 腿
 if(!baby){P(-bw/2+1,0,2,legH,lk.pants);P(bw/2-3,0,2,legH,lk.pants)}
 // 身體與手臂
 const by=baby?0:legH;
 P(-bw/2,by,bw,bodyH,baby?"#f6e7b0":lk.shirt);
 if(!baby){P(-bw/2-1,by+1,1,bodyH-1,lk.skin);P(bw/2,by+1,1,bodyH-1,lk.skin)}
 if(elder&&age>=78)P(bw/2+1,0,1,by+bodyH-1,"#8d6e63"); // 拐杖
 // 頭
 const hy=by+bodyH;
 P(-hw/2,hy,hw,head,lk.skin);
 // 頭髮
 if(!(baby&&age<1)){P(-hw/2,hy+head-1,hw,1,hair);P(-hw/2,hy+head-2,1,1,hair);P(hw/2-1,hy+head-2,1,1,hair);
  if(lk.long&&!baby){P(-hw/2-1,hy+1,1,head-1,hair);P(hw/2,hy+1,1,head-1,hair)}}
 // 眼睛
 const eye=baby?"#3b2a1e":"#1b1b1b";P(-hw/2+1,hy+(baby?1:2),1,1,eye);P(hw/2-2,hy+(baby?1:2),1,1,eye);
 if(lk.glasses&&age>=12){g.fillStyle="#555";g.fillRect(Math.round(x-hw/2),Math.round(y-hy-3),hw,1)}
 return H;
}
function blend(a,b,t){const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=p(a),B=p(b);return "#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("")}

// 房子
function drawHome(g,kind,W,G,night){
 const win=night?"#ffd76a":"#bfe3ff";
 if(kind=="apartment"){g.fillStyle="#6d6875";g.fillRect(8,G-62,46,62);for(let r=0;r<6;r++)for(let c=0;c<4;c++){g.fillStyle=(r*4+c)%3?win:"#3d3a44";g.fillRect(13+c*10,G-57+r*10,5,5)}g.fillStyle="#3d3a44";g.fillRect(26,G-10,8,10)}
 else if(kind=="house"){g.fillStyle="#e9c46a";g.fillRect(10,G-30,44,30);g.fillStyle="#a23e48";for(let i=0;i<14;i++)g.fillRect(6+i*1.5,G-30-i,52-i*3,1);g.fillStyle=win;g.fillRect(16,G-22,8,7);g.fillRect(40,G-22,8,7);g.fillStyle="#6b3e26";g.fillRect(28,G-14,8,14)}
 else if(kind=="hut"){g.fillStyle="#b08968";g.fillRect(12,G-20,36,20);g.fillStyle="#7f5539";for(let i=0;i<12;i++)g.fillRect(8+i*1.7,G-20-i,44-i*3.4,1);g.fillStyle="#3e2c1c";g.fillRect(26,G-11,8,11)}
 else{ // 國外的城市
  g.fillStyle="#5c677d";g.fillRect(4,G-70,22,70);g.fillRect(30,G-50,24,50);g.fillStyle="#7d8597";g.fillRect(58,G-36,14,36);
  for(let r=0;r<12;r++){g.fillStyle=r%2?win:"#3d3a44";g.fillRect(8,G-66+r*5,3,2);g.fillRect(17,G-66+r*5,3,2)}
  for(let r=0;r<8;r++){g.fillStyle=r%3?win:"#3d3a44";g.fillRect(34,G-46+r*5,3,2);g.fillRect(44,G-46+r*5,3,2)}}
}

// 家庭場景：天空、地面、房子、家人
function drawScene(cv,L){
 const W=cv.width,Hh=cv.height,G=Hh-12,g=cv.getContext("2d");g.imageSmoothingEnabled=false;
 const night=(L.age%4)==3,f=L.fam||{};
 const sky=g.createLinearGradient(0,0,0,G);sky.addColorStop(0,night?"#1b2340":"#8ecae6");sky.addColorStop(1,night?"#3a3f6b":"#d9f0ff");
 g.fillStyle=sky;g.fillRect(0,0,W,G);
 if(night){g.fillStyle="#fff";for(let i=0;i<18;i++)g.fillRect((i*53)%W,(i*29)%(G-40),1,1);g.fillStyle="#f6f1d5";g.fillRect(W-30,10,8,8)}
 else{g.fillStyle="#ffd166";g.fillRect(W-30,10,9,9);g.fillStyle="#fff";g.fillRect(60,16,18,4);g.fillRect(64,13,10,3);g.fillRect(150,24,22,4);g.fillRect(155,21,12,3)}
 const rural=!(f.urban||L.moved||L.abroad);
 g.fillStyle=rural?"#6a994e":"#8d99ae";g.fillRect(0,G,W,Hh-G);g.fillStyle=rural?"#a7c957":"#adb5bd";g.fillRect(0,G,W,2);
 if(!rural){g.fillStyle="#edf2f4";for(let i=0;i<W;i+=16)g.fillRect(i,G+6,8,1)}
 drawHome(g,L.abroad?"abroad":L.house?"house":rural?"hut":"apartment",W,G,night);
 if(rural){g.fillStyle="#386641";g.fillRect(W-58,G-18,10,12);g.fillRect(W-60,G-14,14,6);g.fillStyle="#6b4226";g.fillRect(W-54,G-6,2,6)}
 // 家人排成一列：父母、兄弟姊妹、自己、伴侶、孩子
 const row=[];const add=(n,s,a)=>row.push({lk:look(n,s,L.raw),a});
 if((L.age<25||L.caregiver)&&f.father){if(f.father.alive)add(f.father.name,"男",f.father.age+L.age);if(f.mother.alive)add(f.mother.name,"女",f.mother.age+L.age)}
 if(L.age<20&&f.sibs)f.sibs.filter(s=>!s.married).forEach((s,i)=>add(L.name+"sib"+i,s.sex,s.age+L.age));
 row.push({lk:look(L.name,L.sex,L.raw),a:L.age,me:1});
 if(L.partner)add(L.partnerName||L.name+"p",L.sex=="男"?"女":"男",L.age);
 for(let i=0;i<Math.min(L.kids,4);i++)add(L.name+"k"+i,i%2?"女":"男",Math.max(1,L.age-26-i*2));
 let x=70;const gap=Math.min(12,(W-80)/Math.max(1,row.length));
 for(const p of row){const h=drawPerson(g,x,G,p.lk,p.a);if(p.me){g.fillStyle="#ff6b6b";g.fillRect(Math.round(x)-1,G-h-5,3,2)}x+=gap}
}

// 本人照片：放大的半身像
function drawAvatar(cv,L){
 const g=cv.getContext("2d"),W=cv.width;g.imageSmoothingEnabled=false;g.clearRect(0,0,W,W);
 g.fillStyle="#2b2d42";g.fillRect(0,0,W,W);
 const lk=look(L.name,L.sex,L.raw);
 g.save();g.scale(2,2);drawPerson(g,W/4,W/2+4,lk,L.age);g.restore();
 if(!L.alive){g.fillStyle="rgba(0,0,0,.45)";g.fillRect(0,0,W,W)}
}

// 液晶電子寵物風格的本人照片：20×20 點陣、三階灰綠、看得到格線，會輕輕上下晃
const LCD_N=20,LCD_C=4,LCD_OFF="#a3ad72",LCD_TONES=["#8c9762","#4d5536","#232816"];
let lcdKey="";
function drawAvatarLCD(cv,L){
 const frame=L.alive?Math.floor(performance.now()/600)%2:0,key=`${L.name}|${L.age}|${frame}|${L.alive}`;
 if(key===lcdKey)return;lcdKey=key;
 const W=LCD_N*LCD_C;if(cv.width!==W){cv.width=W;cv.height=W}
 const off=document.createElement("canvas");off.width=off.height=LCD_N;const og=off.getContext("2d");
 drawPerson(og,LCD_N/2,LCD_N-1-frame,look(L.name,L.sex,L.raw),L.age);
 const px=og.getImageData(0,0,LCD_N,LCD_N).data,g=cv.getContext("2d");
 g.fillStyle="#9aa66a";g.fillRect(0,0,W,W);
 for(let y=0;y<LCD_N;y++)for(let x=0;x<LCD_N;x++){
  const i=(y*LCD_N+x)*4,a=px[i+3];
  let c=LCD_OFF;
  if(a>0){const lum=.3*px[i]+.59*px[i+1]+.11*px[i+2];c=LCD_TONES[lum>170?0:lum>90?1:2]}
  g.fillStyle=c;g.fillRect(x*LCD_C,y*LCD_C,LCD_C-1,LCD_C-1);
 }
 // 地面線
 g.fillStyle=LCD_TONES[2];for(let x=0;x<LCD_N;x+=2)g.fillRect(x*LCD_C,(LCD_N-1)*LCD_C,LCD_C-1,LCD_C-1);
}

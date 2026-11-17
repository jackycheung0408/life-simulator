/* 小豬鎮 8-bit 音效與音樂：Web Audio 程式合成（方波／三角波／噪音），免版權、無音檔。
   SFX.play(name) SFX.music(on) SFX.vol(0~2) SFX.mute(b)；設定存 localStorage town-snd。
   第一次點擊／觸控才解鎖 AudioContext，之前呼叫一律靜默略過。 */
(function(){
var C=null,M=null,GS=null,GM=null,cfg={s:1,m:0,v:1},want=0,hid=0,last={},mt=null,step=0,nextT=0,ok=0;
try{var j=JSON.parse(localStorage.getItem("town-snd")||"null");if(j)cfg={s:j.s==0?0:1,m:j.m?1:0,v:j.v>=0&&j.v<=2?j.v:1}}catch(e){}
function save(){try{localStorage.setItem("town-snd",JSON.stringify(cfg))}catch(e){}}
var VOL=[.35,.6,1];
function mk(){if(C)return C;var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
 try{C=new A();M=C.createGain();GS=C.createGain();GM=C.createGain();GS.connect(M);GM.connect(M);M.connect(C.destination);lv()}catch(e){C=null}return C}
function lv(){if(!M)return;M.gain.value=hid?0:VOL[cfg.v];GS.gain.value=cfg.s?.5:0;GM.gain.value=cfg.m?.16:0}
function run(){return C&&C.state=="running"&&!hid}
var NB=null;function nbuf(){if(!NB){NB=C.createBuffer(1,C.sampleRate*.5,C.sampleRate);var d=NB.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NB}
// 音：t 開始秒、f 頻率、d 長度、type、v 音量、f2 滑到的頻率、g 輸出節點
function tone(t,f,d,ty,v,f2,g){var o=C.createOscillator(),a=C.createGain();o.type=ty||"square";o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(v||.3,t+.008);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(g||GS);o.start(t);o.stop(t+d+.02)}
function nz(t,d,v,fq,g,q){var s=C.createBufferSource(),f=C.createBiquadFilter(),a=C.createGain();s.buffer=nbuf();f.type="bandpass";f.frequency.value=fq||2000;f.Q.value=q||1;
 a.gain.setValueAtTime(v||.3,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(a);a.connect(g||GS);s.start(t);s.stop(t+d+.02)}
function arp(t,fs,dt,ty,v,d){fs.forEach(function(f,i){tone(t+i*dt,f,d||dt*1.6,ty,v)})}
var N={c4:262,e4:330,g4:392,a4:440,c5:523,e5:659,g5:784,c6:1047};
// 每個 ≤ 0.4 秒
var S={
 click:function(t){tone(t,880,.05,"square",.14,1320)},
 step:function(t){nz(t,.05,.12,500+Math.random()*300,0,.8)},
 door:function(t){tone(t,180,.12,"triangle",.3,90);nz(t+.1,.1,.12,700)},
 coin:function(t){tone(t,988,.07,"square",.2);tone(t+.07,1319,.22,"square",.2)},
 pay:function(t){tone(t,660,.08,"square",.16,440);tone(t+.08,440,.14,"square",.16,330)},
 levelup:function(t){arp(t,[N.c5,N.e5,N.g5,N.c6],.08,"square",.2,.12);tone(t+.32,N.c6,.08,"triangle",.2)},
 quest:function(t){arp(t,[N.g4,N.c5,N.e5],.09,"square",.18,.14);tone(t+.3,N.g5,.1,"square",.18)},
 error:function(t){tone(t,130,.2,"square",.18,95)},
 toast:function(t){tone(t,1175,.06,"triangle",.2);tone(t+.06,1568,.08,"triangle",.16)},
 work_desk:function(t){for(var i=0;i<5;i++)nz(t+i*.07,.03,.2,3000+i*200,0,3)},
 work_cafe:function(t){nz(t,.3,.13,1400,0,.6);tone(t+.2,520,.1,"triangle",.18)},
 work_serve:function(t){tone(t,880,.04,"square",.1);nz(t+.08,.06,.15,1200);tone(t+.2,1320,.1,"triangle",.16)},
 work_lift:function(t){tone(t,110,.1,"triangle",.3,70);tone(t+.15,90,.1,"triangle",.3,60);nz(t+.15,.1,.2,300)},
 work_scan:function(t){tone(t,1760,.06,"square",.14);tone(t+.1,2093,.12,"square",.12)},
 eat:function(t){for(var i=0;i<3;i++){nz(t+i*.1,.05,.22,900+i*100,0,2);tone(t+i*.1,260,.05,"triangle",.12)}},
 zzz:function(t){tone(t,330,.16,"triangle",.14);tone(t+.16,262,.16,"triangle",.12);tone(t+.32,196,.08,"triangle",.1)},
 hit:function(t){nz(t,.12,.4,900,0,.5);tone(t,150,.12,"square",.22,50)},
 item:function(t){arp(t,[N.e5,N.g5,N.c6],.06,"square",.16,.1)},
 msg:function(t){tone(t,N.e5,.07,"triangle",.2);tone(t+.1,N.a4,.12,"triangle",.2)},
 open:function(t){tone(t,520,.05,"square",.1,780)},
 close:function(t){tone(t,780,.05,"square",.1,520)},
 zombie:function(t){tone(t,110,.3,"square",.14,70);tone(t+.1,98,.28,"triangle",.14,60)}
};
var NAMES=Object.keys(S);
function play(n,force){if(!cfg.s&&!force||!run()||!S[n])return;var now=performance.now();if(last[n]&&now-last[n]<80)return;last[n]=now;try{S[n](C.currentTime+.01)}catch(e){}}
// ── 音樂：白天輕快、夜間（台灣 20～6 點）安靜，用 setInterval 排音符
var CH=[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],ROOT=48,MEL=[7,9,12,9,7,4,7,-1,9,12,14,12,9,7,9,-1];
var PEN=[0,3,5,7,10,12];
function night(){var h=(new Date().getUTCHours()+8)%24;return h>=20||h<6}
function fr(s){return 440*Math.pow(2,(s-69)/12)}
function sched(){if(!run()||!cfg.m)return;var nt=night();
 while(nextT<C.currentTime+.3){var t=Math.max(nextT,C.currentTime+.02),i=step++,bar=(i>>3)&3,ch=CH[bar];
  if(nt){if(i%4==0)tone(t,fr(ROOT+12+ch[(i>>2)%3]),1.1,"triangle",.5,0,GM);if(i%16==8)tone(t,fr(ROOT+24+PEN[(i*7)%6]),1.4,"triangle",.3,0,GM)}
  else{var m=MEL[i%16];if(m>=0)tone(t,fr(ROOT+12+m),.2,"square",.32,0,GM);
   if(i%2==0)tone(t,fr(ROOT-12+ch[0]),.22,"triangle",.6,0,GM);
   if(i%8==4)tone(t,fr(ROOT+ch[1]),.4,"triangle",.3,0,GM)}
  nextT+=nt?.6:.25}}
function mstart(){if(mt||!run()||!cfg.m)return;nextT=C.currentTime+.05;step=0;mt=setInterval(sched,120)}
function mstop(){if(mt){clearInterval(mt);mt=null}}
function unlock(){if(!mk())return;var p=C.resume&&C.resume();var go=function(){ok=1;lv();if(cfg.m)mstart()};if(p&&p.then)p.then(go,function(){});else go()}
["pointerdown","touchend","keydown","mousedown"].forEach(function(e){addEventListener(e,function(){if(!ok||(C&&C.state!="running"))unlock()},{passive:true,capture:true})});
addEventListener("click",function(e){var b=e.target&&e.target.closest&&e.target.closest("button");if(b&&!b.disabled&&!b.classList.contains("poor"))play("click")},true);
document.addEventListener("visibilitychange",function(){hid=document.hidden?1:0;lv();if(hid){mstop();try{C&&C.suspend()}catch(e){}}else if(C){var p=C.resume();(p&&p.then?p:Promise.resolve()).then(function(){if(cfg.m)mstart()},function(){})}});
// 彈窗開關
try{var md=document.getElementById("modal");if(md)new MutationObserver(function(){var h=md.classList.contains("hide");if(h!==md._h){md._h=h;if(md._i)play(h?"close":"open");md._i=1}}).observe(md,{attributes:true,attributeFilter:["class"]})}catch(e){}
var ERR=/不能|不夠|不足|失敗|連不上|走不到|擋|被關|沒有/,MSG=/訊息|留言|傳給/;
window.SFX={
 play:play,names:NAMES,
 music:function(on){cfg.m=on?1:0;save();lv();if(cfg.m)mstart();else mstop()},
 sound:function(on){cfg.s=on?1:0;save();lv()},
 vol:function(n){cfg.v=Math.max(0,Math.min(2,n|0));save();lv()},
 mute:function(b){hid=b?1:0;lv();if(b)mstop();else if(cfg.m)mstart()},
 get:function(){return{s:cfg.s,m:cfg.m,v:cfg.v}},
 toast:function(t){t=String(t||"");play(ERR.test(t)?"error":/任務/.test(t)&&/完成|領/.test(t)?"quest":MSG.test(t)?"msg":"toast")},
 act:function(a,x,dm){var n=a=="enter"||a=="exit"?"door":a=="buy"||a=="vbuy"||a=="unwrap"||a=="gift"?"item":null;if(n)play(n);if(dm>=1)setTimeout(function(){play("coin")},n?120:0);else if(dm<=-1)setTimeout(function(){play("pay")},n?120:0)},
 fx:function(ty,mine){if(!mine)return;var m={fight:"hit",crash:"hit",wk_desk:"work_desk",wk_docs:"work_desk",wk_cafe:"work_cafe",wk_serve:"work_serve",wk_lift:"work_lift",wk_scan:"work_scan",eat:"eat",zzz:"zzz",level:"levelup",check:"quest"}[ty];if(m)play(m)},
 ready:function(){return run()}
};
})();

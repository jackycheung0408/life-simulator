/* 小豬鎮背景音樂：原創流行風格曲，程式合成（無音檔、無任何現成歌曲旋律）。
   sfx.js 在「音樂開啟」後才載入本檔（不影響首頁）。
   TMUSIC.start(ctx,out) / stop() / set({mood,crowd,night,place,ev}) / burst(事件,秒) / force(主題名) / info() / themes / check()
   主題：street cafe night（原有）＋ mega（Super Mega 高能舞曲，慶典／派對／大贏）bar（酒吧 lounge）dance（舞池 disco-house）casino jail hall pk。
   小節可加 up:半音數（轉調）、fill:true（結尾鼓花）。全部為原創作曲，無任何現成歌曲旋律。
   資料格式：旋律每小節 16 字（16 分音符）：0～9＝音階級數（0＝key 上一個八度的主音）、a b c d＝−1～−4、
   '.' 或 '-'＝延續上一音、'_'＝休止。和弦 [根音半音數,品質]、每小節一個。節奏型 16 字：x 正常、o 輕、X 長。
   貝斯：r 根音、5 五度、8 高八度。 */
(function(){
var MAJ=[0,2,4,5,7,9,11],MIN=[0,2,3,5,7,8,10];
var Q={M:[0,4,7],m:[0,3,7],"7":[0,4,7,10],m7:[0,3,7,10],M7:[0,4,7,11],sus:[0,5,7],dim:[0,3,6],M9:[0,4,7,11,14],m9:[0,3,7,10,14]};
var K0={k:"x.....x.x.......",s:"....x.......x...",h:"x.x.x.x.x.x.x.x."},K1={k:"x...x...x...x...",s:"....x.......x...",h:"x.x.x.x.x.x.x.x."};
var TH={
 street:{bpm:112,key:60,S:MAJ,lead:"sq",drums:1,hat:1,
  form:["A","A2","B","B2","A","B","C","B2"],
  sec:{
   A:{ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["4..5.4.2..4.....","2..4.2.1..2.....","2..4.5.4..2.....","3..4.5.4.3.2-..."],comp:"x..x..x...x.x...",inst:"pf",bass:"r..r..r.r..r..5.",dr:K0},
   A2:{ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["4..5.4.2..4.5.4-","2..4.2.1..2.4.2-","2..4.5.7..5.4.2-","3..2.1.2-.4....."],comp:"x..x..x...x.x...",inst:"pf",bass:"r..r..r.r..r..5.",dr:K0},
   B:{ch:[[9,"m"],[5,"M"],[0,"M"],[7,"M"]],mel:["7..7.6.7..9.7.6-","5..5.4.5..7.5.4-","4..4.5.7..7.5.4.","2..4.2.4..2.1.2-"],comp:"X...x.x.X...x.x.",inst:"gt",bass:"r.r.r.r.r.r.r.r.",dr:K1},
   B2:{ch:[[9,"m"],[5,"M"],[0,"M"],[7,"M"]],mel:["7..7.6.7..9.7.6-","5..5.4.5..7.5.4-","4..4.5.7..7.5.4.","2.4.5.7.9-.7.5.4"],comp:"X...x.x.X...x.x.",inst:"gt",bass:"r.r.r.r.r.r.r.r.",dr:K1},
   C:{ch:[[5,"M"],[7,"M"],[4,"m"],[9,"m"]],mel:["5---..3.4---....","4---..2.1---....","2---..4.2---....","0-.2.4.5.7-.9-.."],comp:"X.......X.......",inst:"pf",bass:"r.......5.......",dr:{h:"..x...x...x...x."}}}},
 cafe:{bpm:96,key:60,S:MAJ,lead:"ep",drums:1,hat:1,sw:.24,dens:.7,
  form:["A","B","A","C"],
  sec:{
   A:{ch:[[2,"m7"],[7,"7"],[0,"M7"],[9,"m7"]],mel:"gen",comp:"x.....x...x.....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.....x.",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}},
   B:{ch:[[4,"m7"],[9,"7"],[2,"m7"],[7,"7"]],mel:"gen",comp:"x..x....x..x....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.....x.",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}},
   C:{ch:[[5,"M7"],[7,"7"],[4,"m7"],[9,"7"]],mel:"gen",comp:"x.....x...x.....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.......",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}}}},
 night:{bpm:72,key:57,S:MIN,lead:"bl",drums:0,hat:0,pad:1,arp:1,dens:.4,pent:[0,2,3,4,6],
  form:["A","B","A","B"],
  sec:{
   A:{ch:[[0,"m"],[8,"M7"],[3,"M"],[10,"M"]],mel:"gen",comp:"x.......x.......",inst:"pf",bass:"r.......r.......",dr:{k:"x.......x.......",s:"............o...",h:"..x...x...x...x."}},
   B:{ch:[[5,"m"],[0,"m7"],[8,"M7"],[7,"7"]],mel:"gen",comp:"x.......x.......",inst:"pf",bass:"r.......5.......",dr:{k:"x.......x.......",s:"............o...",h:"..x...x...x...x."}}}}
 ,mega:{bpm:128,key:62,S:MAJ,lead:"saw",drums:1,hat:1,pad:1,arp:2,
  form:["A","B","C","C2","A","B","C","BR","CU","CU2"],
  sec:{
   A:{ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["4...7.9.7...4.2.","6...8.6.8...6.4.","5...7.9.7...5.7.","5...7.5.3...5..."],comp:"x..x..x...x..x..",inst:"st",bass:"r.r.8.r.r.r.8.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"..o...o...o...o."}},
   B:{ch:[[9,"m"],[5,"M"],[0,"M"],[7,"M"]],mel:["5.7.9.7.5.7.9.9.","7.5.3.5.7.7.5.3.","9.7.4.7.9.9.7.4.","8.8.6.8.8.8.6.6."],comp:"x.x.x.x.x.x.x.x.",inst:"st",bass:"r.r.r.r.r.r.r.r.",dr:{k:"x...x...x...x...",s:"....x...x.x.xxxx",h:"x.o.x.o.x.o.x.o."},fill:true},
   C:{ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["7.7.9..9.7.9.7.4","8.8.9..8.6.8.6.4","9.9.8..9.7.5.7.9","7.5.7..5.3.5.7-."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."}},
   C2:{ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["7.7.9..9.7.9.7.4","8.8.9..8.6.8.6.4","9.9.8..9.7.5.7.9","7.9.7..5.7.-...."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."}},
   BR:{ch:[[5,"M"],[7,"M"],[9,"m"],[7,"M"]],mel:["7---.---9---.---","8---.---6---.---","9---.---7---.---","8...6...8...9.9."],comp:"X.......X.......",inst:"pf",bass:"r.......r.......",dr:{h:"..x...x...x...x."},fill:true},
   CU:{up:2,ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["7.7.9..9.7.9.7.4","8.8.9..8.6.8.6.4","9.9.8..9.7.5.7.9","7.5.7..5.3.5.7-."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."}},
   CU2:{up:2,ch:[[0,"M"],[7,"M"],[9,"m"],[5,"M"]],mel:["7.7.9..9.7.9.7.4","8.8.9..8.6.8.6.4","9.9.8..9.7.5.7.9","7.9.7..5.7.-...."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."}}}},
 bar:{bpm:88,key:58,S:MAJ,lead:"ep",drums:1,hat:1,pad:1,sw:.2,dens:.5,
  form:["A","B","A","C","A","B","A","C"],
  sec:{
   A:{ch:[[2,"m9"],[7,"7"],[0,"M9"],[9,"m7"]],mel:"gen",comp:"x.....x...x.....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.....x.",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}},
   B:{ch:[[5,"M7"],[4,"m7"],[9,"m7"],[2,"7"]],mel:"gen",comp:"x..x....x..x....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.....x.",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}},
   C:{ch:[[0,"M9"],[9,"m7"],[2,"m7"],[7,"7"]],mel:"gen",comp:"x.....x...x.....",inst:"ep",bass:"r...5...8...5...",dr:{k:"x.......x.......",s:"....o.......o...",h:"x.x.x.x.x.x.x.x."}}}},
 dance:{bpm:120,key:57,S:MIN,lead:"sq",drums:1,hat:1,pad:1,dens:.7,
  form:["A","B","A","B","C","A","B","C"],
  sec:{
   A:{ch:[[0,"m7"],[10,"M"],[8,"M7"],[7,"7"]],mel:["4.4.2.0.2.4.7.4.","3.3.1.3.6.-.3.1.","5.5.7.5.4.2.4.5.","4.4.1.4.3.1.4.-."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"..o...o...o...o."}},
   B:{ch:[[8,"M7"],[10,"M"],[0,"m7"],[7,"7"]],mel:"gen",comp:"x..x..x...x..x..",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."}},
   C:{ch:[[5,"m7"],[0,"m7"],[8,"M7"],[7,"7"]],mel:["7..7.8.7..4.2.4.","6..6.8.6..3.1.3.","5..5.7.9..7.5.4.","4..4.1.3..1.4.-."],comp:"..x...x...x...x.",inst:"st",bass:"r.8.r.8.r.8.r.8.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.o.x.o.x.o.x.o."},fill:true}}},
 casino:{bpm:124,key:60,S:MAJ,lead:"brass",drums:1,hat:1,sw:.12,
  form:["A","G","B","A","G","B","A","B"],
  sec:{
   A:{ch:[[0,"M"],[9,"7"],[2,"m7"],[7,"7"]],mel:["7.7.4.2.4..7.9.7","9.7.5.7.9..9.7.5","8.7.5.3.5..7.5.3","4.6.8.6.4..6.4.."],comp:"x..x..x...x.x...",inst:"st",bass:"r.r.5.r.8.r.5.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.x.x.x.x.x.x.x."}},
   G:{ch:[[0,"M"],[9,"7"],[2,"m7"],[7,"7"]],mel:"gen",comp:"x..x..x...x.x...",inst:"st",bass:"r.r.5.r.8.r.5.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.x.x.x.x.x.x.x."}},
   B:{ch:[[5,"M"],[5,"m"],[0,"M"],[7,"7"]],mel:["5.7.9.7.5..3.5.7","3.5.7.5.3..7.5.3","7.9.7.4.2..4.7.9","8.6.4.6.8..8.6.8"],comp:"X...x.x.X...x.x.",inst:"pf",bass:"r.r.5.r.8.r.5.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"x.x.x.x.x.x.x.x."},fill:true}}},
 jail:{bpm:64,key:50,S:MIN,lead:"bl",drums:0,hat:0,pad:1,dens:.3,pent:[0,2,3,4,6],
  form:["A","B","A","B","A","B"],
  sec:{
   A:{ch:[[0,"m"],[0,"m"],[8,"M"],[7,"sus"]],mel:"gen",comp:"x.......x.......",inst:"pf",bass:"r.......r.......",dr:{k:"x...............",s:"................",h:"................"}},
   B:{ch:[[3,"M"],[0,"m"],[5,"dim"],[7,"7"]],mel:"gen",comp:"x.......x.......",inst:"pf",bass:"r.......r.......",dr:{k:"x...............",s:"................",h:"................"}}}},
 hall:{bpm:76,key:55,S:MAJ,lead:"brass",drums:1,hat:0,
  form:["A","B","A","C","A","B","C","A"],
  sec:{
   A:{ch:[[0,"M"],[5,"M"],[7,"M"],[0,"M"]],mel:["4--.7--.9--.7---","7--.5--.3--.5---","4--.6--.8--.6---","7--.4--.2--.0---"],comp:"x.......x.......",inst:"pf",bass:"r.......5.......",dr:{k:"x.......o.......",s:"................",h:"................"}},
   B:{ch:[[9,"m"],[5,"M"],[7,"M"],[7,"7"]],mel:"gen",comp:"x.......x.......",inst:"pf",bass:"r.......5.......",dr:{k:"x.......o.......",s:"................",h:"................"}},
   C:{ch:[[5,"M"],[0,"M"],[7,"M"],[0,"M"]],mel:["7--.9--.7--.5---","4--.6--.8--.7---","8--.6--.4--.6---","7-.-4-.-2-.-0---"],comp:"x.......x.......",inst:"pf",bass:"r.......5.......",dr:{k:"x...x...x...x...",s:"................",h:"................"},fill:true}}},
 pk:{bpm:148,key:52,S:MIN,lead:"sq",drums:1,hat:1,arp:2,dens:.7,
  form:["A","B","A","B","C","A","B","C","A","C"],
  sec:{
   A:{ch:[[0,"m"],[0,"m"],[8,"M"],[10,"M"]],mel:["7.7.-.4.2.4.7.-.","7.7.-.4.2.4.2.0.","5.5.-.7.9.7.5.-.","6.6.-.8.6.8.6.4."],comp:"x.x.x.x.x.x.x.x.",inst:"gt",bass:"r.r.r.r.r.r.r.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"xxxxxxxxxxxxxxxx"}},
   B:{ch:[[5,"M"],[7,"M"],[0,"m"],[0,"m"]],mel:"gen",comp:"x.x.x.x.x.x.x.x.",inst:"gt",bass:"r.r.r.r.r.r.r.r.",dr:{k:"x...x...x...x...",s:"....x.......x...",h:"xxxxxxxxxxxxxxxx"}},
   C:{ch:[[0,"m"],[3,"M"],[8,"M"],[7,"M"]],mel:"gen",comp:"x..xx..xx..xx.x.",inst:"gt",bass:"r.r.r.r.r.r.r.r.",dr:{k:"x..xx..xx..xx.x.",s:"....x.......x...",h:"xxxxxxxxxxxxxxxx"},fill:true}}}
};
// 離線自檢（test.js 用）
function check(){var er=[],ok=function(s){return typeof s=="string"&&s.length==16};
 Object.keys(TH).forEach(function(n){var T=TH[n];T.form.forEach(function(f){if(!T.sec[f])er.push(n+":form "+f)});
  Object.keys(T.sec).forEach(function(k){var s=T.sec[k],id=n+"."+k;if(s.ch.length!=4)er.push(id+" 和弦要 4 個");s.ch.forEach(function(c){if(!Q[c[1]])er.push(id+" 品質 "+c[1])});
   if(s.mel!="gen"){if(s.mel.length!=4)er.push(id+" 旋律要 4 小節");s.mel.forEach(function(m,i){if(!ok(m)||/[^0-9a-d._-]/.test(m))er.push(id+" 旋律第"+(i+1)+"小節格式")})}
   [s.comp,s.bass].forEach(function(p){if(!ok(p))er.push(id+" 節奏型長度")});Object.keys(s.dr).forEach(function(d){if(!ok(s.dr[d]))er.push(id+" 鼓 "+d)})})});return er}
var RM=false;try{RM=matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){}
var C=null,E=null,CP=null,DRY=null,RVI=null,DLI=null,DLY=null,B={},NB=null,run=0,tm=null,nt=0,F=null,ST={mood:"normal",crowd:0,night:0,place:"",ev:"",force:""};
function R(){return Math.random()}
function fr(m){return 440*Math.pow(2,(m-69)/12)}
function dg(c){var i="dcba0123456789".indexOf(c);return i<0?null:i-4}
function pit(T,d){var o=Math.floor(d/7),k=((d%7)+7)%7;return T.key+12+T.S[k]+12*o}
function want(){if(ST.force&&TH[ST.force])return ST.force;var e=ST.ev||(ST.fest?"party":""),p=ST.place,n=ST.night,c=ST.crowd|0;
 if(e=="party"||e=="win")return"mega";if(e=="pk")return"pk";
 if(p=="casino")return"casino";if(p=="jail")return"jail";if(p=="townhall")return"hall";if(p=="arena")return"pk";
 if(p=="cafe")return n?(c>=4?"dance":"bar"):"cafe";
 return n?(c>=3?"bar":"night"):"street"}
function noise(){if(!NB){NB=C.createBuffer(1,C.sampleRate,C.sampleRate);var d=NB.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NB}
function mkIR(){var n=C.sampleRate*1.5|0,b=C.createBuffer(2,n,C.sampleRate);for(var c=0;c<2;c++){var d=b.getChannelData(c);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.8)}return b}
function bus(nm,v,r,d){var g=C.createGain();g.gain.value=v;g.connect(DRY);if(r){var a=C.createGain();a.gain.value=r;g.connect(a);a.connect(RVI)}if(d){var b=C.createGain();b.gain.value=d;g.connect(b);b.connect(DLI)}B[nm]=g}
function build(out){E=C.createGain();CP=C.createDynamicsCompressor();CP.threshold.value=-16;CP.ratio.value=4;CP.attack.value=.01;CP.release.value=.2;CP.connect(E);E.connect(out);
 DRY=C.createGain();DRY.connect(CP);
 RVI=C.createGain();var cv=C.createConvolver();cv.buffer=mkIR();var ro=C.createGain();ro.gain.value=.6;RVI.connect(cv);cv.connect(ro);ro.connect(CP);
 DLI=C.createGain();DLY=C.createDelay(2);DLY.delayTime.value=.4;var fb=C.createGain();fb.gain.value=.32;var lp=C.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2400;
 DLI.connect(DLY);DLY.connect(lp);lp.connect(fb);fb.connect(DLY);var dout=C.createGain();dout.gain.value=.8;lp.connect(dout);dout.connect(CP);
 B={};bus("lead",1,.18,.28);bus("pf",1,.22,0);bus("gt",.9,.15,0);bus("ep",1,.25,.12);bus("bass",1,0,0);bus("pad",.8,.5,0);bus("bell",1,.4,.4);bus("arp",.8,.3,.25);bus("kick",1,0,0);bus("snare",.9,.14,0);bus("hat",.8,0,0)}
// 單音：x.lp 起始截止頻率、x.lp2 結束、x.h 持續到 d 再 x.rel 釋放、x.a 起音、x.det 偏移音分、x.f2 滑音
function nt_(b,t,f,d,ty,v,x){x=x||{};var o=C.createOscillator(),g=C.createGain(),a=x.a||.006;o.type=ty;o.frequency.setValueAtTime(f,t);if(x.f2)o.frequency.exponentialRampToValueAtTime(x.f2,t+d);if(x.det)o.detune.value=x.det;
 if(x.lp){var fl=C.createBiquadFilter();fl.type="lowpass";fl.frequency.setValueAtTime(x.lp,t);if(x.lp2)fl.frequency.exponentialRampToValueAtTime(x.lp2,t+d);o.connect(fl);fl.connect(g)}else o.connect(g);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);var rel=x.rel||0;
 if(x.h){g.gain.setValueAtTime(v,t+Math.max(a,d));g.gain.linearRampToValueAtTime(.0001,t+d+rel)}else g.gain.exponentialRampToValueAtTime(.0001,t+d);
 g.connect(B[b]);o.start(t);o.stop(t+d+rel+.03)}
function nz(b,t,d,v,fq,ty,q){var s=C.createBufferSource(),f=C.createBiquadFilter(),g=C.createGain();s.buffer=noise();f.type=ty||"highpass";f.frequency.value=fq;f.Q.value=q||.7;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(B[b]);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
function kick(t,v){nt_("kick",t,150,.2,"sine",.8*v,{f2:42,a:.002})}
function snare(t,v){nz("snare",t,.16,.42*v,1800,"bandpass",.8);nt_("snare",t,200,.09,"triangle",.22*v,{f2:120})}
function hat(t,v,o){nz("hat",t,o?.17:.04,.15*v,7500,"highpass")}
// 各樂器
function spdMax(d){return d}
function lead(T,t,m,d,L){var f=fr(m);d=Math.max(.08,d);
 if(T.lead=="sq"){nt_("lead",t,f,d,"square",.085,{lp:3200,h:1,rel:.07,a:.01});if(L.dbl)nt_("lead",t,f*2,d,"triangle",.05,{h:1,rel:.07})}
else if(T.lead=="saw"){var dd=Math.min(d,spdMax(d));[-14,0,14].forEach(function(c){nt_("lead",t,f,d,"sawtooth",.04,{lp:4800,lp2:2200,h:1,rel:.08,a:.008,det:c})});if(L.dbl)nt_("lead",t,f*2,d,"square",.03,{h:1,rel:.06,lp:3000})}
 else if(T.lead=="brass"){nt_("lead",t,f,d,"sawtooth",.06,{lp:700,lp2:2600,h:1,rel:.1,a:.04,det:6});nt_("lead",t,f,d,"square",.035,{lp:1500,h:1,rel:.1,a:.05,det:-6});if(L.dbl)nt_("lead",t,f*2,d,"triangle",.04,{h:1,rel:.1})}
 else if(T.lead=="ep"){var dd=Math.min(1.3,d*1.4+.3);nt_("lead",t,f,dd,"sine",.16,{a:.004});nt_("lead",t,f*2,dd*.35,"sine",.06,{a:.003});if(L.dbl)nt_("lead",t,f*2,dd,"triangle",.04)}
 else{nt_("bell",t,f,1.8,"sine",.16,{a:.004});nt_("bell",t,f*2.76,.5,"sine",.05,{a:.002});if(L.dbl)nt_("bell",t,f*2,1.4,"sine",.06)}}
function voice(t,tones,inst,long_,v){tones.forEach(function(m){var f=fr(m);
 if(inst=="gt"){var d=long_?.7:.22;nt_("gt",t,f,d,"sawtooth",.032*v,{lp:2300,lp2:900,det:7});nt_("gt",t,f,d,"sawtooth",.032*v,{lp:2300,lp2:900,det:-7})}
 else if(inst=="st"){nt_("gt",t,f,.18,"sawtooth",.03*v,{lp:3600,lp2:1200,det:9});nt_("gt",t,f,.18,"sawtooth",.03*v,{lp:3600,lp2:1200,det:-9})}
 else if(inst=="ep"){nt_("ep",t,f,.8,"sine",.07*v,{a:.004});nt_("ep",t,f*2,.2,"sine",.025*v,{a:.003})}
 else{nt_("pf",t,f,.7,"triangle",.07*v,{lp:2600,lp2:900});nt_("pf",t,f*2,.25,"sine",.02*v)}})}
function voicing(T,c){var b=T.key+c[0],o=[];Q[c[1]].forEach(function(i){var n=b+i;while(n<55)n+=12;while(n>=72)n-=12;o.push(n)});return o}
// 隨機旋律（和弦音在強拍、經過音在弱拍）
function gen(T,sec){var res=[],prev=3+(R()*4|0),pent=T.pent;
 sec.ch.forEach(function(c){var pcs=Q[c[1]].map(function(i){return(T.key+c[0]+i)%12}),cand=[];for(var d=0;d<=9;d++)if(pcs.indexOf(pit(T,d)%12)>=0)cand.push(d);
  var s="";for(var i=0;i<16;i++){if(i%2){s+=".";continue}var strong=i%4==0;
   if(R()>(strong?(T.dens||.6)+.25:(T.dens||.6)*.55)){s+=R()<.15&&!strong?"_":".";continue}
   var d;if(strong){d=cand[0];cand.forEach(function(x){if(Math.abs(x-prev)<Math.abs(d-prev)||(Math.abs(x-prev)==Math.abs(d-prev)&&R()<.5))d=x})}
   else{d=prev+[-2,-1,-1,1,1,2][R()*6|0]}
   d=Math.max(0,Math.min(9,d));if(pent&&pent.indexOf(((d%7)+7)%7)<0)d=Math.min(9,d+1);prev=d;s+=d}
  res.push(s)});return res}
function vary(m){return m.replace(/[0-9a-d]/g,function(c,i){return i>3&&R()<.07?".":c})}
function advance(){var w=want();if(!F||((F.bi==0||ST.ev||ST.fest)&&F.T.name!=w)){var T=TH[w];T.name=w;F={T:T,si:0,bi:0,mel:null,fi:!!F}}return F}
function layers(T){var m=ST.mood,c=ST.crowd|0,sad=m=="sad"||m=="low";
 return{bass:1,pad:!!T.pad||sad,comp:!sad,lead:!sad,kick:!sad&&(!!T.drums||c>=3),hat:!sad&&(m=="happy"||c>=2||(!!T.hat&&m!="annoyed")),arp:!sad&&(!!T.arp||m=="happy"),dbl:c>=5,tm:(sad?.9:m=="happy"?1.04:1)*(c>=5?1.05:1)}}
function playBar(t0){var f=advance(),T0=f.T,sn=T0.form[f.si],sec=T0.sec[sn],bi=f.bi,T=T0,L=layers(T0);if(sec.up){T=Object.create(T0);T.key=T0.key+sec.up}
 if(f.fi){f.fi=0;try{E.gain.cancelScheduledValues(t0);E.gain.setValueAtTime(.15,t0);E.gain.linearRampToValueAtTime(1,t0+(RM?.4:1.6))}catch(e){}}
 if(bi==0)f.mel=sec.mel=="gen"?gen(T,sec):sec.mel.map(vary);
 var spd=60/(T.bpm*L.tm)/4,c=sec.ch[bi],tones=voicing(T,c),sw=T.sw||0,dr=sec.dr,last=bi==3&&(sec.fill!=null?sec.fill:(f.si&1));
 DLY.delayTime.setTargetAtTime(spd*6,t0,.1);
 var tp=function(i){return t0+i*spd+(sw&&i%4==2?sw*spd*2:0)};
 var bm=36+((T.key+c[0])%12);
 for(var i=0;i<16;i++){var t=tp(i);
  if(L.kick&&dr.k&&dr.k[i]!="."&&dr.k[i]!="_")kick(t,dr.k[i]=="o"?.5:1);
  if(L.kick&&dr.s&&dr.s[i]!=".")snare(t,dr.s[i]=="o"?.45:1);
  if(L.hat&&dr.h&&dr.h[i]!=".")hat(t,(i%4==0?1:.6)*(ST.mood=="happy"?1:.8),dr.h[i]=="o"||(i==14&&T0.name!="night"&&T0.name!="mega"&&T0.name!="dance"&&T0.name!="pk"));
  if(L.hat&&ST.mood=="happy"&&T.hat&&i%2&&dr.h&&T.name=="street")hat(t,.35);
  if(last&&L.kick&&i>=12&&R()<.7)snare(t,.5+(i-12)*.15);
  if(L.comp&&sec.comp[i]!="."){voice(t,tones,sec.inst,sec.comp[i]=="X",1)}
  var bc=sec.bass[i];if(bc!="."){var n=bm+(bc=="5"?7:bc=="8"?12:0),nx=i+1;while(nx<16&&sec.bass[nx]=="."&&nx-i<8)nx++;var d=(nx-i)*spd*.92;
   nt_("bass",t,fr(n),d,"triangle",.3,{h:1,rel:.05,a:.008,lp:700});nt_("bass",t,fr(n),d,"sawtooth",.045,{h:1,rel:.04,lp:420})}
  if(L.arp&&T.arp==2){var q=tones[(i*3>>1)%tones.length]+12+(i%8>=4?12:0);nt_("arp",t,fr(q),.14,"square",.028,{a:.002,lp:3400})}
  else if(L.arp&&i%2==0&&(T.name=="night"||ST.mood=="happy")){var q=tones[(i>>1)%tones.length]+12;nt_("arp",t,fr(q),.3,"triangle",T.name=="night"?.05:.045,{a:.003})}}
 if(L.pad){tones.forEach(function(m){var d=spd*16+.15;nt_("pad",t0,fr(m-12),d,"sawtooth",.02,{lp:650,a:.5,h:1,rel:.7,det:8});nt_("pad",t0,fr(m-12),d,"sawtooth",.02,{lp:650,a:.5,h:1,rel:.7,det:-8})})}
 if(L.lead){var ms=f.mel[bi];for(var i=0;i<16;i++){var d=dg(ms[i]);if(d==null)continue;var j=i+1;while(j<16&&(ms[j]=="."||ms[j]=="-"))j++;var hold=(j-i)*spd;lead(T,tp(i),pit(T,d),Math.min(hold*.95,spd*8),L)}}
 f.bi++;if(f.bi>=4){f.bi=0;f.si++;if(f.si>=T.form.length)f.si=0}
 return spd*16}
function pump(){if(!run||!C)return;try{var now=C.currentTime;if(nt<now-.05)nt=now+.05;while(nt<now+.45)nt+=playBar(nt)}catch(e){}}
function start(ctx,out){if(run)return;C=ctx;try{build(out||C.destination)}catch(e){return}run=1;F=null;nt=C.currentTime+.08;try{E.gain.setValueAtTime(0,C.currentTime);E.gain.linearRampToValueAtTime(1,C.currentTime+.5)}catch(e){}tm=setInterval(pump,150);pump()}
function stop(){if(!run)return;run=0;clearInterval(tm);tm=null;try{E.gain.setTargetAtTime(0,C.currentTime,.06);var e=E;setTimeout(function(){try{e.disconnect()}catch(x){}},700)}catch(x){}}
function set(o){for(var k in o)ST[k]=o[k]}
var bt=null;function burst(e,sec){ST.ev=e;clearTimeout(bt);bt=setTimeout(function(){ST.ev=""},(sec||25)*1000)}
function info(){var f=F;if(!f)return null;var L=layers(f.T),a=[];for(var k in L)if(L[k]===true)a.push(k);return{theme:f.T.name,sec:f.T.form[f.si],bar:f.bi,layers:a}}
function force(n){ST.force=n||"";if(F&&n&&TH[n]&&F.T.name!=n){F=null}}
window.TMUSIC={start:start,stop:stop,set:set,force:force,burst:burst,info:info,themes:Object.keys(TH),check:check,running:function(){return run},state:ST};
})();

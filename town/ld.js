// 載入畫面加強版（?t= 進小鎮）：像素街景、日夜、豬隨階段走路、回訪玩家資訊、輪播小知識。
// 由 index.html 動態載入；載不到就維持原本簡單版。不可阻塞首頁或預取。
(function(){
var lg=document.getElementById("lg"),l=lg&&lg.firstChild;if(!l||l.className!="ld"||window.__ld2)return;window.__ld2=1;
var R=function(x,y,w,h,f){return'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+f+'"/>'};
var hr=new Date(Date.now()+(new Date().getTimezoneOffset()+480)*6e4).getHours(),night=hr>=19||hr<5,dusk=(hr>=17&&hr<19)||(hr>=5&&hr<7);
var sky=night?"#14183a":dusk?"#f2a65a":"#9fd8f5",grass=night?"#2f5d3c":"#7cc46a",road=night?"#3a3a48":"#6b6b78",win=night?"#ffd23f":"#9fd8ff",wall=night?"#8d8a9a":"#f4ead6",wall2=night?"#7d8aa8":"#e8f1ff",cl=night?"#3b4170":"#fff";
var s='<svg viewBox="0 0 96 40" shape-rendering="crispEdges" role="img" aria-label="小豬鎮街景">'+R(0,0,96,40,sky);
if(night){s+=R(80,4,5,5,"#f4ead6")+R(82,3,3,3,sky)+'<g class="st">'+[[6,4],[20,9],[34,3],[48,8],[62,5],[72,11],[14,14]].map(function(p){return R(p[0],p[1],1,1,"#fff")}).join("")+'</g>'}
else s+=R(78,4,6,6,dusk?"#ffe9a8":"#ffd23f");
s+='<g class="c1">'+R(8,5,12,3,cl)+R(11,3,6,2,cl)+'</g><g class="c2">'+R(56,9,14,3,cl)+R(60,7,7,2,cl)+'</g>'
+R(0,24,96,16,grass)+R(0,31,96,7,road)+R(0,38,96,2,"#c9c1ad")
+[2,14,26,38,50,62,74,86].map(function(x){return R(x,34,7,1,"#f0c040")}).join("")
+R(6,17,18,12,wall)+R(4,15,22,2,"#d9534f")+R(6,13,18,2,"#d9534f")+R(9,11,12,2,"#d9534f")+R(13,22,4,7,"#8b5a2b")+R(8,19,3,3,win)+R(19,19,3,3,win)
+R(64,17,18,12,wall2)+R(62,15,22,2,"#3b7dd8")+R(64,13,18,2,"#3b7dd8")+R(67,11,12,2,"#3b7dd8")+R(71,22,4,7,"#8b5a2b")+R(66,19,3,3,win)+R(77,19,3,3,win)
+R(46,24,2,5,"#8b5a2b")+R(43,18,8,7,"#2e9e5b")+R(45,16,4,2,"#2e9e5b")
+R(30,20,1,9,"#444")+R(29,19,3,2,night?"#ffd23f":"#bbb")+R(54,20,1,9,"#444")+R(53,19,3,2,night?"#ffd23f":"#bbb")
+'<g id="ldw" style="transform:translateX(2px)"><g class="pb">'+R(0,26,8,5,"#f4a6c0")+R(7,25,5,5,"#f4a6c0")+R(8,23,2,2,"#e0779b")+R(10,26,1,1,"#0b0b14")+R(11,28,2,2,"#e0779b")+R(1,31,1,2,"#e0779b")+R(5,31,1,2,"#e0779b")+R(-1,27,1,1,"#e0779b")+'</g></g></svg>';
var TIPS=["吃飽睡飽，心情才會好","朋友家門口能留言、送禮","打工越多，職稱越高","點地圖上的東西會自動走過去","精力不夠就回家睡一覺","去咖啡廳坐坐，精力會慢慢回來","每天登入有獎勵，連續越久越多","能力屬性可以慢慢練起來","市政廳能投票蓋新設施","賭場要先換籌碼，離場自動換回","長按按鈕能看效果說明","遊艇出海會帶上附近的鄰居"];
var m=[];try{m=JSON.parse(localStorage.getItem("town-mine")||"[]")}catch(e){}
var T=(/[?&]t=([A-Za-z0-9]+)/.exec(location.search)||[])[1]||"",me=m.filter(function(x){return x.tid==T.toUpperCase()})[0];
var ago=function(t){var d=(Date.now()-t)/1e3;return d<90?"剛剛":d<3600?Math.round(d/60)+" 分鐘前":d<86400?Math.round(d/3600)+" 小時前":Math.round(d/86400)+" 天前"};
var st=document.createElement("style");st.textContent=".ld2 .ldp{display:none}.ldv{width:min(100%,360px);margin:0 auto 12px;border:3px solid var(--ink);background:"+sky+"}.ldv svg{display:block;width:100%;image-rendering:pixelated}#ldw{transition:transform 1.4s steps(10)}.pb{animation:ldp .4s steps(2) infinite}.c1{animation:ldc 24s steps(48) infinite}.c2{animation:ldc 36s steps(48) infinite}.st{animation:lds 1.6s steps(2) infinite}@keyframes ldp{50%{transform:translateY(-1px)}}@keyframes ldc{to{transform:translateX(30px)}}@keyframes lds{50%{opacity:.4}}.ld2 #ldx{display:none}#ldy,#ldz{display:block;min-height:16px;margin-top:10px}@media (prefers-reduced-motion:reduce){#ldw{transition:none}.pb,.c1,.c2,.st{animation:none}}";
document.head.appendChild(st);
l.className="ld ld2";var b=l.querySelector("b");b.insertAdjacentHTML("beforebegin",'<div class="ldv">'+s+'</div>');
b.insertAdjacentHTML("afterend",me?'<small id="ldz">'+(me.me?me.me+" · ":"")+(me.at?"上次上線 "+ago(me.at):"歡迎回來")+'</small>':'<small id="ldz"></small>');
l.insertBefore(Object.assign(document.createElement("small"),{id:"ldy"}),document.getElementById("lds"));
var ti=Math.floor(Math.random()*TIPS.length),ldy=document.getElementById("ldy"),t0=Date.now();
function tip(){if(!document.body.contains(ldy))return clearInterval(iv);ldy.textContent=Date.now()-t0>6e3?"網路比較慢，再等或重試":"小知識：「"+TIPS[ti++%TIPS.length]+"」"}
var iv=setInterval(tip,3000);tip();setTimeout(tip,6100);
var w=document.getElementById("ldw");
function walk(n){if(w&&w.isConnected)w.style.transform="translateX("+(2+Math.max(0,n-1)*24)+"px)"}
if(window.LP&&LP.stage){var o=LP.stage;LP.stage=function(n){o(n);if(!n){clearInterval(iv);return}walk(n)}}
})();

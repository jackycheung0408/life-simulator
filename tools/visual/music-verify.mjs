// 音樂驗證：每個主題實際播放，量測 RMS／peak／pump 耗時／錯誤；用法 cd tools/visual && node music-verify.mjs
import {chromium} from "playwright";import path from "path";import {fileURLToPath} from "url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});const pg=await b.newPage();const errs=[];
pg.on("pageerror",e=>errs.push(e.message));pg.on("console",m=>m.type()=="error"&&errs.push(m.text()));
await pg.goto("file://"+root+"/tools/music-preview.html");
const r=await pg.evaluate(async()=>{
 const out={};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const C=new AudioContext();await C.resume();const g=C.createGain();g.gain.value=.3;const an=C.createAnalyser();an.fftSize=2048;g.connect(an);an.connect(C.destination);
 const ctxs=[["street",{}],["night",{night:1}],["cafe",{place:"cafe"}],["bar",{place:"cafe",night:1}],["dance",{place:"cafe",night:1,crowd:5}],["casino",{place:"casino"}],["jail",{place:"jail"}],["hall",{place:"townhall"}],["pk",{place:"arena"}],["mega",{ev:"party"}]];
 const buf=new Float32Array(2048);
 for(const [exp,o] of ctxs){TMUSIC.stop();await sleep(800);TMUSIC.set({mood:"normal",crowd:0,night:0,place:"",ev:"",force:""});TMUSIC.set(o);
  TMUSIC.start(C,g);const t0=performance.now();let peak=0,rms=0,n=0,th="";
  for(let i=0;i<24;i++){await sleep(250);an.getFloatTimeDomainData(buf);let s=0;for(const v of buf){s+=v*v;peak=Math.max(peak,Math.abs(v))}rms+=Math.sqrt(s/buf.length);n++;const f=TMUSIC.info();if(f)th=f.theme}
  out[exp]={got:th,peak:+peak.toFixed(2),rms:+(rms/n).toFixed(3),layers:(TMUSIC.info()||{}).layers};}
 // 切換：夜晚街上 → 慶典 burst，確認有切過去
 TMUSIC.stop();await sleep(500);TMUSIC.set({night:1,ev:"",place:"",crowd:0});TMUSIC.start(C,g);await sleep(500);TMUSIC.burst("win",12);await sleep(6000);out.burst=(TMUSIC.info()||{}).theme;
 out.state=C.state;return out});
console.log(JSON.stringify(r,null,1));console.log("errors:",errs);
let bad=errs.length>0||r.state!="running";for(const k of ["street","night","cafe","bar","dance","casino","jail","hall","pk","mega"]){const x=r[k];if(!x||x.got!=k||x.peak>=1||x.rms<.001){bad=true;console.log("BAD",k,x)}}
if(r.burst!="mega"){bad=true;console.log("burst fail",r.burst)}
await b.close();process.exit(bad?1:0);

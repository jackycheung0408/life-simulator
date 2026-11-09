// 小豬鎮改版：node tools/town-bump.mjs
// 把 town/index.html 裡 town.js 的 ?v=N 加 1，並把 town/version.json 寫成同一個 N（已開著的 web app 靠它知道有新版）。
// icons.js 有改要自己加 --icons（只加 icons.js 的 ?v=）。
import fs from "fs";import {fileURLToPath} from "url";
const dir=fileURLToPath(new URL("../town/",import.meta.url));
let h=fs.readFileSync(dir+"index.html","utf8");
const m=h.match(/town\.js\?v=(\d+)/);if(!m){console.error("找不到 town.js?v=");process.exit(1)}
const n=+m[1]+1;
h=h.replace(/town\.js\?v=\d+/,"town.js?v="+n);
if(process.argv.includes("--icons"))h=h.replace(/icons\.js\?v=(\d+)/,(a,b)=>"icons.js?v="+(+b+1));
fs.writeFileSync(dir+"index.html",h);
fs.writeFileSync(dir+"version.json",JSON.stringify({v:n})+"\n");
console.log("town.js ?v="+n+"，version.json 已同步");

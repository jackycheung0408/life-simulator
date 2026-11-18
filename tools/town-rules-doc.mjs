// 從 town/town.js 的 RULES 產生 CLAUDE.md 的「按鈕效果表」（只改 <!-- RULES:START --> 與 <!-- RULES:END --> 之間）
import fs from "node:fs";
const root=new URL("../",import.meta.url).pathname,src=fs.readFileSync(root+"town/town.js","utf8");
const blk=src.slice(src.indexOf("/*RULES:START*/"),src.indexOf("const FAC={special:"));
const {RULES}=new Function(blk+";return {RULES,RULES_TODO}")();
const N={hunger:"飽足",energy:"精力",bladder:"膀胱",hygiene:"清潔",fun:"心情",money:"錢",bond:"好感",fit:"體能"};
const fmt=x=>N[x[0]]+(typeof x[1]=="number"?(x[1]<0?" −":" +")+Math.abs(x[1]):" "+x[1]);
const H={hasF:()=>0,wage:()=>0},H1={hasF:()=>1,wage:()=>0};
const rows=RULES.map(r=>{let fx=typeof r.fx=="function"?r.fx({items:{}},H):r.fx;const alt=typeof r.fx=="function"?r.fx({items:{}},H1):null,a=fx.map(fmt).join("、"),b=alt&&JSON.stringify(alt)!=JSON.stringify(fx)?"（有家具：" +alt.map(fmt).join("、")+"）":"";
 return `| ${r.t} | ${a}${b} | ${(r.need||[]).map(n=>n[0]=="energy"?"精力≥"+n[1]:n[1]).join("、")||"—"} | ${r.p||"—"} | \`${r.sql}\` |`}).join("\n");
const sec=`<!-- RULES:START -->\n（由 \`node tools/town-rules-doc.mjs\` 從 \`town/town.js\` 的 \`RULES\` 產生，請勿手改；共 ${RULES.length} 筆）\n\n| 互動 | 效果 | 門檻 | 機率／備註 | SQL 出處 |\n|---|---|---|---|---|\n${rows}\n<!-- RULES:END -->`;
const f=root+"CLAUDE.md";let c=fs.readFileSync(f,"utf8");
if(c.includes("<!-- RULES:START -->"))c=c.replace(/<!-- RULES:START -->[\s\S]*?<!-- RULES:END -->/,()=>sec);
else c=c.replace("## 按鈕分類",()=>"### 按鈕效果表\n"+sec+"\n\n## 按鈕分類");
fs.writeFileSync(f,c);console.log("RULES",RULES.length,"筆已寫入 CLAUDE.md");

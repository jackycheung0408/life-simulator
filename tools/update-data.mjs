// 從世界銀行 API 抓各國最新統計，覆寫 countries.js 的數字欄位（城市與沒有資料的欄位保留原值）
// 用法：node tools/update-data.mjs
import fs from "node:fs";

const ISO={印度:"IND",中國:"CHN",奈及利亞:"NGA",巴基斯坦:"PAK",印尼:"IDN",剛果民主共和國:"COD",衣索比亞:"ETH",美國:"USA",孟加拉:"BGD",巴西:"BRA",坦尚尼亞:"TZA",埃及:"EGY",墨西哥:"MEX",菲律賓:"PHL",烏干達:"UGA",蘇丹:"SDN",肯亞:"KEN",越南:"VNM",阿富汗:"AFG",安哥拉:"AGO",俄羅斯:"RUS",尼日:"NER",土耳其:"TUR",伊朗:"IRN",莫三比克:"MOZ",伊拉克:"IRQ",馬達加斯加:"MDG",迦納:"GHA",馬利:"MLI",喀麥隆:"CMR",象牙海岸:"CIV",葉門:"YEM",緬甸:"MMR",布吉納法索:"BFA",南非:"ZAF",日本:"JPN",德國:"DEU",法國:"FRA",英國:"GBR",馬拉威:"MWI",阿爾及利亞:"DZA",摩洛哥:"MAR",尚比亞:"ZMB",索馬利亞:"SOM",查德:"TCD",哥倫比亞:"COL",泰國:"THA",阿根廷:"ARG",秘魯:"PER",沙烏地阿拉伯:"SAU",幾內亞:"GIN",塞內加爾:"SEN",南蘇丹:"SSD",盧安達:"RWA",貝南:"BEN",委內瑞拉:"VEN",馬來西亞:"MYS",辛巴威:"ZWE",尼泊爾:"NPL",烏茲別克:"UZB",義大利:"ITA",加拿大:"CAN",蒲隆地:"BDI",獅子山:"SLE",多哥:"TGO",西班牙:"ESP",波蘭:"POL",澳洲:"AUS",烏克蘭:"UKR",厄瓜多:"ECU",瓜地馬拉:"GTM",柬埔寨:"KHM",敘利亞:"SYR",突尼西亞:"TUN",玻利維亞:"BOL",海地:"HTI",多明尼加:"DOM",約旦:"JOR",古巴:"CUB",巴布亞紐幾內亞:"PNG",宏都拉斯:"HND",亞塞拜然:"AZE",以色列:"ISR",塔吉克:"TJK",白俄羅斯:"BLR",厄利垂亞:"ERI",奧地利:"AUT",匈牙利:"HUN",瑞典:"SWE",捷克:"CZE",希臘:"GRC",葡萄牙:"PRT",比利時:"BEL",荷蘭:"NLD",羅馬尼亞:"ROU",哈薩克:"KAZ",智利:"CHL",斯里蘭卡:"LKA",北韓:"PRK",韓國:"KOR",吉爾吉斯:"KGZ",寮國:"LAO",利比亞:"LBY",黎巴嫩:"LBN",巴拉圭:"PRY",薩爾瓦多:"SLV",尼加拉瓜:"NIC",土庫曼:"TKM",保加利亞:"BGR",塞爾維亞:"SRB",瑞士:"CHE",新加坡:"SGP",香港:"HKG",澳門:"MAC",丹麥:"DNK",芬蘭:"FIN",挪威:"NOR",愛爾蘭:"IRL",紐西蘭:"NZL",斯洛伐克:"SVK",哥斯大黎加:"CRI",巴拿馬:"PAN",科威特:"KWT",阿曼:"OMN",阿聯:"ARE",卡達:"QAT",巴林:"BHR",巴勒斯坦:"PSE",喬治亞:"GEO",亞美尼亞:"ARM",蒙古:"MNG",克羅埃西亞:"HRV",波士尼亞:"BIH",阿爾巴尼亞:"ALB",北馬其頓:"MKD",摩爾多瓦:"MDA",立陶宛:"LTU",拉脫維亞:"LVA",愛沙尼亞:"EST",斯洛維尼亞:"SVN",蒙特內哥羅:"MNE",科索沃:"XKX",塞普勒斯:"CYP",盧森堡:"LUX",馬爾他:"MLT",冰島:"ISL",牙買加:"JAM",千里達及托巴哥:"TTO",蓋亞那:"GUY",蘇利南:"SUR",烏拉圭:"URY",不丹:"BTN",馬爾地夫:"MDV",東帝汶:"TLS",斐濟:"FJI",所羅門群島:"SLB",波札那:"BWA",納米比亞:"NAM",賴索托:"LSO",史瓦帝尼:"SWZ",模里西斯:"MUS",加彭:"GAB",剛果共和國:"COG",中非共和國:"CAF",赤道幾內亞:"GNQ",甘比亞:"GMB",幾內亞比索:"GNB",賴比瑞亞:"LBR",茅利塔尼亞:"MRT",吉布地:"DJI",葛摩:"COM",維德角:"CPV"};

const IND={pop:"SP.POP.TOTL",cbr:"SP.DYN.CBRT.IN",mEx:"SP.DYN.LE00.MA.IN",fEx:"SP.DYN.LE00.FE.IN",gdp:"NY.GDP.PCAP.PP.CD",im:"SP.DYN.IMRT.IN",uni:"SE.TER.ENRR",gini:"SI.POV.GINI"};

async function fetchInd(id){
 // mrv=10：取最近 10 年，每國用最新一筆非空值（吉尼係數和大學就學率不是每年都有）
 const url=`https://api.worldbank.org/v2/country/all/indicator/${id}?format=json&mrv=10&per_page=20000`;
 const [,rows]=await (await fetch(url)).json();
 const out={};
 for(const r of rows||[])if(r.value!=null&&!(r.countryiso3code in out))out[r.countryiso3code]=r.value;
 return out;
}

// 1960 年代平均值，給「過去的世界」用（避開單一年份的饑荒或戰爭）
async function fetch60s(id){
 const [,rows]=await (await fetch(`https://api.worldbank.org/v2/country/all/indicator/${id}?format=json&date=1960:1969&per_page=20000`)).json();
 const sum={};for(const r of rows||[])if(r.value!=null){const s=sum[r.countryiso3code]||=[0,0];s[0]+=r.value;s[1]++}
 return Object.fromEntries(Object.entries(sum).map(([k,[t,n]])=>[k,t/n]));
}

const data={};for(const [k,id] of Object.entries(IND)){data[k]=await fetchInd(id);console.log(k,Object.keys(data[k]).length)}
for(const [k,id] of Object.entries({m60:IND.mEx,f60:IND.fEx,im60:IND.im})){data[k]=await fetch60s(id);console.log(k,Object.keys(data[k]).length)}

const src=fs.readFileSync("countries.js","utf8");
const body=src.match(/`([\s\S]*?)`/)[1].trim().split("\n");
const missing=[];
const lines=body.map(l=>{
 const a=l.split("|"),iso=ISO[a[0]];if(!iso){missing.push(a[0]);return l}
 const g=k=>data[k][iso];
 const pop=g("pop"),cbr=g("cbr");
 if(pop&&cbr)a[1]=+(pop*cbr/1000/1e4).toFixed(1);  // 年出生（萬）
 if(pop)a[2]=+(pop/1e6).toFixed(1);                  // 人口（百萬）
 if(g("mEx"))a[3]=Math.round(g("mEx"));
 if(g("fEx"))a[4]=Math.round(g("fEx"));
 if(g("gdp"))a[5]=Math.round(g("gdp")/100)*100;
 if(g("im"))a[6]=Math.round(g("im"));
 if(g("uni"))a[7]=Math.round(g("uni"));
 if(g("gini"))a[8]=+(g("gini")/100).toFixed(2);
 // 第 11～13 欄：1960 年代男壽、女壽、嬰兒死亡率（沒有資料就留空）
 a.length=10;a.push(...["m60","f60","im60"].map(k=>g(k)?Math.round(g(k)):""));
 return a.join("|");
});
console.log("沒有世界銀行資料、保留原值：",missing.join("、")||"無");
const header=src.slice(0,src.indexOf("`")+1),footer=src.slice(src.lastIndexOf("`"));
fs.writeFileSync("countries.js",header.replace(/\/\/ 依.*\n/,`// 資料來源：世界銀行 World Development Indicators（${new Date().toISOString().slice(0,10)} 抓取，各國取最近 10 年內最新值）\n`)+lines.join("\n")+footer);

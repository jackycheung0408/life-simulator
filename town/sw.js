// 小豬鎮 web app：網路優先，離線時用上次的畫面；資料一律即時向資料庫拿，不快取
const C="town-v4",SHELL=["./","index.html","manifest.webmanifest","icon-192.png","favicon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!="GET"||u.origin!=location.origin)return;
 // 版本檔不快取；首頁一律問伺服器（不用瀏覽器的 HTTP 快取），主畫面 web app 才拿得到新版
 if(/version\.json$/.test(u.pathname)){e.respondWith(fetch(e.request,{cache:"no-store"}));return}
 // 帶 ?v= 的 js 網址每次改版都會換，所以可以直接用快取（不用等網路，首頁才能 0.2 秒內動起來）
 if(/\.js$/.test(u.pathname)&&u.searchParams.has("v")){e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r})));return}
 const fresh=e.request.mode=="navigate"||/\/(index\.html)?$/.test(u.pathname);
 e.respondWith(fetch(e.request,fresh?{cache:"no-store"}:undefined).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
// 手機通知：推播程式送來的訊息顯示成通知，點了打開那個小鎮
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(er){d={title:"🐷 小豬鎮",body:e.data?e.data.text():""}}
 e.waitUntil(self.registration.showNotification(d.title||"🐷 小豬鎮",{body:d.body||"",icon:"icon-192.png",badge:"favicon.png",tag:d.tag||"town",data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();const url=e.notification.data&&e.notification.data.url||"./";
 e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{for(const w of ws)if(w.url.startsWith(url.split("?")[0])&&"focus" in w){w.navigate(url);return w.focus()}return clients.openWindow(url)}))});

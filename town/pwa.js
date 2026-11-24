// 安裝引導（iOS 加入主畫面三步／Android 一鍵安裝）＋儲存保護；由 town.js 在首頁畫好後載入，index.html 不載入它
(function(){
var K="town-pwa-x",dp=null;
function sa(){return matchMedia("(display-mode:standalone)").matches||navigator.standalone===true}
function ls(f){try{return f()}catch(e){}}
function hide(){var b=document.getElementById("pwab");if(b)b.parentNode.removeChild(b)}
function dismiss(){ls(function(){localStorage.setItem(K,"1")});hide()}
function css(){if(document.getElementById("pwacss"))return;var s=document.createElement("style");s.id="pwacss";s.textContent="#pwab{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:60;background:#2a2540;border:3px solid #f6a5c0;padding:8px;max-width:460px;margin:0 auto;font-size:11px;line-height:1.6;color:#fff}#pwab b{font-size:16.5px;font-weight:normal;color:#ffd84a;display:block}#pwab ol{margin:4px 0 4px 20px;padding:0}#pwab .r{display:flex;gap:8px;justify-content:flex-end}#pwab button{min-height:44px;min-width:44px;font-size:11px}";document.head.appendChild(s)}
function show(kind){if(document.getElementById("pwab")||ls(function(){return localStorage.getItem(K)})||sa())return;
 if(document.body.classList.contains("ingame"))return;css();var b=document.createElement("div");b.id="pwab";
 b.innerHTML=kind=="ios"?"<b>加到主畫面，像 App 一樣開</b><ol><li>點下方 Safari 的分享鈕</li><li>選「加入主畫面」</li><li>按右上「加入」</li></ol><div class=r><button id=pwax>不再顯示</button></div>":"<b>安裝小豬鎮</b>一鍵加到主畫面，開得更快。<div class=r><button id=pwax>不再顯示</button><button id=pwai class=pri>安裝</button></div>";
 document.body.appendChild(b);document.getElementById("pwax").onclick=dismiss;
 var i=document.getElementById("pwai");if(i)i.onclick=function(){if(!dp)return;dp.prompt();dp.userChoice.then(function(){dp=null;hide()})}}
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform=="MacIntel"&&navigator.maxTouchPoints>1);
var safari=/safari/i.test(navigator.userAgent)&&!/crios|fxios|edgios|chrome/i.test(navigator.userAgent);
addEventListener("beforeinstallprompt",function(e){e.preventDefault();dp=e;setTimeout(function(){show("and")},800)});
addEventListener("appinstalled",hide);
if(ios&&safari&&!sa())setTimeout(function(){show("ios")},1200);
// 進遊戲就收起；回首頁（登出）時若還沒關閉可再出現
setInterval(function(){if(document.body.classList.contains("ingame"))hide()},3000);
// 儲存保護：向瀏覽器要求不要清掉資料；結果留在 window.PWA 方便檢查
window.PWA={persisted:null,check:function(){return navigator.storage&&navigator.storage.persist?navigator.storage.persisted().then(function(p){return p?p:navigator.storage.persist()}).then(function(p){window.PWA.persisted=p;return p}):Promise.resolve(null)}};
if(sa())PWA.check().catch(function(){});
})();

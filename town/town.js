typeof document!=="undefined"&&(()=>{const P=CanvasRenderingContext2D.prototype,ft=P.fillText;P.fillText=function(t,x,y){return ft.call(this,t,Math.round(x),Math.round(y))};P.strokeText=function(t,x,y){const f=this.fillStyle;this.fillStyle=this.strokeStyle;for(const[a,b]of[[-1,0],[1,0],[0,-1],[0,1]])ft.call(this,t,Math.round(x)+a,Math.round(y)+b);this.fillStyle=f};const e=document.createElement("style");e.id="pxcss";e.textContent=`html,body,button,input,select,textarea,canvas{-webkit-font-smoothing:none;font-smooth:never;text-rendering:optimizeSpeed}canvas,img,svg{image-rendering:pixelated;image-rendering:crisp-edges}svg{shape-rendering:crispEdges}*{border-radius:0!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;text-shadow:none!important}body.ingame #menuBtn,body.ingame .tools button,body.ingame #strip button,body.ingame .ptab,body.ingame #acts .act,body.ingame #tipbox .act,body.ingame #pinbox .act,body.ingame #toast,body.ingame #wev,body.ingame .pp,body.ingame #panel{clip-path:polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% 100%,0 100%)}body.ingame #panel{box-shadow:0 -2px 0 var(--ink)!important}body.ingame #acts.more{-webkit-mask-image:none!important;mask-image:none!important}body.ingame #panel,body.ingame #toast,body.ingame #wev{transition:none!important;animation-timing-function:steps(4)!important}.pp{animation-timing-function:steps(8)!important}`;document.head.appendChild(e)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="dockcss";st.textContent=`html,body{background:#0e0d1a!important}body.ingame{--sb:0px!important;--nav:56px!important;--hud:calc(env(safe-area-inset-top) + 12px + 44px)!important;--ph:clamp(290px,42dvh,420px)!important}body.ingame #pinbox .act{min-height:46px!important;min-width:112px!important;background:#ff4f7b!important;border-color:#fff!important;color:#fff!important}body.ingame #needs{top:calc(env(safe-area-inset-top) + 12px)!important;height:44px!important;padding:0 8px!important;box-sizing:border-box}body.ingame .bar,body.ingame .tools{bottom:0!important;height:56px!important;background:#0e0d1a!important}body.ingame::after{content:"";position:fixed;left:0;right:0;bottom:0;height:56px;background:#0e0d1a;border-top:2px solid rgba(255,255,255,.22);z-index:20;pointer-events:none}`;document.head.appendChild(st)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="ui2css";st.textContent=`body.ingame{--ph:min(32vh,300px);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;--hud:calc(env(safe-area-inset-top) + 46px);--tb:0px;--g:8px}body.ingame #needs{height:var(--hud);padding:calc(env(safe-area-inset-top) + 10px) 8px 4px;gap:6px;background:#0b0b14;opacity:1;border-bottom:2px solid var(--ink);right:0;grid-template-columns:repeat(5,minmax(0,1fr)) minmax(0,1.5fr);align-items:center}body.ingame .need{background:transparent;border:0;box-shadow:none;padding:0;display:grid;grid-template-columns:16px 1fr;grid-template-rows:16px 6px;column-gap:4px;align-items:center;height:28px;min-width:0}body.ingame .need span{grid-row:1/3;width:16px;height:16px;font-size:11px;display:flex;align-items:center;justify-content:center}body.ingame .need i{height:10px;background:#0f1530;margin:0;grid-column:2;grid-row:1/3;align-self:center}body.ingame .need small{display:none}body.ingame #needs{z-index:60;-webkit-backdrop-filter:none;backdrop-filter:none;filter:none}body.ingame #needs img.px{image-rendering:pixelated}body.ingame .need i b{background-image:none!important}body.ingame .need.low i{outline:2px solid var(--bad)}body.ingame .need.money{grid-template-columns:16px 1fr;grid-template-rows:auto}body.ingame .need.money span{grid-row:1}body.ingame .need.money small{display:block;grid-column:2;grid-row:1;text-align:left;font-size:11px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}body.ingame .need.money small br{display:none}@keyframes lowp{50%{opacity:.55}}body.ingame #stage::before{display:none}body.ingame #stage{top:var(--hud)}body.ingame .bar{top:calc(var(--hud) + var(--g));right:var(--g)}body.ingame #menuBtn,body.ingame .tools button{font-size:11px;line-height:1.15;width:52px;height:58px;min-width:52px;padding:4px 0;border-radius:14px;flex-direction:column;gap:3px;color:#fff;background:rgba(20,26,58,.82);border:2px solid #fff;box-shadow:0 2px 0 var(--ink);display:flex;align-items:center;justify-content:center}body.ingame #menuBtn img.px,body.ingame .tools button img.px{width:22px;height:22px;vertical-align:0}body.ingame .tools{position:fixed;top:auto;bottom:calc(var(--phpx,var(--ph)) + var(--g));right:var(--g);left:auto;height:auto;padding:0;background:none;border:0;flex-direction:row;gap:var(--g);z-index:21}body.ingame .bar{top:auto!important;bottom:calc(var(--phpx,var(--ph)) + var(--g));right:calc(var(--g) + 180px)!important}body.ingame #strip{top:calc(var(--hud) + var(--g));left:var(--g);right:var(--g);width:auto;height:auto;padding:0;background:none;border:0;-webkit-mask-image:none;mask-image:none;pointer-events:auto;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;scrollbar-width:none;-webkit-overflow-scrolling:touch;flex-wrap:nowrap}body.ingame #strip::-webkit-scrollbar{display:none}body.ingame #strip button{flex:none}body.ingame #strip button{pointer-events:auto;height:44px;border-radius:22px;background:rgba(20,26,58,.82)}body.ingame #tips,body.ingame #away{top:calc(var(--hud) + 60px)}body.ingame,html:has(body.ingame){background:var(--box,#1d2350)}body.ingame #toast{top:calc(var(--hud) + 56px);bottom:auto;left:var(--g);right:var(--g);max-width:none;transform:none!important;opacity:0;transition:opacity .2s;text-align:left;pointer-events:none;z-index:40;font-size:11px;padding:6px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.ingame #toast.on{opacity:1}body.ingame #wev{top:calc(var(--hud) + 56px + 34px);left:var(--g);right:auto;max-width:calc(100vw - 16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;padding:3px 8px;opacity:.9}body.ingame #upd{top:calc(var(--hud) + var(--g))}body.ingame #panel{display:flex;flex-direction:column;height:var(--ph);overflow:hidden;padding:0 var(--g) calc(min(env(safe-area-inset-bottom),10px) + var(--g));border-radius:16px 16px 0 0;box-shadow:0 -2px 0 var(--ink),0 0 0 transparent}body.ingame #room{display:none!important}body.ingame #panel>*{flex-shrink:0}body.ingame #panel{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}body.ingame #acts{flex:none;overflow:visible;min-height:72px}body.ingame #tipbox{position:sticky;top:0;z-index:3;background:var(--box,#1d2350);padding-bottom:4px;margin-top:0}body.ingame #tipbox .act small{display:none!important}body.ingame #tipbox .act{min-height:48px}body.ingame #ptabs{position:sticky;top:0;z-index:2;background:var(--box,#1d2350);padding:4px 0;margin-top:0}body.ingame #tipbox:not(.hide)+#ptabs{top:52px}body.ingame #panel.max{height:72vh}body.ingame #panel.min{height:auto}@keyframes pup{from{transform:translateY(12px);opacity:.6}}body.ingame #grip{flex:none;min-height:16px;height:16px;font-size:0;overflow:hidden;padding:0;margin:2px 0;background:none;border:0;box-shadow:none;position:relative}body.ingame #grip::after{content:"";position:absolute;left:50%;top:6px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:#b9c2e8;opacity:.6}body.ingame #here{flex:none;font-size:16.5px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.ingame #note{flex:none;font-size:11px;line-height:1.3;max-height:2.6em;overflow:hidden;margin:2px 0}body.ingame #fb,body.ingame #tipbox,body.ingame #ptabs{flex:none}body.ingame #fb{position:absolute;left:var(--g);top:-44px;z-index:3;pointer-events:none}body.ingame #tipbox{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--g);margin:var(--g) 0 0}body.ingame #tipbox .act:only-child{grid-column:1/-1}body.ingame #ptabs{display:flex;gap:4px;margin:var(--g) 0 0;overflow-x:auto;scrollbar-width:none}body.ingame #ptabs::-webkit-scrollbar{display:none}body.ingame .ptab{flex:1 0 auto;min-height:44px;padding:0 10px;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;border-radius:12px;background:#26306a;box-shadow:none;border:2px solid var(--ink);white-space:nowrap}body.ingame .ptab i{font-style:normal;font-size:11px;min-width:16px;height:16px;line-height:16px;border-radius:8px;background:rgba(255,255,255,.18);text-align:center}body.ingame .ptab.z{opacity:.5}body.ingame .ptab.on{background:#ff4f7e}body.ingame .ptab.on i{background:rgba(0,0,0,.25)}body.ingame #acts{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;margin-top:var(--g);gap:var(--g);grid-template-columns:repeat(3,minmax(0,1fr))!important;align-content:start;-webkit-overflow-scrolling:touch;padding-bottom:4px}body.ingame #acts .act,body.ingame #tipbox .act{min-height:44px;border-radius:12px;padding:4px 8px;gap:6px}body.ingame #acts .act{flex-direction:column;justify-content:center;text-align:center;min-height:64px;padding:6px 4px;gap:2px;position:relative}body.ingame #acts .at{flex:none;width:100%;align-items:center}body.ingame #acts .at b{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.2;text-align:center}body.ingame #acts .pc{position:absolute;top:2px;right:6px}body.ingame #acts .act small{display:none}body.ingame #acts .poor{opacity:.45}body.ingame #acts .at{flex:1;min-width:0}body.ingame #acts .at b{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.ingame #tipbox .at b{font-size:16.5px}body.ingame #tipbox .act:first-child{border-color:#fff}body.ingame #acts .pc{font-style:normal;font-size:11px;color:#ffe08a;flex:none}body.ingame #acts .act small,body.ingame #tipbox .act small{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;-webkit-line-clamp:unset}body.ingame #acts .ai{width:28px;height:28px;font-size:22px;display:flex;align-items:center;justify-content:center}body.ingame #acts .ai img.px{width:28px;height:28px}body.ingame #panel.min #tipbox,body.ingame #panel.min #ptabs{display:none}@media (max-height:700px){body.ingame{--ph:34vh}body.ingame #note{display:none}body.ingame #tipbox,body.ingame #ptabs,body.ingame #acts{margin-top:4px}}#pop{position:fixed;left:0;right:0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;pointer-events:none;z-index:55}.pp{font-size:16.5px;padding:2px 10px;border-radius:14px;background:rgba(11,11,20,.88);border:2px solid #fff;color:#fff;opacity:0;animation:ppup 1.8s ease-out forwards}.pp.g{color:#7dff9a}.pp.b{color:#ff9a9a}.pp img.px{width:16px;height:16px;vertical-align:-2px}@keyframes ppup{0%{transform:translateY(14px);opacity:0}15%{opacity:1;transform:none}75%{opacity:1}100%{transform:translateY(-40px);opacity:0}}body.ingame #needs{position:absolute}html:has(body.ingame),body.ingame{overflow:hidden;overscroll-behavior:none}@media (prefers-reduced-motion:reduce){.pp{animation:none;opacity:1}}@media (prefers-reduced-motion:reduce){body.ingame #panel,body.ingame #toast{animation:none;transition:none}body.ingame .need.low{animation:none}}body.ingame{--sr:52px;--mr:28px;--tbh:56px;--top:calc(var(--hud) + var(--sr) + var(--mr))}body.ingame #stage{top:var(--top)!important;bottom:calc(var(--phpx,var(--ph)) + var(--tbh))!important}body.ingame #needs{height:var(--hud);z-index:60}body.ingame #strip{position:fixed;top:var(--hud);left:0;right:0;width:auto;height:var(--sr);padding:4px 8px;background:#141a3a;border-bottom:2px solid var(--ink);box-sizing:border-box;align-items:center;gap:6px;z-index:50}body.ingame #strip button{height:44px;background:#26306a;border:2px solid var(--ink);box-shadow:none}body.ingame::before{content:"";position:fixed;left:0;right:0;top:calc(var(--hud) + var(--sr));height:var(--mr);background:#0b0b14;border-bottom:2px solid var(--ink);z-index:49}body.ingame #toast,body.ingame #wev{position:fixed;top:calc(var(--hud) + var(--sr));left:0!important;right:0!important;bottom:auto!important;width:auto;max-width:none;height:var(--mr);box-sizing:border-box;margin:0;border:0;border-radius:0;box-shadow:none;background:#0b0b14;color:#fff;font-size:11px;line-height:var(--mr);padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;opacity:1;transform:none!important}body.ingame #wev{z-index:51;color:#ffd666}body.ingame #toast{z-index:52;opacity:0;pointer-events:none}body.ingame #toast.on{opacity:1}body.ingame::after{content:"";position:fixed;left:0;right:0;bottom:var(--phpx,var(--ph));height:var(--tbh);background:#141a3a;border-top:2px solid var(--ink);z-index:0}body.ingame .bar{position:fixed;top:auto!important;right:auto!important;left:8px;bottom:calc(var(--phpx,var(--ph)) + 4px);width:calc((100vw - 40px)/4);z-index:21}body.ingame .tools{position:fixed;top:auto;bottom:calc(var(--phpx,var(--ph)) + 4px);left:calc(16px + (100vw - 40px)/4);right:8px;display:flex;flex-direction:row;gap:8px;z-index:21}body.ingame #menuBtn,body.ingame .tools button{flex:1;width:100%;min-width:0;height:48px;flex-direction:row;gap:4px;border-radius:12px;padding:0 4px;font-size:11px;background:#3a4a8c;border:2px solid var(--ink);box-shadow:none}body.ingame #tips,body.ingame #away{top:calc(var(--top) + 8px)}body.ingame #upd{top:calc(var(--top) + 8px)}body.ingame{--hud:calc(env(safe-area-inset-top) + 44px);--nav:calc(56px + env(safe-area-inset-bottom));--ph:clamp(250px,32dvh,340px)}body.ingame::before{display:none}body.ingame #needs{height:var(--hud);padding:env(safe-area-inset-top) 8px 0;align-items:center;z-index:60}body.ingame #stage{top:var(--hud)!important;bottom:calc(var(--phpx,var(--ph)) + var(--nav))!important}body.ingame #strip{display:none}body.fr.ingame #strip{display:flex;position:fixed;top:auto;bottom:calc(var(--nav) + var(--phpx,var(--ph)));left:0;right:0;height:56px;padding:6px 8px;background:#141a3a;border-top:2px solid var(--ink);border-bottom:0;z-index:50;overflow-x:auto}body.ingame::after{content:"";position:fixed;left:0;right:0;bottom:0;top:auto;height:var(--nav);background:#141a3a;border-top:2px solid var(--ink);z-index:0}body.ingame .bar{position:fixed;top:auto!important;right:auto!important;left:0;bottom:env(safe-area-inset-bottom);width:20vw;height:56px;z-index:21}body.ingame .tools{position:fixed;top:auto;bottom:env(safe-area-inset-bottom);left:20vw;right:0;height:56px;display:flex;flex-direction:row;gap:0;z-index:21;padding:0;background:none}body.ingame #menuBtn,body.ingame .tools button{flex:1;width:100%;min-width:0;height:56px;flex-direction:column;gap:2px;border-radius:0;padding:4px 0;font-size:11px;line-height:1.1;background:transparent;border:0;box-shadow:none;color:#fff}body.ingame #menuBtn img.px,body.ingame .tools button img.px{width:22px;height:22px}body.fr.ingame #friendBtn{background:#ff4f7e}body.ingame #toast.on~#wev{visibility:hidden}body.ingame #toast,body.ingame #wev{top:calc(var(--hud) + 6px);left:8px!important;right:8px!important;height:28px;line-height:28px;border-radius:14px;border:2px solid #fff;padding:0 12px;background:#0b0b14}body.ingame #wev{right:auto!important;max-width:calc(100vw - 16px);width:fit-content}body.ingame #tips,body.ingame #away,body.ingame #upd{top:calc(var(--hud) + 8px)}body.ingame #panel{max-height:none;bottom:var(--nav);overflow-y:auto;padding-bottom:8px;border-radius:16px 16px 0 0}body.ingame #panel.max{height:calc(100dvh - var(--hud) - var(--nav) - 24px)}body.ingame #panel.min{height:auto}body.ingame #pinbox{position:absolute;top:14px;right:8px;display:flex;gap:6px;z-index:4}body.ingame #pinbox .act{min-height:40px;min-width:88px;flex-direction:row;padding:0 12px;border-radius:12px;border-color:#fff;font-size:11px;gap:6px;justify-content:center}body.ingame #pinbox .act .at b{font-size:16.5px}body.ingame #pinbox .act small{display:none!important}body.ingame #panel.haspin #here{padding-right:112px}body.ingame #here{height:28px;line-height:28px;font-size:16.5px}body.ingame #note{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-height:1.5em;margin:0 0 4px}body.ingame #tipbox{position:static;padding:0;margin-top:4px;background:none}body.ingame #ptabs{position:static;padding:0;margin-top:6px;background:none}body.ingame #acts{flex:1 1 auto;min-height:72px;overflow-y:auto;overflow-x:hidden;scroll-snap-type:y proximity;overscroll-behavior:contain;padding-bottom:0;margin-top:6px}body.ingame #acts .act{scroll-snap-align:start}body.ingame #acts.more{-webkit-mask-image:linear-gradient(#000 calc(100% - 18px),transparent);mask-image:linear-gradient(#000 calc(100% - 18px),transparent)}body.ingame #panel.min #pinbox{top:10px}body.ingame #acts{grid-auto-rows:60px}body.ingame #acts .act{height:60px;min-height:60px;padding:4px}body.ingame #acts .ai,body.ingame #acts .ai img.px{width:24px;height:24px;font-size:18px}body.ingame #acts .at b{font-size:11px;line-height:1.15}body.ingame{--sb:min(env(safe-area-inset-bottom),20px);--nav:calc(56px + var(--sb))}html:has(body.ingame),body.ingame{background:#141a3a}body.ingame .bar,body.ingame .tools{bottom:var(--sb)}body.ingame #menuBtn img.px,body.ingame .tools button img.px{width:24px;height:24px}body.ingame #menuBtn span:first-child{font-size:22px;line-height:24px;height:24px}body.ingame .need{grid-template-columns:24px 1fr;grid-template-rows:24px;height:30px}body.ingame .need span{width:24px;height:24px;grid-row:1}body.ingame .need span img.px{width:24px;height:24px;image-rendering:pixelated}body.ingame .need i{height:12px;grid-row:1;align-self:center}body.ingame .need.money small{line-height:24px}.pp img.px{width:12px;height:12px}body.ingame.social #social{top:var(--hud);bottom:var(--nav);left:0;right:0;inset:var(--hud) 0 var(--nav) 0;padding:12px 12px 16px}body.ingame #modal{padding:calc(var(--hud) + 8px) 12px calc(var(--nav) + 8px)}body.ingame #modal .card{max-height:100%}body.social #toast,body.social #wev{display:none}body.ingame #panel.haspin #here{height:44px;line-height:44px}body.ingame #pinbox{top:16px;height:44px;align-items:center}body.ingame #pinbox .act{min-height:44px}body.ingame #note{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;max-height:2.6em}body.ingame{position:fixed;inset:0;width:100%;overflow:hidden}body.ingame #needs{top:env(safe-area-inset-top);height:44px;padding:0 8px;-webkit-font-smoothing:none}body.ingame::before{display:block;content:"";position:fixed;left:0;right:0;top:0;height:env(safe-area-inset-top);background:#0b0b14;z-index:61}body.ingame #needs *{image-rendering:pixelated}body.ingame #acts .at em.nm{font-style:normal;font-size:11px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:block;line-height:1.1}body.ingame #acts .at b{-webkit-line-clamp:1}body.ingame #feedBtn{position:relative}body.ingame #feedBtn .badge{position:absolute;top:2px;left:calc(50% + 6px);right:auto;margin:0;transform:none}body.ingame #note{white-space:nowrap;display:block;max-height:1.5em;overflow:hidden;text-overflow:ellipsis}body.ingame #acts .act.info{grid-column:1/-1;flex-direction:row;text-align:left;justify-content:flex-start;gap:8px;background:#26306a}body.ingame #acts .act.info .at{align-items:flex-start}body.ingame #acts .act.info small{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;font-size:11px;line-height:1.2}body.ingame #grip,body.ingame #here,body.ingame #note{margin-left:-8px;margin-right:-8px;padding-left:8px;padding-right:8px;background:#0b0f26}body.ingame #note{margin-top:0;margin-bottom:0;padding-bottom:2px;border-bottom:2px solid #3a4a8c}body.ingame #panel.haspin #here{padding-right:120px}body.ingame #tipbox{display:grid;grid-template-columns:20px repeat(2,minmax(0,1fr));gap:6px;margin:0 -8px;padding:6px 8px;background:#1b2250;border-bottom:2px solid #3a4a8c}body.ingame #tipbox::before{content:"建議";writing-mode:vertical-rl;text-align:center;font-size:11px;line-height:20px;color:#fff;background:#ff4f7e;border-radius:4px;letter-spacing:0}body.ingame #tipbox .act:only-child{grid-column:2/-1}body.ingame #ptabs{margin:0 -8px;padding:6px 8px 0;background:#141a3a;border-bottom:2px solid #3a4a8c;gap:4px}body.ingame .ptab{background:#0b0f26;border:0;border-radius:8px 8px 0 0;box-shadow:none;color:#b9c2e8}body.ingame .ptab.on{background:#ff4f7e;color:#fff;box-shadow:inset 0 -4px 0 #fff}body.ingame #acts{margin:0 -8px;padding:6px 8px 0;background:#222b60;box-sizing:content-box}body.ingame #acts .act[data-g=self],body.ingame #acts .act[data-g=eat]{border-left:6px solid #4cd964}body.ingame #acts .act[data-g=soc],body.ingame #acts .act[data-g=face],body.ingame #acts .act[data-g=online],body.ingame #acts .act[data-g=friend]{border-left:6px solid #5ab0ff}body.ingame #acts .act[data-g=work]{border-left:6px solid #ffd666}body.ingame #acts .act[data-g=mis],body.ingame #acts .act.bad{border-left:6px solid #ff5a5a}body.ingame #needs{grid-template-columns:repeat(5,minmax(0,1fr)) 84px;gap:4px}body.ingame .need{grid-template-columns:24px 1fr;grid-template-rows:20px 4px;height:30px;row-gap:2px;cursor:pointer}body.ingame .need span{grid-row:1/3;grid-column:1}body.ingame .need small{display:block;grid-column:2;grid-row:1;font-size:11px;line-height:20px;color:#fff;text-align:center}body.ingame .need small em{display:none}body.ingame .need i{grid-column:2;grid-row:2;height:4px;border:0;margin:0;background:#0f1530;align-self:start}body.ingame .need.low i b{animation:lowp 1s steps(2) infinite}body.ingame .need.money{grid-template-columns:24px 1fr;grid-template-rows:24px}body.ingame .need.money small{grid-row:1;line-height:24px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media (prefers-reduced-motion:reduce){body.ingame .need.low i b{animation:none}}body.ingame .jobcard{grid-column:1/-1;height:60px;box-sizing:border-box;padding:6px 10px;background:rgba(255,255,255,.07);border:0;box-shadow:none;border-radius:8px;display:flex;flex-direction:column;justify-content:center;gap:4px;pointer-events:none}body.ingame .jobcard .jr1{display:flex;justify-content:space-between;align-items:baseline}body.ingame .jobcard .jr1 b{font-size:16.5px;color:#fff}body.ingame .jobcard .jr1 span{font-size:16.5px;color:#ffd666}body.ingame .jobcard .jr2{display:flex;align-items:center;gap:8px}body.ingame .jobcard i{flex:0 0 72px;height:8px;background:#0f1530;border-radius:4px;overflow:hidden;display:block}body.ingame .jobcard u{display:block;height:100%;background:#ffd666;text-decoration:none}body.ingame .jobcard small{font-size:11px;color:#b9c2e8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}body.ingame .need.money .cu{display:inline!important;font-style:normal;margin-right:1px}body.ingame .need.money small{color:#ffd666}body.ingame #toast{background:#0e0d1a!important;color:#fff!important;border:2px solid #fff!important;z-index:200!important}body.ingame #toast.on{opacity:1!important}body.ingame #acts{grid-auto-rows:auto}body.ingame #acts .subh{grid-column:1/-1;height:22px;line-height:22px;font-size:11px;color:#b9c2e8;background:rgba(255,255,255,.07);border-radius:4px;padding:0 8px;pointer-events:none;border:0;box-shadow:none;scroll-snap-align:start}body.ingame #acts .act.poor{height:auto;min-height:60px;flex-direction:column;justify-content:center;align-items:stretch;text-align:left}body.ingame #acts .act.poor .at{align-items:flex-start;width:100%}body.ingame #acts .act.poor .at b{text-align:left;-webkit-line-clamp:1}body.ingame #acts .act.poor small{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;text-align:left;font-size:11px;line-height:1.2;color:#ffb0b0;max-width:100%}body.ingame #panel{transition:height .15s ease-out;min-height:190px;max-height:none!important}@media (prefers-reduced-motion:reduce){body.ingame #panel{transition:none}}`;(document.head||document.documentElement).appendChild(st)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="pccss";st.textContent=`@media (min-width:900px){body.ingame{--L:max(0px,calc((100vw - 1600px)/2));--sw:clamp(380px,28vw,420px);--stw:calc(100vw - 2*var(--L) - var(--sw));--nav:56px!important;--sb:0px!important;--hud:56px!important}body.ingame #needs{left:calc(var(--L) + (var(--stw) - min(720px,var(--stw)))/2)!important;right:auto!important;width:min(720px,var(--stw))!important}body.ingame #stage{position:fixed!important;margin:0!important;left:var(--L)!important;right:calc(var(--L) + var(--sw))!important;width:auto!important;top:var(--hud)!important;bottom:0!important}body.ingame #panel{position:fixed!important;left:auto!important;right:var(--L)!important;top:0!important;bottom:auto!important;max-height:calc(100dvh - var(--nav) - 24px - 170px)!important;width:var(--sw)!important;height:auto!important;min-height:0!important;max-height:none!important;border-radius:0!important;transition:none!important;box-sizing:border-box}body.ingame #grip{display:none!important}body.ingame::after{left:calc(100vw - var(--L) - var(--sw))!important;right:var(--L)!important;bottom:0!important}body.ingame .bar{left:calc(100vw - var(--L) - var(--sw))!important;width:calc(var(--sw)/5)!important;bottom:0!important}body.ingame .tools{left:calc(100vw - var(--L) - var(--sw) + var(--sw)/5)!important;right:var(--L)!important;bottom:0!important}body.ingame #kbh{display:block}body.ingame .need small,body.ingame .need.money small{font-size:16.5px!important;line-height:24px!important}body.ingame .need{grid-template-rows:24px 4px!important}body.ingame .bar #title{display:none!important}body.fr.ingame #strip{left:calc(100vw - var(--L) - var(--sw))!important;right:var(--L)!important;bottom:calc(var(--nav) + 24px)!important}body.fr.ingame #info{bottom:calc(var(--nav) + 24px + 56px)!important}body.ingame #info{display:block}body.ingame #stage{z-index:1!important}body.ingame .ptab{font-size:16.5px!important;color:#fff!important;background:#26306a!important;opacity:1!important;min-height:44px}body.ingame .ptab.on{background:#ff4f7e!important}body.ingame .ptab i{font-size:16.5px!important;height:auto!important;line-height:1.2!important;min-width:0!important;padding:0 4px;background:rgba(255,255,255,.25)!important}body.ingame #acts .pc{font-size:16.5px!important;position:static!important;align-self:flex-end;color:#ffe08a!important}body.ingame #note{font-size:16.5px!important;white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical;max-height:none!important;color:#dfe5ff}body.ingame #panel.haspin #here,body.ingame #panel.haspin #note{padding-right:130px!important}body.ingame .need i{height:6px!important}body.ingame .need{grid-template-rows:24px 6px!important;height:34px!important}body.ingame #acts{grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:auto!important}body.ingame #acts .act{height:auto!important;min-height:84px!important;padding:8px!important}body.ingame #acts .at b{font-size:16.5px!important;white-space:normal!important;-webkit-line-clamp:2!important}body.ingame #acts .act small{display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:normal!important;font-size:16.5px;-webkit-line-clamp:2}body.ingame #acts .ai,body.ingame #acts .ai img.px{width:28px!important;height:28px!important}body.ingame #toast,body.ingame #wev{left:calc(var(--L) + 8px)!important;max-width:calc(var(--stw) - 16px)}body.ingame #toast{right:calc(var(--L) + var(--sw) + 8px)!important}body.ingame.social #social{left:var(--L);right:calc(var(--L) + var(--sw));inset:var(--hud) calc(var(--L) + var(--sw)) 0 var(--L)}body.ingame #modal{padding:24px}body.ingame #modal .card{max-width:520px}}#info{display:none;position:fixed;right:var(--L,0px);width:var(--sw,400px);top:var(--phpx,300px);bottom:calc(var(--nav,56px) + 24px);overflow:auto;background:#0b0f26;border-top:2px solid #3a4a8c;padding:8px;box-sizing:border-box;color:#fff;font-size:16.5px;line-height:1.4;z-index:24;pointer-events:none}#info h4{margin:0 0 4px;font-size:16.5px;color:#fff;font-weight:400}#info .ir{overflow:hidden;font-size:16.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:2px}#info .ir em{font-style:normal;color:#ffd666;margin-right:6px}#info .jb{margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #3a4a8c}body:not(.ingame) #info{display:none!important}#kbh{display:none;position:fixed;left:calc(100vw - var(--L,0px) - var(--sw,400px));right:var(--L,0px);bottom:var(--nav,56px);height:24px;line-height:24px;font-size:16.5px;color:#fff;background:#0b0f26;text-align:center;z-index:22;pointer-events:none;white-space:nowrap;overflow:hidden}#tip2{display:none;position:fixed;z-index:70;pointer-events:none;background:#0e0d1a;color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 8px;font-size:11px;white-space:nowrap}body:not(.ingame) #kbh,body:not(.ingame) #tip2{display:none!important}`;(document.head||document.documentElement).appendChild(st)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="fxcss";st.textContent=`body.ingame #acts{grid-auto-rows:76px!important}body.ingame #acts .act{height:76px!important;min-height:76px!important;justify-content:flex-start;padding-top:6px}#acts .fr{display:flex;gap:4px;justify-content:center;align-items:center;height:14px;max-width:100%;overflow:hidden;white-space:nowrap}#acts .fc,#fxcard .fc{font-style:normal;font-size:11px;line-height:14px;display:inline-flex;align-items:center;gap:1px;white-space:nowrap}#acts .fc img.px,#fxcard .fc img.px{width:12px;height:12px}.fc.up{color:#8dffa0}.fc.dn{color:#ff8a8a}.fc.gd{color:#ffe08a}.fc.gate{color:#ff8a8a;background:#2a1a2a;padding:0 3px}.fc.ok{color:#8dffa0}#fxcard{display:none;position:fixed;left:8px;right:8px;bottom:calc(var(--phpx,300px) + var(--nav,56px) + 8px);max-width:360px;margin:0 auto;z-index:60;background:#14122b;border:3px solid #ffe08a;padding:8px 10px;font-size:11px;color:#fff;pointer-events:none;clip-path:polygon(0 4px,2px 4px,2px 2px,4px 2px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px))}#fxcard b{font-size:16.5px;display:block;margin-bottom:4px}#fxcard p{margin:2px 0;color:#cfd3ff}#fxcard .r{display:flex;gap:8px;align-items:center;margin-top:4px}#fxcard small{display:block;margin-top:6px;opacity:.6}@media (min-width:900px){body.ingame #acts .act .at b{font-size:16.5px}#fxcard{left:auto;right:calc(var(--L,0px) + 12px);width:340px;bottom:90px}}`;document.head.appendChild(st)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="dealcss";st.textContent=`/* 發牌臨場感：新牌從牌堆滑進來、蓋牌翻面（步進動畫，像素風）；結果等牌發完才出現；減少動態效果時關掉 */
.pcard{position:relative}
.pcard.dealt{animation:pdeal .28s steps(7) backwards;animation-delay:var(--d,0ms)}
.pcard.dealt::after{content:"";position:absolute;left:-3px;top:-3px;right:-3px;bottom:-3px;background:repeating-linear-gradient(45deg,#e0779b 0 6px,#c45a80 6px 12px);animation:pcover .28s steps(1) forwards;animation-delay:var(--d,0ms)}
.pcard.dealt.nocover::after{display:none}
.gres.late{animation:gresin .2s steps(4) backwards;animation-delay:var(--d,0ms)}
.gshow.felt{background:#1d6b3f;border:3px solid var(--ink);box-shadow:inset 0 0 0 3px #145230;padding:8px}
.dealer{color:#f1c40f;margin:0 0 4px;font-size:16px;animation:pblink 1s steps(2) infinite}
.wnums{grid-template-columns:repeat(6,1fr)}.knums{grid-template-columns:repeat(10,1fr)}.knums button{padding:6px 0;font-size:14px}
@keyframes pdeal{0%{transform:translate(90px,-70px);opacity:0}25%{opacity:1}60%{transform:translate(0,0)}80%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
@keyframes pcover{0%,78%{opacity:1}79%,100%{opacity:0;visibility:hidden}}
@keyframes gresin{0%{opacity:0;transform:translateY(8px) scale(.8)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:none}}
@keyframes pblink{50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){.pcard.sq,.pcard.dealt,.pcard.dealt::after,.gres.late,.dealer{animation:none}}`;document.head.appendChild(st)})();
typeof document!=="undefined"&&(()=>{const st=document.createElement("style");st.id="chipcss";st.textContent=`/* 籌碼面額與百家樂路單 */
.ctray{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0}
.chip{--c:#888;width:40px;height:40px;border-radius:50%;border:3px dashed #fff9;background:var(--c);color:#fff;font:700 11px/1 'Cubic 11',monospace;padding:0;box-shadow:0 3px 0 #0006,inset 0 0 0 3px var(--c);text-shadow:0 1px 0 #000a;cursor:pointer}
.chip:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 #0006,inset 0 0 0 3px var(--c)}
.chip:disabled{opacity:.3;cursor:default;filter:grayscale(.6)}
.crow{display:flex;align-items:center;gap:8px;justify-content:center;margin:4px 0 8px;flex-wrap:wrap}
.bstack{display:flex;align-items:flex-end;gap:8px;min-height:46px;padding:2px 10px;border-radius:10px;background:#0a3d2a;box-shadow:inset 0 0 0 2px #1d6b4c}
.cstk{position:relative;display:inline-block;width:34px;height:42px}
.chip.s{position:absolute;left:0;bottom:calc(var(--k)*3px);width:32px;height:32px;font-size:9px;border-width:2px;pointer-events:none;animation:chipdrop .18s steps(3) both}
@keyframes chipdrop{from{transform:translateY(-14px);opacity:0}to{transform:none;opacity:1}}
.bamt{color:#ffe9a8;font-size:16.5px}
.roads{margin-top:8px}.rlab{font-size:11px;color:#aaa;margin:6px 0 2px}
.rgrid{display:flex;gap:2px;overflow:hidden;justify-content:flex-start;padding:3px;background:#f4efe0;border-radius:6px;width:max-content;max-width:100%}
.rgrid>div{display:flex;flex-direction:column;gap:2px}
.bd,.bg{display:block;width:18px;height:18px;border-radius:50%;box-sizing:border-box;font-style:normal;font-size:11px;line-height:18px;text-align:center;color:#fff;background:#0001;position:relative}
.bd.B{background:#d64541}.bd.P{background:#3b7dd8}.bd.T{background:#2e9e5b}
.bg.B,.bg.P{background:none;border:3px solid #d64541}.bg.P{border-color:#3b7dd8}.bg.T{background:none}
.bg s{position:absolute;left:-1px;top:7px;width:18px;height:3px;background:#2e9e5b;transform:rotate(-45deg)}
.rb{color:#d64541}.rp{color:#3b7dd8}.rt{color:#2e9e5b}
/* 防晃動：賭場視窗靠上對齊（高度變了不會整個面板上下跳）、牌桌固定框線與最小高度、「莊家發牌中」浮在牌桌上不佔版面、捲軸槽固定 */
#modal:has(.gmenu),#modal:has(.garea){align-items:flex-start;padding-top:12px}
#modal .card{scrollbar-gutter:stable}
.gshow{position:relative;box-sizing:border-box;border:3px solid transparent;padding:8px;min-height:150px}
.gshow .dealer{position:absolute;top:2px;right:8px;margin:0;z-index:2;font-size:11px;pointer-events:none}
.nochip{margin:6px 0}
.jpbar{text-align:center;color:#ffe9a8;margin:4px 0;padding:4px;background:#2a1a4a;border:3px solid #d4a72c;box-shadow:0 0 0 3px var(--ink)}
.gshow.hold::after{content:"…";position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:22px;color:#ffe9a8;animation:pblink .4s steps(2) infinite}
/* 精簡牌桌：標題列一行（遊戲名、籌碼、規則鈕），規則點開才浮出（不推版面）；咪牌：牌面蓋一層，按住往上拖慢慢掀開 */
#modal .card{position:relative}
.tbar{display:flex;align-items:center;gap:8px}.tbar h2{margin:0;flex:1;white-space:nowrap;min-width:0;overflow:hidden}.tchip{color:#ffe9a8;white-space:nowrap}.rbtn{padding:4px 10px;min-height:32px}
.rpop{position:absolute;left:8px;right:8px;top:52px;z-index:6;background:#101526;border:3px solid #fff;padding:10px;line-height:1.5;box-shadow:0 0 0 3px var(--ink)}
.cdnote:empty{display:none}
.roadsd>summary{cursor:pointer;color:#aaa;margin-top:6px}
.pcard.sq{position:relative;overflow:hidden;animation:sqin .24s steps(4) backwards;animation-delay:var(--d,0ms)}
@keyframes sqin{from{transform:translate(60px,-40px);opacity:0}to{transform:none;opacity:1}}
.sqc{position:absolute;left:0;top:0;right:0;bottom:0;background:repeating-linear-gradient(45deg,#e0779b 0 6px,#c45a80 6px 12px);cursor:grab;touch-action:none;display:flex;align-items:flex-end;justify-content:center;color:#fff;font-size:11px;font-style:normal}
.sqskip{position:absolute;right:6px;top:6px;z-index:3;padding:4px 10px;min-height:32px}
.sqhint{position:absolute;left:8px;top:8px;max-width:38%;line-height:1.3;z-index:3;font-size:11px;color:#cfe8d6;pointer-events:none}
/* 賭場桌面 v2：像素籌碼、下注列固定在底部、遊戲切換列、手機不擠 */
.chip{border-radius:0;clip-path:polygon(0 6px,2px 6px,2px 2px,6px 2px,6px 0,calc(100% - 6px) 0,calc(100% - 6px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 6px,100% 6px,100% calc(100% - 6px),calc(100% - 2px) calc(100% - 6px),calc(100% - 2px) calc(100% - 2px),calc(100% - 6px) calc(100% - 2px),calc(100% - 6px) 100%,6px 100%,6px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 6px),0 calc(100% - 6px));width:44px;height:44px;border:4px double #fffd;box-shadow:none;font-size:11px}
.chip.s{width:30px;height:30px;border-width:3px;font-size:11px}
.ctray{flex-wrap:wrap;justify-content:center;gap:4px;padding:2px}
.ctray .chip{flex:none}
.betbar{position:sticky;bottom:-1px;z-index:4;background:#101526;border-top:3px solid #fff;margin:8px -4px 0;padding:6px 8px 4px}
.betbar .crow{margin:0 0 4px;justify-content:space-between;flex-wrap:nowrap}
.cacts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px}
.cacts button{min-height:44px;padding:0 2px}
.glast{font-size:16.5px;color:#cfd6e6;white-space:nowrap}.glast.good{color:#7ee787}.glast.bad{color:#ff8a80}
.gtabs{position:absolute;left:8px;right:8px;top:52px;z-index:7;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;background:#101526;border:3px solid #fff;box-shadow:0 0 0 3px var(--ink)}.gtabs.hide{display:none}
.gtabs .gt{min-width:0;min-height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:2px 6px;font-size:11px}
.gtabs .gt img.px{width:20px;height:20px}
.gtabs .gt.on{background:#e0779b;color:#fff}
.godds{margin:0 0 4px;font-size:11px}
.cbal{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:6px 0;color:#ffe9a8}
.cbal b.good{color:#7ee787}.cbal b.bad{color:#ff8a80}
.clab{font-size:11px;color:#aaa;min-width:84px;align-self:center}
.chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.chips button{min-height:44px}.chips button small{display:block;font-size:11px;color:#ffb4a8}
.cnote{font-size:11px;margin:4px 0}
@media (max-width:700px){.gshow{min-height:110px;padding:6px}#modal .card h2{font-size:16.5px}.tbar .rbtn{min-height:44px}}
`;document.head.appendChild(st)})();
// 小豬鎮：任何人都能建立自己的小鎮，拿邀請碼的朋友搬進來；需求隨現實時間下降，所有改動都經過 Supabase 的資料庫函式
const SB="https://gerqdagicybtyilihvvm.supabase.co/rest/v1/rpc/",SBK="sb_publishable_bPvbJFXUM_Ax2iPLeTS5zw_foV60x5y";
const rpcF=(fn,body={})=>{const b=JSON.stringify(body),p=window.LP&&LP.pre&&LP.pre[fn];if(p&&!p.used&&p.b==b&&Date.now()-p.t<2e4){p.used=1;return p.f}return fetch(SB+fn,{method:"POST",keepalive:true,headers:{apikey:SBK,"Content-Type":"application/json"},body:b})};
let rpcHook=null,LOGIN_DEAD=0;const LOSTMSG="這台裝置的登入失效了";const rpc=(fn,body={})=>{if(LOGIN_DEAD&&body&&body.pin&&fn!="town_device")return Promise.reject(new Error(LOSTMSG+"，請重新登入"));if(rpcHook)try{rpcHook(fn,body)}catch(e){}return rpcF(fn,body).catch(()=>{throw new Error("連不上小鎮，檢查網路後再按一次")})
 .then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok){const m=(j&&j.message)||"小鎮暫時沒回應，過一下再按一次";if(m.indexOf(LOSTMSG)>=0&&body&&body.pin&&window.__lost)window.__lost();throw new Error(m)}if(j&&j.error){if(j.error.indexOf(LOSTMSG)>=0&&body&&body.pin&&window.__lost)window.__lost();throw new Error(j.error)}return j})};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── 地圖：寬 34 格。市中心固定；住宅一排 3 間（5×4 格，門在正下方），住滿就往下多開一條街，最多 4 排 ──
const T=32,COLS=71,MAXROWS=4;let NR=2,OFF=new Set(),POOPS=[];
// 鎮長可以關掉的設施
const FEATS=[["cafe","咖啡廳","喝咖啡回精力"],["cinema","電影院","看電影心情大增"],["gym","健身房","練體能，打架更強"],["arena","格鬥場","打擂台、約打"],["slaughter","屠宰場","溜進去偷飼料，有賺有賠"],["arcade","小豬街機","猜拳、打地鼠、記憶翻牌、下戰帖"],["casino","小豬賭場","押錢遊戲 9 種，用籌碼玩，換回現金抽 1.5%"],["rafi","拉菲's office","白領打工，薪水較高"],["stock","證券交易所","買賣 8 檔小豬鎮股票"],["zombie","喪屍豬","夜間街上會出現喪屍豬，打倒領獎"],["carshop","車行","買腳踏車、機車、汽車"],["lux","奢侈品","高級套餐、溫泉、旅行（錢多的人花錢用）"],["jail","監獄","砍人被抓的人關在這裡，可勞動、探監、保釋"],["hospital","醫院","昏倒、住院的人送這裡，可看診、探病"],["police","警察局","繳罰單、自首、報案、治安統計"],["townhall","市政廳","鎮基金、公告、居民投票、建設案"]];
const setOff=a=>{OFF=new Set(a||[])};const isOn=k=>!OFF.has(k);
const setRows=n=>{NR=clamp(n||2,2,MAXROWS)};
const mapRows=()=>NR<=2?23:30+7*(NR-3);
const STREETS=["小豬大道","豬尾巴街","豬鼻子街","豬蹄巷"];
const ROOFS=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#e0779b","#2a9d8f","#6c5ce7","#c0392b","#16a085","#7f8c8d"];
const homeXY=s=>{const k=Math.floor(s/3);return [[2,9,20][s%3],k==0?1:k==1?17:24+7*(k-2)]};
const door=s=>{const [x,y]=homeXY(s);return [x+2,y+4]};
const visitSpot=s=>{const d=door(s);return [d[0]+1,d[1]]};// 去朋友家站在門口旁邊，不要和主人疊在一起
const PLACES={
 restaurant:{r:[2,9,6,5],door:[5,14],name:"餐廳",block:1},
 market:{r:[24,9,8,5],door:[28,14],name:"超市",block:1},
 office:{r:[27,0,7,6],door:[30,6],name:"公司",block:1},
 park:{r:[27,17,9,5],door:[31,19],name:"公園"},
 cafe:{r:[36,0,6,5],door:[38,5],name:"咖啡廳",block:1},
 cinema:{r:[36,9,8,5],door:[40,14],name:"電影院",block:1},
 gym:{r:[38,17,6,4],door:[40,21],name:"健身房",block:1},
 rafi:{r:[46,17,7,4],door:[49,21],name:"拉菲's office",block:1},
 stock:{r:[44,0,4,5],door:[45,5],name:"證券交易所",block:1},
 carshop:{r:[46,10,2,4],door:[46,14],name:"車行",block:1},
 arena:{r:[50,0,7,6],door:[53,6],name:"格鬥場",block:1},
 slaughter:{r:[50,9,7,5],door:[53,14],name:"屠宰場",block:1},
 jail:{r:[59,0,5,5],door:[61,5],name:"監獄",block:1},
 hospital:{r:[59,9,5,5],door:[61,14],name:"醫院",block:1},
 police:{r:[56,17,6,4],door:[58,21],name:"警察局",block:1},
 townhall:{r:[66,0,5,5],door:[68,5],name:"市政廳",block:1},
 casino:{r:[66,9,5,5],door:[68,14],name:"賭場",block:1},
 plaza:{r:[12,8,10,7],door:[14,11],name:"廣場"}};
// 其他工作（和 town.sql 的 town_pjob_* 一致）：[名稱, 地點, 底薪, [精力,飽足,心情,清潔]]；熟練 15 次 ×1.15、40 次 ×1.3；拉菲底薪 320／450／650，要先升到「員工」
const PJ={cafe:["咖啡師","cafe",200,[-19,-6,-6,-3],"cafe"],rest:["服務生","restaurant",210,[-22,-3,-8,-8],"restaurant"],gym:["健身教練","gym",260,[-32,-12,-4,-15],"gym"],shop:["店員","market",195,[-16,-6,-10,-2],"market"],rafi:["行政專員","rafi",320,[-25,-8,-18,-4],"rafi"]};
const PJT=[0,15,40,80,140,220,350],PJM=[100,118,138,160,185,210,240],RFT=[0,15,40,60,80,150,260,400,600,900],RFW=[320,450,650,690,740,840,950,1050,1200,1400];
const PJN={cafe:["咖啡師","咖啡師（熟手）","咖啡師（資深）","咖啡廳領班","咖啡廳副店長","咖啡廳店長","咖啡廳區經理"],rest:["服務生","服務生（熟手）","服務生（資深）","餐廳領班","餐廳副理","餐廳經理","餐飲總監"],gym:["健身教練","健身教練（熟手）","健身教練（資深）","健身房領班","健身房副理","健身房經理","健身房區總監"],shop:["店員","店員（熟手）","店員（資深）","超市領班","超市副店長","超市店長","超市區經理"],rafi:["行政專員","企劃","業務經理","資深業務經理","部門主任","協理","業務總監","業務負責人","總經理","董事長"]};
const pjTier=(k,n)=>(k=="rafi"?RFT:PJT).reduce((a,t,i)=>n>=t?i:a,0);
const pjWage=(k,n)=>k=="rafi"?RFW[pjTier(k,n)]:Math.floor(PJ[k][2]*PJM[pjTier(k,n)]/100);
const pjName=(k,n)=>PJN[k][pjTier(k,n)];
const JOBS=[["實習生",0,190],["員工",10,260],["組長",30,350],["經理",70,520],["主管",150,800],["資深主管",250,920],["協理",400,1050],["副總",650,1250],["總經理",1000,1500]];
const FOUNTAIN=[16,10,2,3];
// 路上物件：位置要和資料庫 town_obj_near 一致；用法：[名稱, 按鈕, 說明]
const OBJS={vend:{x:19,y:5,name:"自動販賣機",acts:[["投一罐飲料 🥤","€30 · 精力 +12 · 偶爾掉兩罐"]]},trash:{x:8,y:14,name:"垃圾桶",acts:[["撿垃圾 🗑️","心情 +4 · 說不定撿到東西"]]},
 stall:{x:22,y:14,name:"烤地瓜攤",acts:[["買烤地瓜 🍠","€60 · 飽足 +25"]]},well:{place:"plaza",name:"小豬噴水池",acts:[["丟硬幣許願 🪙","€10 · 小機率願望成真"]]},
 dummy:{x:22,y:11,name:"人型靶",acts:[["揍人型靶 👊","免費 · 心情 +5 · 精力 −3 · 沒有冷卻，每揍 10 下體能 +1"]]},bench:{x:14,y:5,name:"長椅",acts:[["坐一下 💤","免費 · 精力 +20"]]},cooler:{x:10,y:14,name:"飲水機",acts:[["喝杯水 💦","免費 · 精力 +3 · 飽足 +3"]]},pwc:{x:18,y:19,name:"公共廁所",acts:[["上公廁 🚽","免費 · 膀胱回滿"]]},
 mailbox:{x:34,y:5,name:"郵筒",acts:[["查信箱 💌","免費 · 偶爾收到退款 "]]},news:{x:14,y:19,name:"報攤",acts:[["買份報紙 📰","€20 · 心情 +8"]]},claw:{x:33,y:14,name:"夾娃娃機",acts:[["夾娃娃 🎁","€30 · 兩成夾到禮物"]]},lottery:{x:8,y:19,name:"刮刮樂攤",acts:[["刮一張 🍀","€100 · 有機會中大獎"]]},
 busker:{place:"plaza",name:"街頭藝人",acts:[["打賞 🎸","€50 · 心情 +15"]]},pond:{place:"park",name:"池塘",acts:[["餵鴨子 🐦","用一包零食 · 心情 +12","feed"]]},
 swing:{place:"park",name:"鞦韆",acts:[["盪鞦韆","心情 +12"]]},cat:{place:"park",name:"流浪貓",acts:[["摸摸貓 🐱","心情 +8 · 可能被抓"],["餵貓吃零食","用一包零食 · 心情 +15","feed"]]}};
// 點擊即互動：走到物件旁自動做主要動作。cost = 花費（與 OBJS 說明、SQL 一致）、ok = 免確認、需要確認的會跳確認條、feed 要有零食
const TAP_DEF={vend:{cost:30,ok:1},trash:{ok:1},stall:{cost:60,ok:1},well:{cost:10,ok:1},dummy:{ok:1},bench:{ok:1},cooler:{ok:1},pwc:{ok:1},mailbox:{ok:1},news:{cost:20,ok:1},claw:{cost:30},lottery:{cost:100},busker:{cost:50},pond:{feed:1,ok:1},swing:{ok:1},cat:{ok:1}};
// 公共建設（和 supabase/town_civic.sql 一致，node town/test.js 會比對）：
//  醫院 HOSP＝[掛號費, 探病冷卻分鐘, 病人心情, 探病者心情, 探病者精力, 好感]；警察局 POLICE＝[繳罰單折扣%, 自首關幾分鐘, 報案點有效天數, 最多幾點, 每點巡警機率 +%]
//  市政廳 CIVIC＝建設案 [名稱, 費用, x, y, 心情, 精力]（鎮長提案、居民投票 24 小時、過半且至少 3 票（不到 5 人的小鎮 2 票）才扣鎮基金；在路上走到旁邊 ≤ 2 格可用，10 分鐘一次）
const HOSP={fee:150,visitCd:60,visit:[10,3,-2,2],consult:[20,40,5]};
const POLICE={disc:10,jail:30,rpDays:7,rpMax:5,rpPct:10};
const CIVIC={bench2:["新長椅",15000,48,8,3,15],lamp:["路燈",20000,24,21,4,0],gazebo:["涼亭",30000,35,21,8,25],statue:["小豬雕像",50000,21,13,12,0]};
const CIVQ=[2,3,5];// 投票至少幾票：居民不到 5 人 2 票、5 人以上 3 票
const hospIn=o=>!!o&&o.place=="hospital"&&!!o.items&&!!o.items.faint&&Date.parse(o.items.faint)>nowFn();// 住院中（昏倒的人）
let CIV=null,CIVP=[],civT=0;// 市政廳資料快取、已建好的建設案代號、上次同步時間
// 鎮長管理權（supabase/town_powers.sql 的 town_pw_def；def = [mode 0 鎮長／1 投票／2 鎮長可選, min, max, 全鎮每天, 每人每天, 冷卻分, 要對象, 動用基金, 可申訴, 在別處行使, 不能關]）。新增權力：這裡加一列＋SQL 的 town_pw_def／town_pw_do
const POWERS={
 jail:{n:"關進監獄",d:"把一位居民關 10～120 分鐘，不記前科；他可以保釋、勞動、越獄、假釋，居民可以申訴推翻",def:[0,10,120,3,1,10,1,0,1,0,0],unit:"分鐘",pre:[15,30,60,120]},
 free:{n:"放人",d:"提前放走關在監獄的居民",def:[0,0,0,5,1,0,1,0,0,0,0]},
 fine:{n:"罰款",d:"罰一位居民 $100～2000，付到身上沒錢為止、不欠款，錢進鎮基金；居民可以申訴，推翻會退錢",def:[0,100,2000,5,1,10,1,0,1,0,0],unit:"$",pre:[100,300,500,1000,2000]},
 grant:{n:"發補助",d:"從鎮基金發 $100～3000 給一位居民，不能給自己；可以直接發，也可以交給居民投票",def:[2,100,3000,5,1,5,1,1,0,0,0],unit:"$",pre:[200,500,1000,3000]},
 announce:{n:"公告",d:"在市政廳公告欄貼公告，最多 3 則",def:[0,0,0,0,0,0,0,0,0,1,0],go:"civic"},
 build:{n:"建設案",d:"提出建設案，花鎮基金，居民投票通過才蓋",def:[1,0,0,0,0,0,0,1,0,1,1],go:"civic"},
 feat:{n:"設施開關",d:"在鎮長管理裡開關設施",def:[0,0,0,0,0,0,0,0,0,1,0],go:"mayor"},
 impeach:{n:"彈劾鎮長",d:"任何居民都能提名一位鎮民接任，投票 24 小時，要多於全鎮一半、至少 3 票才換人；3 天內只能發起一次",def:[1,0,0,1,1,4320,1,0,0,0,1]}
};
const PWORD=["jail","free","fine","grant","announce","build","feat","impeach"];
const HOURS={}; // 營業時間已取消，全天營業
// 監獄與砍人（和 supabase/town_jail.sql 一致）：勞動 [收入, 精力, 心情, 縮短刑期分鐘]；保釋金 = max(300, 剩餘分鐘 ×10)；砍人 對方精力 −35 心情 −20、自己精力 −10 心情 −8、被抓 45%（倒地 80%）關 1～3 小時
let nowFn=()=>Date.now();// 頂層函式用的時鐘；init() 裡的 now() 建好後會指到它（含和伺服器的時差）
const JAIL={labor:[120,20,3,10],bailMin:300,bailPerMin:10,hurt:[35,20],self:[10,8],catchP:45,catchFallP:80};
const jlLeft=r=>{const j=r&&r.items&&r.items.jl;return j?Math.max(0,Date.parse(j)-nowFn()):0};
const jailed=r=>jlLeft(r)>0&&isOn("jail");
const bailCost=ms=>Math.max(JAIL.bailMin,Math.ceil(ms/6e4)*JAIL.bailPerMin);
// 牢裡情境（和 supabase/town_jail.sql 一致）：假釋 [要做幾次牢裡勞動, 假釋小時]、越獄成功率 [白天%, 半夜%]、越獄 [最低精力, 成功精力, 失敗加刑分鐘, 失敗罰款上限, 冷卻分鐘]、放風 [心情, 精力, 冷卻分鐘]、前科 [小時, 薪水%, 巡警倍率]、通緝 [小時, 巡警倍率, 抓回關幾分鐘]
const JAILX={parole:[2,24],escP:[12,18],esc:[30,20,60,500,60],yard:[6,3,30],prior:[24,92,1.5],wanted:[3,2.5,90]};
const jpOf=r=>(r&&r.items&&r.items.jp)||null;
const untilOn=(r,k)=>{const v=r&&r.items&&r.items[k];const u=v&&typeof v=="object"?v.u:v;return !!u&&Date.parse(u)>nowFn()};
const priorOn=r=>untilOn(r,"pr"),wantedOn=r=>untilOn(r,"wt"),paroleOn=r=>untilOn(r,"pl");
const untilLeft=(r,k)=>{const v=r.items[k],u=v&&typeof v=="object"?v.u:v;return Math.max(0,Date.parse(u)-nowFn())};
const escP=()=>{const h=new Date(nowFn()+8*36e5).getUTCHours();return h>=23||h<5?JAILX.escP[1]:JAILX.escP[0]};
const fmtH=ms=>ms>=36e5?`${Math.round(ms/36e4)/10} 小時`:`${Math.max(1,Math.round(ms/6e4))} 分鐘`;
const statLine=r=>[wantedOn(r)?`通緝中（還有 ${fmtH(untilLeft(r,"wt"))}）：出門被巡警抓回牢裡的機率很高，躲在家最安全`:"",paroleOn(r)?`假釋中（還有 ${fmtH(untilLeft(r,"pl"))}）：再犯事刑期加倍`:"",priorOn(r)?`有前科（還有 ${fmtH(untilLeft(r,"pr"))}）：薪水 −${100-JAILX.prior[1]}%、巡警抓人機率 ×${JAILX.prior[2]}`:""].filter(Boolean).join("。");
const paroleWhy=r=>{const jp=jpOf(r);if(!jp||!jp.t||!jp.e)return"沒有服刑紀錄";if(jp.bad)return"惹過事，不能假釋";if((jp.n||0)<JAILX.parole[0])return`勞動還差 ${JAILX.parole[0]-(jp.n||0)} 次`;const need=Date.parse(jp.t)+(Date.parse(jp.e)-Date.parse(jp.t))/2-nowFn();return need>0?`還要等 ${fmtLeft(need)}`:""};
// 獄友事件（牢裡）：[標題,說明,A,A提示,B,B提示]，順序和 town_jail.sql 的 town_jail_ev_eff 一致
const JE=[["放風時間，有人搭話","隔壁牢房的獄友隔著鐵窗跟你聊起來。","聽他聊聊","心情 +6 · 好感 +1","講講自己的故事","七成心情 +10 · 冷場心情 −4 · 精力 −3"],
 ["有人想欺負你","一個大塊頭獄友擋住你的路，要你把飯讓給他。","忍下來","心情 −8 · 什麼事都沒有","反擊","45% 嚇退他：心情 +8、精力 −5 · 失敗：心情 −12、精力 −12、加刑 15 分鐘 · 都算惹事（不能假釋）· 好感 −1"],
 ["獄友想交換東西","有人拿著一包零食，想跟你換點什麼。","用 €50 換零食","€50 · 心情 +8 · 好感 +1","賭一把牌","35% 贏 €120、心情 +4 · 輸 €80、心情 −3"],
 ["牢房的小忙","牢房亂糟糟，獄警說表現好的人可以減刑。","幫忙整理牢房","精力 −6 · 心情 +4 · 好感 +2 · 刑期 −5 分鐘","向獄警檢舉獄友","50% 減刑 20 分鐘 · 失敗加刑 10 分鐘 · 心情 −3 · 好感 −2"]];
const tpHour=()=>new Date(Date.now()+8*36e5).getUTCHours();
const closedMsg=k=>{if(!isOn(k))return `這個小鎮沒有${(FEATS.find(f=>f[0]==k)||[,"這個設施"])[1]}`;const h=HOURS[k];if(!h)return null;const x=tpHour();return x>=h[0]&&x<h[1]?null:`${h[2]}休息中，營業時間 ${h[3]}`};
const objNear=(k,x,y,place)=>{const o=OBJS[k];return o.place?place==o.place:Math.abs(x-o.x)+Math.abs(y-o.y)<=2};
const inRect=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
const roadRowsAt=y=>y==6||y==7||y==15||y==16||(y>=22&&(y-22)%7<2&&Math.floor((y-22)/7)+2<NR);
const isRoad=(x,y)=>y<mapRows()&&(roadRowsAt(y)||((x==16||x==17)&&!(y>=8&&y<=14)));
const slotAt=(x,y)=>{for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s);if(inRect(x,y,[hx,hy,5,4]))return s}return -1};
function blocked(x,y){if(x<0||y<0||x>=COLS||y>=mapRows())return true;if(inRect(x,y,FOUNTAIN))return true;if(slotAt(x,y)>=0)return true;
 for(const k in PLACES)if(PLACES[k].block&&isOn(k)&&inRect(x,y,PLACES[k].r))return true;return false}
// ── 交通工具（價格、速度、油錢要和 town.sql 的 vbuy／move 一致）：[名稱, 價格, 速度倍率, 每格油錢, 圖示] ──
const VEH={bike:["腳踏車",3000,1.5,0,"🚲"],moto:["機車",30000,2.5,.4,"🏍️"],car:["汽車",90000,3,1,"🚗"]};
const vehOwn=r=>{const v=(r&&r.items&&r.items.veh)||{};return (v.own||[]).filter(k=>VEH[k])};
const vehOf=r=>{const v=r&&r.items&&r.items.veh;return v&&v.k&&VEH[v.k]&&!inside(r)&&!fin(r)?v.k:null};
// 道路：人行道在路邊、斑馬線橫跨馬路；行人走馬路要繞去斑馬線（路上一格成本 3，斑馬線 1），騎車開車反過來路上最快
const CWX=[4,11,15,18,22,29,38,45,53],CWY=[3,19];
const isCross=(x,y)=>isRoad(x,y)&&((roadRowsAt(y)&&CWX.includes(x))||((x==16||x==17)&&!roadRowsAt(y)&&CWY.includes(y)));
const isSide=(x,y)=>!isRoad(x,y)&&!blocked(x,y)&&!inRect(x,y,PLACES.plaza.r)&&!inRect(x,y,PLACES.park.r)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isRoad(x+dx,y+dy));
// ── 交通規則（要和 supabase/town.sql 的 town_light／town_traffic／town_ticket 一致）──
// 紅綠燈每 12 秒換一次、每個路口錯開：0 = 東西向綠燈，1 = 南北向綠燈；速限：鬧區（y 6～16）×2、住宅區 ×2.5
const ib=y=>roadRowsAt(y-1)?y-1:y;
const lightG=(ms,y)=>(Math.floor(ms/12000)+ib(y))%2;
const isInter=(x,y)=>(x==16||x==17)&&roadRowsAt(y);
const zoneLim=y=>y>=6&&y<=16?2:2.5;
const FINE={red:["闖紅燈",300,900,1350],spd:["超速",0,600,900],yld:["沒禮讓行人",0,1200,1800],sw:["停在人行道",0,600,900],nl:["無照駕駛",0,3000,3000]};
const LICFEE={moto:800,car:1500};
const vFull=r=>!!(r&&r.items&&r.items.veh&&r.items.veh.f==1);
const hasLic=(r,k)=>k=="bike"||!!(((r&&r.items)||{}).lic||{})[k];
const tkList=r=>((r&&r.items)||{}).tk||[];
const tkDebt=r=>tkList(r).reduce((a,t)=>a+t.a,0);
// ── 事故、保險、維修（要和 supabase/town.sql 的 town_crash／town_prem／vfix／vsell 一致）──
const vwear=(r,k)=>+((((r&&r.items)||{}).veh||{}).w||{})[k]||0;
const vspd=(r,k)=>VEH[k][2]*(vwear(r,k)>=85?.6:vwear(r,k)>=60?.8:1);
const insLeft=(r,k,l)=>{const i=((((r&&r.items)||{}).ins||{})[k]||{})[l];return i?Date.parse(i)-nowFn():0};
const debtOf=r=>+((((r&&r.items)||{}).db||{}).a)||0;
const premMult=r=>{const it=(r&&r.items)||{};return Math.min(1.8,1+.05*Math.min(6,(it.tv||{}).n||0)+.1*Math.min(4,(it.ac||{}).n||0))};
const PREM={c:{moto:[150,500],car:[300,1000]},f:{moto:[400,1400],car:[900,3000]}};
const premOf=(r,k,l,d)=>Math.round(PREM[l][k][d==7?0:1]*premMult(r));
const fixCost=(r,k)=>Math.ceil(VEH[k][1]*.15*vwear(r,k)/100);
const sellVal=(r,k)=>Math.round(VEH[k][1]*.6*(1-vwear(r,k)/200));
const rpLeft=(r,k)=>{const i=((((r&&r.items)||{}).veh||{}).rp||{})[k];return i?Date.parse(i)-nowFn():0};
const lkLeft=r=>{const i=(((r&&r.items)||{}).veh||{}).lk;return i?Date.parse(i)-nowFn():0};
const fmtLeft=ms=>{const d=ms/864e5;return d>=1?`${d.toFixed(1)} 天`:`${Math.max(1,Math.round(ms/6e4))} 分鐘`};
const susLeft=r=>{const s=r&&r.items&&r.items.sus;return s?Date.parse(s)-nowFn():0};
const stepCost=(x,y,veh)=>isRoad(x,y)?(veh?1:isCross(x,y)?1:3):(veh?2:1);
// 最短路徑（上下左右走，依成本），找不到就回傳 null
function bfs(from,to,veh){const key=(x,y)=>y*COLS+x,dist=new Map([[key(...from),0]]),prev=new Map([[key(...from),null]]),B=[[from]];
 for(let d=0;d<B.length;d++){const bk=B[d];if(!bk)continue;for(let i=0;i<bk.length;i++){const [x,y]=bk[i];if(dist.get(key(x,y))<d)continue;
  if(x==to[0]&&y==to[1]){const path=[];let k=key(x,y);while(k!=null){path.unshift([k%COLS,Math.floor(k/COLS)]);k=prev.get(k)}return path}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(blocked(nx,ny))continue;const k=key(nx,ny),nd=d+stepCost(nx,ny,veh);if(!dist.has(k)||nd<dist.get(k)){dist.set(k,nd);prev.set(k,key(x,y));(B[nd]||(B[nd]=[])).push([nx,ny])}}}}
 return null}
// 自由走動（行人）：8 方向 A*（不切建築的角）→ 拉直成幾個轉折點，可以直線穿過草地、公園、馬路；騎車開車仍用上面的 bfs（路上快、路外慢）
function los(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(!L)return true;const n=Math.ceil(L/.2),ox=-dy/L*.34,oy=dx/L*.34;
 for(let i=0;i<=n;i++){const x=a[0]+dx*i/n,y=a[1]+dy*i/n;if(blocked(Math.round(x),Math.round(y))||blocked(Math.round(x+ox),Math.round(y+oy))||blocked(Math.round(x-ox),Math.round(y-oy)))return false}return true}
function freePath(from,to){if(blocked(to[0],to[1]))return null;const key=(x,y)=>y*COLS+x,g=new Map([[key(...from),0]]),prev=new Map([[key(...from),null]]),H=[],hz=(x,y)=>{const dx=Math.abs(x-to[0]),dy=Math.abs(y-to[1]);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
 const push=(f,x,y)=>{H.push([f,x,y]);let i=H.length-1;while(i>0){const q=(i-1)>>1;if(H[q][0]<=H[i][0])break;[H[q],H[i]]=[H[i],H[q]];i=q}};
 const pop=()=>{const t=H[0],l=H.pop();if(H.length){H[0]=l;let i=0;for(;;){let a=2*i+1,b=a+1,m=i;if(a<H.length&&H[a][0]<H[m][0])m=a;if(b<H.length&&H[b][0]<H[m][0])m=b;if(m==i)break;[H[m],H[i]]=[H[i],H[m]];i=m}}return t};
 push(hz(...from),...from);const done=new Set();
 while(H.length){const [,x,y]=pop(),k=key(x,y);if(done.has(k))continue;done.add(k);
  if(x==to[0]&&y==to[1]){const nodes=[];let c=k;while(c!=null){nodes.unshift([c%COLS,Math.floor(c/COLS)]);c=prev.get(c)}
   const out=[nodes[0]];let i=0;while(i<nodes.length-1){let j=nodes.length-1;while(j>i+1&&!los(nodes[i],nodes[j]))j--;out.push(nodes[j]);i=j}return out}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(blocked(nx,ny))continue;if(dx&&dy&&(blocked(x+dx,y)||blocked(x,y+dy)))continue;
   const nk=key(nx,ny),ng=g.get(k)+(dx&&dy?1.414:1);if(!g.has(nk)||ng<g.get(nk)){g.set(nk,ng);prev.set(nk,k);push(ng+hz(nx,ny),nx,ny)}}}
 return null}
const route=(from,to,veh)=>veh?bfs(from,to,veh):freePath(from,to);
// 點到的格子是哪裡：{slot} 房子、{dest} 公共地點或路上
function placeAt(x,y){const pp=POOPS.find(q=>q.x==x&&q.y==y);if(pp){const c=[[x,y+1],[x+1,y],[x-1,y],[x,y-1]].find(d=>!blocked(...d));if(c)return {dest:"street",door:c}}for(const k in OBJS){const o=OBJS[k];if(o.x!=null&&x==o.x&&y==o.y)return {dest:"street",door:[x,y+(y==5?1:0)],obj:k}}let s=slotAt(x,y);if(s<0)for(let i=0;i<NR*3;i++){const d=door(i);if(d[0]==x&&d[1]==y)s=i}if(s>=0)return {slot:s};
 for(const k in PLACES)if(isOn(k)&&inRect(x,y,PLACES[k].r)){if((k=="plaza"||k=="park")&&!blocked(x,y))return {dest:k,door:[x,y]};return {dest:k,door:PLACES[k].door}}
 if(inRect(x,y,FOUNTAIN))return {dest:"plaza",door:PLACES.plaza.door,obj:"well"};
 return blocked(x,y)?null:{dest:"street",door:[x,y]}}

// ── 需求：和資料庫同一套算法，只用來即時顯示（真正的數字以資料庫為準）──
const NEEDS=["hunger","energy","bladder","hygiene","fun"];
const NEED_INFO={hunger:["🍚","飽足"],energy:["⚡","精力"],bladder:["🚽","膀胱"],hygiene:["🛁","清潔"],fun:["🎉","心情"]};
// 個性特質（items.tr）與心情（由需求算，規則要和 town.sql 的 town_mood／town_pay 一致）
const FURN=[["bed","好床",3500,"睡覺精力每小時 +90（沒有就睡地上 +64）"],["fridge","冰箱",4500,"在家吃飯 €30、飽足 +48（沒有是冷食 +32）"],["massage","按摩椅",6000,"快速休息精力 +100（沙發 +70、沒有 +50）"],["shelf","書櫃",2500,"之後技能用，先佔位"],["sofa","沙發",4000,"看電視心情 +22、快速休息 +70"],["tvcab","電視櫃",3000,"才能看電視（心情 +15、10 分鐘一次）；沒有只能發呆 +6"],["rug","地毯",1000,"裝飾"],["plant","盆栽",500,"裝飾"],["frame","相框",300,"掛在牆上，裝飾"],["painting","掛畫",900,"掛在牆上，裝飾"],["desklamp","檯燈",600,"裝飾"],["toy","玩具",400,"裝飾"],["books","書堆",500,"裝飾"],["toilet","馬桶",2000,"上廁所（沒有只能找角落，清潔 −10）"],["shower","淋浴間",3000,"洗澡清潔回滿、精力 +10（沒有是水桶 70%）"]];
const hlc=v=>{v=Math.floor(+v);return v>=1&&v<=4?v:1};
const HOUSES=[["小屋",0,6],["公寓",20000,10],["獨棟",150000,15],["豪宅",400000,20]];// 名稱、升級價、可擺家具與道具件數（和 town_home.sql 的 town_home_cap 一致）
const HOME_DIM=[[6,3],[8,3],[9,4],[10,4]],WALLF=["frame","painting"],FLAT=["rug","toy","books"];// 房間寬×地板列數（另有第 0 列牆）；掛牆的道具；躺在地上、不擋人站的
const HACT={bed:[/^睡覺/,"好床"],fridge:[/^吃飯/,"冰箱"],sofa:[/^看電視/,"沙發"],tvcab:[/^看電視/,"電視櫃"],massage:[/^快速休息/,"按摩椅"],toilet:[/^上廁所/,"馬桶"],shower:[/^洗澡/,"淋浴間"]};
// 擺放座標 items.fp = [[代號,x,y]]；沒有 fp 的舊角色用舊的 9 格 fu 換算（和 town_fp_legacy 一致）
const fpOf=it=>Array.isArray(it.fp)?it.fp:(it.fu||[]).map((k,i)=>[k,1+(i%3)*2,1+Math.floor(i/3)]).filter(o=>o[0]);
const hasF=(r,k)=>!!(r.items&&Array.isArray(r.items.fu)&&r.items.fu.includes(k));
// 在屋裡：人在自己家，且沒有「站在門口」旗標 items.dr（舊角色沒有旗標＝在屋裡），和 SQL town_inside 一致
function inside(r){return !!r&&r.place=="home:"+r.id&&!(r.items&&String(r.items.dr)=="1")}
// 在朋友家屋裡：人在 home:屋主，且 items.fv = 屋主 id（和 SQL town_vin 一致；缺值 = 在門外）
function vin(r){return !!r&&!!r.items&&r.items.fv!=null&&String(r.items.fv)!==String(r.id)&&r.place=="home:"+r.items.fv}
function hasT(r,k){const t=r.items&&r.items.tr;return Array.isArray(t)&&t.includes(k)}
function moodOf(r){if(r.items&&r.items.sad)return"sad";const a=(r.hunger+r.energy+r.bladder+r.hygiene+r.fun)/5,m=Math.min(r.hunger,r.energy,r.bladder,r.hygiene,r.fun);return a<35||r.fun<20?"low":a<55||m<20||r.fun<40?"annoyed":a>=75&&r.fun>=65&&m>=40?"happy":"normal"}
const MOOD={happy:["😊","開心","薪水 +10%、好感 ×1.2、打架 +5"],normal:["🙂","普通","沒有加成"],annoyed:["😤","煩躁","薪水 −5%、好感 ×0.8、打架 −3"],low:["🥺","低落","薪水 −10%、好感 ×0.7、打架 −8"],sad:["🥺","心情谷底","薪水 −30%、好感 ×0.7、打架 −8，心情回到 20 才恢復"]};
const MOOD_WAGE={happy:110,normal:100,annoyed:95,low:90,sad:70};
const payOf=(base,r)=>Math.floor((base*MOOD_WAGE[moodOf(r)]*(hasT(r,"workaholic")?110:100)*2+10000)/20000);
// 午間市集 12:00～14:00、夜市 21:00～23:00（台灣時間）打工薪水 +10%，要和 SQL town_wd_pct／town_happy_touch 一致；回傳 {k,n,left(分)} 或 null
const happyAt=ms=>{const t=new Date(ms+8*36e5),h=t.getUTCHours(),m=t.getUTCMinutes();if(h==12||h==13)return{k:"noon",n:"🌞 午間市集",left:(14-h)*60-m};if(h==21||h==22)return{k:"night",n:"🌙 夜市",left:(23-h)*60-m};return null};
function tickLocal(r,now){const h=Math.min(72,Math.max(0,(now-Date.parse(r.updated_at))/36e5)),o={...r},hm=hasT(r,"clean")?.7:1;
 // 和 town_tick 一致：離線保護（最後動作 30 分鐘後，消耗 ×0.4、需求最低停在 30）；睡覺回精力與睡眠時數成正比；
 // 快速睡覺（items.qs 到期自動醒，睡眠速率 ×2.5）；待機超過 60 分鐘算回家睡覺
 const sa=r.seen_at?Date.parse(r.seen_at)+18e5:Infinity,s60=r.seen_at&&!(r.items&&r.items.jl&&Date.parse(r.items.jl)>now)?Date.parse(r.seen_at)+36e5:Infinity,t0=now-h*36e5,fl=(v,d)=>Math.max(v-d,Math.min(v,30));
 const oh=(a,b)=>{const on=Math.max(0,Math.min(b,sa)-a);return[on/36e5,(b-a-on)/36e5]};
 const bed=hasF(r,"bed")?90:64,hb=hasF(r,"bed")?0:1,qe=r.items&&r.items.qs?Date.parse(r.items.qs):0;
 let aw0=t0,aw1=t0,ss0=t0,ss1=t0,mult=1;
 if(o.sleeping){if(qe&&qe>t0){const e=Math.min(qe,now);ss1=e;aw0=e;aw1=now;mult=2.5}else if(qe){aw1=now}else ss1=now;if(qe&&now>=qe)o.sleeping=false}
 else{const m=Math.min(now,Math.max(t0,s60));aw1=m;ss0=m;ss1=now}
 const [son,sof]=oh(ss0,ss1);
 const doS=()=>{if(ss1>ss0){o.energy+=bed*mult*(son+sof);const d=(k,rate)=>{o[k]=fl(o[k]-rate*son,.4*rate*sof)};d("hunger",5);d("bladder",7);d("hygiene",(2.4+hb)*hm);d("fun",1.6)}};
 const doA=()=>{if(aw1>aw0){const [hon,hof]=oh(aw0,aw1),dec=(k,rate)=>{o[k]=fl(o[k]-rate*hon,.4*rate*hof)};dec("hunger",8);dec("bladder",10);dec("hygiene",5*hm);
  let e=o.energy-5*hon;if(hasT(r,"nightowl")){for(let t=aw0;t<aw1;){const st=Math.min(.25,(aw1-t)/36e5),hr=(Math.floor(t/36e5)+8)%24;if(hr>=22||hr<6)e+=st*(t<sa?1:.4);t+=st*36e5}}o.energy=fl(e,.4*5*hof);
  const ex=(o.hunger<20||o.bladder<20||o.hygiene<20)?3*hon:0,exf=(o.hunger<20||o.bladder<20||o.hygiene<20)?.4*3*hof:0,v=o.fun-4*hon-ex;o.fun=fl(v,.4*4*hof+exf)}};
 if(ss0<=aw0&&ss1>ss0&&ss0==t0){doS();doA()}else{doA();doS()}
 NEEDS.forEach(k=>o[k]=clamp(o[k],0,100));return o}

// ── 設施小事件、一起加成、邀請一起做（資料庫 supabase/town_social.sql；效果數值在伺服器 town_pe_eff，這裡只放文字）──
// 每個地點 3 個事件：[標題, 說明, A 選項, A 提示, B 選項, B 提示]，順序和 town_pe_eff 一致
const PEV={
 restaurant:[["鄰桌點太多了","隔壁桌的人笑著問你要不要幫忙吃","幫忙吃一點","心情 +6 · 有人在好感 +1","幫他們買單","€150 · 心情 +12 · 好感 +1"],["主廚請你試吃新菜","聞起來很特別","試吃","看運氣：好吃心情 +10、難吃 −6","打包帶走","€30 · 心情 +3"],["櫃檯有抽獎箱","一張券 €60，頭獎 €400","買一張","10% 中獎 · 其餘 −€60","看別人抽","心情 +3"]],
 market:[["試吃攤位","阿姨一直招手","吃一口","心情 +5","買一包","€60 · 心情 +8"],["限時特價開搶","人潮往冷凍櫃衝過去","擠進去搶","一半成功心情 +10；否則被擠到 −6、可能撞到人","等下一波","心情 +2"],["福袋活動","一個 €120，據說裡面很值錢","買福袋","30% 開到好東西（值 €320）· 其餘 −€120","不買","心情 +1"]],
 cafe:[["隔壁桌邀你聊天","對方笑著揮手","加入他們","精力 −3 · 心情 +6 · 好感 +1","戴上耳機","精力 +2 · 心情 +4"],["咖啡拉花課","老闆問你要不要試試","報名","€90 · 心情 +12","站著看","心情 +3"],["櫃檯有小費罐","罐子上畫了一隻豬","投 €20","心情 +5","直接走過","沒事"]],
 cinema:[["爆米花香撲鼻","大桶特價中","買一桶","€90 · 心情 +10","偷吃旁邊朋友的","心情 +5 · 有人在好感 −1"],["隔壁在講劇情","整場都在小聲劇透","請他小聲點","六成有效心情 +6、好感 +1；否則 −5、好感 −1","換位子","精力 −2 · 心情 +1"],["加映場抽獎","一張 €50，頭獎 €300","參加","15% 中獎 · 其餘 −€50","不參加","沒事"]],
 gym:[["教練來指導","看到你的動作怪怪的","認真學","精力 −8 · 心情 +4","偷懶聊天","精力 +2 · 心情 +6 · 好感 +1"],["蛋白粉試喝","一杯 €60","喝一杯","€60 · 精力 +6 · 心情 +6","喝水就好","精力 +2 · 心情 +2"],["舉重挑戰","旁邊的人說你舉不起來","接受挑戰","五成成功心情 +12；失敗 −8、精力 −12","當觀眾","心情 +3 · 好感 +1"]],
 park:[["野餐的人招手","他們帶了很多三明治","過去加入","心情 +8 · 好感 +1","揮手致意","心情 +3"],["小狗跑過來","尾巴搖個不停","陪牠玩","精力 −5 · 心情 +10","拍張照","心情 +4"],["冰淇淋攤","天氣有點熱","買一支","€60 · 精力 +3 · 心情 +8","逛逛就好","心情 +2"]],
 plaza:[["街頭藝人找你上台","大家都在看你","上台","五成心情 +14；失敗 −6","當觀眾","心情 +5"],["有人問路","他拿著地圖很著急","熱心帶路","精力 −4 · 心情 +6 · 好感 +1","說不知道","心情 −1"],["發傳單抽獎","一次 €40，大獎 €300","抽一次","12% 中獎 · 其餘 −€40","婉拒","沒事"]],
 office:[["同事分零食","茶水間飄來香味","去聊聊","心情 +5 · 好感 +1","繼續趕進度","精力 −3"],["老闆路過","他往你這邊看","假裝很忙","五成安全過關心情 +4；否則 −6","主動報告","三成被稱讚心情 +8；否則 −4 · 精力 −4"],["團購飲料","同事在揪團","跟一杯","€70 · 精力 +3 · 心情 +8 · 好感 +1","不跟","沒事"]],
 arena:[["觀眾喊你上台","大家開始起鬨","上台秀一下","五成半成功心情 +14；失敗 −8、精力 −12","在台下加油","心情 +5 · 好感 +1"],["賣飲料的小販","汗流浹背時特別誘人","買一罐","€50 · 精力 +6 · 心情 +3","自己帶水","沒事"],["有人在開盤","壓一邊賺一倍","下注 €100","45% 贏 €100 · 其餘 −€100","不賭","心情 +1"]],
 stock:[["聽到內線消息","旁邊的人壓低聲音說話","追問下去","四成聽到趣事心情 +8；否則 −6","當作沒聽到","沒事"],["看盤的老先生","他拉你聊起當年勇","陪他聊","精力 −2 · 心情 +5 · 好感 +1","低頭看盤","心情 +1"],["請喝咖啡","自動販賣咖啡機在旁邊","買兩杯","€90 · 精力 +3 · 心情 +8 · 好感 +1","不用","沒事"]],
 rafi:[["拉菲突然問你意見","全場安靜","老實說","五成被讚賞心情 +8；否則 −8、精力 −6","打哈哈","精力 −2 · 心情 −1"],["加班便當","有人訂了便當","買一個","€100 · 精力 +4 · 心情 +6","忍著","心情 −3"],["同事八卦","茶水間傳來悄悄話","聽一聽","精力 −2 · 心情 +6 · 好感 +1","假裝沒聽到","沒事"]],
 carshop:[["業務請你試乘","要不要出去繞一圈","試乘","七成開心心情 +10；否則 −6、精力 −4","看看就好","心情 +2"],["業務推銷","遞來一疊型錄","聽完簡報","精力 −3 · 心情 +3 · 好感 +1","婉拒","心情 −1"],["洗車特惠","今天只要 €100","洗一台","€100 · 心情 +8","不洗","沒事"]],
 slaughter:[["守衛在打瞌睡","大門半開著","偷偷靠近看","五成好奇心情 +10；失敗 −10、精力 −6","離開","沒事"],["屠夫給試吃","一根剛做好的香腸","吃一口","七成好吃心情 +8；否則 −8","婉拒","沒事"],["門口有隻野貓","瘦瘦的看著你","餵一點","€30 · 心情 +8","趕走","心情 −2"]]};
const JT={restaurant:"分一盤點心",market:"逛特價區",cafe:"喝下午茶",cinema:"看電影",gym:"互相打氣練一組",park:"散步",plaza:"看街頭表演",office:"趕進度",arena:"看比賽",stock:"研究股票",rafi:"一起摸魚",carshop:"看車",slaughter:"探險"};

// 更新通知：每次改版都要在最前面加一則（新的在前）。id 不可重複，11/17 起 1～3 條、每條 ≤ 18 字的簡述。
const UPDATES=[
  {id:"casino-fee-1123",date:"11/23",title:"賭場手續費降價",items:["換回現金手續費降到 1.5%"]},
  {id:"casino-room-1123",date:"11/23",title:"賭場有室內了",items:["進賭場，點賭桌開玩","下注更順、開牌更快","桌上可直接換遊戲"]},
  {id:"casino4-1123",date:"11/23",title:"賭場四款新遊戲",items:["新增三公、十八啦","新增賽豬、牌九"]},
  {id:"sus-1123",date:"11/23",title:"車子比較不會被吊銷",items:["違規記滿 10 點才暫停","暫停改成 6 小時"]},
  {id:"u60-rafi",date:"11/18",title:"拉菲新職稱",items:["多了資深業務經理到董事長","招牌改成拉菲's office"]},
  {id:"fix-1118-now",date:"11/18",title:"修好進不去小鎮",items:["有人被吊銷駕照或買保險時，大家會卡在登入","已修好，重新整理就能進"]},
  {id:"login-1118",date:"11/18",title:"登入更穩",items:["舊裝置不再害你被鎖","登入失效會告訴你怎麼辦"]},
  {id:"acct-1118",date:"11/18",title:"角色密碼",items:["每個角色要設自己的密碼","換手機：選角色後輸入密碼"]},
  {id:"btnfx-1118",date:"11/18",title:"按鈕顯示效果",items:["每顆按鈕寫出加減與門檻","長按按鈕看詳細說明"]},
  {id:"venues1-1118",date:"11/18",title:"吃喝社交場館升級",items:["咖啡廳拉花、共點，餐廳套餐、外帶","電影院情侶座、超市特價與點數","店員常客有委託，夜晚室內變暗"]},
  {id:"dgpot-1118",date:"11/18",title:"射龍門彩池改版",items:["彩池由玩家輸的錢累積","彩池空了只能看牌、放棄"]},
  {id:"arcade2-1118",date:"11/18",title:"街機新三款",items:["新增百家樂、射龍門、妞妞","射龍門入場費 $50、自訂押注","新圖示，注碼按鈕同步"]},
  {id:"infac-1118",date:"11/18",title:"進館才能用",items:["超市、電影院、公司等也能走進去","設施功能要進去才能用"]},
  {id:"tap-1117",date:"11/17",title:"點了就做",items:["點物件、建築，走過去自動互動","花錢的會先問你"]},
  {id:"sound-1117",date:"11/17",title:"新增 8-bit 音效",items:["點擊、賺錢、打工、走路都有聲音","選單「聲音」可開音樂、調音量、試聽"]},
  {id:"recovery-1117",date:"11/17",title:"帳號救援",items:["選單可綁定 Email","換手機：首頁找回角色"]},
  {id:"legal-1117",date:"11/17",title:"新增條款與隱私",items:["選單可看服務條款","選單可看隱私權政策"]},
  {id:"pc-layout-1117",date:"11/17",title:"電腦版改版",items:["電腦上左邊地圖、右邊面板","滾輪縮放、滑過顯示名稱","方向鍵走路、1-9 按按鈕"]},
  {id:"u63-pixel",date:"11/17",title:"全面像素風",items:["地圖與文字邊緣更銳利","圓角、模糊陰影改成像素方塊"]},
  {id:"u62-panel",date:"11/17",title:"面板高度自動調整",items:["按鈕少時面板變矮，地圖更大","灰掉按鈕的原因改成短句"]},
  {id:"u61-social",date:"11/17",title:"朋友頁分組",items:["朋友頁分成友善、惡作劇、線上、對戰","拿掉隨機互動按鈕","互動說明不再閃爍"]},
  {id:"u60-workfx",date:"11/17",title:"打工有動畫了",items:["打工會播動畫", "動畫完才顯示賺的錢"]},
  {id:"u60-door",date:"11/17",title:"進出門改粉紅大鍵",items:["進去、出門在標題右邊", "門口要先進去才能用設施"]},
  {id:"u60-ui",date:"11/17",title:"畫面整理",items:["地圖更大、按鈕分頁", "狀態列、導覽列變簡潔", "做完事會跳出數字變化"]},
  {id:"u60-walk",date:"11/17",title:"廣場公園點哪走哪",items:["點哪格就直接走過去"]},
  {id:"u60-ranks",date:"11/17",title:"打工多了新職階",items:["公司、各店、拉菲都能升更高", "升上去有新稱號"]},
  {id:"u60-events",date:"11/17",title:"隨機事件變多了",items:["街上、設施裡遇到的事更多樣", "面對面可抽「隨機互動」"]},
  {id:"u60-train",date:"11/17",title:"能力可以練了",items:["健身、慢跑、讀書、聊天、許願", "練多了能力會升級"]},
  {id:"u60-trv",date:"11/17",title:"旅人來鎮上了",items:["廣場或公園有旅人", "走近按「和旅人聊聊」"]},
  {id:"u60-quest",date:"11/17",title:"市政廳有公告欄委託",items:["找櫃員接每日委託", "完成領獎金"]},
  {id:"u60-npc",date:"11/17",title:"流動商人來了",items:["廣場或公園不定時出現", "賣補品、玩偶、手冊"]},
  {id:"u60-clerk",date:"11/17",title:"店裡有店員了",items:["點店員可聊天、問價、聽八卦"]},
  {id:"u60-cop",date:"11/17",title:"街上有巡警",items:["騎車開車經過會有驚嘆號提醒"]},
  {id:"u60-bk",date:"11/17",title:"登入更穩了",items:["手機清資料後會自動還原登入"]},
  {id:"u60-bal",date:"11/17",title:"錢更有感了",items:["打工不再遞減", "存款多要繳稅"]},
  {id:"u47-landing",date:"11/16",title:"首頁換新裝",items:["首頁加了像素豬 Logo 與大標題","主按鈕改成粉紅立體按鈕，按下去有手感","卡片圓角與陰影統一，進場有淡入動畫","手機瀏海與底部安全區不再被擋住"]},
  {id:"u46-nolimit",date:"11/16",title:"取消互動限制、能力屬性、隨機互動",items:["朋友互動、惡趣味、設施、打工賺錢的次數與冷卻上限全部取消，只剩精力、飽足等五條需求、入獄與睡覺會擋","新增能力屬性：力量、敏捷、魅力、智力、運氣，第一次進遊戲分配 10 點，之後升級每級 +1 點（選單「能力屬性」）","面對面多了「隨機互動」「隨機惡趣味」兩顆骰子鈕，系統幫你抽一個現在做得到的","因為沒有上限，賺錢只靠精力限制，打工遞減與財產稅仍在"]},
  {id:"u45-world",date:"11/16",title:"鎮上隨機事件",items:["全鎮會不定時出現事件：市集日、景氣好、景氣差、停電、小鎮慶典，畫面上方會顯示影響與剩餘時間","事件期間吃喝價格或打工薪水會跟著變，結束後恢復","在街上、廣場、公園走動時，偶爾會遇到個人小事件：撿到錢、被推銷、踩水坑、遇到街頭藝人","個人事件每天最多 10 次，不會讓你欠錢"]},
  {id:"u43-balance",date:"11/16",title:"收入與物價調整",items:["每日任務獎金維持每個 €500、全勤 +€1000","每天打工前 12 次全額，13～24 次 50%，之後 10%","存款很多的人，財產稅改成階梯（100 萬以上 1%、500 萬以上 2%）","你現有的錢都不會被動"]},
  {id:"u44-powers",date:"11/16",title:"鎮長管理權",items:["鎮長多了「管理權」：可以把人關進監獄（10～120 分鐘）、放人、罰款、從鎮基金發補助，還有公告、建設案、設施開關","每次行使都會公開寫進動態，被行使的人上線會看到說明；居民覺得不公平可以申訴，投票推翻就放人、退罰款","有上限：關人每天最多 3 人、每人每天一次，不能關自己或睡覺、住院的人；小鎮不到 3 人不能用","居民也能發起「彈劾鎮長」投票，多於全鎮一半、至少 3 票就換人","選單「鎮長管理權」大家都看得到紀錄與投票"]},
  {id:"u43-pigcoin",date:"11/16",title:"全小鎮統一用「$ 豬幣」",items:["所有小鎮的錢都改成「$」，名字叫豬幣，鎮長不用也不能再選別的貨幣","金額沒有變，只是換了符號","股票：價格變成純隨機漫步，不會再自己「拉回」基準價；買賣沒有上限，但低買高賣也不再穩賺"]},
  {id:"u41-zombie",date:"11/16",title:"街上有喪屍豬！",items:["全天隨機會有綠色的喪屍豬出現在街上、廣場、公園，晚上更多","牠會慢慢追過來，碰到會掉精力、心情、清潔，但不會死，也不會扣錢","站在牠旁邊按「打喪屍豬」，打倒領 €60～140，一天最多 €600，還可能掉生豬肉，到超市可賣 €30","躲進屋裡、店裡、醫院、監獄，或是睡著，牠都打不到你；每隻只會待一陣子就消失","鎮長可以在設施開關裡關掉喪屍豬"]},
  {id:"u42-nocd",date:"11/16",title:"取消冷卻、取消免整牌、任務獎金 10 倍",items:["打工、設施互動、街機和單機遊戲、擂台、路邊物件，不用再等冷卻時間","為了不被一直刷錢：吃喝休息補回的精力一天最多 200，屠宰場一天最多 3 次，單機遊戲的心情獎勵一天 10 次","免整牌拿掉了；每天最多被整 6 次、報復不扣好感、可以原諒，這些不變","每日任務獎金變 10 倍：每個 €500，三個全做完再 +€1000","股票買賣沒有金額上限，價格還是每 10 分鐘變一次","比大小：A 最小、K 最大"]},
  {id:"u31-stageroom",date:"11/10",title:"進到室內，主畫面就是室內",items:["走進設施、自己家、朋友家時，主畫面直接換成放大的室內，不用看面板上的小圖","點室內的物件就會做對應的事，點裡面的人可以選他互動；要離開按下面的「出門」","住院的人躺在醫院的病床上，坐牢的人睡上下鋪","在門外叫醒離線的朋友後，他真的會站在門口，不會又馬上被送回屋裡睡"]},
  {id:"u30-civic",date:"11/10",title:"新增醫院、警察局、市政廳",items:["醫院：昏倒、車禍、被砍倒地的人會送到這裡，醒來按「出院」；平常可以掛號看診，朋友也能來探病","警察局：罰單在這裡繳九折；被通緝可以自首（關 30 分鐘、不加刑）；被整被砍可以報案，對方記報案點但不會入獄；還能看今日治安","市政廳：看鎮基金、貼公告、發起投票；鎮長可以提建設案，居民投票通過才花鎮基金蓋長椅、路燈、涼亭、雕像","地圖往右加寬，三棟新建築都能走進去看看"]},
  {id:"u32-callout",date:"11/10",title:"可以在門外叫他出來",items:["朋友醒著待在家裡（包含離線的人）時，站在他家門口按「叫他出來」，他就會開門走到門口","好感越高越肯出來；好感太差進不了屋的人，也能把他叫到門口","不肯出來要等 3 分鐘再喊，成功後 10 分鐘內不能再喊"]},
  {id:"u29-wakeout",date:"11/10",title:"在門外也能叫醒睡著的人",items:["站在朋友家門口，睡著的人可以直接按「叫醒到門外」，不用進屋","叫醒後他會走出來站在門口，兩人在門口就能擊掌、聊天、送禮、邀請一起做事","叫不醒只要等 3 分鐘再試，越累睡越沉；叫醒會讓他心情 −3、好感 −1","他上線時會看到「X 把你叫醒了」"]},
  {id:"u28-mischief",date:"11/10",title:"格鬥場約戰、室內扁人、更多惡趣味",items:["走到別人家門口不會再閃一下","進了別人家、或同在咖啡廳、餐廳、健身房裡，可以對在場的人擊掌、扁人；在別人家動手，屋主可能把你趕出門","格鬥場不能隨便扁人了：用「邀請 PK」約對方，他 3 分鐘內接受，三回合分勝負，可以下注（贏的拿 95%）","新增 8 種惡趣味：潑水、貼「踢我」紙條、假裝告白、偷零食、拍醜照、換座位、按門鈴逃跑、擺假便便","被整的人可以報復或原諒；不想被整就掛「免整牌」，今天沒人能整你、丟蛋、扁你"]},
  {id:"u27-landing2",date:"11/10",title:"首頁秒開、登入畫面重做",items:["首頁不用等遊戲載入，打開就能點「回到小鎮」","有小鎮插圖，住過的小鎮顯示你的角色和幾天前上線","搬進小鎮的步驟變成 1 邀請碼、2 選角色、3 進入，每一步都有提示","進入小鎮後的載入畫面，只有真的等比較久才會出現"]},
 {id:"u36-costs",date:"11/10",title:"突發支出",items:["每天有機會遇到突發支出：水管漏水、意外帳單、錢包掉了","損失是現金的 3～8%，錢越多損失越多，現金不到 10000 不會扣","街上的小偷也會偷更多（最多 6000）"]},
 {id:"u34-gov",date:"11/10",title:"政府普發、打工有獎金",items:["政府今天普發每位居民 €20000","之後每天第一次上線，現金不到 10000 的人，政府發 €600 生活補助","每天打工第 3 次領勤勞獎金 €500、第 6 次 €1000","一起做事的心情加成變大，每天上限提高到 12 次"]},
 {id:"u33-odds",date:"11/10",title:"街機賠率調整，平手不再算輸",items:["猜拳平手全額退回；比大小兩張一樣大退回押注","21 點開局 21 點賠 3 倍；輪盤多了 ×1 三格、最高 ×4","骰子大小三顆一樣退一半；單點三顆賠 12 倍","老虎機兩個一樣賠 ×1.2；賓果中 2 個賠 ×1.5"]},
 {id:"u32-bjbet",date:"11/10",title:"修好 21 點結果顯示錯誤",items:["以前發牌後如果改了押注金額，贏了也可能顯示成「輸了」","現在結果一律照這一局實際押的金額顯示","發牌後到結束前，押注按鈕會暫時鎖住"]},
 {id:"u31-nowake",date:"11/10",title:"睡著的人白天不會自己醒",items:["睡著離線的人，白天也會一直睡，不再精力滿了就自己醒","朋友可以走到他家、按「進去」再按「叫醒他」","自己上線按「起床」就會醒"]},
 {id:"u30-fixme",date:"11/10",title:"修好畫面紅字與更新紀錄",items:["修好走路、看朋友家時畫面右上角跳出紅色錯誤，朋友睡覺時的面板也恢復正常","修好選單的「更新紀錄」打不開的問題","朋友睡著時：屋頂飄 Z，站在他家門口按「進去」就有「叫醒他」"]},
 {id:"u29-zzz",date:"11/09",title:"屋頂的 Z 只代表真的在睡覺",items:["以前離線的人待在家，屋頂也會飄 Z，看起來像睡著但又叫不醒","現在只有真的睡著的人屋頂才飄 Z，才有「叫醒他」","離線很久但醒著的人，面板會寫他離線幾分鐘、在家休息"]},
 {id:"u28-visit",date:"11/09",title:"可以走進朋友家了",items:["站在朋友家門口時，屋裡看不到你，進去後才會出現你的身影","門口可以留言、放禮物、丟雞蛋、惡作劇；按「進去」才能煮飯、洗澡、叫醒、串門子","進去後按「出門」回到門口","朋友不在屋裡，或和你關係太差，會進不去"]},
 {id:"u27-furnfx",date:"11/09",title:"家裡沒家具，生活變陽春",items:["沒有好床睡地上：精力每小時 +64、醒來心情 −3","沒有冰箱吃冷食、沒馬桶找角落、沒淋浴間用水桶、沒電視櫃只能發呆","互動照樣能做，按鈕副標會寫現在是陽春版","超市新增馬桶 €2000、淋浴間 €3000，擺進房間才有效","已有的家具效果不變，沒有人被扣錢"]},
 {id:"u20-wake",date:"11/09",title:"叫醒、看室內修好了",items:["朋友在家睡覺時，看室內會看到他躺在床上","你站在朋友家門口，面板下面也看得到他家室內","叫醒他的按鈕會寫這次大約幾成叫得醒，越累睡越沉","叫不醒不再鎖一小時，隔 3 分鐘就能再試"]},
  {id:"u26-jail2",date:"11/09",title:"牢裡更多事",items:["監獄可以走進去了：有鐵窗、上下鋪、工作台、放風場，做事會有動畫","牢裡可以放風、勞動減刑；做滿 2 次勞動、不惹事、服滿一半刑期，可以申請假釋","牢裡會碰到獄友的事（聊天、被欺負、交換東西、幫忙），選項有賺有賠","可以冒險越獄，成功率不高，成功會被通緝 3 小時","關過的人有 24 小時前科：薪水少 8%、巡警更常抓你。角色一樣不會死"]},
  {id:"u25-prices",date:"11/09",title:"物價調整",items:["房租：獨棟每天 1500、豪宅每天 3000（變便宜）","家具全面降價，例如好床 3500、冰箱 4500","汽車降到 90000","已經買過的不退款，沒有人少錢"]},
  {id:"u24-freewalk",date:"11/09",title:"可以隨便走了",items:["走路不再硬繞人行道和斑馬線，可以直接穿過草地、公園和馬路","會繞開房子和建築，路線自動變短","騎腳踏車、機車、汽車還是走馬路最快"]},
  {id:"u23-route",date:"11/09",title:"走路會先畫出路線",items:["點地圖、設施或朋友開始走，會用小方塊畫出要走的路","終點有閃動的黃框，走過的路會慢慢消失","走不到的地方會說路被擋住了"]},
  {id:"u22-autoupdate",date:"11/09",title:"小鎮有新版會自己通知",items:["從主畫面打開也不用手動重新整理了","有新版時上面會出現「小鎮有新版本」，按「更新」就換成新的","你在走路或開視窗時不會被打斷，等你有空再顯示"]},
  {id:"u21-hud2",date:"11/09",title:"手機畫面再整理",items:["錢格不再貼邊，下面的禮物、零食數量看得到","站在自己家門口，標題不再寫成「在他家」","上面的角色頁籤右邊淡出，提示可以左右滑"]},
  {id:"u20-needbar",date:"11/09",title:"狀態條的條回來了",items:["手機上方的飽足、精力、膀胱、清潔、心情，條又看得到了","之前被擠成一條細線，現在固定高度，數字和條都清楚","電腦版和手機版都檢查過了"]},
 {id:"u19-home",date:"11/09",title:"家裡可以自由佈置了",items:["家具想放哪就放哪：點家具選取，再點空格移動，也能收回背包","房間會隨房子升級變大，小屋 6×3、豪宅 10×4，可以擺更多東西","超市新增相框、掛畫（掛牆上）、檯燈、玩具、書堆","在家時畫面直接看得到你的佈置，朋友來看室內也看得到","睡覺躺到床上、看電視坐沙發、開冰箱吃東西、按摩椅會震，角色都會走過去"]},
 {id:"u18-inside",date:"11/09",title:"可以走進設施裡面了",items:["咖啡廳、餐廳、健身房：走到門口會自動走進去，裡面有吧台、咖啡機、跑步機等像素佈置","點咖啡機、廚房窗口、沙包、鏡子旁的櫃子等物件，就是做那一項互動，角色會走過去並播動畫","同在裡面的人各站一格不重疊；在裡面的人不會站在街上，窗戶會亮燈","電影院、公園、廣場的互動也有動畫了；按「出門」或走去別處就會離開"]},
 {id:"u17-landing",date:"11/09",title:"首頁更好上手",items:["住過的小鎮：第一顆粉紅按鈕直接「回到小鎮」，一鍵進入","介紹縮短，第一眼就知道是和朋友住同一個小鎮","邀請碼、小鎮代碼打錯，或網路斷掉，會告訴你下一步怎麼做","載入太久會提示網路比較慢，進不去時有「再試一次」","新玩家第一次進來，不會先跳更新通知，新手提示等選完個性再出現"]},
 {id:"u17-buttons",date:"11/09",title:"互動按鈕全部放在面板第一層",items:["設施的特餐、點歌、簽到、釣魚、丟飛盤等，不用再點「更多互動」，直接一顆一顆列出來","在家的快速休息、快速睡覺、睡覺也直接按；整蠱分成「惡作劇」「丟雞蛋」兩顆","不能按的按鈕不再藏起來，會灰掉並寫原因（冷卻剩幾分、要有人在場、集點不夠）","按鈕依用途分組：吃喝、玩樂、社交、工作與任務","同地點有幾個人在，就各有一顆邀請按鈕"]},
 {id:"u16-mobile",date:"11/09",title:"手機畫面更好按",items:["上方工具列的按鈕變大，單手比較好點","狀態列的錢和禮物、零食數量不再蓋到心情格","每日任務等選項按鈕，標題和說明分成上下兩行","選單裡的項目排得更緊，一次看到更多","頁籤和關閉鈕加大，不容易按錯"]},
 {id:"u15-home-rest",date:"11/09",title:"在家休息的人更清楚",items:["回家睡覺或離線在家休息的人，屋頂會一直飄 Z","他在屋裡時，點他只能傳訊息，不能打電話、叫外送、送禮","要互動，走到他家叫醒他，或等他出門"]},
 {id:"u14-jail",date:"11/09",title:"新增監獄，可以砍人（不會死）",items:["地圖左上角多了「監獄」","和有仇的人在路上碰面，可以動手砍他，他會受傷、倒地送醫院","動手可能被巡警抓去關 1～3 小時，關著不能移動","牢裡可以做勞動賺錢、縮短刑期，或付保釋金出去","朋友可以探監、替你保釋","角色不會死，醫藥費和保釋金最多付到 0，不會欠錢"]},
 {id:"u15-sink",date:"11/09",title:"財產稅、鎮基金、奢侈品",items:["存款超過 100000 的部分，每天扣 0.5% 財產稅，沒超過不用繳","房租、稅金、奢侈品的一部分會進鎮基金，鎮長面板看得到","餐廳有高級套餐、健身房有溫泉、廣場有小旅行，貴但心情大增","奢侈品有冷卻，鎮長可以關掉"]},
 {id:"u14-layout",date:"11/09",title:"地圖重新排版",items:["每間設施之間拉開至少 2 格空地，不再貼在一起","地圖加寬了一點，東邊多了空間","路邊物件、斑馬線位置都跟著調整","在設施裡的人會自動移到新的門口"]},
 {id:"u13-facility",date:"11/09",title:"各設施新互動、每日任務板",items:["餐廳、咖啡廳、電影院、健身房、公園、廣場的面板多了「更多互動」","特餐、集點卡、請客、點歌、每日換片、對練、簽到、丟飛盤、釣魚、野餐、合照","可以坐下逗留，坐越久恢復越多","同一地點來 5 次變常客有折扣，15 次更多","選單「每日任務」每天三個小任務，完成領獎金"]},
 {id:"u12-levels",date:"11/09",title:"活躍天數等級",items:["每天上線有動作就算活躍一天，累積升級","共 5 級：新居民到小鎮元老","等級越高：打工冷卻越短、背包越大、房租折扣越多","Lv2 起每天第一次上線有登入小禮","斷了不會掉級，只是連續天數重算","到「我的人生」看進度"]},
 {id:"u11-workcd",date:"11/09",title:"打工改成固定薪水＋冷卻",items:["打工薪水不再遞減，每次都拿全額","所有打工共用冷卻，預設 10 分鐘","精力是上限：打工會吃掉精力","房租水電調整：小屋 400、公寓 800、獨棟 1800、豪宅 4000"]},
 {id:"u10-social",date:"11/08",title:"設施小事件與邀請一起做",items:["在設施裡待著，偶爾跳出小事件，選一個做法","同地點有人，選事件會有「一起」加成","設施面板可以邀請朋友一起做，對方接受兩人都加成","每人每天加成有上限，不能互刷"]},
 {id:"u09-traffic",date:"11/07",title:"交通：車、駕照、罰單、事故",items:["車行可買腳踏車、機車、汽車","機車汽車要考駕照，無照被抓會罰款","紅綠燈、速限、斑馬線都有，可選守規矩或衝","可能發生事故，有強制險與任意險","車會磨損，可修理或賣掉"]},
 {id:"u08-open",date:"11/05",title:"設施全天營業",items:["所有設施不再有營業時間，隨時可以去","不用再看時間才出門","鎮長仍可關閉設施","超市、餐廳、電影院等半夜也能去"]},
 {id:"u07-bond",date:"11/05",title:"好感與隨機相遇",items:["好感加減數字重新調整，每對朋友每天有上限","同地點做事時，可能隨機遇到事件","和好、扁人、冷卻時間都整理過","按建議的下一步會自動走過去並執行"]}
];
// 設施互動表（和 supabase/town_fac.sql 一致，test.js 會比對）
/*RULES:START*/
// 互動效果單一來源：晶片、門檻、長按卡、文件都從這裡產生。改數值只改這裡＋對應 SQL，再跑 node tools/town-rules-doc.mjs。
// 欄位：k 代號、m 按鈕標籤比對（去掉圖示後）、t 名稱、at 限定地點、fx [[stat,delta]]（delta 數字或字串）或 (r,H)=>[…]、need [[類型,值]]（energy 精力≥、item 需要物品、cd 次數限制、near 要有人在場）、p 機率說明、sql "檔名#SQL 內可搜尋的字串"、chk [[正規式（SQL 內）,"擷取的數字，逗號相連"]]
const RULES=[
{k:"eat",m:/^吃飯/,t:"在家吃飯",fx:(r,H)=>H.hasF(r,"fridge")?[["money",-30],["hunger",48],["energy",15]]:[["money",-60],["hunger",32],["energy",15],["fun",-3]],sql:"town.sql#act = 'eat' then n := 60",chk:[[/act = 'eat' then n := (\d+) - (\d+)\*public\.town_fu\(r,'fridge'\).*?then (\d+) else (\d+) end\)\*fm; r\.energy := r\.energy \+ (\d+)/,"60,30,48,32,15"]]},
{k:"toilet",m:/^上廁所/,t:"上廁所",fx:(r,H)=>H.hasF(r,"toilet")?[["bladder","滿"]]:[["bladder","滿"],["hygiene",-10],["fun",-3]],sql:"town.sql#act = 'toilet' then r.bladder := 100",chk:[[/act = 'toilet' then r\.bladder := (\d+); if public\.town_fu\(r,'toilet'\)=0 then r\.hygiene := r\.hygiene - (\d+); r\.fun := r\.fun - (\d+)/,"100,10,3"]]},
{k:"shower",m:/^洗澡/,t:"洗澡",fx:(r,H)=>H.hasF(r,"shower")?[["hygiene","滿"],["energy",10],["fun",3]]:[["hygiene","+70%缺口"],["fun",3]],sql:"town.sql#act = 'shower' then",chk:[[/r\.hygiene := 100; r\.energy := r\.energy \+ (\d+); else r\.hygiene := r\.hygiene \+ \(100 - r\.hygiene\)\*\.(\d+); end if; r\.fun := r\.fun \+ (\d+)/,"10,7,3"]]},
{k:"tv",m:/^看電視/,t:"看電視",fx:(r,H)=>H.hasF(r,"tvcab")?[["fun",15+7*(H.hasF(r,"sofa")?1:0)],["energy",-3]]:[["fun",6]],sql:"town.sql#act = 'tv' then",chk:[[/town_fu\(r,'tvcab'\)=1 then r\.fun := r\.fun \+ (\d+) \+ (\d+)\*public\.town_fu\(r,'sofa'\); r\.energy := r\.energy - (\d+); else r\.fun := r\.fun \+ (\d+)/,"15,7,3,6"]]},
{k:"nap",m:/^快速休息/,t:"快速休息",fx:(r,H)=>[["energy",H.hasF(r,"massage")?100:H.hasF(r,"sofa")?70:50]],sql:"town.sql#act = 'nap' then",chk:[[/r\.energy := r\.energy \+ case when public\.town_fu\(r,'massage'\)=1 then (\d+) when public\.town_fu\(r,'sofa'\)=1 then (\d+) else (\d+) end/,"100,70,50"]]},
{k:"snack",m:/^吃零食/,t:"吃零食",fx:[["hunger",20],["fun",3]],need:[["item","零食 1 包"]],sql:"town.sql#act = 'snack' then",chk:[[/r\.hunger := r\.hunger \+ (\d+)\*fm; r\.fun := r\.fun \+ (\d+);\n  elsif act in \('unwrap'/,"20,3"]]},
{k:"play",m:/^玩一下/,t:"玩一下",fx:[["fun",20],["energy",-5]],sql:"town.sql#act = 'play' then",chk:[[/act = 'play' then r\.fun := r\.fun \+ (\d+); r\.energy := r\.energy - (\d+)/,"20,5"]]},
{k:"dine",m:/^吃一頓/,t:"餐廳吃一頓",fx:[["money",-250],["hunger",55],["energy",20],["fun",10]],sql:"town.sql#act = 'dine' then",chk:[[/town_px\(r\.town_id, (\d+)\) then raise exception '錢不夠，去公司打工吧'[^]*?r\.hunger := r\.hunger \+ (\d+)\*fm; r\.energy := r\.energy \+ (\d+); r\.fun := r\.fun \+ (\d+)/,"250,55,20,10"]]},
{k:"coffee",m:/^喝咖啡/,t:"喝咖啡",fx:[["money",-90],["energy",50],["fun",3],["bladder",-10]],sql:"town.sql#act = 'coffee' then",chk:[[/act = 'coffee' then if r\.money < public\.town_px\(r\.town_id, (\d+)\).*?r\.energy := r\.energy \+ (\d+); r\.fun := r\.fun \+ (\d+); r\.bladder := r\.bladder - (\d+)/,"90,50,3,10"]]},
{k:"movie",m:/^看電影/,t:"看電影",fx:[["money",-300],["fun",35],["energy",-5]],sql:"town.sql#act = 'movie' then",chk:[[/act = 'movie' then if r\.money < public\.town_px\(r\.town_id, (\d+)\).*?r\.fun := r\.fun \+ (\d+); r\.energy := r\.energy - (\d+)/,"300,35,5"]]},
{k:"workout",m:/^健身/,t:"健身",fx:[["energy",-15],["hunger",-10],["hygiene",-15],["fun",10]],need:[["energy",15]],sql:"town.sql#太累了，先休息",chk:[[/if r\.energy < (\d+) then raise exception '太累了，先休息'; end if; r\.energy := r\.energy - (\d+); r\.hunger := r\.hunger - (\d+); r\.hygiene := r\.hygiene - (\d+); r\.fun := r\.fun \+ (\d+)/,"15,15,10,15,10"]]},
{k:"work",m:/^(去公司)?打工/,at:["office"],t:"公司打工",fx:(r,H)=>[["money",H.wage(r)],["energy",-25],["fun",-10],["hunger",-8]],need:[["energy",25]],p:"薪水為職階底薪，實發另乘心情、個性、事件、前科、智力",sql:"town.sql#act = 'work' then if r.energy < 25",chk:[[/act = 'work' then if r\.energy < (\d+)[^]*?r\.energy := r\.energy - (\d+); r\.fun := r\.fun - (\d+); r\.hunger := r\.hunger - (\d+)/,"25,25,10,8"]]},
{k:"f:special",m:"fac:special",t:"今日特餐",fx:[["money",-200],["hunger",40],["fun",12]],sql:"town_fac.sql#act = 'special'",chk:[[/when 'special' then (\d+)/,"200"],[/act = 'special' then h := (\d+); f := (\d+)/,"40,12"]]},
{k:"f:takeout",m:"fac:takeout",t:"打包帶走",fx:[["money",-120],["fun",3]],need:[["item","背包未滿"]],p:"另得零食 1 包",sql:"town_fac.sql#act = 'takeout'",chk:[[/when 'takeout' then (\d+)/,"120"],[/打包了一份帶走/,""]]},
{k:"f:latte",m:"fac:latte",t:"特調咖啡",fx:[["money",-300],["energy",45],["fun",4]],p:"另得集點 +1",sql:"town_fac.sql#act = 'latte'",chk:[[/when 'latte' then (\d+)/,"300"],[/act = 'latte' then\s+e := (\d+); f := (\d+)/,"45,4"]]},
{k:"f:redeem",m:"fac:redeem",t:"集點卡換一杯",fx:[["energy",45],["fun",6]],need:[["item","集點卡 8 點"]],sql:"town_fac.sql#act = 'redeem'",chk:[[/act = 'redeem' then.*?e := (\d+); f := (\d+)/s,"45,6"]]},
{k:"f:treat",m:"fac:treat",t:"請客",fx:[["money",-200],["fun",4],["bond",3]],need:[["near","要有人在場"]],p:"對方心情 +10",sql:"town_fac.sql#act = 'treat'",chk:[[/when 'treat' then (\d+)/,"200"],[/act = 'treat' then\s+f := (\d+); b := (\d+); t\.fun := t\.fun \+ (\d+)/,"4,3,10"]]},
{k:"f:song",m:"fac:song",t:"點歌",fx:[["money",-50],["fun",6]],p:"在場的人心情 +3",sql:"town_fac.sql#act = 'song'",chk:[[/when 'song' then (\d+)/,"50"],[/act = 'song' then\s+f := (\d+).*?fun \+ (\d+)\)/,"6,3"]]},
{k:"f:film",m:"fac:film",t:"看今日片",fx:[["money",-280],["fun","+16～22"],["energy","−4～0"]],p:"每天換片",sql:"town_fac.sql#act = 'film'",chk:[[/when 'film' then (\d+)/,"280"],[/f := \(array\[(\d+),(\d+),(\d+),(\d+)\]\)\[i \+ 1\]; e := \(array\[(-?\d+),(-?\d+),(-?\d+),(-?\d+)\]\)/,"18,22,16,20,-2,0,0,-4"]]},
{k:"f:popcorn",m:"fac:popcorn",t:"爆米花",fx:[["money",-80],["hunger",12],["fun",4]],sql:"town_fac.sql#act = 'popcorn'",chk:[[/when 'popcorn' then (\d+)/,"80"],[/act = 'popcorn' then h := (\d+); f := (\d+)/,"12,4"]]},
{k:"f:spar",m:"fac:spar",t:"健身房對練",fx:[["energy",-12],["fun",6],["bond",2]],need:[["energy",25],["near","要有人在場"]],p:"雙方精力都要 ≥25",sql:"town_fac.sql#act = 'spar'",chk:[[/act = 'spar' then\s+if r\.energy < (\d+) or t\.energy < (\d+).*?e := -(\d+); f := (\d+); b := (\d+)/s,"25,25,12,6,2"]]},
{k:"f:checkin",m:"fac:checkin",t:"每日簽到",fx:[["fun",3]],need:[["cd","每天 1 次"]],p:"連續 3 天 +$60、7 天 +$200",sql:"town_fac.sql#act = 'checkin'",chk:[[/f := (\d+); msg := '健身房簽到/,"3"],[/s % 7 = 0 then m := m \+ (\d+).*?s % 3 = 0 then m := m \+ (\d+)/s,"200,60"]]},
{k:"f:frisbee",m:"fac:frisbee",t:"丟飛盤",fx:[["energy",-4],["fun",8],["bond",1]],need:[["energy",10],["near","要有人在場"]],sql:"town_fac.sql#act = 'frisbee'",chk:[[/act = 'frisbee' then\s+if r\.energy < (\d+) or t\.energy < (\d+).*?e := -(\d+); f := (\d+); b := (\d+)/s,"10,10,4,8,1"]]},
{k:"f:fish",m:"fac:fish",t:"釣魚",fx:[["money",-30],["fun",4]],p:"15% 賣 $100、35% 賣 $30、其餘空手",sql:"town_fac.sql#act = 'fish'",chk:[[/when 'fish' then (\d+)/,"30"],[/f := (\d+);\n    if pa < \.(\d+) then m := m \+ (\d+).*?elsif pa < \.(\d+) then m := m \+ (\d+)/s,"4,15,100,50,30"]]},
{k:"f:picnic",m:"fac:picnic",t:"野餐",fx:[["money",-150],["hunger",25],["fun",12]],p:"有人在場好感 +1",sql:"town_fac.sql#act = 'picnic'",chk:[[/when 'picnic' then (\d+)/,"150"],[/act = 'picnic' then\s+h := (\d+); f := (\d+)/,"25,12"]]},
{k:"f:feast",m:"fac:feast",t:"高級套餐",fx:[["money",-3000],["hunger",40],["fun",30]],sql:"town_fac.sql#act = 'feast'",chk:[[/when 'feast' then (\d+)/,"3000"],[/act = 'feast' then h := (\d+); f := (\d+)/,"40,30"]]},
{k:"f:spa",m:"fac:spa",t:"溫泉 SPA",fx:[["money",-2000],["energy",30],["fun",25],["hygiene",40]],sql:"town_fac.sql#act = 'spa'",chk:[[/when 'spa' then (\d+)/,"2000"],[/act = 'spa' then e := (\d+); f := (\d+); r\.hygiene := least\(100, r\.hygiene \+ (\d+)/,"30,25,40"]]},
{k:"f:trip",m:"fac:trip",t:"小旅行",fx:[["money",-8000],["fun",60],["energy",-10],["hunger",-10]],sql:"town_fac.sql#act = 'trip'",chk:[[/when 'trip' then (\d+)/,"8000"],[/act = 'trip' then e := -(\d+); h := -(\d+); f := (\d+)/,"10,10,60"]]},
{k:"f:photo",m:"fac:photo",t:"自拍",fx:[["fun",5]],sql:"town_fac.sql#act = 'photo'",chk:[[/act = 'photo' then\s+f := (\d+)/,"5"]]},
{k:"f:photo2",m:"fac:photo2",t:"合照",fx:[["fun",6],["bond",1]],need:[["near","要有人在場"]],sql:"town_fac.sql#act = 'photo'",chk:[[/if pair then f := (\d+); b := (\d+)/,"6,1"]]},
{k:"hosp:consult",m:/^掛號看診/,t:"掛號看診",fx:[["money",-150],["energy",20],["hygiene",40],["fun",5]],need:[["cd","每天 1 次"]],sql:"town_civic.sql#if op = 'consult' then"},
{k:"jail:yard",m:/^放風/,t:"放風",fx:[["fun",6],["energy",-3]],need:[["cd","30 分鐘 1 次"]],sql:"town_jail.sql#if act = 'yard' then"}
];
/*RULES:END*/
const RULES_TODO=/^(申請假釋|繳罰單|叫醒|叫他出來|旅人|找流動|和旅人|自首|出院|丟雞蛋|串門子|幫他洗澡|煮飯給他|送禮物|買禮物|買零食|惡作劇|打擂台|打喪屍豬|賣生豬肉|清掉便便|溜進去偷飼料|快速睡覺|做牢裡的勞動|付保釋金|替 |探病|越獄|報案|逛逛|買|探|應戰|向 |邀請|謝謝|換|看室內|裝潢|拉花|共點|主餐|外帶|情侶座|看完聊|今日特價|試吃|會員點數|常客|打工|每日任務|坐下|起身|丟飛盤|釣魚|健身房對練)/;
const FAC={special:["今日特餐",200,"飽足 +40 · 心情 +12",["restaurant"],0],takeout:["打包帶走",120,"一份零食放進背包",["restaurant"],0],
 latte:["特調咖啡",300,"精力 +45 · 心情 +4 · 集點卡 +1",["cafe"],0],redeem:["集點卡換一杯",0,"集滿 8 點免費換一杯 · 精力 +45 · 心情 +6",["cafe"],0],
 treat:["請客",200,"請在場的人喝咖啡：對方心情 +10、你 +4、好感 +3",["cafe"],1],song:["點歌",50,"你心情 +6，在場的人心情 +3",["cafe"],0],
 film:["看今日片",280,"",["cinema"],0],popcorn:["爆米花",80,"飽足 +12 · 心情 +4",["cinema"],0],
 spar:["對練",0,"雙方精力 −12、心情 +6、好感 +2 · 雙方精力要 ≥25",["gym"],1],checkin:["每日簽到",0,"心情 +3 · 連續 3 天 +€60、7 天 +€200",["gym"],0],
 frisbee:["丟飛盤",0,"雙方精力 −4、心情 +8、好感 +1",["park","plaza"],1],fish:["釣魚",30,"餌 €30：15% 賣 €100、35% 賣 €30、其餘空手 · 心情 +4",["park"],0],
 picnic:["野餐",150,"飽足 +25 · 心情 +12 · 在場的人好感 +1",["park"],0],feast:["高級套餐",3000,"飽足 +40 · 心情 +30 · 不打折",["restaurant"],0],spa:["溫泉 SPA",2000,"精力 +30 · 心情 +25 · 清潔 +40 · 不打折",["gym"],0],trip:["小旅行",8000,"心情 +60 · 精力 −10 · 飽足 −10 · 不打折",["plaza"],0],photo:["自拍",0,"心情 +5",["park","plaza"],0],photo2:["合照",0,"雙方心情 +6、好感 +1",["park","plaza"],1]};
Object.assign(FAC,{art:["拉花小遊戲",150,"點對時機：品質越高精力越多 · 高品質集點 +1",["cafe"],0],share:["共點一壺",240,"雙方精力 +25、心情 +6、好感 +3",["cafe"],1],combo:["主餐＋飲料套餐",320,"飽足 +50 · 心情 +16",["restaurant"],0],bring:["外帶給朋友",200,"他飽足 +20、心情 +6、好感 +3",["restaurant"],1],seat:["情侶座看片",360,"雙方心情 +20、好感 +4",["cinema"],1],chat:["看完聊劇情",0,"雙方心情 +6、好感 +2",["cinema"],1],sale:["今日特價零食",42,"每天輪替 · 零食 +1、會員點數 +1",["market"],0],sample:["試吃",0,"飽足 +6 · 心情 +1",["market"],0],mredeem:["會員點數換零食",0,"滿 10 點換 2 包零食",["market"],0]});
const VENACT=new Set(["art","share","combo","bring","seat","chat","sale","sample","mredeem","reg"]);
const REG={cafe:["老王","Amy","阿嬤"],restaurant:["胖叔","小雯","老闆娘的朋友"],cinema:["影迷阿凱","小琪","退休老師"],market:["王媽媽","陳伯","小美"]},REGP={cafe:[90,80],restaurant:[200,170],cinema:[280,240],market:[60,50]},REGQ={cafe:"幫我帶一杯咖啡",restaurant:"幫我帶一份便當",cinema:"幫我買一張票",market:"幫我拿一包零食"};
const TASKS=["今天打工 3 次","做 3 次設施互動","去 3 個不同地點互動","和 2 位鄰居一起互動","健身房簽到","釣到一條魚","點歌或請客一次","吃今日特餐或野餐"];
const RW=12,RH=5,RC=24;
const ITEM={coffee:["cup","咖啡機",/特調咖啡/,1],cake:["cookie","蛋糕櫃",/集點卡/,1],lamp:["lamp","立燈",null,1],jukebox:["guitar","點歌機",/點歌/,1],job:["case","員工通道",/^打工|^應徵/,0],bar:["plate","吧台",/請客|吃一頓/,1],table:["bench","桌椅",/坐下|起身/,1],plant:["plant","盆栽",null,1],
 kitchen:["meat","廚房窗口",/今日特餐|主餐＋飲料套餐/,1],latteart:["cup","拉花台",/拉花/,1],pot:["plate","共享茶壺桌",/共點/,1],menu:["picture","菜單板",/高級套餐/,0],pack:["box","打包櫃檯",/打包|外帶/,1],mirror:["picture","鏡子",null,0],locker:["lock","置物櫃",/每日簽到/,0],spa:["drops","溫泉池",/溫泉/,0],treadmill:["walk","跑步機",/^健身/,1],rack:["dumbbell","啞鈴架",/^健身/,1],bag:["fist","拳擊沙包",/對練/,1],
 bars:["bars","鐵窗",null,0],vent:["vent","通風口",/越獄/,0],glass:["glass","探監窗口",/探望/,0],gate:["door","大門（假釋）",/假釋/,0],bailDesk:["ticket","保釋櫃檯",/保釋/,1],bunk:["bed","上下鋪",null,1],work:["hammer","勞動工作台",/牢裡的勞動/,1],yard:["tree","放風場",/放風/,0],
 hbed:["bed","病床",null,1],reg:["ticket","掛號櫃檯",/掛號看診|^出院/,1],meds:["box","藥櫃",null,1],cross:["cross","十字標誌",null,0],
 pdesk:["case","櫃檯",/繳罰單/,1],pboard:["picture","通緝公告板",/自首/,1],prep:["mail","報案窗口",/報案/,1],pstat:["chart","治安看板",/今日治安/,1],badge:["badge","警徽",null,0],
 hall:["case","服務櫃檯",/大廳/,1],annb:["scroll","公告欄",/大廳/,1],ballot:["ticket","投票箱",/大廳/,1],cfund:["money","基金箱",/大廳/,1],
 giftshelf:["gift","禮品架",/買禮物/,1],snackshelf:["cookie","零食架",/買零食|特價零食/,1],clothes:["shirt","服飾架",/造型與擺飾/,1],till:["till","收銀台",/逛逛|賣生豬肉|會員點數/,1],mshelf:["shelf","貨架",/試吃/,1],frame:["picture","掛畫",null,1],
 screen:["screen","銀幕",/看電影|看今日片|聊劇情/,1],popcorn:["box","爆米花機",/爆米花/,1],seat:["seat","座椅",/情侶座/,0],
 pc:["pc","辦公桌電腦",/^打工|^應徵|加班/,1],pcs:["pc","交易終端",/看盤與買賣/,1],board:["chart","行情看板",/看盤與買賣/,1],tick:["chart","走勢圖",null,1],
 ring:["ring","擂台",/打擂台|打一場/,1],sandbag:["fist","沙包",null,1],trophy:["trophy","獎盃櫃",null,1],blades:["swords","兵器架",null,1],
 vbike:["bike","腳踏車展示台",/腳踏車/,1],vmoto:["moto","機車展示台",/機車/,1],vcar:["car","汽車展示台",/汽車/,1],lic:["ticket","駕照報名櫃檯",/駕照/,1],gar:["wrench","保險維修櫃檯",/保險、維修/,1],
 cleaver:["cleaver","屠宰檯",/偷飼料/,1],hook:["meat","掛肉鉤",null,1],
 slotm:["slot","老虎機",/玩老虎機/,1],rwheel:["wheel","輪盤",/玩輪盤/,1],btable:["ctable","百家樂桌",/玩百家樂/,1],bjt:["card","21 點桌",/玩21點/,1],dtable:["dice","骰寶桌",/玩骰寶/,1],cashier:["chipstack","籌碼櫃台",/小豬賭場/,1]};
const ROOMS={
 cafe:{floor:["#d9b48a","#cfa67a"],wall:"#7a4a24",items:[["coffee",1,0],["cake",3,0],["lamp",5,0],["latteart",6,0],["jukebox",8,0],["job",10,0],["bar",2,1],["pot",6,3],["table",4,3],["table",8,3],["plant",0,4],["plant",11,4]]},
 restaurant:{floor:["#f1e0c6","#e6d0ae"],wall:"#c0392b",items:[["kitchen",1,0],["menu",3,0],["lamp",5,0],["lamp",8,0],["job",10,0],["bar",2,1],["pack",4,1],["table",3,3],["table",7,3],["table",10,3],["plant",0,4],["plant",11,4]]},
 gym:{floor:["#9aa5b8","#8f9aae"],wall:"#2e4057",items:[["mirror",1,0],["mirror",3,0],["locker",6,0],["job",8,0],["spa",10,0],["treadmill",1,2],["treadmill",3,2],["rack",10,2],["bag",6,3],["rack",10,4],["plant",0,4]]},
 jail:{floor:["#8d8d96","#84848d"],wall:"#4a4a55",items:[["bars",1,0],["bars",3,0],["vent",5,0],["lamp",6,0],["glass",8,0],["gate",10,0],["bailDesk",10,1],["bunk",0,2],["bunk",0,4],["bunk",2,2],["bunk",2,4],["work",8,3],["yard",5,4],["yard",6,4]]},
 hospital:{floor:["#e8eef2","#dde6ec"],wall:"#9ec9e8",items:[["meds",1,0],["meds",3,0],["cross",5,0],["lamp",7,0],["reg",9,0],["hbed",1,2],["hbed",3,2],["hbed",5,2],["hbed",1,4],["lamp",11,0],["plant",11,4]]},
 police:{floor:["#b9c3d6","#aeb9ce"],wall:"#2c3e8c",items:[["pboard",1,0],["pstat",3,0],["badge",5,0],["pdesk",7,0],["prep",9,0],["lamp",11,0],["bar",2,2],["table",8,3],["plant",0,4],["plant",11,4]]},
 townhall:{floor:["#e6d8b8","#d9c9a8"],wall:"#7a4a24",items:[["annb",1,0],["annb",3,0],["lamp",5,0],["hall",7,0],["ballot",9,0],["cfund",11,0],["plant",0,2],["plant",11,2],["table",3,3],["table",8,3],["plant",0,4],["plant",11,4]]}};
Object.assign(ROOMS,{
 market:{floor:["#e9e3d3","#ded6c2"],wall:"#3a7d44",items:[["snackshelf",1,0],["giftshelf",3,0],["clothes",5,0],["lamp",7,0],["till",9,0],["job",11,0],["mshelf",2,2],["mshelf",5,2],["mshelf",8,2],["plant",0,4],["plant",11,4]]},
 cinema:{floor:["#6b2e3a","#5f2833"],wall:"#3b2f6b",items:[["popcorn",1,0],["lamp",2,0],["screen",4,0],["screen",5,0],["screen",6,0],["screen",7,0],["lamp",9,0],["seat",3,2],["seat",4,2],["seat",5,2],["seat",6,2],["seat",7,2],["seat",8,2],["seat",3,3],["seat",4,3],["seat",5,3],["seat",6,3],["seat",7,3],["seat",8,3],["plant",0,4],["plant",11,4]]},
 office:{floor:["#c9ced6","#bfc5ce"],wall:"#34495e",items:[["lamp",0,0],["frame",2,0],["frame",4,0],["mshelf",6,0],["mshelf",7,0],["lamp",9,0],["pc",1,2],["pc",4,2],["pc",7,2],["pc",10,2],["plant",0,4],["plant",11,4],["table",5,4]]},
 rafi:{floor:["#d7c9e6","#cdbedd"],wall:"#5b3a8c",items:[["frame",1,0],["frame",3,0],["lamp",5,0],["mshelf",7,0],["mshelf",8,0],["lamp",10,0],["pc",2,2],["pc",5,2],["pc",9,2],["plant",0,4],["plant",11,4]]},
 stock:{floor:["#2b2f3a","#262a34"],wall:"#1f3a2a",items:[["tick",1,0],["board",3,0],["tick",5,0],["lamp",7,0],["frame",9,0],["lamp",11,0],["pcs",2,2],["pcs",5,2],["pcs",8,2],["table",10,3],["plant",0,4],["plant",11,4]]},
 arena:{floor:["#a4553a","#9a4d33"],wall:"#5a1f1f",items:[["trophy",1,0],["lamp",3,0],["blades",5,0],["lamp",8,0],["trophy",10,0],["sandbag",1,3],["sandbag",1,4],["ring",5,2],["ring",6,2],["ring",5,3],["ring",6,3],["table",9,3],["table",9,4],["plant",11,4]]},
 carshop:{floor:["#9aa0a6","#8f959b"],wall:"#1d4e89",items:[["lic",1,0],["gar",3,0],["lamp",5,0],["lamp",9,0],["vbike",2,2],["vmoto",5,2],["vcar",8,2],["vcar",10,3],["plant",0,4],["plant",11,4]]},
 casino:{floor:["#5a1f2e","#511b29"],wall:"#1b1b2f",items:[["slotm",1,0],["slotm",2,0],["slotm",3,0],["lamp",5,0],["lamp",7,0],["cashier",9,0],["lamp",11,0],["rwheel",1,2],["btable",4,2],["btable",5,2],["bjt",7,2],["dtable",10,2],["plant",0,4],["plant",11,4]]},
 slaughter:{floor:["#8a8a85","#7f7f7a"],wall:"#5a1a1a",items:[["hook",1,0],["hook",3,0],["lamp",5,0],["hook",8,0],["hook",10,0],["cleaver",5,2],["cleaver",6,2],["mshelf",1,3],["mshelf",10,3],["plant",0,4]]}});
// 店員 NPC：固定在櫃台旁、不佔玩家站位、純表現（不動數值、不寫資料庫）
ROOMS.cafe.npc=[3,1];ROOMS.cinema.npc=[10,1];ROOMS.market.npc=[10,1];ROOMS.restaurant.npc=[3,1];ROOMS.gym.npc=[5,1];ROOMS.hospital.npc=[7,1];ROOMS.police.npc=[7,1];ROOMS.townhall.npc=[5,1];ROOMS.casino.npc=[8,1];
const NPCS={cafe:{n:"小咪",hair:"#7a4a24",job:"咖啡師",base:90,item:"特調咖啡"},restaurant:{n:"阿福",hair:"#222",job:"店長",base:250,item:"餐廳套餐"},gym:{n:"阿力",hair:"#c0392b",job:"教練",base:0,item:""},hospital:{n:"白護理師",hair:"#e8c27a",job:"護理師",base:0,item:""},police:{n:"小林警員",hair:"#222",job:"警員",base:0,item:""},cinema:{n:"小映",hair:"#3b2f6b",job:"售票員",base:300,item:"電影票"},market:{n:"阿珍",hair:"#8a5a2b",job:"店員",base:0,item:""},casino:{n:"荷官小莉",hair:"#222",job:"荷官",base:0,item:""},townhall:{n:"陳櫃員",hair:"#555",job:"櫃員",base:0,item:""}};
const NPC_LINES={casino:["願賭服輸，量力而為","籌碼放好，別弄丟了","輪盤剛轉完，下一局？","百家樂桌還有位子","離場會自動換回現金喔","今天手氣如何？"],cafe:["今天的豆子很香喔","要不要來杯特調？","歡迎光臨～","外面好像要下雨了","拉花台今天心情很好","集滿 8 點有免費的喔"],cinema:["今天的片很好哭","爆米花剛出爐","情侶座還有位子","散場記得聊聊劇情"],market:["今天的特價別錯過","試吃區有新口味","集滿 10 點換零食","小心地板剛拖過"],restaurant:["今天的菜很新鮮","歡迎光臨，幾位？","小心燙喔","廚房正在忙～","套餐附飲料喔","要外帶也可以"],gym:["多喝水、多伸展","今天練哪裡？","別硬撐，慢慢來","加油，再一組！"],hospital:["有哪裡不舒服嗎？","請多休息","保重身體喔","小聲一點，病人在睡"],police:["遵守交通規則喔","有事可以報案","最近鎮上很平靜","騎車要慢一點"],townhall:["有事可以看公告","投票別忘了","鎮長最近很忙","歡迎來市政廳"]};
const NPC_NIGHT=["這麼晚了還沒睡？","夜深了，早點休息","夜班真安靜"],NPC_BUSY=["今天好熱鬧！","人好多，慢慢來","大家都來了呢"],NPC_EMPTY=["今天好安靜…","只有你一位呢","歡迎，隨便坐"];
const npcSay=(p,t,cnt)=>{const hr=new Date(Date.now()+8*36e5).getUTCHours(),L=NPC_LINES[p].slice();if(hr>=22||hr<6)L.push(...NPC_NIGHT);if(cnt>=3)L.push(...NPC_BUSY);else if(cnt==0)L.push(...NPC_EMPTY);const k=Math.floor(t/9000);return L[(k*7+p.length)%L.length]};
// 站位：沒被擋住的地板格，離場景中央近的先排
const rw=rm=>rm.w||RW,rh=rm=>rm.h||RH,blk=(rm,o)=>rm.home?!(WALLF.includes(o[0])||FLAT.includes(o[0])):ITEM[o[0]][3];
function homeRoom(r){const it=r.items||{},hl=hlc(it.hl),d=HOME_DIM[hl-1];return {home:true,hid:r.id,w:d[0],h:d[1]+1,items:fpOf(it),wall:it.wall||"#f4ead6",floor:["#e6d8b8","#d9c9a8"]}}
function roomSpots(rm){const W=rw(rm),H=rh(rm),blocked=new Set(rm.items.filter(o=>blk(rm,o)).map(o=>o[1]+","+o[2]).concat(rm.npc?[rm.npc[0]+","+rm.npc[1]]:[])),out=[],cx=(W-1)/2,cy=(H+1)/2,sc=a=>Math.abs(a[0]-cx)+Math.abs(a[1]-cy)*2+((a[0]+a[1])%2?3:0)+(a[1]==1?4:0);for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(!blocked.has(x+","+y))out.push([x,y]);return out.sort((a,b)=>sc(a)-sc(b))}
const fin=r=>!!r&&!!r.items&&!!ROOMS[r.place]&&(r.items.fi===r.place||(r.place=="jail"&&jailed(r)));
// 現在在哪個室內：設施裡面（fin）或自己家屋裡（inside）；都不是就 null
const visitHost=(r,RR)=>{const h=RR&&r&&r.place&&r.place.startsWith("home:")&&r.place!="home:"+r.id?RR[r.place.slice(5)]:null;return h&&inside(h)?h:null};// 在朋友家門口、他人在屋裡 → 看得到他家室內
const roomOf=(r,RR)=>!r?null:fin(r)?ROOMS[r.place]:(r.place=="home:"+r.id&&inside(r))?homeRoom(r):visitHost(r,RR)?{...homeRoom(visitHost(r,RR)),visit:true,inn:vin(r)}:null;// RR = 居民表（頂層函式拿不到 init 裡的 R，由呼叫的人傳進來）
const DGFEE=50,NIUM=c=>c==10?3:c>=7?2:1;
// 賭場新規則的賠率表（和 supabase/town_casino2.sql 一致；test_casino2.js 會比對）
const DGM=[13.6,6.3,3.85,2.65,1.9,1.4,1.05,0.8,0.6,0.45,0.3,0.2],SLW=[1,2,3,4,5,5],SLPAY=[100,30,15,10,7,5],KPAY={2:1,3:3,4:16,5:200},DSUM={4:61,5:31,6:18,7:13,8:9,9:7,10:7,11:7,12:7,13:9,14:13,15:18,16:31,17:61},RWHEEL=[0,28,9,26,30,11,7,20,32,17,5,22,34,15,3,24,36,13,1,37,27,10,25,29,12,8,19,31,18,6,21,33,16,4,23,35,14,2],RRED=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const PIGW=[30,25,20,13,8,4],PIGO1=[31,38,47,73,118,237],PIGO2=[17,19,23,34,53,105];
const PJNAME=["天牌","地牌","人牌","鵝牌","梅牌","長三","板凳","斧頭","紅頭十","高腳七","零霖六","雜九","雜九","雜八","雜八","雜七","雜七","雜五","雜五","丁三","二四"],PJTYPE_PIPS=[12,2,8,4,10,6,4,11,10,7,6,9,9,8,8,7,7,5,5,3,6],PJHALF=[[6,6],[1,1],[4,4],[1,3],[5,5],[3,3],[2,2],[5,6],[4,6],[1,6],[1,5],[4,5],[3,6],[3,5],[2,6],[2,5],[3,4],[2,3],[1,4],[1,2],[2,4]],pjType=t=>t<22?t>>1:t-11,PJPIPS=Array.from({length:32},(_,t)=>PJHALF[pjType(t)]);
const pjDunName=sc=>sc>=2000?"至尊":sc>=1000?PJNAME[21-(sc-1000)/10]+"對":Math.floor(sc/100)+" 點",sgName=c=>c>=30000?"大三公":c>=20000?"小三公":Math.floor((c%10000)/100)+" 點";
const CHIPD=[[50,"#9aa3ad","50"],[100,"#d64541","100"],[500,"#3b7dd8","500"],[1000,"#2e9e5b","1K"],[5000,"#8e44ad","5K"],[10000,"#e67e22","1萬"],[50000,"#16a5a5","5萬"],[100000,"#2b2b3a","10萬"],[500000,"#d4a72c","50萬"],[1000000,"#c0392b","100萬"]];
function chipStack(v){const out=[];let r=v;for(let i=CHIPD.length-1;i>=0&&out.length<16;i--)while(r>=CHIPD[i][0]&&out.length<16){out.push(i);r-=CHIPD[i][0]}return out}
// 百家樂路單：bh 是 P 閒／B 莊／T 和 的字串（舊→新，最多 72 局）。珠盤路：由上往下、左往右每局一顆；大路：同一方連贏往下疊（滿 6 或下方被佔就往右拐），換邊另起一欄，和局在前一顆畫綠斜線
function baccBead(bh){const rows=6,cols=Math.max(12,Math.ceil(bh.length/rows)),g=Array.from({length:cols},()=>Array(rows).fill(""));for(let i=0;i<bh.length;i++)g[Math.floor(i/rows)][i%rows]=bh[i];return g}
function baccBig(bh){const rows=6,cells={},ties={};let last="",c=-1,r=0,maxc=-1,pend=0;const key=(a,b)=>a+","+b;
 for(const ch of bh){if(ch=="T"){if(last)ties[key(c,r)]=(ties[key(c,r)]||0)+1;else pend++;continue}
  if(!last){c=0;r=0}else if(ch==last){if(r<rows-1&&!cells[key(c,r+1)])r++;else c++;while(cells[key(c,r)])c++}else{c=maxc+1;r=0}
  cells[key(c,r)]=ch;last=ch;maxc=Math.max(maxc,c);if(pend){ties[key(c,r)]=pend;pend=0}}
 const cols=Math.max(maxc+1,1),g=Array.from({length:cols},(_,x)=>Array.from({length:rows},(_,y)=>({w:cells[key(x,y)]||"",t:ties[key(x,y)]||0})));return g}
if(typeof module!=="undefined")module.exports={PIGW,PIGO1,PIGO2,PJPIPS,PJTYPE_PIPS,baccBig,baccBead,chipStack,CHIPD,DGM,SLW,SLPAY,KPAY,DSUM,RWHEEL,RRED,DGFEE,NIUM,VENACT,HOSP,POLICE,CIVIC,CIVQ,POWERS,PWORD,hospIn,vin,roomOf,visitHost,JAIL,JAILX,JE,paroleWhy,priorOn,wantedOn,paroleOn,bailCost,FAC,TASKS,UPDATES,PEV,JT,setOff,OBJS,TAP_DEF,objNear,T,COLS,setRows,mapRows,homeXY,door,visitSpot,PLACES,PJ,pjWage,pjName,JOBS,PJT,PJM,PJN,RFT,RFW,pjTier,blocked,bfs,freePath,route,los,placeAt,slotAt,tickLocal,isRoad,hasT,moodOf,payOf,happyAt,hasF,FURN,HOUSES,HOME_DIM,WALLF,FLAT,HACT,fpOf,homeRoom,roomOf,inside,VEH,vehOwn,vehOf,isCross,isSide,CWX,lightG,isInter,zoneLim,ib,vwear,vspd,premOf,fixCost,sellVal,insLeft,ROOMS,ITEM,RW,RH,roomSpots,fin};

function init(){

const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PXC={};
const KEEP=[];function preloadIcons(){if(!window.PIXICON)return;Object.keys(window.PIXICON_MAP||{}).forEach(e=>{const i=new Image();i.src=pxIcon(e);KEEP.push(i)})}
const PIMGS={};function cimgP(e){const u=pxIcon(e);if(!u)return{complete:false};if(!PIMGS[e]){const i=new Image();i.src=u;PIMGS[e]=i}return PIMGS[e]}
function pxIcon(e){return PXC[e]||(PXC[e]=window.PIXICON?PIXICON(e):"")}
setTimeout(preloadIcons,0);
const EMO=/(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
function pxify(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode()){const n=w.currentNode;if((EMO.test(n.nodeValue)||(CUR!="€"&&n.nodeValue.includes("€")))&&!n.parentElement.closest("textarea,input,canvas,select"))nodes.push(n);EMO.lastIndex=0}
 for(const n of nodes){const tv=CUR=="€"?n.nodeValue:n.nodeValue.replace(/€/g,()=>CUR);if(!EMO.test(tv)){EMO.lastIndex=0;n.nodeValue=tv;continue}EMO.lastIndex=0;const span=document.createElement("span");span.innerHTML=tv.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])).replace(EMO,m=>`<img class="px" alt="${m}" src="${pxIcon(m)}">`);n.replaceWith(...span.childNodes)}}
// 畫面任何地方新增的 emoji 都自動變成像素圖示（選單、彈窗、首頁、需求列）
{let q=new Set(),pend=false;new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)q.add(n.nodeType==3?n.parentElement:n);if(!pend){pend=true;requestAnimationFrame(()=>{pend=false;const l=[...q];q.clear();l.forEach(el=>el&&el.isConnected&&pxify(el))})}}).observe(document.body,{childList:true,subtree:true,characterData:false});
 if(document.readyState==="complete")setTimeout(()=>pxify(document.body),0);else addEventListener("load",()=>pxify(document.body))}// 這支程式是晚載入的：頁面 load 早就過了，改成 init() 跑完（CUR 等變數宣告好）再 pxify
const toast=t=>{window.SFX&&SFX.toast(t);const q=toast.q||(toast.q=[]);if(q[q.length-1]===t||(toast.cur===t&&q.length==0))return;q.push(t);if(q.length>3)q.shift();if(!toast.run)toast.next()};toast.next=()=>{const el=$("toast"),t=toast.q.shift();if(t==null){toast.run=0;toast.cur=null;el.classList.remove("on");return}toast.run=1;toast.cur=t;el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>{el.classList.remove("on");setTimeout(toast.next,180)},toast.q.length?1500:2400)};
const SKIN=["#f1c9a5","#e0ac7e","#c68a5a","#8d5a3a"],HAIR=["#222222","#5a3a1a","#a0522d","#d9b26a","#c0c0c0","#c0392b"],SHIRT=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#333a44","#f0f0f0"],STYLE=["短髮","長髮","光頭","帽子"];
const rp=a=>a[Math.floor(Math.random()*a.length)];
const randLook=()=>({skin:rp(SKIN),hair:rp(HAIR),shirt:rp(SHIRT),style:rp(["短髮","長髮","馬尾","捲髮","瀏海"]),eyes:rp(["圓眼","瞇眼","眼鏡"]),top:rp(["T恤","帽T","襯衫"]),pants:rp(["#2b2b3a","#3b5a8a","#6b4a2b"]),bottom:rp(["長褲","短褲","裙子"]),acc:"無"});
const QS=new URLSearchParams(location.search),TID=(QS.get("t")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
{const i=(QS.get("i")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);if(i&&TID){try{sessionStorage.setItem("town-inv-"+TID,i)}catch(e){}history.replaceState(null,"","?t="+TID)}}
let CUR="$";// 全小鎮統一用「$」（豬幣），不再讓鎮長選貨幣；程式字串仍寫 €，pxify 會換成 $
let S=null,R={},offset=0,me=null,pin=null,sel=null,zoomFar=false,camFree=false,busy=false,lastSeen=null;
const walkers={};// 每個人畫面上的位置與正在走的路
const now=()=>Date.now()+offset;
nowFn=now;
const taipeiHour=()=>new Date(now()+8*36e5).getUTCHours();
const isNight=()=>{const h=taipeiHour();return h>=19||h<6};
const bySlot=s=>Object.values(R).find(r=>r.slot==s);
const placeName=p=>p&&p.startsWith("home:")?((R[p.slice(5)]||{}).name||"空屋")+" 家":(PLACES[p]||{}).name||"路上";
const bondWith=id=>{const a=Math.min(me,id),b=Math.max(me,id),x=((S&&S.bonds)||[]).find(o=>o.a==a&&o.b==b);return x?x.s:0};
// 和資料庫 town_tier 一樣的 7 階
const bondLabel=v=>v>=60?"🤝 生死之交":v>=30?"💞 好麻吉":v>=10?"😊 好朋友":v<=-50?"⚔️ 宿敵":v<=-20?"😤 死對頭":v<=-8?"😒 有點不爽":"🙂 普通鄰居";
const NEXT_TIER=[[60,"生死之交"],[30,"好麻吉"],[10,"好朋友"]];
const tierHint=v=>{const n=NEXT_TIER.slice().reverse().find(([x])=>v<x);return n?`再 ${n[0]-v} 分變成「${n[1]}」`:"已經是最高等級"};
// 面對面：在同一個地方（不算路上），或在路上距離 2 格以內
// 同在一個室內空間（你進了他家／屋主和他家的訪客；同在咖啡廳、餐廳、健身房裡）：算面對面，可以做面對面互動
const sameRoom=(a,b)=>{if(!a||!b||a.place!=b.place||a.id==b.id)return false;if(ROOMS[a.place]&&a.place!="jail")return fin(a)&&fin(b);if(a.place.startsWith("home:")){const h=+a.place.slice(5),at=o=>o.id==h?inside(o):(vin(o)&&+o.items.fv==h);return at(a)&&at(b)}return false};
const isNear=id=>{const a=R[me],b=R[id],wa=walkers[me],wb=walkers[id];if(!a||!b)return false;if(sameRoom(a,b))return true;return (a.place==b.place&&a.place!="street"&&!(wa&&wa.path.length))||(Math.abs(wa.x-wb.x)+Math.abs(wa.y-wb.y)<=2.5)};
const BAD=["prank","egg","fight"];
const grudges=()=>{const done=new Set((S.events||[]).filter(e=>e.actor==me&&e.kind=="fight"&&Date.parse(e.at)>now()-6*36e5).map(e=>e.target));return (S.events||[]).filter(e=>e.target==me&&BAD.includes(e.kind)&&R[e.actor]&&Date.parse(e.at)>now()-3*864e5&&!done.has(e.actor))};
const THANKABLE=["feed","wash","visit","gift","note","greet","delivery","call","feast"];
const thankable=()=>{const done=new Set((S.events||[]).filter(e=>e.actor==me&&e.kind=="thank"&&Date.parse(e.at)>now()-12*36e5).map(e=>e.target));return (S.events||[]).filter(e=>e.target==me&&THANKABLE.includes(e.kind)&&R[e.actor]&&Date.parse(e.at)>now()-3*864e5&&!done.has(e.actor))};
const houseName=s=>`${STREETS[Math.floor(s/3)]} ${s%3+1} 號`;

// ── 我住的小鎮（存在這台手機）──
const mine=()=>{try{return JSON.parse(localStorage.getItem("town-mine")||"[]")}catch(e){return []}};
const saveMine=e=>{e.at=Date.now();const l=mine().filter(x=>x.tid!=e.tid);l.unshift(e);try{localStorage.setItem("town-mine",JSON.stringify(l.slice(0,10)))}catch(er){}try{LP.bk(l.slice(0,10))}catch(er){}};
let mineAt=0;const touchMine=()=>{if(!TID||Date.now()-mineAt<6e4)return;mineAt=Date.now();try{const l=mine(),x=l.find(y=>y.tid==TID);if(x){x.at=Date.now();localStorage.setItem("town-mine",JSON.stringify(l))}}catch(e){}};
const dropMine=tid=>{try{const l=mine().filter(x=>x.tid!=tid);localStorage.setItem("town-mine",JSON.stringify(l))}catch(e){}try{LP.bk(mine())}catch(e){}};
const dropKey=tid=>{try{const l=mine();const x=l.find(y=>y.tid==tid);if(x)x.pin="";localStorage.setItem("town-mine",JSON.stringify(l));LP.bk(l)}catch(e){}};
window.__lost=()=>{if(LOGIN_DEAD)return;dropKey(TID);if(!me)return;LOGIN_DEAD=1;setTimeout(()=>{try{document.body.classList.remove("ingame");$("game").classList.add("hide");$("modal").classList.add("hide");$("login").classList.remove("hide");$("lg").innerHTML=`${LP.scene(1)}<h2>登入失效了</h2><p>這台裝置的登入失效了（可能在別台裝置登入太多次）。</p><p class="mut">輸入一次小鎮邀請碼就能回來，你的角色和錢都還在。</p><div class="row"><button class="pri" id="relog">重新登入</button></div>`;$("relog").onclick=()=>{LOGIN_DEAD=0;location.reload()}}catch(e){location.reload()}},0)};
const go=tid=>{location.search="?t="+tid};
// 裝置金鑰：每台手機自動產生一組，代替密碼（存在這台手機上，不用記）
const newKey=()=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",b=crypto.getRandomValues(new Uint8Array(32));return [...b].map(x=>a[x%a.length]).join("")};

// ── 首頁：建立小鎮、用代碼加入、我住的小鎮 ──
function landing(){document.body.classList.remove("ingame");$("title").textContent="🐷 小豬鎮";$("game").classList.add("hide");$("login").classList.remove("hide");const list=mine();
$("lg").innerHTML=`${LP.top(list)}
  <div id="fJoin" class="hide">${LP.stepBar(1)}<h2>輸入邀請碼</h2><p class="mut" style="margin:-4px 0 6px">朋友給你的邀請碼。點朋友傳來的邀請連結會自動填好。</p><div class="lpcode"><input id="code" placeholder="例如 RCDR4V" maxlength="8" autocomplete="off" style="text-transform:uppercase"></div><div class="row"><button class="pri" id="join">下一步：選角色</button></div><p class="err" id="jerr"></p></div>
  <div id="fNew" class="hide"><h2>建立新小鎮</h2><label>小鎮名稱<input id="tn" maxlength="16" placeholder="例如：我們的小豬鎮"></label><label>你的名字<input id="mn" maxlength="12" placeholder="鎮上大家怎麼叫你"></label>
  <h2 style="margin-top:12px">小鎮特色</h2><p class="mut" style="margin:-4px 0 6px">勾選要開的設施，之後在鎮長設定隨時能改</p>${featChecks([])}
  <div id="lk"></div><p class="err" id="cerr"></p><div class="row"><button class="pri" id="create">建立小鎮，當鎮長</button></div></div>
  ${standalone?"":`<p style="margin-top:14px"><button class="ghost" id="inst2" style="width:100%">📲 加到主畫面，像 App 一樣打開</button></p>`}`;
 const show=k=>{$("fJoin").classList.toggle("hide",k!="j");$("fNew").classList.toggle("hide",k!="n");$("cJoin").classList.toggle("on",k=="j");$("cNew").classList.toggle("on",k=="n");(k=="j"?$("code"):$("tn")).focus()};
 if($("cRec"))$("cRec").onclick=()=>recFind();$("cJoin").onclick=()=>show("j");$("cNew").onclick=()=>show("n");if(LP.want=="r"){LP.want="";if(window.RECOVERY_ON){recFind();return}}if(LP.want){show(LP.want);LP.want=""}
 $("lg").querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));if($("inst2"))$("inst2").onclick=installHelp;
 $("join").onclick=async()=>{const c=$("code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(c.length<4){$("jerr").textContent="邀請碼是 6 個英文或數字，檢查有沒有少打";return}
  // 小鎮代碼或邀請碼都可以；輸入的是邀請碼就記起來，等一下自動填好
  try{const f=await rpc("town_find",{code:c});if(!f){$("jerr").textContent="找不到這個小鎮，檢查有沒有打錯，或請朋友再傳一次";return}try{sessionStorage.setItem("town-inv-"+f.town_id,c)}catch(e){}go(f.town_id)}catch(e){$("jerr").textContent=e.message}};
 let look=randLook();lookPicker($("lk"),look,l=>look=l);
 $("create").onclick=async()=>{const tn=$("tn").value.trim(),mn=$("mn").value.trim(),p=newKey();
  if(!tn){$("cerr").textContent="先幫小鎮取個名字，再按建立";return}if(!mn){$("cerr").textContent="再填你的名字，鎮上大家會這樣叫你";return}
  $("create").disabled=true;try{const r=await rpc("town_create",{town_name:tn,my_name:mn,pin:p,look});const off=readFeats();if(off.length)try{await rpc("town_features",{rid:r.resident_id,pin:p,off})}catch(e){}saveMine({tid:r.town_id,name:tn,rid:r.resident_id,pin:p,me:mn,invite:r.invite});go(r.town_id)}
  catch(e){$("cerr").textContent=e.message;$("create").disabled=false}}}

// ── 鎮內登入：我住在這裡，或用邀請碼搬進來 ──
let refAt=0;async function refresh(){const st=await rpc("town_state",{tid:TID});refAt=Date.now();apply(st);if(me&&!acctChk&&!modalOpen()){acctChk=1;setTimeout(()=>acctModal(1),500)}else if(me&&acctForce&&!modalOpen())setTimeout(()=>acctModal(1),300);if(me)try{checkInvite();checkPk();checkWoken();checkPwn()}catch(e){}if(Date.now()-civT>6e4)civSync()}
const seenLuck=new Set();
function apply(st){S=st;setTimeout(popCheck,0);POOPS=st.poops||[];CUR="$";try{fxFromEvents(st.events||[])}catch(e){}if(me)(st.events||[]).filter(e=>(e.kind=="luck"||e.kind=="rent"||e.kind=="ticket"||e.kind=="crash")&&e.actor==me&&!seenLuck.has(e.id)).forEach(e=>{seenLuck.add(e.id);if(Date.parse(e.at)>Date.parse(st.now)-20e3)toast(e.msg)});offset=Date.parse(st.now)-Date.now();setRows(st.town.rows);R={};
 st.residents.forEach(r=>{R[r.id]=r;const w=walkers[r.id];
  if(!w)walkers[r.id]={x:r.x,y:r.y,path:[],tx:r.x,ty:r.y};else if(r.id!=me&&(Math.abs(w.tx-r.x)>.01||Math.abs(w.ty-r.y)>.01)){const p=route([Math.round(w.x),Math.round(w.y)],[Math.round(r.x),Math.round(r.y)],vehOf(r));w.path=p?p.slice(1):[[r.x,r.y]]}
  walkers[r.id].tx=r.x;walkers[r.id].ty=r.y});
 if(me&&R[me]){const lv=lvOf(alN(R[me]));if(lastLv!==null&&lv>lastLv)setTimeout(()=>lvUpModal(lv),600);lastLv=lv}
 setOff(st.town.off);const key=st.town.rows+"|"+(st.town.off||[]).join()+"|"+st.residents.map(r=>r.id+":"+r.slot+":"+r.name+":"+JSON.stringify([(r.items||{}).roof,(r.items||{}).wall,(r.items||{}).d,(r.items||{}).hl])).join(",");if(key!=mapKey){mapKey=key;maps={}}
 $("title").textContent="🐷 "+st.town.name;if(me&&!R[me]){toast("你已經搬離這個小鎮");dropMine(TID);setTimeout(()=>go(""),1200)}
 renderFeed();renderPanel();renderNeeds();if(me)renderStrip();pxify($("feed"));pxify($("tab-rank"));pxify($("tab-ppl"))}
let mapKey="";
// ── 帳號救援（supabase/town_recovery.sql）：Email 驗證碼由 Supabase Auth 寄出，驗證成功的 JWT 帶去呼叫救援函式
const AUTH=SB.replace("/rest/v1/rpc/","/auth/v1/"),recFail=()=>{try{return JSON.parse(localStorage.getItem("town-recf")||"{}")}catch(e){return{}}};
const recLockLeft=em=>{const f=recFail()[em];return f&&f.u>Date.now()?Math.ceil((f.u-Date.now())/6e4):0};
const recBad=em=>{const o=recFail(),f=o[em]&&o[em].u<Date.now()?{n:0}:(o[em]||{n:0});f.n=(f.n||0)+1;if(f.n>=5){f.u=Date.now()+18e5;f.n=0}o[em]=f;try{localStorage.setItem("town-recf",JSON.stringify(o))}catch(e){}};
const authPost=async(p,b)=>{let r;try{r=await fetch(AUTH+p,{method:"POST",headers:{apikey:SBK,"Content-Type":"application/json"},body:JSON.stringify(b)})}catch(e){throw new Error("連不上小鎮，檢查網路後再按一次")}const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(r.status==429?"這個 Email 寄太多次了，請 1 小時後再試":"驗證碼不對或已過期，請檢查後再試，或按「重寄驗證碼」");e.st=r.status;throw e}return j};
const recRpc=async(fn,body,tok)=>{let r;try{r=await fetch(SB+fn,{method:"POST",headers:{apikey:SBK,Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify(body)})}catch(e){throw new Error("連不上小鎮，檢查網路後再按一次")}const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&j.message)||"小鎮暫時沒回應，過一下再按一次");if(j&&j.error)throw new Error(j.error);return j};
// 兩步驟表單：輸入 Email → 輸入 6 位驗證碼 → done(token)；host 是放表單的元素
function recAsk(host,title,done){let em="";const s1=()=>{host.innerHTML=`<h2>${title}</h2><label class="lpcode">Email<input id="rem" type="email" inputmode="email" autocomplete="email" maxlength="80" placeholder="you@example.com" value="${esc(em)}"></label><p class="mut">我們會寄 6 位數驗證碼給你，10 分鐘內有效。</p><p class="err" id="rerr"></p><div class="row"><button class="pri" id="rsend">寄驗證碼</button></div>`;$("rem").focus();$("rsend").onclick=send};
 const send=async()=>{em=$("rem").value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){$("rerr").textContent="Email 格式不對，檢查有沒有少打 @ 或網域";return}
  const lk=recLockLeft(em);if(lk){$("rerr").textContent=`驗證碼錯太多次，請 ${lk} 分鐘後再試`;return}
  $("rsend").disabled=true;try{await authPost("otp",{email:em,create_user:true});s2()}catch(e){$("rerr").textContent=e.message;$("rsend").disabled=false}};
 const s2=()=>{host.innerHTML=`<h2>輸入驗證碼</h2><p class="mut">如果這個 Email 能收信，幾分鐘內會收到 6 位數驗證碼（沒收到請看垃圾信匣）。</p><label class="lpcode">驗證碼<input id="rtk" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位數字"></label><p class="err" id="rerr"></p><div class="row"><button id="rback">換 Email／重寄</button><button class="pri" id="rok">確認</button></div>`;$("rtk").focus();$("rback").onclick=s1;
  $("rok").onclick=async()=>{const tk=$("rtk").value.trim();if(!/^\d{6}$/.test(tk)){$("rerr").textContent="驗證碼是 6 位數字";return}const lk=recLockLeft(em);if(lk){$("rerr").textContent=`驗證碼錯太多次，請 ${lk} 分鐘後再試`;return}
   $("rok").disabled=true;try{const j=await authPost("verify",{type:"email",email:em,token:tk});if(!j.access_token)throw new Error("驗證碼不對或已過期，請檢查後再試");done(j.access_token,em)}catch(e){recBad(em);$("rerr").textContent=e.message;$("rok").disabled=false}}};
 s1()}
// 首頁「找回我的角色」：驗證 → 列出綁定的角色 → 選一個 → 這台裝置取得新金鑰
function recFind(){document.body.classList.remove("ingame");$("login").classList.remove("hide");$("game").classList.add("hide");const host=$("lg");host.innerHTML="";const box=document.createElement("div");host.appendChild(box);
 const back=()=>{const b=document.createElement("div");b.className="row";b.style.justifyContent="flex-start";b.innerHTML='<button id="rhome">← 小豬鎮首頁</button>';host.appendChild(b);$("rhome").onclick=()=>go("")};
 recAsk(box,"找回我的角色",async tok=>{box.innerHTML="<p class=\"mut\">查詢中…</p>";try{const r=await recRpc("town_recovery_list",{},tok),l=r.list||[];
  if(!l.length){box.innerHTML=`<h2>找不到綁定的角色</h2><p class="mut">這個 Email 還沒綁過角色。請用邀請碼加入小鎮，進遊戲後在選單「帳號救援」綁定。</p>`;back();return}
  box.innerHTML=`<h2>選要找回的角色</h2><div class="list">${l.map((x,i)=>`<button class="big" data-i="${i}"><span><b>${esc(x.town_name)}</b><small>${esc(x.me)}</small></span></button>`).join("")}</div><p class="err" id="rerr"></p>`;
  box.querySelectorAll("[data-i]").forEach(b=>b.onclick=async()=>{const x=l[+b.dataset.i];b.disabled=true;try{const k=newKey();const c=await recRpc("town_recovery_claim",{rid:x.rid,key:k},tok);saveMine({tid:c.town_id,name:x.town_name,rid:x.rid,pin:k,me:x.me});location.search="?t="+c.town_id}catch(e){$("rerr").textContent=e.message;b.disabled=false}})}catch(e){box.innerHTML=`<p class="err">${esc(e.message)}</p>`;back()}});back()}
// 選單「帳號救援」：綁定 Email
function recBindModal(){$("modal").classList.remove("hide");$("mbody").innerHTML='<h2>帳號救援</h2><p class="mut">查詢中…</p>';
 const shut=()=>$("modal").classList.add("hide");
 recRpc2("town_recovery_status",{rid:me,pin}).then(st=>{const hs=st.hints||[];$("mbody").innerHTML=`<div id="rbox"></div><div class="row"><button id="rx">關閉</button></div>`;$("rx").onclick=shut;
  const intro=hs.length?`<p class="mut">已綁定：${hs.map(esc).join("、")}。換手機時，在首頁按「找回我的角色」就能回來。</p>`:`<p class="mut">綁定 Email 後，換手機或被清掉資料也能找回這個角色。每個小鎮可綁一個角色。</p>`;
  const rb=$("rbox");rb.innerHTML=intro+'<div class="row" style="justify-content:flex-start"><button class="pri" id="rgo">'+(hs.length?"再綁另一個 Email":"綁定 Email")+'</button></div>'+(hs.length?'<div class="row" style="justify-content:flex-start"><button id="runb">解除綁定</button></div>':"");
  $("rgo").onclick=()=>recAsk(rb,"綁定 Email",async tok=>{rb.innerHTML='<p class="mut">綁定中…</p>';try{const r=await recRpc("town_recovery_bind",{rid:me,pin},tok);rb.innerHTML=`<h2>綁定成功</h2><p class="mut">${esc(r.hint)} 已綁定這個角色。換手機時在首頁按「找回我的角色」。</p>`}catch(e){rb.innerHTML=`<p class="err">${esc(e.message)}</p>`}});
  if($("runb"))$("runb").onclick=async()=>{if(!confirm("解除後，這個角色就不能用 Email 找回了。確定嗎？"))return;try{await rpc("town_recovery_unbind",{rid:me,pin});toast("已解除綁定");shut()}catch(e){toast(e.message)}}}).catch(e=>{$("mbody").innerHTML=`<h2>帳號救援</h2><p class="err">${esc(e.message)}</p><div class="row"><button id="rx">關閉</button></div>`;$("rx").onclick=shut})}
const recRpc2=(fn,b)=>rpc(fn,b);
// ── 帳號＋密碼登入（supabase/town_account.sql）：和裝置金鑰並存；SQL 沒套用時偵測到錯誤就隱藏入口
const acctGone=e=>/Could not find|schema cache|does not exist|PGRST/i.test((e&&e.message)||"")&&(window.ACCT_ON=false,1);
// 選單「帳號與密碼」與強制設密碼：還沒設密碼或是鎮長發的臨時密碼時不能關（acctForce，refresh 會重開）
let acctForce=false,lastPw="",acctChk=0;
async function acctModal(force){$("modal").classList.remove("hide");$("mbody").innerHTML='<h2>帳號與密碼</h2><p class="mut">查詢中…</p>';const shut=()=>{acctForce=false;$("modal").classList.add("hide")};
 let st;try{st=await rpc("town_acct",{rid:me,pin,op:"status"})}catch(e){if(acctGone(e)){acctForce=false;$("mbody").innerHTML='<h2>帳號與密碼</h2><p class="mut">這個功能還沒開放。</p><div class="row"><button id="ax">關閉</button></div>';$("ax").onclick=shut;const b=$("acctBtn");if(b)b.hidden=true;return}$("mbody").innerHTML=`<h2>帳號與密碼</h2><p class="err">${esc(e.message)}</p><div class="row"><button id="ax">關閉</button></div>`;$("ax").onclick=shut;return}
 acctForce=!!force&&(!st.has||st.temp);if(!acctForce&&force){shut();return}
 const draw=()=>{const need=!st.has||st.temp,f=acctForce;
  $("mbody").innerHTML=`<h2>${!st.has?"設定你的密碼":"密碼"}</h2>
  ${!st.has?`<p class="mut">換手機登入時要用。至少 6 個字，不能和角色名稱或邀請碼一樣。${window.RECOVERY_ON?"綁 Email 忘記密碼時才能用驗證碼重設。":""}</p>`:st.temp?'<p class="err">這是臨時密碼，請現在改成自己的密碼</p>':'<p class="mut">換手機登入時，輸入邀請碼、選角色、再輸入這個密碼。</p>'}
  ${st.has?`<label>舊密碼<input id="ap1" type="password" maxlength="40" autocomplete="current-password" value="${esc(st.temp?lastPw:"")}"></label>`:""}
  <label>${st.has?"新密碼":"密碼"}<input id="ap2" type="password" maxlength="40" autocomplete="new-password"></label>
  ${st.has?"":`<label>再輸入一次<input id="ap3" type="password" maxlength="40" autocomplete="new-password"></label>`}
  <p class="err" id="aerr"></p><div class="row">${f?"":'<button id="ax">關閉</button>'}<button class="pri" id="asp">${st.has?"改密碼":"設定密碼"}</button></div>
  ${window.RECOVERY_ON&&st.has&&!need?'<div class="row" style="justify-content:flex-start"><button id="aem">綁定 Email（忘記密碼時用）</button></div>':""}`;
  if($("ax"))$("ax").onclick=shut;if($("aem"))$("aem").onclick=()=>recBindModal();
  $("asp").onclick=async()=>{const n=$("ap2").value;if($("ap3")&&$("ap3").value!==n){$("aerr").textContent="兩次密碼不一樣，再輸入一次";return}$("asp").disabled=true;
   try{await rpc("town_acct",{rid:me,pin,op:st.has?"setpw":"init",note1:st.has?$("ap1").value:n,note2:n});lastPw="";acctForce=false;st.has=true;st.temp=false;toast("密碼設好了");
    if(window.RECOVERY_ON){draw()}else shut()}catch(e){$("aerr").textContent=e.message;$("asp").disabled=false}}};
 draw()}
function townLogin(){document.body.classList.remove("ingame");$("login").classList.remove("hide");$("game").classList.add("hide");const res=Object.values(R),full=res.length>=12;
 $("lg").innerHTML=`${LP.scene(1)}${LP.stepBar(2)}<h2>${esc(S.town.name)}</h2><p class="mut">住了 ${res.length} 人${savedInv()?" · 邀請碼已自動填好":""}</p>
  ${res.length?`<h2>選你的角色</h2><div class="who">${res.map(r=>`<button data-id="${r.id}"><canvas width="40" height="44" data-look='${esc(JSON.stringify(r.look||{}))}'></canvas><b>${esc(r.name)}</b><small>${r.mayor?"鎮長":houseName(r.slot)}</small></button>`).join("")}</div>`:""}
  ${full?`<p class="mut">小鎮已經住滿 12 人了。</p>`:`<h2>我要搬進來</h2><div class="row" style="justify-content:flex-start"><button class="pri" id="mv">用邀請碼搬進來</button></div>`}
  <div class="row" style="justify-content:flex-start"><button id="home2">← 小豬鎮首頁</button></div>`;
 $("lg").querySelectorAll("canvas").forEach(c=>{const l=JSON.parse(c.dataset.look);miniPerson(c,l.skin?l:{skin:SKIN[0],hair:"#999",shirt:"#bbb",style:"短髮"})});
 $("lg").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>pinStep(+b.dataset.id));
 if($("mv"))$("mv").onclick=()=>joinStep();$("home2").onclick=()=>go("")}
const savedInv=()=>{try{return sessionStorage.getItem("town-inv-"+TID)||""}catch(e){return ""}};
const cid=()=>{try{let c=localStorage.getItem("town-cid");if(!c){c=newKey();localStorage.setItem("town-cid",c)}return c}catch(e){return "none"}};
function pinStep(id){const r=R[id];$("lg").innerHTML=`${LP.scene(1)}${LP.stepBar(3)}<p><b>${esc(r.name)}</b>，歡迎回來</p>
  <label class="lpcode">密碼<input id="pw" type="password" maxlength="40" autocomplete="current-password"></label><p class="mut">還沒設過密碼的角色，初始密碼是邀請碼。</p><p class="err" id="lerr"></p>
  <div class="row"><button id="back">← 換人</button><button class="pri" id="go">進入小鎮</button></div>${window.RECOVERY_ON?'<div class="row" style="justify-content:flex-start"><button id="fgt">忘記密碼？</button></div>':""}`;
 $("back").onclick=townLogin;$("pw").focus();if($("fgt"))$("fgt").onclick=()=>forgotPw(id);
 $("pw").onkeydown=e=>{if(e.key=="Enter")$("go").click()};
 $("go").onclick=async()=>{const pv=$("pw").value;if(!pv){$("lerr").textContent="先輸入密碼（還沒設過就輸入邀請碼）";return}$("go").disabled=true;
  try{const k=newKey();const dv={tid:TID,invite:pv.toUpperCase(),rid:id,key:k};try{await rpc("town_device",{...dv,pw:pv,cid:cid()})}catch(e2){if(!acctGone(e2))throw e2;await rpc("town_device",dv)}const res=await rpc("town_login",{rid:id,pin:k});let st=null;try{st=await rpc("town_acct",{rid:id,pin:k,op:"status"})}catch(e3){if(!acctGone(e3))throw e3}
  const fin=async()=>{lastPw="";me=id;pin=k;lastSeen=res.last_seen;saveMine({tid:TID,name:S.town.name,rid:id,pin:k,me:r.name});await enter()};
  if(st&&(!st.has||st.temp))newPwStep(id,k,pv,r,st,fin);else{lastPw=pv;await fin()}}catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
// 登入第 4 步：還沒設密碼（初始密碼是邀請碼）或是臨時密碼，進遊戲前一定要先設新密碼，不能略過
function newPwStep(id,k,old,r,st,fin){$("lg").innerHTML=`${LP.scene(1)}${LP.stepBar(4)}<p><b>${esc(r.name)}</b>，設定你的新密碼</p><p class="mut">以後換手機登入用。至少 6 個字，不能和角色名稱或邀請碼一樣。${window.RECOVERY_ON?"進遊戲後可在選單「帳號與密碼」綁定 Email，忘記密碼時才能用驗證碼重設。":""}</p>
  <label class="lpcode">新密碼<input id="n1" type="password" maxlength="40" autocomplete="new-password"></label><label class="lpcode">再輸入一次<input id="n2" type="password" maxlength="40" autocomplete="new-password"></label><p class="err" id="lerr"></p>
  <div class="row"><button class="pri" id="ngo">設定並進入小鎮</button></div>`;$("n1").focus();
 $("ngo").onclick=async()=>{const a=$("n1").value;if(a!==$("n2").value){$("lerr").textContent="兩次密碼不一樣，再輸入一次";return}$("ngo").disabled=true;
  try{await rpc("town_acct",{rid:id,pin:k,op:st.has?"setpw":"init",note1:st.has?old:a,note2:a});await fin()}catch(e){$("lerr").textContent=e.message+"（改好後再按一次）";$("ngo").disabled=false}}}
// 忘記密碼（RECOVERY_ON）：Email 驗證碼 → 該 Email 綁的本鎮角色 → 設新密碼 → 登入
function forgotPw(id0){const host=$("lg");host.innerHTML="";const box=document.createElement("div");host.appendChild(box);
 const back=()=>{const b=document.createElement("div");b.className="row";b.style.justifyContent="flex-start";b.innerHTML='<button id="fback">← 回輸入密碼</button>';host.appendChild(b);$("fback").onclick=()=>pinStep(id0)};
 recAsk(box,"忘記密碼",async tok=>{box.innerHTML='<p class="mut">查詢中…</p>';try{const l=((await recRpc("town_recovery_list",{},tok)).list||[]).filter(x=>x.town_id==TID);
  if(!l.length){box.innerHTML='<h2>找不到綁定的角色</h2><p class="mut">這個 Email 沒有綁這個小鎮的角色。請鎮長在鎮長面板幫你「重設密碼」。</p>';back();return}
  box.innerHTML=`<h2>選要重設密碼的角色</h2><div class="list">${l.map((x,i)=>`<button class="big" data-i="${i}"><span><b>${esc(x.me)}</b></span></button>`).join("")}</div><p class="err" id="rerr"></p>`;
  box.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const x=l[+b.dataset.i];box.innerHTML=`<h2>${esc(x.me)}：設新密碼</h2><label class="lpcode">新密碼（至少 6 字）<input id="np" type="password" maxlength="40" autocomplete="new-password"></label><p class="err" id="rerr"></p><div class="row"><button class="pri" id="nok">設好並進入</button></div>`;
   $("nok").onclick=async()=>{$("nok").disabled=true;try{const k=newKey();await recRpc("town_recovery_reset",{rid:x.rid,key:k,newpw:$("np").value},tok);saveMine({tid:TID,name:S.town.name,rid:x.rid,pin:k,me:x.me});location.search="?t="+TID}catch(e){$("rerr").textContent=e.message;$("nok").disabled=false}}})}catch(e){box.innerHTML=`<p class="err">${esc(e.message)}</p>`;back()}});back()}
function joinStep(){const free=[];for(let s=0;s<12;s++)if(!bySlot(s))free.push(s);const show=free.filter(s=>Math.floor(s/3)<NR);if(!show.length&&free.length)show.push(free[0]);let slot=show[0],look=randLook();
 $("lg").innerHTML=`${LP.scene(1)}${LP.stepBar(2)}<p><b>搬進${esc(S.town.name)}</b></p><label class="lpcode">邀請碼（問鎮長）<input id="inv" maxlength="8" autocomplete="off" style="text-transform:uppercase" value="${esc(savedInv())}"></label>
  <label>你的名字<input id="mn" maxlength="12"></label>
  <p class="mut" style="margin:10px 0 4px">選一間空屋</p><div class="houses">${show.map(s=>`<button class="sw${s==slot?" on":""}" data-s="${s}">${houseName(s)}${Math.floor(s/3)>=NR?"（新街）":""}</button>`).join("")}</div>
  <div id="lk"></div><p class="err" id="lerr"></p><div class="row"><button id="back">← 返回</button><button class="pri" id="go">搬進去</button></div>`;
 $("lg").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{slot=+b.dataset.s;$("lg").querySelectorAll("[data-s]").forEach(x=>x.classList.toggle("on",x==b))});
 lookPicker($("lk"),look,l=>look=l);$("back").onclick=townLogin;
 $("go").onclick=async()=>{const inv=$("inv").value.trim().toUpperCase(),mn=$("mn").value.trim(),p=newKey();
  if(!inv){$("lerr").textContent="先填鎮長給你的邀請碼";return}if(!mn){$("lerr").textContent="再填你的名字，鎮上大家會這樣叫你";return}
  $("go").disabled=true;try{const r=await rpc("town_join",{tid:TID,invite:inv,my_name:mn,pin:p,look,want_slot:slot});me=r.resident_id;pin=p;lastSeen=null;saveMine({tid:TID,name:S.town.name,rid:me,pin:p,me:mn});await enter()}
  catch(e){$("lerr").textContent=e.message;$("go").disabled=false}}}
// ── 造型目錄（和資料庫 town_shop 一致）：[代號, 名稱, 價格, 解鎖條件]；沒價格的是基本款 ──
const WEAR={
 style:[["短髮"],["長髮"],["光頭"],["馬尾"],["捲髮"],["包頭"],["瀏海"],["twintail","雙馬尾",1200],["mohawk","刺蝟頭",1200]],
 eyes:[["圓眼"],["瞇眼"],["眼鏡"],["墨鏡"]],
 top:[["T恤"],["帽T"],["襯衫"],["suit","西裝",4500],["jersey","球衣",1800],["dress","洋裝",2400],["couple","情侶 T",0,"有好麻吉就解鎖"]],
 bottom:[["長褲"],["短褲"],["裙子"]],
 acc:[["無"],["棒球帽"],["毛帽"],["crown","皇冠",12000],["pigears","小豬耳朵",800],["headphones","耳機",3000],["scarf","圍巾",900],["bandage","繃帶頭",0,"被扁 10 次解鎖"]]};
const DECO=[["flowers","花圃",600],["mailbox","信箱",500],["lamp","路燈",1500],["bench","長椅",2000],["tree","小樹",1200],["pigstatue","小豬雕像",8000]];
const PANTS=["#2b2b3a","#3b5a8a","#6b4a2b","#7a7a7a","#c0392b","#e8e0cc"];
const ROOF_C=["#d9534f","#3b7dd8","#b45cc4","#8b5a2b","#2e9e5b","#d8901a","#e0779b","#2a9d8f","#34495e","#9a9a9a"],WALL_C=["#f4ead6","#fff3e0","#e8f1ff","#fde2ea","#e6f4e6","#f0e6ff","#e0e0e0","#ffe8b0"];
const wInfo=(k,v)=>WEAR[k].find(a=>a[0]==v)||[v];
const isPremium=(k,v)=>{const x=wInfo(k,v);return !!(x[2]||x[3])};
// 舊存檔的「帽子」髮型改成配件
const normLook=L=>{const o={skin:"#f1c9a5",hair:"#5a3a1a",style:"短髮",eyes:"圓眼",shirt:"#3b7dd8",top:"T恤",pants:"#2b2b3a",bottom:"長褲",acc:"無",...(L||{})};if(o.style=="帽子"){o.style="短髮";if(o.acc=="無")o.acc="棒球帽"}return o};
function lookPicker(el,look,cb,items){look=normLook(look);const owned=new Set(((items||{}).w)||[]);
 const tag=(k,v)=>{const x=wInfo(k,v);if(!isPremium(k,v))return "";if(owned.has(v))return " ✔";return x[3]?` 🔒`:` €${x[2]}`};
 const opts=(k,label)=>`<div class="lrow"><span>${label}</span>${WEAR[k].filter(a=>items||!isPremium(k,a[0])).map(a=>`<button class="sw${look[k]==a[0]?" on":""}${isPremium(k,a[0])&&!owned.has(a[0])?" lock":""}" data-k="${k}" data-v="${a[0]}" title="${a[3]||""}">${a[1]||a[0]}${tag(k,a[0])}</button>`).join("")}</div>`;
 const dots=(k,arr,label)=>`<div class="lrow"><span>${label}</span>${arr.map(v=>`<button class="sw dot${look[k]==v?" on":""}" data-k="${k}" data-v="${v}" style="background:${v}" aria-label="${label}"></button>`).join("")}</div>`;
 const tog=(k,label)=>`<button class="sw${look[k]?" on":""}" data-t="${k}">${label}</button>`;
 const draw=()=>{el.innerHTML=`<div class="lookbox"><canvas width="96" height="120"></canvas><div class="lookopts">
   ${dots("skin",SKIN,"膚色")}${opts("style","髮型")}${dots("hair",HAIR,"髮色")}${opts("eyes","眼睛")}<div class="lrow"><span>細節</span>${tog("blush","腮紅")}${tog("beard","鬍子")}</div>
   ${opts("top","上衣")}${dots("shirt",SHIRT,"顏色")}${opts("bottom","下身")}${dots("pants",PANTS,"顏色")}${opts("acc","配件")}
   ${items?`<p class="mut" style="margin:6px 0 0">€ 的款式在超市「🛍️ 造型與擺飾」買；🔒 要達成條件（滑過去看）。可以先試穿看看。</p>`:""}</div></div>`;
  miniPerson(el.querySelector("canvas"),look);
  el.querySelectorAll(".sw[data-k]").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.k]:b.dataset.v};cb(look);draw()});
  el.querySelectorAll(".sw[data-t]").forEach(b=>b.onclick=()=>{look={...look,[b.dataset.t]:!look[b.dataset.t]};cb(look);draw()})};cb(look);draw()}
// 以下依賴 init() 裡的 me／$／esc／pxify，必須放在 init() 裡面（放頂層會丟 "me is not defined"）
const offTxt=t=>{const m=Math.floor((nowFn()-Date.parse(t.seen_at))/6e4);return t.id!=me&&m>=10?`（離線 ${m} 分鐘，人醒著在家休息，叫不到睡覺）`:""};// 離線很久但沒睡著的人：屋頂不飄 Z，面板寫清楚
const UPS_KEY=()=>"town_ups_"+me;
function upsSeen(){try{return JSON.parse(localStorage.getItem(UPS_KEY())||"null")}catch(e){return null}}
function upsMark(){try{localStorage.setItem(UPS_KEY(),JSON.stringify(UPDATES.map(u=>u.id)))}catch(e){}}
function updHtml(list){return list.map(u=>`<h3>${esc(u.title)} <small class="mut">${esc(u.date)}</small></h3><ul style="margin:4px 0 8px 16px;padding:0">${u.items.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`).join("")}
function updModal(all){const seen=all?null:upsSeen();let list=all?UPDATES:seen?UPDATES.filter(u=>!seen.includes(u.id)):UPDATES.slice(0,1);
 if(!list.length)return false;if(list.length>3&&!all)list=list.slice(0,3);
 $("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>${all?"更新紀錄":"小鎮更新了"}</h2><div class="list" style="max-height:60vh;overflow:auto">${updHtml(list)}</div><div class="row"><button id="updok" class="pri">好</button></div>`;
 $("updok").onclick=()=>{$("modal").classList.add("hide");upsMark()};if(!all)upsMark();pxify($("mbody"));return true}
function updCheck(){if(!me||!$("modal").classList.contains("hide"))return;updModal(false)}
async function enter(){document.body.classList.add("ingame");$("menuBtn").classList.remove("hide");if(Date.now()-refAt>3000)await refresh();else if(me)apply(S);setTimeout(()=>{const r=R[me];if(r&&$("modal").classList.contains("hide")){if(!r.items||r.items.tr===undefined)traitModal();else if(!r.items.wish)wishModal();else if(!(r.items.at&&r.items.at.init))statsModal(true)}},1500);{const r0=R[me],fresh=!upsSeen()&&r0&&r0.items&&r0.items.tr===undefined;if(fresh)upsMark();else setTimeout(()=>{try{updCheck()}catch(e){}},2600)}tipsWhenFree();refreshBell().catch(()=>{});autoPush().catch(()=>{});$("login").classList.add("hide");$("game").classList.remove("hide");camFree=false;
 const w=walkers[me];cam.x=w.x*T;cam.y=w.y*T;resize();$("mayor").classList.toggle("hide",!R[me].mayor);
 const ent=mine().find(x=>x.tid==TID);if(ent&&ent.invite){shareModal(ent.invite,true);delete ent.invite;saveMine(ent);return}
 const mineEv=(S.events||[]).filter(e=>e.target==me&&(!lastSeen||e.at>lastSeen));
 if(mineEv.length){const who=[...new Set(thankable().map(e=>e.actor))];$("away").classList.remove("hide");
  $("away").innerHTML=`<b>你不在的時候</b>${mineEv.slice(0,6).map(e=>`<p>${esc(e.msg)}</p>`).join("")}<div class="row" style="justify-content:flex-start">${who.map(id=>`<button class="pri" data-t="${id}">💗 謝謝 ${esc(R[id].name)}</button>`).join("")}<button id="awayok">知道了</button></div>`;
  $("away").querySelectorAll("[data-t]").forEach(b=>b.onclick=async()=>{b.disabled=true;await act("thank",{target:+b.dataset.t});b.textContent="已道謝"});$("awayok").onclick=()=>$("away").classList.add("hide")}
 else $("away").classList.add("hide")}

// ── 邀請朋友 ──
const townURL=inv=>location.origin+location.pathname+"?t="+TID+(inv?"&i="+inv:"");
function shareModal(inv,fresh){const text=`來「${S.town.name}」當鄰居！🐷\n點連結就能搬進來：${townURL(inv)}\n（邀請碼：${inv}）`;$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>${fresh?"小鎮建好了！":"邀請朋友"}</h2><p>把這段訊息傳到 WeChat 群組。朋友點連結，邀請碼會自動填好，取個名字就能搬進來：</p><textarea id="shtxt" rows="4" readonly>${esc(text)}</textarea>
  <p class="mut">邀請碼只給想邀請的人。鎮長可以隨時在「🏛️ 鎮長」換一組新的。</p><div class="row"><button id="mc">關閉</button><button class="pri" id="mcp">複製訊息</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mcp").onclick=async()=>{try{await navigator.clipboard.writeText(text);toast("已複製，貼到 WeChat 吧")}catch(e){$("shtxt").select();toast("請長按文字複製")}}}
const featChecks=off=>`<div class="list feats">${FEATS.map(([k,n,d])=>`<label class="mrow" style="cursor:pointer"><span><b>${n}</b> <small class="mut">${d}</small></span><input type="checkbox" data-f="${k}" ${off.includes(k)?"":"checked"} style="width:22px;height:22px"></label>`).join("")}</div>`;
const readFeats=()=>[...document.querySelectorAll("[data-f]")].filter(c=>!c.checked).map(c=>c.dataset.f);
async function mayorPanel(){let inv="",cta=[],fund=null;try{fund=await rpc("town_mayor",{rid:me,pin,act:"fund"})}catch(e){}try{cta=(await rpc("town_mayor",{rid:me,pin,act:"stats"})).stats||[]}catch(e){}
 const ctaHTML=()=>{const sh=cta.reduce((a,c)=>a+c.shows,0),cl=cta.reduce((a,c)=>a+c.clicks,0);return cta.length?`<p class="mut">近 7 天共顯示 ${sh} 次、點了 ${cl} 次（${sh?Math.round(cl/sh*100):0}%）</p><div class="list">${cta.map(c=>`<div class="mrow"><span><b>${esc(c.key)}</b></span><small class="mut">顯示 ${c.shows} · 點 ${c.clicks} · ${c.shows?Math.round(c.clicks/c.shows*100):0}%</small></div>`).join("")}</div>`:`<p class="mut">還沒有資料，大家玩一陣子就會出現。</p>`};try{inv=(await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite}catch(e){toast(e.message);return}
 const draw=()=>{$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>🏛️ 鎮長</h2><p>邀請碼：<b class="code">${esc(inv)}</b></p>
  <div class="row" style="justify-content:flex-start"><button class="pri" id="msh">邀請朋友</button><button id="mni">換一組新邀請碼</button></div>
  ${fund?`<h2 style="margin-top:16px">鎮基金</h2><div class="mrow"><span><b>€${fund.fund}</b> <small class="mut">房租 5%、財產稅、奢侈品 5% 累積而來（還不能花）</small></span></div><p class="mut">累計流入：房租 €${(fund.log||{}).rent||0} · 財產稅 €${(fund.log||{}).tax||0} · 奢侈品 €${(fund.log||{}).lux||0}</p>`:""}
  <h2 style="margin-top:16px">管理權</h2><p class="mut">關人、放人、罰款、發補助、公告、建設案、彈劾——全部公開，居民可以申訴</p><div class="row" style="justify-content:flex-start"><button class="pri" id="mpw">鎮長管理權與使用紀錄</button></div>
  <h2 style="margin-top:16px">小鎮特色</h2>${featChecks([...OFF])}<div class="row" style="justify-content:flex-start"><button class="pri" id="mfs">儲存設施</button></div>
  <h2 style="margin-top:16px">建議下一步統計</h2>${ctaHTML()}
  <h2 style="margin-top:16px">鎮民（${Object.keys(R).length}/12）</h2><div class="list">${Object.values(R).sort((a,b)=>a.slot-b.slot).map(r=>`<div class="mrow"><span><b>${esc(r.name)}</b> <small class="mut">${houseName(r.slot)}${r.mayor?" · 鎮長":""}</small></span>${r.id==me?"":`<button data-pw="${r.id}">重設密碼</button><button data-k="${r.id}">請他搬走</button>`}</div>`).join("")}</div>
  <div class="row"><button id="mc">關閉</button></div>`;
  $("mc").onclick=()=>$("modal").classList.add("hide");$("msh").onclick=()=>shareModal(inv);$("mpw").onclick=()=>powersModal();
  $("mfs").onclick=async()=>{try{await rpc("town_features",{rid:me,pin,off:readFeats()});await refresh();toast("設施更新好了");draw()}catch(e){toast(e.message)}};
  $("mni").onclick=async()=>{if(!confirm("換新邀請碼後，舊的就不能用了。確定嗎？"))return;try{inv=(await rpc("town_mayor",{rid:me,pin,act:"newinvite"})).invite;toast("換好了");draw()}catch(e){toast(e.message)}};
  $("mbody").querySelectorAll("[data-pw]").forEach(b=>b.onclick=async()=>{const r=R[b.dataset.pw];if(!confirm(`替 ${r.name} 產生新的臨時密碼？舊密碼會失效，新密碼只顯示一次。`))return;try{const j=await rpc("town_acct",{rid:me,pin,op:"reset",note1:String(r.id)});alert(`${r.name} 的臨時密碼：${j.pw}\n\n只顯示這一次，請私下告訴他。他登入後要改成自己的密碼。`)}catch(e){toast(acctGone(e)?"這個功能還沒開放":e.message)}});
  $("mbody").querySelectorAll("[data-k]").forEach(b=>b.onclick=async()=>{const r=R[b.dataset.k];if(!confirm(`確定請 ${r.name} 搬離小鎮？他的資料會被刪除，不能復原。`))return;
   try{await rpc("town_mayor",{rid:me,pin,act:"kick",target:r.id});await refresh();toast(`${r.name} 搬走了`);draw()}catch(e){toast(e.message)}})};draw()}

// ── 動作 ──
const floaters=[],fxs=[],FXIMG={};
const POPFN=/^town_(act|fac|jail|train|mischief|roll|stock_trade|hospital|police|civic_use|quest|npc|traveler)$/;let popSnap=null;
rpcHook=(fn,b)=>{if(!me||!R[me]||!POPFN.test(fn)||(b&&(b.act=="move"||b.op=="view"||b.op=="poll"||b.kind=="view")))return;if(!popSnap||Date.now()-popSnap.t>8000)popSnap={b:tickLocal(R[me],now()),t:Date.now()}};
function popCheck(){if(!popSnap||!me||!R[me])return;if(Date.now()-popSnap.t>8000){popSnap=null;return}const b1=tickLocal(R[me],now()),b0=popSnap.b,ic={hunger:"🍚",energy:"⚡",bladder:"🚽",hygiene:"🛁",fun:"🎉",money:"💰"},ch=[];
 for(const f of ["money",...NEEDS]){const d=Math.round(b1[f]-b0[f]);if(Math.abs(d)>=1)ch.push([f,d])}
 if(!ch.length)return;popSnap=null;let box=$("pop");if(!box){box=document.createElement("div");box.id="pop";document.body.appendChild(box)}
 box.style.bottom=(($("panel").offsetHeight||0)+80)+"px";
 ch.forEach(([f,d],i)=>{const e=document.createElement("span");e.className="pp "+(d>0?"g":"b");e.style.animationDelay=(i*120)+"ms";e.textContent=f=="money"?`${d>0?"+":"−"}${CUR}${Math.abs(d)}`:`${ic[f]} ${d>0?"+":""}${d}`;box.appendChild(e);pxify(e);setTimeout(()=>e.remove(),2200+i*120)})}
// 動作對應的動畫：自己的動作在 act() 播；別人（或自己）的社交事件在收到新動態時播
const ACT_FX={stock:"coins",vbuy:"coins",coffee:"can",movie:"sparkle",workout:"fist",spar:"fight",sneak:"scooter",nap:"zzz",eat:"eat",dine:"eat",snack:"eat",toilet:"toilet",shower:"bubbles",tv:"tv",sleep:"zzz",work:"coins",job:"coins",play:"hearts",browse:"sparkle",buy:"bag",paint:"paint",wake:"sun"};
const FAC_FX={art:"steam",share:"hearts",combo:"eat",bring:"bag",seat:"hearts",chat:"notes",sale:"bag",sample:"eat",mredeem:"sparkle",special:"eat",takeout:"bag",latte:"steam",redeem:"sparkle",treat:"hearts",song:"notes",film:"tv",popcorn:"eat",spar:"fight",checkin:"check",frisbee:"disc",fish:"fishing",picnic:"eat",photo:"flash",photo2:"flash",feast:"eat",spa:"bubbles",trip:"sparkle",sit:"zzz",up:"sparkle"}; // 設施互動的地圖動畫（沒有列的用金錢／閃光）
const OBJ_FX={dummy:"fight",bench:"zzz",cooler:"bubbles",pwc:"toilet",mailbox:"sparkle",news:"sparkle",claw:"hearts",lottery:"coins",busker:"hearts",pond:"hearts",vend:"can",trash:"sparkle",stall:"eat",well:"coin",swing:"hearts",cat:"hearts"};
const EV_FX={mischief:["fart","t"],photo:["flash","t"],forgive:["hearts","both"],pk:["fight","mid"],level:["sparkle","a"],feed:["eat","t"],wash:["bubbles","t"],visit:["hearts","both"],gift:["gift","fly"],note:["msg","fly"],call:["phone","both"],delivery:["scooter","fly"],thank:["hearts","fly"],greet:["clap","mid"],fight:["fight","mid"],egg:["egg","fly"],prank:["fart","t"],makeup:["hearts","mid"],cowork:["coins","both"],promo:["sparkle","a"],wish:["sparkle","a"],feast:["eat","both"],wakeup:["alarm","t"],wakefail:["alarm","t"],luck:["sparkle","a"],tier:["hearts","both"],look:["sparkle","a"],meet:["clap","a"],together:["hearts","a"],crash:["crash","a"],joint:["hearts","both"],slash:["fight","mid"],jail:["crash","a"],bail:["coins","a"],visitjail:["hearts","both"],jaillabor:["coins","a"],escape:["crash","a"],parole:["sparkle","a"]};
const spawnFx=(type,a,b)=>{if(!walkers[a])return;window.SFX&&!type.startsWith("wk_")&&SFX.fx(type,a==me);fxs.push({type,a,b:b&&walkers[b]?b:null,born:performance.now(),dur:type.startsWith("wk_")?1800:type=="crash"?2000:type=="fight"?1800:type=="scooter"?2200:1500})};
let lastEvId=null;
function fxFromEvents(evs){const mx=Math.max(0,...evs.map(e=>e.id));if(lastEvId==null){lastEvId=mx;return}
 evs.filter(e=>e.id>lastEvId).forEach(e=>{const f=EV_FX[e.kind];if(!f)return;const [t,mode]=f;
  if(mode=="t")spawnFx(t,e.target||e.actor);else if(mode=="a")spawnFx(t,e.actor);else if(mode=="both"){spawnFx(t,e.actor);if(e.target&&e.target!=e.actor)spawnFx(t,e.target)}else spawnFx(t,e.actor,e.target)});lastEvId=mx}
// 動態、排行、人際、鎮民列：內容一樣就不重畫（每幾秒更新一次，重畫會讓圖示閃一下）
function stableHTML(el){if(!el)return;const d=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");let last;Object.defineProperty(el,"innerHTML",{get(){return d.get.call(el)},set(v){if(v===last)return;last=v;d.set.call(el,v)}})}
["feed","tab-rank","tab-ppl","strip"].forEach(id=>stableHTML($(id)));
// 建議下一步統計：顯示（同一個建議 5 分鐘內只算一次）和點擊
const ctaKey=l=>l.replace(/\p{Extended_Pictographic}\uFE0F?/gu,"").replace(/\s+/g," ").trim().slice(0,24),ctaSeen={};
function track(kind,label){try{const key=ctaKey(label);if(!key||!me)return;if(kind=="show"){const t=Date.now();if(ctaSeen[key]&&t-ctaSeen[key]<3e5)return;ctaSeen[key]=t}rpc("town_track",{rid:me,pin,kind,key}).catch(()=>{})}catch(e){}}
// 只換內容變了的那一格；沒變的格子（和裡面的圖示）完全不動，才不會閃
function patchList(box,html){const t=document.createElement("div");t.innerHTML=html;const n=[...t.children];
 n.forEach((c,i)=>{const o=box.children[i];c._src=c.outerHTML;if(!o){box.appendChild(c);pxify(c)}else if(o._src!==c._src){o.replaceWith(c);pxify(c)}});
 while(box.children.length>n.length)box.lastElementChild.remove()}
// 按下去的回饋：按鈕亮框 → 成功閃綠／失敗搖晃，右上角顯示這次的結果
let pressed=null,fbTimer=0;
function press(b,fn){pressed=b.dataset.i;b.classList.add("working");const rs=fn();setTimeout(()=>{if(!busy)clearWorking()},350);return rs}
const clearWorking=()=>$("acts").querySelectorAll(".working").forEach(x=>x.classList.remove("working"));
function feedback(ok,msg){clearWorking();const b=pressed!=null&&$("acts").querySelector(`[data-i="${pressed}"]`);pressed=null;
 if(b){b.classList.remove("ok","err");void b.offsetWidth;b.classList.add(ok?"ok":"err");setTimeout(()=>b.classList.remove("ok","err"),700)}
 const f=$("fb");if(f&&msg){f.textContent=(ok?"✓ ":"✗ ")+msg;f.className=ok?"good":"bad";pxify(f);clearTimeout(fbTimer);fbTimer=setTimeout(()=>{f.className="hide"},3200)}}
async function act(a,extra={}){if(busy)return;if(FACTS.has(a))await ensureIn();busy=true;spotsBefore={...lastSpots};$("acts").classList.add("busy");const b0=tickLocal(R[me],now());try{const st=await rpc("town_act",{rid:me,pin,act:a,...extra});await wkPlay(a,extra);apply(st);
  if(ACT_FX[a])spawnFx(ACT_FX[a],me);playRoomFx(a,extra.target);if(a=="buy"){spawnFx("bag",me);toast("已放進背包")}if(a=="obj"&&OBJ_FX[extra.item])spawnFx(OBJ_FX[extra.item],me);
  const b1=tickLocal(R[me],now()),ic={hunger:"🍚",energy:"⚡",bladder:"🚽",hygiene:"🛁",fun:"🎉",money:"€"};let k=0;
    window.SFX&&SFX.act(a,extra,b1.money-b0.money);if(a!="move")feedback(true,sumChanges(b0,b1,ic))}
 catch(e){toast(e.message);feedback(false,e.message)}busy=false;$("acts").classList.remove("busy");renderPanel()}
function sumChanges(b0,b1,ic){const o=[];for(const f of ["money",...NEEDS]){const d=Math.round(b1[f]-b0[f]);if(Math.abs(d)>=1)o.push(f=="money"?`${d>0?"+":"−"}€${Math.abs(d)}`:`${ic[f]}${d>0?"+":""}${d}`)}return o.join(" ")||"完成"}
let pendingThen=null;
function walkTo(dest,d){if(jailed(R[me])){pendingThen=null;toast(`你被關在監獄裡，還有 ${fmtLeft(jlLeft(R[me]))}`);return}leaveRoomLocal();const w=walkers[me],p=route([Math.round(w.x),Math.round(w.y)],d,vehOf(R[me])),th=pendingThen;pendingThen=null;if(!p){toast("走不到那裡，路被擋住了");return}if(R[me].place=="casino"&&dest!="casino"&&CAS&&CAS.chips>0){const c=CAS.chips,f=Math.ceil(c*.015);toast(`離開賭場：籌碼 €${c} 換回現金 €${c-f}（手續費 €${f}）`);CAS.chips=0}
 w.path=p.slice(1);w.dest=dest;w.then=th;w.goal=d;camFree=false;if(!w.path.length)arrived(w);renderPanel()}
function arrived(w){const d=w.dest,th=w.then;w.dest=null;w.then=null;act("move",{px:w.goal[0],py:w.goal[1],dest:d}).then(async()=>{if(ROOMS[d]&&R[me]&&!jailed(R[me]))await enterRoom(d,true);if(th)th()})}
// ── 點擊即互動 ──
const WORKPL=["office","rafi"];
let tapHi=null;
function tapTab(t,re){tapHi=re||null;ptab=t;lastPanel="";renderPanel()}
function tapObj(k){const r=R[me],d=TAP_DEF[k],o=OBJS[k];if(!r||!d)return;if(r.sleeping||jailed(r)){toast("現在不能這樣做");return}
 if(d.feed&&!(r.items||{}).snack){toast("沒有零食可以餵");tapTab("here");return}
 const go=()=>act("obj",{item:k,note:d.feed?"feed":null});
 if(d.ok){go();return}
 tapConfirm(`${o.name} $${d.cost}`,go)}
function tapConfirm(txt,fn){let c=$("tapc");if(c)c.remove();c=document.createElement("div");c.id="tapc";c.style.cssText="position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:60;background:#fff7d6;border:3px solid #2b2b2b;padding:12px;display:flex;gap:8px;align-items:center;font:16.5px 'Cubic 11',monospace;color:#2b2b2b";c.innerHTML=`<span>${esc(txt)}</span>`;
 for(const [l,f] of [["做",()=>{c.remove();fn()}],["取消",()=>c.remove()]]){const b=document.createElement("button");b.textContent=l;b.style.cssText="min-height:44px;padding:0 16px;font:inherit;border:3px solid #2b2b2b;background:#f6a5c0;color:#2b2b2b";b.onclick=f;c.appendChild(b)}document.body.appendChild(c);setTimeout(()=>c.isConnected&&c.remove(),8000)}
function tapPlace(p){const w=walkers[me];if(p.slot!=null){const o=bySlot(p.slot);if(o&&o.id==me){if(inside(R[me])&&!(w.path.length)){act("exit");return}pendingThen=async()=>{await act("enter")};goHouse(p.slot);return}pendingThen=()=>tapTab("here");goHouse(p.slot);return}
 if(p.obj){const k=p.obj;pendingThen=()=>tapObj(k);walkTo(p.dest,p.door);return}
 pendingThen=()=>WORKPL.includes(p.dest)?tapTab("work",/^打工|^應徵/):tapTab("here");walkTo(p.dest,p.door)}
function tapNpc(tx,ty){const near=(q)=>q&&Math.abs(q[0]-tx)<=1&&Math.abs(q[1]-ty)<=1;
 if(TRV&&TRV.here&&near(TRV.place=="plaza"?[14,13]:[29,20])){pendingThen=()=>trvTalk();walkTo(TRV.place,[tx,ty]);return true}
 if(NPCV&&NPCV.here&&Date.parse(NPCV.until)>Date.now()&&near(NPCV.place=="plaza"?[20,12]:[33,19])){pendingThen=()=>npcShop();walkTo(NPCV.place,[tx,ty]);return true}return false}
const goHouse=s=>{const o=bySlot(s);if(!o){toast(`${houseName(s)}是空屋，邀請朋友搬進來吧`);return}if(o.id==me&&inside(R[me])&&!(walkers[me]&&walkers[me].path.length)){interiorModal(me);return}walkTo("home:"+o.id,o.id==me?door(s):visitSpot(s))};

// ── 下方面板：依所在地點顯示可以做的事 ──
// ── 按鈕效果與門檻：全部出自 RULES（頂層）；b.key 或標籤比對 RULES，沒有規則的不顯示晶片（nofx 或待確認）──
const FXI={hunger:"🍚",energy:"⚡",bladder:"🚽",hygiene:"🛁",fun:"🎉",money:"💰",bond:"💗",fit:"💪"},FXN={hunger:"飽足",energy:"精力",bladder:"膀胱",hygiene:"清潔",fun:"心情",money:"錢",bond:"好感",fit:"體能"};
const NOFXRE=/^(起床|進屋|進去|出門|佈置|看室內|傳訊息|造型|街機|看盤|市政廳|走到|去|回家|睡覺|保險|維修|賣車|小豬街機|小豬賭場|玩(輪盤|老虎機|百家樂|21點|骰寶)|取消|應徵|邀請朋友|你沒有駕照|附近有|今日治安|.*駕照|.*下車)/;
const wageOf=r=>{const n=+((r.items||{}).works)||0;let w=JOBS[0][2];for(const j of JOBS)if(n>=j[1])w=j[2];return w};
function ruleOf(b,r){if(b.key)return RULES.find(x=>x.m===b.key)||null;const l=String(b.label).replace(/\p{Extended_Pictographic}️?\s*/gu,"").trim();return RULES.find(x=>x.m instanceof RegExp&&x.m.test(l)&&(!x.at||x.at.includes(r.place)))||null}
function fxOf(b,r){const ru=b.nofx?null:ruleOf(b,r);if(!ru)return{fx:[],need:[],chips:[],rule:null};const fx=typeof ru.fx=="function"?ru.fx(r,{hasF,wage:wageOf}):ru.fx.slice(),need=[];
 const mo=fx.find(x=>x[0]=="money"&&typeof x[1]=="number");if(mo&&mo[1]<0)need.push(["需$"+(-mo[1]),r.money>=-mo[1]]);
 (ru.need||[]).forEach(n=>{if(n[0]=="energy")need.push(["精力≥"+n[1],r.energy>=n[1]]);else need.push([n[1],1])});
 return{fx,need,chips:fx.slice(0,3),rule:ru}}
const fxChip=x=>{const s=typeof x[1]=="string",v=x[0]=="money"&&!s?(x[1]<0?"−":"+")+"$"+Math.abs(x[1]):s?x[1]:(x[1]<0?"−":"+")+Math.abs(x[1]);return `<i class="fc ${x[0]=="money"?"gd":!s&&x[1]<0?"dn":"up"}">${FXI[x[0]]||"•"}${v}</i>`};
const btn=(label,sub,fn,g)=>({label,sub,fn,g});
// 不能按的按鈕照樣顯示，灰掉並寫原因（冷卻、沒人在場、集點不夠…）；點了會提示原因
const cdLeft=(r,key,mins)=>!/^(esc|yard|jv|slash|lic)/.test(String(key))?0:Math.max(0,Date.parse(((r.items||{}).cd||{})[key]||"1970")+mins*6e4-now());
const dbtn=(label,sub,fn,left,g)=>({...btn(label,sub,fn,g),dis:left?`剛做過，${fmtLeft(left)}後再來`:""});
const ICALIAS={"🥊":"👊","💬":"👥","🔪":"⚔️","🕳":"🚪","📊":"📈"},ACT_ICON={打喪屍豬:"👊",賣生豬肉:"💰",佈置:"🛋️",裝潢:"🎨",吃飯:"🍚",上廁所:"🚽",洗澡:"🛁",看電視:"📺",睡覺:"😴",起床:"☀️",吃一頓:"🍽️",打工:"💼",玩一下:"🎈",逛逛:"👀",煮飯給他:"🍳",幫他洗澡:"🧽",叫醒他:"⏰",串門子:"🏠",惡作劇:"💨",送禮物:"🎁",盪鞦韆:"🎠",快速休息:"😴",快速睡覺:"💤",進屋:"🏠",出門:"🚪",室內:"🛋️",餵貓吃零食:"🐟",取消:"✖️"};
const GROUP={tip:"建議下一步",self:"照顧自己",friend:"在他家",place:"在這裡",face:"面對面",online:"線上 · 在哪都能做",mis:"惡趣味",move:"移動",eat:"吃喝",fun:"玩樂",soc:"社交",work:"工作與任務",home:"房子"};let lastPanel="",panelFns=[];
function renderPanel(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now()),p=r.place,list=[];let title="",note="";
 if(walkers[me]&&walkers[me].path.length){title="走路中…";note="到了就可以做事"}
 else if(r.sleeping){title=`在${placeName(p)}睡覺 💤`;list.push(btn("起床","",()=>act("wake")))}
 else if(p=="home:"+me&&!inside(r)){title="家門口";note="走進屋裡才能吃飯、洗澡、睡覺、擺家具";list.push(btn("🚪 進屋",`回到家裡 · ${HOUSES[hlc((r.items||{}).hl)-1][0]}`,()=>act("enter"),"pin"))}
 else if(p=="home:"+me){title="你家（屋裡）";list.push(btn("吃飯",hasF(r,"fridge")?"飽足 +48 · 精力 +15 · €30":"沒有冰箱：冷食，飽足 +32、心情 −3 · €60",()=>act("eat")),btn("上廁所",hasF(r,"toilet")?"膀胱回滿":"沒有馬桶：找個角落，清潔 −10、心情 −3",()=>act("toilet")),dbtn("洗澡",hasF(r,"shower")?"清潔回滿 · 精力 +10":"沒有淋浴間：水桶，清潔只回 70%",()=>act("shower"),cdLeft(r,"shower",10)),dbtn("看電視",hasF(r,"tvcab")?`心情 +${hasF(r,"sofa")?22:15}`:"沒有電視櫃：發呆看窗外，心情 +6",()=>act("tv"),cdLeft(r,"tv",hasF(r,"tvcab")?10:15)),dbtn("快速休息",`${hasF(r,"massage")?"精力 +100":hasF(r,"sofa")?"精力 +70":"沒有沙發：坐地上，精力 +50"}`,()=>act("nap"),cdLeft(r,"nap",15)),dbtn("快速睡覺",`${hasF(r,"bed")?"":"沒有好床：睡地上 · "}睡 15 分鐘自動醒 · 精力約 +${hasF(r,"bed")?56:40}`,()=>act("qsleep"),cdLeft(r,"qsleep",30)),btn("睡覺",hasF(r,"bed")?"精力每小時 +90 · 睡多久回多少":"沒有好床：睡地上，精力每小時 +64、醒來心情 −3",()=>act("sleep")),btn("佈置","搬家具、擺小道具、升級房子",()=>interiorModal(me),"home"),btn("🎨 裝潢","換屋頂、牆壁顏色",()=>paintModal(),"home"),btn("🚪 出門","回到家門口",()=>act("exit"),"pin"))}
 else if(p&&p.startsWith("home:")&&R[p.slice(5)]){const id=+p.slice(5),t=tickLocal(R[id],now());title=`${t.name} 家`;const peek=btn("看室內",`${HOUSES[hlc((R[id].items||{}).hl)-1][0]} · 看他怎麼布置`,()=>interiorModal(id));
  const gifts=(r.items||{}).gift||0,giftB=gifts?btn("送禮物",`他心情 +20 · 背包 🎁${gifts}`,()=>act("gift",{target:id})):btn("送禮物","先去超市買",()=>toast("背包沒有禮物，去超市買一份"));
  if(!inside(t)){note=`${t.name} ${t.place==p?"在家門口，還沒進屋":"不在家，在"+placeName(t.place)}。可以在門口留言或放禮物，他回來會看到 · ${bondLabel(bondWith(id))}`;list.push(giftB,peek,...(t.place==p&&!t.sleeping&&!r.sleeping?faceActs(id):[]),btn("丟雞蛋 🥚","好感 −1 · 30 分鐘一次",()=>act("egg",{target:id})),btn(`📱 傳訊息給他`,"在哪都能傳",()=>noteModal(id)))}
  else{note=`${t.name}${t.sleeping?" 在睡覺":offTxt(t)}：飽足 ${Math.round(t.hunger)}、清潔 ${Math.round(t.hygiene)}、心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(id))}`;list.push(giftB);
   if(!vin(r)){note=`${t.name}${t.sleeping?" 在睡覺":offTxt(t)}，你在門口 · 按「進去」才能煮飯、洗澡、叫醒、串門子 · ${bondLabel(bondWith(id))}`;
    list.push(peek,btn("🚪 進去",`走進他家 · 進去後才有你的身影`,()=>enterFriend(id),"pin"),...(t.sleeping?[btn("叫醒到門外",`不用進去 · 叫醒他走出來，兩人在門口面對面 · 約 ${Math.round(100*(1-Math.min(.7,.25+(100-t.energy)/200)))}% 叫得醒 · 好感 −1`,()=>wakeOut(id))]:[btn("叫他出來",`不用進去 · 站在門外喊他，他出來就能在門口面對面 · 約 ${bondWith(id)>=0?90:bondWith(id)>=-20?60:30}% 肯出來 · 10 分鐘一次`,()=>wakeOut(id))]),...doorMisActs(id),btn("惡作劇 💨","在門口放個臭屁 · 好感 −2 · 30 分鐘一次",()=>act("prank",{target:id})),btn("丟雞蛋 🥚","好感 −1 · 30 分鐘一次",()=>act("egg",{target:id})),btn(`📱 傳訊息給他`,"在哪都能傳",()=>noteModal(id)))}
   else{title=`${t.name} 家（屋裡）`;list.push(peek,btn("煮飯給他","他飽足 +35 · €60",()=>act("feed",{target:id})),btn("幫他洗澡","他清潔 +45",()=>act("wash",{target:id})));
    if(t.sleeping)list.push(btn("叫醒他",`越累睡越沉 · 這次約 ${Math.round(100*(1-Math.min(.7,.25+(100-t.energy)/200)))}% 叫得醒 · 叫不醒只要等 3 分鐘`,()=>act("wakeup",{target:id})));
    if(!t.sleeping)list.push(btn("串門子","兩人心情 +15",()=>act("visit",{target:id})),...faceActs(id));
    list.push(btn("🚪 出門","回到他家門口",()=>exitFriend(),"pin"))}}}
 else if(p=="restaurant"){title="餐廳";list.push(btn("吃一頓","飽足 +55 · 精力 +20 · 心情 +10 · €250",()=>act("dine")),pjBtn("rest",r));note="朋友也在的話，點他可以請吃大餐 · "+pjNote("rest",r)}
 else if(p=="office"){title="公司";list.push(btn("打工",(wkLeft(R[me])?`休息中，${fmtLeft(wkLeft(R[me]))}後可再打 · `:"")+`+€${myWage()} · 精力 −25`,()=>act("work")));note=`今天已打工 ${workToday(R[me])} 次（第 3 次再領勤勞獎金 €500、第 6 次 €1000）。每天前 12 次薪水全額、13～24 次 50%、之後 10%，每次很耗精力，累了要回家睡。有同事在的話，點他可以一起加班，薪水加倍`}
 else if(p=="park"||p=="plaza"){title=placeName(p);list.push(btn("玩一下","心情 +20",()=>act("play")));if(p=="plaza"&&isOn("arcade"))list.push(btn("小豬街機 🕹️","猜拳＋單機 2 種（押錢遊戲搬到賭場了）",()=>{gameHall="arcade";gameTab="";gamesModal()}))}
 else if(p=="cafe"){title="咖啡廳";list.push(btn("喝咖啡 ☕","€90 · 精力 +50 · 膀胱 −10",()=>act("coffee")),pjBtn("cafe",r));note=pjNote("cafe",r)}
 else if(p=="rafi"){title="拉菲's office";list.push(pjBtn("rafi",r));note=pjNote("rafi",r)+" · 薪水比公司高但很傷心情"}
 else if(p=="stock"){title="證券交易所";list.push(btn("看盤與買賣 📈","8 檔股票、全天開、沒手續費",()=>stockModal()));note=`低買高賣賺差價，留意今日消息 · 持股 ${stockN(r)} 檔`}
 else if(p=="casino"){title="賭場";if(isOn("casino")){list.push(btn("小豬賭場 🪙","籌碼櫃台與全部押錢遊戲 · 離場自動換回現金（1.5%）",()=>casinoOpen()));if(fin(r))[["玩輪盤 🎡","美式輪盤","wheel"],["玩老虎機 🎰","三個一樣最高 ×100","slots"],["玩百家樂 🃏","押閒、莊、和","bacc"],["玩21點 🃏","6:5，莊家軟 17 要牌","bj"],["玩骰寶 🎲","大小、三顆一樣、單點","dice"]].forEach(([l,d,k])=>list.push(btn(l,d,()=>casinoOpen(k))))}else note="賭場被鎮長關閉了"}
 else if(p=="carshop"){title="車行";const own=vehOwn(r);for(const k of ["moto","car"])list.push(hasLic(r,k)?btn(`🎫 ${VEH[k][0]}駕照`,"已考到",()=>toast("你已經有這張駕照了")):btn(`🎫 考${VEH[k][0]}駕照`,`報名費 €${LICFEE[k]} · 三題答對兩題`,()=>licModal(k)));
  list.push(btn("🛡️ 保險、維修、賣車",own.some(k=>k!="bike")||own.length?"強制險、任意險、修車、二手車折價":"買了車才用得到",()=>garageModal()));
  for(const k in VEH){const v=VEH[k];list.push(own.includes(k)?btn(`${v[4]} ${v[0]}`,"已擁有 · 到路上就能上車",()=>toast("你已經有了")):btn(`${v[4]} 買${v[0]}`,`€${v[1]} · 速度 ×${v[2]} · ${v[3]?`油錢 €${v[3]}／格`:"不用油錢"}`,()=>act("vbuy",{item:k})))}note="路上騎車開車比走路快；機車和汽車每走一格扣油錢，沒錢加油會被迫下車。開車有機率出事故，買保險比較安心，車況差要記得修"}
 else if(p=="cinema"){title="電影院";list.push(btn("看電影 🎬","€300 · 心情 +35",()=>act("movie")))}
 else if(p=="gym"){title="健身房";list.push(btn("健身 🏋️",`精力 −15 · 心情 +10 · 打架更強（${Math.min(10,(r.items||{}).fit||0)}/10）`,()=>act("workout")),pjBtn("gym",r));note=pjNote("gym",r)}
 else if(p=="arena"){title="格鬥場";const it=r.items||{};list.push(btn("打擂台 🥊",`精力 −12 · 贏了拿獎金、連勝越多越貴 · 目前 ${it.streak||0} 連勝（最高 ${it.best||0}）`,()=>act("spar")));note="在這裡點別人可以約打：5 分鐘就能再打一次、贏的拿 €100（每人 30 分鐘領一次）、好朋友以上不扣、其他扣 1"}
 else if(p=="slaughter"){title="屠宰場";list.push(btn("溜進去偷飼料 🔪","買通守衛 €400 · 精力 −10 · 約四成賺 €500～900 · 可能被屠夫追、被抓去賠 €1200 · 一天最多 3 次",()=>act("sneak")));note="健身越多，越跑得掉"}
 else if(p=="market"){title="超市";list.push(btn("買禮物 🎁","€300 · 送朋友心情 +20",()=>act("buy",{item:"gift"})),btn("買零食 🍪","€60 · 隨時吃，飽足 +20",()=>act("buy",{item:"snack"})),btn("🛍️ 造型與擺飾","新衣服、家門口擺飾",()=>shopModal()),btn("逛逛","心情 +6",()=>act("browse")),pjBtn("shop",r));note=pjNote("shop",r)}
 else if(p=="jail"){title="監獄";const inm=Object.values(R).filter(o=>o.id!=me&&o.place=="jail"&&jailed(o)),stat=statLine(r),dz=(b,m)=>m?{...b,dis:m}:b;
  if(jailed(r)){const jp=jpOf(r)||{},ps=paroleWhy(r),eL=cdLeft(r,"esc",JAILX.esc[4]);
   note=`你被關著，還有 ${fmtLeft(jlLeft(r))}。勞動能賺錢、減刑；表現好可以申請假釋；也可以付保釋金，或冒險越獄。牢裡偶爾會發生獄友的事${jp.bad?"。你惹過事，這次不能假釋":""}`;
   list.push(dz(dbtn("做牢裡的勞動 💼",`€${JAIL.labor[0]} · 精力 −${JAIL.labor[1]} · 刑期 −${JAIL.labor[3]} 分鐘 · 假釋要做滿 ${JAILX.parole[0]} 次（已 ${jp.n||0} 次）`,()=>doJail("labor"),wkLeft(r)),!wkLeft(r)&&r.energy<JAIL.labor[1]?`精力要 ≥ ${JAIL.labor[1]}`:""),
    dbtn("放風 ☀️",`心情 +${JAILX.yard[0]} · 精力 −${JAILX.yard[1]} · ${JAILX.yard[2]} 分鐘一次`,()=>doJail("yard"),cdLeft(r,"yard",JAILX.yard[2])),
    dz(btn("申請假釋 🪪",ps||`表現良好就能提早出去 · 免費 · ${JAILX.parole[1]} 小時內別再犯事，否則刑期加倍`,()=>doJail("parole")),ps),
    dz(dbtn("越獄 🕳️",`成功約 ${escP()}%：逃出去但被通緝 ${JAILX.wanted[0]} 小時 · 失敗加刑 ${JAILX.esc[2]} 分鐘、罰款最多 €${JAILX.esc[3]}、不能假釋 · 精力 ≥ ${JAILX.esc[0]} · 1 小時一次`,()=>escapeModal(),eL),!eL&&r.energy<JAILX.esc[0]?`精力要 ≥ ${JAILX.esc[0]}`:""),
    btn("付保釋金出去 💰",`€${bailCost(jlLeft(r))} · 錢不夠就保不了`,()=>doJail("bail")))}
  else{note=(inm.length?`${inm.map(o=>o.name).join("、")} 被關在這裡，可以探望或幫他保釋`:"現在沒有人被關著。在路上砍人被巡警抓到，就會關進這裡")+(stat?"。"+stat:"");for(const o of inm)list.push(btn(`探望 ${o.name} 🤝`,"他心情 +10 · 你心情 +3 · 好感 +2 · 1 小時一次",()=>doJail("visit",o.id)),btn(`替 ${o.name} 保釋 💰`,`€${bailCost(jlLeft(o))} · 好感 +4`,()=>doJail("bail",o.id)))}}
else if(p=="hospital"){title="醫院";const pat=Object.values(R).filter(o=>o.id!=me&&hospIn(o)),mine=hospIn(r),dz=(b,m)=>m?{...b,dis:m}:b;
  note=mine?"你在住院，好好躺著，醒來就能出院。醫藥費照原規則：車禍當下結清、被砍由砍人的人付、餓昏倒醒來 "+CUR+"1500，付到 0 為止、不欠款。角色不會死":(pat.length?`${pat.map(o=>o.name).join("、")} 在住院，可以探病`:"現在沒有人住院。昏倒、車禍、被砍倒地的人會被送到這裡");
  list.push(dz(btn("掛號看診 🩺",`${CUR}${HOSP.fee} · 精力 +${HOSP.consult[0]}、清潔 +${HOSP.consult[1]}、傷好了 · 一天一次`,()=>hospAct("consult")),mine?"你還在住院":(r.items.hp||{}).d==todayTW()?"今天已經看過診了":r.money<HOSP.fee?`要 ${CUR}${HOSP.fee}`:""),
   dz(btn("出院 🚪","回到醫院門口外的路上",()=>hospAct("discharge")),mine&&r.sleeping?"還在住院，醒來才能出院":""));
  for(const o of pat)list.push(btn(`探病 ${o.name} 🤝`,`他心情 +${HOSP.visit[0]} · 你心情 +${HOSP.visit[1]} · 好感 +${HOSP.visit[3]} · ${HOSP.visitCd} 分鐘一次`,()=>hospAct("visit",o.id)))}
 else if(p=="police"){title="警察局";const tk=(r.items||{}).tk||[],sum=tk.reduce((a,x)=>a+x.a,0),sum9=tk.reduce((a,x)=>a+Math.floor(x.a*(100-POLICE.disc)/100),0),wan=wantedOn(r),dz=(b,m)=>m?{...b,dis:m}:b;
  note=`在這裡繳罰單省 ${POLICE.disc}%；通緝中可以來自首（關 ${POLICE.jail} 分鐘、不加刑）；被整、被砍可以報案，對方記報案點、不會直接入獄`+(wan?"。你現在被通緝":"");
  list.push(dz(btn("繳罰單（9 折）🧾",tk.length?`${tk.length} 張，全繳 ${CUR}${sum9}（原價 ${CUR}${sum}）`:"你沒有罰單",()=>policeAct("pay","all")),!tk.length?"你沒有罰單":r.money<Math.floor(tk[0].a*(100-POLICE.disc)/100)?"錢不夠繳第一張":""),
   dz(btn("自首 👮",`通緝解除、關 ${POLICE.jail} 分鐘、不算惹事 · 比被抓回去關 90 分鐘划算`,()=>policeAct("surrender")),wan?"":"你沒有被通緝"),
   btn("報案 📜","選一個最近惡搞你的人 · 每天 1 次 · 對方記報案點，不會入獄",()=>reportModal()),
   btn("今日治安 📊","看鎮上今天的罰單、事故、砍人、入獄",()=>policeAct("stats")))}
 else if(p=="townhall"){title="市政廳";note="鎮基金、公告欄、居民投票。鎮基金只能花在居民投票通過的建設案，不能轉給任何人";list.push(btn("市政廳大廳 🏛️","看鎮基金、公告、投票與建設案",()=>civicModal()))}
 else{title="路上";note="站在路邊久了容易遇到壞事（野狗、鳥大便、小偷、機車），找個地方待著吧。點地圖上的房子或地點，就會走過去"}
 if(!sel&&!r.sleeping&&!jailed(r)&&!(walkers[me]&&walkers[me].path.length))list.push(...trainBtns(r));
 if(TRV&&TRV.here&&r.place==TRV.place&&!r.sleeping&&!jailed(r))list.push(btn("和旅人聊聊 💬","今天來鎮上的旅人，選擇題",trvTalk,"place"));
 if(NPCV&&NPCV.here&&Date.parse(NPCV.until)>Date.now()&&r.place==NPCV.place&&!r.sleeping&&!jailed(r))list.push(btn("找流動商人 💰","限量奇貨，價格偏貴",npcShop,"place"));
 if(!sel&&!r.sleeping&&FACP.includes(p)&&!(walkers[me]&&walkers[me].path.length)){list.push(...facBtns(r));const fn=fqOf(r,p);if(fn)note=(note?note+" · ":"")+`來過 ${fn} 次${tierOf(fn)?"：這裡的"+tierOf(fn):"，5 次變常客有折扣"}`}
 if(!sel&&!r.sleeping&&!(walkers[me]&&walkers[me].path.length))list.push(...inviteBtns(r));
 // 同在店裡（咖啡廳、餐廳、健身房）：在場的人可以直接面對面互動，不用先點他
 if(!sel&&!r.sleeping&&fin(r)&&p!="jail"&&!(walkers[me]&&walkers[me].path.length))for(const o of Object.values(R).filter(o=>sameRoom(r,o)&&!o.sleeping).slice(0,3))list.push(...faceActs(o.id));
// 公共場所遇到人：可以擊掌；一起吃飯、玩、加班時在場的人心情都會變好
 if(!r.sleeping&&["plaza","restaurant","market","park","office"].includes(p)&&!(walkers[me]&&walkers[me].path.length)){const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping);
  if(here.length&&!(sel&&R[sel]))note=(note?note+" · ":"")+`${here.map(o=>o.name).join("、")} 也在這裡：一起做事大家心情都 +5，點他可以擊掌或扁他`}
 if(!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const q of POOPS)if(Math.abs(q.x-walkers[me].x)+Math.abs(q.y-walkers[me].y)<=2)list.push(btn("清掉便便 💩","領 €30",()=>act("sweep",{item:String(q.id)}),"place"));
 if(zbOut(r)&&walkers[me]&&!walkers[me].path.length){const zd=z=>Math.abs(z.x-walkers[me].x)+Math.abs(z.y-walkers[me].y),zn=ZB.filter(z=>zd(z)<=3);for(const z of zn)list.push(btn("打喪屍豬",`精力 −5 · 牠還有 ${z.hp} 點血 · 打倒領 €60～140（一天最多 €600）`,()=>zbHit(z.id),"place"));if(!zn.length&&ZB.some(z=>zd(z)<=14))list.push({...btn("附近有喪屍豬","牠正慢慢追過來，走近一點才打得到，或躲進屋裡、店裡",()=>toast("走近一點才打得到，或躲進屋裡、店裡"),"place"),dis:"牠還太遠"})}
 if(p=="market"&&((r.items||{}).zp||0)>0)list.push(btn(`賣生豬肉 ${r.items.zp} 塊`,`每塊 €30 · 共 €${30*r.items.zp}`,zbSell,"place"));
 if(p=="street"&&!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const k of CIVP){const o=CIVIC[k];if(o&&Math.abs(walkers[me].x-o[2])+Math.abs(walkers[me].y-o[3])<=2)list.push(dbtn(`在${o[0]}旁休息`,`心情 +${o[4]}${o[5]?` · 精力 +${o[5]}`:""} · 10 分鐘一次`,()=>civicUse(k),cdLeft(r,"c_"+k,10)))}
 if(!r.sleeping&&!(walkers[me]&&walkers[me].path.length))for(const k in OBJS)if(objNear(k,walkers[me].x,walkers[me].y,p))for(const [l,sub,v] of OBJS[k].acts)if(v!="feed"||((r.items||{}).snack))list.push(btn(l,`${OBJS[k].name} · ${sub}`,()=>act("obj",{item:k,note:v||null}),"place"));
 if(!r.sleeping&&(r.items||{}).snack&&!(walkers[me]&&walkers[me].path.length))list.push(btn("吃零食 🍪",`飽足 +20 · 還有 ${(r.items||{}).snack} 包`,()=>act("snack"),"self"));
 if(sel&&R[sel]&&sel!=me){const t=tickLocal(R[sel],now());note=`${t.name}：在${placeName(t.place)}${t.sleeping?"睡覺":""} · 飽足 ${Math.round(t.hunger)} · 清潔 ${Math.round(t.hygiene)} · 心情 ${Math.round(t.fun)} · ${bondLabel(bondWith(t.id))}`;
  const inRoom=sameRoom(r,t),away=inside(t)&&!inRoom,face=!away&&isNear(t.id)&&!t.sleeping&&!r.sleeping;title=`和 ${t.name} 互動`;
  if(away)note+=" · 他在屋裡休息，要到他家叫醒他才能互動（現在只能傳訊息）";
  list.length=0;if(face)list.push(...faceActs(t.id));list.push(...onlineActs(t.id).filter(b=>!away||/傳訊息|PK/.test(b.label)));
  if(!face&&!away)list.push(btn(`走到 ${t.name} 旁邊`,`他在${placeName(t.place)} · 面對面才能擊掌、扁他`,()=>walkToPerson(t.id)));
  list.push(btn(`去 ${t.name} 家`,"煮飯、洗澡、串門子要到他家",()=>{sel=null;goHouse(t.slot)}),btn("取消","",()=>{sel=null;lastPanel="";renderPanel()}))}
 if(!r.sleeping&&!inside(r)&&!(walkers[me]&&walkers[me].path.length)&&!sel){const vk=vehOf(r);if(vk){list.push(btn(`${VEH[vk][4]} 下車`,`${VEH[vk][0]} · 速度 ×${vspd(r,vk).toFixed(1)} · 車況 ${Math.round(100-vwear(r,vk))}%${vwear(r,vk)>=60?"（太舊，去車行修）":""}`,()=>act("dismount"),"move"));
  list.push(btn(vFull(r)?"🚦 現在：衝":"🚦 現在：守規矩",vFull(r)?"全速，但闖紅燈、超速、不禮讓會被巡邏開單。按一下改守規矩":"紅燈停、鬧區限速 ×2、住宅區 ×2.5。按一下改成衝",()=>act("vmode",{item:vFull(r)?"0":"1"}),"move"));
  if(vk!="bike"&&!hasLic(r,vk))list.push(btn("🎫 你沒有駕照",`被抓無照罰 €${FINE.nl[2]}。到車行考照`,()=>toast("到車行考駕照"),"move"))}
  else for(const k of vehOwn(r))list.push(btn(`${VEH[k][4]} ${k=="car"?"開":"騎"}${VEH[k][0]}`,`${rpLeft(r,k)>0?`修理中，${fmtLeft(rpLeft(r,k))}後取車 · `:""}速度 ×${vspd(r,k).toFixed(1)} · 車況 ${Math.round(100-vwear(r,k))}% · ${VEH[k][3]?`油錢 €${VEH[k][3]}／格`:"不用油錢"}${k!="bike"&&!hasLic(r,k)?" · 沒有駕照":""}${k!="bike"&&!insLeft(r,k,"c")?" · 沒保險":""}`,()=>act("mount",{item:k}),"move"))}
 if(!sel&&debtOf(r)>0)list.push(btn(`🧾 事故欠款 €${debtOf(r)}`,`錢夠就一次還清，不夠先還手上的。欠 €5000 以上不能開機車汽車${lkLeft(r)>0?` · 休養中 ${fmtLeft(lkLeft(r))}`:""}`,()=>act("paydebt",{item:"all"}),"move"));
 if(!sel&&(tkList(r).length||susLeft(r)>0))list.push(btn(`🎫 罰單 · 欠 €${tkDebt(r)}`,susLeft(r)>0?`違規記滿，車輛暫停到 ${new Date(Date.parse(r.items.sus)).toLocaleString("zh-TW",{hour12:false,month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}`:`${tkList(r).length} 張 · 欠 €3000 以上不能上車`,()=>ticketModal(),"move"));
 // 走進設施裡面：還在門口就給「進去」，在裡面給「出門」
 if(p!="jail"){const st=statLine(r);if(st)note=(note?note+"。":"")+st}
 if(ROOMS[p]&&!NOENTER[p]&&!r.sleeping&&!sel&&!(walkers[me]&&walkers[me].path.length)){if(jailed(r)){title+="（牢房裡）"}else if(fin(r)){title+="（店裡）";list.push(btn("🚪 出門","回到門口 · 走去別處也會自動離開",()=>exitRoom(),"pin"))}else list.unshift(btn("🚪 進去",`走進${placeName(p)}，進去才能用裡面的設施`,()=>enterRoom(p),"pin"))}
 // 店家休息中：只留說明，按鈕拿掉
 const cm=closedMsg(p);if(cm&&!sel){title+="（休息中）";note=cm;for(let i=list.length-1;i>=0;i--)if(!list[i].g||list[i].g=="place")list.splice(i,1)}
 for(let i=list.length-1;i>=0;i--)if(/烤地瓜/.test(list[i].label)&&closedMsg("stall"))list.splice(i,1);
 if(renderPanel.th!==title){renderPanel.th=title;$("here").textContent=title}if(renderPanel.tn!==note){renderPanel.tn=note;$("note").textContent=note;$("note").title=note}
 // 內容沒變就不重畫，避免按到一半按鈕被換掉
 if(!sel){const t=nextStep(r,p);if(t){list.unshift({...t,g:"tip"});track("show",t.label)}}
 if(!sel){const jk={cafe:"cafe",restaurant:"rest",gym:"gym",market:"shop",rafi:"rafi"}[p],card=null;try{card=jk?jobCardPJ(jk,r):p=="office"?jobCardCo(r):null}catch(e){}if(card){list.unshift({label:"職階",sub:"",g:"work",info:true,card});note=p=="office"?`今天已打工 ${workToday(r)} 次`:""}}
 if(ROOMS[p]&&!NOENTER[p]&&!fin(r)&&!jailed(r)&&!r.sleeping&&!sel){const kg=/^(pin|tip|move|online|face|mis|friend|soc)$/,kl=/便便|喪屍|旁休息|旅人|商人|吃零食|下車|衝|守規矩|駕照|欠款|罰單|騎|開/;for(let i=list.length-1;i>=0;i--){const b=list[i];if(/一起/.test(b.label)||!(kg.test(b.g||"")||kl.test(b.label)))list.splice(i,1)}}
 const dg=inside(r)?"self":p&&p.startsWith("home:")&&p!=="home:"+me?"friend":"place";list.forEach(b=>{if(!b.g)b.g=/^(走|去 |取消)/.test(b.label)?"move":/^(打工|應徵)/.test(b.label)?"work":dg});
 const GORD=["pin","tip","self","place","eat","fun","train","soc","work","home","friend","face","mis","online","move"],TABS=[["care","生活"],["here","地點"],["grow","成長"],["social","朋友"],["fun","玩樂"],["work","賺錢"],["move","移動"]];
 const tile=(b,i)=>{if(b.info){const c=b.card,pc=c.nx!=null?Math.min(100,Math.round(100*(c.n-c.cur)/(c.nx-c.cur))):100;return `<div class="jobcard" data-g="work"><div class="jr1"><b>${esc(c.name)}</b><span>$${c.pay}／次</span></div><div class="jr2"><i><u style="width:${pc}%"></u></i><small>${c.nx!=null?`${c.n}／${c.nx} 次 → ${esc(c.nname)} $${c.npay}`:"已達最高階"}</small></div></div>`}
   const m=b.label.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u)||b.label.match(/^(.*?)\s*(\p{Extended_Pictographic}️?)$/u),txt=m?(m[2].match(/\p{Extended_Pictographic}/u)?m[1]:m[2]):b.label,ic=m?(m[2].match(/\p{Extended_Pictographic}/u)?m[2]:m[1]):(ACT_ICON[b.label]||(b.g=="move"?"🚶":"•"));
   const F0=b.g=="tip"||b.g=="pin"||b.g=="move"?null:fxOf(b,r),nm2=txt.length>5?txt.match(/^(.*?(?:給|和|跟|請|邀請|去|對))\s*(\S.*)$/):null,cost=/(領|賺|獎|拿|得到|\+€|收入|打倒)/.test((b.sub||"").split("€")[0]+"€")?0:(+((b.sub||"").match(/€(\d+)(?!\d)/)||[])[1]||0),dis=b.dis||"",poor=dis||(F0&&F0.need.some(n=>!n[1]))||(cost&&/€\d+/.test(b.sub)&&!/\+€/.test(b.sub)&&r.money<cost),bad=/扁|砍|雞蛋|臭屁|惡作劇|叫醒/.test(b.label),cta=b.g=="tip"||b.g=="pin";
   const ic2=ICALIAS[String(ic).replace(/\uFE0F/g,"")]||ic,F=F0||{chips:[],need:[]},gt=dis?[dis.replace(/^剛做過，/,"").replace(/後再來/,"後").replace(/^(.{9}).+/,"$1…")]:F.need.find(n=>!n[1])||(poor&&cost?["需$"+cost]:null),fxr=(F.chips.length||gt)?`<span class="fr">${gt?`<i class="fc gate">${esc(gt[0])}</i>`:""}${F.chips.slice(0,gt?1:innerWidth<=700?2:3).map(fxChip).join("")}</span>`:"";return `<button data-i="${i}" data-g="${b.g}" class="act${cta?" cta":""}${bad?" bad":""}${poor?" poor":""}${b.g=="move"?" ghost":""}"><span class="ai">${ic2}</span><span class="at">${nm2?`<b>${esc(nm2[1])}</b><em class="nm">${esc(nm2[2])}</em>`:`<b>${esc(txt)}</b>`}${poor?F0?"":`<small>${dis?esc(dis):`錢不夠（要 €${cost}）`}</small>`:cta&&b.sub?`<small>${b.sub}</small>`:""}</span>${fxr}</button>`};
 const idx=list.map((b,i)=>[b,i]),pins=idx.filter(x=>x[0].g=="pin").slice(0,2),tips=idx.filter(x=>x[0].g=="tip").slice(0,2),rest=idx.filter(x=>x[0].g!="tip"&&x[0].g!="pin");if(tapHi){const hi=rest.findIndex(x=>tapHi.test(x[0].label));if(hi>0)rest.unshift(rest.splice(hi,1)[0])}
 const tabsHave=TABS.filter(t=>rest.some(x=>(TABOF[x[0].g]||"here")==t[0])),pk=p+"|"+(sel||"");
 if(pk!==ptabKey){ptabKey=pk;ptab=""}if(!tabsHave.some(t=>t[0]==ptab))ptab=(tabsHave.find(t=>t[0]=="here")||tabsHave[0]||[""])[0];
 const flat=rest.length<=6,tabHtml=!flat&&tabsHave.length>1?tabsHave.map(t=>{const its=rest.filter(x=>(TABOF[x[0].g]||"here")==t[0]),n=its.filter(x=>!x[0].dis).length;return `<button class="ptab${t[0]==ptab?" on":""}${n?"":" z"}" data-t="${t[0]}">${t[0]=="here"?(p&&p.startsWith("home:")?"房子":(title.replace(/[（(].*$/,"").trim().slice(0,4)||"地點")):t[1]}</button>`}).join(""):"";
 const cur=rest.filter(x=>flat||(TABOF[x[0].g]||"here")==ptab).sort((a,b)=>GORD.indexOf(a[0].g)-GORD.indexOf(b[0].g));
 const pinH=pins.map(x=>tile(x[0],x[1])).join(""),tipH=tips.map(x=>tile(x[0],x[1])).join(""),html=(!flat&&ptab=="social")?socialHtml(cur,tile):cur.map(x=>tile(x[0],x[1])).join("");
 const all=pinH+"§"+tipH+"§"+tabHtml+"§"+html;
 panelFns=list;if(all!=lastPanel){lastPanel=all;patchList($("pinbox"),pinH);$("panel").classList.toggle("haspin",!!pinH);patchList($("tipbox"),tipH);patchList($("ptabs"),tabHtml);patchList($("acts"),html);$("tipbox").classList.toggle("hide",!tipH);$("ptabs").classList.toggle("hide",!tabHtml)}drawRoom()}
const TABOF={self:"care",eat:"care",place:"here",home:"here",friend:"here",face:"social",soc:"social",mis:"social",online:"social",fun:"fun",train:"grow",work:"work",move:"move"};
{const q=new URLSearchParams(location.search);let on=q.get("dbg")=="1",el=null,pr=null,tm=null;
 const rd=()=>{if(!pr){pr=document.createElement("div");pr.style.cssText="position:fixed;left:-99px;top:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);visibility:hidden";document.body.appendChild(pr)}const c=getComputedStyle(pr);return c.paddingTop+"/"+c.paddingBottom};
 const bt=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().bottom):"-"};
 const draw=()=>{if(!on){if(el){el.remove();el=null}return}if(!el){el=document.createElement("div");el.id="dbg";el.style.cssText="position:fixed;left:4px;right:4px;top:calc(var(--hud,44px) + 4px);z-index:90;font:11px/1.3 monospace;color:#7dff9a;background:rgba(0,0,0,.65);padding:4px 6px;white-space:pre-wrap;pointer-events:none";document.body.appendChild(el)}const v=window.visualViewport||{};
  el.textContent=`inner ${innerWidth}x${innerHeight} outer ${outerHeight} screen ${screen.width}x${screen.height}\nvv h${Math.round(v.height||0)} top${Math.round(v.offsetTop||0)} scale${v.scale||1} clientH ${document.documentElement.clientHeight}\nstandalone ${navigator.standalone} dpr ${devicePixelRatio} safe top/bot ${rd()}\nbottoms: nav ${bt(".tools")} panel ${bt("#panel")} stage ${bt("#stage")} needs ${bt("#needs")} body ${bt("body")}`};
 setInterval(draw,1000);draw();
 const nd=$("needs");nd.addEventListener("touchstart",()=>{tm=setTimeout(()=>{on=!on;draw()},1000)},{passive:true});["touchend","touchmove","touchcancel"].forEach(k=>nd.addEventListener(k,()=>clearTimeout(tm),{passive:true}));
 nd.addEventListener("mousedown",()=>{tm=setTimeout(()=>{on=!on;draw()},1000)});nd.addEventListener("mouseup",()=>clearTimeout(tm))}
const SGN=["友善","惡作劇","線上","對戰"],sgOf=b=>/扁|砍|戰帖|PK|對練|打一場/.test(b.label)?3:/原諒|和好|擊掌|道謝|送禮|邀請|請客/.test(b.label)?0:(b.g=="mis"||/潑水|紙條|告白|偷零食|拍醜照|換座位|門鈴|便便|丟雞蛋|惡作劇/.test(b.label))?1:(b.g=="online"||/傳訊息|打電話|叫外送|寄禮物|留言/.test(b.label))?2:0;
function socialHtml(cur,tile){const s=cur.slice().sort((a,b)=>sgOf(a[0])-sgOf(b[0]));let last=-1;return s.map(x=>{const k=sgOf(x[0]);let h="";if(k!=last){last=k;h=`<div class="subh">${SGN[k]}</div>`}return h+tile(x[0],x[1])}).join("")}
let ptab="",ptabKey="";try{new ResizeObserver(()=>resize()).observe($("stage"))}catch(e){}try{new ResizeObserver(()=>document.body.style.setProperty("--phpx",($("panel").offsetHeight||0)+"px")).observe($("panel"))}catch(e){}function panelFnTab(f){ptab=TABOF[f.g]||ptab;lastPanel="";renderPanel()}
const actClick=ev=>{const tb=ev.target.closest("button.ptab");if(tb){tapHi=null;ptab=tb.dataset.t;lastPanel="";renderPanel();return}
const b=ev.target.closest("button[data-i]");if(!b||busy)return;const f=panelFns[b.dataset.i];if(f){if(f.dis){toast(f.dis);return}if(f.g=="tip")track("click",f.label);press(b,f.fn)}};

{let pt=0,cur=null,eat=0;const card=()=>{let c=document.getElementById("fxcard");if(!c){c=document.createElement("div");c.id="fxcard";document.body.appendChild(c)}return c},hide=()=>{const c=document.getElementById("fxcard");if(c)c.style.display="none";cur=null};
 const show=el=>{const f=panelFns[el.dataset.i];if(!f||!R[me])return;const r=tickLocal(R[me],now()),F=f.g=="move"||f.info?{fx:[],need:[]}:fxOf(f,r),c=card();
  const row=x=>{const w=FXN[x[0]]||"";return `<div class="r">${fxChip(x)}<span>${x[0]=="money"?(x[1]<0?"花費":"獲得"):w}${x[2]?`（${esc(x[2])}）`:""}</span></div>`};
  c.innerHTML=`<b>${esc(f.label.replace(/\p{Extended_Pictographic}️?/gu,"").trim())}</b>${F.rule?(F.rule.p?`<p>${esc(F.rule.p)}</p>`:""):(f.sub?`<p>${esc(f.sub)}</p>`:"")}${F.fx.map(row).join("")}${F.need.map(n=>`<div class="r"><i class="fc ${n[1]?"ok":"gate"}">${n[1]?"✓":"要"}</i><span>${esc(n[0])}</span></div>`).join("")||(F.fx.length?"":"<p>沒有數值變化</p>")}<small>點別處關閉</small>`;
  pxify(c);c.style.display="block";cur=el;eat=Date.now()};
 const A=$("acts");[A,$("tipbox"),$("pinbox")].forEach(a=>{a.addEventListener("pointerdown",e=>{const b=e.target.closest("button[data-i]");clearTimeout(pt);if(!b)return;if(e.pointerType=="mouse")return;pt=setTimeout(()=>{show(b)},400)});["pointerup","pointercancel","pointermove","scroll"].forEach(k=>a.addEventListener(k,()=>clearTimeout(pt),{passive:true}));
  a.addEventListener("click",e=>{if(Date.now()-eat<600&&cur){e.stopPropagation();e.preventDefault()}},true);a.addEventListener("contextmenu",e=>{if(e.target.closest("button[data-i]"))e.preventDefault()});
  a.addEventListener("mouseover",e=>{const b=e.target.closest("button[data-i]");if(!b||!matchMedia("(hover:hover)").matches)return;clearTimeout(pt);pt=setTimeout(()=>show(b),350)});a.addEventListener("mouseout",e=>{if(e.target.closest("button[data-i]")){clearTimeout(pt);hide()}})});
 document.addEventListener("pointerdown",e=>{if(cur&&!e.target.closest("#fxcard"))setTimeout(hide,0)},true)}
$("acts").addEventListener("click",actClick);$("tipbox").addEventListener("click",actClick);$("pinbox").addEventListener("click",actClick);{const a=$("acts"),p=$("panel"),mk=()=>a.classList.toggle("more",a.scrollTop+a.clientHeight<a.scrollHeight-4),fit=()=>{const B=document.body;if(p.classList.contains("min")){p.style.height="";a.style.height="";B.style.setProperty("--phpx",(p.offsetHeight||0)+"px");return}
 const prev=p.offsetHeight,tr=p.style.transition;p.style.transition="none";p.style.height="auto";a.style.height="";a.style.flex="none";a.style.overflow="visible";
 const maxP=p.classList.contains("max")?innerHeight-parseFloat(getComputedStyle(B).getPropertyValue("--hud")||44)-56-24:Math.round(innerHeight*(matchMedia("(min-width:900px)").matches?.62:.42)),other=p.offsetHeight-a.offsetHeight,avail=maxP-other-2,ar=a.getBoundingClientRect(),nat=a.scrollHeight;let ah=nat;
 if(nat>avail){let best=0;a.querySelectorAll(".act:not(.info),.jobcard").forEach(c=>{const rb=c.getBoundingClientRect().bottom-ar.top;if(rb<=avail+1&&rb>best)best=rb});if(!best){const c=a.querySelector(".act:not(.info),.jobcard");best=c?c.getBoundingClientRect().bottom-ar.top:avail}ah=best}
 a.style.overflow="";a.style.flex="0 0 auto";a.style.height=Math.round(ah)+"px";
 const target=Math.max(190,Math.round(other+ah)),old=fit.last;p.style.height=prev+"px";void p.offsetHeight;p.style.transition=tr;p.style.height=target+"px";fit.last=target;
 mk()};
 a.addEventListener("scroll",mk,{passive:true});new MutationObserver(()=>setTimeout(fit,30)).observe(a,{childList:true});{let raf=0;const ro=new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fit)});["here","note","tipbox","ptabs","pinbox"].forEach(id=>ro.observe($(id)))}addEventListener("resize",()=>setTimeout(fit,50));setTimeout(fit,300)}$("ptabs").addEventListener("click",actClick);
let lastNeeds="";
const NEED_TIP={hunger:["飽足","每小時 −8 · 吃飯、餐廳、零食補"],energy:["精力","每小時 −5 · 睡覺、咖啡、休息補"],bladder:["膀胱","每小時 −10 · 上廁所"],hygiene:["清潔","每小時 −5 · 洗澡"],fun:["心情","每小時 −4 · 玩、看電影、跟朋友互動"]};
$("needs").addEventListener("click",e=>{const c=e.target.closest(".need");if(!c||!R[me])return;const k=c.dataset.k,r=tickLocal(R[me],now());if(k=="money")toast(`$${r.money} · 打工、每日任務賺錢`);else if(NEED_TIP[k])toast(`${NEED_TIP[k][0]} ${Math.round(r[k])}/100 · ${NEED_TIP[k][1]}`)});
function renderNeeds(){if(!S||!me||!R[me])return;const r=tickLocal(R[me],now());
 const html=NEEDS.map(k=>{const v=Math.round(r[k]),[ic,nm]=NEED_INFO[k];return `<div class="need${v<20?" low":""}" data-k="${k}" title="${nm} ${v}"><span>${ic}</span><i><b style="width:${v}%;background:${v<20?"var(--bad)":v<50?"var(--warn)":"var(--good)"}"></b></i><small><em>${nm} </em>${Math.min(99,v)}</small></div>`}).join("")+`<div class="need money" data-k="money"><span>💰</span><small title="€${r.money}"><u class="cu">€</u>${r.money>=10000?(r.money/1000).toFixed(1).replace(/\.0$/,"")+"k":r.money}</small></div>\n${window.__tap||"尚未點地圖"}`;
 if(html!=lastNeeds){lastNeeds=html;patchList($("needs"),html)}}
// 每週排行（最近 7 天）
// 排行榜：頒獎台（前三名大頭貼）＋其餘名次＋你的名次；最近 7 天的事件，加上現在的存款和好友數
function renderRank(){const w=(S&&S.week)||{},all=Object.values(R);
 const fromWeek=k=>(w[k]||[]).filter(x=>R[x.id]).map(x=>({id:x.id,n:x.n}));
 const rich=all.map(r=>({id:r.id,n:r.money})).sort((a,b)=>b.n-a.n),friends=all.map(r=>({id:r.id,n:((S&&S.bonds)||[]).filter(b=>(b.a==r.id||b.b==r.id)&&b.s>=10).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
 const cats=[["work","💼","最勤勞","次打工",fromWeek("work")],["popular","💗","最受歡迎","次被照顧",fromWeek("popular")],["kind","🤲","最愛照顧人","次照顧別人",fromWeek("kind")],
  ["rich","💰","小鎮首富","€",rich],["friends","🤝","人緣最好","個好朋友",friends],["punched","🤕","最欠扁","次被欺負",fromWeek("punched")],
  ...SOLO.map(g=>[g[0],g[1],g[2]+"王","分",all.map(r=>({id:r.id,n:spOf(r,g[0])})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)])];
 const av=(id,big)=>`<canvas class="rav${big?" big":""}" width="28" height="34" data-look='${esc(JSON.stringify((R[id]||{}).look||{}))}'></canvas>`;
 const val=(c,x)=>c[0]=="rich"?`€${x.n}`:`${x.n} ${c[3]}`;
 $("tab-rank").innerHTML=`<p class="mut" style="margin:0 0 8px">次數類是最近 7 天；首富和人緣是現在的狀態。</p>`+cats.map(c=>{const L=c[4];if(!L.length)return `<div class="rk"><div class="rkh">${c[1]} ${c[2]}</div><p class="mut">還沒有人上榜，搶第一！</p></div>`;
  const top=[L[1],L[0],L[2]],mine=L.findIndex(x=>x.id==me);
  return `<div class="rk"><div class="rkh">${c[1]} ${c[2]}</div><div class="podium">${top.map((x,i)=>x?`<div class="pd p${[2,1,3][i]}${x.id==me?" me":""}">${av(x.id,i==1)}<b>${esc(R[x.id].name)}</b><small>${val(c,x)}</small><div class="step">${[2,1,3][i]}</div></div>`:`<div class="pd empty"></div>`).join("")}</div>
   ${L.length>3?`<div class="rest">${L.slice(3,8).map((x,i)=>`<div class="rr${x.id==me?" me":""}"><span>${i+4}</span><b>${esc(R[x.id].name)}</b><small>${val(c,x)}</small></div>`).join("")}</div>`:""}
   ${me&&mine<0&&c[0]!="punched"?`<p class="mut mine">你還沒上榜</p>`:mine>=0?`<p class="mine">你是第 <b>${mine+1}</b> 名</p>`:""}</div>`}).join("");
 $("tab-rank").querySelectorAll("canvas.rav").forEach(c=>{try{const l=JSON.parse(c.dataset.look);miniPerson(c,l)}catch(e){}})}
function renderPeople(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);
 $("tab-ppl").innerHTML=(list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${esc(career(o).name)}${titlesOf(o).length?" · "+esc(titlesOf(o).slice(-1)[0]):""} · ${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)} · 在${placeName(o.place)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`)
  +`<p class="mut" style="margin-top:10px">送禮 +4、煮飯洗澡 +3、請吃大餐 +4、串門子／一起加班／外送／道謝 +2、擊掌／訊息／電話 +1；叫醒 −1、丟雞蛋 −1、惡作劇 −2、扁人 −3（好朋友 −1、好麻吉 0）、和好 +8。同一個人每天好感最多 +12／−6。好麻吉以上照顧對方效果 ×1.3。</p>`;
 $("tab-ppl").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{sel=+b.dataset.w;lastPanel="";renderPanel();$("here").scrollIntoView({behavior:"smooth",block:"center"})})}
// 動態：每種事一個圖示，名字粗體，分今天／昨天，跟我有關的用左邊色條標出來
// ── 職業階梯與人生願望（資料在 items：works 累計打工、wish、titles、meals；門檻要和 town.sql 一致）──
const jobLv=n=>JOBS.reduce((a,j,i)=>n>=j[1]?i:a,0);
const career=r=>{const n=(r.items&&r.items.works)||0,lv=jobLv(n),nx=JOBS[lv+1];return{n,lv,name:JOBS[lv][0],wage:JOBS[lv][2],next:nx?nx[0]:null,left:nx?nx[1]-n:0}};
const dayKey=(o=0)=>new Date(now()+8*36e5+o*864e5).toISOString().slice(0,10);
const workToday=r=>{const d=r.items&&r.items.dc;return d&&d.d==dayKey()?(d.work||0):0};
const workPct=n=>100;// 每天打工：前 12 次全額、13～24 次 50%、之後 10%（台灣時間 0 點重置，與 SQL town_work_pct 一致）// 薪水不再遞減，改用 10 分鐘冷卻 wkLeft（所有打工共用）
// 活躍天數等級（資料 items.al = {n,d,s}；數值要和 town.sql 的 town_lv_of／wk_min／bag_max／rent_pct／al_touch 一致）
const AL=[[0,"新居民",10,20,0,0],[3,"熟面孔",10,24,5,30],[10,"老鄰居",9,26,8,60],[30,"鎮上名人",8,28,12,100],[60,"小鎮元老",8,30,15,150]];// [門檻天,稱號,打工冷卻分,背包上限,房租折扣%,登入禮]
const alN=r=>((r.items&&r.items.al)||{}).n||0;
const lvOf=n=>{let l=0;AL.forEach((a,i)=>{if(n>=a[0])l=i});return l};// 0..4
const alOf=r=>AL[lvOf(alN(r))];
const wkLeft=r=>0;
const taxOf=m=>Math.floor(Math.max(0,Math.min(m,1e5)-5e4)*0.003+Math.max(0,Math.min(m,1e6)-1e5)*0.008+Math.max(0,Math.min(m,5e6)-1e6)*0.015+Math.max(0,m-5e6)*0.03);const RENT=[400,800,1500,3000];const rentOf=r=>{const b=RENT[Math.min(3,Math.max(0,((r.items&&r.items.hl)||1)-1))];return b-Math.floor(b*alOf(r)[4]/100)};
// 其他工作（和 town.sql 的 town_pjob_* 一致）：[名稱, 地點, 底薪, [精力,飽足,心情,清潔], SQL 的 act 營業鍵]；熟練 15 次 ×1.15、40 次 ×1.3；拉菲底薪 320／450／650，要先升到「員工」
const pjN=(r,k)=>((r.items&&r.items.jw)||{})[k]||0;
const pjPay=(k,r)=>Math.floor(payOf(pjWage(k,pjN(r,k)),r)*workPct(workToday(r))/100);
const pjFx=k=>["精力","飽足","心情","清潔"].map((l,i)=>`${l} ${PJ[k][3][i]}`).join(" · ");
const pjBtn=(k,r)=>{const n=pjN(r,k);if(k=="rafi"&&((r.items&&r.items.works)||0)<10)return btn("應徵（還不夠資格）","先在公司升到「員工」（累計打工 10 次）",()=>toast("先在公司打工 10 次升到員工，再來應徵"));return btn(`打工：${pjName(k,n)} 💼`,(wkLeft(r)?`休息中，${fmtLeft(wkLeft(r))}後可再打 · `:"")+`+€${pjPay(k,r)} · ${pjFx(k)}`,()=>act("job",{item:k}))};
const jobCardPJ=(k,r)=>{const n=pjN(r,k),T=k=="rafi"?RFT:PJT,ti=pjTier(k,n),nx=T[ti+1];return {name:pjName(k,n),pay:pjPay(k,r),n,cur:T[ti],nx:nx==null?null:nx,nname:nx==null?"":PJN[k][ti+1],npay:nx==null?0:pjWage(k,nx)}};
const jobCardCo=r=>{const w=(r.items&&r.items.works)||0,ti=JOBS.reduce((a,j,i)=>w>=j[1]?i:a,0),nx=JOBS[ti+1];return {name:JOBS[ti][0],pay:myWage(),n:w,cur:JOBS[ti][1],nx:nx?nx[1]:null,nname:nx?nx[0]:"",npay:nx?nx[2]:0}};
const pjNote=(k,r)=>{const n=pjN(r,k),T=k=="rafi"?RFT:PJT,t=pjTier(k,n),nx=T[t+1];return `${pjName(k,n)} · 每次 €${pjPay(k,r)} · 這裡已做 ${n} 次${nx!=null?`，再 ${nx-n} 次升「${PJN[k][t+1]}」（€${pjWage(k,nx)}）`:"，已是最高職位"} · 今天全部打工共 ${workToday(r)} 次 · 薪水全額、不遞減`};
const myWage=()=>Math.floor(payOf(career(R[me]).wage,tickLocal(R[me],now()))*workPct(workToday(R[me]))/100);
const WISHES={rich:["首富","持有金錢",[30000,100000,300000],["小富翁","大富翁","小豬首富"],r=>r.money],pop:["人氣王","好朋友以上的人數",[5,10,20],["交友廣闊","萬人迷","人氣王"],r=>(S.bonds||[]).filter(b=>(b.a==r.id||b.b==r.id)&&b.s>=10).length],
 fight:["格鬥冠軍","擂台最高連勝",[3,7,15],["擂台新秀","擂台猛將","格鬥冠軍"],r=>(r.items&&r.items.best)||0],food:["美食家","累計吃飯／大餐",[30,100,300],["老饕","美食家","食神"],r=>(r.items&&r.items.meals)||0],
 work:["打工王","職位（組長、經理、主管）",[2,3,4],["勤勞蜜蜂","職場達人","打工王"],r=>career(r).lv]};
const WISH_BONUS=[200,500,1000];
const titlesOf=r=>(r.items&&r.items.titles)||[];
const nameTag=r=>{const t=titlesOf(r),tk=tickLocal(r,now()),n=t.length?r.name+" "+t[t.length-1]:r.name,sk=r.items&&r.items.sk&&Date.parse(r.items.sk.u)>now();return MOOD[moodOf(tk)][0]+" "+n+(sk?" 「踢我」":"")+(!r.sleeping&&togetherAt(r.place)?" 正在一起":"")};
const TRAITS={foodie:["吃貨","吃東西的飽足效果 +30%"],athlete:["運動家","健身進步更快、打架和擂台更強"],social:["社交達人","好感增加 +30%"],workaholic:["工作狂","薪水 +10%"],
 nightowl:["夜貓子","晚上 10 點到早上 6 點，醒著精力掉得慢"],clean:["愛乾淨","清潔掉得比較慢"],lucky:["幸運兒","路上壞事少、路邊好事多"],romantic:["浪漫","送出的禮物效果加倍"]};
// ── 能力屬性（supabase/town_stats.sql）：力量、敏捷、魅力、智力、運氣；建角色後分配 10 點，之後升級每級 +1 點
const STATS=[["st","力量","打架、PK、擂台力量 +1／點"],["ag","敏捷","被巡警抓、車禍機率 −2%／點"],["ch","魅力","好感增加 +2%／點"],["iq","智力","打工薪水 +1%／點"],["lk","運氣","隨機事件壞結果 1%／點變好結果"]];
function sndModal(){const g=window.SFX;if(!g){toast("聲音還沒載入");return}const c=g.get(),VN=["小","中","大"];
 $("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>聲音</h2><div class="row"><button id="sdS">音效：${c.s?"開":"關"}</button><button id="sdM">音樂：${c.m?"開":"關"}</button><button id="sdV">音量：${VN[c.v]}</button></div><p class="mut">音樂預設關閉；白天輕快、晚上 8 點到早上 6 點安靜。切到別的畫面會自動靜音。</p><div class="dsec">聲音測試</div><div class="row" style="flex-wrap:wrap">${g.names.map(n=>`<button data-sn="${n}">${n}</button>`).join("")}</div><div class="row"><button id="sdX" class="pri">好</button></div>`;
 $("sdS").onclick=()=>{g.sound(!c.s);sndModal()};$("sdM").onclick=()=>{g.music(!c.m);sndModal()};$("sdV").onclick=()=>{g.vol((c.v+1)%3);sndModal();g.play("coin",1)};$("sdX").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-sn]").forEach(b=>b.onclick=()=>g.play(b.dataset.sn,1));pxify($("mbody"))}
function statsModal(first){const r=R[me];if(!r)return;let at={},avail=0,ini=true,tr=null;
 const draw=()=>{const sel=first&&!ini;const tot=STATS.reduce((s,k)=>s+(at[k[0]]||0),0);
  $("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>能力屬性</h2><p class="mut">${sel?`有 10 點可以分配（每項 0～5），選了就不能改，也可以先跳過。已用 ${tot}／10`:`每項最高 5 點。升級後每級得 1 點，可用點數：${avail}`}</p><div class="list">${STATS.map(k=>{const tp=tr&&tr.tmp?tr.tmp[k[0]]||0:0,pg=tr&&tr.p?tr.p[k[0]]||0:0,nd=tr&&tr.need?tr.need[k[0]]||0:0;return `<div class="act" style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="flex:1"><b>${k[1]}</b> ${at[k[0]]||0}／5${tp?` <small class="mut">（暫時 −${tp}）</small>`:""}<br><small>${k[2]}</small>${!sel&&nd?`<br><small class="mut">訓練進度 ${pg}/${nd}</small>`:""}</span>${sel?`<button data-m="${k[0]}">−</button><button data-p="${k[0]}">＋</button>`:`<button data-s="${k[0]}"${avail>0&&(at[k[0]]||0)<5?"":" disabled"}>加 1 點</button>`}</div>`}).join("")}</div>${!sel&&tr?`<p class="mut"><small>練習：健身房舉重（力量）、公園慢跑（敏捷）、在家讀書（智力）、廣場／咖啡廳聊天（魅力）、許願池投幣（運氣）。今天進度 ${tr.td}/${tr.max}。暫時減益：鼻青臉腫、心情低落、發臭、精力不足、事故欠款，狀態解除就恢復。</small></p>`:""}<p class="err" id="serr"></p><div class="row">${sel?'<button id="sskip">先跳過</button><button class="pri" id="sok">選好了</button>':'<button id="sclose">關閉</button>'}</div>`;
  $("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{const k=b.dataset.p;if(tot<10&&(at[k]||0)<5){at[k]=(at[k]||0)+1;draw()}});
  $("mbody").querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const k=b.dataset.m;if((at[k]||0)>0){at[k]--;draw()}});
  $("mbody").querySelectorAll("[data-s]").forEach(b=>b.onclick=async()=>{try{const j=await rpc("town_stats",{rid:me,pin,op:"spend",note:b.dataset.s});at=j.at;avail=j.avail;await refresh().catch(()=>{});draw()}catch(e){$("serr").textContent=e.message}});
  const done=async note=>{try{const j=await rpc("town_stats",{rid:me,pin,op:"set",note});at=j.at;ini=true;await refresh().catch(()=>{});$("modal").classList.add("hide");toast("能力分配好了")}catch(e){$("serr").textContent=e.message}};
  if($("sok"))$("sok").onclick=()=>done(STATS.map(k=>at[k[0]]||0).join(","));if($("sskip"))$("sskip").onclick=()=>done("0,0,0,0,0");if($("sclose"))$("sclose").onclick=()=>$("modal").classList.add("hide")};
 rpc("town_stats",{rid:me,pin,op:"view"}).then(j=>{at=j.at;avail=j.avail;ini=j.init;if(first&&ini)return;rpc("town_train",{rid:me,pin,kind:"view"}).then(t=>{tr=t}).catch(()=>{}).then(draw)}).catch(e=>toast(e.message))}
async function rollDraw(id){try{const j=await rpc("town_pool",{rid:me,pin,op:"draw",target:id});const rows=j.list.map(x=>[x.title,x.desc+" · "+x.hint+(x.cost?` · 要花 €${x.cost}`:""),async()=>{try{const k=await rpc("town_pool",{rid:me,pin,op:"do",target:id,item:String(x.id)});await refresh();spawnFx(k.hit?"sparkle":"coins",me,id);toast(`${k.msg} ${k.fx||""}`);feedback(k.hit,k.fx||"")}catch(e){toast(e.message)}renderPanel()}]);choiceModal(`隨機互動：和 ${j.who}`,"系統抽了 5 件事，選一個來做",rows)}catch(e){toast(e.message)}}
async function rollDo(kind,id){try{const j=await rpc("town_roll",{rid:me,pin,kind,target:id});await refresh();const a=j.act;if(kind=="mis"){spawnFx(MIS_FX[a]||"sparkle",me,id);playRoomFx(a,id)}const m=(j.res&&j.res.msg)||"";toast(`${j.flavor} ${m}`);feedback(true,m)}catch(e){toast(e.message)}}
function traitModal(){const sel=[];$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>選 2 個個性</h2><p class="mut">只有加成，沒有壞處。選了就不能改，也可以先跳過。</p><div class="list">${Object.entries(TRAITS).map(([k,v])=>`<button data-tk="${k}" style="width:100%;text-align:left;margin-bottom:6px"><b>${v[0]}</b><br><small>${v[1]}</small></button>`).join("")}</div><p class="err" id="terr"></p><div class="row"><button id="tskip">先跳過</button><button class="pri" id="tok" disabled>選好了</button></div>`;
 const bs=[...$("mbody").querySelectorAll("[data-tk]")],upd=()=>{bs.forEach(b=>b.classList.toggle("pri",sel.includes(b.dataset.tk)));$("tok").disabled=sel.length!=2;$("tok").textContent=sel.length==2?"選好了":`再選 ${2-sel.length} 個`};
 bs.forEach(b=>b.onclick=()=>{const k=b.dataset.tk,i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else if(sel.length<2)sel.push(k);upd()});upd();
 const go=async ks=>{try{apply(await rpc("town_traits",{rid:me,pin,ks}));$("modal").classList.add("hide");if(ks.length)toast("個性訂好了");if(!(R[me].items&&R[me].items.wish))setTimeout(wishModal,300);else if(ks.length)lifeModal()}catch(e){$("terr").textContent=e.message}};
 $("tok").onclick=()=>go(sel);$("tskip").onclick=()=>go([])}
function alHtml(r){const n=alN(r),l=lvOf(n),a=AL[l],nx=AL[l+1],s=((r.items.al||{}).s)||0;
 const pct=nx?Math.round((n-a[0])/(nx[0]-a[0])*100):100;
 return `<h3>小鎮居民等級</h3><div class="mrow"><span><b>Lv${l+1} ${a[1]}</b> <small class="mut">活躍 ${n} 天${s>1?` · 連續 ${s} 天`:""}${nx?` · 再活躍 ${nx[0]-n} 天升 Lv${l+2}「${nx[1]}」`:" · 已是最高等級"}</small><i class="bond"><b style="left:0;width:${pct}%;background:var(--good)"></b></i><small class="mut">每天有上線動作就算活躍一天，只給便利，不影響打工薪水。斷了不會掉級、不扣東西。</small></span></div><div class="list">${AL.map((x,i)=>`<div class="mrow"><span>${i<=l?"✔":"・"} Lv${i+1} ${x[1]}（${x[0]} 天）<br><small class="mut">打工冷卻 ${x[2]} 分 · 背包 ${x[3]} · 房租 −${x[4]}%${x[5]?` · 每日登入禮 €${x[5]}`:""}</small></span></div>`).join("")}</div>`}
let lastLv=null;
function lvUpModal(l){window.SFX&&SFX.play("levelup");const a=AL[l],p=AL[l-1];$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>升級了！</h2><div class="lvup"><img class="px" alt="" src="${window.PIXICON_NAME?PIXICON_NAME("star"):""}"><img class="px" alt="" src="${window.PIXICON_NAME?PIXICON_NAME("star"):""}"><img class="px" alt="" src="${window.PIXICON_NAME?PIXICON_NAME("star"):""}"></div><p style="text-align:center"><b>Lv${l+1} ${a[1]}</b></p><p class="mut">新福利：${a[2]<p[2]?`打工冷卻 ${a[2]} 分鐘 · `:""}${a[3]>p[3]?`背包上限 ${a[3]} · `:""}${a[4]>p[4]?`房租 −${a[4]}% · `:""}${a[5]>p[5]?`每日登入禮 €${a[5]}`:""}</p><p class="mut">獲得稱號「${a[1]}」</p><div class="row"><button id="lvok" class="pri">好</button></div>`;
 $("lvok").onclick=()=>$("modal").classList.add("hide")}
function lifeModal(){const r=R[me],c=career(r),w=(r.items&&r.items.wish)||{},k=WISHES[w.k],m=w.m||0,t=titlesOf(r);$("modal").classList.remove("hide");
 let wh;if(k){const v=k[4](r),ms=k[2],cur=ms[Math.min(m,2)];wh=`<div class="mrow"><span><b>${k[0]}</b> <small class="mut">${m>=3?"三個里程碑都達成了":w.k=="work"?`第 ${m+1} 關：升到「${JOBS[cur][0]}」（現在${c.name}）`:`第 ${m+1} 關：${k[1]} ${Math.min(v,cur)} / ${cur}`}</small></span></div><div class="list">${ms.map((x,i)=>`<div class="mrow"><span>${i<m?"✔":"・"} ${w.k=="work"?"升到「"+JOBS[x][0]+"」":k[1]+" "+x}　<small class="mut">稱號「${k[3][i]}」＋€${WISH_BONUS[i]}</small></span></div>`).join("")}</div>`;if(m>=3)wh+=`<div class="row" style="justify-content:flex-start"><button id="lwNew">換一個新願望</button></div>`}
 else wh=`<p class="mut">${w.k=="none"?"你選擇先不訂願望。":"還沒選願望。"}</p><div class="row" style="justify-content:flex-start"><button id="lwNew" class="pri">選一個願望</button></div>`;
 $("mbody").innerHTML=`<h2>我的人生</h2><div class="mrow"><span><b>${c.name}</b> <small class="mut">每次打工 €${payOf(c.wage,tickLocal(r,now()))} · 已打工 ${c.n} 次</small></span></div><p class="mut">今天已打工 ${workToday(r)} 次，薪水全額、每 ${alOf(r)[2]} 分鐘可打一次 · 每天房租水電 €${rentOf(r)}${taxOf(r.money)?`、財產稅 €${taxOf(r.money)}（存款超過 50000 的部分，階梯 0.3%～3%）`:""}${alOf(r)[4]?`（已含 ${alOf(r)[4]}% 折扣）`:""}（每天第一次上線扣）</p>${Object.keys(PJ).some(k=>pjN(r,k))?`<p class="mut">其他工作：${Object.keys(PJ).filter(k=>pjN(r,k)).map(k=>pjName(k,pjN(r,k))+" "+pjN(r,k)+" 次").join("、")}</p>`:""}<p class="mut">${c.next?`再打工 ${c.left} 次升「${c.next}」`:"已經是最高職位了"}</p>
 ${statLine(r)?`<div class="mrow"><span><b>案底</b> <small class="mut">${statLine(r)}</small></span></div>`:""}
 ${alHtml(r)}
 <h3>個性與心情</h3><p><span class="sw on">${MOOD[moodOf(tickLocal(r,now()))][0]} ${MOOD[moodOf(tickLocal(r,now()))][1]}</span> <small class="mut">${MOOD[moodOf(tickLocal(r,now()))][2]}</small></p>${(r.items&&r.items.tr&&r.items.tr.length)?r.items.tr.map(k=>`<div class="mrow"><span><b>${TRAITS[k][0]}</b> <small class="mut">${TRAITS[k][1]}</small></span></div>`).join(""):`<p class="mut">還沒有個性特質。</p><div class="row" style="justify-content:flex-start"><button id="ltNew" class="pri">選個性</button></div>`}
 <h3>人生願望</h3>${wh}<h3>稱號</h3><p>${t.length?t.map(x=>`<span class="sw on">${esc(x)}</span>`).join(" "):'<span class="mut">還沒有稱號</span>'}</p><div class="row"><button id="lclose">關閉</button></div>`;
 $("lclose").onclick=()=>$("modal").classList.add("hide");if($("lwNew"))$("lwNew").onclick=()=>wishModal();if($("ltNew"))$("ltNew").onclick=()=>traitModal()}
function wishModal(){$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>選一個人生願望</h2><p class="mut">每達成一個里程碑，有獎金、稱號和動態公告。可以先跳過。</p><div class="list">${Object.entries(WISHES).map(([k,v])=>`<button data-wk="${k}" style="width:100%;text-align:left;margin-bottom:6px"><b>${v[0]}</b><br><small>${v[1]}：${v[2].join("、")}</small></button>`).join("")}</div><div class="row"><button id="wskip">先跳過</button></div>`;
 const pick=async k=>{try{apply(await rpc("town_wish",{rid:me,pin,k}));$("modal").classList.add("hide");if(k!="skip"){toast("願望訂好了");lifeModal()}}catch(e){toast(e.message)}};
 $("mbody").querySelectorAll("[data-wk]").forEach(b=>b.onclick=()=>pick(b.dataset.wk));$("wskip").onclick=()=>pick("skip")}
const KIND_ICON={callout:"🚪",calloutfail:"🙅",hospital:"🩺",visithosp:"🤝",report:"📜",civic:"🏛️",mayor:"🏛️",mischief:"😈",photo:"📸",forgive:"🤝",pk:"🥊",pkno:"🙅",kick:"🚪",level:"⭐",encounter:"💬",promo:"📈",wish:"🎯",duel:"✊",feed:"🍚",wash:"🛁",visit:"🏠",note:"📱",call:"📞",delivery:"🛵",gift:"🎁",thank:"💗",greet:"🙌",fight:"👊",egg:"🥚",prank:"💨",makeup:"🤝",wakeup:"⏰",wakefail:"⏰",cowork:"💼",feast:"🍖",tier:"💞",look:"✨",join:"🏡",found:"🏛️",expand:"🛣️",leave:"📦",meet:"👋",together:"🎉",crash:"💥",accident:"💦",passout:"😵",luck:"🍀",rent:"🧾",slash:"🔪",jail:"🚔",bail:"💰",visitjail:"🤝",jaillabor:"💼",escape:"🚔",parole:"🪪"};
const GOOD=["visithosp","feed","wash","visit","note","call","delivery","gift","thank","greet","makeup","cowork","feast"],BADK=["fight","egg","prank","wakeup","crash"];
let feedFilter="all",feedSeen=0;
function renderFeed(){renderRank();renderPeople();const all=((S&&S.events)||[]).filter(e=>e.kind!="rent"||e.actor==me).slice().sort((a,b)=>b.at.localeCompare(a.at)||b.id-a.id);
 const day=a=>new Date(Date.parse(a)+8*36e5).toISOString().slice(0,10),today=day(new Date(now()).toISOString()),yest=day(new Date(now()-864e5).toISOString());
 const hm=a=>{const d=new Date(Date.parse(a)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`};
 const names=Object.values(R).map(r=>r.name).sort((a,b)=>b.length-a.length);
 const bold=t=>{let h=esc(t);for(const n of names){const e=esc(n);h=h.split(e).join(`<b>${e}</b>`)}return h};
 const ev=all.filter(e=>feedFilter=="all"||(feedFilter=="me"&&(e.target==me||e.actor==me))||(feedFilter=="good"&&GOOD.includes(e.kind))||(feedFilter=="bad"&&BADK.includes(e.kind)));
 const ok=new Set(me?thankable().map(e=>e.id):[]),bad=new Set(me?grudges().map(e=>e.id):[]),shown=new Set();let lastDay="";
 // 未讀：別人對我做的、我還沒看過的
 const unread=all.filter(e=>e.target==me&&e.actor!=me&&e.id>feedSeen).length;$("feedBadge").textContent=unread?unread:"";$("feedBadge2").textContent=unread||"";$("feedBadge2").classList.toggle("hide",!unread);$("feedBadge").classList.toggle("hide",!unread||!$("tab-feed").classList.contains("hide"));
 $("feed").innerHTML=ev.length?ev.slice(0,40).map(e=>{const d=day(e.at);let head="";if(d!=lastDay){lastDay=d;head=`<div class="day">${d==today?"今天":d==yest?"昨天":d.slice(5).replace("-","/")}</div>`}
  const t=ok.has(e.id)&&!shown.has(e.actor);if(t)shown.add(e.actor);const g=bad.has(e.id)&&!shown.has("g"+e.actor);if(g)shown.add("g"+e.actor);
  const cls=e.target==me&&e.actor!=me?(BADK.includes(e.kind)?" bad":" mine"):"";
  const who=e.actor==me?e.target:e.actor;return head+`<div class="ev${cls}${who&&who!=me&&R[who]?" tap":""}" ${who&&who!=me&&R[who]?`data-who="${who}"`:""}><span class="ic">${KIND_ICON[e.kind]||"•"}</span><span class="tx">${bold(e.msg)}</span><span class="tm">${hm(e.at)}</span>${t||g?`<span class="ea">${t?`<button class="thx" data-t="${e.actor}">💗 謝謝</button>`:""}${g?`<button class="thx" data-g="${e.actor}">😤 報仇</button>`:""}</span>`:""}</div>`}).join(""):`<p class="mut">${feedFilter=="all"?"小鎮還很安靜。":"沒有符合的動態。"}</p>`;
 $("feed").querySelectorAll(".ev[data-who]").forEach(el=>el.onclick=e=>{if(e.target.closest("button"))return;focusPerson(+el.dataset.who)});
 $("feed").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>act("thank",{target:+b.dataset.t}));
 $("feed").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{walkToPerson(+b.dataset.g);toast("走過去找他算帳，到了就能扁他（報仇有加成）");$("stage").scrollIntoView({behavior:"smooth"})})}
// 面對面才能做的事：擊掌、扁他、和好
function faceActs(id){const roll=[];return [...faceActs0(id).map(b=>({...b,g:"face"})),...roll,...misActs(id)]}
// ── 惡趣味（town_mischief.sql）：全部不會死、有冷卻、每人每天最多被整 6 次、對方可掛免整牌；報復不扣好感、也可以原諒 ──
const MIS={splash:["潑水 💦","他清潔 −15、心情 −3 · 好感 −1",30],sticker:["貼「踢我」紙條 🦶","他名牌掛 1 小時「踢我」 · 好感 −1",60],fakelove:["假裝告白 💘","一半他害羞（好感 +1）、一半他氣炸（好感 −2）",60],snack:["偷零食 🍪","55% 被抓賠 €60、沒被抓到手一包 · 他要有零食",60],photo:["拍醜照貼到動態 📸","全鎮看得到 · 他心情 −5、好感 −2",60],swapseat:["換掉他的座位 🪑","只能在咖啡廳、餐廳裡面 · 好感 −1",30],doorbell:["按門鈴逃跑 🔔","站在他家門口 · 睡著的會被吵醒 · 好感 −1",30],fakepoop:["門口擺假便便 💩","站在他家門口 · 好感 −1",60]};
const todayTW=()=>new Date(now()+8*36e5).toISOString().slice(0,10);
function misBtn(id,k){const t=R[id],r=R[me],m=MIS[k],left=cdLeft(r,"ms"+k+id,m[2]);let why="";
 if(jailed(t))why="他被關著"; else if(k=="snack"&&!((t.items||{}).snack>0))why="他沒有零食";
 const b=dbtn(m[0],m[1],()=>doMis(k,id),why?0:left,"mis");return why?{...b,dis:why}:b}
function misActs(id){const t=R[id],r=R[me],out=[];if(!t||t.sleeping||r.sleeping||jailed(r))return out;
 for(const k of ["splash","sticker","fakelove","snack","photo"])out.push(misBtn(id,k));
 if((r.place=="cafe"||r.place=="restaurant")&&fin(r)&&fin(t)&&r.place==t.place)out.push(misBtn(id,"swapseat"));
 if(R[me]&&shouldForgive(id))out.push({...btn(`原諒 ${t.name} 🤝`,"他最近整過你 · 好感 +2、兩人心情 +3",()=>doMis("forgive",id),"mis")});return out}
// 在他家門口：按門鈴逃跑、擺假便便（他睡著也行，睡著的人不能被打但可以被整）
function doorMisActs(id){const r=R[me],t=R[id];if(!t||r.sleeping||jailed(r))return [];return [misBtn(id,"doorbell"),misBtn(id,"fakepoop")]}
// 他三天內整過你、你還沒原諒：從動態找（動態只留最近幾十筆，找得到才顯示）
const shouldForgive=id=>(S&&S.events||[]).some(e=>e.kind=="mischief"&&e.actor==id&&e.target==me&&Date.parse(e.at)>now()-3*864e5)&&!(S.events||[]).some(e=>e.kind=="forgive"&&e.actor==me&&e.target==id&&Date.parse(e.at)>now()-3*864e5);
async function doMis(a,id){try{const j=await rpc("town_mischief",{rid:me,pin,act:a,target:id});await refresh();spawnFx(MIS_FX[a]||"sparkle",me,id);playRoomFx(a,id);const t=`${j.msg||""}${j.rev?" · 報復不扣好感":""}`;toast(t);feedback(true,t)}catch(e){toast(e.message);feedback(false,e.message)}renderPanel()}
const MIS_FX={splash:"bubbles",sticker:"flash",fakelove:"hearts",snack:"eat",photo:"flash",swapseat:"fart",doorbell:"notes",fakepoop:"fart",forgive:"hearts"};
function faceActs0(id){const t=R[id],b=bondWith(id),mp=R[me].place,coop=[];
 if(mp=="office"&&t.place=="office")coop.push(btn(`和 ${t.name} 一起加班 💼`,"薪水加倍 · 2 小時一次",()=>act("cowork",{target:id})));
 if(mp=="restaurant"&&t.place=="restaurant")coop.push(btn(`請 ${t.name} 吃大餐 🍖`,"€600 · 兩人飽足 +70",()=>act("feast",{target:id})));
 const out=[...coop,btn(`和 ${t.name} 擊掌 🙌`,"兩人心情 +8 · 好感 +1 · 1 小時一次",()=>act("greet",{target:id})),
  ...(mp=="arena"&&t.place=="arena"?[btn(`邀請 ${t.name} 打一場 🥊`,"格鬥場不能直接扁人，要約定好才開打 · 他接受後三回合分勝負",()=>pkModal(id))]:[btn(`扁 ${t.name} 👊`,b>=30?"好麻吉之間是打打鬧鬧 · 好感不變":b>=10?"比精力、心情和運氣 · 好朋友只扣 1":"比精力、心情和運氣 · 好感 −3",()=>act("fight",{target:id}))])];
 if(b<0)out.push(btn(`和 ${t.name} 和好 🤝`,"好感 +8 · 2 小時一次",()=>act("makeup",{target:id})));if(b<0&&mp=="street"&&t.place=="street"&&isOn("jail"))out.push(btn(`砍 ${t.name} 🔪`,"只對有仇的人 · 他倒地送醫院、你可能被巡警關 1～3 小時 · 30 分鐘一次",()=>slashModal(t)));return out}
// 走到某人身邊：他在室內就走到那個地點的門口，在路上就走到他旁邊
function walkToPerson(id){const t=R[id];if(!t)return;sel=id;if(t.place.startsWith("home:")){const o=R[t.place.slice(5)];if(o){walkTo(t.place,o.id==me?door(o.slot):visitSpot(o.slot));return}}
 if(PLACES[t.place]){walkTo(t.place,PLACES[t.place].door);return}const w=walkers[id],g=[Math.round(w.x),Math.round(w.y)],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[g[0]+dx,g[1]+dy]).find(p=>!blocked(...p))||g;walkTo("street",nb)}
// 鏡頭移到某人身上，並打開跟他互動的按鈕
function focusPerson(id){if(!R[id]||!walkers[id])return;sel=id==me?null:id;const w=walkers[id];camFree=true;cam.x=(w.x+.5)*T;cam.y=(w.y+.5)*T;lastPanel="";renderPanel();$("stage").scrollIntoView({behavior:"smooth",block:"start"})}
// 地圖角落一排大頭貼：10 分鐘內有動作的人算在線上
let stripKey="";function renderStrip(){const list=Object.values(R).sort((a,b)=>(b.id==me)-(a.id==me)||a.slot-b.slot),on=r=>r.id==me||Date.parse(r.seen_at)>now()-10*6e4;
 const key=list.map(r=>r.id+":"+on(r)+":"+JSON.stringify(r.look)).join("|");if(key==stripKey)return;stripKey=key;
 $("strip").innerHTML=list.map(r=>`<button data-p="${r.id}" class="${on(r)?"on":"off"}" title="${esc(r.name)}${on(r)?" · 在線上":""}"><canvas width="28" height="34"></canvas><span>${esc(r.name.slice(0,4))}</span></button>`).join("");
 $("strip").querySelectorAll("[data-p]").forEach((b,i)=>{miniPerson(b.querySelector("canvas"),list[i].look);b.onclick=()=>focusPerson(+b.dataset.p)})}
function bondsModal(){const list=Object.values(R).filter(o=>o.id!=me).map(o=>({o,v:bondWith(o.id)})).sort((a,b)=>b.v-a.v);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>👥 人際關係</h2>${list.length?list.map(({o,v})=>`<div class="mrow"><span><b>${esc(o.name)}</b> <small class="mut">${esc(career(o).name)}${titlesOf(o).length?" · "+esc(titlesOf(o).slice(-1)[0]):""} · ${bondLabel(v)} · ${v>0?"+":""}${v}</small><i class="bond"><b style="left:50%;width:${Math.abs(v)/2}%;${v<0?`left:${50-Math.abs(v)/2}%;background:var(--bad)`:"background:var(--good)"}"></b></i><small class="mut">${tierHint(v)}</small></span><button data-w="${o.id}">互動</button></div>`).join(""):`<p class="mut">鎮上還沒有其他人，邀請朋友搬進來吧。</p>`}
  <p class="mut" style="margin-top:10px">送禮 +4、煮飯洗澡 +3、請吃大餐 +4、串門子／一起加班／外送／道謝 +2、擊掌／訊息／電話 +1；叫醒 −1、丟雞蛋 −1、惡作劇 −2、扁人 −3（好朋友 −1、好麻吉 0）、和好 +8。同一個人每天好感最多 +12／−6。好麻吉以上照顧對方效果 ×1.3。</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{$("modal").classList.add("hide");walkToPerson(+b.dataset.w)})}
// 新手提示：第一次進小鎮時顯示，看過就不再出現
function tipsWhenFree(n=0){let seen=null;try{seen=localStorage.getItem("town-tips")}catch(e){}if(seen||n>8)return;if($("modal").classList.contains("hide")&&$("away").classList.contains("hide"))showTips();else setTimeout(()=>tipsWhenFree(n+1),3000)}
function showTips(){let seen=null;try{seen=localStorage.getItem("town-tips")}catch(e){}if(seen)return;const el=$("tips");el.classList.remove("hide");
 el.innerHTML=`<b>👋 新手小提示</b><p>🗺️ 點地圖上的房子或地點，角色會自己走過去。</p><p>👆 點地圖上的人，可以傳訊息、打電話；走到他旁邊還能擊掌或扁他。</p><p>🍚 上面的需求會隨現實時間下降，快見底時下方會出現粉紅色的「建議下一步」。</p><small>繼續即表示同意<button id="tipT" style="all:unset;text-decoration:underline;cursor:pointer;padding:8px 4px">條款</button>與<button id="tipP" style="all:unset;text-decoration:underline;cursor:pointer;padding:8px 4px">隱私</button></small><div class="row"><button class="pri" id="tipok">知道了</button></div>`;$("tipT").onclick=()=>window.open("terms.html","_blank");$("tipP").onclick=()=>window.open("privacy.html","_blank");
 $("tipok").onclick=()=>{el.classList.add("hide");try{localStorage.setItem("town-tips","1")}catch(e){}}}
// 建議下一步：最缺的需求先處理，其次是錢、道謝、邀請朋友
function nextStep(r,p){if(r.sleeping||jailed(r)||(walkers[me]&&walkers[me].path.length))return null;const atHome=inside(r),chain=(...l)=>async()=>{for(const x of l)await act(...x)},homeDo=a=>()=>{if(p=="home:"+me){inside(r)?act(a):chain(["enter"],[a])()}else{pendingThen=chain(["enter"],[a]);goHouse(r.slot)}},goDo=(pl,a)=>()=>{pendingThen=chain([a]);walkTo(pl,PLACES[pl].door)};
 const [k,v]=NEEDS.map(k=>[k,r[k]]).sort((a,b)=>a[1]-b[1])[0];
 if(v<35){const sub=`${NEED_INFO[k][0]} ${NEED_INFO[k][1]}只剩 ${Math.round(v)}`;
  if(k=="hunger")return p=="restaurant"?(fin(r)?btn("吃一頓 🍽️",sub,()=>act("dine")):btn("進去吃一頓 🍽️",sub,async()=>{await enterRoom(p,true);await act("dine")})):atHome?btn("吃飯 🍚",sub,()=>act("eat")):btn("回家吃飯 🍚",sub,homeDo("eat"));
  if(k=="bladder")return atHome?btn("上廁所 🚽",sub,()=>act("toilet")):btn("回家上廁所 🚽",sub,homeDo("toilet"));
  if(k=="hygiene")return atHome?btn("洗澡 🛁",sub,()=>act("shower")):btn("回家洗澡 🛁",sub,homeDo("shower"));
  if(k=="energy")return atHome?btn("快速休息 😴",sub,()=>act("nap")):p=="cafe"&&!closedMsg("cafe")?(fin(r)?btn("喝咖啡 ☕",sub,()=>act("coffee")):btn("進去喝咖啡 ☕",sub,async()=>{await enterRoom(p,true);await act("coffee")})):!closedMsg("cafe")?btn("去咖啡廳 ☕",sub+" · 喝咖啡回精力",goDo("cafe","coffee")):btn("回家睡覺 😴",sub,homeDo("sleep"));
  return p=="park"||p=="plaza"?btn("玩一下 🎈",sub,()=>act("play")):btn("去公園走走 🎈",sub,goDo("park","play"))}
 if(r.money<200)return p=="office"?btn("打工 💼",`只剩 €${r.money}，賺點錢`,()=>act("work")):btn("去公司打工 💼",`只剩 €${r.money}`,goDo("office","work"));
 const du=((S&&S.duels)||[]).find(d=>d.b==me&&R[d.a]);if(du&&isOn("arcade"))return btn(`應戰 ${R[du.a].name} 的戰帖 ✊`,`猜拳賭 €${du.bet}`,()=>duelModal(du.a,du));
 const th=thankable()[0];if(th&&R[th.actor])return btn(`謝謝 ${R[th.actor].name} 💗`,"他剛照顧過你",()=>act("thank",{target:th.actor}));
 if(Object.keys(R).length<2&&R[me].mayor)return btn("邀請朋友搬進來 ✉️","小鎮只有你一個人",()=>$("invite").click());
 return null}
// 線上互動：用手機就能做，在哪裡都可以
function onlineActs(id){return onlineActs0(id).map(b=>({...b,g:"online"}))}
function onlineActs0(id){const t=R[id],gifts=((R[me].items||{}).gift)||0;return [
  btn(`📱 傳訊息給 ${t.name}`,"在哪都能傳 · 好感 +1 · 1 小時一次",()=>noteModal(id)),
  btn(`📞 打電話給 ${t.name}`,t.sleeping?"他在睡覺，會被你吵醒 · 好感 −1":"兩人心情 +5 · 好感 +1 · 1 小時一次",()=>act("call",{target:id})),
  btn(`🛵 幫 ${t.name} 叫外送`,"€200 · 他飽足 +30 · 好感 +2",()=>act("delivery",{target:id})),
  ...(isOn("arcade")?[btn(`✊ 向 ${t.name} 下戰帖`,"猜拳賭錢，他回來應戰",()=>duelModal(id))]:[]),
  btn(`🥊 邀請 ${t.name} 去格鬥場 PK`,"他 3 分鐘內回應 · 三回合分勝負、可下注 · 每對每小時最多 3 場",()=>pkModal(id)),
  btn(`📦 寄禮物給 ${t.name}`,gifts?`€60 運費 · 他心情 +20 · 背包 🎁${gifts}`:"先去超市買禮物",()=>gifts?act("gift",{target:id}):toast("背包沒有禮物，去超市買一份"))]}
// ── 街機小遊戲（在廣場玩，和莊家比，結果由伺服器決定）──
const RPS={r:["✊","石頭"],p:["✋","布"],s:["✌️","剪刀"]},CARD=n=>({1:"A",11:"J",12:"Q",13:"K"}[n%100]||String(n%100));
const bjTotal=cs=>{let t=0,a=0;for(let c of cs){c%=100;if(c==1){a++;t+=11}else t+=Math.min(c,10)}while(t>21&&a){t-=10;a--}return t};
// 牌：花色*100+點數（1 黑桃 2 紅心 3 方塊 4 梅花）
const SUIT=["","suitS","suitH","suitD","suitC"],SUITRED=[0,0,1,1,0];
const cardHTML=(n,hidden)=>{if(hidden)return `<span class="pcard back">?</span>`;const s=Math.floor(n/100);return `<span class="pcard${SUITRED[s]?" red":""}" data-c="${n}"><b>${CARD(n)}</b><img class="px" alt="" src="${window.PIXICON_NAME?PIXICON_NAME(SUIT[s]):""}"></span>`};
const spOf=(r,k)=>((r.items||{}).sp||{})[k]||0;
const ARCADE=[["rps","g_rps","猜拳","贏 ×2，平手退回"]],
 CASINO=[["hl","g_hl","比大小","一樣大退回，越難猜賠越多"],["wheel","g_wheel","美式輪盤","0／00，單號 ×36"],["bj","g_bj","21 點","6:5，莊家軟 17 要牌"],["dice","g_dice","骰寶","大小、三顆一樣、單點、總和"],["slots","g_slots","老虎機","三個一樣最高 ×100"],["keno","g_bingo","基諾","80 選 5，開 20"],["bacc","g_bacc","百家樂","押閒、莊、和"],["dg","g_dg","射龍門","莊家制，不賭可免費放棄"],["niu","g_niu","妞妞","和莊家比 5 張牌"],["sangong","g_sg","三公","三張牌比點，公牌型最大"],["shiba","g_sb","十八啦","四顆骰找一對比點"],["pigrace","g_pig","賽豬","單勝、前二名，看賠率下注"],["pj","g_pj","牌九","分兩墩和莊家比"]],
 SOLO=[["whack","🔨","打地鼠","30 秒，打越多越高分"],["memory","🧠","記憶翻牌","步數越少越高分"]];
// ── 籌碼面額與百家樂路單（賭場）──
const stackHtml=v=>`<span class="cstk">${chipStack(v).map((d,k)=>`<i class="chip s" style="--c:${CHIPD[d][1]};--k:${k}">${CHIPD[d][2]}</i>`).join("")}</span><b class="bamt">€${v}</b>`;
let betHist=[],lastBet=0,lastWin=null;
const chipTray=chips=>`<div class="betbar"><div class="crow"><div id="bstack" class="bstack">${stackHtml(gameBet)}</div><span id="glast" class="glast">${lastWin==null?"":lastWin>0?`上局 +€${lastWin}`:lastWin<0?`上局 −€${-lastWin}`:"上局 平手"}</span></div><div class="ctray">${CHIPD.map(([v,c,l])=>`<button class="chip" data-chip="${v}" style="--c:${c}"${v>chips?" disabled":""}>${l}</button>`).join("")}</div><div class="cacts"><button data-chip="undo">撤銷</button><button data-chip="again">同上注</button><button data-chip="clr">清除</button><button data-chip="all">全押</button></div></div>`;
function chipSync(){const ch=(CAS&&CAS.chips)||0;if(ch>=50&&gameBet>ch)gameBet=ch;const b=document.getElementById("bstack");if(b)b.innerHTML=stackHtml(gameBet);document.querySelectorAll("[data-chip]").forEach(x=>{const k=x.dataset.chip,v=+k;if(v)x.disabled=v>ch;else if(k=="undo")x.disabled=!betHist.length;else if(k=="again")x.disabled=!(lastBet>=50&&lastBet<=ch);else if(k=="clr")x.disabled=gameBet<=50&&!betHist.length;else if(k=="all")x.disabled=ch<50});const gl=document.getElementById("glast");if(gl)gl.textContent=lastWin==null?"":lastWin>0?`上局 +€${lastWin}`:lastWin<0?`上局 −€${-lastWin}`:"上局 平手";if(gl)gl.className="glast "+(lastWin>0?"good":lastWin<0?"bad":"")}
function roadsHtml(bh){bh=bh||"";if(!bh)return`<p class="mut">還沒有路單，玩幾局百家樂就會出現。</p>`;
 const bead=baccBead(bh),big=baccBig(bh),vis=big.slice(-18),nB=[...bh].filter(x=>x=="B").length,nP=[...bh].filter(x=>x=="P").length,nT=bh.length-nB-nP,nm={B:"莊",P:"閒",T:"和"};
 return`<div class="roads"><p class="mut">最近 ${bh.length} 局：<span class="rb">莊 ${nB}</span> <span class="rp">閒 ${nP}</span> <span class="rt">和 ${nT}</span></p><div class="rlab">珠盤路</div><div class="rgrid">${bead.slice(-12).map(col=>`<div>${col.map(x=>`<i class="bd ${x}">${x?nm[x]:""}</i>`).join("")}</div>`).join("")}</div><div class="rlab">大路</div><div class="rgrid">${vis.map(col=>`<div>${col.map(x=>`<i class="bg ${x.w}">${x.t?`<s></s>`:""}</i>`).join("")}</div>`).join("")}</div></div>`}
function roadsSync(){const e=document.getElementById("roads");if(e)e.innerHTML=roadsHtml(CAS&&CAS.bh)}
// 規則折疊：把遊戲區第一段說明搬進「規則」浮層（點開才顯示，不推動牌桌）
function foldRules(){const b=document.getElementById("rulesBtn"),pop=document.getElementById("rulesPop"),a=document.getElementById("gArea");if(!b||!pop||!a||b.dataset.f)return;const p=a.firstElementChild;if(!p||p.tagName!="P"||!p.classList.contains("mut")||p.textContent.length<30)return;b.dataset.f="1";pop.innerHTML=p.innerHTML;p.remove();b.onclick=()=>pop.classList.toggle("hide");pop.onclick=()=>pop.classList.add("hide")}
// 咪牌：結果在伺服器早已決定，這裡只是前端演出。牌一張張發進來蓋著，玩家按住牌面往上拖（拖遠就翻開、放手就彈回）；不碰的話自動一張張慢慢翻，「直接開牌」全翻，最多等 25 秒；翻完才 resolve（呼叫端這時才顯示點數、結果、籌碼數字）
const SQ_IN=240;
function squeezeDeal(show){return new Promise(res=>{const cards=[...show.querySelectorAll(".cards .pcard")];
 if(!cards.length||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))return res();
 let left=cards.length,fin=false,auto=0,hard=0;const sfx=n=>{try{window.SFX&&SFX.play(n)}catch(e){}};
 show.classList.add("felt");const skip=document.createElement("button"),hint=document.createElement("span");skip.className="sqskip";skip.textContent="直接開牌";hint.className="sqhint";hint.textContent="按住牌面往上拖，慢慢咪牌";show.append(skip,hint);
 const pending=()=>cards.filter(c=>c._cv&&!c._cv.dataset.o);
 const end=()=>{if(fin)return;fin=true;clearTimeout(auto);clearTimeout(hard);skip.remove();hint.remove();show.classList.add("hold");setTimeout(()=>{show.classList.remove("hold");res()},300)};
 const flip=(c,fast)=>{const cv=c._cv;if(!cv||cv.dataset.o)return;cv.dataset.o="1";cv.style.transition="transform .28s steps(5),opacity .28s";cv.style.transform="translateY(-130%)";cv.style.opacity="0";sfx("click");setTimeout(()=>{cv.remove();if(--left<=0)end()},fast?120:300)};
 const arm=ms=>{clearTimeout(auto);auto=setTimeout(function step(){if(fin)return;const p=pending();if(!p.length)return;flip(p[0]);auto=setTimeout(step,p.length>2?450:p.length>1?800:1200)},ms)};
 cards.forEach((c,i)=>{c.dataset.fx="1";c.classList.add("sq");c.style.setProperty("--d",i*SQ_IN+"ms");const cv=document.createElement("i");cv.className="sqc";cv.textContent="↑";c.append(cv);c._cv=cv;
  let sx=0,sy=0,dr=false;const H=c.offsetHeight||64;
  cv.addEventListener("pointerdown",e=>{dr=true;sx=e.clientX;sy=e.clientY;try{cv.setPointerCapture(e.pointerId)}catch(x){}cv.style.transition="none";clearTimeout(auto);e.preventDefault()});
  cv.addEventListener("pointermove",e=>{if(!dr)return;const dx=e.clientX-sx,dy=Math.min(0,e.clientY-sy),m=Math.hypot(dx,dy),mx=H*1.2,k=m>mx?mx/m:1;cv.style.transform=`translate(${dx*k}px,${dy*k}px)`;if(m>H*.75){dr=false;flip(c);arm(3500)}});
  const up=()=>{if(!dr){return}dr=false;if(!cv.dataset.o){cv.style.transition="transform .2s steps(4)";cv.style.transform=""}arm(3500)};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up)});
 skip.onclick=()=>pending().forEach((c,i)=>setTimeout(()=>flip(c,1),i*180));
 arm(cards.length*SQ_IN+900);hard=setTimeout(()=>pending().forEach(c=>flip(c,1)),12000)})}
const playRes=g=>{document.querySelectorAll("#gShow .gres").forEach(e=>{e.dataset.fx="1";e.classList.add("late");e.style.setProperty("--d","0ms")});try{if(window.SFX)SFX.play(g.win>g.bet?"coin":g.win<g.bet?"pay":"click")}catch(e){}};
let gameTab="",gameBet=50,gameHall="arcade",CAS=null;
const NIUC=c=>c==10?"妞妞":c==0?"沒妞":"妞"+c;
async function playGame(game,extra={},fn){if(["hl_start","bj_start","bacc","niu","dg_start","sangong","shiba","pj_start"].includes(game))DEALT.clear();const res=await rpc(fn||(game=="rps"?"town_game":"town_casino"),{rid:me,pin,game,bet:gameBet,...extra});R[me].money=res.money;if(res.casino){CAS={...(CAS||{}),...res.casino};updBud();lastBet=gameBet;betHist=[];if(res.game&&typeof res.game.win=="number")lastWin=res.game.win-(res.game.bet||gameBet)}renderNeeds();return res.game}
const casMin=iso=>iso?Math.max(1,Math.ceil((Date.parse(iso)-now())/60000)):0;
const chipLine=()=>CAS?`籌碼 €${CAS.chips}`:"";
function updBud(){const e=document.getElementById("gBud");if(e)e.textContent=""}
function casStatus(){if(!CAS)return"";const cash=R[me].money,ins=[1000,5000,20000,100000].filter(v=>v<cash),outs=[1000,5000,20000,100000].filter(v=>v<CAS.chips);
 return `<div class="cbal"><span>現金 <b>€${cash}</b></span><span>籌碼 <b>€${CAS.chips}</b></span><span>今天 ${CAS.rounds} 局 <b class="${CAS.net>=0?"good":"bad"}">${CAS.net>=0?"+":""}${CAS.net}</b></span></div>
 <div class="chips"><span class="clab">換入（1:1）</span>${ins.map(v=>`<button data-cin="${v}">€${v}</button>`).join("")}${cash>0?`<button data-cin="${cash}">全部現金</button>`:""}</div>
 <div class="chips"><span class="clab">換出（抽 1.5%）</span>${outs.map(v=>`<button data-cout="${v}">€${v}<small>−${Math.ceil(v*0.015)}</small></button>`).join("")}${CAS.chips>0?`<button data-cout="${CAS.chips}">全部<small>−${Math.ceil(CAS.chips*0.015)}</small></button>`:""}</div>
 <p class="mut cnote">走出賭場時，剩下的籌碼會自動換回現金（手續費 1.5%，無條件進位）。</p>`}
async function casinoOpen(tab){await ensureIn();try{CAS=await rpc("town_casino_state",{rid:me,pin,op:"view"})}catch(e){toast(e.message);return}gameHall="casino";gameTab=typeof tab=="string"?tab:"";betHist=[];if(gameBet>CAS.chips)gameBet=50;gamesModal()}
async function casDo(op,val){try{CAS=await rpc("town_casino_state",{rid:me,pin,op,val});R[me].money=CAS.money;renderNeeds();gamesModal()}catch(e){toast(e.message)}}
// 發牌臨場感：新出現的牌從牌堆滑進來、蓋牌翻面、一張一張發，結果文字等牌發完才出現；每個畫面只動「新」的牌；系統設定「減少動態效果」時不做
const DEALT=new Set(),DEAL_MS=170;
function dealFx(root){
 if(!root||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))return;
 let d=0,any=false;
 root.querySelectorAll(".cards").forEach((g,gi)=>g.querySelectorAll(".pcard").forEach((c,ci)=>{
  if(c.dataset.fx)return;c.dataset.fx="1";const key=gi+":"+ci+":"+(c.dataset.c||"b");if(DEALT.has(key))return;DEALT.add(key);
  c.classList.add("dealt");if(c.classList.contains("back"))c.classList.add("nocover");c.style.setProperty("--d",d+"ms");
  setTimeout(()=>{if(window.SFX)SFX.play("click")},d+120);d+=DEAL_MS;any=true}));
 root.querySelectorAll(".gres").forEach(e=>{if(e.dataset.fx)return;e.dataset.fx="1";if(!any)return;e.classList.add("late");e.style.setProperty("--d",(d+240)+"ms");
  const good=e.classList.contains("good"),bad=e.classList.contains("bad");setTimeout(()=>{if(window.SFX&&(good||bad))SFX.play(good?"coin":"pay")},d+280)});
 if(any){root.classList.add("felt");const p=document.createElement("p");p.className="dealer";p.textContent="莊家發牌中…";root.prepend(p);setTimeout(()=>p.remove(),d+250)}}
function gamesModal(){$("modal").classList.remove("hide");if(!window._dealObs){window._dealObs=new MutationObserver(()=>{dealFx($("gShow"));foldRules()});window._dealObs.observe($("mbody"),{childList:true,subtree:true})}const solo=SOLO.some(g=>g[0]==gameTab),menu=!gameTab;
 const gic=ic=>/^g_/.test(ic)&&window.PIXICON_NAME?`<img class="px" alt="" src="${PIXICON_NAME(ic)}">`:ic;
 const gm=l=>l.map(([k,ic,n,d])=>`<button class="gm" data-g="${k}"><span class="gi">${gic(ic)}</span><b>${n}</b><small>${d}${SOLO.some(g=>g[0]==k)?` · 最佳 ${spOf(R[me],k)}`:""}</small></button>`).join("");
 const hall=gameHall=="casino",bets=hall?[...[50,100,200,500,1000,2000,5000,10000,20000,50000,100000,500000,1000000].filter(b=>b<((CAS&&CAS.chips)||0)),...(CAS&&CAS.chips>=50?[CAS.chips]:[])]:[50,100,200,500,1000],hn=hall?"賭場":"街機";
 $("mbody").innerHTML=menu?(hall?`<h2>🎰 小豬賭場</h2><p class="mut">籌碼 €<b id="gMoney">${CAS?CAS.chips:0}</b> · 押注 €50 起，沒有上限 · 離場自動換回現金（1.5%）</p>${casStatus()}
  <h3 class="gh">押錢遊戲（莊家有優勢，玩越久越可能輸）</h3><div class="gmenu">${gm(CASINO)}</div><div class="row"><button id="mc">離開賭場</button></div>`
  :`<h2>🕹️ 小豬街機</h2><p class="mut">你有 €<b id="gMoney">${R[me].money}</b> · 押注 €50～€1000 · 押錢遊戲搬到小豬賭場了</p>
  <h3 class="gh">對電腦</h3><div class="gmenu">${gm(ARCADE)}</div><h3 class="gh">單機（不押錢，心情 +2）</h3><div class="gmenu">${gm(SOLO)}</div><div class="row"><button id="mc">離開街機</button></div>`)
  :`${(ttl=>hall?`<div class="tbar"><h2>${ttl}</h2><span class="tchip">籌碼 €<b id="gMoney">${CAS?CAS.chips:0}</b></span><button id="swBtn" class="rbtn">換桌</button><button id="rulesBtn" class="rbtn">規則</button></div><div class="gtabs hide" id="gTabs">${CASINO.map(g=>`<button data-g="${g[0]}" class="gt${g[0]==gameTab?" on":""}" title="${g[2]}">${gic(g[1])}<span>${g[2]}</span></button>`).join("")}</div><p class="mut godds">${(CASINO.find(g=>g[0]==gameTab)||[0,0,0,""])[3]}</p><div id="rulesPop" class="rpop hide"></div><p class="mut cdnote" id="gBud"></p>`:`<h2>${ttl}</h2><p class="mut">你有 €<b id="gMoney">${R[me].money}</b></p>`)((g=>gic(g[1])+" "+g[2])([...ARCADE,...CASINO,...SOLO].find(g=>g[0]==gameTab)))}
  ${solo?"":hall?((!CAS||CAS.chips<50)?`<p class="gres bad nochip">請先到櫃台換籌碼，現金不能直接賭</p>`:"")+"":`<div class="chips">押注 ${bets.map(b=>`<button data-bet="${b}" class="${gameBet==b?"on":""}">€${b}</button>`).join("")}</div>`}
  <div id="gArea" class="garea"></div>${!solo&&hall?chipTray((CAS&&CAS.chips)||0):""}<div class="row"><button id="gback">回${hn}選單</button><button id="mc">${hall?"收工離桌":"離開"+hn}</button></div>`;
 $("mc").onclick=()=>{gameTab="";$("modal").classList.add("hide");refresh().catch(()=>{})};
 if(!menu)$("gback").onclick=()=>{gameTab="";gamesModal()};
 $("mbody").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{gameTab=b.dataset.g;gamesModal()});
 if($("swBtn"))$("swBtn").onclick=()=>$("gTabs").classList.toggle("hide");
 $("mbody").querySelectorAll("[data-cin]").forEach(b=>b.onclick=()=>casDo("buy",+b.dataset.cin));
 $("mbody").querySelectorAll("[data-cout]").forEach(b=>b.onclick=()=>casDo("sell",+b.dataset.cout));
 if(menu)return;
 const betSync=()=>{$("mbody").querySelectorAll("[data-bet]").forEach(x=>x.classList.toggle("on",+x.dataset.bet==gameBet));const w=document.createTreeWalker($("gArea"),NodeFilter.SHOW_TEXT);for(let n;n=w.nextNode();)if(/押 [€$]\d+/.test(n.nodeValue))n.nodeValue=n.nodeValue.replace(/(押 [€$])\d+/g,"$1"+gameBet);$("gArea").dispatchEvent(new Event("betchg"))};
 $("mbody").querySelectorAll("[data-bet]").forEach(b=>b.onclick=()=>{gameBet=+b.dataset.bet;betSync()});
 $("mbody").querySelectorAll("[data-chip]").forEach(b=>b.onclick=()=>{const k=b.dataset.chip,ch=(CAS&&CAS.chips)||0,cap=Math.max(50,ch);if(k=="clr"){gameBet=50;betHist=[]}else if(k=="all"){gameBet=cap;betHist=[]}else if(k=="undo"){const u=betHist.pop();if(u)gameBet=Math.max(50,gameBet-u)}else if(k=="again"){if(lastBet>=50)gameBet=Math.min(cap,lastBet);betHist=[]}else{const add=Math.min(+k,cap-gameBet);if(add>0){gameBet+=add;betHist.push(add)}}betSync();chipSync()});
 const area=$("gArea"),money=()=>{$("gMoney").textContent=(gameHall=="casino"&&CAS?CAS.chips:R[me].money);if(gameHall=="casino"){chipSync();roadsSync()}},err=e=>{area.querySelector(".gres")?area.querySelector(".gres").textContent=e.message:toast(e.message)};
 const result=(g,extra="")=>{const win=g.win,b=g.bet||gameBet;return `<p class="gres ${win>b?"good":win==b?"":"bad"}">${win>b?`贏了 €${win-b}！`:win==b?"平手，退回押注":`輸了 €${b}`}${extra}</p>`};
 const lockBet=on=>$("mbody").querySelectorAll("[data-bet],[data-chip]").forEach(x=>x.disabled=on);
 if(gameTab=="rps"){area.innerHTML=`<p>出一個（押 €${gameBet}）：</p><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div id="gShow" class="gshow"></div>`;
  area.querySelectorAll("[data-m]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-m]").forEach(x=>x.disabled=true);const show=$("gShow");let i=0;const spin=setInterval(()=>{show.innerHTML=`<div class="vs"><b>${RPS[b.dataset.m][0]}</b> VS <b>${Object.values(RPS)[i++%3][0]}</b></div>`},90);
   try{const g=await playGame("rps",{choice:b.dataset.m});await new Promise(r=>setTimeout(r,700));clearInterval(spin);show.innerHTML=`<div class="vs"><b>${RPS[g.you][0]}</b> VS <b>${RPS[g.house][0]}</b></div><p class="mut">你出${RPS[g.you][1]}，莊家出${RPS[g.house][1]}</p>`+result(g);money()}catch(e){clearInterval(spin);show.innerHTML=`<p class="gres bad">${esc(e.message)}</p>`}
   area.querySelectorAll("[data-m]").forEach(x=>x.disabled=false)})}
 if(gameTab=="hl"){area.innerHTML=`<p class="mut">翻一張牌，猜下一張更大還是更小（一樣大退回押注）。越難猜中賠越多。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="hlGo">發牌（押 €${gameBet}）</button></div>`;
  $("hlGo").onclick=async()=>{try{const g=await playGame("hl_start");money();lockBet(true);const c=g.card%100,hi=13-c,lo=c-1,pay=k=>k?(11.64/k).toFixed(2):"—";
   $("gShow").innerHTML=`<div class="cards">${cardHTML(g.card)}${cardHTML(0,true)}</div>`;
   area.querySelector(".gbtns").innerHTML=`<button class="gbig" data-hl="hi" ${hi?"":"disabled"}>▲ 更大<span>×${pay(hi)}</span></button><button class="gbig" data-hl="lo" ${lo?"":"disabled"}>▼ 更小<span>×${pay(lo)}</span></button>`;
   area.querySelectorAll("[data-hl]").forEach(b=>b.onclick=async()=>{try{const r2=await playGame("hl_guess",{choice:b.dataset.hl});$("gShow").innerHTML=`<div class="cards">${cardHTML(r2.card)}${cardHTML(r2.next)}</div>`+result(r2);money();
    area.querySelector(".gbtns").innerHTML=`<button class="pri" id="hlGo">再來一局（押 €${gameBet}）</button>`;$("hlGo").onclick=()=>gamesModal()}catch(e){toast(e.message)}})}catch(e){toast(e.message)}}}
 if(gameTab=="wheel"){const lab=n=>n==37?"00":""+n,colr=n=>n==0||n==37?"#1e7a3a":RRED.includes(n)?"#b5252b":"#1b1b2f",N=38,ST=Math.PI*2/N,OUT=[["red","紅","×2"],["black","黑","×2"],["odd","單","×2"],["even","雙","×2"],["low","小 1–18","×2"],["high","大 19–36","×2"],["d1","1–12","×3"],["d2","13–24","×3"],["d3","25–36","×3"]],NAME=Object.fromEntries(OUT.map(o=>[o[0],o[1]]));let pick="red";
  area.innerHTML=`<p class="mut">美式輪盤：0 和 00 兩個綠格，莊家優勢 5.26%。紅黑／單雙／大小賠 1 倍，三分之一區賠 2 倍，單一號碼賠 35 倍；開出 0 或 00，外圍全輸。</p><div class="wheelbox"><canvas id="wh" width="240" height="240"></canvas><div class="wptr">▼</div></div>
  <div class="gbtns">${OUT.map(([k,n,x])=>`<button class="gbig sm" data-w="${k}">${n}<span>${x}</span></button>`).join("")}</div>
  <div class="bnums wnums">${[0,37,...Array.from({length:36},(_,i)=>i+1)].map(n=>`<button data-wn="${n}" style="color:${n==0||n==37?"#7CFC8A":RRED.includes(n)?"#ff8a80":"#fff"}">${lab(n)}</button>`).join("")}</div>
  <p class="mut" id="whPick"></p><div class="gbtns"><button class="pri" id="whGo">轉！（押 €${gameBet}）</button></div><div id="gShow"></div>`;
  const sel=()=>{area.querySelectorAll("[data-w]").forEach(b=>b.classList.toggle("on",pick==b.dataset.w));area.querySelectorAll("[data-wn]").forEach(b=>b.classList.toggle("on",pick=="n:"+lab(+b.dataset.wn)));$("whPick").textContent="押："+(pick.startsWith("n:")?"單號 "+pick.slice(2)+"（×36）":NAME[pick])};
  area.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{pick=b.dataset.w;sel()});area.querySelectorAll("[data-wn]").forEach(b=>b.onclick=()=>{pick="n:"+lab(+b.dataset.wn);sel()});sel();
  const cv2=$("wh"),m=cv2.getContext("2d");let ang=0;const draw=a=>{m.clearRect(0,0,240,240);for(let i=0;i<N;i++){const a0=a+i*ST-Math.PI/2-ST/2;m.beginPath();m.moveTo(120,120);m.arc(120,120,112,a0,a0+ST);m.fillStyle=colr(RWHEEL[i]);m.fill();m.strokeStyle="#0b0b14";m.lineWidth=1.5;m.stroke();
    m.save();m.translate(120,120);m.rotate(a0+ST/2);m.fillStyle="#fff";m.font="9px Cubic11,monospace";m.textAlign="right";m.fillText(lab(RWHEEL[i]),106,3);m.restore()}m.beginPath();m.arc(120,120,16,0,7);m.fillStyle="#fff";m.fill();m.stroke()};draw(0);
  $("whGo").onclick=async()=>{$("whGo").disabled=true;try{const g=await playGame("wheel",{choice:pick});const target=-RWHEEL.indexOf(g.slot)*ST,start=ang,end=target-Math.PI*2*(5+Math.floor(Math.random()*2)),t0=performance.now();
   await new Promise(res=>{const step=t=>{const k=Math.min(1,(t-t0)/2800),e=1-Math.pow(1-k,3);ang=start+(end-start)*e;draw(ang);if(k<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)});ang=target;
   $("gShow").innerHTML=result(g,` · 開出 ${g.label}（${g.color=="red"?"紅":g.color=="black"?"黑":"綠"}）`);money()}catch(e){toast(e.message)}$("whGo").disabled=false}}
 if(gameTab=="bj"){area.innerHTML=`<p class="mut">比莊家接近 21 點又不爆。莊家軟 17 也要牌（補到硬 17 以上）。開局 21 點只賠 6:5（×2.2），沒有加倍與分牌。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="bjGo">發牌（押 €${gameBet}）</button></div>`;
  const show=(g)=>{const p=bjTotal(g.p),d=bjTotal(g.d);$("gShow").innerHTML=`<p>莊家 <b>${g.done?d:"?"}</b></p><div class="cards">${g.d.map(c=>cardHTML(c)).join("")}${g.done?"":cardHTML(0,true)}</div><p>你 <b>${p}</b>${g.bust?" 爆了！":g.bj?" 21 點！":""}</p><div class="cards">${g.p.map(c=>cardHTML(c)).join("")}</div>`+(g.done?result(g):"");
   lockBet(!g.done);area.querySelector(".gbtns").innerHTML=g.done?`<button class="pri" id="bjGo">再來一局（押 €${gameBet}）</button>`:`<button class="gbig" id="bjHit">要牌</button><button class="gbig" id="bjStand">停牌</button>`;
   if(g.done){$("bjGo").onclick=()=>gamesModal();money()}else{$("bjHit").onclick=async()=>{try{show(await playGame("bj_hit"))}catch(e){toast(e.message)}};$("bjStand").onclick=async()=>{try{show(await playGame("bj_stand"))}catch(e){toast(e.message)}}}};
  $("bjGo").onclick=async()=>{try{show(await playGame("bj_start"));money()}catch(e){toast(e.message)}}}

 if(gameTab=="dice"){const D=["1","2","3","4","5","6"],SUMS=[4,5,6,7,8,9,10,11,12,13,14,15,16,17];area.innerHTML=`<p class="mut">骰寶：三顆骰。押大（11～17）或小（4～10）賠 1 倍，三顆一樣通殺；押「三顆一樣」賠 30 倍；押單一點數，出現 1、2、3 顆賠 1、2、3 倍；押總和（4～17）賠 6～60 倍。莊家都有優勢。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="gbig" data-d="big">大<span>×2</span></button><button class="gbig" data-d="small">小<span>×2</span></button><button class="gbig" data-d="any3">三顆一樣<span>×31</span></button></div><div class="gbtns">${D.map(n=>`<button class="gbig sm" data-d="${n}">${n}</button>`).join("")}</div><p class="mut">押總和</p><div class="gbtns">${SUMS.map(n=>`<button class="gbig sm" data-d="s${n}">${n}<span>×${DSUM[n]}</span></button>`).join("")}</div>`;
  const die=n=>`<span class="pcard die">${n}</span>`;
  area.querySelectorAll("[data-d]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-d]").forEach(x=>x.disabled=true);const show=$("gShow");const spin=setInterval(()=>{show.innerHTML=`<div class="cards">${[0,0,0].map(()=>die(1+Math.floor(Math.random()*6))).join("")}</div>`},80);
   try{const g=await playGame("dice",{choice:b.dataset.d});await new Promise(r=>setTimeout(r,700));clearInterval(spin);const sum=g.dice.reduce((a,x)=>a+x,0);show.innerHTML=`<div class="cards">${g.dice.map(die).join("")}</div><p class="mut">合計 ${sum}${g.dice[0]==g.dice[1]&&g.dice[1]==g.dice[2]?" · 三顆一樣（大小通殺）":""}</p>`+result(g);money()}catch(e){clearInterval(spin);show.innerHTML=`<p class="gres bad">${esc(e.message)}</p>`}
   area.querySelectorAll("[data-d]").forEach(x=>x.disabled=false)})}
 if(gameTab=="slots"){const SY=['<b class="s7">7</b>',"🔔","⭐","🍀","🥚","💰"],PAY=SLPAY;
  area.innerHTML=`<p class="mut">三個一樣：${SY.map((y,i)=>`${y}×${PAY[i]}`).join(" ")}；剛好兩個一樣 ×1.2。越上面的圖案越少出現。累積大獎：每注 1% 進獎池，三個 7 另外拿獎池（押 €1000 以上拿整池，押越少拿越少）。</p><div class="jpbar">💎 累積大獎 €<b id="jpv">${(CAS&&CAS.jp)||0}</b></div><div class="reels" id="reels">${[0,1,2].map(()=>`<div class="reel">${SY[0]}</div>`).join("")}</div><div class="gbtns"><button class="pri" id="slGo">拉霸（押 €${gameBet}）</button></div><div id="gShow"></div>`;
  $("slGo").onclick=async()=>{$("slGo").disabled=true;const rs=[...area.querySelectorAll(".reel")];rs.forEach(r=>delete r.dataset.stop);const spin=setInterval(()=>rs.forEach(r=>{if(!r.dataset.stop)r.innerHTML=SY[Math.floor(Math.random()*6)]}),70);
   try{const g=await playGame("slots");for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,500));if(i==2)clearInterval(spin);rs[i].dataset.stop=1;rs[i].innerHTML=SY[g.reels[i]]}
    if(g.pool!=null){CAS.jp=g.pool;$("jpv").textContent=g.pool}$("gShow").innerHTML=result(g,g.jp>0?`<br>💎 中了累積大獎 +€${g.jp}！`:"");money()}catch(e){clearInterval(spin);toast(e.message)}$("slGo").disabled=false}}
 if(gameTab=="keno"){let pick=[];area.innerHTML=`<p class="mut">基諾：1～80 選 5 個號碼，開 20 個。中 2 個退回押注（×1），中 3 個 ×3，中 4 個 ×16，中 5 個 ×200；中 0～1 個輸掉（莊家優勢約 15%）。</p><div class="bnums knums">${Array.from({length:80},(_,i)=>`<button data-n="${i+1}">${i+1}</button>`).join("")}</div><div class="gbtns"><button class="pri" id="bgGo" disabled>選滿 5 個再開獎（押 €${gameBet}）</button></div><div id="gShow"></div>`;
  const nums=()=>[...area.querySelectorAll("[data-n]")];
  nums().forEach(b=>b.onclick=()=>{const n=+b.dataset.n;if(pick.includes(n))pick=pick.filter(x=>x!=n);else if(pick.length<5)pick.push(n);nums().forEach(x=>x.classList.toggle("on",pick.includes(+x.dataset.n)));$("bgGo").disabled=pick.length!=5;$("bgGo").textContent=pick.length==5?`開獎（押 €${gameBet}）`:`選滿 5 個再開獎（${pick.length}/5）`});
  $("bgGo").onclick=async()=>{$("bgGo").disabled=true;try{const g=await playGame("keno",{choice:pick.join(",")});nums().forEach(x=>{const n=+x.dataset.n;x.classList.toggle("hit",g.draw.includes(n));x.disabled=true});
   $("gShow").innerHTML=`<p class="mut">開出 ${g.draw.slice().sort((a,b)=>a-b).join("、")} · 中 ${g.hit} 個</p>`+result(g);money();area.querySelector(".gbtns").innerHTML=`<button class="pri" id="bgAgain">再來一局</button>`;$("bgAgain").onclick=()=>gamesModal()}catch(e){toast(e.message);$("bgGo").disabled=false}}}

 const pg2=(g,x)=>playGame(g,x,"town_casino"),cardsH=cs=>`<div class="cards">${cs.map(c=>cardHTML(c)).join("")}</div>`;
 if(gameTab=="bacc"){area.innerHTML=`<p class="mut">閒莊各發 2～3 張，點數接近 9 贏（A=1、10JQK=0、取個位）。閒 ×2，莊 ×2（莊以 6 點贏只賠 ×1.5，免佣），和 ×9；和局時押閒莊退回押注。</p><div class="gbtns"><button class="gbig" data-b="p">閒<span>×2</span></button><button class="gbig" data-b="b">莊<span>×2（6 點 ×1.5）</span></button><button class="gbig" data-b="t">和<span>×9</span></button></div><div id="gShow" class="gshow"></div><details class="roadsd"><summary>路單</summary><div id="roads">${roadsHtml(CAS&&CAS.bh)}</div></details>`;
  area.querySelectorAll("[data-b]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-b]").forEach(x=>x.disabled=true);try{const g=await pg2("bacc",{choice:b.dataset.b});const side=g.pt>g.bt?"閒贏":g.bt>g.pt?"莊贏":"和局";
   $("gShow").innerHTML=`<p>閒 <b class="tt">?</b></p>${cardsH(g.p)}<p>莊 <b class="tt">?</b></p>${cardsH(g.b)}`;await squeezeDeal($("gShow"));const tt=$("gShow").querySelectorAll(".tt");tt[0].textContent=g.pt;tt[1].textContent=g.bt;$("gShow").insertAdjacentHTML("beforeend",`<p class="mut">${side}</p>`+result(g));playRes(g);money()}catch(e){$("gShow").innerHTML=`<p class="gres bad">${esc(e.message)}</p>`}
   area.querySelectorAll("[data-b]").forEach(x=>x.disabled=false)})}
if(gameTab=="dg"){area.innerHTML=`<p class="mut">射龍門（莊家制，沒有入場費和彩池）：先看兩張龍門牌，不想賭可以免費放棄。第三張嚴格在兩張之間才贏，賠率看中間有幾個點數（越窄賠越多，畫面上會寫）；撞柱（同點）輸 2 倍，兩張龍門同點又撞中輸 3 倍；其他輸 1 倍。兩張龍門同點時改押「更大」或「更小」。兩張相鄰自動重發。押注要有 3 倍籌碼。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="dgGo">發龍門牌</button></div>`;
  const deal=async()=>{try{const g=await playGame("dg_start",{bet:0});const gt=g.gates,show=$("gShow");money();
   show.innerHTML=`<div class="cards">${cardHTML(gt[0])}${cardHTML(0,true)}${cardHTML(gt[1])}</div><p class="mut">${g.redeal?`相鄰重發 ${g.redeal} 次（免費）· `:""}${g.same?"兩張龍門同點，猜第三張更大或更小":`贏的話賠 ×${(1+g.pay).toFixed(2)}`}</p>`;
   area.querySelector(".gbtns").innerHTML=(g.same?[["hi","更大",g.canHi,g.payHi],["lo","更小",g.canLo,g.payLo]].filter(x=>x[2]).map(([k,n,,p])=>`<button class="gbig" data-dg="${k}">${n}<span>×${(1+p).toFixed(2)}</span></button>`).join(""):`<button class="gbig" data-dg="in">玩！<span>押 €${gameBet}</span></button>`)+`<button class="gbig" data-dg="pass">放棄<span>免費</span></button>`;
   area.querySelectorAll("[data-dg]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-dg]").forEach(x=>x.disabled=true);try{const r2=await playGame("dg_play",{choice:b.dataset.dg});
    if(r2.pass)show.innerHTML=`<p class="gres">放棄了（免費）</p>`;else show.innerHTML=`<div class="cards">${cardHTML(gt[0])}${cardHTML(r2.card)}${cardHTML(gt[1])}</div><p class="gres ${r2.net>0?"good":"bad"}">${r2.net>0?`贏了 €${r2.net}！`:r2.mult>1?`撞柱！輸了 €${-r2.net}`:`輸了 €${-r2.net}`}</p>`;
    money();area.querySelector(".gbtns").innerHTML=`<button class="pri" id="dgGo">再發一局</button>`;$("dgGo").onclick=deal}catch(e){toast(e.message);area.querySelectorAll("[data-dg]").forEach(x=>x.disabled=false)}})}catch(e){toast(e.message)}};
  $("dgGo").onclick=deal}
 if(gameTab=="niu"){area.innerHTML=`<p class="mut">各 5 張牌，找 3 張湊成 10 的倍數，剩 2 張的個位數是妞點（0 = 妞妞最大，找不到 = 沒妞）。比大小，最大一張也同點算平手退押注（不比花色）。贏家牌型決定倍數，輸家付同樣倍數：沒妞、妞 1～6 = 1 倍；妞 7、8、9 = 2 倍；妞妞 = 3 倍（現金要有押注 3 倍）。你沒妞且沒有 Q 以上的牌：莊家直接贏（照莊家牌型付）。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="nGo">開牌（押 €${gameBet}）</button></div>`;
  $("nGo").onclick=async()=>{$("nGo").disabled=true;try{const g=await pg2("niu");$("gShow").innerHTML=`<p>莊家 <b class="tt">?</b></p>${cardsH(g.b)}<p>你 <b class="tt">?</b></p>${cardsH(g.p)}`;await squeezeDeal($("gShow"));{const tt=$("gShow").querySelectorAll(".tt");tt[0].textContent=NIUC(g.bcl);tt[1].textContent=NIUC(g.pcl)}$("gShow").insertAdjacentHTML("beforeend",(g.win>g.bet?`<p class="gres good">贏了 €${g.win-g.bet}！</p>`:g.win==g.bet?`<p class="gres">平手，退回押注</p>`:`<p class="gres bad">${g.forced?"沒妞又沒有 Q 以上，莊家直接贏 · ":""}輸了 €${g.bet+g.pen}</p>`));playRes(g);money()}catch(e){toast(e.message)}$("nGo").disabled=false;$("nGo").textContent=`再來一局（押 €${gameBet}）`}}
 if(!document.getElementById("c3css"))document.head.insertAdjacentHTML("beforeend",`<style id="c3css">.die{display:inline-block;width:32px;height:32px;line-height:32px;margin:2px;text-align:center;background:#f4f0e6;color:#1b1b2f;border:2px solid #111;clip-path:polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))}.ptile{display:inline-flex;flex-direction:column;margin:3px;border:2px solid #111;background:#f4f0e6;color:#1b1b2f;padding:2px}.ptile i{display:grid;grid-template-columns:repeat(3,6px);grid-template-rows:repeat(3,6px);gap:1px;padding:2px;font-style:normal}.ptile i+i{border-top:2px solid #111}.ptile i s{display:block;width:6px;height:6px}.ptile i s.d{background:#1b1b2f}.ptile i.rd s.d{background:#c0392b}.ptile small{font-size:11px;text-align:center;color:#1b1b2f}.lane{position:relative;height:30px;border-bottom:2px dashed #3b6b48;margin:2px 0}.lane b{position:absolute;right:10px;top:6px;font-size:11px;color:#fff}.lane .pg{width:24px;height:24px}.lane .fl{position:absolute;right:0;top:0;bottom:0;width:6px;background:#fff}.track{background:#2e7d4a;padding:6px;margin:6px 0;border:2px solid #111}.pgbet .gbig.on{outline:2px solid #ffd54a}.pjsp{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.pjsp button{min-height:44px}</style>`);
 const dieH=ds=>ds.map(d=>`<span class="die">${d}</span>`).join(""),pipH=(n,rd)=>{const P={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]||[];return `<i${rd?' class="rd"':""}>${[...Array(9)].map((_,k)=>`<s${P.includes(k)?' class="d"':""}></s>`).join("")}</i>`},tileH=t=>{const [a,b]=PJPIPS[t];return `<span class="ptile">${pipH(a,a==1||a==4)}${pipH(b,b==1||b==4)}<small>${PJNAME[pjType(t)]}</small></span>`};
 const verdict=g=>`<p class="gres ${g.win>g.bet?"good":g.win==g.bet?"":"bad"}">${g.win>g.bet?`贏了 €${g.win-g.bet}！`:g.win==g.bet?"平手，退回押注":`輸了 €${g.bet}`}</p>`;
 if(gameTab=="sangong"){area.innerHTML=`<p class="mut">你和莊家各 3 張牌（同一副 52 張）。A=1、2～9 原點、10／J／Q／K 算 0 點，三張加總取個位。牌型大小：大三公（三張同點）＞小三公（三張都是 J／Q／K）＞ 9 點～0 點。同點比最大一張（K 最大、A 最小），還一樣就平手退回押注。贏拿回 ×1.95，輸掉押注。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="sgGo">發牌（押 €${gameBet}）</button></div>`;
  $("sgGo").onclick=async()=>{$("sgGo").disabled=true;try{const g=await pg2("sangong");$("gShow").innerHTML=`<p>莊家 <b class="tt">?</b></p>${cardsH(g.b)}<p>你 <b class="tt">?</b></p>${cardsH(g.p)}`;await squeezeDeal($("gShow"));const tt=$("gShow").querySelectorAll(".tt");tt[0].textContent=sgName(g.bc);tt[1].textContent=sgName(g.pc);$("gShow").insertAdjacentHTML("beforeend",verdict(g));playRes(g);money()}catch(e){toast(e.message)}$("sgGo").disabled=false;$("sgGo").textContent=`再來一局（押 €${gameBet}）`}}
 if(gameTab=="shiba"){area.innerHTML=`<p class="mut">各擲 4 顆骰。一對＋兩顆不同點：點數 = 另外兩顆相加（3～11）；兩對：點數 = 較大那一對相加；四顆同點「通殺」最大；三顆同點或四顆都不同會自動重擲。比點數，同點平手退回押注。贏拿回 ×1.95，輸掉押注。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="sbGo">擲骰（押 €${gameBet}）</button></div>`;
  const nm=v=>v==100?"四同通殺":v+" 點";
  $("sbGo").onclick=async()=>{$("sbGo").disabled=true;try{const g=await pg2("shiba");const sh=$("gShow");let i=0;const spin=setInterval(()=>{const r4=()=>[0,0,0,0].map(()=>1+Math.floor(Math.random()*6));sh.innerHTML=`<p>莊家</p>${dieH(r4())}<p>你</p>${dieH(r4())}`;if(++i>8)clearInterval(spin)},90);
   await new Promise(r=>setTimeout(r,matchMedia("(prefers-reduced-motion: reduce)").matches?0:800));clearInterval(spin);if(window.SFX)SFX.play("click");
   sh.innerHTML=`<p>莊家 <b>${nm(g.bv)}</b></p>${dieH(g.b)}<p>你 <b>${nm(g.pv)}</b></p>${dieH(g.p)}`+verdict(g);playRes(g);money()}catch(e){toast(e.message)}$("sbGo").disabled=false;$("sbGo").textContent=`再擲一次（押 €${gameBet}）`}}
 if(gameTab=="pigrace"){let kind="w",pick=1;const od=()=>kind=="w"?PIGO1:PIGO2;
  area.innerHTML=`<p class="mut">6 隻小豬賽跑，勝率 ${PIGW.join("／")}%。單勝：押的小豬第一名才贏；前二名：押的小豬進前二就贏。賠率寫在按鈕上（返還率約 0.93～0.95，莊家略有優勢）。</p><div class="gbtns"><button class="gbig" data-k="w">單勝</button><button class="gbig" data-k="t">前二名</button></div><div class="gbtns pgbet" id="pgB"></div><div class="track" id="trk"></div><div id="gShow"></div><div class="gbtns"><button class="pri" id="pgGo">開跑（押 €${gameBet}）</button></div>`;
  const pig=window.PIXICON_NAME?`<img class="px pg" alt="" src="${PIXICON_NAME("g_pig")}">`:"";
  const lanes=()=>$("trk").innerHTML=[1,2,3,4,5,6].map(i=>`<div class="lane"><b>${i}</b><span id="pg${i}" style="position:absolute;left:2px;top:2px">${pig}</span><span class="fl"></span></div>`).join("");
  const sel=()=>{area.querySelectorAll("[data-k]").forEach(b=>b.classList.toggle("on",b.dataset.k==kind));$("pgB").innerHTML=[1,2,3,4,5,6].map(i=>`<button class="gbig sm${pick==i?" on":""}" data-p="${i}">${i} 號<span>×${(od()[i-1]/10).toFixed(1)}</span></button>`).join("");area.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{pick=+b.dataset.p;sel()})};
  area.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{kind=b.dataset.k;sel()});sel();lanes();
  $("pgGo").onclick=async()=>{$("pgGo").disabled=true;try{const g=await pg2("pigrace",{choice:kind+":"+pick});lanes();const rank={};g.order.forEach((p,r)=>rank[p]=r);const T=i=>4200+rank[i]*420,reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,W=()=>Math.max(60,$("trk").clientWidth-60),t0=performance.now();
   await new Promise(done=>{const step=()=>{const t=performance.now()-t0;let fin=true;for(let i=1;i<=6;i++){const f=Math.min(1,t/T(i));if(f<1)fin=false;const pr=f<1?Math.max(0,f+Math.sin(t/110+i*2)*0.015*(1-f)):1;const e=$("pg"+i);if(e)e.style.left=(2+pr*W())+"px"}if(window.SFX&&Math.floor(t/260)!=Math.floor((t-16)/260))SFX.play("step");if(fin)done();else requestAnimationFrame(step)};if(reduce){for(let i=1;i<=6;i++){const e=$("pg"+i);if(e)e.style.left=(2+W()*(1-rank[i]*0.03))+"px"}done()}else step()});
   $("gShow").innerHTML=`<p class="mut">名次：${g.order.map((p,r)=>`${r+1}. ${p} 號`).join("　")}</p>`+verdict(g);playRes(g);money()}catch(e){toast(e.message)}$("pgGo").disabled=false;$("pgGo").textContent=`再跑一場（押 €${gameBet}）`}}
 if(gameTab=="pj"){area.innerHTML=`<p class="mut">簡化牌九：32 張，你和莊家各 4 張，分成兩墩（每墩 2 張）。大的墩算後墩：後墩比後墩、前墩比前墩，墩平手算莊家贏。墩大小：至尊（丁三＋二四）＞文牌對子（天、地、人、鵝、梅、長三、板凳、斧頭、紅頭十、高腳七、零霖六）＞點數（兩張點數相加取個位 9～0，同點比較大的那張）。兩墩都贏拿回 ×1.75，一勝一負退回押注，兩墩都輸輸掉押注。看完牌自己選分法；莊家固定選前墩最大的分法。</p><div id="gShow" class="gshow"></div><div class="gbtns"><button class="pri" id="pjGo">發牌（押 €${gameBet}）</button></div>`;
  const SPL=[[0,1,2,3],[0,2,1,3],[0,3,1,2]],dn=(t1,t2)=>{const x=pjType(t1),y=pjType(t2);if((x==19&&y==20)||(x==20&&y==19))return 2000;if(x==y&&x<=10)return 1000+10*(21-x);return 100*((PJTYPE_PIPS[x]+PJTYPE_PIPS[y])%10)+Math.max(21-x,21-y)};
  $("pjGo").onclick=async()=>{$("pjGo").disabled=true;try{const g=await pg2("pj_start");money();lockBet(true);const sh=$("gShow");
   sh.innerHTML=`<p>你的 4 張牌，選分法：</p><div>${g.p.map(t=>tileH(t)).join("")}</div>`;
   area.querySelector(".gbtns").innerHTML=`<div class="pjsp">${SPL.map((s,k)=>`<button class="gbig" data-s="${k}">${PJNAME[pjType(g.p[s[0]])]}＋${PJNAME[pjType(g.p[s[1]])]}｜${PJNAME[pjType(g.p[s[2]])]}＋${PJNAME[pjType(g.p[s[3]])]}</button>`).join("")}</div>`;
   area.querySelectorAll("[data-s]").forEach(b=>b.onclick=async()=>{area.querySelectorAll("[data-s]").forEach(x=>x.disabled=true);try{const r2=await pg2("pj_play",{choice:b.dataset.s,bet:0});const ps=SPL[r2.split],ds=SPL[r2.dsplit],pa=[[r2.p[ps[0]],r2.p[ps[1]]],[r2.p[ps[2]],r2.p[ps[3]]]],da=[[r2.d[ds[0]],r2.d[ds[1]]],[r2.d[ds[2]],r2.d[ds[3]]]],ord=a=>a.slice().sort((u,v)=>dn(v[0],v[1])-dn(u[0],u[1])),pD=ord(pa),dD=ord(da),row=(lab,d,sc)=>`<p>${lab} <b>${pjDunName(sc)}</b></p><div>${d.map(tileH).join("")}</div>`;
     sh.innerHTML=row("莊家後墩",dD[0],r2.dhs)+row("你的後墩",pD[0],r2.ph)+`<p class="mut">後墩：${r2.hw?"你贏":"莊家贏（平手算莊）"}</p>`+row("莊家前墩",dD[1],r2.dl)+row("你的前墩",pD[1],r2.pl)+`<p class="mut">前墩：${r2.lw?"你贏":"莊家贏（平手算莊）"}</p>`+verdict(r2);playRes(r2);money();
     area.querySelector(".gbtns").innerHTML=`<button class="pri" id="pjGo">再來一局</button>`;$("pjGo").onclick=()=>gamesModal()}catch(e){toast(e.message);area.querySelectorAll("[data-s]").forEach(x=>x.disabled=false)}})}catch(e){toast(e.message);$("pjGo").disabled=false}}}
 // 單機：前端自己玩，結束後只把個人最佳分數送給伺服器（不給錢）
 const sendScore=async(game,score)=>{try{const r=await rpc("town_score",{rid:me,pin,game,score});const it=R[me].items=R[me].items||{};it.sp=it.sp||{};if(score>(it.sp[game]||0))it.sp[game]=score;return r}catch(e){toast(e.message);return null}};
 const soloEnd=async(game,score,note)=>{const r=await sendScore(game,score);$("gShow").innerHTML=`<p class="gres good">得分 <b>${score}</b>${note||""}</p><p class="mut">個人最佳 ${r?r.best:spOf(R[me],game)}${r&&r.gain?" · 心情 +"+r.gain:""}</p><div class="gbtns"><button class="pri" id="sgAgain">再玩一次</button></div>`;$("sgAgain").onclick=()=>gamesModal()};
 if(gameTab=="whack"){area.innerHTML=`<p class="mut">30 秒內點出現的地鼠，打中 +1。</p><div class="hud"><span>得分 <b id="wScore">0</b></span><span>時間 <b id="wTime">30</b></span></div><div class="holes">${[...Array(9)].map((_,i)=>`<button class="hole" data-h="${i}"></button>`).join("")}</div><div class="gbtns"><button class="pri" id="wGo">開始</button></div><div id="gShow"></div>`;
  const hs=[...area.querySelectorAll(".hole")];hs.forEach(h=>h.disabled=true);
  $("wGo").onclick=()=>{$("wGo").disabled=true;let sc=0,t=30,cur=-1,spawns=0;const on=i=>{hs.forEach((h,j)=>{h.classList.toggle("up",j==i);h.innerHTML=j==i?"🔨":""});cur=i};
   hs.forEach((h,j)=>{h.disabled=false;h.onclick=()=>{if(j==cur){sc++;$("wScore").textContent=sc;on(-1)}}});
   const sp=setInterval(()=>{if(++spawns>40){return}let i;do{i=Math.floor(Math.random()*9)}while(i==cur);on(i);setTimeout(()=>{if(cur==i)on(-1)},650)},750);
   const tm=setInterval(async()=>{$("wTime").textContent=--t;if(t<=0){clearInterval(tm);clearInterval(sp);on(-1);hs.forEach(h=>h.disabled=true);await soloEnd("whack",Math.min(sc,40))}},1000)}}
 if(gameTab=="memory"){const IC=["🍀","⭐","🔔","🥚","💰","🎁","🐱","🍪"];let cards=[...IC,...IC].sort(()=>Math.random()-.5),open=[],done=new Set(),moves=0,lock=false;
  area.innerHTML=`<p class="mut">翻兩張一樣的就消掉。16 張，翻越少次分數越高。</p><div class="hud"><span>步數 <b id="mMoves">0</b></span></div><div class="mem">${cards.map((_,i)=>`<button class="mc" data-c="${i}">?</button>`).join("")}</div><div id="gShow"></div>`;
  const bs=[...area.querySelectorAll(".mc")];
  bs.forEach((b,i)=>b.onclick=async()=>{if(lock||open.includes(i)||done.has(i))return;b.innerHTML=cards[i];b.classList.add("flip");open.push(i);
   if(open.length==2){lock=true;moves++;$("mMoves").textContent=moves;const[a,c]=open;await new Promise(r=>setTimeout(r,650));
    if(cards[a]==cards[c]){done.add(a);done.add(c);bs[a].classList.add("ok");bs[c].classList.add("ok")}else{[a,c].forEach(k=>{bs[k].innerHTML="?";bs[k].classList.remove("flip")})}
    open=[];lock=false;if(done.size==16){await soloEnd("memory",Math.max(0,100-(moves-8)*5)," · 用了 "+moves+" 步")}}})}
}
// 猜拳戰帖：發起（線上就能下）、應戰
function duelModal(id,duel){const t=R[id];let bet=200,mv=null;$("modal").classList.remove("hide");
 $("mbody").innerHTML=duel?`<h2>✊ ${esc(t.name)} 向你下戰帖</h2><p>押注 €${duel.bet}，贏的人拿走 €${duel.bet*2}。他已經出好拳了，你出什麼？</p><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div class="row"><button id="dno">拒絕（他拿回押注）</button><button id="mc">之後再說</button></div>`
  :`<h2>✊ 向 ${esc(t.name)} 下戰帖</h2><p class="mut">先押錢並出拳，他應戰時出拳就比；24 小時沒回應自動退錢。</p><div class="chips">押注 ${[50,200,500,1000,2000].map(b=>`<button data-bet="${b}" class="${bet==b?"on":""}">€${b}</button>`).join("")}</div><div class="gbtns">${Object.entries(RPS).map(([k,[ic,n]])=>`<button class="gbig" data-m="${k}">${ic}<span>${n}</span></button>`).join("")}</div><div class="row"><button id="mc">取消</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-bet]").forEach(b=>b.onclick=()=>{bet=+b.dataset.bet;$("mbody").querySelectorAll("[data-bet]").forEach(x=>x.classList.toggle("on",x==b))});
 if($("dno"))$("dno").onclick=async()=>{try{apply(await rpc("town_duel",{rid:me,pin,act:"decline",duel:duel.id}));$("modal").classList.add("hide")}catch(e){toast(e.message)}};
 $("mbody").querySelectorAll("[data-m]").forEach(b=>b.onclick=async()=>{try{const st=await rpc("town_duel",duel?{rid:me,pin,act:"accept",choice:b.dataset.m,duel:duel.id}:{rid:me,pin,act:"challenge",target:id,bet,choice:b.dataset.m});apply(st);$("modal").classList.add("hide");
  toast(duel?(st.events[0]||{}).msg||"比完了":`戰帖送出，等 ${t.name} 應戰`)}catch(e){toast(e.message)}})}
// 超市：造型與擺飾
// 穿上某件造型（買了自動穿、背包裡也能換）
async function wearOn(id){const k=["style","top","acc"].find(k=>WEAR[k].some(a=>a[0]==id));if(!k)return;const look=normLook(R[me].look);look[k]=id;try{await rpc("town_login",{rid:me,pin,new_look:look});mapKey="";await refresh();toast("穿上了")}catch(e){toast(e.message)}}
function shopModal(){const it=R[me].items||{},w=new Set(it.w||[]),d=new Set(it.d||[]),f=new Set(it.f||[]);$("modal").classList.remove("hide");
 const row=(id,name,price,has,kind)=>`<div class="mrow"><span><b>${name}</b> <small class="mut">€${price}</small></span>${has?`<small class="mut">✔ 已在背包</small>`:`<button data-b="${kind}:${id}">買</button>`}</div>`;
 $("mbody").innerHTML=`<h2>🛍️ 造型與擺飾</h2><p class="mut">你有 €${R[me].money} · 背包：零食 ${it.snack||0}、禮物 ${it.gift||0}。買了放進背包；造型自動穿上，擺飾自動放門口（最多 4 樣）。</p>
  <h3>造型</h3>${["style","top","acc"].map(k=>WEAR[k].filter(a=>a[2]).map(a=>row(a[0],a[1],a[2],w.has(a[0]),"w")).join("")).join("")}
  <p class="mut">🔒 情侶 T：和人變成好麻吉就能穿。繃帶頭：被扁 10 次就能戴。</p>
  <h3>門口擺飾</h3>${DECO.map(([id,n,pr])=>row(id,n,pr,d.has(id),"d")).join("")}
  <h3>室內家具</h3><p class="mut">買了放進背包，到家裡「室內」擺放，每種一件。</p>${FURN.map(([id,n,pr,ds])=>`<div class="mrow"><span><b>${n}</b> <small class="mut">€${pr} · ${ds}</small></span>${f.has(id)?`<small class="mut">✔ 已在背包</small>`:`<button data-b="f:${id}">買</button>`}</div>`).join("")}<div class="row"><button id="bagGo">看背包</button><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("bagGo").onclick=()=>bagModal();
 $("mbody").querySelectorAll("[data-b]").forEach(b=>b.onclick=async()=>{b.disabled=true;const [k,id]=b.dataset.b.split(":"),had=((R[me].items||{})[k]||[]).includes(id);await act("buy",{item:b.dataset.b});if(k=="w"&&!had&&((R[me].items||{}).w||[]).includes(id))await wearOn(id);shopModal()})}
// 背包：把 snack、gift、rg、w、f、d 整理成分類（讀取層，不搬資料）
const FIC={bed:"🛏️",sofa:"🛋️",fridge:"🧊",plant:"🪴",shelf:"📚",massage:"💺",rug:"🟥",tvcab:"📺",frame:"🖼️",painting:"🎨",desklamp:"💡",toy:"🎲",books:"📚",toilet:"🚽",shower:"🚿"},DIC={flowers:"🌷",mailbox:"✉️",lamp:"💡",bench:"🪑",tree:"🌳",pigstatue:"🏛️"};
const BAG_TABS=[["food","食物"],["gift","禮物"],["wear","服飾"],["furn","家具"],["deco","擺飾"]];
const bagCount=r=>{const it=r.items||{};return (it.snack||0)+(it.gift||0)+(it.rg||[]).length+(it.w||[]).length+(it.f||[]).length+(it.d||[]).length};
// 考駕照：三題選擇題（答案順序要和 town.sql 的 license 一致：機車 1、2、0；汽車 2、0、1）
const LICQ={moto:[["紅燈亮的時候應該？",["慢慢騎過去","停在停止線後面","按喇叭催前面的人"]],["斑馬線上有人要過馬路時？",["加速通過","按喇叭趕他","停下來讓他先過"]],["機車可以騎上人行道嗎？",["不行，要在車道上","沒人的時候可以","下雨天可以"]]],
 car:[["鬧區的車速要怎麼開？",["看心情","比別人快就對了","遵守速限，鬧區要更慢"]],["沒有駕照開車會怎樣？",["被罰很多錢又記點","沒事","只會被警告"]],["看到斑馬線有人要過時？",["快速衝過去","停車禮讓","按喇叭"]]]};
function licModal(k){const qs=LICQ[k],ans=["","",""];$("modal").classList.remove("hide");
 const draw=()=>{$("mbody").innerHTML=`<h3>${VEH[k][0]}駕照考試</h3><p class="mut">報名費 €${LICFEE[k]}，三題答對兩題過關；沒過不退費，30 分鐘後可再考</p>`+qs.map((q,i)=>`<p><b>${i+1}. ${q[0]}</b></p><div class="list">${q[1].map((o,j)=>`<button data-q="${i}" data-o="${j}" class="${ans[i]===String(j)?"pri":""}">${o}</button>`).join("")}</div>`).join("")+`<div class="row"><button class="pri" id="lgo" ${ans.every(a=>a!=="")?"":"disabled"}>交卷</button><button id="mc">關閉</button></div>`;pxify($("mbody"));
  $("mbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ans[+b.dataset.q]=b.dataset.o;draw()});$("mc").onclick=()=>$("modal").classList.add("hide");
  $("lgo").onclick=async()=>{$("modal").classList.add("hide");await act("license",{item:k,note:ans.join("")});if(hasLic(R[me],k))toast("考到了！可以上路");else toast("沒過，30 分鐘後再考")}};draw()}
// 罰單：列出每張、逾期加罰 50%、可單張或全部繳清
function garageModal(){const r=R[me],own=vehOwn(r);$("modal").classList.remove("hide");
 const row=k=>{const w=vwear(r,k),ins=k=="bike"?"":["c","f"].map(l=>`<div class="mrow"><span><b>${l=="c"?"強制險":"任意險"}</b> <small class="mut">${insLeft(r,k,l)>0?`剩 ${fmtLeft(insLeft(r,k,l))}`:"沒有"} · ${l=="c"?"醫藥費全額":"修車付八成、賠償對方全額，無照不賠"}</small></span><span><button data-i="${k}:${l}:7">7天 €${premOf(r,k,l,7)}</button> <button data-i="${k}:${l}:30">30天 €${premOf(r,k,l,30)}</button></span></div>`).join("");
  return `<div class="mrow"><span>${VEH[k][4]} <b>${VEH[k][0]}</b> <small class="mut">車況 ${Math.round(100-w)}% · 速度 ×${vspd(r,k).toFixed(1)}</small></span><span><button data-f="${k}" ${w<1?"disabled":""}>修 €${fixCost(r,k)}</button> <button data-s="${k}">賣 €${sellVal(r,k)}</button></span></div>${ins}`};
 $("mbody").innerHTML=`<h3>🛡️ 保險與維修</h3><p class="mut">保費倍率 ×${premMult(r).toFixed(2)}（違規與事故越多越貴）。修車費 = 車價 15% × 耗損。賣車 = 車價 60%，耗損再折。任意險要先有強制險。${debtOf(r)>0?`事故欠款 €${debtOf(r)}`:""}</p>`+(own.length?`<div class="list">${own.map(row).join("")}</div>`:`<p class="mut">還沒有車</p>`)+`<div class="row"><button id="mc">關閉</button></div>`;pxify($("mbody"));
 const go=async(a,it)=>{await act(a,{item:it});if($("modal").classList.contains("hide"))return;garageModal()};
 $("mbody").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>go("insure",b.dataset.i));$("mbody").querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>go("vfix",b.dataset.f));
 $("mbody").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(confirm("確定要賣掉這台車嗎？保險也會一起作廢"))go("vsell",b.dataset.s)});$("mc").onclick=()=>$("modal").classList.add("hide")}
function ticketModal(){const r=R[me],tk=tkList(r),pts=(r.items.pts&&r.items.pts.d==new Date(now()+8*36e5).toISOString().slice(0,10))?r.items.pts.n:0,sl=susLeft(r);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h3>🎫 罰單</h3><p class="mut">今天違規記 ${pts}／10 點，滿 10 點車輛暫停 6 小時。欠 €3000 以上不能上車。開單 24 小時內沒繳，加罰 50%</p>`+(sl>0?`<p class="err">車輛暫停中，明天才能再上路</p>`:"")+
  (tk.length?`<div class="list">${tk.map(t=>`<div class="mrow"><span><b>${(FINE[t.k]||["違規"])[0]}</b> <small class="mut">€${t.a}${t.o?" · 已逾期加罰":" · 還沒逾期"}</small></span><button data-p="${t.id}">繳</button></div>`).join("")}</div>`:`<p class="mut">沒有罰單，繼續保持</p>`)+
  `<div class="row">${tk.length>1?`<button class="pri" id="pall">全部繳清 €${tkDebt(r)}</button>`:""}<button id="mc">關閉</button></div>`;pxify($("mbody"));
 const pay=async it=>{await act("paytk",{item:String(it)});if($("modal").classList.contains("hide"))return;ticketModal()};
 $("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>pay(b.dataset.p));if($("pall"))$("pall").onclick=()=>pay("all");$("mc").onclick=()=>$("modal").classList.add("hide")}
function bagModal(tab){tab=tab||"food";const r=R[me],it=r.items||{},look=normLook(r.look),rg=it.rg||[],fu=it.fu||[];$("modal").classList.remove("hide");
 const row=(ic,name,sub,btn)=>`<div class="mrow"><span>${ic} <b>${esc(name)}</b> <small class="mut">${sub}</small></span>${btn}</div>`;
 const cnt={food:it.snack||0,gift:(it.gift||0)+rg.length,wear:(it.w||[]).length,furn:(it.f||[]).length,deco:(it.d||[]).length};
 let body="";
 if(tab=="food")body=it.snack?row("🍪","零食",`× ${it.snack} · 飽足 +20`,`<button data-eat="1">吃</button>`):'<p class="mut">沒有食物。超市可以買零食</p>';
 if(tab=="gift")body=(it.gift?row("🎁","禮物",`× ${it.gift} · 到朋友面板「送禮物」送出`,""):"")+rg.map(g=>row("📦",`${g.name} 的禮物`,"未拆",`<button data-u="${g.id}">拆開</button><button data-g="${g.id}">轉送</button>`)).join("")||(body||"")
 if(tab=="gift"&&!body)body='<p class="mut">沒有禮物。超市可以買，朋友送的也會在這裡</p>';
 if(tab=="wear")body=(it.w||[]).map(id=>{const k=["style","top","acc"].find(k=>WEAR[k].some(a=>a[0]==id)),a=k&&wInfo(k,id),on=k&&look[k]==id;return row("👗",a?a[1]:id,on?"穿著中":"",on?"":`<button data-w="${id}">穿上</button>`)}).join("")||'<p class="mut">沒有特別款服飾。超市可以買</p>';
 if(tab=="furn")body=(it.f||[]).map(k=>{const a=FURN.find(x=>x[0]==k)||[k,k],pl=fu.includes(k);return row(FIC[k]||"🛍️",a[1],pl?"已擺在家裡":"在背包，還沒擺",pl?"":`<button data-p="1">去擺放</button>`)}).join("")||'<p class="mut">沒有家具。超市可以買</p>';
 if(tab=="deco")body=(it.d||[]).map(k=>{const a=DECO.find(x=>x[0]==k)||[k,k];return row(DIC[k]||"🛍️",a[1],"放在門口","")}).join("")||'<p class="mut">沒有擺飾。超市可以買</p>';
 $("mbody").innerHTML=`<h2>🛍️ 背包</h2><div class="chips">${BAG_TABS.map(([k,n])=>`<button data-t="${k}" class="${tab==k?"on":""}">${n}${cnt[k]?" "+cnt[k]:""}</button>`).join("")}</div>${body}<div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>bagModal(b.dataset.t));
 const bind=(sel,fn)=>$("mbody").querySelectorAll(sel).forEach(b=>b.onclick=async()=>{b.disabled=true;await fn(b);bagModal(tab)});
 bind("[data-eat]",()=>act("snack"));bind("[data-u]",async b=>{await act("unwrap",{item:b.dataset.u})});bind("[data-g]",async b=>{await act("regift",{item:b.dataset.g});toast("轉成你的禮物了，可以送人")});
 bind("[data-w]",b=>wearOn(b.dataset.w));
 $("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{if(inside(R[me]))interiorModal(me);else toast("要先進屋才能擺家具")})}
// 在家裝潢：換屋頂、牆壁顏色（€300）
function choiceModal(h,sub,rows){$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>${h}</h2><p class="mut">${sub}</p>${rows.map((x,i)=>`<button class="act" data-c="${i}"><b>${x[0]}</b><small>${x[1]}</small></button>`).join("")}<div class="row"><button id="mc">關閉</button></div>`;pxify($("mbody"));
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-c]").forEach(b=>b.onclick=async()=>{b.classList.add("working");$("modal").classList.add("hide");await rows[+b.dataset.c][2]()})}
function paintModal(){const it=R[me].items||{};$("modal").classList.remove("hide");
 const pal=(k,arr,cur)=>`<div class="houses">${arr.map(c=>`<button class="sw dot${cur==c?" on":""}" data-p="${k}:${c}" style="background:${c}" aria-label="${k}"></button>`).join("")}</div>`;
 $("mbody").innerHTML=`<h2>🎨 裝潢</h2><p class="mut">換一次 €300，你有 €${R[me].money}。</p><h3>屋頂</h3>${pal("roof",ROOF_C,it.roof||ROOFS[R[me].slot])}<h3>牆壁</h3>${pal("wall",WALL_C,it.wall||"#f4ead6")}
  <h3>門口擺飾</h3><p class="mut">${(it.d||[]).map(x=>(DECO.find(a=>a[0]==x)||[x,x])[1]).join("、")||"還沒有，去超市買"}</p><div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=async()=>{await act("paint",{item:b.dataset.p});paintModal()})}
// 家具畫法（像素方塊）：在 s×s 的格子裡畫
function furnDraw(m,id,x,y,s){const u=s/12,R=(a,b,w,h,c)=>{m.fillStyle=c;m.fillRect(x+a*u,y+b*u,w*u,h*u)};
 if(id=="bed"){R(1,4,10,6,"#8b5a2b");R(1,3,10,3,"#fff");R(1,5,10,5,"#e0779b");R(1,3,3,3,"#f4f1de")}
 if(id=="fridge"){R(3,1,6,10,"#dfe6ea");R(3,5,6,1,"#8a9aa5");R(7,2,1,2,"#8a9aa5");R(7,7,1,2,"#8a9aa5")}
 if(id=="toilet"){R(4,1,4,4,"#e8eef2");R(3,5,6,4,"#f4f8fa");R(4,9,4,2,"#cfd8dc");R(4,4,4,1,"#9fb0b8")}
 if(id=="shower"){R(2,0,8,1,"#8a9aa5");R(5,1,2,2,"#6b7a85");R(3,3,1,1,"#7ec8f0");R(6,4,1,1,"#7ec8f0");R(8,3,1,1,"#7ec8f0");R(5,6,1,1,"#7ec8f0");R(2,8,8,3,"#bfe3f2")}
 if(id=="massage"){R(2,3,8,7,"#5a3a2a");R(3,1,6,5,"#7a4a34");R(2,9,8,2,"#3a2212")}
 if(id=="shelf"){R(2,1,8,10,"#8b5a2b");[2,5,8].forEach(a=>{R(3,a,6,2,"#c0392b");R(5,a,2,2,"#3b7dd8");R(7,a,2,2,"#2e9e5b")});R(2,10,8,1,"#5a3a1a")}
 if(id=="sofa"){R(1,4,10,4,"#3b7dd8");R(1,7,10,3,"#2f64b0");R(0,5,2,5,"#2f64b0");R(10,5,2,5,"#2f64b0")}
 if(id=="tvcab"){R(2,6,8,4,"#8b5a2b");R(3,1,6,5,"#222");R(4,2,4,3,"#6fc6ff")}
 if(id=="rug"){R(1,3,10,7,"#c0392b");R(2,4,8,5,"#f1c40f");R(3,5,6,3,"#c0392b")}
 if(id=="plant"){R(4,7,4,4,"#b5651d");R(3,3,6,5,"#2e9e5b");R(5,1,2,4,"#4caf50")}
 if(id=="frame"){R(3,3,6,6,"#8b5a2b");R(4,4,4,4,"#bfe6ff");R(5,5,2,2,"#2e9e5b")}
 if(id=="painting"){R(1,2,10,7,"#5a3a1a");R(2,3,8,5,"#6fc6ff");R(2,6,8,2,"#2e9e5b");R(7,4,2,2,"#fee761")}
 if(id=="desklamp"){R(4,10,4,1,"#555");R(5,5,2,5,"#888");R(3,2,6,4,"#fee761")}
 if(id=="toy"){R(3,6,6,4,"#e74c3c");R(3,4,6,2,"#3b7dd8");R(5,2,2,2,"#f1c40f")}
 if(id=="books"){R(2,7,8,3,"#c0392b");R(3,5,7,2,"#3b7dd8");R(2,4,5,1,"#f1c40f")}}
// 室內畫面：自由擺放（座標 items.fp，房間大小依房子等級，見 HOME_DIM）；自己的家可以擺、移動、收回、升級；朋友的家只能看
function drawHomeEdit(cv,rm,sel,oid){const C=RC,W=rw(rm),H=rh(rm),c=cv.getContext("2d");c.imageSmoothingEnabled=false;c.clearRect(0,0,W*C,H*C);
 c.fillStyle=rm.wall;c.fillRect(0,0,W*C,C);for(let y=1;y<H;y++)for(let x=0;x<W;x++){c.fillStyle=rm.floor[(x+y)%2];c.fillRect(x*C,y*C,C,C)}
 c.fillStyle="rgba(0,0,0,.25)";c.fillRect(0,C-3,W*C,3);
 if(sel){const wall=WALLF.includes(sel);c.fillStyle="rgba(255,255,255,.75)";for(let y=wall?0:1;y<(wall?1:H);y++)for(let x=0;x<W;x++)if(!rm.items.some(o=>o[1]==x&&o[2]==y))c.fillRect(x*C+C/2-2,y*C+C/2-2,4,4)}
 for(const o of rm.items)furnDraw(c,o[0],o[1]*C,o[2]*C,C);
 const so=sel&&rm.items.find(o=>o[0]==sel);if(so){c.strokeStyle="#fee761";c.lineWidth=2;c.strokeRect(so[1]*C+1,so[2]*C+1,C-2,C-2)}
 if(oid!=null&&oid!=me&&R[oid]&&inside(R[oid]))drawOwner(c,rm,tickLocal(R[oid],now()),C)}
// 朋友家唯讀畫面：畫出屋主（睡著就躺在床上，沒床躺地板；醒著站在房間中間）
function drawOwner(c,rm,o,C){const W=rw(rm),H=rh(rm),spots=roomSpots(rm),sp=spots[0]||[Math.floor(W/2),2];c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#fff";
 if(o.sleeping){const bd=rm.items.find(q=>q[0]=="bed"),bx=bd?(bd[1]+.5)*C:(sp[0]+.5)*C,by=bd?bd[2]*C+C-4:sp[1]*C+C-4;c.save();c.translate(bx,by-2);c.rotate(-Math.PI/2);drawChar(c,0,0,1.05,o.look,{moving:false},0);c.restore();c.strokeText("Z z",bx+4,by-C+2);c.fillText("Z z",bx+4,by-C+2);return}
 const x=(sp[0]+.5)*C,y=sp[1]*C+2;drawChar(c,x,y,1.05,o.look,{moving:false},0);c.strokeText(o.name.slice(0,4),x,Math.max(11,y-30));c.fillText(o.name.slice(0,4),x,Math.max(11,y-30))}
function interiorModal(id,sel){const o=R[id],mine=id==me,it=o.items||{},hl=hlc(it.hl),rm=homeRoom({id,items:it}),W=rw(rm),H=rh(rm),fp=rm.items,placed=new Set(fp.map(a=>a[0])),cap=HOUSES[hl-1][2],nx=HOUSES[hl],owned=(it.f||[]).filter(k=>!placed.has(k));
 const nm=k=>(FURN.find(a=>a[0]==k)||[0,k])[1];sel=sel||null;
 $("modal").classList.remove("hide");
 const ctl=mine?(sel?`<div class="mrow"><span><b>${nm(sel)}</b> <small class="mut">${placed.has(sel)?"點空格移到那裡":(WALLF.includes(sel)?"點上面那排牆放上去":"點地板放下去")}</small></span>${placed.has(sel)?`<button data-x="${sel}">收回</button>`:""}</div>`:'<p class="mut">點家具選取，再點空格移動；背包的家具點下面的名字，再點空格放下。</p>'):"";
 const bag=mine?(owned.length?`<h3>背包的家具</h3><div class="row" style="justify-content:flex-start">${owned.map(k=>`<button data-s="${k}" class="${sel==k?"pri":""}" style="min-height:44px">${nm(k)}</button>`).join("")}</div>`:'<p class="mut">背包沒有要擺的家具，去超市買</p>'):"";
 $("mbody").innerHTML=`<h2>${esc(o.name)} 的家</h2><p class="mut">${HOUSES[hl-1][0]} · 擺了 ${fp.length}/${cap} 件${mine?` · 你有 €${o.money}`:""}</p><canvas id="hm" class="hm" width="${W*RC}" height="${H*RC}"></canvas>${ctl}${bag}
  ${mine?(nx?`<div class="row"><button data-up="1">升級成${nx[0]} €${nx[1]}（房間更大、可擺 ${nx[2]} 件）</button></div>`:'<p class="mut">已經是最高級的豪宅</p>'):""}
  <div class="row"><button id="mc" class="pri">${mine?"完成":"關閉"}</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 const cv=$("hm");drawHomeEdit(cv,rm,sel,id);
 if(!mine)return;
 cv.onclick=async ev=>{const b=cv.getBoundingClientRect(),cx=Math.floor((ev.clientX-b.left)/b.width*W),cy=Math.floor((ev.clientY-b.top)/b.height*H),at=fp.find(a=>a[1]==cx&&a[2]==cy);
  if(at){interiorModal(id,at[0]==sel?null:at[0]);return}
  if(!sel)return;
  if(WALLF.includes(sel)!=(cy==0)){toast(WALLF.includes(sel)?"這個要掛在牆上":"這個要放在地上");return}
  await act("furn",{item:`put:${sel}:${cx}:${cy}`});
  const ok=fpOf((R[me].items||{})).some(a=>a[0]==sel&&a[1]==cx&&a[2]==cy);interiorModal(id,ok?null:sel)};
 $("mbody").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>interiorModal(id,sel==b.dataset.s?null:b.dataset.s));
 $("mbody").querySelectorAll("[data-x]").forEach(b=>b.onclick=async()=>{await act("furn",{item:`clr:${b.dataset.x}`});interiorModal(id,null)});
 $("mbody").querySelectorAll("[data-up]").forEach(b=>b.onclick=async()=>{await act("upgrade");interiorModal(id,sel)})}
// ── 證券交易所（大富翁式：8 檔虛構股票、全天開、沒手續費；規則與 town_stock.sql 一致）──
const stockItems=r=>{const s=(r.items||{}).st||{};return {h:s.h||{}}};
let QUOTES=null;
const stockN=r=>Object.keys(stockItems(r).h).length;
const stockVal=r=>{const h=stockItems(r).h;let v=0;for(const c in h){const q=QUOTES&&QUOTES.stocks.find(x=>x.code==c);v+=q?q.price*h[c].q:h[c].c}return v.toLocaleString()};
const arrow=(p,ref)=>{const d=Math.round((p-ref)/ref*100);return `<b style="color:${d>0?"#e43b44":d<0?"#2f9e44":"inherit"}">${d>0?"▲":d<0?"▼":"－"}${Math.abs(d)}%</b>`}; // 台灣習慣：紅漲綠跌
const spark=(h,up)=>{const a=h.slice(-36),lo=Math.min(...a),hi=Math.max(...a),sp=hi-lo||1;return `<svg width="84" height="26" viewBox="0 0 84 26"><polyline fill="none" stroke="${up?"#e43b44":"#2f9e44"}" stroke-width="2" points="${a.map((v,i)=>`${Math.round(i/Math.max(1,a.length-1)*82)+1},${Math.round(24-(v-lo)/sp*22)}`).join(" ")}"/></svg>`};
async function stockModal(){$("modal").classList.remove("hide");if(!QUOTES)$("mbody").innerHTML='<p class="mut">載入行情…</p>';
 let Q;try{Q=QUOTES=await rpc("town_stock_list")}catch(e){$("mbody").innerHTML='<p class="err">行情載入失敗</p><div class="row"><button id="mc">關閉</button></div>';$("mc").onclick=()=>$("modal").classList.add("hide");return}
 const r=tickLocal(R[me],now()),it=stockItems(r),inside=r.place=="stock";
 const rows=Q.stocks.map(x=>{const h=it.h[x.code],up=x.price>=x.ref,pl=h?x.price*h.q-h.c:0;
  return `<div class="mrow" style="flex-wrap:wrap;gap:6px"><span style="min-width:96px"><b>${x.name}</b><br><small class="mut">${h?`持有 ${h.q} 股 · ${pl>=0?"賺":"賠"} ${Math.abs(pl)}`:"沒有持股"}</small></span>${spark(x.hist,up)}<span><b style="font-size:22px">${x.price}</b> ${arrow(x.price,x.ref)}</span>
  <span class="chips" style="margin:0"><button data-b="${x.code}:1">買 1</button><button data-b="${x.code}:5">買 5</button><button data-s="${x.code}:1" ${h?"":"disabled"}>賣 1</button><button data-s="${x.code}:all" ${h?"":"disabled"}>全賣</button></span></div>`}).join("");
 const news=Q.news.length?Q.news.slice(0,4).map(n=>`<li>${n.msg}</li>`).join(""):"<li class=\"mut\">今天沒什麼大新聞</li>";
 $("mbody").innerHTML=`<h2>📈 證券交易所</h2><p class="mut">現金 ${CUR}${r.money} · 持股約 ${CUR}${stockVal(r)}${inside?"":" · 要走到交易所才能買賣"}</p>
 <h3 class="gh">今日消息</h3><ul class="mut" style="margin:0 0 8px 16px">${news}</ul>
 <h3 class="gh">行情（紅漲綠跌，跟 6 小時前比）</h3><div class="list">${rows}</div><p class="mut">價格每 10 分鐘變一次，偶爾有利多利空。買賣沒有上限、沒有手續費。</p><div class="row"><button id="mc">離開</button></div>`;
 $("mc").onclick=()=>{$("modal").classList.add("hide");refresh().catch(()=>{})};
 const go=async(op,v)=>{if(!inside){toast("要走到證券交易所才能買賣");return}const [code,q]=v.split(":"),qty=q=="all"?it.h[code].q:+q;await ensureIn();try{const res=await rpc("town_stock_trade",{rid:me,pin,op,code,qty});if(res.error)throw new Error(res.error);toast(res.msg);spawnFx("coins",me);await refresh();stockModal()}catch(e){toast(e.message)}};
 $("mbody").querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>go("buy",b.dataset.b));$("mbody").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>go("sell",b.dataset.s))}
// ── 醫院／警察局／市政廳（supabase/town_civic.sql）──
async function civAct(fn,args,fx,anim){try{const j=await rpc(fn,{rid:me,pin,...args});await refresh();if(fx)spawnFx(fx,me);if(anim)playRoomFx(anim);if(j&&j.msg){toast(j.msg);feedback(true,j.msg)}return j}catch(e){toast(e.message);feedback(false,e.message)}finally{renderPanel()}}
const hospAct=(op,target)=>civAct("town_hospital",{op,target:target||null},op=="visit"?"hearts":"sparkle",op=="visit"?"hvisit":op);
async function policeAct(op,item){if(op=="stats"){try{const j=await rpc("town_police",{rid:me,pin,op:"stats",item:null});choiceModal("今日治安",`今天鎮上：罰單 ${j.tk} 張、事故 ${j.crash} 件、砍人 ${j.slash} 件、入獄 ${j.jail} 人次、越獄成功 ${j.esc} 次。${j.rp?`你身上有 ${j.rp} 個報案點（${POLICE.rpDays} 天內巡警盯你比較緊）。`:"你沒有報案點。"}`,[["知道了","",()=>{}]])}catch(e){toast(e.message)}return}
 return civAct("town_police",{op,item:item||null},op=="pay"?"coins":op=="report"?"flash":"sparkle",op)}
function reportModal(){const ev=(S&&S.events)||[],kinds=["fight","slash","egg","prank","mischief","photo"],seen={},offs=[];
 for(const e of ev)if(e.target==me&&kinds.includes(e.kind)&&Date.parse(e.at)>now()-864e5&&R[e.actor]&&!seen[e.actor]&&!ev.some(x=>x.kind=="report"&&x.actor==me&&x.target==e.actor&&Date.parse(x.at)>now()-POLICE.rpDays*864e5)){seen[e.actor]=1;offs.push(e.actor)}
 if(!offs.length){toast("24 小時內沒有人對你做過什麼，或這週已經報過案了");return}
 choiceModal("要報案哪一位？",`對方記 1 個報案點（${POLICE.rpDays} 天內巡警盯他比較緊，最多 ${POLICE.rpMax} 點），不會自動入獄。每天 1 次，同一個人一週 1 次`,offs.map(id=>[R[id].name,"他最近對你做過惡搞或動手",()=>policeAct("report",String(id))]))}
async function civSync(){civT=Date.now();try{const j=await rpc("town_civic_proj_list",{tid:TID});CIVP=Array.isArray(j)?j:[]}catch(e){}}
const civicUse=k=>civAct("town_civic_use",{item:k},"sparkle");
function askText(title,hint,max,cb){$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>${esc(title)}</h2><p class="mut">${esc(hint)}</p><input id="atx" maxlength="${max}" placeholder="最多 ${max} 字"><p class="err" id="aerr"></p><div class="row"><button id="mc">取消</button><button class="pri" id="ms">送出</button></div>`;
 $("mc").onclick=()=>civicModal();$("ms").onclick=()=>{const v=$("atx").value.trim();if(!v){$("aerr").textContent="寫點什麼";return}cb(v)}}
async function civicModal(){$("modal").classList.remove("hide");$("mbody").innerHTML='<p class="mut">載入中…</p>';
 let c;try{c=CIV=await rpc("town_civic",{rid:me,pin,op:"view"})}catch(e){$("mbody").innerHTML=`<p class="err">${esc(e.message)}</p><div class="row"><button id="mc">關閉</button></div>`;$("mc").onclick=()=>$("modal").classList.add("hide");return}
 CIVP=c.proj||[];const r=R[me],at=r.place=="townhall",mayor=!!c.mayor,v=c.vote,fl=c.flog||{},
  src=[["房租",fl.rent],["財產稅",fl.tax],["奢侈品",fl.lux],["格鬥場下注",fl.pk]].filter(x=>x[1]).map(x=>`${x[0]} ${CUR}${(+x[1]).toLocaleString()}`).join(" · ")||"還沒有進帳",
  go=async(op,item,note)=>{try{await rpc("town_civic",{rid:me,pin,op,item:item||null,note:note||null});await refresh();civSync();civAct("town_civic",{op:"view"},null,"civic").then(()=>{});civicModal()}catch(e){toast(e.message)}},
  ann=(c.ann||[]).map((a,i)=>`<p class="annline">📜 ${esc(a.t)}${mayor&&at?` <button class="sw" data-un="${i}">撤掉</button>`:""}</p>`).join("")||'<p class="mut">沒有公告</p>',
  built=(c.proj||[]).map(k=>CIVIC[k]?CIVIC[k][0]:k).join("、")||"還沒有",
  hist=(c.hist||[]).map(h=>`<p class="mut">· ${esc(h.m)}</p>`).join("")||'<p class="mut">還沒有投票紀錄</p>';
 let vh="";
 if(v){const left=Math.max(0,Date.parse(v.end)-now()),what=v.k=="build"?`建設案「${esc((CIVIC[v.p]||[v.p])[0])}」· 花鎮基金 ${CUR}${(+v.cost).toLocaleString()}`:`「${esc(v.q)}」`;
  vh=`<p><b>${what}</b></p><p class="mut">${esc(v.bn)} 發起 · 贊成 ${v.yn} ／ 反對 ${v.nn} · 還有 ${fmtLeft(left)} · 要至少 ${c.quorum} 票、贊成多於反對才通過</p>`+(v.mine?`<p class="mut">你投了${v.mine=="yes"?"贊成":"反對"}</p>`:at?`<div class="row"><button class="pri" data-v="yes">贊成</button><button data-v="no">反對</button></div>`:'<p class="mut">要走到市政廳才能投票</p>')}
 else if(at){vh='<div class="row"><button data-poll="1">發起投票</button>'+(mayor?'<button class="pri" data-build="1">提建設案</button>':"")+'</div><p class="mut">投票：任何居民都能問大家一件事（是非題，只當民意調查）。建設案只有鎮長能提，要花鎮基金</p>'}
 else vh='<p class="mut">現在沒有投票。要走到市政廳才能發起</p>';
 $("mbody").innerHTML=`<h2>🏛️ 市政廳</h2><p>鎮基金 <b>${CUR}${(+c.fund).toLocaleString()}</b></p><p class="mut">來源：${src}。薪水不抽，只能花在居民投票通過的建設案，不能轉給任何人</p><h3>公告欄</h3>${ann}${mayor&&at?'<div class="row"><button data-an="1">貼新公告</button></div>':""}<h3>投票</h3>${vh}<h3>已蓋好</h3><p class="mut">${built}</p><h3>最近結果</h3>${hist}<div class="row"><button id="mc">關閉</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-un]").forEach(b=>b.onclick=()=>go("unannounce",b.dataset.un));
 $("mbody").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>go("vote",b.dataset.v));
 const an=$("mbody").querySelector("[data-an]");if(an)an.onclick=()=>askText("貼新公告","全鎮都看得到，最多 3 則，舊的會被擠掉",40,t=>go("announce",t));
 const pl=$("mbody").querySelector("[data-poll]");if(pl)pl.onclick=()=>askText("發起投票","一個是非題，例如「要不要辦廣場派對？」，24 小時結束",20,t=>go("propose","poll",t));
 const bd=$("mbody").querySelector("[data-build]");if(bd)bd.onclick=()=>choiceModal("要提哪個建設案？",`花鎮基金（現在 ${CUR}${(+c.fund).toLocaleString()}），居民投票 24 小時，過半且至少 ${c.quorum} 票才蓋。蓋好後路邊會多一個設施，大家都能用`,Object.entries(CIVIC).filter(([k])=>!(c.proj||[]).includes(k)).map(([k,o])=>[`${o[0]} ${CUR}${o[1].toLocaleString()}`,`心情 +${o[4]}${o[5]?`、精力 +${o[5]}`:""} · 蓋在地圖 (${o[2]},${o[3]}) 附近`,()=>(c.fund<o[1]?toast("鎮基金不夠"):go("propose",k))]).concat([["先不要","",()=>civicModal()]]))}
// ── 鎮長管理權：所有權力一個視窗（登錄表 POWERS，SQL town_power）。所有居民都看得到紀錄與投票；鎮長才能行使 ──
let PWS=null;
const pwTime=at=>{const m=Math.max(0,Math.round((now()-Date.parse(at))/6e4));return m<1?"剛剛":m<60?`${m} 分鐘前`:m<1440?`${Math.round(m/60)} 小時前`:`${Math.round(m/1440)} 天前`};
const pwLine=e=>{const n=POWERS[e.k]?POWERS[e.k].n:e.k,u=POWERS[e.k]&&POWERS[e.k].unit,tn=e.tn?esc(e.tn):"";
 return `${esc(e.bn)} ${n}${tn?" "+tn:""}${e.n&&u?`（${u=="$"?CUR+e.n:e.n+" 分鐘"}）`:""}${e.via=="vote"?"（居民投票）":""}`};
// 這個權力現在能不能用；回傳不能的原因（空字串 = 可以）
function pwWhy(k,st){const P=POWERS[k],d=P.def,r=R[me],td=(st.today||[]).filter(x=>x.k==k).length,last=(st.last||{})[k];
 if(P.go)return "";
 if((st.off||[]).includes(k)&&!d[10])return "鎮長把它關掉了";
 if(d[0]!=1&&!r.mayor)return "只有鎮長能用";
 if(k=="impeach"&&r.mayor)return "鎮長不能彈劾自己";
 if(["jail","fine","grant"].includes(k)&&st.nres<3)return "要 3 位以上居民";
 if(k=="free"&&st.nres<2)return "小鎮只有一個人";
 if(jailed(r))return "你被關著";
 if(d[3]&&td>=d[3])return `今天用完了（${d[3]} 次）`;
 if(d[5]&&last&&last*1e3+d[5]*6e4>now())return `冷卻中，還要 ${fmtLeft(last*1e3+d[5]*6e4-now())}`;
 if(k=="grant"&&st.fund<d[1])return "鎮基金不夠";
 if(d[0]!=0&&st.vote&&(k=="impeach"||k=="build"))return "已經有一個投票在進行";
 return ""}
// 這個對象現在能不能被施行；回傳原因
function pwWhyT(k,t,st){const d=POWERS[k].def,r=R[t.id];
 if(t.id==me&&k!="impeach")return "不能對自己";
 if(d[4]&&(st.today||[]).some(x=>x.k==k&&x.t==t.id))return "今天已經被施行過了";
 if(k=="jail"){if(t.mayor)return "不能關鎮長";if(jailed(r))return "已經被關著";if(r.sleeping||r.place=="hospital")return "睡覺或住院中";if(!isOn("jail"))return "監獄被關掉了"}
 if(k=="free"&&!jailed(r))return "沒有被關著";
 if(k=="fine"&&(+r.money||0)<=0)return "身上沒有錢";
 if(k=="impeach"&&t.mayor)return "已經是鎮長"; return ""}
function pwRows(rows){choiceModal.apply(null,rows);document.querySelectorAll("#mbody button.act").forEach((b,i)=>{if(rows[2][i]&&rows[2][i][3])b.style.opacity=".45"})}
async function pwCall(k,tg,num,note){const j=await civAct("town_power",{op:"use",pk:k,tg:tg||null,num:num==null?null:num,note:note||null});powersModal();return j}
function pwPick(k,st){const P=POWERS[k],d=P.def,cands=Object.values(R).filter(t=>k=="impeach"?!t.mayor:t.id!=me).sort((a,b)=>a.slot-b.slot);
 pwRows([`${P.n}：選一位居民`,P.d,cands.map(t=>{const w=pwWhyT(k,t,st);return [esc(t.name),w||(k=="fine"?`身上 ${CUR}${(+t.money||0).toLocaleString()}`:k=="free"?"關在監獄裡":t.mayor?"鎮長":houseName(t.slot)),()=>w?toast(w):pwNum(k,t,st),w]}).concat([["先不要","",()=>powersModal()]])])}
function pwNum(k,t,st){const P=POWERS[k],d=P.def;
 if(!d[2]){const go=note=>pwCall(k,t.id,null,note);
  return pwRows([`${P.n}：${esc(t.name)}`,k=="impeach"?"提名他接任鎮長，居民投票 24 小時":"確定嗎？",[["確定","",()=>go()],["先不要","",()=>powersModal()]]])}
 const f=n=>P.unit=="$"?CUR+n.toLocaleString():n>=60&&n%60==0?`${n/60} 小時`:`${n} 分鐘`,
  opts=P.pre.filter(n=>n>=d[1]&&n<=d[2]);
 pwRows([`${P.n}：${esc(t.name)}`,P.unit=="$"?(k=="fine"?"他的錢不夠就罰到 0 為止，進鎮基金；居民可以申訴":`花鎮基金（現在 ${CUR}${(+st.fund).toLocaleString()}）`):"他被關進監獄；居民可以申訴推翻，他也可以保釋、勞動、越獄",
  opts.map(n=>[f(n),k=="grant"&&n>st.fund?"鎮基金不夠":"",()=>(k=="grant"&&n>st.fund)?toast("鎮基金不夠"):d[0]==2?pwMode(k,t,n):pwCall(k,t.id,n),k=="grant"&&n>st.fund]).concat([["先不要","",()=>powersModal()]])])}
function pwMode(k,t,n){pwRows([`${POWERS[k].n}：${esc(t.name)} ${CUR}${n}`,"可以直接發，或交給居民投票（24 小時）",[["鎮長直接發","馬上生效",()=>pwCall(k,t.id,n)],["交居民投票","贊成多於反對、至少 3 票、多於全鎮一半才發",()=>pwCall(k,t.id,n,"vote")],["先不要","",()=>powersModal()]]])}
async function pwVote(v){await civAct("town_power",{op:"vote",note:v});powersModal()}
async function pwAppeal(id){if(!confirm("確定要申訴嗎？居民會投票決定要不要推翻這個決定（12 小時）。"))return;await civAct("town_power",{op:"appeal",note:id});powersModal()}
async function powersModal(){$("modal").classList.remove("hide");$("mbody").innerHTML='<p class="mut">載入中…</p>';
 let st;try{st=PWS=await rpc("town_power",{rid:me,pin,op:"view"})}catch(e){$("mbody").innerHTML=`<p class="err">${esc(e.message)}</p><div class="row"><button id="mc">關閉</button></div>`;$("mc").onclick=()=>$("modal").classList.add("hide");return}
 const r=R[me],mayor=!!st.mayor,v=st.vote,age=at=>now()-Date.parse(at);
 let vh="";if(v){const left=Math.max(0,Date.parse(v.end)-now()),ap=v.kind=="appeal",what=ap?`申訴：推翻鎮長「${POWERS[v.k]?POWERS[v.k].n:v.k}」${esc(v.tn||"")}`:`${POWERS[v.k]?POWERS[v.k].n:v.k}：${esc(v.tn||"")}${v.num&&POWERS[v.k]&&POWERS[v.k].unit=="$"?" "+CUR+v.num:""}`;
  vh=`<h3>投票中</h3><p><b>${what}</b></p><p class="mut">${esc(v.bn)} 發起 · 贊成 ${v.yn} ／ 反對 ${v.nn} · 還有 ${fmtLeft(left)} · ${ap?"贊成多於反對、至少 2 票、多於非鎮長居民的一半才推翻":"贊成多於反對、至少 3 票、多於全鎮一半才通過"}</p>`+
   (v.mine?`<p class="mut">你投了${v.mine=="yes"?"贊成":"反對"}</p>`:ap&&mayor?'<p class="mut">鎮長不能對申訴投票</p>':`<div class="row"><button class="pri" data-pv="yes">${ap?"推翻":"贊成"}</button><button data-pv="no">${ap?"不推翻":"反對"}</button></div>`)}
 const pows=PWORD.map(k=>{const P=POWERS[k],w=pwWhy(k,st),tag=P.def[0]==0?"鎮長下令":P.def[0]==1?"居民投票":"鎮長或投票";
  return `<button class="act" data-pw="${k}" ${w?`data-dis="${esc(w)}" style="opacity:.45"`:""}><b>${P.n}</b><small>${tag} · ${P.d}${w?`<br>現在不能用：${esc(w)}`:""}</small></button>`}).join("");
 const log=(st.log||[]).map(e=>{const can=!mayor&&e.ap&&!e.undone&&!e.appealed&&age(e.at)<864e5&&!v;
  return `<div class="mrow"><span>${pwLine(e)} <small class="mut">${pwTime(e.at)}${e.undone?" · 已推翻":e.appealed?" · 申訴過":""}</small></span>${can?`<button data-ap="${e.id}">申訴</button>`:""}</div>`}).join("")||'<p class="mut">還沒有人使用過管理權</p>';
 const hist=(st.hist||[]).map(h=>`<p class="mut">· ${esc(h.m)}</p>`).join("");
 $("mbody").innerHTML=`<h2>鎮長管理權</h2><p class="mut">鎮基金 ${CUR}${(+st.fund).toLocaleString()} · 鎮長${mayor?"（你）":""}行使的每件事都會公開寫進動態；覺得不公平的居民可以申訴，投票推翻。鎮長不能對自己行使</p>${vh}<h3>權力</h3>${pows}${mayor?`<h3>開關</h3><p class="mut">鎮長可以關掉關人、放人、罰款、補助（彈劾與建設案關不掉）</p><div class="list">${["jail","free","fine","grant"].map(k=>`<label class="mrow" style="cursor:pointer"><span><b>${POWERS[k].n}</b></span><input type="checkbox" data-po="${k}" ${(st.off||[]).includes(k)?"":"checked"} style="width:22px;height:22px"></label>`).join("")}</div><div class="row" style="justify-content:flex-start"><button class="pri" id="pos">儲存開關</button></div>`:""}<h3>使用紀錄</h3><div class="list">${log}</div>${hist?`<h3>投票結果</h3>${hist}`:""}<div class="row"><button id="mc">關閉</button></div>`;
 pxify($("mbody"));
 $("mc").onclick=()=>$("modal").classList.add("hide");
 $("mbody").querySelectorAll("[data-pv]").forEach(b=>b.onclick=()=>pwVote(b.dataset.pv));
 $("mbody").querySelectorAll("[data-ap]").forEach(b=>b.onclick=()=>pwAppeal(b.dataset.ap));
 $("mbody").querySelectorAll("[data-pw]").forEach(b=>b.onclick=()=>{const k=b.dataset.pw,P=POWERS[k];if(b.dataset.dis)return toast(b.dataset.dis);
  if(P.go=="civic")return civicModal();if(P.go=="mayor")return mayorPanel();
  if(P.def[6])return pwPick(k,st);pwCall(k)});
 const so=$("pos");if(so)so.onclick=async()=>{const off=[...document.querySelectorAll("[data-po]")].filter(c=>!c.checked).map(c=>c.dataset.po);await civAct("town_power",{op:"toggle",note:off.join(",")});powersModal()}}
// 被行使管理權的人上線時看到說明（items.pwn，SQL 的 town_pw_pwn）
let pwShown={};
function checkPwn(){const r=R[me];if(!r||!r.items||!Array.isArray(r.items.pwn)||!r.items.pwn.length||modalOpen()||!S)return;const p=r.items.pwn[0];if(pwShown[p.id+p.at])return;pwShown[p.id+p.at]=1;
 const ack=()=>rpc("town_power",{rid:me,pin,op:"ack"}).then(()=>refresh()).catch(()=>{});
 choiceModal(`鎮長 ${esc(p.bn)} 對你行使了權力`,esc(p.m),(p.ap?[["申訴","請居民投票推翻這個決定",()=>{ack();pwAppeal(p.id)}]]:[]).concat([["知道了","",()=>ack()]]))}
function noteModal(id){const t=R[id];$("modal").classList.remove("hide");const quick=["記得吃飯！🍚","晚安 🌙","今天加油！💪","想你了 🥺","快去洗澡 🛁","下次一起吃飯？"];
 $("mbody").innerHTML=`<h2>📱 傳訊息給 ${esc(t.name)}</h2><div class="houses">${quick.map(q=>`<button class="sw" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div><input id="ntx" maxlength="30" placeholder="或自己寫（最多 30 字）" style="margin-top:10px"><p class="err" id="nerr"></p>
  <div class="row"><button id="mc">取消</button><button class="pri" id="ms">傳送</button></div>`;
 $("mbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{$("ntx").value=b.dataset.q});$("mc").onclick=()=>$("modal").classList.add("hide");
 $("ms").onclick=async()=>{const v=$("ntx").value.trim();if(!v){$("nerr").textContent="寫一句話，或點上面的選項";return}$("modal").classList.add("hide");await act("note",{target:id,note:v})}}

// ── 畫面：靜態地圖畫一次（白天、晚上各一張，房子或人數變了才重畫），動態的人與噴水池每幀畫 ──
const cv=$("cv"),g=cv.getContext("2d"),cam={x:0,y:0,s:1};let maps={};
const grassV=(()=>{let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;return [...Array(40)].map(()=>[...Array(COLS)].map(r))})();
// 門口擺飾
function deco(m,d,x,y,night){const R=(a,b,w,h,c)=>{m.fillStyle=c;m.fillRect(x+a,y+b,w,h)};
 if(d=="flowers"){R(-10,2,22,6,"#6b4423");[["#e74c3c",-8],["#f1c40f",-2],["#e0779b",4],["#9b59b6",9]].forEach(([c,a])=>{R(a,-4,4,4,c);R(a+1,0,2,3,"#2e7d32")})}
 if(d=="mailbox"){R(-1,-6,3,14,"#6b4423");R(-6,-14,13,9,"#c0392b");R(7,-14,2,5,"#f1c40f")}
 if(d=="lamp"){R(-1,-22,3,30,"#444");R(-5,-26,11,6,night?"#ffd76a":"#ddd");if(night){m.fillStyle="rgba(255,215,106,.25)";m.beginPath();m.arc(x,y-22,18,0,7);m.fill()}}
 if(d=="bench"){R(-12,-4,26,4,"#8b5a2b");R(-12,-10,26,3,"#8b5a2b");R(-10,0,3,6,"#5a3a1a");R(9,0,3,6,"#5a3a1a")}
 if(d=="tree"){R(-2,-2,4,10,"#6b4423");m.fillStyle=night?"#2f6b3a":"#4caf50";m.beginPath();m.arc(x,y-8,10,0,7);m.fill()}
 if(d=="pigstatue"){R(-8,2,16,6,"#9a9a9a");m.fillStyle="#f6a5c0";m.beginPath();m.arc(x,y-6,9,0,7);m.fill();R(-8,-16,4,4,"#ec7fa6");R(4,-16,4,4,"#ec7fa6");R(-4,-6,8,5,"#ec7fa6");R(-4,-11,2,2,"#222");R(2,-11,2,2,"#222")}}
function buildMap(night){const ROWS=mapRows(),c=document.createElement("canvas");c.width=COLS*T;c.height=ROWS*T;const m=c.getContext("2d");
 const sign=(t,x,y,bg)=>{m.font="16.5px Cubic11,monospace";const w=m.measureText(t).width+14;m.fillStyle=bg||"rgba(20,20,20,.8)";m.fillRect(x-w/2,y-11,w,22);m.fillStyle="#fff";m.textAlign="center";m.textBaseline="middle";m.fillText(t,x,y+1)};
 const win=(x,y,lit)=>{m.fillStyle=night&&lit!==false?"#ffd76a":"#bfe3ff";m.fillRect(x,y,16,14);m.fillStyle="rgba(255,255,255,.5)";m.fillRect(x,y,16,3);m.fillStyle="#3a3a3a";m.fillRect(x+7,y,2,14)};
 for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const v=grassV[j][i];m.fillStyle=v<.5?"#7cc46a":"#74bb62";m.fillRect(i*T,j*T,T,T);if(v>.92){m.fillStyle="#f5f0a0";m.fillRect(i*T+10,j*T+12,4,4)}}
 m.fillStyle="#6f7078";for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isRoad(i,j))m.fillRect(i*T,j*T,T,T);
 // 人行道：路邊的磚（磚縫與路緣石）
 for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isSide(i,j)){const X=i*T,Y=j*T;m.fillStyle=(i+j)%2?"#cfcfd2":"#c4c4c8";m.fillRect(X,Y,T,T);m.fillStyle="#b0b0b5";m.fillRect(X,Y+T/2,T,1);m.fillRect(X+T/2,Y,1,T);m.fillStyle="#8c8c92";
  if(isRoad(i,j-1))m.fillRect(X,Y,T,3);if(isRoad(i,j+1))m.fillRect(X,Y+T-3,T,3);if(isRoad(i-1,j))m.fillRect(X,Y,3,T);if(isRoad(i+1,j))m.fillRect(X+T-3,Y,3,T)}
 // 道路中線（黃虛線，路口不畫）與斑馬線
 m.fillStyle="#f1c40f";for(let j=0;j<ROWS;j++)if(roadRowsAt(j)&&!roadRowsAt(j-1))for(let i=0;i<COLS;i++){if(i==16||i==17)continue;for(let k=2;k<T;k+=16)m.fillRect(i*T+k,(j+1)*T-1,10,3)}
 for(let j=0;j<ROWS;j++)if(!(j>=8&&j<=14)&&!roadRowsAt(j))for(let k=2;k<T;k+=16)m.fillRect(17*T-1,j*T+k,3,10);
 m.fillStyle="#f2f2f2";for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(isCross(i,j)){const X=i*T,Y=j*T;if(roadRowsAt(j))for(let k=3;k<T;k+=8)m.fillRect(X+k,Y,5,T);else for(let k=3;k<T;k+=8)m.fillRect(X,Y+k,T,5)}
 const [px,py,pw,ph]=PLACES.plaza.r;for(let j=py;j<py+ph;j++)for(let i=px;i<px+pw;i++){m.fillStyle=(i+j)%2?"#cbbf9f":"#d9cfb4";m.fillRect(i*T,j*T,T,T)}
 m.fillStyle="#5aa84f";const [qx,qy,qw,qh]=PLACES.park.r;m.fillRect(qx*T,qy*T,qw*T,qh*T);m.fillStyle="#d9cfb4";m.fillRect(qx*T,19*T+10,qw*T,12);m.fillStyle="#8b5a2b";m.fillRect(32*T,18*T+4,44,10);m.fillRect(32*T+4,18*T+14,4,8);m.fillRect(32*T+36,18*T+14,4,8);
 for(let s=0;s<NR*3;s++){const [hx,hy]=homeXY(s),X=hx*T,Y=hy*T,W=5*T,o=bySlot(s);m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+T+10,W,3*T);const it=(o&&o.items)||{};m.fillStyle=o?(it.wall||"#f4ead6"):"#e2ddd2";m.fillRect(X,Y+T,W,3*T-6);
  m.fillStyle=o?(it.roof||ROOFS[s]):"#9a9a9a";m.fillRect(X-8,Y,W+16,T+14);m.fillStyle="rgba(0,0,0,.15)";for(let k=0;k<W+16;k+=12)m.fillRect(X-8+k,Y,6,T+14);m.fillStyle="rgba(255,255,255,.25)";m.fillRect(X-8,Y,W+16,4);
  win(X+20,Y+T+26,!!o);win(X+W-36,Y+T+26,!!o);m.fillStyle="#7a4a24";m.fillRect(X+W/2-11,Y+3*T+4,22,T-10);m.fillStyle="#e0b050";m.fillRect(X+W/2+5,Y+3*T+18,3,3);m.fillStyle="#cbbf9f";m.fillRect(X+W/2-10,Y+4*T,20,T);
  {const hl=o?hlc(it.hl):1;
   if(hl>=2){m.fillStyle="rgba(0,0,0,.22)";m.fillRect(X-8,Y+T+10,W+16,6);[X+20,X+W-36].forEach(a=>{m.fillStyle="#8b5a2b";m.fillRect(a-2,Y+T+40,20,6);m.fillStyle="#e74c3c";m.fillRect(a,Y+T+36,4,4);m.fillStyle="#f1c40f";m.fillRect(a+8,Y+T+36,4,4)})}
   if(hl>=3){m.fillStyle="#8d8d8d";m.fillRect(X+W-30,Y-16,16,24);m.fillStyle="#6d6d6d";m.fillRect(X+W-32,Y-20,20,6);m.fillStyle="#f4f1de";for(let k=-6;k<W+8;k+=14){if(k>W/2-26&&k<W/2+26)continue;m.fillRect(X+k,Y+3*T+14,4,18)}m.fillRect(X-6,Y+3*T+20,W/2-26+6,3);m.fillRect(X+W/2+26,Y+3*T+20,W/2-26+6,3)}
   if(hl>=4){m.fillStyle="#f1c40f";m.fillRect(X-8,Y,W+16,5);m.fillStyle="#e8d9a8";[W/2-30,W/2+22].forEach(a=>{m.fillRect(X+a,Y+T+30,8,2*T-12);m.fillStyle="#cdbb85";m.fillRect(X+a-2,Y+T+26,12,6);m.fillStyle="#e8d9a8"})}}
  sign(o?o.name+" 的家":"空屋",X+W/2,Y+T/2+6,o?null:"rgba(90,90,90,.85)");
  ((it.d)||[]).slice(0,4).forEach((d,i)=>deco(m,d,X+[16,48,144,172][i],Y+4*T+18,night))}
 const bld=(k,wall,roof,deco)=>{if(!isOn(k))return;const [x,y,w,h]=PLACES[k].r,X=x*T,Y=y*T,W=w*T,H=h*T;m.fillStyle="rgba(0,0,0,.18)";m.fillRect(X+8,Y+16,W,H);m.fillStyle=wall;m.fillRect(X,Y+14,W,H-14);m.fillStyle=roof;m.fillRect(X-6,Y,W+12,20);deco(X,Y,W,H)};
 bld("office","#b8c4cf","#5f6b78",(X,Y,W,H)=>{for(let a=0;a<5;a++)for(let b=0;b<3;b++)win(X+16+a*40,Y+36+b*40);m.fillStyle="#555";m.fillRect(X+W/2-14,Y+H-36,28,36)});
 bld("restaurant","#fff3e0","#c0392b",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#e74c3c";m.fillRect(X+k,Y+20,24,16)}win(X+20,Y+60);win(X+W-36,Y+60);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-44,24,44)});
 bld("market","#eef7ea","#2e8b57",(X,Y,W,H)=>{m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+14,Y+44,W-28,46);m.fillStyle="#2e8b57";for(let k=X+14;k<X+W-14;k+=28)m.fillRect(k,Y+44,3,46);m.fillStyle="#7a4a24";m.fillRect(X+W/2-14,Y+H-44,28,44)});
 bld("arena","#5a3a2a","#b22222",(X,Y,W,H)=>{m.fillStyle="#2b1d14";m.fillRect(X+16,Y+30,W-32,H-56);m.strokeStyle="#ffd23f";m.lineWidth=3;for(let k=0;k<3;k++)m.strokeRect(X+24+k*6,Y+38+k*6,W-48-k*12,H-72-k*12);m.fillStyle="#fee761";m.font="16.5px Cubic11,monospace";m.textAlign="center";m.fillText("FIGHT",X+W/2,Y+H/2+6);m.fillStyle="#3a2212";m.fillRect(X+W/2-14,Y+H-30,28,30)});
 bld("jail","#9a9aa0","#4a4a55",(X,Y,W,H)=>{m.fillStyle="#2a2a33";for(let k=0;k<3;k++)m.fillRect(X+12+k*48,Y+34,26,36);m.fillStyle="#cfcfd6";for(let k=0;k<3;k++)for(let q=0;q<4;q++)m.fillRect(X+15+k*48+q*6,Y+34,2,36);m.fillStyle="#555";m.fillRect(X+W/2-16,Y+H-40,32,40);m.fillStyle="#e8c547";m.fillRect(X+W/2+6,Y+H-22,5,5)});
bld("hospital","#f4f6fa","#d9534f",(X,Y,W,H)=>{m.fillStyle="#d9534f";m.fillRect(X+W/2-4,Y+22,8,26);m.fillRect(X+W/2-13,Y+31,26,8);win(X+14,Y+66);win(X+W-30,Y+66);m.fillStyle="#9ec9e8";m.fillRect(X+W/2-14,Y+H-44,28,44);m.fillStyle="#fff";m.fillRect(X+W/2-1,Y+H-44,2,44)});
 bld("police","#c8d3e6","#2c3e8c",(X,Y,W,H)=>{m.fillStyle="#fee761";m.fillRect(X+W/2-7,Y+22,14,14);m.fillStyle="#2c3e8c";m.fillRect(X+W/2-3,Y+26,6,6);win(X+14,Y+46);win(X+W-30,Y+46);m.fillStyle="#1f2d6b";m.fillRect(X+W/2-14,Y+H-38,28,38);m.fillStyle="#e74c3c";m.fillRect(X+W/2-14,Y+H-42,28,4)});
 bld("townhall","#ebe0c8","#7a4a24",(X,Y,W,H)=>{m.fillStyle="#d8d0b8";for(let k=0;k<4;k++)m.fillRect(X+14+k*((W-40)/3),Y+34,8,H-60);m.fillStyle="#6b4423";m.fillRect(X+W/2-1,Y-22,3,24);m.fillStyle="#e74c3c";m.fillRect(X+W/2+2,Y-22,14,8);m.fillStyle="#8f563b";m.fillRect(X+W/2-14,Y+H-40,28,40);m.fillStyle="#fee761";m.fillRect(X+W/2+6,Y+H-22,4,4)});
 bld("slaughter","#8a8a7a","#4a4a42",(X,Y,W,H)=>{m.fillStyle="#6b1b1b";for(let k=0;k<5;k++)m.fillRect(X+20+k*40,Y+H-24-(k%2)*6,6,4);m.fillStyle="#333";m.fillRect(X+20,Y+34,W-40,6);for(let k=X+30;k<X+W-30;k+=34){m.fillStyle="#bbb";m.fillRect(k,Y+40,3,14);m.fillRect(k-4,Y+52,10,3)}m.fillStyle="#2a2a2a";m.fillRect(X+W/2-16,Y+H-40,32,40);m.fillStyle="#c0392b";m.font="16.5px Cubic11,monospace";m.textAlign="center";m.fillText("危險",X+W/2,Y+H-46)});
 bld("cafe","#f3e1c7","#6b4423",(X,Y,W,H)=>{for(let k=0;k<W;k+=24){m.fillStyle=(k/24)%2?"#fff":"#2e7d32";m.fillRect(X+k,Y+20,24,14)}win(X+18,Y+50);win(X+W-34,Y+50);m.fillStyle="#7a4a24";m.fillRect(X+W/2-12,Y+H-40,24,40);m.fillStyle="#fff";m.fillRect(X+W/2-30,Y+56,14,10);m.fillStyle="#6b4423";m.fillRect(X+W/2-28,Y+58,10,6)});
 bld("cinema","#3b2a4a","#c0392b",(X,Y,W,H)=>{m.fillStyle="#1b1b2f";m.fillRect(X+20,Y+26,W-40,26);m.fillStyle="#fee761";m.font="16.5px Cubic11,monospace";m.textAlign="center";m.fillText("CINEMA",X+W/2,Y+46);for(let k=X+10;k<X+W-10;k+=16){m.fillStyle=night?"#ffe36a":"#d6b33a";m.fillRect(k,Y+58,6,6)}m.fillStyle="#7a1d2b";m.fillRect(X+W/2-20,Y+H-44,40,44)});
 bld("rafi","#dfe6ee","#1f3a5f",(X,Y,W,H)=>{for(let a=0;a<4;a++)for(let b=0;b<2;b++)win(X+14+a*50,Y+34+b*32);m.fillStyle="#1f3a5f";m.fillRect(X+W/2-14,Y+H-30,28,30);m.fillStyle="#9fd0ff";m.fillRect(X+W/2-10,Y+H-26,9,26);m.fillRect(X+W/2+1,Y+H-26,9,26)});
 bld("stock","#e9e4d4","#2c3e50",(X,Y,W,H)=>{for(let k=0;k<3;k++){m.fillStyle="#d8d0b8";m.fillRect(X+10+k*28,Y+50,10,H-80)}m.fillStyle="#1b1b2f";m.fillRect(X+8,Y+26,W-16,20);m.fillStyle="#63c74d";m.fillRect(X+14,Y+36,10,4);m.fillRect(X+26,Y+34,10,6);m.fillStyle="#e43b44";m.fillRect(X+40,Y+34,10,6);m.fillRect(X+52,Y+36,10,4);m.fillStyle="#555";m.fillRect(X+W/2-12,Y+H-30,24,30)});
 bld("casino","#2a1a3a","#8e1b2e",(X,Y,W,H)=>{m.fillStyle="#1b1b2f";m.fillRect(X+8,Y+24,W-16,22);for(let i=0;i<8;i++){m.fillStyle=i%2?"#f1c40f":"#e74c3c";m.fillRect(X+12+i*Math.floor((W-32)/7),Y+30,8,8)}win(X+14,Y+54);win(X+W-30,Y+54);m.fillStyle="#f1c40f";m.fillRect(X+W/2-14,Y+H-34,28,34);m.fillStyle="#3a2a1a";m.fillRect(X+W/2-10,Y+H-30,9,30);m.fillRect(X+W/2+1,Y+H-30,9,30)});
 bld("carshop","#e8eef5","#c0392b",(X,Y,W,H)=>{m.fillStyle="#1b1b2f";m.fillRect(X+6,Y+24,W-12,44);m.fillStyle=night?"#ffe9a8":"#cfeefc";m.fillRect(X+8,Y+26,W-16,40);m.fillStyle="#c0392b";m.fillRect(X+14,Y+48,W-28,12);m.fillRect(X+20,Y+42,W-40,8);m.fillStyle="#222";m.fillRect(X+16,Y+58,8,8);m.fillRect(X+W-24,Y+58,8,8);m.fillStyle="#555";m.fillRect(X+W/2-10,Y+H-30,20,30);m.fillStyle="#f1c40f";m.fillRect(X+4,Y+22,W-8,3)});
 bld("gym","#c9d1dc","#34495e",(X,Y,W,H)=>{win(X+16,Y+40);win(X+W-32,Y+40);m.fillStyle="#222";m.fillRect(X+W/2-22,Y+34,44,6);m.fillRect(X+W/2-28,Y+28,8,18);m.fillRect(X+W/2+20,Y+28,8,18);m.fillStyle="#555";m.fillRect(X+W/2-12,Y+H-36,24,36)});
 const trees=[];for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++)if(!blocked(i,j)&&!isRoad(i,j)&&!isSide(i,j)&&!inRect(i,j,PLACES.plaza.r)&&!inRect(i,j,PLACES.park.r)&&!Object.values(OBJS).some(q=>q.x==i&&q.y==j)&&grassV[j][i]<.1&&![...Array(NR*3).keys()].some(s=>{const d=door(s),[hx,hy]=homeXY(s);return (Math.abs(d[0]-i)<=1&&Math.abs(d[1]-j)<=1)||(j==hy+4&&i>=hx&&i<hx+5)}))trees.push([i,j]);
 [[28,18],[30,18],[33,18],[35,18],[29,20],[34,20]].forEach(t=>trees.push(t));
 trees.forEach(([i,j])=>{const x=i*T+16,y=j*T+18;m.fillStyle="rgba(0,0,0,.2)";m.beginPath();m.ellipse(x+4,y+12,14,5,0,0,7);m.fill();m.fillStyle="#6b4423";m.fillRect(x-3,y,6,12);m.fillStyle=night?"#2f6b3a":"#3f9a4c";m.beginPath();m.arc(x,y-4,14,0,7);m.fill();m.fillStyle=night?"#3d7f48":"#5cbf63";m.beginPath();m.arc(x-4,y-9,7,0,7);m.fill()});
 for(let k=0;k<NR;k++){const y=k==0?6:k==1?15:22+7*(k-2);sign(STREETS[k],8*T,y*T+T,"rgba(60,60,60,.8)")}
 {const R0=(x,y,w,h,c)=>{m.fillStyle=c;m.fillRect(x,y,w,h)},o=OBJS;
  let X=o.vend.x*T,Y=o.vend.y*T;R0(X+4,Y-14,24,40,"#c0392b");R0(X+8,Y-10,16,14,night?"#ffe9a8":"#cfeefc");R0(X+8,Y+8,16,4,"#222");R0(X+10,Y+16,12,6,"#7f1d1d");
  X=o.trash.x*T;Y=o.trash.y*T;R0(X+8,Y+4,16,22,"#2e7d32");R0(X+6,Y,20,5,"#1b5e20");
  X=o.stall.x*T;Y=o.stall.y*T;R0(X+2,Y+8,28,16,"#8b5a2b");R0(X,Y-10,32,8,"#e74c3c");R0(X+14,Y-2,4,10,"#5a3a1a");R0(X+6,Y+4,6,4,"#c0602b");R0(X+16,Y+4,6,4,"#c0602b");
  const S=(k,f)=>{X=o[k].x*T;Y=o[k].y*T;f()};
  S("bench",()=>{R0(X+2,Y+8,28,4,"#a8703a");R0(X+2,Y+14,28,5,"#8b5a2b");R0(X+4,Y+19,4,8,"#5a3a1a");R0(X+24,Y+19,4,8,"#5a3a1a")});
  S("cooler",()=>{R0(X+8,Y+6,16,20,"#cfe9f7");R0(X+10,Y,12,8,"#5dade2");R0(X+12,Y+14,8,4,"#2471a3")});
  S("mailbox",()=>{R0(X+6,Y+6,20,14,"#1f5fbf");R0(X+8,Y+10,16,3,"#fff");R0(X+14,Y+20,4,10,"#555")});
  S("claw",()=>{R0(X+2,Y-8,28,34,"#e84393");R0(X+6,Y-4,20,18,"#fdebd0");R0(X+14,Y-4,2,8,"#aaa");R0(X+10,Y+16,12,4,"#222")});
  S("news",()=>{R0(X+2,Y+8,28,16,"#e67e22");R0(X,Y-4,32,8,"#2980b9");R0(X+6,Y+10,8,8,"#fff");R0(X+18,Y+10,8,8,"#f1c40f")});
  S("pwc",()=>{R0(X+4,Y-10,24,36,"#7f8c8d");R0(X+8,Y-4,16,10,"#fff");R0(X+12,Y+10,8,16,"#34495e")});
  S("dummy",()=>{R0(X+14,Y-10,4,40,"#6b4423");R0(X+4,Y-2,24,5,"#8b5a2b");R0(X+8,Y-22,16,14,"#e0c28a");R0(X+8,Y-22,16,3,"#c9a96a");R0(X+11,Y-17,3,3,"#222");R0(X+18,Y-17,3,3,"#222");R0(X+8,Y-6,16,16,"#d9a441");R0(X+12,Y-2,8,8,"#c0392b");R0(X+14,Y+0,4,4,"#fff")});
  S("lottery",()=>{R0(X+2,Y+8,28,16,"#c0392b");R0(X,Y-6,32,10,"#f1c40f");R0(X+8,Y+10,16,8,"#fff")});
  X=31*T;Y=21*T;R0(X,Y-24,4,30,"#6b4423");R0(X+28,Y-24,4,30,"#6b4423");R0(X,Y-26,32,4,"#6b4423");R0(X+10,Y-22,2,18,"#888");R0(X+20,Y-22,2,18,"#888");R0(X+8,Y-4,16,4,"#d8901a")}
 sign("公司",30.5*T,10);sign("餐廳",5*T,9*T+10);sign("超市",28*T,9*T+10);sign("公園",31.5*T,17*T+12);sign("小豬廣場",17*T,8*T+14);if(isOn("casino"))sign("賭場",68.5*T,8*T+10);if(isOn("cafe"))sign("咖啡廳",39*T,10);if(isOn("cinema"))sign("電影院",40*T,9*T+10);if(isOn("gym"))sign("健身房",41*T,17*T+10);if(isOn("rafi"))sign("拉菲's office",49.5*T,17*T+10);if(isOn("stock"))sign("證交所",46*T,10);if(isOn("jail"))sign("監獄",61.5*T,10);if(isOn("hospital"))sign("醫院",61.5*T,9*T+10);if(isOn("police"))sign("警察局",59*T,17*T+10);if(isOn("townhall"))sign("市政廳",68.5*T,10);if(isOn("carshop"))sign("車行",47*T,9*T+14);if(isOn("arena"))sign("格鬥場",53.5*T,10);if(isOn("slaughter"))sign("屠宰場",53.5*T,9*T+10);
 if(night){m.fillStyle="rgba(18,28,78,.45)";m.fillRect(0,0,c.width,c.height)}
 return c}
// 畫一個角色：(x,y) 是身體中心，u 是一格像素的大小
function drawChar(c,x,y,u,L0,st,tk){const L=normLook(L0),b=st.moving?Math.floor(tk/7)%2:0,R=(cx,cy,w,h,col)=>{c.fillStyle=col;c.fillRect(x+cx*u,y+cy*u,w*u,h*u)},H=L.hair;
 if(st.sleeping){R(-9,2,14,7,"#7fa8d8");for(let i=-8;i<5;i+=3)R(i,2,1,7,"#5d86b8");R(5,2,7,7,L.skin);R(10,2,2,7,H);return}// 睡衣
 const bare=L.bottom!="長褲"||L.top=="dress",leg=bare?L.skin:L.pants;
 R(-4,5,3,6-b*2,leg);R(1,5,3,4+b*2,leg);R(-4,11-b*2,3,1,"#3a2a20");R(1,9+b*2,3,1,"#3a2a20");
 if(L.top!="dress"){if(L.bottom=="短褲")R(-4,5,8,3,L.pants);if(L.bottom=="裙子")R(-5,5,10,3,L.pants)}
 const sc=L.top=="suit"?"#2c3140":L.top=="couple"?"#f06b9b":L.shirt;R(-5,-3,10,9,sc);
 if(L.top=="dress")R(-6,4,12,4,sc);if(L.top=="帽T"){R(-4,-3,8,1.5,"rgba(0,0,0,.25)");R(-2,2,4,2,"rgba(0,0,0,.18)")}
 if(L.top=="襯衫")R(-1.5,-3,3,2,"#fff");if(L.top=="suit"){R(-1,-3,2,6,"#fff");R(-.5,-2,1,4,"#c0392b")}
 if(L.top=="jersey"){R(-5,-1,10,1,"#fff");R(-1,1,2,3,"#fff")}if(L.top=="couple"){R(-1.5,0,1.5,1.5,"#fff");R(0,0,1.5,1.5,"#fff");R(-.75,1.2,1.5,1,"#fff")}
 if(st.dirty){R(-3,0,2,1,"#6b4a2b");R(2,2,1,1,"#6b4a2b");R(-1,4,2,1,"#6b4a2b")}
 R(-4,-11,8,8,L.skin);
 const hs={短髮:()=>R(-4,-12,8,3,H),長髮:()=>{R(-5,-12,10,3,H);R(-5,-10,2,8,H);R(3,-10,2,8,H)},光頭:()=>{},馬尾:()=>{R(-4,-12,8,3,H);R(4,-10,2,5,H)},
  捲髮:()=>{R(-5,-12,10,2,H);R(-5,-10,1,3,H);R(4,-10,1,3,H);R(-3,-13,2,1,H);R(1,-13,2,1,H)},包頭:()=>{R(-4,-12,8,2,H);R(-2,-14,4,2,H)},瀏海:()=>{R(-4,-12,8,3,H);R(-4,-9,5,1,H)},
  twintail:()=>{R(-4,-12,8,3,H);R(-6,-10,2,6,H);R(4,-10,2,6,H)},mohawk:()=>R(-1,-14,2,4,H)};(hs[L.style]||hs.短髮)();
 const ey={圓眼:()=>{R(-2,-8,1,2,"#222");R(2,-8,1,2,"#222")},瞇眼:()=>{R(-3,-7,2,.8,"#222");R(1,-7,2,.8,"#222")},
  眼鏡:()=>{R(-3,-9,3,.6,"#222");R(1,-9,3,.6,"#222");R(-3,-9,.6,2.4,"#222");R(3.4,-9,.6,2.4,"#222");R(-2,-8,1,1.4,"#222");R(2,-8,1,1.4,"#222")},墨鏡:()=>R(-3.5,-8.5,7.5,2,"#111")};(ey[L.eyes]||ey.圓眼)();
 if(L.blush){R(-4,-6,1.5,1,"#ff9fb0");R(2.5,-6,1.5,1,"#ff9fb0")}if(L.beard)R(-4,-5,8,2,H);
 if(st.bruised){R(1,-9,3,3,"#6b3fa0");R(-4,-6,4,1,"#fff");R(-3,-7,1,3,"#fff")}
 const ac={棒球帽:()=>{R(-5,-13,10,3,"#c0392b");R(-6,-10.5,7,1.2,"#a02a20")},毛帽:()=>{R(-5,-14,10,4,"#e67e22");R(-1,-15,2,1,"#fff")},
  crown:()=>{R(-4,-15,8,2.5,"#f1c40f");R(-4,-16.5,1.2,1.5,"#f1c40f");R(-.6,-17,1.2,2,"#f1c40f");R(2.8,-16.5,1.2,1.5,"#f1c40f");R(-.5,-14.5,1,1,"#e74c3c")},
  pigears:()=>{R(-5,-14.5,3,3,"#f6a5c0");R(2,-14.5,3,3,"#f6a5c0");R(-4.3,-13.8,1.5,1.5,"#ec7fa6");R(2.8,-13.8,1.5,1.5,"#ec7fa6")},
  headphones:()=>{R(-5,-13.2,10,1,"#333");R(-6,-9,2,3,"#333");R(4,-9,2,3,"#333")},scarf:()=>{R(-5,-4,10,2,"#c0392b");R(2,-2,2,3,"#c0392b")},bandage:()=>{R(-4,-11,8,1.5,"#fff");R(2,-12.5,2,1.5,"#fff")}};(ac[L.acc]||(()=>{}))()}
const CIMG={};const cimg=e=>{if(!CIMG[e]){const i=new Image();i.src=pxIcon(e);CIMG[e]=i}return CIMG[e]};
// 置中畫一行字，emoji 換成像素圖示；回傳寬度
function textIcons(t,cx,cy,sz,measureOnly){const parts=t.split(EMO).filter(x=>x&&!/^[\uFE0F\u200D]+$/.test(x));let w=0;const ws=parts.map(p=>{EMO.lastIndex=0;const ic=EMO.test(p);EMO.lastIndex=0;const pw=ic?sz+2:g.measureText(p).width;w+=pw;return [p,ic,pw]});
 if(measureOnly)return w;let x=cx-w/2;g.textAlign="left";for(const [p,ic,pw] of ws){if(ic){const im=cimg(p);if(im.complete)g.drawImage(im,x+1,cy-sz/2,sz,sz)}else g.fillText(p,x,cy);x+=pw}g.textAlign="center";return w}
const VSZ={bike:34,moto:40,car:54},VDY={bike:10,moto:10,car:1};
function vdraw(k,x,y,fx){const im=cimg(VEH[k][4]);if(!im.complete)return;const s=VSZ[k];g.save();g.translate(x,y+VDY[k]);g.scale(fx||1,1);g.drawImage(im,-s/2,-s/2,s,s);g.restore()}
function person(x,y,look,tk,moving,label,isMe,state){const u=1.6;
 if(isMe){g.strokeStyle="#ffd23f";g.lineWidth=3;g.beginPath();g.ellipse(x,y+12*u,11*u,4*u,0,0,7);g.stroke()}
 g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-5*u,y+10*u,10*u,3*u);if(state.veh&&state.veh!="car")vdraw(state.veh,x,y,state.fx);drawChar(g,x,y,u,look,{...state,moving},tk);if(state.veh=="car")vdraw("car",x,y,state.fx);
 if(state.sleeping){g.font="16.5px Cubic11,monospace";g.fillStyle="#fff";g.fillText("Zz",x+14*u,y-6*u+Math.sin(tk/20)*3)}
 if(state.stink){g.strokeStyle="#7bd36b";g.lineWidth=2;for(let k=-1;k<=1;k++){g.beginPath();for(let s=0;s<10;s++)g.lineTo(x+k*8*u+Math.sin(tk/6+s)*2,y-16*u-s*2.2);g.stroke()}}
 const k=1/cam.s;g.font=11*k+"px Cubic11,monospace";g.textAlign="center";g.textBaseline="middle";const tag=label+(state.bruised?" 🤕":"")+(state.hungry?" 🍚":""),w=textIcons(tag,0,0,14*k,true)+10*k,ty=y-32*u-(state.ly||0);g.fillStyle=isMe?"#a06e00":"#2a2a2a";g.fillRect(x-w/2,ty,w,18*k);g.fillStyle="#fff";textIcons(tag,x,ty+9*k,14*k);
 // 心情泡泡
 if(state.bubble){g.font=11*k+"px Cubic11,monospace";const bw=textIcons(state.bubble,0,0,13*k,true)+14*k,by=ty-26*k;g.fillStyle="#fff";g.beginPath();g.rect(x-bw/2,by,bw,22*k);g.fill();g.beginPath();g.moveTo(x-5*k,by+22*k);g.lineTo(x+5*k,by+22*k);g.lineTo(x,by+28*k);g.fill();g.fillStyle="#2c2620";textIcons(state.bubble,x,by+11*k,13*k)}}
function miniPerson(c,L){const m=c.getContext("2d"),u=c.height/30;m.clearRect(0,0,c.width,c.height);drawChar(m,c.width/2,17.5*u,u,L,{},0)}
let W=0,Hh=0,dpr=1;const snapS=s=>{const e=s*dpr;return e>=1?Math.max(1,Math.round(e))/dpr:s};
const isMob=()=>matchMedia("(max-width:700px)").matches;const isPC=()=>matchMedia("(min-width:900px)").matches;
function resize(){const box=$("stage");dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;Hh=(isMob()||isPC())?Math.round(box.clientHeight||innerHeight):Math.round(Math.min(innerHeight*.58,Math.max(300,W*.8)));cv.width=W*dpr;cv.height=Hh*dpr;cv.style.height=Hh+"px";
 // 平常地圖要填滿畫面（不留黑邊）；按「看全鎮」才縮到看得到整個鎮
 const fit=Math.min(W/(COLS*T),Hh/(mapRows()*T)),cover=Math.max(W/(COLS*T),Hh/(mapRows()*T));cam.minS=zoomFar?fit:cover;const def=W/((W<600?11:19)*T);cam.maxS=def*2.5;
 if(!cam.user)cam.s=zoomFar?cam.minS:def;cam.s=snapS(clamp(cam.s,cam.minS,cam.maxS))}
if(window.visualViewport)visualViewport.addEventListener("resize",resize);
// iPhone Safari：避免兩指縮放到整個網頁
document.addEventListener("gesturestart",e=>e.preventDefault());
addEventListener("resize",resize);
let tk=0,last=performance.now();const bubbles={};
// 心情泡泡：依狀態說一句話
function moodLine(id,r){const c=[];if(r.hunger<25)c.push("好餓…🍚","肚子在叫了");if(r.bladder<25)c.push("要尿尿了😣");if(r.hygiene<25)c.push("好像有點臭…");if(r.energy<20)c.push("好睏…😪");
 if(r.bruised)c.push("誰扁我的給我出來😤","臉好痛…");if(r.fun>80)c.push("今天心情超好✨","耶～");if(id!=me&&bondWith(id)<=-20)c.push("哼！","看什麼看");if(id!=me&&bondWith(id)>=30)c.push("嗨麻吉！💞");
 if(c.length&&Math.random()<.7)return rp(c);return rp(["好想吃火鍋…","今天天氣真好","有人要一起吃飯嗎？","想去公園走走","上班好累…","🎵～","晚餐吃什麼？","想睡午覺","有人在嗎？"])}
// 路口紅綠燈：四個角各一盞（東西向兩盞、南北向兩盞），亮的那顆實色、另一顆暗
function drawLights(){const ms=now();for(let y=0;y<mapRows();y++){if(!roadRowsAt(y)||roadRowsAt(y-1))continue;const ph=lightG(ms,y),X=16*T,Y=y*T,lamp=(x,yy,green)=>{g.fillStyle="#1b1b2f";g.fillRect(x,yy,10,16);g.fillStyle=green?"#2f5a35":"#e43b44";g.fillRect(x+2,yy+2,6,5);g.fillStyle=green?"#63c74d":"#6b2a2a";g.fillRect(x+2,yy+9,6,5)};
 lamp(X-12,Y+2,ph==0);lamp(X+2*T+2,Y+2*T-18,ph==0);lamp(X+2,Y-18,ph==1);lamp(X+2*T-12,Y+2*T+2,ph==1)}}
// 市政廳建好的設施（每幀畫在地圖上，建好就看得到）
function drawCivic(){const nt=isNight();for(const k of CIVP){const o=CIVIC[k];if(!o)continue;const X=o[2]*T,Y=o[3]*T;
 if(k=="bench2"){g.fillStyle="#8b5a2b";g.fillRect(X+2,Y+8,28,5);g.fillStyle="#6b4423";g.fillRect(X+2,Y+14,28,6);g.fillRect(X+4,Y+20,4,8);g.fillRect(X+24,Y+20,4,8)}
 else if(k=="lamp"){if(nt){g.fillStyle="rgba(255,244,180,.22)";g.beginPath();g.arc(X+16,Y-12,44,0,7);g.fill()}g.fillStyle="#3a3a3a";g.fillRect(X+14,Y-12,4,40);g.fillStyle=nt?"#fff3a8":"#fee761";g.fillRect(X+8,Y-22,16,10);g.fillStyle="#3a3a3a";g.fillRect(X+6,Y-24,20,3)}
 else if(k=="gazebo"){g.fillStyle="#6b4423";g.fillRect(X-6,Y-14,4,40);g.fillRect(X+34,Y-14,4,40);g.fillStyle="#c0392b";g.fillRect(X-12,Y-24,56,12);g.fillStyle="#e74c3c";g.fillRect(X-6,Y-30,44,8);g.fillStyle="#8b5a2b";g.fillRect(X-2,Y+14,36,6)}
 else if(k=="statue"){g.fillStyle="#9a9aa0";g.fillRect(X+6,Y+14,20,12);g.fillStyle="#f6a5c0";g.fillRect(X+8,Y-4,16,16);g.fillRect(X+6,Y-8,6,6);g.fillRect(X+20,Y-8,6,6);g.fillStyle="#ec7fa6";g.fillRect(X+12,Y+4,8,6);g.fillStyle="#1b1b2f";g.fillRect(X+11,Y,2,2);g.fillRect(X+19,Y,2,2)}}}
function frame(t){const dt=Math.min(.1,(t-last)/1000);last=t;tk++;requestAnimationFrame(frame);if(!S||!me||!R[me]||$("game").classList.contains("hide"))return;
 const night=isNight(),key=night?"n":"d";if(!maps[key])maps[key]=buildMap(night);const MW=COLS*T,MH=mapRows()*T;
 for(const id in walkers){const w=walkers[id];if(!R[id]||!w.path.length)continue;const [nx,ny]=w.path[0],dx=nx-w.x,dy=ny-w.y,d=Math.hypot(dx,dy),vk=vehOf(R[id]),rule=vk&&!vFull(R[id]);let vm=vk?vspd(R[id],vk):1;
  if(rule){vm=Math.min(vm,zoneLim(Math.round(w.y)));const cx=Math.round(w.x),cy=Math.round(w.y);
   if(Math.abs(w.x-cx)<.01&&Math.abs(w.y-cy)<.01&&isInter(nx,ny)&&!isInter(cx,cy)&&lightG(now(),ny)!=(dy==0?0:1)){w.moving=false;continue}}
  const sp=4.5*vm*dt;w.moving=true;if(Math.abs(dx)>.01)w.fx=dx<0?-1:1;
  if(d<=sp){w.x=nx;w.y=ny;w.path.shift();if(id==me&&((w.sc=(w.sc|0)+1)&1)&&window.SFX)SFX.play("step");if(!w.path.length){w.moving=false;if(id==me&&w.dest)arrived(w)}}else{w.x+=dx/d*sp;w.y+=dy/d*sp}}
 const mw=walkers[me];if(!camFree){const off=0;cam.x+=((mw.x+.5)*T-cam.x)*.12;cam.y+=((mw.y+.5)*T+off-cam.y)*.12}
 // 慣性：放手後繼續滑，慢慢停下
 if(!down&&!pinch&&(Math.abs(cam.vx||0)>.01||Math.abs(cam.vy||0)>.01)){cam.x+=cam.vx*dt*1000;cam.y+=cam.vy*dt*1000;const f=Math.pow(.92,dt*60);cam.vx*=f;cam.vy*=f}
 const vw=W/cam.s,vh=Hh/cam.s,mob=isMob(),pt=mob?8/cam.s:0,pb=mob?8/cam.s:0,mg=T;
 const bx=[vw/2-mg,MW-vw/2+mg],by=[vh/2-pt-mg,MH-vh/2+pb+mg];
 cam.x=bx[0]>bx[1]?MW/2:clamp(cam.x,bx[0],bx[1]);cam.y=by[0]>by[1]?MH/2+(pb-pt)/2:clamp(cam.y,by[0],by[1]);
 const ks=dpr*cam.s,ox=Math.round((cam.x-vw/2)*ks)/ks,oy=Math.round((cam.y-vh/2)*ks)/ks;cam.ox=ox;cam.oy=oy;
 if(drawRoomStage())return;
 g.setTransform(1,0,0,1,0,0);g.fillStyle="#3d6b35";g.fillRect(0,0,cv.width,cv.height);g.setTransform(dpr*cam.s,0,0,dpr*cam.s,-ox*dpr*cam.s,-oy*dpr*cam.s);g.imageSmoothingEnabled=false;g.drawImage(maps[key],0,0);drawLights();drawCivic();
 const fx=17*T,fy=11.5*T;g.fillStyle="#9a9a9a";g.beginPath();g.arc(fx,fy,48,0,7);g.fill();g.fillStyle="#4aa3e0";g.beginPath();g.arc(fx,fy,40,0,7);g.fill();g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(fx,fy,18+(tk%50)/2.2,0,7);g.stroke();
 g.fillStyle="#f6a5c0";g.beginPath();g.arc(fx,fy-4,15,0,7);g.fill();g.fillRect(fx-15,fy-21,8,9);g.fillRect(fx+7,fy-21,8,9);g.fillStyle="#ec7fa6";g.fillRect(fx-7,fy-2,14,9);g.fillStyle="#8a3a55";g.fillRect(fx-4,fy+1,3,3);g.fillRect(fx+2,fy+1,3,3);g.fillStyle="#222";g.fillRect(fx-8,fy-11,3,3);g.fillRect(fx+5,fy-11,3,3);
 g.fillStyle="#bfe6ff";g.fillRect(fx-1,fy-26-((tk%30)/30)*16,3,5);
 // 公園的流浪貓：在公園裡慢慢走來走去
 {const cx=(25.5+4*(1+Math.sin(t/7000)))*T,cy=(18.6+.8*Math.sin(t/3100))*T;g.fillStyle="#555";g.fillRect(cx-8,cy-4,16,8);g.fillRect(cx+6,cy-10,8,8);g.fillRect(cx+6,cy-12,2,3);g.fillRect(cx+12,cy-12,2,3);g.fillRect(cx-12,cy-8+Math.sin(t/300)*2,4,8);g.fillStyle="#ffd23f";g.fillRect(cx+8,cy-8,2,2);g.fillRect(cx+11,cy-8,2,2)}
 for(const q of POOPS){const im=cimgP("💩");if(im.complete)g.drawImage(im,q.x*T+2,q.y*T+2,T-4,T-4)}
 {const rr=[];for(let y=0;y<mapRows();y++)if(roadRowsAt(y))rr.push(y);if(rr.length>2){const py=rr[2]+.4,span=COLS-6,ph=(Date.now()/1000*1.5)%(span*2),px=3+(ph<span?ph:span*2-ph),dir=ph<span?1:-1;
  drawChar(g,px*T,py*T-6,1.6,{hair:'#1b2a6b'},{moving:true},Math.floor(Date.now()/120));g.fillStyle='#2e4aa8';g.fillRect(px*T+2,py*T-14,14,3);g.font="11px 'Cubic 11',monospace";g.textAlign='center';g.lineWidth=3;g.strokeStyle='#1b1b2f';g.strokeText('巡警',px*T+10,py*T-18);g.fillStyle='#9fc5ff';g.fillText('巡警',px*T+10,py*T-18);
  if(Math.floor(Date.now()/250)%2)for(const id in walkers){const w=walkers[id],o=R[id];if(!o||!w.path||!w.path.length||!vehOf(o))continue;if(Math.abs(w.x-px)<1.6&&Math.abs(w.y-py)<1.6){g.fillStyle='#e43b44';g.fillRect(w.x*T+8,w.y*T-24,5,10);g.fillRect(w.x*T+8,w.y*T-11,5,4)}}}}
 if(TRV&&TRV.here){const tp=TRV.place=='plaza'?[14,13]:[29,20];drawChar(g,tp[0]*T,tp[1]*T-6,1.6,{hair:'#d98b2b'},{moving:false},0);g.fillStyle='#8b5a2b';g.fillRect(tp[0]*T+14,tp[1]*T+2,7,9);g.font="11px 'Cubic 11',monospace";g.textAlign='center';g.lineWidth=3;g.strokeStyle='#1b1b2f';g.strokeText('旅人',tp[0]*T+10,tp[1]*T-14);g.fillStyle='#b9f2a1';g.fillText('旅人',tp[0]*T+10,tp[1]*T-14)}
 if(NPCV&&NPCV.here&&Date.parse(NPCV.until)>Date.now()){const mp=NPCV.place=='plaza'?[20,12]:[33,19];drawChar(g,mp[0]*T,mp[1]*T-6,1.6,{hair:'#8e44ad'},{moving:false},0);g.font="11px 'Cubic 11',monospace";g.textAlign='center';g.lineWidth=3;g.strokeStyle='#1b1b2f';g.strokeText('流動商人',mp[0]*T+10,mp[1]*T-14);g.fillStyle='#ffd166';g.fillText('流動商人',mp[0]*T+10,mp[1]*T-14)}
 {const tt=performance.now(),dt=Math.min(.1,(tt-(zbLast||tt))/1000);zbLast=tt;for(const z of ZB){const q=ZR[z.id]||(ZR[z.id]={x:z.x,y:z.y});const dx=z.x-q.x,dy=z.y-q.y,d=Math.hypot(dx,dy);if(d>.02){const st=Math.min(d,1.3*dt);q.x+=dx/d*st;q.y+=dy/d*st}drawZpig(g,q.x*T,q.y*T,tt)}}
 // 預計路徑：只畫自己的；一點一點的小方塊從腳下排到目的地，走過的自然消失；終點有閃動的黃框
 {const wm=walkers[me];if(wm&&wm.path.length){let px=wm.x,py=wm.y,acc=0;const dots=[];for(const [qx,qy] of wm.path){const sd=Math.hypot(qx-px,qy-py);if(sd>0){let at=.5-acc;while(at<=sd){const f=at/sd;dots.push([px+(qx-px)*f,py+(qy-py)*f]);at+=.5}acc=(acc+sd)%.5}px=qx;py=qy}
  g.save();for(let i=0;i<dots.length;i++){const [dx,dy]=dots[i],X=Math.round((dx+.5)*T),Y=Math.round((dy+.5)*T);if(Math.hypot(dx-wm.x,dy-wm.y)<.45)continue;g.globalAlpha=.85;g.fillStyle="#2a2a3a";g.fillRect(X-4,Y-4,8,8);g.fillStyle=i%2?"#fff":"#ffd23f";g.fillRect(X-3,Y-3,6,6)}
  const [ex,ey]=wm.path[wm.path.length-1],EX=Math.round(ex*T),EY=Math.round(ey*T),pu=2+Math.round(Math.sin(tk/8)*2);g.globalAlpha=1;g.strokeStyle="#2a2a3a";g.lineWidth=7;g.strokeRect(EX+5-pu,EY+5-pu,T-10+pu*2,T-10+pu*2);g.strokeStyle="#ffd23f";g.lineWidth=3;g.strokeRect(EX+5-pu,EY+5-pu,T-10+pu*2,T-10+pu*2);g.restore()}}
 // 人：依 y 排序，前面的蓋住後面的；在家睡覺的人在屋裡看不到，改在屋頂畫 💤；晚上有人在家的窗戶亮燈
 const list=Object.values(R).map(r=>({id:r.id,w:walkers[r.id],r:tickLocal(r,now())})).filter(o=>!(inside(o.r)&&!o.w.path.length)&&!(fin(o.r)&&!o.w.path.length)&&!(vin(o.r)&&!o.w.path.length&&R[+o.r.items.fv]&&inside(R[+o.r.items.fv]))).sort((a,b)=>a.w.y-b.w.y);
 const nowMs=Date.now(),seen=[];for(const o of list){const lyN=seen.filter(q=>Math.abs(q.x-o.w.x)<1.6&&Math.abs(q.y-o.w.y)<1.3).length;seen.push({x:o.w.x,y:o.w.y});const bb=bubbles[o.id]||(bubbles[o.id]={next:nowMs+2e3+Math.random()*15e3});if(nowMs>bb.next){bb.text=togetherAt(o.r.place)&&!o.r.sleeping&&Math.random()<.5?rp(TOGETHER_LINES):Math.random()<.6?moodLine(o.id,o.r):null;bb.until=nowMs+4500;bb.next=nowMs+18e3+Math.random()*25e3}
  person((o.w.x+.5)*T,(o.w.y+.5)*T,o.r.look,tk,o.w.moving,nameTag(o.r),o.id==me,{veh:vehOf(o.r),ly:lyN*20,fx:o.w.fx,sleeping:o.r.sleeping&&!o.w.path.length,stink:o.r.hygiene<25,dirty:o.r.hygiene<25,hungry:o.r.hunger<20,bruised:o.r.bruised,bubble:o.r.sleeping?null:o.r.bladder<20?"快憋不住 🚽":bb.text&&nowMs<bb.until?bb.text:null})}
 // 有人在設施裡面：兩扇窗戶亮燈
 for(const k in ROOMS){if(!isOn(k))continue;if(!Object.values(R).some(o=>fin(o)&&o.place==k&&!(walkers[o.id]&&walkers[o.id].path.length)))continue;const [x,y,w]=PLACES[k].r;g.fillStyle="rgba(255,215,106,.5)";g.fillRect(x*T+14,y*T+34,26,24);g.fillRect((x+w)*T-40,y*T+34,26,24)}
 for(const r of Object.values(R)){if(!inside(r))continue;const [hx,hy]=homeXY(r.slot);if(night){g.fillStyle="rgba(255,215,106,.35)";g.fillRect(hx*T+16,hy*T+T+22,24,22);g.fillRect(hx*T+5*T-40,hy*T+T+22,24,22)}
  // 在屋裡睡覺的人，或離線超過 10 分鐘待在家的人（回家休息了）：屋頂一直飄 Z
  if(r.sleeping){g.textAlign="center";g.lineWidth=3;g.strokeStyle="#2a3a6a";for(let j=0;j<3;j++){const ph=((tk/60)+j*14)%42,al=1-ph/42;g.globalAlpha=Math.max(0,al);g.font="bold "+(12+j*3)+"px sans-serif";const zx=hx*T+4.1*T+ph*.5+j*3,zy=hy*T+T+6-ph;g.strokeText("Z",zx,zy);g.fillStyle="#fff";g.fillText("Z",zx,zy)}g.globalAlpha=1}}
 // 互動動畫
 {const nowp=performance.now(),IMG=FXIMG;const img=e=>{if(!IMG[e]){const i=new Image();i.src=pxIcon(e);IMG[e]=i}return IMG[e]};const icon=(e,x,y,s)=>{const i=img(e);if(i.complete)g.drawImage(i,x-s/2,y-s/2,s,s)};
  const pos=id=>{const w=walkers[id];return [(w.x+.5)*T,(w.y+.5)*T]};
  for(let i=fxs.length-1;i>=0;i--){const f=fxs[i],k=(nowp-f.born)/f.dur;if(k>=1||!walkers[f.a]){fxs.splice(i,1);continue}const [ax,ay]=pos(f.a),[bx,by]=f.b?pos(f.b):[ax,ay],e=Math.sin(k*Math.PI);
   g.save();g.imageSmoothingEnabled=false;g.globalAlpha=k>.8?(1-k)*5:1;
   const up=(em,n=1,spread=14)=>{for(let j=0;j<n;j++)icon(em,ax+(j-(n-1)/2)*spread+Math.sin(k*9+j)*3,ay-50-k*40-j*4,24)};
   const fly=(em,arc=60)=>{const x=ax+(bx-ax)*k,y=ay+(by-ay)*k-50-Math.sin(k*Math.PI)*arc;icon(em,x,y,26)};
   switch(f.type){
    case "wk_desk":case "wk_scan":case "wk_docs":{const fl=Math.floor(nowp/110)%2,X=ax+10,Y=ay;g.fillStyle="#1b1b2f";g.fillRect(X-1,Y+6,30,2);
     if(f.type=="wk_desk"){g.fillStyle="#8a5a2b";g.fillRect(X,Y+2,28,5);g.fillRect(X+2,Y+7,3,9);g.fillRect(X+23,Y+7,3,9);g.fillStyle="#1b1b2f";g.fillRect(X+9,Y-14,15,12);g.fillStyle=fl?"#6fc6ff":"#bfe6ff";g.fillRect(X+11,Y-12,11,8);g.fillStyle="#9aa5b8";g.fillRect(X+14,Y-2,5,3);g.fillStyle="#d9d9d9";g.fillRect(X+4,Y,12,2);g.fillStyle="#f5c9a0";g.fillRect(X+2,Y-1-fl*2,4,3)}
     else if(f.type=="wk_scan"){g.fillStyle="#6b7280";g.fillRect(X,Y+2,30,6);g.fillStyle="#1b1b2f";g.fillRect(X+2,Y+8,3,8);g.fillRect(X+25,Y+8,3,8);const px2=X+2+((k*70)%22);g.fillStyle="#c9833a";g.fillRect(px2,Y-6,7,8);g.fillStyle="#e74c3c";g.fillRect(X+12,Y+2,5,1);if(Math.floor(k*10)%3==0){g.fillStyle="#fff";g.fillRect(X+14,Y-12,2,6);g.fillRect(X+10,Y-9,10,1)}g.fillStyle="#fee761";g.fillRect(X+20,Y-8,9,7);g.fillStyle="#1b1b2f";g.fillRect(X+22,Y-6,5,2);if(k>.6&&k<.75){g.font="11px 'Cubic 11',monospace";g.fillStyle="#fee761";g.fillText("叮",X+24,Y-14)}}
     else{g.fillStyle="#8a5a2b";g.fillRect(X,Y+2,28,5);g.fillRect(X+2,Y+7,3,9);g.fillRect(X+23,Y+7,3,9);g.fillStyle="#fff";g.fillRect(X+3,Y-6,10,8);g.fillRect(X+14,Y-6,10,8);g.fillStyle="#1b1b2f";for(let j=0;j<3;j++){g.fillRect(X+5,Y-4+j*2,6,1);g.fillRect(X+16,Y-4+j*2,6,1)}const fp=(k*3)%1;g.fillStyle="#e6e6e6";g.fillRect(X+14-Math.round(fp*10),Y-8,Math.round(fp*10)+1,9);g.fillStyle="#f5c9a0";g.fillRect(X+2,Y-1-fl*2,4,3)}
     if(k>.75){g.font="16.5px Cubic11,monospace";g.textAlign="center";g.lineWidth=4;g.strokeStyle="rgba(0,0,0,.6)";g.fillStyle="#7CFC8A";g.strokeText("+$",ax,ay-52-(k-.75)*60);g.fillText("+$",ax,ay-52-(k-.75)*60)}break}
    case "eat":up("🍚");if(k>.3)for(let j=0;j<4;j++){g.fillStyle="#f5e6b8";g.fillRect(ax-10+j*6,ay-30+((k*60+j*7)%20),3,3)}break;
    case "toilet":up("🚽");break;
    case "bubbles":for(let j=0;j<6;j++){const bx2=ax+Math.sin(j*2.1+k*6)*18,by2=ay-20-((k*80+j*15)%50);g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.arc(bx2,by2,3+j%3,0,7);g.stroke()}up("🛁");break;
    case "tv":g.fillStyle=`rgba(120,190,255,${.25+.2*Math.sin(nowp/80)})`;g.beginPath();g.arc(ax,ay-10,30,0,7);g.fill();up("📺");break;
    case "zzz":for(let j=0;j<3;j++){g.font=(j?"16.5":"11")+"px Cubic11,monospace";g.fillStyle="#fff";g.fillText("Z",ax+10+j*8,ay-30-j*10-k*20)}break;
    case "coins":for(let j=0;j<5;j++)icon("🪙",ax-20+j*10,ay-30-Math.abs(Math.sin(k*8+j))*30,16);break;
    case "coin":icon("🪙",ax,ay-40-e*40,18);if(k>.6)icon("✨",ax,ay-60,24);break;
    case "hearts":for(let j=0;j<3;j++)icon("💗",ax+(j-1)*16+Math.sin(k*6+j)*6,ay-40-k*50-j*8,18);if(f.b)fly("💗",40);break;
    case "sparkle":for(let j=0;j<5;j++){const a2=j*1.25+k*4;icon("✨",ax+Math.cos(a2)*28*e,ay-30+Math.sin(a2)*28*e,16)}break;
    case "bag":up("🛍️");break;case "paint":up("🎨");break;case "sun":up("☀️");break;case "can":up("🥤");break;
    case "gift":fly("🎁");if(k>.85)icon("✨",bx,by-50,28);break;
    case "msg":fly("💌",40);break;
    case "phone":icon("📞",ax+Math.sin(nowp/40)*3,ay-55,24);break;
    case "scooter":{const x=ax+(bx-ax)*k,y=ay+(by-ay)*k-10;icon("🛵",x,y,28);break}
    case "clap":{const mx=(ax+bx)/2,my=(ay+by)/2;icon("🙌",mx,my-50-e*10,28);if(k<.5)for(let j=0;j<6;j++){const a2=j*1.05;g.fillStyle="#ffd23f";g.fillRect(mx+Math.cos(a2)*k*60,my-50+Math.sin(a2)*k*60,4,4)}break}
    case "fight":{const mx=(ax+bx)/2,my=(ay+by)/2-10;g.fillStyle="rgba(230,230,230,.9)";for(let j=0;j<7;j++){const a2=j*.9+nowp/120;g.beginPath();g.arc(mx+Math.cos(a2)*18,my+Math.sin(a2)*12,12+Math.sin(nowp/60+j)*3,0,7);g.fill()}
      icon(["👊","💥","⭐"][Math.floor(nowp/150)%3],mx+Math.sin(nowp/70)*14,my-6,26);icon("💥",mx-16,my-18+Math.sin(nowp/90)*6,18);break}
    case "crash":{g.fillStyle="rgba(240,240,240,.9)";for(let j=0;j<6;j++){const a2=j*1.05+nowp/90;g.fillRect(ax+Math.cos(a2)*(10+k*40),ay-20+Math.sin(a2)*(8+k*28),6,6)}icon("💥",ax,ay-34-e*6,30);icon("🔧",ax+14,ay-48,18);break}
    case "egg":{if(k<.75){const kk=k/.75,x=ax+(bx-ax)*kk,y=ay+(by-ay)*kk-50-Math.sin(kk*Math.PI)*60;icon("🥚",x,y,22)}else{g.fillStyle="#fff";g.beginPath();g.ellipse(bx,by-40,16,8,0,0,7);g.fill();g.fillStyle="#ffcc33";g.beginPath();g.arc(bx,by-40,6,0,7);g.fill()}break}
    case "fart":{for(let j=0;j<5;j++){g.fillStyle=`rgba(140,200,90,${.6-j*.1})`;g.beginPath();g.arc(ax+Math.sin(j+k*3)*20,ay-k*40-j*6,10+k*14,0,7);g.fill()}icon("💨",ax+16,ay-30,22);break}
    case "steam":icon("☕",ax,ay-46,22);for(let j=0;j<4;j++){g.fillStyle=`rgba(255,255,255,${.7-.15*j})`;g.fillRect(ax-8+j*5+Math.sin(k*9+j)*3,ay-58-((k*70+j*11)%26),4,4)}break;
    case "notes":for(let j=0;j<3;j++)icon("🎵",ax+(j-1)*16+Math.sin(k*7+j)*6,ay-44-((k*60+j*14)%36),16);break;
    case "check":{const u2=(.4+e*.6)*5;g.fillStyle="#63c74d";[[0,2],[1,3],[2,4],[3,3],[4,2],[5,1],[6,0]].forEach(p=>g.fillRect(ax-15+p[0]*u2,ay-58+p[1]*u2,u2,u2));break}
    case "disc":{const x=f.b?ax+(bx-ax)*k:ax+Math.sin(k*6)*30,y=(f.b?ay+(by-ay)*k:ay)-46-(f.b?Math.sin(k*Math.PI)*30:Math.abs(Math.sin(k*6))*20);g.fillStyle="#fee761";g.beginPath();g.ellipse(x,y,9,3,0,0,7);g.fill();g.fillStyle="#e8b02c";g.fillRect(x-4,y-1,8,2);break}
    case "fishing":{g.strokeStyle="#bfe6ff";g.lineWidth=2;g.beginPath();g.ellipse(ax+22,ay+4,6+k*14,2+k*4,0,0,7);g.stroke();if(k>.5)icon("🐟",ax+22,ay-14-Math.sin((k-.5)*2*Math.PI)*24,20);break}
    case "flash":g.fillStyle=`rgba(255,255,255,${k<.3?(.3-k)/.3*.7:0})`;g.fillRect(ax-30,ay-62,60,72);icon("✨",ax+20,ay-50,18);break;
    case "alarm":icon("⏰",ax+Math.sin(nowp/30)*4,ay-55,26);break}
   g.restore()}}
 // 飄字：剛做完的動作讓數值變多少
 {const mw2=walkers[me],nowp=performance.now();for(let i=floaters.length-1;i>=0;i--){const f=floaters[i],age=(nowp-f.born)/1400;if(age>1){floaters.splice(i,1);continue}if(age<0)continue;
  g.globalAlpha=1-age;g.font="16.5px Cubic11,monospace";g.textAlign="center";g.lineWidth=4;g.strokeStyle="rgba(0,0,0,.6)";const fx2=(mw2.x+.5)*T+(i%2?14:-14),fy2=(mw2.y+.5)*T-70-age*40;g.strokeText(f.t,fx2,fy2);g.fillStyle=f.good?"#7CFC8A":"#ff8a80";g.fillText(f.t,fx2,fy2);g.globalAlpha=1}}
 if(tk%30==0){renderNeeds();if(!walkers[me].path.length)renderPanel()}}
requestAnimationFrame(frame);

// ── 點地圖：拖曳＝移動視角，點一下＝走過去或看那個人 ──
let down=null,pinch=null;const ptrs=new Map();
const zoomAt=(ns,mx,my)=>{const rc=cv.getBoundingClientRect(),px=mx-rc.left,py=my-rc.top,wx=px/cam.s+cam.ox,wy=py/cam.s+cam.oy;ns=snapS(clamp(ns,cam.minS,cam.maxS));
 // 手指下的那個點保持不動
 cam.s=ns;cam.user=true;camFree=true;cam.x=wx-px/ns+W/(2*ns);cam.y=wy-py/ns+Hh/(2*ns)};
cv.addEventListener("pointerdown",e=>{e.preventDefault();cam.vx=cam.vy=0;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);
 if(ptrs.size==2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,s:cam.s,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};down=null;return}
 down={x:e.clientX,y:e.clientY,ox:cam.x,oy:cam.y,moved:false,pinched:false}});
cv.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId)||stageRoom())return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;zoomAt(pinch.s*d/pinch.d,mx,my);
  cam.x-=(mx-pinch.mx)/cam.s;cam.y-=(my-pinch.my)/cam.s;pinch.mx=mx;pinch.my=my;pinch.s=cam.s;pinch.d=d;return}
 if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>6){down.moved=true;camFree=true;const t=performance.now(),px=down.lx??down.x,py=down.ly??down.y,dt2=Math.max(1,t-(down.lt||t-16));
  cam.vx=-(e.clientX-px)/cam.s/dt2;cam.vy=-(e.clientY-py)/cam.s/dt2;down.lx=e.clientX;down.ly=e.clientY;down.lt=t;cam.x-=(e.clientX-px)/cam.s;cam.y-=(e.clientY-py)/cam.s}});
const endPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2&&pinch){pinch=null;down=null}};
cv.addEventListener("pointercancel",endPtr);
cv.addEventListener("wheel",e=>{if(!e.ctrlKey&&!e.metaKey&&(!isPC()||stageRoom()))return;e.preventDefault();zoomAt(cam.s*Math.exp(-e.deltaY*.01),e.clientX,e.clientY)},{passive:false});
cv.addEventListener("pointerup",e=>{const wasPinch=ptrs.size>=2||!down;endPtr(e);if(wasPinch)return;const d=down;down=null;if(stageRoom()){stageTap(e);return}
 // 停在原地才放手就不要慣性
 if(d.moved&&performance.now()-(d.lt||0)>80){cam.vx=cam.vy=0}if(d.moved||!S)return;const rc=cv.getBoundingClientRect(),wx=(e.clientX-rc.left)/cam.s+cam.ox,wy=(e.clientY-rc.top)/cam.s+cam.oy,tx=Math.floor(wx/T),ty=Math.floor(wy/T);
 const hit=Object.values(R).find(r=>r.id!=me&&Math.hypot((walkers[r.id].x+.5)*T-wx,(walkers[r.id].y+.2)*T-wy)<T*.8);
 if(hit){if(R[me].sleeping||jailed(R[me])){sel=hit.id;renderPanel();return}pendingThen=()=>{sel=hit.id;tapTab("social",/擊掌/)};walkToPerson(hit.id);return}sel=null;if(!R[me].sleeping&&!blocked(tx,ty)&&tapNpc(tx,ty))return;
 if(R[me].sleeping){toast("先起床才能出門");return}
 const p=placeAt(tx,ty);window.__tap=`tap ${tx},${ty} scale ${cam.s.toFixed(2)} blocked ${blocked(tx,ty)} place ${p?(p.slot!=null?'house':p.dest):'none'} t ${new Date().toLocaleTimeString()}`;if(!p){toast("那裡走不過去");return}tapPlace(p)});
$("zoom").onclick=()=>{zoomFar=!zoomFar;cam.user=false;$("zoom").textContent=zoomFar?"🔍 拉近":"🗺️ 看全鎮";camFree=zoomFar;resize()};
// ── PC：游標 hover 提示、鍵盤（≥900px） ──
{const inf=document.createElement("div");inf.id="info";document.body.appendChild(inf);
 const wkN=r=>{const dc=(r.items&&r.items.dc)||{},d=new Date(now()+8*36e5).toISOString().slice(0,10);return dc.d==d?(dc.work||0):0};
 const infR=()=>{if(!isPC()||!S||!me||!R[me]||!document.body.classList.contains("ingame"))return;const r=R[me];let jb="";try{const c=jobCardCo(r);jb=`<div class="jb"><h4>目前職階</h4><div class="ir"><b>${esc(c.name)}</b>　$${c.pay}／次</div><div class="ir"><em>今天打工</em>${wkN(r)} 次</div></div>`}catch(e){}
  const hm=a=>{const d=new Date(Date.parse(a)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`};
  const ev=((S.events)||[]).filter(e=>e.kind!="rent"||e.actor==me).slice().sort((a,b)=>b.at.localeCompare(a.at)||b.id-a.id).slice(0,8);
  const h=jb+`<h4>最近動態</h4>`+(ev.length?ev.map(e=>`<div class="ir"><em>${hm(e.at)}</em>${esc(e.msg)}</div>`).join(""):`<div class="ir">還沒有動態</div>`);if(inf.dataset.h!==h){inf.dataset.h=h;inf.innerHTML=h}};
 setInterval(infR,2000);setTimeout(infR,500);
const kb=document.createElement("div");kb.id="kbh";kb.textContent="方向鍵移動 · E 建議 · 1-9 按鈕";document.body.appendChild(kb);const tp=document.createElement("div");tp.id="tip2";document.body.appendChild(tp);
 const hov=e=>{if(e.pointerType!=="mouse"||ptrs.size||!S||!isPC()||stageRoom()||!R[me]){tp.style.display="none";cv.style.cursor="";return}
  const rc=cv.getBoundingClientRect(),wx=(e.clientX-rc.left)/cam.s+cam.ox,wy=(e.clientY-rc.top)/cam.s+cam.oy,tx=Math.floor(wx/T),ty=Math.floor(wy/T);let nm="";
  const h=Object.values(R).find(r=>r.id!=me&&walkers[r.id]&&Math.hypot((walkers[r.id].x+.5)*T-wx,(walkers[r.id].y+.2)*T-wy)<T*.8);
  if(h)nm=h.name;else{const p=placeAt(tx,ty);if(p){if(p.slot!=null){const o=Object.values(R).find(r=>r.slot==p.slot);nm=o?o.name+"的家":"空屋"}else if(p.obj)nm=(OBJS[p.obj]||{}).name||"";else if(PLACES[p.dest]&&p.dest!="street")nm=PLACES[p.dest].name}}
  if(nm){tp.textContent=nm;tp.style.display="block";tp.style.left=Math.min(innerWidth-120,e.clientX+14)+"px";tp.style.top=(e.clientY+16)+"px";cv.style.cursor="pointer"}else{tp.style.display="none";cv.style.cursor=down&&down.moved?"grabbing":""}};
 cv.addEventListener("pointermove",hov);cv.addEventListener("pointerleave",()=>{tp.style.display="none"});
 let lastK=0;
 addEventListener("keydown",e=>{if(!isPC()||!document.body.classList.contains("ingame")||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target,tn=t&&t.tagName;if(tn=="INPUT"||tn=="TEXTAREA"||tn=="SELECT"||(t&&t.isContentEditable))return;
  if(e.key=="Escape"){if(modalOpen()){e.preventDefault();$("modal").click();if(modalOpen())$("modal").classList.add("hide")}return}
  if(modalOpen()||document.body.classList.contains("social")||!S||!R[me])return;const k=e.key.toLowerCase();
  const D={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]}[k];
  if(D){e.preventDefault();const n=performance.now();if(n-lastK<120||busy)return;lastK=n;if(R[me].sleeping||jailed(R[me]))return;const w=walkers[me];if(!w)return;
   const tx=Math.round(w.x)+D[0],ty=Math.round(w.y)+D[1];if(blocked(tx,ty))return;const p=placeAt(tx,ty);if(!p)return;if(p.slot!=null){goHouse(p.slot);return}walkTo(p.dest,p.door);return}
  if(document.activeElement&&document.activeElement!==document.body)return;
  if(k=="e"||k=="enter"){const b=document.querySelector('#tipbox button[data-i]');if(b){e.preventDefault();b.click()}return}
  if(/^[1-9]$/.test(k)){const bs=[...document.querySelectorAll('#acts button[data-i]')];const b=bs[+k-1];if(b){e.preventDefault();b.click()}}});
}
$("home").onclick=()=>{camFree=false;sel=null;lastPanel="";renderPanel()};
$("logout").onclick=()=>{if(!confirm("登出後要再輸入一次邀請碼才能進來。確定嗎？"))return;dropMine(TID);me=null;pin=null;townLogin()};
$("towns").onclick=()=>go("");$("acctBtn").hidden=false;$("acctBtn").onclick=()=>{closeMenu();acctModal()};if(window.RECOVERY_ON)$("recBtn").hidden=false;$("recBtn").onclick=()=>{closeMenu();recBindModal()};
$("invite").onclick=async()=>{if(R[me].mayor){try{shareModal((await rpc("town_mayor",{rid:me,pin,act:"invite"})).invite)}catch(e){toast(e.message)}}else{const text=`來「${S.town.name}」當鄰居！🐷\n${townURL()}\n（邀請碼請問鎮長）`;try{await navigator.clipboard.writeText(text);toast("已複製網址，邀請碼請鎮長給")}catch(e){toast(townURL())}}};
$("mayor").onclick=mayorPanel;// 抽屜：點一下在「一般 → 拉高 → 收起」之間切換；也可以上下滑
const gripLabel=()=>{const p=$("panel");$("grip").textContent=p.classList.contains("min")?"▲ 展開":"▼ 收起"};
$("grip").onclick=()=>{const p=$("panel");p.classList.toggle("min");p.classList.remove("max");gripLabel()};gripLabel();
{let sy=null;$("grip").addEventListener("touchstart",e=>{sy=e.touches[0].clientY},{passive:true});$("grip").addEventListener("touchend",e=>{if(sy==null)return;const dy=e.changedTouches[0].clientY-sy,p=$("panel");if(dy<-30){p.classList.remove("min");p.classList.add("max")}else if(dy>30){if(p.classList.contains("max"))p.classList.remove("max");else p.classList.add("min")}sy=null;gripLabel()})}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("on",x==b));["feed","rank","ppl"].forEach(k=>$("tab-"+k).classList.toggle("hide",k!=b.dataset.tab));if(b.dataset.tab=="feed")markSeen()});
document.querySelectorAll("[data-ff]").forEach(b=>b.onclick=()=>{feedFilter=b.dataset.ff;document.querySelectorAll("[data-ff]").forEach(x=>x.classList.toggle("on",x==b));renderFeed()});
// 看過動態就清掉未讀（記在這台手機）
function markSeen(){const ev=(S&&S.events)||[];if(!ev.length)return;feedSeen=Math.max(feedSeen,...ev.map(e=>e.id));try{localStorage.setItem("town-seen-"+TID,feedSeen)}catch(e){}$("feedBadge").classList.add("hide")}
try{feedSeen=+localStorage.getItem("town-seen-"+TID)||0}catch(e){}
new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)&&!$("tab-feed").classList.contains("hide")&&S)setTimeout(markSeen,1500)}).observe($("feed"));
// 側邊選單
const closeMenu=()=>document.body.classList.remove("menu-open");
$("menuBtn").onclick=()=>{const r=R[me];if(r){$("bagN").textContent=bagCount(r)?" "+bagCount(r):"";miniPerson($("meCv"),r.look);$("meName").textContent=r.name;$("meSub").textContent=`${S.town.name} · €${r.money} · ${career(r).name}${r.mayor?" · 鎮長":""}`}document.body.classList.add("menu-open")};
$("menuBack").onclick=closeMenu;$("menuClose").onclick=closeMenu;
document.querySelectorAll("[data-go-tab]").forEach(b=>b.onclick=()=>{const t=b.dataset.goTab;document.querySelector(`[data-tab=${t}]`).click();if(isMob())document.body.classList.add("social");else $("social").scrollIntoView({behavior:"smooth"})});
$("friendBtn").onclick=()=>document.body.classList.toggle("fr");$("strip").addEventListener("click",()=>setTimeout(()=>document.body.classList.remove("fr"),50));$("feedBtn").onclick=()=>{document.body.classList.add("social");markSeen()};$("socialClose").onclick=()=>document.body.classList.remove("social");$("menu").addEventListener("click",e=>{if(e.target.closest("button"))closeMenu()});
$("life").onclick=lifeModal;$("powBtn").onclick=()=>{closeMenu();powersModal()};$("taskBtn").onclick=()=>{closeMenu();taskModal()};$("statBtn").onclick=()=>{closeMenu();statsModal()};$("sndBtn").onclick=()=>{closeMenu();sndModal()};$("updBtn").onclick=()=>{closeMenu();updModal(true)};$("legalBtn").onclick=()=>{closeMenu();$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>條款與隱私</h2><p class="mut">白話版，一分鐘讀完。</p><div class="row"><button id="lgT">服務條款</button><button id="lgP">隱私權政策</button></div><div class="row"><button id="lgX" class="pri">關閉</button></div>`;$("lgT").onclick=()=>window.open("terms.html","_blank");$("lgP").onclick=()=>window.open("privacy.html","_blank");$("lgX").onclick=()=>$("modal").classList.add("hide")};$("bagBtn").onclick=()=>{closeMenu();bagModal()};
$("relook").onclick=()=>{let look=normLook(R[me].look);$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>換造型</h2><div id="lk2"></div><div class="row"><button id="mc">取消</button><button class="pri" id="ms">儲存</button></div>`;
 lookPicker($("lk2"),look,l=>look=l,R[me].items||{});$("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{try{await rpc("town_login",{rid:me,pin,new_look:look});mapKey="";await refresh();$("modal").classList.add("hide");toast("換好了")}catch(e){toast(e.message)}}};
$("report").onclick=report;
// 切到背景或關掉頁面：走到一半的路直接算到達，回來時人已經在目的地
const flush=()=>{const w=me&&walkers[me];if(w&&w.dest&&w.path.length){const [gx,gy]=w.goal;w.x=gx;w.y=gy;w.path=[];arrived(w)}};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState=="hidden")flush();else if(S)refresh().catch(()=>{})});addEventListener("pagehide",flush);

// ── 今日日報：做成一張圖，長按儲存或下載後貼到 WeChat ──
function report(){const c=document.createElement("canvas");c.width=1080;c.height=1350;const m=c.getContext("2d"),day=new Date(now()+8*36e5).toISOString().slice(0,10);
 m.fillStyle="#fbf5e9";m.fillRect(0,0,1080,1350);m.fillStyle="#f6a5c0";m.fillRect(0,0,1080,200);m.fillStyle="#5a2338";m.textAlign="center";m.font="700 64px Cubic11,sans-serif";
 const tn=S.town.name.length>10?S.town.name.slice(0,10)+"…":S.town.name;m.fillText(`🐷 ${tn}日報`,540,110);m.font="500 34px Cubic11,sans-serif";m.fillText(day.replace(/-/g," / "),540,165);
 const today=(S.events||[]).filter(e=>new Date(Date.parse(e.at)+8*36e5).toISOString().slice(0,10)==day).reverse();
 m.textAlign="left";m.fillStyle="#3a2a20";m.font="700 40px Cubic11,sans-serif";m.fillText("今日大事",70,280);m.font="400 34px Cubic11,sans-serif";
 const lines=today.length?today.slice(-10).map(e=>{const d=new Date(Date.parse(e.at)+8*36e5);return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}　${e.msg}`}):["今天小鎮很平靜，大家都在家耍廢。"];
 lines.forEach((t,i)=>{m.fillStyle=i%2?"#3a2a20":"#6b4a35";m.fillText(t.length>26?t.slice(0,26)+"…":t,70,345+i*52)});
 const rs=Object.values(R).sort((a,b)=>a.slot-b.slot).slice(0,7).map(r=>tickLocal(r,now())),y0=880;m.fillStyle="#3a2a20";m.font="700 40px Cubic11,sans-serif";m.fillText("鎮民現況",70,y0);m.font="400 32px Cubic11,sans-serif";
 rs.forEach((r,i)=>{const y=y0+60+i*56,worst=NEEDS.slice().sort((a,b)=>r[a]-r[b])[0],[ic,nm]=NEED_INFO[worst];
  m.fillStyle="#3a2a20";m.fillText(`${r.name}　在${placeName(r.place)}${r.sleeping?"睡覺":""}`,70,y);m.fillStyle=r[worst]<25?"#c0392b":"#6b4a35";m.fillText(`${ic} ${nm}最低 ${Math.round(r[worst])}`,700,y)});
 m.fillStyle="#9a7a60";m.font="400 26px Cubic11,sans-serif";m.textAlign="center";m.fillText(`🐷 小豬鎮`,540,1310);
 const url=c.toDataURL("image/png");$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>今日日報</h2><img src="${url}" alt="今日日報" style="width:100%;border-radius:8px"><p class="mut">手機：長按圖片儲存，再傳到 WeChat 群組。</p><div class="row"><button id="mc">關閉</button><button id="mcp">複製圖片</button><button class="pri" id="mdl">下載</button></div>`;
 $("mc").onclick=()=>$("modal").classList.add("hide");$("mdl").onclick=()=>{const a=document.createElement("a");a.href=url;a.download=`小豬鎮日報-${day}.png`;a.click()};
 $("mcp").onclick=()=>c.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":b})]);toast("已複製，可以貼到 WeChat")}catch(e){toast("這個瀏覽器不能複製圖片，請長按圖片儲存")}})}

// ── 加到主畫面：Android 直接安裝；iPhone 要用 Safari 的分享選單；WeChat 要先用瀏覽器打開 ──
const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;let installEvt=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
// ── 自動更新：主畫面 web app 沒辦法重新整理，所以啟動、回到前景、每 5 分鐘問一次 version.json，有新版就顯示「更新」按鈕（按了才重整，不會在操作到一半自己跳）──
const MYV=(()=>{try{const sc=[...document.scripts].find(x=>/town\.js/.test(x.src));return sc?+new URL(sc.src).searchParams.get("v")||0:0}catch(e){return 0}})();
let newV=0;
function updBusy(){const w=walkers[me];return !$("modal").classList.contains("hide")||(w&&w.path&&w.path.length>0)}
function updShow(){if(!newV)return;if(updBusy()){clearTimeout(updShow.t);updShow.t=setTimeout(updShow,10000);return}
 let b=$("upd");if(!b){b=document.createElement("div");b.id="upd";document.body.appendChild(b)}
 b.innerHTML=`<span>小鎮有新版本</span><button id="updGo">更新</button><button id="updX" aria-label="先不要">✕</button>`;b.classList.add("on");
 $("updGo").onclick=()=>{try{flush()}catch(e){}location.reload()};$("updX").onclick=()=>b.classList.remove("on")}
async function checkVer(){try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const j=await r.json();if(MYV&&j.v>MYV&&j.v>newV){newV=j.v;updShow()}}catch(e){}}
if(typeof document!=="undefined"&&MYV){checkVer();setInterval(checkVer,3e5);document.addEventListener("visibilitychange",()=>{if(document.visibilityState=="visible")checkVer()})}
function installHelp(){if(installEvt){installEvt.prompt();installEvt.userChoice.then(c=>{if(c.outcome=="accepted")toast("裝好了，從主畫面打開小豬鎮吧");installEvt=null});return}
 const ua=navigator.userAgent,wx=/MicroMessenger/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua);$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>📲 加到主畫面</h2>${wx?`<p>在 WeChat 裡不能直接安裝：</p><ol><li>點右上角「⋯」</li><li>選「在瀏覽器打開」${ios?"（Safari）":"（Chrome）"}</li><li>再按一次「📲 加到主畫面」</li></ol>`
  :ios?`<ol><li>用 <b>Safari</b> 打開這個網址</li><li>點下方的分享按鈕 <b>⬆️</b></li><li>往下滑，選「<b>加入主畫面</b>」</li><li>按「新增」</li></ol>`
  :`<ol><li>點瀏覽器右上角「⋮」</li><li>選「<b>安裝應用程式</b>」或「<b>加到主畫面</b>」</li></ol>`}
  <p class="mut">裝好後主畫面會有小豬圖示，打開就直接進你的小鎮，畫面沒有網址列，像一般 App。</p><div class="row"><button id="mc">知道了</button></div>`;$("mc").onclick=()=>$("modal").classList.add("hide")}
if(!standalone){$("install").classList.remove("hide");$("install").onclick=installHelp}

// ── 手機通知：有人對你做了什麼、需求快見底時通知（iPhone 要先加到主畫面，iOS 16.4 以上）──
const PUSH="https://gerqdagicybtyilihvvm.supabase.co/functions/v1/town-push";
const pushOK=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const b64=s=>{const p="=".repeat((4-s.length%4)%4),raw=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))};
async function pushState(){if(!pushOK())return null;const reg=await navigator.serviceWorker.ready;return reg.pushManager.getSubscription()}
async function refreshBell(){const s=await pushState().catch(()=>null);$("bell").textContent=s&&Notification.permission=="granted"?"🔔 通知開著":"🔕 開啟通知"}
async function bell(){const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(!pushOK()){toast(ios&&!standalone?"iPhone 要先「加到主畫面」，從主畫面打開才能收通知":"這個瀏覽器不支援通知");if(ios&&!standalone)installHelp();return}
 const cur=await pushState();
 if(cur&&Notification.permission=="granted"){if(!confirm("要關掉這支手機的通知嗎？"))return;
  try{await rpc("town_push_sub",{rid:me,pin,endpoint:cur.endpoint,turn_on:false});await cur.unsubscribe();toast("已關掉通知")}catch(e){toast(e.message)}refreshBell();return}
 const perm=await Notification.requestPermission();if(perm!="granted"){toast("沒有允許通知。要開的話，到手機設定裡允許這個網站通知");return}
 await subscribe(cur,false)}
async function subscribe(cur,quiet){
 try{const k=await fetch(PUSH,{headers:{apikey:SBK}}).then(r=>{if(!r.ok)throw new Error("通知服務還沒準備好，請稍後再試");return r.json()});
  const reg=await navigator.serviceWorker.ready,sub=cur||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k.key)}),j=sub.toJSON();
  await rpc("town_push_sub",{rid:me,pin,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,turn_on:true});
  if(!quiet)toast("通知開好了：有人對你做了什麼、或你快撐不住時會通知你");}catch(e){if(!quiet)toast(e.message||"開啟通知失敗")}refreshBell()}
// 進小鎮時：之前允許過就自動開；還沒問過就主動問一次（瀏覽器規定一定要本人按允許）
async function autoPush(){if(!pushOK()||!me)return;const cur=await pushState().catch(()=>null);
 if(Notification.permission=="granted"){await subscribe(cur,true);return}
 let asked=null;try{asked=localStorage.getItem("town-push-asked")}catch(e){}
 if(Notification.permission!="default"||asked)return;try{localStorage.setItem("town-push-asked","1")}catch(e){}
 setTimeout(()=>{if(!$("modal").classList.contains("hide"))return;$("modal").classList.remove("hide");
  $("mbody").innerHTML=`<h2>🔔 開啟通知？</h2><p>有人來你家煮飯、留言、送禮、丟雞蛋或扁你，或是你快餓昏、快憋不住時，手機會通知你。</p><p class="mut">晚上 11 點到早上 8 點不吵你。之後可以隨時按「🔔 通知開著」關掉。</p><div class="row"><button id="mc">之後再說</button><button class="pri" id="ms">開啟通知</button></div>`;
  $("mc").onclick=()=>$("modal").classList.add("hide");$("ms").onclick=async()=>{$("modal").classList.add("hide");await bell()}},2500)}
$("bell").onclick=bell;

let peSeen="",peBusy=false;
const modalOpen=()=>!$("modal").classList.contains("hide");
function jeModal(ev){const d=JE[ev.k];if(!d)return;
 const pick=o=>async()=>{try{const j=await rpc("town_jail_ev",{rid:me,pin,op:"pick",item:String(o)});await refresh();spawnFx(j.m<0?"coins":"sparkle",me);const t=`${d[0]}：${fxText(j)}${j.dl?` · 刑期 ${j.dl>0?"+":""}${j.dl} 分鐘`:""}${j.freed?" · 減刑出獄！":""}`;toast(t);feedback(true,t)}catch(e){toast(e.message)}renderPanel()};
 choiceModal(d[0],d[1],[[d[2],d[3],pick(0)],[d[4],d[5],pick(1)]])}
async function jePoll(){peBusy=true;try{const j=await rpc("town_jail_ev",{rid:me,pin,op:"poll"}),ev=j&&j.ev;if(ev&&JE[ev.k]&&peSeen!=ev.at&&!modalOpen()){peSeen=ev.at;jeModal(ev)}}catch(e){}peBusy=false}
function fxText(j){const o=[];if(j.f)o.push(`心情 ${j.f>0?"+":""}${j.f}`);if(j.e)o.push(`精力 ${j.e>0?"+":""}${j.e}`);if(j.m)o.push(`${j.m>0?"+":"−"}€${Math.abs(j.m)}`);if(j.b)o.push(`${j.who} 好感 ${j.b>0?"+":""}${j.b}`);if(j.tg)o.push("一起加成 +2");return o.join(" · ")||"沒事發生"}
function pevModal(ev){
 const pick=o=>async()=>{try{const j=await rpc("town_pool",{rid:me,pin,op:"fpick",item:String(o)});await refresh();spawnFx(j.m<0?"coins":"sparkle",me);toast(`${j.msg}：${j.fx||"沒事發生"}`);feedback(true,j.fx||"")}catch(e){toast(e.message)}renderPanel()};
 choiceModal(ev.title,ev.desc,[[ev.a,ev.ah,pick(0)],[ev.b,ev.bh,pick(1)]])}
async function pePoll(){if(!me||!pin||peBusy||document.visibilityState!="visible"||modalOpen())return;const r=R[me];if(r&&!r.sleeping&&r.place=="jail"&&jailed(r)){jePoll();return}if(!r||r.sleeping||!PEV[r.place]||(walkers[me]&&walkers[me].path.length))return;
 peBusy=true;try{const j=await rpc("town_pool",{rid:me,pin,op:"fpoll"}),ev=j&&j.ev;if(ev&&ev.title&&peSeen!=ev.at&&!modalOpen()){peSeen=ev.at;pevModal(ev)}}catch(e){}peBusy=false}
// 同地點「正在一起」：同一個設施有 2 人以上醒著
// ── 各設施更多互動、每日任務板、常客、坐下逗留（town_fac；價格與數值要和 supabase/town_fac.sql 一致）──
const FACP=["restaurant","cafe","cinema","gym","park","plaza"];
const SPECS=["滷肉飯套餐","牛肉麵套餐","豬排飯套餐","咖哩飯套餐","雞腿便當套餐"],FILMS=[["感人劇情片",18,-2],["爆笑喜劇",22,0],["熱血動作片",16,0],["緊張驚悚片",20,-4]];
const doyTP=()=>{const d=new Date(now()+8*36e5);return Math.floor((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-Date.UTC(d.getUTCFullYear(),0,0))/864e5)};
// act:[名稱, 價格, 說明, 可用地點, 要不要選人（1 必選 2 可選）]
const faOf=r=>{const a=r.items&&r.items.fa;return a&&a.d==dayKey()?a:{n:0,pl:[],who:[],k:{},tk:[]}};
const taskIds=()=>{const st=(me%8+doyTP())%8;return[st,(st+3)%8,(st+5)%8]};
const taskDone=(r,i)=>{const a=faOf(r),k=a.k||{};return[workToday(r)>=3,(a.n||0)>=3,(a.pl||[]).length>=3,(a.who||[]).length>=2,!!k.checkin,!!k.fish,!!(k.song||k.treat),!!(k.special||k.picnic)][i]};
const fqOf=(r,p)=>((r.items||{}).fq||{})[p]||0,discOf=n=>n>=15?15:n>=5?10:0,facPrice=(r,p,b)=>Math.floor((b*(100-discOf(fqOf(r,p)))+50)/100);
const tierOf=n=>n>=15?"熟客（−15%）":n>=5?"常客（−10%）":"";
const claimable=r=>taskIds().filter((t,i)=>taskDone(r,t)&&!(faOf(r).tk||[]).includes(t)).length;
async function doFac(act,target,item){await ensureIn();try{const j=VENACT.has(act)?await rpc("town_venue",{rid:me,pin,act,target:target||null,num:+item||0}):await rpc("town_fac",{rid:me,pin,act,item:item||null,target:target||null});await refresh();spawnFx(FAC_FX[act]||(j.m<0?"coins":"sparkle"),me,target&&walkers[target]?target:null);playRoomFx(act);const t=`${j.msg||""} · ${fxText(j)}`;toast(t);feedback(true,t)}catch(e){toast(e.message);feedback(false,e.message)}renderPanel()}
async function doJail(a,target){try{const j=await rpc("town_jail",{rid:me,pin,act:a,item:null,target:target||null});await refresh();spawnFx(j.caught||j.escaped===false?"crash":j.m<0?"coins":a=="slash"?"fight":"sparkle",me);playRoomFx(a);const t=j.msg||"";toast(t);feedback(true,t)}catch(e){toast(e.message);feedback(false,e.message)}renderPanel()}
function escapeModal(){choiceModal("真的要越獄嗎？",`成功約 ${escP()}%：逃出監獄，但被通緝 ${JAILX.wanted[0]} 小時，出門被巡警抓回牢裡的機率很高（躲在家最安全）。失敗：加刑 ${JAILX.esc[2]} 分鐘、罰款最多 €${JAILX.esc[3]}、精力 −15 心情 −10，而且算惹事，這次不能假釋。越獄不會死`,[["試試看",`精力 ≥ ${JAILX.esc[0]} · ${JAILX.esc[4]} 分鐘一次`,()=>doJail("escape")],["算了","",()=>{}]])}
function slashModal(t){choiceModal(`真的要砍 ${t.name} 嗎？`,`你們有仇，只有這種人才能動手。他精力 −${JAIL.hurt[0]}、心情 −${JAIL.hurt[1]}，精力歸零會倒地送醫院，醫藥費由你付；你精力 −${JAIL.self[0]}。被巡警抓到（約 ${JAIL.catchP}%，倒地 ${JAIL.catchFallP}%）要關 1～3 小時，好感也會大跌。${priorOn(R[me])||wantedOn(R[me])?"你現在有前科或被通緝，被抓的機率更高。":""}角色不會死`,[["確定動手","30 分鐘一次",()=>doJail("slash",t.id)],["算了","",()=>{}]])}
function artModal(){$("modal").classList.remove("hide");$("mbody").innerHTML=`<h2>拉花</h2><p class="mut">游標到綠色中間時按「停」，越準品質越高（€150）</p><div style="position:relative;height:24px;background:#3a2a1c;margin:16px 0"><i style="position:absolute;left:46%;width:8%;height:24px;background:#63c74d"></i><i id="artc" style="position:absolute;top:0;width:8px;height:24px;background:#fee761"></i></div><button class="act" id="arts"><b>停！</b><small>點下去定格</small></button><div class="row"><button id="mc">關閉</button></div>`;
 let t0=performance.now(),pos=0;const iv=setInterval(()=>{const u=((performance.now()-t0)/900)%2;pos=u<1?u:2-u;const e=$("artc");if(e)e.style.left=`calc(${pos*100}% - ${pos*8}px)`;else clearInterval(iv)},30);
 $("mc").onclick=()=>{clearInterval(iv);$("modal").classList.add("hide")};$("arts").onclick=()=>{clearInterval(iv);const sc=Math.max(0,Math.round(100-Math.abs(pos-.5)*200));$("modal").classList.add("hide");doFac("art",null,sc)}}
async function doReg(P){try{const j=await rpc("town_venue",{rid:me,pin,act:"reg",target:null,num:0});await refresh();spawnFx("sparkle",me);toast(`${j.msg} · ${fxText(j)}`)}catch(e){toast(e.message)}renderPanel()}
const FACCD={};// 設施互動的時間冷卻已全部取消（2026-11）；好感每日上限、每日精力補充上限（200）還在
const FACI={art:"☕",share:"💗",combo:"🍚",bring:"📦",seat:"💗",chat:"🎬",sale:"🏷️",sample:"🍪",mredeem:"🎫",special:"🍚",takeout:"📦",latte:"☕",redeem:"🎫",treat:"💗",song:"🎵",film:"🎬",popcorn:"🍪",spar:"👊",checkin:"✨",frisbee:"🎈",fish:"🐟",picnic:"🍽️",feast:"🍖",spa:"🛁",trip:"🧳",photo:"✨",photo2:"💗"};
const FACG={share:"soc",bring:"soc",seat:"soc",chat:"soc",special:"place",takeout:"place",latte:"place",redeem:"place",popcorn:"place",picnic:"place",feast:"place",film:"place",song:"place",fish:"place",photo:"place",checkin:"place",spa:"place",trip:"place",treat:"soc",spar:"soc",frisbee:"soc",photo2:"soc"};
// 設施互動：全部直接放在面板第一層，不能按的灰掉並寫原因
const TRN={lift:["舉重","力量",150,"gym","精力 −15，要 25 以上"],run:["慢跑","敏捷",0,"park","精力 −12，要 20 以上"],read:["讀書","智力",0,"home","精力 −6、心情 −3，在自己家屋裡"],chat:["找人聊天","魅力",0,"plaza,cafe","精力 −3，要有人在場"],pray:["許願池投幣","運氣",100,"plaza","精力 −2，錢只出不進"]};
async function doTrain(k){try{const j=await rpc("town_train",{rid:me,pin,kind:k});await refresh().catch(()=>{});toast((TRN[k][1])+"："+j.msg);feedback(true,j.msg)}catch(e){toast(e.message)}}
function trainBtns(r){const out=[],p=r.place,it=r.items||{},a=it.at||{};
 for(const k of Object.keys(TRN)){const d=TRN[k],ok=d[3]=="home"?(p=="home:"+me&&inside(r)):d[3].split(",").includes(p);if(!ok)continue;
  const key={lift:"st",run:"ag",read:"iq",chat:"ch",pray:"lk"}[k],cur=Math.min(5,a[key]||0),pr=(a.p||{})[key]||0;let dis="";
  if(cur>=5)dis=d[1]+"已經練到最高了";else if(k=="chat"&&!Object.values(R).some(o=>o.id!=me&&o.place==p&&!o.sleeping&&!jailed(o)))dis="要有人在場才能聊天";
  out.push({...btn(`${d[0]}（練${d[1]}）`,`${d[2]?"€"+d[2]+" · ":""}${d[4]} · 進度 ${pr}/${6+3*cur}`,()=>doTrain(k),"train"),dis})}
 return out}
function facBtns(r){const p=r.place,out=[],it=r.items||{},doy=doyTP();
 const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping&&!jailed(o));
 for(const k of Object.keys(FAC)){const d=FAC[k];if(!d[3].includes(p))continue;let name=d[0],sub=d[2],price=d[1];const ru0=RULES.find(x=>x.m=="fac:"+k);if(ru0){const mo=ru0.fx.find(x=>x[0]=="money");price=mo?-mo[1]:0;sub=ru0.fx.filter(x=>x[0]!="money").map(x=>FXN[x[0]]+" "+(typeof x[1]=="number"&&x[1]>0?"+":"")+x[1]).join(" · ")+(ru0.p?" · "+ru0.p:"")}
  if(k=="special")name+="：「"+SPECS[doy%5]+"」";
  if(k=="film"){const f=FILMS[doy%4];name="看今日片：「"+f[0]+"」";sub=`心情 +${f[1]}${f[2]?` · 精力 ${f[2]}`:""} · 每天換片 · 1 小時一次`}
  if(k=="redeem")sub=`集點卡 ${it.cs||0}/8 · `+sub;
  const lx=["feast","spa","trip"].includes(k);if(lx&&!isOn("lux"))continue;
  const pr=price?(lx||k=="sale"?price:facPrice(r,p,price)):0,real=k=="photo2"?"photo":k,need=!!d[4],one=need&&here.length==1?here[0]:null;
  const cm=FACCD[k]||0,key="f_"+real+(need&&one?one.id:""),cd=cm&&(!need||one)?Math.max(0,Date.parse(((it.cd||{})[key])||"1970")+cm*6e4-now()):0;
  let dis="";
  if(need&&!here.length)dis="要有人在場才能做";
  else if(cd)dis=`剛做過，${fmtLeft(cd)}後再來`;
  else if(k=="redeem"&&(it.cs||0)<8)dis=`集點卡 ${it.cs||0}/8，還沒集滿`;
  else if(k=="checkin"&&it.gy&&it.gy.d==dayKey())dis="今天已經簽到過了";
  const label=`${name}${one?" "+one.name:""} ${FACI[k]||""}`.trim();
  const fn=()=>{if(real=="art")return artModal();if(need&&here.length>1)return choiceModal("和誰？","選一位在場的鄰居",here.map(o=>[o.name,"",()=>doFac(real,o.id)]));return doFac(real,need?here[0].id:null)};
  out.push({...btn(label,(pr?`€${pr}${pr<price?"（常客價）":""} · `:"")+sub,fn,FACG[k]||"place"),key:"fac:"+k,dis})}
 if(["restaurant","cafe","park","plaza"].includes(p)){const sit=it.sit,sitting=sit&&sit.pl==p;
  out.push(btn(sitting?"起身 🪑":"坐下逗留 🪑",sitting?`已經坐了 ${Math.max(0,Math.floor((now()-Date.parse(sit.at))/6e4))} 分鐘 · 坐越久恢復越多，上限 20 分鐘`:"每分鐘精力 +0.5、心情 +0.4，滿 20 分鐘，有人在場多 +2 心情",()=>doFac(sitting?"up":"sit"),"fun"))}
 const c=claimable(r);out.push(btn("每日任務板 ⭐",c?`${c} 個任務可以領獎`:"今天的三個小任務，各 €500",()=>taskModal(),"work"));
 return out}
function taskModal(){const r=R[me];if(!r)return;const a=faOf(r),ids=taskIds(),tk=a.tk||[],it=r.items||{};
const rows=ids.map((t,i)=>{const done=taskDone(r,t),got=tk.includes(t);return[`${got?"已領":done?"可領獎":"未完成"} ${TASKS[t]}`,got?"獎勵 €500 已領":done?"點這裡領 €500":"完成後回來領 €500",async()=>{if(got||!done){toast(got?"已經領過了":"還沒完成");return}await doFac("claim",null,String(i))}]}); const fq=Object.entries(it.fq||{}).filter(x=>x[1]>=5).map(x=>`${placeName(x[0])} ${tierOf(x[1])}`);
 choiceModal("每日任務板",`每天重新出三個，各 €500，三個都領完再 +€1000。今天互動 ${a.n||0} 次 · 咖啡集點卡 ${it.cs||0}/8${it.gy?` · 健身房連續簽到 ${it.gy.d==dayKey()?it.gy.s:(it.gy.d==dayKey(-1)?it.gy.s:0)} 天`:""}${fq.length?` · 常客：${fq.join("、")}`:""}`,rows)}
// ── 走進設施裡面（咖啡廳、餐廳、健身房；RPC town_fi，資料 items.fi = 地點代號，只有 fi 等於現在的 place 才算在裡面）──
// 室內格子系統（之後家裡擺家具可共用）：場景 = 12×5 格、每格 24px，第 0 列是牆；物件 = [代號, 格x, 格y]，代號查 ITEM = [圖示, 名稱, 對應面板按鈕的文字（沒有 = 裝飾）, 是否擋住站位]；
// 人站在沒有被擋住的地板格（第 1 列起），依距離場景中央由近到遠一人一格，不會重疊；點物件 = 按面板上文字比對到的那顆按鈕。
const ROOMIMG={};
function roomImg(n){if(!ROOMIMG[n]){const i=new Image();i.onload=()=>{try{drawRoom()}catch(e){}};i.src=window.PIXICON_NAME(n);ROOMIMG[n]=i}return ROOMIMG[n]}
async function enterFriend(id){try{await rpc("town_visit",{rid:me,pin,op:"enter",target:id});await refresh()}catch(e){toast(e.message)}renderPanel()}
async function exitFriend(){const r=R[me];if(vin(r)){r.items={...r.items};delete r.items.fv}try{await rpc("town_visit",{rid:me,pin,op:"exit"});await refresh()}catch(e){toast(e.message)}renderPanel()}
// 伺服器的 town_fi 白名單還沒包含這個地點（舊版 SQL）：記下來，門口照舊顯示全部設施動作，不卡住玩家
const NOENTER={};
const FACTS=new Set(["work","cowork","job","buy","browse","movie","spar","sneak","vbuy","license","insure","vfix","vsell","dine","coffee","workout","paytk"]);
async function ensureIn(){const r=R[me];if(!r||!ROOMS[r.place]||NOENTER[r.place]||fin(r)||r.sleeping||jailed(r)||r.place=="jail"||walkers[me]&&walkers[me].path.length)return;await enterRoom(r.place,true)}
async function enterRoom(pl,quiet){try{await rpc("town_fi",{rid:me,pin,op:"enter",pl});window.SFX&&SFX.play("door");await refresh()}catch(e){if(/還不能進去/.test(e.message))NOENTER[pl]=1;else if(!quiet)toast(e.message)}renderPanel()}
async function exitRoom(){leaveRoomLocal();try{await rpc("town_fi",{rid:me,pin,op:"exit"});await refresh()}catch(e){toast(e.message)}renderPanel()}
function leaveRoomLocal(){const r=R[me];if(vin(r)){r.items={...r.items};delete r.items.fv}if(!fin(r))return false;r.items={...r.items};delete r.items.fi;rpc("town_fi",{rid:me,pin,op:"exit"}).catch(()=>{});return true}
// 室內互動動畫：角色走到對應物件旁（約 0.4 秒）→ 播動畫（約 0.9 秒）→ 走回來（約 0.3 秒），共 1.7 秒；只畫在 12×5 的小畫布，手機不卡
// 打工動畫：種類 → [room 室內物件代號, 室內動畫碼, 地圖動畫碼]；室內沒有物件或不在室內時用地圖動畫（書桌、掃描、文件）
const WORK_FX={work:["pc","wk_type","wk_desk"],cowork:["pc","wk_type","wk_desk"],job_cafe:["coffee","wk_cafe","wk_desk"],job_rest:["kitchen","wk_serve","wk_desk"],job_gym:["rack","wk_lift","wk_desk"],job_shop:["till","wk_scan","wk_scan"],job_rafi:["pc","wk_docs","wk_docs"]};
const wkKey=(a,x)=>a=="work"||a=="cowork"?a:a=="job"&&x&&x.item?"job_"+x.item:null;
let wkBusy=false;
function wkPlay(a,x){const k=wkKey(a,x),W=k&&WORK_FX[k];if(!W||wkBusy||!R[me])return Promise.resolve();wkBusy=true;window.SFX&&SFX.fx(W[1]||W[2],1);const D=1800;
 const rm=roomOf(R[me],R),it=W[0]&&rm&&!rm.home?rm.items.find(o=>o[0]==W[0]):null;
 if(it){roomAnim={code:W[1],it,tv:null,home:false,w:rw(rm),h:rh(rm),born:performance.now(),dur:D,age:0};loopRoom()}
 else{spawnFx(W[2],me);if(a=="cowork"&&x.target&&walkers[x.target])spawnFx(W[2],x.target)}
 return new Promise(r=>setTimeout(()=>{wkBusy=false;r()},D))}
const ROOM_ACT={art:"latteart",share:"pot",combo:"kitchen",bring:"pack",seat:"seat",chat:"screen",sale:"snackshelf",sample:"mshelf",mredeem:"till",latte:"coffee",coffee:"coffee",special:"kitchen",dine:"bar",takeout:"pack",song:"jukebox",treat:"bar",redeem:"cake",spar:"bag",checkin:"locker",workout:"treadmill",spa:"spa",feast:"menu",labor:"work",yard:"yard",visit:"glass",escape:"vent",parole:"gate",bail:"bailDesk",consult:"reg",discharge:"reg",hvisit:"hbed",pay:"pdesk",surrender:"pboard",report:"prep",stats:"pstat",civic:"annb",movie:"screen",popcorn:"popcorn",browse:"till",buy:"till",sneak:"cleaver",vbuy:"vcar",license:"lic",insure:"gar",vfix:"gar",vsell:"gar",trade:"pcs"};
const ROOM_ALT={spar:"ring"};
let lastSpots={},spotsBefore=null;let roomAnim=null;
const HOME_ACT={toilet:"toilet",shower:"shower",eat:"fridge",tv:"tvcab",nap:"massage",qsleep:"bed",sleep:"bed",feed:"fridge",wakeup:"bed",visit:"sofa"};// 家裡：互動 → 家具（沒有那件家具就在房間中央演）
// 對人做的事（扁、丟蛋、惡作劇…）：我走到他旁邊，在他身上播動畫（PAIR_FX：互動 → 動畫代號）
const PAIR_FX={fight:"punch",egg:"eggs",prank:"puff",splash:"splash",sticker:"stick",doorbell:"bell",fakepoop:"poop",swapseat:"swap",fakelove:"love",snack:"steal",photo:"snap",forgive:"love"};
function playRoomFx(a,target){const r=R[me],rm=roomOf(r,R);if(!rm)return;const pf=PAIR_FX[a];
 const L=spotsBefore&&spotsBefore[target]?spotsBefore:lastSpots;
 if(pf&&target&&L[target]){const sp=L[target],mx=sp[0]>0?sp[0]-1:sp[0]+1;roomAnim={code:pf,it:[pf,mx,Math.max(0,sp[1]-1)],tv:null,home:!!rm.home,w:rw(rm),h:rh(rm),born:performance.now(),dur:1700,age:0,tgt:sp};loopRoom();return}
 let code=rm.home?HOME_ACT[a]:ROOM_ACT[a],tv=null;if(!code)return;if(!rm.home&&ROOM_ALT[a]&&!rm.items.some(o=>o[0]==code))code=ROOM_ALT[a];
 if(rm.home&&a=="tv"){tv=rm.items.find(o=>o[0]=="tvcab")||null;if(rm.items.some(o=>o[0]=="sofa"))code="sofa"}
 let it=rm.items.find(o=>o[0]==code);if(!it){if(!rm.home)return;it=[code,Math.floor(rw(rm)/2),2]}
 roomAnim={code,it,tv,home:!!rm.home,w:rw(rm),h:rh(rm),born:performance.now(),dur:1700,age:0};loopRoom()}
function loopRoom(){if(!roomAnim)return;roomAnim.age=(performance.now()-roomAnim.born)/roomAnim.dur;drawRoom();if(roomAnim.age<1)requestAnimationFrame(loopRoom);else{roomAnim=null;drawRoom()}}
const SITS=["sofa","massage","bed"];
function roomFxDraw(c){const A=roomAnim,C=RC,k=Math.max(0,Math.min(1,(A.age-.25)/.57)),ox=(A.it[1]+.5)*C,oy=(A.it[2]+.5)*C,px=ox,py=Math.min(A.h-1,A.it[2]+1)*C+2;if(A.age<.25||(A.age>.82&&A.code!="bed"))return;
 const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)},im=(n,x,y,z)=>{const i=roomImg(n);if(i.complete&&i.naturalWidth)c.drawImage(i,Math.round(x-z/2),Math.round(y-z/2),z,z)};
 switch(A.code){
  case "punch":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+C*.5,b=Math.floor(k*8)%2;for(let j=0;j<6;j++){const a2=j*1.05+k*3,d=5+(k*14)%12;P(tx+Math.cos(a2)*d-1,ty+Math.sin(a2)*d-1,3,3,j%2?"#fee761":"#fff")}if(b)P(tx-7,ty-9,14,3,"#e74c3c");c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#fee761";if(k>.2&&k<.8){c.strokeText("POW",tx,ty-C+2);c.fillText("POW",tx,ty-C+2)}break}
  case "eggs":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+8;const f=Math.min(1,k*1.6);if(f<1)P(ox-1+(tx-ox)*f,oy+C-8-Math.sin(f*3.14)*10+(ty-oy-C+8)*f,4,5,"#fff");else{P(tx-6,ty,12,5,"#fee761");P(tx-4,ty+5,8,3,"#fff");P(tx-1,ty+8,2,4,"#fee761")}break}
  case "splash":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C;for(let j=0;j<7;j++){const y=ty-6+((k*50+j*6)%22),x=tx-10+j*3+Math.sin(k*8+j)*2;P(x,y,2,3,j%2?"#6fc6ff":"#bfe6ff")}P(ox-8+(tx-ox+8)*Math.min(1,k*2),oy-4,6,5,"#6fc6ff");break}
  case "stick":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+10;P(tx-5,ty-2,10,12,"#fff");P(tx-3,ty+1,6,1,"#1b1b2f");P(tx-3,ty+4,6,1,"#1b1b2f");P(tx-3,ty+7,4,1,"#e74c3c");break}
  case "bell":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+6;P(tx-5,ty,10,7,"#fee761");P(tx-1,ty+7,2,3,"#c9a227");for(let j=0;j<3;j++)P(tx-9+j*9+Math.sin(k*40)*2,ty-4-j%2*3,2,2,"#fff");break}
  case "poop":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+C-6;P(tx-6,ty+2,12,4,"#6b4a2b");P(tx-4,ty-2,8,4,"#6b4a2b");P(tx-2,ty-5,4,3,"#6b4a2b");for(let j=0;j<3;j++)P(tx-6+j*6,ty-9-((k*30+j*5)%8),2,2,"#9ccf6e");break}
  case "swap":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+C-8,f=Math.floor(k*6)%2;P(tx-8+f*6,ty,5,3,"#c9a227");P(tx+3-f*6,ty+4,5,3,"#c9a227");P(tx-6,ty+9,12,2,"#6b4a2b");break}
  case "love":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C;for(let j=0;j<3;j++){const x=tx-8+j*8+Math.sin(k*7+j)*2,y=ty-4-((k*40+j*10)%20);P(x,y,3,3,"#ff8fb3");P(x+3,y,3,3,"#ff8fb3");P(x+1,y+3,4,2,"#ff8fb3")}break}
  case "steal":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+8,f=Math.min(1,Math.max(0,(k-.2)/.6));P(tx+(ox-tx)*f-2,ty+(oy-ty)*f-2,5,5,"#c9833a");P(tx+(ox-tx)*f-1,ty+(oy-ty)*f-1,1,1,"#6b4a2b");break}
  case "snap":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C;if(k>.25&&k<.5){c.fillStyle="rgba(255,255,255,.55)";c.fillRect(0,0,A.w*C,A.h*C)}P(tx-9,ty-12,8,6,"#1b1b2f");P(tx-7,ty-11,4,4,"#6fc6ff");break}
  case "puff":{const tx=(A.tgt[0]+.5)*C,ty=A.tgt[1]*C+C*.6;for(let j=0;j<5;j++){const y=ty-((k*30+j*7)%24),x=tx-8+j*4+Math.sin(k*9+j)*2;P(x,y,4,4,j%2?"#9ccf6e":"#6fa34a")}break}
  case "wk_cafe":{const fl=Math.floor(k*16)%2;for(let j=0;j<4;j++)P(ox-6+j*4+Math.sin(k*9+j)*2,oy-10-((k*60+j*9)%20),3,3,`rgba(255,255,255,${.85-j*.12})`);const cy=py-14;P(ox-4,cy,8,7,"#fff");P(ox-3,cy+1,6,2,"#6b4a2b");P(ox+4,cy+2,2,3,"#fff");P(ox-1,oy+2,2,Math.max(0,Math.min(8,k*12)),"#6b4a2b");if(fl)P(ox+8,oy-2,2,2,"#e74c3c");break}
  case "wk_serve":{const f=(Math.sin(k*9)+1)/2,sx=C*1.5+f*(A.w-3)*C*.6;P(sx-7,py-20,14,2,"#c9c9c9");P(sx-5,py-24,10,4,"#fff");P(sx-1,py-27,2,3,"#e74c3c");P(sx-9,py-12,4,4,"#f5c9a0");P(sx+5,py-12,4,4,"#f5c9a0");break}
  case "wk_lift":{const u=Math.abs(Math.sin(k*10)),y=py-30-u*14;P(ox-12,y,24,2,"#9aa5b8");P(ox-14,y-4,4,10,"#1b1b2f");P(ox+10,y-4,4,10,"#1b1b2f");if(u>.9)for(let j=0;j<3;j++)P(ox-8+j*8,py-12,2,2,"#fff");break}
  case "wk_type":{const fl=Math.floor(k*14)%2;P(ox-8,oy-12,16,9,fl?"#6fc6ff":"#bfe6ff");for(let j=0;j<4;j++)P(ox-7+j*4,oy+2+(Math.floor(k*20+j)%2),3,2,"#fff");break}
  case "wk_scan":{const f=Math.floor(k*10)%2;P(ox-9,oy-4,18,2,"#e43b44");if(f)P(ox-9,oy-10,18,2,"#fff");for(let j=0;j<3;j++)P(ox-6+j*6,oy-12-((k*40+j*9)%14),3,3,"#fee761");break}
  case "wk_docs":for(let j=0;j<4;j++){const y=oy-8-((k*50+j*10)%24),x=ox-9+j*6+Math.sin(k*8+j)*3;P(x,y,6,8,"#fff");P(x+1,y+2,4,1,"#1b1b2f");P(x+1,y+5,3,1,"#1b1b2f")}break;
  case "screen":case "popcorn":{const fl=Math.floor(k*12)%3;P(ox-10,oy-6,20,10,["#6fc6ff","#fee761","#ff8fb3"][fl]);for(let j=0;j<3;j++)P(ox-8+j*7,oy+8+((k*30+j*5)%8),3,3,"#fff");break}
  case "till":for(let j=0;j<3;j++)P(ox-6+j*6,oy-2-((k*44+j*9)%18),4,4,"#fee761");P(ox-7,oy-7,14,3,"#6fc6ff");break;
  case "pcs":case "board":{const u=Math.floor(k*10)%2;for(let j=0;j<5;j++){const h=3+((j*7+Math.floor(k*14))%9);P(ox-10+j*4,oy+4-h,3,h,(j+u)%2?"#e43b44":"#63c74d")}break}
  case "ring":for(let j=0;j<6;j++){const a2=j*1.05+k*6;P(ox+Math.cos(a2)*10,oy+Math.sin(a2)*8,3,3,j%2?"#fee761":"#fff")}if(Math.floor(k*10)%2)P(ox-8,oy-12,16,3,"#e74c3c");break;
  case "vcar":case "vmoto":case "vbike":for(let j=0;j<5;j++){const a2=j*1.25+k*5;P(ox+Math.cos(a2)*11,oy+Math.sin(a2)*8,2,2,"#fff")}break;
  case "lic":case "gar":for(let j=0;j<3;j++)P(ox-6+j*6,oy-2-((k*44+j*9)%18),4,4,"#fee761");break;
  case "cleaver":im("cleaver",ox,oy-12+Math.abs(Math.sin(k*18))*10,16);if(Math.sin(k*18)>.85)for(let j=0;j<4;j++)P(ox-8+j*5,oy+4-j%2*3,2,2,"#e43b44");break;
  case "latteart":{const hh=Math.floor(k*10)%2;P(ox-8,oy-2,16,10,"#fff");P(ox-6,oy,12,6,"#6b4a2b");P(ox-3,oy+1,2,2,"#fff");P(ox+1,oy+1,2,2,"#fff");P(ox-2,oy+3,4,2,"#fff");if(hh)P(ox-1,oy-8,2,2,"#ff8fb3");for(let j=0;j<3;j++)P(ox-6+j*6+Math.sin(k*9+j)*2,oy-10-((k*50+j*9)%14),3,3,"rgba(255,255,255,.7)");break}
  case "pot":{P(ox-5,oy-6,10,8,"#c9833a");P(ox+5,oy-4,4,2,"#c9833a");const sw=Math.sin(k*10)*3;P(ox-12+sw,oy+4,5,4,"#fff");P(ox+7-sw,oy+4,5,4,"#fff");for(let j=0;j<3;j++){const x=ox-4+j*4,y=oy-12-((k*40+j*9)%14);P(x,y,3,3,"#ff8fb3")}break}
  case "seat":for(let j=0;j<3;j++){const x=ox-8+j*8+Math.sin(k*7+j)*2,y=oy-6-((k*40+j*10)%18);P(x,y,3,3,"#ff8fb3");P(x+3,y,3,3,"#ff8fb3");P(x+1,y+3,4,2,"#ff8fb3")}break;
  case "mshelf":case "snackshelf":for(let j=0;j<4;j++){const a2=j*1.6+k*5;P(ox+Math.cos(a2)*10,oy+Math.sin(a2)*8,3,3,"#fee761")}break;
  case "coffee":for(let j=0;j<4;j++)P(ox-8+j*5+Math.sin(k*9+j)*2,oy-8-((k*60+j*9)%18),3,3,`rgba(255,255,255,${.85-j*.12})`);break;
  case "jukebox":for(let j=0;j<3;j++){const x=ox+(j-1)*9+Math.sin(k*8+j)*3,y=oy-6-((k*50+j*12)%26);P(x,y,4,3,"#fee761");P(x+3,y-7,1,8,"#fee761")}break;
  case "kitchen":case "bar":case "pack":case "menu":im("plate",px,py-32-Math.abs(Math.sin(k*9))*4,14);for(let j=0;j<3;j++)P(px-8+j*7,py-22+((k*50+j*8)%12),2,2,"#f5e6b8");break;
  case "cake":for(let j=0;j<5;j++){const a2=j*1.25+k*5;P(ox+Math.cos(a2)*10,oy+Math.sin(a2)*8,3,3,"#fee761")}break;
  case "bag":im("fist",ox+Math.sin(k*22)*7,oy,18);if(Math.sin(k*22)>.8)for(let j=0;j<3;j++)P(ox-10+j*10,oy-10,2,2,"#fff");break;
  case "treadmill":for(let j=0;j<5;j++)P(px-12+((j*6+k*90)%30),py+2,4,2,"#1b1b2f");break;
  case "rack":im("dumbbell",px,py-34-Math.abs(Math.sin(k*10))*9,18);break;
  case "locker":{const u2=(.4+Math.sin(Math.min(1,k*2)*1.57)*.6)*3.6;[[0,2],[1,3],[2,4],[3,3],[4,2],[5,1],[6,0]].forEach(p=>P(ox-12+p[0]*u2,oy-16+p[1]*u2,u2,u2,"#63c74d"));break}
  case "spa":c.strokeStyle="#bfe6ff";c.lineWidth=1;for(let j=0;j<5;j++){c.beginPath();c.arc(ox+Math.sin(j*2.1+k*6)*8,oy-4-((k*40+j*9)%20),2+j%2,0,7);c.stroke()}break;
  // 監獄：勞動敲打、放風曬太陽、探監窗口冒愛心、越獄通風口搖晃、假釋大門透光、保釋櫃檯數錢
  case "work":im("hammer",ox+Math.sin(k*20)*5,oy-10-Math.abs(Math.sin(k*20))*4,16);if(Math.sin(k*20)>.85)for(let j=0;j<4;j++)P(ox-6+j*5,oy+4-j%2*3,2,2,"#fee761");break;
  case "yard":for(let j=0;j<6;j++){const a2=j*1.05+k*4;P(ox+Math.cos(a2)*(8+j*2),oy+Math.sin(a2)*5-4,2,2,"#fee761")}break;
  case "glass":case "hbed":for(let j=0;j<3;j++){const x=ox+(j-1)*8+Math.sin(k*7+j)*2,y=oy+2-((k*40+j*10)%22);P(x,y,3,3,"#ff8fb3");P(x+3,y,3,3,"#ff8fb3");P(x+1,y+3,4,2,"#ff8fb3")}break;
  case "vent":P(ox-8+Math.sin(k*40)*2,oy-6,16,2,"#9aa5b8");P(ox-8-Math.sin(k*40)*2,oy,16,2,"#9aa5b8");for(let j=0;j<4;j++)P(ox-8+j*5+Math.sin(k*9+j)*2,oy+8-((k*50+j*7)%16),3,3,"rgba(200,200,200,.8)");break;
  case "gate":P(ox-3,oy-8,6+k*10,16,"rgba(255,244,180,.55)");break;
  case "bailDesk":case "pdesk":for(let j=0;j<3;j++)P(ox-6+j*6,oy-2-((k*44+j*9)%18),4,4,"#fee761");break;
  // 醫院、警察局、市政廳：掛號蓋章打勾、公告欄／報案窗口／治安看板的紙張抖動
  case "reg":P(ox-7,oy-6,14,3,"#fff");P(ox-3,oy-1,3,3,"#63c74d");P(ox,oy+2,3,3,"#63c74d");P(ox+3,oy-1,3,3,"#63c74d");for(let j=0;j<3;j++)P(ox-8+j*8,oy-12-((k*40+j*9)%12),2,2,"#e43b44");break;
  case "pboard":case "prep":case "pstat":case "annb":P(ox-7+Math.sin(k*30)*2,oy-9,14,16,"#fff");P(ox-5+Math.sin(k*30)*2,oy-5,10,1,"#1b1b2f");P(ox-5+Math.sin(k*30)*2,oy-2,10,1,"#1b1b2f");P(ox-5+Math.sin(k*30)*2,oy+1,6,1,"#e43b44");break;
  // 家裡：冰箱開門吃東西、看電視螢幕閃、按摩椅震動、睡覺飄 Z
  case "fridge":P(ox-6,oy-9,12,17,"rgba(255,244,180,.6)");for(let j=0;j<3;j++)P(px-8+j*7,py-26+((k*50+j*8)%12),3,3,["#e74c3c","#f1c40f","#2ecc71"][j]);break;
  case "sofa":case "tvcab":{const t=A.tv||A.it,fl=Math.floor(k*14)%2;P(t[1]*C+5,t[2]*C+4,14,8,fl?"#6fc6ff":"#fee761");break}
  case "massage":for(let j=0;j<3;j++)P(ox-12+j*10,oy+Math.sin(k*30+j*2)*3,2,6,"rgba(255,255,255,.7)");break;
  case "bed":c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.fillStyle="#fff";c.strokeStyle="#1b1b2f";c.lineWidth=3;for(let j=0;j<2;j++){const zy=oy-12-((k*30+j*14)%22);c.strokeText("Z",ox+4+j*7,zy);c.fillText("Z",ox+4+j*7,zy)}break}}
function drawRoom(){const cv=$("room");if(!cv)return;const r=R[me],rm=roomOf(r,R);
 const wk=walkers[me]&&walkers[me].path.length,show=!!rm&&!wk&&(rm.home||!r.sleeping||fin(r));
 // 走去有室內的地方（有人在的朋友家、設施）時先保留畫布的位置：到了才畫內容，面板高度不會突然變高、整個畫面不會跳一下
 const dd=wk&&walkers[me].dest,ho=dd&&dd.startsWith("home:")?R[dd.slice(5)]:null,hold=!show&&!!dd&&!!ho&&ho.place==dd&&inside(ho);
 if(!show&&hold){if(cv.width==300&&cv.height==150){cv.width=144;cv.height=96}cv.classList.remove("hide");const c0=cv.getContext("2d");c0.fillStyle="#1b1b2f";c0.fillRect(0,0,cv.width,cv.height);return}
 cv.classList.toggle("hide",!show||!!stageRoom());if(!show)return;   // 自己人在室內時，室內畫在主畫面（drawRoomStage），面板的小畫布不用
 const C=RC,W=rw(rm),H=rh(rm);if(cv.width!=W*C)cv.width=W*C;if(cv.height!=H*C)cv.height=H*C;
 const c=cv.getContext("2d");c.imageSmoothingEnabled=false;c.clearRect(0,0,W*C,H*C);
 c.fillStyle=rm.wall;c.fillRect(0,0,W*C,C);for(let y=1;y<H;y++)for(let x=0;x<W;x++){c.fillStyle=rm.floor[(x+y)%2];c.fillRect(x*C,y*C,C,C)}
 {const hr=new Date(Date.now()+8*36e5).getUTCHours();if(!rm.home&&(hr>=19||hr<6)){c.fillStyle="rgba(20,20,70,.26)";c.fillRect(0,C,W*C,(H-1)*C)}}
 c.fillStyle="rgba(0,0,0,.25)";c.fillRect(0,C-3,W*C,3);
 for(const o of rm.items){if(rm.home){furnDraw(c,o[0],o[1]*C,o[2]*C,C);continue}const im=roomImg(ITEM[o[0]][0]);if(im.complete&&im.naturalWidth)c.drawImage(im,o[1]*C,o[2]*C,C,C)}
 if(rm.npc&&!rm.home){const P=r.place,nn=NPCS[P],t=Date.now(),nx=(rm.npc[0]+.5)*C,ny=rm.npc[1]*C+2,cnt=Object.values(R).filter(o=>o.place==P&&fin(o)&&!o.sleeping).length;drawChar(c,nx,ny,1.05,{hair:nn.hair},{moving:false},Math.floor(t/90));c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#9fe3ff";c.strokeText(nn.n,nx,Math.max(11,ny-30));c.fillText(nn.n,nx,Math.max(11,ny-30));if(t%9000<4000){const tx=npcSay(P,t,cnt),w=Math.min(W*C-4,tx.length*11+10),bx=Math.max(2,Math.min(W*C-w-2,nx-w/2));c.fillStyle="#fff";c.fillRect(bx,ny-52,w,16);c.strokeStyle="#1b1b2f";c.lineWidth=1;c.strokeRect(bx,ny-52,w,16);c.fillStyle="#1b1b2f";c.textAlign="left";c.fillText(tx,bx+5,ny-40)}}
 const here=rm.home?(rm.visit?[tickLocal(R[rm.hid],now()),...Object.values(R).filter(o=>o.id!=rm.hid&&vin(o)&&+o.items.fv==rm.hid&&!o.sleeping&&!(walkers[o.id]&&walkers[o.id].path.length)).sort((a,b)=>(b.id==me)-(a.id==me))]:[r]):Object.values(R).filter(o=>o.place==r.place&&fin(o)&&(o.place=="jail"||!jailed(o))&&!(walkers[o.id]&&walkers[o.id].path.length)).sort((a,b)=>(b.id==me)-(a.id==me)),spots=roomSpots(rm);
 const beds=rm.home?[]:rm.items.filter(q=>q[0]=="hbed"||q[0]=="bunk");let bi=0;
 lastSpots={};here.slice(0,Math.max(1,spots.length)).forEach((o,i)=>{const sp=spots[i]||[Math.floor(W/2),2];lastSpots[o.id]=sp;let x=(sp[0]+.5)*C,y=sp[1]*C+2,mv=false;
  if(!rm.home&&o.sleeping){const bd=beds[bi++]||null,bx=bd?(bd[1]+.5)*C:x,by=bd?bd[2]*C+C-4:y;c.save();c.translate(bx,by-2);c.rotate(-Math.PI/2);drawChar(c,0,0,1.05,o.look,{moving:false},0);c.restore();c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#fff";c.strokeText("Z z",bx+4,by-C+2);c.fillText("Z z",bx+4,by-C+2);c.strokeText(o.name.slice(0,4),bx,Math.max(11,by-C-8));c.fillStyle=o.id==me?"#fee761":"#fff";c.fillText(o.name.slice(0,4),bx,Math.max(11,by-C-8));return}
  if(rm.home&&o.sleeping&&!(roomAnim&&roomAnim.code=="bed"&&roomAnim.age<.25)){const bd=rm.items.find(q=>q[0]=="bed"),bx=bd?(bd[1]+.5)*C:x,by=bd?bd[2]*C+C-4:y;c.save();c.translate(bx,by-2);c.rotate(-Math.PI/2);drawChar(c,0,0,1.05,o.look,{moving:false},0);c.restore();
   c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#fff";c.strokeText("Z z",bx+4,by-C+2);c.fillText("Z z",bx+4,by-C+2);return}
  if(o.id==me&&roomAnim&&roomAnim.age<1){const A=roomAnim,tx=(A.it[1]+.5)*C,sit=SITS.includes(A.code),ty=sit?A.it[2]*C+C-3:Math.min(A.h-1,A.it[2]+1)*C+2,kk=A.age<.25?A.age/.25:A.age>.82?(1-A.age)/.18:1;mv=kk<1;x+=(tx-x)*kk;y+=(ty-y)*kk;if(A.code=="treadmill"&&kk==1)y-=Math.abs(Math.sin(A.age*40))*2;if(A.code=="massage"&&kk==1)x+=Math.sin(A.age*70)*1.2}
  drawChar(c,x,y,1.05,o.look,{moving:mv},Math.floor(performance.now()/90));c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.strokeText(o.name.slice(0,4),x,Math.max(11,y-30));c.fillStyle=o.id==me?"#fee761":"#fff";c.fillText(o.name.slice(0,4),x,Math.max(11,y-30))});if(roomAnim&&roomAnim.age<1)roomFxDraw(c)}
function npcModal(P){const nn=NPCS[P];if(!nn)return;const m=({market:.85,festival:.9,bust:1.1})[wevK]||1,cnt=Object.values(R).filter(o=>o.place==P&&fin(o)&&!o.sleeping).length;
 const rows=[["問候",`${nn.n}（${nn.job}）打招呼`,async()=>toast(`${nn.n}：${npcSay(P,Date.now(),cnt)}`)]];
 rows.push([nn.base?"今日價格":"今日消息",nn.base?`${nn.item} 現在 €${Math.round(nn.base*m)}${m!=1?"（"+WEV[wevK][0]+"）":""}`:(wevK?`${WEV[wevK][0]}：${WEV[wevK][1]}`:"今天鎮上沒有特別的事"),async()=>toast(nn.base?`${nn.n}：${nn.item}今天 €${Math.round(nn.base*m)}${wevK?"，"+WEV[wevK][0]+"期間":""}`:`${nn.n}：${wevK?WEV[wevK][0]+"，"+WEV[wevK][1]:"今天沒什麼大事"}`)]);
 if(REG[P]){const nm=REG[P][doyTP()%3],pp=REGP[P];rows.push(["常客："+nm,`${REGQ[P]} · 付 €${pp[0]}、謝禮 €${pp[1]}、心情 +6`,()=>doReg(P)])}
 rows.push(["聽八卦","聽聽鎮上最近的事",async()=>{const ev=((S&&S.events)||[]).filter(e=>e.msg&&e.kind!="rent"&&e.kind!="luck").slice().sort((a,b)=>b.at.localeCompare(a.at)).slice(0,3);toast(ev.length?`${nn.n}：聽說${ev.map(e=>e.msg).join("；")}`:`${nn.n}：最近沒什麼八卦`)}]);
 if(P=="townhall")rows.push(["公告欄委託","今天的額外委託，獎金依職稱",async()=>{try{const j=await rpc("town_quest",{rid:me,pin,op:"view"});if(j&&j.error){toast(j.error);return}const go=async()=>{try{const k=await rpc("town_quest",{rid:me,pin,op:"claim"});if(k&&k.error)toast(k.error);else{toast(k.msg);await refresh()}}catch(e){toast("連不上小鎮，再試一次")}};choiceModal("公告欄委託",`${j.need}，獎金 €${j.reward}（Lv${j.lv}）${j.done?"，今天已完成":j.ready?"，已達成":""}`,[[j.done?"已完成":"交付委託",j.ready?"在市政廳領獎":"還沒達成",async()=>{if(j.done)toast("今天已完成了");else if(!j.ready)toast("還沒達成："+j.need);else await go()}]])}catch(e){toast("連不上小鎮，再試一次")}}]);
 choiceModal(nn.n,nn.job,rows)}
// 點室內：點人＝選他（面對面互動），點物件＝按面板上對應的按鈕；fx、fy 是在室內畫布上的位置（0～1）
function roomTap(fx,fy){const r=R[me],rm=roomOf(r,R);if(!rm)return;if(rm.visit&&!vin(r)){interiorModal(rm.hid);return}const cx=Math.floor(fx*rw(rm)),cy=Math.floor(fy*rh(rm)),pid=Object.keys(lastSpots).find(k=>+k!=me&&lastSpots[k][0]==cx&&(lastSpots[k][1]==cy||lastSpots[k][1]-1==cy));   // 人的腳在格子上緣、身體畫在上一格，兩格都算點到
 if(rm.npc&&!rm.home&&cx==rm.npc[0]&&(cy==rm.npc[1]||cy==rm.npc[1]-1)){npcModal(r.place);return}
 if(pid){sel=sel==+pid?null:+pid;renderPanel();return}const o=rm.items.find(o=>o[1]==cx&&o[2]==cy);if(!o){if(rm.home&&!r.sleeping&&!rm.visit)interiorModal(me);return}
 const d=rm.home?[0,(FURN.find(a=>a[0]==o[0])||[0,o[0]])[1],HACT[o[0]]?HACT[o[0]][0]:null]:ITEM[o[0]];if(!d[2]){if(rm.home)interiorModal(me);else toast(d[1]);return}
 const i=panelFns.findIndex(f=>d[2].test(f.label));let el=i<0?null:document.querySelector(`#panel button[data-i="${i}"]`);if(i>=0&&!el){panelFnTab(panelFns[i]);el=document.querySelector(`#panel button[data-i="${i}"]`)}if(el)el.click();else toast(`${d[1]}現在不能用`)}
{const cv=typeof document!=="undefined"&&document.getElementById("room");if(cv)cv.addEventListener("click",ev=>{const b=cv.getBoundingClientRect();roomTap((ev.clientX-b.left)/b.width,(ev.clientY-b.top)/b.height)})}
// 主畫面帶屋內：自己人在室內（設施裡、自己家屋裡、朋友家屋裡；醫院住院的人也算）而且沒在走路時，主畫面改畫室內（放大），不再畫地圖；點物件、點人和面板按鈕一樣用
function stageRoom(){const r=R[me];if(!r)return null;const wk=walkers[me];if(wk&&wk.path.length)return null;const rm=roomOf(r,R);if(!rm)return null;if(rm.visit&&!vin(r))return null;return rm}
let roomRect=null;
function drawRoomStage(){const rm=stageRoom(),rc=$("room");if(!rm||!rc){roomRect=null;return false}drawRoom();if(!rc.width||!rc.height)return false;
 const mob=isMob(),pt=8,pb=8,aw=W-16,ah=Math.max(60,Hh-pt-pb),s=(raw=>isPC()?Math.max(1,Math.min(3,Math.floor(raw))):Math.max(1,raw))(Math.min(aw/rc.width,ah/rc.height)),dw=Math.round(rc.width*s),dh=Math.round(rc.height*s),x=Math.round((W-dw)/2),y=Math.round(pt+(ah-dh)/2);
 g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;{let wc="#1b1b2f",fc="#14142a";const now_=performance.now();if(!drawRoomStage.bg||now_-drawRoomStage.bg.t>600){try{const c2=rc.getContext("2d",{willReadFrequently:true}),a=c2.getImageData(3,3,1,1).data,b=c2.getImageData(3,rc.height-4,1,1).data;drawRoomStage.bg={t:now_,w:`rgb(${a[0]},${a[1]},${a[2]})`,f:`rgb(${b[0]},${b[1]},${b[2]})`}}catch(e){drawRoomStage.bg={t:now_,w:wc,f:fc}}}wc=drawRoomStage.bg.w;fc=drawRoomStage.bg.f;const wy=y+Math.round(24*s);g.fillStyle=wc;g.fillRect(0,0,W,wy);g.fillStyle=fc;g.fillRect(0,wy,W,Hh-wy);g.fillStyle="rgba(10,10,25,.55)";g.fillRect(0,0,W,Hh)}
 g.fillStyle="#0b0b14";g.fillRect(x-6,y-6,dw+12,dh+12);g.drawImage(rc,x,y,dw,dh);g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(x-4,y-4,dw+8,dh+8);
 roomRect={x,y,w:dw,h:dh};return true}
function stageTap(e){const b=cv.getBoundingClientRect(),px=e.clientX-b.left,py=e.clientY-b.top,rr=roomRect;if(!rr)return;if(px<rr.x||py<rr.y||px>=rr.x+rr.w||py>=rr.y+rr.h){toast("要離開，點下面的「出門」");return}roomTap((px-rr.x)/rr.w,(py-rr.y)/rr.h)}
const togetherAt=p=>PEV[p]&&Object.values(R).filter(o=>o.place==p&&!o.sleeping).length>=2;
const TOGETHER_LINES=["一起真開心","嘿嘿，有伴真好","這裡好熱鬧","要不要一起做點什麼？"];
// 邀請一起做：按鈕在設施面板；收到邀請時彈窗，1 分鐘內可接受
function inviteBtns(r){const p=r.place;if(!PEV[p]||r.sleeping)return[];const here=Object.values(R).filter(o=>o.id!=me&&o.place==p&&!o.sleeping);if(!here.length)return[];
 const cdOf=o=>{const t=Date.parse((r.items.cd||{})["jt"+o.id]||0);return Math.max(0,30*6e4-(now()-t))};
 const send=o=>async()=>{try{await rpc("town_invite",{rid:me,pin,op:"send",target:o.id});toast(`已邀請 ${o.name}，1 分鐘內他點接受就開始`);spawnFx("hearts",me)}catch(e){toast(e.message)}};
 const one=o=>{const c=cdOf(o);return btn(`邀請 ${o.name} 一起${JT[p]} 🤝`,c?`剛做過，${fmtLeft(c)}後再約`:"他 1 分鐘內接受 · 兩人心情 +12、精力 +5、好感 +1 · 30 分鐘一次",c?()=>toast("剛一起做過，晚點再約"):send(o),"face")};
 return here.slice(0,4).map(one)}
let ivSeen="";
function checkInvite(){const r=R[me];if(!r||!r.items||!r.items.iv||modalOpen()||!S)return;const iv=r.items.iv,age=Date.parse(S.now)-Date.parse(iv.at),f=R[iv.f];
 if(age>55e3||age<0||ivSeen==iv.at||!f||r.sleeping||r.place!=iv.p||f.place!=iv.p||!PEV[r.place])return;ivSeen=iv.at;
 choiceModal(`${f.name} 邀請你一起${JT[r.place]}`,"1 分鐘內有效 · 兩人心情 +12、精力 +5、好感 +1",[["好啊","一起做",async()=>{try{const j=await rpc("town_invite",{rid:me,pin,op:"yes",target:f.id});await refresh();spawnFx("hearts",me);spawnFx("hearts",f.id);toast(j.bonus?`和 ${f.name} 一起：心情 +12、精力 +5、好感 +1`:`和 ${f.name} 好感 +1（今天的加成用完了）`)}catch(e){toast(e.message)}renderPanel()}],["下次吧","不接受",async()=>{try{await rpc("town_invite",{rid:me,pin,op:"no",target:f.id});await refresh()}catch(e){}}]])}
// ── 格鬥場邀約 PK（town_mischief.sql 的 town_pk）：邀約 → 對方 3 分鐘內接受／婉拒 → 兩人被帶到格鬥場，三回合分勝負，動畫兩邊都看 ──
const snapMe=()=>{const r=R[me],w=walkers[me];if(r&&w){w.x=r.x;w.y=r.y;w.tx=r.x;w.ty=r.y;w.path=[];w.dest=null;w.then=null}};
function pkModal(id){const t=R[id],r=R[me];if(!t)return;const cap=Math.min(r.money,t.money),opts=[0,100,500,1000,2000].filter(b=>b<=cap);
 choiceModal(`邀請 ${t.name} 去格鬥場 PK`,`他 3 分鐘內要回應 · 三回合分勝負，不會死 · 下注：輸的付、贏的拿 95%（5% 進鎮基金）· 沒下注贏的拿 ${CUR}100（每人 30 分鐘一次）`,opts.map(b=>[b?`下注 €${b}`:"友誼賽（不下注）",b?`雙方都要付得起 · 你 €${r.money}、他 €${t.money}`:"贏的人 €100 · 好感 +1",async()=>{try{const j=await rpc("town_pk",{rid:me,pin,op:"send",target:id,bet:b});toast(j.msg);feedback(true,j.msg);pkWatch(id)}catch(e){toast(e.message);feedback(false,e.message)}}]))}
// ── 門外叫醒（supabase/town_wake_out.sql）：站在他家門口，叫醒睡著的人，他走出來站在門口，兩人在門口面對面 ──
async function wakeOut(id){try{const j=await rpc("town_wake_out",{rid:me,pin,target:id});toast(j.msg);feedback(!!j.ok,j.msg);await refresh();if(j.ok)spawnFx("sparkle",id)}catch(e){toast(e.message);feedback(false,e.message)}renderPanel()}
let woSeen="";
function checkWoken(){const r=R[me];if(!r||!r.items||!r.items.wo||modalOpen()||!S)return;const w=r.items.wo,age=Date.parse(S.now)-Date.parse(w.at),f=R[w.f];
 if(age>10*60e3||age<0||woSeen==w.at||!f)return;let key="town_wo_"+me;try{if(localStorage.getItem(key)==w.at)return;localStorage.setItem(key,w.at)}catch(e){}woSeen=w.at;
 choiceModal(`${f.name} 把你叫醒了`,"你現在站在家門口，他就在門外 · 可以直接和他面對面互動；想繼續睡，進屋就好",[["知道了","去跟他打招呼",()=>{}]])}
let pkTimer=null;
// ── 喪屍豬（supabase/town_tweaks.sql）：全天隨機刷出（夜間機率較高、數量較多），每隻活 8～16 分鐘；綠皮小豬，緩慢追向最近的戶外玩家；碰到精力 −8、心情 −8、清潔 −10（不會死、不扣錢）；打倒領 €60～140（一天最多 €600），35% 掉生豬肉（超市收購 €30）；屋裡、店裡、醫院、監獄、睡覺都安全 ──
let ZB=[],ZR={},zbLast=0,zbBusy=false;
const zbOut=r=>!!r&&!r.sleeping&&!jailed(r)&&["street","plaza","park"].includes(r.place)&&!fin(r);
async function zbCall(op,target){if(!me||!S)return null;try{return await rpc("town_zombie",{rid:me,pin,op,target:target||null})}catch(e){if(op!="poll")toast(e.message);return null}}
function zbSet(j){const old=ZB;ZB=j.z||[];if(window.SFX&&ZB.length>old.length&&old.length==0)SFX.play("zombie");for(const z of ZB)if(!ZR[z.id])ZR[z.id]={x:z.x,y:z.y};for(const k of Object.keys(ZR))if(!ZB.some(z=>z.id==k))delete ZR[k];if(R[me]&&R[me].items&&j.pork!=null)R[me].items.zp=j.pork}
let zbTick=0;
async function zbPoll(){if(zbBusy||document.visibilityState!="visible"||!me||!S||!isOn("zombie"))return;if(!ZB.length&&(++zbTick)%3)return;// 沒有喪屍時每 12 秒問一次，有的時候每 4 秒
zbBusy=true;try{const j=await zbCall("poll");if(j){zbSet(j);if(j.hit){toast("喪屍豬打到你了！精力 −8、心情 −8、清潔 −10");spawnFx("flash",me);refresh().catch(()=>{})}renderPanel()}}finally{zbBusy=false}}
async function zbHit(id){const j=await zbCall("hit",id);if(!j)return;zbSet(j);spawnFx("fight",me);toast(j.msg||"揍了牠一拳");feedback(true,j.msg||"");await refresh().catch(()=>{});renderPanel()}
async function zbSell(){const j=await zbCall("sell");if(!j)return;toast(j.msg);feedback(true,j.msg);await refresh().catch(()=>{});renderPanel()}
setInterval(zbPoll,4000);
// 鎮上隨機事件：全鎮事件橫幅（每 60 秒問一次）與個人突發事件（戶外每 ~3 分鐘）
const WEV={market:["市集日","吃喝價格 85%"],boom:["景氣好","打工薪水 115%"],bust:["景氣差","打工薪水 90%、吃喝價格 110%"],blackout:["停電","打工薪水 95%"],festival:["小鎮慶典","吃喝價格 90%、打工薪水 105%"]};
let wevK=null,wevUntil=0,wevBusy=false;
let wevHide=null;
let wevKey="";
function wevDraw(){let b=$("wev");const on=!!wevK&&wevUntil>=Date.now(),hp=happyAt(Date.now());wevKey=(on?wevK:"")+"|"+(hp?hp.k:"");
 if((!on&&!hp)||wevHide===wevKey){if(b)b.classList.remove("on");return}
 if(!b){b=document.createElement("div");b.id="wev";b.onclick=()=>{wevHide=wevKey;b.classList.remove("on")};document.body.appendChild(b)}
 const parts=[];if(on)parts.push(`${WEV[wevK][0]}：${WEV[wevK][1]} · 剩 ${Math.max(1,Math.ceil((wevUntil-Date.now())/6e4))} 分`);if(hp)parts.push(`${hp.n}：打工薪水 +10% · 剩 ${hp.left} 分`);
 b.textContent=parts.join("　");b.classList.add("on")}
let NPCV=null;
const NPCI=[["tonic","特調補品","€1500 · 心情 +30、清潔 +30"],["toy","小豬玩偶","€2500 · 收藏品，純裝飾"],["book","訓練手冊","€2000 · 隨機一項能力進度 +2"]];
async function npcPoll(){if(document.visibilityState!="visible"||!me||!S)return;try{const j=await rpc("town_npc",{rid:me,pin,op:"view"});if(j&&!j.error){const was=NPCV&&NPCV.here;NPCV=j;if(j.here&&!was)toast("流動商人來了，在"+(j.place=="plaza"?"廣場":"公園"))}}catch(e){}}
function npcShop(){const b=(NPCV&&NPCV.bought)||[];choiceModal("流動商人","限量奇貨，每種每天限買一次",NPCI.map(a=>[a[1]+(b.includes(a[0])?"（今天買過了）":""),a[2],async()=>{if(b.includes(a[0])){toast("今天買過了");return}try{const j=await rpc("town_npc",{rid:me,pin,op:"buy",item:a[0]});if(j&&j.error)toast(j.error);else{toast(j.msg);if(NPCV)NPCV.bought=j.bought;await refresh()}}catch(e){toast("連不上小鎮，再試一次")}}]))}
let TRV=null;
const TRQ=[["旅人問路","「請問車站怎麼走？」",["親切帶路","心情 +8"],["隨便指一下","心情 −2"]],["旅人賣藏寶圖","「這張圖要 €200，說不定能挖到寶。」",["買下來","€200 · 一半機率挖到 €300、否則心情 −5"],["不買","沒有影響"]],["旅人說故事","「我來跟你講講我的旅行。」",["認真聽","心情 +10"],["打斷他","心情 −3"]],["旅人請你喝一杯","「一起喝一杯吧，我請……不對，你請？」",["請他喝","€100 · 心情 +12"],["婉拒","沒有影響"]]];
async function trvPoll(){if(document.visibilityState!="visible"||!me||!S)return;try{const j=await rpc("town_traveler",{rid:me,pin,op:"view"});if(j&&!j.error){const was=TRV&&TRV.here;TRV=j;if(j.here&&!was)toast("有旅人來鎮上了，在"+(j.place=="plaza"?"廣場":"公園"))}}catch(e){}}
function trvTalk(){const q=TRQ[TRV.q];choiceModal(q[0],q[1],[q[2],q[3]].map((a,i)=>[a[0],a[1],async()=>{try{const j=await rpc("town_traveler",{rid:me,pin,op:"pick",item:String(i)});if(j&&j.error)toast(j.error);else{toast(j.msg);TRV.here=false;await refresh()}}catch(e){toast("連不上小鎮，再試一次")}}]))}
setInterval(trvPoll,6e4);setTimeout(trvPoll,6000);
setInterval(npcPoll,6e4);setTimeout(npcPoll,5000);
async function wevPoll(){if(wevBusy||document.visibilityState!="visible"||!me||!S)return;wevBusy=true;try{const j=await rpc("town_world",{rid:me,pin,op:"poll"});const ev=j&&j.ev&&WEV[j.ev.k]?j.ev:null;const k=ev?ev.k:null;if(k!==wevK){if(k)toast(`小鎮事件：${WEV[k][0]}，${WEV[k][1]}`);else if(wevK)toast("小鎮事件結束了");}wevK=k;wevUntil=ev?Date.parse(ev.until):0;wevDraw()}catch(e){}finally{wevBusy=false}}
async function luckPoll(){if(document.visibilityState!="visible"||!me||!S||updBusy())return;const r=R[me];if(!r||r.sleeping||!["street","plaza","park"].includes(r.place))return;try{const j=await rpc("town_pool",{rid:me,pin,op:"luck"});if(j&&j.title)await refresh().catch(()=>{})}catch(e){}}
setInterval(wevPoll,6e4);setInterval(wevDraw,3e4);setInterval(luckPoll,18e4);setTimeout(wevPoll,4000);
function drawZpig(g,X,Y,t){const b=Math.round(Math.sin(t/220)*1.5),R0=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(X+x,Y+y+b,w,h)};g.fillStyle="rgba(0,0,0,.25)";g.fillRect(X+4,Y+22,22,4);
 R0(8,-6,14,12,"#7fb069");R0(8,-6,14,3,"#5a8a4a");R0(6,0,6,5,"#a6d49f");R0(8,-2,3,3,"#c0392b");R0(15,-2,3,3,"#c0392b");R0(10,6,12,12,"#7fb069");R0(10,12,12,3,"#4b5e2d");R0(10,18,12,4,"#5a3a1a");R0(4,6,6,3,"#7fb069");R0(22,6,6,3,"#7fb069");R0(11,22,4,6,"#5a8a4a");R0(17,22,4,6,"#5a8a4a")}
function pkWatch(id){clearInterval(pkTimer);const t0=Date.now();pkTimer=setInterval(async()=>{if(Date.now()-t0>190e3){clearInterval(pkTimer);return}try{const j=await rpc("town_pk",{rid:me,pin,op:"poll"});if(j&&j.pkr){clearInterval(pkTimer);await refresh();if(j.pkr.no){toast(`${j.pkr.n} 婉拒了你的邀約`);return}snapMe();pkAnim(j.pkr)}}catch(e){}},4000)}
let pkSeen="";
function checkPk(){const r=R[me];if(!r||!r.items||!r.items.pk||modalOpen()||!S)return;const iv=r.items.pk,age=Date.parse(S.now)-Date.parse(iv.at),f=R[iv.f];
 if(age>175e3||age<0||pkSeen==iv.at||!f||r.sleeping||jailed(r))return;pkSeen=iv.at;const bet=iv.b||0;
 choiceModal(`${f.name} 邀你去格鬥場 PK`,`3 分鐘內有效 · 三回合分勝負，不會死 · ${bet?`賭注 €${bet}：輸的付、贏的拿 95%`:"友誼賽：贏的人 €100"}`,[["接受，走吧","兩個人都被帶到格鬥場",async()=>{try{const j=await rpc("town_pk",{rid:me,pin,op:"accept",target:f.id});await refresh();snapMe();pkAnim(j.pkr)}catch(e){toast(e.message)}renderPanel()}],["婉拒","他會收到通知",async()=>{try{await rpc("town_pk",{rid:me,pin,op:"decline",target:f.id});await refresh()}catch(e){toast(e.message)}}]])}
function pkAnim(pk){const A=R[pk.a],B=R[pk.b];if(!A||!B)return;$("modal").classList.remove("hide");
 $("mbody").innerHTML=`<h2>格鬥場 PK</h2><p class="mut">${esc(pk.an)} vs ${esc(pk.bn)}${pk.bet?` · 賭注 €${pk.bet}`:""}</p><canvas id="pkc" width="288" height="144" style="display:block;margin:6px auto;width:100%;max-width:288px;image-rendering:pixelated;border:3px solid var(--ink)"></canvas><p id="pkt" class="mut" style="text-align:center">準備…</p><div class="row"><button class="pri hide" id="pkOk">好</button></div>`;
 const cv=$("pkc"),c=cv.getContext("2d");c.imageSmoothingEnabled=false;const rounds=pk.rounds.split(""),T0=performance.now(),RD=1300;let hpA=3,hpB=3,done=false;
 const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const frame=t=>{const el=t-T0,ri=Math.min(2,Math.floor(el/RD)),k=(el-ri*RD)/RD,aw=rounds[ri]=="W";c.clearRect(0,0,288,144);P(0,0,288,144,"#2a2347");P(0,96,288,48,"#5a3a2a");P(0,92,288,4,"#c0392b");P(0,100,288,2,"#e8d6a8");
  // 擂台繩
  for(let i=0;i<3;i++)P(0,30+i*18,288,2,i==1?"#fff":"#e74c3c");
  hpA=3-rounds.slice(0,Math.min(3,ri+(k>.55?1:0))).filter(x=>x=="L").length;hpB=3-rounds.slice(0,Math.min(3,ri+(k>.55?1:0))).filter(x=>x=="W").length;
  const lunge=k<.5?Math.sin(k*2*Math.PI/2)*22:0,hit=k>.5&&k<.8,hitX=aw?[200,80]:[80,200];
  // 出拳的人向前、被打的人後仰
  const ax=60+(aw?lunge:0)+(!aw&&hit?-8:0),bx=228-(aw?0:lunge)+(aw&&hit?8:0);
  drawChar(c,ax,118,1.5,A.look,{moving:aw&&k<.5},Math.floor(el/90));drawChar(c,bx,118,1.5,B.look,{moving:!aw&&k<.5},Math.floor(el/90)+3);
  if(hit){const hx=aw?bx-16:ax+16;for(let j=0;j<6;j++){const a2=j*1.05+k*8;P(hx+Math.cos(a2)*(6+k*10)-1,88+Math.sin(a2)*(6+k*10)-1,3,3,j%2?"#fee761":"#fff")}c.font="11px 'Cubic 11',monospace";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#1b1b2f";c.fillStyle="#fee761";c.strokeText("POW",hx,72);c.fillText("POW",hx,72)}
  // 血條與名字
  c.font="11px 'Cubic 11',monospace";c.textAlign="left";c.fillStyle="#fff";c.fillText(pk.an.slice(0,5),6,12);c.textAlign="right";c.fillText(pk.bn.slice(0,5),282,12);
  for(let i=0;i<3;i++){P(6+i*16,16,14,6,i<hpA?"#63c74d":"#3a3358");P(282-14-i*16,16,14,6,i<hpB?"#63c74d":"#3a3358")}
  $("pkt").textContent=el<3*RD?`第 ${ri+1} 回合：${aw?pk.an:pk.bn} 打中了`:"";
  if(el<3*RD+500){requestAnimationFrame(frame);return}
  if(!done){done=true;const win=pk.w==pk.a?pk.an:pk.bn,me2=pk.w==me,txt=`${win} 贏了！${pk.bet?(me2?` 你拿到 €${pk.bet-pk.fee}`:pk.w?` 你輸了 €${pk.bet}`:""):(pk.prize&&me2?` 你拿到獎金 €${pk.prize}`:"")}`;$("pkt").textContent=txt;$("pkOk").classList.remove("hide");$("pkOk").onclick=()=>{$("modal").classList.add("hide");refresh().catch(()=>{})};spawnFx("fight",me)}};
 requestAnimationFrame(frame)}
// ── 開始：沒有代碼就是首頁；有代碼就讀小鎮，這台手機住過就自動登入；每 15 秒同步一次 ──
const slow=setTimeout(()=>{const x=document.querySelector("#lg .ld small");if(x)x.textContent="網路比較慢，再等一下…"},6000);
(async()=>{if(!TID){clearTimeout(slow);const l=mine();if(standalone&&l.length==1){go(l[0].tid);return}landing();return}
 try{await refresh()}catch(e){clearTimeout(slow);$("lg").innerHTML=`<h2>進不去這個小鎮</h2><p class="err">${esc(e.message)}</p><p class="mut">網路正常的話，可能是小鎮代碼打錯了。</p><div class="row" style="justify-content:flex-start"><button class="pri" id="retry3">再試一次</button><button id="home3">回小豬鎮首頁</button></div>`;$("home3").onclick=()=>go("");$("retry3").onclick=()=>location.reload();return}clearTimeout(slow);
 const a=mine().find(x=>x.tid==TID);
 if(a&&a.pin&&R[a.rid]){try{const res=await rpc("town_login",{rid:a.rid,pin:a.pin});me=a.rid;pin=a.pin;lastSeen=res.last_seen;await enter()}catch(e){if(me||/連不上|網路|fetch|Failed|Load failed/i.test(e.message||"")){$("login").classList.remove("hide");$("lg").innerHTML=`<h2>暫時進不去</h2><p class="err">${esc(e.message||e)}</p><p class="mut">你的登入還在，不用重輸邀請碼，再試一次就好。</p><div class="row" style="justify-content:flex-start"><button class="pri" id="retry4">再試一次</button></div>`;$("retry4").onclick=()=>location.reload()}else townLogin()}}else townLogin();
 setInterval(()=>{if(document.visibilityState=="visible"&&S){touchMine();refresh().catch(()=>{})}},15000);setInterval(pePoll,20000)})();
}

// 放在整支檔案最後：頂層的 const（例如 CUR）都初始化完才能跑 init()。index.html 的 LP 會在首頁畫好後才動態載入這支程式，那時 DOMContentLoaded 早就過了，所以要檢查 readyState
if(typeof document!=="undefined"){if(document.readyState==="loading")addEventListener("DOMContentLoaded",init);else init()}

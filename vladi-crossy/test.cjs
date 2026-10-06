const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/game.js','utf8');let W=390,H=844,now=1000,queue=[];const winListeners={},els={};
const context=new Proxy({createLinearGradient(){return{addColorStop(){}}}},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(){const events={};return{events,classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){(events[n]??=[]).push(f)},setPointerCapture(){},fire(n,e={}){for(const f of events[n]||[])f(e)},click(){for(const f of events.click||[])f({preventDefault(){}})},getContext(){return context},style:{},textContent:'',innerHTML:'',width:0,height:0}}
for(const s of ['#game','#panel','#panelTitle','#panelText','#start','#hint','#hud','#controls','#pause','#score','#best','#coins'])els[s]=element();
const buttonNames=['up','left','right','down'],buttons=buttonNames.map(name=>{const e=element();e.dataset={move:name};return e});
const saved={},imageClass=class{set src(v){this._src=v;this.complete=true;this.naturalWidth=320;this.naturalHeight=380}};
const doc={hidden:false,querySelector:s=>els[s],querySelectorAll:()=>buttons,addEventListener(){}};
const win={innerWidth:W,innerHeight:H,devicePixelRatio:2,addEventListener(n,f){(winListeners[n]??=[]).push(f)}};
const deterministicMath=Object.create(Math);deterministicMath.random=()=>.99;
const sb={document:doc,window:win,innerWidth:W,innerHeight:H,devicePixelRatio:2,localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=String(v)},Image:imageClass,Math:deterministicMath,performance:{now:()=>now},requestAnimationFrame:f=>(queue.push(f),queue.length),addEventListener:(n,f)=>{(winListeners[n]??=[]).push(f)},console};
vm.runInNewContext(source,sb);const game=sb.window.__vladiCrossy;assert(game,'game hook');
function frame(ms=16){const f=queue.shift();assert(f,'animation loop');now+=ms;f(now)}function advance(ms){for(let t=0;t<ms;t+=16)frame(Math.min(16,ms-t))}function key(code){for(const f of winListeners.keydown||[])f({code,preventDefault(){}})}
frame();els['#start'].click();assert.equal(game.state,'playing','start');
key('ArrowUp');assert.equal(game.metrics.row,1,'keyboard forward');advance(100);buttons.find(b=>b.dataset.move==='right').fire('pointerdown',{preventDefault(){}});assert.equal(game.metrics.x,3,'touch movement');
game.setPlayer(2,27);game.forceTraffic(27,2);advance(40);assert.equal(game.state,'over','vehicle collision');assert(saved.vladiCrossyBest,'best score saved');
els['#start'].click();assert.equal(game.state,'playing','restart');game.setPlayer(2,20);game.forceTraffic(20,5.5);advance(50);assert.equal(game.state,'playing','avoid vehicle');
els['#pause'].click();assert.equal(game.state,'paused','pause');els['#start'].click();assert.equal(game.state,'playing','resume');
W=844;H=390;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();assert.equal(game.getLayout().width,844);assert.equal(game.getLayout().height,390);
W=390;H=844;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();assert.equal(game.getLayout().width,390);assert(els['#game'].width>=390,'high DPI canvas');
console.log(JSON.stringify({result:'PASS',checks:['start/restart','arrow and touch movement','traffic collision','avoiding traffic','pause/resume','local record','portrait/landscape resize'],metrics:game.metrics,stored:saved}));

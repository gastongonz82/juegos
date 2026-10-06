const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/game.js','utf8');let W=390,H=844,now=0,queue=[],id=0;const winListeners={},docListeners={},els={};
const context=new Proxy({createLinearGradient(){return{addColorStop(){}}}},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(){const events={};return{events,classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){(events[n]??=[]).push(f)},setPointerCapture(){},click(){for(const f of events.click||[])f({preventDefault(){},pointerId:1})},fire(n,e={}){for(const f of events[n]||[])f(e)},getContext(){return context},style:{},textContent:'',innerHTML:'',width:0,height:0}}
for(const s of ['#game','#hud','#overlay','#title','#subtitle','#chips','#help','#start','#pause','#left','#right','#meters','#score','#best','.controls'])els[s]=element();
const saved={},imageClass=class{set src(v){this._src=v;this.complete=true;this.naturalWidth=620;this.naturalHeight=472}};
const doc={hidden:false,querySelector:s=>els[s],addEventListener(n,f){(docListeners[n]??=[]).push(f)}};
const win={innerWidth:W,innerHeight:H,devicePixelRatio:2,addEventListener(n,f){(winListeners[n]??=[]).push(f)}};
const deterministicMath=Object.create(Math);deterministicMath.random=()=>.99;
const sb={document:doc,window:win,innerWidth:W,innerHeight:H,devicePixelRatio:2,localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=String(v)},Image:imageClass,Math:deterministicMath,performance:{now:()=>now},requestAnimationFrame:f=>(queue.push(f),++id),addEventListener:(n,f)=>{(winListeners[n]??=[]).push(f)},console};
vm.runInNewContext(source,sb);const game=sb.window.__vladiDodge;assert(game,'dodge game hook');
function frame(ms=16){const f=queue.shift();assert(f,'animation loop');now+=ms;f(now)}function advance(ms){for(let t=0;t<ms;t+=16)frame(Math.min(16,ms-t))}function key(code){for(const f of winListeners.keydown||[])f({code,repeat:false,preventDefault(){}})}
frame();assert.equal(game.state,'menu');els['#start'].click();assert.equal(game.state,'running','start');
assert.equal(game.metrics.lane,1);els['#left'].click();assert.equal(game.metrics.lane,0,'touch left');key('ArrowRight');assert.equal(game.metrics.lane,1,'keyboard right');els['#right'].click();assert.equal(game.metrics.lane,2,'touch right');
advance(3100);assert(game.metrics.distance>0,'automatic movement');assert(game.metrics.avoided>0,'obstacles pass and count as avoided');
game.forceObstacle(2,.81,'star');advance(80);assert.equal(game.metrics.stars,1,'collect star');
els['#pause'].click();assert.equal(game.state,'paused','pause');els['#start'].click();assert.equal(game.state,'running','resume');
game.forceObstacle(game.metrics.lane,.94,'cone');advance(80);assert.equal(game.state,'over','collision ends run');assert(saved.vladiDodgeBest,'record persistence');
els['#start'].click();assert.equal(game.state,'running','restart');assert.equal(game.metrics.distance,0,'restart resets distance');
W=844;H=390;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();const landscape=game.getLayout();assert.equal(landscape.width,844);assert.equal(landscape.height,390);assert(landscape.roadWidth>landscape.carWidth,'road scales in landscape');
W=390;H=844;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();const portrait=game.getLayout();assert.equal(portrait.width,390);assert.equal(portrait.height,844);assert(els['#game'].width>=390,'DPR canvas resize');
console.log(JSON.stringify({result:'PASS',checks:['start/restart','keyboard steering','touch lane controls','automatic obstacle waves','avoid scoring','star collection','collision/game over','pause/resume','localStorage record','portrait and landscape resize'],metrics:game.metrics,stored:saved}));

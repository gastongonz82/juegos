const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/game.js','utf8');let W=390,H=844,now=1000,queue=[];const winListeners={},els={};
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient(){return gradient},createRadialGradient(){return gradient}},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(){const events={};return{events,classList:{add(){},remove(){},toggle(){}},addEventListener(n,f){(events[n]??=[]).push(f)},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:W,height:H}},fire(n,e={}){for(const f of events[n]||[])f(e)},click(){for(const f of events.click||[])f({preventDefault(){}})},getContext(){return context},style:{},textContent:'',innerHTML:'',width:0,height:0}}
for(const s of ['#game','#hud','#panel','#panelTitle','#panelText','#hint','#start','#pause','#score','#best','#lives','#menuBest'])els[s]=element();
const saved={},docListeners={};const doc={hidden:false,querySelector:s=>els[s],addEventListener(n,f){(docListeners[n]??=[]).push(f)}};
const win={innerWidth:W,innerHeight:H,devicePixelRatio:2,addEventListener(n,f){(winListeners[n]??=[]).push(f)}};const deterministicMath=Object.create(Math);deterministicMath.random=()=>.5;
const sb={document:doc,window:win,innerWidth:W,innerHeight:H,devicePixelRatio:2,localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=String(v)},Math:deterministicMath,performance:{now:()=>now},requestAnimationFrame:f=>(queue.push(f),queue.length),addEventListener:(n,f)=>{(winListeners[n]??=[]).push(f)},console};
vm.runInNewContext(source,sb);const game=sb.window.__vladiFruitNinja;assert(game,'game hook');
function frame(ms=16){const f=queue.shift();assert(f,'animation loop');now+=ms;f(now)}function advance(ms){for(let t=0;t<ms;t+=16)frame(Math.min(16,ms-t))}
frame();assert.equal(game.state,'menu','initial menu');els['#start'].click();assert.equal(game.state,'playing','start');assert.equal(game.metrics.lives,5,'five starting lives');
game.spawnTestObject(150,220,'fruit');game.pointerDown(90,220);game.pointerMove(210,220);game.pointerUp();assert.equal(game.metrics.score,10,'swipe slices fruit');assert(saved.vladiFruitNinjaBest,'record persists');
game.spawnTestObject(150,220,'bomb');game.pointerDown(90,220);game.pointerMove(210,220);game.pointerUp();assert.equal(game.metrics.lives,4,'bomb removes life');
game.pause();assert.equal(game.state,'paused','pause');game.pause();assert.equal(game.state,'playing','resume');
game.spawnTestObject(100,H+100,'fruit','wave-test');advance(80);assert.equal(game.metrics.lives,3,'missed fruit costs life');game.spawnTestObject(120,H+100,'fruit','wave-test');game.spawnTestObject(180,H+100,'fruit','wave-test');advance(80);assert.equal(game.metrics.lives,3,'one missed wave costs only one life');
W=844;H=390;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();assert.deepEqual(game.getLayout().width,844);assert.equal(game.getLayout().height,390);
W=390;H=844;win.innerWidth=W;win.innerHeight=H;sb.innerWidth=W;sb.innerHeight=H;for(const f of winListeners.resize||[])f();assert.equal(game.getLayout().width,390);assert.equal(els['#game'].width,780,'high DPI canvas');
game.start();for(let i=0;i<5;i++){game.spawnTestObject(150,220,'bomb');game.pointerDown(90,220);game.pointerMove(210,220);game.pointerUp()}assert.equal(game.state,'over','five bombs end round');assert.equal(game.metrics.objects,0,'game over clears moving objects');els['#start'].click();assert.equal(game.state,'playing','restart');
console.log(JSON.stringify({result:'PASS',checks:['start/restart','touch swipe slices fruit','score and local record','bomb and lives','missed fruit','pause/resume','portrait/landscape resize','game over'],metrics:game.metrics,stored:saved}));

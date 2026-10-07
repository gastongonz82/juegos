const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const Physics=require('../physics');
function setup(width=390,height=844){
 const handlers={},elements={},gradient={addColorStop(){}};
 const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 let now=0,nextFrame;
 function el(id){return elements[id]||(elements[id]={textContent:'',hidden:true,value:0,dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width,height,left:0,top:0}),focus(){},setPointerCapture(){},setAttribute(){},getAttribute(){return 'true'},append(){},addEventListener(name,fn){handlers[id+':'+name]=fn;}});}
 const win={BowlingPhysics:Physics,addEventListener(name,fn){handlers['window:'+name]=fn;}};
 const box={window:win,document:{querySelector:()=>el('game'),getElementById:el,createElement:()=>el(Math.random()),addEventListener(name,fn){handlers['document:'+name]=fn;}},localStorage:{getItem(){return 0},setItem(){}},matchMedia:()=>({matches:false}),requestAnimationFrame(fn){nextFrame=fn},setTimeout(){},performance:{now:()=>now}};
 vm.createContext(box);let source=fs.readFileSync(require.resolve('../game.js'),'utf8');source=source.replace('  window.VladiBowlingTest =','  window.audit={afterRoll,project,ballStart,frameMark,getBall:()=>ball};\n  window.VladiBowlingTest =');vm.runInContext(source,box);
 return {win,handlers,elements,advance(ms,fps=60){const end=now+ms;while(now<end){now+=1000/fps;nextFrame(now)}},send(key,event={}){handlers[key]({...event,preventDefault(){}});}};
}
test('full ten-frame games run at desktop, portrait and landscape sizes',()=>{
 for(const [w,h] of [[320,740],[390,844],[844,390],[1363,936]]) {
  const t=setup(w,h);t.win.VladiBowlingTest.startGame();
  for(let i=0;i<22&&t.win.VladiBowlingTest.getState().state!=='finished';i++){t.win.VladiBowlingTest.throwBall(.72,0,0);t.advance(7000)}
  const state=t.win.VladiBowlingTest.getState();assert.equal(state.state,'finished');assert.equal(state.frames.length,10);assert(state.score>0&&state.score<300);
 }
});
test('frame-rate independence: 30, 60 and 120 fps deliver identical results',()=>{
 let result;
 for(const fps of [30,60,120]){const t=setup();t.win.VladiBowlingTest.startGame();t.win.VladiBowlingTest.throwBall(.72,.06,0);t.advance(7000,fps);const current=JSON.stringify(t.win.VladiBowlingTest.getState());if(result)assert.equal(current,result);result=current;}
});
test('pausing a travelling ball freezes physics, and resize does not change world coordinates',()=>{
 const t=setup();t.win.VladiBowlingTest.startGame();t.win.VladiBowlingTest.throwBall();t.advance(900);t.send('pause:click');const position={...t.win.audit.getBall()};t.advance(4000);assert.deepEqual({...t.win.audit.getBall()},position);t.send('window:resize');assert.deepEqual({...t.win.audit.getBall()},position);t.send('main-action:click');t.advance(6000);assert.equal(t.win.VladiBowlingTest.getState().rolls.length,1);
});
test('short tap does not accidentally deliver, upward swipe launches, sliders set hook',()=>{
 const t=setup();t.win.VladiBowlingTest.startGame();const start=t.win.audit.ballStart();t.send('game:pointerdown',{pointerId:1,clientX:start.x,clientY:start.y});t.send('game:pointerup',{pointerId:1,clientX:start.x,clientY:start.y});assert.equal(t.win.VladiBowlingTest.getState().state,'aim');
 t.elements.spin.value=60;t.send('spin:input');t.send('game:pointerdown',{pointerId:2,clientX:start.x,clientY:start.y});t.send('game:pointermove',{pointerId:2,clientX:start.x+10,clientY:start.y-130});t.send('game:pointerup',{pointerId:2,clientX:start.x+10,clientY:start.y-130});assert.equal(t.win.VladiBowlingTest.getState().state,'roll');assert.equal(t.win.audit.getBall().spin,.6);t.advance(7000);assert.equal(t.win.VladiBowlingTest.getState().rolls.length,1);
});
test('ten strikes create two bonus balls, all-spare game one, open tenth none; HUD marks correct',()=>{
 for(const kind of ['strike','spare','open']){const t=setup();t.win.VladiBowlingTest.startGame();for(let f=0;f<9;f++){if(kind==='strike')t.win.audit.afterRoll(10);else{t.win.audit.afterRoll(kind==='spare'?5:3);t.win.audit.afterRoll(kind==='spare'?5:4);}t.advance(1000)}
  if(kind==='strike'){t.win.audit.afterRoll(10);assert.equal(t.win.VladiBowlingTest.getState().state,'aim');t.win.audit.afterRoll(10);assert.equal(t.win.VladiBowlingTest.getState().state,'aim');t.win.audit.afterRoll(10);assert.equal(t.win.audit.frameMark(9),'X X X');}
  else if(kind==='spare'){t.win.audit.afterRoll(5);t.win.audit.afterRoll(5);assert.equal(t.win.VladiBowlingTest.getState().state,'aim');t.win.audit.afterRoll(5);assert.equal(t.win.audit.frameMark(9),'5 / 5');}
  else{t.win.audit.afterRoll(3);t.win.audit.afterRoll(4);}
  t.advance(1000);assert.equal(t.win.VladiBowlingTest.getState().state,'finished');assert.equal(t.win.VladiBowlingTest.getState().score,kind==='strike'?300:kind==='spare'?150:70);
 }
});

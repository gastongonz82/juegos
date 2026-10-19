/* VLADYERIK ARCADE: puente de mando USB -> teclado del juego, sin modificar originales. */
(function(){
'use strict';
const frame=document.getElementById('frame'),player=document.getElementById('player');
if(!frame||!player)return;
let previous=new Set(),lastPadIndex=-1;
const keyMap={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',fire:' ',secondary:'z'};
function send(key,type){
try{
 const target=frame.contentWindow;
 if(!target||target.location.origin!==location.origin)return;
 target.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
}catch(_){}
}
function release(){for(const action of previous)send(keyMap[action],'keyup');previous.clear();}
function tick(){
 const active=player.classList.contains('open');
 const pads=navigator.getGamepads?.()||[];
 const pad=pads[0];
 const now=new Set();
 if(active&&pad){
  const b=i=>!!pad.buttons[i]?.pressed;
  const ax=pad.axes[0]||0,ay=pad.axes[1]||0;
  if(b(14)||ax<-.5)now.add('left');
  if(b(15)||ax>.5)now.add('right');
  if(b(12)||ay<-.5)now.add('up');
  if(b(13)||ay>.5)now.add('down');
  if(b(0)||b(2))now.add('fire');
  if(b(1)||b(3))now.add('secondary');
  // SELECT/BACK returns to menu, never delivered to the game.
  if(b(8)&&!lastPadIndex){document.getElementById('back')?.click();}
  lastPadIndex=b(8)?1:0;
 }
 for(const a of previous)if(!now.has(a))send(keyMap[a],'keyup');
 for(const a of now)if(!previous.has(a))send(keyMap[a],'keydown');
 previous=now;
 requestAnimationFrame(tick);
}
frame.addEventListener('load',release);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release()});
requestAnimationFrame(tick);
})();
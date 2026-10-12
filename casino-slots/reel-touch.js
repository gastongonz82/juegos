// One touch/pen gesture starts at most one spin. Mouse, long holds and lateral drags do not.
export function bindReelTouch(element,{canSpin,spin,now=()=>performance.now()}){
 let gesture=null;
 element.classList.add('touch-reels');
 const stop=()=>{gesture=null};
 const activate=()=>{
  if(!gesture||gesture.triggered||!canSpin())return;
  gesture.triggered=true;spin();
 };
 const swipe=e=>{
  if(!gesture||e.pointerId!==gesture.id)return false;
  const dx=Math.abs(e.clientX-gesture.x),dy=Math.abs(e.clientY-gesture.y);
  return dy>=32&&dy>=dx*1.5;
 };
 element.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
  if(e.isPrimary===false){stop();return;}
  if(!canSpin())return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:now(),triggered:false};
  if(e.cancelable)e.preventDefault();
  element.setPointerCapture?.(e.pointerId);
 },{passive:false});
 element.addEventListener('pointermove',e=>{
  if(swipe(e))activate();
 },{passive:true});
 element.addEventListener('pointerup',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;
  const dx=Math.abs(e.clientX-gesture.x),dy=Math.abs(e.clientY-gesture.y);
  if(swipe(e)||(dx<12&&dy<12&&now()-gesture.time<500))activate();
  stop();
 },{passive:true});
 element.addEventListener('pointercancel',stop,{passive:true});
 element.addEventListener('lostpointercapture',stop,{passive:true});
 element.addEventListener('contextmenu',e=>e.preventDefault());
}

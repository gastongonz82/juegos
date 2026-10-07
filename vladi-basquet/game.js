(() => {
'use strict';
const canvas=document.getElementById('court'),ctx=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id), app=$('app');
const scoreEl=$('score'),streakEl=$('streak'),bestEl=$('best'),lifeEl=$('lifeDisplay'),menuBest=$('menuBest'),overBest=$('overBest');
const overlays={menu:$('menu'),pause:$('pause'),gameover:$('gameover')};
const sprite=new Image();sprite.src='./assets/vladi-basquet.webp';
let W=innerWidth,H=innerHeight,DPR=1,scale=1,raf=0,last=0,mode='menu',muted=false,audioCtx=null;
let score=0,streak=0,best=Number(localStorage.getItem('vladiBasquetBest')||0),lives=5,round=1,elapsed=0,hoopX=0,hoopY=0,hoopVX=0,ball=null,aim=null,particles=[],toastTimer=0,keeperFlash=0;
bestEl.textContent=menuBest.textContent=overBest.textContent=best;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function resize(){const rect=app.getBoundingClientRect();W=rect.width;H=rect.height;DPR=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);scale=Math.min(W/900,H/560);if(!ball) setHoop(true);draw();}
function ground(){return H*.855}
function playerHeight(){return clamp(H*.27,158,260)}
function playerBox(){const h=playerHeight(),w=h*.596,x=W*.075,y=ground()-h;return{x,y,w,h}}
function ballStart(){const p=playerBox();return{x:p.x+p.w*.79,y:p.y+p.h*.34}}
function setHoop(initial=false){hoopX=W*.79;hoopY=H*(.423-Math.min(round-1,8)*.004);hoopVX=(initial?0:((round%2)?1:-1))*W*(.028+Math.min(round*.002, .012));}
function show(which){Object.values(overlays).forEach(o=>o.classList.remove('show'));if(which)overlays[which].classList.add('show')}
function initAudio(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC()}if(audioCtx?.state==='suspended')audioCtx.resume()}
function tone(freq,dur,wave='sine',vol=.08,slide=0){if(muted)return;initAudio();if(!audioCtx)return;const t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+dur)}
function sound(name){if(name==='shot'){tone(360,.15,'triangle',.12,-150)}if(name==='swish'){tone(650,.25,'sine',.14,-390);setTimeout(()=>tone(900,.18,'triangle',.08,220),60)}if(name==='rim'){tone(230,.16,'square',.08,-80);setTimeout(()=>tone(155,.12,'triangle',.05,-20),60)}if(name==='miss'){tone(190,.34,'sine',.1,-105)}if(name==='start'){tone(500,.12,'triangle',.1,210)}if(name==='pause'){tone(340,.1,'sine',.07,-80)}}
function popup(text){const t=$('toast');t.textContent=text;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),850)}
function updateHud(){scoreEl.textContent=score;streakEl.textContent=streak;bestEl.textContent=best;lifeEl.textContent='♥'.repeat(lives)+'♡'.repeat(5-lives)}
function startGame(){initAudio();score=0;streak=0;lives=5;round=1;elapsed=0;$('pauseBtn').textContent='Ⅱ';ball=null;aim=null;particles=[];setHoop(true);updateHud();mode='playing';show(null);$('aimHint').textContent='Arrastrá en arco; guiáte por los puntos del tiro';updateHud();sound('start');last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function pauseGame(){if(mode==='playing'){mode='paused';show('pause');sound('pause');$('pauseBtn').textContent='▶'}else if(mode==='paused'){mode='playing';show(null);$('pauseBtn').textContent='Ⅱ';last=performance.now();raf=requestAnimationFrame(loop)}}
function endGame(){mode='over';ball=null;aim=null;show('gameover');$('finalScore').textContent=score;$('finalStreak').textContent=streak;overBest.textContent=best;updateHud();sound('miss')}
function award(){score++;streak++;if(score>best){best=score;localStorage.setItem('vladiBasquetBest',String(best));bestEl.textContent=menuBest.textContent=overBest.textContent=best}sound('swish');popup(streak>=3?'¡EN RACHA!':'¡ENCESTA!');burst(hoopX,hoopY,18);if(score%3===0){round++;setHoop(false);popup('RONDA '+round)}updateHud()}
function miss(){lives--;streak=0;updateHud();sound('miss');popup(lives?'¡CERCA!':'¡FIN DEL PARTIDO!');if(lives<=0){setTimeout(endGame,350)}}
function fire(vx,vy){if(mode!=='playing'||ball)return;ball={...ballStart(),vx,vy,r:clamp(W*.018,8,17),t:0,checked:false};aim=null;sound('shot');$('powerMeter').classList.remove('active');$('aimHint').textContent='¡Seguí el tiro! Arrastrá en arco para volver a lanzar'}
function fireFromAim(end){const o=ballStart(),dx=end.x-o.x,dy=end.y-o.y;const angle=clamp(Math.atan2(dy,Math.max(1,dx)),-1.43,-.14);const dist=clamp(Math.hypot(dx,dy),48,Math.min(W*.55,H*.76));const strength=(dist-48)/(Math.min(W*.55,H*.76)-48);const speed=(480+strength*460)*Math.max(1,Math.min(1.65,Math.sqrt(W*H/(900*560))));fire(Math.cos(angle)*speed,Math.sin(angle)*speed)}
function defaultShot(){const o=ballStart();fireFromAim({x:o.x+W*.30,y:o.y-H*.34})}
function burst(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=70+Math.random()*260;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-100,t:0,life:.55+Math.random()*.55,c:['#ffd447','#ff813a','#5be0ff','#70ec74'][i%4],r:3+Math.random()*5})}}
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawBackground(){
 const sky=ctx.createLinearGradient(0,0,0,H*.65);sky.addColorStop(0,'#111a34');sky.addColorStop(.38,'#233b62');sky.addColorStop(1,'#e99649');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // arena roof and beams
 ctx.fillStyle='#10172b';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,H*.19);ctx.quadraticCurveTo(W*.5,H*.1,0,H*.2);ctx.closePath();ctx.fill();
 ctx.strokeStyle='rgba(255,221,149,.16)';ctx.lineWidth=2;for(let i=0;i<9;i++){const x=i*W/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(W*.5+(x-W*.5)*.78,H*.19);ctx.stroke()}
 // spotlights
 for(const f of [.15,.5,.85]){const x=W*f;const beam=ctx.createLinearGradient(x,0,x,H*.7);beam.addColorStop(0,'rgba(255,238,182,.13)');beam.addColorStop(1,'rgba(255,238,182,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x-24,0);ctx.lineTo(x+24,0);ctx.lineTo(x+W*.13,H*.69);ctx.lineTo(x-W*.13,H*.69);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe4a1';ctx.beginPath();ctx.ellipse(x,10,25,8,0,0,7);ctx.fill()}
 // crowd tiers
 for(let row=0;row<3;row++){const y=H*(.19+row*.055);ctx.fillStyle=['#253247','#394357','#27354a'][row];ctx.fillRect(0,y,W,H*.06);for(let x=8;x<W;x+=Math.max(16,W/70)){ctx.fillStyle=['#fb7651','#f3cb60','#5ad4df','#e5e7df','#be70cf'][(Math.floor(x/13)+row*7)%5];ctx.beginPath();ctx.arc(x,y+8+Math.sin(x*.06+row)*3,Math.max(2,W*.003),0,Math.PI*2);ctx.fill();ctx.fillStyle='#111b2a';ctx.fillRect(x-2,y+12,4,8)}}
 // sponsor boards
 const boardY=H*.355;const grad=ctx.createLinearGradient(0,boardY,0,boardY+H*.042);grad.addColorStop(0,'#e8b654');grad.addColorStop(1,'#713a27');ctx.fillStyle=grad;ctx.fillRect(0,boardY,W,H*.047);ctx.fillStyle='#241c26';ctx.font=`900 ${Math.max(10,W*.013)}px system-ui`;ctx.textAlign='center';ctx.fillText('VLADI • ALL STAR CHALLENGE',W*.5,boardY+H*.031);
 // court floor
 const top=H*.40,bot=H;const floor=ctx.createLinearGradient(0,top,0,H);floor.addColorStop(0,'#bd7140');floor.addColorStop(.3,'#d9904c');floor.addColorStop(1,'#8c4229');ctx.fillStyle=floor;ctx.fillRect(0,top,W,H-top);
 // floor boards perspective
 for(let i=0;i<13;i++){const y=top+(i/13)*(H-top);ctx.strokeStyle=i%2?'rgba(255,214,143,.16)':'rgba(77,31,22,.15)';ctx.lineWidth=1+ i*.15;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 for(let i=-4;i<=4;i++){ctx.strokeStyle='rgba(255,225,165,.14)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W*.5+i*W*.18,H*.4);ctx.lineTo(W*.5+i*W*.30,H);ctx.stroke()}
 // central floor shine
 const shine=ctx.createLinearGradient(0,H*.52,0,H);shine.addColorStop(0,'rgba(255,220,149,0)');shine.addColorStop(.5,'rgba(255,225,165,.08)');shine.addColorStop(1,'rgba(255,235,183,.01)');ctx.fillStyle=shine;ctx.fillRect(0,H*.4,W,H*.6);
 // court markings at far/mid-ground
 ctx.strokeStyle='rgba(255,229,174,.47)';ctx.lineWidth=Math.max(2,W*.0025);ctx.beginPath();ctx.ellipse(W*.49,H*.80,W*.39,H*.31,0,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(W*.5,H*.4);ctx.lineTo(W*.5,H);ctx.stroke();ctx.beginPath();ctx.arc(W*.5,H*.69,W*.11,0,Math.PI*2);ctx.stroke();
 const vign=ctx.createRadialGradient(W*.5,H*.47,H*.1,W*.5,H*.55,W*.8);vign.addColorStop(0,'rgba(255,255,255,0)');vign.addColorStop(1,'rgba(8,13,23,.25)');ctx.fillStyle=vign;ctx.fillRect(0,0,W,H);
}
function drawHoop(){const x=hoopX,y=hoopY,s=clamp(W/900,.56,1.55);const backX=x+W*.105,backY=y-H*.16,bw=clamp(W*.105,48,112),bh=clamp(H*.13,48,95);
 // pole, base and arm
 ctx.fillStyle='#313b53';rounded(backX+bw*.39,backY+bh*.8,bw*.23,ground()-(backY+bh*.8),7);ctx.fill();ctx.fillStyle='#19243a';rounded(backX+bw*.1,ground()-H*.018,bw*.8,H*.025,8);ctx.fill();
 ctx.fillStyle='#dcefff';rounded(backX,backY,bw,bh,8);ctx.fill();ctx.strokeStyle='#44546f';ctx.lineWidth=3;rounded(backX+3,backY+3,bw-6,bh-6,5);ctx.stroke();ctx.strokeStyle='#d46b37';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+H*.005,clamp(W*.025,13,28),clamp(H*.012,6,11),0,0,Math.PI*2);ctx.stroke();
 // net
 ctx.strokeStyle='rgba(255,255,255,.79)';ctx.lineWidth=1.5;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*W*.008,y+H*.01);ctx.lineTo(x+i*W*.014,y+H*.07);ctx.stroke()}for(let j=1;j<=3;j++){ctx.beginPath();ctx.moveTo(x-W*.025+j*W*.006,y+j*H*.016);ctx.lineTo(x+W*.025-j*W*.006,y+j*H*.016);ctx.stroke()}
 // rim glint
 ctx.strokeStyle='#ff9c4b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,clamp(W*.027,14,30),clamp(H*.013,6,12),0,Math.PI,Math.PI*2);ctx.stroke();
}
function drawPlayer(dt){const p=playerBox();const bob=(mode==='playing'&&!ball?Math.sin(elapsed*7)*2:0);ctx.save();ctx.globalAlpha=.26;ctx.fillStyle='#111625';ctx.beginPath();ctx.ellipse(p.x+p.w*.45,ground()+3,p.w*.53,8,0,0,Math.PI*2);ctx.fill();ctx.restore();if(sprite.complete&&sprite.naturalWidth){ctx.drawImage(sprite,p.x,p.y+bob,p.w,p.h)}else{ctx.fillStyle='#087ad2';ctx.fillRect(p.x,p.y,p.w,p.h)} }
function drawBasketball(x,y,r){const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,'#ffbf62');g.addColorStop(.52,'#f47a20');g.addColorStop(1,'#bd4118');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(x,y,r*.9,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#512a20';ctx.lineWidth=Math.max(1,r*.09);ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.moveTo(x-r*.72,y-r*.72);ctx.quadraticCurveTo(x+r*.1,y-r*.2,x+r*.72,y+r*.72);ctx.moveTo(x+r*.72,y-r*.72);ctx.quadraticCurveTo(x-r*.1,y+r*.2,x-r*.72,y+r*.72);ctx.stroke();ctx.restore();ctx.strokeStyle='#ffd286';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x-r*.31,y-r*.35,r*.2,Math.PI,Math.PI*1.55);ctx.stroke()}
function drawAim(){if(!aim){$('powerMeter').classList.remove('active');return}const o=ballStart(),pt=aim.point;ctx.save();ctx.setLineDash([7,7]);ctx.strokeStyle='rgba(255,245,205,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(pt.x,pt.y);ctx.stroke();ctx.setLineDash([]);const dx=pt.x-o.x,dy=pt.y-o.y,ang=clamp(Math.atan2(dy,Math.max(1,dx)),-1.43,-.14),dist=clamp(Math.hypot(dx,dy),48,Math.min(W*.55,H*.76)),strength=(dist-48)/(Math.min(W*.55,H*.76)-48),speed=(480+strength*460)*Math.max(1,Math.min(1.65,Math.sqrt(W*H/(900*560)))),vx=Math.cos(ang)*speed,vy=Math.sin(ang)*speed,g=H*1.8,tEnd=Math.min(1.35,(hoopX-o.x)/vx);for(let t=.08;t<tEnd;t+=.12){const xx=o.x+vx*t,yy=o.y+vy*t+.5*g*t*t;ctx.fillStyle=`rgba(255,236,165,${.8-t*.35})`;ctx.beginPath();ctx.arc(xx,yy,Math.max(2,5-t*2),0,Math.PI*2);ctx.fill()}drawBasketball(pt.x,pt.y,clamp(W*.018,8,17));$('powerMeter').classList.add('active');const pct=Math.round(strength*100);$('powerLabel').textContent='FUERZA '+pct+'%';$('powerFill').style.width=pct+'%';ctx.restore()}
function drawBall(){if(!ball)return;drawBasketball(ball.x,ball.y,ball.r)}
function drawParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];ctx.globalAlpha=clamp(1-p.t/p.life,0,1);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1-p.t/p.life*.3),0,7);ctx.fill()}ctx.globalAlpha=1}
function draw(){if(!ctx)return;drawBackground();drawHoop();drawPlayer(0);drawAim();drawBall();drawParticles(0);}
function tick(dt){elapsed+=dt;const range=W*.018;hoopX+=hoopVX*dt;if(hoopX>W*.83||hoopX<W*.73){hoopVX*=-1;hoopX=clamp(hoopX,W*.73,W*.83)}if(ball){ball.t+=dt;const g=H*1.8,prevX=ball.x,prevY=ball.y;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt+.5*g*dt*dt;ball.vy+=g*dt;
 if(!ball.checked && prevX<hoopX+range && ball.x>=hoopX-range){ball.checked=true;const tolerance=clamp(H*.05,22,46);if(ball.vy>0&&Math.abs(ball.y-hoopY)<tolerance&&Math.abs(ball.x-hoopX)<clamp(W*.038,22,46)){award();ball=null;return}else if(Math.abs(ball.y-hoopY)<H*.07){sound('rim');burst(hoopX,hoopY,5)}}
 if(ball&&(ball.t>2.7||ball.y>H+60||ball.x>W+50||ball.x<-50)){ball=null;miss()}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt;if(p.t>p.life)particles.splice(i,1)}}
function loop(now){if(mode!=='playing')return;const dt=Math.min(.034,(now-last)/1000||0);last=now;tick(dt);draw();if(mode==='playing')raf=requestAnimationFrame(loop)}
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing'||ball)return;const q=pointerPos(e),o=ballStart();const radius=Math.max(95,W*.15);if(Math.hypot(q.x-o.x,q.y-o.y)>radius)return;try{canvas.setPointerCapture(e.pointerId)}catch{}aim={id:e.pointerId,point:q};e.preventDefault();draw()},{passive:false});
canvas.addEventListener('pointermove',e=>{if(!aim||aim.id!==e.pointerId)return;aim.point=pointerPos(e);draw()},{passive:false});
canvas.addEventListener('pointerup',e=>{if(!aim||aim.id!==e.pointerId)return;const p=pointerPos(e);aim=null;if(Math.hypot(p.x-ballStart().x,p.y-ballStart().y)<45)defaultShot();else fireFromAim(p);if(mode==='playing'){last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}e.preventDefault()},{passive:false});
canvas.addEventListener('pointercancel',()=>{aim=null;draw()});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space'&&!e.repeat){if(mode==='menu'||mode==='over')startGame();else if(mode==='playing'&&!ball)defaultShot()}if(e.code==='Escape'||e.code==='KeyP'){if(mode==='playing'||mode==='paused')pauseGame()}});
$('playBtn').addEventListener('click',startGame);$('againBtn').addEventListener('click',startGame);$('resumeBtn').addEventListener('click',pauseGame);$('pauseBtn').addEventListener('click',()=>{if(mode==='playing'||mode==='paused')pauseGame()});$('restartPause').addEventListener('click',startGame);
$('soundBtn').addEventListener('click',()=>{muted=!muted;$('soundBtn').textContent=muted?'♫̸':'♫';$('soundBtn').setAttribute('aria-label',muted?'Activar sonido':'Silenciar sonido');if(!muted){initAudio();sound('start')}});
window.addEventListener('resize',resize,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(resize,120));
resize();
})();

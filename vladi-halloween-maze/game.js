(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d'),arena=$('arena');
const ui={level:$('level'),score:$('score'),best:$('best'),lives:$('lives'),menuBest:$('menuBest'),menu:$('menu'),pause:$('pauseOverlay'),levelOverlay:$('levelOverlay'),doneLevel:$('doneLevel'),over:$('over'),finalScore:$('finalScore'),finalLevel:$('finalLevel'),finalBest:$('finalBest'),toast:$('toast'),powerbar:$('powerbar'),powerfill:$('powerfill')};
const dirs={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
let level=1,score=0,best=+(localStorage.getItem('vladiHalloweenBest')||0),lives=3,state='menu',cols=21,rows=21,spawnX=1,spawnY=1,maze=[],items=[],player,ghosts=[],cell=20,ox=0,oy=0,ghostAcc=0,last=0,power=0,invuln=0,queued=null,dir='left',sound=true,audio=null,toastTimer=0,anim=0,swipeStart=null,lastAspect=0;
$('best').textContent=ui.menuBest.textContent=best;
const sprite=new Image();sprite.src='../vladi-run/assets/vladi-runner.webp';const faceSprite=new Image();faceSprite.src='./assets/vladi-head.png';
function resize(){const rect=arena.getBoundingClientRect();const aspect=rect.width/Math.max(1,rect.height);const changed=lastAspect>0&&Math.abs(aspect-lastAspect)>.08;lastAspect=aspect;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const header=document.querySelector('.top').getBoundingClientRect().height,footer=document.querySelector('.bottom').getBoundingClientRect().height;let availW=rect.width-12,availH=rect.height-12;cell=Math.max(7,Math.floor(Math.min(availW/cols,availH/rows)));ox=(rect.width-cols*cell)/2;oy=(rect.height-rows*cell)/2;if(changed&&state==='playing')generateMaze();}
new ResizeObserver(resize).observe(arena);window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();if(state==='playing'){generateMaze();pop('Laberinto adaptado a la pantalla');}},180));
function generateMaze(){const box=arena.getBoundingClientRect(),targetCell=Math.max(24,40-Math.floor((level-1)*.8));rows=Math.min(39,Math.max(17,Math.round(box.height/targetCell)));if(rows%2===0)rows+=rows<39?1:-1;cols=Math.min(61,Math.max(13,Math.round(box.width/Math.max(1,box.height)*rows)));if(cols%2===0)cols+=cols<61?1:-1;spawnX=Math.floor(cols/2);if(spawnX%2===0)spawnX--;spawnY=rows-4;maze=Array.from({length:rows},()=>Array(cols).fill(1));let stack=[[spawnX,spawnY]];maze[spawnY][spawnX]=0;while(stack.length){const [x,y]=stack[stack.length-1],opts=[];for(const [dx,dy]of [[0,-2],[2,0],[0,2],[-2,0]]){const nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<cols-1&&ny<rows-1&&maze[ny][nx])opts.push([nx,ny,dx,dy]);}if(!opts.length){stack.pop();continue;}const[nx,ny,dx,dy]=opts[Math.floor(Math.random()*opts.length)];maze[y+dy/2][x+dx/2]=0;maze[ny][nx]=0;stack.push([nx,ny]);}
 for(let i=0;i<Math.floor(cols*rows*.055);i++){const x=1+Math.floor(Math.random()*(cols-2)),y=1+Math.floor(Math.random()*(rows-2));if(maze[y][x]&&((maze[y-1][x]===0&&maze[y+1][x]===0)||(maze[y][x-1]===0&&maze[y][x+1]===0)))maze[y][x]=0;}
 player={x:spawnX,y:spawnY,fromX:spawnX,fromY:spawnY,t:1};let open=[];for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(!maze[y][x]&&!(x===spawnX&&y===spawnY))open.push({x,y});open.sort((a,b)=>dist(b)-dist(a));function dist(p){return Math.abs(p.x-spawnX)+Math.abs(p.y-spawnY)}
 ghosts=[];const ghostCount=Math.min(4,3+Math.floor((level-1)/2)),visibleOpen=open.filter(p=>p.x>cols*.17&&p.x<cols*.83);for(let i=0;i<ghostCount;i++){const p=visibleOpen.splice(Math.min(visibleOpen.length-1,Math.floor(visibleOpen.length*(.2+i*.2))),1)[0]||open[0];if(!p)continue;const oi=open.findIndex(q=>q.x===p.x&&q.y===p.y);if(oi>=0)open.splice(oi,1);ghosts.push({x:p.x,y:p.y,fromX:p.x,fromY:p.y,t:1,color:['#bd85d1','#8172b1','#bd8980','#9a83c8'][i],kind:i%4});}
 const farther=open.filter(p=>dist(p)>4);items=Array.from({length:rows},()=>Array(cols).fill(''));for(const p of open)items[p.y][p.x]='c';
 // Cuatro calabazas bien separadas, una en cada zona extrema del laberinto.
 const powers=Math.min(6,4+Math.floor((level-1)/4)),mx=Math.floor(cols/2),my=Math.floor(rows/2);
 const targets=[{x:1,y:1,side:'tl'},{x:cols-2,y:1,side:'tr'},{x:1,y:rows-2,side:'bl'},{x:cols-2,y:rows-2,side:'br'}];
 if(powers>4)targets.push({x:mx,y:1,side:'top'});if(powers>5)targets.push({x:mx,y:rows-2,side:'bottom'});
 const placed=[],spacing=Math.max(5,Math.min(cols,rows)*.38);
 for(const target of targets){let candidates=farther.filter(p=>{
  if(target.side==='tl')return p.x<mx&&p.y<my;if(target.side==='tr')return p.x>=mx&&p.y<my;
  if(target.side==='bl')return p.x<mx&&p.y>=my;if(target.side==='br')return p.x>=mx&&p.y>=my;
  if(target.side==='top')return p.y<my;return p.y>=my;
 });
 candidates.sort((a,b)=>(Math.abs(a.x-target.x)+Math.abs(a.y-target.y))-(Math.abs(b.x-target.x)+Math.abs(b.y-target.y)));
 let pick=candidates.find(p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=spacing))||candidates[0];
 if(pick){items[pick.y][pick.x]='p';placed.push(pick);farther.splice(farther.findIndex(p=>p.x===pick.x&&p.y===pick.y),1);}
 }
 resize();updateHud();}
function saveBest(){if(score>best){best=score;localStorage.setItem('vladiHalloweenBest',best);}}
function updateHud(){ui.level.textContent=level;ui.score.textContent=score;ui.best.textContent=best;ui.lives.textContent='♥'.repeat(lives)+'♡'.repeat(3-lives);ui.menuBest.textContent=best;ui.powerbar.classList.toggle('hiddenbar',power<=0);ui.powerfill.style.width=`${Math.min(100,power/9*100)}%`;}
function beep(freq=500,dur=.07,type='sine',vol=.04){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}}
function blip(kind){if(kind==='candy')beep(720,.045,'triangle');else if(kind==='pumpkin'){[440,660,880].forEach((f,i)=>setTimeout(()=>beep(f,.14,'sine',.055),i*75));}else if(kind==='eat')beep(220,.18,'square',.035);else if(kind==='hit'){beep(130,.26,'sawtooth',.06);}else if(kind==='win'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.16),i*95));}}
function pop(msg){ui.toast.textContent=msg;ui.toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('on'),1050)}
function setDir(d){if(state!=='playing')return;queued=d;const v=dirs[d],nx=player.x+v[0],ny=player.y+v[1];if(!maze[ny]?.[nx])movePlayer(d);}
function movePlayer(d){if(state!=='playing'||player.t<1)return;const [dx,dy]=dirs[d],nx=player.x+dx,ny=player.y+dy;if(maze[ny]?.[nx]!==0)return;dir=d;queued=null;player.fromX=player.x;player.fromY=player.y;player.x=nx;player.y=ny;player.t=0;collect();checkCollisions();}
function collect(){const item=items[player.y]?.[player.x];if(item==='c'){items[player.y][player.x]='';score+=10;saveBest();blip('candy');}else if(item==='p'){items[player.y][player.x]='';power=9;score+=50;saveBest();blip('pumpkin');pop('¡PODER DE CALABAZA!');}updateHud();}
function passable(x,y){return maze[y]?.[x]===0;}
function sendGhostHome(g){let x=cols-2,y=rows-2;while(!passable(x,y)){x=Math.max(1,x-1);if(x===1)y=Math.max(1,y-1);}g.x=x;g.y=y;g.fromX=x;g.fromY=y;g.t=1;}
function pathStep(g){let q=[[g.x,g.y]],seen=new Set([g.x+','+g.y]),prev=new Map(),target=player.x+','+player.y;while(q.length){const [x,y]=q.shift(),key=x+','+y;if(key===target)break;for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(passable(nx,ny)&&!seen.has(k)){seen.add(k);prev.set(k,key);q.push([nx,ny]);}}}if(!seen.has(target))return null;let k=target;while(prev.get(k)&&prev.get(k)!==g.x+','+g.y)k=prev.get(k);const [x,y]=k.split(',').map(Number);return{x,y};}
function moveGhosts(){for(const g of ghosts){let next;if(power>0){const dirs4=[[0,-1],[1,0],[0,1],[-1,0]],opts=dirs4.map(([dx,dy])=>({x:g.x+dx,y:g.y+dy})).filter(p=>passable(p.x,p.y));opts.sort((a,b)=>Math.abs(b.x-player.x)+Math.abs(b.y-player.y)-(Math.abs(a.x-player.x)+Math.abs(a.y-player.y)));next=opts[0];}else next=pathStep(g);if(!next)continue;g.fromX=g.x;g.fromY=g.y;g.x=next.x;g.y=next.y;g.t=0;checkCollisions();if(state!=='playing')return;}}
function checkCollisions(){for(const g of ghosts)if(Math.abs(g.x-player.x)+Math.abs(g.y-player.y)===0){if(power>0){sendGhostHome(g);score+=200;saveBest();blip('eat');pop('+200 · ¡MONSTRUO ATRAPADO!');updateHud();}else if(performance.now()>invuln){lives--;invuln=performance.now()+1700;blip('hit');pop('¡CUIDADO!');player.x=spawnX;player.y=spawnY;player.fromX=spawnX;player.fromY=spawnY;player.t=1;queued=null;sendGhostHome(g);updateHud();if(lives<=0)gameOver();}}}
function checkClear(){let left=0;for(const row of items)for(const v of row)if(v)left++;if(!left&&state==='playing'){score+=500;saveBest();ui.best.textContent=ui.menuBest.textContent=best;ui.doneLevel.textContent=level;ui.levelOverlay.classList.remove('hidden');state='level';blip('win');}}
function gameOver(){state='over';best=Math.max(best,score);localStorage.setItem('vladiHalloweenBest',best);ui.finalScore.textContent=score;ui.finalLevel.textContent=level;ui.finalBest.textContent=best;ui.over.classList.remove('hidden');updateHud();}
async function start(){level=1;score=0;lives=3;power=0;invuln=0;state='playing';for(const id of ['menu','pauseOverlay','levelOverlay','over'])$(id).classList.add('hidden');if(document.fullscreenEnabled&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen();}catch{}}generateMaze();last=performance.now();}
function nextLevel(){level++;power=0;state='playing';ui.levelOverlay.classList.add('hidden');generateMaze();pop('¡NIVEL '+level+'!');}
function pause(){if(state==='playing'){state='paused';ui.pause.classList.remove('hidden');}}
function resume(){if(state==='paused'){state='playing';ui.pause.classList.add('hidden');last=performance.now();}}
$('play').onclick=start;$('again').onclick=start;$('next').onclick=nextLevel;$('pause').onclick=()=>state==='paused'?resume():pause();$('resume').onclick=resume;$('restart').onclick=start;$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',sound?'Silenciar sonido':'Activar sonido');if(sound)beep(680,.08);};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{pop('Pantalla completa no disponible en este navegador')}};document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;$('fullscreen').textContent=active?'⛶':'⛶';$('fullscreen').setAttribute('aria-label',active?'Salir de pantalla completa':'Activar pantalla completa');setTimeout(resize,80)});
for(const btn of document.querySelectorAll('.pad button')){btn.addEventListener('pointerdown',e=>{e.preventDefault();setDir(btn.dataset.dir);});}
window.addEventListener('keydown',e=>{const map={ArrowUp:'up',w:'up',W:'up',ArrowRight:'right',d:'right',D:'right',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left'};if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();state==='playing'?pause():state==='paused'?resume():null;return;}if(map[e.key]){e.preventDefault();if(!e.repeat)setDir(map[e.key]);}});
canvas.addEventListener('pointerdown',e=>{swipeStart={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>18)setDir(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));swipeStart=null;});
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function project(gx,gy){const w=canvas.clientWidth,h=canvas.clientHeight,z=Math.max(0,Math.min(1,gy/(rows-1))),scale=.92+.48*z;return{x:w*.5+(gx-cols*.5)*(w/cols)*scale,y:h*(.08+.92*z),scale,z};}
function quad(a,b,c,d){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();}
function drawFloor(x,y){const a=project(x,y),b=project(x+1,y),c=project(x+1,y+1),d=project(x,y+1);const grad=ctx.createLinearGradient(a.x,a.y,d.x,d.y);grad.addColorStop(0,'#080710');grad.addColorStop(1,'#171223');quad(a,b,c,d);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='#6972d018';ctx.lineWidth=1;ctx.stroke();}
function drawWall(x,y){const a=project(x,y),b=project(x+1,y),c=project(x+1,y+1),d=project(x,y+1),size=projectedSize(y+1),depth=Math.max(3,size.h*.35),shift=Math.max(1,size.w*.08);ctx.save();ctx.shadowColor='#03030b';ctx.shadowBlur=Math.max(2,size.w*.14);ctx.shadowOffsetY=depth*.42;quad(a,b,c,d);ctx.fillStyle='#161735';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(c.x,c.y);ctx.lineTo(c.x+shift,c.y+depth);ctx.lineTo(d.x+shift,d.y+depth);ctx.closePath();const front=ctx.createLinearGradient(d.x,d.y,d.x,d.y+depth);front.addColorStop(0,'#30264c');front.addColorStop(1,'#171126');ctx.fillStyle=front;ctx.fill();ctx.strokeStyle='#584773';ctx.lineWidth=Math.max(1,size.w*.035);ctx.stroke();
 ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(c.x+shift,c.y+depth);ctx.lineTo(b.x+shift,b.y+depth*.55);ctx.closePath();ctx.fillStyle='#211836';ctx.fill();
 quad(a,b,c,d);const top=ctx.createLinearGradient(a.x,a.y,c.x,c.y);top.addColorStop(0,'#625184');top.addColorStop(.48,'#493967');top.addColorStop(1,'#33264e');ctx.fillStyle=top;ctx.fill();ctx.strokeStyle='#7963a0';ctx.lineWidth=Math.max(1,size.w*.045);ctx.stroke();ctx.strokeStyle='#fff2a44a';ctx.lineWidth=Math.max(1,size.w*.025);ctx.beginPath();ctx.moveTo(a.x+shift,a.y+1);ctx.lineTo(b.x-shift,b.y+1);ctx.stroke();ctx.restore();}
function projectedSize(y){const w=canvas.clientWidth,h=canvas.clientHeight,z=Math.max(0,Math.min(1,y/(rows-1))),scale=.92+.48*z;return{w:w/cols*scale,h:h/rows*(.8+1.05*z),scale};}
function projectedCenter(x,y){const a=project(x+.5,y),b=project(x+.5,y+1);return{x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function drawVladi(x,y,t){
 if(!faceSprite.complete||!faceSprite.naturalWidth)return;
 const pos=projectedCenter(x,y),dims=projectedSize(y),ratio=faceSprite.naturalWidth/faceSprite.naturalHeight;
 const moving=state==='playing'&&player.t<1,gait=moving?Math.sin(t*.018):0;
 // Cabeza completa recortada desde la referencia, sin círculo ni recorte geométrico.
 const w=Math.min(dims.w*1.42,dims.h*1.3*ratio),h=w/ratio;
 ctx.save();ctx.translate(pos.x,pos.y+gait*dims.h*.04);ctx.rotate(gait*.025);ctx.shadowColor='#c9a4ff';ctx.shadowBlur=Math.max(4,dims.w*.18);
 ctx.drawImage(faceSprite,-w/2,-h/2,w,h);ctx.restore();
}
function drawMonster(g,t){
 const pos=projectedCenter(g.x,g.y),dims=projectedSize(g.y),s=Math.max(30,Math.min(dims.w*1.04,dims.h*.9)),bob=Math.sin(t/210+g.x)*s*.025;
 ctx.save();ctx.translate(pos.x,pos.y+bob);
 const pumpkin=g.kind===3,powered=power>0,face=ctx.createLinearGradient(-s*.42,-s*.42,s*.4,s*.46);
 face.addColorStop(0,powered?'#e7fcff':pumpkin?'#ffd17a':'#fff8eb');face.addColorStop(.48,powered?'#63d5ff':pumpkin?'#f39b42':'#ded7e0');face.addColorStop(1,powered?'#5264ce':pumpkin?'#b9562f':'#82778f');
 ctx.fillStyle=face;ctx.beginPath();
 if(g.kind===0){ctx.moveTo(-s*.38,-s*.23);ctx.quadraticCurveTo(-s*.4,-s*.45,0,-s*.46);ctx.quadraticCurveTo(s*.4,-s*.45,s*.38,-s*.23);ctx.lineTo(s*.33,s*.18);ctx.quadraticCurveTo(0,s*.47,-s*.33,s*.18);ctx.closePath();}
 else if(g.kind===1){ctx.moveTo(-s*.27,-s*.39);ctx.quadraticCurveTo(0,-s*.55,s*.27,-s*.39);ctx.quadraticCurveTo(s*.43,-s*.04,s*.32,s*.27);ctx.quadraticCurveTo(s*.25,s*.46,s*.16,s*.58);ctx.quadraticCurveTo(0,s*.7,-s*.16,s*.58);ctx.quadraticCurveTo(-s*.25,s*.46,-s*.32,s*.27);ctx.quadraticCurveTo(-s*.43,-s*.04,-s*.27,-s*.39);ctx.closePath();}
 else {ctx.ellipse(0,0,s*(pumpkin?.39:.37),s*.46,0,0,Math.PI*2);}
 ctx.shadowColor=powered?'#42d9ff':'#a982d7';ctx.shadowBlur=powered?s*.24:s*.08;ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle=powered?'#9af3ff':pumpkin?'#8e472c':'#544660';ctx.lineWidth=Math.max(1.2,s*(powered?.06:.045));ctx.stroke();
 // Sombra y brillo siguen el volumen propio de la máscara, sin halo exterior.
 ctx.strokeStyle=pumpkin?'#ffe1a0':'#fff';ctx.globalAlpha=.52;ctx.lineWidth=Math.max(1,s*.025);ctx.beginPath();ctx.moveTo(-s*.24,-s*.32);ctx.quadraticCurveTo(0,-s*.43,s*.2,-s*.34);ctx.stroke();ctx.globalAlpha=1;
 ctx.fillStyle=powered?'#132854':'#241b2c';ctx.strokeStyle=powered?'#132854':'#241b2c';
 if(g.kind===0){
  ctx.beginPath();ctx.ellipse(-s*.16,-s*.08,s*.075,s*.12,-.12,0,Math.PI*2);ctx.ellipse(s*.16,-s*.08,s*.075,s*.12,.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#9c4550';for(const x of [-.26,.26])for(const y of [-.16,.02,.2]){ctx.beginPath();ctx.arc(s*x,s*y,s*.025,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#493744';ctx.lineWidth=Math.max(1.5,s*.045);ctx.beginPath();ctx.moveTo(-s*.13,s*.23);ctx.lineTo(-s*.07,s*.29);ctx.lineTo(-s*.01,s*.23);ctx.lineTo(s*.05,s*.29);ctx.lineTo(s*.12,s*.23);ctx.stroke();
 }else if(g.kind===1){
  ctx.beginPath();ctx.ellipse(-s*.15,-s*.1,s*.09,s*.17,-.18,0,Math.PI*2);ctx.ellipse(s*.15,-s*.1,s*.09,s*.17,.18,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(0,s*.2,s*.09,s*.15,0,0,Math.PI*2);ctx.fill();
 }else if(g.kind===2){
  ctx.beginPath();ctx.ellipse(-s*.15,-s*.1,s*.09,s*.095,0,0,Math.PI*2);ctx.ellipse(s*.15,-s*.1,s*.09,s*.095,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#493443';ctx.lineWidth=Math.max(1.5,s*.04);ctx.beginPath();ctx.moveTo(-s*.2,s*.19);ctx.quadraticCurveTo(0,s*.37,s*.2,s*.19);ctx.stroke();
  ctx.strokeStyle='#fff0db';ctx.lineWidth=Math.max(1,s*.024);for(const x of [-.13,0,.13]){ctx.beginPath();ctx.moveTo(s*x,s*.23);ctx.lineTo(s*x,s*.29);ctx.stroke();}
 }else{
  ctx.fillStyle='#34202a';ctx.beginPath();ctx.moveTo(-s*.24,-s*.06);ctx.lineTo(-s*.13,-s*.2);ctx.lineTo(-s*.03,-s*.05);ctx.closePath();ctx.moveTo(s*.03,-s*.05);ctx.lineTo(s*.13,-s*.2);ctx.lineTo(s*.24,-s*.06);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5d271e';ctx.lineWidth=Math.max(1.5,s*.05);ctx.beginPath();ctx.arc(0,s*.08,s*.19,.18,Math.PI-.18);ctx.stroke();
  ctx.fillStyle='#85a85c';ctx.beginPath();ctx.ellipse(0,-s*.43,s*.07,s*.12,-.3,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function render(t){
 const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);if(!maze.length){requestAnimationFrame(render);return;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(maze[y][x])drawWall(x,y);else{drawFloor(x,y);const item=items[y]?.[x],p=projectedCenter(x,y),dims=projectedSize(y),r=Math.max(2,Math.min(dims.w,dims.h)*.13);if(item==='c'){ctx.save();ctx.shadowColor='#ffe66e';ctx.shadowBlur=r*2.5;const orb=ctx.createRadialGradient(p.x-r*.3,p.y-r*.35,1,p.x,p.y,r*1.4);orb.addColorStop(0,'#fffbc2');orb.addColorStop(.4,'#ffe84c');orb.addColorStop(1,'#db862c');ctx.fillStyle=orb;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.78,0,0,Math.PI*2);ctx.fill();ctx.restore();}else if(item==='p'){const q=r*2.8;ctx.save();ctx.shadowColor='#ff812a';ctx.shadowBlur=q*.8;const pumpkin=ctx.createRadialGradient(p.x-q*.25,p.y-q*.25,1,p.x,p.y,q);pumpkin.addColorStop(0,'#fff0a0');pumpkin.addColorStop(.42,'#ffaf38');pumpkin.addColorStop(1,'#e34c19');ctx.fillStyle=pumpkin;ctx.beginPath();ctx.ellipse(p.x,p.y,q*.75,q*.65,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b94a20';ctx.lineWidth=Math.max(1,q*.1);for(const k of [-.35,0,.35]){ctx.beginPath();ctx.ellipse(p.x+q*k,p.y,q*.24,q*.55,0,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#71a448';ctx.beginPath();ctx.ellipse(p.x,p.y-q*.62,q*.13,q*.22,-.28,0,Math.PI*2);ctx.fill();ctx.restore();}}}
 const dt=Math.min(Math.max(0,(t-last)/1000),.05),ghostStep=Math.max(.36,.86-(level-1)*.025);if(state==='playing'){
  last=t;const step=Math.max(.095,.145-(level-1)*.0012);let progress=player.t+dt/step,hops=0;
  // Carry the fractional remainder through each cell instead of dropping it at tile boundaries.
  while(progress>=1&&hops++<4){let next=queued||dir,v=dirs[next];if(!v||!passable(player.x+v[0],player.y+v[1])){next=dir;v=dirs[next];}
   if(!v||!passable(player.x+v[0],player.y+v[1])){progress=1;break;}
   player.t=1;movePlayer(next);progress-=1;if(state!=='playing')break;
  }
  player.t=Math.min(1,Math.max(0,progress));ghostAcc+=dt;while(ghostAcc>=ghostStep){ghostAcc-=ghostStep;moveGhosts();if(state!=='playing')break;}
  for(const g of ghosts)if(g.t<1)g.t=Math.min(1,g.t+dt/ghostStep);if(power>0)power=Math.max(0,power-dt);checkCollisions();checkClear();updateHud();
 }else last=t;
 const moveT=player.t,px=player.fromX+(player.x-player.fromX)*moveT,py=player.fromY+(player.y-player.fromY)*moveT;
 for(const g of ghosts){const gx=g.fromX+(g.x-g.fromX)*Math.min(1,g.t),gy=g.fromY+(g.y-g.fromY)*Math.min(1,g.t);drawMonster({...g,x:gx,y:gy},t);}if(state!=='menu')drawVladi(px,py,t);requestAnimationFrame(render);
}
requestAnimationFrame(render);

})();

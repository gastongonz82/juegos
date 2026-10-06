(()=>{'use strict';
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d');
const ui={score:document.querySelector('#score'),round:document.querySelector('#round'),combo:document.querySelector('#combo'),belt:document.querySelector('#beltBadge'),lives:document.querySelector('#lives'),cue:document.querySelector('#cue'),cueTitle:document.querySelector('#cueTitle'),cueGlyph:document.querySelector('#cueGlyph'),cueBar:document.querySelector('#cueBar'),feedback:document.querySelector('#feedback'),panel:document.querySelector('#panel'),eyebrow:document.querySelector('#panelEyebrow'),title:document.querySelector('#panelTitle'),text:document.querySelector('#panelText'),button:document.querySelector('#start'),foot:document.querySelector('#panelFoot'),result:document.querySelector('#resultLine'),mini:document.querySelector('#miniStats'),pause:document.querySelector('#pause'),controls:document.querySelector('#controls'),hint:document.querySelector('#hint'),best:document.querySelector('#best'),hero:document.querySelector('#heroArt')};
const STORAGE='vladiDojangBest';let W=innerWidth,H=innerHeight,D=1,phase='menu',t=0,last=0,score=0,best=0,round=1,combo=0,lives=3,exchange=0,cue=null,transition=0,lastCue='',feedbackTime=0,feedbackText='',hurt=.0,movePose='',poseTime=0,shake=0,flash=0,particles=[],dust=[],stars=[],frame=0;
const fighter=new Image();fighter.src='./assets/vladi-fighter.webp';fighter.addEventListener('load',()=>draw());
try{best=+(localStorage.getItem(STORAGE)||0)}catch(_){}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),choose=a=>a[Math.floor(Math.random()*a.length)];
function fit(){W=innerWidth;H=innerHeight;D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);dust=Array.from({length:Math.round(W*H/12500)},()=>({x:Math.random()*W,y:Math.random()*H,r:rand(.5,2),speed:rand(3,15),alpha:rand(.12,.46),phase:rand(0,7)}));draw()}
addEventListener('resize',fit,{passive:true});fit();
function snd(name){window.VladiSound?.play(name)}
function rank(){if(round>=10)return'NEGRO · 1 DAN';if(round>=7)return'ROJO';if(round>=4)return'AZUL';return'VERDE · P. ROJA'}
function syncHUD(){ui.score.textContent=score.toLocaleString('es-AR');ui.round.textContent=round;ui.combo.textContent=combo+'×';ui.belt.innerHTML='CINTURÓN <b>'+rank()+'</b>';ui.lives.textContent='♥ '.repeat(lives).trim()||'—';ui.best.textContent=best.toLocaleString('es-AR')}
function syncUI(){const active=phase==='playing';ui.panel.hidden=active;ui.controls.style.display=active?'flex':'none';ui.hint.style.display=active?'block':'none';ui.pause.style.display=active||phase==='paused'?'grid':'none';ui.lives.style.display=active?'block':'none';ui.belt.style.display=active?'block':'none';ui.cue.classList.toggle('show',active&&!!cue);if(!active)ui.feedback.classList.remove('show')}
function showPanel(mode){ui.panel.hidden=false;ui.result.hidden=true;ui.hero.style.display='block';ui.mini.style.display='flex';
 if(mode==='menu'){ui.eyebrow.textContent='ARCADE DE ARTES MARCIALES';ui.title.innerHTML='VLADI<br>TAEKWONDO';ui.text.textContent='Mirá qué movimiento anuncia el compañero y elegí la respuesta correcta antes de que se acabe el tiempo.';ui.button.textContent='▶  EMPEZAR ENTRENAMIENTO';ui.foot.innerHTML='Récord: <b id="best">'+best.toLocaleString('es-AR')+'</b> · 3 oportunidades';ui.best=document.querySelector('#best');ui.mini.innerHTML='<span>🥋 Cinturón verde · punta roja</span><span>📱 Táctil y teclado</span>'}
 if(mode==='paused'){ui.eyebrow.textContent='DESCANSO EN EL DOJANG';ui.title.textContent='PAUSA';ui.text.textContent='Tomate un respiro. El entrenamiento queda justo donde lo dejaste.';ui.button.textContent='▶  SEGUIR ENTRENANDO';ui.foot.textContent='Ronda '+round+' · Puntaje '+score.toLocaleString('es-AR');ui.mini.style.display='none'}
 if(mode==='over'){ui.eyebrow.textContent='ENTRENAMIENTO COMPLETADO';ui.title.textContent='FIN DE LA RONDA';ui.text.textContent='¡Buen esfuerzo, Vladi! Cada intento te hace más fuerte.';ui.button.textContent='↻  VOLVER A ENTRENAR';ui.foot.textContent='Récord: '+best.toLocaleString('es-AR');ui.mini.innerHTML='<span>Ronda '+round+'</span><span>Racha máxima '+maxCombo+'×</span>';ui.result.textContent='Puntaje '+score.toLocaleString('es-AR')+' puntos';ui.result.hidden=false}
}
let maxCombo=0;
function reset(){score=0;round=1;combo=0;maxCombo=0;lives=3;exchange=0;cue=null;transition=.65;lastCue='';hurt=0;movePose='';poseTime=0;shake=0;flash=0;particles=[];phase='playing';syncHUD();syncUI();snd('start')}
function endGame(){phase='over';cue=null;syncHUD();syncUI();showPanel('over');ui.pause.textContent='Ⅱ';snd('gameover')}
function startCue(){if(phase!=='playing')return;const actions=['block','dodge','kick'];let action=choose(actions);if(action===lastCue)action=actions[(actions.indexOf(action)+1+Math.floor(Math.random()*2))%3];lastCue=action;const data={block:['GOLPE ARRIBA','⬡'],dodge:['BARRIDO BAJO','↗'],kick:['ABERTURA','➤']};cue={action,label:data[action][0],glyph:data[action][1],total:Math.max(1400,2800-(round-1)*140),left:Math.max(1400,2800-(round-1)*140)};ui.cueTitle.textContent=cue.label;ui.cueGlyph.textContent=cue.glyph;ui.cue.classList.add('show');}
function pop(x,y,color,n=14,force=150){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),v=rand(force*.24,force);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.32,.86),age:0,size:rand(2,5),color})}}
function say(text){feedbackText=text;feedbackTime=.65;ui.feedback.textContent=text;ui.feedback.classList.add('show')}
function miss(){if(phase!=='playing')return;cue=null;lives=Math.max(0,lives-1);combo=0;hurt=.8;shake=.28;flash=.15;transition=.72;say('¡CASI!');snd('hit');pop(W*.69,H*.69,'#ff765f',10,110);syncHUD();syncUI();if(lives<=0)endGame()}
function act(action){if(phase!=='playing'||!cue)return;if(action!==cue.action){miss();return}
 const c=cue;cue=null;exchange++;combo++;maxCombo=Math.max(maxCombo,combo);const add=100+Math.min(combo-1,12)*20;score+=add;
 if(score>best){best=score;try{localStorage.setItem(STORAGE,String(best))}catch(_){}}
 movePose=action;poseTime=.55;flash=.11;transition=.52;shake=.06;say(choose(['¡PERFECTO!','¡MUY BIEN!','¡BUENA!','¡CONTRAGOLPE!']));snd(action==='kick'?'slice':action==='dodge'?'jump':'collect');pop(W*.54,H*.63,action==='block'?'#9ee7cc':action==='dodge'?'#8fcfff':'#ffdb79',12,140);syncHUD();syncUI();
 if(exchange>=5){round++;exchange=0;score+=150+round*25;if(round%4===0&&lives<3)lives++;if(score>best){best=score;try{localStorage.setItem(STORAGE,String(best))}catch(_){}}combo=Math.max(combo,0);transition=1.0;say('¡RONDA '+(round-1)+' COMPLETA!');snd('collect');syncHUD();syncUI()}
}
function pause(){if(phase==='playing'){phase='paused';snd('pause');showPanel('paused');syncUI();ui.pause.textContent='▶';ui.pause.setAttribute('aria-label','Continuar')}else if(phase==='paused'){phase='playing';snd('resume');syncUI();ui.pause.textContent='Ⅱ';ui.pause.setAttribute('aria-label','Pausar')}}
ui.button.addEventListener('click',()=>{if(phase==='paused'){phase='playing';syncUI();ui.pause.textContent='Ⅱ';ui.pause.setAttribute('aria-label','Pausar');snd('resume')}else reset()});
ui.pause.addEventListener('click',pause);
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(b.setPointerCapture)b.setPointerCapture(e.pointerId);act(b.dataset.action)}));
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['a','s','d','j','k','l',' ','arrowup','arrowleft','arrowright','escape','enter'].includes(k))e.preventDefault();if(k==='escape'||k==='p'){pause();return}if((phase==='menu'||phase==='paused'||phase==='over')&&(k==='enter'||k===' ')){ui.button.click();return}if(k==='a'||k==='j'||k==='arrowleft')act('block');if(k==='s'||k==='k'||k==='arrowup'||k===' ')act('dodge');if(k==='d'||k==='l'||k==='enter'||k==='arrowright')act('kick')});
addEventListener('contextmenu',e=>e.preventDefault());
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function drawLamp(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowColor='#ffd785';ctx.shadowBlur=25;ctx.fillStyle='#ffc65f';ctx.beginPath();ctx.ellipse(0,0,9,17,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff0bd';ctx.globalAlpha=.5;ctx.beginPath();ctx.ellipse(-2,-2,3,9,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#d7ad62';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,-29);ctx.stroke();ctx.restore()}
function background(dt){const sky=ctx.createLinearGradient(0,0,0,H*.7);sky.addColorStop(0,'#101a30');sky.addColorStop(.45,'#263b53');sky.addColorStop(1,'#7d654a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // warm circular crest behind the training floor
 const cx=W*.5,cy=H*.39,rad=Math.min(W*.19,H*.21),sun=ctx.createRadialGradient(cx,cy,rad*.08,cx,cy,rad);sun.addColorStop(0,'#e3ad5440');sun.addColorStop(.75,'#c7893820');sun.addColorStop(1,'#c7893800');ctx.fillStyle=sun;ctx.fillRect(cx-rad,cy-rad,rad*2,rad*2);
 // Shoji wall and dark wood framing
 const wallBottom=H*.62,panelW=Math.max(62,W*.115),panelH=wallBottom*.72;ctx.fillStyle='#101a2a';ctx.fillRect(0,0,W,wallBottom);
 for(let x=-panelW;x<W+panelW;x+=panelW){const y=H*.105,w=panelW*.82,h=panelH;const wg=ctx.createLinearGradient(0,y,0,y+h);wg.addColorStop(0,'#27384a');wg.addColorStop(.78,'#344954');wg.addColorStop(1,'#172b38');ctx.fillStyle=wg;rr(ctx,x+panelW*.09,y,w,h,4);ctx.fill();ctx.strokeStyle='#9a7546';ctx.lineWidth=Math.max(2,W*.002);ctx.stroke();ctx.strokeStyle='#d2ad6e33';ctx.lineWidth=1;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(x+panelW*.09+w*k/4,y+7);ctx.lineTo(x+panelW*.09+w*k/4,y+h-6);ctx.stroke()}ctx.beginPath();ctx.moveTo(x+panelW*.09+4,y+h*.52);ctx.lineTo(x+panelW*.09+w-4,y+h*.52);ctx.stroke()}
 // cross-beams
 ctx.fillStyle='#0b1424';ctx.fillRect(0,0,W,H*.09);ctx.fillStyle='#9b7040';ctx.fillRect(0,H*.084,W,Math.max(4,H*.009));ctx.fillStyle='#0e1828';ctx.fillRect(0,H*.59,W,H*.045);ctx.fillStyle='#c29451';ctx.fillRect(0,H*.59,W,Math.max(3,H*.007));
 for(let i=0;i<Math.max(3,Math.floor(W/250));i++){const x=(i+.5)*W/Math.max(3,Math.floor(W/250));drawLamp(x,H*.16,clamp(W/1200,.65,1.05))}
 // dojo crest
 ctx.save();ctx.translate(W*.5,H*.35);ctx.strokeStyle='#e3c27a40';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,Math.min(W*.08,H*.1),0,Math.PI*2);ctx.stroke();ctx.font='900 '+Math.min(48,W*.065)+'px serif';ctx.textAlign='center';ctx.fillStyle='#e6ca8540';ctx.fillText('龍',0,Math.min(16,W*.02));ctx.restore();
 // mat, wood apron and perspective lines
 const floorY=H*.625;const mg=ctx.createLinearGradient(0,floorY,0,H);mg.addColorStop(0,'#52715f');mg.addColorStop(.12,'#294c45');mg.addColorStop(1,'#132b2b');ctx.fillStyle=mg;ctx.beginPath();ctx.moveTo(0,floorY);ctx.lineTo(W,floorY);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
 const mat=ctx.createLinearGradient(0,floorY,0,H);mat.addColorStop(0,'#468270');mat.addColorStop(.58,'#286655');mat.addColorStop(1,'#1b493f');ctx.fillStyle=mat;ctx.beginPath();ctx.moveTo(W*.1,floorY+H*.025);ctx.lineTo(W*.9,floorY+H*.025);ctx.lineTo(W*1.12,H);ctx.lineTo(-W*.12,H);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#e9cb8055';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.1,floorY+H*.025);ctx.lineTo(W*.9,floorY+H*.025);ctx.lineTo(W*1.12,H);ctx.moveTo(W*.9,floorY+H*.025);ctx.lineTo(-W*.12,H);ctx.stroke();
 for(let k=1;k<8;k++){const q=k/8,y=floorY+H*.035+Math.pow(q,1.7)*(H-floorY);ctx.strokeStyle=k%2?'#cba95f24':'#061e1b22';ctx.lineWidth=k===1?3:1;ctx.beginPath();ctx.moveTo(-W*.08,y);ctx.lineTo(W*1.08,y);ctx.stroke()}
 for(let k=-4;k<=4;k++){ctx.strokeStyle='#daf1cf13';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W*.5+k*W*.065,floorY+H*.03);ctx.lineTo(W*.5+k*W*.25,H);ctx.stroke()}
 // mat edge and floor lights
 ctx.fillStyle='#b89255';ctx.fillRect(0,floorY,W,H*.018);ctx.fillStyle='#e0bd74';ctx.fillRect(0,floorY,W,H*.006);
 // dust motes
 for(const p of dust){p.y-=p.speed*dt;if(p.y<0){p.y=H+4;p.x=Math.random()*W}ctx.globalAlpha=p.alpha*(.65+.35*Math.sin(t*.8+p.phase));ctx.fillStyle='#ffe7b1';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
}
function drawDummy(x,y,scale,agitated){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const wob=Math.sin(t*3)*.025+(agitated?Math.sin(t*22)*.08:0);ctx.rotate(wob);
 // shadow and weighted base
 ctx.fillStyle='#081a18aa';ctx.beginPath();ctx.ellipse(0,2,74,16,0,0,Math.PI*2);ctx.fill();const wood=ctx.createLinearGradient(-40,0,40,0);wood.addColorStop(0,'#805235');wood.addColorStop(.45,'#d2a169');wood.addColorStop(1,'#6b422b');ctx.fillStyle=wood;rr(ctx,-35,-4,70,13,5);ctx.fill();ctx.fillStyle='#d9b27b';ctx.fillRect(-30,-3,60,3);
 ctx.fillStyle=wood;rr(ctx,-7,-96,14,95,6);ctx.fill();ctx.fillStyle='#f0cb8a';ctx.fillRect(-4,-92,3,81);
 // padded arms, torso, target rings
 const pad=ctx.createLinearGradient(-54,-78,54,-42);pad.addColorStop(0,'#1a2739');pad.addColorStop(.5,'#42566a');pad.addColorStop(1,'#1a2739');ctx.fillStyle=pad;rr(ctx,-62,-82,124,27,13);ctx.fill();ctx.strokeStyle='#c79c58';ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle=pad;rr(ctx,-41,-105,82,74,18);ctx.fill();ctx.strokeStyle='#dcbd7b';ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle='#b33b3b';ctx.beginPath();ctx.arc(0,-69,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffe1a2';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-69,13,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f1d591';ctx.beginPath();ctx.arc(0,-69,5,0,Math.PI*2);ctx.fill();
 // padded head cap
 ctx.fillStyle='#25344a';ctx.beginPath();ctx.arc(0,-113,21,Math.PI,Math.PI*2);ctx.lineTo(20,-103);ctx.quadraticCurveTo(0,-92,-20,-103);ctx.closePath();ctx.fill();ctx.fillStyle='#e7ca88';ctx.beginPath();ctx.arc(0,-108,3,0,Math.PI*2);ctx.fill();
 ctx.restore()}
function drawFighter(){if(!fighter.complete||!fighter.naturalWidth)return;let ch=clamp(Math.min(H*.48,W*(W/H>1.1?.31:.56)),154,460);if(W/H<.58)ch=Math.min(ch,H*.34);const cw=ch*fighter.naturalWidth/fighter.naturalHeight;let x=W*.29-cw*.5,y=H*.715-ch;
 if(movePose==='dodge'&&poseTime>0)y-=Math.sin((.55-poseTime)/.55*Math.PI)*Math.min(55,H*.055);
 if(movePose==='kick'&&poseTime>0)x+=Math.sin((.55-poseTime)/.55*Math.PI)*Math.min(28,W*.03);
 ctx.save();ctx.globalAlpha=hurt>0&&Math.floor(t*18)%2===0?.58:1;
 if(movePose==='kick'&&poseTime>0){ctx.shadowColor='#ffd46a';ctx.shadowBlur=24}
 ctx.drawImage(fighter,x,y,cw,ch);ctx.restore();
 if(movePose==='block'&&poseTime>0){const p=(.55-poseTime)/.55;ctx.strokeStyle='#91e4c4'+Math.floor((1-p)*210).toString(16).padStart(2,'0');ctx.lineWidth=5;ctx.beginPath();ctx.arc(x+cw*.78,y+ch*.48,Math.min(52,ch*.19),-1.2,1.2);ctx.stroke()}
}
function drawCueWorld(){if(!cue||phase!=='playing')return;const x=W*.69,y=H*.36;const pulse=.5+.5*Math.sin(t*8);ctx.save();ctx.globalAlpha=.45+pulse*.25;ctx.fillStyle=cue.action==='block'?'#f07d63':cue.action==='dodge'?'#79c8ed':'#f5cf75';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=26;ctx.beginPath();ctx.arc(x,y,24+pulse*3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#102037';ctx.font='900 19px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cue.glyph,x,y+1);ctx.restore()}
function drawEffects(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=240*dt;const a=1-p.age/p.life;ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,p.size*a+.4,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.shadowBlur=0}
function draw(){ctx.clearRect(0,0,W,H);if(shake>0){ctx.save();ctx.translate(rand(-shake*20,shake*20),rand(-shake*14,shake*14))}
 background(0);drawDummy(W*.71,H*.72,clamp(Math.min(W*.17,H*.19),.62,1.45),!!cue);drawFighter();drawCueWorld();drawEffects(0);
 if(shake>0){ctx.restore();shake=0}
 if(phase==='playing'&&cue){ui.cueBar.style.transform='scaleX('+clamp(cue.left/cue.total,0,1)+')';}
}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.04,(now-last)/1000||0);last=now;t+=dt;
 if(phase==='playing'){if(cue){cue.left-=dt*1000;if(cue.left<=0)miss()}else{transition-=dt;if(transition<=0)startCue()}if(hurt>0)hurt=Math.max(0,hurt-dt);if(poseTime>0)poseTime=Math.max(0,poseTime-dt);if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0)ui.feedback.classList.remove('show')}shake=Math.max(0,shake-dt)}
 for(const p of particles){p.age+=dt}
 particles=particles.filter(p=>p.age<p.life);
 backgroundUpdateDust(dt);draw();
}
function backgroundUpdateDust(dt){for(const p of dust){p.y-=p.speed*dt;if(p.y<0){p.y=H+3;p.x=Math.random()*W}}}
document.querySelectorAll('[data-action]').forEach(btn=>{btn.addEventListener('click',e=>e.preventDefault())});
showPanel('menu');syncHUD();syncUI();requestAnimationFrame(tick);
})();

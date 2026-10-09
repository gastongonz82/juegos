(() => {
  'use strict';
  const Physics = window.BowlingPhysics;
  const canvas = document.querySelector('#game');
  let ctx = canvas.getContext('2d', { alpha: false });
  let scenery = null;
  const $ = id => document.getElementById(id);
  const frameLabel = $('frame-label'), scoreLabel = $('score-label'), bestLabel = $('best-label');
  const frameStrip = $('frame-strip'), hint = $('hint'), overlay = $('overlay');
  const action = $('main-action'), title = $('overlay-title'), copy = $('overlay-copy'), badge = $('overlay-badge');
  const BEST_KEY = 'vladiBowlingBestV1';
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}
  let w = 0, h = 0, dpr = 1, layout = {}, state = 'title', aim = 0, spin = 0, position = 0, power = .72;
  let frame = 0, rolls = [], frames = Array.from({ length: 10 }, () => []), pins = [], ball = null;
  let drag = null, lastTime = 0, clock = 0, flash = 0, crowdPulse = 0, lastResult = '';
  let totalScore = 0, lastPinfall = 0, simulation = null, accumulator = 0, hitSoundAt = -1, hitSounds = 0, resumeState = 'aim';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height); dpr = Math.min(1.65, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const laneW = Math.min(w * .94, h * 2.2);
    const topY = Math.max(93, h * .19), bottomY = h - (w > h && h < 520 ? 32 : 110);
    layout = { cx: w / 2, laneW, topW: laneW * .16, bottomW: laneW * .80, topY, bottomY, laneH: bottomY - topY };
    scenery = null;
    draw();
  };
  function project(x,z) {
    const {cx,topW,bottomW,topY,laneH}=layout;
    const t=z<=Physics.C.headZ ? .91-.74*z/Physics.C.headZ : .17-(z-Physics.C.headZ)*.105;
    const width=topW+(bottomW-topW)*t;
    return {x:cx+x*width/Physics.C.width,y:topY+laneH*t,metre:width/Physics.C.width};
  }
  function ballStart() {
    const p=project(position,0),r=p.metre*Physics.C.ballRadius;
    return {x:p.x,y:p.y-r*.58};
  }
  function newRack() {return Physics.rack();}
  function projectPin(pin) {
    const p=project(pin.x,pin.z);
    return {...p,scale:p.metre*Physics.C.pinRadius*2/19};
  }
  function scoreBowls() {return Physics.score(rolls).total;}
  function shotOptions() {return {position,target:aim,power,spin};}
  function syncControls() {
    $('power').value=Math.round(power*100);$('power-value').textContent=Math.round(power*100)+'%';
    $('spin').value=Math.round(spin*100);$('spin-value').textContent=spin===0?'Recto':(spin<0?'← ':'→ ')+Math.round(Math.abs(spin)*100)+'%';
    $('position').value=Math.round(position*100);$('position-value').textContent=Math.abs(position)<.01?'Centro':position<0?'Izq.':'Der.';
    $('shot-controls').hidden=state!=='aim';
    for(const id of ['power','spin','position'])$(id).disabled=state!=='aim';
  }
  function frameMark(index) {
    const r=frames[index]||[];
    return r.map((n,i)=> {
      if(n===10&&(i===0||r[i-1]===10))return 'X';
      if(i>0&&r[i-1]!==10&&((index===9&&r[0]===10)||i===1)&&r[i-1]+n===10)return '/';
      return n===0?'–':String(n);
    }).join(' ');
  }
  function updateHud() {
    totalScore = scoreBowls();
    canvas.dataset.state=state;canvas.dataset.standing=String(pins.filter(p=>!p.down).length);
    frameLabel.textContent = `${Math.min(frame + 1, 10)} / 10`;
    scoreLabel.textContent = String(totalScore);
    bestLabel.textContent = String(Math.max(best, totalScore));
    frameStrip.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      cell.className = 'frame' + (i === frame && state !== 'finished' ? ' current' : '');
      const number = document.createElement('small'), mark = document.createElement('b');
      number.textContent = String(i + 1); mark.textContent = frameMark(i);
      const cumulative=Physics.score(rolls).frames[i];cell.title=`Frame ${i+1}: ${frameMark(i)||'pendiente'}${cumulative!==null?' · '+cumulative+' puntos':''}`;
      cell.append(number, mark); frameStrip.append(cell);
    }
  }
  function updateBest() {
    best = Math.max(best, totalScore); bestLabel.textContent = String(best);
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
  }
  function sound(name) { if (window.VladiSound) window.VladiSound.play(name); }
  function showOverlay(which) {
    state = which; overlay.hidden = false; drag = null; syncControls();
    if (which === 'title') {
      badge.textContent = 'La pista es tuya'; title.textContent = '¡A buscar el strike!';
      copy.textContent = 'Diez frames, dos tiros por turno y bonos por strike o spare. Tocá la pista para apuntar; deslizá la pelota hacia adelante para lanzar. Podés ajustar fuerza, posición y efecto.';
      action.textContent = 'EMPEZAR PARTIDA'; $('back-link').hidden = false;
    } else if (which === 'paused') {
      badge.textContent = 'Tiempo fuera'; title.textContent = 'Partida en pausa';
      copy.textContent = 'La pista queda lista para cuando quieras volver.'; action.textContent = 'SEGUIR JUGANDO'; $('back-link').hidden = false;
    } else {
      badge.textContent = 'Partida completa'; title.textContent = lastResult || '¡Buen juego, Vladi!';
      copy.textContent = `Terminaste con ${totalScore} puntos. Tu récord es ${best}. ¿Vamos por otra partida?`;
      action.textContent = 'JUGAR OTRA VEZ'; $('back-link').hidden = false;
    }
  }
  function startGame() {if(typeof window.gtag==='function')window.gtag('event','game_start',{game_id:'vladi-bowling',game_name:'vladi bowling'});
    rolls = []; frames = Array.from({ length: 10 }, () => []); frame = 0; simulation = null; accumulator = 0;
    totalScore = 0; aim = 0; spin = 0; position = 0; power = .72; flash = 0; lastResult = '';
    pins = newRack(); ball = null; state = 'aim'; overlay.hidden = true;
    hint.textContent = 'Tocá la pista para apuntar · Deslizá hacia adelante';
    syncControls();updateHud(); sound('start'); draw();
  }
  function pinShape(x, y, scale, falling = 0, direction = 1) {
    const bodyW = 19 * scale, bodyH = 46 * scale;
    ctx.save(); ctx.translate(x, y); if (falling) ctx.rotate(direction * falling * 1.05);
    ctx.shadowColor = '#0009'; ctx.shadowBlur = 10 * scale; ctx.shadowOffsetY = 4 * scale;
    const grad = ctx.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
    grad.addColorStop(0, '#9da9b7'); grad.addColorStop(.26, '#f5f6f5'); grad.addColorStop(.62, '#fff'); grad.addColorStop(1, '#b7c1cc');
    ctx.fillStyle = grad; ctx.beginPath();
    ctx.moveTo(-bodyW * .48, bodyH * .49); ctx.bezierCurveTo(-bodyW * .58, bodyH * .28, -bodyW * .4, bodyH * .02, -bodyW * .26, -bodyH * .12);
    ctx.bezierCurveTo(-bodyW * .2, -bodyH * .22, -bodyW * .27, -bodyH * .42, 0, -bodyH * .46);
    ctx.bezierCurveTo(bodyW * .27, -bodyH * .42, bodyW * .2, -bodyH * .22, bodyW * .26, -bodyH * .12);
    ctx.bezierCurveTo(bodyW * .4, bodyH * .02, bodyW * .58, bodyH * .28, bodyW * .48, bodyH * .49);
    ctx.quadraticCurveTo(0, bodyH * .61, -bodyW * .48, bodyH * .49); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#d74443'; ctx.beginPath(); ctx.ellipse(0, -bodyH * .035, bodyW * .36, 2.2 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, bodyH * .06, bodyW * .38, 2.1 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.ellipse(-bodyW * .22, bodyH * .22, bodyW * .08, bodyH * .16, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawBall(x, y, r, rotation = 0, strength = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ctx.shadowColor = '#000b'; ctx.shadowBlur = r * .7; ctx.shadowOffsetY = r * .4;
    const g = ctx.createRadialGradient(-r * .38, -r * .44, r * .04, r * .18, r * .12, r * 1.2);
    g.addColorStop(0, '#ffc98b'); g.addColorStop(.28, '#e88450'); g.addColorStop(.68, '#bd4b4a'); g.addColorStop(1, '#52233b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#372239';
    const hole = r * .115; ctx.beginPath(); ctx.arc(-r * .15, -r * .04, hole, 0, Math.PI * 2); ctx.arc(r * .12, -r * .17, hole, 0, Math.PI * 2); ctx.arc(r * .24, r * .08, hole, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,239,206,.28)'; ctx.lineWidth = Math.max(1, r * .04); ctx.beginPath(); ctx.arc(0, 0, r * .88, -1.9, .45); ctx.stroke();
    ctx.restore();
  }
  function paintScenery() {
    const { cx, laneW, topW, bottomW, topY, bottomY, laneH } = layout;
    const bg = ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#101525'); bg.addColorStop(1,'#050b14');
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    // Bowling machine and a stable, softly lit neon surround.
    const houseW=topW*1.65, houseY=topY-40;
    ctx.fillStyle='#080e18'; ctx.fillRect(cx-houseW/2,houseY,houseW,laneH*.27+40);
    ctx.strokeStyle='#46d9d2';ctx.lineWidth=4;ctx.shadowColor='#35ddd2';ctx.shadowBlur=12;
    ctx.beginPath();ctx.moveTo(cx-houseW/2,topY+laneH*.22);ctx.lineTo(cx-houseW/2,houseY);ctx.lineTo(cx+houseW/2,houseY);ctx.lineTo(cx+houseW/2,topY+laneH*.22);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#efd49b';ctx.font=`700 ${Math.max(11,Math.min(18,topW*.07))}px system-ui`;ctx.textAlign='center';ctx.fillText('VLADI • BOWLING',cx,topY-17);
    function trapezoid(extra,fill) {
      ctx.beginPath();ctx.moveTo(cx-topW/2-extra*.3,topY);ctx.lineTo(cx+topW/2+extra*.3,topY);ctx.lineTo(cx+bottomW/2+extra,bottomY);ctx.lineTo(cx-bottomW/2-extra,bottomY);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    }
    const gutter=ctx.createLinearGradient(0,topY,0,bottomY);gutter.addColorStop(0,'#283647');gutter.addColorStop(.5,'#111c28');gutter.addColorStop(1,'#344352');
    trapezoid(laneW*.065,gutter);
    const wood=ctx.createLinearGradient(0,topY,0,bottomY);wood.addColorStop(0,'#b17d4e');wood.addColorStop(.35,'#edbf7e');wood.addColorStop(1,'#c58e54');trapezoid(0,wood);
    ctx.save();ctx.clip();
    for(let i=0;i<25;i++) {
      const fraction=i/24-.5;
      ctx.strokeStyle=i%3===0?'#76512a45':'#fff1c343';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx+fraction*topW,topY);ctx.lineTo(cx+fraction*bottomW,bottomY);ctx.stroke();
      // Deterministic wood grain: no animated noise or opacity changes.
      for(let j=0;j<8;j++) {
        const t=(j+.25+(i%4)*.13)/8, y=topY+laneH*t;
        const width=topW+(bottomW-topW)*t;
        ctx.strokeStyle='#704c2523';ctx.beginPath();ctx.moveTo(cx+fraction*width,y);ctx.lineTo(cx+fraction*width+width/24,y+laneH*.012);ctx.stroke();
      }
    }
    for(let i=-3;i<=3;i++) {
      const y=topY+laneH*(.725+Math.abs(i)*.008), width=topW+(bottomW-topW)*.725, x=cx+i*width*.09;
      ctx.fillStyle='#49362b';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x-3,y+3);ctx.lineTo(x+3,y+3);ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle='#57392370';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,topY+laneH*.91);ctx.lineTo(w,topY+laneH*.91);ctx.stroke();
    ctx.restore();
    ctx.strokeStyle='#55c8ca77';ctx.lineWidth=2;
    for(const sign of [-1,1]) {ctx.beginPath();ctx.moveTo(cx+sign*(topW/2+laneW*.014),topY);ctx.lineTo(cx+sign*(bottomW/2+laneW*.047),bottomY);ctx.stroke();}
  }
  function draw() {
    if (!w || !h) return;
    const { cx, laneW, topW, bottomW, topY, bottomY, laneH } = layout;
    if(!scenery) {
      scenery=document.createElement('canvas');scenery.width=canvas.width;scenery.height=canvas.height;
      const main=ctx;ctx=scenery.getContext('2d',{alpha:false});ctx.setTransform(dpr,0,0,dpr,0,0);paintScenery();ctx=main;
    }
    ctx.drawImage(scenery,0,0,scenery.width,scenery.height,0,0,w,h);
    ctx.save();
    // The guide uses exactly the same world trajectory as the delivered ball.
    if(state==='aim'||state==='title') {
      const points=Physics.preview(shotOptions());
      ctx.strokeStyle=drag?'#fff0bbcc':'#fff0bb66';ctx.lineWidth=2;ctx.setLineDash([4,7]);ctx.beginPath();
      points.forEach((point,i)=>{const p=project(point.x,point.z);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
      const end=points[points.length-1],p=project(end.x,end.z);ctx.strokeStyle='#ffe29a';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle='rgba(255,222,161,.47)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-topW/2,topY);ctx.lineTo(cx-bottomW/2,bottomY);ctx.moveTo(cx+topW/2,topY);ctx.lineTo(cx+bottomW/2,bottomY);ctx.stroke();
    // Depth order includes the moving ball, so it never draws through standing pins.
    const entities=pins.filter(p=>!p.removed).map(pin=>({z:pin.z,pin}));
    if(ball&&!ball.exited)entities.push({z:ball.z,ball});
    else if(!ball&&(state==='aim'||state==='title'))entities.push({z:0,ball:{x:position,z:0,rotation:0,gutter:false}});
    entities.sort((a,b)=>b.z-a.z).forEach(entity=>{
      if(entity.ball) {
        const b=entity.ball,p=project(b.x,b.z),r=p.metre*Physics.C.ballRadius;
        drawBall(p.x,p.y-r*(b.gutter?.15:.58),r,b.rotation||0);
      }else{
        const pin=entity.pin,p=projectPin(pin),tilt=pin.tilt||0;
        ctx.fillStyle='#20141b55';ctx.beginPath();ctx.ellipse(p.x,p.y,9*p.scale,2.5*p.scale,0,0,Math.PI*2);ctx.fill();
        const rotation=(Math.sin(pin.angle)*1.35+Math.cos(pin.angle)*.30)*tilt;
        pinShape(p.x,p.y-46*p.scale*.54*(1-tilt*.65),p.scale,Math.abs(rotation)/1.05,Math.sign(rotation)||1);
      }
    });
    if (flash > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(.15, flash * .025); ctx.fillStyle = '#fff1c7'; ctx.fillRect(0, 0, w, h); ctx.restore();
    }
  }
  function isTenthComplete() {
    const r = frames[9];
    if (!r.length) return false;
    if (r.length < 2) return false;
    if (r.length === 2) return r[0] !== 10 && r[0] + r[1] < 10;
    return r.length >= 3;
  }
  function afterRoll(knocked) {
    const r = frames[frame]; r.push(knocked); rolls.push(knocked); lastPinfall = knocked;
    ball = null;simulation = null;
    totalScore = scoreBowls(); updateBest(); updateHud();
    if (frame < 9) {
      const spareOrStrike = r[0] === 10 || (r.length === 2 && r[0] + r[1] === 10);
      if (spareOrStrike || r.length >= 2) {
        if (r[0] === 10 && r.length === 1) { lastResult = '¡STRIKE!'; sound('goal'); }
        else if (r.length === 2 && r[0] + r[1] === 10) { lastResult = '¡SPARE!'; sound('goal'); }
        else lastResult = knocked ? `${knocked} pinos` : 'A la próxima';
        state = 'settle'; clock = 0;
      } else {
        pins = pins.filter(pin => !pin.down && !pin.removed); pins.forEach(pin => {pin.vx=0;pin.vz=0;});
        ball = null;  state = 'aim';
        hint.textContent = knocked ? `Quedan ${10 - knocked} pinos. ¡Probá el segundo tiro!` : 'Quedó el segundo tiro. Apuntá un poco más al centro.';
      }
    } else {
      if (isTenthComplete()) {
        lastResult = totalScore >= 180 ? '¡Partidaza, Vladi!' : totalScore >= 100 ? '¡Gran partida!' : '¡Buen juego, Vladi!';
        state = 'settle'; clock = 0;
      } else {
        // A strike or spare earns a bonus ball. Ordinary second balls keep only the standing pins.
        if ((r.length === 1 && r[0] < 10) || (r.length === 2 && r[0] === 10 && r[1] < 10)) {
          pins = pins.filter(pin => !pin.down && !pin.removed);
          hint.textContent = `Quedan ${pins.length} pinos. ¡Cerrá el frame!`;
        } else {
          pins = newRack();
          hint.textContent = r.length === 2 ? '¡Bola extra! Aprovechá la última.' : '¡Una bola extra para cerrar el frame!';
        }
        ball = null; state = 'aim';
      }
    }
    if (state === 'settle') hint.textContent = lastResult;
    syncControls();
  }
  function throwBall(force = power, target = aim, effect = spin) {
    if(state!=='aim'||ball)return;
    simulation=Physics.create(pins,{position,target,power:force,spin:effect});
    ball=simulation.ball;accumulator=0;hitSoundAt=-1;hitSounds=0;state='roll';clock=0;
    hint.textContent='¡Allá va!';canvas.dataset.state=state;syncControls();sound('kick');draw();
  }
  function finishRoll() {
    const knocked=pins.filter(p=>p.down||p.removed).length;
    const gutter=ball.gutter;ball=null;simulation=null;
    if(!knocked)sound('save');
    hint.textContent=gutter?'Canaleta · 0 pinos':`${knocked} pinos abajo`;
    afterRoll(knocked);
  }
  function render() {ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function tick(now) {
    const dt=Math.min(.25,Math.max(0,(now-lastTime)/1000||0));lastTime=now;
    const active=state==='roll'||state==='settle';
    if(active)clock+=dt;
    if(state==='roll'&&simulation) {
      accumulator+=dt;
      while(accumulator>=Physics.C.step&&!simulation.done) {
        const hits=Physics.step(simulation);accumulator-=Physics.C.step;
        if(hits&&hitSounds<8&&simulation.time-hitSoundAt>.11){sound('hit');hitSoundAt=simulation.time;hitSounds++;}
      }
      if(simulation.done)finishRoll();
    }
    if(state==='settle'&&clock>.85) {
      if(frame<9){frame++;pins=newRack();ball=null;state='aim';hint.textContent='Nuevo frame. Apuntá al espacio entre el pino 1 y el de al lado.';updateHud();syncControls();}
      else {updateBest();updateHud();showOverlay('finished');sound('goal');}
    }
    if(active)render();
    requestAnimationFrame(tick);
  }
  function local(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function setTarget(p) {
    const plane=project(0,Physics.C.headZ);
    aim=clamp((p.x-layout.cx)/plane.metre,-1.20,1.20);draw();
  }
  canvas.addEventListener('pointerdown',e=> {
    if(state!=='aim'||ball)return;
    canvas.focus();const p=local(e),start=ballStart();
    if(p.y<layout.topY+layout.laneH*.62){setTarget(p);return;}
    drag={id:e.pointerId,x:p.x,y:p.y,startX:p.x,startY:p.y,initialAim:aim,at:performance.now()};
    canvas.setPointerCapture(e.pointerId);draw();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const p=local(e),dy=drag.startY-p.y,dx=p.x-drag.startX;
    if(dy>18)aim=clamp(drag.initialAim+dx/Math.max(65,dy)*.90,-1.20,1.20);
    drag.x=p.x;drag.y=p.y;draw();
  });
  canvas.addEventListener('pointerup',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const p=local(e),dy=drag.startY-p.y,dx=p.x-drag.startX;
    if(dy<28){
      if(Math.abs(dx)<18){const plane=project(0,0);position=clamp((p.x-layout.cx)/plane.metre,-.40,.40);}
      drag=null;syncControls();draw();return;
    }
    aim=clamp(drag.initialAim+dx/Math.max(65,dy)*.90,-1.20,1.20);
    // Swipe length adjusts force; direction is independent of pointer event frequency.
    power=clamp(.25+dy/Math.max(110,Math.min(w,h)*.42)*.65,.20,1);
    drag=null;throwBall(power,aim,spin);
  });
  canvas.addEventListener('pointercancel',()=>{drag=null;draw();});
  for(const id of ['power','spin','position'])$(id).addEventListener('input',()=> {
    if(state!=='aim')return;
    if(id==='power')power=Number($(id).value)/100;
    if(id==='spin')spin=Number($(id).value)/100;
    if(id==='position')position=Number($(id).value)/100;
    syncControls();draw();
  });
  window.addEventListener('keydown',e=> {
    if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();togglePause();return;}
    if(state!=='aim'||e.target?.tagName==='INPUT')return;
    let handled=true;
    if(e.code==='ArrowLeft')aim=clamp(aim-.018,-1.2,1.2);
    else if(e.code==='ArrowRight')aim=clamp(aim+.018,-1.2,1.2);
    else if(e.code==='KeyA')position=clamp(position-.025,-.40,.40);
    else if(e.code==='KeyD')position=clamp(position+.025,-.40,.40);
    else if(e.code==='KeyQ')spin=clamp(spin-.10,-1,1);
    else if(e.code==='KeyE')spin=clamp(spin+.10,-1,1);
    else if(e.code==='ArrowUp')power=clamp(power+.05,.20,1);
    else if(e.code==='ArrowDown')power=clamp(power-.05,.20,1);
    else if(e.code==='Space'||e.code==='Enter')throwBall();
    else handled=false;
    if(handled){e.preventDefault();syncControls();draw();}
  });
  function togglePause() {
    if (state === 'aim' || state === 'roll' || state === 'settle') {
      resumeState = state; showOverlay('paused'); sound('pause'); $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'Continuar');
    } else if (state === 'paused') { state = resumeState; overlay.hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar'); sound('resume');syncControls();draw(); }
  }
  action.addEventListener('click', () => {
    if (state === 'paused') { state = resumeState; overlay.hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar'); sound('resume');syncControls();draw(); }
    else startGame();
  });
  $('pause').addEventListener('click', togglePause);
  $('sound').addEventListener('click', () => { $('sound').textContent = $('sound').getAttribute('aria-pressed') === 'true' ? '♪' : '♫'; });
  $('fullscreen').addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch (_) {}
  });
  $('back-link').addEventListener('click', () => { window.location.href = '../'; });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 140), { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ['aim', 'roll', 'settle'].includes(state)) togglePause(); });
  pins = newRack(); syncControls();updateHud(); bestLabel.textContent = String(best); resize(); requestAnimationFrame(tick);
  window.VladiBowlingTest = { startGame, throwBall, getState: () => ({ state, frame, rolls: [...rolls], frames: frames.map(x => [...x]), score: totalScore, pinsStanding: pins.filter(p => !p.down).length, best }), scoreBowls };
})();

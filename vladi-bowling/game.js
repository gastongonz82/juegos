(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const $ = id => document.getElementById(id);
  const frameLabel = $('frame-label'), scoreLabel = $('score-label'), bestLabel = $('best-label');
  const frameStrip = $('frame-strip'), hint = $('hint'), overlay = $('overlay');
  const action = $('main-action'), title = $('overlay-title'), copy = $('overlay-copy'), badge = $('overlay-badge');
  const BEST_KEY = 'vladiBowlingBestV1';
  let best = 0;
  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}
  let w = 0, h = 0, dpr = 1, layout = {}, state = 'title', aim = 0, spin = 0;
  let frame = 0, rolls = [], frames = Array.from({ length: 10 }, () => []), pins = [], ball = null;
  let drag = null, lastTime = 0, clock = 0, flash = 0, crowdPulse = 0, lastResult = '';
  let ballsInCurrent = 0, tenthNeedsBonus = false, totalScore = 0, lastPinfall = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height); dpr = Math.min(1.65, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const laneW = Math.min(w * .96, h * 1.16);
    const topY = Math.max(93, h * .19), bottomY = h - Math.max(18, h * .025);
    layout = { cx: w / 2, laneW, topW: laneW * .43, bottomW: laneW * .94, topY, bottomY, laneH: bottomY - topY };
    if (ball && !ball.moving) ball.x = ballStart().x;
    draw();
  };
  function ballStart() { return { x: layout.cx + aim * layout.laneW * .18, y: layout.bottomY - layout.laneH * .105 }; }
  function newRack() {
    const rows = [1, 2, 3, 4], rack = [];
    let id = 0;
    rows.forEach((count, row) => {
      for (let col = 0; col < count; col++) {
        const colX = col - (count - 1) / 2;
        rack.push({ id: id++, row, col, count, nx: colX * .095, x: 0, y: 0, down: false, fall: 0, dir: 0 });
      }
    });
    return rack;
  }
  function projectPin(pin) {
    const { cx, laneW, topY, laneH } = layout;
    const y = topY + laneH * (.355 + pin.row * .033);
    const depth = (y - topY) / laneH;
    const half = laneW * (.215 + depth * .25);
    return { x: cx + pin.nx * laneW + aim * laneW * .008, y, scale: .63 + depth * .58, half };
  }
  function scoreBowls() {
    let value = 0, ri = 0;
    const list = rolls;
    for (let f = 0; f < 10; f++) {
      if (ri >= list.length) break;
      if (f === 9) {
        value += list.slice(ri, ri + 3).reduce((sum, pins) => sum + pins, 0);
        break;
      } else if (list[ri] === 10) {
        if (ri + 2 < list.length) value += 10 + list[ri + 1] + list[ri + 2];
        ri++;
      } else if (ri + 1 < list.length && list[ri] + list[ri + 1] === 10) {
        if (ri + 2 < list.length) value += 10 + list[ri + 2];
        ri += 2;
      } else {
        if (ri + 1 < list.length) value += list[ri] + list[ri + 1];
        ri += 2;
      }
    }
    return value;
  }
  function frameMark(index) {
    const r = frames[index] || [];
    if (!r.length) return '';
    if (index < 9) {
      if (r[0] === 10) return 'X';
      if (r.length > 1 && r[0] + r[1] === 10) return r[0] === 0 ? '–' : '/';
      return String(r[r.length - 1]);
    }
    if (r.length === 1) return r[0] === 10 ? 'X' : String(r[0]);
    if (r.length === 2) {
      if (r[1] === 10) return 'X';
      return r[0] + r[1] === 10 ? '/' : String(r[1]);
    }
    return r[2] === 10 ? 'X' : (r[1] + r[2] === 10 ? '/' : String(r[2]));
  }
  function updateHud() {
    totalScore = scoreBowls();
    frameLabel.textContent = `${Math.min(frame + 1, 10)} / 10`;
    scoreLabel.textContent = String(totalScore);
    bestLabel.textContent = String(Math.max(best, totalScore));
    frameStrip.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      cell.className = 'frame' + (i === frame && state !== 'finished' ? ' current' : '');
      const number = document.createElement('small'), mark = document.createElement('b');
      number.textContent = String(i + 1); mark.textContent = frameMark(i);
      cell.append(number, mark); frameStrip.append(cell);
    }
  }
  function updateBest() {
    best = Math.max(best, totalScore); bestLabel.textContent = String(best);
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
  }
  function sound(name) { if (window.VladiSound) window.VladiSound.play(name); }
  function showOverlay(which) {
    state = which; overlay.hidden = false; drag = null;
    if (which === 'title') {
      badge.textContent = 'La pista es tuya'; title.textContent = '¡A buscar el strike!';
      copy.textContent = 'Diez frames, una pista brillante y todo el público alentando a Vladi. Apuntá, elegí la fuerza y tirá.';
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
  function startGame() {
    rolls = []; frames = Array.from({ length: 10 }, () => []); frame = 0; ballsInCurrent = 0;
    tenthNeedsBonus = false; totalScore = 0; aim = 0; spin = 0; flash = 0; lastResult = '';
    pins = newRack(); ball = null; state = 'aim'; overlay.hidden = true;
    hint.textContent = 'Arrastrá la pelota hacia atrás y soltá. Flechas para apuntar.';
    updateHud(); sound('start'); draw();
  }
  function pinShape(x, y, scale, falling = 0, direction = 1) {
    const bodyW = 17 * scale, bodyH = 39 * scale;
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
  function draw() {
    if (!w || !h) return;
    const { cx, laneW, topW, bottomW, topY, bottomY, laneH } = layout;
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#10172b'); bg.addColorStop(.48, '#17233b'); bg.addColorStop(1, '#09121c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Arena wall and soft light beams
    const wallY = Math.max(66, h * .15);
    const wall = ctx.createLinearGradient(0, wallY, 0, topY + laneH * .31); wall.addColorStop(0, '#202c48'); wall.addColorStop(1, '#18243b');
    ctx.fillStyle = wall; ctx.fillRect(0, wallY, w, Math.max(0, topY + laneH * .31 - wallY));
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const lx = w * (i + .5) / 7, pulse = .72 + Math.sin(clock * 1.6 + i) * .04;
      const beam = ctx.createRadialGradient(lx, wallY + 8, 2, lx, wallY + laneH * .32, laneW * .12);
      beam.addColorStop(0, `rgba(255,210,135,${.17 * pulse})`); beam.addColorStop(1, 'rgba(255,210,135,0)');
      ctx.fillStyle = beam; ctx.fillRect(lx - laneW * .14, wallY, laneW * .28, laneH * .38);
      ctx.fillStyle = '#f6dca4'; ctx.shadowColor = '#ffe8ae'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.roundRect(lx - 11, wallY + 3, 22, 5, 3); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.restore();
    // Crowd rows
    for (let row = 0; row < 3; row++) {
      const yy = wallY + 19 + row * 16;
      for (let x = 8; x < w; x += Math.max(13, w / 70)) {
        const pick = Math.sin(x * .17 + row * 5.3);
        ctx.fillStyle = pick > .55 ? '#e2ab55' : pick < -.38 ? '#6fbad4' : '#b77fa6';
        ctx.globalAlpha = .35 + .1 * Math.sin(x + clock * .8);
        ctx.beginPath(); ctx.arc(x, yy, 1.7, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#6a403e'; ctx.fillRect(0, wallY + 66, w, Math.max(7, h * .018));
    ctx.fillStyle = '#f0b663'; ctx.fillRect(0, wallY + 66, w, 2);
    // Lane apron shadow and wood trapezoid
    ctx.save(); ctx.shadowColor = '#000b'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.beginPath(); ctx.moveTo(cx - topW / 2, topY); ctx.lineTo(cx + topW / 2, topY); ctx.lineTo(cx + bottomW / 2, bottomY); ctx.lineTo(cx - bottomW / 2, bottomY); ctx.closePath();
    const wood = ctx.createLinearGradient(0, topY, 0, bottomY); wood.addColorStop(0, '#ab6848'); wood.addColorStop(.22, '#d3945c'); wood.addColorStop(.58, '#a85e44'); wood.addColorStop(1, '#77403d'); ctx.fillStyle = wood; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx - topW / 2, topY); ctx.lineTo(cx + topW / 2, topY); ctx.lineTo(cx + bottomW / 2, bottomY); ctx.lineTo(cx - bottomW / 2, bottomY); ctx.closePath(); ctx.clip();
    for (let i = -5; i <= 5; i++) {
      const x1 = cx + i * topW * .085, x2 = cx + i * bottomW * .085;
      ctx.strokeStyle = i === 0 ? 'rgba(255,234,177,.25)' : 'rgba(60,32,44,.19)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, topY); ctx.lineTo(x2, bottomY); ctx.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const t = i / 22, y = topY + laneH * t;
      ctx.fillStyle = i % 2 ? 'rgba(255,223,153,.055)' : 'rgba(54,27,34,.045)'; ctx.fillRect(cx - laneW, y, laneW * 2, Math.max(1, laneH / 22));
    }
    const arrowsY = topY + laneH * .51;
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * laneW * .055, py = arrowsY + Math.abs(i) * 4;
      ctx.fillStyle = 'rgba(255,235,187,.58)'; ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px - 4, py + 3); ctx.lineTo(px + 4, py + 3); ctx.closePath(); ctx.fill();
    }
    // Aim guides
    if (state === 'aim' || state === 'title') {
      const start = ballStart(), targetX = cx + aim * laneW * .12;
      ctx.save(); ctx.setLineDash([5, 8]); ctx.strokeStyle = drag ? 'rgba(255,235,177,.8)' : 'rgba(255,232,187,.28)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.quadraticCurveTo((start.x + targetX) / 2, topY + laneH * .54, targetX, topY + laneH * .42); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,214,135,.55)'; ctx.beginPath(); ctx.arc(targetX, topY + laneH * .42, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // Lane edges
    ctx.strokeStyle = 'rgba(255,222,161,.47)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - topW / 2, topY); ctx.lineTo(cx - bottomW / 2, bottomY); ctx.moveTo(cx + topW / 2, topY); ctx.lineTo(cx + bottomW / 2, bottomY); ctx.stroke();
    // Pin shadows then pins
    pins.slice().sort((a, b) => projectPin(a).y - projectPin(b).y).forEach(pin => {
      if (pin.down && pin.fall >= 1) return;
      const p = projectPin(pin), r = 8.5 * p.scale;
      ctx.fillStyle = 'rgba(32,20,27,.35)'; ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + 13 * p.scale, r * .9, r * .22, -.05, 0, Math.PI * 2); ctx.fill();
      pinShape(p.x + (pin.down ? pin.dir * pin.fall * 10 : 0), p.y + (pin.down ? pin.fall * 9 : 0), p.scale, pin.down ? pin.fall : 0, pin.dir || 1);
    });
    // Ball and power indicator
    if (state !== 'title' || !overlay.hidden) {
      let bx, by, br, rotation = 0;
      if (ball && ball.moving) {
        const t = Math.min(1, ball.t), ease = t * t * (3 - 2 * t);
        const p = ballStart(); bx = p.x + (ball.targetX - p.x) * ease; by = p.y + (ball.targetY - p.y) * ease;
        br = 6 + 17 * ease; rotation = ease * 12 + clock * 5;
      } else { const p = ballStart(); bx = p.x; by = p.y; br = Math.min(18, laneW * .024); }
      if (!ball || !ball.moving || ball.t < .98) drawBall(bx, by, br, rotation);
      if (drag && !ball) {
        const p = ballStart(), power = Math.max(0, Math.min(100, (p.y - drag.y) / (h * .22) * 100));
        const barW = Math.min(190, laneW * .42), y = p.y + br * 2.2;
        ctx.fillStyle = '#171d2bba'; ctx.beginPath(); ctx.roundRect(cx - barW / 2, y, barW, 10, 6); ctx.fill();
        const grad = ctx.createLinearGradient(cx - barW / 2, y, cx + barW / 2, y); grad.addColorStop(0, '#74dfae'); grad.addColorStop(.65, '#f1d56d'); grad.addColorStop(1, '#f48152');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(cx - barW / 2 + 2, y + 2, (barW - 4) * power / 100, 6, 4); ctx.fill();
      }
    }
    if (flash > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(.15, flash * .025); ctx.fillStyle = '#fff1c7'; ctx.fillRect(0, 0, w, h); ctx.restore();
    }
  }
  function choosePinfall(targetX, strength, shotSpin) {
    const standing = pins.filter(pin => !pin.down);
    if (!standing.length) return [];
    const laneHalf = layout.laneW * .24;
    const localTarget = (targetX - layout.cx) / laneHalf;
    let nearest = standing.map(pin => ({ pin, d: Math.abs(pin.nx / .19 - localTarget) })).sort((a, b) => a.d - b.d);
    const radius = .12 + strength * .14;
    const primary = nearest.filter(x => x.d < radius).map(x => x.pin);
    if (!primary.length) {
      // A gutter shot only misses if aim is far outside the rack; near edges clip the outside pin.
      if (Math.abs(localTarget) < 1.02) primary.push(nearest[0].pin);
      else return [];
    }
    const affected = new Set(primary.map(pin => pin.id));
    let frontier = [...primary];
    const chainRange = .115 + strength * .14 + Math.abs(shotSpin) * .025;
    for (let step = 0; step < 3; step++) {
      const next = [];
      for (const hit of frontier) for (const other of standing) {
        if (!affected.has(other.id) && Math.abs(other.nx - hit.nx) <= chainRange && Math.abs(other.row - hit.row) <= 1) {
          affected.add(other.id); next.push(other);
        }
      }
      frontier = next;
    }
    const falls = standing.filter(pin => affected.has(pin.id));
    falls.forEach(pin => { pin.down = true; pin.fall = 0; pin.dir = Math.sign(pin.nx - localTarget) || (shotSpin >= 0 ? 1 : -1); });
    return falls;
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
    totalScore = scoreBowls(); updateBest(); updateHud();
    if (frame < 9) {
      const spareOrStrike = r[0] === 10 || (r.length === 2 && r[0] + r[1] === 10);
      if (spareOrStrike || r.length >= 2) {
        if (r[0] === 10 && r.length === 1) { lastResult = '¡STRIKE!'; sound('goal'); }
        else if (r.length === 2 && r[0] + r[1] === 10) { lastResult = '¡SPARE!'; sound('goal'); }
        else lastResult = knocked ? `${knocked} pinos` : 'A la próxima';
        state = 'settle'; clock = 0;
      } else {
        pins = pins.filter(pin => !pin.down); pins.forEach(pin => { pin.down = false; pin.fall = 0; });
        ball = null; ballsInCurrent = 1; state = 'aim';
        hint.textContent = knocked ? `Quedan ${10 - knocked} pinos. ¡Probá el segundo tiro!` : 'Quedó el segundo tiro. Apuntá un poco más al centro.';
      }
    } else {
      if (isTenthComplete()) {
        lastResult = totalScore >= 180 ? '¡Partidaza, Vladi!' : totalScore >= 100 ? '¡Gran partida!' : '¡Buen juego, Vladi!';
        state = 'settle'; clock = 0;
      } else {
        // A strike or spare earns a bonus ball. Ordinary second balls keep only the standing pins.
        if ((r.length === 1 && r[0] < 10) || (r.length === 2 && r[0] === 10 && r[1] < 10)) {
          pins = pins.filter(pin => !pin.down);
          hint.textContent = `Quedan ${pins.length} pinos. ¡Cerrá el frame!`;
        } else {
          pins = newRack();
          hint.textContent = r.length === 2 ? '¡Bola extra! Aprovechá la última.' : '¡Una bola extra para cerrar el frame!';
        }
        ball = null; state = 'aim';
      }
    }
    if (state === 'settle') hint.textContent = lastResult;
  }
  function throwBall(power = .68, targetX = layout.cx + aim * layout.laneW * .12, shotSpin = spin) {
    if (state !== 'aim' || ball?.moving) return;
    power = Math.max(.2, Math.min(1, power));
    sound('kick');
    ball = { moving: true, t: 0, duration: .9 - power * .16, targetX, targetY: layout.topY + layout.laneH * .43, power, spin: shotSpin };
    state = 'roll'; hint.textContent = '¡Allá va!'; draw();
  }
  function completeRoll() {
    if (!ball || !ball.moving) return;
    const shot = ball, falls = choosePinfall(shot.targetX, shot.power, shot.spin);
    if (!falls.length) sound('save'); else if (falls.length >= 5) sound('goal'); else sound('hit');
    ball.moving = false; ball.t = 1;
    clock = 0; state = 'falling'; lastPinfall = falls.length;
    hint.textContent = falls.length >= 8 ? '¡Tremendo tiro!' : (falls.length ? `${falls.length} pinos abajo` : '¡Se escapó por un lado!');
  }
  function finishFalling() {
    if (state !== 'falling') return;
    afterRoll(lastPinfall);
  }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function tick(now) {
    const dt = Math.min(.04, Math.max(0, (now - lastTime) / 1000 || 0)); lastTime = now; clock += dt; crowdPulse += dt;
    if (state === 'roll' && ball) { ball.t += dt / ball.duration; if (ball.t >= 1) completeRoll(); }
    if (state === 'falling') {
      pins.forEach(pin => { if (pin.down) pin.fall = Math.min(1, pin.fall + dt * (2.9 + pin.row * .08)); });
      if (clock > .72) finishFalling();
    }
    if (state === 'settle') {
      pins.forEach(pin => { if (pin.down) pin.fall = Math.min(1, pin.fall + dt * 3.2); });
      if (clock > .93) {
        if (frame < 9) { frame++; ballsInCurrent = 0; pins = newRack(); ball = null; state = 'aim'; hint.textContent = 'Siguiente frame: buscá otro strike.'; updateHud(); }
        else { state = 'finished'; updateBest(); updateHud(); showOverlay('finished'); sound('goal'); }
      }
    }
    if (flash > 0) flash = Math.max(0, flash - dt * 7);
    render(); requestAnimationFrame(tick);
  }
  function local(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.addEventListener('pointerdown', e => {
    if (state !== 'aim' || ball) return;
    const p = local(e), start = ballStart();
    if (p.y < layout.topY + layout.laneH * .55) {
      if (p.x < w * .4) aim = Math.max(-1, aim - .12); else if (p.x > w * .6) aim = Math.min(1, aim + .12);
      updateHud(); draw(); return;
    }
    drag = { id: e.pointerId, x: p.x, y: p.y, sx: start.x, sy: start.y, at: performance.now() };
    canvas.setPointerCapture(e.pointerId); draw();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const p = local(e), dy = drag.y - p.y;
    aim = Math.max(-1, Math.min(1, aim + (p.x - drag.x) / (w * .75)));
    spin = Math.max(-1, Math.min(1, (p.x - drag.x) / (w * .32)));
    drag.x = p.x; drag.y = p.y; draw();
  });
  canvas.addEventListener('pointerup', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const p = local(e), travel = Math.max(0, drag.sy - p.y), elapsed = Math.max(.08, (performance.now() - drag.at) / 1000);
    const power = Math.max(.28, Math.min(1, .32 + travel / Math.max(110, h * .23) * .72 + Math.min(.18, travel / elapsed / 2500)));
    drag = null; throwBall(power, layout.cx + aim * layout.laneW * .12, spin);
  });
  canvas.addEventListener('pointercancel', () => { drag = null; draw(); });
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); togglePause(); return; }
    if (state !== 'aim') return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); aim = Math.max(-1, aim - .055); draw(); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); aim = Math.min(1, aim + .055); draw(); }
    else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); throwBall(.74); }
  });
  function togglePause() {
    if (state === 'aim' || state === 'roll' || state === 'falling' || state === 'settle') {
      window.__bowlingResumeState = state; showOverlay('paused'); sound('pause'); $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'Continuar');
    } else if (state === 'paused') { state = window.__bowlingResumeState || 'aim'; overlay.hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar'); sound('resume'); }
  }
  action.addEventListener('click', () => {
    if (state === 'paused') { state = window.__bowlingResumeState || 'aim'; overlay.hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar'); sound('resume'); }
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
  document.addEventListener('visibilitychange', () => { if (document.hidden && ['aim', 'roll', 'falling', 'settle'].includes(state)) togglePause(); });
  pins = newRack(); updateHud(); bestLabel.textContent = String(best); resize(); requestAnimationFrame(tick);
  window.VladiBowlingTest = { startGame, throwBall, getState: () => ({ state, frame, rolls: [...rolls], frames: frames.map(x => [...x]), score: totalScore, pinsStanding: pins.filter(p => !p.down).length, best }), scoreBowls };
})();

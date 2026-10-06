(() => {
  'use strict';
  const KEY = 'vladiArcadeMuted';
  let muted = false, audioContext = null, master = null, lastPlayed = {}, engine = null, engineRunning = false, engineUpdateAt = -1;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (_) {}
  const toggleButton = document.querySelector('[data-sound-toggle]');
  function context() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!audioContext) { audioContext = new Audio(); master = audioContext.createGain(); master.gain.value = 0.82; master.connect(audioContext.destination); }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  function tone(freq, duration, wave = 'sine', delay = 0, volume = 0.11, slideTo = null) {
    const ac = context(); if (!ac) return;
    const start = ac.currentTime + delay, osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(Math.min(0.28, volume * 1.35), start + Math.min(0.014, duration * 0.22));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); osc.connect(gain); gain.connect(master);
    osc.start(start); osc.stop(start + duration + 0.01);
  }
  function noiseBurst(duration, filterType, startHz, endHz, volume, delay = 0) {
    const ac = context();
    if (!ac || !ac.createBuffer || !ac.createBufferSource) return;
    const length = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, length, ac.sampleRate), samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const fade = 1 - i / length;
      samples[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const start = ac.currentTime + delay, source = ac.createBufferSource();
    const filter = ac.createBiquadFilter(), gain = ac.createGain();
    filter.type = filterType; filter.frequency.setValueAtTime(startHz, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, endHz), start + duration);
    filter.Q.value = filterType === 'bandpass' ? 0.7 : 0.6;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.28, volume * 1.35), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer; source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(start); source.stop(start + duration + 0.01);
  }
  function play(name) {
    if (muted) return;
    const now = performance.now(), minGap = name === 'collect' || name === 'slice' ? 42 : 65;
    if (now - (lastPlayed[name] || 0) < minGap) return;
    lastPlayed[name] = now;
    if (name === 'jump') { tone(420,.10,'triangle',0,.12,720); tone(650,.07,'sine',.055,.055,850); }
    else if (name === 'move') tone(360,.055,'triangle',0,.07,510);
    else if (name === 'collect') { tone(720,.10,'sine',0,.12,940); tone(990,.13,'sine',.075,.12,1260); }
    else if (name === 'slice') { noiseBurst(.18,'bandpass',2100,480,.19); tone(1480,.07,'triangle',.012,.08,620); }
    else if (name === 'explosion' || name === 'hit') { noiseBurst(.42,'lowpass',1600,130,.22); noiseBurst(.13,'bandpass',2400,800,.12,.015); tone(105,.36,'sawtooth',0,.20,46); }
    else if (name === 'gameover') { tone(380,.20,'triangle',0,.12,270); tone(270,.24,'triangle',.17,.12,165); tone(165,.32,'sine',.37,.12,110); }
    else if (name === 'pause') tone(510,.075,'sine',0,.08,390);
    else if (name === 'resume') tone(390,.075,'sine',0,.08,590);
    else if (name === 'start') { tone(470,.10,'triangle',0,.09,650); tone(670,.13,'sine',.09,.10,880); }
  }
  function syncEngine() {
    if (!engine || !audioContext) return;
    engine.output.gain.setTargetAtTime(muted || !engineRunning ? 0 : 0.105, audioContext.currentTime, 0.09);
  }
  function engineStart() {
    const ac = context();
    if (!ac) return;
    if (!engine) {
      const filter = ac.createBiquadFilter(), output = ac.createGain();
      filter.type = 'lowpass'; filter.frequency.value = 520; filter.Q.value = 0.55;
      output.gain.value = 0;
      const parts = [
        { wave: 'sawtooth', hz: 72, level: 0.72 },
        { wave: 'triangle', hz: 144, level: 0.24 },
        { wave: 'triangle', hz: 216, level: 0.10 }
      ];
      const oscillators = parts.map(part => {
        const osc = ac.createOscillator(), level = ac.createGain();
        osc.type = part.wave; osc.frequency.value = part.hz; level.gain.value = part.level;
        osc.connect(level); level.connect(filter); osc.start();
        return osc;
      });
      filter.connect(output); output.connect(master);
      engine = { filter, output, oscillators };
    }
    engineRunning = true; syncEngine();
  }
  function engineStop() {
    engineRunning = false; syncEngine();
  }
  function engineUpdate(load = 0) {
    if (!engineRunning || muted || !engine || !audioContext) return;
    const now = audioContext.currentTime;
    if (now - engineUpdateAt < 0.12) return;
    engineUpdateAt = now;
    const base = 68 + Math.max(0, Math.min(1, load)) * 42;
    engine.oscillators.forEach((osc, i) => osc.frequency.setTargetAtTime(base * (i + 1), now, 0.16));
    engine.filter.frequency.setTargetAtTime(420 + base * 2, now, 0.18);
  }
  function renderButton() {
    if (!toggleButton) return;
    toggleButton.textContent = muted ? '🔇' : '🔊';
    toggleButton.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Silenciar sonidos');
    toggleButton.setAttribute('aria-pressed', String(muted));
    toggleButton.title = muted ? 'Activar sonidos' : 'Silenciar sonidos';
  }
  if (toggleButton) toggleButton.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation(); muted = !muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (_) {}
    renderButton(); syncEngine();
  });
  renderButton();
  window.VladiSound = { play, engineStart, engineStop, engineUpdate, get muted() { return muted; } };
})();
(() => {
  'use strict';
  const KEY = 'vladiArcadeMuted';
  let muted = false, audioContext = null, master = null, lastPlayed = {};
  try { muted = localStorage.getItem(KEY) === '1'; } catch (_) {}
  const toggleButton = document.querySelector('[data-sound-toggle]');
  function context() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!audioContext) { audioContext = new Audio(); master = audioContext.createGain(); master.gain.value = 0.24; master.connect(audioContext.destination); }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  function tone(freq, duration, wave = 'sine', delay = 0, volume = 0.11, slideTo = null) {
    const ac = context(); if (!ac) return;
    const start = ac.currentTime + delay, osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.014, duration * 0.22));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); osc.connect(gain); gain.connect(master);
    osc.start(start); osc.stop(start + duration + 0.01);
  }
  function play(name) {
    if (muted) return;
    const now = performance.now(), minGap = name === 'collect' || name === 'slice' ? 42 : 65;
    if (now - (lastPlayed[name] || 0) < minGap) return;
    lastPlayed[name] = now;
    if (name === 'jump') { tone(420,.10,'triangle',0,.12,720); tone(650,.07,'sine',.055,.055,850); }
    else if (name === 'move') tone(360,.055,'triangle',0,.07,510);
    else if (name === 'collect') { tone(720,.10,'sine',0,.12,940); tone(990,.13,'sine',.075,.12,1260); }
    else if (name === 'slice') { tone(520,.055,'triangle',0,.075,1180); tone(1040,.06,'sine',.035,.07,1450); }
    else if (name === 'hit') { tone(230,.22,'sawtooth',0,.14,105); tone(150,.20,'triangle',.04,.10,75); }
    else if (name === 'gameover') { tone(380,.20,'triangle',0,.12,270); tone(270,.24,'triangle',.17,.12,165); tone(165,.32,'sine',.37,.12,110); }
    else if (name === 'pause') tone(510,.075,'sine',0,.08,390);
    else if (name === 'resume') tone(390,.075,'sine',0,.08,590);
    else if (name === 'start') { tone(470,.10,'triangle',0,.09,650); tone(670,.13,'sine',.09,.10,880); }
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
    renderButton();
  });
  renderButton();
  window.VladiSound = { play, get muted() { return muted; } };
})();
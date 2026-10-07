(() => {
  'use strict';
  const KEY = 'vladiArcadeMuted';
  const track = new Audio(window.VladiMusicSource || '');
  track.loop = true;
  track.preload = 'none';
  track.volume = 0.07;
  let muted = false, started = false, userPaused = false, autoPaused = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (_) {}
  track.muted = muted;
  function syncState(state) {
    document.documentElement.setAttribute('data-vladi-music-state', state || (!started ? 'stopped' : userPaused ? 'paused' : track.paused ? 'stopped' : muted ? 'muted' : 'playing'));
  }
  function play() {
    if (!started || userPaused || !track.src) return;
    syncState('loading');
    const result = track.play();
    if (result && result.then) result.then(() => syncState(), () => syncState('blocked'));
    else syncState();
  }
  function start() {
    started = true;
    userPaused = false;
    play();
  }
  function pause() {
    if (!started) return;
    userPaused = true;
    track.pause();
    syncState();
  }
  function resume() {
    if (!started) return;
    userPaused = false;
    play();
  }
  function toggleMute() {
    muted = !muted;
    track.muted = muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (_) {}
    syncState();
  }
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-sound-toggle], #sound, #soundBtn')) {
      toggleMute();
      return;
    }
    const button = target.closest('button');
    if (button && (button.id === 'pause' || button.id === 'pauseBtn')) {
      const label = (button.getAttribute('aria-label') || '') + ' ' + (button.textContent || '');
      if (/▶|play|resume|continuar|reanudar/i.test(label)) resume(); else pause();
      return;
    }
    if (!started || userPaused) start();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' || event.code === 'KeyP' || event.key?.toLowerCase() === 'p') {
      if (userPaused) resume(); else pause();
      return;
    }
    if (!started && (event.code === 'Enter' || event.code === 'Space')) start();
    else if (started && userPaused && (event.code === 'Enter' || event.code === 'Space')) resume();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      autoPaused = started && !track.paused;
      if (autoPaused) track.pause();
    } else if (autoPaused && !userPaused) {
      autoPaused = false;
      play();
    }
  });
  window.VladiMusic = { start, pause, resume, get muted() { return muted; }, get playing() { return !track.paused; } };
  syncState();
})();
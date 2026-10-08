(() => {
  const rate = 11025, seconds = 8, count = rate * seconds;
  const samples = new Float32Array(count);
  const path = location.pathname;
  const tracks = {
    secuencias: {
      melody: [523,659,784,988,784,659,587,698,880,1046,880,698,659,784,988,784],
      chords: [[261.63,329.63,392],[349.23,440,523.25],[220,261.63,329.63],[392,493.88,587.33]], bass: .5
    },
    cambios: {
      melody: [392,0,523,659,0,587,494,0,392,0,587,698,0,659,523,0],
      chords: [[196,246.94,293.66],[220,261.63,329.63],[261.63,329.63,392],[220,293.66,349.23]], bass: .5
    },
    historias: {
      melody: [392,440,523,587,659,587,523,440,392,523,587,659,784,659,587,523],
      chords: [[196,246.94,293.66],[261.63,329.63,392],[293.66,369.99,440],[164.81,196,246.94]], bass: .5
    }
  };
  const key = path.includes("secuencias") ? "secuencias" : path.includes("cambios") ? "cambios" : "historias";
  const track = tracks[key];
  const add = (freq, start, duration, volume, pad = false) => {
    const begin = Math.floor(start * rate), end = Math.min(count, Math.floor((start + duration) * rate));
    for (let i = begin; i < end; i++) {
      const t = (i - begin) / rate;
      const attack = Math.min(1, t / (pad ? .1 : .014));
      const release = Math.min(1, (duration - t) / (pad ? .14 : .06));
      const env = pad ? 1 : Math.exp(-3.4 * t / duration);
      const tone = Math.sin(2 * Math.PI * freq * t) + (pad ? 0 : .2 * Math.sin(2 * Math.PI * freq * 2.01 * t));
      samples[i] += tone * volume * attack * release * env;
    }
  };
  for (let bar = 0; bar < 4; bar++) {
    for (const hz of track.chords[bar]) add(hz, bar * 2, 1.98, .033, true);
    add(track.chords[bar][0] * track.bass, bar * 2, 1.9, .035, true);
  }
  track.melody.forEach((hz, i) => { if (hz) add(hz, i * .5 + .06, .27, key === "cambios" ? .125 : .14); });
  const wav = new Uint8Array(44 + count), view = new DataView(wav.buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i++) wav[offset + i] = value.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + count, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  write(36, "data"); view.setUint32(40, count, true);
  for (let i = 0; i < count; i++) {
    const fade = Math.min(1, i / (rate * .04), (count - i) / (rate * .12));
    wav[44 + i] = Math.round(128 + Math.max(-.8, Math.min(.8, samples[i] * fade)) * 125);
  }
  let binary = "";
  for (let i = 0; i < wav.length; i += 0x4000) binary += String.fromCharCode(...wav.subarray(i, Math.min(i + 0x4000, wav.length)));
  window.VladiMusicSource = "data:audio/wav;base64," + btoa(binary);
})();
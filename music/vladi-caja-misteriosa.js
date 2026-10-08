(() => {
  const rate = 11025, seconds = 8, count = rate * seconds;
  const samples = new Float32Array(count);
  const add = (freq, start, duration, volume, kind = "pluck") => {
    const begin = Math.floor(start * rate), end = Math.min(count, Math.floor((start + duration) * rate));
    for (let i = begin; i < end; i++) {
      const t = (i - begin) / rate;
      const attack = Math.min(1, t / 0.015);
      const release = Math.min(1, (duration - t) / (kind === "pad" ? 0.14 : 0.07));
      const envelope = kind === "pad" ? Math.min(1, t / 0.12) : Math.exp(-3.5 * t / duration);
      const fundamental = Math.sin(2 * Math.PI * freq * t);
      const overtone = kind === "pad" ? 0 : 0.24 * Math.sin(2 * Math.PI * freq * 2.01 * t);
      samples[i] += (fundamental + overtone) * volume * attack * release * envelope;
    }
  };
  const chords = [[261.63, 392, 523.25], [293.66, 440, 587.33], [220, 329.63, 440], [246.94, 370, 493.88]];
  for (let bar = 0; bar < 4; bar++) {
    for (const hz of chords[bar]) add(hz, bar * 2, 2, 0.035, "pad");
    add(chords[bar][0] / 2, bar * 2, 1.9, 0.04, "pad");
  }
  const melody = [523, 0, 659, 784, 659, 0, 587, 523, 0, 659, 880, 784, 587, 0, 659, 523];
  melody.forEach((hz, i) => { if (hz) add(hz, i * 0.5 + 0.06, 0.28, 0.14); });
  [392, 0, 440, 0, 329.63, 0, 392, 0, 349.23, 0, 440, 0, 392, 0, 329.63, 0].forEach((hz, i) => {
    if (hz) add(hz, i * 0.5 + 0.27, 0.16, 0.055);
  });
  const wav = new Uint8Array(44 + count), view = new DataView(wav.buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i++) wav[offset + i] = value.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + count, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  write(36, "data"); view.setUint32(40, count, true);
  for (let i = 0; i < count; i++) {
    const fade = Math.min(1, i / (rate * 0.04), (count - i) / (rate * 0.12));
    wav[44 + i] = Math.round(128 + Math.max(-0.8, Math.min(0.8, samples[i] * fade)) * 125);
  }
  let binary = "";
  for (let i = 0; i < wav.length; i += 0x4000) binary += String.fromCharCode(...wav.subarray(i, Math.min(i + 0x4000, wav.length)));
  window.VladiMusicSource = "data:audio/wav;base64," + btoa(binary);
})();
(() => {
  const rate=11025, seconds=8, count=rate*seconds, samples=new Float32Array(count);
  const add=(freq,start,duration,volume,type)=>{
    const begin=Math.floor(start*rate), end=Math.min(count,Math.floor((start+duration)*rate));
    for(let i=begin;i<end;i++){
      const t=(i-begin)/rate, progress=t/duration;
      const attack=Math.min(1,t/.018), release=Math.min(1,(duration-t)/.045);
      const env=type==="pad"?Math.min(1,t/.08)*Math.min(1,(duration-t)/.12):Math.exp(-4.2*progress);
      const wave=Math.sin(2*Math.PI*freq*t);
      samples[i]+=wave*volume*attack*release*env;
    }
  };
  const chords=[[261.63,329.63,392],[349.23,440,523.25],[220,261.63,329.63],[392,493.88,587.33]];
  for(let bar=0;bar<4;bar++){
    for(const hz of chords[bar]) add(hz,bar*2,2,.055,"pad");
    add(chords[bar][0]/2,bar*2,1.8,.075,"pad");
  }
  const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,987.77,783.99,659.25,523.25];
  for(let i=0;i<32;i++) add(melody[i%melody.length],i*.25,.2,.18,"pluck");
  for(let i=0;i<16;i++) add(392+(i%4)*65.4,i*.5,.09,.075,"pluck");
  const wav=new Uint8Array(44+count);
  const view=new DataView(wav.buffer);
  const write=(offset,text)=>{for(let i=0;i<text.length;i++)wav[offset+i]=text.charCodeAt(i)};
  write(0,"RIFF");view.setUint32(4,36+count,true);write(8,"WAVE");write(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate,true);view.setUint16(32,1,true);view.setUint16(34,8,true);write(36,"data");view.setUint32(40,count,true);
  for(let i=0;i<count;i++){
    const fade=Math.min(1,i/(rate*.03),(count-i)/(rate*.08));
    const value=Math.max(-.85,Math.min(.85,samples[i]*fade));
    wav[44+i]=Math.round(128+value*125);
  }
  let binary="";
  for(let i=0;i<wav.length;i+=0x4000) binary+=String.fromCharCode(...wav.subarray(i,Math.min(i+0x4000,wav.length)));
  window.VladiMusicSource="data:audio/wav;base64,"+btoa(binary);
})();
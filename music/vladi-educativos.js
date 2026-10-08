(() => {
  const rate=11025, seconds=8, count=rate*seconds, samples=new Float32Array(count);
  const path=location.pathname;
  const melodies={
    math:[523,659,784,659,587,698,880,784,523,659,784,988,880,784,659,523],
    match:[392,523,587,784,659,523,440,587,698,880,784,659,523,659,784,587],
    colors:[523,587,659,784,880,784,659,587,523,659,784,880,988,880,784,659]
  };
  const melody=path.includes("matematicas")?melodies.math:path.includes("unir-parejas")?melodies.match:melodies.colors;
  const chords=[[261.63,329.63,392],[349.23,440,523.25],[220,261.63,329.63],[392,493.88,587.33]];
  const add=(freq,start,duration,volume,type)=>{
    const begin=Math.floor(start*rate),end=Math.min(count,Math.floor((start+duration)*rate));
    for(let i=begin;i<end;i++){
      const t=(i-begin)/rate,progress=t/duration,attack=Math.min(1,t/.018),release=Math.min(1,(duration-t)/.05);
      const env=type==="pad"?Math.min(1,t/.08)*Math.min(1,(duration-t)/.12):Math.exp(-4*progress);
      samples[i]+=Math.sin(2*Math.PI*freq*t)*volume*attack*release*env;
    }
  };
  for(let bar=0;bar<4;bar++){
    for(const hz of chords[bar])add(hz,bar*2,2,.05,"pad");
    add(chords[bar][0]/2,bar*2,1.9,.065,"pad");
  }
  for(let i=0;i<32;i++)add(melody[i%melody.length],i*.25,.2,.17,"pluck");
  for(let i=0;i<16;i++)add(melody[(i*2+3)%melody.length]/2,i*.5,.11,.06,"pluck");
  const wav=new Uint8Array(44+count),view=new DataView(wav.buffer);
  const write=(offset,text)=>{for(let i=0;i<text.length;i++)wav[offset+i]=text.charCodeAt(i)};
  write(0,"RIFF");view.setUint32(4,36+count,true);write(8,"WAVE");write(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate,true);view.setUint16(32,1,true);view.setUint16(34,8,true);write(36,"data");view.setUint32(40,count,true);
  for(let i=0;i<count;i++){const fade=Math.min(1,i/(rate*.03),(count-i)/(rate*.08));wav[44+i]=Math.round(128+Math.max(-.85,Math.min(.85,samples[i]*fade))*125)}
  let binary="";for(let i=0;i<wav.length;i+=0x4000)binary+=String.fromCharCode(...wav.subarray(i,Math.min(i+0x4000,wav.length)));
  window.VladiMusicSource="data:audio/wav;base64,"+btoa(binary);
})();
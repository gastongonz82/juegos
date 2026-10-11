import numpy as np, wave, subprocess
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'assets/audio';out.mkdir(parents=True,exist_ok=True)
sr=22050; beat=60/112;length=32*2*beat;x=np.zeros(int(sr*(length+.2)),np.float64)
def note(midi,start,dur,amp=.1,kind='reed'):
 global x
 n=int(sr*dur);t=np.arange(n)/sr;f=440*2**((midi-69)/12)
 if kind=='reed':
  phase=2*np.pi*f*t+.011*np.sin(2*np.pi*5.4*t)
  y=sum(np.sin(phase*k)/k**1.4 for k in range(1,9));env=np.minimum(t/.028,1)*np.minimum((dur-t)/.085,1)*(1+.03*np.sin(2*np.pi*4*t))
 elif kind=='piano':
  y=np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2.002*t)+.18*np.sin(2*np.pi*f*3.001*t);env=np.minimum(t/.008,1)*np.exp(-t*7)*np.minimum((dur-t)/.025,1)
 else:
  y=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t);env=np.minimum(t/.009,1)*np.exp(-t*6)*np.minimum((dur-t)/.03,1)
 i=int(start*sr);end=min(len(x),i+n);x[i:end]+=amp*y[:end-i]*env[:end-i]
# Original 32-bar tango miniature, D minor, 2/4. Habanera and marcato bass.
chords=[(50,[62,65,69]),(57,[61,64,67]),(50,[62,65,69]),(55,[62,67,70]),(48,[60,64,67]),(53,[60,65,69]),(57,[61,64,67]),(50,[62,65,69])]
melodies=[[(69,0,.75),(70,.75,.25),(69,1,.5),(65,1.5,.5)],[(67,0,.5),(64,.5,.5),(61,1,.5),(64,1.5,.5)],[(65,0,.75),(64,.75,.25),(62,1,1)],[(67,0,.5),(69,.5,.5),(70,1,.75),(69,1.75,.25)],[(67,0,.75),(64,.75,.25),(60,1,.5),(64,1.5,.5)],[(65,0,.5),(69,.5,.5),(72,1,.75),(69,1.75,.25)],[(70,0,.5),(69,.5,.5),(67,1,.5),(61,1.5,.5)],[(62,0,1.5),(65,1.5,.5)]]
for bar in range(32):
 base,cs=chords[bar%8];st=bar*2*beat
 for off in [0,.75,1,1.5]:note(base+(12 if off==1 else 0),st+off*beat,.24,.12,'bass')
 for off in [.5,1.5]:
  for c in cs:note(c,st+off*beat,.22,.045,'piano')
 for m,off,d in melodies[bar%8]:note(m+(12 if 16<=bar<24 else 0),st+off*beat,d*beat*.9,.06,'reed')
 # sparse piano reply
 if bar%2==1:note(cs[-1]+12,st+1.75*beat,.12,.035,'piano')
x=x[:int(length*sr)];x/=max(1,np.max(abs(x))/.78)
# Short room echo; stereo, smooth loop boundaries.
l=np.copy(x);r=np.copy(x);delay=int(.028*sr);r[delay:]+=.13*x[:-delay];r[:delay]+=.13*x[-delay:]
stereo=np.column_stack([l,r]);stereo[:220]*=np.linspace(0,1,220)[:,None];stereo[-220:]*=np.linspace(1,0,220)[:,None]
with wave.open('/tmp/tango.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((stereo*29000).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/tango.wav','-b:a','112k',str(out/'tango-pulperia.mp3')],check=True)
rng=np.random.default_rng(1978)
for name,dur in [('card',.16),('shuffle',.55),('win',.8)]:
 t=np.arange(int(sr*dur))/sr
 if name=='win':y=sum(np.sin(2*np.pi*f*t)*.14*np.exp(-t*3) for f in [587.33,739.99,880])
 else:
  noise=rng.normal(0,1,len(t));noise=noise-np.roll(noise,1);env=np.sin(np.pi*t/dur)**2*np.exp(-t*7);y=noise*env*.13
  if name=='shuffle':y*=.4+.6*np.sin(t*2*np.pi*17)**2
 with wave.open(str(out/(name+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(y,-1,1)*28000).astype('<i2').tobytes())
print('Original tango and card sounds saved')

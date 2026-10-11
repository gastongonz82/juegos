import {TrucoGame,aiDecision,ENVIDOS,TRUCOS,envido,key,fullDeck} from './engine.js';
const $=id=>document.getElementById(id);
const dialogs=[$('welcome'),$('settings'),$('rules')];
const defaults={music:25,voice:85,fx:75,theme:'classic',target:30,difficulty:'normal',flor:false,falta:'partido'};
let prefs={...defaults};try{prefs={...defaults,...JSON.parse(localStorage.getItem('vladi-truco-settings-v2')||'{}')};}catch{}
let game=null,selected=null,busy=false,aiTimer=null,generation=0,shownEvent=0,returnFocus=null,finishQueued=false;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const savePrefs=()=>{try{localStorage.setItem('vladi-truco-settings-v2',JSON.stringify(prefs));}catch{}};
const paused=()=>dialogs.some(d=>d.open)||document.hidden;
const sound={music:new Audio('assets/audio/tango-pulperia.mp3'),fx:{},unlocked:false,lastMusic:prefs.music||25,lastVoice:prefs.voice||85};
sound.music.loop=true;sound.music.preload='none';
for(const name of ['card','shuffle','win'])sound.fx[name]=new Audio(`assets/audio/${name}.wav`);
function audioUnlock(){sound.unlocked=true;updateAudio();}
function updateAudio(){sound.music.volume=prefs.music/100*.6;if(sound.unlocked&&prefs.music&&!paused())sound.music.play().catch(()=>{});else sound.music.pause();for(const [name]of Object.entries(sound.fx))sound.fx[name].volume=prefs.fx/100*.6;
 $('musicToggle').classList.toggle('muted',prefs.music===0);$('voiceToggle').classList.toggle('muted',prefs.voice===0);$('musicToggle').setAttribute('aria-label',prefs.music?'Silenciar música':'Activar música');$('voiceToggle').setAttribute('aria-label',prefs.voice?'Silenciar voces':'Activar voces');
 for(const name of ['music','voice','fx']){$(`${name}Volume`).value=prefs[name];$(`${name}Output`).textContent=prefs[name]+'%';}savePrefs();}
function effect(name){if(!prefs.fx||!sound.unlocked)return;const a=sound.fx[name];a.currentTime=0;a.play().catch(()=>{});}
function getArgentineVoice(){const vs=window.speechSynthesis?.getVoices()||[];return vs.find(v=>v.lang.toLowerCase().replace('_','-')==='es-ar')||null;}
function voiceStatus(){$('voiceStatus').textContent='Cantos argentinos grabados · voz Tomás (es-AR).';}
function synthFallback(text){if(!prefs.voice||!sound.unlocked||paused()||!window.speechSynthesis)return;const synth=window.speechSynthesis;synth.cancel();const u=new SpeechSynthesisUtterance(text.replace(/[¡!]/g,''));u.lang='es-AR';u.rate=.96;u.pitch=.85;u.volume=prefs.voice/100;const v=getArgentineVoice()||synth.getVoices().find(v=>v.lang.startsWith('es'));if(v)u.voice=v;synth.speak(u);}
const voiceFiles={'¡Truco!':'truco','¡Retruco!':'retruco','¡Vale cuatro!':'vale-cuatro','¡Envido!':'envido','¡Real envido!':'real-envido','¡Falta envido!':'falta-envido','¡Flor!':'flor','¡Contraflor!':'contraflor','¡Contraflor al resto!':'contraflor-al-resto','¡Quiero!':'quiero','¡No quiero!':'no-quiero','¡Quiero retruco!':'quiero-retruco','¡Quiero vale cuatro!':'quiero-vale-cuatro','¡Con flor quiero!':'con-flor-quiero','Con flor me achico.':'con-flor-me-achico','Son buenas.':'son-buenas','¡Es tu mano, che!':'tu-mano','Salgo yo, paisano.':'salgo','La baza es mía. Salgo yo.':'baza','¡Buen partido, paisano!':'partido'};
let voiceToken=0,currentVoice=null;
function stopVoice(){voiceToken++;if(currentVoice){currentVoice.pause();currentVoice=null;}window.speechSynthesis?.cancel();}
function speak(text){
 if(!prefs.voice||!sound.unlocked||paused())return;
 stopVoice();const token=voiceToken;let files=[];
 if(voiceFiles[text])files=[voiceFiles[text]];else {const match=text.match(/^(\d+) (tantos\.|son mejores\.)$/);if(match&&+match[1]<=38)files=[`numero-${match[1]}`,match[2].startsWith('tantos')?'tantos':'son-mejores'];}
 if(!files.length){synthFallback(text);return;}
 const next=()=>{if(token!==voiceToken||paused()||!prefs.voice)return;const f=files.shift();if(!f){currentVoice=null;return;}currentVoice=new Audio(`assets/audio/voices/${f}.mp3`);currentVoice.volume=prefs.voice/100;currentVoice.onended=next;currentVoice.onerror=()=>synthFallback(text);currentVoice.play().catch(()=>synthFallback(text));};next();
}
if(window.speechSynthesis){window.speechSynthesis.addEventListener('voiceschanged',voiceStatus);window.speechSynthesis.getVoices();}voiceStatus();
function setTheme(theme){prefs.theme=theme;document.body.classList.toggle('premium',theme==='premium');$('theme').value=theme;$('game').setAttribute('data-table',theme);$('tableButton').title=theme==='classic'?'Cambiar a VLADYERIK premium':'Cambiar a clásica argentina';savePrefs();}
setTheme(prefs.theme);updateAudio();
$('length').value=prefs.target;$('difficulty').value=prefs.difficulty;$('flor').checked=prefs.flor;$('falta').value=prefs.falta;
function openDialog(id){returnFocus=document.activeElement;clearTimeout(aiTimer);$(id).showModal();document.body.classList.add('paused');updateAudio();stopVoice();if(id==='settings')voiceStatus();}
function closeDialog(id){$(id).close();if(!paused())document.body.classList.remove('paused');updateAudio();if(game&&game.state.hand)render();returnFocus?.focus?.();scheduleAI();}
for(const d of dialogs){d.addEventListener('cancel',e=>{e.preventDefault();if(d.id!=='welcome')closeDialog(d.id);});d.addEventListener('click',e=>{if(e.target===d&&d.id!=='welcome')closeDialog(d.id);});}
for(const el of document.querySelectorAll('[data-close]'))el.onclick=()=>closeDialog(el.dataset.close);
$('resume').onclick=()=>closeDialog('settings');$('closeRules').onclick=()=>closeDialog('rules');
for(const id of ['menu','settingsButton'])$(id).onclick=()=>openDialog('settings');
$('rulesButton').onclick=()=>{updateRuleText();openDialog('rules');};
$('tableButton').onclick=()=>{setTheme(prefs.theme==='classic'?'premium':'classic');};$('theme').onchange=e=>setTheme(e.target.value);
$('musicToggle').onclick=()=>{audioUnlock();if(prefs.music){sound.lastMusic=prefs.music;prefs.music=0;}else prefs.music=sound.lastMusic;updateAudio();};
$('voiceToggle').onclick=()=>{if(prefs.voice){sound.lastVoice=prefs.voice;prefs.voice=0;stopVoice();}else prefs.voice=sound.lastVoice;updateAudio();};
for(const name of ['music','voice','fx'])$(`${name}Volume`).oninput=e=>{prefs[name]=+e.target.value;updateAudio();if(name==='voice'){if(currentVoice)currentVoice.volume=prefs.voice/100;if(!prefs.voice)stopVoice();}};
// Fullscreen the document so dialogs remain inside its top layer.
$('fullScreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('voiceStatus').textContent='Este navegador no habilita pantalla completa. La mesa sigue disponible.';}};
$('newGame').onclick=()=>{closeDialog('settings');openDialog('welcome');$('welcomeTitle').innerHTML='VLADI <strong>TRUCO</strong>';$('welcomeText').innerHTML='Una nueva mesa, una nueva oportunidad.<br>Elegí tus reglas y empezá de nuevo.';$('begin').textContent='NUEVA PARTIDA';};
function updateRuleText(){const s=game?.state||prefs;$('faltaRule').textContent=s.falta==='resto'?`Esta mesa usa siempre lo que le falta al puntero para ${s.target} puntos. Una falta querida reemplaza los cantos anteriores; una falta rechazada concede lo acumulado antes de ella.`:s.target===15?'Esta mesa juega a 15: la falta querida vale lo que le falta al puntero para 15. No hay división en malas y buenas.':'Esta mesa juega a 30: si ambos están en malas (menos de 15), la falta querida vale el partido. Si alguno llegó a buenas, vale lo que le falta al puntero para 30. Esta variante se elige antes de empezar.';}
function tally(node,total,target){const count=total>=target?Math.min(15,total):target===30&&total>=15?total-15:total;node.replaceChildren();for(let offset=0;offset<count;offset+=5){const n=Math.min(5,count-offset);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 22 22');svg.setAttribute('aria-hidden','true');const paths=['M3 18L3 3','M3 3L18 3','M18 3L18 18','M18 18L3 18','M1 20L20 1'];for(let i=0;i<n;i++){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',paths[i]);svg.append(p);}node.append(svg);}}
function cardElement(c,p,back=false,hand=false,index=0){const el=document.createElement(hand&&p===0?'button':'div');el.className='card';el.dataset.key=key(c);el.dataset.owner=p;
 const name=`${c.n} de ${c.s==='espada'?'espadas':c.s==='basto'?'bastos':c.s==='oro'?'oros':'copas'}`;
 if(hand&&p===0){el.type='button';el.setAttribute('aria-label',`Elegir ${name}`);el.setAttribute('aria-pressed',String(selected===key(c)));el.title=`${index+1} · ${name}`;el.onclick=()=>choose(key(c));el.disabled=busy||paused()||!game.actions(0).includes('Jugar carta');if(selected===key(c))el.classList.add('selected');}
 const img=document.createElement('img');img.src=`assets/cards/${back?'back':key(c)}.webp?v=20261011-premium`;img.alt=back?'Carta oculta de Don Truco':name;img.draggable=false;el.append(img);return el;}
function choose(k){if(busy||paused()||!game?.actions(0).includes('Jugar carta'))return;selected=selected===k?null:k;render();}
function positions(){const m=new Map();document.querySelectorAll('.playfield .card').forEach(el=>m.set(el.dataset.key,el.getBoundingClientRect()));return m;}
function render({old=null,deal=false}={}){if(!game)return [];const s=game.state,acts=game.actions(0),animations=[];
 $('humanScore').textContent=s.scores[0];$('aiScore').textContent=s.scores[1];$('playerPoints').textContent=s.scores[0];$('donPoints').textContent=s.scores[1];$('target').textContent=`A ${s.target} PUNTOS`;
 tally($('humanTallies'),s.scores[0],s.target);tally($('aiTallies'),s.scores[1],s.target);
 $('rivalLevel').textContent=`${{easy:'APRENDIZ',normal:'PAISANO',hard:'TAITA'}[s.difficulty]} · ${s.target} PUNTOS`;
 $('handLabel').textContent=`MANO ${s.hand} · ${s.mano===0?'SOS MANO':'DON ES MANO'}`;$('trucoLabel').textContent=`${s.truco} ${s.truco===1?'TANTO':'TANTOS'} EN JUEGO`;
 $('envidoHint').textContent=`Tenés ${envido(s.original[0])} de envido`;$('donStatus').textContent=s.phase==='playing'?(s.turn===1?'Pensando…':'Te mira jugar'):s.winner===1?'Ganó la mano':'Buena mano';
 $('trickMarks').replaceChildren(...[0,1,2].map(i=>{const el=document.createElement('span');el.className='trick-mark '+(s.tricks[i]===0?'human':s.tricks[i]===1?'ai':'');el.textContent=s.tricks[i]===0?'V':s.tricks[i]===1?'D':s.tricks[i]===-1?'=':i+1;return el;}));
 if(!s.hands[0].some(c=>key(c)===selected))selected=null;
 $('mine').replaceChildren(...s.hands[0].map((c,i)=>cardElement(c,0,false,true,i)));
 $('opponent').replaceChildren(...s.hands[1].map((c,i)=>cardElement(c,1,!s.showdown,true,i)));
 $('played').replaceChildren(...[0,1,2].filter(i=>s.played[0][i]||s.played[1][i]).map(i=>{const pair=document.createElement('div');pair.className='trick-pair '+(s.tricks[i]!==undefined?'done':'current');pair.dataset.result=s.tricks[i]===0?'VOS':s.tricks[i]===1?'DON':s.tricks[i]===-1?'PARDA':'';for(const p of [1,0])if(s.played[p][i]){const el=cardElement(s.played[p][i],p);el.classList.add(p===0?'human':'ai');pair.append(el);}return pair;}));
 $('calls').replaceChildren();$('calls').classList.toggle('responding',!!s.pending);
 const labels=s.pending?acts.filter(a=>a!=='Jugar carta'&&a!=='Ir al mazo'):['Truco','Retruco','Vale cuatro',...ENVIDOS,'Flor'];
 for(const label of labels){const b=document.createElement('button');b.textContent=label;b.dataset.action=label;b.disabled=busy||paused()||!acts.includes(label);b.className=ENVIDOS.includes(label)?'envido':label.includes('flor')||label==='Flor'?'flor':label.includes('Quiero')?'response':'';b.onclick=()=>perform(()=>game.act(0,label));$('calls').append(b);}
 $('playButton').disabled=busy||paused()||!selected||!acts.includes('Jugar carta');$('foldButton').disabled=busy||paused()||!acts.includes('Ir al mazo');
 if(s.phase==='handOver'){$('calls').replaceChildren();const b=document.createElement('button');b.className='response';b.textContent='SIGUIENTE MANO';b.id='nextHand';b.disabled=busy;b.onclick=dealHand;$('calls').append(b);$('handHint').textContent='Los tantos están anotados. Repartí cuando quieras.';}
 else $('handHint').textContent=s.pending?(s.pending.to===1?'Don Truco está respondiendo':`Respondé ${s.pending.kind==='truco'?TRUCOS[s.pending.level]:s.pending.kind==='flor'?'la flor':'el envido'}`):s.turn===0?(selected?'Carta elegida · tocá JUGAR CARTA':acts.includes('Flor')?'Tenés flor · cantala antes de jugar':'Elegí una carta · teclas 1, 2 y 3'):'Don Truco está jugando';
 const news=s.log.filter(e=>e.id>shownEvent);if(news.length){shownEvent=s.event;const last=news.at(-1);$('notice').textContent=last.text;const spoken=news.filter(e=>e.speaker!==null).at(-1);if(spoken){$('speech').textContent=(spoken.speaker===0?'Vos: ':'')+spoken.text;speak(spoken.text);}}
 if(s.phase==='matchOver'&&!$('welcome').open&&!finishQueued){finishQueued=true;effect('win');generation++;clearTimeout(aiTimer);$('welcomeTitle').innerHTML=s.winner===0?'¡GANASTE! <strong>PAISANO</strong>':'DON TRUCO <strong>GANÓ</strong>';$('welcomeText').textContent=`Resultado final: ${s.scores[0]} a ${s.scores[1]}. ${s.winner===0?'¡Linda partida, che!':'¿Te animás a la revancha?'}`;$('begin').textContent='JUGAR LA REVANCHA';setTimeout(()=>{if(game?.state===s&&s.phase==='matchOver'&&!$('welcome').open)openDialog('welcome');},1000);}
 if((old||deal)&&!reduced){const deck=$('game').querySelector('.deck').getBoundingClientRect();document.querySelectorAll('.playfield .card').forEach((el,i)=>{const r=el.getBoundingClientRect(),prev=deal?deck:old.get(el.dataset.key);if(!prev)return;const dx=prev.left-r.left,dy=prev.top-r.top;if(Math.abs(dx)+Math.abs(dy)<3&&!deal)return;const base=getComputedStyle(el).transform==='none'?'':getComputedStyle(el).transform;const a=el.animate([{transform:`translate(${dx}px,${dy}px) scale(${prev.width/r.width},${prev.height/r.height}) ${base}`,opacity:deal?0:1},{transform:base||'none',opacity:1}],{duration:deal?470:360,delay:deal?i*95:0,easing:'cubic-bezier(.18,.75,.3,1)',fill:'backwards'});animations.push(a.finished.catch(()=>{}));});}
 return animations;
}
async function perform(fn){if(busy||paused()||!game)return;clearTimeout(aiTimer);const token=generation,old=positions();busy=true;const ok=fn();if(!ok){busy=false;render();scheduleAI();return;}
 effect('card');const animations=render({old});await Promise.all(animations);if(token!==generation)return;busy=false;render();scheduleAI();}
async function dealHand(){if(busy||paused()||!game)return;const token=++generation;clearTimeout(aiTimer);busy=true;selected=null;
 if(game.state.phase==='handOver'&&!reduced){const deck=$('game').querySelector('.deck').getBoundingClientRect();const cards=[...document.querySelectorAll('.playfield .card')];await Promise.all(cards.map(el=>{const r=el.getBoundingClientRect();return el.animate([{transform:getComputedStyle(el).transform,opacity:1},{transform:`translate(${deck.left-r.left}px,${deck.top-r.top}px) scale(.3)`,opacity:0}],{duration:310,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});}));}
 if(token!==generation)return;if(!game.deal()){busy=false;return;}effect('shuffle');await Promise.all(render({deal:true}));if(token!==generation)return;busy=false;render();scheduleAI();}
function scheduleAI(){clearTimeout(aiTimer);if(!game||busy||paused()||game.state.phase!=='playing'||!game.actions(1).length)return;const token=generation;aiTimer=setTimeout(()=>{if(token!==generation||busy||paused())return;const d=aiDecision(game);if(!d)return;perform(()=>d.action?game.act(1,d.action):game.play(1,d.card));},900);}
$('playButton').onclick=()=>{if(!selected)return;perform(()=>game.play(0,game.state.hands[0].findIndex(c=>key(c)===selected)));};$('foldButton').onclick=()=>perform(()=>game.act(0,'Ir al mazo'));
$('begin').onclick=()=>{prefs.target=+$('length').value;prefs.difficulty=$('difficulty').value;prefs.flor=$('flor').checked;prefs.falta=$('falta').value;setTheme($('theme').value);savePrefs();clearTimeout(aiTimer);generation++;game=new TrucoGame({target:prefs.target,difficulty:prefs.difficulty,flor:prefs.flor,falta:prefs.falta});selected=null;busy=false;shownEvent=0;finishQueued=false;stopVoice();closeDialog('welcome');audioUnlock();dealHand();};
document.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.key==='Escape'&&!paused()){e.preventDefault();openDialog('settings');return;}if(paused()||busy||!game)return;if(['1','2','3'].includes(e.key)){e.preventDefault();const c=game.state.hands[0][+e.key-1];if(c)choose(key(c));}if(e.key==='Enter'&&selected&&!$('playButton').disabled){e.preventDefault();$('playButton').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(aiTimer);sound.music.pause();stopVoice();}else{updateAudio();scheduleAI();}});
window.addEventListener('pagehide',()=>{clearTimeout(aiTimer);sound.music.pause();stopVoice();});
document.querySelector('.command-bar').addEventListener('contextmenu',e=>e.preventDefault());$('mine').addEventListener('contextmenu',e=>e.preventDefault());
// Images are independent assets; prewarm all 40 small card files during idle time.
const warm=()=>{for(const c of fullDeck()){const im=new Image();im.src=`assets/cards/${key(c)}.webp?v=20261011-premium`;}};if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2000});else setTimeout(warm,1000);
openDialog('welcome');

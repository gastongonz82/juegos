/** Argentine Truco, two players. Pure state machine; no DOM or timers. */
export const SUITS=['espada','basto','oro','copa'];
export const NUMBERS=[1,2,3,4,5,6,7,10,11,12];
export const ENVIDOS=['Envido','Real envido','Falta envido'];
export const TRUCOS=['','', 'Truco','Retruco','Vale cuatro'];
export const key=c=>`${c.s}-${c.n}`;
export const fullDeck=()=>SUITS.flatMap(s=>NUMBERS.map(n=>({s,n})));
export function strength(c){return ({'espada-1':14,'basto-1':13,'espada-7':12,'oro-7':11})[key(c)]??({3:10,2:9,1:8,12:7,11:6,10:5,7:4,6:3,5:2,4:1})[c.n];}
export const cardPoints=c=>c.n<8?c.n:0;
export function envido(cards){let best=Math.max(0,...cards.map(cardPoints));for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)if(cards[i].s===cards[j].s)best=Math.max(best,20+cardPoints(cards[i])+cardPoints(cards[j]));return best;}
export const hasFlor=cards=>cards.length===3&&cards.every(c=>c.s===cards[0].s);
export const florValue=cards=>20+cards.reduce((n,c)=>n+cardPoints(c),0);
export function shuffle(cards,rng=Math.random){const d=cards.map(c=>({...c}));for(let i=d.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
export function handWinner(t,mano){if(t.length<2)return null;const [a,b,c]=t;if(a!==-1&&(a===b||b===-1))return a;if(a===-1&&b!==-1)return b;if(t.length<3)return null;if(a===-1&&b===-1)return c===-1?mano:c;return c===-1?a:c;}
export function faltaStake(scores,target,rule='partido'){const lead=Math.max(...scores);return target===30&&lead<15&&rule==='partido'?target:target-lead;}
export function envidoRaises(chain){if(chain.includes('Falta envido'))return [];const out=[];if(!chain.includes('Real envido')&&chain.filter(v=>v==='Envido').length<2)out.push('Envido');if(!chain.includes('Real envido'))out.push('Real envido');out.push('Falta envido');return out;}
export const envidoSum=chain=>chain.reduce((a,v)=>a+(v==='Envido'?2:v==='Real envido'?3:0),0);
export const declinedEnvido=chain=>chain.length===1?1:envidoSum(chain.slice(0,-1));
export class TrucoGame{
 constructor({target=30,flor=false,difficulty='normal',falta='partido',rng=Math.random,mano}={}){
  if(![15,30].includes(target))throw new Error('Objetivo inválido');
  if(!['easy','normal','hard'].includes(difficulty))throw new Error('Dificultad inválida');
  if(!['partido','resto'].includes(falta))throw new Error('Falta envido inválida');
  this.rng=rng;this.s={target,flor,difficulty,falta,scores:[0,0],hand:0,mano:mano??Math.floor(rng()*2),phase:'idle',pending:null,log:[],event:0};
 }
 get state(){return this.s;}
 message(text,speaker=null){this.s.log.push({text,speaker,id:++this.s.event});if(this.s.log.length>60)this.s.log.shift();}
 deal(deck=shuffle(fullDeck(),this.rng)){
  const s=this.s;if(!['idle','handOver'].includes(s.phase))return false;
  if(deck.length<6||new Set(deck.map(key)).size!==deck.length||deck.some(c=>!SUITS.includes(c.s)||!NUMBERS.includes(c.n)))throw new Error('Mazo inválido');
  if(s.hand)s.mano=1-s.mano;s.hand++;
  Object.assign(s,{phase:'playing',turn:s.mano,leader:s.mano,round:0,hands:[[],[]],original:[[],[]],played:[[],[]],tricks:[],pending:null,suspended:null,truco:1,raiseOwner:null,trucoSpoken:[false,false],envidoDone:false,envidoChain:[],florDone:false,showdown:false,winner:null,lastAward:null});
  for(let i=0;i<6;i++){const p=(s.mano+i)%2;s.hands[p].push({...deck[i]});}s.original=s.hands.map(h=>h.map(c=>({...c})));
  this.message(s.mano===0?'¡Es tu mano, che!':'Salgo yo, paisano.',1);return true;
 }
 active(){return this.s.phase==='playing';}
 mustFlor(p){const s=this.s;return this.active()&&s.flor&&!s.florDone&&s.played[p].length===0&&hasFlor(s.original[p]);}
 canEnvido(p){const s=this.s;return this.active()&&!s.envidoDone&&!s.florDone&&s.round===0&&!s.played[p].length&&!s.trucoSpoken[p]&&!this.mustFlor(p)&&(!s.pending||(s.pending.kind==='truco'&&s.pending.level===2&&s.pending.to===p));}
 canTruco(p){const s=this.s;return this.active()&&!s.pending&&s.truco<4&&!this.mustFlor(p)&&(s.raiseOwner===null||s.raiseOwner===p);}
 actions(p){const s=this.s;if(!this.active())return [];const q=s.pending;
  if(q){if(q.to!==p)return [];if(this.mustFlor(p)&&q.kind!=='flor')return ['Flor'];
   if(q.kind==='envido')return ['Quiero','No quiero',...envidoRaises(s.envidoChain)];
   if(q.kind==='flor')return ['Con flor quiero','Con flor me achico',...(q.level===3?['Contraflor','Contraflor al resto']:q.level===6?['Contraflor al resto']:[])];
   return ['Quiero','No quiero',...(q.level<4?[`Quiero ${TRUCOS[q.level+1].toLowerCase()}`]:[]),...(this.canEnvido(p)?ENVIDOS:[])];
  }
  if(s.turn!==p)return [];
  if(this.mustFlor(p))return ['Flor'];
  return ['Jugar carta',...(this.canTruco(p)?[TRUCOS[s.truco+1]]:[]),...(this.canEnvido(p)?ENVIDOS:[]),'Ir al mazo'];
 }
 award(p,n,text){const s=this.s;s.scores[p]+=n;s.lastAward={player:p,points:n};this.message(`${text} · ${p===0?'Vos':'Don Truco'} +${n}`);if(s.scores[p]>=s.target){s.phase='matchOver';s.pending=null;s.suspended=null;s.winner=p;s.showdown=true;this.message(p===0?'¡Ganaste el partido!':'¡Buen partido, paisano!',1);return true;}return false;}
 endHand(p,n,text){const s=this.s;if(!this.active())return false;s.pending=null;s.suspended=null;s.winner=p;s.showdown=true;if(!this.award(p,n,text)){s.phase='handOver';}return true;}
 play(p,index){const s=this.s;if(!this.actions(p).includes('Jugar carta')||!Number.isInteger(index)||!s.hands[p][index])return false;
  const c=s.hands[p].splice(index,1)[0];s.played[p].push(c);this.message(`${p===0?'Vos':'Don Truco'} juega ${c.n} de ${c.s=== 'oro'?'oros':c.s==='copa'?'copas':c.s==='basto'?'bastos':'espadas'}`);
  s.turn=1-p;
  if(s.played[0].length===s.played[1].length){const a=strength(s.played[0].at(-1)),b=strength(s.played[1].at(-1)),winner=a===b?-1:a>b?0:1;s.tricks.push(winner);const w=handWinner(s.tricks,s.mano);if(w!==null){this.endHand(w,s.truco,'Mano terminada');return true;}s.round++;if(winner!==-1)s.leader=winner;s.turn=s.leader;this.message(winner===-1?'Parda. Sale quien salió en la baza anterior.':s.turn===0?'Ganaste la baza. Salís vos.':'La baza es mía. Salgo yo.',winner===1?1:null);}
  return true;
 }
 act(p,label){if(!this.actions(p).includes(label))return false;const s=this.s,q=s.pending;
  if(label==='Jugar carta')return false;
  if(label==='Ir al mazo'){return this.endHand(1-p,s.truco,'Al mazo');}
  if(label==='Flor')return this.callFlor(p);
  if(ENVIDOS.includes(label)){
   if(q?.kind==='envido')s.envidoChain.push(label);else{s.envidoChain=[label];if(q)s.suspended={...q};}
   s.pending={kind:'envido',by:p,to:1-p};this.message(`¡${label}!`,p);return true;
  }
  if(label.startsWith('Contraflor')){s.pending={kind:'flor',by:p,to:1-p,level:label==='Contraflor'?6:'resto'};this.message(`¡${label}!`,p);return true;}
  if(label.startsWith('Quiero ')&&q?.kind==='truco'){s.truco=q.level;s.raiseOwner=p;s.trucoSpoken[p]=true;s.pending={kind:'truco',by:p,to:1-p,level:q.level+1};this.message(`¡${label}!`,p);return true;}
  if(['Quiero','No quiero','Con flor quiero','Con flor me achico'].includes(label))return this.respond(p,!label.includes('No quiero')&&!label.includes('achico'));
  const level=TRUCOS.indexOf(label);if(level>=2){s.pending={kind:'truco',by:p,to:1-p,level};s.trucoSpoken[p]=true;this.message(`¡${label}!`,p);return true;}
  return false;
 }
 callFlor(p){const s=this.s;if(!this.mustFlor(p))return false;this.message('¡Flor!',p);s.envidoDone=true;s.envidoChain=[];
  if(s.pending?.kind==='truco')s.suspended={...s.pending};s.pending=null;
  if(hasFlor(s.original[1-p])){s.pending={kind:'flor',by:p,to:1-p,level:3};}
  else{s.florDone=true;if(!this.award(p,3,'Flor'))this.resume();}return true;
 }
 resume(){const s=this.s;if(!this.active())return;if(s.suspended){s.pending=s.suspended;s.suspended=null;}else s.pending=null;}
 respond(p,yes){const s=this.s,q=s.pending;if(!q||q.to!==p||!this.active())return false;
  if(this.mustFlor(p)&&q.kind!=='flor')return false;
  this.message(yes?(q.kind==='flor'?'¡Con flor quiero!':'¡Quiero!'):q.kind==='flor'?'Con flor me achico.':'¡No quiero!',p);s.pending=null;
  if(q.kind==='truco'){s.trucoSpoken[p]=true;if(!yes){this.endHand(q.by,q.level-1,'Truco no querido');return true;}s.truco=q.level;s.raiseOwner=p;return true;}
  if(q.kind==='envido'){s.envidoDone=true;const v=s.original.map(envido),w=yes?(v[0]===v[1]?s.mano:v[0]>v[1]?0:1):q.by,n=yes?(s.envidoChain.includes('Falta envido')?faltaStake(s.scores,s.target,s.falta):envidoSum(s.envidoChain)):declinedEnvido(s.envidoChain);if(yes){this.message(`${v[s.mano]} tantos.`,s.mano);this.message(v[1-s.mano]>v[s.mano]?`${v[1-s.mano]} son mejores.`:'Son buenas.',1-s.mano);}if(!this.award(w,n,yes?`Envido ${v[0]} a ${v[1]}`:'Envido no querido'))this.resume();return true;}
  if(q.kind==='flor'){s.florDone=true;const v=s.original.map(florValue),w=yes?(v[0]===v[1]?s.mano:v[0]>v[1]?0:1):q.by;const n=yes?(q.level==='resto'?s.target-Math.max(...s.scores)+6:6):4;this.message(yes?`Flores: ${v[0]} a ${v[1]}`:'Flor achicada');if(!this.award(w,n,'Flor'))this.resume();return true;}
  return false;
 }
}
/** AI sees its own hand and public information only. */
export function aiDecision(game,rng=game.rng){const s=game.state,actions=game.actions(1),has=a=>actions.includes(a);if(!actions.length)return null;
 const own=s.hands[1],original=s.original[1],sorted=own.map((c,i)=>({c,i,v:strength(c)})).sort((a,b)=>a.v-b.v),values=sorted.map(x=>x.v),e=envido(original),level=s.difficulty;
 if(has('Flor'))return {action:'Flor'};
 const max=values.at(-1)??0,second=values.at(-2)??0,won=s.tricks[0]===1;
 // Estimate unknown rank distribution from visible cards, never reading opponent hands.
 const visible=new Set([...s.original[1],...s.played[0]].map(key)),unknown=fullDeck().filter(c=>!visible.has(key(c))),beats=v=>unknown.filter(c=>strength(c)<v).length/unknown.length;
 const confidence=won?beats(max):Math.min(.95,.25+beats(max)*.40+beats(second)*.30);
 if(s.pending){const q=s.pending;
  if(q.kind==='envido'){
   if(level!=='easy'&&e>=31){const raise=e>=32&&rng()<.35?'Falta envido':!s.envidoChain.includes('Real envido')?'Real envido':null;if(raise&&has(raise))return {action:raise};}
   const threshold=q.kind==='envido'&&s.envidoChain.includes('Falta envido')?28:level==='easy'?19:24;
   return {action:e>=threshold||rng()<(level==='easy'?.3:.08)?'Quiero':'No quiero'};
  }
  if(q.kind==='flor'){if(level!=='easy'&&florValue(original)>=34&&has('Contraflor al resto'))return {action:'Contraflor al resto'};return {action:florValue(original)>=26?'Con flor quiero':'Con flor me achico'};}
  if(level!=='easy'&&has('Envido')&&e>=27)return {action:e>=32&&has('Real envido')?'Real envido':'Envido'};
  const raise=`Quiero ${TRUCOS[q.level+1]?.toLowerCase()}`;
  if(level!=='easy'&&confidence>.72&&has(raise)&&rng()<.6)return {action:raise};
  return {action:confidence>(q.level===4?.60:q.level===3?.49:.38)||rng()<(level==='easy'?.28:.09)?'Quiero':'No quiero'};
 }
 if(level!=='easy'&&has('Envido')&&e>=27&&rng()<.65)return {action:e>=32&&has('Real envido')?'Real envido':'Envido'};
 const call=TRUCOS[s.truco+1];if(has(call)&&level!=='easy'&&((confidence>.73&&rng()<.65)||(level==='hard'&&rng()<.045)))return {action:call};
 if(!has('Jugar carta'))return null;
 if(level==='easy')return {card:Math.floor(rng()*own.length)};
 const rival=s.played[0].length>s.played[1].length?s.played[0].at(-1):null;
 if(rival){const threshold=strength(rival),winners=sorted.filter(x=>x.v>threshold),ties=sorted.filter(x=>x.v===threshold);
  if(winners.length)return {card:winners[0].i};
  if(ties.length&&(s.round===0||won||s.tricks[0]===-1))return {card:ties[0].i};return {card:sorted[0].i};
 }
 if(level==='hard'){
  // Save the highest card after winning first; open strongly otherwise.
  if(s.round===0)return {card:sorted.at(-1).i};
  if(won&&own.length===2){const low=sorted[0];return {card:beats(low.v)>.55?low.i:sorted.at(-1).i};}
  return {card:sorted.at(-1).i};
 }
 return {card:s.round===0?sorted[Math.floor(sorted.length/2)].i:sorted.at(-1).i};
}

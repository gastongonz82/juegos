import http from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {randomUUID} from 'node:crypto';
const PORT=Number(process.env.PORT||8787);
const ORIGINS=(process.env.ALLOWED_ORIGINS||'http://localhost:8787,http://localhost:5500').split(',').map(s=>s.trim());
const clients=new Map(),matches=new Map(),invites=new Map();
const send=(ws,type,data={})=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type,...data}))};
const safe=s=>String(s||'').trim().slice(0,24).replace(/[<>]/g,'');
const snapshot=()=>[...clients.values()].filter(p=>p.nick).map(({id,nick,match})=>({id,nick,status:match?'playing':'available'}));
const broadcast=()=>{const players=snapshot();for(const p of clients.values())send(p.ws,'presence',{players})};
function fleet(){const ships=[],occupied=new Set();for(const size of [5,4,3,3,2]){let placed=false;for(let tries=0;tries<2000&&!placed;tries++){const r=Math.floor(Math.random()*10),c=Math.floor(Math.random()*10),v=Math.random()<.5,cells=[];for(let i=0;i<size;i++){const rr=r+(v?i:0),cc=c+(v?0:i);if(rr>9||cc>9||occupied.has(rr*10+cc)){cells.length=0;break}cells.push(rr*10+cc)}if(cells.length===size){cells.forEach(k=>occupied.add(k));ships.push(cells);placed=true}}if(!placed)throw Error('fleet placement failed')}return ships}
const gameView=(m,p)=>{const idx=m.ids.indexOf(p.id),op=1-idx,shots=m.shots[idx],enemyShots=m.shots[op];return {matchId:m.id,game:'batalla-naval',turn:m.ids[m.turn]===p.id,finished:m.winner!==null,winner:m.winner===null?null:m.ids[m.winner]===p.id,ownShips:m.fleets[idx],ownShots:[...enemyShots],targetShots:[...shots].map(k=>({cell:k,hit:m.fleets[op].some(s=>s.includes(k))})),opponent:clients.get(m.ids[op])?.nick||'Rival'}};
function notifyMatch(m){for(const id of m.ids){const p=clients.get(id);if(p)send(p.ws,'match_state',gameView(m,p))}}
function cleanup(p){clients.delete(p.id);if(p.match){const m=matches.get(p.match);if(m){for(const id of m.ids){const other=clients.get(id);if(other){other.match=null;send(other.ws,'match_ended',{reason:'Tu rival se desconectó.'})}}matches.delete(m.id)}}for(const [id,i] of invites)if(i.from===p.id||i.to===p.id)invites.delete(id);broadcast()}
const server=http.createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,players:clients.size,matches:matches.size}));return}res.writeHead(404);res.end()});
const wss=new WebSocketServer({server,verifyClient:({origin})=>ORIGINS.includes(origin)});
wss.on('connection',ws=>{const p={id:randomUUID(),nick:'',ws,match:null};clients.set(p.id,p);send(ws,'hello',{id:p.id});ws.on('message',raw=>{if(raw.length>4096)return;let msg;try{msg=JSON.parse(raw)}catch{return}if(!msg||typeof msg.type!=='string')return;
if(msg.type==='join'){const nick=safe(msg.nick);if(nick.length<2)return send(ws,'error',{message:'Elegí un apodo de al menos 2 caracteres.'});p.nick=nick;send(ws,'joined',{id:p.id});broadcast();return}
if(!p.nick)return;
if(msg.type==='invite'){const to=clients.get(msg.to);if(!to||!to.nick||to.id===p.id||p.match||to.match)return send(ws,'error',{message:'El jugador no está disponible.'});if(msg.game!=='batalla-naval')return send(ws,'error',{message:'Este juego todavía no tiene partidas online.'});const id=randomUUID();invites.set(id,{id,from:p.id,to:to.id,game:msg.game,expires:Date.now()+60000});send(to.ws,'invitation',{id,from:p.id,nick:p.nick,game:msg.game});send(ws,'info',{message:'Invitación enviada a '+to.nick});return}
if(msg.type==='respond'){const i=invites.get(msg.id);if(!i||i.to!==p.id)return;invites.delete(i.id);const from=clients.get(i.from);if(!from||from.match||p.match||i.expires<Date.now())return send(ws,'error',{message:'La invitación ya no está disponible.'});if(!msg.accept)return send(from.ws,'info',{message:p.nick+' rechazó la invitación.'});const m={id:randomUUID(),ids:[from.id,p.id],fleets:[fleet(),fleet()],shots:[new Set(),new Set()],turn:Math.floor(Math.random()*2),winner:null};matches.set(m.id,m);from.match=p.match=m.id;notifyMatch(m);broadcast();return}
if(msg.type==='shot'){const m=matches.get(p.match);if(!m||m.winner!==null)return;const idx=m.ids.indexOf(p.id),cell=msg.cell;if(idx!==m.turn||!Number.isInteger(cell)||cell<0||cell>99||m.shots[idx].has(cell))return; m.shots[idx].add(cell);const other=1-idx;const hits=m.fleets[other].every(ship=>ship.every(k=>m.shots[idx].has(k)));if(hits)m.winner=idx;else m.turn=other;notifyMatch(m);return}
if(msg.type==='leave'){if(!p.match)return;const m=matches.get(p.match);if(m){for(const id of m.ids){const other=clients.get(id);if(other){other.match=null;send(other.ws,'match_ended',{reason:id===p.id?'Saliste de la partida.':'Tu rival abandonó la partida.'})}}matches.delete(m.id)}broadcast()}
});ws.on('close',()=>cleanup(p));ws.on('error',()=>{});});
setInterval(()=>{const now=Date.now();for(const [id,i] of invites)if(i.expires<now)invites.delete(id)},15000).unref();
server.listen(PORT,()=>console.log('VLADYERIK online listening on '+PORT));

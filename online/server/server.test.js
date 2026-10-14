import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
import {setTimeout as delay} from 'node:timers/promises';
const port=20000+Math.floor(Math.random()*20000);
const url='ws://127.0.0.1:'+port;
const origin='http://localhost:5500';
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:origin},stdio:'pipe'});
const clients=[];
async function connect(){
 const ws=new WebSocket(url,{origin});clients.push(ws);
 const messages=[],waiters=[];
 ws.on('message',raw=>{const data=JSON.parse(raw);messages.push(data);for(const w of [...waiters])if(w.type===data.type){waiters.splice(waiters.indexOf(w),1);w.resolve(data)}});
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
 return {ws,send:(type,props={})=>ws.send(JSON.stringify({type,...props})),next:(type)=>{const i=messages.findIndex(m=>m.type===type);if(i>=0)return Promise.resolve(messages.splice(i,1)[0]);return Promise.race([new Promise(resolve=>waiters.push({type,resolve})),delay(3000).then(()=>{throw Error('Timeout waiting for '+type)})])}};
}
test('presencia, invitación y partida naval entre dos clientes',{timeout:15000},async()=>{
 try{
 let healthy=false;for(let i=0;i<60;i++){try{const res=await fetch('http://127.0.0.1:'+port+'/health');if(res.ok){healthy=true;break}}catch{}await delay(50)}
 assert.equal(healthy,true,'server starts');
 const a=await connect(),b=await connect();
 const ah=await a.next('hello'),bh=await b.next('hello');
 a.send('join',{nick:'Jugador Uno'});await a.next('joined');
 b.send('join',{nick:'Jugador Dos'});await b.next('joined');
 a.send('invite',{to:bh.id,game:'batalla-naval'});
 const invite=await b.next('invitation');
 assert.equal(invite.nick,'Jugador Uno');
 b.send('respond',{id:invite.id,accept:true});
 const first=await a.next('match_state'),second=await b.next('match_state');
 assert.equal(first.matchId,second.matchId);
 assert.equal(first.ownShips.length,5);
 assert.equal(first.ownShips.flat().length,17);
 assert.equal(first.targetShots.length,0);
 assert.equal(second.targetShots.length,0);
 const attacker=first.turn?a:b,defender=first.turn?b:a;
 attacker.send('shot',{cell:0});
 const update=await attacker.next('match_state');
 const defending=await defender.next('match_state');
 assert.equal(update.targetShots.length,1);
 assert.equal(defending.ownShots.includes(0),true);
 attacker.send('shot',{cell:1});await delay(100);
 defender.send('leave');
 await attacker.next('match_ended');
 }finally{for(const c of clients)c.close();child.kill('SIGTERM')}
});

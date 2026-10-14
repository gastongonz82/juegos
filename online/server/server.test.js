import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
import { setTimeout as delay } from 'node:timers/promises';

const port = 20000 + Math.floor(Math.random() * 20000);
const url = 'ws://127.0.0.1:' + port;
const origin = 'http://localhost:5500';
const child = spawn(process.execPath, ['server.js'], {
  cwd: new URL('.', import.meta.url), env: { ...process.env, PORT: String(port), ALLOWED_ORIGINS: origin }, stdio: 'pipe'
});
const clients = [];

async function connect() {
  const ws = new WebSocket(url, { origin });
  clients.push(ws);
  const messages = [], waiters = [];
  ws.on('message', raw => {
    const data = JSON.parse(raw);
    const index = waiters.findIndex(waiter => waiter.type === data.type && waiter.predicate(data));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(data);
    else messages.push(data);
  });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return {
    send: (type, props = {}) => ws.send(JSON.stringify({ type, ...props })),
    next: (type, predicate = () => true) => {
      const index = messages.findIndex(message => message.type === type && predicate(message));
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return Promise.race([
        new Promise(resolve => waiters.push({ type, predicate, resolve })),
        delay(3000).then(() => { throw Error('Timeout waiting for ' + type); })
      ]);
    }
  };
}

test('public/private rooms, invitation, presence and server-authoritative naval turns', { timeout: 20000 }, async () => {
  try {
    let healthy = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if ((await fetch('http://127.0.0.1:' + port + '/health')).ok) { healthy = true; break; } } catch {}
      await delay(50);
    }
    assert.equal(healthy, true, 'server starts and health endpoint responds');

    const a = await connect(), b = await connect(), c = await connect();
    await Promise.all([a.next('hello'), b.next('hello'), c.next('hello')]);
    a.send('join', { nick: 'Jugador Uno' }); await a.next('joined');
    b.send('join', { nick: 'Jugador Dos' }); await b.next('joined');
    c.send('join', { nick: 'Jugador Tres' }); await c.next('joined');
    const bId = (await a.next('lobby', lobby => lobby.players.some(player => player.nick === 'Jugador Dos'))).players.find(player => player.nick === 'Jugador Dos').id;
    assert.ok(bId);

    a.send('create_room', { game: 'batalla-naval', visibility: 'public' });
    const publicRoom = await a.next('room_created');
    assert.equal(publicRoom.visibility, 'public');
    await b.next('lobby', lobby => lobby.rooms.some(room => room.id === publicRoom.id));
    b.send('join_room', { id: publicRoom.id });
    const [first, second] = await Promise.all([a.next('match_state'), b.next('match_state')]);
    assert.equal(first.matchId, second.matchId);
    assert.equal(first.ownShips.length, 5);
    assert.equal(first.ownShips.flat().length, 17);
    assert.equal(first.targetShots.length, 0);
    assert.equal(second.targetShots.length, 0);

    const attacker = first.turn ? a : b, defender = first.turn ? b : a;
    attacker.send('shot', { cell: 0 });
    const [attackerUpdate, defenderUpdate] = await Promise.all([attacker.next('match_state'), defender.next('match_state')]);
    assert.equal(attackerUpdate.targetShots.length, 1);
    assert.equal(defenderUpdate.ownShots.includes(0), true);
    attacker.send('shot', { cell: 0 });
    await delay(100);
    assert.equal((await fetch('http://127.0.0.1:' + port + '/health')).status, 200, 'duplicate move does not stop server');

    defender.send('leave');
    await Promise.all([attacker.next('match_ended'), defender.next('match_ended')]);
    a.send('create_room', { game: 'batalla-naval', visibility: 'private' });
    const privateRoom = await a.next('room_created');
    assert.equal(privateRoom.visibility, 'private');
    c.send('join_room', { id: privateRoom.id, code: 'incorrecto' });
    assert.match((await c.next('error')).message, /enlace privado/);
    a.send('invite', { to: bId, game: 'batalla-naval' });
    const invitation = await b.next('invitation');
    assert.equal(invitation.nick, 'Jugador Uno');
    b.send('respond', { id: invitation.id, accept: true });
    const [privateA, privateB] = await Promise.all([a.next('match_state'), b.next('match_state')]);
    assert.equal(privateA.matchId, privateB.matchId);
    a.send('leave');
    await Promise.all([a.next('match_ended'), b.next('match_ended')]);
    a.send('create_room', { game: 'batalla-naval', visibility: 'private' });
    const linkRoom = await a.next('room_created');
    c.send('join_room', { id: linkRoom.id, code: linkRoom.code });
    const [linkedA, linkedC] = await Promise.all([a.next('match_state'), c.next('match_state')]);
    assert.equal(linkedA.matchId, linkedC.matchId, 'private room link starts a shared game');
  } finally {
    for (const client of clients) client.close();
    child.kill('SIGTERM');
  }
});

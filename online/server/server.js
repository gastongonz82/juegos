import http from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8787,http://localhost:5500')
  .split(',').map(value => value.trim()).filter(Boolean);
const clients = new Map();
const matches = new Map();
const rooms = new Map();
const invites = new Map();
const send = (ws, type, data = {}) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, ...data }));
};
const safeName = value => String(value || '').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 24);
const publicRooms = () => [...rooms.values()]
  .filter(room => room.visibility === 'public' && room.players.length < 2)
  .map(room => ({ id: room.id, game: room.game, host: clients.get(room.host)?.nick || 'Jugador', players: room.players.length, capacity: 2 }));
const lobbySnapshot = () => {
  const players = [...clients.values()].filter(player => player.nick).map(player => ({
    id: player.id, nick: player.nick,
    status: player.match ? 'playing' : player.room ? 'waiting' : 'available'
  }));
  const openRooms = publicRooms();
  for (const player of clients.values()) send(player.ws, 'lobby', { players, rooms: openRooms });
};

function createFleet() {
  const fleet = [], occupied = new Set();
  for (const size of [5, 4, 3, 3, 2]) {
    let placed = false;
    for (let tries = 0; tries < 2000 && !placed; tries++) {
      const row = Math.floor(Math.random() * 10), col = Math.floor(Math.random() * 10);
      const vertical = Math.random() < .5, cells = [];
      for (let index = 0; index < size; index++) {
        const r = row + (vertical ? index : 0), c = col + (vertical ? 0 : index);
        if (r > 9 || c > 9 || occupied.has(r * 10 + c)) { cells.length = 0; break; }
        cells.push(r * 10 + c);
      }
      if (cells.length === size) { cells.forEach(cell => occupied.add(cell)); fleet.push(cells); placed = true; }
    }
    if (!placed) throw new Error('fleet placement failed');
  }
  return fleet;
}

const gameView = (match, player) => {
  const index = match.ids.indexOf(player.id), opponentIndex = 1 - index;
  return {
    matchId: match.id, game: 'batalla-naval', turn: match.ids[match.turn] === player.id,
    finished: match.winner !== null,
    winner: match.winner === null ? null : match.ids[match.winner] === player.id,
    ownShips: match.fleets[index], ownShots: [...match.shots[opponentIndex]],
    targetShots: [...match.shots[index]].map(cell => ({ cell, hit: match.fleets[opponentIndex].some(ship => ship.includes(cell)) })),
    opponent: clients.get(match.ids[opponentIndex])?.nick || 'Rival'
  };
};
function announceMatch(match) {
  for (const id of match.ids) {
    const player = clients.get(id);
    if (player) send(player.ws, 'match_state', gameView(match, player));
  }
}
function startMatch(room) {
  if (room.players.length !== 2) return;
  const match = {
    id: randomUUID(), ids: [...room.players], fleets: [createFleet(), createFleet()],
    shots: [new Set(), new Set()], turn: Math.floor(Math.random() * 2), winner: null
  };
  matches.set(match.id, match);
  for (const id of match.ids) {
    const player = clients.get(id);
    if (player) { player.room = null; player.match = match.id; }
  }
  rooms.delete(room.id);
  announceMatch(match);
  lobbySnapshot();
}
function leaveRoom(player) {
  if (!player.room) return;
  const room = rooms.get(player.room);
  if (room) {
    room.players = room.players.filter(id => id !== player.id);
    if (!room.players.length) rooms.delete(room.id);
    else {
      room.host = room.players[0];
      const host = clients.get(room.host);
      if (host) send(host.ws, 'info', { message: 'El otro jugador salió de la sala.' });
    }
  }
  player.room = null;
  lobbySnapshot();
}
function leaveMatch(player, reason) {
  if (!player.match) return;
  const match = matches.get(player.match);
  if (match) {
    for (const id of match.ids) {
      const other = clients.get(id);
      if (other) { other.match = null; send(other.ws, 'match_ended', { reason: id === player.id ? reason : 'Tu rival abandonó la partida.' }); }
    }
    matches.delete(match.id);
  }
  player.match = null;
  lobbySnapshot();
}
function cleanup(player) {
  if (player.room) leaveRoom(player);
  if (player.match) leaveMatch(player, 'Te desconectaste de la partida.');
  clients.delete(player.id);
  for (const [id, invite] of invites) if (invite.from === player.id || invite.to === player.id) invites.delete(id);
  lobbySnapshot();
}

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ ok: true, players: clients.size, rooms: rooms.size, matches: matches.size }));
    return;
  }
  response.writeHead(404); response.end();
});
const wss = new WebSocketServer({ server, maxPayload: 4096, verifyClient: ({ origin }) => ORIGINS.includes(origin) });
wss.on('connection', ws => {
  const player = { id: randomUUID(), nick: '', ws, room: null, match: null };
  clients.set(player.id, player);
  send(ws, 'hello', { id: player.id });
  ws.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'join') {
      const nick = safeName(message.nick);
      if (nick.length < 2) return send(ws, 'error', { message: 'Elegí un apodo de al menos 2 caracteres.' });
      player.nick = nick;
      send(ws, 'joined', { id: player.id });
      lobbySnapshot();
      return;
    }
    if (!player.nick) return;
    if (message.type === 'create_room') {
      if (player.room || player.match) return send(ws, 'error', { message: 'Primero salí de tu partida actual.' });
      if (message.game !== 'batalla-naval') return send(ws, 'error', { message: 'Este juego todavía no tiene partidas online.' });
      const visibility = message.visibility === 'private' ? 'private' : 'public';
      const room = { id: randomUUID(), code: randomBytes(6).toString('hex'), game: message.game, visibility, host: player.id, players: [player.id] };
      rooms.set(room.id, room); player.room = room.id;
      send(ws, 'room_created', { id: room.id, code: room.code, game: room.game, visibility });
      lobbySnapshot();
      return;
    }
    if (message.type === 'join_room') {
      const room = rooms.get(String(message.id || ''));
      if (!room || room.players.length >= 2 || player.room || player.match) return send(ws, 'error', { message: 'Esa sala ya no está disponible.' });
      if (room.visibility === 'private' && String(message.code || '') !== room.code) return send(ws, 'error', { message: 'El enlace privado no es válido.' });
      room.players.push(player.id); player.room = room.id;
      startMatch(room);
      return;
    }
    if (message.type === 'invite') {
      const target = clients.get(String(message.to || ''));
      if (!target?.nick || target.id === player.id || target.room || target.match || player.match) return send(ws, 'error', { message: 'Ese jugador no está disponible.' });
      if (message.game !== 'batalla-naval') return send(ws, 'error', { message: 'Este juego todavía no tiene partidas online.' });
      let room = player.room ? rooms.get(player.room) : null;
      if (!room) {
        room = { id: randomUUID(), code: randomBytes(6).toString('hex'), game: 'batalla-naval', visibility: 'private', host: player.id, players: [player.id] };
        rooms.set(room.id, room); player.room = room.id;
      }
      const id = randomUUID();
      invites.set(id, { id, from: player.id, to: target.id, roomId: room.id, expires: Date.now() + 60000 });
      send(target.ws, 'invitation', { id, roomId: room.id, code: room.code, nick: player.nick, game: room.game });
      send(ws, 'info', { message: 'Invitación enviada a ' + target.nick });
      lobbySnapshot();
      return;
    }
    if (message.type === 'respond') {
      const invite = invites.get(String(message.id || ''));
      if (!invite || invite.to !== player.id) return;
      invites.delete(invite.id);
      const room = rooms.get(invite.roomId), host = clients.get(invite.from);
      if (!room || !host || room.players.length >= 2 || invite.expires < Date.now()) return send(ws, 'error', { message: 'La invitación ya no está disponible.' });
      if (!message.accept) { send(host.ws, 'info', { message: player.nick + ' rechazó la invitación.' }); return; }
      room.players.push(player.id); player.room = room.id;
      startMatch(room);
      return;
    }
    if (message.type === 'shot') {
      const match = matches.get(player.match);
      const cell = message.cell;
      if (!match || match.winner !== null) return;
      const index = match.ids.indexOf(player.id);
      if (index !== match.turn || !Number.isInteger(cell) || cell < 0 || cell > 99 || match.shots[index].has(cell)) return;
      match.shots[index].add(cell);
      const opponent = 1 - index;
      const hasWon = match.fleets[opponent].every(ship => ship.every(position => match.shots[index].has(position)));
      if (hasWon) match.winner = index; else match.turn = opponent;
      announceMatch(match);
      return;
    }
    if (message.type === 'leave') { if (player.match) leaveMatch(player, 'Saliste de la partida.'); else leaveRoom(player); }
  });
  ws.on('close', () => cleanup(player));
  ws.on('error', () => {});
});
setInterval(() => {
  const now = Date.now();
  for (const [id, invite] of invites) if (invite.expires < now) invites.delete(id);
}, 15000).unref();
server.listen(PORT, () => console.log('VLADYERIK online listening on ' + PORT));

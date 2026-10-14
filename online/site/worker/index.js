const HTML = __HTML__;
const CLIENT = __CLIENT__;
const Damas = __CHECKERS__;
const ONLINE_MS = 30000;
const ROOM_TTL = 86400000;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
const id = (bytes = 16) => [...crypto.getRandomValues(new Uint8Array(bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
const cleanName = value => String(value || '').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 24);
function fleet() {
  const ships = [], used = new Set();
  for (const size of [5, 4, 3, 3, 2]) {
    let placed = false;
    for (let tries = 0; tries < 3000 && !placed; tries++) {
      const row = crypto.getRandomValues(new Uint8Array(1))[0] % 10, col = crypto.getRandomValues(new Uint8Array(1))[0] % 10;
      const vertical = crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0, cells = [];
      for (let n = 0; n < size; n++) { const r = row + (vertical ? n : 0), c = col + (vertical ? 0 : n), cell = r * 10 + c; if (r > 9 || c > 9 || used.has(cell)) { cells.length = 0; break; } cells.push(cell); }
      if (cells.length === size) { cells.forEach(x => used.add(x)); ships.push(cells); placed = true; }
    }
    if (!placed) throw new Error('No se pudo ubicar la flota.');
  }
  return ships;
}
const touch = (env, player) => env.DB.prepare('UPDATE online_players SET seen_at=? WHERE id=?').bind(Date.now(), player.id).run();
async function authenticated(request, env, fallbackToken = '') {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(fallbackToken || '');
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  const player = await env.DB.prepare('SELECT id, nickname, room_id, status, seen_at FROM online_players WHERE token_hash=?').bind(await hash(token)).first();
  if (!player) return null;
  await touch(env, player);
  return { ...player, token };
}
function view(row, player) {
  const game = JSON.parse(row.body), index = game.players.findIndex(p => p.id === player.id);
  if (index < 0) return null;
  if (row.game === 'damas') return { room:row.id,code:row.code,game:row.game,visibility:row.visibility,state:row.state,version:row.version,
    host:row.host_id===player.id,seat:index,opponent:game.players[1-index]?.nickname||null,board:game.board,turn:game.turn===index,
    continuation:game.continuation,capturedThisTurn:game.capturedThisTurn||[],lastMove:game.lastMove,finished:row.state==='finished',winner:game.winner===null?null:game.winner===index };
  const other = 1 - index;
  return { room: row.id, code: row.code, game: row.game, visibility: row.visibility, state: row.state, version: row.version,
    host: row.host_id === player.id, opponent: game.players[other]?.nickname || null,
    ownShips: row.state === 'playing' || row.state === 'finished' ? game.fleets[index] : [],
    ownShots: game.shots[other], targetShots: game.shots[index].map(cell => ({ cell, hit: game.fleets[other].some(ship => ship.includes(cell)) })),
    turn: game.turn === index, finished: row.state === 'finished', winner: game.winner === null ? null : game.winner === index };
}
async function loadRoom(env, roomId) { return env.DB.prepare('SELECT * FROM online_rooms WHERE id=? AND created_at>?').bind(roomId, Date.now() - ROOM_TTL).first(); }
async function lobby(env, player) {
  const cutoff = Date.now() - ONLINE_MS;
  const [people, rooms, incoming, outgoing] = await Promise.all([
    env.DB.prepare('SELECT id,nickname,room_id,status,seen_at FROM online_players WHERE seen_at>? ORDER BY nickname LIMIT 100').bind(cutoff).all(),
    env.DB.prepare("SELECT id,game,host_id,player_ids,created_at FROM online_rooms WHERE game IN ('batalla-naval','damas') AND visibility='public' AND state='waiting' AND created_at>? ORDER BY created_at DESC LIMIT 40").bind(Date.now() - ROOM_TTL).all(),
    env.DB.prepare("SELECT i.id,i.room_id,i.from_id,p.nickname,i.expires_at,r.game FROM online_invitations i JOIN online_players p ON p.id=i.from_id JOIN online_rooms r ON r.id=i.room_id WHERE i.to_id=? AND i.status='pending' AND i.expires_at>? ORDER BY i.created_at DESC LIMIT 20").bind(player.id, Date.now()).all(),
    env.DB.prepare("SELECT i.id,i.to_id,p.nickname,i.status,i.expires_at,r.game FROM online_invitations i JOIN online_players p ON p.id=i.to_id JOIN online_rooms r ON r.id=i.room_id WHERE i.from_id=? AND i.expires_at>? ORDER BY i.created_at DESC LIMIT 20").bind(player.id, Date.now()).all()
  ]);
  return { players: people.results.map(p => ({ id:p.id, nickname:p.nickname, self:p.id===player.id, status:p.room_id ? p.status : 'available' })),
    rooms: rooms.results.filter(r => JSON.parse(r.player_ids).length < 2).map(r => ({ id:r.id,game:r.game,host: people.results.find(p=>p.id===r.host_id)?.nickname || 'Jugador', players:JSON.parse(r.player_ids).length, capacity:2 })),
    invitations: incoming.results.map(x=>({id:x.id,room:x.room_id,from:x.from_id,nickname:x.nickname,game:x.game,expiresAt:x.expires_at})),
    sentInvitations: outgoing.results.map(x=>({id:x.id,to:x.to_id,nickname:x.nickname,game:x.game,status:x.status,expiresAt:x.expires_at})),
    selfRoom: player.room_id ? await (async()=>{const r=await loadRoom(env,player.room_id);return r?view(r,player):null})() : null };
}
async function api(request, env) {
  if (!env.DB) return json({ error: 'Las salas online todavía no están disponibles.' }, 503);
  const url = new URL(request.url), path = url.pathname;
  if (request.method === 'POST' && request.headers.get('origin') && request.headers.get('origin') !== url.origin) return json({ error: 'Origen inválido.' }, 403);
  if (request.method === 'POST' && path === '/api/presence') {
    let body; try { body = await request.json(); } catch { return json({error:'Solicitud inválida.'},400); }
    const nickname=cleanName(body?.nickname), token=String(body?.token||'');
    if (nickname.length<2 || !/^[a-f0-9]{64}$/.test(token)) return json({error:'Escribí un apodo de al menos 2 caracteres.'},400);
    const tokenHash=await hash(token), existing=await env.DB.prepare('SELECT id,room_id FROM online_players WHERE token_hash=?').bind(tokenHash).first(), now=Date.now(), playerId=existing?.id||id();
    await env.DB.prepare('INSERT INTO online_players (id,token_hash,nickname,room_id,status,seen_at) VALUES (?,?,?,NULL,?,?) ON CONFLICT(token_hash) DO UPDATE SET nickname=excluded.nickname,seen_at=excluded.seen_at').bind(playerId,tokenHash,nickname,existing?.room_id?'playing':'available',now).run();
    const player=await env.DB.prepare('SELECT id,nickname,room_id,status,seen_at FROM online_players WHERE id=?').bind(playerId).first();
    return json({player:{id:player.id,nickname:player.nickname},...await lobby(env,player)});
  }
  let body={}; if(request.method==='POST'){const raw=await request.text();if(raw.length>4096)return json({error:'Solicitud demasiado grande.'},413);try{body=JSON.parse(raw);}catch{return json({error:'Solicitud inválida.'},400);}}
  const player=await authenticated(request,env,body.token); if(!player)return json({error:'Conectate a la sala primero.'},401);
  if(path==='/api/lobby'&&(request.method==='GET'||request.method==='POST'))return json(await lobby(env,player));
  if(path==='/api/rooms'&&request.method==='GET')return json(await lobby(env,player));
  if(path==='/api/rooms'&&request.method==='POST'){
    if(player.room_id)return json({error:'Salí de tu sala actual antes de crear otra.'},409);
    if(!['batalla-naval','damas'].includes(body.game)||!['public','private'].includes(body.visibility))return json({error:'Elegí una modalidad válida.'},400);
    const rid=id(),code=id(6),now=Date.now(),game={players:[{id:player.id,nickname:player.nickname},null],fleets:[[],[]],shots:[[],[]],turn:0,winner:null};
    await env.DB.prepare("INSERT INTO online_rooms (id,code,game,visibility,host_id,player_ids,state,body,created_at,updated_at) VALUES (?,?,? ,?,?,?,'waiting',?,?,?)").bind(rid,code,'batalla-naval',body.visibility,player.id,JSON.stringify([player.id]),JSON.stringify(game),now,now).run();
    await env.DB.prepare("UPDATE online_players SET room_id=?,status='waiting',seen_at=? WHERE id=?").bind(rid,now,player.id).run();
    const room=await loadRoom(env,rid);return json(view(room,player),201);
  }
  if(path==='/api/invitations'&&request.method==='POST'){
    const gameId=String(body.game||'batalla-naval');if(!['batalla-naval','damas'].includes(gameId))return json({error:'Elegí un juego disponible.'},400);
    const target=String(body.to||'');if(target===player.id)return json({error:'No podés invitarte a vos mismo.'},400);
    const recipient=await env.DB.prepare('SELECT id,room_id,seen_at FROM online_players WHERE id=?').bind(target).first();
    if(!recipient||Date.now()-recipient.seen_at>ONLINE_MS||recipient.room_id)return json({error:'Ese jugador ya no está disponible.'},409);
    let room=player.room_id?await loadRoom(env,player.room_id):null;
    if(room&&(room.host_id!==player.id||room.state!=='waiting'||JSON.parse(room.player_ids).length!==1))return json({error:'Salí de tu partida actual antes de invitar.'},409);
    if(room&&room.game!==gameId)return json({error:'La sala abierta es de otro juego.'},409);
    const now=Date.now(),inviteId=id();
    if(!room){const roomId=id(),code=id(6),game={players:[{id:player.id,nickname:player.nickname},null],fleets:[[],[]],shots:[[],[]],turn:0,winner:null};
      await env.DB.batch([
        env.DB.prepare("INSERT INTO online_rooms (id,code,game,visibility,host_id,player_ids,state,body,created_at,updated_at) VALUES (?,?,?,'private',?,?,'waiting',?,?,?)").bind(roomId,code,gameId,player.id,JSON.stringify([player.id]),JSON.stringify(game),now,now),
        env.DB.prepare("UPDATE online_players SET room_id=?,status='waiting',seen_at=? WHERE id=?").bind(roomId,now,player.id)
      ]);room=await loadRoom(env,roomId);
    }
    await env.DB.prepare("INSERT INTO online_invitations (id,from_id,to_id,room_id,status,created_at,expires_at) VALUES (?,?,?,?,'pending',?,?)").bind(inviteId,player.id,target,room.id,now,now+60000).run();
    return json({sent:true,nickname:recipient.nickname,room:view(room,player)},201);
  }
  const inviteMatch=path.match(/^\/api\/invitations\/([a-f0-9]{32})\/respond$/);
  if(inviteMatch&&request.method==='POST'){
    const invite=await env.DB.prepare("SELECT * FROM online_invitations WHERE id=? AND to_id=? AND status='pending' AND expires_at>?").bind(inviteMatch[1],player.id,Date.now()).first();
    if(!invite)return json({error:'La invitación venció o ya fue respondida.'},404);
    if(!body.accept){await env.DB.prepare("UPDATE online_invitations SET status='declined' WHERE id=? AND status='pending'").bind(invite.id).run();return json({declined:true});}
    if(player.room_id)return json({error:'Salí de tu partida actual antes de aceptar.'},409);
    const room=await loadRoom(env,invite.room_id);if(!room||room.state!=='waiting')return json({error:'La sala ya no está disponible.'},409);
    const game=JSON.parse(room.body);if(game.players[1])return json({error:'La sala está completa.'},409);
    game.players[1]={id:player.id,nickname:player.nickname};
    if(room.game==='damas'){Object.assign(game,Damas.newGame());game.turn=crypto.getRandomValues(new Uint8Array(1))[0]%2;}else{game.fleets=[fleet(),fleet()];game.turn=crypto.getRandomValues(new Uint8Array(1))[0]%2;}
    const now=Date.now(),players=JSON.stringify([game.players[0].id,player.id]);
    const result=await env.DB.prepare("UPDATE online_rooms SET player_ids=?,state='playing',body=?,version=version+1,updated_at=? WHERE id=? AND version=? AND state='waiting'").bind(players,JSON.stringify(game),now,room.id,room.version).run();
    if(!result.meta?.changes)return json({error:'La sala cambió. Actualizá e intentá otra vez.'},409);
    await env.DB.batch([
      env.DB.prepare("UPDATE online_players SET room_id=?,status='playing',seen_at=? WHERE id IN (?,?)").bind(room.id,now,game.players[0].id,player.id),
      env.DB.prepare("UPDATE online_invitations SET status='accepted' WHERE id=? AND status='pending'").bind(invite.id)
    ]);
    const next=await loadRoom(env,room.id);return json(view(next,player));
  }
  const roomMatch=path.match(/^\/api\/rooms\/([a-f0-9]{32})(?:\/(join|action|leave))?$/);
  if(!roomMatch)return json({error:'Ruta no encontrada.'},404);
  const [,roomId,op]=roomMatch;let room=await loadRoom(env,roomId);if(!room)return json({error:'La sala venció o no existe.'},404);
  let game=JSON.parse(room.body),players=JSON.parse(room.player_ids),seat=players.indexOf(player.id);
  if(op==='join'&&request.method==='POST'){
    if(seat>=0)return json(view(room,player));if(player.room_id)return json({error:'Salí de tu sala actual antes de entrar a otra.'},409);
    if(room.state!=='waiting'||players.length>=2)return json({error:'Esa sala ya no está disponible.'},409);
    if(room.visibility==='private'&&String(body.code||'')!==room.code)return json({error:'El enlace privado no es válido.'},403);
    game.players[1]={id:player.id,nickname:player.nickname};
    if(room.game==='damas'){Object.assign(game,Damas.newGame());game.turn=crypto.getRandomValues(new Uint8Array(1))[0]%2;}else{game.fleets=[fleet(),fleet()];game.turn=crypto.getRandomValues(new Uint8Array(1))[0]%2;}players=[players[0],player.id];
    const now=Date.now(),result=await env.DB.prepare("UPDATE online_rooms SET player_ids=?,state='playing',body=?,version=version+1,updated_at=? WHERE id=? AND version=? AND state='waiting'").bind(JSON.stringify(players),JSON.stringify(game),now,room.id,room.version).run();
    if(!result.meta?.changes)return json({error:'La sala ya recibió otro jugador.'},409);
    await env.DB.prepare("UPDATE online_players SET room_id=?,status='playing',seen_at=? WHERE id IN (?,?)").bind(room.id,now,players[0],players[1]).run();
    room=await loadRoom(env,room.id);return json(view(room,player));
  }
  if(seat<0)return json({error:'No pertenecés a esta sala.'},403);
  if(!op&&request.method==='GET'){await touch(env,player);return json(view(room,player));}
  if(op==='leave'&&request.method==='POST'){
    const state=room.state==='playing'?'finished':'closed';game.winner=room.state==='playing'?1-seat:null;
    await env.DB.prepare('UPDATE online_rooms SET state=?,body=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(state,JSON.stringify(game),Date.now(),room.id,room.version).run();
    await env.DB.prepare('UPDATE online_players SET room_id=NULL,status=\'available\',seen_at=? WHERE id IN (?,?)').bind(Date.now(),players[0],players[1]||'').run();
    return json({left:true});
  }
  if(op==='action'&&request.method==='POST'){
    if(room.state!=='playing'||game.winner!==null)return json({error:'La partida terminó.'},409);
    let legal;
    if(room.game==='damas'){
      const next=Damas.play(game,seat,Number(body.from),Number(body.to));legal=!!next;if(next)Object.assign(game,next);
    }else legal=applyShot(game,seat,Number(body.cell));
    if(!legal)return json({error:room.game==='damas'?'Ese movimiento no es válido. Obligá la captura si tenés una.':'Ese disparo no es válido ahora.'},409);
    const won=game.winner!==null;
    const result=await env.DB.prepare('UPDATE online_rooms SET state=?,body=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(won?'finished':'playing',JSON.stringify(game),Date.now(),room.id,room.version).run();
    if(!result.meta?.changes)return json({error:'La mesa cambió. Actualizá para ver la jugada rival.'},409);
    room=await loadRoom(env,room.id);return json(view(room,player));
  }
  return json({error:'Método no disponible.'},405);
}
export default { async fetch(request, env) {
  const url=new URL(request.url);
  if(url.pathname==='/')return new Response(HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
  if(url.pathname==='/client.js')return new Response(CLIENT,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'}});
  if(url.pathname==='/favicon.ico')return new Response(null,{status:204,'cache-control':'public,max-age=86400'});
  if(url.pathname==='/health')return json({ok:true,backend:env.DB?'d1':'unconfigured'});
  if(url.pathname.startsWith('/api/'))try{return await api(request,env);}catch(error){console.error('VLADYERIK Online',error?.message);return json({error:'No se pudo actualizar la sala. Reintentá.'},500);}
  return new Response('No encontrado',{status:404});
} };
export function applyShot(game,seat,cell){if(game.winner!==null||game.turn!==seat||!Number.isInteger(cell)||cell<0||cell>99||game.shots[seat].includes(cell))return false;game.shots[seat].push(cell);const other=1-seat;const won=game.fleets[other].every(ship=>ship.every(position=>game.shots[seat].includes(position)));if(won)game.winner=seat;else game.turn=other;return true;}
export { fleet, view, Damas };

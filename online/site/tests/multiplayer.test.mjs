import test from 'node:test';
import assert from 'node:assert/strict';
import { fleet, applyShot, view, Ludo, newRoomGame, addRoomPlayer } from '../dist/server/index.js';

test('fleet placement has all five ships with 17 distinct in-bounds cells', () => {
  const ships = fleet();
  assert.deepEqual(ships.map(ship => ship.length), [5,4,3,3,2]);
  const cells = ships.flat();
  assert.equal(new Set(cells).size, 17);
  assert.ok(cells.every(cell => Number.isInteger(cell) && cell >= 0 && cell < 100));
});

test('shots enforce alternating turns, reject repeats and finish only after sinking the fleet', () => {
  const game = { players: [{id:'a'},{id:'b'}], fleets: [[[20,21]], [[3,4]]], shots: [[],[]], turn: 0, winner: null };
  assert.equal(applyShot(game, 1, 3), false);
  assert.equal(applyShot(game, 0, 3), true);
  assert.equal(game.turn, 1);
  assert.equal(applyShot(game, 0, 3), false);
  assert.equal(applyShot(game, 1, 20), true);
  assert.equal(game.turn, 0);
  assert.equal(applyShot(game, 0, 4), true);
  assert.equal(game.winner, 0);
  assert.equal(applyShot(game, 0, 5), false);
});

test('a player view exposes its fleet and shot results without returning the rival fleet', () => {
  const row = { id:'room', code:'private', game:'batalla-naval', visibility:'private', host_id:'a', state:'playing', version:2,
    player_ids:'["a","b"]', body:JSON.stringify({players:[{id:'a',nickname:'A'},{id:'b',nickname:'B'}],fleets:[[[1,2]],[[91,92]]],shots:[[91],[]],turn:1,winner:null}) };
  const result = view(row, {id:'a'});
  assert.deepEqual(result.ownShips, [[1,2]]);
  assert.deepEqual(result.targetShots, [{cell:91,hit:true}]);
  assert.equal(JSON.stringify(result).includes('91,92'), false);
  assert.equal(result.opponent, 'B');
});

test('Ludo room view exposes the shared board and player-specific turn',()=>{
  const game=Ludo.newGame(3);game.capacity=3;game.players=[{id:'a',nickname:'A'},{id:'b',nickname:'B'},{id:'c',nickname:'C'}];game.turn=2;
  const row={id:'room',code:'private',game:'ludo-matic',visibility:'public',host_id:'a',state:'playing',version:4,body:JSON.stringify(game)};
  const current=view(row,{id:'c'}),waiting=view(row,{id:'b'});
  assert.equal(current.seat,2);assert.equal(current.turn,true);assert.equal(current.capacity,3);assert.equal(current.tokens.length,3);assert.equal(current.players[1].nickname,'B');assert.equal(waiting.turn,false);
});

test('Ludo rooms keep waiting until the configured number of seats is filled',()=>{
  const game=newRoomGame('ludo-matic',4,{id:'a',nickname:'A'});
  assert.equal(game.capacity,4);assert.equal(addRoomPlayer('ludo-matic',game,{id:'b',nickname:'B'}),0);assert.equal(game.players[1].id,'b');
  assert.equal(addRoomPlayer('ludo-matic',game,{id:'c',nickname:'C'}),0);assert.equal(addRoomPlayer('ludo-matic',game,{id:'d',nickname:'D'}),1);
  assert.ok(game.players.every(Boolean));assert.equal(game.tokens.length,4);assert.ok(game.turn>=0&&game.turn<4);
  const naval=newRoomGame('batalla-naval',2,{id:'a',nickname:'A'});assert.equal(addRoomPlayer('batalla-naval',naval,{id:'b',nickname:'B'}),1);assert.equal(naval.fleets.length,2);
});

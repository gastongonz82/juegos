import test from 'node:test';
import assert from 'node:assert/strict';
import { Ludo } from '../dist/server/index.js';

test('Ludo admits two to four players with four tokens each',()=>{
  for(const count of [2,3,4]){const game=Ludo.newGame(count);assert.equal(game.players.length,count);assert.equal(game.tokens.length,count);assert.ok(game.tokens.every(tokens=>tokens.length===4&&tokens.every(token=>token===-1)))}
  assert.throws(()=>Ludo.newGame(1),RangeError);assert.throws(()=>Ludo.newGame(5),RangeError);
});

test('Ludo player view exposes the numeric solo turn as an enabled player turn',()=>{
  const game=Ludo.newGame(2);game.players=[{nickname:'Vos'},{nickname:'Computadora'}];
  const human=Ludo.playerView(game,0),computer=Ludo.playerView({...game,turn:1},0);
  assert.equal(human.turn,true);assert.equal(human.turnSeat,0);assert.equal(computer.turn,false);assert.equal(computer.turnSeat,1);
});

test('a token leaves its yard only on a six, and a six grants another turn',()=>{
  const game=Ludo.newGame(2);game.players=[{nickname:'A'},{nickname:'B'}];
  const noMove=Ludo.roll(game,0,5);assert.equal(noMove.turn,1);assert.equal(noMove.dice,null);
  const six=Ludo.roll(noMove,1,6);assert.deepEqual(Ludo.legalTokens(six),[0,1,2,3]);
  const moved=Ludo.move(six,1,0);assert.equal(moved.tokens[1][0],0);assert.equal(moved.turn,1);assert.equal(moved.dice,null);
});

test('three consecutive sixes forfeit the turn',()=>{
  let game=Ludo.newGame(2);game.players=[{nickname:'A'},{nickname:'B'}];
  for(let n=0;n<2;n++){game=Ludo.roll(game,0,6);game=Ludo.move(game,0,n)}
  const third=Ludo.roll(game,0,6);assert.equal(third.turn,1);assert.equal(third.dice,null);assert.equal(third.lastAction.type,'three-sixes');
});

test('exact roll reaches home and winning requires all four tokens',()=>{
  const game=Ludo.newGame(2);game.players=[{nickname:'A'},{nickname:'B'}];game.tokens[0]=[56,57,57,57];
  const roll=Ludo.roll(game,0,1);assert.deepEqual(Ludo.legalTokens(roll),[0]);
  const won=Ludo.move(roll,0,0);assert.equal(won.tokens[0][0],57);assert.equal(won.winner,0);assert.equal(won.state,'finished');
});

test('landing on an unsafe square captures, while safe squares protect tokens',()=>{
  const unsafe=Ludo.newGame(2);unsafe.players=[{nickname:'A'},{nickname:'B'}];unsafe.tokens[0][0]=0;unsafe.tokens[1][0]=41;unsafe.turn=0;unsafe.dice=2;
  const captured=Ludo.move(unsafe,0,0);assert.equal(captured.tokens[1][0],-1);assert.deepEqual(captured.lastAction.captured,[{player:1,token:0}]);
  const safe=Ludo.newGame(2);safe.players=[{nickname:'A'},{nickname:'B'}];safe.tokens[0][0]=6;safe.tokens[1][0]=47;safe.turn=0;safe.dice=2;
  const protectedGame=Ludo.move(safe,0,0);assert.equal(protectedGame.tokens[1][0],47);assert.deepEqual(protectedGame.lastAction.captured,[]);
});

test('each computer difficulty returns a legal token without mutating the board',()=>{
  for(const difficulty of ['easy','normal','hard']){const game=Ludo.newGame(2);game.players=[{nickname:'A'},{nickname:'B'}];const rolled=Ludo.roll(game,0,6),before=structuredClone(rolled);const token=Ludo.aiToken(rolled,difficulty,()=>0);assert.ok(Ludo.legalTokens(rolled).includes(token));assert.deepEqual(rolled,before)}
});

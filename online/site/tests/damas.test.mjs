import test from 'node:test';
import assert from 'node:assert/strict';
import { Damas, view } from '../dist/server/index.js';

test('Damas Argentina starts on a 10x10 board with 15 pieces per side',()=>{
  const game=Damas.newGame();
  assert.equal(game.board.length,100);
  assert.equal(game.board.filter(x=>x===1).length,15);
  assert.equal(game.board.filter(x=>x===-1).length,15);
  assert.equal(Damas.legalMoves(game,0).length,9);
  assert.ok(Damas.legalMoves(game,0).every(m=>m.captured===null));
});

test('capturing is mandatory even when another piece can move normally',()=>{
  const board=Array(100).fill(0);board[74]=1;board[63]=-1;board[83]=1;
  const game={board,turn:0,continuation:null,winner:null,lastMove:null};
  assert.deepEqual(Damas.legalMoves(game,0),[{from:74,to:52,captured:63}]);
  assert.equal(Damas.play(game,0,83,72),null);
  const next=Damas.play(game,0,74,52);
  assert.equal(next.board[63],0);assert.equal(next.turn,1);
});

test('multiple captures keep the turn and promotion crowns a man',()=>{
  const board=Array(100).fill(0);board[74]=1;board[63]=-1;board[41]=-1;board[83]=1;
  const first=Damas.play({board,turn:0,continuation:null,winner:null},0,74,52);
  assert.equal(first.turn,0);assert.equal(first.continuation,52);assert.equal(first.board[63],-1);
  const second=Damas.play(first,0,52,30);
  assert.equal(second.board[30],1);assert.equal(second.board[63],0);assert.equal(second.board[41],0);assert.equal(second.turn,1);assert.equal(second.continuation,null);
  const near=Array(100).fill(0);near[12]=1;near[90]=-1;
  const crowned=Damas.play({board:near,turn:0,continuation:null,winner:null},0,12,1);
  assert.equal(crowned.board[1],2);
});

test('a flying king can capture at distance and capture priority respects king value',()=>{
  const board=Array(100).fill(0);board[63]=2;board[45]=-1;board[74]=1;
  const kingMoves=Damas.legalMoves({board,turn:0,continuation:null,winner:null},0);
  assert.ok(kingMoves.some(m=>m.from===63&&m.to===36&&m.captured===45));
  const priority=Array(100).fill(0);priority[72]=1;priority[63]=-1;priority[76]=1;priority[65]=-2;
  const moves=Damas.legalMoves({board:priority,turn:0,continuation:null,winner:null},0);
  assert.deepEqual(moves,[{from:76,to:54,captured:65}]);
});

test('every AI difficulty returns a legal move without mutating the board',()=>{
  for(const difficulty of ['easy','normal','hard']){
    const game=Damas.newGame();game.turn=1;const snapshot=game.board.slice();
    const move=Damas.chooseAiMove(game,difficulty,()=>0);
    assert.ok(Damas.legalMoves(game,1).some(m=>m.from===move.from&&m.to===move.to));
    assert.deepEqual(game.board,snapshot);
  }
});

test('a player cannot move after the opponent turn or after game over',()=>{
  const game=Damas.newGame();
  assert.equal(Damas.play(game,1,17,24),null);
  const done={...game,winner:0};assert.equal(Damas.legalMoves(done,0).length,0);
});

test('online Damas view shows the shared board and identifies each seat',()=>{
  const game={...Damas.newGame(),players:[{id:'a',nickname:'A'},{id:'b',nickname:'B'}],turn:1};
  const row={id:'room',code:'private',game:'damas',visibility:'private',host_id:'a',state:'playing',version:3,body:JSON.stringify(game)};
  const first=view(row,{id:'a'}),second=view(row,{id:'b'});
  assert.equal(first.seat,0);assert.equal(first.turn,false);assert.equal(second.seat,1);assert.equal(second.turn,true);
  assert.equal(first.board.length,100);assert.deepEqual(first.board,second.board);
});

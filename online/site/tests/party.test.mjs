import test from 'node:test';
import assert from 'node:assert/strict';
import { Party, view, newRoomGame, addRoomPlayer } from '../dist/server/index.js';

test('Tutti Frutti and Basta wait for the room to fill and enforce their supported capacity',()=>{
  const tutti=newRoomGame('tutti-frutti',2,{id:'a',nickname:'Ana'});assert.equal(tutti.phase,'waiting');assert.deepEqual(tutti.answers,[null,null]);
  assert.equal(addRoomPlayer('tutti-frutti',tutti,{id:'b',nickname:'Beto'}),1);assert.equal(tutti.phase,'answering');assert.ok(Party.WORDS['tutti-frutti'].categories.length>=5);
  const basta=newRoomGame('basta',2,{id:'a',nickname:'Ana'});assert.equal(basta.phase,'waiting');assert.equal(addRoomPlayer('basta',basta,{id:'b',nickname:'Beto'}),1);assert.equal(basta.phase,'answering');assert.ok(basta.card.label);assert.equal(basta.availableLetters.length,Party.ALPHABET.length);assert.equal(basta.alive.filter(Boolean).length,2);
  for(const gameId of ['tutti-frutti','basta'])assert.throws(()=>Party.newWords(gameId,9,{id:'a',nickname:'Ana'}),RangeError);
});

test('word-game scores matching answers as five, unique answers as ten, and wrong letters as zero',()=>{
  const game=Party.newWords('tutti-frutti',2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};
  game.phase='answering';game.letter='A';game.answers=[['Ana','Armadillo','Argentina','Arroz','Azul','Anillo'],['ana','Abeja','Argentina','Asado','Azul','Álbum']];
  Party.scoreWords(game);
  assert.equal(game.results[0][0].points,5);assert.equal(game.results[1][0].points,5);
  assert.equal(game.results[0][1].points,10);assert.equal(game.results[1][1].points,10);
  assert.equal(game.results[0][2].points,5);assert.equal(game.results[0][4].points,5);
  assert.equal(game.results[1][5].points,10);assert.equal(game.phase,'results');
});

test('solo Tutti Frutti computer returns category answers beginning with the round letter',()=>{
  for(const gameId of ['tutti-frutti']){
    const answers=Party.computerAnswers(gameId,'A',()=>.5,0);
    assert.equal(answers.length,Party.WORDS[gameId].categories.length);
    assert.ok(answers.every(answer=>!answer||Party.norm(answer).startsWith('a')));
    assert.ok(answers.filter(Boolean).length>=5);
    const keys=gameId==='basta'?['nombre','animal','place','food','brand','famous']:['nombre','animal','country','food','color','object'];
    answers.forEach((answer,index)=>{if(answer)assert.ok(Party.CATEGORY_WORDS[keys[index]].some(word=>Party.norm(word)===Party.norm(answer)))})
  }
});

test('word answers with the right letter but wrong category score zero',()=>{
  const game=Party.newWords('tutti-frutti',2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};
  game.phase='answering';game.letter='A';game.answers=[['Ana','Armadillo','Armadillo','Arroz','Azul','Armadillo'],['Ana','Abeja','Argentina','Asado','Ámbar','Anillo']];
  Party.scoreWords(game);
  assert.equal(game.results[0][0].points,5);
  assert.equal(game.results[0][1].points,10);
  assert.equal(game.results[0][2].points,0);assert.equal(game.results[0][2].reason,'categoría');
  assert.equal(game.results[0][5].points,0);assert.equal(game.results[0][5].reason,'categoría');
  assert.equal(game.results[1][5].points,10);
});

test('word scoring does not accept made-up spellings or letter-separated text',()=>{
  const game=Party.newWords('tutti-frutti',2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};
  game.phase='answering';game.letter='A';game.answers=[['A n a','Armadillo','Argentina','Arroz!','Azul','Anillo'],['','','','','','']];
  Party.scoreWords(game);
  assert.equal(game.results[0][0].points,0);assert.equal(game.results[0][0].reason,'categoría');
  assert.equal(game.results[0][3].points,0);assert.equal(game.results[0][3].reason,'categoría');
});

test('Basta plays one card at a time, spends a letter, and eliminates repeated letters',()=>{
  const game=Party.newWords('basta',2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};Party.startWords(game,1000,()=>0);
  assert.deepEqual(game.card,{label:'Nombre masculino',key:'masculineName'});assert.equal(game.turn,0);
  assert.equal(Party.playBastaTurn(game,0,'A',1100),true);assert.equal(game.turn,1);assert.equal(game.availableLetters.includes('A'),false);assert.equal(game.history[0].answer,'');
  assert.equal(Party.playBastaTurn(game,1,'B',1200, 'Bruno'),true);assert.equal(game.turn,0);
  assert.equal(Party.playBastaTurn(game,0,'A',1300),true);assert.equal(game.phase,'results');assert.equal(game.roundWinner,1);assert.deepEqual(game.scores,[0,1]);assert.equal(game.alive[0],false);
  assert.equal(Party.nextWordsRound(game,0,2000,()=>0),true);assert.equal(game.round,2);assert.equal(game.phase,'answering');assert.equal(game.history.length,0);assert.equal(game.availableLetters.length,Party.ALPHABET.length);
});

test('Basta voice answer validation requires the selected initial and a word in that card category',()=>{
  assert.deepEqual(Party.validateBastaAnswer('animal','T','Tigre.'),{valid:true,reason:'correcta',answer:'Tigre'});
  assert.equal(Party.validateBastaAnswer('animal','A','Tigre').reason,'letra');
  assert.equal(Party.validateBastaAnswer('animal','T','Tomate').reason,'categoría');
  assert.equal(Party.validateBastaAnswer('animal','T','').reason,'vacía');
});

test('Basta turn timeout eliminates the active player and computer chooses a legal card answer',()=>{
  const game=Party.newWords('basta',3,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};game.players[2]={id:'c',nickname:'Cami'};Party.startWords(game,1000,()=>0);
  assert.equal(Party.expireBastaTurn(game,15999),false);assert.equal(Party.expireBastaTurn(game,16000),true);assert.equal(game.alive[0],false);assert.equal(game.turn,1);
  const play=Party.computerBastaTurn(game,1,()=>0);assert.ok(play?.answer&&play.letter);assert.equal(Party.playBastaTurn(game,1,play.letter,16100,play.answer),true);assert.equal(game.phase,'answering');assert.equal(game.turn,2);
});

test('word deadline closes the round and next round is controlled by the host',()=>{
  const game=Party.newWords('tutti-frutti',2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto'};Party.startWords(game,5000,()=>0);game.letter='A';
  game.answers[0]=['Ana','','','','',''];game.answers[1]=['','','','','',''];game.submitted[0]=true;
  Party.scoreWords(game);assert.equal(game.phase,'results');assert.equal(Party.nextWordsRound(game,1,7000,()=>0),false);const scored=game.scores.slice();
  assert.equal(Party.nextWordsRound(game,0,7000,()=>0),true);assert.equal(game.round,2);assert.equal(game.phase,'answering');assert.deepEqual(game.scores,scored);assert.equal(game.results,null);
});

test('Tutti Frutti rooms start only when all seats fill and accept one answer per player',()=>{
  const game=newRoomGame('tutti-frutti',3,{id:'a',nickname:'Ana'});
  assert.equal(addRoomPlayer('tutti-frutti',game,{id:'b',nickname:'Beto'}),0);assert.equal(game.phase,'waiting');
  assert.equal(addRoomPlayer('tutti-frutti',game,{id:'c',nickname:'Cami'}),1);assert.equal(game.phase,'answering');game.letter='A';
  const answers=['Ana','Abeja','Argentina','Arroz','Azul','Anillo'];
  assert.equal(Party.submitWords(game,0,answers,Date.now()),true);assert.equal(Party.submitWords(game,0,answers,Date.now()),false);assert.equal(game.phase,'answering');
  assert.equal(Party.submitWords(game,1,answers,Date.now()),true);assert.equal(Party.submitWords(game,2,answers,Date.now()),true);assert.equal(game.phase,'results');
  assert.deepEqual(game.scores,[30,30,30]);
});

test('Basta online turns spend a letter and reveal each spoken answer to every player',()=>{
  const game=newRoomGame('basta',3,{id:'a',nickname:'Ana'});addRoomPlayer('basta',game,{id:'b',nickname:'Beto'});addRoomPlayer('basta',game,{id:'c',nickname:'Cami'});Party.startWords(game,1000,()=>0);
  const first=Party.computerBastaTurn(game,0,()=>0);assert.equal(Party.playBastaTurn(game,1,first.letter,1100),false);
  assert.equal(Party.playBastaTurn(game,0,first.letter,1100,first.answer),true);assert.equal(game.turn,1);assert.equal(game.availableLetters.includes(first.letter),false);
  const row={id:'r',code:'c',game:'basta',visibility:'public',host_id:'a',state:'playing',version:3,body:JSON.stringify(game)};
  const viewA=view(row,{id:'a'}),viewB=view(row,{id:'b'});assert.equal(viewA.card.label,game.card.label);assert.deepEqual(viewB.history,game.history);assert.equal(viewB.turn,true);
});

test('Estanciero waits for its seats, rolls only for the active player and buys an unowned field',()=>{
  const game=newRoomGame('estanciero',2,{id:'a',nickname:'Ana'});assert.equal(game.phase,'waiting');assert.equal(addRoomPlayer('estanciero',game,{id:'b',nickname:'Beto'}),1);game.turn=0;
  assert.equal(Party.rollEstanciero(game,1,[1,2]),null);Party.rollEstanciero(game,0,[1,2]);assert.equal(game.players[0].position,3);assert.equal(game.phase,'buy');assert.equal(game.pending.tile,3);
  assert.equal(Party.buyEstanciero(game,1,true),false);assert.equal(Party.buyEstanciero(game,0,true),true);assert.ok(game.players[0].properties.includes(3));assert.equal(game.players[0].money,1360);assert.equal(game.phase,'end');
  assert.equal(Party.endEstanciero(game,0),true);assert.equal(game.turn,1);assert.equal(game.phase,'roll');
});

test('Estanciero pays rent, grants start money and charges taxes without creating an owner',()=>{
  const game=Party.newEstanciero(2,{id:'a',nickname:'Ana'});game.players[1]={id:'b',nickname:'Beto',money:1500,position:0,properties:[3],upgrades:[],bankrupt:false,jailed:false};game.phase='roll';game.turn=0;game.players[0].position=1;
  Party.rollEstanciero(game,0,[1,1]);assert.equal(game.players[0].position,3);assert.equal(game.players[0].money,1476);assert.equal(game.players[1].money,1524);assert.equal(game.phase,'end');
  game.players[0].money=1500;game.players[0].position=27;game.phase='roll';Party.rollEstanciero(game,0,[1,1]);assert.equal(game.players[0].position,1);assert.equal(game.players[0].money,1700);
  game.players[0].money=50;game.players[0].position=12;game.phase='roll';Party.rollEstanciero(game,0,[1,1]);assert.equal(game.players[0].bankrupt,true);assert.deepEqual(game.players[0].properties,[]);assert.equal(game.players[1].properties.includes(3),true);
});

test('Estanciero keeps the turn for a property decision, builds once, and sends a player to the police',()=>{
  const game=Party.newEstanciero(2,{id:'a',nickname:'Ana'});game.players[0].properties=[5];game.players[1]={id:'b',nickname:'Beto',money:1500,position:0,properties:[],upgrades:[],bankrupt:false,jailed:false};game.phase='roll';game.turn=0;game.players[0].position=3;
  Party.rollEstanciero(game,0,[1,1]);assert.equal(game.phase,'own');assert.equal(Party.buildEstanciero(game,0),true);assert.equal(Party.buildEstanciero(game,0),false);assert.ok(game.players[0].upgrades.includes(5));
  game.phase='roll';game.players[0].position=25;Party.rollEstanciero(game,0,[1,1]);assert.equal(game.players[0].position,10);assert.equal(game.players[0].jailed,true);
});

test('Estanciero computer takes legal turns, buys fields, and advances to the human',()=>{
  const game=Party.newEstanciero(2,{id:'human',nickname:'Vos'});game.players[1]=Party.estancieroPlayer({id:'cpu',nickname:'Computadora'});game.turn=1;game.phase='roll';
  const roll=Party.computerEstancieroAction(game,1,()=>0);assert.equal(roll.type,'roll');assert.deepEqual(roll.dice,[1,1]);Party.rollEstanciero(game,1,roll.dice,roll.chance);assert.equal(game.phase,'end');
  const end=Party.computerEstancieroAction(game,1,()=>0);assert.equal(end.type,'end');Party.endEstanciero(game,1);assert.equal(game.turn,0);
  game.turn=1;game.phase='buy';game.pending={tile:1,creditor:-1,amount:120};assert.equal(Party.computerEstancieroAction(game,1,()=>.5).type,'buy');assert.equal(Party.buyEstanciero(game,1,true),true);assert.ok(game.players[1].properties.includes(1));
});

test('Estanciero player views expose public money and ownership, not server internals',()=>{
  const game=Party.newEstanciero(2,{id:'a',nickname:'Ana'});game.players[1]=Party.estancieroPlayer({id:'b',nickname:'Beto'});game.players[0].properties=[1];game.turn=1;game.phase='roll';
  const row={id:'r',code:'c',game:'estanciero',visibility:'public',host_id:'a',state:'playing',version:4,body:JSON.stringify(game)};
  const a=view(row,{id:'a'}),b=view(row,{id:'b'});assert.equal(a.players[0].money,1500);assert.deepEqual(b.players[0].properties,[1]);assert.equal(a.turn,false);assert.equal(b.turn,true);assert.deepEqual(a.board,b.board);
});

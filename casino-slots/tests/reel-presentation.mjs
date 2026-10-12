import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {collapseColumns}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../reel-presentation.js',import.meta.url))).toString('base64'));
test('cascade preserves survivor order, refills only removed stops and does not mutate the previous board',()=>{
 const board=Array.from({length:15},(_,i)=>i);let draws=0;
 const result=collapseColumns(board,[10,5,11],()=>100+draws++);
 assert.equal(draws,3);
 assert.deepEqual([result.grid[0],result.grid[5],result.grid[10]],[101,100,0]);
 assert.deepEqual([result.grid[1],result.grid[6],result.grid[11]],[102,1,6]);
 for(const c of [2,3,4])for(let r=0;r<3;r++)assert.equal(result.grid[r*5+c],board[r*5+c]);
 assert.deepEqual(board,Array.from({length:15},(_,i)=>i));
 assert.ok(result.moves.every(({from,to})=>((from%5)+5)%5===to%5));
});
test('duplicate winning paths cannot cause extra draws; empty and full cascades are handled',()=>{
 const board=Array.from({length:15},(_,i)=>i%7);let draws=0;
 collapseColumns(board,[0,0,5,5],()=>{draws++;return 6});assert.equal(draws,2);
 assert.deepEqual(collapseColumns(board,[],()=>{throw Error('unexpected draw')}).grid,board);
 draws=0;const result=collapseColumns(board,Array.from({length:15},(_,i)=>i),()=>{draws++;return 3});
 assert.equal(draws,15);assert.deepEqual(result.grid,Array(15).fill(3));assert.equal(result.moves.length,15);
});
test('board animation stops every column on its final result and clears rolling state',{timeout:6000},async()=>{
 const {animateBoard}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../reel-presentation.js',import.meta.url))).toString('base64'));
 const classes=()=>{const set=new Set();return {add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v)}};
 const reels={classList:classes()},cells=Array.from({length:15},()=>({classList:classes(),replaceChildren(v){this.symbol=v}}));
 const board=Array.from({length:15},(_,i)=>i%7),stops=[];
 await animateBoard({reels,cells,game:'aztec',grid:board,symbolNode:(game,index)=>({game,index}),onStop:c=>stops.push(c)});
 assert.deepEqual(stops,[0,1,2,3,4]);assert.equal(reels.classList.contains('rolling'),false);
 cells.forEach((cell,i)=>assert.deepEqual(cell.symbol,{game:'aztec',index:board[i]}));
});

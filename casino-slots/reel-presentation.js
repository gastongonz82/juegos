const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export const boardGames=new Set(['atlantis','aztec']);
export function addReelLenses(reels,game){
 if(!['dragon','diamonds','west','fortune'].includes(game))return;
 for(let column=0;column<5;column++){
  const lens=document.createElement('div');lens.className='continuous-reel-lens';
  lens.style.left=(column*20)+'%';lens.setAttribute('aria-hidden','true');reels.append(lens);
 }
}
export async function animateBoard({reels,cells,game,grid,symbolNode,onStop}){
 reels.classList.add('rolling');
 let tick=0;const stopped=new Set();
 const cycle=setInterval(()=>{
  tick++;cells.forEach((cell,i)=>{if(!stopped.has(i%5))cell.replaceChildren(symbolNode(game,(grid[i]+tick)%7))});
 },160);
 try{
  await Promise.all(Array.from({length:5},async(_,column)=>{
   await wait(2200+column*350);stopped.add(column);
   for(let row=0;row<3;row++){
    const i=row*5+column;cells[i].replaceChildren(symbolNode(game,grid[i]));cells[i].classList.add('reel-stopped');
   }
   onStop(column);
  }));
 }finally{clearInterval(cycle);reels.classList.remove('rolling')}
}
// Collapse each column, preserving surviving symbol order and drawing only the vacated stops.
export function collapseColumns(grid,indexes,pick){
 const removed=new Set(indexes);const next=[...grid],moves=[];
 for(let column=0;column<5;column++){
  const survivors=[];
  for(let row=2;row>=0;row--){const from=row*5+column;if(!removed.has(from))survivors.push({from,value:grid[from]})}
  for(let row=2;row>=0;row--){
   const to=row*5+column,item=survivors[2-row];
   if(item){next[to]=item.value;if(item.from!==to)moves.push({from:item.from,to})}
   else{next[to]=pick();moves.push({from:to-15,to})}
  }
 }
 return {grid:next,moves};
}
export async function animateCascade({cells,grid,indexes,pick,render,reducedMotion=false}){
 const unique=[...new Set(indexes)];
 if(!reducedMotion)await Promise.all(unique.map(i=>cells[i].animate([
  {opacity:1,filter:'brightness(1.4)'},{opacity:0,filter:'brightness(2)',scale:'.6'}
 ],{duration:220,fill:'forwards'}).finished.catch(()=>{})));
 const collapsed=collapseColumns(grid,unique,pick);
 cells.forEach(cell=>cell.getAnimations().forEach(animation=>animation.cancel()));
 render(collapsed.grid);
 if(!reducedMotion)await Promise.all(collapsed.moves.map(({from,to})=>{
  const distance=(Math.floor(from/5)-Math.floor(to/5))*cells[to].getBoundingClientRect().height;
  return cells[to].animate([{transform:`translateY(${distance}px)`,opacity:.4},{transform:'translateY(0)',opacity:1}],
   {duration:360,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.catch(()=>{});
 }));
 return collapsed.grid;
}

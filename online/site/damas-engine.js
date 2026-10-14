(() => {
  const SIZE=10,CELLS=SIZE*SIZE,DARK=(r,c)=>(r+c)%2===1;
  const sideFor=player=>player===0?1:-1;
  function newGame(){
    const board=Array(CELLS).fill(0);
    for(let r=0;r<3;r++)for(let c=0;c<SIZE;c++)if(DARK(r,c))board[r*SIZE+c]=-1;
    for(let r=7;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(DARK(r,c))board[r*SIZE+c]=1;
    return {board,turn:0,continuation:null,capturedThisTurn:[],winner:null,lastMove:null};
  }
  const at=(r,c)=>r*SIZE+c,inside=(r,c)=>r>=0&&r<SIZE&&c>=0&&c<SIZE;
  function captureOptions(board,from,capturedSet=new Set()){
    const piece=board[from],side=Math.sign(piece),row=Math.floor(from/SIZE),col=from%SIZE,king=Math.abs(piece)===2,options=[];
    for(const dr of [-1,1])for(const dc of [-1,1]){
      if(!king){
        if(dr!==-side)continue;
        const r=row+dr,c=col+dc,rr=r+dr,cc=c+dc;
        if(inside(rr,cc)&&board[at(r,c)]&&!capturedSet.has(at(r,c))&&Math.sign(board[at(r,c)])===-side&&!board[at(rr,cc)])options.push({from,to:at(rr,cc),captured:at(r,c)});
      }else{
        let r=row+dr,c=col+dc;while(inside(r,c)&&!board[at(r,c)]){r+=dr;c+=dc;}
        if(!inside(r,c)||capturedSet.has(at(r,c))||Math.sign(board[at(r,c)])!==-side)continue;
        const captured=at(r,c);r+=dr;c+=dc;
        while(inside(r,c)&&!board[at(r,c)]){options.push({from,to:at(r,c),captured});r+=dr;c+=dc;}
      }
    }
    return options;
  }
  function sequences(board,from,capturedSet=new Set()){
    const piece=board[from];if(!piece)return [];
    const steps=captureOptions(board,from,capturedSet);if(!steps.length)return [{moves:[],value:0,king:Math.abs(piece)===2}];
    const out=[];
    for(const move of steps){
      const next=board.slice();next[from]=0;let moving=piece;const taken=new Set(capturedSet);taken.add(move.captured);
      const row=Math.floor(move.to/SIZE);if(moving===1&&row===0)moving=2;if(moving===-1&&row===SIZE-1)moving=-2;next[move.to]=moving;
      const promoted=Math.abs(moving)===2&&Math.abs(piece)===1;
      const tails=promoted?[{moves:[],value:0,king:Math.abs(piece)===2}]:sequences(next,move.to,taken);
      for(const tail of tails)out.push({moves:[move,...tail.moves],value:(Math.abs(board[move.captured])===2?2:1)+tail.value,king:Math.abs(piece)===2});
    }
    return out;
  }
  function bestCaptureSequences(state,player,onlyFrom=null){
    const side=sideFor(player),all=[];
    const capturedSet=new Set(state.capturedThisTurn||[]);
    for(let from=0;from<CELLS;from++)if(Math.sign(state.board[from])===side&&(onlyFrom===null||from===onlyFrom))all.push(...sequences(state.board,from,capturedSet).filter(s=>s.moves.length));
    if(!all.length)return [];
    const value=Math.max(...all.map(s=>s.value)),byValue=all.filter(s=>s.value===value),preferKing=onlyFrom===null&&byValue.some(s=>s.king);
    return byValue.filter(s=>!preferKing||s.king);
  }
  function simpleMoves(board,player,onlyFrom=null){
    const side=sideFor(player),moves=[];
    for(let from=0;from<CELLS;from++){
      const piece=board[from];if(!piece||Math.sign(piece)!==side||(onlyFrom!==null&&from!==onlyFrom))continue;
      const row=Math.floor(from/SIZE),col=from%SIZE,king=Math.abs(piece)===2;
      for(const dr of king?[-1,1]:[side===1?-1:1])for(const dc of [-1,1]){
        let r=row+dr,c=col+dc;while(inside(r,c)&&!board[at(r,c)]){moves.push({from,to:at(r,c),captured:null});if(!king)break;r+=dr;c+=dc;}
      }
    }
    return moves;
  }
  function legalMoves(state,player=state.turn){
    if(!state||state.winner!==null)return [];
    const captures=bestCaptureSequences(state,player,state.continuation);
    if(captures.length)return [...new Map(captures.map(s=>[`${s.moves[0].from}:${s.moves[0].to}`,s.moves[0]])).values()];
    return state.continuation===null?simpleMoves(state.board,player):[];
  }
  function play(state,player,from,to){
    if(!state||state.winner!==null||player!==state.turn)return null;
    const move=legalMoves(state,player).find(m=>m.from===from&&m.to===to);if(!move)return null;
    const next={...state,board:state.board.slice(),capturedThisTurn:[...(state.capturedThisTurn||[])],lastMove:{from,to,captured:move.captured}},piece=next.board[from];next.board[from]=0;
    if(move.captured!==null)next.capturedThisTurn.push(move.captured);
    let moving=piece,row=Math.floor(to/SIZE),promoted=false;if(moving===1&&row===0){moving=2;promoted=true}if(moving===-1&&row===SIZE-1){moving=-2;promoted=true}next.board[to]=moving;
    if(move.captured!==null&&!promoted&&bestCaptureSequences(next,player,to).length)next.continuation=to;
    else{for(const cell of next.capturedThisTurn)next.board[cell]=0;next.capturedThisTurn=[];next.continuation=null;next.turn=1-player;}
    const nextSide=sideFor(next.turn),remaining=next.board.some(x=>Math.sign(x)===nextSide);
    if(!remaining||(!next.continuation&&!legalMoves(next,next.turn).length))next.winner=player;
    return next;
  }
  function evaluate(board){let score=0;for(let i=0;i<CELLS;i++){const p=board[i];if(!p)continue;const row=Math.floor(i/SIZE),king=Math.abs(p)===2,advance=p<0?row:SIZE-1-row;score+=-Math.sign(p)*((king?260:100)+(king?0:advance*2));}return score;}
  function search(state,depth,alpha,beta){
    if(state.winner!==null)return state.winner===1?10000+depth:-10000-depth;
    const ms=legalMoves(state);if(!ms.length)return state.turn===1?-10000-depth:10000+depth;
    if(depth===0)return evaluate(state.board);
    if(state.turn===1){let best=-Infinity;for(const m of ms){const n=play(state,state.turn,m.from,m.to);best=Math.max(best,search(n,depth-1,alpha,beta));alpha=Math.max(alpha,best);if(beta<=alpha)break;}return best;}
    let best=Infinity;for(const m of ms){const n=play(state,state.turn,m.from,m.to);best=Math.min(best,search(n,depth-1,alpha,beta));beta=Math.min(beta,best);if(beta<=alpha)break;}return best;
  }
  function chooseAiMove(state,difficulty='normal',rng=Math.random){
    const moves=legalMoves(state);if(!moves.length)return null;
    if(difficulty==='easy')return moves[Math.floor(rng()*moves.length)];
    const depth=difficulty==='hard'?3:2;let best=-Infinity,choices=[];
    for(const m of moves){const n=play(state,state.turn,m.from,m.to),score=search(n,depth-1,-Infinity,Infinity);if(score>best){best=score;choices=[m];}else if(score===best)choices.push(m);}
    return choices[Math.floor(rng()*choices.length)];
  }
  return {SIZE,CELLS,newGame,legalMoves,play,chooseAiMove,sideFor};
})()

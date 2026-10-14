(() => {
  const PATH=[
    [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0]
  ];
  const STARTS=[0,13,26,39];
  const HOME=[[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]];
  const SAFE=new Set([0,8,13,21,26,34,39,47]);
  const COLORS=['red','green','yellow','blue'];
  function newGame(count=4){
    if(!Number.isInteger(count)||count<2||count>4)throw new RangeError('Ludo admite de 2 a 4 jugadores.');
    return {players:Array(count).fill(null),tokens:Array.from({length:count},()=>Array(4).fill(-1)),turn:0,dice:null,consecutiveSixes:Array(count).fill(0),winner:null,lastAction:null,state:'playing'};
  }
  function playerView(state,seat=0){
    return {...state,turnSeat:state.turn,isUserTurn:state.turn===seat,winnerSeat:state.winner};
  }
  const activePlayers=state=>state.players.map((p,i)=>p?i:i).filter(i=>i<state.tokens.length);
  function nextPlayer(state,from){
    for(let step=1;step<=state.tokens.length;step++){
      const i=(from+step)%state.tokens.length;
      if(i!==state.winner&&state.players[i]!==false)return i;
    }
    return from;
  }
  function boardCell(player,progress){
    if(progress<0)return null;
    if(progress<52)return PATH[(STARTS[player]+progress)%52];
    return HOME[player][Math.min(5,progress-52)];
  }
  function legalTokens(state,player=state.turn,dice=state.dice){
    if(!state||state.winner!==null||player!==state.turn||!Number.isInteger(dice)||dice<1||dice>6)return [];
    const positions=state.tokens[player],moves=[];
    positions.forEach((progress,token)=>{
      if(progress===57)return;
      if(progress<0){if(dice===6)moves.push(token);return;}
      const target=progress+dice;if(target>57)return;
      if(target<52){
        const cell=boardCell(player,target),friendly=positions.filter((p,i)=>i!==token&&p>=0&&p<52&&JSON.stringify(boardCell(player,p))===JSON.stringify(cell)).length;
        if(friendly>=2)return;
      }
      moves.push(token);
    });
    return moves;
  }
  function finishRoll(state,player,dice){
    const next={...state,tokens:state.tokens.map(row=>row.slice()),consecutiveSixes:state.consecutiveSixes.slice(),dice,lastAction:{type:'roll',player,dice}};
    if(dice===6&&next.consecutiveSixes[player]>=2){next.consecutiveSixes[player]=0;next.turn=nextPlayer(next,player);next.dice=null;next.lastAction={type:'three-sixes',player,dice};return next;}
    next.consecutiveSixes[player]=dice===6?next.consecutiveSixes[player]+1:0;
    if(legalTokens(next,player,dice).length===0){
      if(dice!==6){next.turn=nextPlayer(next,player);next.consecutiveSixes[player]=0;}
      next.dice=null;next.lastAction={type:'no-move',player,dice};
    }
    return next;
  }
  function roll(state,player,value){
    if(!state||state.winner!==null||player!==state.turn||state.dice!==null||!Number.isInteger(value)||value<1||value>6)return null;
    return finishRoll(state,player,value);
  }
  function move(state,player,token){
    if(!state||state.winner!==null||player!==state.turn||state.dice===null||!Number.isInteger(token)||!legalTokens(state,player).includes(token))return null;
    const next={...state,tokens:state.tokens.map(row=>row.slice()),consecutiveSixes:state.consecutiveSixes.slice()};
    const from=next.tokens[player][token],dice=next.dice,to=from<0?0:from+dice;next.tokens[player][token]=to;
    const landing=to<52?boardCell(player,to):null,captured=[];
    if(landing&&!SAFE.has((STARTS[player]+to)%52))for(let p=0;p<next.tokens.length;p++)if(p!==player)next.tokens[p].forEach((progress,i)=>{
      if(progress>=0&&progress<52&&JSON.stringify(boardCell(p,progress))===JSON.stringify(landing)){next.tokens[p][i]=-1;captured.push({player:p,token:i});}
    });
    next.dice=null;next.lastAction={type:'move',player,token,from,to,dice,captured};
    if(next.tokens[player].every(progress=>progress===57)){next.winner=player;next.state='finished';return next;}
    if(dice!==6){next.turn=nextPlayer(next,player);next.consecutiveSixes[player]=0;}
    return next;
  }
  function aiToken(state,difficulty='normal',rng=Math.random){
    const legal=legalTokens(state);if(!legal.length)return null;
    if(difficulty==='easy')return legal[Math.floor(rng()*legal.length)];
    const player=state.turn,rollValue=state.dice;
    const score=token=>{
      const from=state.tokens[player][token],to=from<0?0:from+rollValue,cell=to<52?boardCell(player,to):null;
      let value=to===57?1000:to>=52?35+(to-52)*4:to+1;
      if(from<0)value+=difficulty==='hard'?24:12;
      if(cell&&SAFE.has((STARTS[player]+to)%52))value+=difficulty==='hard'?32:17;
      if(cell){for(let p=0;p<state.tokens.length;p++)if(p!==player&&state.tokens[p].some(progress=>progress>=0&&progress<52&&JSON.stringify(boardCell(p,progress))===JSON.stringify(cell)))value+=difficulty==='hard'?100:60;}
      if(difficulty==='hard'&&cell&&!SAFE.has((STARTS[player]+to)%52)){
        const danger=state.tokens.flatMap((positions,p)=>p===player?[]:positions.filter(progress=>progress>=0&&progress<52).map(progress=>({p,progress}))).filter(({p,progress})=>{
          for(let die=1;die<=6;die++)if((STARTS[p]+progress+die)%52===(STARTS[player]+to)%52)return true;
          return false;
        }).length;
        value-=danger*17;
      }
      return value;
    };
    return legal.reduce((best,current)=>score(current)>score(best)?current:best,legal[0]);
  }
  return {PATH,STARTS,HOME,SAFE,COLORS,newGame,playerView,boardCell,legalTokens,roll,move,aiToken,nextPlayer};
})()

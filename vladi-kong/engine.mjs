export const WIDTH=900,HEIGHT=1080;
export class Game {
 constructor(random=Math.random){this.random=random;this.level=1;this.lives=3;this.score=0;this.state='ready';this.keys={};this.resetStage()}
 surface(row,x){return 960-row*130+(row%2?1:-1)*(x-450)*.035}
 resetStage(){this.barrels=[];this.fx=[];this.elapsed=0;this.spawnTimer=2.2;this.remaining=115;this.power=0;this.checkpoint=0;this.stars=Array.from({length:6},(_,row)=>({row,x:row%2?590:320,taken:false}));this.hammer={row:2,x:520,taken:false};this.ladders=[];for(let row=0;row<5;row++){this.ladders.push({row,x:row%2?180:720});if(this.level>1)this.ladders.push({row,x:440+(row%2?35:-35)})}this.spawnPlayer();this.state='ready'}
 spawnPlayer(){const row=this.checkpoint,x=row%2?180:720;this.player={x:this.checkpoint?x:120,y:this.surface(row,this.checkpoint?x:120),vy:0,row,grounded:true,climbing:null,facing:1};this.invulnerable=2.5}
 start(){if(this.state==='ready')this.state='playing'}
 jump(){if(this.state!=='playing')return;const p=this.player;if(p.grounded&&!p.climbing){p.vy=-490;p.grounded=false;this.event='jump'}}
 damage(){if(this.state!=='playing'||this.invulnerable>0)return;this.lives--;this.event='hit';if(this.lives<=0){this.state='over';return}this.spawnPlayer();this.barrels=this.barrels.filter(b=>b.row>this.checkpoint);this.remaining=Math.max(this.remaining,55)}
 next(){if(this.state!=='won')return;this.level++;this.lives=Math.min(3,this.lives+1);this.resetStage();this.start()}
 restart(){this.level=1;this.lives=3;this.score=0;this.resetStage();this.start()}
 update(dt){if(this.state!=='playing')return;this.elapsed+=dt;this.remaining-=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.power=Math.max(0,this.power-dt);if(this.remaining<=0){this.invulnerable=0;this.damage();this.remaining=75;return}const p=this.player,k=this.keys;const move=(k.right?1:0)-(k.left?1:0),vertical=(k.down?1:0)-(k.up?1:0);if(move)p.facing=move;
 if(!p.climbing&&p.grounded&&vertical){const ladder=this.ladders.find(l=>Math.abs(l.x-p.x)<29&&((vertical<0&&l.row===p.row)||(vertical>0&&l.row+1===p.row)));if(ladder){p.climbing=ladder;p.x=ladder.x;p.grounded=false;p.vy=0}}
 if(p.climbing){const l=p.climbing;p.y+=vertical*150*dt;const upper=this.surface(l.row+1,l.x),lower=this.surface(l.row,l.x);if(p.y<=upper){p.y=upper;p.row=l.row+1;p.climbing=null;p.grounded=true;this.checkpoint=p.row;this.event='climb'}else if(p.y>=lower){p.y=lower;p.row=l.row;p.climbing=null;p.grounded=true}}
 else{p.x=Math.max(72,Math.min(828,p.x+move*230*dt));if(p.grounded)p.y=this.surface(p.row,p.x);else{p.vy+=1250*dt;p.y+=p.vy*dt;const floor=this.surface(p.row,p.x);if(p.vy>0&&p.y>=floor){p.y=floor;p.vy=0;p.grounded=true}}}
 for(const s of this.stars)if(!s.taken&&p.row===s.row&&Math.abs(p.x-s.x)<32&&Math.abs(p.y-this.surface(s.row,s.x))<70){s.taken=true;this.score+=100;this.event='star'}
 if(!this.hammer.taken&&p.row===2&&Math.abs(p.x-520)<30){this.hammer.taken=true;this.power=7;this.event='power'}
 this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnTimer=Math.max(1.65,3.6-this.level*.16);this.barrels.push({x:245,y:this.surface(5,245)-17,row:5,dir:1,falling:false,vy:0,spin:0,age:0});this.event='roll'}
 const speed=Math.min(200,100+this.level*9);for(const b of this.barrels){b.age+=dt;b.spin+=b.dir*speed*dt/17;if(b.falling){b.vy+=900*dt;b.y+=b.vy*dt;if(b.y>=this.surface(b.row,b.x)-17){b.falling=false;this.event='drop';b.y=this.surface(b.row,b.x)-17;b.dir=b.row%2?1:-1}}else{b.x+=b.dir*speed*dt;b.y=this.surface(b.row,b.x)-17;if(b.x>830||b.x<70){if(b.row===0){b.dead=true;continue}b.x=Math.max(70,Math.min(830,b.x));b.row--;b.falling=true;b.vy=0}}
 if(Math.abs(b.x-p.x)<32&&Math.abs(b.y-(p.y-26))<34){if(this.power>0){b.dead=true;this.score+=150;this.event='smash'}else this.damage()}}
 this.barrels=this.barrels.filter(b=>!b.dead);if(p.row===5&&p.x>780&&p.grounded){this.score+=500+Math.floor(this.remaining)*5;this.state='won';this.event='win'}
 }
}

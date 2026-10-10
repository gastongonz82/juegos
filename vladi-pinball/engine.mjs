export const W=600,H=1000;
export class Pinball{
 constructor(){this.state='ready';this.score=0;this.lives=3;this.level=1;this.time=0;this.balls=[];this.keys={};this.angles=[.38,Math.PI-.38];this.charge=0;this.targets=0;this.bumperHits=0;this.events=[];this.save=0;this.nudges=0;this.nudgeAt=0;this.launchBall()}
 emit(type){this.events.push(type);if(this.events.length>12)this.events.shift()}
 launchBall(){this.balls.push({x:552,y:915,vx:0,vy:0,r:10,waiting:true,trail:[],lastHit:0});this.charge=0}
 start(){if(this.state==='ready')this.state='playing'}
 plunge(){if(this.state!=='playing')return;const b=this.balls.find(b=>b.waiting);if(!b)return;b.waiting=false;b.vy=-(1380+Math.min(this.charge,1)*260);this.save=8;this.charge=0;this.emit('launch')}
 nudge(){if(this.state!=='playing')return;if(this.time-this.nudgeAt>12)this.nudges=0;this.nudgeAt=this.time;this.nudges++;if(this.nudges>3){this.tilt=3;this.emit('tilt');return}for(const b of this.balls)if(!b.waiting){b.vy-=150;b.vx+=b.x<300?85:-85}this.emit('nudge')}
 segment(b,a,c,restitution=.8,velocity={x:0,y:0}){const dx=c.x-a.x,dy=c.y-a.y,len=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/len)),x=a.x+t*dx,y=a.y+t*dy;let nx=b.x-x,ny=b.y-y,d=Math.hypot(nx,ny);if(d>=b.r+3)return false;if(d<.001){nx=-dy;ny=dx;d=Math.hypot(nx,ny)}nx/=d;ny/=d;b.x=x+nx*(b.r+3.1);b.y=y+ny*(b.r+3.1);const impact=(b.vx-velocity.x)*nx+(b.vy-velocity.y)*ny;if(impact<0){b.vx-=(1+restitution)*impact*nx;b.vy-=(1+restitution)*impact*ny}return true}
 update(dt){if(this.state!=='playing')return;this.time+=dt;this.save=Math.max(0,this.save-dt);this.tilt=Math.max(0,(this.tilt||0)-dt);if(this.keys.launch)this.charge=Math.min(1,this.charge+dt*.8);const old=this.angles.slice();for(let i=0;i<2;i++){const pressed=this.keys[i?'right':'left']&&!this.tilt,target=i?(pressed?Math.PI+.48:Math.PI-.38):(pressed?-.48:.38);this.angles[i]+=Math.max(-dt*14,Math.min(dt*14,target-this.angles[i]))}
 const walls=[[[45,800],[35,220]],[[35,220],[80,70]],[[80,70],[490,45]],[[490,45],[565,90]],[[565,90],[575,955]],[[520,180],[520,940]],[[45,800],[110,895]],[[510,800],[445,895]],[[80,745],[145,790]],[[465,790],[510,745]],[[85,680],[165,735]],[[465,735],[515,680]]];
 for(const b of this.balls){if(b.waiting)continue;if(b.ramp){b.ramp.t+=dt;const t=b.ramp.t/1.1;b.x=300+205*Math.sin(-Math.PI/2+t*Math.PI*2);b.y=295-180*Math.cos(-Math.PI/2+t*Math.PI*2);if(t>=1){b.ramp=null;b.x=450;b.y=390;b.vx=-160;b.vy=400;this.score+=2500;this.emit('ramp');this.advance()}continue}b.vy+=860*dt;b.vx*=Math.pow(.998,dt*120);b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x>530&&b.y<160&&b.vy<0){b.x=506;b.vx=-540;b.vy=-400}
 for(const [a,c] of walls)this.segment(b,{x:a[0],y:a[1]},{x:c[0],y:c[1]});
 for(let i=0;i<2;i++){const pivot={x:i?440:160,y:845},angle=this.angles[i],end={x:pivot.x+108*Math.cos(angle),y:pivot.y+108*Math.sin(angle)},omega=(angle-old[i])/dt;const dx=b.x-pivot.x,dy=b.y-pivot.y;const v={x:-omega*dy,y:omega*dx};if(this.segment(b,pivot,end,.78,v)&&Math.abs(omega)>1)this.emit('flip')}
 for(const [x,y] of [[210,295],[365,280],[295,405]]){let dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d<46){dx/=d||1;dy/=d||1;b.x=x+dx*46;b.y=y+dy*46;const dot=b.vx*dx+b.vy*dy;if(dot<0){b.vx-=(dot*1.6-240)*dx;b.vy-=(dot*1.6-240)*dy;if(this.time-b.lastHit>.08){this.score+=150;this.bumperHits++;b.lastHit=this.time;this.emit('bumper')}}}}
 for(let i=0;i<4;i++){const x=105+i*110;if(b.y>170&&b.y<200&&Math.abs(b.x-x)<22&&b.vy<0){const mask=1<<i;if(!(this.targets&mask)){this.targets|=mask;this.score+=500;this.emit('target');if(this.targets===15){this.score+=5000;this.targets=0;this.multiball();this.advance()}}b.vy=Math.abs(b.vy)*.9}}
 if(b.x<125&&b.y>350&&b.y<430&&b.vy<-480){b.ramp={t:0};this.emit('orbit')}
 if(b.x>460&&b.x<505&&b.y>460&&b.y<530&&b.vy<-300){b.x=300;b.y=450;b.vx=-180;b.vy=320;this.score+=1200;this.emit('scoop');this.advance()}
 if(b.y>1000){b.dead=true;if(this.save>0&&this.balls.filter(x=>!x.dead).length===0){this.launchBall();this.emit('save')}}
 const speed=Math.hypot(b.vx,b.vy);if(speed>1850){b.vx*=1850/speed;b.vy*=1850/speed}}
 this.balls=this.balls.filter(b=>!b.dead);if(!this.balls.length){this.lives--;this.emit('lost');if(this.lives<=0){this.state='over';return}this.launchBall()}}
 advance(){this.missions=(this.missions||0)+1;if(this.missions%3===0){this.level++;this.score+=3000;this.emit('level')}}
 multiball(){if(this.balls.length>1)return;for(let i=0;i<2;i++)this.balls.push({x:260+i*70,y:470,vx:i?230:-230,vy:-330,r:10,waiting:false,lastHit:0});this.save=10;this.emit('multi')}
}

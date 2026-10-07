/* Vladi Bowling: deterministic 2.5D arcade model in metres.
   USBC geometry; fixed-step impulses and finite fallen-pin bodies.
   This is an accessible game model, not a certified rigid-body simulator. */
(function(root, factory) {
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.BowlingPhysics=api;
})(typeof window==='object'?window:globalThis, function() {
  'use strict';
  const C=Object.freeze({width:1.0541,headZ:18.288,spacing:.3048,pinRadius:.06053,pinHeight:.381,ballRadius:.108,ballMass:6.35,pinMass:1.59,step:1/240,pitZ:19.40});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function rack(){const out=[];for(let row=0,id=1;row<4;row++)for(let col=0;col<=row;col++)out.push({id:id++,row,x:(col-row/2)*C.spacing,z:C.headZ+row*C.spacing*Math.sqrt(3)/2,vx:0,vz:0,down:false,tilt:0,angle:0,angular:0,removed:false});return out;}
  function launch({position=0,target=0,power=.72,spin=0}={}) {
    const speed=4.8+clamp(power,0,1)*4.2;
    const x=clamp(position,-.40,.40), angle=Math.atan2(clamp(target,-1.4,1.4)-x,C.headZ);
    return {x,z:0,vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,r:C.ballRadius,mass:C.ballMass,spin:clamp(spin,-1,1),rotation:0,gutter:false,exited:false,hit:false};
  }
  function moveBall(b,dt) {
    if(b.exited)return;
    if(!b.hit&&!b.gutter) {
      // Skid on the oiled front, progressively stronger hook in the dry backend.
      const dry=clamp((b.z-10.5)/5.5,0,1);
      b.vx+=b.spin*1.25*dry*dt;
      b.vz=Math.max(.2,b.vz-.09*dt);
    }
    b.x+=b.vx*dt;b.z+=b.vz*dt;b.rotation+=Math.hypot(b.vx,b.vz)*dt/C.ballRadius;
    if(!b.gutter&&b.z<C.headZ-.20&&Math.abs(b.x)>C.width/2) {b.gutter=true;b.vx=0;b.x=Math.sign(b.x)*(C.width/2+.095);}
    if(b.gutter)b.x=Math.sign(b.x)*(C.width/2+.095);
    if(b.z>C.pitZ+.3)b.exited=true;
  }
  function samples(p) {
    if(!p.down)return [{x:p.x,z:p.z,r:C.pinRadius}];
    // A tipped pin has length, so its neck can carry to a neighbouring pin.
    const length=.21*p.tilt, dx=Math.sin(p.angle)*length, dz=Math.cos(p.angle)*length;
    return [{x:p.x,z:p.z,r:C.pinRadius},{x:p.x+dx*.5,z:p.z+dz*.5,r:.043},{x:p.x+dx,z:p.z+dz,r:.034}];
  }
  function tip(p,ix,iz) {
    if(p.down)return;
    if(Math.hypot(ix,iz)>.72) {
      p.down=true;p.angle=Math.atan2(ix,iz);p.angular=clamp(Math.hypot(ix,iz)*.22,1.8,6);
    }
  }
  function collide(a,b,isBall=false) {
    if(Math.abs(a.x-b.x)>.55||Math.abs(a.z-b.z)>.55)return false;
    if(!isBall&&!a.down&&!b.down&&Math.abs(a.vx)+Math.abs(a.vz)+Math.abs(b.vx)+Math.abs(b.vz)<.0001)return false;
    const as=isBall?[{x:a.x,z:a.z,r:C.ballRadius}]:samples(a),bs=samples(b);
    let contact=null;
    for(const aa of as)for(const bb of bs){const dx=bb.x-aa.x,dz=bb.z-aa.z,d=Math.hypot(dx,dz),overlap=aa.r+bb.r-d;if(overlap>0&&(!contact||overlap>contact.overlap))contact={nx:dx/(d||1),nz:dz/(d||1),overlap};}
    if(!contact)return false;
    const {nx,nz,overlap}=contact,invA=1/(isBall?C.ballMass:C.pinMass),invB=1/C.pinMass;
    const relative=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
    if(relative<0) {
      const j=-(1+.61)*relative/(invA+invB),ix=j*nx,iz=j*nz;
      a.vx-=ix*invA;a.vz-=iz*invA;b.vx+=ix*invB;b.vz+=iz*invB;
      tip(b,ix,iz);if(!isBall)tip(a,-ix,-iz);else a.hit=true;
    }
    const correction=Math.max(0,overlap-.0003)*.62/(invA+invB);
    a.x-=nx*correction*invA;a.z-=nz*correction*invA;b.x+=nx*correction*invB;b.z+=nz*correction*invB;
    return relative<-.10;
  }
  function step(sim,dt=C.step) {
    const b=sim.ball;moveBall(b,dt);let impacts=0;
    for(const p of sim.pins) {
      if(p.removed)continue;
      p.x+=p.vx*dt;p.z+=p.vz*dt;
      const speed=Math.hypot(p.vx,p.vz),drag=(p.down?1.8:3.2)*dt;
      const attenuation=speed>0?Math.max(0,1-drag/speed):0;p.vx*=attenuation;p.vz*=attenuation;
      if(p.down)p.tilt=Math.min(1,p.tilt+p.angular*dt);
      if(p.z>C.pitZ || p.z<C.headZ-1.2){p.removed=true;continue;}
      if(p.down&&Math.abs(p.x)>.69){p.x=Math.sign(p.x)*.69;p.vx*=-.44;}
    }
    // Iterate contacts to resolve simultaneous headpin/pocket hits without tunnelling.
    for(let pass=0;pass<2;pass++)for(let i=0;i<sim.pins.length;i++) {
      const p=sim.pins[i];if(p.removed)continue;
      if(!b.gutter&&!b.exited&&collide(b,p,true))impacts++;
      for(let j=i+1;j<sim.pins.length;j++){const other=sim.pins[j];if(!other.removed&&collide(p,other))impacts++;}
    }
    sim.time+=dt;
    if((b.exited||Math.hypot(b.vx,b.vz)<.3)&&sim.firstEnd===null)sim.firstEnd=sim.time;
    const moving=sim.pins.some(p=>!p.removed&&Math.hypot(p.vx,p.vz)>.12);
    if((sim.firstEnd!==null&&sim.time-sim.firstEnd>1.15&&!moving)||sim.time>8)sim.done=true;
    return impacts;
  }
  function create(pins=rack(),options={}) {return {pins,ball:launch(options),time:0,firstEnd:null,done:false};}
  function preview(options) {const b=launch(options),points=[{x:b.x,z:b.z}];for(let i=0;i<1800&&b.z<C.headZ&&!b.gutter;i++){moveBall(b,C.step);if(i%18===0)points.push({x:b.x,z:b.z});}points.push({x:b.x,z:b.z});return points;}
  function score(rolls) {
    let total=0,index=0;const frames=[];
    for(let f=0;f<10;f++) {
      if(index>=rolls.length){frames.push(null);continue;}
      let value=null;
      if(f===9){const a=rolls[index],b=rolls[index+1],need=a===10||(b!==undefined&&a+b===10)?3:2;if(index+need<=rolls.length)value=rolls.slice(index,index+need).reduce((a,b)=>a+b,0);}
      else if(rolls[index]===10){if(index+2<rolls.length)value=10+rolls[index+1]+rolls[index+2];index++;}
      else {if(index+1<rolls.length){const sum=rolls[index]+rolls[index+1];if(sum<10)value=sum;else if(index+2<rolls.length)value=10+rolls[index+2];}index+=2;}
      if(value!==null)total+=value;frames.push(value===null?null:total);
    }
    return {total,frames};
  }
  return {C,rack,launch,create,step,preview,score};
});

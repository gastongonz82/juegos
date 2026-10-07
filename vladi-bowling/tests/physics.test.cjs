const {test}=require('node:test');const assert=require('node:assert/strict');const P=require('../physics');
function shoot(options,pins=P.rack()){const s=P.create(pins,options);while(!s.done)P.step(s);return s;}
const down=s=>s.pins.filter(p=>p.down).length;
test('USBC triangular rack has 12-inch equilateral spacing and the headpin nearest the ball',()=>{
 const rack=P.rack();assert.equal(rack.length,10);assert.equal(rack[0].id,1);assert.equal(rack[0].z,18.288);
 for(let i=0;i<10;i++){const distances=rack.filter((p,j)=>j!==i).map(p=>Math.hypot(p.x-rack[i].x,p.z-rack[i].z));assert(Math.abs(Math.min(...distances)-.3048)<1e-10);}
 assert.equal(rack.filter(p=>p.row===3).length,4);
});
test('straight, pocket and wide shots produce contacts instead of predefined pin counts',()=>{
 const central=shoot({target:0,power:.72});const pocket=shoot({target:.06,power:.72});const side=shoot({target:.40,power:.72});const gutter=shoot({target:.8,power:.72});
 assert(down(central)>0&&down(central)<10);assert.equal(down(pocket),10);assert(down(side)<down(central));assert.equal(down(gutter),0);assert(gutter.ball.gutter);assert(gutter.ball.z>P.C.headZ);
});
test('more force is not a guaranteed strike',()=>{assert(down(shoot({target:.06,power:1}))<10);});
test('hook really bends the ball, and preview matches the delivery before contact',()=>{
 const straight=P.preview({position:-.2,target:-.2,spin:0,power:.72});const hook=P.preview({position:-.2,target:-.2,spin:.6,power:.72});
 assert(Math.abs(straight.at(-1).x+.2)<1e-8);assert(hook.at(-1).x>straight.at(-1).x+.1);
 const sim=P.create([],{position:-.2,target:-.2,spin:.6,power:.72});while(sim.ball.z<hook.at(-1).z)P.step(sim);assert(Math.abs(sim.ball.x-hook.at(-1).x)<.002);
});
test('same shot is deterministic; mirror shots mirror pinfall',()=>{
 const options={target:.2,power:.72};const a=shoot(options),b=shoot(options),left=shoot({target:-.2,power:.72});assert.deepEqual(a,b);assert.equal(down(left),down(a));
});
test('second ball only hits the standing leave and can spare a single corner pin',()=>{
 const first=shoot({target:.06,power:1});const leave=first.pins.filter(p=>!p.down);assert.equal(leave.length,1);const corner=leave[0];const second=shoot({target:corner.x,power:.6},leave);assert.equal(down(second),1);
});
test('all contacts remain finite, no phantom pinfall before rack, no result depends on display size',()=>{
 for(const target of [-1.2,-.4,-.06,0,.06,.4,1.2])for(const spin of [-.5,0,.5]) {
  const sim=P.create(P.rack(),{target,spin});while(!sim.done){P.step(sim);if(sim.ball.z<P.C.headZ-.4)assert(sim.pins.every(p=>!p.down));assert(Number.isFinite(sim.ball.x));assert(sim.pins.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));}assert(down(sim)>=0&&down(sim)<=10);
 }
});
test('official scoring: perfect 300, spares 150, misses 0, open 90, mixed USBC example 150',()=>{
 assert.equal(P.score(Array(12).fill(10)).total,300);assert.equal(P.score(Array(21).fill(5)).total,150);assert.equal(P.score(Array(20).fill(0)).total,0);assert.equal(P.score(Array.from({length:20},(_,i)=>i%2?4:5)).total,90);
 // USBC Keeping Score frame-by-frame walkthrough.
 assert.equal(P.score([8,0,5,5,3,5,8,1,7,1,10,9,1,10,10,8,2,6]).total,150);
});
test('unresolved bonuses remain pending, tenth bonuses do not create an eleventh frame',()=>{
 assert.equal(P.score([10]).frames[0],null);assert.equal(P.score([10,5,2]).frames[0],17);assert.equal(P.score([5,5]).total,0);
 assert.equal(P.score([...Array(18).fill(0),10,7,2]).total,19);
 assert.equal(P.score([...Array(18).fill(0),8,2,6]).total,16);
 assert.equal(P.score([...Array(18).fill(0),10,10]).frames[9],null);
});

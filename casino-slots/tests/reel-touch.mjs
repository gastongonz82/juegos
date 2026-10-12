import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {bindReelTouch}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../reel-touch.js',import.meta.url))).toString('base64'));
function fixture(){
 const handlers={};let spins=0,time=0,allowed=true;
 const element={classList:{add(){}},setPointerCapture(){},addEventListener(name,fn){handlers[name]=fn}};
 bindReelTouch(element,{canSpin:()=>allowed,spin:()=>{spins++},now:()=>time});
 const event=(name,overrides={})=>handlers[name]({pointerId:1,pointerType:'touch',isPrimary:true,clientX:50,clientY:50,cancelable:true,preventDefault(){},...overrides});
 return {event,get spins(){return spins},set allowed(v){allowed=v},set time(v){time=v}};
}
test('tap and vertical impulse trigger exactly once per gesture',()=>{
 const f=fixture();f.event('pointerdown');f.time=100;f.event('pointerup');assert.equal(f.spins,1);
 f.event('pointerdown');f.event('pointermove',{clientY:90});assert.equal(f.spins,2);
 f.event('pointermove',{clientY:130});f.event('pointerup',{clientY:140});assert.equal(f.spins,2);
 f.event('pointerdown');f.event('pointerup',{clientY:10});assert.equal(f.spins,3);
});
test('horizontal movement, long hold, mouse and cancelled gesture do not spin',()=>{
 const f=fixture();f.event('pointerdown');f.event('pointermove',{clientX:110,clientY:80});f.event('pointerup',{clientX:110,clientY:80});
 f.event('pointerdown');f.time=800;f.event('pointerup');
 f.event('pointerdown',{pointerType:'mouse'});f.event('pointerup',{pointerType:'mouse'});
 f.event('pointerdown');f.event('pointercancel');f.event('pointerup');
 f.event('pointerdown');f.event('lostpointercapture');f.event('pointerup');assert.equal(f.spins,0);
});
test('busy/modal guard and multiple fingers cannot create a second wager',()=>{
 const f=fixture();f.allowed=false;f.event('pointerdown');f.event('pointerup');assert.equal(f.spins,0);
 f.allowed=true;f.event('pointerdown');f.allowed=false;f.event('pointerup');assert.equal(f.spins,0);
 f.allowed=true;f.event('pointerdown');f.event('pointerdown',{pointerId:2,isPrimary:false});f.event('pointerup');assert.equal(f.spins,0);
 f.event('pointerdown');f.event('pointerup',{pointerId:2});assert.equal(f.spins,0);f.event('pointerup');assert.equal(f.spins,1);
});

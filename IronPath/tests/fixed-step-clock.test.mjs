import {strict as assert} from 'node:assert';
import {createFixedStepClock} from '../fixed-step-clock.mjs';
let now=0,steps=0,paused=false;const c=createFixedStepClock({step:1/30,now:()=>now,advance:()=>{if(paused)return null;steps++;return {};}});
now=50;c.tick();now=100;c.tick();assert.equal(steps,3,'slow timers catch up to real time');
now=1100;c.tick();assert.equal(steps,10,'background stalls are bounded');
paused=true;now+=100;c.tick();paused=false;now+=34;c.tick();assert.equal(steps,11,'paused simulation does not accumulate debt');
now+=2000;c.reset();now+=34;c.tick();assert.equal(steps,12,'reset avoids offline catch-up');
console.log('Fixed-step clock compensates timer jitter and bounds long stalls.');

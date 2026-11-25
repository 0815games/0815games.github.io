// IPL-0134 Power-Governor: frame-based throttling and battery floor. Pure
// state machine - the tests drive a fake clock through the exact hold times.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPowerGovernor,POWER_POLICIES} from '../core/power-governor.mjs';

test('starts at full and ignores unusable samples',()=>{
  let t=0;
  const g=createPowerGovernor({now:()=>t});
  assert.equal(g.policy().id,'full');
  assert.equal(g.policy().drawGapMs,0);
  assert.equal(g.policy().dprCap,3);
  g.sample(NaN);
  g.sample(-4);
  g.sample(undefined);
  assert.equal(g.policy().id,'full');
});

test('the policies are the three documented gears',()=>{
  assert.deepEqual(POWER_POLICIES.map(p=>p.id),['full','eco','max']);
  assert.deepEqual(POWER_POLICIES.map(p=>p.drawGapMs),[0,30,40]);
  assert.deepEqual(POWER_POLICIES.map(p=>p.dprCap),[3,2,1.5]);
  assert.deepEqual(POWER_POLICIES.map(p=>p.weather),[true,true,false]);
  assert.deepEqual(POWER_POLICIES.map(p=>p.tracers),[true,true,false]);
});

test('sustained slow frames step down through eco to max',()=>{
  let t=0;
  const g=createPowerGovernor({now:()=>t});
  for(let i=0;i<400;i++){t+=30;g.sample(30);} // 12 s of 30 ms gaps
  assert.equal(g.policy().id,'max','two holds of 4 s with the 5 s cooldown');
  assert.equal(g.policy().drawGapMs,40);
  assert.equal(g.policy().weather,false);
});

test('one frame spike (tab resume) never changes the tier',()=>{
  let t=0;
  const g=createPowerGovernor({now:()=>t});
  t+=1200;g.sample(1200);
  for(let i=0;i<120;i++){t+=16.7;g.sample(16.7);}
  assert.equal(g.policy().id,'full');
});

test('comfortable frames climb back to full',()=>{
  let t=0;
  const g=createPowerGovernor({now:()=>t});
  for(let i=0;i<400;i++){t+=30;g.sample(30);}
  assert.equal(g.policy().id,'max');
  for(let i=0;i<3200;i++){t+=16.7;g.sample(16.7);} // ~53 s of air
  assert.equal(g.policy().id,'full');
});

test('the battery raises the floor and charging releases it',()=>{
  const listeners={};
  const battery={charging:false,level:.2,addEventListener:(k,fn)=>{listeners[k]=fn;}};
  let t=0;
  const changes=[];
  const g=createPowerGovernor({now:()=>t,onTierChange:id=>changes.push(id)});
  g.attachBattery(battery);
  assert.equal(g.policy().id,'eco','20% unplugged holds at least eco');
  for(let i=0;i<1500;i++){t+=16.7;g.sample(16.7);}
  assert.equal(g.policy().id,'eco','fast frames cannot beat the floor');
  battery.level=.1;
  listeners.levelchange();
  assert.equal(g.policy().id,'max','10% unplugged floors at max');
  battery.charging=true;
  listeners.chargingchange();
  assert.equal(g.policy().id,'full','charging releases the floor');
  assert.ok(changes.length>=3,'tier changes are announced');
});

test('a battery without listeners is simply not attached',()=>{
  const g=createPowerGovernor();
  g.attachBattery(null);
  g.attachBattery({});
  assert.equal(g.policy().id,'full');
});

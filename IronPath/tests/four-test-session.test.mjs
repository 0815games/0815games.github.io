import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFourTestSession} from '../four-test-session.mjs';
test('offline co-op uses four wallets and starts both roads with simulated approvals',()=>{
 const s=createFourTestSession('four-coop');assert.equal(s.command('p2',{type:'build',pad:15,towerType:0}).ok,true);assert.equal(s.field('p1').players.p2.money,75);assert.equal(s.field('p1').players.p1.money,125);assert.equal(s.startWave().ok,true);assert.equal(s.game.pending,null);assert.equal(s.field('p1').wave,1);for(let i=0;i<40;i++)s.step();assert.deepEqual(s.field('p1').enemies.slice(0,2).map(e=>e.road),[0,1]);
});
test('offline 2v2 switches fields and starts synchronized waves',()=>{
 const s=createFourTestSession('two-vs-two');assert.equal(s.command('p3',{type:'build',pad:0,towerType:1}).ok,true);assert.equal(s.field('p1').towers.length,0);assert.equal(s.field('p4').towers.length,1);assert.equal(s.startWave().ok,true);assert.deepEqual(s.game.lanes.map(l=>l.wave),[1,1]);assert.throws(()=>s.field('bad'));
});

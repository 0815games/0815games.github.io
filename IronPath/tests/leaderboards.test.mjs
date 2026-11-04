import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {waveFromMask,createScoreReporter} from '../leaderboards.mjs';
import {WAVE_COUNT} from '../combat.mjs';
test('only completed wave bits count and blocks map to absolute waves',()=>{assert.equal(waveFromMask(0),0);assert.equal(waveFromMask(1),1);assert.equal(waveFromMask(5),3);assert.equal(waveFromMask(1,1),WAVE_COUNT+1);assert.equal(waveFromMask(-1),0);assert.equal(waveFromMask(1,-1),0);});
test('reporter coalesces snapshots and keeps solo and co-op separate',async()=>{let resolve;const calls=[];const reporter=createScoreReporter({service:{record(mode,wave){calls.push([mode,wave]);if(calls.length===1)return new Promise(r=>resolve=r);return Promise.resolve({wave});}},getName:()=> 'Alice'});reporter.observe('solo',2);reporter.observe('solo',4);reporter.observe('solo',3);reporter.observe('coop',6);resolve({wave:2});await new Promise(r=>setImmediate(r));assert.deepEqual(calls,[['solo',2],['coop',6],['solo',4]]);reporter.observe('solo',2);await new Promise(r=>setImmediate(r));assert.equal(calls.length,3);reporter.close();});

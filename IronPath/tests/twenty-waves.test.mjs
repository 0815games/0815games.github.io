import {strict as assert} from 'node:assert';
import {WAVES,WAVE_COUNT,MAX_WAVE_MASK} from '../combat.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
assert.equal(WAVE_COUNT,20);assert.equal(MAX_WAVE_MASK,1048575);assert.equal(WAVES.length,20);
assert.ok(WAVES[14].filter(x=>x==='tank').length>WAVES[13].filter(x=>x==='tank').length,'wave 15 is a tank-heavy milestone');
assert.ok(WAVES[19].filter(x=>x==='tank').length>WAVES[18].filter(x=>x==='tank').length,'final wave is a tank-heavy milestone');
const player=id=>createPlayer(id,{name:id,gender:'female',level:1});
for(const ids of [['solo'],['host','guest']]){
 const s=createMatch(ids.map(player));s.wave=10;s.running=true;s.spawnLeft=0;s.enemies=[];
 const e10=stepMatch(s).find(e=>e.type==='waveCleared');assert.equal(e10.victory,false);assert.equal(s.ended,false);
 assert.equal(applyCommand(s,ids[0],{type:'startWave'}).ok,true);assert.equal(s.wave,11);assert.equal(s.spawnLeft,WAVES[10].length);
 s.wave=20;s.running=true;s.spawnLeft=0;s.enemies=[];const e20=stepMatch(s).find(e=>e.type==='waveCleared');assert.equal(e20.victory,true);assert.equal(e20.xp,220);assert.equal(s.ended,true);
 if(ids.length===2)for(const id of ids)assert.equal(s.players[id].completedWaveMask,(1<<9)|(1<<19));
}
console.log('Twenty waves, milestones, progression and victory checks passed.');

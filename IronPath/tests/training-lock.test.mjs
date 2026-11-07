import {test} from 'node:test';
import {strict as assert} from 'node:assert';
// The training wallet is sized for ONE tower plus its first upgrade. A second
// tower in that window strands the soldier short of the upgrade money - the
// reported tutorial deadlock: "2 Türme = nicht genug Geld für ein Upgrade,
// auch nicht nach Verkauf." The engine refuses the second build until the
// first tower is upgraded; the build sheet shows the same lock.
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer,applyCommand,trainingBuildLocked} from '../match.mjs';
import {trainingContract} from '../training-run.mjs';

const player=()=>createPlayer('local',{name:'Recruit',gender:'female',level:1},850,450);
const training=()=>createSoloDeployment({player:player(),mapId:'road',campaign:trainingContract()});

test('a second tower is refused until the first one is upgraded - in training only',()=>{
 const state=training();
 assert.equal(state.campaignContract.threat,'training');
 assert.equal(trainingBuildLocked(state),false,'an empty field builds freely');
 assert.equal(applyCommand(state,'local',{type:'build',pad:0,towerType:0}).ok,true);
 assert.equal(trainingBuildLocked(state),true,'one tower, not yet upgraded: locked');
 const refused=applyCommand(state,'local',{type:'build',pad:1,towerType:0});
 assert.equal(refused.ok,false);
 assert.match(refused.reason,/upgrade your first tower/i);
 // The wallet can still pay the upgrade - that is the whole point of the lock.
 assert.equal(applyCommand(state,'local',{type:'upgrade',pad:0}).ok,true);
 assert.equal(trainingBuildLocked(state),false,'upgraded: the lock lifts');
 // 150 - 50 - 70 leaves 30: the second tower needs the sale of the first
 // (refund 60). A sold tower lifts the lock trivially - the field is empty.
 assert.equal(applyCommand(state,'local',{type:'sell',pad:0}).ok,true);
 assert.equal(applyCommand(state,'local',{type:'build',pad:1,towerType:0}).ok,true);
 // Endless and missions never had the lock.
 const endless=createMatch([player()],'g3-09e3779b1');
 assert.equal(applyCommand(endless,'local',{type:'build',pad:0,towerType:0}).ok,true);
 assert.equal(applyCommand(endless,'local',{type:'build',pad:1,towerType:0}).ok,true);
});

test('selling the tower lifts the lock - rebuilding the first tower is fine',()=>{
 const state=training();
 assert.equal(applyCommand(state,'local',{type:'build',pad:0,towerType:0}).ok,true);
 assert.equal(applyCommand(state,'local',{type:'sell',pad:0}).ok,true);
 assert.equal(trainingBuildLocked(state),false,'no tower on the field: build again');
 assert.equal(applyCommand(state,'local',{type:'build',pad:1,towerType:0}).ok,true);
});

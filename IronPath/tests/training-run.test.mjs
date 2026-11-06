import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {
 TRAINING_WAVES,TRAINING_UNIT,TRAINING_BUNKER,TRAINING_BOSS_UNIT,TRAINING_KEY,
 trainingContract,trainingUnitScale,trainingXP,trainingProgress,trainingWon,trainingStatus,
 trainingSeen,markTrainingSeen,
} from '../training-run.mjs';
import {characterProgress} from '../progression.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';

const profile=()=>({name:'Rook',gender:'male',xp:0,armory:{scrap:0,owned:0,equipped:0}});
const player=()=>createPlayer('local',{name:'Rook',gender:'male',level:1,loadout:'0,0,0'});
const deploy=()=>createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'training-contract',threat:'training'}});

test('the training contract is six waves, softer enemies and a reinforced bunker',()=>{
 const contract=trainingContract();
 assert.equal(contract.waves,TRAINING_WAVES);
 assert.equal(TRAINING_WAVES,6,'six waves, not the three the old tour used');
 assert.ok(TRAINING_UNIT<1,'enemies are weakened');
 assert.ok(TRAINING_BUNKER>1,'the bunker is reinforced');
 assert.ok(TRAINING_BOSS_UNIT<TRAINING_UNIT,'the boss is weakened further than the rank and file');
 assert.ok(trainingUnitScale(true)<trainingUnitScale(false));
});

test('clearing every wave of the contract pays exactly one level and one skill point',()=>{
 const xp=trainingXP();
 assert.equal(characterProgress(xp).level,2,'the run ends at level 2');
 let fiveWaves=0;
 for(let wave=1;wave<=5;wave++)fiveWaves+=20+wave*10;
 assert.equal(fiveWaves,250,'five waves are 250 XP');
 assert.equal(characterProgress(fiveWaves).level,1,'the fifth wave alone does not reach level 2');
 assert.equal(trainingXP(),330,'30+40+50+60+70+80');
});

test('a training deployment is a real match with the contract attached',()=>{
 const state=deploy();
 assert.equal(state.maxHp,150,'100 base health at 150%');
 assert.equal(state.campaignContract.threat,'training');
 assert.equal(state.campaignContract.waves,6);
 assert.equal(state.campaignContract.unit,TRAINING_UNIT);
 assert.ok(state.campaignContract.bossUnit>0,'the boss weakening travels with the contract');
 // Endless solo and story missions keep their own numbers.
 const endless=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false});
 assert.equal(endless.campaignContract,undefined);
 assert.equal(endless.maxHp,100);
 const legendary=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'tidelock',threat:'legendary'}});
 assert.equal(legendary.maxHp,55);
 assert.equal(legendary.campaignContract.bossUnit,undefined,'only training weakens bosses');
});

test('training enemies really spawn weaker than the same wave of endless',()=>{
 const training=deploy();
 const endless=createMatch([player()],'road');
 for(const state of [training,endless]){
  state.wave=2;state.running=true;state.spawnLeft=1;state.spawnIndex=0;state.spawnTimer=0;
  stepMatch(state);
 }
 const trainingEnemy=training.enemies[0],endlessEnemy=endless.enemies[0];
 assert.ok(trainingEnemy&&endlessEnemy);
 assert.ok(trainingEnemy.maxHp<endlessEnemy.maxHp,`${trainingEnemy.maxHp} should be below ${endlessEnemy.maxHp}`);
 assert.equal(trainingEnemy.maxHp,Math.round(endlessEnemy.maxHp*TRAINING_UNIT));
 assert.equal(trainingEnemy.campaign,true);
});

test('the contract ends itself after the last wave',()=>{
 let state=deploy();
 assert.equal(trainingWon(state),false,'not before the first deploy');
 state.wave=1;state.running=true;assert.equal(trainingWon(state),false);
 state.running=false;state.wave=5;assert.equal(trainingWon(state),false,'wave 5 is the boss, not the end');
 state.wave=6;assert.equal(trainingWon(state),true);
 state.ended=true;assert.equal(trainingWon(state),false,'an ended run is handled by the results screen');
 assert.deepEqual(trainingProgress({wave:3}),{wave:3,total:6,remaining:3});
 assert.equal(trainingProgress({}).wave,0);
});

test('the objective panel speaks plainly about the contract',()=>{
 const tr=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
 const before=trainingStatus({},tr);
 assert.match(before.detail,/first wave/);
 const during=trainingStatus({wave:2},tr);
 assert.equal(during.progress,2);
 assert.equal(during.max,6);
 assert.match(during.label,/Wave 2 of 6/);
});

test('the training run is offered once per account and browser',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.equal(trainingSeen('soldier-a',storage),false);
 markTrainingSeen('soldier-a',storage);
 assert.equal(store.get(`${TRAINING_KEY}:soldier-a`),'done');
 assert.equal(trainingSeen('soldier-a',storage),true);
 assert.equal(trainingSeen('soldier-b',storage),false,'a second account is offered its own run');
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(trainingSeen('soldier-c',broken),false);
 markTrainingSeen('soldier-c',broken);
 assert.equal(trainingSeen('soldier-c',broken),true,'storage failures do not break the gate');
 assert.equal(trainingSeen(null,storage),false,'no account, nothing offered');
});

test('the game wires the contract without inventing a second run loop',()=>{
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(game,/startTrainingRun/,'the training run is part of the game API');
 assert.match(game,/trainingWon\(state\)/,'the run ends itself after the last wave');
 assert.match(game,/campaign:activeTraining\?trainingContract\(\)/,'the contract reaches the real deployment');
 assert.match(game,/onFinish:id=>\{if\(trainingSeen\(id,tutorialStorage\)\)return;/,'the tutorial hands over exactly once');
 assert.match(game,/if\(activeTraining\)\{activeTraining=false;activeMission=null;selectedMap=nextMapId\(selectedMap\);\}/,'a finished contract does not replay on Deploy');
 const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 assert.match(account,/onTrainingComplete:\(\)=>window\.setTimeout\(offerFirstRunEnding,/,'the ending follows the contract');
});

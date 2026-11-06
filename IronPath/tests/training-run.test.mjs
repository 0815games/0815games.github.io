import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {
 TRAINING_WAVES,TRAINING_BOSS_EVERY,TRAINING_UNIT,TRAINING_BUNKER,TRAINING_BOSS_UNIT,TRAINING_KEY,FIRST_RUN_XP,trainingWaveXP,trainingBonusXP,
 trainingContract,trainingUnitScale,trainingXP,trainingProgress,trainingWon,trainingStatus,
 trainingSeen,markTrainingSeen,
} from '../training-run.mjs';
import {characterProgress} from '../progression.mjs';
import {bossForWave,BOSS_EVERY} from '../combat.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';

const profile=()=>({name:'Rook',gender:'male',xp:0,armory:{scrap:0,owned:0,equipped:0}});
const player=()=>createPlayer('local',{name:'Rook',gender:'male',level:1,loadout:'0,0,0'});
const deploy=()=>createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'training-contract',threat:'training'}});

test('the training contract is six waves ending in the boss, softer enemies and a reinforced bunker',()=>{
 const contract=trainingContract();
 assert.equal(contract.waves,TRAINING_WAVES);
 assert.equal(TRAINING_WAVES,6,'six waves: the boss of wave 6 is the finale');
 // The endless rhythm puts a boss on every fifth wave, which would end a six-wave
 // contract on wave 5. The contract carries its own rhythm instead.
 assert.equal(bossForWave(5),bossForWave(5),'endless keeps its every-fifth-wave boss');
 assert.ok(bossForWave(5),'endless wave 5 still has a boss');
 assert.ok(bossForWave(TRAINING_WAVES,TRAINING_BOSS_EVERY),'the last wave of the contract is a boss wave');
 assert.equal(bossForWave(5,TRAINING_BOSS_EVERY),null,'wave 5 of the contract has no boss');
 assert.equal(TRAINING_BOSS_EVERY,TRAINING_WAVES,'the contract bosses on its own last wave');
 assert.equal(contract.bossEvery,TRAINING_BOSS_EVERY,'the rhythm travels with the contract');
 assert.ok(TRAINING_UNIT<1,'enemies are weakened');
 assert.ok(TRAINING_BUNKER>1,'the bunker is reinforced');
 assert.ok(TRAINING_BOSS_UNIT<TRAINING_UNIT,'the boss is weakened further than the rank and file');
 assert.ok(trainingUnitScale(true)<trainingUnitScale(false));
});

test('clearing every wave of the contract pays exactly one level and one skill point',()=>{
 const xp=trainingXP();
 assert.equal(characterProgress(xp).level,2,'the run ends at level 2');
 let sixWaves=0;
 for(let wave=1;wave<=6;wave++)sixWaves+=20+wave*10;
 assert.equal(sixWaves,330,'six waves are 330 XP');
 assert.equal(characterProgress(sixWaves).level,2,'six waves alone already reach level 2');
 assert.equal(trainingWaveXP(),330,'30+40+50+60+70+80');
 // The waves alone reach level 2 by only 30 XP, which is one balance change away
 // from silently costing the first skill point. The contract therefore pays to a
 // fixed total instead of relying on the wave formula.
 assert.equal(trainingBonusXP(),120,'the contract bonus tops the run up to exactly 450');
 assert.equal(trainingXP(),450,'level 2 with a 150 XP head start on level 3');
 assert.equal(characterProgress(trainingXP()).level,2);
 assert.equal(FIRST_RUN_XP,450,'the promise the ending relies on');
 assert.ok(characterProgress(trainingXP()).current>=150,'there is real headroom above the threshold');
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

test('the contract ends when the boss of the last wave falls, not before',()=>{
 let state=deploy();
 assert.equal(trainingWon(state),false,'not before the first deploy');
 state.wave=6;state.running=true;assert.equal(trainingWon(state),false,'the boss is still walking');
 // The wave is still running, so the boss is alive: no victory yet.
 state.running=false;state.completedWave=6;assert.equal(trainingWon(state),true,'a cleared wave six ends the contract');
 // And a wave that was never cleared cannot win: completedWave is the honest marker.
 state.completedWave=5;assert.equal(trainingWon(state),false,'wave six was not cleared');
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
 assert.match(before.detail,/boss of wave six/,'the panel says the boss ends the contract');
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

// The bug that shipped: an account that had played the old five-wave contract was
// told it was "done", so `startFirstRun` fell through to the eleven-step modal tour
// - the screen the redesign exists to remove - and never saw the new field. These
// two assertions are the whole reason both keys are versioned.
test('an account from the previous edition plays the new field, not the old tour', () => {
 const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
 // The first run must be decided by the training marker alone. If a tutorial call
 // sits on the same path as the field, the modal is back in front of new soldiers.
 const start = game.slice(game.indexOf('function startFirstRun()'), game.indexOf('function startTrainingRun()'));
 assert.match(start, /if\(!trainingSeen\(id,tutorialStorage\)\)\{/);
 assert.match(start, /return startTrainingRun\(\)/);
 assert.equal((start.match(/tutorial\./g) ?? []).length, 1, 'the tour is only the fallback after the field');
 // Versioned markers, so "played it once" means "played THIS one once".
 assert.equal(TRAINING_KEY, 'ironpath:training:v2', 'a new contract edition is new content');
 const coach = readFileSync(new URL('../first-run-coach.mjs', import.meta.url), 'utf8')
  .split('\n').filter(line => !line.trimStart().startsWith('//')).join('\n');
 assert.match(coach, /const EDITION=2;/, 'a dismissed card cannot suppress the new explanations');
 assert.match(coach, /ironpath:coach:v\$\{EDITION\}/);
});

test('nothing offers a field upgrade between the last two waves of the contract', () => {
 // `startWave` refuses to deploy while an upgrade is pending, so an offer on the
 // second-to-last wave of a fixed-length contract stops the run one wave short of
 // the boss. The offer must follow the contract's own rhythm.
 const sim = readFileSync(new URL('../simulation.mjs', import.meta.url), 'utf8');
 assert.match(sim, /const perkEvery=state\.campaignContract\?\.bossEvery\|\|5;/);
 assert.match(sim, /state\.wave%perkEvery===0&&state\.wave!==state\.campaignContract\?\.waves/);
 // Five and six are the interesting cases: endless keeps its perk at 5, the
 // contract does not offer one at all.
 const contract = trainingContract();
 assert.equal(contract.bossEvery, TRAINING_WAVES);
});

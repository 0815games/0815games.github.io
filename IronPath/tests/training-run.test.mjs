import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {
 TRAINING_WAVES,TRAINING_BOSS_EVERY,TRAINING_UNIT,TRAINING_BUNKER,TRAINING_BOSS_UNIT,TRAINING_KEY,FIRST_RUN_XP,FIRST_RUN_DEFEAT_XP,trainingWaveXP,trainingBonusXP,
 trainingContract,trainingUnitScale,trainingXP,trainingProgress,trainingWon,trainingStatus,
 trainingSeen,markTrainingSeen,
} from '../training-run.mjs';
import {characterProgress} from '../progression.mjs';
import {bossForWave,BOSS_EVERY} from '../combat.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createPlayer,applyCommand,TOWER_COSTS} from '../match.mjs';
import {upgradeCost} from '../progression.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';

const profile=()=>({name:'Rook',gender:'male',xp:0,armory:{scrap:0,owned:0,equipped:0}});
const player=()=>createPlayer('local',{name:'Rook',gender:'male',level:1,loadout:'0,0,0'});
const deploy=()=>createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'training-contract',threat:'training'}});

test('the training contract is five waves ending in the boss, softer enemies and a reinforced bunker',()=>{
 const contract=trainingContract();
 assert.equal(contract.waves,TRAINING_WAVES);
 assert.equal(TRAINING_WAVES,5,'five waves: the boss of wave 5 is the finale');
 // The boss walks with the last wave, and nothing follows it. The rhythm is explicit
 // rather than borrowed from the endless every-fifth-wave rule, so the finale cannot
 // silently move if the contract length changes.
 assert.ok(bossForWave(TRAINING_WAVES,TRAINING_BOSS_EVERY),'the last wave of the contract is a boss wave');
 assert.equal(TRAINING_BOSS_EVERY,TRAINING_WAVES,'the contract bosses on its own last wave');
 assert.equal(contract.bossEvery,TRAINING_BOSS_EVERY,'the rhythm travels with the contract');
 assert.equal(bossForWave(TRAINING_WAVES-1,TRAINING_BOSS_EVERY),null,'no boss before the finale');
 assert.equal(contract.waves,TRAINING_WAVES,'the contract stops at the boss wave');
 assert.ok(bossForWave(5),'endless still bosses every fifth wave');
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
 assert.equal(characterProgress(fiveWaves).level,1,'five waves alone do not reach level 2');
 assert.equal(trainingWaveXP(),250,'30+40+50+60+70');
 // The waves alone do not pay the point, so the contract pays to a fixed total
 // instead of relying on the wave formula.
 assert.equal(trainingBonusXP(),200,'the contract bonus tops the run up to exactly 450');
 assert.equal(trainingXP(),450,'level 2 with a 150 XP head start on level 3');
 assert.equal(characterProgress(trainingXP()).level,2);
 assert.equal(FIRST_RUN_XP,450,'the promise the ending relies on');
 assert.ok(characterProgress(trainingXP()).current>=150,'there is real headroom above the threshold');

 // Losing the contract still has to leave the player with a point to spend: the
 // screens after the debrief teach equipment and skills, and they are useless to
 // someone who ended the run at level 1. That is why a defeat pays this number
 // and not merely the waves it cleared. Pinned because it is money, not layout.
 assert.equal(FIRST_RUN_DEFEAT_XP,330,'a defeat pays enough to reach level 2');
 assert.ok(characterProgress(FIRST_RUN_DEFEAT_XP).level>=2,'a defeated first run still unlocks a skill point');
 assert.ok(FIRST_RUN_DEFEAT_XP<FIRST_RUN_XP,'losing pays less than winning');
});

test('a training deployment is a real match with the contract attached',()=>{
 const state=deploy();
 assert.equal(state.maxHp,150,'100 base health at 150%');
 assert.equal(state.campaignContract.threat,'training');
 assert.equal(state.campaignContract.waves,5);
 assert.equal(state.campaignContract.unit,TRAINING_UNIT);
 assert.ok(state.campaignContract.bossUnit>0,'the boss weakening travels with the contract');
 // Endless solo and story missions keep their own numbers.
 const endless=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false});
 assert.equal(endless.campaignContract,undefined);
 assert.equal(endless.maxHp,100);
 const legendary=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'tidelock',threat:'legendary'}});
 assert.equal(legendary.maxHp,68);
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
 state.wave=5;state.running=true;assert.equal(trainingWon(state),false,'the boss is still walking');
 // The wave is still running, so the boss is alive: no victory yet.
 state.running=false;state.completedWave=5;assert.equal(trainingWon(state),true,'a cleared wave five ends the contract');
 // And a wave that was never cleared cannot win: completedWave is the honest marker.
 state.completedWave=4;assert.equal(trainingWon(state),false,'wave five was not cleared');
 state.ended=true;assert.equal(trainingWon(state),false,'an ended run is handled by the results screen');
 assert.deepEqual(trainingProgress({wave:3}),{wave:3,total:5,remaining:2});
 assert.equal(trainingProgress({}).wave,0);
});

test('the objective panel speaks plainly about the contract',()=>{
 const tr=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
 const before=trainingStatus({},tr);
 assert.match(before.detail,/first wave/);
 const during=trainingStatus({wave:2},tr);
 assert.equal(during.progress,2);
 assert.equal(during.max,5);
 assert.match(during.label,/Wave 2 of 5/);
 assert.match(before.detail,/boss of wave five/,'the panel says the boss ends the contract');
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
 assert.match(game,/if\(activeTraining\)\{activeTraining=false;activeMission=null;selectedMap=drawFreeMapId\(selectedMap\);\}/,'a finished contract does not replay on Deploy');
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
 // The closing parenthesis is not part of the search: `startTrainingRun` takes an
 // options object now (the Settings replay deploys it with the rewards switched off),
 // and a test that pins the exact signature fails for a reason that has nothing to do
 // with what it checks.
 const start = game.slice(game.indexOf('function startFirstRun()'), game.indexOf('function startTrainingRun'));
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

// The CI browser install hung three times on apt. Both fixes are easy to undo by
// accident, so they are pinned here: no `--with-deps` on the fast path, and a probe
// that resolves the module by path (NODE_PATH is exported for the NEXT step only).
test('the CI browser install never waits for apt unless it has to', () => {
 const flow = readFileSync(new URL('../../.github/workflows/ironpath-firebase-rules.yml', import.meta.url), 'utf8');
 const install = flow.slice(flow.indexOf('Install pinned browser test tooling'), flow.indexOf('Check static interface'));
 assert.match(install, /"\$PLAYWRIGHT" install chromium;/,'chromium first, without system packages');
 assert.doesNotMatch(install, /playwright" install --with-deps chromium;/,'no apt on the fast path');
 assert.match(install, /process\.env\.RUNNER_TEMP\+"\/ironpath-browser\/node_modules\/playwright"/,'the probe resolves by path');
 assert.match(install, /install-deps chromium/,'the slow path still exists for a runner that needs it');
 assert.match(install, /timeout 300|timeout 420/,'every download is capped, so a slow mirror names itself');
});

test('the first run can afford to build and then upgrade EVERY tower in the sheet',()=>{
 // Reported: "Building Cannon -> then upgrading it does not work. We got too
 // little supplies." The coach gates the upgrade card on the field, so a start
 // that only covers the cheapest tower parks every other choice in front of a
 // closed gate. This walks all four towers - the check that should have existed
 // before the gate shipped.
 const firstUpgrade=upgradeCost(1);
 assert.equal(firstUpgrade,70,'the pinned price the budget is built around');
 for(let type=0;type<TOWER_COSTS.length;type++){
  const state=deploy();
  assert.ok(state.money>=TOWER_COSTS[type]+firstUpgrade,
    `tower ${type} (${TOWER_COSTS[type]}) plus upgrade ${firstUpgrade} fits the start (${state.money})`);
  const built=applyCommand(state,'local',{type:'build',pad:0,towerType:type});
  assert.equal(built.ok,true,`tower ${type} can be built`);
  const upgraded=applyCommand(state,'local',{type:'upgrade',pad:0});
  assert.equal(upgraded.ok,true,`tower ${type} (${TOWER_COSTS[type]}) can be upgraded after being built: ${upgraded.reason??''}`);
 }
 // The raise is the training's alone: endless solo and story missions keep the
 // endless start, so this stays a tutorial fix and not a balance change.
 const endless=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false});
 assert.equal(endless.money,125,'endless solo keeps its own start');
 const mission=createSoloDeployment({player:player(),profile:profile(),mapId:'road',workshopEnabled:false,campaign:{id:'bridge',threat:'elite'}});
 assert.equal(mission.money,125,'a story mission keeps its own start');
});

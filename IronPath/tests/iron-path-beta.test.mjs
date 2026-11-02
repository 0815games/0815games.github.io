import {strict as assert} from 'node:assert';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {parseBuild,encodeBuild} from '../skills.mjs';
import {summarizeRun,outcomeOf} from '../run-summary.mjs';
import {CAMPAIGN_MISSIONS,missionById,missionStatus,missionSetup,missionDetails,finaleBossKind} from '../campaign.mjs';
import {feedbackUrl,FEEDBACK_REPOSITORY} from '../feedback.mjs';
import {waveXP} from '../progression.mjs';
import {getMap,isMapId} from '../maps.mjs';
import {ITEMS} from '../armory.mjs';

const player=(id='a',extra={})=>createPlayer(id,{name:id.toUpperCase(),gender:'male',level:1,...extra},850,450);

// Campaign objectives end the operation as a victory exactly when the wave is cleared.
{
  const p=player();const s=createMatch([p],'road',{objectiveWave:2});
  assert.equal(s.objectiveWave,2);
  s.wave=2;s.running=true;s.spawnLeft=0;s.enemies=[];s.towers=[];
  const events=stepMatch(s);
  assert.equal(s.ended,true);assert.equal(s.victory,true);assert.equal(s.endReason,'victory');assert.equal(outcomeOf(s),'victory');
  assert.ok(events.some(e=>e.type==='victory'&&e.wave===2),'victory event emitted');
  assert.ok(events.some(e=>e.type==='waveCleared'),'final wave still pays its reward event');
  assert.equal(s.pendingPerk,0,'no field upgrade is offered after the finale');
  assert.equal(s.clearedWaves,1);
}
{
  const s=createMatch([player()],'road',{objectiveWave:5});
  s.wave=4;s.running=true;s.spawnLeft=0;s.enemies=[];s.towers=[];
  stepMatch(s);
  assert.equal(s.ended,false,'an unfinished campaign keeps running');assert.equal(s.endReason,undefined);
  assert.equal(outcomeOf(s),'active');
}
{
  const s=createMatch([player()],'road');assert.equal(s.objectiveWave,undefined,'endless runs have no objective');
  s.wave=5;s.running=true;s.spawnLeft=0;s.enemies=[];s.towers=[];stepMatch(s);assert.equal(s.pendingPerk,5,'endless boss waves still offer upgrades');assert.equal(s.ended,false);
}
for(const bad of [0,101,1.5,'5',-1]) assert.throws(()=>createMatch([player()],'road',{objectiveWave:bad}),/Invalid objective wave/);
{
  const s=createMatch([player()],'road');s.hp=0;s.running=true;stepMatch(s);
  assert.equal(s.endReason,'defeat');assert.equal(outcomeOf(s),'defeat');
}
{
  const s=createMatch([player()],'road');applyCommand(s,'a',{type:'endRun'});assert.equal(outcomeOf(s),'retired');
}

// Run records: credit the source of each contribution, without overkill.
{
  const p=player();const s=createMatch([p],'road');s.running=true;s.spawnLeft=0;s.wave=1;
  s.towers=[{id:1,pad:0,type:0,level:1,timer:0,ownerId:'a'}];
  s.enemies=[{hp:1000,maxHp:1000,x:105,y:130,segment:1,speed:0,kind:'infantry',reward:1}];
  stepMatch(s);
  const dealt=1000-s.enemies[0].hp;
  assert.ok(dealt>0,'tower hit the enemy');assert.equal(p.record.towerDamage,dealt);assert.equal(p.record.heroDamage,0);
  assert.equal(s.enemies[0].lastHitBy,'a');
}
{
  const p=player();const s=createMatch([p],'road');s.running=true;s.spawnLeft=0;s.wave=1;
  s.enemies=[{hp:1,maxHp:1,x:850,y:450,segment:1,speed:0,kind:'infantry',reward:1,lastHitBy:'a'},{hp:5,maxHp:5,x:300,y:300,segment:1,speed:0,kind:'infantry',reward:1}];
  stepMatch(s);
  assert.equal(p.record.kills,1,'the player who lands the killing hit gets the kill');
  assert.equal(s.enemies.length,1);
}
{
  const p=player();const s=createMatch([p],'road');s.running=true;s.spawnLeft=0;s.wave=1;s.towers=[];
  s.enemies=[{hp:3,maxHp:3,x:850,y:450,segment:1,speed:0,kind:'infantry',reward:8}];
  stepMatch(s);
  assert.equal(p.record.heroDamage,3,'a 10-damage shot on a 3-HP target only contributes 3');
  assert.ok(p.record.supplies>=8,'kill rewards are recorded as supplies earned');
  assert.equal(p.record.kills,1);
}
{
  const b=parseBuild('3,3,3,3,3;assault',100);b.active='logistics';b.web[28]=1;
  const p=createPlayer('a',{name:'A',gender:'male',level:100,skills:encodeBuild(b)},100,130);
  const s=createMatch([p],'road');s.running=true;applyCommand(s,'a',{type:'airstrike'});
  assert.equal(p.record.combos,1,'an activated combo is counted once');
}

// Results arithmetic uses the same published wave rewards and level curve.
{
  const state={ended:true,endReason:'defeat',wave:6,clearedWaves:5,lootKills:12,runPerks:{damage:2,hero:1},
    towers:[{level:3},{level:1}],
    players:{a:{name:'Ava',record:{heroDamage:30,towerDamage:70,kills:4,supplies:200,combos:2}},b:{name:'Bo',record:{heroDamage:25,towerDamage:0,kills:0,supplies:50,combos:1}}}};
  const r=summarizeRun(state,{playerId:'a',startXP:250,startOwned:1});
  const expectedXP=[1,2,3,4,5].reduce((n,w)=>n+waveXP(w),0);
  assert.equal(r.outcome,'defeat');assert.equal(r.wavesSurvived,5);assert.equal(r.bossesDefeated,1,'wave 5 boss counts');
  assert.equal(r.xp,expectedXP);assert.equal(r.levelBefore,1);assert.equal(r.levelAfter,2,'250 + XP crosses level 2 at 300');
  assert.equal(r.skillPointsGained,1);assert.equal(r.caches,2);assert.equal(r.enemiesDefeated,12);
  assert.deepEqual(r.contributions.map(c=>c.name),['Ava','Bo']);assert.equal(r.contributions[0].share,80);assert.equal(r.contributions[1].share,20);assert.equal(r.contributions[0].you,true);
  assert.equal(r.totalDamage,125);
  assert.equal(summarizeRun({clearedWaves:0,players:{a:{name:'A',record:{heroDamage:145.4,towerDamage:247.5}}}},{playerId:'a'}).contributions[0].damage,393,'damage is shown as whole points');assert.equal(r.supplies,200,'your own supplies are reported');assert.equal(r.combos,3);
  assert.deepEqual(r.perks.map(p=>p.name),['Field Ordnance','Sharpened Aim']);assert.deepEqual(r.perks.map(p=>p.rank),[2,1]);
  assert.deepEqual(r.towers,{standing:2,upgrades:2});
  // Wave 2, 4 items are earned by clearing 5 waves; Field Scope (wave 2) was already owned.
  assert.deepEqual(r.equipment.map(i=>i.name),['Reinforced Vest']);assert.equal(r.scrap,10*5+10,'duplicate item gives scrap');
}
{
  const r=summarizeRun({clearedWaves:0,players:{a:{name:'A',record:{}}}},{playerId:'a'});
  assert.equal(r.xp,0);assert.equal(r.skillPointsGained,0);assert.equal(r.equipment,null,'co-op hides account-only armory data');
  assert.equal(r.scrap,null);assert.equal(r.outcome,'active');
  assert.equal(summarizeRun({clearedWaves:6,players:{}},{startOwned:0}).equipment.length,ITEMS.filter(i=>i.wave<=6).length);
}
{
  const mission=missionById('marsh-last-stand');
  const r=summarizeRun({endReason:'victory',ended:true,clearedWaves:20,players:{}},{mission,startOwned:0});
  assert.equal(r.outcome,'victory');assert.equal(r.mission.name,'Last Stand');assert.equal(r.bossesDefeated,4);
}

// Campaign: fixed regions, unique terrain, finale bosses, and level-based unlocks.
{
  assert.equal(CAMPAIGN_MISSIONS.length,4);
  const themes=CAMPAIGN_MISSIONS.map(m=>getMap(m.map).theme);
  assert.deepEqual(themes,['scrub','arctic','urban','marsh'],'each region has distinct terrain');
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m=>m.id)).size,4);
  for(const m of CAMPAIGN_MISSIONS){
    assert.ok(isMapId(m.map),`${m.id} map is valid`);
    assert.equal(finaleBossKind(m),m.boss,`${m.id} finale boss matches its wave`);
    assert.equal(m.objectiveWave%5,0,'finales are boss waves');
    const setup=missionSetup(m);assert.equal(setup.mapId,m.map);assert.equal(setup.objectiveWave,m.objectiveWave);
    const d=missionDetails(m);assert.ok(d.terrainBriefing.length>20);assert.ok(d.bossLabel);
    const s=createMatch([player()],setup.mapId,{objectiveWave:setup.objectiveWave});assert.equal(s.mapId,m.map);
  }
  assert.equal(missionStatus(CAMPAIGN_MISSIONS[0],1).open,true);
  assert.equal(missionStatus(CAMPAIGN_MISSIONS[3],3).open,false);
  assert.match(missionStatus(CAMPAIGN_MISSIONS[3],3).reason,/level 4/);
  assert.equal(missionStatus(null,10).open,false);
  assert.equal(missionById('nope'),null);
}

// Feedback links never include account data.
{
  const url=feedbackUrl({outcome:'defeat',mission:'Thin Ice',wave:7});
  assert.ok(url.startsWith(`${FEEDBACK_REPOSITORY}/issues/new?`));
  const q=new URL(url).searchParams;
  assert.equal(q.get('labels'),'iron-path,feedback');
  assert.match(q.get('body'),/Outcome: defeat · Mission: Thin Ice · Wave: 7/);
  assert.doesNotMatch(url,/uid|email|token|@/i);
}
console.log('Run results, campaign objectives, run records and feedback checks passed.');

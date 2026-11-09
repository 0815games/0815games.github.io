import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {CAMPAIGN,campaignWaveContract,campaignDifficulty} from '../campaign.mjs';
import {THREATS,campaignUnitScale,campaignBunker,campaignSurge} from '../campaign-pressure.mjs';
import {PRESTIGE,PRESTIGE_IDS,prestigeEarned,missingPrestige,isPrestige} from '../prestige.mjs';
import {validateWorkshop,unlockPrestige,craftWorkshop,equipWorkshop,modifyWorkshop,modsOf} from '../workshop-model.mjs';
import {initializeWireWorkshop,applyWireWorkshopCommand,decodeWorkshop,encodeWorkshop,completeStoryMission,meltPrestige} from '../workshop-wire.mjs';
import {captureWorkshopLoadout,workshopEffects} from '../workshop-effects.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';

const empty=()=>({version:1,components:0,owned:[],equipped:{weapon:'standard',gear:'none',gadget:'none'},mods:{}});
const profileWith=(storyProgress,workshop)=>({name:'A',gender:'female',xp:0,storyProgress,workshop:encodeWorkshop(workshop||empty())});

test('every mission carries a threat, and the campaign gets harder as it goes',()=>{
 for(const mission of CAMPAIGN)assert.ok(Object.hasOwn(THREATS,mission.threat),`${mission.id} needs a threat`);
 const order={standard:0,hardened:1,elite:2,veteran:3,legendary:4,iron:5};
 // Threat climbs within an act; a new act may open lower again (the plan's
 // five-act curve restarts each region) but never dips inside one.
 let previous=0,act=null;
 for(const mission of CAMPAIGN){if(mission.act!==act){act=mission.act;previous=0;}assert.ok(order[mission.threat]>=previous,`${mission.id} must not be easier than the mission before it within its act`);previous=order[mission.threat];}
 const finale=CAMPAIGN.filter(m=>m.finale).at(-1);
 assert.equal(finale.threat,'legendary','the story finale is the hardest mission');
 assert.equal(campaignWaveContract(finale),8,'the story finale runs eight waves');
 assert.ok(!CAMPAIGN.at(-1).finale||CAMPAIGN.at(-1).id===finale.id,'a partially shipped act ends without its finale');
});

test('a harder threat means tougher units, wider surges and a smaller bunker',()=>{
 assert.equal(campaignUnitScale('standard',1),1);
 assert.ok(campaignUnitScale('legendary',1)>campaignUnitScale('elite',1));
 assert.ok(campaignUnitScale('elite',1)>campaignUnitScale('hardened',1));
 assert.equal(campaignBunker(100,THREATS.standard.bunker),100);
 assert.equal(campaignBunker(100,THREATS.legendary.bunker),68);
 assert.equal(campaignBunker(10,THREATS.legendary.bunker),20,'the bunker never drops below a playable floor');
 assert.equal(campaignSurge('standard',3),0,'a standard contract has no surge');
 assert.equal(campaignSurge('legendary',3),3,'a legendary contract adds units on odd waves');
 assert.equal(campaignSurge('legendary',4),0,'surges land on odd waves only');
});

test('a mission deploys with the crafted gear and its contract; endless stays a sandbox',()=>{
 const player=()=>createPlayer('local',{name:'T',gender:'male',level:3,loadout:'0,0,1'});
 let profile=initializeWireWorkshop({xp:750,armory:{scrap:100,owned:1,equipped:1}});
 profile=applyWireWorkshopCommand(profile,{type:'craft',item:'boots'});
 profile=applyWireWorkshopCommand(profile,{type:'equip',slot:'gear',item:'boots'});
 const mission=createSoloDeployment({player:player(),profile,mapId:'road',workshopEnabled:true,campaign:{id:'tidelock',threat:'legendary'}});
 const endless=createSoloDeployment({player:player(),profile,mapId:'road',workshopEnabled:true});
 assert.equal(mission.campaignContract.threat,'legendary');
 assert.equal(mission.maxHp,68,'a legendary bunker is 68% of the base health');
 assert.equal(endless.campaignContract,undefined,'endless solo has no contract');
 assert.equal(endless.maxHp,100,'endless keeps its own numbers');
});

test('the trophies are retired: no price, no grants, nothing owed',()=>{
 assert.equal(PRESTIGE_IDS.length,12,'the retired set keeps its twelve trophies');
 assert.equal(CAMPAIGN.length,44,'the shipped story grew to forty-four missions');
 assert.ok(PRESTIGE_IDS.every(id=>CAMPAIGN.some(m=>m.id===PRESTIGE[id].mission)),'every retired trophy still maps onto a shipped mission');
 for(const id of PRESTIGE_IDS){
  const item=PRESTIGE[id];
  assert.ok(isPrestige(id));
  assert.ok(CAMPAIGN.some(m=>m.id===item.mission),`${id} still names a real mission for old saves`);
  assert.ok(!Object.hasOwn(item,'scrap'),'a trophy never had a price');
  assert.equal(craftWorkshop({scrap:10000000,owned:0,equipped:0},empty(),id),null,'a trophy cannot be crafted');
 }
 assert.deepEqual(missingPrestige(profileWith(0),empty()),[],'nothing is owed any more');
 assert.equal(prestigeEarned('prestige-relay',profileWith(1)),false,'not even a finished mission earns a trophy now');
});

test('finishing a mission writes story progress and melts retired trophies in one step',()=>{
 const workshop={...empty(),owned:['prestige-relay'],equipped:{weapon:'standard',gear:'none',gadget:'prestige-relay'},mods:{'prestige-relay':'beacon'}};
 const profile=profileWith(0,workshop);
 const after=completeStoryMission(profile,'lost-signal');
 assert.equal(after.storyProgress,1);
 const saved=decodeWorkshop(after.workshop);
 assert.deepEqual(saved.owned,[],'the trophy is gone');
 assert.equal(saved.equipped.gadget,'none','the slot falls back to neutral');
 assert.deepEqual({...saved.mods},{},'its mod is gone');
 assert.equal(validateWorkshop(saved),true);
 const replay=completeStoryMission(after,'lost-signal');
 assert.equal(replay.storyProgress,1,'a replay changes nothing');
 assert.equal(completeStoryMission(profile,'tidelock'),null,'a mission cannot be skipped');
});

test('leftover trophies are melted on sync, once',()=>{
 const workshop={...empty(),owned:['prestige-relay','prestige-oscillator'],equipped:{weapon:'standard',gear:'none',gadget:'prestige-relay'}};
 const older=profileWith(2,workshop);
 const synced=meltPrestige(older);
 assert.deepEqual(decodeWorkshop(synced.workshop).owned,[],'both trophies melted');
 assert.equal(meltPrestige(synced),synced,'a second sync changes nothing');
 const clean=profileWith(2);
 assert.equal(meltPrestige(clean),clean,'a clean workshop stays untouched');
 const noWorkshop={name:'A',xp:0,storyProgress:2};
 assert.equal(meltPrestige(noWorkshop),noWorkshop,'no workshop, nothing to melt');
});

test('an old snapshot with an equipped trophy resolves to no effect',()=>{
 const workshop={...empty(),owned:['prestige-icekey'],equipped:{weapon:'prestige-icekey',gear:'none',gadget:'none'},mods:{'prestige-icekey':'cipher'}};
 assert.equal(validateWorkshop(workshop),true,'the old shape still decodes');
 const snapshot=captureWorkshopLoadout(workshop,'solo');
 const effects=workshopEffects(snapshot,5);
 assert.equal(effects.damage,0,'the melted key adds nothing');
 assert.equal(effects.range,0,'its mod adds nothing');
 assert.equal(workshopEffects(captureWorkshopLoadout(workshop,'versus'),5).damage,0,'versus stays neutral');
});

test('a workshop holding every trophy melts into a valid, rules-sized save',()=>{
 let workshop=empty();
 for(const id of PRESTIGE_IDS){const next=unlockPrestige(workshop,id);assert.ok(next,`${id} must still decode-unlock for the melt`);workshop=next;}
 const armed={...workshop,equipped:{weapon:'prestige-override-flag',gear:'prestige-transformer-coil',gadget:'prestige-broadcast-horn'},mods:{'prestige-override-flag':'victory'}};
 const encoded=encodeWorkshop(armed);assert.ok(encoded,'the full trophy set still encodes');
 const melted=meltPrestige(profileWith(12,armed));
 const saved=decodeWorkshop(melted.workshop);
 assert.deepEqual(saved.owned,[]);
 assert.equal(saved.equipped.weapon,'standard');assert.equal(saved.equipped.gear,'none');assert.equal(saved.equipped.gadget,'none');
 const reEncoded=encodeWorkshop(saved);
 assert.ok(reEncoded&&reEncoded.length<=2048,`${reEncoded?.length??'??'} chars must fit the rules limit`);
});

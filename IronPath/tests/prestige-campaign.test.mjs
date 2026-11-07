import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {CAMPAIGN,campaignWaveContract,campaignDifficulty} from '../campaign.mjs';
import {THREATS,campaignUnitScale,campaignBunker,campaignSurge} from '../campaign-pressure.mjs';
import {PRESTIGE,PRESTIGE_IDS,prestigeEarned,missingPrestige,isPrestige} from '../prestige.mjs';
import {validateWorkshop,unlockPrestige,craftWorkshop,equipWorkshop,modifyWorkshop,modsOf} from '../workshop-model.mjs';
import {initializeWireWorkshop,applyWireWorkshopCommand,decodeWorkshop,encodeWorkshop,completeStoryWithPrestige,syncPrestige} from '../workshop-wire.mjs';
import {captureWorkshopLoadout,workshopEffects} from '../workshop-effects.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createPlayer} from '../match.mjs';

const empty=()=>({version:1,components:0,owned:[],equipped:{weapon:'standard',gear:'none',gadget:'none'},mods:{}});
const profileWith=(storyProgress,workshop)=>({name:'A',gender:'female',xp:0,storyProgress,workshop:encodeWorkshop(workshop||empty())});

test('every mission carries a threat, and the campaign gets harder as it goes',()=>{
 for(const mission of CAMPAIGN)assert.ok(Object.hasOwn(THREATS,mission.threat),`${mission.id} needs a threat`);
 const order={standard:0,hardened:1,elite:2,legendary:3};
 let previous=0;
 for(const mission of CAMPAIGN){assert.ok(order[mission.threat]>=previous,`${mission.id} must not be easier than the mission before it`);previous=order[mission.threat];}
 assert.equal(CAMPAIGN.at(-1).threat,'legendary','the finale is the hardest mission');
 assert.equal(campaignWaveContract(CAMPAIGN.at(-1)),8,'the finale runs eight waves');
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

test('prestige gear is earned by a mission, never bought',()=>{
 assert.equal(PRESTIGE_IDS.length,CAMPAIGN.length,'each mission carries one trophy');
 for(const id of PRESTIGE_IDS){
  const item=PRESTIGE[id];
  assert.ok(isPrestige(id));
  assert.ok(CAMPAIGN.some(m=>m.id===item.mission),`${id} needs a real mission`);
  assert.ok(!Object.hasOwn(item,'scrap'),'a trophy has no price');
  assert.equal(craftWorkshop({scrap:10000000,owned:0,equipped:0},empty(),id),null,'a trophy cannot be crafted');
 }
 assert.deepEqual(missingPrestige(profileWith(0),empty()),[],'no missions finished, nothing owed');
 assert.equal(prestigeEarned('prestige-relay',profileWith(0)),false);
 assert.equal(prestigeEarned('prestige-relay',profileWith(1)),true,'finishing the first mission earns its trophy');
});

test('finishing a mission writes story progress and its trophy in one step',()=>{
 const profile=profileWith(0);
 const after=completeStoryWithPrestige(profile,'lost-signal');
 assert.equal(after.storyProgress,1);
 assert.deepEqual(decodeWorkshop(after.workshop).owned,['prestige-relay']);
 const replay=completeStoryWithPrestige(after,'lost-signal');
 assert.deepEqual(decodeWorkshop(replay.workshop).owned,['prestige-relay'],'a replay never duplicates the trophy');
 assert.equal(completeStoryWithPrestige(profile,'tidelock'),null,'a mission cannot be skipped for its trophy');
 assert.equal(validateWorkshop(decodeWorkshop(after.workshop)),true);
});

test('trophies finished before the update are backfilled, once',()=>{
 const older=profileWith(2);
 const synced=syncPrestige(older);
 assert.deepEqual(decodeWorkshop(synced.workshop).owned,['prestige-relay','prestige-oscillator']);
 assert.equal(syncPrestige(synced),synced,'a second sync changes nothing');
 assert.equal(syncPrestige({name:'A',xp:0,storyProgress:2}),null,'no workshop, nothing to backfill');
});

test('an equipped trophy fights and can be modified',()=>{
 const workshop={...empty(),owned:['prestige-icekey'],equipped:{weapon:'prestige-icekey',gear:'none',gadget:'none'}};
 assert.equal(validateWorkshop(workshop),true);
 const equipped=equipWorkshop(workshop,'weapon','prestige-icekey');
 assert.deepEqual(modsOf('prestige-icekey'),['cipher','window']);
 const modified=modifyWorkshop({scrap:100,owned:0,equipped:0},equipped,'prestige-icekey','cipher');
 assert.equal(modified.workshop.mods['prestige-icekey'],'cipher');
 assert.equal(modifyWorkshop({scrap:100,owned:0,equipped:0},equipped,'prestige-icekey','nonsense'),null,'only real trophy mods');
 const effects=workshopEffects(captureWorkshopLoadout(modified.workshop,'solo'),5);
 assert.equal(effects.damage,6,'+4 from the key, +2 from the cipher');
 assert.equal(effects.range,10);
 assert.equal(workshopEffects(captureWorkshopLoadout({...workshop,equipped:{...workshop.equipped}}, 'versus'),5).damage,0,'versus stays neutral');
});

test('a workshop holding every trophy still fits the save format',()=>{
 let workshop=empty();
 for(const id of PRESTIGE_IDS){const next=unlockPrestige(workshop,id);assert.ok(next,`${id} must unlock`);workshop=next;}
 assert.equal(unlockPrestige(workshop,PRESTIGE_IDS[0]),null,'unlocking twice is a no-op');
 const encoded=encodeWorkshop({...workshop,equipped:{weapon:'prestige-override-flag',gear:'prestige-transformer-coil',gadget:'prestige-broadcast-horn'},mods:{'prestige-override-flag':'victory'}});
 assert.ok(encoded,'the full trophy set still encodes');
 assert.ok(encoded.length<=2048,`${encoded.length} chars must fit the rules limit`);
});

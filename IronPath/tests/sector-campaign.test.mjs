import {test} from 'node:test';
import {strict as assert} from 'node:assert';
// The sector campaign: endless solo runs retreat to a bigger, meaner field
// every tenth wave. Multiplayer, missions and legacy maps never retreat.
import {getMap,sectorOf,SECTOR_SPECS} from '../maps.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand,advanceSector} from '../match.mjs';

const player=(id='local')=>createPlayer(id,{name:id,gender:'female',level:1},850,450);
const clearWave10=state=>{state.wave=10;state.running=true;state.spawnLeft=0;state.enemies=[];state.pendingPerk=0;stepMatch(state);};

test('every tenth cleared wave offers the retreat - and nothing else does',()=>{
 const solo=createMatch([player()],'g3-09e3779b1');
 clearWave10(solo);
 assert.equal(solo.pendingSector,11,'the eleventh wave waits behind the retreat');
 const ninth=createMatch([player()],'g3-09e3779b1');
 ninth.wave=9;ninth.running=true;ninth.spawnLeft=0;ninth.enemies=[];stepMatch(ninth);
 assert.ok(!ninth.pendingSector,'only multiples of ten retreat');
 const legacy=createMatch([player()],'g2-12345678');
 clearWave10(legacy);
 assert.ok(!legacy.pendingSector,'legacy maps stay single-sector');
 const mission=createMatch([player()],'road');
 clearWave10(mission);
 assert.ok(!mission.pendingSector,'fixed mission maps stay put');
 const online=createMatch([player('host'),player('guest')],'g3-09e3779b1');
 online.individualSupplies=true;online.hostId='host';
 clearWave10(online);
 assert.ok(!online.pendingSector,'multiplayer never retreats');
 assert.equal(advanceSector(online),null,'and cannot be pushed into one');
});

test('startWave waits for the retreat order',()=>{
 const state=createMatch([player()],'g3-09e3779b1');
 clearWave10(state);
 const refused=applyCommand(state,'local',{type:'startWave'});
 assert.equal(refused.ok,false);
 assert.match(refused.reason,/retreat/i);
});

test('the retreat refunds 60%, patches the bunker and keeps the wave counter',()=>{
 const state=createMatch([player()],'g3-09e3779b1');
 assert.ok(applyCommand(state,'local',{type:'build',pad:0,towerType:0}).ok);
 assert.ok(applyCommand(state,'local',{type:'upgrade',pad:0}).ok);
 assert.equal(state.towers.length,1);
 clearWave10(state);
 assert.equal(state.pendingPerk,10,'wave ten also offers a field upgrade');
 assert.ok(applyCommand(state,'local',{type:'choosePerk',index:0}).ok,'the perk is chosen before the retreat, as the panels order it');
 const before=state.money;
 state.hp=Math.max(1,Math.round(state.maxHp*.2));
 const retreat=applyCommand(state,'local',{type:'advanceSector'});
 assert.equal(retreat.ok,true);
 assert.equal(retreat.refund,72,'60% of 50 tower + 70 upgrade');
 assert.equal(state.money,before+72);
 assert.equal(state.towers.length,0,'towers do not travel');
 assert.equal(sectorOf(state.mapId),2);
 assert.equal(getMap(state.mapId).width,SECTOR_SPECS[1].width,'the field grew');
 assert.equal(getMap(state.mapId).pads.length,SECTOR_SPECS[1].pads);
 assert.equal(state.pendingSector,0);
 assert.equal(state.wave,10,'the global wave counter survives');
 assert.equal(state.hp,Math.round(state.maxHp*.75),'bunker patched to three quarters');
 const bunker=getMap(state.mapId).bunker;
 assert.ok(Math.hypot(state.players.local.x-bunker.x,state.players.local.y-bunker.y)<200,'the hero lands near the new bunker');
 assert.equal(applyCommand(state,'local',{type:'advanceSector'}).ok,false,'no double retreat');
 assert.equal(applyCommand(state,'local',{type:'startWave'}).ok,true,'wave 11 deploys on the new field');
 assert.equal(state.wave,11);assert.equal(state.running,true);
});

test('the injected map factory decides the next sector (host-side randomness)',()=>{
 const state=createMatch([player()],'g3-19e3779b1');
 clearWave10(state);
 const calls=[];
 advanceSector(state,(previous,random,sector)=>{calls.push({previous,sector});return 'g3-212345678';});
 assert.deepEqual(calls,[{previous:'g3-19e3779b1',sector:3}],'the factory receives the current map and the next sector number');
 assert.equal(state.mapId,'g3-212345678');
});

test('a retreat buys a longer road and a meaner enemy',()=>{
 const first=createMatch([player()],'g3-09e3779b1'),second=createMatch([player()],'g3-19e3779b1');
 for(const state of [first,second]){state.wave=11;state.running=true;state.spawnLeft=1;state.spawnTimer=0;stepMatch(state);}
 assert.equal(first.enemies.length,1);assert.equal(second.enemies.length,1);
 assert.equal(second.enemies[0].kind,first.enemies[0].kind,'same wave, same formation');
 assert.equal(second.enemies[0].maxHp,Math.max(1,Math.round(first.enemies[0].maxHp*1.12)),'sector two toughens every unit');
 assert.ok(second.enemies[0].speed>first.enemies[0].speed,'sector two speeds every unit up');
 const road=map=>{let length=0;for(const path of (map.paths||[map.path]))for(let j=1;j<path.length;j++)length+=Math.hypot(path[j].x-path[j-1].x,path[j].y-path[j-1].y);return length;};
 assert.ok(road(getMap('g3-19e3779b1'))>road(getMap('g3-09e3779b1')),'the sector-two field is the longer road');
});

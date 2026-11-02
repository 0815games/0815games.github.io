import {strict as assert} from 'node:assert';
import {RUN_PERKS,perkOffers} from '../run-perks.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {getMap} from '../maps.mjs';
import {createPartyHost} from '../party-host.mjs';
import {serviceMedals} from '../service-record.mjs';
import {createBattleSound} from '../battle-sound.mjs';
const player=id=>createPlayer(id,{name:id,gender:'female'});
let rares=0;for(let i=0;i<1000;i++){const id=`g2-${i.toString(16).padStart(8,'0')}`,offers=perkOffers(id,5);assert.equal(new Set(offers).size,3);assert.deepEqual(offers,perkOffers(id,5));const n=offers.filter(i=>RUN_PERKS[i].rare).length;assert.ok(n<=1);rares+=n;}
assert.ok(rares>100&&rares<400,`rare offer frequency ${rares}`);
function combat(type,perks,kind='infantry'){
 const s=createMatch([player('solo')]);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.runPerks=perks;s.towers=[{type,pad:0,level:1,timer:0,ownerId:'solo'}];
 s.enemies=[{kind,x:105,y:200,hp:1000,maxHp:1000,speed:0,segment:1,reward:8,damage:10}];return s;
}
const pin=combat(0,{pinning:1});stepMatch(pin);assert.ok(pin.enemies[0].pinned>1.9);
const air=combat(0,{pinning:1},'plane');stepMatch(air);assert.equal(air.enemies[0].pinned,0);
const chain=combat(2,{chain:1});chain.enemies.push({...chain.enemies[0],x:125});stepMatch(chain);assert.ok(chain.enemies[1].hp<1000);assert.equal(chain.shots.length,2);
const crit=combat(3,{critical:1});crit.towers[0].shotCount=3;stepMatch(crit);assert.ok(Math.abs(crit.enemies[0].hp-(1000-45*1.3*1.75))<1e-8);
const tank=combat(1,{tankhunter:1},'tank');stepMatch(tank);assert.ok(Math.abs(tank.enemies[0].hp-(1000-34*1.6*1.2))<1e-8);
const s=createMatch([player('solo')]);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.runPerks={salvage:1};s.enemies=[{kind:'infantry',x:0,y:130,hp:0,speed:0,segment:1,reward:8}];stepMatch(s);assert.equal(s.money,134);
let arctic;for(let i=0;i<200;i++){const m=getMap(`g2-${(Math.imul(i,2654435761)>>>0).toString(16).padStart(8,'0')}`);if(m.theme==='arctic'){arctic=m;break;}}assert.ok(arctic);
const ice=createMatch([player('host'),player('guest')],arctic.id);ice.wave=1;ice.running=true;ice.spawnLeft=1;ice.spawnTimer=100;ice.iceStress=4-STEP/2;ice.enemies=[{kind:'tank',x:arctic.path[4].x+40,y:arctic.path[4].y,hp:100,maxHp:100,speed:0,segment:5,reward:1,damage:1}];
const host=createPartyHost(ice,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);const result=host.advance();assert.ok(result.events.some(e=>e.type==='iceBroken'));host.setPresence('guest',false);host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.iceBroken,true);assert.ok(host.snapshotFor('guest').match.enemies[0].hp<100);
assert.equal(serviceMedals({xp:0}).filter(m=>m.unlocked).length,0);const medals=serviceMedals({xp:999999,armory:{owned:63,equipped:0,fortify:3,plating:3,repair:0,gun:0,scrap:0}});assert.ok(medals.every(m=>m.unlocked));
const noSound=createBattleSound(null);assert.equal(await noSound.setEnabled(true),false);noSound.play('boss');
let tones=0;class FakeAudio{constructor(){this.state='suspended';this.currentTime=0;this.destination={};}async resume(){this.state='running';}createOscillator(){return {frequency:{},connect(){},start(){tones++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
const sound=createBattleSound(FakeAudio);sound.play('boss');assert.equal(tones,0);assert.equal(await sound.setEnabled(true),true);sound.play('boss');assert.equal(tones,2);await sound.setEnabled(false);sound.play('clear');assert.equal(tones,2);
console.log('Run upgrades, hazards, medals and opt-in sound passed.');
// Permanent level unlock grants an optional balanced tower specialization.
for(const level of [1,5]){
 const p=createPlayer('solo',{name:'Solo',gender:'female',level}),s=createMatch([p]);s.money=1000;
 assert.ok(applyCommand(s,'solo',{type:'build',pad:0,towerType:0}).ok);assert.ok(applyCommand(s,'solo',{type:'upgrade',pad:0}).ok);
 const before=s.money,result=applyCommand(s,'solo',{type:'upgrade',pad:0,branch:2});assert.equal(result.ok,level>=5);
 if(level===1)assert.equal(s.money,before);else{assert.equal(s.towers[0].branch,2);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.enemies=[{kind:'infantry',x:105,y:210,hp:100,maxHp:100,speed:0,segment:1,reward:1,damage:1}];stepMatch(s);assert.ok(Math.abs(s.enemies[0].hp-(100-10*1.6*1.4*1.25))<1e-8);}
}

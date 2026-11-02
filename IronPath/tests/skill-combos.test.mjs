import {strict as assert} from 'node:assert';
import {COMBOS,comboTier} from '../skill-combos.mjs';
import {parseBuild,encodeBuild,WEB_NODES} from '../skills.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {createVersus,applyVersus} from '../versus.mjs';
import {createCombatEffects} from '../combat-fx.mjs';
const make=(id,active,idx,tier=1)=>{const b=parseBuild('3,3,3,3,3;assault',100);b.active=active;for(let i=0;i<tier;i++)b.web[idx+i]=1;return createPlayer(id,{name:id,gender:'male',level:100,skills:encodeBuild(b)},850,450);};
const match=(player)=>{const s=createMatch([player]);s.running=true;s.wave=1;s.hp=60;s.spawnLeft=1;s.spawnTimer=100;s.enemies=[{hp:500,maxHp:500,x:100,y:130,segment:1,speed:0,kind:'infantry',reward:1},{hp:250,maxHp:250,x:110,y:130,segment:1,speed:0,kind:'infantry',reward:1}];s.towers=[{id:1,pad:0,type:0,level:1,timer:100,ownerId:player.id}];return s;};
assert.equal(COMBOS.length,10);
for(const c of COMBOS){
 for(const path of c.paths){const p=make('a',path,c.id),s=match(p);if(c.id===25)s.enemies[0].siegeMarks=[{id:'a',time:5}];const out=applyCommand(s,'a',{type:'airstrike'});assert.equal(out.ok,true,`${c.name} ${path}`);assert.ok(out.combos.includes(c.name),`${c.name} ${path} activates`);assert.equal(p.comboCue.name,c.name);assert.match(WEB_NODES[c.id].description,/COMBO/);}
}
// Tiers scale, ownership is isolated, and cooldowns cannot trigger twice.
const siege=make('a','assault',25,3),ss=match(siege);ss.enemies[0].siegeMarks=[{id:'a',time:5},{id:'b',time:5}];assert.equal(comboTier(siege.skills,25),3);assert.equal(applyCommand(ss,'a',{type:'airstrike'}).ok,true);assert.equal(ss.enemies[0].hp,435);assert.equal(ss.enemies[0].siegeMarks[1].time,5);assert.equal(applyCommand(ss,'a',{type:'airstrike'}).ok,false);
const mark=make('a','assault',25),ms=match(mark);ms.towers[0].timer=0;stepMatch(ms);assert.equal(ms.enemies[0].siegeMarks[0].id,'a');assert.equal(applyCommand(ms,'a',{type:'airstrike'}).combos.includes('Siege Command'),true);assert.equal(ms.enemies[0].siegeMarks[0].time,0);
const logistics=make('a','logistics',31,2),ls=match(logistics);assert.equal(applyCommand(ls,'a',{type:'airstrike'}).ok,true);const hp=ls.hp;for(let i=0;i<180;i++)stepMatch(ls);assert.ok(Math.abs(ls.hp-hp-6)<.001,'healing field restores six health across six seconds');
const mobile=make('a','logistics',46,2),mob=match(mobile);applyCommand(mob,'a',{type:'airstrike'});assert.equal(mobile.mobileSupply.bonus,30);assert.equal(mobile.mobileSupply.remaining,5);stepMatch(mob);assert.ok(mobile.mobileSupply.remaining<5);
const engineer=make('a','engineer',52,3),es=match(engineer);applyCommand(es,'a',{type:'airstrike'});assert.equal(es.suppression,6);assert.equal(engineer.overdriveFactor,1.5,'combo never downgrades main overdrive');
// Each mastery capstone uses the already-purchased final node.
const cap=(path,start)=>{const b=parseBuild('3,3,3,3,3;assault',100);b.active=path;for(let i=0;i<5;i++)b.web[start+i]=1;return createPlayer('a',{name:'A',gender:'male',level:100,skills:encodeBuild(b)},100,130);};
for(const i of [4,9,14,19,24])assert.match(WEB_NODES[i].description,/CAPSTONE/);
const hero=cap('assault',0),hs=match(hero);hero.heroShotCount=4;stepMatch(hs);assert.ok(hs.enemies[1].hp<=230,'war hero chains damage');
const eng=cap('engineer',5),ts=match(eng);ts.towers[0].timer=0;ts.towers[0].shotCount=3;stepMatch(ts);assert.ok(ts.enemies[1].hp<=230,'war machine splashes');
const logi=cap('logistics',10),ws=match(logi);ws.enemies=[];ws.spawnLeft=0;const money=ws.money;stepMatch(ws);assert.equal(ws.money,money+30,'wave reward plus capstone supplies');
const medic=cap('medic',15),bs=match(medic);bs.hp=20;stepMatch(bs);const healed=bs.hp;assert.equal(healed,40);bs.hp=20;stepMatch(bs);assert.equal(bs.hp,20,'guardian only once per wave');
const scout=cap('recon',20),rs=match(scout);scout.heroShotCount=3;stepMatch(rs);assert.equal(rs.enemies[0].pinned,3);
// Protocol snapshots must preserve cues while opponent lanes remain isolated.
const a=make('a','logistics',28),b=createPlayer('b',{name:'B',gender:'female',level:1});const duo=createMatch([a,b]);duo.running=true;const before=duo.players.b.money;assert.ok(applyCommand(duo,'a',{type:'airstrike'}).ok);assert.equal(duo.players.b.money,before);assert.equal(JSON.parse(JSON.stringify(duo)).players.a.comboCue.name,'Combat Logistics');
const vs=createVersus([make('a','logistics',28),b],'road','a');vs.lanes.a.running=true;const rivalMoney=vs.lanes.b.money;assert.ok(applyVersus(vs,'a',{type:'airstrike'}).ok);assert.equal(vs.lanes.b.money,rivalMoney);
let clock=0;const fx=createCombatEffects({clock:()=>clock});const view=seq=>({players:{a:{x:5,y:5,cooldown:0,comboCue:{seq,name:'Combo',x:15,y:25}}},enemies:[],towers:[]});fx.observe(view(3));assert.deepEqual(fx.observe(view(4)),['combo']);assert.equal(fx.active()[0].label,'Combo');assert.deepEqual(fx.observe(view(4)),[]);fx.clear();assert.deepEqual(fx.observe(view(4)),[],'rejoin never replays a combo');
console.log('Ten hybrid effects, five capstones, ownership, cooldown and snapshot feedback passed.');
const combatLog=make('a','engineer',28,2),cl=match(combatLog);const base=cl.money;applyCommand(cl,'a',{type:'airstrike'});assert.equal(cl.money,base+8);
const rapid=make('a','medic',34,3),rr=match(rapid);applyCommand(rr,'a',{type:'airstrike'});assert.equal(rr.suppression,6);
const vanguard=make('a','recon',37,2),va=match(vanguard);applyCommand(va,'a',{type:'airstrike'});assert.equal(va.enemies[0].pinned,4);
const shock=make('a','logistics',40,2),sh=match(shock);applyCommand(sh,'a',{type:'airstrike'});assert.equal(sh.enemies[0].hp,480);
const hosp=make('a','assault',49,3),ho=match(hosp);applyCommand(ho,'a',{type:'airstrike'});assert.equal(ho.hp,66);
const combatMedic=make('a','medic',43,2),cm=match(combatMedic);applyCommand(cm,'a',{type:'airstrike'});assert.equal(combatMedic.overdrive,5);assert.equal(combatMedic.overdriveFactor,1.25);
const noCombo=make('a','engineer',28);noCombo.skills.web[28]=0;const plain=match(noCombo),plainMoney=plain.money;assert.deepEqual(applyCommand(plain,'a',{type:'airstrike'}).combos,[]);assert.equal(plain.money,plainMoney);
const {createPartyHost}=await import('../party-host.mjs');
const netMatch=createMatch([make('a','logistics',28),createPlayer('b',{name:'B',gender:'female'})]);netMatch.wave=1;netMatch.running=true;netMatch.spawnLeft=1;netMatch.spawnTimer=100;
const host=createPartyHost(netMatch,{hostId:'a'});host.setPresence('a',true);host.setPresence('b',true);assert.equal(host.receive('a',{version:1,seq:1,command:{type:'airstrike'}}).status,'queued');const tick=host.advance();assert.ok(tick.commands[0].result.combos.includes('Combat Logistics'));assert.equal(host.snapshotFor('b').match.players.a.comboCue.name,'Combat Logistics');assert.equal(host.snapshotFor('b').match.players.a.money,159);assert.equal(host.snapshotFor('b').match.players.b.money,125);
host.setPresence('a',false);assert.equal(host.advance(),null);host.setPresence('a',true);assert.equal(host.snapshotFor('a').match.players.a.comboCue.name,'Combat Logistics','reconnect retains state without rerunning skill');

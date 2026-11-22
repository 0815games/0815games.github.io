import {strict as assert} from 'node:assert';
import {COMBOS,CAPSTONES,comboTier} from '../core/skill-combos.mjs';
import {SKILL_PATHS,parseBuild,encodeBuild,WEB_NODES,NODES_PER_CLASS} from '../core/skills.mjs';
import {createPlayer,applyCommand} from '../core/match.mjs';
import {createMatch,stepMatch} from '../core/simulation.mjs';
import {createVersus,applyVersus} from '../core/versus.mjs';
import {createCombatEffects} from '../core/combat-fx.mjs';

const make=(id,classId,tier=1)=>{
  const combos='1'.repeat(tier)+'0'.repeat(3-tier);
  const skills=`v2;${classId};3;0;00000000000${combos}`;
  return createPlayer(id,{name:id,gender:'male',level:25,skills},850,450);
};
const match=(player)=>{
  const s=createMatch([player]);s.running=true;s.wave=1;s.hp=60;s.spawnLeft=1;s.spawnTimer=100;
  s.enemies=[
    {hp:500,maxHp:500,x:100,y:130,segment:1,speed:0,kind:'infantry',reward:1},
    {hp:250,maxHp:250,x:110,y:130,segment:1,speed:0,kind:'plane',baseKind:'plane',reward:1}
  ];
  s.towers=[{id:1,pad:0,type:0,level:1,timer:100,ownerId:player.id}];
  return s;
};

assert.equal(COMBOS.length,6);
for(const c of COMBOS){
  const path=c.paths[0];
  const p=make('a',path,1),s=match(p);
  const out=applyCommand(s,'a',{type:'airstrike'});
  assert.equal(out.ok,true,`${c.name} ${path}`);
  assert.ok(out.combos.includes(c.name),`${c.name} ${path} activates`);
  assert.equal(p.comboCue.name,c.name);
  const comboNodes=WEB_NODES.filter(n=>n.path===path&&n.kind==='combo');
  assert.equal(comboNodes.length,3);
  for(const n of comboNodes)assert.match(n.description,/SYNERGY/);
}

// Tiers scale, ownership is isolated, and cooldowns cannot trigger twice.
const ass=make('a','assault',3),sa=match(ass);
assert.equal(comboTier(ass.skills,'assault'),3);
assert.equal(applyCommand(sa,'a',{type:'airstrike'}).ok,true);
assert.equal(sa.enemies[0].hp,500-35-24-24,'tier 3 Assault Barrage hits salvo and strongest enemy');
assert.equal(sa.enemies[0].pinned,3);
assert.equal(applyCommand(sa,'a',{type:'airstrike'}).ok,false);

const logiMob=make('a','logistics',2),mob=match(logiMob);
applyCommand(mob,'a',{type:'airstrike'});
assert.equal(logiMob.mobileSupply.bonus,30);
assert.equal(logiMob.mobileSupply.remaining,5);
const hpBefore=mob.hp;for(let i=0;i<180;i++)stepMatch(mob);
assert.ok(Math.abs(mob.hp-hpBefore-6)<.001,'healing field restores six health across six seconds');

const eng=make('a','engineer',3),es=match(eng);
const baseMoney=es.money;
applyCommand(es,'a',{type:'airstrike'});
assert.equal(es.money,baseMoney+12);
assert.equal(es.suppression,6);
assert.equal(eng.overdriveFactor,1.5,'combo never downgrades main overdrive');

const hosp=make('a','medic',3),hs=match(hosp);
applyCommand(hs,'a',{type:'airstrike'});
assert.equal(hs.hp,81,'15 Field Repair + 6 Combat Hospital III');
assert.equal(hosp.overdrive,6);
assert.equal(hosp.overdriveFactor,1.25);

const rec=make('a','recon',2),rs=match(rec);
applyCommand(rs,'a',{type:'airstrike'});
assert.equal(rs.enemies[0].pinned,4);
assert.equal(rs.suppression,11);

const ad=make('a','airDefense',2),ads=match(ad);
applyCommand(ads,'a',{type:'airstrike'});
assert.equal(ads.enemies[1].hp,250-45-24,'tier 2 Flak Resonance hits aircraft');
assert.equal(ads.enemies[1].marked,6);
assert.equal(ads.enemies[1].markedByAirDefense,true);

// Each of the 6 class capstones sits at slot 6 of its 14-node tree.
const cap=(classId)=>createPlayer('a',{name:'A',gender:'male',level:25,skills:`v2;${classId};3;0;00111110000000`},100,130);
for(let c=0;c<SKILL_PATHS.length;c++){
  const node=WEB_NODES[c*NODES_PER_CLASS+6];
  assert.equal(node.capstone,true);
  assert.match(node.description,/CAPSTONE/);
  assert.equal(CAPSTONES[SKILL_PATHS[c].id].id,node.id);
}
const hero=cap('assault'),hmatch=match(hero);hero.heroShotCount=3;stepMatch(hmatch);
assert.ok(hmatch.enemies[1].hp<=226,'War Hero chains 24 damage on fourth shot');

const engCap=cap('engineer'),tmatch=match(engCap);tmatch.towers[0].timer=0;tmatch.towers[0].shotCount=3;stepMatch(tmatch);
assert.ok(tmatch.enemies[1].hp<=228,'War Machine splashes 22 damage');

const logiCap=cap('logistics'),wmatch=match(logiCap);wmatch.enemies=[];wmatch.spawnLeft=0;const money=wmatch.money;stepMatch(wmatch);
assert.equal(wmatch.money,money+32,'wave reward (20) plus War Economy capstone (12)');

const medCap=cap('medic'),bmatch=match(medCap);bmatch.hp=20;stepMatch(bmatch);
assert.equal(bmatch.hp,42,'Bunker Guardian restores 22 HP below 35%');
bmatch.hp=20;stepMatch(bmatch);assert.equal(bmatch.hp,20,'Bunker Guardian fires once per wave');

const recCap=cap('recon'),rmatch=match(recCap);recCap.heroShotCount=3;stepMatch(rmatch);
assert.equal(rmatch.enemies[0].pinned,3,'Ghost Operative pins for 3s');

const adCap=cap('airDefense'),amatch=match(adCap);adCap.heroShotCount=4;stepMatch(amatch);
assert.equal(amatch.enemies[0].marked,3,'Sky Sovereign refreshes 3s mark');
assert.equal(amatch.enemies[0].markedByAirDefense,true);

// Protocol snapshots must preserve cues while opponent lanes remain isolated.
const a=make('a','logistics',1),b=createPlayer('b',{name:'B',gender:'female',level:1});
const duo=createMatch([a,b]);duo.running=true;const before=duo.players.b.money;
assert.ok(applyCommand(duo,'a',{type:'airstrike'}).ok);
assert.equal(duo.players.b.money,before);
assert.equal(JSON.parse(JSON.stringify(duo)).players.a.comboCue.name,'Mobile Convoy');

const vs=createVersus([make('a','logistics',1),b],'road','a');vs.lanes.a.running=true;
const rivalMoney=vs.lanes.b.money;assert.ok(applyVersus(vs,'a',{type:'airstrike'}).ok);assert.equal(vs.lanes.b.money,rivalMoney);

let clock=0;const fx=createCombatEffects({clock:()=>clock});
const view=seq=>({players:{a:{x:5,y:5,cooldown:0,comboCue:{seq,name:'Combo',x:15,y:25}}},enemies:[],towers:[]});
fx.observe(view(3));assert.deepEqual(fx.observe(view(4)),['combo']);assert.equal(fx.active()[0].label,'Combo');
assert.deepEqual(fx.observe(view(4)),[]);fx.clear();assert.deepEqual(fx.observe(view(4)),[],'rejoin never replays a combo');

const noCombo=createPlayer('a',{name:'A',gender:'male',level:25,skills:'v2;logistics;3;0;00000000000000'},850,450);
const plain=match(noCombo),plainMoney=plain.money;
assert.deepEqual(applyCommand(plain,'a',{type:'airstrike'}).combos,[]);
assert.equal(plain.money,plainMoney+30,'main supply drop only without combo');

const {createPartyHost}=await import('../core/party-host.mjs');
const netMatch=createMatch([make('a','logistics',1),createPlayer('b',{name:'B',gender:'female'})]);
netMatch.wave=1;netMatch.running=true;netMatch.spawnLeft=1;netMatch.spawnTimer=100;
const host=createPartyHost(netMatch,{hostId:'a'});host.setPresence('a',true);host.setPresence('b',true);
assert.equal(host.receive('a',{version:1,seq:1,command:{type:'airstrike'}}).status,'queued');
const tick=host.advance();
assert.ok(tick.commands[0].result.combos.includes('Mobile Convoy'));
assert.equal(host.snapshotFor('b').match.players.a.comboCue.name,'Mobile Convoy');
assert.equal(host.snapshotFor('b').match.players.a.money,155);
assert.equal(host.snapshotFor('b').match.players.b.money,125);
host.setPresence('a',false);assert.equal(host.advance(),null);
host.setPresence('a',true);
assert.equal(host.snapshotFor('a').match.players.a.comboCue.name,'Mobile Convoy','reconnect retains state without rerunning skill');
console.log('V2 six-class synergy combos, six capstones, ownership, cooldown and snapshot feedback passed.');

import {strict as assert} from 'node:assert';
import {bossPhase,bossWeaponFactor,bossPhaseLabel,bossTelegraph,crossedCycle} from '../boss-mechanics.mjs';
import {makeEnemy,BOSSES,STORY_BOSSES,missionFormation,waveFormation} from '../combat.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
const player=id=>createPlayer(id,{name:id,gender:'female'});
assert.equal(bossPhase({boss:'bossIronclad',bossClock:7.9}),'normal');assert.equal(bossPhase({boss:'bossIronclad',bossClock:8}),'shield');assert.equal(bossWeaponFactor({boss:'bossIronclad',bossClock:8}),.6);assert.equal(bossPhase({boss:'bossIronclad',bossClock:12}),'normal');
assert.equal(bossPhase({boss:'bossBomber',bossClock:10}),'bomb-warning');assert.match(bossPhaseLabel({boss:'bossBomber',bossClock:10}),/incoming/);assert.equal(bossPhase({boss:'bossJuggernaut',bossClock:8}),'repair-warning');assert.equal(bossPhase({boss:'bossCommander',bossClock:10}),'rally');assert.equal(crossedCycle(11.99,12.01,12),true);
function setup(kind,clock,players=[player('solo')]){
 const s=createMatch(players);s.wave=10;s.running=true;s.spawnLeft=1;s.spawnTimer=100;
 s.enemies=[{...makeEnemy(kind,10),bossClock:clock,x:300,y:130,segment:1,speed:0}];return s;
}
{
 const s=setup('bossBomber',12-STEP/2);s.plating=2;s.hp=100;const events=stepMatch(s);assert.ok(Math.abs(s.hp-93.6)<1e-8);assert.equal(events.filter(e=>e.type==='bossAbility'&&e.ability==='bomb').length,1);assert.ok(s.enemies[0].bossFlash>0);stepMatch(s);assert.ok(Math.abs(s.hp-93.6)<1e-8,'bombs occur only once per cycle');
}
{
 const s=setup('bossJuggernaut',10-STEP/2),e=s.enemies[0];e.hp=e.maxHp*.5;const before=e.hp;const events=stepMatch(s);assert.ok(e.hp-before>=e.maxHp*.02);assert.ok(events.some(e=>e.ability==='repair'));assert.ok(e.bossFlash>0);
}
{
 const s=setup('bossIronclad',8),e=s.enemies[0];e.x=105;e.y=210;s.towers=[{type:1,level:1,pad:0,timer:0,ownerId:'solo'}];const before=e.hp;stepMatch(s);assert.ok(Math.abs((before-e.hp)-34*1.6*.8*.6)<1e-8,'shield stacks with armor against tower fire');
}
{
 const s=setup('bossCommander',10),boss=s.enemies[0];s.enemies.push({kind:'infantry',x:boss.x+150,y:boss.y,hp:100,maxHp:100,speed:30,segment:1,reward:1,damage:1});const x=s.enemies[1].x;stepMatch(s);assert.ok(Math.abs(Math.abs(s.enemies[1].x-x)-30*STEP*1.4)<1e-8,'rally increases aura range and speed');
}
{
 const s=setup('bossBomber',11,[player('host'),player('guest')]);const host=createPartyHost(s,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);host.advance();const a=host.snapshotFor('host').match,b=host.snapshotFor('guest').match;assert.equal(bossPhase(a.enemies[0]),'bomb-warning');assert.equal(a.enemies[0].bossClock,b.enemies[0].bossClock);host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.equal(bossPhase(host.snapshotFor('guest').match.enemies[0]),'bomb-warning');
}
// Riegel, the Night Warden, closes Act I: a story boss, never in the endless
// rotation. His jam field blocks the ability recharge and dampens weapon
// damage; when it collapses, a swarm of interceptors covers the open window.
assert.equal(bossPhase({boss:'bossRiegel',bossClock:11.9}),'normal');
assert.equal(bossPhase({boss:'bossRiegel',bossClock:12}),'jam');
assert.equal(bossWeaponFactor({boss:'bossRiegel',bossClock:12}),.2);
assert.equal(bossWeaponFactor({boss:'bossRiegel',bossClock:5}),1);
assert.match(bossPhaseLabel({boss:'bossRiegel',bossClock:14}),/blocked/);
assert.equal(bossTelegraph({boss:'bossRiegel',bossClock:11}).key,'jam-warning');
assert.equal(bossTelegraph({boss:'bossRiegel',bossClock:11}).warning,true);
assert.equal(bossTelegraph({boss:'bossRiegel',bossClock:14}).key,'jam');
{
 const riegel=makeEnemy('bossRiegel',7);
 assert.equal(riegel.boss,'bossRiegel');assert.equal(riegel.kind,'tank');
 assert.equal(BOSSES.find(b=>b.kind==='bossRiegel'),undefined,'story bosses never join the endless rotation');
 assert.equal(STORY_BOSSES.length,4,'Riegel, Kolt, A-7 and the Zugsmeister close acts I through IV');
}
{
 const s=setup('bossRiegel',18-STEP/2);s.players.solo.cooldown=5;const events=stepMatch(s);
 assert.equal(events.filter(e=>e.type==='bossAbility'&&e.ability==='interceptors').length,1);
 assert.deepEqual(s.enemies.slice(1).map(e=>e.kind),['runner','runner','runner']);
 assert.ok(s.enemies.slice(1).every(e=>e.speed>makeEnemy('runner',7).speed),'interceptors outrun ordinary scouts');
 stepMatch(s);assert.equal(s.enemies.length,4,'the swarm drops once per cycle');
}
{
 const s=setup('bossRiegel',13);s.players.solo.cooldown=5;stepMatch(s);
 assert.equal(s.players.solo.cooldown,5,'the jam field freezes the ability recharge');
 const open=setup('bossRiegel',3);open.players.solo.cooldown=5;stepMatch(open);
 assert.ok(open.players.solo.cooldown<5,'recharge resumes once the field is down');
}
// Kolt, the Deichbrecher, closes Act II: while his flood pulse runs, every
// remaining enemy surges and he shields behind the water. The answer is kill
// order and pulse rhythm - thin the wave, strike between the pulses.
assert.equal(bossPhase({boss:'bossKolt',bossClock:11.9}),'normal');
assert.equal(bossPhase({boss:'bossKolt',bossClock:12}),'flood');
assert.equal(bossWeaponFactor({boss:'bossKolt',bossClock:12}),.5);
assert.equal(bossWeaponFactor({boss:'bossKolt',bossClock:5}),1);
assert.match(bossPhaseLabel({boss:'bossKolt',bossClock:14}),/surge/);
assert.equal(bossTelegraph({boss:'bossKolt',bossClock:11}).key,'flood-warning');
assert.equal(bossTelegraph({boss:'bossKolt',bossClock:11}).warning,true);
assert.equal(bossTelegraph({boss:'bossKolt',bossClock:14}).key,'flood');
{
 const kolt=makeEnemy('bossKolt',7);
 assert.equal(kolt.boss,'bossKolt');assert.equal(kolt.kind,'tank');
 assert.equal(BOSSES.find(b=>b.kind==='bossKolt'),undefined,'story bosses never join the endless rotation');
 assert.equal(STORY_BOSSES.length,4);
}
{
 const surge=()=>{const s=setup('bossKolt',13);s.enemies.push({kind:'infantry',x:s.enemies[0].x+150,y:s.enemies[0].y,hp:100,maxHp:100,speed:30,segment:1,reward:1,damage:1});const enemy=s.enemies[1],x=enemy.x;stepMatch(s);return Math.abs(enemy.x-x);};
 const during=surge(),off=(()=>{const s=setup('bossKolt',5);s.enemies.push({kind:'infantry',x:s.enemies[0].x+150,y:s.enemies[0].y,hp:100,maxHp:100,speed:30,segment:1,reward:1,damage:1});const enemy=s.enemies[1],x=enemy.x;stepMatch(s);return Math.abs(enemy.x-x);})();
 assert.ok(Math.abs(during-off*1.45)<1e-8,'the flood pulse surges every wave remnant');
 const boss=setup('bossKolt',13),calm=setup('bossKolt',5);
 assert.equal(Math.abs(boss.enemies[0].x-300),0,'the surge never carries Kolt himself');
}
{
 const s=setup('bossKolt',18-STEP/2);const events=stepMatch(s);
 assert.equal(events.filter(e=>e.type==='bossAbility'&&e.ability==='flood').length,1);
 assert.equal(stepMatch(s).filter(e=>e.type==='bossAbility'&&e.ability==='flood').length,0,'the pulse fires once per cycle');
}
// A-7, the Works Overseer, closes Act III: his armor comes off in phases -
// works shell, exposed torso, open core - read straight off boss health, so
// snapshots and reconnects agree without extra state. The shell halves weapon
// damage; the open core takes extra and drives him forward.
assert.equal(bossPhase({boss:'bossA7',hp:7,maxHp:7}),'werk');
assert.equal(bossPhase({boss:'bossA7',hp:4.6,maxHp:7}),'torso');
assert.equal(bossPhase({boss:'bossA7',hp:2,maxHp:7}),'kern');
assert.equal(bossPhase({boss:'bossA7',hp:6.9,maxHp:7}),'werk','above two thirds the shell holds');
assert.equal(bossPhase({boss:'bossA7',hp:4.6,maxHp:7}),'torso','the shell breaks at two thirds');
assert.equal(bossPhase({boss:'bossA7',hp:2.3,maxHp:7}),'kern','the core opens at one third');
assert.equal(bossWeaponFactor({boss:'bossA7',hp:7,maxHp:7}),.5);
assert.equal(bossWeaponFactor({boss:'bossA7',hp:4.6,maxHp:7}),1);
assert.equal(bossWeaponFactor({boss:'bossA7',hp:2,maxHp:7}),1.25);
assert.match(bossPhaseLabel({boss:'bossA7',hp:7,maxHp:7}),/halved/);
assert.match(bossPhaseLabel({boss:'bossA7',hp:4.6,maxHp:7}),/accelerates/);
assert.match(bossPhaseLabel({boss:'bossA7',hp:2,maxHp:7}),/strike now/);
assert.equal(bossTelegraph({boss:'bossA7',hp:7,maxHp:7}),null,'the phases are read off health, not a countdown');
{
 const a7=makeEnemy('bossA7',7);
 assert.equal(a7.boss,'bossA7');assert.equal(a7.kind,'tank');
 assert.equal(BOSSES.find(b=>b.kind==='bossA7'),undefined,'story bosses never join the endless rotation');
}
{
 const s=setup('bossA7',3);s.enemies[0].hp=s.enemies[0].maxHp;stepMatch(s);
 s.enemies[0].hp=s.enemies[0].maxHp*.5;const events=stepMatch(s);
 assert.equal(events.filter(e=>e.type==='bossAbility'&&e.ability==='a7-torso').length,1);
 assert.equal(stepMatch(s).filter(e=>e.type==='bossAbility'&&e.ability==='a7-torso').length,0,'the phase event fires once per threshold');
}
{
 const move=fraction=>{const s=setup('bossA7',3);s.enemies[0].hp=s.enemies[0].maxHp*fraction;s.enemies[0].speed=30;const x=s.enemies[0].x;stepMatch(s);return Math.abs(s.enemies[0].x-x);};
 const shell=move(.9),torso=move(.5),core=move(.2);
 assert.ok(Math.abs(shell-30*STEP)<1e-6,'the works shell keeps his pace');
 assert.ok(Math.abs(shell*1.12-torso)<1e-6,'the exposed torso accelerates him');
 assert.ok(Math.abs(shell*1.35-core)<1e-6,'the open core drives him forward');
}
// The Zugsmeister, Guard of the Pass, closes Act IV: rail artillery on a
// health-read armor chain - signal wire, exposed guns, uncoupled loco. The
// wire halves weapon damage; telegraphed rail strikes hammer the bunker on the
// boss clock, faster once the guns stand exposed, never once uncoupled.
assert.equal(bossPhase({boss:'bossZugsmeister',hp:8,maxHp:8}),'wire');
assert.equal(bossPhase({boss:'bossZugsmeister',hp:5,maxHp:8}),'guns');
assert.equal(bossPhase({boss:'bossZugsmeister',hp:2,maxHp:8}),'loco');
assert.equal(bossPhase({boss:'bossZugsmeister',hp:7.9,maxHp:8}),'wire','above two thirds the wire holds');
assert.equal(bossPhase({boss:'bossZugsmeister',hp:2.6,maxHp:8}),'loco','the loco uncouples at one third');
assert.equal(bossWeaponFactor({boss:'bossZugsmeister',hp:8,maxHp:8}),.5);
assert.equal(bossWeaponFactor({boss:'bossZugsmeister',hp:5,maxHp:8}),1);
assert.equal(bossWeaponFactor({boss:'bossZugsmeister',hp:2,maxHp:8}),1.25);
assert.match(bossPhaseLabel({boss:'bossZugsmeister',hp:8,maxHp:8}),/halve/);
assert.match(bossPhaseLabel({boss:'bossZugsmeister',hp:5,maxHp:8}),/accelerates/);
assert.match(bossPhaseLabel({boss:'bossZugsmeister',hp:2,maxHp:8}),/strike now/);
assert.equal(bossTelegraph({boss:'bossZugsmeister',hp:8,maxHp:8,bossClock:15}).key,'rail-warning');
assert.equal(bossTelegraph({boss:'bossZugsmeister',hp:8,maxHp:8,bossClock:15}).warning,true);
assert.equal(bossTelegraph({boss:'bossZugsmeister',hp:8,maxHp:8,bossClock:3}).key,'wire');
assert.equal(bossTelegraph({boss:'bossZugsmeister',hp:2,maxHp:8,bossClock:3}),null,'uncoupled, he only comes');
{
 const zugs=makeEnemy('bossZugsmeister',7);
 assert.equal(zugs.boss,'bossZugsmeister');assert.equal(zugs.kind,'tank');
 assert.equal(BOSSES.find(b=>b.kind==='bossZugsmeister'),undefined,'story bosses never join the endless rotation');
}
{
 const s=setup('bossZugsmeister',3);s.enemies[0].hp=s.enemies[0].maxHp;stepMatch(s);
 s.enemies[0].hp=s.enemies[0].maxHp*.5;const events=stepMatch(s);
 assert.equal(events.filter(e=>e.type==='bossAbility'&&e.ability==='zugs-guns').length,1);
 assert.equal(stepMatch(s).filter(e=>e.type==='bossAbility'&&e.ability==='zugs-guns').length,0,'the phase event fires once per threshold');
}
{
 const strike=(fraction,clock)=>{const s=setup('bossZugsmeister',clock);s.enemies[0].hp=s.enemies[0].maxHp*fraction;const before=s.hp;const events=stepMatch(s);return {hit:before-s.hp,railguns:events.filter(e=>e.type==='bossAbility'&&e.ability==='railgun').length};};
 const wire=strike(1,18-STEP/2);
 assert.equal(wire.railguns,1,'the rail guns fire once per wire cycle');
 assert.ok(Math.abs(wire.hit-10)<1e-9,'the rail strike hits the bunker for ten');
 assert.equal(strike(1,5).railguns,0,'no strike mid-cycle');
 assert.equal(strike(1,12-STEP/2).railguns,0,'the wire cycle is eighteen seconds, not twelve');
 const guns=strike(.5,12-STEP/2);
 assert.equal(guns.railguns,1,'exposed guns reload every twelve seconds');
 assert.equal(strike(.2,18-STEP/2).railguns,0,'uncoupled, the guns fall silent');
}
{
 const move=fraction=>{const s=setup('bossZugsmeister',3);s.enemies[0].hp=s.enemies[0].maxHp*fraction;s.enemies[0].speed=30;const x=s.enemies[0].x;stepMatch(s);return Math.abs(s.enemies[0].x-x);};
 const wire=move(.9),guns=move(.5),loco=move(.2);
 assert.ok(Math.abs(wire-30*STEP)<1e-6,'the signal wire keeps his pace');
 assert.ok(Math.abs(wire*1.12-guns)<1e-6,'the exposed guns accelerate him');
 assert.ok(Math.abs(wire*1.35-loco)<1e-6,'uncoupled, he drives forward');
}
// The mission formation carries the story boss on the contract's final wave,
// replacing the rotation boss instead of stacking on it.
assert.equal(missionFormation(7,{waves:7,bossFinal:'bossRiegel'}).at(-1),'bossRiegel');
assert.equal(missionFormation(7,{waves:7,bossFinal:'bossRiegel'}).filter(k=>k.startsWith('boss')).length,1);
assert.equal(missionFormation(10,{waves:10,bossFinal:'bossRiegel'}).filter(k=>k.startsWith('boss')).length,1,'the finale swaps the rotation boss for the story boss');
assert.equal(missionFormation(5,{waves:7,bossFinal:'bossRiegel'}).includes('bossRiegel'),false,'earlier waves keep the endless rhythm');
assert.deepEqual(missionFormation(5,{}),waveFormation(5,undefined),'contracts without a story boss are the endless rhythm exactly');
assert.equal(missionFormation(7,{}).includes('bossRiegel'),false);
assert.equal(missionFormation(7,{waves:7,bossFinal:'bossKolt'}).at(-1),'bossKolt','Kolt closes Act II on the veteran contract');
console.log('Boss timings, telegraphs, abilities and co-op snapshots passed.');

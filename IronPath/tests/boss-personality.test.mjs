import {strict as assert} from 'node:assert';
import {bossPhase,bossWeaponFactor,bossPhaseLabel,crossedCycle} from '../boss-mechanics.mjs';
import {makeEnemy} from '../combat.mjs';
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
console.log('Boss timings, telegraphs, abilities and co-op snapshots passed.');

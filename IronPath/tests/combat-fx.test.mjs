import {strict as assert} from 'node:assert';
import {createCombatEffects} from '../combat-fx.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
let now=100;const fx=createCombatEffects({clock:()=>now});
const view=(cooldown,active='assault')=>({players:{alice:{x:150,y:180,cooldown,skills:{active}}},enemies:[{x:70,y:130,hp:20}]});
fx.observe(view(0));assert.equal(fx.active().length,0);fx.observe(view(29.8));assert.equal(fx.active().length,1);assert.equal(fx.active()[0].kind,'assault');assert.deepEqual(fx.active()[0].targets,[{x:70,y:130}]);
fx.observe(view(29.8));fx.observe(view(29.5));assert.equal(fx.active().length,1,'repeated snapshots never replay an effect');
now+=1000;assert.equal(fx.active().length,0,'effects expire locally');fx.clear();fx.observe(view(20));assert.equal(fx.active().length,0,'a rejoin treats active cooldown as baseline');
for(const name of ['engineer','logistics','medic','recon']){fx.clear();fx.observe(view(0,name));fx.observe(view(30,name));assert.equal(fx.active()[0].kind,name);}
const reduced=createCombatEffects({clock:()=>now,reducedMotion:true});reduced.observe(view(0));reduced.observe(view(30));reduced.emit('assault',{x:2,y:3},view(0));assert.equal(reduced.active().length,0);
// Co-op views publish every six ticks. Visual trails last beyond that interval,
// but damage remains identical to solo for the same tower and enemy.
const player=id=>createPlayer(id,{name:id,gender:'male'},850,450);
function setup(players){const s=createMatch(players);s.running=true;s.wave=1;s.spawnLeft=1;s.spawnTimer=100;s.towers=[{id:1,pad:0,type:0,level:1,timer:0,ownerId:players[0].id}];s.enemies=[{x:105,y:130,hp:1000,maxHp:1000,reward:1,kind:'infantry',speed:0,segment:1}];return s;}
const solo=setup([player('alice')]),coop=setup([player('alice'),player('bob')]);for(let i=0;i<7;i++){stepMatch(solo);stepMatch(coop);}assert.equal(solo.enemies[0].hp,coop.enemies[0].hp);assert.ok(coop.shots.length>0,'at least one shot remains for the next co-op snapshot');assert.equal(coop.shots[0].kind,0);assert.ok(coop.shots[0].life>0);
console.log('Ability effects, replay suppression and co-op visual snapshot tests passed.');

// Deterministic, local stress workloads. No network, database, injected health,
// currency or automatic victories in the playthroughs. Synthetic density tests
// are explicitly separated from those playthroughs.
import {strict as assert} from 'node:assert';
import {performance} from 'node:perf_hooks';
import {createPlayer,applyCommand,getSupplies} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createVersus,applyVersus,stepVersus} from '../versus.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand,stepFour,setFourPresence} from '../four-modes.mjs';
import {getMap} from '../maps.mjs';
import {makeEnemy} from '../combat.mjs';
import {createPartyHost} from '../party-host.mjs';
import {MAX_PENDING} from '../protocol.mjs';
const ids=['a','b','c','d'];
const players=n=>ids.slice(0,n).map((id,i)=>createPlayer(id,{name:`Stress ${id}`,gender:'female',level:3,skills:'1,1,0,0,0;assault'},n>2?1220:850,n>2?270+i*60:450));
const seed=i=>`g2-${(i*2654435761>>>0).toString(16).padStart(8,'0')}`;
const summary={playthroughs:[],extended:[],maps:{count:0,themes:{}},density:[],protocol:[]};
function validate(field){
 assert.ok(Number.isFinite(field.hp)&&Number.isFinite(field.maxHp));assert.ok(field.towers.length<=getMap(field.mapId).pads.length);assert.equal(new Set(field.towers.map(t=>t.pad)).size,field.towers.length);
 for(const p of Object.values(field.players)){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Number.isFinite(getSupplies(field,p.id))&&getSupplies(field,p.id)>=0);}
 for(const e of field.enemies)assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.hp));
}
function create(mode,index){
 const n=mode==='solo'?1:mode==='coop'||mode==='versus'?2:mode==='three-coop'?3:4,ps=players(n),map=seed(index+1);let state,command,step,fields,finished;
 if(mode==='solo'||mode==='coop') {state=createMatch(ps,map);if(mode==='coop')state.hostId='a';command=(id,c)=>applyCommand(state,id,c);step=()=>stepMatch(state);fields=()=>[state];finished=()=>state.ended;}
 else if(mode==='versus'){state=createVersus(ps,map,'a');command=(id,c)=>applyVersus(state,id,c);step=()=>stepVersus(state);fields=()=>Object.values(state.lanes);finished=()=>state.ended;}
 else {state=mode==='two-vs-two'?createTwoVsTwo(ps,'a',[['a','b'],['c','d']]):createFourCoop(ps,'a');command=(id,c)=>applyFourCommand(state,id,c);step=()=>stepFour(state);fields=()=>mode==='two-vs-two'?state.lanes:[state.match];finished=()=>mode==='two-vs-two'?state.ended:state.match.ended;}
 return {state,command,step,fields,finished,ids:ids.slice(0,n),mode};
}
function spend(game,rotation){
 for(const field of game.fields())for(const id of Object.keys(field.players)){
  const pads=getMap(field.mapId).pads.length;
  // Spend only earned supplies; avoid global RNG or manipulating the simulation.
  let count=0;for(let i=0;i<pads&&count<2;i++){const pad=(i+rotation)%pads;if(!field.towers.some(t=>t.pad===pad)&&game.command(id,{type:'build',pad,towerType:(pad+rotation)%4}).ok)count++;}
  for(const tower of [...field.towers])if(tower.ownerId===id){if(game.command(id,{type:'upgrade',pad:tower.pad,branch:0}).ok)break;}
 }
}
function prepareWave(game){
 for(const field of game.fields())if(field.pendingPerk){const id=Object.keys(field.players)[0];assert.equal(game.command(id,{type:'choosePerk',index:0}).ok,true);}
 const r=game.command('a',{type:'startWave'});assert.equal(r.ok,true,`${game.mode}: ${r.reason}`);
 if(game.mode==='coop'){assert.equal(game.command('b',{type:'approveWave',requestId:game.state.waveRequestId}).ok,true);}
 if(game.mode==='versus'){assert.equal(game.command('b',{type:'approveWave',requestId:game.state.waveRequestId}).ok,true);}
 if(['three-coop','four-coop','two-vs-two'].includes(game.mode)){const requestId=game.state.pending.id;for(const id of game.ids.slice(1))assert.equal(game.command(id,{type:'approveWave',requestId}).ok,true);}
}
function play(mode,index,maxWaves=8){
 const g=create(mode,index);let ticks=0,waves=0,events=0,peakEnemies=0;const start=performance.now();
 while(!g.finished()&&waves<maxWaves){spend(g,index+waves);prepareWave(g);let waveTicks=0;while(!g.finished()&&g.fields().some(f=>f.running)&&waveTicks<12000){
  if(waveTicks%180===0){spend(g,index+waves);for(const id of g.ids)g.command(id,{type:'airstrike'});}
  events+=g.step().length;ticks++;waveTicks++;if(waveTicks%120===0)for(const f of g.fields())validate(f);for(const f of g.fields())peakEnemies=Math.max(peakEnemies,f.enemies.length);
 }
 assert.ok(waveTicks<12000,`${mode} wave failed to finish within simulated 400 seconds`);for(const f of g.fields())validate(f);if(!g.finished())waves++;
 }
 return {mode,scenario:index+1,completedWaves:waves,outcome:g.finished()?'defeat':`${maxWaves}-wave limit`,ticks,events,peakEnemies,elapsedMs:Math.round(performance.now()-start)};
}
for(let i=1;i<=500;i++){const map=getMap(seed(i));assert.equal(map.pads.length,10);assert.equal(new Set(map.pads.map(p=>`${p.x},${p.y}`)).size,10);assert.ok(map.path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));summary.maps.count++;summary.maps.themes[map.theme]=(summary.maps.themes[map.theme]||0)+1;}
for(const mode of ['solo','coop','versus','three-coop','four-coop','two-vs-two']){for(let i=0;i<3;i++)summary.playthroughs.push(play(mode,i));summary.extended.push(play(mode,3,30));}
// Deliberately artificial maximum-density test, not a balance playthrough.
for(const mode of ['four-coop','two-vs-two']){
 const state=mode==='four-coop'?createFourCoop(players(4),'a'):createTwoVsTwo(players(4),'a',[['a','b'],['c','d']]),fields=mode==='four-coop'?[state.match]:state.lanes;
 for(const field of fields){field.wave=100;field.running=true;field.spawnLeft=1;field.spawnTimer=100000;field.hp=field.maxHp=1e9;field.towers=Array.from({length:16},(_,pad)=>({id:pad+1,pad,type:pad%4,level:6,branch:0,timer:0,ownerId:Object.keys(field.players)[pad%Object.keys(field.players).length]}));field.enemies=Array.from({length:72},(_,i)=>({...makeEnemy(['infantry','runner','tank','plane'][i%4],100),x:300+(i%8)*8,y:180+Math.floor(i/8)*5,segment:1,speed:0,hp:1e9,maxHp:1e9,road:0}));}
 const started=performance.now();for(let i=0;i<1800;i++){stepFour(state);if(i%100===0)for(const f of fields)validate(f);}const ms=performance.now()-started;
 const host=createPartyHost(state,{hostId:'a'});for(const id of ids)host.setPresence(id,true);const sizes=ids.map(id=>Buffer.byteLength(JSON.stringify(host.snapshotFor(id))));const checkpoint=Buffer.byteLength(JSON.stringify(host.checkpoint()));assert.ok(Math.max(...sizes)<262144,'view exceeds transport limit');assert.ok(checkpoint<1048576,'checkpoint exceeds recovery limit');
 // Repeated disconnect/reconnect must not duplicate members or leave the match stuck.
 for(let i=0;i<200;i++){setFourPresence(state,'d',false);setFourPresence(state,'d',true);}assert.equal(Object.keys(state.members).length,4);
 summary.density.push({mode,ticks:1800,enemiesPerField:72,towersPerField:16,elapsedMs:Math.round(ms),maxViewBytes:Math.max(...sizes),checkpointBytes:checkpoint,reconnectCycles:200});
}
// Ordered command queue, retry, cancellation and reconnect under sustained input.
for(const mode of ['coop','versus','four-coop','two-vs-two']){
 const n=mode==='coop'||mode==='versus'?2:4,ps=players(n),initial=mode==='coop'?createMatch(ps,'road'):mode==='versus'?createVersus(ps,'road','a'):mode==='four-coop'?createFourCoop(ps,'a'):createTwoVsTwo(ps,'a',[['a','b'],['c','d']]);
 const h=createPartyHost(initial,{hostId:'a'}),roster=ids.slice(0,n),seq=Object.fromEntries(roster.map(id=>[id,0]));for(const id of roster)h.setPresence(id,true);
 const started=performance.now();let applied=0,cancelled=0;
 for(let i=0;i<MAX_PENDING;i++){const msg={version:1,seq:++seq.a,command:{type:'direction',x:0,y:0}};assert.equal(h.receive('a',msg).status,'queued');}
 assert.equal(h.receive('a',{version:1,seq:seq.a+1,command:{type:'direction',x:0,y:0}}).reason,'queue-full');assert.equal(h.advance().commands.length,MAX_PENDING);applied+=MAX_PENDING;
 for(let i=0;i<1000;i++){
  for(const id of roster){const msg={version:1,seq:++seq[id],command:{type:'direction',x:i%2?1:-1,y:0}};assert.equal(h.receive(id,msg).status,'queued');assert.equal(h.receive(id,msg).status,'queued');}
  if(i%25===0){h.setPresence('b',false);assert.equal(h.receive('b',{version:1,seq:seq.b,command:{type:'direction',x:i%2?1:-1,y:0}}).status,'rejected');h.setPresence('b',true);const affected=mode==='two-vs-two'?roster:['b'];for(const id of affected)assert.equal(h.snapshotFor(id).receipts.at(-1).status,'cancelled');cancelled+=affected.length;}
  const frame=h.advance();assert.ok(frame);applied+=frame.commands.length;
 }
 for(const id of roster)assert.equal(h.snapshotFor(id).nextSeq,seq[id]+1);
 assert.equal(applied+cancelled,MAX_PENDING+1000*n);
 summary.protocol.push({mode,queued:MAX_PENDING+1000*n,applied,cancelled,reconnectCycles:40,elapsedMs:Math.round(performance.now()-started)});
}
console.log(JSON.stringify(summary,null,2));

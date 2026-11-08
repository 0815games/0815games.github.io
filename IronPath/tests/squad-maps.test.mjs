// Squad fields: the pool 3p/4p co-op and 2v2 draw from, its deterministic
// selection, the spawn anchoring on generated fields, and the balance profile
// the headless harness measured for every pool entry.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {getMap,mapPlayerCap} from '../maps.mjs';
import {SQUAD_MAP_POOL,squadMapFor,createFourCoop,createTwoVsTwo} from '../four-modes.mjs';
import {createPlayer} from '../match.mjs';
import {runFourCoop,GEARS} from './balance-harness.mjs';

test('every squad field exists, carries two roads and the V2 roadside look',()=>{
  assert.ok(SQUAD_MAP_POOL.includes('four-front'),'the classic frontier stays in the pool');
  for(const id of SQUAD_MAP_POOL){
    const map=getMap(id);
    assert.equal(map.id,id,`${id} resolves`);
    assert.equal(mapPlayerCap(id),4,`${id} carries a full squad`);
    assert.ok((map.paths||[]).length>=2,`${id} has two roads for four wallets`);
    assert.ok(map.pads.length>=16,`${id} has enough pads`);
    assert.ok((map.torches||[]).length>=8,`${id} has roadside torches`);
    for(const torch of map.torches||[]){
      assert.ok(map.pads.every(p=>Math.hypot(p.x-torch.x,p.y-torch.y)>=24),`${id}: torch clear of pads`);
    }
  }
});

test('the squad field is drawn deterministically from the party id',()=>{
  const partyId='ab32f4'.padEnd(32,'0');
  for(let i=0;i<3;i++)assert.equal(squadMapFor(partyId),squadMapFor(partyId),'same party, same field');
  assert.ok(SQUAD_MAP_POOL.includes(squadMapFor(partyId)),'draw never leaves the pool');
  // Different parties spread across the pool instead of all landing on one map.
  const draws=new Set(Array.from({length:64},(_,i)=>squadMapFor(String(i).padStart(32,'0'))));
  assert.ok(draws.size>=SQUAD_MAP_POOL.length,'the whole pool is reachable');
  assert.equal(squadMapFor('not-a-party'),'four-front','invalid ids fall back to the frontier');
  assert.equal(squadMapFor(null),'four-front','missing ids fall back to the frontier');
});

test('squad matches honor the drawn map and anchor soldiers on the roads',()=>{
  const field='g3-29e3779b1',map=getMap(field);
  const players=Array.from({length:4},(_,i)=>createPlayer(`p${i+1}`,{name:'S',gender:'male',level:5},850,450));
  const coop=createFourCoop(players,'p1',field);
  assert.equal(coop.match.mapId,field);
  assert.equal(coop.match.individualSupplies,true);
  const roadDistance=p=>Math.min(...(map.paths||[map.path]).map(path=>{
    let m=1e9;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;m=Math.min(m,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return m;}));
  for(const player of Object.values(coop.match.players))
    assert.ok(roadDistance(player)<12,`${player.id} starts on a road, not in the wild`);
  // The hand-built frontier keeps the coordinates the caller chose (the
  // generated-field call above anchored the shared roster in place).
  const front=createFourCoop(Array.from({length:4},(_,i)=>createPlayer(`f${i+1}`,{name:'F',gender:'female',level:5},850,450)),'f1','four-front');
  assert.equal(front.match.mapId,'four-front');
  assert.equal(front.match.players.f1.x,850,'frontier spawns are untouched');
  const duel=createTwoVsTwo(Array.from({length:4},(_,i)=>createPlayer(`d${i+1}`,{name:'D',gender:'male',level:5},850,450)),'d1',[['d1','d2'],['d3','d4']],field);
  assert.equal(duel.lanes[0].mapId,field);
  assert.equal(duel.lanes[1].mapId,field,'both 2v2 lanes fight the same field');
});

test('generated retreat sectors carry squads, sector one stays a duo field',()=>{
  assert.equal(mapPlayerCap('road'),2);
  assert.equal(mapPlayerCap('g3-0b9f45231'),2,'sector one has no room for four wallets');
  assert.equal(mapPlayerCap('g3-29e3779b1'),4,'the squad pool fields are sector 3+');
  assert.equal(mapPlayerCap('four-front'),4);
  assert.equal(mapPlayerCap('no-such-map'),2,'unknown fields fall back to the duo cap');
});

test('the squad pool keeps its measured balance profile',()=>{
  // Measured with the headless harness: a veteran trio holds every pool field
  // into the late waves, and a rookie trio still falls mid-run - challenging
  // but fair, on the classic frontier and the generated sectors alike.
  for(const id of SQUAD_MAP_POOL){
    const veteran=runFourCoop(3,GEARS.veteran,22,id);
    assert.ok(veteran.wave>=20,`${id}: a veteran trio reaches the late waves`);
  }
  const rookie=runFourCoop(3,GEARS.rookie,26,SQUAD_MAP_POOL[1]);
  assert.ok(rookie.wave<26,'a rookie trio does not survive the squad bill forever');
});

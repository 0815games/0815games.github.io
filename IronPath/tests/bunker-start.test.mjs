import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createSoloDeployment,bunkerStart} from '../solo-deployment.mjs';
import {createPlayer,advanceSector} from '../match.mjs';
import {getMap,createRandomMapId} from '../maps.mjs';

// The report: "the soldier does not always start at the bunker in every mode."
// The start position used to be a hard-coded (850,450) that only matched the
// classic maps (bunker at 900,400). Generated free-play maps put their bunker
// anywhere, so the hero deployed mid-field, up to 760px from the bunker - and
// only looked correct again after a retreat, which snaps players to the bunker
// of the new sector.

function soldier(){return createPlayer('local',{name:'Alice',gender:'female',level:3});}

test('bunkerStart is the map bunker with the retreat offset, clamped to the field',()=>{
  // A generated map whose bunker sits at (750,330): the classic hard-coded
  // start (850,450) was 156px away; the bunker start stands beside it.
  const map=getMap('g3-01cf92ba1');
  assert.ok(map.bunker,'the probe map is generated and carries a bunker');
  assert.deepEqual(bunkerStart('g3-01cf92ba1'),{x:map.bunker.x-90,y:map.bunker.y+60});
  // Classic maps have no bunker property: the (900,400) default applies, which
  // is 71px from the old fixed start - nobody jumps.
  assert.deepEqual(bunkerStart('road'),{x:810,y:460});
  // A bunker near the left edge clamps at 90, a low bunker clamps above the
  // field bottom, and the height default (540) covers classic maps.
  const corner=getMap('g3-06dc2088d');
  assert.equal(corner.bunker.x,150);
  assert.deepEqual(bunkerStart('g3-06dc2088d'),{x:90,y:corner.bunker.y+60});
  // A second soldier (co-op join) stands 50px further left, mirroring the old
  // 800/850 pair on the classic maps.
  assert.equal(bunkerStart('g3-01cf92ba1',1).x,bunkerStart('g3-01cf92ba1',0).x-50);
  assert.equal(bunkerStart('g3-01cf92ba1',1).y,bunkerStart('g3-01cf92ba1',0).y);
});

test('a solo deployment without a stage marker starts at the bunker of its map',()=>{
  for(const mapId of ['g3-01cf92ba1','g3-06dc2088d','road']){
    const state=createSoloDeployment({player:soldier(),mapId,profile:null,workshopEnabled:false});
    const start=bunkerStart(mapId);
    assert.equal(state.players.local.x,start.x,mapId);
    assert.equal(state.players.local.y,start.y,mapId);
  }
});

test('a story mission still starts at its first stage marker',()=>{
  const state=createSoloDeployment({player:soldier(),mapId:'g3-01cf92ba1',profile:null,workshopEnabled:false,campaign:{id:'lost-signal',threat:'standard',spawn:{x:120,y:80}}});
  assert.equal(state.players.local.x,120);
  assert.equal(state.players.local.y,80);
  // A mission whose first stage carries no coordinates falls back to the
  // bunker instead of the old fixed point.
  const unmarked=createSoloDeployment({player:soldier(),mapId:'g3-01cf92ba1',profile:null,workshopEnabled:false,campaign:{id:'x',threat:'standard',spawn:{}}});
  assert.equal(unmarked.players.local.x,bunkerStart('g3-01cf92ba1').x);
});

test('the retreat lands on the same spot as a fresh deployment',()=>{
  const state=createSoloDeployment({player:soldier(),mapId:'g3-01cf92ba1',profile:null,workshopEnabled:false});
  state.pendingSector=1; // arm the retreat
  const next=advanceSector(state,()=>createRandomMapId(null));
  assert.ok(next,'the run retreats');
  const start=bunkerStart(state.mapId);
  assert.equal(state.players.local.x,start.x,'the soldier stands where a new run would start');
  assert.equal(state.players.local.y,start.y);
});

test('both co-op joins build their soldiers through bunkerStart, four-player keeps its lane geometry',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  const joins=source.match(/bunkerStart\(gameControl\.getMapId\(\),i\)/g)||[];
  assert.equal(joins.length,2,'the digit panel and the unified lobby both place their pair at the bunker');
  assert.doesNotMatch(source,/i\?800:850/,'the hard-coded classic-map pair is gone');
  // Four-player keeps its own start column (1220) - its lanes are projected
  // separately by projectFourGameView and are not bunker-based.
  assert.match(source,/1220,270\+i\*60/);
});

test('game.js routes every solo deployment through createSoloDeployment',()=>{
  const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  assert.match(source,/state=createSoloDeployment\(\{player:createPlayer\('local'/,'the solo player is built without a hard-coded position, so the deployment places it');
  assert.doesNotMatch(source,/createPlayer\('local',[^)]*,\s*\d{3}\s*,\s*\d{3}\)/,'no fixed coordinates on the hero');
});

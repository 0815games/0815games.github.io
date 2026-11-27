import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {loadBundle} from './helpers/load-bundle.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function setup() {
  const {window, dom} = loadBundle(join(root, 'app.js'));
  const {Game, UI, WorldGen} = window;
  Game.state = {view:'map', inDialog:false, isGameOver:false, dungeonLevel:0,
    hp:40, maxHp:100, rads:0, radRest:0, perks:{}, equip:{}, stats:{},
    player:{x:5,y:5}, sector:{x:0,y:0}, inventory:[],
    currentMap:Array.from({length:50},()=>Array(50).fill('.'))};
  UI.log=()=>{}; UI.update=()=>{}; Game.saveGame=()=>{};
  return {window, Game, UI, WorldGen, dom};
}

test('Wasserstellen entstehen gelegentlich, deterministisch und ohne Orte zu ersetzen', () => {
  const {WorldGen, dom} = setup();
  WorldGen.setSeed(12345678);
  let brunnen=0, pfuetzen=0;
  for(let sy=0; sy<10; sy++) for(let sx=0; sx<10; sx++) {
    const m=Array.from({length:50},()=>Array(50).fill('.')); m[21][25]='V';
    const copy=JSON.parse(JSON.stringify(m));
    WorldGen.placeWaterSources(m,sx,sy); WorldGen.placeWaterSources(copy,sx,sy);
    assert.equal(JSON.stringify(m),JSON.stringify(copy));
    assert.equal(m[21][25], 'V');
    const wasser=m.flat().filter(x=>x==='b'||x==='p');
    assert.ok(wasser.length<=1);
    if(wasser[0]==='b') brunnen++; if(wasser[0]==='p') pfuetzen++;
    WorldGen.placeWaterSources(m,sx,sy);
    assert.equal(m.flat().filter(x=>x==='b'||x==='p').length,wasser.length);
  }
  assert.ok(brunnen>5 && pfuetzen>5 && brunnen+pfuetzen<90, `${brunnen} Brunnen, ${pfuetzen} Pfützen`);
  dom.window.close();
});

test('Trinken ist freiwillig und verbraucht bei jedem Schluck RAD', () => {
  const {Game, UI, dom} = setup(); let gefragt=0; UI.showWaterSource=()=>gefragt++;
  Game.state.currentMap[5][6]='b';
  Game.move(1,0);
  assert.equal(gefragt,1); assert.equal(Game.state.player.x,5); assert.equal(Game.state.rads,0);
  assert.equal(Game.trinkWasser('b'), true);
  assert.equal(Game.state.hp,60); assert.equal(Game.state.rads,5);
  assert.equal(Game.trinkWasser('b'), true);
  assert.equal(Game.state.hp,80); assert.equal(Game.state.rads,10);
  assert.equal(Game.trinkWasser('p'), true);
  assert.equal(Game.state.hp,80); assert.equal(Game.state.rads,20);
  dom.window.close();
});

test('Tutorial erklärt Trinkaktion und Strahlung ohne neue Pflichtsuche', () => {
  const src=readFileSync(join(root,'src/ui/ui_tutorial.js'),'utf8');
  assert.match(src,/Brunnen und Pfützen/); assert.match(src,/jedem Schluck RAD/);
});

test('Wasserstellen werden in erzeugte und vorhandene Sektoren eingefügt', () => {
  const {Game, WorldGen, dom} = setup();
  WorldGen.setSeed(12345678);
  Game.state.worldSeed=12345678; Game.state.visitedSectors=[];
  Game.state.explored={}; Game.state.discoveredPOIs={}; Game.state.player={x:25,y:25};
  Game.renderStaticMap=()=>{}; Game.reveal=()=>{};
  Game.baueRadWolken=()=>{};
  const flat = Array.from({length:50},()=>Array(50).fill('.'));
  let koord;
  for(let y=0;y<10 && !koord;y++) for(let x=0;x<10 && !koord;x++) {
    const probe=flat.map(row=>row.slice()); WorldGen.placeWaterSources(probe,x,y);
    if(probe.flat().some(t=>t==='b'||t==='p')) koord={x,y};
  }
  assert.ok(koord);
  const key=`${koord.x},${koord.y}`;
  Game.worldData = {[key]: {layout:flat,biome:'wasteland'}};
  Game.state.sector=koord;
  Game.loadSector(koord.x,koord.y);
  const nachher=JSON.stringify(Game.state.currentMap);
  assert.match(nachher, /"[bp]"/);
  Game.loadSector(koord.x,koord.y);
  assert.equal(JSON.stringify(Game.state.currentMap),nachher);
  dom.window.close();
});

test('Wasserstellen erscheinen auch in echten prozedural erzeugten Karten', () => {
  const {WorldGen, dom} = setup();
  let vorhanden=0;
  for(let sy=0;sy<4;sy++) for(let sx=0;sx<5;sx++) {
    WorldGen.setSeed(12345678);
    const map=WorldGen.createSector(50,50,sx,sy);
    const vor=map.map(row=>row.slice());
    WorldGen.placeWaterSources(map,sx,sy);
    for(let y=0;y<50;y++) for(let x=0;x<50;x++) if(map[y][x]!==vor[y][x]) {
      assert.ok(['b','p'].includes(map[y][x]));
      assert.ok(['.',',','_',';','"'].includes(vor[y][x]));
      vorhanden++;
    }
  }
  assert.ok(vorhanden>0); dom.window.close();
});

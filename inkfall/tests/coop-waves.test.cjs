'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createEngine } = require('../game/js/coop-waves.js');

const config = () => ({
  ground: [[0,0],[10,0]],
  air: [[0,10],[10,10]],
  enemies: {
    crawler: { hp:60, s:1, dmg:5, route:'ground' },
    runner: { hp:30, s:2, dmg:5, route:'ground' },
    flyer: { hp:40, s:2, dmg:5, route:'air' }
  },
  waves: [
    [['crawler',2]],
    [['runner',1],['flyer',1]]
  ]
});

const session = () => ({
  schemaVersion:1,
  id:'session-1',
  hostUid:'h'
});

const start = (engine, state, id='first') =>
  engine.startWave(state, 'h', {
    id,
    expectedWave: state.wave + 1
  });

function finish(engine, state) {
  for (let i=0; i<1000 && state.phase==='running'; i++) {
    state = engine.step(state, 0.1);
  }
  assert.notEqual(state.phase, 'running');
  return state;
}

let passed=0;
let failed=0;

function test(name, callback) {
  try {
    callback();
    passed++;
    console.log('OK   ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name);
    console.error(error.stack || error);
  }
}

test('Gemeinsamer Zustand startet ohne Gegner', () => {
  const engine=createEngine(config());
  const state=engine.create(session());
  assert.equal(state.wave,0);
  assert.equal(state.baseLives,100);
  assert.equal(engine.project(state).remaining,0);
});

test('Nur Host darf eine Welle starten', () => {
  const engine=createEngine(config());
  assert.throws(() => engine.startWave(
    engine.create(session()), 'g',
    {id:'first',expectedWave:1}
  ), /Host/);
});

test('Start plant Gegner mit eindeutigen IDs', () => {
  const engine=createEngine(config());
  const state=start(engine,engine.create(session()));
  assert.equal(state.wave,1);
  assert.equal(state.phase,'running');
  assert.equal(new Set(Object.keys(state.pending)).size,2);
  assert.equal(engine.project(state).remaining,2);
});

test('Derselbe Start wird nicht doppelt ausgeführt', () => {
  const engine=createEngine(config());
  const state=start(engine,engine.create(session()));
  assert.equal(engine.startWave(
    state,'h',{id:'first',expectedWave:1}
  ),state);
});

test('Zweiter Start während der Welle wird abgewiesen', () => {
  const engine=createEngine(config());
  const state=start(engine,engine.create(session()));
  assert.throws(() => engine.startWave(
    state,'h',{id:'second',expectedWave:2}
  ));
});

test('Veraltete Wellennummer wird abgewiesen', () => {
  const engine=createEngine(config());
  const state=finish(engine,start(engine,engine.create(session())));
  assert.throws(() => engine.startWave(
    state,'h',{id:'old',expectedWave:1}
  ), /Veralteter/);
});

test('Spawnzeitpunkt wird im Bewegungsschritt berücksichtigt', () => {
  const data=config();
  data.spawnIntervals={default:0.05};
  const engine=createEngine(data);
  const state=engine.step(
    start(engine,engine.create(session())),0.1
  );
  const enemies=engine.project(state).enemies;
  assert.equal(enemies.length,2);
  assert.equal(enemies[0].x,4);
  assert.equal(enemies[1].x,2);
});

test('Durchgelaufene Gegner schädigen die Basis nur einmal', () => {
  const engine=createEngine(config());
  const state=finish(engine,start(engine,engine.create(session())));
  assert.equal(state.baseLives,90);
  assert.equal(state.phase,'preparation');
  assert.equal(engine.step(state,0.1),state);
});

test('Luftroute wird getrennt dargestellt', () => {
  const engine=createEngine(config());
  let state=finish(engine,start(engine,engine.create(session())));
  state=start(engine,state,'second');
  for(let i=0;i<6;i++)state=engine.step(state,0.1);
  const flyer=engine.project(state).enemies.find(
    enemy=>enemy.type==='flyer'
  );
  assert.ok(flyer);
  assert.equal(flyer.y,10);
});

test('Letzte Welle endet mit gemeinsamem Sieg', () => {
  const engine=createEngine(config());
  let state=finish(engine,start(engine,engine.create(session())));
  state=finish(engine,start(engine,state,'second'));
  assert.equal(state.phase,'won');
  assert.equal(state.baseLives,80);
});

test('Bastionsleben werden nicht negativ', () => {
  const data=config();
  data.enemies.crawler.dmg=150;
  const engine=createEngine(data);
  const state=finish(engine,start(engine,engine.create(session())));
  assert.equal(state.phase,'lost');
  assert.equal(state.baseLives,0);
  assert.equal(engine.project(state).remaining,0);
});

test('Pause hält Wellentimer und Gegner an', () => {
  const engine=createEngine(config());
  let state=engine.step(
    start(engine,engine.create(session())),0.1
  );
  state=engine.pause(state,'h');
  assert.equal(engine.step(state,0.1),state);
  assert.equal(state.elapsed,0.1);
});

test('Fortsetzung braucht den Host', () => {
  const engine=createEngine(config());
  const state=engine.pause(
    start(engine,engine.create(session())),'h'
  );
  assert.throws(()=>engine.resume(state,'g'),/Host/);
  assert.equal(engine.resume(state,'h').phase,'running');
});

test('Ungültige Zeitschritte werden abgewiesen', () => {
  const engine=createEngine(config());
  const state=start(engine,engine.create(session()));
  for(const dt of [NaN,Infinity,-1,1]){
    assert.throws(()=>engine.step(state,dt));
  }
});

test('Zustand und Konfiguration werden nicht verändert', () => {
  const data=config();
  const before=JSON.stringify(data);
  const engine=createEngine(data);
  const state=engine.create(session());
  const original=JSON.stringify(state);
  engine.step(start(engine,state),0.1);
  assert.equal(JSON.stringify(data),before);
  assert.equal(JSON.stringify(state),original);
});

test('Gegnerliste ist eine abgetrennte Ansicht', () => {
  const engine=createEngine(config());
  const state=engine.step(
    start(engine,engine.create(session())),0.1
  );
  const view=engine.project(state);
  view.enemies[0].d=999;
  assert.notEqual(Object.values(state.enemies)[0].d,999);
});

test('Leere Wellen und unbekannte Gegner werden abgewiesen', () => {
  const data=config();
  data.waves=[[]];
  assert.throws(()=>createEngine(data));
  data.waves=[[['unbekannt',1]]];
  assert.throws(()=>createEngine(data));
});

test('Vorhandene Spieldefinitionen sind verwendbar', () => {
  const html=fs.readFileSync(
    path.join(__dirname,'../index.html'),'utf8'
  );

  function value(pattern){
    const match=html.match(pattern);
    assert.ok(match,'Datenadapter muss aktualisiert werden.');
    return vm.runInNewContext(
      '('+match[1]+')',{}, {timeout:1000}
    );
  }

  const real={
    waves:value(/const waves=([\s\S]*?);\s*window\.inkfallCoopWaveConfig/),
    enemies:value(/const E=([\s\S]*?);\s*const waves/),
    ground:value(/const ground=([^;]+);/),
    air:value(/const air=([^;]+);/)
  };

  const engine=createEngine(real);
  const state=start(engine,engine.create(session()));
  assert.equal(engine.project(state).remaining,5);
});

test('Wellenabschluss vergibt gemeinsame Belohnungen', () => {
  const engine=createEngine(config());
  const state=finish(engine,start(engine,engine.create(session())));
  assert.equal(state.phase,'preparation');
  assert.equal(state.skillPoints,1);
  assert.equal(state.gold,160);
});

test('Auch der Sieg vergibt die Wellen-Belohnung', () => {
  const engine=createEngine(config());
  let state=finish(engine,start(engine,engine.create(session())));
  state=finish(engine,start(engine,state,'second'));
  assert.equal(state.phase,'won');
  assert.equal(state.skillPoints,2);
  assert.equal(state.gold,170);
});

console.log(
  '\nErgebnis C2a-Kern: '+passed+
  ' bestanden, '+failed+' fehlgeschlagen.'
);
process.exitCode=failed?1:0;

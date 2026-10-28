'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(
  path.join(__dirname, '../src/index.html'),
  'utf8'
);

const scripts = [...html.matchAll(
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi
)].map(match => match[1]);

const candidates = scripts.filter(source =>
  source.includes("const cv=document.getElementById('cv')") &&
  source.includes('function startWave()') &&
  source.includes('function update(dt)')
);

assert.equal(
  candidates.length, 1,
  'Der Inline-Spielkern muss eindeutig gefunden werden.'
);

const startup = /ui\(\);draw\(\);requestAnimationFrame\(loop\);void 0;\s*$/;

assert.match(
  candidates[0], startup,
  'Startsequenz geändert: Testadapter bewusst aktualisieren.'
);

// Nur den automatischen Grafik-/Animationsstart entfernen.
const source = candidates[0].replace(startup, '');

function createGame() {
  const nodes = new Map();
  const canvas = {
    width: 940,
    height: 600,
    getContext: () => ({}),
    getBoundingClientRect: () => ({
      left: 0, top: 0, width: 940, height: 600
    })
  };

  function node(id) {
    if (id === 'cv') return canvas;
    if (!nodes.has(id)) {
      nodes.set(id, {
        textContent: '',
        innerHTML: '',
        disabled: false,
        classList: { add() {}, remove() {} }
      });
    }
    return nodes.get(id);
  }

  const sandbox = vm.createContext({
    console,
    document: { getElementById: node },
    Image: class {},
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    window: {},
    InkfallImpactFX: { impact() {} }
  });

  vm.runInContext(source, sandbox, {
    filename: 'index-inline-game.js',
    timeout: 1000
  });

  return {
    run(code) {
      return vm.runInContext(code, sandbox, { timeout: 1000 });
    },
    read(expression) {
      return JSON.parse(vm.runInContext(
        `JSON.stringify(${expression})`,
        sandbox,
        { timeout: 1000 }
      ));
    }
  };
}

let passed = 0;
let failed = 0;

function test(name, callback) {
  try {
    callback(createGame());
    passed++;
    console.log(`OK   ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
  }
}

test('Startwerte sind korrekt', game => {
  assert.deepEqual(
    game.read('({gold,lives,wave,active,skillPoints})'),
    { gold:150, lives:100, wave:0, active:false, skillPoints:0 }
  );
});

test('Wellenstart verwirft ein altes Bewegungsziel', game => {
  game.run('hero.target={x:600,y:300}; startWave();');
  assert.equal(game.read('hero.target'), null);
  assert.equal(game.read('wave'), 1);
  assert.equal(game.read('active'), true);
  assert.equal(game.read('queue.length'), 5);
});

test('Wellenstart bewegt den Helden nicht automatisch', game => {
  game.run('hero.target={x:600,y:300}; startWave(); update(0.01);');
  assert.deepEqual(game.read('({x:hero.x,y:hero.y})'), {
    x:120, y:300
  });
});

test('Kartenklick vor einer Welle erzeugt keinen Laufauftrag', game => {
  game.run('cv.onclick({clientX:300,clientY:300});');
  assert.equal(game.read('hero.target'), null);
});

test('Kartenklick während der Welle bewegt den Helden', game => {
  game.run(
    'startWave(); cv.onclick({clientX:300,clientY:300}); update(0.1);'
  );
  assert.equal(game.read('hero.x'), 135);
  assert.equal(game.read('hero.y'), 300);
});

test('Held erreicht sein Ziel ohne Überschwingen', game => {
  game.run(
    'startWave(); hero.target={x:125,y:300}; update(0.1);'
  );
  assert.equal(game.read('hero.x'), 125);
  assert.equal(game.read('hero.target'), null);
});

test('Pause stoppt Bewegung und Wellentimer', game => {
  game.run(
    'startWave(); hero.target={x:300,y:300}; speed=0; update(0.1);'
  );
  assert.equal(game.read('hero.x'), 120);
  assert.equal(game.read('timer'), 0);
});

test('Ungültiger Zeitschritt verändert keine Bewegung', game => {
  game.run(
    'startWave(); hero.target={x:300,y:300}; update(NaN);'
  );
  assert.equal(game.read('hero.x'), 120);
  assert.equal(game.read('timer'), 0);
});

test('Doppelter Wellenstart startet keine zweite Welle', game => {
  game.run('startWave(); startWave();');
  assert.equal(game.read('wave'), 1);
  assert.equal(game.read('queue.length'), 5);
});

test('Nach Niederlage lässt sich keine Welle starten', game => {
  game.run('lives=0; startWave();');
  assert.equal(game.read('wave'), 0);
  assert.equal(game.read('active'), false);
});

test('Fähigkeit ist außerhalb der Welle gesperrt', game => {
  game.run('useAbility();');
  assert.equal(game.read('hero.cd'), 0);
});

test('Fähigkeit ist während Pause gesperrt', game => {
  game.run('startWave(); speed=0; useAbility();');
  assert.equal(game.read('hero.cd'), 0);
});

test('Fähigkeit startet Cooldown und kann nicht sofort erneut wirken', game => {
  game.run('startWave(); useAbility();');
  assert.equal(game.read('hero.cd'), 10);
  game.run('hero.cd=5; useAbility();');
  assert.equal(game.read('hero.cd'), 5);
});

test('Bauen zieht Gold genau einmal ab', game => {
  game.run(
    "build('arrow'); cv.onclick({clientX:120,clientY:300});"
  );
  assert.equal(game.read('gold'), 50);
  assert.equal(game.read('towers.length'), 1);
  assert.equal(game.read('buildType'), null);
  assert.equal(game.read('hero.target'), null);
});

test('Zu wenig Gold verhindert die Bauauswahl', game => {
  game.run("gold=20; build('arrow');");
  assert.equal(game.read('gold'), 20);
  assert.equal(game.read('buildType'), null);
  assert.equal(game.read('towers.length'), 0);
});

test('Wellenabschluss vergibt Skillpunkt nur einmal', game => {
  game.run(
    'wave=1; active=true; queue=[]; enemies=[]; update(0.01);'
  );
  assert.equal(game.read('active'), false);
  assert.equal(game.read('skillPoints'), 1);
  game.run('update(0.01);');
  assert.equal(game.read('skillPoints'), 1);
});

console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen.`);
process.exitCode = failed ? 1 : 0;

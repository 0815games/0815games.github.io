
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = path.join(__dirname, '../game/js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const firebaseSource = fs.readFileSync(
  path.join(src, 'firebase.js'), 'utf8'
);

assert.ok(
  firebaseSource.includes('function heroNameState('),
  'Die zentrale Namenslogik fehlt in firebase.js.'
);

const candidates = [...html.matchAll(
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi
)].map(match => match[1]).filter(code =>
  code.includes("const cv=document.getElementById('cv')") &&
  code.includes('function startWave()')
);

assert.equal(candidates.length, 1, 'Spielkern nicht eindeutig.');

const startup = /ui\(\);draw\(\);requestAnimationFrame\(loop\);void 0;\s*$/;
assert.match(candidates[0], startup, 'Startadapter muss angepasst werden.');
const core = candidates[0].replace(startup, '');

const bootstrapEnd = firebaseSource.indexOf('let currentUser = null;');
assert.ok(bootstrapEnd >= 0, 'Firebase-Testadapter muss angepasst werden.');

const storage = (
  'const auth=__auth; const db=__db;\n' +
  firebaseSource.slice(bootstrapEnd)
);

const clone = value =>
  value === undefined ? null : JSON.parse(JSON.stringify(value));

async function createGame() {
  const store = {
    users: {
      'test-user': {
        schemaVersion: 2,
        selectedClass: 'knight',
        profile: { displayName:'Testspieler', level:1 },
        characters: {
          knight: {
            heroName:'Ritter',
            heroNameLocked:false,
            level:3,
            xp:80,
            skillPoints:2,
            soloRun:{
              heroClass:'knight',
              gold:230,
              lives:90,
              wave:2,
              heroX:120,
              heroY:300
            }
          }
        }
      }
    }
  };

  const writes = [];
  let denyWrites = false;
  let listeners = 0;

  const parts = location => location.split('/').filter(Boolean);

  function read(location) {
    let value = store;
    for (const key of parts(location)) {
      value = value?.[key];
    }
    return clone(value);
  }

  function write(location, value) {
    const keys = parts(location);
    const last = keys.pop();
    let parent = store;
    for (const key of keys) parent = parent[key] ||= {};
    if (value === null) delete parent[last];
    else parent[last] = clone(value);
  }

  function authorize() {
    if (!denyWrites) return;
    const error = new Error('PERMISSION_DENIED');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  function reference(location) {
    const snapshot = () => {
      const value = read(location);
      return {
        val: () => clone(value),
        exists: () => value !== null
      };
    };

    return {
      get: async () => snapshot(),
      on(type, callback) {
        listeners++;
        callback(snapshot());
      },
      off() {
        listeners--;
      },
      child(key) {
        return reference(location + '/' + key);
      },
      async set(value) {
        authorize();
        writes.push(location);
        write(location, value);
      },
      async update(updates) {
        authorize();
        for (const [key, value] of Object.entries(updates)) {
          const destination = location + '/' + key;
          writes.push(destination);
          write(destination, value);
        }
      },
      async transaction(callback) {
        authorize();
        const next = callback(read(location));
        if (next === undefined) {
          return { committed:false, snapshot:snapshot() };
        }
        writes.push(location);
        write(location, next);
        return { committed:true, snapshot:snapshot() };
      }
    };
  }

  const nodes = new Map();
  const canvas = {
    width:940,
    height:600,
    getContext: () => ({}),
    getBoundingClientRect: () => ({
      left:0, top:0, width:940, height:600
    })
  };

  function getNode(id) {
    if (id === 'cv') return canvas;
    if (!nodes.has(id)) {
      const children = [];
      nodes.set(id, {
        textContent:'',
        innerHTML:'',
        disabled:false,
        style:{},
        children,
        prepend(item) { children.unshift(item); },
        classList:{ add() {}, remove() {} }
      });
    }
    return nodes.get(id);
  }

  const environment = {
    console,
    __auth: {
      currentUser: { uid:'test-user', displayName:'Testspieler' },
      onAuthStateChanged() {}
    },
    __db: { ref:reference },
    firebase: {
      database: { ServerValue:{ TIMESTAMP:123456 } }
    },
    document: {
      getElementById:getNode,
      createElement: () => ({
        textContent:'',
        remove() {}
      })
    },
    Image:class {},
    performance:{ now:() => 0 },
    requestAnimationFrame() {},
    InkfallImpactFX:{ impact() {} },
    setTimeout
  };
  // INKFALL_TEST_WINDOW_EVENTS
  const windowEvents = new EventTarget();
  environment.addEventListener =
    windowEvents.addEventListener.bind(windowEvents);
  environment.removeEventListener =
    windowEvents.removeEventListener.bind(windowEvents);
  environment.dispatchEvent =
    windowEvents.dispatchEvent.bind(windowEvents);

  environment.window = environment;

  const context = vm.createContext(environment);

  function run(code) {
    return vm.runInContext(code, context, { timeout:1000 });
  }

  run(core);
  run(storage);
  await run('loadGame()');

  // Der dauerhafte Verbindungslistener gehört nicht zur Namens-Transaktion.
  const initialListeners = listeners;

  return {
    run,
    read(expression) {
      return JSON.parse(run(`JSON.stringify(${expression})`));
    },
    stored() {
      return read('users/test-user/characters/knight');
    },
    writes,
    deny(value) { denyWrites = value; },
    extraListeners() { return listeners - initialListeners; }
  };
}

let passed = 0;
let failed = 0;

async function test(name, callback) {
  try {
    await callback(await createGame());
    passed++;
    console.log('OK   ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name);
    console.error(error.stack || error);
  }
}

(async () => {
  await test('Charakter wird mit seinem Fortschritt geladen', async game => {
    assert.equal(game.read('gold'), 230);
    assert.equal(game.read('lives'), 90);
    assert.equal(game.read('wave'), 2);
    assert.equal(game.read('skillPoints'), 2);
    assert.equal(game.read('hero.name'), 'Ritter');
  });

  await test('Erste Namensvergabe speichert Name und Sperre', async game => {
    await game.run("setHeroName('knight','Thorin')");
    const saved = game.stored();
    assert.equal(saved.heroName, 'Thorin');
    assert.equal(saved.heroNameLocked, true);
    assert.equal(game.read('hero.name'), 'Thorin');
    assert.equal(
      game.read("heroNameState(currentProfile.characters.knight,'knight').assigned"),
      true
    );
  });

  await test('Namensvergabe erhält Level, XP und Solo-Fortschritt', async game => {
    await game.run("setHeroName('knight','Thorin')");
    const saved = game.stored();
    assert.equal(saved.level, 3);
    assert.equal(saved.xp, 80);
    assert.equal(saved.skillPoints, 2);
    assert.equal(saved.soloRun.gold, 230);
    assert.equal(saved.soloRun.wave, 2);
  });

  await test('Ein anderer Name wird nach Vergabe abgewiesen', async game => {
    await game.run("setHeroName('knight','Thorin')");
    await assert.rejects(
      game.run("setHeroName('knight','Anderer')"),
      /bereits vergeben/i
    );
    assert.equal(game.stored().heroName, 'Thorin');
  });

  await test('Wiederholung desselben Namens ist unschädlich', async game => {
    await game.run("setHeroName('knight','Thorin')");
    await game.run("setHeroName('knight','Thorin')");
    assert.equal(game.stored().heroName, 'Thorin');
    assert.equal(game.stored().heroNameLocked, true);
  });

  await test('Älterer eigener Name wird auch ohne Sperrfeld erkannt', async game => {
    assert.equal(
      game.read("heroNameState({heroName:'Alter Held'},'knight').assigned"),
      true
    );
    assert.equal(
      game.read("heroNameState({heroName:'Alter Held',heroNameLocked:false},'knight').assigned"),
      true
    );
  });

  await test('Standardname gilt nicht als persönliche Namensvergabe', async game => {
    assert.equal(
      game.read("heroNameState({heroName:'Ritter',heroNameLocked:false},'knight').assigned"),
      false
    );
  });

  await test('Normales Speichern schreibt keine Namensfelder', async game => {
    await game.run("setHeroName('knight','Thorin')");
    game.writes.length = 0;
    game.run("window.inkfallMode='single'");
    assert.equal(await game.run('saveGame()'), true);
    assert.equal(
      game.writes.some(location => /\/heroName(?:Locked)?$/.test(location)),
      false
    );
    assert.equal(game.stored().heroName, 'Thorin');
    assert.equal(game.stored().heroNameLocked, true);
  });

  await test('Abgelehnte Speicherung meldet Fehler ohne Namensänderung', async game => {
    game.deny(true);
    await assert.rejects(
      game.run("setHeroName('knight','Thorin')"),
      /Datenbankregeln|permission/i
    );
    assert.equal(game.stored().heroName, 'Ritter');
    assert.equal(game.read('hero.name'), 'Ritter');
    assert.equal(game.read('characterSaveBusy'), false);
    assert.equal(game.extraListeners(), 0);
  });

  await test('Zu kurzer Name wird nicht gespeichert', async game => {
    await assert.rejects(
      game.run("setHeroName('knight','XY')"),
      /3–20/
    );
    assert.equal(game.stored().heroName, 'Ritter');
  });

  await test('Namensvergabe während einer Welle ist gesperrt', async game => {
    game.run('active=true');
    await assert.rejects(
      game.run("setHeroName('knight','Thorin')"),
      /gesperrt/
    );
    assert.equal(game.stored().heroName, 'Ritter');
  });

  await test('Neuer Charakter hat vollständige Reset-Startwerte', async game => {
    const fresh = game.read("freshCharacter('knight')");
    assert.equal(fresh.level, 1);
    assert.equal(fresh.xp, 0);
    assert.equal(fresh.skillPoints, 0);
    assert.equal(fresh.heroNameLocked, false);
    assert.equal(fresh.soloRun.gold, 150);
    assert.equal(fresh.soloRun.lives, 100);
    assert.equal(fresh.soloRun.wave, 0);
    assert.equal(fresh.soloRun.heroX, 120);
    assert.equal(fresh.soloRun.heroY, 300);
  });

  console.log(
    `\nErgebnis A2: ${passed} bestanden, ${failed} fehlgeschlagen.`
  );
  process.exitCode = failed ? 1 : 0;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

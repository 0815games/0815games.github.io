'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '../src/coop-start.js');

if (!fs.existsSync(modulePath)) {
  console.error(
    'B2 noch nicht implementiert: inkfall/src/coop-start.js fehlt.\n' +
    'Dieser Test definiert die Anforderungen an das nächste Code-Paket.'
  );
  process.exit(1);
}

const { start } = require(modulePath);
assert.equal(typeof start, 'function', 'Das Modul muss start() exportieren.');

const clone = value =>
  value === undefined ? null : JSON.parse(JSON.stringify(value));

function room() {
  return {
    status: 'prepared',
    createdAt: 1000,
    host: {
      uid: 'host-1',
      name: 'Hostspieler',
      heroClass: 'knight',
      heroName: 'Thorin',
      ready: true,
      online: true
    },
    guest: {
      uid: 'guest-1',
      name: 'Gastspieler',
      heroClass: 'mage',
      heroName: 'Lyra',
      ready: true,
      online: true
    }
  };
}

function options(overrides = {}) {
  return {
    actorUid: 'host-1',
    roomCode: 'ABCDEFGH',
    sessionId: 'session-1',
    now: 123456,
    ...overrides
  };
}

// Simuliert nur Lesen und atomare Sitzungserstellung.
// Dies ist kein Emulator für Firebase Security Rules.
function fixture(initial = room()) {
  const data = clone(initial);
  let commits = 0;
  let denied = false;

  function snapshot(value) {
    const frozen = clone(value);
    return {
      exists: () => frozen !== null,
      val: () => clone(frozen)
    };
  }

  const sessionReference = {
    async get() {
      return snapshot(data.session);
    },
    async transaction(callback) {
      if (denied) {
        const error = new Error('PERMISSION_DENIED');
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      const next = callback(clone(data.session));

      if (next === undefined) {
        return {
          committed: false,
          snapshot: snapshot(data.session)
        };
      }

      data.session = clone(next);
      commits++;

      return {
        committed: true,
        snapshot: snapshot(data.session)
      };
    }
  };

  const reference = {
    async get() {
      return snapshot(data);
    },
    child(key) {
      assert.equal(
        key, 'session',
        'B2 darf ausschließlich den Sitzungsknoten schreiben.'
      );
      return sessionReference;
    }
  };

  return {
    reference,
    read: () => clone(data),
    commits: () => commits,
    denyWrites() { denied = true; }
  };
}

let passed = 0;
let failed = 0;

async function test(name, callback) {
  try {
    await callback();
    passed++;
    console.log('OK   ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name);
    console.error(error.stack || error);
  }
}

(async () => {
  await test('Bereiter Host erstellt eine gemeinsame Sitzung', async () => {
    const f = fixture();
    const result = await start(f.reference, options());

    assert.equal(result.created, true);
    assert.equal(result.session.id, 'session-1');
    assert.equal(result.session.roomCode, 'ABCDEFGH');
    assert.equal(result.session.hostUid, 'host-1');
    assert.equal(result.session.phase, 'preparation');
    assert.equal(result.session.players.host.heroName, 'Thorin');
    assert.equal(result.session.players.guest.heroName, 'Lyra');
    assert.equal(f.commits(), 1);
    assert.deepEqual(f.read().session, result.session);
  });

  await test('Gast darf keine Sitzung erstellen', async () => {
    const f = fixture();

    await assert.rejects(
      start(f.reference, options({ actorUid:'guest-1' }))
    );

    assert.equal(f.commits(), 0);
    assert.equal(f.read().session, undefined);
  });

  await test('Nicht bereiter Spieler verhindert den Start', async () => {
    const data = room();
    data.guest.ready = false;
    const f = fixture(data);

    await assert.rejects(start(f.reference, options()));
    assert.equal(f.commits(), 0);
  });

  await test('Getrennter Spieler verhindert den Start', async () => {
    const data = room();
    data.guest.online = false;
    const f = fixture(data);

    await assert.rejects(start(f.reference, options()));
    assert.equal(f.commits(), 0);
  });

  await test('Raum muss die Vorbereitung bestätigt haben', async () => {
    const data = room();
    data.status = 'waiting';
    const f = fixture(data);

    await assert.rejects(start(f.reference, options()));
    assert.equal(f.commits(), 0);
  });

  await test('Raumdaten und übergebene Optionen bleiben erhalten', async () => {
    const original = room();
    const before = clone(original);
    const settings = options();
    const settingsBefore = clone(settings);
    const f = fixture(original);

    await start(f.reference, settings);

    const after = f.read();
    delete after.session;

    assert.deepEqual(after, before);
    assert.deepEqual(original, before);
    assert.deepEqual(settings, settingsBefore);
  });

  await test('Gleichzeitiger Doppelstart erzeugt nur eine Sitzung', async () => {
    const f = fixture();

    const results = await Promise.all([
      start(f.reference, options({ sessionId:'attempt-1' })),
      start(f.reference, options({ sessionId:'attempt-2' }))
    ]);

    assert.equal(f.commits(), 1);
    assert.equal(
      results.filter(result => result.created === true).length,
      1
    );
    assert.equal(results[0].session.id, results[1].session.id);
    assert.equal(f.read().session.id, results[0].session.id);
  });

  await test('Erneuter Aufruf erhält die vorhandene Sitzung', async () => {
    const f = fixture();

    const first = await start(f.reference, options());
    const second = await start(
      f.reference,
      options({ sessionId:'nicht-neu-starten' })
    );

    assert.equal(second.created, false);
    assert.deepEqual(second.session, first.session);
    assert.equal(f.commits(), 1);
  });

  await test('Schreibfehler erzeugt keine scheinbar gestartete Sitzung', async () => {
    const f = fixture();
    f.denyWrites();

    await assert.rejects(start(f.reference, options()));

    assert.equal(f.commits(), 0);
    assert.equal(f.read().session, undefined);
  });

  await test('Fehlender zweiter Spieler verhindert den Start', async () => {
    const data = room();
    delete data.guest;
    const f = fixture(data);

    await assert.rejects(start(f.reference, options()));
    assert.equal(f.commits(), 0);
  });

  console.log(
    '\nErgebnis B2: ' + passed +
    ' bestanden, ' + failed + ' fehlgeschlagen.'
  );

  process.exitCode = failed ? 1 : 0;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

'use strict';

const assert = require('node:assert/strict');
const api = require('../game/js/coop-commands.js');

const clone = value =>
  value === undefined ? null : JSON.parse(JSON.stringify(value));

function session() {
  return {
    schemaVersion: 1,
    id: 'session-1',
    roomCode: 'ABCDEFGH',
    hostUid: 'h',
    phase: 'preparation',
    players: {
      host: { uid: 'h' },
      guest: { uid: 'g' }
    }
  };
}

function fixture() {
  const s = session();
  const room = {
    session: clone(s),
    host: { uid: 'h', online: true },
    guest: { uid: 'g', online: true }
  };
  const commands = {};
  const paths = [];

  let deny = false;
  let abort = false;
  let writes = 0;

  const ref = {
    get: async () => ({ val: () => clone(room) }),
    child(path) {
      paths.push(path);
      return {
        async transaction(callback) {
          if (deny) throw new Error('PERMISSION_DENIED');

          const next = callback(clone(commands[path]));

          if (abort) {
            return {
              committed: false,
              snapshot: { val: () => null }
            };
          }

          commands[path] = clone(next);
          writes++;

          return {
            committed: true,
            snapshot: { val: () => clone(next) }
          };
        }
      };
    }
  };

  return {
    s, room, commands, paths, ref,
    sender: uid => api.createSender(ref, s, uid),
    writes: () => writes,
    deny: value => { deny = value; },
    abort: value => { abort = value; }
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
  await test('Skalierter Klick wird in Kartenkoordinaten übersetzt', () => {
    assert.deepEqual(
      api.mapPoint(245, 170, {
        left: 10, top: 20, width: 470, height: 300
      }),
      { x: 470, y: 300 }
    );
  });

  await test('Klick außerhalb der Karte wird abgewiesen', () => {
    assert.throws(() => api.mapPoint(-1, 10, {
      left: 0, top: 0, width: 940, height: 600
    }));
  });

  await test('Zeichenfläche mit Größe null wird abgewiesen', () => {
    assert.throws(() => api.mapPoint(0, 0, {
      left: 0, top: 0, width: 0, height: 600
    }));
  });

  await test('Host schreibt nur in seinen Befehlsplatz', async () => {
    const f = fixture();
    const command = await f.sender('h').sendTarget(200, 300);

    assert.deepEqual(f.paths, ['moveCommands/host']);
    assert.equal(command.uid, 'h');
    assert.equal(command.seq, 1);
  });

  await test('Gast schreibt nur in seinen Befehlsplatz', async () => {
    const f = fixture();
    const command = await f.sender('g').sendTarget(200, 300);

    assert.deepEqual(f.paths, ['moveCommands/guest']);
    assert.equal(command.uid, 'g');
  });

  await test('Fremder Account erhält keinen Sender', () => {
    const f = fixture();
    assert.throws(() => f.sender('fremd'));
    assert.equal(f.writes(), 0);
  });

  await test('Parallele Klicks bekommen aufsteigende Sequenzen', async () => {
    const f = fixture();
    const sender = f.sender('h');

    const results = await Promise.all([
      sender.sendTarget(200, 300),
      sender.sendTarget(400, 300)
    ]);

    assert.deepEqual(results.map(command => command.seq), [1, 2]);
    assert.equal(f.commands['moveCommands/host'].x, 400);
  });

  await test('Zwei Sender teilen den atomaren Befehlszähler', async () => {
    const f = fixture();
    const a = f.sender('h');
    const b = f.sender('h');

    const results = await Promise.all([
      a.sendTarget(200, 300),
      b.sendTarget(400, 300)
    ]);

    assert.deepEqual(
      results.map(command => command.seq).sort(),
      [1, 2]
    );
  });

  await test('Ungültige Ziele erzeugen keine Schreibzugriffe', async () => {
    const f = fixture();
    const sender = f.sender('h');

    for (const x of [NaN, Infinity, -1, 941]) {
      await assert.rejects(sender.sendTarget(x, 300));
    }

    assert.equal(f.writes(), 0);
  });

  await test('Alte Sitzung darf keine Befehle senden', async () => {
    const f = fixture();
    const sender = f.sender('h');
    f.room.session.id = 'neue-sitzung';

    await assert.rejects(sender.sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Geänderte Raumbelegung wird erkannt', async () => {
    const f = fixture();
    const sender = f.sender('h');
    f.room.guest.uid = 'anderer';

    await assert.rejects(sender.sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Disconnect verhindert Befehle', async () => {
    const f = fixture();
    f.room.guest.online = false;

    await assert.rejects(f.sender('h').sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Pause verhindert Befehle', async () => {
    const f = fixture();
    f.room.movement = { paused: true };

    await assert.rejects(f.sender('h').sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Schreibfehler blockiert spätere Versuche nicht', async () => {
    const f = fixture();
    const sender = f.sender('h');

    f.deny(true);
    await assert.rejects(sender.sendTarget(200, 300));

    f.deny(false);
    const command = await sender.sendTarget(400, 300);

    assert.equal(command.seq, 1);
    assert.equal(f.writes(), 1);
  });

  await test('Abgebrochene Transaktion gilt nicht als Erfolg', async () => {
    const f = fixture();
    f.abort(true);

    await assert.rejects(f.sender('h').sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Befehl mit falschem Eigentümer wird nicht überschrieben', async () => {
    const f = fixture();
    f.commands['moveCommands/host'] = {
      sessionId: 'session-1',
      uid: 'g',
      seq: 1
    };

    await assert.rejects(f.sender('h').sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Überlaufender Befehlszähler wird abgewiesen', async () => {
    const f = fixture();
    f.commands['moveCommands/host'] = {
      sessionId: 'session-1',
      uid: 'h',
      seq: Number.MAX_SAFE_INTEGER
    };

    await assert.rejects(f.sender('h').sendTarget(200, 300));
    assert.equal(f.writes(), 0);
  });

  await test('Sitzungs- und Raumdaten werden nicht verändert', async () => {
    const f = fixture();
    const before = JSON.stringify({ s: f.s, room: f.room });

    await f.sender('h').sendTarget(200, 300);

    assert.equal(
      JSON.stringify({ s: f.s, room: f.room }),
      before
    );
  });

  console.log(
    '\nErgebnis C1b.1: ' + passed +
    ' bestanden, ' + failed + ' fehlgeschlagen.'
  );
  process.exitCode = failed ? 1 : 0;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

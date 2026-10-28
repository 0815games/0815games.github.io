'use strict';

const assert = require('node:assert/strict');
const api = require('../src/coop-host.js');

const clone = value =>
  value === undefined ? null : JSON.parse(JSON.stringify(value));

function fixture() {
  const session = {
    schemaVersion:1,
    id:'session-1',
    hostUid:'h',
    phase:'preparation',
    players:{
      host:{ uid:'h', x:120, y:300 },
      guest:{ uid:'g', x:170, y:300 }
    }
  };

  const room = {
    session:clone(session),
    host:{ uid:'h', online:true },
    guest:{ uid:'g', online:true },
    moveCommands:{}
  };

  let timestamp = 1000;
  let deny = false;
  let readError = false;
  let writes = 0;
  let reads = 0;

  const ref = {
    async get() {
      reads++;
      if (readError) throw new Error('READ_FAILED');
      return { val:() => clone(room) };
    },
    child(key) {
      assert.equal(key, 'movement');

      return {
        async transaction(callback) {
          if (deny) throw new Error('PERMISSION_DENIED');

          const next = callback(clone(room.movement));

          if (next === undefined) {
            return {
              committed:false,
              snapshot:{ val:() => clone(room.movement) }
            };
          }

          room.movement = clone(next);
          writes++;

          return {
            committed:true,
            snapshot:{ val:() => clone(room.movement) }
          };
        }
      };
    }
  };

  return {
    room, session, ref,
    host:(id='tab-a', uid='h') => api.createHost(
      ref, session, uid,
      { writerId:id, now:() => timestamp }
    ),
    advance:dt => { timestamp += dt; },
    deny:value => { deny = value; },
    readError:value => { readError = value; },
    writes:() => writes,
    reads:() => reads
  };
}

const command = (slot, seq=1, x=500) => ({
  sessionId:'session-1',
  uid:slot === 'host' ? 'h' : 'g',
  seq, x, y:300
});

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
  await test('Gast kann keinen Host-Adapter erstellen', () => {
    const f = fixture();
    assert.throws(() => f.host('gast', 'g'), /Host/);
  });

  await test('Erster Tick initialisiert ohne Laufauftrag', async () => {
    const f = fixture();
    const result = await f.host().tick(0.1);
    assert.equal(result.reason, 'initialized');
    assert.equal(result.state.players.host.x, 120);
    assert.equal(result.state.players.host.target, null);
    assert.equal(result.state.players.guest.target, null);
  });

  await test('Host-Befehl wird gelesen und verarbeitet', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.moveCommands.host = command('host');
    await host.tick(0.1);
    assert.equal(f.room.movement.players.host.x, 135);
    assert.equal(f.room.movement.players.guest.x, 170);
  });

  await test('Gast-Befehl wird vom Host verarbeitet', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.moveCommands.guest = command('guest');
    await host.tick(0.1);
    assert.equal(f.room.movement.players.guest.x, 185);
  });

  await test('Geänderte Sitzung verhindert Schreiben', async () => {
    const f = fixture(), host = f.host();
    f.room.session.id = 'alt';
    await assert.rejects(host.tick(0.1));
    assert.equal(f.writes(), 0);
  });

  await test('Fremder Befehl bewegt niemanden', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.moveCommands.host = command('guest');
    const result = await host.tick(0.1);
    assert.equal(result.committed, false);
    assert.equal(f.room.movement.players.host.x, 120);
  });

  await test('Verarbeiteter Befehl wird nicht erneut gestartet', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.moveCommands.host = command('host', 1, 125);
    await host.tick(0.1);
    const count = f.writes();
    await host.tick(0.1);
    assert.equal(f.writes(), count);
  });

  await test('Disconnect setzt Pause und löscht Ziele', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.moveCommands.host = command('host');
    await host.tick(0.1);
    f.room.guest.online = false;
    await host.tick(0.1);
    assert.equal(f.room.movement.paused, true);
    assert.equal(f.room.movement.players.host.target, null);
  });

  await test('Reconnect startet nicht automatisch', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.guest.online = false;
    await host.tick(0.1);
    f.room.guest.online = true;
    await host.tick(0.1);
    assert.equal(f.room.movement.paused, true);
  });

  await test('Fortsetzung braucht beide Spieler online', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.guest.online = false;
    await host.tick(0.1);
    await assert.rejects(host.resume());
  });

  await test('Fortsetzung verwirft wartende Befehle', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    f.room.guest.online = false;
    await host.tick(0.1);
    f.room.guest.online = true;
    f.room.moveCommands.host = command('host', 1, 500);
    await host.resume();
    await host.tick(0.1);
    assert.equal(f.room.movement.paused, false);
    assert.equal(f.room.movement.players.host.x, 120);
    assert.equal(f.room.movement.players.host.ack, 1);
  });

  await test('Zweiter Host-Tab darf nicht gleichzeitig schreiben', async () => {
    const f = fixture();
    await f.host('a').tick(0.1);
    const count = f.writes();
    const result = await f.host('b').tick(0.1);
    assert.equal(result.reason, 'lease-owned');
    assert.equal(f.writes(), count);
  });

  await test('Übernahme nach Lease-Ablauf bleibt pausiert', async () => {
    const f = fixture();
    await f.host('a').tick(0.1);
    f.advance(api.LEASE_MS + 1);
    const result = await f.host('b').tick(0.1);
    assert.equal(result.reason, 'takeover-paused');
    assert.equal(result.state.paused, true);
    assert.equal(result.state.lease.writerId, 'b');
  });

  await test('Leerlauf schreibt nur bei nötiger Lease-Erneuerung', async () => {
    const f = fixture(), host = f.host();
    await host.tick(0.1);
    await host.tick(0.1);
    assert.equal(f.writes(), 1);
    f.advance(3000);
    const result = await host.tick(0.1);
    assert.equal(result.reason, 'lease-renewed');
    assert.equal(f.writes(), 2);
  });

  await test('Schreibfehler blockiert spätere Versuche nicht', async () => {
    const f = fixture(), host = f.host();
    f.deny(true);
    await assert.rejects(host.tick(0.1));
    f.deny(false);
    assert.equal((await host.tick(0.1)).committed, true);
  });

  await test('Stop verhindert neue Lese- und Schreibzugriffe', async () => {
    const f = fixture(), host = f.host();
    host.stop();
    const result = await host.tick(0.1);
    assert.equal(result.reason, 'stopped');
    assert.equal(f.reads(), 0);
    assert.equal(f.writes(), 0);
  });

  await test('Ungültiger Zeitschritt schreibt nichts', async () => {
    const f = fixture();
    await assert.rejects(f.host().tick(1));
    assert.equal(f.writes(), 0);
  });

  await test('Lesefehler verändert keinen Bewegungszustand', async () => {
    const f = fixture(), host = f.host();
    f.readError(true);
    await assert.rejects(host.tick(0.1));
    assert.equal(f.writes(), 0);
  });

  await test('Parallele Ticks werden nicht doppelt verarbeitet', async () => {
    const f = fixture(), host = f.host();
    const results = await Promise.all([
      host.tick(0.1),
      host.tick(0.1)
    ]);
    assert.equal(f.writes(), 1);
    assert.equal(results[1].reason, 'busy');
  });

  await test('Sitzung und Befehle bleiben unverändert', async () => {
    const f = fixture(), host = f.host();
    const before = JSON.stringify(f.room);
    await host.tick(0.1);
    const after = clone(f.room);
    delete after.movement;
    assert.equal(JSON.stringify(after), before);
  });

  console.log(
    '\nErgebnis C1b.2: ' + passed +
    ' bestanden, ' + failed + ' fehlgeschlagen.'
  );
  process.exitCode = failed ? 1 : 0;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

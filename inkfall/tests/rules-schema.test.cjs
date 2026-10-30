'use strict';

// Schutz gegen Schema-Drift: Client und Datenbankregeln wurden getrennt
// gepflegt. Genau dadurch war Anmelden und Account-Erstellen unmöglich — der
// Client schrieb `save`, `heroName` und `heroNameLocked`, die veröffentlichten
// Regeln erlauben unter users/{uid} aber nur profile, schemaVersion,
// selectedClass und characters. Weil dort `"$other": { ".validate": false }`
// steht, lässt ein einziges unbekanntes Feld die gesamte Anfrage scheitern.
//
// Dieser Test liest die echten Payload-Schlüssel aus dem Client-Code und
// vergleicht sie mit dem, was die Regeln deklarieren.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const rules = JSON.parse(read('config/database.rules.json')).rules;
const firebaseSource = read('game/js/firebase.js');
const startSource = read('game/js/startscreen.js');

const userRules = rules.users.$uid;
const characterRules = userRules.characters.$classId;
const soloRunRules = characterRules.soloRun;

function blockOf(source, opener, closer = '\n  }') {
  const start = source.indexOf(opener);
  assert.notEqual(start, -1, `Block nicht gefunden: ${opener}`);

  const rest = source.slice(start + opener.length);
  const end = rest.indexOf(closer);

  return end === -1 ? rest : rest.slice(0, end);
}

function keysOf(block, indent = 4) {
  const keys = new Set();
  const pattern = new RegExp(`^\\s{${indent}}([A-Za-z_$][\\w$]*)\\s*[:,]`, 'gm');

  for (const match of block.matchAll(pattern)) keys.add(match[1]);

  return keys;
}

function declaredKeys(node) {
  return new Set(Object.keys(node).filter(key => !key.startsWith('.')));
}

test('die Regeln sperren unbekannte Felder wirklich aus', () => {
  // Nur wenn das gilt, sagen die folgenden Prüfungen tatsächlich etwas aus.
  assert.deepEqual(userRules.$other, { '.validate': false });
  assert.deepEqual(characterRules.$other, { '.validate': false });
  assert.deepEqual(soloRunRules.$other, { '.validate': false });
});

test('jedes Feld aus characterRecord() ist in den Regeln deklariert', () => {
  const all = keysOf(blockOf(firebaseSource, 'function freshCharacter(classId) {'));
  const clientOnly = new Set(
    [...blockOf(firebaseSource, 'const CLIENT_ONLY_CHARACTER_FIELDS = [', '];')
      .matchAll(/"([\w$]+)"/g)].map(match => match[1])
  );
  const declared = declaredKeys(characterRules);

  assert.ok(all.size > 0, 'freshCharacter() liefert keine erkennbaren Felder');
  assert.ok(clientOnly.has('heroName') && clientOnly.has('heroNameLocked'),
    'CLIENT_ONLY_CHARACTER_FIELDS muss heroName und heroNameLocked enthalten');

  for (const key of all) {
    if (clientOnly.has(key)) {
      assert.equal(declared.has(key), false,
        `"${key}" gilt als reines Client-Feld, steht aber in den Regeln`);
      continue;
    }

    assert.ok(declared.has(key),
      `Der Client schreibt characters/${key}, die Regeln kennen das Feld ` +
      'nicht → Schreibvorgang scheitert mit PERMISSION_DENIED');
  }
});

test('jedes Feld aus freshRun() ist in den Regeln deklariert', () => {
  const keys = keysOf(blockOf(firebaseSource, 'function freshRun(classId) {'));
  const declared = declaredKeys(soloRunRules);

  assert.ok(keys.size > 0, 'freshRun() liefert keine erkennbaren Felder');

  for (const key of keys) {
    assert.ok(declared.has(key),
      `freshRun() schreibt "${key}", die Regeln kennen das Feld nicht`);
  }
});

test('jedes Feld aus saveGame().run ist in den Regeln deklariert', () => {
  const keys = keysOf(blockOf(firebaseSource, 'const run = {'));
  const declared = declaredKeys(soloRunRules);

  assert.ok(keys.size > 0, 'saveGame() liefert keine erkennbaren Felder');

  for (const key of keys) {
    assert.ok(declared.has(key),
      `saveGame() schreibt "${key}", die Regeln kennen das Feld nicht`);
  }
});

test('das Registrierungs-Payload enthält nur erlaubte Knoten', () => {
  const payload = keysOf(blockOf(startSource, 'await reference.set({', '\n        });'), 10);
  const declared = declaredKeys(userRules);

  assert.ok(payload.size > 0, 'Registrierungs-Payload nicht erkannt');
  assert.equal(payload.has('save'), false,
    'Das alte Feld save wird von den Regeln abgelehnt und darf nicht ' +
    'mitgeschrieben werden');

  for (const key of payload) {
    assert.ok(declared.has(key),
      `Die Registrierung schreibt users/${key}, die Regeln kennen das Feld ` +
      'nicht → PERMISSION_DENIED');
  }

  // Der Charakter im Payload muss selbst regelkonform sein.
  assert.match(startSource, /characters: \{ knight: characterRecord\("knight"\) \}/);
});

test('die Registrierung reserviert keinen Spielernamen mehr', () => {
  // usernames/ ist in den veröffentlichten Regeln nicht vorhanden.
  assert.equal(rules.usernames, undefined,
    'Falls usernames wieder erlaubt wird, muss die Reservierung im Client ' +
    'ebenfalls wieder aktiviert werden');
  assert.equal(startSource.includes('db.ref("usernames/'), false,
    'Der Client darf den nicht existierenden Knoten nicht mehr beschreiben');
});

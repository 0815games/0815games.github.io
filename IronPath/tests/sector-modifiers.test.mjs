import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {sectorModifier, sectorFormation, waveFormation, missionFormation} from '../core/combat.mjs';
import {createMatch, stepMatch} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {sectorOf} from '../core/maps.mjs';

// AUSBAU-PLAN Punkt 3: Sektor-Modifikatoren. Ab Sektor 2 hat jeder Sektor
// einen erkennbaren Schwerpunkt, damit sich die Endlos-Kette nicht nur über
// Zahlen unterscheidet. Reine Ableitung aus der Sektorstufe: kein neuer
// Spielstand, jeder Client rechnet dieselbe Formation.

test('sectors 2-4 carry a named lean; sector 1 and off-sector fields stay standard', () => {
  assert.equal(sectorModifier(0), null);
  assert.equal(sectorModifier(1), null);
  assert.equal(sectorModifier(2).id, 'armor');
  assert.equal(sectorModifier(3).id, 'air');
  assert.equal(sectorModifier(4).id, 'storm');
  for (const sector of [2, 3, 4]) {
    assert.ok(sectorModifier(sector).name.length > 0);
    assert.ok(sectorModifier(sector).description.length > 20, 'the radio intel says what to build');
  }
});

test('the lean remaps every fourth ground unit, never a boss, never the wave length', () => {
  const base = waveFormation(10); // Bosswelle: letzter Eintrag ist ein Boss
  for (const sector of [2, 3, 4]) {
    const leaned = sectorFormation(base, sector);
    assert.equal(leaned.length, base.length);
    assert.equal(leaned.at(-1), base.at(-1), 'the boss stays the boss');
    assert.notDeepEqual(leaned, base, `sector ${sector} actually leans`);
  }
  assert.deepEqual(sectorFormation(base, 1), base, 'sector 1 is the standard rhythm');
  assert.deepEqual(sectorFormation(base, 0), base);
  const armor = sectorFormation(['infantry', 'runner', 'tank', 'plane', 'infantry'], 2);
  assert.deepEqual(armor, ['infantry', 'runner', 'tank', 'plane', 'tank'], 'armor turns every third light unit into a tank');
  const air = sectorFormation(['infantry', 'runner', 'tank', 'plane', 'infantry'], 3);
  assert.deepEqual(air, ['infantry', 'runner', 'plane', 'plane', 'infantry'], 'air turns every third ground unit into a plane');
});

test('a sector-2 field really spawns the armor lean in a solo run', () => {
  const run = mapId => {
    const s = createMatch([createPlayer('solo', {name: 'Solo', gender: 'female'})], mapId);
    s.wave = 5;
    s.running = true;
    s.spawnLeft = missionFormation(5).length;
    s.spawnIndex = 0;
    const seen = new Set();
    for (let i = 0; i < 30 * 40 && s.spawnLeft > 0; i++) {
      stepMatch(s);
      for (const e of s.enemies) seen.add(e);
    }
    const kinds = [...seen].map(e => e.kind);
    return {tanks: kinds.filter(k => k === 'tank').length, total: kinds.length};
  };
  assert.equal(sectorOf('g3-000000001'), 1);
  assert.equal(sectorOf('g3-100000001'), 2);
  const standard = run('g3-000000001');
  const armor = run('g3-100000001');
  assert.equal(armor.total, standard.total, 'same wave size, different fight');
  assert.ok(armor.tanks > standard.tanks, `armor sector fields more tanks (${armor.tanks} > ${standard.tanks})`);
});

test('the fall-back transmission announces the next sector lean', () => {
  const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(game, /sectorModifier\(sectorOf\(state\.mapId\)\+1\)/, 'the radio names what waits behind the retreat');
  assert.match(game, /Intel on the next sector/, 'with the counter-build advice');
});

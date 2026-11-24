import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../scripts/simulate-balance.mjs';

// Kurzer Lauf: prüft Invarianten und dass der Bot überhaupt baut. Die Zahlen selbst prüft `npm run simulate`.
test('Simulation: Invarianten halten, der Bot baut', () => {
  const r = simulate({ biome: 'riverlands', days: 2 });
  assert.equal(r.violations, 0, 'Münzen oder Lager verletzen Grenzen');
  assert.ok(r.buildings >= 1, 'es wurde nichts gebaut');
  assert.ok(r.coins >= 0);
  assert.ok(r.firstBuildHours !== null && r.firstBuildHours <= 9.25, 'erster Bau sollte in der ersten Sitzung (9:00 bis 9:15) liegen');
});

test('Simulation: gleiche Eingabe, gleiches Ergebnis', () => {
  const a = simulate({ biome: 'coast', days: 1 });
  const b = simulate({ biome: 'coast', days: 1 });
  assert.deepEqual(a, b);
});

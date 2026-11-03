import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
test('literal game and account DOM references exist in the real page', () => {
  for (const file of ['game.js', 'account.js']) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g)) {
      assert.ok(ids.has(id), `${file} references missing #${id}`);
    }
  }
});

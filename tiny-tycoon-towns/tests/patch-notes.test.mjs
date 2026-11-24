import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELEASED_PATCHES, OPEN_ITEMS } from '../src/patch-notes.mjs';

test('every field note has a German and an English text', () => {
  for (const p of RELEASED_PATCHES) {
    assert.match(p.build, /^\d{8}-[a-z0-9]+$/);
    for (const it of p.items) assert.ok(it.de?.trim() && it.en?.trim(), `${p.build}: ${JSON.stringify(it)}`);
  }
  for (const it of OPEN_ITEMS) assert.ok(it.de?.trim() && it.en?.trim());
});

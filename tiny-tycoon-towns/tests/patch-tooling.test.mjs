import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('patch.mjs check --fast is green on the committed state', () => {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync('node', ['scripts/patch.mjs', 'check', '--fast'], { cwd: root, env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('bump without --apply changes nothing', () => {
  const file = join(root, 'index.html');
  const before = readFileSync(file, 'utf8');
  const r = spawnSync('node', ['scripts/patch.mjs', 'bump', '20261124-probe1'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(readFileSync(file, 'utf8'), before);
});

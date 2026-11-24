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

// A bump on a copy of this folder must move every anchor; a copy with one anchor
// removed must fail verification. Both run on temporary copies, never on the repo.
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { planBump, applyBump, verifyBump } from '../scripts/patch.mjs';

function copyOfFolder() {
  const dir = mkdtempSync(join(tmpdir(), 'ttt-bump-'));
  cpSync(root, dir, { recursive: true, filter: (src) => !src.includes('/node_modules') });
  return dir;
}

test('a bump on a copy moves every anchor and verifies', () => {
  const dir = copyOfFolder();
  try {
    const plan = planBump({ root: dir, to: '20261201-probe1' });
    assert.deepEqual(plan.problems, []);
    applyBump(plan);
    // Until the field-notes entry exists, only the patch-notes anchor is behind.
    const before = verifyBump({ root: dir, to: '20261201-probe1' });
    assert.deepEqual(before.wrong.map((w) => w.file), ['src/patch-notes.mjs']);
    // Adding the entry for the new wave closes the last anchor.
    const notes = join(dir, 'src', 'patch-notes.mjs');
    writeFileSync(notes, readFileSync(notes, 'utf8').replace(
      'RELEASED_PATCHES = [\n',
      "RELEASED_PATCHES = [\n  { build: '20261201-probe1', date: '2026-12-01', items: [{ de: 'x', en: 'x' }] },\n"));
    const verdict = verifyBump({ root: dir, to: '20261201-probe1' });
    assert.equal(verdict.ok, true, JSON.stringify(verdict.wrong));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a bump that leaves one anchor behind fails verification (bissfest)', () => {
  const dir = copyOfFolder();
  try {
    const plan = planBump({ root: dir, to: '20261201-probe1' });
    applyBump(plan);
    const html = join(dir, 'index.html');
    const current = JSON.parse(readFileSync(join(root, 'release-version.json'), 'utf8')).build;
    writeFileSync(html, readFileSync(html, 'utf8').replace('ttt-build" content="20261201-probe1"', `ttt-build" content="${current}"`));
    assert.equal(verifyBump({ root: dir, to: '20261201-probe1' }).ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

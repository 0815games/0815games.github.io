#!/usr/bin/env node
// Patch-Werkzeug für Tiny Tycoon Towns, nach dem Vorbild von IronPath/scripts/patch.mjs.
//
//   node scripts/patch.mjs check [--fast | --suite]   liest und meldet, schreibt nichts
//   node scripts/patch.mjs bump <token> [--apply]     setzt die Cache-Welle (?v=)
//
// Ohne --apply zeigt bump nur die Zeilen, die sich ändern würden.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { checkRules, CANDIDATE } from './check-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_RE = /^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROOT_ALLOWED = new Set([
  'AGENTS.md', 'README.md', 'package.json', 'firebase.json', '.firebaserc', '.gitignore',
  'index.html', 'style.css', 'favicon.svg', 'release-version.json',
  'data', 'src', 'docs', 'scripts', 'tests', 'firebase',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'backup']);
const TEXT_EXT = new Set(['.js', '.mjs', '.json', '.md', '.html', '.css', '.svg']);
const SECRET_PATTERNS = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'privater Schlüssel'],
  [/"private_key"\s*:/, 'Service-Account-Schlüssel'],
  [/"type"\s*:\s*"service_account"/, 'Service-Account-Datei'],
  [/client[_]secret/i, 'OAuth-Client-Geheimnis'],
  [/refresh[_]token/i, 'Refresh-Token'],
];
// Öffentliche Web-Konfiguration darf nur in der Konfigurationsdatei stehen.
const PUBLIC_CONFIG = 'src/firebase-config.js';

const abs = (p) => join(ROOT, p);

async function walk(rel = '') {
  const out = [];
  for (const e of await readdir(abs(rel), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await walk(r));
    else out.push(r);
  }
  return out;
}

const srcScripts = async () => (await walk('src')).filter((f) => ['.js', '.mjs'].includes(extname(f)));

async function stempel(token) {
  const issues = [];
  if (!TOKEN_RE.test(token)) issues.push(`Token "${token}" hat nicht das Format 20YYMMDD-name`);
  const html = await readFile(abs('index.html'), 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|mjs|css))(?:\?v=([^"]*))?"/g)) {
    if (m[2] !== token) issues.push(`index.html: ${m[1]} trägt ?v=${m[2] ?? '(keins)'}`);
  }
  for (const f of await srcScripts()) {
    const text = await readFile(abs(f), 'utf8');
    for (const m of text.matchAll(/(?:from |import\()\s*'(\.[^']+?\.(?:js|mjs))(?:\?v=([^']*))?'/g)) {
      if (m[2] !== token) issues.push(`${f}: ${m[1]} trägt ?v=${m[2] ?? '(keins)'}`);
    }
  }
  const notes = await import(pathToFileURL(abs('src/patch-notes.mjs')).href);
  if (notes.RELEASED_PATCHES[0]?.token !== token) {
    issues.push('src/patch-notes.mjs: RELEASED_PATCHES[0] passt nicht zur Welle. Feldnotizen fehlen.');
  }
  return issues;
}

async function struktur() {
  const issues = [];
  for (const e of await readdir(ROOT, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.name !== '.firebaserc' && e.name !== '.gitignore') continue;
    if (e.name === 'node_modules') continue;
    if (!ROOT_ALLOWED.has(e.name)) issues.push(`Spielwurzel: "${e.name}" gehört nicht hierher`);
  }
  for (const f of ['src/main.js', 'src/cloud.js', 'src/domain/engine.js', 'src/patch-notes.mjs', 'data/buildings.json']) {
    try { await readFile(abs(f)); } catch { issues.push(`fehlt: ${f}`); }
  }
  for (const f of (await walk('data')).filter((x) => x.endsWith('.json'))) {
    try { JSON.parse(await readFile(abs(f), 'utf8')); } catch (e) { issues.push(`${f}: kein gültiges JSON`); }
  }
  return issues;
}

async function patchlog() {
  const issues = [];
  const log = await readFile(abs('docs/PATCH-LOG.md'), 'utf8');
  const ids = [...log.matchAll(/^## TTT-(\d{4}) /gm)].map((m) => Number(m[1]));
  if (!ids.length) issues.push('keine Einträge (## TTT-NNNN) gefunden');
  ids.forEach((id, i) => {
    if (id !== ids[0] + i) issues.push(`Nummerierung bricht bei TTT-${String(id).padStart(4, '0')} (erwartet ${ids[0] + i})`);
  });
  if (/AIza[0-9A-Za-z_-]{20,}/.test(log)) issues.push('Patch-Log enthält einen Firebase-Schlüssel. Bitte entfernen.');
  return issues;
}

async function geheimnisse() {
  const issues = [];
  for (const f of await walk('')) {
    if (!TEXT_EXT.has(extname(f)) || f === PUBLIC_CONFIG) continue;
    const text = await readFile(abs(f), 'utf8');
    for (const [re, label] of SECRET_PATTERNS) {
      if (re.test(text)) issues.push(`${f}: ${label}`);
    }
    if (/AIza[0-9A-Za-z_-]{20,}/.test(text) && f.startsWith('docs/')) {
      issues.push(`${f}: Firebase-Schlüssel in der Dokumentation`);
    }
  }
  return issues;
}

async function regeln() {
  const rules = JSON.parse(await readFile(CANDIDATE, 'utf8'));
  return checkRules(rules).errors;
}

function testsLaufen() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // verschachtelte Läufe würden sonst in den Elternkanal schreiben
  const files = (spawnSync('node', ['-e', "require('fs').readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).forEach(f=>console.log('tests/'+f))"], { cwd: ROOT, encoding: 'utf8' }).stdout || '').trim().split('\n').filter(Boolean);
  const r = spawnSync('node', ['--test', ...files], { cwd: ROOT, env, encoding: 'utf8' });
  if (r.status === 0) return [];
  return [`Tests rot (Exit ${r.status}). Letzte Zeilen:\n${(r.stdout + r.stderr).split('\n').slice(-12).join('\n')}`];
}

async function check(mode) {
  const checks = [
    ['stempel', async () => stempel(JSON.parse(await readFile(abs('release-version.json'), 'utf8')).token)],
    ['struktur', struktur],
    ['patchlog', patchlog],
    ['geheimnisse', geheimnisse],
    ['regeln', regeln],
  ];
  if (mode === '--suite') checks.push(['verträge+tests', async () => testsLaufen()]);
  let failed = 0;
  for (const [name, fn] of checks) {
    const issues = await fn();
    if (issues.length) {
      failed++;
      console.log(`✘ ${name}`);
      for (const i of issues) console.log(`    ${i}`);
    } else {
      console.log(`✔ ${name}`);
    }
  }
  if (mode !== '--suite') console.log('(Volle Suite: npm run check:suite)');
  process.exit(failed ? 1 : 0);
}

async function bump(token, apply) {
  if (!TOKEN_RE.test(token ?? '')) {
    console.error('Token muss 20YYMMDD-name sein, z. B. 20261124-konto2');
    process.exit(2);
  }
  const edits = [];
  const htmlRe = /((?:src|href)="[^"]+\.(?:js|mjs|css))(?:\?v=[^"]*)?"/g;
  const jsRe = /((?:from |import\()\s*'\.[^']+?\.(?:js|mjs))(?:\?v=[^']*)?'/g;
  const html = await readFile(abs('index.html'), 'utf8');
  edits.push({ file: 'index.html', text: html.replace(htmlRe, `$1?v=${token}"`) });
  for (const f of await srcScripts()) {
    const text = await readFile(abs(f), 'utf8');
    edits.push({ file: f, text: text.replace(jsRe, `$1?v=${token}'`) });
  }
  edits.push({ file: 'release-version.json', text: `${JSON.stringify({ token }, null, 2)}\n` });

  for (const e of edits) {
    const before = await readFile(abs(e.file), 'utf8');
    const n = before === e.text ? 0 : before.split('\n').filter((l, i) => l !== e.text.split('\n')[i]).length;
    if (n) console.log(`${e.file}: ${n} Zeile(n)`);
    if (apply && before !== e.text) await writeFile(abs(e.file), e.text);
  }
  console.log(apply ? `Welle ${token} geschrieben. check ist rot, bis src/patch-notes.mjs den Eintrag hat.` : 'Trockenlauf. Mit --apply schreiben.');
}

const [, , cmd, ...rest] = process.argv;
if (cmd === 'check') await check(rest[0] ?? '--fast');
else if (cmd === 'bump') await bump(rest.find((a) => !a.startsWith('--')), rest.includes('--apply'));
else {
  console.log('Verwendung: patch.mjs check [--fast|--suite] | bump <token> [--apply]');
  process.exit(2);
}

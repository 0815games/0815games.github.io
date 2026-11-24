// Der Ordner hatte 1.582 Zeilen toten Code in vier `.old`-Dateien, ein
// nie geladenes 3D-Experiment und ein Handbuch, das drei nicht existierende
// Dateien beschrieb. Diese Tests halten den aufgeräumten Stand fest.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, found = []) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

test('keine .old-Dateien mehr', () => {
  const stale = walk(ROOT).filter(file => /\.old$/.test(file));
  assert.deepEqual(stale.map(f => f.replace(ROOT, '')), [], 'Altlasten gefunden');
});

test('keine Sicherungskopien im Baum', () => {
  const copies = walk(ROOT).filter(file => /\.(bak|before-.*|orig|rej)$/.test(file));
  assert.deepEqual(copies, [], 'Sicherungskopien gefunden');
});

test('jede .js-Datei in src/ wird von einer Ladereihenfolge erreicht', async () => {
  const {ORDER, ADMIN_ORDER} = await import('../entries.mjs');
  const reached = new Set([...ORDER, ...ADMIN_ORDER]);
  const present = [];
  for (const dir of ['data', 'game', 'ui']) {
    for (const name of readdirSync(join(ROOT, 'src', dir))) {
      present.push(`src/${dir}/${name}`);
    }
  }
  present.push('src/network.js', 'src/admin.js');
  const orphaned = present.filter(file => !reached.has(file));
  assert.deepEqual(orphaned, [], `nicht geladene Dateien: ${orphaned.join(', ')}`);
});

test('bekannte Überschreibungen sind begründet', async () => {
  const {KNOWN_OVERRIDES, unapprovedOverrides, unusedOverrides} = await import('../entries.mjs');
  assert.deepEqual(unapprovedOverrides().map(o => o.key), [], 'unbestätigte Überschreibungen');
  assert.deepEqual(unusedOverrides(), [], 'Freigaben ohne Vorkommen');
  // Jede Freigabe braucht einen Kommentar direkt darüber.
  const source = readFileSync(join(ROOT, 'entries.mjs'), 'utf8');
  for (const key of KNOWN_OVERRIDES) {
    const line = source.split('\n').findIndex(l => l.includes(`'${key}'`));
    assert.ok(line > 0, `${key} steht nicht in entries.mjs`);
    const above = source.split('\n').slice(Math.max(0, line - 4), line).join('\n');
    assert.match(above, /\/\/|\/\*/, `${key} hat keine Begründung`);
  }
});

test('das gebaute Bündel liegt im Spielordner', () => {
  // GitHub Pages liefert dieses Repository aus der Wurzel; ein dist/ daneben
  // würde nie ausgeliefert.
  for (const file of [
    'index.html', 'app.js', 'app.css', 'style.css', 'admin.html', 'admin.js', 'Version', 'build.json'
  ]) {
    assert.ok(existsSync(join(ROOT, file)), `${file} fehlt - Build nicht gelaufen?`);
  }
  assert.ok(!existsSync(join(ROOT, 'dist')), 'dist/ existiert noch - der Build schreibt nicht mehr dorthin');
});

test('jede im HTML verlinkte Datei existiert auch', () => {
  // Genau hier lag ein Fehler: die gebaute Seite verlinkte style.css, die Datei
  // gab es nach dem Umbau aber nur in shell/ - im Browser ein 404.
  for (const page of ['index.html', 'admin.html']) {
    const html = readFileSync(join(ROOT, page), 'utf8');
    for (const match of html.matchAll(/(?:src|href)="([^"?:#]+)(?:\?[^"]*)?"/g)) {
      const target = match[1];
      if (/^(https?:|data:|\/\/)/.test(target)) continue;
      assert.ok(existsSync(join(ROOT, target)), `${page} verlinkt ${target}, das fehlt`);
    }
  }
});

test('Versionsstempel steht an genau einer Stelle', () => {
  // Vorher gab es vier Stände: Version 13.37, readme 0.9.8, change.log 0.8.0,
  // Weltkarte PIP-OS V7.1.0. Führend ist shell/Version.
  const version = readFileSync(join(ROOT, 'shell', 'Version'), 'utf8').trim();
  assert.match(version, /^\d+\.\d+/, `unerwarteter Versionsstempel: ${version}`);
  const built = JSON.parse(readFileSync(join(ROOT, 'build.json'), 'utf8'));
  assert.equal(built.version, version, 'Build und Quelle nennen unterschiedliche Versionen');
});

test('die Hüllseiten laden keine Einzeldateien mehr', () => {
  const index = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const admin = readFileSync(join(ROOT, 'admin.html'), 'utf8');
  assert.ok(!index.includes('loadScript('), 'index.html lädt noch Einzeldateien');
  assert.ok(!/load\('(data|network|admin)/.test(admin), 'admin.html lädt noch Einzeldateien');
  assert.ok(!index.includes('cdn.tailwindcss.com'), 'index.html nutzt noch den Tailwind-Play-CDN');
  assert.ok(!admin.includes('cdn.tailwindcss.com'), 'admin.html nutzt noch den Tailwind-Play-CDN');
});

test('keine zusammengesetzten Tailwind-Klassennamen', () => {
  // Tailwind liest den Quelltext statisch. `text-${color}-500` sieht es als
  // Zeichenkette ohne Klasse und erzeugt keine Regel - im Browser bleibt die
  // Farbe aus (docs/BEFUNDE.md, 6). Dynamische Namen müssen als vollständige
  // Paare in einer Tabelle stehen.
  const offenders = [];
  for (const file of walk(join(ROOT, 'src')).filter(f => f.endsWith('.js'))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const code = line.trim();
      // Kommentare dürfen das Muster zitieren, ohne den Test zu wecken.
      if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
      // Muster wie text-${x}-500, border-${x}-900/50, via-${x}-900/10
      if (/[a-z]-(?:\$\{[^}]+\})-(?:\d|\[)/.test(line)) {
        offenders.push(`${file.replace(ROOT, '')}:${index + 1}  ${code.slice(0, 90)}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `zusammengesetzte Klassen:\n  ${offenders.join('\n  ')}`);
});

test('die Stadtkacheln haben für jede Farbe eine Regel', () => {
  // Gegenprobe zum Vorigen: die Paletten müssen im gebauten CSS ankommen.
  const css = readFileSync(join(ROOT, 'app.css'), 'utf8');
  const need = [];
  for (const color of ['green', 'yellow', 'red', 'blue']) {
    for (const pattern of ['text-{}-500', 'group-hover:text-{}-300', 'text-{}-700',
      'group-hover:text-{}-500', 'via-{}-900/10']) {
      need.push(pattern.replace('{}', color));
    }
  }
  const missing = need.filter(cls => {
    const escaped = cls.replace(/:/g, '\\:').replace(/\//g, '\\/');
    return !css.includes(`.${escaped} {`) && !css.includes(`.${escaped},`) && !css.includes(`.${escaped}:`);
  });
  assert.deepEqual(missing, [], `Klassen fehlen im CSS: ${missing.join(', ')}`);
});

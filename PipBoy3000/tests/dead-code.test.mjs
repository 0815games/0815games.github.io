// Toter Code, der auf Elemente wartet, die es nicht gibt, ist schwer zu sehen:
// er wirft nicht, er tut nur nichts. Genau so blieben renderChar und
// renderCharStats jahrelang im Bündel (docs/BEFUNDE.md, 3).
//
// Dieser Test prüft nicht jede ID - Overlays werden zur Laufzeit erzeugt. Er
// prüft die Fälle, in denen eine Funktion *nur* auf fehlende Elemente wartet.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function sources(dir = join(ROOT, 'src'), found = []) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) sources(full, found);
    else if (entry.name.endsWith('.js')) found.push(full);
  }
  return found;
}

const code = sources().map(file => readFileSync(file, 'utf8')).join('\n');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  + readFileSync(join(ROOT, 'admin.html'), 'utf8');

// IDs, die im HTML stehen oder zur Laufzeit per JS erzeugt werden (id = 'x').
const staticIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
// Laufzeit-IDs entstehen auf zwei Wegen: element.id = 'x' und id="x" in einem
// innerHTML-String. Beide müssen zählen, sonst meldet der Test lebende Views.
const runtimeIds = new Set([
  ...[...code.matchAll(/\.id\s*=\s*['"`]([A-Za-z0-9_-]+)/g)].map(m => m[1]),
  ...[...code.matchAll(/id=\\?["']([A-Za-z0-9_-]+)/g)].map(m => m[1])
]);
const known = new Set([...staticIds, ...runtimeIds]);

test('die früheren Char-Renderer sind wirklich entfernt', () => {
  // Gegenprobe zum Aufräumen: würden sie zurückkehren, wären sie wieder tot.
  for (const gone of ['renderChar:', 'renderCharStats:', 'renderCharPerks:', 'renderCharStatus:']) {
    assert.ok(!code.includes(gone), `${gone} ist wieder im Quelltext`);
  }
  assert.ok(!code.includes("getElementById('special-list')"), 'special-list wird wieder gesucht');
  assert.ok(!code.includes("getElementById('perks-list')"), 'perks-list wird wieder gesucht');
});

test('keine Funktion hängt ausschließlich an fehlenden Elementen', () => {
  // Heuristik: eine Funktion, die nur getElementById(...) mit unbekannten IDs
  // aufruft und danach nichts weiter tut, ist ein Rest.
  const problems = [];
  for (const file of sources()) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/^\s{4}(\w+):\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n    \},?$/gm)) {
      const [, name, body] = match;
      const ids = [...body.matchAll(/getElementById\(\s*['"`]([A-Za-z0-9_-]+)['"`]\s*\)/g)].map(m => m[1]);
      if (ids.length === 0) continue;
      const allMissing = ids.every(id => !known.has(id));
      if (!allMissing) continue;
      // Nur melden, wenn die Funktion außer dem Warten nichts Substanzielles tut.
      const stripped = body
        .replace(/\/\/.*$/gm, '')
        .replace(/getElementById\(\s*['"`][^'"`]+['"`]\s*\)/g, 'EL')
        .replace(/\s+/g, ' ');
      if (stripped.length < 400) {
        problems.push(`${file.replace(ROOT, '')}  ${name}()  wartet nur auf: ${ids.join(', ')}`);
      }
    }
  }
  assert.deepEqual(problems, [], `Funktionen ohne Wirkung:\n  ${problems.join('\n  ')}`);
});

test('jede Ansicht, die ein Template lädt, hat einen Renderer', () => {
  // switchView lädt templates/<name>.html und ruft danach einen Renderer.
  // Fehlt der Renderer, bleibt die Ansicht leer - ohne Fehler.
  const views = [...code.matchAll(/name === '([a-z]+)'\)\s*this\.(render\w+)/g)]
    .map(([, view, fn]) => ({view, fn}));
  const missing = views.filter(({fn}) => !new RegExp(`${fn}\\s*:\\s*function`).test(code));
  assert.deepEqual(missing, [], `Renderer fehlen: ${missing.map(m => m.fn).join(', ')}`);
});

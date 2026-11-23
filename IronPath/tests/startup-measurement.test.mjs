import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {measureStartup} from '../scripts/measure-startup.mjs';

// AUSBAU-PLAN Punkt 6: Die Start-Messung ist ein wiederholbares Werkzeug,
// keine einmalige Zahl. Dieser Test hält ihre Invarianten fest - der Graph
// löst vollständig auf, die Phasen sind konsistent - und setzt grobe
// Bänder, damit Wachstum sichtbar wird, statt bei jedem neuen Modul zu
// brechen. Die Entscheidung steht in docs/START-REQUESTS-MESSUNG.md.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m = measureStartup(root);

test('the startup graph resolves completely', () => {
  assert.deepEqual(m.unresolved, [], 'every relative import in the startup graph points at a real file');
  assert.deepEqual(m.entries, ['language-gate.mjs', 'ui/intro.mjs', 'account-entry.mjs']);
  assert.equal(m.external.length, 3, 'the Firebase app/auth/database CDN modules');
  assert.ok(m.external.every(url => url.startsWith('https://www.gstatic.com/firebasejs/')));
});

test('the measured shape stays inside the decision bands', () => {
  // Gemessen 2026-11-23 (IPL-0120): 191 Module, ~666 KB gzip, Tiefe 6.
  // Die Bänder sind bewusst weit: Sie sollen Wachstum melden, nicht jedes
  // neue Modul bestrafen. Werden sie gerissen, gehört die Bundling-Frage
  // erneut auf den Tisch (siehe Messbericht).
  assert.ok(m.modules >= 150 && m.modules <= 300, `module count ${m.modules} inside 150-300`);
  assert.ok(m.gzipBytes >= 400 * 1024 && m.gzipBytes <= 900 * 1024, `gzip ${(m.gzipBytes / 1024).toFixed(0)} KB inside 400-900 KB`);
  assert.ok(m.maxDepth >= 3 && m.maxDepth <= 8, `waterfall depth ${m.maxDepth + 1} levels inside 4-9`);
  assert.equal(Object.values(m.levels).reduce((a, b) => a + b, 0), m.modules, 'the level histogram accounts for every module');
  assert.ok(m.bootModules < m.modules && m.bootBytes < m.bytes, 'the boot phase is the smaller front door');
  assert.ok(m.css.length >= 2, 'stylesheets are counted as their own requests');
});

// Abnahmetest gegen das, was tatsächlich ausgeliefert wird: die gebaute
// index.html lädt app.js, führt die Boot-Sequenz aus und zeigt am Ende den
// Login. Geprüft wird also die Seite, nicht nur das Bündel.
//
// jsdom ersetzt keinen echten Browser (kein Layout, kein Canvas-Rendering),
// deckt aber genau den Teil ab, der beim Umbau kaputtgehen konnte: Skript
// laden, Version holen, Boot-Sequenz durchlaufen, UI initialisieren.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM, ResourceLoader} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://example.test/PipBoy3000/';

// Liefert lokale Dateien aus, damit jsdom die Seite wie ein Browser lädt.
class LocalLoader extends ResourceLoader {
  // jsdom erwartet hier ein Promise, keinen Buffer.
  fetch(url) {
    if (!url.startsWith(ORIGIN)) return Promise.resolve(Buffer.from(''));
    const path = join(ROOT, url.slice(ORIGIN.length).split('?')[0]);
    return Promise.resolve(existsSync(path) ? readFileSync(path) : Buffer.from(''));
  }
}

function bootPage() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    url: ORIGIN,
    runScripts: 'dangerously',
    resources: new LocalLoader(),
    pretendToBeVisual: true,
    beforeParse(window) {
      window.fetch = () => Promise.resolve({ok: true, text: async () => '13.37'});
      window.console = {log() {}, warn() {}, error: (...a) => errors.push(a.join(' '))};
    }
  });
  return {dom, errors};
}

const {dom, errors} = bootPage();
const {window} = dom;

// Die Boot-Sequenz arbeitet mit setTimeout; ohne Warten wäre alles nur Zufall.
await new Promise(resolve => setTimeout(resolve, 3000));

test('die Seite lädt ihre Skripte aus dem eigenen Ordner', () => {
  const sources = [...window.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  assert.ok(sources.some(src => src.startsWith('app.js')), `kein app.js unter: ${sources.join(', ')}`);
  // Tailwind vom Play-CDN ist beseitigt (jetzt Build-Zeit). Firebase kommt
  // weiterhin von gstatic - das ist der noch offene Schritt auf SDK v9/v10
  // modular, siehe docs/ANALYSE.md Abschnitt 5.
  assert.ok(
    !sources.some(src => /cdn\.tailwindcss\.com/.test(src)),
    'die Seite lädt Tailwind noch vom Play-CDN'
  );
  assert.ok(
    !sources.some(src => /^(data|game|ui|network)\//.test(src)),
    'die Seite lädt noch Einzeldateien'
  );
});

test('das Stylesheet kommt aus dem Build', () => {
  const links = [...window.document.querySelectorAll('link[rel=stylesheet]')].map(l => l.getAttribute('href'));
  assert.ok(links.some(href => href.startsWith('app.css')), `app.css fehlt: ${links.join(', ')}`);
  assert.ok(!links.some(href => /cdn\.tailwindcss\.com/.test(href)), 'Tailwind kommt noch vom CDN');
});

test('Spielobjekte stehen nach dem Boot bereit', () => {
  assert.deepEqual(errors, [], `Konsolenfehler: ${errors.join(' | ')}`);
  for (const name of ['Game', 'UI', 'Combat', 'Network', 'WorldGen', 'MiniGames']) {
    assert.equal(typeof window[name], 'object', `${name} fehlt nach dem Boot`);
  }
});

test('Boot-Sequenz meldet SYSTEM READY', () => {
  const log = window.document.getElementById('boot-log');
  assert.ok(log, '#boot-log fehlt');
  assert.match(log.textContent, /SYSTEM READY/i, `Boot-Log endet mit: ${log.textContent.trim().slice(-120)}`);
});

test('Version wird angezeigt', () => {
  const display = window.document.getElementById('version-display');
  assert.ok(display, '#version-display fehlt');
  assert.equal(display.textContent.trim(), '13.37');
});

test('Login-Bereich ist nach dem Boot sichtbar', () => {
  const login = window.document.getElementById('login-content');
  assert.ok(login, '#login-content fehlt');
  assert.ok(!login.classList.contains('hidden'), 'Login bleibt verborgen');
});

test('Template-Pfade zeigen auf vorhandene Dateien', () => {
  // Der Umbau hat die Templates von views/ nach templates/ verschoben; ein
  // vergessener Pfad wäre im Browser ein 404 erst beim Öffnen der Ansicht.
  const source = readFileSync(join(ROOT, 'app.js'), 'utf8');
  const referenced = new Set([...source.matchAll(/templates\/\$\{[^}]+\}\.html|templates\/([a-z]+)\.html/g)]);
  assert.ok(source.includes('templates/'), 'kein Template-Pfad im Bündel gefunden');
  assert.ok(!source.includes('views/${name}.html'), 'das Bündel nutzt noch den alten views/-Pfad');
});

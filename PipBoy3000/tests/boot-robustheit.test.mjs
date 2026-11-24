// Der Crash vom 2026-11-24 auf einem iPhone.
//
// Der Bericht war: "Script error.", LOCATION "Internal : ?:?", kein Stack,
// leerer Log-Puffer. Drei Dinge waren daran kaputt, und der Bericht selbst
// hat die Ursache verschleiert:
//
//   1. "Script error." heisst: der Fehler kam aus einem fremden Skript (CDN,
//      CORS). Der Bericht zeigte das nicht an.
//   2. Faellt das Firebase-CDN aus, ist der Login nicht moeglich - und es gab
//      keinen Weg ins Spiel.
//   3. Schlug der Versionsabruf fehl, wurde `scriptsLoaded` nie gesetzt: der
//      Boot wartete endlos und zeigte nie den Login.
import {test, before} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM, ResourceLoader} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://example.test/PipBoy3000/';

// jsdom kennt kein canvas. Ohne Attrappe wirft schon Game.init, und der Test
// misst dann die Grenze von jsdom statt das Verhalten der Seite.
function canvasAttrappe(window) {
  const ctx = new Proxy({}, {
    get(ziel, prop) {
      if (prop === 'canvas') return {width: 1500, height: 1500, clientWidth: 440, clientHeight: 796};
      if (prop === 'measureText') return () => ({width: 10});
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
        return () => ({addColorStop() {}});
      }
      if (typeof ziel[prop] === 'undefined') return () => {};
      return ziel[prop];
    },
    set(ziel, prop, wert) { ziel[prop] = wert; return true; }
  });
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
}

// Ausgelieferte Seite laden. Fremde URLs liefern nichts - das ist der
// CDN-Ausfall, den ein mobiles Netz erzeugt.
class LocalLoader extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(ORIGIN)) return Promise.resolve(Buffer.from(''));
    const pfad = join(ROOT, url.slice(ORIGIN.length).split('?')[0]);
    return Promise.resolve(existsSync(pfad) ? readFileSync(pfad) : Buffer.from(''));
  }
}

function booteSeite({fetchFehler = false, warteMs = 5000} = {}) {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const logs = [];
  const dom = new JSDOM(html, {
    url: ORIGIN,
    runScripts: 'dangerously',
    resources: new LocalLoader(),
    pretendToBeVisual: true,
    beforeParse(window) {
      canvasAttrappe(window);
      window.fetch = fetchFehler
        ? () => Promise.reject(new Error('Network request failed'))
        : () => Promise.resolve({ok: true, text: async () => '14.0.3'});
      window.console = {
        log: (...a) => logs.push(a.join(' ')),
        warn: (...a) => logs.push('WARN ' + a.join(' ')),
        error: (...a) => logs.push('ERR ' + a.join(' '))
      };
    }
  });
  return new Promise(resolve => {
    setTimeout(() => resolve({dom, window: dom.window, logs}), warteMs);
  });
}

// Zwei Starts reichen fuer alle Pruefungen und sparen Minuten.
let ohneVersion, mitVersion;

before(async () => {
  ohneVersion = await booteSeite({fetchFehler: true});
  mitVersion = await booteSeite({fetchFehler: false});
});

test('der Login wird auch gezeigt, wenn der Versionsabruf scheitert', () => {
  // Vorher: scriptsLoaded blieb false, runBootSequence wartete endlos,
  // der Login erschien nie. Auf dem Handy sah das wie ein Absturz aus.
  const {window, dom} = ohneVersion;

  const boot = window.document.getElementById('boot-sequence');
  const login = window.document.getElementById('login-content');

  assert.equal(boot.style.display, 'none', 'Boot-Sequenz laeuft noch');
  assert.ok(!login.classList.contains('hidden'), 'Login bleibt verborgen');
  assert.equal(window.UI.isSystemReady, true, 'System meldet nicht bereit');
  // `let scriptsLoaded` liegt im Skript-Scope, nicht auf window - pruefbar ist
  // nur das Ergebnis: das System meldet sich bereit (Zeile darueber).
  assert.ok(dom);
});

test('der fehlende Versionsabruf erzeugt keinen Crash-Bildschirm', () => {
  // Eine Textdatei, die nicht kommt, ist kein Absturz.
  const {window} = ohneVersion;
  const overlay = window.document.getElementById('crash-overlay');
  assert.notEqual(overlay.style.display, 'flex', 'Crash-Overlay steht offen');
  assert.equal(window.document.getElementById('login-version-display').textContent, 'UNBEKANNT');
});

test('ohne Firebase gibt es einen Weg ins Spiel', () => {
  // jsdom laedt die CDN-Skripte nicht - genau der Zustand nach einem Ausfall.
  const {window} = mitVersion;

  assert.equal(typeof window.firebase, 'undefined', 'Testannahme falsch: firebase ist da');
  assert.equal(typeof window.UI.startOffline, 'function', 'kein Offline-Start vorhanden');
  assert.ok(window.document.getElementById('btn-offline'), 'der Offline-Knopf fehlt im Login');
  assert.ok(window.document.getElementById('offline-hinweis'), 'der Hinweis auf den Ausfall fehlt');
});

test('der Offline-Start beginnt ein Spiel ohne Netz', async () => {
  const {window} = mitVersion;
  const {UI, Game} = window;

  UI.isMobile = () => false;
  Game.saveGame = () => {};

  await UI.startOffline();

  assert.ok(Game.state, 'kein Spielstand angelegt');
  assert.equal(Game.state.playerName, 'SURVIVOR', 'neuer Charakter hat keinen Namen');
  assert.equal(Game.state.rads, 0);
  assert.ok(!window.document.getElementById('game-screen').classList.contains('hidden'),
    'der Spielbildschirm bleibt verborgen');
});

test('Firebase-Fehlercodes kommen lesbar an', () => {
  const {window} = mitVersion;
  const {Network} = window;

  const faelle = [
    ['auth/network-request-failed', 'Kein Netz'],
    ['auth/wrong-password', 'Passwort falsch'],
    ['auth/invalid-email', 'E-Mail-Adresse'],
    ['auth/too-many-requests', 'Zu viele Versuche']
  ];
  for (const [code, teil] of faelle) {
    const text = Network.fehlerText({code, message: 'Firebase: Error (auth/...)'});
    assert.ok(text.includes(teil), `${code} ergab "${text}"`);
    assert.ok(!text.includes('auth/'), `${code} zeigt den rohen Code: "${text}"`);
  }

  const unbekannt = Network.fehlerText({code: 'auth/voellig-neu', message: 'x'});
  assert.ok(!unbekannt.includes('Script error'), 'unbekannter Code faellt auf Script error zurueck');
});

test('der Bericht nennt fremde Skripte beim Namen', () => {
  const {window} = ohneVersion;

  // So meldet Safari einen Fehler aus einem CDN-Skript.
  window.onerror('Script error.', 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    0, 0, null);

  const bericht = window.document.getElementById('crash-report-text').value;
  const overlay = window.document.getElementById('crash-overlay');

  assert.equal(overlay.style.display, 'flex', 'Crash-Overlay wurde nicht gezeigt');
  assert.ok(bericht.includes('fremden Skript'), 'der Bericht sagt nicht, dass es ein fremdes Skript war');
  assert.ok(bericht.includes('CORS'), 'der Bericht erklaert die fehlende Zeile nicht');
  assert.ok(bericht.includes('Firebase'), 'der Bericht nennt das fehlende CDN nicht');
});

test('die CDN-Skripte sind gegen stille Ausfaelle abgesichert', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const datei of ['firebase-app.js', 'firebase-auth.js', 'firebase-database.js']) {
    // Der Tag steht über zwei Zeilen - deshalb bis zum schließenden > lesen.
    const start = html.indexOf(datei);
    assert.ok(start > 0, `${datei} wird nicht geladen`);
    const tag = html.slice(start, html.indexOf('>', start) + 1);
    assert.ok(tag.includes('onerror='), `${datei} meldet einen Ladeausfall nicht: ${tag}`);
  }
});

test('der Boot hat einen Notausstieg', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  // Ein haengender Boot ist schlimmer als eine haessliche Fehlermeldung.
  assert.ok(html.includes('if (!bootBeendet)'), 'kein Notausstieg fuer den Boot gefunden');
  assert.ok(html.includes('bootBeendet'), 'Boot-Abschluss wird nicht gegen Doppelausfuehrung gesichert');
});

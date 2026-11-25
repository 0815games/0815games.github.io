// Das Patch-Werkzeug und die Update-Pruefung im Spiel.
//
// Zwei Dinge werden hier geprueft, und beide waren vorher nicht vorhanden:
//
//   1. tools/patch.mjs - der Stempel steht an zehn Stellen. Eine davon zu
//      vergessen ist im Spiel unsichtbar: Pages liefert dann die alte
//      stylesheet-Fassung, waehrend das Buendel neu ist. Getestet wird deshalb
//      nicht "ist die Funktion da", sondern ob ein Bump auf einer Kopie
//      wirklich jeden Anker bewegt und ob ein absichtlich stehen gelassener
//      Anker auffaellt.
//
//   2. src/ui/ui_update.js - das Neuladen. Ein Fehler hier ist teuer: ein
//      Reload mitten im Kampf oder vor einer bestaetigten Speicherung ist ein
//      verlorener Zug. Getestet wird, dass genau dann NICHT neu geladen wird.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

import {
  STAMP_ANCHORS, currentVersion, stampReport, planBump, applyBump, verifyBump,
  nextVersion, patchNotesReport
} from '../tools/patch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Eine Kopie ohne node_modules - cpSync wuerde sonst Sekunden bis Minuten
// damit verbringen, das Paketverzeichnis zu vervielfaeltigen.
function kopie() {
  const ziel = mkdtempSync(join(tmpdir(), 'pipboy-bump-'));
  cpSync(ROOT, ziel, {
    recursive: true,
    filter: quelle => !quelle.includes('node_modules') && !quelle.includes('/img/') && !quelle.includes('/.git/')
  });
  return ziel;
}

test('der Stempel steht auf allen Ankern gleich', () => {
  // Der Befund, der das Werkzeug ausgeloest hat: in v14.0.13 sagte
  // shell/Version "14.0.13" und build.json "14.0.12". Von Hand gepflegt,
  // von niemandem geprueft.
  const result = stampReport(ROOT);
  const abweichend = result.report.filter(anker => !anker.ok);
  assert.deepEqual(abweichend.map(a => a.label), [],
    `Anker ohne eindeutigen Wert: ${abweichend.map(a => a.label).join(', ')}`);
  assert.equal(result.versions.length, 1,
    `Der Baum traegt mehrere Versionen: ${result.versions.join(', ')}`);
  assert.ok(STAMP_ANCHORS.length >= 8,
    'Der Stempel steht an zu wenigen Stellen - ist ein Anker weggefallen?');
});

test('die Patch-Notizen nennen die laufende Version ganz oben', () => {
  // Sonst zeigt das Fenster im Spiel "NEU" fuer eine Version, die es nicht ist.
  const notes = patchNotesReport(ROOT);
  assert.deepEqual(notes.problems, []);
  assert.equal(notes.first, currentVersion(ROOT));
  assert.ok(notes.count >= 2, 'Zu wenige Eintraege - der Verlauf schrumpft');
});

test('eine Versionsnummer darf nicht rueckwaerts laufen', () => {
  const plan = planBump({root: ROOT, from: '14.0.13', to: '14.0.12'});
  assert.ok(plan.problems.some(p => /vor 14\.0\.13/.test(p)), plan.problems.join(' | '));
});

test('nextVersion zaehlt die letzte Stelle hoch', () => {
  assert.equal(nextVersion('14.0.13'), '14.0.14');
  assert.equal(nextVersion('14.9.9'), '14.9.10');
});

test('bump ohne --apply schreibt nichts', () => {
  // Ein Trockenlauf, der doch schreibt, ist die schlimmste Sorte Werkzeug:
  // man merkt es erst, wenn der Stempel schon halb gewandert ist.
  const datei = join(ROOT, 'shell', 'Version');
  const vorher = readFileSync(datei, 'utf8');
  const plan = planBump({root: ROOT, to: nextVersion(currentVersion(ROOT))});
  assert.deepEqual(plan.problems, []);
  assert.equal(readFileSync(datei, 'utf8'), vorher);
});

test('ein Bump auf einer Kopie bewegt jeden Anker', () => {
  const ziel = kopie();
  try {
    const alt = currentVersion(ziel);
    const neu = nextVersion(alt);
    const plan = planBump({root: ziel, to: neu});
    assert.deepEqual(plan.problems, [], plan.problems.join(' | '));
    applyBump(plan);

    // 1) shell/Version und die ausgelieferten JSON tragen die neue Nummer.
    assert.equal(currentVersion(ziel), neu);
    assert.match(readFileSync(join(ziel, 'package.json'), 'utf8'), new RegExp(`"version": "${neu}"`));

    // 2) Die QUELLE der Seite traegt den neuen Stempel. `index.html` im
    //    Wurzelverzeichnis ist erzeugt und bleibt bis zum Build alt - das ist
    //    der Sinn von verifyBump weiter unten.
    const quelle = readFileSync(join(ziel, 'shell', 'index.html'), 'utf8');
    assert.match(quelle, new RegExp(`<meta name="pipboy-build" content="${neu}">`),
      'Der Bump hat den Stempel in shell/index.html nicht bewegt');
    // Und die ausgelieferte Seite traegt noch den alten: der Build fehlt.
    const artefakt = readFileSync(join(ziel, 'index.html'), 'utf8');
    assert.match(artefakt, new RegExp(`app\\.js\\?v=${alt}`),
      'index.html wurde vom Bump mitgeschrieben - es ist ein Build-Artefakt');

    // 3) Der Changelog ist Protokoll und bleibt unangetastet - ausser die
    //    Importe, und die gibt es dort nicht.
    const log = readFileSync(join(ziel, 'docs/change.log'), 'utf8');
    assert.ok(log.includes(`## v${alt}`), 'Der alte Changelog-Eintrag wurde umgeschrieben');
    assert.ok(!log.includes(`## v${neu}`), 'Der Bump hat einen Changelog-Eintrag erfunden');

    // 4) build.json und Version sind Build-Artefakte: sie bleiben offen, bis
    //    der Build laeuft. Genau das meldet verifyBump, statt es zu verstecken.
    const offen = verifyBump({root: ziel, to: neu}).wrong.map(a => a.file);
    assert.ok(offen.includes('build.json'), 'verifyBump meldet das veraltete build.json nicht');
    assert.ok(offen.includes('Version'), 'verifyBump meldet die veraltete Version-Datei nicht');
  } finally {
    rmSync(ziel, {recursive: true, force: true});
  }
});

test('ein Bump, der einen Anker stehen laesst, faellt auf (bissfest)', () => {
  // Absichtlich kaputt: eine Kopie, in der index.html den Stempel nicht mehr
  // traegt. Genau dieser Zustand entstand in v14.0.13 von Hand.
  const ziel = kopie();
  try {
    const htmlDatei = join(ziel, 'index.html');
    writeFileSync(htmlDatei, readFileSync(htmlDatei, 'utf8')
      .replace(/<meta name="pipboy-build"[^>]*>\n?/, ''));

    const neu = nextVersion(currentVersion(ziel));
    const plan = planBump({root: ziel, to: neu});
    assert.deepEqual(plan.problems, []);
    applyBump(plan);
    const ergebnis = verifyBump({root: ziel, to: neu});
    assert.equal(ergebnis.ok, false, 'verifyBump haette den fehlenden Anker melden muessen');
    assert.ok(ergebnis.wrong.some(a => a.file === 'index.html'),
      `index.html fehlt in der Meldung: ${ergebnis.wrong.map(a => a.file).join(', ')}`);
  } finally {
    rmSync(ziel, {recursive: true, force: true});
  }
});

// ---------------------------------------------------------------------------
// Die Update-Pruefung im Browser (jsdom, kein Netz)
// ---------------------------------------------------------------------------

function umgebung({build = '14.0.13', server = '14.0.14', antwort = null} = {}) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head>
      <meta name="pipboy-build" content="${build}">
    </head><body>
      <div id="update-banner" hidden>
        <span id="update-banner-text"></span>
        <button id="update-banner-now" hidden></button>
        <button id="update-banner-later"></button>
      </div>
    </body></html>`, {
    url: 'https://example.test/PipBoy3000/',
    pretendToBeVisual: true,
    // Ohne diese Zeile gibt jsdom kein auswertbares Fenster her, und `var Game`
    // in window.eval() landet im Nichts statt im Spielkontext.
    runScripts: 'outside-only'
  });

  const abrufe = [];
  const fetcher = async (url) => {
    abrufe.push(url);
    if (antwort) return antwort();
    return {ok: true, text: async () => JSON.stringify({version: server})};
  };
  return {dom, window: dom.window, document: dom.window.document, fetcher, abrufe};
}

// ui_update.js ist ein ES-Modul. In der jsdom laeuft es so, wie es auch im
// Spiel laeuft: durch esbuild gebuendelt (derselbe Schritt wie in build.mjs),
// als klassisches Skript ausgewertet. Damit prueft der Test den ausgelieferten
// Code und keinen Nachbau - und die `export`-Zeilen sind kein Sonderfall.
async function ladeUpdateModul(umg) {
  const {build} = await import('esbuild');
  const quelle = readFileSync(join(ROOT, 'src/ui/ui_update.js'), 'utf8');
  const ergebnis = await build({
    stdin: {
      // Die Exporte werden nur fuer den Test ans Fenster gehaengt. Das
      // ausgelieferte Buendel (build.mjs) macht das nicht.
      contents: quelle + '\nwindow.__updateApi = {createUpdateUI, updateBlockers};',
      resolveDir: join(ROOT, 'src/ui'),
      loader: 'js'
    },
    bundle: true, format: 'iife', write: false, target: ['es2020'], logLevel: 'silent'
  });
  // write:false liefert outputFiles, nicht `code`. Ohne das hier waere der
  // Test gruen, weil `undefined` sich still auswerten laesst.
  const code = ergebnis.outputFiles[0].text;
  assert.ok(code.includes('window.__updateApi'), 'Das Testbuendel hat die Exporte nicht angehaengt');
  const {window} = umg;
  window.UI = window.UI || {};
  window.eval(code);
  return window;
}

test('die Update-Pruefung laedt bei einem offenen Dialog nicht neu', async () => {
  // Der teure Fall: Spieler liest gerade eine Item-Beschreibung, die Seite
  // laedt sich neu, der Dialog ist weg. Deshalb wird hier der Blocker geprueft,
  // bevor der Reload ausgeloest wird.
  const umg = umgebung({server: '14.0.14'});
  const {window, document} = umg;
  await ladeUpdateModul(umg);

  // Ein Spielstand mit offenem Dialog.
  window.eval(`
    var Game = { state: { inDialog: true }, isDirty: false, saveTimer: null };
    var Combat = { enemy: null };
  `);

  window.__fetcher = umg.fetcher;
  const ui = window.eval("window.__updateApi.createUpdateUI({document: window.document, window: window, fetcher: window.__fetcher})");
  assert.ok(ui, 'createUpdateUI hat nichts zurueckgegeben - fehlt das Meta-Tag?');

  // Bei offenem Dialog: Blocker melden den Grund ...
  assert.deepEqual([...window.eval('window.__updateApi.updateBlockers()')], ['dialog']);

  // ... und die Pruefung laedt nicht neu, sondern wartet. Der Zustand ist die
  // Zusage an den Spieler: der Balken nennt den Grund, statt zu springen.
  assert.equal(await ui.pruefen(), true, 'Die neue Version wurde nicht erkannt');
  assert.deepEqual([...ui.zustand.blocker], ['dialog']);
  // Der Balken nennt den Grund, nicht die Version: "warte, weil" ist die
  // Information, die der Spieler braucht. Die Version steht im Zustand.
  const text = document.getElementById('update-banner-text').textContent;
  assert.match(text, /Dialog offen/, `Balken nennt den Grund nicht: ${text}`);
  assert.equal(ui.zustand.build, '14.0.14');
  assert.equal(document.getElementById('update-banner-now').hidden, true,
    'Der JETZT-LADEN-Knopf darf bei offenem Dialog nicht angeboten werden');
});

test('ein laufender Kampf und eine offene Speicherung blockieren ebenfalls', async () => {
  const umg = umgebung();
  const {window} = umg;
  await ladeUpdateModul(umg);
  window.eval(`
    var Game = { state: { inDialog: false }, isDirty: true, saveTimer: null };
    var Combat = { enemy: { name: 'Ghul' } };
  `);
  assert.deepEqual([...window.eval('window.__updateApi.updateBlockers()')], ['speichert', 'kampf']);

  window.eval('Game.isDirty = false; Combat.enemy = null;');
  assert.deepEqual([...window.eval('window.__updateApi.updateBlockers()')], [],
    'Ohne Dialog, Speicherung und Kampf muss neu geladen werden duerfen');
});

test('die Pruefung erkennt eine neuere Version auf dem Server', async () => {
  // Die eigentliche Aufgabe. Ohne diesen Test waere "Update" nur ein Knopf.
  const umg = umgebung({build: '14.0.13', server: '14.0.14'});
  const {window, document} = umg;
  window.__fetcher = umg.fetcher;
  await ladeUpdateModul(umg);
  window.eval(`
    var Game = { state: null, isDirty: false, saveTimer: null };
    var Combat = { enemy: null };
  `);

  const ui = window.eval("window.__updateApi.createUpdateUI({document: window.document, window: window, fetcher: window.__fetcher})");
  const veraltet = await ui.pruefen();

  assert.equal(veraltet, true, 'Eine neuere Version wurde nicht erkannt');
  assert.equal(ui.zustand.build, '14.0.14');
  const balken = document.getElementById('update-banner');
  assert.equal(balken.hidden, false, 'Der Hinweis-Balken bleibt unsichtbar');
  assert.match(document.getElementById('update-banner-text').textContent, /14\.0\.14/);
  // Jede Anfrage traegt einen eigenen Cache-Brecher - sonst liefert der Proxy
  // die alte build.json und das Update wird nie erkannt.
  assert.ok(umg.abrufe[0].includes('probe='), `Anfrage ohne Cache-Brecher: ${umg.abrufe[0]}`);
});

test('bei gleicher Version bleibt der Balken weg', async () => {
  const umg = umgebung({build: '14.0.13', server: '14.0.13'});
  const {window, document} = umg;
  window.__fetcher = umg.fetcher;
  await ladeUpdateModul(umg);
  window.eval('var Game = { state: null }; var Combat = {};');
  const ui = window.eval("window.__updateApi.createUpdateUI({document: window.document, window: window, fetcher: window.__fetcher})");
  assert.equal(await ui.pruefen(), false);
  assert.equal(document.getElementById('update-banner').hidden, true);
});

test('ein kaputter Server-Abruf fuehrt nicht zum Neuladen', async () => {
  // Ein Netzfehler darf kein Reload ausloesen - sonst laedt sich das Spiel im
  // Funkloch in einer Schleife selbst neu.
  const umg = umgebung({antwort: () => ({ok: false, text: async () => ''})});
  const {window, document} = umg;
  window.__fetcher = umg.fetcher;
  await ladeUpdateModul(umg);
  window.eval('var Game = { state: null }; var Combat = {};');
  const ui = window.eval("window.__updateApi.createUpdateUI({document: window.document, window: window, fetcher: window.__fetcher})");
  assert.equal(await ui.pruefen(), false);
  assert.equal(ui.zustand.art, 'unerreichbar');
  // Der Balken sagt es, statt still zu bleiben: sonst glaubt der Spieler,
  // es sei geprueft worden.
  assert.equal(document.getElementById('update-banner').hidden, false);
  assert.match(document.getElementById('update-banner-text').textContent, /NICHT ERREICHBAR/);
  assert.equal(document.getElementById('update-banner-now').hidden, true);
});

test('die Seite traegt den Build-Stempel und laedt das Buendel mit Version', () => {
  // Ohne Meta-Tag hat die Update-Pruefung keinen Bezugspunkt, und ein ?v= am
  // Buendel ohne Stempel ist ein Cache-Brecher ohne Gedaechtnis.
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const version = currentVersion(ROOT);
  assert.match(html, new RegExp(`<meta name="pipboy-build" content="${version}">`),
    'Build-Stempel fehlt oder ist veraltet');
  assert.ok(html.includes(`app.js?v=${version}`), 'app.js wird ohne Version geladen');
  assert.ok(existsSync(join(ROOT, 'build.json')), 'build.json fehlt - die Pruefung haette kein Ziel');
});

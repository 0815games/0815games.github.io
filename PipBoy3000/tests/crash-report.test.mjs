// Crash-Bericht: was drinsteht, wenn es schiefgeht.
//
// Ausloeser war ein Bericht vom iPhone (2026-11-25): "Script error.", keine
// Zeile, kein Stack - und ein LEERER Log-Puffer. Der Puffer war seit jeher
// tot, weil captureLog() nirgends aufgerufen wurde. Ohne Inhalt ist der
// Bericht wertlos: er sagt, dass etwas kaputt ist, aber nicht was.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HUELLE = readFileSync(join(ROOT, 'shell/index.html'), 'utf8');
const SEITE = readFileSync(join(ROOT, 'index.html'), 'utf8');

test('der Log-Puffer wird wirklich gefuellt', () => {
  // Die Ursache des leeren Puffers: captureLog existierte, rief aber niemand.
  assert.match(HUELLE, /window\.captureLog = captureLog/, 'captureLog ist nicht global');
  assert.match(HUELLE, /for \(const stufe of \['log', 'warn', 'error'\]\)/,
    'die Konsole wird nicht mitgeschrieben - der Puffer bliebe wieder leer');
  assert.match(HUELLE, /if \(window\.logBuffer\.length > 50\) window\.logBuffer\.shift\(\)/,
    'der Puffer waechst ohne Grenze - auf dem iPhone ist Speicher knapp');
});

test('der Bericht nennt die letzte Aktion und das Geraet', () => {
  // Bei einem Fehler aus fremdem Skript gibt es keinen Stack. Der letzte
  // Bedienschritt ist dann die einzige Spur.
  assert.match(HUELLE, /Letzte Aktion: \$\{window\.letzteAktion \|\| 'keine erfasst'\}/);
  assert.match(HUELLE, /window\.merkeAktion = function/);
  assert.match(HUELLE, /Geraetepixel: \$\{window\.devicePixelRatio/);
});

test('ein leerer Puffer wird als solcher benannt', () => {
  // "=== LOG BUFFER (LAST 10) ===" mit nichts darunter sah nach einem
  // Formatfehler aus, nicht nach einem Befund.
  assert.match(HUELLE, /\(leer - Fehler trat vor dem ersten Logeintrag auf\)/);
});

test('ein fehlgeschlagenes CDN-Skript landet im Bericht', () => {
  // Die onerror-Attribute setzten window.scriptLoadError, gelesen hat es
  // niemand.
  assert.match(HUELLE, /if \(window\.scriptLoadError\) fehlt\.push/);
});

test('UI.init kann die Login-Seite nicht mehr unsichtbar machen', () => {
  // Der Boot wartet auf scriptsLoaded. Starb UI.init vorher, blieb die
  // Boot-Sequenz stehen und der Login erschien nie - auf dem iPhone ein
  // schwarzer Bildschirm ohne Bericht.
  // Die Marker stehen nur in der Quelle, der Build ersetzt sie durch den
  // try/catch-Block. Geprueft wird deshalb die fertige Seite - dort muss der
  // Block stehen, nicht der Marker.
  assert.ok(!SEITE.includes('// BUILD:LOADER-START'),
    'der Marker steht noch in index.html - der Build hat ihn nicht ersetzt');

  const block = SEITE.slice(SEITE.indexOf('window.captureLog(\'PHASE\', \'app.js ausgewertet'));
  assert.ok(block.length > 0, 'der Phasenblock fehlt in index.html');
  const bisEnde = block.slice(0, block.indexOf('scriptsLoaded = true;'));

  assert.match(bisEnde, /try \{/, 'UI.init laeuft ohne try/catch');
  assert.match(bisEnde, /catch \(fehler\)/, 'kein catch um UI.init');
  assert.match(bisEnde, /UI\.init: /, 'der Fehler wird nicht protokolliert');
  // Wichtig: scriptsLoaded steht NACH dem try/catch, nicht darin - sonst
  // bliebe der Boot bei einem Fehler wieder haengen.
  const nachCatch = SEITE.slice(SEITE.indexOf('UI.init fertig, Boot wird freigegeben'));
  assert.match(nachCatch.slice(0, 200), /scriptsLoaded = true;/,
    'scriptsLoaded wird bei einem Fehler in UI.init nicht gesetzt');
});

test('jede Phase des Starts steht im Puffer', () => {
  const phasen = SEITE.match(/captureLog\('PHASE'/g) || [];
  assert.ok(phasen.length >= 2,
    `nur ${phasen.length} Phaseneintraege - im Bericht waere der Startablauf unsichtbar`);
});

test('die Huelle ist weiterhin gueltiges HTML mit einem Kopf', () => {
  // Der Bericht kam mit SCREEN: 440x796 - die Seite war also geladen, nicht
  // leer. Ein zerbrochener Kopf wuerde anders aussehen.
  assert.match(SEITE, /<meta name="viewport"/);
  assert.match(SEITE, /id="crash-overlay"/);
  assert.match(SEITE, /id="crash-report-text"/);
  assert.ok(SEITE.includes('</html>'));
});

test('ein zweites onload startet das Spiel nicht erneut', () => {
  // Kommt vor, wenn eine Erweiterung oder ein Preload die Seite nachlaedt.
  // Ein zweiter UI.init wuerde den Boot doppelt starten und die
  // Ereignisbehandlung doppelt haengen.
  assert.match(SEITE, /if \(window\._bootGestartet\)/, 'kein Schutz gegen doppeltes onload');
  assert.match(SEITE, /onload lief ein zweites Mal/, 'der zweite Lauf wird nicht protokolliert');
});

// Gestaltung: Schrift, Farben und die Klassen, die es wirklich gibt.
//
// Anlass war eine Rueckmeldung nach v14.0.12: "die Schrift ist ueberall im
// Spiel mittlerweile unterschiedlich - geh das ganze durch" und "aktuell
// falsche Schrift und weiss?".
//
// Gefunden wurden drei Ursachen, alle unsichtbar, solange niemand den
// ausgelieferten CSS-Stand gegen den Quellcode haelt:
//
//   1. `font-vt323` stand an 22 Stellen im Quellcode und war NIRGENDS
//      definiert (Tailwind erzeugt nur Klassen aus seiner Konfiguration).
//      Diese Stellen fielen auf die System-Sans zurueck.
//   2. `.glow-text`, `.text-shadow-glow`, `.text-shadow-md` und drei weitere
//      Leucht-Klassen waren ebenfalls nirgends definiert - jede Ueberschrift,
//      die leuchten sollte, leuchtete nicht.
//   3. Weiss (`text-white`) kam an 20 Stellen vor. Im Pip-Boy-Entwurf gibt es
//      kein Weiss: die Skala ist schwarz -> dunkelgruen -> #39ff14 -> gelb
//      (Warnung) -> rot (Gefahr).
//
// Dieser Test prueft alle drei Punkte gegen die ausgelieferten Dateien.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

// Alle Stellen, an denen Klassen im Quellcode stehen.
function quelle() {
  const dateien = [
    ...readdirSync(join(ROOT, 'src/ui')).map(f => ['src/ui', f]),
    ...readdirSync(join(ROOT, 'templates')).map(f => ['templates', f])
  ];
  return dateien.map(([ordner, f]) => ({pfad: `${ordner}/${f}`, text: read(ordner, f)}));
}

// Alle Klassentokens aus class="...". Template-Ausdruecke (${...}) werden
// uebersprungen - sie sind zur Bauzeit noch nicht bekannt.
function klassen(text) {
  const raus = new Set();
  for (const m of text.matchAll(/class="([^"]+)"/g)) {
    for (const roh of m[1].split(/\s+/)) {
      if (!roh || roh.includes('$') || roh.includes("'")) continue;
      if (!/^[a-z][a-z0-9:_/[\]]#.%()-]*$/i.test(roh)) continue;
      raus.add(roh);
    }
  }
  return raus;
}

const CSS = () => read('app.css') + read('style.css') + read('index.html');

test('jede benutzte Klasse hat eine Regel', () => {
  // Sehr wirksam gegen Tippfehler und Klassen, die es nie gab. Die Ausnahmen
  // sind Sprechmarken fuer JavaScript (nur Auswahl, keine Gestaltung).
  const AUSNAHME = new Set(['vats-hp-num', 'vats-hp-overlay']);
  const css = CSS();
  const fehlend = [];

  for (const {pfad, text} of quelle()) {
    for (const klasse of klassen(text)) {
      if (AUSNAHME.has(klasse)) continue;
      // Tailwind maskiert Sonderzeichen im Selektor (# : [ ] / . %).
      const maskiert = klasse.replace(/[.*+?^${}()|[\]\\/:%#[\]]/g, m => '\\' + m);
      if (!css.includes('.' + klasse) && !css.includes('.' + maskiert)) {
        fehlend.push(`${pfad}: ${klasse}`);
      }
    }
  }
  assert.deepEqual([...new Set(fehlend)], [],
    `Klassen ohne CSS-Regel:\n  ${[...new Set(fehlend)].join('\n  ')}`);
});

test('die Terminal-Schrift ist der Standard, nicht die Ausnahme', () => {
  const css = read('style.css');

  // Ohne diese Regel auf den Formularelementen setzt der Browser dort seine
  // eigene Schrift - und ein Button sieht anders aus als sein Nachbar.
  const grundlage = css.slice(css.indexOf('--- SCHRIFT ---'), css.indexOf('--- LEUCHTEN ---'));
  for (const element of ['html', 'body', 'button', 'input', 'select', 'textarea']) {
    assert.ok(grundlage.includes(element), `${element} fehlt in der Schrift-Grundlage`);
  }
  assert.match(grundlage, /VT323/, 'VT323 fehlt in der Schrift-Grundlage');

  // Und die Utility, die im Quellcode 22-mal steht, muss existieren.
  assert.match(css, /\.font-vt323\s*\{[^}]*VT323/, '.font-vt323 ist nicht definiert');

  // Tailwinds eigene Schrift-Klassen duerfen nicht danebenlaufen. Zwei Faelle:
  //  - die Klasse wird benutzt -> ihre Regel muss auf VT323 zeigen
  //  - die Klasse wird nirgends benutzt -> Tailwind erzeugt sie gar nicht,
  //    dann gibt es auch nichts zu pruefen (font-sans ist seit dem Umbau
  //    nirgends mehr im Quellcode, die Schrift kommt aus style.css).
  const app = read('app.css');
  for (const klasse of ['font-sans', 'font-mono']) {
    const imQuellcode = quelle().some(({text}) => new RegExp(`\\b${klasse}\\b`).test(text));
    const regel = app.match(new RegExp(`\\.${klasse}\\s*\\{([^}]*)\\}`));
    if (!imQuellcode) {
      assert.equal(regel, null, `.${klasse} wird nirgends benutzt, steht aber in app.css`);
      continue;
    }
    assert.ok(regel, `.${klasse} wird benutzt, hat aber keine Regel in app.css`);
    assert.match(regel[1], /VT323/, `.${klasse} zeigt nicht auf VT323`);
  }
});

test('die Leucht-Klassen existieren wirklich', () => {
  // Das Leuchten ist das Erkennungsmerkmal eines CRT-Pip-Boy. Sechs Klassen
  // standen im Quellcode, ohne dass es sie gab.
  const css = read('style.css');
  for (const klasse of ['glow-text', 'text-shadow-glow', 'text-shadow-md',
                        'text-shadow-gold', 'text-shadow-red', 'text-shadow-lg']) {
    assert.match(css, new RegExp(`\\.${klasse}\\s*\\{`), `.${klasse} hat keine Regel`);
  }
});

test('auch die Zeichenflaeche benutzt VT323', () => {
  // Die Karte und das Kampffeld beschriften sich selbst per ctx.font. Dort
  // stand `monospace`/`sans-serif` - das ist die Systemschrift des Browsers,
  // nicht VT323. Auf der Karte war die Schrift deshalb als einzige Stelle im
  // Spiel eine andere.
  const treffer = [];
  for (const datei of ['src/game/game_core.js', 'src/game/game_render.js', 'src/ui/ui_view_world.js']) {
    const text = read(datei);
    // Zuweisungen in einem Rutsch lesen (sie koennen zusammengesetzt sein:
    // ctx.font = "bold " + groesse + "px VT323, monospace").
    for (const m of text.matchAll(/ctx\.font\s*=\s*([^;\n]+)/g)) {
      if (!m[1].includes('VT323')) treffer.push(`${datei}: ${m[1].trim()}`);
    }
    assert.ok(!/sans-serif/.test(text), `${datei} benutzt sans-serif`);
  }
  assert.deepEqual(treffer, [], `Zeichenflaeche ohne VT323:\n  ${treffer.join('\n  ')}`);
});

test('kein Weiss in den Ansichten', () => {
  // Weiss kommt im Entwurf nicht vor. Rot und Gelb tragen Warnungen, alles
  // andere ist gruen - in Stufen.
  const treffer = [];
  for (const {pfad, text} of quelle()) {
    for (const m of text.matchAll(/\btext-white\b/g)) {
      // hover:text-white waere derselbe Bruch, deshalb zaehlt beides.
      treffer.push(`${pfad}: ${text.slice(Math.max(0, m.index - 40), m.index + 20).split('\n').pop().trim()}`);
    }
  }
  assert.deepEqual(treffer, [], `weisse Schrift:\n  ${treffer.join('\n  ')}`);

  // Auch kein Weiss als Flaeche hinter Text.
  for (const {pfad, text} of quelle()) {
    assert.ok(!/hover:bg-white/.test(text), `${pfad}: hover:bg-white`);
  }
});

test('die Item-Bilder im Ausruestungs-Dialog haengen nicht an der gespeicherten ID', () => {
  // Rueckmeldung: "beim Anklicken der Gegenstaende am Charakter ist kein Bild
  // erkennbar". Alte Spielstaende tragen in state.equip die Katalogdefinition
  // - ohne id-Feld. Der Dialog muss die ID notfalls ueber den Namen finden,
  // und Game.init muss den Stand beim Laden reparieren.
  const dialog = read('src/ui', 'ui_render_overlays.js');
  const stelle = dialog.slice(dialog.indexOf('showEquippedDialog'));
  const rumpf = stelle.slice(0, stelle.indexOf('overlay.appendChild(box)'));
  assert.match(rumpf, /item\.id\s*\|\|/,
    'showEquippedDialog verlaesst sich auf item.id - bei alten Spielstaenden ist das undefined');
  assert.match(rumpf, /Game\.items\[k\]\.name === item\.name/,
    'kein Rueckfall ueber den Namen');

  const kern = read('src/game', 'game_core.js');
  assert.match(kern, /heileAusruestung: function/, 'Game.heileAusruestung fehlt');
  assert.match(kern, /this\.heileAusruestung\(\)/, 'heileAusruestung wird beim Laden nicht aufgerufen');
});

// Navigation: Marker auf der Karte, Bestaetigung, Richtungspfeil.
//
// Die Frage war: "lang klicken oder nachfragen? oder marker setzen und dann
// knopf fuer bestaetigen?" - entschieden wurde Marker + Bestaetigung, weil die
// Karte mit einem Finger GEZOGEN und mit zwei Fingern GEZOOMT wird. Ohne
// Rueckfrage waere jedes Ende einer Ziehbewegung ein Ziel.
//
// Genau das pruefen die Tests: dass Ziehen keinen Marker setzt, dass ein Klick
// einen setzt, dass ohne Bestaetigung nichts gilt - und dass die Nadel in die
// richtige Richtung dreht. Ein Pfeil, der in die falsche Richtung zeigt, ist
// schlimmer als keiner: er schickt den Spieler in die Irre.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

// ui_navigation.js ist eine Browsermoduldatei ohne Export; sie haengt alles an
// window.Navigation und window.UI. Deshalb wird sie im jsdom-Fenster
// ausgewertet - auf denselben Code, der ausgeliefert wird, kein Nachbau.
function mitNavigation(body, {spieler = {sektor: {x: 3, y: 4}, feld: {x: 10, y: 10}}} = {}) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="val-sector-display"></div>
      <button id="nav-pfeil" style="display:none">
        <canvas width="26" height="26"></canvas><span data-nav-text></span>
      </button>
      <div id="nav-bestaetigung" style="display:none">
        <span id="nav-bestaetigung-ziel"></span>
        <span id="nav-bestaetigung-weg"></span>
        <button id="nav-bestaetigung-ok"></button>
      </div>
    </body></html>`, {url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.eval(read('src/ui', 'ui_navigation.js'));
  // Ein minimaler Spielstand. Mehr braucht die Navigation nicht - sie rechnet
  // aus Sektor, Feld und Ziel, und das ist der ganze Zustand.
  w.eval(`
    var Game = {
      state: {
        sector: {x: ${spieler.sektor.x}, y: ${spieler.sektor.y}},
        player: {x: ${spieler.feld.x}, y: ${spieler.feld.y}},
        nav: null
      },
      MAP_W: 50, MAP_H: 50, WORLD_W: 16, WORLD_H: 16,
      saveGame: function() {}
    };
    var UI = { mapState: {scale: 3, offsetX: 0, offsetY: 0, needsRender: false},
               log: function(){} };
  `);
  // body ist ein Funktionsausdruck im jsdom-Fenster. Fuer Tests, die den DOM
  // direkt pruefen, entfaellt er - sonst muesste man dort eine leere Funktion
  // uebergeben und wuerde beim Lesen raten, warum.
  const ergebnis = body ? w.eval(`(${body})()`) : undefined;
  return {dom, w, document: dom.window.document, ergebnis};
}

// ---------------------------------------------------------------------------
// Rechnung
// ---------------------------------------------------------------------------

test('die Peilung dreht im Uhrzeigersinn ab Norden', () => {
  // 0 Grad = Norden, 90 = Osten, 180 = Sueden, 270 = Westen. Genau das erwartet
  // `transform: rotate()` und genau das erwartet ein Leser der Nadel.
  const {ergebnis} = mitNavigation(`() => ({
    nord: Navigation.peilung(0, -100),
    ost: Navigation.peilung(100, 0),
    sued: Navigation.peilung(0, 100),
    west: Navigation.peilung(-100, 0)
  })`);
  assert.equal(Math.round(ergebnis.nord), 0);
  assert.equal(Math.round(ergebnis.ost), 90);
  assert.equal(Math.round(ergebnis.sued), 180);
  assert.equal(Math.round(ergebnis.west), 270);
});

test('Himmelsrichtungen sind deutsch (O, nicht E)', () => {
  // Der Kompass auf der Karte beschriftet mit N/S/W/O. Eine Nadel, die "E"
  // sagt, waehrend der Kompass "O" sagt, ist ein Fehler, den man erst im
  // Spiel sieht.
  const {ergebnis} = mitNavigation(`() => [0,45,90,135,180,225,270,315].map(Navigation.himmelsrichtung)`);
  // Array aus der jsdom-Realm: ueber die Werte vergleichen, nicht die Referenz.
  assert.deepEqual([...ergebnis], ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']);
});

test('die Entfernung zaehlt in Feldern, ein Sektor sind 50', () => {
  const {ergebnis} = mitNavigation(`() => ({
    einSektor: Navigation.entfernung({x:0,y:0},{x:1,y:0}),
    dreiVier: Navigation.entfernung({x:0,y:0},{x:3,y:4})
  })`);
  assert.equal(ergebnis.einSektor, 50);
  assert.equal(ergebnis.dreiVier, 250); // 3-4-5-Dreieck, mal 50
});

test('ein Kartenklick wird in Sektor und Feld umgerechnet', () => {
  // Die Karte zeichnet Felder mit `scale` Pixeln ab `offsetX`. Ohne diese
  // Umrechnung waere der Marker ein Pixel und das Ziel ein Sektor.
  const {ergebnis} = mitNavigation(`() => Navigation.klickZuSektor(
    150, 300, {scale: 3, offsetX: 0, offsetY: 0}, 50, 50)`);
  // 150px / 3 = Feld 50 -> Sektor 1, Feld 0.  300px / 3 = Feld 100 -> Sektor 2.
  assert.equal(ergebnis.sektorX, 1);
  assert.equal(ergebnis.sektorY, 2);
  assert.equal(ergebnis.feldX, 0);
  assert.equal(ergebnis.feldY, 0);
});

// ---------------------------------------------------------------------------
// Ziel setzen
// ---------------------------------------------------------------------------

test('ohne gesetztes Ziel gibt es keine Richtung', () => {
  const {ergebnis} = mitNavigation(`() => ({stand: Navigation.stand(), richtung: Navigation.richtung()})`);
  assert.equal(ergebnis.stand, null);
  assert.equal(ergebnis.richtung, null);
});

test('das Ziel liegt im Spielstand, nicht nur im Speicher', () => {
  // Sonst waere die Navigation nach einem Neuladen weg - und ein Ziel, das man
  // muehsam gesetzt hat, ist genau das, was man behalten will.
  const {ergebnis} = mitNavigation(`() => {
    Navigation.setzen(7, 2);
    return {stand: Game.state.nav, richtung: Navigation.richtung()};
  }`);
  assert.equal(ergebnis.stand.x, 7);
  assert.equal(ergebnis.stand.y, 2);
  // Von Sektor [3,4] Feld (10,10) nach Sektor [7,2] MITTE (7.5, 2.5):
  // 4.3 Sektoren nach Osten, 1.7 nach Norden. Das sind rund 68 Grad. Die
  // Himmelsrichtung rastert auf 45er-Schritte: NO deckt 22.5-67.5, O deckt
  // 67.5-112.5 ab. Bei 68 ist O die richtige Antwort - die Erwartung "NO"
  // war die falsche, nicht der Code.
  assert.equal(ergebnis.richtung.himmel, 'O');
  assert.ok(ergebnis.richtung.grad > 60 && ergebnis.richtung.grad < 75,
    `Peilung unerwartet: ${ergebnis.richtung.grad}`);
  assert.ok(ergebnis.richtung.sektoren > 4.5 && ergebnis.richtung.sektoren < 4.7,
    `Entfernung unerwartet: ${ergebnis.richtung.sektoren}`);
});

test('im Zielsektor meldet die Navigation "angekommen"', () => {
  const {ergebnis} = mitNavigation(`() => {
    Navigation.setzen(3, 4);
    return Navigation.angekommen();
  }`);
  assert.equal(ergebnis, true);
});

test('ein Sektor weiter ist nicht angekommen', () => {
  const {ergebnis} = mitNavigation(`() => {
    Navigation.setzen(3, 5);
    return Navigation.angekommen();
  }`);
  assert.equal(ergebnis, false);
});

// ---------------------------------------------------------------------------
// Der Pfeil
// ---------------------------------------------------------------------------

test('der Pfeil erscheint nur mit Ziel und nennt Richtung und Sektoren', () => {
  const {ergebnis} = mitNavigation(`() => {
    Navigation.aktualisiere();
    const ohneZiel = document.getElementById('nav-pfeil').style.display;
    Navigation.setzen(6, 4);   // direkt oestlich von [3,4]
    Navigation.aktualisiere();
    const mitZiel = document.getElementById('nav-pfeil').style.display;
    return {
      ohneZiel, mitZiel,
      text: document.querySelector('[data-nav-text]').textContent,
      titel: document.getElementById('nav-pfeil').title
    };
  }`);
  assert.equal(ergebnis.ohneZiel, 'none', 'Ohne Ziel muss der Pfeil versteckt sein');
  assert.equal(ergebnis.mitZiel, 'flex');
  assert.match(ergebnis.text, /^O 3/, `Richtung oestlich erwartet: ${ergebnis.text}`);
  assert.match(ergebnis.titel, /\[6, 4\]/);
});

test('im Ziel zeigt der Pfeil keine Richtung mehr, sondern das Ziel', () => {
  // Eine Nadel, die in eine Richtung zeigt, die es nicht mehr gibt, ist eine
  // Luege. Im Ziel steht dort "ZIEL" und ein Ring.
  const {ergebnis} = mitNavigation(`() => {
    Navigation.setzen(3, 4);
    Navigation.aktualisiere();
    return document.querySelector('[data-nav-text]').textContent;
  }`);
  assert.equal(ergebnis, 'ZIEL');
});

test('die Nadel dreht mit der Richtung (nicht nur der Text)', () => {
  // Der eigentliche Punkt der Aufgabe: "dynamisch drehend in die Richtung, in
  // die man will". Geprueft wird die Drehung selbst - dafuer wird der
  // Canvas-Kontext abgefangen und der Rotationswinkel mitgeschrieben.
  const {ergebnis} = mitNavigation(`() => {
    const gemessen = [];
    const echteKreation = document.createElement.bind(document);
    // Jede Leinwand bekommt einen Kontext, der nur die Drehung notiert.
    const proto = window.HTMLCanvasElement.prototype;
    proto.getContext = function() {
      return {
        save(){}, restore(){}, translate(){}, clearRect(){},
        beginPath(){}, moveTo(){}, lineTo(){}, closePath(){},
        fill(){}, stroke(){}, arc(){}, setLineDash(){},
        set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
        set shadowColor(v){}, set shadowBlur(v){},
        rotate(winkel){ gemessen.push(Math.round(winkel * 180 / Math.PI)); }
      };
    };
    // Erwartung aus derselben Rechnung ableiten, die der Test pruefen soll -
    // aber unabhaengig: Mitte des Zielsektors gegen Feld des Spielers.
    const faelle = [];
    for (const [x, y, name] of [[6,4,'Ost'], [4,4,'OstNah'], [3,1,'Nord'], [3,6,'Sued'], [0,4,'West']]) {
      gemessen.length = 0;
      Navigation.setzen(x, y);
      Navigation.aktualisiere();
      faelle.push({name, grad: gemessen[0], erwartet: Math.round((Math.atan2((x + 0.5) - 3.2, -((y + 0.5) - 4.2)) * 180 / Math.PI + 360) % 360)});
    }
    return faelle;
  }`);
  // Jede Drehung muss der unabhaengig gerechneten Peilung entsprechen. Ein
  // Pfeil, der zwei Grad daneben liegt, ist egal; einer, der in den falschen
  // Quadranten zeigt, schickt den Spieler in die Irre.
  for (const fall of ergebnis) {
    const abweichung = Math.abs(((fall.grad - fall.erwartet) + 540) % 360 - 180);
    assert.ok(abweichung <= 3,
      `${fall.name}: Nadel ${fall.grad}°, erwartet ${fall.erwartet}° (Abweichung ${abweichung}°)`);
  }
  // Und die groben Quadranten stimmen, damit die Rechnung oben nicht selbst
  // falsch sein kann.
  const grad = name => ergebnis.find(f => f.name === name).grad;
  assert.ok(grad('OstNah') > 60 && grad('OstNah') < 120, `OstNah: ${grad('OstNah')}°`);
  assert.ok(grad('Sued') > 150 && grad('Sued') < 210, `Sued: ${grad('Sued')}°`);
  assert.ok(grad('West') > 240 && grad('West') < 300, `West: ${grad('West')}°`);
});

test('eine fehlende Leinwand laesst die Anzeige nicht abstuerzen', () => {
  // aktualisiere() laeuft in UI.update(), also nach jedem Zug. Ein Fehler hier
  // waere ein Fehler nach jedem Schritt.
  const {ergebnis} = mitNavigation(`() => {
    document.getElementById('nav-pfeil').querySelector('canvas').remove();
    Navigation.setzen(5, 5);
    try { Navigation.aktualisiere(); return 'ok'; } catch (e) { return 'abgestuerzt: ' + e.message; }
  }`);
  assert.equal(ergebnis, 'ok');
});

// ---------------------------------------------------------------------------
// Marker und Bestaetigung
// ---------------------------------------------------------------------------

test('die Sektor-Anzeige nennt das Ziel und vergisst es beim Aufheben', () => {
  // Die Anzeige gehoert zur Navigation: sie nennt das Ziel, der Pfeil daneben
  // zeigt hin. Zwei Stellen fuer eine Zeile laufen auseinander - genau das war
  // der Fehler beim Aufheben.
  const {w} = mitNavigation(null);
  w.eval('Game.state.sector = {x:3, y:4};');
  const anzeige = w.document.getElementById('val-sector-display');

  w.eval('Navigation.aktualisiere()');
  assert.match(anzeige.textContent, /SEKTOR \[3,4\]/,
    `Ohne Ziel erwartet "SEKTOR [3,4]", stand da: "${anzeige.textContent}"`);

  w.eval('Navigation.setzen(7, 2); Navigation.aktualisiere();');
  assert.match(anzeige.textContent, /\[3,4\]/, 'Der eigene Sektor fehlt in der Anzeige');
  assert.match(anzeige.textContent, /\[7,2\]/, 'Das Ziel fehlt in der Anzeige');

  w.eval('Navigation.loeschen(); Navigation.aktualisiere();');
  assert.doesNotMatch(anzeige.textContent, /\[7,2\]/,
    `Das aufgehobene Ziel steht noch in der Anzeige: "${anzeige.textContent}"`);
  assert.match(anzeige.textContent, /SEKTOR \[3,4\]/);

  // Der versteckte Pfeil behaelt keinen alten Text. Sonst stuende beim
  // naechsten Ziel kurz die vorige Auskunft da.
  const pfeilText = w.document.querySelector('#nav-pfeil [data-nav-text]');
  assert.equal(pfeilText.textContent, '',
    `Der versteckte Pfeil nennt noch "${pfeilText.textContent}"`);
});

test('ein Klick setzt einen Marker, aber noch kein Ziel', () => {
  // Das ist die Antwort auf "lang klicken oder nachfragen?": nachfragen.
  // Ohne Bestaetigung darf Game.state.nav leer bleiben.
  const {ergebnis} = mitNavigation(`() => {
    UI.mapState = {scale: 3, offsetX: 0, offsetY: 0, needsRender: false};
    Navigation.markerSetzen(150, 300);
    return {
      marker: Navigation.marker,
      ziel: Navigation.stand(),
      feldSichtbar: document.getElementById('nav-bestaetigung').style.display,
      zielText: document.getElementById('nav-bestaetigung-ziel').textContent,
      wegText: document.getElementById('nav-bestaetigung-weg').textContent
    };
  }`);
  assert.deepEqual({x: ergebnis.marker.x, y: ergebnis.marker.y}, {x: 1, y: 2});
  assert.equal(ergebnis.ziel, null, 'Der Klick hat ohne Bestaetigung ein Ziel gesetzt');
  assert.equal(ergebnis.feldSichtbar, 'flex');
  assert.equal(ergebnis.zielText, '[1, 2]');
  assert.match(ergebnis.wegText, /Felder/);
});

test('erst die Bestaetigung setzt das Ziel', () => {
  const {ergebnis} = mitNavigation(`() => {
    UI.mapState = {scale: 3, offsetX: 0, offsetY: 0, needsRender: false};
    Navigation.markerSetzen(150, 300);
    Navigation.bestaetigen();
    return {
      ziel: Navigation.stand(),
      marker: Navigation.marker,
      feldSichtbar: document.getElementById('nav-bestaetigung').style.display
    };
  }`);
  assert.equal(ergebnis.ziel.x, 1);
  assert.equal(ergebnis.ziel.y, 2);
  assert.equal(ergebnis.marker, null);
  assert.equal(ergebnis.feldSichtbar, 'none');
});

test('Verwerfen setzt kein Ziel und laesst ein altes stehen', () => {
  const {ergebnis} = mitNavigation(`() => {
    Navigation.setzen(9, 9);
    UI.mapState = {scale: 3, offsetX: 0, offsetY: 0, needsRender: false};
    Navigation.markerSetzen(300, 300);
    Navigation.verwerfen();
    return {ziel: Navigation.stand(), marker: Navigation.marker,
            feldSichtbar: document.getElementById('nav-bestaetigung').style.display};
  }`);
  assert.deepEqual({x: ergebnis.ziel.x, y: ergebnis.ziel.y}, {x: 9, y: 9},
    'Verwerfen hat das bestehende Ziel ueberschrieben');
  assert.equal(ergebnis.marker, null);
  assert.equal(ergebnis.feldSichtbar, 'none');
});

test('ein Klick ausserhalb der Welt setzt keinen Marker', () => {
  // Ein Ziel, das es nicht gibt, waere schlimmer als keines: die Nadel zeigt
  // dann ins Nichts und die Entfernung ist erfunden.
  const {ergebnis} = mitNavigation(`() => {
    UI.mapState = {scale: 3, offsetX: -100000, offsetY: -100000, needsRender: false};
    Navigation.markerSetzen(5, 5);
    return {marker: Navigation.marker,
            feldSichtbar: document.getElementById('nav-bestaetigung').style.display};
  }`);
  assert.equal(ergebnis.marker, null);
  assert.equal(ergebnis.feldSichtbar, 'none');
});

// ---------------------------------------------------------------------------
// Klick oder Ziehen - der Grund fuer die ganze Bestaetigung
// ---------------------------------------------------------------------------

// Die Karte laedt ui_view_world.js, das auf UI, Game und Navigation aufsetzt.
// Getestet wird hier die Unterscheidung selbst: kurz und unbewegt = Klick.
function mitKarte(body) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <canvas id="world-map-canvas"></canvas>
      <div id="nav-bestaetigung" style="display:none">
        <span id="nav-bestaetigung-ziel"></span><span id="nav-bestaetigung-weg"></span>
        <button id="nav-bestaetigung-ok"></button>
      </div>
    </body></html>`, {url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.eval(read('src/ui', 'ui_navigation.js'));
  w.eval(`
    var Game = { state: { sector:{x:3,y:4}, player:{x:10,y:10}, nav:null, explored:{} },
      MAP_W: 50, MAP_H: 50, WORLD_W: 16, WORLD_H: 16, saveGame: function(){} };
    var UI = {
      mapState: {offsetX: 0, offsetY: 0, scale: 3, isDragging: false, needsRender: false,
                 worldBuffer: null, lastExploredCount: 0, centeredOnce: true},
      log: function(){},
      centerMapOnPlayer: function(){},
      updateWorldBuffer: function(){},
      renderWorldMap: function(){}
    };
  `);
  // ui_view_world.js haengt sich per Object.assign an UI und ueberschreibt
  // dabei die Attrappen oben. Nach dem Laden erneut stillegen - jsdom hat
  // keine 2D-Leinwand, und der Test prueft den Klickpfad, nicht das Zeichnen.
  w.eval(read('src/ui', 'ui_view_world.js'));
  w.eval('UI.updateWorldBuffer = function(){}; UI.renderWorldMap = function(){}; UI.centerMapOnPlayer = function(){};');
  const cvs = dom.window.document.getElementById('world-map-canvas');
  cvs.getBoundingClientRect = () => ({left: 0, top: 0, width: 600, height: 600});
  w.eval('UI.initWorldMapInteraction()');
  return {w, cvs, document: dom.window.document, MouseEvent: dom.window.MouseEvent};
}

test('Ziehen setzt keinen Marker, Tippen schon', () => {
  // Der teure Fall: die Karte wird mit einem Finger gezogen. Ohne diese
  // Unterscheidung wuerde jedes Wischen ein Ziel vorschlagen.
  const {cvs, w, MouseEvent} = mitKarte();
  const los = (typ, x, y) => cvs.dispatchEvent(new MouseEvent(typ, {bubbles: true, clientX: x, clientY: y, button: 0}));

  // 1) 120 px gezogen: kein Marker.
  los('mousedown', 100, 100);
  los('mousemove', 220, 100);
  los('mouseup', 220, 100);
  assert.equal(w.eval('Navigation.marker'), null, 'Ziehen hat einen Marker gesetzt');

  // 2) 0 px bewegt: Marker. Achtung: das Ziehen oben hat offsetX um 120
  //    verschoben. Ein Klick bei x=100 laege jetzt in Sektor -1, also
  //    ausserhalb der Welt - und wuerde zu Recht abgelehnt. Deshalb erst die
  //    Karte zuruecksetzen, so wie ein Neuaufbau es auch taete.
  w.eval('UI.mapState.offsetX = 0; UI.mapState.offsetY = 0;');
  los('mousedown', 100, 250);
  los('mouseup', 100, 250);
  const marker = w.eval('Navigation.marker ? Navigation.marker.x + "," + Navigation.marker.y : null');
  assert.notEqual(marker, null, 'Ein Klick ohne Bewegung hat keinen Marker gesetzt');
  assert.match(String(marker), /^\d+,\d+$/, `Marker unerwartet: ${marker}`);
});

test('ein Klick auf die Karte setzt ohne Bestaetigung kein Ziel', () => {
  // Derselbe Nachweis wie oben, aber ueber den echten Ereignispfad der Karte.
  const {cvs, w, MouseEvent} = mitKarte();
  const los = (typ, x, y) => cvs.dispatchEvent(new MouseEvent(typ, {bubbles: true, clientX: x, clientY: y, button: 0}));
  los('mousedown', 300, 300);
  los('mouseup', 300, 300);
  assert.notEqual(w.eval('Navigation.marker ? 1 : null'), null);
  assert.equal(w.eval('Navigation.stand() ? 1 : null'), null,
    'Der Klick allein hat das Ziel gesetzt - die Bestaetigung wird uebersprungen');
});

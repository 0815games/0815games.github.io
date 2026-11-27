// 3D-Ansicht im Spiel: Schalter im Kopfbereich und Sichtbarkeit der Bühne.
//
// Dieses Modul ist die Brücke zwischen Spiel-UI und Weltrenderer. Es kennt
// weder Three.js noch Kampfregeln. Es entscheidet nur, ob die 3D-Ansicht
// eingeschaltet ist und ob sie den Bildschirm gerade belegen darf.
//
// Im Kampf legt sich #combat als feste, fast deckende Fläche über das Spiel
// (fixed, inset:0, z-index:120). Die 3D-Bühne liegt darunter und wäre damit
// unsichtbar. Deshalb bekommt das Kampffeld im 3D-Modus einen eigenen Rahmen
// oben im Kampfbildschirm, und die 3D-Leinwand wird dorthin umgehängt.

import { state } from '../core/state.js';

const HOST_ID = 'combat-stage';
const STORAGE_KEY = 'schattengruft-3d';

// Wunsch beim Start. `?view=3d` hat Vorrang vor der gespeicherten Vorliebe und
// wird übernommen – so führt der Link aus der Doku direkt in die 3D-Ansicht,
// ohne dass der Schalter danach wieder auf 2D springt.
export function initialPreference({ search = '', stored = null } = {}) {
  try {
    const wanted = new URLSearchParams(search).get('view');
    if (wanted === '3d') return 'on';
    if (wanted === '2d') return 'off';
  } catch {
    /* unbrauchbare URL: gespeicherte Vorliebe gilt */
  }
  return stored === true ? 'on' : 'off';
}

function readPreference() {
  try {
    return initialPreference({
      search: typeof location === 'undefined' ? '' : location.search,
      stored: localStorage.getItem(STORAGE_KEY) === 'on'
    }) === 'on';
  } catch {
    return false;
  }
}

function writePreference(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* Speicher gesperrt: dann gilt die Einstellung nur für diese Sitzung. */
  }
}

// Darf die Bühne gerade den Bildschirm belegen?
//   Kampf    -> eigener Rahmen im Kampfbildschirm
//   Erkundung-> Kartenbereich
// In allen anderen Screens (Tod, Vorbereitung, Ladebilder) nicht.
export function stageHostFor({ inCombat, deathScreen, gameVisible }) {
  if (!gameVisible || deathScreen) return null;
  return inCombat ? HOST_ID : 'mapbox';
}

let installed = null;

// Erlaubt es, eine bereits erfolgte Selbstinstallation (beim Laden) durch eine
// andere Zustandsquelle zu ersetzen. Nur für Tests gedacht.
let teardown = null;

export function reset3DModeForTests() {
  teardown?.();
  teardown = null;
  installed = null;
}

export function install3DMode(stateRef = state) {
  // Das Modul installiert sich beim Laden selbst; ein zweiter Aufruf (etwa
  // aus einem Test oder einer spaeteren Erweiterung) darf keine zweite
  // Verdrahtung anlegen.
  if (installed) return installed;

  const but3d = document.getElementById('btn-3d');
  const combat = document.getElementById('combat');
  const mapbox = document.getElementById('mapbox');
  if (!but3d || !combat || !mapbox) return null;

  const renderer = () => window.__rpg?.renderer ?? null;
  const api3d = () => renderer()?.world3d ?? null;

  let host = null;
  let unsubscribe = null;

  function hostNode() {
    const wanted = stageHostFor({
      inCombat: stateRef.inCombat === true,
      deathScreen: !document.getElementById('death-screen')?.classList.contains('hidden'),
      gameVisible: !document.getElementById('game')?.classList.contains('hidden')
    });
    if (!wanted) return null;
    return document.getElementById(wanted) ?? null;
  }

  // Die Leinwand hängt im Host. Beim Wechsel wird nur umgehängt, nicht neu
  // gebaut – der 3D-Kontext bleibt erhalten.
  function mount(target) {
    const api = api3d();
    const canvas = api?.canvas;
    if (!canvas || !target) return;
    if (canvas.parentElement === target) return;

    target.append(canvas);
    api.canvasMoved();
  }

  function syncLayout() {
    const inCombat = stateRef.inCombat === true;
    const dead = !document.getElementById('death-screen')?.classList.contains('hidden');
    const on = !!api3d()?.active;

    // Klassen ZUERST: der Bühnenrahmen ist ohne `world3d-combat` auf
    // `display:none`. Würde die Leinwand vorher hineinwandern, wäre ihre
    // Messung 0 × 0 und der nächste Frame würde 3D abschalten.
    document.body.classList.toggle('world3d-on', on);
    document.body.classList.toggle('world3d-combat', on && inCombat);
    document.body.classList.toggle('world3d-gameover', on && dead);

    const target = hostNode();
    if (!target) return;
    mount(target);

    host = target;
  }

  function label() {
    const api = api3d();
    if (!api) return 'Lädt …';
    if (api.active) return stateRef.inCombat ? '3D-Kampfbühne' : '3D-Ansicht';
    if (api.error) return '3D nicht verfügbar';
    return '2D-Ansicht';
  }

  function paint() {
    if (painting) return;
    painting = true;
    try {
      paintNow();
    } finally {
      painting = false;
      // Eigene Schreibvorgänge sofort verwerfen, bevor der Beobachter sie
      // sieht. Ohne das weckt sich die Darstellung selbst: jede Zuweisung an
      // textContent ist im Browser eine Mutation, auch bei gleichem Text.
      observer?.takeRecords?.();
    }
  }

  function paintNow() {
    const api = api3d();
    const on = !!api?.active;
    const text = on ? '3D ein' : '3D aus';

    // Nur schreiben, wenn sich etwas ändert. Jede Zuweisung an textContent ist
    // im Browser eine Mutation; unnötige Schreibvorgänge kosten nur Arbeit.
    if (but3d.textContent !== text) but3d.textContent = text;
    if (but3d.getAttribute('aria-pressed') !== String(on)) {
      but3d.setAttribute('aria-pressed', String(on));
    }

    const tip = on ? '3D-Ansicht ausschalten (2D)' : '3D-Ansicht einschalten';
    if (but3d.title !== tip) but3d.title = tip;

    but3d.classList.toggle('on', on);
    if (but3d.disabled !== !!api?.error) but3d.disabled = !!api?.error;

    const name = label();
    if (but3d.getAttribute('aria-label') !== name) {
      but3d.setAttribute('aria-label', name);
    }

    syncLayout();
  }

  function choose(on) {
    const api = api3d();
    if (!api) return;
    writePreference(on);
    api.setEnabled(on);
    paint();
  }

  const onClick = () => {
    const api = api3d();
    if (!api) return;
    // Den Zielzustand hier festhalten: würde er nach dem Umschalten erneut
    // aus `api.active` gelesen, kehrte der Aufruf sich selbst um.
    choose(!api.active);
  };
  but3d.addEventListener('click', onClick);

  // Zustandswechsel des Spiels: Kampf beginnt/endet, Tod, neuer Screen.
  // Ein MutationObserver ist robuster als Klick/Tastendruck abzufangen:
  // Kampf, Tod und Screenwechsel ändern Klassen am DOM, nicht zwingend ein
  // Eingabeereignis. boss-loot.js nutzt dasselbe Muster.
  let scheduled = false;

  // Wahr, solange paint() das DOM anfasst. Der Beobachter-Callback läuft zwar
  // erst nach dem synchronen Code, sieht aber die Datensätze trotzdem – die
  // Prüfung unten schützt zusätzlich zu takeRecords() in paint().
  let painting = false;

  const schedule = () => {
    if (scheduled || painting) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (!painting) paint();
    });
  };

  const observer = new MutationObserver(() => {
    // Eigene Schreibvorgänge verwerfen. `textContent` zuzuweisen ist immer
    // eine childList-Mutation – auch wenn der Text gleich bleibt. Ohne diese
    // Prüfung weckt sich paint() selbst und die Seite friert ein (am Handy
    // als „hängt beim Laden" sichtbar).
    if (painting) {
      observer.takeRecords();
      return;
    }
    // Nur echte Spieländerungen zählen: Kampfbeginn, Kampfende, Tod.
    schedule();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'open']
  });

  // Einmalige Nachjustierung für Fälle ohne DOM-Änderung (z. B. Resize).
  const onResize = () => schedule();
  window.addEventListener?.('resize', onResize);

  teardown = () => {
    but3d.removeEventListener?.('click', onClick);
    observer.disconnect();
    window.removeEventListener?.('resize', onResize);
    unsubscribe?.();
    unsubscribe = null;
  };

  // Auf den Renderer warten: main.js setzt window.__rpg erst am Ende.
  let attempts = 0;
  function hook() {
    const api = api3d();
    if (!api) {
      if (++attempts < 200) setTimeout(hook, 50);
      return;
    }

    unsubscribe = api.subscribe?.(() => {
      paint();
    }) ?? null;

    // Wunsch anwenden, sobald die 3D-Schicht bereit ist. Der Wunsch wird
    // zugleich gespeichert: wer über ?view=3d kommt, behält 3D auch danach.
    const wants = readPreference();
    if (wants && !api.active) choose(true);
    else paint();

    if (wants) writePreference(true);
  }

  setTimeout(hook, 0);
  installed = { paint, choose, syncLayout };
  return installed;
}

// Installation erfolgt genau einmal aus main.js (window.__rpg steht dort
// bereits). Eine zusätzliche Selbstinstallation beim Laden würde einen
// zweiten Klick-Handler an den Schalter hängen, der den ersten sofort wieder
// umkehrt.
export function autoInstall() {
  if (typeof document === 'undefined') return null;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => install3DMode(), { once: true });
    return null;
  }
  return install3DMode();
}

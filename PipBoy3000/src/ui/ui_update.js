// Versionspruefung und sicheres Neuladen - die Seite, nicht das Buendel.
//
// Vorbild: IronPath/ui/version-check.mjs + version-ui.mjs und
// tiny-tycoon-towns/src/version-check.mjs + version-ui.mjs.
//
// Das Problem in PipBoy3000 war handfest: die Seite laedt app.js und app.css
// mit `?v=<version>`, damit der Browser nach einem Release nicht die alte
// Fassung aus dem Cache nimmt. Das half aber nur beim naechsten Neuladen. Wer
// das Spiel offen hatte, spielte weiter - stundenlang, mit einem Buendel, das
// es nicht mehr gab. Neu war nur sichtbar, wenn man selbst neu lud.
//
// Was diese Datei tut:
//   1. sie fragt build.json mit einem Cache-Brecher nach der Version auf dem
//      Server (alle 60 s, und sofort wenn der Tab wieder sichtbar wird);
//   2. sie meldet den Unterschied ueber einen kleinen Balken unten;
//   3. sie laedt nur neu, wenn es sicher ist: kein offener Dialog, kein
//      laufender Kampf, kein ungespeicherter Spielstand, kein offener Login;
//   4. sie verhindert eine Neuladeschleife, wenn Pages noch die alte Fassung
//      ausliefert.
//
// Bewusst kein Service Worker und kein Cache-Eingriff: das Spiel hat keinen,
// und ein zweiter Cache waere ein zweiter Ort, an dem eine alte Fassung
// haengenbleiben kann.

const BUILD_MUSTER = /^\d+\.\d+\.\d+$/;

// Ruft build.json frisch ab. Jede Anfrage bekommt einen eigenen Parameter -
// ein Wert aus dem Cache wuerde "veraltet" nie erkennen.
function createProbe({url, build, fetcher = globalThis.fetch, timeoutMs = 8000}) {
  if (!BUILD_MUSTER.test(build) || typeof fetcher !== 'function') throw new Error('Ungueltige Versionssonde');
  let zaehler = 0;
  return async function probe() {
    const steuerung = new AbortController();
    const abbruch = setTimeout(() => steuerung.abort(), timeoutMs);
    try {
      const ziel = new URL(url, window.location.href);
      ziel.searchParams.set('probe', `${Date.now()}-${++zaehler}`);
      const antwort = await fetcher(ziel.href, {cache: 'no-store', signal: steuerung.signal});
      if (!antwort || !antwort.ok) return {art: 'unerreichbar'};
      const text = await antwort.text();
      let daten;
      try { daten = JSON.parse(text); } catch { return {art: 'unerreichbar'}; }
      const veroeffentlicht = daten && typeof daten.version === 'string' && BUILD_MUSTER.test(daten.version)
        ? daten.version : null;
      if (!veroeffentlicht) return {art: 'unerreichbar'};
      return veroeffentlicht === build
        ? {art: 'aktuell', build: veroeffentlicht}
        : {art: 'veraltet', build: veroeffentlicht};
    } catch {
      return {art: 'unerreichbar'};
    } finally {
      clearTimeout(abbruch);
    }
  };
}

// Darf jetzt neu geladen werden? Der Grund wird mitgeliefert, damit der Balken
// sagen kann, worauf gewartet wird - statt nur "gleich" zu behaupten.
export function updateBlockers() {
  const gruende = [];
  if (typeof Game === 'undefined' || !Game.state) {
    // Kein Spielstand geladen: dann ist auch nichts zu verlieren. Das ist der
    // Fall auf dem Login-Bildschirm.
    return gruende;
  }
  if (Game.state.inDialog) gruende.push('dialog');
  if (Game.isDirty) gruende.push('speichert');
  if (Game.saveTimer) gruende.push('speichert');
  // Combat traegt keinen eigenen Aktiv-Schalter; ein gesetzter Gegner heisst
  // Kampf. Ein Neuladen mitten im Kampf waere ein verlorener Zug.
  if (typeof Combat !== 'undefined' && Combat.enemy) gruende.push('kampf');
  return gruende;
}

const TEXTE = {
  verfuegbar: 'NEUE VERSION {build} VERFÜGBAR',
  wartet: 'NEUE VERSION BEREIT - {grund}',
  laedt: 'NEUE VERSION WIRD GELADEN...',
  aktuell: 'AKTUELLE VERSION',
  unerreichbar: 'VERSIONSPRÜFUNG NICHT ERREICHBAR',
  geladen: 'NEUE VERSION {build} GELADEN',
  jetzt: 'JETZT LADEN',
  spaeter: 'SPÄTER'
};

const GRUND = {
  dialog: 'Dialog offen',
  speichert: 'Spielstand wird gespeichert',
  kampf: 'Kampf laeuft'
};

// Ab hier nur noch Darstellung. `document` und `window` sind Parameter, damit
// die Datei ohne Browser pruefbar ist.
export function createUpdateUI({document, window, fetcher = window?.fetch?.bind(window)} = {}) {
  const meta = document.querySelector('meta[name="pipboy-build"]');
  const build = meta ? meta.getAttribute('content') : null;
  const balken = document.getElementById('update-banner');
  const text = document.getElementById('update-banner-text');
  const jetzt = document.getElementById('update-banner-now');
  const spaeter = document.getElementById('update-banner-later');
  if (!build || !BUILD_MUSTER.test(build) || !balken || !text) return null;

  const probe = createProbe({url: 'build.json', build, fetcher});
  let zustand = null;
  let pruefungLaeuft = false;
  let timer = null;
  let ziel = null;

  const sagen = (schluessel, werte = {}) => Object.entries(werte)
    .reduce((satz, [name, wert]) => satz.replace(`{${name}}`, String(wert)), TEXTE[schluessel] || '');

  // Der Hintergrund ist gesperrt, solange ein Fenster steht. Das AFK-Fenster
  // macht dasselbe (body.fenster-offen); es darf die Klasse nicht loeschen,
  // wenn es selbst noch offen ist - deshalb hier nachsehen statt blind setzen.
  function sperreAktualisieren() {
    if (!document.body) return;
    const afk = document.getElementById('afk-popup');
    const offen = !balken.hidden || (afk && !afk.hidden);
    document.body.classList.toggle('fenster-offen', Boolean(offen));
  }

  function zeichnen() {
    const stand = document.getElementById('update-banner-stand');
    if (stand) stand.textContent = `AKTUELL ${build}`;
    if (!zustand) { balken.hidden = true; sperreAktualisieren(); return; }
    balken.hidden = false;
    sperreAktualisieren();
    if (zustand.art === 'veraltet') {
      const gruende = zustand.blocker || [];
      text.textContent = gruende.length
        ? sagen('wartet', {grund: gruende.map(g => GRUND[g] || g).join(', ')})
        : sagen('verfuegbar', {build: zustand.build});
      text.className = 'popup-text text-yellow-400';
      jetzt.hidden = gruende.length > 0;
    } else if (zustand.art === 'laedt') {
      text.textContent = sagen('laedt');
      text.className = 'popup-text text-yellow-400 animate-pulse';
      jetzt.hidden = true;
    } else if (zustand.art === 'geladen') {
      text.textContent = sagen('geladen', {build: zustand.build});
      text.className = 'popup-text text-[#39ff14]';
      jetzt.hidden = true;
    } else if (zustand.art === 'aktuell') {
      balken.hidden = true;
      sperreAktualisieren();
      return;
    } else {
      // Nicht erreichbar: sichtbar, aber gedeckt - und ohne Knopf. Ein stiller
      // Balken waere schlimmer als keiner: der Spieler glaubt dann, es sei
      // geprueft worden.
      text.textContent = sagen('unerreichbar');
      text.className = 'popup-text text-green-700';
      jetzt.hidden = true;
    }
    if (spaeter) spaeter.hidden = zustand.art !== 'veraltet' && zustand.art !== 'unerreichbar';
    if (jetzt) jetzt.textContent = TEXTE.jetzt;
  }

  // Neuladen mit Nachweis: der Zielbuild steht in der Adresse, damit der
  // geladene Stand sich selbst bestaetigen kann. Der Zaehler verhindert eine
  // Schleife, wenn Pages oder ein Proxy noch die alte Fassung liefert.
  function neuLaden(zielBuild) {
    if (!BUILD_MUSTER.test(zielBuild)) return false;
    const adresse = new URL(window.location.href);
    adresse.searchParams.set('_pb_auf', zielBuild);
    adresse.searchParams.set('_pb_von', build);
    adresse.searchParams.set('_pb_nonce', String(Date.now()));
    zustand = {art: 'laedt'};
    zeichnen();
    window.location.replace(adresse.href);
    return true;
  }

  // Nach dem Laden: hat es geklappt, und war es ein Update?
  function geladenPruefen() {
    const adresse = new URL(window.location.href);
    const auf = adresse.searchParams.get('_pb_auf');
    const von = adresse.searchParams.get('_pb_von');
    const versuch = auf === build && BUILD_MUSTER.test(von || '') && von !== build;
    if (versuch) zustand = {art: 'geladen', build};
    if (auf !== null || von !== null || adresse.searchParams.has('_pb_nonce')) {
      adresse.searchParams.delete('_pb_auf');
      adresse.searchParams.delete('_pb_von');
      adresse.searchParams.delete('_pb_nonce');
      try { window.history.replaceState(window.history.state, '', adresse.href); } catch { /* Balken bleibt richtig */ }
    }
    zeichnen();
    return versuch;
  }

  async function pruefen() {
    if (pruefungLaeuft) return false;
    pruefungLaeuft = true;
    try {
      const ergebnis = await probe();
      if (ergebnis.art === 'aktuell') {
        // Nach einem Update nicht sofort ausblenden - der Spieler soll sehen,
        // dass etwas passiert ist.
        if (!zustand || zustand.art !== 'geladen') { zustand = null; zeichnen(); }
        return false;
      }
      if (ergebnis.art === 'veraltet') {
        const blocker = updateBlockers();
        zustand = {art: 'veraltet', build: ergebnis.build, blocker};
        ziel = ergebnis.build;
        // Schleifenbremse: haben wir diesen Build schon einmal zu laden
        // versucht und sind immer noch auf dem alten, dann nicht wieder.
        const adresse = new URL(window.location.href);
        const versucht = adresse.searchParams.get('_pb_auf');
        if (blocker.length === 0 && versucht !== ergebnis.build) {
          // Freiwillig erst nach einer kurzen Pause, damit der Balken nicht
          // im selben Atemzug erscheint und verschwindet.
          window.setTimeout(() => neuLaden(ergebnis.build), 1200);
        }
        zeichnen();
        return true;
      }
      zustand = {art: 'unerreichbar'};
      zeichnen();
      return false;
    } finally {
      pruefungLaeuft = false;
    }
  }

  function beiSichtbarkeit() {
    if (document.visibilityState !== 'hidden') void pruefen();
  }

  function start() {
    geladenPruefen();
    void pruefen();
    timer = window.setInterval(() => void pruefen(), 60000);
    document.addEventListener('visibilitychange', beiSichtbarkeit);
    window.addEventListener('pageshow', beiSichtbarkeit);
  }

  function stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    document.removeEventListener('visibilitychange', beiSichtbarkeit);
    window.removeEventListener('pageshow', beiSichtbarkeit);
  }

  if (jetzt) jetzt.onclick = () => { if (ziel) neuLaden(ziel); };
  if (spaeter) spaeter.onclick = () => { balken.hidden = true; sperreAktualisieren(); };

  return Object.freeze({start, stop, pruefen, get build() { return build; }, get zustand() { return zustand; }});
}

// Einstieg fuer das Spiel. Wird aus ui_core.js init() gerufen, weil dort der
// Zeitpunkt bekannt ist, an dem die Oberflaeche steht.
window.UI = window.UI || {};
window.UI.updateUI = null;

window.UI.starteUpdatePruefung = function() {
    if (this.updateUI) return this.updateUI;
    try {
        this.updateUI = createUpdateUI({document, window});
        if (this.updateUI) this.updateUI.start();
    } catch (e) {
        // Eine gescheiterte Versionspruefung darf das Spiel nicht aufhalten.
        console.warn('Update-Pruefung nicht gestartet:', e && e.message);
    }
    return this.updateUI;
};

// Der Menuepunkt "NACH UPDATE SUCHEN". Ohne Argument startet er die Pruefung
// von Hand; mit true meldet er auch dann etwas, wenn alles aktuell ist.
window.UI.pruefeVersion = function(vonHand) {
    const ui = this.starteUpdatePruefung();
    if (!ui) {
        if (typeof this.toast === 'function') this.toast('Update-Prüfung nicht verfügbar', 'text-red-400');
        return;
    }
    if (vonHand && typeof this.toast === 'function') this.toast('Prüfe Version...', 'text-green-400');
    void ui.pruefen().then(veraltet => {
        if (!vonHand || typeof this.toast !== 'function') return;
        if (veraltet) this.toast('Neue Version gefunden - siehe Hinweis unten', 'text-yellow-400');
        else if (!ui.zustand || ui.zustand.art === 'aktuell') this.toast('Du spielst die aktuelle Version', 'text-green-400');
        else this.toast('Version nicht erreichbar', 'text-red-400');
    });
};

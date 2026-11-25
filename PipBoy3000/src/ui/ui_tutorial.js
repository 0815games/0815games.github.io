// Tutorial: die ersten Schritte, interaktiv.
//
// Kein Textkasten zum Durchklicken. Jeder Schritt wartet darauf, dass die
// Handlung wirklich passiert ist - Menue geoeffnet, Inventar angesehen, ein
// Feld betreten. Erst dann gibt es den Weiter-Knopf.
//
// Form: eine Sprechblase, die auf ihr Ziel zeigt - kein Modal. Der Spieler
// soll genau das anklicken koennen, worauf das Tutorial zeigt; ein Fenster
// mit Hintergrundsperre waere das Gegenteil davon.
//
// Stand: liegt im Spielstand (`state.tutorial`). Abgebrochen heisst
// fortsetzen, nicht von vorn. Menue -> TUTORIAL startet es neu.
//
// Was hier NICHT stehen darf und warum:
//   * Ansicht 'inv'  - das Template heisst templates/inventory.html. Mit 'inv'
//     holte switchView() eine 404 und der Klick tat sichtbar nichts.
//   * ein blinder UI.toggleMenu() im Timeout - der Klick-Verteiler in
//     ui_input.js oeffnet das Menue bei einem Klick auf den Menue-Knopf schon
//     selbst. Ein zweiter Aufruf schliesst es im selben Zug wieder.
//   * ein Zeiger ins Leere - ein Rahmen um ein verstecktes Element sieht aus
//     wie ein Fehler. Lieber kein Rahmen.

// Ist ein Element wirklich sichtbar? `hidden` und display:none zaehlen beide.
function sichtbar(id) {
  const el = document.getElementById(id);
  if (!el || el.hidden) return false;
  return el.style.display !== 'none' && !el.classList.contains('hidden');
}

const SCHRITTE = [
  {
    id: 'willkommen',
    titel: 'VAULT-TEC ORIENTIERUNG',
    text: 'Willkommen im Ödland. Ich zeige dir die ersten Griffe - das dauert zwei Minuten.',
    ziel: null,
    weiter: 'LOS GEHT\'S',
    pruefung: null
  },
  {
    id: 'karte',
    titel: 'DIE KARTE',
    text: 'Das hier ist deine Umgebung. Tippe auf ein Feld, um dich zu bewegen. Der Sektor-Anzeiger oben nennt deine Position.',
    ziel: '#game-canvas',
    weiter: 'VERSTANDEN',
    // Wirklich bewegt: die Position hat sich seit dem Start geaendert.
    pruefung: () => {
      if (typeof Game === 'undefined' || !Game.state || !Game.state.player) return false;
      const start = Game.state.tutorialStartPlayer;
      if (!start) return true;
      return Math.abs(Game.state.player.x - start.x) + Math.abs(Game.state.player.y - start.y) >= 1;
    }
  },
  {
    id: 'menue',
    titel: 'DAS MENÜ',
    text: 'Oben rechts das Menü (drei Striche). Dahinter liegen Inventar, Charakter, Aufgaben und das Handbuch.',
    ziel: '#btn-menu-toggle',
    weiter: 'MENÜ ÖFFNEN',
    oeffnet: 'toggleMenu',
    pruefung: () => sichtbar('main-nav')
  },
  {
    id: 'inventar',
    titel: 'DEIN ZEUG',
    text: 'Im Inventar liegen Stimpacks und Munition. Ein Stimpack heilt - heb eines für einen schlechten Moment auf.',
    ziel: '#btn-inv',
    weiter: 'INVENTAR ÖFFNEN',
    // 'inventory', nicht 'inv': das Template heisst templates/inventory.html.
    oeffnet: 'switchView',
    oeffnetArg: 'inventory',
    menueZu: true,
    pruefung: () => (typeof Game !== 'undefined' && Game.state && Game.state.view === 'inventory')
  },
  {
    id: 'aufgaben',
    titel: 'AUFGABEN',
    text: 'Hier stehen deine Missionen. Der Vault-Tec-Auftrag ist dein erster - er zählt, was du im Ödland findest.',
    ziel: '#btn-quests',
    weiter: 'AUFGABEN ÖFFNEN',
    oeffnet: 'switchView',
    oeffnetArg: 'quests',
    menueZu: true,
    pruefung: () => (typeof Game !== 'undefined' && Game.state && Game.state.view === 'quests')
  },
  {
    id: 'kampf',
    titel: 'GEFAHR',
    text: 'Im Ödland begegnen dir Gegner. Klick auf sie, um anzugreifen - sonst greifen sie dich an.',
    ziel: '#game-canvas',
    weiter: 'ALLES KLAR',
    // Kein Muss: wer im Tutorial keinem Gegner begegnet, soll nicht festsitzen.
    weich: true,
    pruefung: () => (typeof Game !== 'undefined' && Game.state &&
      (Game.state.kills > 0 || Game.state.view === 'combat'))
  },
  {
    id: 'fertig',
    titel: 'RAUS INS ÖDLAND',
    text: 'Das war es. Sammle, kämpfe, komm zurück. Im Handbuch steht der Rest.',
    ziel: null,
    weiter: 'FERTIG',
    pruefung: null
  }
];

const TUTORIAL = {
  index: 0,
  offen: false,
  beobachter: null,
  zeigerHorcher: null,

  // Startet das Tutorial, wenn der Spielstand es verlangt.
  vielleichtStarten: function () {
    if (typeof Game === 'undefined' || !Game.state) return false;
    if (Game.state.tutorial === 'fertig') return false;
    if (Game.state.tutorial === 'laeuft') return this.zeigen(this.index || 0);
    return false;
  },

  start: function () {
    if (typeof Game === 'undefined' || !Game.state) return false;
    this.index = 0;
    this.offen = true;
    Game.state.tutorial = 'laeuft';
    Game.state.tutorialStartPlayer = Game.state.player
      ? {x: Game.state.player.x, y: Game.state.player.y} : null;
    this.zeigen(0);
    if (typeof Game.saveGame === 'function') Game.saveGame();
    return true;
  },

  beenden: function () {
    this.offen = false;
    this.beobachterAbstellen();
    const feld = this.feld();
    if (feld) feld.hidden = true;
    const zeiger = document.getElementById('tutorial-zeiger');
    if (zeiger) zeiger.remove();
    if (typeof Game !== 'undefined' && Game.state) {
      Game.state.tutorial = 'fertig';
      if (typeof Game.saveGame === 'function') Game.saveGame();
    }
  },

  // Das Feld entsteht beim ersten Bedarf und bleibt. Kein innerHTML pro Tick:
  // das wuerde Fokus und Animation jede Sekunde zerreissen.
  feld: function () {
    let el = document.getElementById('tutorial-feld');
    if (el || typeof document === 'undefined' || !document.body) return el;
    el = document.createElement('div');
    el.id = 'tutorial-feld';
    el.hidden = true;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="tut-kopf">
        <span class="tut-schritt" data-tut-schritt>1/7</span>
        <span class="tut-titel" data-tut-titel></span>
        <button type="button" class="tut-zu" data-tut-ueberspringen title="Tutorial beenden" aria-label="Tutorial beenden">✕</button>
      </div>
      <div class="tut-text" data-tut-text></div>
      <div class="tut-fuss">
        <span class="tut-warten" data-tut-warten hidden>WARTE AUF DICH...</span>
        <button type="button" class="action-button tut-weiter" data-tut-weiter></button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('[data-tut-weiter]').onclick = () => this.weiter();
    el.querySelector('[data-tut-ueberspringen]').onclick = () => this.beenden();
    return el;
  },

  zeigen: function (index) {
    const schritt = SCHRITTE[index];
    if (!schritt) return this.beenden();
    this.index = index;
    this.offen = true;

    const feld = this.feld();
    if (!feld) return false;
    feld.hidden = false;
    feld.querySelector('[data-tut-schritt]').textContent = `${index + 1}/${SCHRITTE.length}`;
    feld.querySelector('[data-tut-titel]').textContent = schritt.titel;
    feld.querySelector('[data-tut-text]').textContent = schritt.text;

    const weiter = feld.querySelector('[data-tut-weiter]');
    const warten = feld.querySelector('[data-tut-warten]');
    // Drei Arten von Schritt:
    //   ohne pruefung   reiner Text, der Knopf fuehrt weiter.
    //   mit oeffnet     der Knopf oeffnet das Ziel (Menue, Inventar) und ist
    //                   deshalb immer da - er ist die Handlung.
    //   mit pruefung ohne oeffnet  der Spieler muss es selbst tun. Dann steht
    //                   dort WARTE AUF DICH, bis die Pruefung zustimmt. Sonst
    //                   klickt man sich durch und hat nichts gelernt.
    // Ein "weicher" Schritt (Kampf) laesst sich ueberspringen: wer im
    // Tutorial keinem Gegner begegnet, darf dort nicht festsitzen. Dann steht
    // neben dem Knopf ein Hinweis statt einer Sackgasse.
    const erledigt = !schritt.pruefung || schritt.pruefung();
    weiter.textContent = schritt.weich && !erledigt ? 'TROTZDEM WEITER' : schritt.weiter;
    if (schritt.weich || schritt.oeffnet || !schritt.pruefung || erledigt) {
      weiter.hidden = false;
      warten.hidden = true;
    } else {
      weiter.hidden = true;
      warten.hidden = false;
    }

    this.zeigerSetzen(schritt.ziel);
    this.beobachterAbstellen();
    if (schritt.pruefung) this.beobachter = setInterval(() => this.pruefen(), 400);
    return true;
  },

  // Laeuft im Takt, solange ein Schritt auf eine Handlung wartet.
  pruefen: function () {
    const schritt = SCHRITTE[this.index];
    if (!this.offen || !schritt || !schritt.pruefung) return;
    if (!schritt.pruefung()) return;
    this.beobachterAbstellen();
    const feld = this.feld();
    if (!feld) return;
    const weiter = feld.querySelector('[data-tut-weiter]');
    const warten = feld.querySelector('[data-tut-warten]');
    if (weiter) weiter.hidden = false;
    if (warten) warten.hidden = true;
  },

  weiter: function () {
    const schritt = SCHRITTE[this.index];
    if (!schritt) return this.beenden();

    // Schritte, deren Knopf das Ziel selbst oeffnet: hinfuehren und warten,
    // bis die Pruefung den Vollzug sieht. Wer es schon getan hat, springt
    // direkt weiter.
    if (schritt.oeffnet && typeof UI !== 'undefined' && UI[schritt.oeffnet]) {
      const schonDa = schritt.oeffnet === 'toggleMenu'
        ? sichtbar('main-nav')
        : (schritt.pruefung ? schritt.pruefung() : false);
      if (!schonDa) {
        if (schritt.menueZu) {
          const nav = document.getElementById('main-nav');
          if (nav && sichtbar('main-nav')) UI.toggleMenu();
        }
        // Erst nach dem Klick-Ereignis oeffnen - und dann pruefen, ob es noch
        // noetig ist. Sonst schliesst der Klick-Verteiler von ui_input.js das
        // gerade geoeffnete Menue im selben Zug wieder.
        setTimeout(() => {
          const s = SCHRITTE[this.index];
          if (!s) return;
          const da = s.oeffnet === 'toggleMenu'
            ? sichtbar('main-nav')
            : (s.pruefung ? s.pruefung() : false);
          if (!da) {
            try { UI[s.oeffnet](s.oeffnetArg); } catch (e) { console.error(e); }
          }
          this.zeigerSetzen(s.ziel);
        }, 0);
        const feld = this.feld();
        if (feld) {
          feld.querySelector('[data-tut-weiter]').hidden = true;
          feld.querySelector('[data-tut-warten]').hidden = false;
        }
        this.beobachterAbstellen();
        this.beobachter = setInterval(() => this.pruefen(), 400);
        return true;
      }
    }

    // Menue zu, bevor es weitergeht - auch wenn der Schritt schon erfuellt
    // war (der Spieler steht z.B. schon im Inventar). Sonst bleibt das Menue
    // ueber der Ansicht stehen, die der naechste Schritt erklaeren will.
    if (schritt.menueZu && sichtbar('main-nav') && typeof UI !== 'undefined' && UI.toggleMenu) {
      UI.toggleMenu();
    }

    const naechster = this.index + 1;
    if (naechster >= SCHRITTE.length) return this.beenden();
    this.beobachterAbstellen();
    return this.zeigen(naechster);
  },

  beobachterAbstellen: function () {
    if (this.beobachter) clearInterval(this.beobachter);
    this.beobachter = null;
  },

  // Der Zeiger: ein Rahmen um das Ziel-Element. Kein Overlay darueber - der
  // Spieler muss klicken koennen (pointer-events: none im CSS).
  //
  // Drei Faelle, in denen es KEINEN Rahmen gibt - und das ist richtig so:
  //   Ziel fehlt      (z.B. Canvas in einer Umgebung ohne 2D-Kontext)
  //   Ziel versteckt  (der Menue-Punkt, solange das Menue zu ist)
  //   Ziel ohne Masse (Breite oder Hoehe 0)
  // Ein Rahmen um nichts ist schlimmer als kein Rahmen.
  zeigerSetzen: function (selektor) {
    let zeiger = document.getElementById('tutorial-zeiger');
    const ziel = selektor && document.querySelector(selektor);
    const r = ziel ? ziel.getBoundingClientRect() : null;
    const passt = r && r.width > 8 && r.height > 8 &&
      r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    if (!passt) {
      if (zeiger) zeiger.remove();
      return;
    }
    if (!zeiger) {
      zeiger = document.createElement('div');
      zeiger.id = 'tutorial-zeiger';
      document.body.appendChild(zeiger);
    }
    Object.assign(zeiger.style, {
      left: `${r.left - 4}px`, top: `${r.top - 4}px`,
      width: `${r.width + 8}px`, height: `${r.height + 8}px`
    });
  }
};

// Dem Ziel nachfuehren: Fenstergroesse und Scroll aendern die Lage, sonst
// haengt der Rahmen nach einem Dreh ins Leere.
if (typeof window !== 'undefined' && !window.__tutZeigerHorcher) {
  window.__tutZeigerHorcher = true;
  const nachfuehren = () => {
    if (!TUTORIAL.offen) return;
    const s = SCHRITTE[TUTORIAL.index];
    if (s) TUTORIAL.zeigerSetzen(s.ziel);
  };
  window.addEventListener('resize', nachfuehren);
  window.addEventListener('scroll', nachfuehren, true);
}

window.UI = window.UI || {};
window.Tutorial = TUTORIAL;
window.UI.starteTutorial = function () { return TUTORIAL.start(); };
window.UI.tutorialVielleicht = function () { return TUTORIAL.vielleichtStarten(); };

// Gerufen aus leaveDialog() (ui_render_overlays.js) - also genau dann, wenn
// der Spieler die Permadeath-Warnung weggeklickt hat und zum ersten Mal vor
// der Karte steht. Ein neuer Charakter kennt das Tutorial noch nicht; ein
// alter holt nur nach, was er schon angefangen hatte.
window.UI.tutorialNachWarnung = function () {
    if (typeof Game === 'undefined' || !Game.state) return false;
    if (Game.state.tutorial === 'fertig') return false;
    if (Game.state.tutorial === 'laeuft') return TUTORIAL.vielleichtStarten();
    // Erster Start: nur fuer einen Charakter, der noch nichts gespielt hat.
    if (!Game.state.kills && !Game.state.visitedCount && TUTORIAL.start()) return true;
    return false;
};

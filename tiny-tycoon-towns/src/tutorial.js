// Texte für Tutorial und Hilfe (nur Darstellung, keine Spielregeln).
// Spielwerte kommen aus data/*.json und docs/GAME_PLAN.md; hier stehen nur Worte.

// Ein Schritt je Eintrag. `target` ist der CSS-Selektor, der kurz hervorgehoben wird.
export const TUTORIAL_STEPS = Object.freeze([
  {
    title: 'Willkommen in deiner Stadt',
    text: 'Deine Stadt arbeitet auch dann weiter, wenn du nicht hinsiehst. In wenigen Schritten gehst du alles einmal durch. Jeder Schritt wartet auf deine Aktion. Mit „Später“ gehst du weiter.',
    target: null,
  },
  {
    title: 'Das Spielfeld',
    text: 'Tippe auf ein Feld. Dann öffnet sich das Feld-Fenster. Ziehen verschiebt die Karte, Mausrad oder zwei Finger zoomen. Mit den Pfeiltasten wanderst du über das Raster.',
    target: '#board',
    task: 'tap',
  },
  {
    title: 'Gebäude bauen',
    text: 'Im Feld-Fenster baust du Gebäude. Mit den Pfeilen wählst du die Option. Jedes Gebäude braucht Münzen und Material. Tippe auf ein freies Feld und baue ein Gebäude.',
    target: '#board',
    task: 'build',
  },
  {
    title: 'Lager und Reserve',
    text: 'Produkte landen im Lager. Unten links siehst du dein Inventar. Von jeder Ressource bleiben 20 Einheiten als Reserve. Öffne das Inventar einmal.',
    target: '#stock-btn',
    task: 'stock',
  },
  {
    title: 'Verkauf',
    text: 'Das Rathaus verkauft automatisch. Du kannst den Verkauf je Ressource ein- oder ausschalten. Öffne das Inventar und tippe auf einen Schalter.',
    target: '#stock-btn',
    task: 'sell',
  },
  {
    title: 'Stadtlevel',
    text: 'Mit Münzen und Erfahrung steigt dein Stadtlevel. Dann wächst das Raster, und neue Felder und Gebäude werden frei. Tippe auf die Erfahrungsleiste.',
    target: '#xp-bar',
    task: 'xp',
  },
  {
    title: 'Händler Eberhard',
    text: 'Wanderhändler Eberhard hat jeden Tag neue Angebote, auch für seltene Ressourcen. Öffne das Inventar und tippe in Eberhards Bereich.',
    target: '#stock-btn',
    task: 'merchant',
  },
  {
    title: 'Hilfe und Konto',
    text: 'Alles Wichtige findest du im Menü unter Hilfe. Dein Stand wird lokal und in der Cloud gespeichert. Öffne die Hilfe einmal.',
    target: '#menu-btn',
    task: 'help',
  },
  {
    title: 'Wohnhaus bauen',
    text: 'Ein Wohnhaus bringt Bewohner. Tippe auf ein freies Feld, wähle Wohnhaus und baue es. Ab Stadtlevel 2 verfügbar. Es kostet Münzen und Holz.',
    target: '#board',
    task: 'house',
  },
  {
    title: 'Arbeit und Lohn',
    text: 'Bewohner arbeiten in Betrieben, höchstens 3 Felder entfernt. Tippe auf einen Betrieb und setze mit + einen Arbeiter aus einem Wohnhaus. Jeder Arbeiter bekommt Lohn, der täglich automatisch abgezogen wird.',
    target: '#board',
    task: 'worker',
  },
  {
    title: 'Gebäude ausbauen',
    text: 'Mit dem Ausbau steigt der Ertrag, und das Gebäude zeigt die nächste Stufe. Tippe auf ein Gebäude und baue es auf Stufe 2 aus. Das kostet Münzen und Material.',
    target: '#board',
    task: 'upgrade',
  },
  {
    title: 'Stufen der Gebäude',
    text: 'Gebäude und Wohnhäuser haben fünf sichtbare Stufen. Du erkennst sie am Bild. Die Bewohner wachsen langsam nach, bis zur Kapazität des Hauses.',
    target: null,
  },
  {
    title: 'Dein Check',
    text: 'Hier siehst du, was du in diesem Tutorial ausprobiert hast. Fehlt etwas, holst du es am Feld nach. Die Anleitung findest du jederzeit unter Hilfe.',
    target: null,
    checklist: ['tap', 'build', 'stock', 'sell', 'xp', 'merchant', 'help', 'house', 'worker', 'upgrade'],
  },
]);

// Gespeichert wird state.tutorialStep:
//   0 oder 8 = Angebot noch nicht gemacht (8 ist der Stand alter, abgeschlossener Konten),
//   1 bis 7 = alter Lauf in Arbeit, 100 + Schritt = neuer Lauf (100 + Länge = fertig).
export const TUTORIAL_STORE_OFFSET = 100;

export const CHECK_LABELS = Object.freeze({
  tap: 'Ein Feld angetippt',
  build: 'Ein Gebäude gebaut',
  stock: 'Das Inventar geöffnet',
  sell: 'Den Verkauf einer Ressource umgeschaltet',
  xp: 'Die Erfahrungsleiste angesehen',
  merchant: 'Eberhards Angebote angesehen',
  help: 'Die Hilfe geöffnet',
  house: 'Ein Wohnhaus gebaut',
  worker: 'Einen Arbeiter zugewiesen',
  upgrade: 'Ein Gebäude ausgebaut',
});

/** Aufgaben, die der Spielstand selbst festhält. Die übrigen merkt sich der Browser (pro Konto). */
export const STATE_TASKS = Object.freeze(['build', 'house', 'worker', 'upgrade']);

/** Was beim Start passiert: 'offer' (Angebot zeigen), eine Schrittnummer oder null (nichts mehr). */
export function tutorialResume(stored) {
  const v = Number(stored) || 0;
  if (v === 0 || v === 8) return 'offer';
  if (v >= 1 && v <= 7) return v;
  if (v >= TUTORIAL_STORE_OFFSET && v - TUTORIAL_STORE_OFFSET < TUTORIAL_STEPS.length) return v - TUTORIAL_STORE_OFFSET;
  return null;
}

export function tutorialStored(step) {
  return TUTORIAL_STORE_OFFSET + step;
}

// Übersicht unter „Hilfe“. Jeder Abschnitt hat eine Überschrift und Absätze.
export const HELP_SECTIONS = Object.freeze([
  {
    title: 'Ziel',
    paragraphs: [
      'Baue eine Stadt, die von selbst Münzen erwirtschaftet, und wachse mit deinem Stadtlevel.',
    ],
  },
  {
    title: 'Spielfeld bedienen',
    paragraphs: [
      'Klick auf ein Feld wählt es aus. Ziehen verschiebt die Karte. Mausrad und Zwei-Finger-Geste zoomen.',
      'Tastatur: Pfeiltasten bewegen die Auswahl, Enter öffnet das Bedienfeld, + und − zoomen.',
    ],
  },
  {
    title: 'Bauen und Ausbauen',
    paragraphs: [
      'Gebäude baust du im Feld-Fenster, wenn du ein Feld antippst. Jede Stufe erhöht den Ertrag. Die Kosten steigen mit jeder Stufe.',
    ],
  },
  {
    title: 'Gelände und Nachbarn',
    paragraphs: [
      'Das Gelände wirkt sich aus: Ein Hof auf einer Wiese bringt mehr. Nachbarn können Boni geben, zum Beispiel eine Imkerei neben dem Hof.',
    ],
  },
  {
    title: 'Lager und Verkauf',
    paragraphs: [
      'Von jeder Ressource bleiben 20 Einheiten als Reserve. Das Rathaus verkauft den Rest automatisch.',
      'Du schaltest den Verkauf je Ressource ein oder aus. Knappe Ressourcen werden standardmäßig behalten.',
      'Die Lagergröße wächst mit Lagerhäusern.',
    ],
  },
  {
    title: 'Stadtlevel',
    paragraphs: [
      'Erfahrung und Münzen bringen dir Stadtlevel. Mit jedem Level wächst das Raster und neue Gebäude werden frei.',
    ],
  },
  {
    title: 'Händler Eberhard',
    paragraphs: [
      'Eberhard hat jeden Tag neue Angebote. Dort findest du seltene Ressourcen.',
    ],
  },
  {
    title: 'Siedlungen',
    paragraphs: [
      'Wohnhäuser bringen Bewohner. Die Bewohner arbeiten in Betrieben in der Nähe (höchstens 3 Felder) und bekommen Lohn je Tag.',
      'Im Betrieb setzt du mit + und − Arbeiter aus Wohnhäusern ein. Ein voll besetzter Betrieb produziert mehr.',
    ],
  },
  {
    title: 'Offline-Fortschritt',
    paragraphs: [
      'Während du weg bist, produziert deine Stadt weiter. Die Zeit wird auf 8 Stunden begrenzt, mit Ausbauten auf bis zu 16 Stunden.',
    ],
  },
  {
    title: 'Speichern und Konto',
    paragraphs: [
      'Der Stand wird lokal alle paar Sekunden gesichert und etwa jede Minute in der Cloud.',
      'Beim Abmelden wirst du gefragt, und dein Stand wird vorher gesichert.',
      'Dasselbe Konto ist auf allen Geräten nur einmal gleichzeitig offen. Ein zweites Fenster kann die Sitzung übernehmen.',
    ],
  },
]);

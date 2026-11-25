// Texte für Tutorial und Hilfe (nur Darstellung, keine Spielregeln).
// Spielwerte kommen aus data/*.json und docs/GAME_PLAN.md; hier stehen nur Worte.

// Ein Schritt je Eintrag. `target` ist der CSS-Selektor, der kurz hervorgehoben wird.
export const TUTORIAL_STEPS = Object.freeze([
  {
    title: 'Willkommen in deiner Stadt',
    text: 'Deine Stadt arbeitet auch dann weiter, wenn du nicht hinsiehst. In wenigen Schritten zeige ich dir, wie sie läuft.',
    target: null,
  },
  {
    title: 'Das Spielfeld',
    text: 'Tippe auf ein Feld, dann öffnet sich ein Fenster. Ziehen verschiebt die Karte, das Mausrad oder zwei Finger zoomen. Mit den Pfeiltasten wanderst du über das Raster.',
    target: '#board',
  },
  {
    title: 'Gebäude bauen',
    text: 'Im Feld-Fenster baust du Gebäude. Mit den Pfeilen wählst du die Option. Jedes Gebäude braucht Münzen und Material. Probier es aus: Tippe auf ein freies Feld und baue ein Gebäude.',
    target: '#board',
    task: 'build',
  },
  {
    title: 'Lager und Reserve',
    text: 'Produkte landen im Lager. Unten links siehst du dein Inventar. Von jeder Ressource bleiben 20 Einheiten als Reserve.',
    target: '#stock-btn',
  },
  {
    title: 'Dein Rathaus verkauft',
    text: 'Das Rathaus verkauft automatisch. Die Münzen siehst du im Inventar. Mehr Verkaufsleistung bringt der Marktplatz.',
    target: '#stock-btn',
  },
  {
    title: 'Stadtlevel',
    text: 'Mit Münzen und Erfahrung steigt dein Stadtlevel. Dann wächst das Raster, und neue Felder und Gebäude werden frei.',
    target: '#xp-bar',
  },
  {
    title: 'Händler Eberhard',
    text: 'Wanderhändler Eberhard hat jeden Tag neue Angebote, auch für seltene Ressourcen. Schau regelmäßig bei ihm vorbei.',
    target: null,
  },
  {
    title: 'Hilfe und Konto',
    text: 'Alles Wichtige findest du jederzeit im Menü unter Hilfe. Dein Stand wird lokal und in der Cloud gespeichert.',
    target: '#menu-btn',
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
    title: 'Stufen der Gebäude',
    text: 'Gebäude und Wohnhäuser haben fünf sichtbare Stufen. Du erkennst sie am Bild. Die Bewohner wachsen langsam nach, bis zur Kapazität des Hauses.',
    target: null,
  },
  {
    title: 'Dein Check',
    text: 'Hier siehst du, was du in diesem Tutorial gebaut und zugewiesen hast. Fehlt etwas, holst du es am Feld nach. Die Anleitung findest du jederzeit unter Hilfe.',
    target: null,
    checklist: ['build', 'house', 'worker'],
  },
]);

// Gespeichert wird state.tutorialStep:
//   0 = noch nicht angeboten, 1 bis 7 = alter Lauf in Arbeit, 8 = alter Lauf fertig,
//   100 + Schritt = neuer Lauf (100 + Länge = fertig).
export const TUTORIAL_STORE_OFFSET = 100;

export const CHECK_LABELS = Object.freeze({
  build: 'Ein Gebäude gebaut',
  house: 'Ein Wohnhaus gebaut',
  worker: 'Einen Arbeiter zugewiesen',
});

/** Was beim Start passiert: 'offer' (Angebot zeigen), eine Schrittnummer oder null (nichts mehr). */
export function tutorialResume(stored) {
  const v = Number(stored) || 0;
  if (v === 0) return 'offer';
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

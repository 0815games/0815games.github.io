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
    text: 'Im Feld-Fenster baust du Gebäude. Mit den Pfeilen wählst du die Option. Jedes Gebäude braucht Münzen und Material.',
    target: null,
  },
  {
    title: 'Lager und Reserve',
    text: 'Produkte landen im Lager. Unten links siehst du Lager und Geld. Von jeder Ressource bleiben 20 Einheiten als Reserve.',
    target: '#stock-btn',
  },
  {
    title: 'Dein Rathaus verkauft',
    text: 'Das Rathaus verkauft automatisch. Die Münzen siehst du unter Lager und Geld. Mehr Verkaufsleistung bringt der Marktplatz.',
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
]);

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

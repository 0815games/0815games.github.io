// Feldnotizen: Was ist veröffentlicht, was ist offen. Jede Zeile braucht DE und EN
// (tests/patch-notes.test.mjs prüft das). Neue Welle immer oben in RELEASED_PATCHES.
// Ein Eintrag behauptet keine Geräteabnahme, die nicht stattgefunden hat.

export const RELEASED_PATCHES = [
  {
    build: '20261124-welt1',
    date: '2026-11-24',
    items: [
      {
        de: 'Neue Spielwelt: Die Insel ist jetzt eine animierte Landschaft mit Tag und Nacht, Wolken, rauchenden Schornsteinen und Produktionssymbolen statt Kacheln.',
        en: 'New game world: the island is now an animated landscape with day and night, clouds, smoking chimneys and production icons instead of tiles.',
      },
      {
        de: 'Karte bedienen: Ziehen verschiebt, Mausrad und Zwei-Finger-Geste zoomen. Tastatur: Pfeiltasten, Enter, + und −.',
        en: 'Map controls: drag to pan, mouse wheel and two-finger pinch to zoom. Keyboard: arrow keys, Enter, + and −.',
      },
      {
        de: 'Anmeldebildschirm als erste Ansicht, mit animierter Insel im Hintergrund. Das Spiel erscheint erst nach der Anmeldung.',
        en: 'Sign-in screen as the first view, with an animated island in the background. The game appears only after sign-in.',
      },
      {
        de: 'Versionsprüfung: Neue Versionen werden beim Start und im Hintergrund erkannt. Die Seite lädt neu, sobald nichts gespeichert wird.',
        en: 'Version check: new versions are detected at start and in the background. The page reloads once nothing is unsaved.',
      },
      {
        de: 'Offline-Start ist nicht möglich: Ohne Verbindung zur Cloud bleibt das Spiel gesperrt, bis der Stand gelesen werden kann. Der lokale Stand bleibt als Sicherung erhalten.',
        en: 'No offline start: without a connection to the cloud the game stays locked until the save can be read. The local copy is kept as a backup.',
      },
      {
        de: 'Abmelden fragt vorher nach. Ein Konto kann in einem Browser nur in einem Fenster geöffnet sein.',
        en: 'Sign-out asks first. An account can be open in only one window per browser.',
      },
      {
        de: 'Tutorial: Einmal pro Konto mit acht Schritten. Über „Hilfe“ gibt es jederzeit die Übersicht aller Regeln.',
        en: 'Tutorial: eight steps, once per account. The help overview with all rules is available any time via “Help”.',
      },
      {
        de: 'Stand: im Code geprüft (Tests und Oberflächenlauf ohne echten Browser), noch nicht im Live-Projekt getestet.',
        en: 'Status: checked in code (tests and UI run without a real browser), not yet tested on the live project.',
      },
    ],
  },
  {
    build: '20261124-konto2',
    date: '2026-11-24',
    items: [
      {
        de: 'Ladeproblem: Hängt die Cloud, bleibt das Spiel nicht mehr auf „Stadt wird geladen“ stehen. Nach 10 Sekunden gibt es einen Knopf „Erneut versuchen“, und mit lokalem Stand wird weitergespielt.',
        en: 'Loading fix: if the cloud hangs, the game no longer stays on "Loading town". After 10 seconds a "Try again" button appears, and a local copy keeps you playing.',
      },
      {
        de: 'Verbindungsanzeige unter dem Spielfeld: Cloud nicht erreichbar oder Stand noch nicht gelesen steht dort jetzt ausdrücklich.',
        en: 'Connection status under the board now says explicitly when the cloud is unreachable or the save is not read yet.',
      },
      {
        de: 'Stand: im Code geprüft (Zeitlimit mit Tests), im Browser noch nicht gegen das Live-Projekt getestet.',
        en: 'Status: checked in code (time limit with tests), not yet tested in a browser against the live project.',
      },
    ],
  },
  {
    build: '20261124-konto1',
    date: '2026-11-24',
    items: [
      {
        de: 'Konto: Registrierung und Anmeldung mit E-Mail und Passwort im Code angelegt.',
        en: 'Account: sign-up and sign-in with e-mail and password implemented in code.',
      },
      {
        de: 'Cloud-Speicherstand: Die Stadt wird in der Realtime Database gespeichert. Die Regeln sind noch nicht veröffentlicht.',
        en: 'Cloud save: the town is stored in the Realtime Database. The rules are not yet published.',
      },
      {
        de: 'Feldnotizen im Spiel über den Knopf oben (Stand: Branch, noch nicht auf main).',
        en: 'Field notes in the game via the button at the top (status: branch, not yet on main).',
      },
    ],
  },
];

// Noch nicht erledigt oder nicht belegt. Getrennt von dem, was veröffentlicht ist.
export const OPEN_ITEMS = [
  {
    de: 'Die Realtime-Database-Regeln sind im Repo, aber noch nicht in Firebase veröffentlicht. Bis dahin bleibt der Speicher gesperrt.',
    en: 'The Realtime Database rules are in the repo but not yet published in Firebase. Until then storage stays locked.',
  },
  {
    de: 'Die Emulator-Tests für die Regeln sind noch nicht eingerichtet.',
    en: 'Emulator tests for the rules are not set up yet.',
  },
  {
    de: 'Auf einem echten Gerät ist die Anmeldung noch nicht geprüft.',
    en: 'Sign-in has not yet been checked on a real device.',
  },
];

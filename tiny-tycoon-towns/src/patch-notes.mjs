// Feldnotizen: Was ist veröffentlicht, was ist offen. Jede Zeile braucht DE und EN
// (tests/patch-notes.test.mjs prüft das). Neue Welle immer oben in RELEASED_PATCHES.
// Ein Eintrag behauptet keine Geräteabnahme, die nicht stattgefunden hat.

export const RELEASED_PATCHES = [
  {
    build: '20261124-sitz9',
    date: '2026-11-24',
    items: [
      {
        de: 'Fenster lassen sich durch einen Klick daneben schließen: Lager und Geld, Hilfe und das Feld-Fenster. Wichtige Entscheidungen bleiben offen, bis du sie triffst.',
        en: 'Windows close with a click outside them: stock and money, help and the tile window. Important decisions stay open until you make them.',
      },
    ],
  },
  {
    build: '20261124-sitz8',
    date: '2026-11-24',
    items: [
      {
        de: 'Der Betreiber-Bereich hat jetzt einen eigenen Knopf auf der Anmeldeseite.',
        en: 'The operator area now has its own button on the sign-in page.',
      },
    ],
  },
  {
    build: '20261124-sitz7',
    date: '2026-11-24',
    items: [
      {
        de: 'Betreiber-Bereich für die Verwaltung der Städte. Erreichbar über die Anmeldeseite.',
        en: 'Operator area for managing towns. Reachable from the sign-in page.',
      },
    ],
  },
  {
    build: '20261124-sitz6',
    date: '2026-11-24',
    items: [
      {
        de: 'Die Karte füllt den ganzen Bildschirm. Ein Tipp auf ein Feld öffnet ein kleines Fenster mit den Bauoptionen, durchblätterbar mit ‹ ›.',
        en: 'The map fills the whole screen. Tapping a tile opens a small window with build options, which you can browse with ‹ ›.',
      },
      {
        de: 'Lager, Münzen und Eberhards Angebote liegen jetzt unter „Lager und Geld“ unten links.',
        en: 'Stock, coins and Eberhard\'s offers are now under “Stock and money” at the bottom left.',
      },
    ],
  },
  {
    build: '20261124-sitz5',
    date: '2026-11-24',
    items: [
      {
        de: 'Neue Oberfläche: Münzen, Stadtlevel und Name schweben auf der Karte. Hilfe, Feldnotizen, Neu beginnen und Abmelden sind im Menü oben rechts.',
        en: 'New layout: coins, town level and name float on the map. Help, field notes, restart and sign-out are in the menu at the top right.',
      },
    ],
  },
  {
    build: '20261124-sitz4',
    date: '2026-11-24',
    items: [
      {
        de: 'Neues Logo ohne Kasten: die Stadt freigestellt, der Spielname darüber.',
        en: 'New logo without a box: the town cut out, the game name above it.',
      },
    ],
  },
  {
    build: '20261124-sitz3',
    date: '2026-11-24',
    items: [
      {
        de: 'Neues Logo: die Stadt mit dem Spielnamen darüber, auf der Anmeldeseite und im Intro.',
        en: 'New logo: the town with the game name above it, on the sign-in page and in the intro.',
      },
    ],
  },
  {
    build: '20261124-sitz2',
    date: '2026-11-24',
    items: [
      {
        de: 'Fehler behoben: Die Schaltfläche „Hilfe“ und das Tutorial funktionierten nicht. Beides ist wieder da.',
        en: 'Fixed: the Help button and the tutorial did not work. Both are back.',
      },
      {
        de: 'Das Intro mit Logo wird jetzt beim Öffnen der Seite gezeigt, bevor die Anmeldung erscheint.',
        en: 'The intro with the logo now plays when the page opens, before the sign-in appears.',
      },
    ],
  },
  {
    build: '20261124-sitz1',
    date: '2026-11-24',
    items: [
      {
        de: 'Ein Konto ist jetzt auf allen Geräten nur einmal gleichzeitig offen. Ein zweites Fenster oder Gerät zeigt einen Hinweis und kann die Sitzung hier übernehmen.',
        en: 'An account is now open only once at a time across all devices. A second window or device shows a notice and can take over the session.',
      },
      {
        de: 'Übernommene Sitzung: Das bisherige Fenster speichert nichts mehr und zeigt, dass das Konto woanders übernommen wurde.',
        en: 'Taken-over session: the previous window stops saving and shows that the account was taken over elsewhere.',
      },
      {
        de: 'Neue Anmeldung: kurzes Intro mit Logo und Titel, danach die Anmeldekarte. Ein Klick überspringt es.',
        en: 'New sign-in: a short intro with logo and title, then the sign-in card. A click skips it.',
      },
      {
        de: 'Neues Logo der Stadt, auf dem Anmeldebildschirm und in der Karte.',
        en: 'New town logo on the sign-in screen and card.',
      },
      {
        de: 'Neues App-Icon: Inselstadt statt Haus-Symbol. Auf dem Startbildschirm von iPhone und Android, mit eigenem Manifest.',
        en: 'New app icon: an island town instead of the house symbol. On iPhone and Android home screens, with its own manifest.',
      },
      {
        de: 'Stand: im Code und mit dem Regel-Trockenlauf geprüft. Die Regeln müssen vom Betreiber in Firebase veröffentlicht werden, bevor die Sperre greift.',
        en: 'Status: checked in code and with the rules dry run. The operator must publish the rules in Firebase before the lock takes effect.',
      },
    ],
  },
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

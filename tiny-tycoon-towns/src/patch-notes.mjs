// Stadtchronik: Was ist veröffentlicht, was ist offen. Jede Zeile braucht DE und EN
// (tests/patch-notes.test.mjs prüft das). Neue Welle immer oben in RELEASED_PATCHES.
// Ein Eintrag behauptet keine Geräteabnahme, die nicht stattgefunden hat.

export const RELEASED_PATCHES = [
  {
    build: '20261125-anfrage1',
    date: '2026-11-25',
    items: [
      {
        de: 'Freundschaftsanfragen erscheinen als Popup, solange du spielst. Du kannst annehmen, ablehnen oder später entscheiden.',
        en: 'Friend requests appear as a pop-up while you are playing. You can accept, decline or decide later.',
      },
      {
        de: 'Offene Anfragen zeigt das Menü oben rechts mit einem roten Punkt und der Anzahl. Der Punkt bleibt, bis du sie beantwortest, auch wenn du dich später anmeldest.',
        en: 'Open requests show as a red dot with the count on the menu at the top right. The dot stays until you answer, even if you sign in later.',
      },
    ],
  },
  {
    build: '20261125-lager1',
    date: '2026-11-25',
    items: [
      {
        de: 'Lager und Geld liegt unten links als Leiste. Auf dem Handy ist sie eingeklappt, der Pfeil klappt die Liste aus. Am Desktop ist sie offen und zeigt alle Ressourcen mit Bestand, Obergrenze und Zuwachs.',
        en: 'Storage and coins sit in a bar at the bottom left. On a phone it is collapsed, the arrow expands the list. On desktop it is open and shows every resource with stock, cap and income.',
      },
      {
        de: 'Ist ein Lager voll, wird die Leiste rot und zeigt ein kleines Ausrufezeichen. Ein Tipp auf die Leiste öffnet die Gesamtansicht.',
        en: 'When a storage is full, the bar turns red and shows a small exclamation mark. Tapping the bar opens the full view.',
      },
      {
        de: 'Handel: Verkaufen und Kaufen sind jetzt kleine Schalter statt großer Felder.',
        en: 'Trade: selling and buying are now small toggles instead of large fields.',
      },
      {
        de: 'Freundesanfragen: Fehler in den Datenbankregeln behoben. Dafür müssen die Regeln neu veröffentlicht werden.',
        en: 'Friend requests: fixed an error in the database rules. The rules must be published again for this.',
      },
    ],
  },
  {
    build: '20261124-konvoi1',
    date: '2026-11-24',
    items: [
      {
        de: 'AFK-Modus: Nach 5 Minuten ohne Eingabe wird deine Stadt gesichert und du wirst abgemeldet. Danach erscheint ein Hinweis auf dem Anmeldebildschirm.',
        en: 'AFK mode: after 5 minutes without input your town is saved and you are signed out. A notice then appears on the sign-in screen.',
      },
      {
        de: 'Zweites Gerät: Wenn du dich auf einem zweiten Gerät anmeldest, fragt nur dieses Gerät, ob du abmelden oder hierbleiben willst. Das andere Gerät meldet sich ohne Rückfrage ab.',
        en: 'Second device: when you sign in on a second device, only that device asks whether to sign out or stay. The other device signs out without a prompt.',
      },
      {
        de: 'Handel mit Nachbarstädten: Im Menü „Handel“ schickst du einen Konvoi mit Ware in eine Nachbarstadt. Vor dem Start siehst du Dauer, Kosten und Ertrag. Es laufen höchstens zwei Konvois gleichzeitig. Wenn ein Konvoi angekommen ist, rechnest du ihn ab. Münzen, Ware und Erfahrung kommen dann in deine Stadt.',
        en: 'Trade with neighbouring towns: in the menu "Handel" you send a convoy with goods to a neighbouring town. Before departure you see duration, cost and yield. At most two convoys run at the same time. When a convoy has arrived, you settle it. Coins, goods and experience then go to your town.',
      },
      {
        de: 'Kronen aus abgerechneten Konvois werden auf dein Konto gutgeschrieben und im Handels-Dialog angezeigt. Die Gutschrift wird nachgeholt, falls sie beim Abrechnen nicht gespeichert werden konnte.',
        en: 'Crowns from settled convoys are credited to your account and shown in the trade dialog. The credit is caught up if it could not be saved when you settled.',
      },
      {
        de: 'Die Konvoi-Werte (Dauer, Distanzsteuer, Eilpost) sind nur in der Simulation und in Tests geprüft, noch nicht auf einem echten Gerät.',
        en: 'The convoy values (duration, distance tax, express post) are checked only in simulation and tests, not yet on a real device.',
      },
    ],
  },
  {
    build: '20261124-zentrieren',
    date: '2026-11-24',
    items: [
      {
        de: 'Klicken auf ein Feld verschiebt die Karte nicht mehr. Die Pfeiltasten zentrieren weiterhin die Auswahl.',
        en: 'Clicking a tile no longer moves the map. The arrow keys still centre the selection.',
      },
      {
        de: 'Freibriefe erst ab Stadtlevel 10 (vorher 8). Die Stadt braucht dafür 100.000 Münzen Gesamtertrag.',
        en: 'Charters now need town level 10 (previously 8). The town also needs 100,000 coins of total yield.',
      },
      {
        de: 'Balance (Simulation, kein Test am Gerät): Stadtlevel 5 nach etwa 4 bis 4,5 Stunden aktiver Spielzeit in Tiefwald, Hochland und Küste. Stadtlevel 10 braucht mehr Ausbauten. Flusslande (Riverlands) hat jetzt nur Stein als knappe Ressource, dafür bleibt Holz ohne Abzug.',
        en: 'Balance (simulation, not tested on a device): town level 5 after about 4 to 4.5 active hours in Deep Woods, Highlands and Coast. Town level 10 needs more upgrades. Riverlands now has only stone as a scarce resource, so lumber is no longer penalised.',
      },
    ],
  },
  {
    build: '20261124-chronik',
    date: '2026-11-24',
    items: [
      {
        de: 'Die Feldnotizen heißen jetzt Stadtchronik. Der Knopf oben im Menü ist unverändert.',
        en: 'Field notes are now called Stadtchronik. The button at the top of the menu is unchanged.',
      },
      {
        de: 'Freibriefe: Wenn deine Stadt Stadtlevel 8 und 100.000 Münzen Gesamtertrag erreicht hat, kannst du einen Freibrief gründen. Die Stadt startet neu, Name und Freunde bleiben. Der Perk-Baum wirkt auf Ertrag, Lager, Verkaufspreis und Offline-Zeit. Eilpost folgt mit den Konvois. Die Regeln für Freibriefe müssen noch veröffentlicht werden.',
        en: 'Charters: once your town reaches town level 8 and 100,000 coins of total yield, you can found a charter. The town restarts, the name and friends stay. The perk tree affects yield, storage, sale price and offline time. Express post follows with convoys. The charter rules still have to be published.',
      },
      {
        de: 'Münzen stehen jetzt oben auf der Karte. Beim Bauen zeigen Symbole, wie viel Geld und Material du hast: grün genug, rot zu wenig. Dazu steht, was fehlt.',
        en: 'Coins now show at the top of the map. When building, symbols show how much money and material you have: green is enough, red is too little. The missing amount is named as well.',
      },
    ],
  },
  {
    build: '20261124-sitz18',
    date: '2026-11-24',
    items: [
      {
        de: 'Vorbereitung der Freibriefe (Prestige): Die Rechenregeln und der Perk-Baum stehen. Im Spiel ändert sich noch nichts.',
        en: 'Preparing charters (prestige): the rules and the perk tree are in place. Nothing changes in the game yet.',
      },
    ],
  },
  {
    build: '20261124-sitz17',
    date: '2026-11-24',
    items: [
      {
        de: 'Freunde können dich jetzt auch finden, wenn du seit dem Update nichts an deiner Stadt geändert hast.',
        en: 'Friends can find you now even if you have not changed your town since the update.',
      },
    ],
  },
  {
    build: '20261124-sitz16',
    date: '2026-11-24',
    items: [
      {
        de: 'Die offenen Punkte im Spiel sind aktualisiert: Die Regeln sind veröffentlicht.',
        en: 'The open items in the game are updated: the rules are published.',
      },
    ],
  },
  {
    build: '20261124-sitz15',
    date: '2026-11-24',
    items: [
      {
        de: 'Flüssigerer Übergang vom Intro zur Anmeldung: Das Logo verschwindet nicht mehr, sondern fliegt sanft an seinen Platz.',
        en: 'Smoother transition from the intro to sign-in: the logo no longer disappears and glides into its place.',
      },
    ],
  },
  {
    build: '20261124-sitz14',
    date: '2026-11-24',
    items: [
      {
        de: 'Das Intro-Logo fliegt jetzt an seinen Platz oben auf der Anmeldung und bleibt dort. Die Anmeldung baut sich darum auf.',
        en: 'The intro logo now flies into its place at the top of the sign-in card and stays there. The sign-in builds around it.',
      },
      {
        de: 'Besuchen: Bei einem Freund öffnest du seine Stadt zum Ansehen. Sie wird mit der aktuellen Zeit weitergerechnet. Dabei wird nichts verändert.',
        en: 'Visit: open a friend\'s town to look at it. It is advanced to the current time. Nothing is changed.',
      },
    ],
  },
  {
    build: '20261124-sitz13',
    date: '2026-11-24',
    items: [
      {
        de: 'Freunde: Im Menü öffnest du „Freunde“. Dort siehst du deinen Freundescode, lädst per Name oder Code ein und verwaltest deine Freundesliste.',
        en: 'Friends: open "Freunde" in the menu. There you see your friend code, invite by name or code, and manage your friend list.',
      },
      {
        de: 'Stadtnamen sind jetzt eindeutig. Ein vergebener Name lässt sich nicht mehr wählen.',
        en: 'Town names are now unique. A name that is taken cannot be chosen again.',
      },
    ],
  },
  {
    build: '20261124-sitz12',
    date: '2026-11-24',
    items: [
      {
        de: 'Fremde Städte kannst du jetzt ansehen: Name, Level und Gebäude. Münzen und Lager bleiben privat.',
        en: 'You can now view other towns: name, level and buildings. Coins and stock stay private.',
      },
      {
        de: 'Ändert der Betreiber deine Stadt, siehst du einen Hinweis und lädst das Spiel neu. So geht nichts verloren.',
        en: 'If the operator changes your town, you see a notice and reload the game. Nothing gets overwritten.',
      },
    ],
  },
  {
    build: '20261124-sitz11',
    date: '2026-11-24',
    items: [
      {
        de: 'Alle Rückfragen und Hinweise laufen jetzt im Spiel-Design: „Neu beginnen“, Stadt löschen, Stadtname. Auch die Scrollbalken passen zum Spiel.',
        en: 'All confirmations and notices now use the game design: "start over", delete town, town name. Scrollbars match the game too.',
      },
    ],
  },
  {
    build: '20261124-sitz10',
    date: '2026-11-24',
    items: [
      {
        de: 'Das Bau-Fenster sitzt jetzt mittig am unteren Rand, auch im Hochformat, und wirkt aufgeräumter.',
        en: 'The build window is now centered at the bottom, also in portrait mode, and looks tidier.',
      },
    ],
  },
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
    de: 'Cloud-Speichern schlägt noch fehl. Ursache ist nicht abschließend geklärt, die Fehlermeldung aus der Konsole fehlt noch.',
    en: 'Cloud saving still fails. The cause is not yet confirmed, the console error is still missing.',
  },
  {
    de: 'Die Regeln für Freibriefe mit dem neuen Kronen-Feld müssen noch im Betreiber-Bereich veröffentlicht werden. Bis dahin kann die Gutschrift nicht gespeichert werden.',
    en: 'The charter rules with the new crowns field still have to be published by the operator. Until then the credit cannot be saved.',
  },
  {
    de: 'Freunde, Einladungen und Besuche sind noch nicht auf einem echten Gerät geprüft.',
    en: 'Friends, invitations and visits have not yet been checked on a real device.',
  },
  {
    de: 'Alte Städte, die schon vor den eindeutigen Namen den gleichen Namen tragen, bleiben vorerst unverändert.',
    en: 'Older towns that already share a name keep it for now.',
  },
  {
    de: 'Die Emulator-Tests für die Regeln sind noch nicht eingerichtet.',
    en: 'Emulator tests for the rules are not set up yet.',
  },
];

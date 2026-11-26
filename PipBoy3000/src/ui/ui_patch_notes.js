// Patch-Notizen: was die letzte Version geaendert hat, lesbar im Spiel.
//
// Vorbild sind IronPath/patch-notes.mjs und
// tiny-tycoon-towns/src/patch-notes.mjs. Beide zeigen denselben Aufbau:
// veroeffentlichte Wellen und offene Punkte getrennt, jeder Eintrag mit
// Kennung, Titel und Zeilen. Dieses Projekt hat dafuer bisher nur
// docs/change.log gebraucht - eine Markdown-Datei im Repo, die der Spieler im
// Spiel nie sieht. Ein Update ohne sichtbare Begruendung ist aber genau das,
// was als "was hat sich geaendert?" zurueckkam.
//
// Regeln, die diese Datei einhaelt:
//
//   * nur Darstellung. Kein Netzwerk, kein Spielstand, keine Konten. Wenn die
//     Datei nicht laedt, bricht nichts anderes;
//   * jeder Eintrag ist auf Deutsch. Das Spiel ist einsprachig deutsch; eine
//     zweite Sprache waere hier eine Behauptung, die niemand prueft;
//   * veroeffentlicht und offen bleiben getrennt. Eine gruene Testsuite ist
//     keine Abnahme am Geraet, und eine Abnahme hier waere erfunden;
//   * der oberste Eintrag traegt die Version aus `shell/Version`. Genau das
//     prueft tools/patch.mjs check - sonst zeigt das Fenster "NEU" fuer etwas,
//     das die Datei nicht hergibt.
window.GameData = window.GameData || {};

// Was noch offen ist. Diese Liste ist die ehrliche Gegenseite zu den
// veroeffentlichten Eintraegen und bleibt bestehen, bis es erledigt ist.
window.GameData.offenePunkte = [
    'Geräteabnahme: die Ansichten wurden im Browser mit Test-Doubles und als gerenderte Bilder geprüft, nicht auf einem echten Telefon.',
    'Befund 8 aus docs/BEFUNDE.md: *.log in .gitignore trifft auch docs/change.log, der build.json-Hash deckt style.css nicht ab, src/admin.js hat keine Tests.',
    'deployCamp verbraucht den Bausatz nicht; Nuka Cola heilt 15 statt der angegebenen 10.',
    'Der RAD-Balken nutzt noch einen Platzhalter (+1000) statt des echten Strahlungswerts.'
];

// Veroeffentlichte Versionen, neueste zuerst. Nach jedem echten Release wird
// hier ein Eintrag ergaenzt - mit dem, was tatsaechlich ausgeliefert wurde,
// nicht mit dem, was geplant war.
window.GameData.RELEASED_PATCHES = [
  {
    version: '14.0.29',
    datum: '2026-11-26',
    title: 'Tutorial-Steuerung und Ein-Klick-Ablauf',
    punkte: [
      'Die Karte erklärt jetzt WASD und Pfeiltasten am Desktop sowie Halten und Ziehen auf dem Handy.',
      'Menü, Inventar und Aufgaben öffnen sich mit einem Tutorial-Klick; nach erfolgreichem Laden geht es direkt weiter.',
      'Der Aufgaben-Schritt erklärt ESC und SCHLIESSEN für den Rückweg. Der Kampf-Schritt erklärt zufällige Begegnungen beim Laufen und den FEUER-Knopf.'
    ]
  },
  {
    version: '14.0.28',
    datum: '2026-11-26',
    title: 'Tutorial als Mission',
    punkte: [
      'Unter AUFGABEN steht das Tutorial als eigene Mission mit Fortschritt und einem Knopf zum Fortsetzen.',
      'Das X pausiert nur; der aktuelle Schritt wird pro Spielstand gespeichert und nach erneutem Einloggen fortgesetzt.',
      'Die Mission ist erst abgeschlossen, wenn alle Schritte erledigt sind. Der Kampfschritt wartet auf eine echte Begegnung und kann bis dahin pausiert werden.',
      'Bereits als fertig gespeicherte Tutorials bleiben abgeschlossen; über das Menü kann man sie erneut starten.'
    ]
  },
  {
    version: '14.0.27',
    datum: '2026-11-26',
    title: 'Update-Bestätigung, Tutorial und Speicher-Meldungen',
    punkte: [
      'Neue Versionen werden nach JETZT LADEN geladen. Die anschließende Bestätigung lädt nach OK die Seite einmal neu, ohne das Popup erneut zu zeigen.',
      'Das Tutorial steht unten mittig innerhalb des Spielfelds statt außerhalb rechts oben.',
      'Automatische Speicherungen laufen weiter, aber die wiederholten Erfolgsmeldungen im Log entfallen.'
    ]
  },
  {
    version: '14.0.26',
    datum: '2026-11-26',
    title: 'Neues Pip-Boy-App-Icon',
    punkte: [
      'Das gewählte neue App-Icon zeigt ein leuchtend grünes P auf einem Retro-Terminal statt des Roboters.',
      'Für iPhone, Android und Browser gibt es passende Varianten. Bereits installierte Icons können noch zwischengespeichert sein.'
    ]
  },
  {
    version: '14.0.25',
    datum: '2026-11-25',
    title: 'Neues App-Icon im Retro-Future-Look',
    punkte: [
      'Ein kleiner Ödland-Roboter mit leuchtendem Bildschirmgesicht und Messingdetails ersetzt die Vault-Tür.',
      'Das neue Artwork gibt es für Android, iPhone und den Browser-Tab. Bereits installierte Icons können vom Gerät zwischengespeichert werden.'
    ]
  },
  {
    version: '14.0.24',
    datum: '2026-11-24',
    title: 'Patch-Notizen öffnen unter dem Header · Menüpunkt „Nach Update suchen" entfernt',
    punkte: [
      'Patch-Notizen und Handbuch liegen jetzt nativ in #main-content (wie Navigation und Signale) statt direkt unter #pipboy-case: sie öffnen sich unterhalb der Headerleiste, TP/KK/MUN und der Menü-Knopf bleiben frei. Vorher deckte #pipboy-case > .unter-header-fenster (z-index 1000) den gesamten Bildschirm samt Header zu.',
      'Wer die Patch-Notizen auf dem Login-Schirm öffnet und dann einsteigt, sieht sie beim Spielstart weiterhin unter dem Header: UI.startGame() holt beide Fenster aus #pipboy-case zurück nach #main-content.',
      'showPatchNotes und showManualOverlay rufen die Fenster-Logik jetzt direkt über UI auf statt über this - auch ungebundene Aufrufe (Callback-Referenzen) hängen das Fenster korrekt ein.',
      'Der Menüpunkt „NACH UPDATE SUCHEN" ist entfernt. Die Versionsprüfung läuft automatisch: beim Start, alle 60 Sekunden und sofort, wenn der Tab wieder sichtbar wird - das Update-Fenster erscheint von selbst, sobald eine neue Version auf dem Server liegt.'
    ]
  },
  {
    version: '14.0.23',
    datum: '2026-11-24',
    title: 'Zielführung repariert: Setzen per Karte, Menü & Aufgaben sowie Richtungspfeil am Spieler',
    punkte: [
      'Weltkarte (WELT): Touch-Gesten brechen nicht mehr durch das Scrollen von #view-container ab (touch-action: none), Ghost-Clicks nach touchend schließen die Bestätigung nicht mehr sofort, und die 500-ms-Sperre beim ruhigen Zielen entfällt (gemessen wird die maximale Ziehstrecke).',
      'Burger-Menü -> NAVIGATION: Zahlenfelder fangen Enter jetzt zum Setzen des Ziels ab (statt einen alten Fokus-Knopf im Hintergrund auszulösen), Pfeiltasten im Eingabefeld werden nicht mehr gekapert, und ESC schließt das Fenster sauber.',
      'Richtungspfeil im Spiel: zusätzlich zum Kompass-Pfeil neben der Sektor-Anzeige zeigt ein leuchtend grüner Pip-Boy-Peilpfeil direkt an der Spielerfigur auf der Sektorkarte die Richtung; auf der Weltkarte dreht der Kompass mit und die GPS-Zeile nennt das aktive Ziel.',
      'Sektorwechsel & Quest-Pin: Überqueren einer Sektorgrenze (changeSector) aktualisiert Richtung und Ankunft sofort; Anpinnen einer Orts-Quest in AUFGABEN setzt automatisch die Zielführung.',
      'Update-Fenster nach Versionssprung: die Bestätigung "NEUE VERSION ... GELADEN" hat jetzt einen OK-Knopf und lässt das Spiel nicht mehr mit gesperrten Klicks stehen.'
    ]
  },
  {
    version: '14.0.22',
    datum: '2026-11-24',
    title: 'Burger-Menü: alle Fenster öffnen unter dem Header im Kartenbereich',
    punkte: [
      'Jedes Fenster aus dem Burger-Menü (Handbuch, Patch-Notizen, Navigation, Vault Legends, Bug-Melden, Signale sowie alle Ansichten) öffnet sich jetzt in #main-content unterhalb des oberen Headers - TP, KK, MUN und der Menü-Knopf bleiben frei sichtbar.',
      'Patch-Notizen, Navigation und Signale hatten bisher gar keine CSS-Positionierung und schoben als statische Elemente den gesamten Spielschirm samt Header nach unten. Alle teilen sich jetzt .unter-header-fenster (position: absolute; inset: 0 in #main-content).',
      'Das Burger-Menü selbst hängt direkt an der Unterkante des Headers (top: 0, max-height: 100% in #main-content) und schließt sich zuverlässig bei jedem Menüpunkt - es bleibt nicht mehr mit z-index 999999 über Vault Legends, Navigation, Bug-Melden oder der Update-Suche stehen.',
      'Wechsel zwischen Unterfenstern oder Ansichten räumt das zuvor offene Unterfenster ab (kein Stapeln); ESC schließt Handbuch, Patch-Notizen, Navigation, Bug-Melden und Signale.',
      'Klicks in Unterfenstern, die ihren Inhalt neu zeichnen (z. B. Reiterwechsel in Patch-Notizen), werfen die darunterliegende Ansicht nicht mehr ungewollt auf die Karte zurück.',
      'Auf dem Login-Schirm (ohne Spiel-Header) hängen Anleitung und Patch-Notizen weiterhin in #pipboy-case und bleiben dort voll bedienbar.'
    ],
    offen: [
      'Neue Layout-Prüfung (tests/menue-fenster-layout.test.mjs) prüft DOM-Hierarchie und berechnete CSS-Werte gegen das gebaute Bündel; eine echte Sichtprüfung auf physischem Telefon steht weiter aus.'
    ]
  },
  {
    version: '14.0.21',
    datum: '2026-11-24',
    title: 'Tutorial: die ersten Schritte, interaktiv',
    punkte: [
      'Neuer Charakter, neue Frage: wie ging das noch? Nach der Permadeath-Warnung steht jetzt unten rechts eine Sprechblase und zeigt auf das, was gerade dran ist.',
      'Sieben Schritte: Karte, Bewegung, Menü, Inventar, Aufgaben, Kampf, Schluss. Jeder Schritt will die Handlung sehen, nicht nur ein Weiter.',
      'Solange nichts passiert ist, steht dort WARTE AUF DICH und es gibt keinen Weiter-Knopf. Sonst klickt man sich durch und hat nichts gelernt.',
      'Bei Menü, Inventar und Aufgaben öffnet der Knopf selbst das Ziel. Wer schon im Inventar steht, springt direkt weiter - und das Menü schließt sich dabei.',
      'Der Kampf-Schritt ist weich: dort steht TROTZDEM WEITER. Wer im Tutorial keinem Gegner begegnet, soll nicht festsitzen.',
      'Kein Fenster mit Sperre. Die Blase lässt alles bedienbar, worauf sie zeigt - man soll ja genau das anklicken.',
      'Der Stand liegt im Spielstand. Abgebrochen und neu geladen? Es geht dort weiter, wo du warst, nicht bei Schritt 1.',
      'Nochmal sehen: Menü - TUTORIAL. Oder das X in der Blase, dann ist es für diesen Charakter erledigt.',
      'Das Tutorial hängt am Schließen der Permadeath-Warnung, nicht an einer Uhr. Wer die Warnung lange liest, verliert nichts.'
    ],
    offen: [
      'Getestet ist der Ablauf im Browser-Ersatz (jsdom) mit echtem Server für die Templates. Auf einem echten Gerät mit Finger statt Maus steht die Prüfung aus.',
      'Die Sprechblase steht auf schmalen Bildschirmen unten - dort, wo bei manchen Handys die Daumenleiste ist. Wenn sie im Weg ist: das X schließt sie dauerhaft.'
    ]
  },
  {
    version: '14.0.20',
    datum: '2026-11-24',
    title: 'Zwei Loecher im AFK-Schutz gestopft',
    punkte: [
      'Wer im AFK-Fenster daneben tippte, war damit wieder da - die Uhr wurde zurueckgesetzt. Das Fenster merkte das aber nicht und meldete ihn trotzdem ab. Jetzt geht es zu, sobald eine echte Eingabe kommt.',
      'Bei offenem Fenster reagierte das Spiel dahinter auf Tastendruecke: Escape und die Pfeiltasten bewegten die Ansicht, waehrend das Fenster noch stand. Die Tastatur gehoert jetzt dem Fenster; Escape bleibt fuers offene Menue zustaendig, damit man sich nicht aussperrt.',
      'Beides mit Test und Gegenprobe.'
    ],
    offen: [
      'Die Fenster lassen sich hier nicht als Bild ansehen - in der Arbeitsumgebung ist kein Browser installiert. Geprueft sind Aufbau, Texte, CSS und Verhalten; die Optik auf einem echten Geraet steht aus.'
    ]
  },
  {
    version: '14.0.19',
    datum: '2026-11-24',
    title: 'Durchsicht: Fenster sperren jetzt richtig, und ein Klick wirft nicht mehr raus',
    punkte: [
      'Das AFK- und das Update-Fenster sagen "modal", sperrten aber nichts. Der Hintergrund war nur abgedunkelt: ein Klick auf die Karte bewegte den Spieler unter dem Fenster weg, und ein Screenreader las weiter.',
      'Jetzt ist der Hintergrund gesperrt, solange ein Fenster steht - und danach sofort wieder frei.',
      'Dabei fiel auf: das Update-Fenster lag in der gesperrten Flaeche. Mit der neuen Sperre waeren seine eigenen Knoepfe tot gewesen. Es steht jetzt bei den Overlays, ausserhalb.',
      'Ein Klick auf "SPAETER" oder "JETZT LADEN" warf den Spieler aus dem Inventar zurueck auf die Karte. Derselbe Fehler traf "ICH BIN DA" im AFK-Fenster. Beides ist behoben.',
      'Der AFK-Countdown rechnet jetzt mit einer festen Endzeit. Vorher hat jede Pruefung neu ab "jetzt" gezaehlt - der Balken konnte springen, wenn die Schleife spaeter kam.',
      'Kleine Texte mit Umlauten: "seit fünf Minuten", "AFK: ZEITÜBERSCHREITUNG", "VERFÜGBAR", "SPÄTER". Vorher stand da "fuenf" und "ZEITUEBERSCHREITUNG" - im Login lesbar.',
      'Geprueft am ausgelieferten Spiel: Fenster mittig, Text, Zaehler, Sperre, Knoepfe erreichbar, Ansicht bleibt stehen.'
    ],
    offen: [
      'Die ICO-Datei ist 0,9 kB klein. Das ist kein Fehler, sondern Absicht: drei PNG-Eintraege, schlichte Farbflaechen, gut komprimierbar.',
      'Auf einem echten Geraet (Finger, echter Bildschirm) steht die Sichtpruefung der Fenster noch aus.'
    ]
  },
  {
    version: '14.0.18',
    datum: '2026-11-24',
    title: 'Vault-Tuer als Icon · AFK-Fenster · Update-Fenster mittig',
    punkte: [
      'Das App-Icon ist jetzt die zackige Vault-Tuer: acht Trapez-Zaehne am Rand, dunkler Kranz mit acht Speichen, achteckige Innenplatte, Messingschild mit der 33.',
      'Die 33 traegt nur die grosse Fassung. Bei 16 px waeren das vier Pixel - ein Fleck, keine Ziffer. Die kleine Fassung ist dafuer kraeftiger im Zahnkranz.',
      'AFK: Die Zeit steht bei fuenf Minuten - das war sie vorher auch, aber es passierte ein stiller Logout. Jetzt kommt ein Fenster in der Mitte: BIST DU NOCH DA? mit Countdown und Balken. Ein Klick holt zurueck.',
      'Erst nach weiteren 60 Sekunden ohne Reaktion wird abgemeldet, mit Grund im Login-Text. Man hat also eine Minute, um zurueckzukommen.',
      'Das Update-Fenster war ein Balken unten am Rand, leicht zu uebersehen und auf dem Handy hinter der Daumenleiste. Es ist jetzt mittig, in derselben Form wie der AFK-Schutz.',
      'Beide Fenster rasten ein: zwei Stufen mit kurzem Ueberschwingen wie ein Relais, dann eine Scanlinie darueber. Wer im System Bewegung abbestellt hat, bekommt sie ohne Animation.',
      'Zwei Uhren sind zu einer geworden: die alte stille Abmeldung in ui_core.js und ui_render_core.js ist raus, die Pruefung sitzt in src/ui/ui_afk.js.'
    ],
    offen: [
      'Der AFK-Schutz haengt an update(). Steht das Spiel (kein Zug, kein Dialog), laeuft die Schleife trotzdem weiter - geprueft ist der Fall, in dem der Tab im Hintergrund war.',
      'Das Fenster laesst sich nicht mit Escape schliessen; nur der Knopf holt zurueck. Das ist Absicht: Escape wuerde wie "wegklicken" wirken und die Abmeldung trotzdem ausloesen.'
    ]
  },
  {
    version: '14.0.17',
    datum: '2026-11-24',
    title: 'App-Icon · der Kreisel vom Ladebildschirm',
    punkte: [
      'Korrektur zu 14.0.16: Der Ladebildschirm bleibt, wie er war. Der Kreisel war richtig und wird nicht angefasst.',
      'Das App-Icon zeigt jetzt genau dieses Motiv: zwei gruene Boegen oben und unten, der gelbe Ring innen, in der Mitte der Reaktor mit Kern.',
      'Zwei Fassungen, weil ein Motiv nicht in jeder Groesse traegt. Ab 64 px mit zwoelf gelben Punkten, darunter mit dickeren Boegen und einem vollen gelben Ring - zwoelf Punkte auf 32 px waeren zwoelf einzelne Pixel und damit ein grauer Ring.',
      'Bei 16 px im Browser-Tab bleibt der Kreisel erkennbar: Kern in der Mitte, gelber Ring, Boegen oben und unten, offen links und rechts. Der Test misst genau diese drei Merkmale am Favicon.',
      'Das Favicon hat jetzt vier Farben statt zwei (Leuchtgruen, Gelb, das dunkle Gruen der Scheibe, Schwarz). Der Test prueft, dass es genau diese vier sind und keine Zwischentoene - Zwischentoene heisst weichgezeichnet.'
    ],
    offen: [
      'Bei 16 px kippt der gelbe Ring optisch in ein Kreuz - das ist bei 8x8 Pixeln nicht zu vermeiden. Der Kreisel ist dort trotzdem erkennbar, die Tuer waere es nicht.',
      'Das Icon ist aus denselben Formen nachgebaut wie der CSS-Kreisel, nicht daraus exportiert. Die Maeße stimmen ueberein, ein Pixel-fuer-Pixel-Abzug ist es nicht.'
    ]
  },
  {
    version: '14.0.15',
    datum: '2026-11-24',
    title: 'Navigation · Marker setzen, Richtung sehen',
    punkte: [
      'Klick oder Tap auf die Weltkarte setzt einen Marker und fragt nach: Sektor, Himmelsrichtung und Entfernung stehen im Feld, ZIEL SETZEN oder VERWERFEN.',
      'Der Marker ist nötig, weil die Karte mit einem Finger gezogen und mit zwei Fingern gezoomt wird. Ein Klick ohne Rückfrage hätte jedes Wischen zu einem Ziel gemacht.',
      'Neben der Sektor-Anzeige sitzt ein kleiner Pfeil. Er dreht sich in die Richtung des Ziels, mit Schwanz, damit man Nord und Süd unterscheiden kann. Der Sektor-Anzeiger nennt das Ziel: "[3,4] ▸ [7,2]".',
      'Im Ziel zeigt der Pfeil einen Ring und den Text ZIEL statt einer Richtung, die es nicht mehr gibt. Ziel erreicht heißt: gleicher Sektor.',
      'Auf der Karte: gelbes Fadenkreuz für den Marker, grünes für das gesetzte Ziel, dazwischen eine gestrichelte Linie.',
      'Navigation im Spielmenü: Sektor eintippen, aufheben, oder von Hand neu prüfen. Für Koordinaten aus einer Quest, ohne den Sektor auf der Karte treffen zu müssen.',
      'Das Ziel liegt im Spielstand und überlebt ein Neuladen.',
      'Dabei gefunden und behoben: die Karten-Ereignisse nahmen `this` als UI an, obwohl `this` dort die Leinwand ist. Nach einem Kartenaufbau arbeiteten sie auf einem alten Zustandsobjekt.',
      'Und: die Sektor-Anzeige wurde an zwei Stellen geschrieben. Beim Aufheben blieb das alte Ziel deshalb stehen. Anzeige und Pfeil kommen jetzt aus einer Funktion.'
    ],
    offen: [
      'Die Nadel zeigt nach Norden oben, nicht nach der Blickrichtung. Die Karte selbst ist auch nicht gedreht - die Nadel ist also stimmig zur Karte, aber ein Pfeil, der sich mit der Blickrichtung mitdreht, waere die naheliegendere Anzeige.',
      'Ein Weg von Sektor zu Sektor wird nicht berechnet - die Entfernung ist Luftlinie, nicht die Strecke um Hindernisse.',
      'Die Marke auf der Karte laesst sich nicht verschieben; ein neuer Klick setzt eine neue.'
    ]
  },
  {
    version: '14.0.14',
    datum: '2026-11-24',
    title: 'Patch-Ablauf · Update-Fenster im Spiel',
    punkte: [
      'Ein Patch-Werkzeug für das ganze Projekt: node tools/patch.mjs check prüft Stempel, Notizen, Geheimnisse und Bündel; bump zählt die Version hoch und schreibt alle Stellen, die sie tragen.',
      'Der Stempel steht jetzt an zehn Stellen und wird gegeneinander geprüft. Vorher liefen shell/Version und build.json auseinander, ohne dass es auffiel.',
      'Neues Fenster PATCH-NOTIZEN im Spielmenü: zeigt genau diese Liste, mit dem laufenden Build oben.',
      'Neues Fenster UPDATE: prüft beim Start und danach alle 60 Sekunden, ob eine neue Version auf dem Server liegt, und lädt die Seite kontrolliert neu - aber nur, wenn kein Dialog offen ist und der Spielstand gespeichert ist.'
    ],
    offen: [
      'Zwei Geräte gleichzeitig: das Neuladen fragt vorher, ob noch Speicherungen laufen. Auf einem echten Telefon mit wackligem Netz ist das die Stelle, die Ärger machen kann.'
    ]
  },
  {
    version: '14.0.13',
    datum: '2026-11-24',
    title: 'Eine Schrift im ganzen Spiel · Item-Bild im Charaktermenü',
    punkte: [
      'font-vt323 war an 22 Stellen im Quellcode benutzt und nirgends definiert - alle fielen auf die Systemschrift zurück. Jetzt ist die Terminal-Schrift der Standard.',
      'Sechs Leucht-Klassen (glow-text, text-shadow-*) existierten nicht; jede Überschrift, die leuchten sollte, leuchtete nicht.',
      'Karte und Kampffeld beschrifteten sich in der Systemschrift; jetzt VT323.',
      'Kein weißer Text mehr: 20 Stellen weiß und 10-mal Aufhellen beim Darüberfahren sind Leuchtgrün.',
      'Das Item-Bild im Charaktermenü: alte Spielstände trugen keine id, deshalb stand dort ein Ersatz-Emoji. Wird beim Laden repariert.'
    ],
    offen: [
      'Die Schrift kommt von Google Fonts. Ohne Netz zeigt das Spiel die Ersatzschrift des Geräts.'
    ]
  }
];

// ---------------------------------------------------------------------------
// Das Fenster im Spiel.
//
// Vorbild: createPatchNotes() in IronPath/patch-notes.mjs. Zwei Reiter
// (veroeffentlicht / offen), gebaut aus den Daten oben - kein Markdown, kein
// Netzwerk. Die Markup-Huelle steht in index.html, damit hier nur Logik steht.
// ---------------------------------------------------------------------------
window.UI = window.UI || {};

window.UI.showPatchNotes = function(reiter) {
    const overlay = document.getElementById('patch-notes-overlay');
    const inhalt = document.getElementById('patch-notes-content');
    if (!overlay || !inhalt) return;
    // Absichtlich UI. statt this.: die Funktion wird auch ungebunden
    // aufgerufen (z. B. als Callback-Referenz). Ohne Bindung waere `this`
    // undefined bzw. window - dann bliebe das Fenster in #pipboy-case
    // haengen und deckte den Header zu.
    if (typeof UI.schliesseMenueUndUnterfenster === 'function') {
        UI.schliesseMenueUndUnterfenster('patch-notes-overlay');
    } else if (typeof UI.els === 'object' && UI.els && UI.els.navMenu) {
        UI.els.navMenu.classList.add('hidden');
        UI.els.navMenu.style.display = 'none';
    }
    if (typeof UI.haengeFensterEin === 'function') UI.haengeFensterEin(overlay);
    if (typeof UI._trapEigeneOverlays === 'function') UI._trapEigeneOverlays();
    overlay.onclick = (e) => { if (e.target === overlay && typeof UI.hidePatchNotes === 'function') UI.hidePatchNotes(); };
    if (typeof Game !== 'undefined' && Game.state) Game.state.inDialog = true;

    const tab = reiter === 'offen' ? 'offen' : 'veroeffentlicht';
    const eintraege = window.GameData.RELEASED_PATCHES || [];
    const offen = window.GameData.offenePunkte || [];
    const build = (document.querySelector('meta[name="pipboy-build"]') || {}).content || '?';

    const kopf = `
        <div class="flex items-center justify-between border-b-2 border-green-800 pb-2 mb-3">
            <div>
                <div class="text-[10px] tracking-[0.3em] text-green-700 uppercase">Vault-Tec // Änderungsprotokoll</div>
                <h2 class="text-3xl font-bold text-[#39ff14] glow-text leading-none mt-1">PATCH-NOTIZEN</h2>
            </div>
            <div class="text-right text-sm text-green-600">
                <div>INSTALLIERT</div>
                <div class="text-[#39ff14] font-bold text-lg leading-none">v${build}</div>
            </div>
        </div>
        <div class="flex border-b-2 border-green-800 mb-3">
            <button onclick="UI.showPatchNotes('veroeffentlicht')" class="flex-1 py-2 uppercase tracking-widest text-lg ${tab === 'veroeffentlicht' ? 'bg-[#39ff14] text-black font-bold' : 'bg-[#001100] text-green-600 hover:text-green-300'}">VERÖFFENTLICHT</button>
            <button onclick="UI.showPatchNotes('offen')" class="flex-1 py-2 uppercase tracking-widest text-lg ${tab === 'offen' ? 'bg-[#39ff14] text-black font-bold' : 'bg-[#001100] text-green-600 hover:text-green-300'}">NOCH OFFEN</button>
        </div>
    `;

    let rumpf = '';
    if (tab === 'veroeffentlicht') {
        rumpf = eintraege.map((eintrag, index) => {
            const aktuell = index === 0;
            const punkte = (eintrag.punkte || []).map(p => `<li class="mb-1 leading-snug">${p}</li>`).join('');
            const offenePunkte = (eintrag.offen || []).map(p => `<li class="mb-1 leading-snug">${p}</li>`).join('');
            return `
                <article class="border border-green-800 bg-[#001100]/60 p-3 mb-3 ${aktuell ? 'border-l-4 border-l-[#39ff14]' : ''}">
                    <div class="flex items-baseline justify-between gap-2 mb-1">
                        <span class="text-sm text-green-700 tracking-widest">v${eintrag.version} · ${eintrag.datum}</span>
                        ${aktuell ? '<span class="text-[10px] bg-[#39ff14] text-black px-1 font-bold tracking-widest">NEU</span>' : ''}
                    </div>
                    <h3 class="text-xl font-bold text-[#39ff14] leading-tight mb-2">${eintrag.title}</h3>
                    <ul class="text-base text-green-300 list-none">${punkte}</ul>
                    ${offenePunkte ? `<div class="mt-2 pt-2 border-t border-green-900/60"><div class="text-[10px] tracking-[0.2em] text-yellow-600 uppercase mb-1">Dabei aufgefallen</div><ul class="text-sm text-yellow-200/80 list-none">${offenePunkte}</ul></div>` : ''}
                </article>
            `;
        }).join('');
    } else {
        rumpf = `
            <div class="border border-yellow-800 bg-[#0f0f00]/60 p-3">
                <div class="text-[10px] tracking-[0.3em] text-yellow-600 uppercase mb-2">Bekannt und nicht behoben</div>
                <ul class="text-base text-yellow-200/90 list-none space-y-2">
                    ${offen.map(punkt => `<li class="flex gap-2"><span class="text-yellow-500">▸</span><span>${punkt}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }

    inhalt.innerHTML = kopf + rumpf;
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
};

window.UI.hidePatchNotes = function() {
    const overlay = document.getElementById('patch-notes-overlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.style.display = 'none'; }
    if (typeof Game !== 'undefined' && Game.state) Game.state.inDialog = false;
};

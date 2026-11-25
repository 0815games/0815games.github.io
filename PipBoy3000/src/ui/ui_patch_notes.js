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
    if (typeof Game !== 'undefined' && Game.state) Game.state.inDialog = true;

    if (typeof this.els === 'object' && this.els && this.els.navMenu) {
        this.els.navMenu.classList.add('hidden');
        this.els.navMenu.style.display = 'none';
    }

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

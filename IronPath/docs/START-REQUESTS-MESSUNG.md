# Start-Requests: Messung und Bundling-Entscheidung (AUSBAU-PLAN Punkt 6)

**Stand:** 2026-11-23 · **Werkzeug:** [`../scripts/measure-startup.mjs`](../scripts/measure-startup.mjs)
(`node IronPath/scripts/measure-startup.mjs`, `--json` für Rohdaten) ·
**Invarianten:** `../tests/startup-measurement.test.mjs`

## Methode

Statische Graph-Analyse ab `index.html` — derselbe Graph, den der Browser
läuft, weil jeder Import in diesem Codebestand ein literaler relativer
Pfad mit Cache-Token ist. Phasen wie beim echten Start: die drei
Einstiegs-Skripte (Boot), dann importiert `account-entry.mjs` dynamisch
`account.js`, das statisch die ganze App inklusive Spiel zieht (App).
Gezählt werden eindeutige Module (= Requests bei Kaltstart), Roh- und
Gzip-Bytes (pro Datei komprimiert, wie sie der Server ausliefert) und die
Entdeckungstiefe (auf welcher Stufe der Browser ein Modul kennenlernt).
Keine unaufgelösten Imports. Echte Geräte-Laufzeiten misst der Betreiber
bei Bedarf selbst; die Sandbox liefert bewusst keine Loopback-Zeiten, die
eine Mobilfunk-Wahrheit vortäuschen würden.

## Ergebnis (2026-11-23, Welle `20261123-party6`)

| Größe | Wert |
| --- | --- |
| Requests kalt (eigener Host) | 1 HTML + 11 CSS + **191 Module** = 203 |
| Extern | 3 Firebase-CDN-Module (eigener Graph, fremder Host) |
| Modul-Bytes | 1.932 KB roh, **~666 KB gzip** |
| CSS | 419 KB roh (11 Dateien) |
| Boot-Phase (vor `account.js`) | 34 Module, 486 KB roh / ~183 KB gzip |
| Wasserfall-Tiefe | 6 Stufen — 91 Module auf Stufe 2, 80 auf Stufe 3 |
| Größte Module | `game.js` 189 KB · `account.js` 133 KB · `patch-notes.mjs` 129 KB · `core/cartoon-art.mjs` 93 KB |
| Bytes nach Bereich | core 751 KB (101) · Wurzel 465 KB (6) · i18n 291 KB (18) · ui 150 KB (26) · net 118 KB (15) · battle 98 KB (6) · workshop 50 KB (17) |

Die ~180 Requests aus dem Rundum-Check stimmen also (191 Module). Zwei
Einordnungen relativieren sie:

1. **Die Tiefe ist flach, die Breite parallel.** GitHub Pages liefert
   HTTP/2: Die 171 Module der Stufen 2–3 laufen multiplexed über eine
   Verbindung, sobald ihre Importeure da sind. Die Latenz kostet grob
   4–5 Roundtrips plus Übertragungszeit, nicht 191 Wartezeiten.
2. **Die Bytes dominieren, nicht die Anzahl.** ~666 KB gzip Module plus
   CSS sind bei 10 Mbit/s etwa eine halbe Sekunde reine Übertragung.
   Ein Bundle würde daran wenig ändern (verkettetes Gzip spart nur die
   Pro-Datei-Verluste, grob 5–10 %) — aber jede Cache-Welle (79–85
   umgeschriebene Dateien) benennt alle Modul-URLs um und lädt bei
   Bestandsspielern einmal alles neu. Das ist der reale wiederkehrende
   Preis, und er hängt an den Bytes, nicht an der Request-Zahl.

## Entscheidung: **Kein Bundling jetzt.**

Begründung:

- Die gemessene Form ist gesund: flacher Wasserfall, moderate Bytes,
  keine Sackgassen. Der erwartete Gewinn eines Bundles (einstellige
  Prozent bei Bytes, weniger, aber latenzseitig durch HTTP/2 schon
  abgefederte Requests) steht gegen einen Umbau, der genau die
  Sicherheitsnetze abbaut, die das Projekt tragen: Die UI-Harnische und
  1.300+ Tests importieren Module per Pfad, das Cache-Wellen-System
  pinnt jede Datei einzeln (`?v=`-Token-Konsistenz ist testgeprüft),
  und die modulare Struktur war das ausdrückliche Programm der
  Phasen 1–2. Ein Bundler müsste all das nachbauen oder ersetzen.
- Der Start ist nicht der gemeldete Schmerz: Weder aus dem Spiel noch
  aus den bisherigen Runden liegt eine Ladezeit-Beschwerde vor, die ein
  Bundle rechtfertigen würde. Nicht vorschnell umbauen.

## Billigere Hebel — nur falls der Start je schmerzt (nicht gebaut)

1. **`patch-notes.mjs` (129 KB) lazy laden:** Die Feldnotizen hängen
   eager an `account.js`, gebraucht werden sie erst beim Öffnen der
   Patch-Notes. Ein dynamischer Import an der einen Aufrufstelle spart
   ~7 % der App-Bytes beim Start.
2. **Spiel-Graph nach dem Login laden:** `account.js` importiert
   `startGame` statisch; 157 der 191 Module (1.446 KB roh) werden erst
   nach der Anmeldung gebraucht. Ein dynamischer Import beim ersten
   `showProfile` machte die Anmeldeseite selbst so leicht wie die
   Boot-Phase (~183 KB gzip). Ändert nichts an der Zeit bis zum Spiel,
   nur an der bis zum Formular.
3. **CSS bündeln** (11 Dateien, 419 KB roh): Zusammenlegen spart zehn
   Requests und etwas Gzip-Wiederholung — klein, aber risikolos.

## Wiedervorlage

Die Messung läuft bei jedem Testlauf mit (`startup-measurement.test.mjs`,
Bänder: 150–300 Module, 400–900 KB gzip, Tiefe 4–9). Reißt ein Band oder
meldet der Betreiber einen spürbar langsamen Start auf echter Hardware,
kommt die Bundling-Frage mit frischen Zahlen zurück auf den Tisch —
entschieden wird dann wieder an der Messung, nicht am Gefühl.

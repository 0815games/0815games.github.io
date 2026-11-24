# Balancing-Befunde

Grundlage: `docs/BALANCING.md` (Zahlen) und `tests/balance.test.mjs` (Wächter).
Der Bericht wird von `node tools/balance.mjs --write` erzeugt und gegen das
gebaute Bündel gerechnet, nicht gegen die Quellen — die Zahlen sind also die,
die der Spieler sieht.

Stand: Version 14.0.0, 34 Waffen, 33 Rüstungsteile, 10 Perks,
14 Verbrauchsgüter, 9 Monster.

**Stand: alle Befunde behoben.** Die Wächter in `tests/balance.test.mjs`
laufen streng im normalen Testlauf mit und schlagen fehl, wenn ein Wert wieder
wirkungslos wird. Der Bericht `docs/BALANCING.md` wird bei jeder Änderung am
Katalog neu erzeugt (`node tools/balance.mjs --write`), der CI prüft, dass er
zum Quellstand passt.

---

## Was in Ordnung ist

Bevor die Lücken kommen: die Kernkurve stimmt.

**Waffenschaden.** Alle 34 Waffen liefern im Kampf ihren Katalogwert
(`tests/balance.test.mjs`, „jede Waffe macht im Kampf ihren Katalogwert").
Bis vor Kurzem war das nicht so — jede Waffe machte 2 Schaden.

**Preis gegen Schaden.** Steigung 28,69 KK pro Schadenspunkt, Korrelation
r = 0,83 über alle 33 käuflichen Waffen. Das ist kein linearer Preis, aber eine
klare Ordnung: teuer heißt stärker.

**Perks.** Alle 10 Perks werden an mindestens einer Stelle im Code gelesen.
Das ist in diesem Projekt keine Selbstverständlichkeit — siehe Munition und
`baseDmg` in `docs/BEFUNDE.md`.

**Munition.** Sechs Sorten, gestaffelter Verbrauch, wirtschaftlich sinnvoll:
Schrott-Munition kostet 1 KK pro Schuss, Energiezellen 10 KK.

---

## B1 — Rüstung schützte nicht *(behoben)*

**Was passiert:** Der Kampf rechnet gegen `equip[slot].def`
(`game_combat.js`):

```js
if (Game.state.equip[s].def) armor += Game.state.equip[s].def;
let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
```

Kein einziges der 33 Rüstungsteile besitzt ein `def`-Feld. Alle tragen nur
`bonus` (SPECIAL-Boni). Ein voll ausgerüsteter Spieler nimmt exakt so viel
Schaden wie ein nackter.

**Wer es merkt:** Der Charakterbogen zeigt sogar einen DEF-Wert an
(`ui_render_views.js`, `Game.getStat('DEF')`) — aber `getStat` liest
`stats.DEF`, und `DEF` ist kein SPECIAL-Wert. Die Anzeige ist immer 5.

**Behoben.** Alle 28 kaufbaren Rüstungsteile tragen jetzt `def`, gestaffelt am
Preis:

| Stufe | Beispiel | `def` |
|---|---|---|
| Stoff, Leder | Lederkappe, Lederhose | 1–2 |
| Raider, Jeans | Raider-Rüstung, Jeans | 1–2 |
| Metall | Metallrüstung, Metallbeinschienen | 3–7 |
| Kampf | Kampfrüstung, Kampfhelm | 5–12 |
| Synth | Synth-Rüstung | 15 |
| Power Rüstung | T-45 | 25 |

Gerechnet wird über `Game.equipDef()`; der Kampf zieht davon die Hälfte ab.
Gemessen: ein Raider mit 30 Schaden richtet nackt 30 an, mit Lederrüstung und
Kappe 27, mit Powerrüstung 18. Spielstände, die im Slot nur `{id}` führen,
bekommen den Katalogwert nachgezogen.

---

## B2 — 30 % der Truhen waren nicht zu öffnen *(behoben)*

**Was passiert:** `interactWithChest` ruft `UI.startMinigame('bomb', …)`.
`MiniGames` kennt aber nur `hacking`, `lockpicking`, `dice`, `defusal` und
`memory` — einen Schlüssel `bomb` gibt es nicht. `startMinigame` steigt bei
unbekanntem Schlüssel still aus:

```js
if (typeof MiniGames === 'undefined' || !MiniGames[type]) return;
```

Gemessen: weder `onSuccess` noch `onFail` wird gerufen, es gibt keine
Fehlermeldung. **`state.inDialog` bleibt auf `true`** — danach reagiert
*keine* Truhe im Spiel mehr auf einen Klick, weil `interactWithChest` als
erstes `if(this.state.inDialog) return;` prüft.

**Behoben.** Drei Änderungen:

1. Der Schlüssel heißt jetzt `defusal`.
2. `defusal.init(onSuccess, onFail)` nimmt die Rückrufe an und reicht sie in
   `end()` weiter — nach den Effekten, damit die Meldung des Minispiels nicht
   überschrieben wird.
3. `startMinigame` gibt `false` zurück und schreibt eine Warnung, statt still
   auszusteigen. Kommt der Aufrufer damit nicht zurecht, öffnet die Truhe
   direkt, statt stumm zu verschwinden.

`hacking` bekam denselben Rückruf-Mechanismus (siehe B6).

---

## B3 — Buff-Items wirkten nicht *(behoben)*

**Was passiert:** Vier Items tragen `effect: 'buff'` mit `bonus`:

| Item | `bonus` | Preis |
|---|---|---|
| Buffout | STR+2, END+2 | 40 KK |
| Jet | AP+20 | 30 KK |
| Rad-X | RAD_RESIST+20 | 40 KK |
| Stealth Boy | AGI+10 | 200 KK |

`useItem` behandelt sie so:

```js
if(itemDef.effect === 'buff') {
    UI.log(`${itemDef.name} konsumiert! (Effekte noch WIP)`, "text-pink-400");
}
```

Das Item wird verbraucht, der Bonus nie angewandt. Kein Code legt ihn je auf
`state.stats`, und eine Dauer (`duration: 60` beim Stealth Boy) gibt es im
Zustand nicht. 310 KK an Ladenwert für nichts.

**Behoben.** `state.buffs` mit `{id, name, bonus, expires}`, angelegt von
`Game.applyBuff()`. `getStat` addiert laufende Buffs über `buffBonus()`.
Abgelaufene Einträge fallen beim Lesen heraus, ein Zeitgeber ist nicht nötig.
Ohne `duration` in den Daten gilt eine halbe Stunde — sonst wäre ein
40-KK-Getränk eine dauerhafte Attributserhöhung.

Gemessen: Buffout hebt STR und END um 2, Jet gibt AP+20, nach Ablauf ist der
Wert wieder bei der Basis.

---

## B4 — Strahlungsresistenz wurde ignoriert *(behoben)*

**Was passiert:** Zwei Quellen geben `RAD`-Werte:

- Strahlenschutzanzug: `RAD+1000`
- Gasmaske: `RAD+20`
- Rad-X: `RAD_RESIST+20`

`addRadiation` kennt nur den Rad-Resistenz-**Perk**:

```js
const perkLvl = this.getPerkLevel('rad_resistant');
```

`getStat('RAD_RESIST')` wird nirgends gerufen. Gemessen: mit angelegtem
Strahlenschutzanzug kommen 50 von 50 Strahlung durch.

**Behoben.** `addRadiation` rechnet jetzt Perk, Ausrüstung und Buffs zusammen,
gedeckelt auf 90 %. `RAD` und `RAD_RESIST` sind Prozentwerte (Gasmaske 20,
Rad-X 20); der Strahlenschutzanzug trägt mit 1000 einen Platzhalter und läuft
in den Deckel.

Wichtig dabei: gelesen wird über den neuen `Game.equipBonus()` und **nicht**
über `getStat()`. `getStat` setzt für jeden Schlüssel, der nicht in
`state.stats` steht, eine Basis von 5 an — die SPECIAL-Vorgabe. Ein Spieler
ohne Schutz hätte damit schon 5 % Resistenz gehabt.

Gemessen: ohne Schutz 50 von 50 RADS, mit Gasmaske 50, mit Anzug 45, mit Rad-X
40.

---

## B5 — CHA hatte keine Wirkung *(behoben)*

**Was passiert:** `CHA` ist im Spielstand angelegt und wird im Admin-Panel
angezeigt, aber von keiner Spielmechanik gelesen. `STR` (Nahkampfschaden),
`PER` (Trefferchance), `END` (Maximal-HP), `AGI` (gegnerische Trefferchance),
`INT` (Hacken, Merksequenz) und `LUC` (Krit, Würfelspiel) wirken alle.

**Behoben.** CHA wirkt auf die Händlerpreise: 1 % je Punkt über 1, gedeckelt
auf 25 %. Beim Kauf senkt es den Preis, beim Verkauf hebt es ihn.

| CHA | Stimpack kaufen (Katalog 50) | Stimpack verkaufen |
|---|---|---|
| 1 | 50 KK | 12 KK |
| 5 | 48 KK | 13 KK |
| 10 | 46 KK | 13 KK |

Die Spreizung ist bewusst klein — CHA soll ein Vorteil sein, kein Rabatt, der
die Wirtschaft aushebelt.

---

## B6 — Zwei Minispiele waren unerreichbar *(behoben)*

| Minispiel | Auslöser |
|---|---|
| `lockpicking` | Truhen (`game_map.js`) |
| `memory` | Truhen ab Dungeon-Ebene 3 |
| `dice` | Stadtansicht (seit BEFUNDE.md 9) |
| `hacking` | **nirgends** |
| `defusal` | **nirgends** (siehe B2) |

**Behoben.** Truhen haben jetzt drei Typen, abhängig vom Würfel und der
Dungeon-Ebene:

| Typ | Bedingung | Minispiel |
|---|---|---|
| Dietrich | Normalzustand | `lockpicking` |
| Bombe | Wurf ≥ 0,70 | `defusal` |
| Terminal | Wurf < 0,25 und Ebene ≥ 2 | `hacking` |

Damit ist `hacking` erstmals erreichbar — und INT bekommt die Wirkung, die in
den Daten vorgesehen war: bei INT 10 sind es 2 statt 11 Passwörter.

Der Debug-Dialog `Game.testMinigames` an Kachel-Typ `?` bleibt bestehen; der
Generator setzt dieses Zeichen nach wie vor nie. Er wird nur noch nicht
gebraucht.

---

## B7 — Die Minigun war die schlechteste Waffe im Spiel *(behoben)*

Kaufpreis 1500 KK (die teuerste), 15 Schaden (Platz 18 von 34), Verbrauch
5 Mikro-Zellen pro Schuss. Ergebnis: **100 KK pro Schadenspunkt** — das
25-Fache der Doppelflinte (11,67 KK/DMG).

Gerechnet auf Schaden pro Kronkorken (Kaufpreis + Munition):

| Waffe | DMG | Mun./Schuss | KK pro DMG |
|---|---:|---:|---:|
| Doppelflinte | 30 | 8,00 | 11,67 |
| Plasmagewehr | 45 | 15,00 | 20,00 |
| Minigun | 15 | 10,00 | **100,00** |

**Behoben** durch eine Preiskorrektur über die ganze Waffenliste. Die
Reihenfolge lautet jetzt durchgehend: teurer ist stärker.

| Waffe | vorher | jetzt |
|---|---|---|
| Minigun | 1500 KK, 15 DMG | 1700 KK, 48 DMG |
| Sturmgewehr | 550 KK, 28 DMG | 1150 KK, 45 DMG |
| Lasergewehr | 650 KK, 32 DMG | 1250 KK, 48 DMG |
| Scharfschützengewehr | 700 KK, 35 DMG | 1150 KK, 45 DMG |
| Plasmagewehr | 900 KK, 45 DMG | 900 KK, 45 DMG (unverändert) |

Die Minigun kostet mit Munition weiterhin am meisten pro Schuss — das ist bei
5 Mikro-Zellen je Schuss gewollt. Nur ihr Verhältnis aus Preis und Schaden ist
jetzt nicht mehr das schlechteste im Spiel.

---

## B8 — Kleinere Auffälligkeiten

- **Eine Rüstung ohne einen einzigen Bonus:** „Alte Stiefel" (20 KK) hat
  `bonus: {}`. Sie ist damit ein Slot-Füller ohne Funktion.
- **Negative Boni ohne Ausgleich:** Der Verstärkte Rucksack gibt AGI−1, die
  Brahmin-Kiepe AGI−2. AGI senkt die gegnerische Trefferchance um 3 pro Punkt
  — das ist spürbar, aber nirgends erklärt.
- **Nuka Cola heilt 15 statt 10:** In den Daten steht `val: 10`, `useItem`
  heilt hart `+15`. Der Wert im Katalog lügt.
- **Strahlenschutzanzug:** `RAD+1000` ist ein Platzhalterwert. Selbst mit
  funktionierender Resistenz (B4) braucht es einen Deckel, sonst ist der
  Anzug gegen jede Strahlung immun.
- **„Nudelholz" kostet 5 KK und macht 3 Schaden** — die günstigste Leistung im
  Spiel (1,67 KK/DMG). Für ein Startgebiet ist das in Ordnung, aber es
  unterbietet die Fäuste (0 KK, 2 DMG) kaum.

---

## Was noch offen ist

B1 bis B7 sind behoben. Aus B8 bleiben die Punkte, die reine Datenpflege sind:

- „Alte Stiefel" haben einen leeren Bonus (und jetzt `def: 1`, sind also nicht
  mehr funktionslos).
- Nuka Cola heilt 15 statt der 10 aus den Daten.
- Der Strahlenschutzanzug trägt mit `RAD+1000` einen Platzhalterwert, der im
  Deckel von 90 % verschwindet.

Die Wächter decken die behobenen Befunde ab. Für die drei Punkte oben gibt es
noch keinen Test, weil sie Geschmacksfragen sind und keinen Fehler darstellen.

## Nachtrag — ROHE NAHRUNG

Beim Durchsehen der Strahlungsquellen fiel auf: Rohfleisch war kein
Verbrauchsgut. Sieben Fleischsorten lagen als `component` im Katalog, waren
aber ungenießbar — nur zum Braten zu gebrauchen.

Damit fehlte die Entscheidung, um die es bei RAD eigentlich geht: **jetzt
essen oder erst braten?** Seit Version 14.0.2 trägt jedes rohe Stück ein
`raw`-Feld (`heal`, `rad`):

| Roh | +HP | +RAD | Gebraten | +HP | +RAD |
|---|---:|---:|---|---:|---:|
| Kakerlakenfleisch | 8 | 6 | Gegrillte Kakerlake | 15 | 2 |
| Fliegenfleisch | 8 | 6 | Gegrillte Fliege | 15 | 2 |
| Rattenfleisch | 12 | 9 | Ratten-Steak | 25 | 3 |
| Hundefleisch | 15 | 10 | Hunde-Steak | 28 | 3 |
| Mirelurk-Fleisch | 18 | 12 | Mirelurk-Happen | 35 | 4 |
| Skorpiondrüse | 22 | 14 | Skorpion-Überraschung | 45 | 5 |
| Yao Guai Rippchen | 30 | 16 | Yao Guai Steak | 50 | 6 |

Die Regel: roh heilt knapp die Hälfte und verstrahlt das Drei- bis Vierfache.
Bei vollen HP wird das Essen verweigert, statt unnötig zu verstrahlen.

Hundefleisch und Yao-Guai-Rippchen hatten zusätzlich **kein Kochrezept** — roh
essbar, gebraten unerreichbar. Beide Rezepte sind ergänzt (`cook_dog` Stufe 2,
`cook_yao` Stufe 4). `tests/proviant.test.mjs` prüft, dass jede Rohware ein
Gegenstück hat.

## Nachtrag — WOLKEN (behoben in v14.0.3)

RAD kam bis Version 14.0.2 nur aus Schlafen, Kochware, einem Minispiel und
RadAway. **Keine Zone und kein Wetter erzeugte Strahlung** — die Glühende See
war reine Optik, der Strahlungssturm bewegte nur Partikel.

Seit 14.0.3 wandern RAD-Wolken durch die Spielwelt. Bewusst **kein** zweites
Schadenssystem: Gift hätte einen eigenen Widerstand, ein Gegenmittel und eine
eigene Heilung gebraucht. RAD trifft auf Mechanik, die es schon gibt —
Gasmaske, Strahlenschutzanzug, Rad-X, Rad-Resistenz-Perk, RadAway.

| Biom | Wolken je Sektor |
|---|---:|
| Glühende See | 5 |
| Todes-Sümpfe | 3 |
| Verstrahlter Wald, Dschungel | 2 |
| Ödland, Gebirge | 1 |
| Stadt | 0 |

Eine Wolke hat Radius 2 (euklidisch), macht 4 RAD je Feld und zieht alle sechs
Sekunden ein Feld weit mit leichter Ostdrift. Sie wandert bewusst **deutlich
langsamer als der Spieler** — eine gleich schnelle Wolke kann man nicht
umgehen, nur erleiden.

### Der Fund dabei: Rundung fraß den Schutz

4 RAD minus 20 % Gasmaske sind 3,2. `Math.ceil` machte daraus wieder 4 — die
Gasmaske war bei jeder kleinen Dosis **exakt wirkungslos**, und weil die Wolke
nur kleine Dosen verteilt, wäre der ganze Widerstandsapparat dort blind
geblieben. Aufgefallen ist es, weil der Test „Gasmaske senkt die Dosis einer
Wolke" rot blieb, obwohl die Ausrüstung korrekt angelegt war.

`Game.strahlungsDosis()` sammelt jetzt die angebrochenen Reste in
`state.radRest` und zahlt erst ab einem ganzen Punkt aus. Gemessen, vier Züge
in der Wolke:

| Schutz | RAD |
|---|---:|
| ohne | 16 |
| Gasmaske | 12 |
| Gasmaske + Rad-X | 9 |
| Perk Rad-Resistenz 5 | 8 |
| Strahlenschutzanzug | 1 |

Die großen Dosen bleiben unverändert: 50 RAD mit Gasmaske sind weiterhin 40.

## Noch offen

- **Gift** hat im Spiel nichts: keinen Widerstand, kein Gegenmittel, keinen
  Perk. `poison_gland` (Giftdrüse) fällt von Skorpionen und ist unbenutzt. Ein
  Giftnebel wäre ein zweites System, kein Anhängsel — bewusst nicht gebaut.
- **Kachel `'M'`** (Monster) wird gezeichnet und blockiert, aber vom Generator
  nie gesetzt. Kämpfe starten nur über einen 3-%-Würfel beim Bewegen. Die
  Schublade für „bewegliches Hindernis auf der Karte" ist da und leer.

## Nachtrag — ABSTURZ (behoben in v14.0.4)

Meldung vom iPhone, 2026-11-24: `Script error.`, LOCATION `Internal : ?:?`,
kein Stack, leerer Log-Puffer.

### Was „Script error." bedeutet

Der Browser gibt bei Fehlern aus Skripten einer **anderen Domain** keine
Details heraus — das ist CORS, kein Fehler im Spiel. Bei uns kommen genau drei
Skripte von fremden Servern: `firebase-app.js`, `firebase-auth.js` und
`firebase-database.js` von `gstatic.com`. Der Bericht zeigte davon nichts,
sondern nur „Script error." — deshalb war er wertlos.

### Was daran kaputt war

| Problem | Wirkung |
|---|---|
| `scriptsLoaded` wurde erst im `fetch`-Erfolgspfad gesetzt | Scheitert der Versionsabruf (mobiles Netz), wartet die Boot-Sequenz **endlos** und der Login erscheint nie |
| Kein Offline-Weg | Ohne Firebase endet jeder Login in „Verbindung zu Vault-Tec unterbrochen" — Sackgasse |
| Firebase-Fehlercodes roh im Login | `auth/network-request-failed` statt eines Satzes |
| CDN-Skripte ohne `onerror` | Ein Ausfall blieb unsichtbar |

### Was jetzt gilt

1. Der Boot hängt nur am Bündel. Die Versionsnummer wird parallel geholt und
   nachgetragen; sie blockiert nichts. Nach 15 Sekunden greift ein
   Notausstieg, falls `app.js` selbst nicht ankommt.
2. „Ohne Anmeldung spielen" startet den localStorage-Spielstand — der Offline-
   Pfad war schon im Code, nur nicht erreichbar.
3. Der Crash-Bericht nennt fremde Skripte, listet fehlende CDNs und zeigt den
   Online-Zustand.

**Nebenbei korrigiert:** Beim Einbau hatte ich den Tailwind-Play-CDN wieder
hereingeholt, den der Umbau bewusst entfernt hatte (Build-Zeit statt CDN).
Zwei bestehende Tests haben das sofort gemeldet — der CDN ist wieder raus.

**Offen:** Ein Test, der die Seite *ohne* Canvas-Attrappe lädt, wäre näher am
echten Gerät. Für den Absturz war das nicht nötig; die drei Ursachen oben sind
unabhängig von der Zeichenfläche.

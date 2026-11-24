# Weitere Befunde — 24.11.2026

Ergänzung zu [ANALYSE.md](ANALYSE.md), entstanden bei der Durchsicht **nach** dem
Umbau. Gefragt war: was ist sonst noch offen, unlogisch oder kaputt? Die Liste
ist nach Wirkung sortiert, nicht nach Aufwand.

Der erste Punkt ist ein Fehler, den **der Umbau selbst verursacht hat** — er ist
hier auch behoben. Die übrigen sind älter und berühren teils Spielmechanik; sie
wurden bewusst nicht angefasst, weil sie eine Entscheidung brauchen.

---

## 1. Handbuch und Changelog liefen ins Leere *(behoben)*

`readme.md` und `change.log` lagen früher im Spielordner. Der Umbau hat sie nach
`docs/` verschoben, der Code fragte aber weiter nach dem alten Pfad:

```js
await fetch(`readme.md?v=${ver}`);      // 404
await fetch(`change.log?v=${ver}`);     // 404
```

Betroffen waren **zwei sichtbare Buttons** (`ANLEITUNG` auf dem Login-Bildschirm
und `HANDBUCH` im Spielmenü). Beide öffneten ein Overlay mit „Fehler beim
Laden: Manual not found" statt des Inhalts. Jetzt zeigen sie auf
`docs/README.md` und `docs/change.log`; ein neuer Test prüft jeden
`fetch()`-Pfad im Bündel gegen das Dateisystem und schlägt beim alten Pfad
nachweislich fehl.

**Lehre für die Teststrategie:** Der Seitentest bootete die Seite, öffnete aber
keine Overlays. Ein Pfad, der erst auf Klick geladen wird, war damit unsichtbar.
Deshalb der neue, statische Test — er braucht kein Klicken.

---

## 2. `templates/vault.html` und `templates/radio.html` werden nie geladen

Beide Dateien liegen im ausgelieferten Ordner und werden von `switchView()`
nie angefordert. Für `radio.html` steht das schon in `to_do.log`; `vault.html`
ist derselbe Fall und war dort nicht vermerkt.

Die Vault-Ansicht wird vollständig in JavaScript gebaut
(`ui_render_overlays.js`, `enterVault`), das Template ist überflüssig. Beim
Radio steht im Spielerhandbuch sogar ausdrücklich, dass das Feature „vorerst
komplett entfernt" wurde.

→ **Empfehlung:** beide löschen. Das sind ~60 Zeilen, die niemand vermisst,
aber jeder beim Suchen verwirren. Kein Spielverhalten ändert sich.

---

## 3. Toter Char-Code in `ui_view_inv.js` *(behoben)*

`ui_view_inv.js` enthält zwei Render-Funktionen für S.P.E.C.I.A.L. und Perks,
die auf `#special-list` und `#perks-list` zugreifen — **beide IDs existieren
nirgends**. Die Funktionen steigen sofort aus (`if(!container) return`).

Gerendert wird stattdessen in `ui_render_views.js` (`renderStats` →
`renderSpecialStats`/`renderPerksList`). Die alten Funktionen sind Reste einer
früheren Char-Ansicht und werden nur noch von sich selbst aufgerufen
(`renderChar` → Tab `stats`/`perks`).

Dasselbe Muster bei `char-sheet-name`, `char-sheet-lvl`, `sheet-stat-points`,
`sheet-perk-points` und `status-points-alert`: fünf IDs, die `renderChar`,
`renderCharStats` und `renderCharStatus` erwarten, aber kein Template liefert.

**Behoben:** die vier Funktionen (`renderChar`, `renderCharStatus`,
`renderCharStats`, `renderCharPerks`) sind entfernt — 205 Zeilen. Die Aufrufer
zeichnen jetzt den aktiven Screen neu (`UI.renderStats`) bzw. aktualisieren das
HUD (`UI.update`). Das Bündel ist dadurch 8 kB kleiner.

Der Vollständigkeitsnachweis: `renderChar` wurde aus `game_inv_logic.js`,
`ui_input.js` und `ui_core.js` gerufen — ein Aufruf in der `update()`-Fassung
von `ui_core.js`, die von `ui_render_core.js` überschrieben wird, also selbst
nie lief. **Keine der vier Funktionen hatte je eine Wirkung.**

---

## 4. Munition: nicht nur ein fehlendes `ammoType` (B9, verschärft)

In `to_do.log` steht, der Verbrauchspfad sei „korrekt gebaut, aber keine Waffe
hat ein `ammoType`". Beim Nachsehen ist es mehr:

- `usesAmmo` steht an 20+ Waffen in `data_items.js` und wird **im ganzen
  Bündel an keiner Stelle gelesen**.
- `Combat.playerAttack` prüft `stats.ammoType`, das aus `item.ammoType` oder
  `dbItem.ammoType` kommt — keins von beiden ist je gesetzt.
- Folge: `switchToBestMelee()` (samt „WAFFE LEER! *KLICK*"-Meldung) ist
  **unerreichbar**. Der gesamte Munitionszweig ist toter Code.
- Gleichzeitig verkauft der Händler Munition in 10er-Packungen, es gibt ein
  Rezept `craft_ammo` und mit `syncAmmo` einen Zähler — alles ohne Wirkung.

Das ist kein Balance-Thema, sondern eine **fehlende Verbindung**. Die
Bestandteile liegen alle bereit; es fehlt die Zeile, die einer Fernkampfwaffe
`ammoType: 'ammo'` gibt.

→ **Empfehlung:** als eigenen, kleinen Schritt machen — und dann ist das
Balancing die eigentliche Arbeit. Mit 34 Waffen und einem einzigen Munitionstyp
wird sonst alles gleich.

---

## 5. Supermutanten ließen Kronkorken als *Item* fallen *(behoben)*

`data_monsters.js:67`:

```js
drops: [ ..., {id:'caps', c: 1.0} ]
```

`caps` ist **kein Item** — es gibt keine Definition, und `addToInventory` hat
keinen Sonderfall dafür. Nachgemessen im Bündel:

```
addToInventory('caps', 30) → Inventar: [{"id":"caps","count":30}], caps-Guthaben: 0
```

Der Eintrag ist im Inventar unsichtbar (die Anzeige überspringt Items ohne
Definition, siehe B4), das Guthaben bleibt bei null. Der Supermutant lässt also
sichtbar nichts fallen — dabei ist er mit `loot: 30` ohnehin der beste
Kronkorken-Lieferant. Der Eintrag ist reine Verschwendung einer Drop-Chance.

**Behoben an der Wurzel, nicht am Symptom:** `Combat.win` vergab Drops über
`addToInventory` statt über die vorhandene Abstraktion `Game.safeGiveItem`, die
Kronkorken als Währung verbucht. Jetzt läuft der ganze Loot-Pfad darüber. Der
Fallback (falls `safeGiveItem` fehlt) verbucht `caps` ebenfalls korrekt.

Dass es nicht nur der Supermutant war, zeigt der Vergleich: `generateScaledLoot`
und `safeGiveItem` in `game_map.js` machten es schon richtig — nur der
Kampf-Pfad nicht.

Ende-zu-Ende geprüft: Supermutant besiegt → Guthaben 0 → 15, Inventar enthält
`ammo`, kein `caps`-Eintrag mehr.

**Warum der bestehende Test das nicht fand:** er übersprang `caps` mit dem
Kommentar „wird gesondert verbucht" — das war die Annahme, die nicht stimmte.
Die Ausnahme ist entfernt und durch zwei Tests ersetzt.

---

## 6. Farbklassen, die der Build nicht erzeugt *(behoben)*

Der Wechsel von Tailwind-CDN auf Build-Zeit hat eine Schwäche, die bei
dynamisch zusammengesetzten Klassennamen zuschlägt. Tailwind sammelt Klassen
statisch aus dem Quelltext; `text-${themeColor}-500` sieht es als
`text-${themeColor}-500` und erzeugt nichts.

Nachgemessen in `ui_view_town.js` (dort sind `themeColor` = green/yellow/red/blue):

| Klasse | im CSS? |
|---|---|
| `text-green-500`, `text-yellow-500`, `text-red-500` | vorhanden (anderswo benutzt) |
| `text-blue-700` | **fehlt** |
| `group-hover:text-red-300`, `group-hover:text-blue-300`, `group-hover:text-green-500` | **fehlen** |
| `via-*-900/10` (alle vier Farben) | **fehlen** |

Sichtbare Folge: Beim Überfahren der Stadtkacheln wechseln nur die grünen und
gelben Titel die Farbe; rote und blaue bleiben stumm, und der Lichtstreifen im
Hintergrund fehlt ganz. Es sieht nicht kaputt aus, nur unfertig.

**Behoben durch vollständige Klassennamen.** Die Stadtkacheln haben jetzt eine
Palettentabelle mit allen vier Farben (`title`, `sub`, `glow`), der Kampfkopf
eine Zuordnung für legendär/normal. Alle 20 Klassen sind im gebauten CSS
nachweisbar; `app.css` wächst dadurch um 1,2 kB.

Zwei Tests sichern das ab: einer verbietet zusammengesetzte Klassennamen im
Quelltext, der andere prüft die vier Paletten gegen das gebaute CSS. Eine neue
Farbe braucht damit einen bewussten Eintrag — und fällt auf, wenn sie fehlt.

---

## 7. Widersprüchliche Versionsstände

| Datei | Wert |
|---|---|
| `shell/Version`, `build.json`, Anzeige | **13.37** |
| `package.json` | **14.0.0** |
| Dashboard (`index.html`) | 2.0.3 |

Der Sprung von 13.37 auf 14.0.0 ist der Umbau, aber er steht nirgends im Spiel.
Wer die Seite öffnet, sieht 13.37, obwohl sich die halbe Struktur geändert hat.
Der Changelog behauptet inzwischen v14.0.0.

→ **Empfehlung:** entscheiden, ob der Umbau eine Spielversion ist. Wenn ja,
`shell/Version` auf 14.0.0 heben — das ist die einzige Quelle, alles andere
leitet sich davon ab.

---

## 8. Kleinigkeiten ohne Wirkung

- **`B11` existiert nicht.** `game_core.js:117` verweist auf
  „docs/ANALYSE.md, B11"; das Dokument endet bei B10. Der Kommentar ist
  inhaltlich richtig (die beiden Funktionen fehlten wirklich), die Nummer ist
  erfunden. Entweder B11 in der Analyse anlegen oder den Verweis auf B8
  richten — dort stehen die fehlenden Funktionen.
- **`docs/to_do.log` und `docs/change.log` sind trotz `*.log` in `.gitignore`
  eingecheckt.** Das ist bewusst so (Git ignoriert bereits verfolgte Dateien
  nicht), aber es ist eine Falle: eine neue `.log`-Datei im gleichen Ordner
  wird stillschweigend nicht mitcommittet.
- **`build.json` enthält einen `css`-Hash, aber `style.css` wird kopiert.**
  Wer `shell/style.css` ändert, sieht im Manifest keine Änderung. Der Hash
  deckt nur `app.css` ab.
- **`tests/` hat keine Abdeckung für `src/admin.js`.** Die Admin-Seite ist
  die einzige, die schreibt statt nur zu lesen, und der einzige Teil ohne Test.

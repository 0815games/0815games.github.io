# Item-Bilder — Pflege

**Stand: alle 126 Items haben ein Bild.** 128 × 128 px, Ø 5,4 kB, 683 kB gesamt.

Gezeigt werden sie ueber `UI.itemSymbol()` aus `src/ui/ui_item_symbol.js` — eine
Quelle fuer alle Ansichten (Inventar, Detail, Ausruesten, Schmiede, Zerlegen,
Haendler, Lager). Eine Ansicht, die ein eigenes Emoji mitbringt, ist ein Fehler;
`tests/item-bilder.test.mjs` prueft das.

## Die ID ist der Schluessel, nicht ein Feld

`Game.items` ist ein Objekt, dessen **Schluessel** die Item-ID ist:

```js
pipe_pistol: { name: "Rohrpistole", type: "weapon", … }   // kein id-Feld
```

Wer das Bild will, braucht die ID — und die steht im **Inventareintrag**
(`entry.id`), nicht in der Definition. `itemDef.id` ist trotzdem belegt:
`src/data/data_items.js` setzt es beim Laden auf den Schluessel. Beides ist
Absicht, doppelt gesichert.

Der Fehler aus v14.0.9 ist der Grund fuer diese Regel: `renderInventory` reichte
`itemDef.id` an `itemSymbol`. Zur damaligen Zeit war das `undefined`, also
`itemBildPfad → null`, also Emoji — an jeder Position, obwohl alle 126 Bilder
vorhanden waren. Ein Katalogtest konnte das nicht finden, weil er
`itemSymbol('stimpack', …)` direkt aufrief.

**Pruefen deshalb am gerenderten DOM:** `tests/item-bilder-render.test.mjs`
rendert Inventar, Charakterseite, Lager und Wiki und zaehlt `<img>` gegen
Zellen. Wer eine Ansicht umbaut, laesst diesen Test laufen und nicht nur
`npm run icons:check`.

Diese Datei beschreibt, wie ein Motiv entsteht und woran ein unbrauchbares
Rohbild erkannt wird. Die Fehlliste, die hier früher stand, ist leer — sie
wird bei Bedarf wieder aufgenommen.

| | |
|---|---|
| Rohbilder | `docs/muster/<id>.png` (1024–2048 px, nicht ausliefern) |
| Ausgeliefert | `img/items/<id>.png` |
| Aufbereitung | `npm run icons` → `tools/icons.mjs`, danach Tabelle schreiben |
| Prüfung vorher | `npm run icons:check` → `tools/icon-check.mjs` |
| Sichtprüfung | `docs/kontrollblatt-items.png` (alle Motive auf einem Bild) |

`npm run icons` ruft die Prüfung selbst auf und bricht bei einem Fund ab.
Ein fehlerhaftes Rohbild kommt damit nicht ins Set.

## Ein neues Motiv

1. Rohbild nach dem Stil unten erzeugen, ablegen als `docs/muster/<item-id>.png`.
   Die ID muss der Schlüssel in `src/data/data_items.js` sein.
2. `npm run icons` — beschneiden, Rand, 128 px, Tabelle schreiben.
3. `npm test` — prüft Tabelle, Dateigröße, Pfade und dass jedes Bild ein Item hat.
4. Kontrollblatt neu bauen und ansehen. **Der Schritt ist nicht optional** (siehe
   Fehlerklasse 4).

Fehlt ein Bild, greift im Inventar das Typ-Emoji. Das ist der Rückfall, nicht
der Normalfall: seit v14.0.6 hat jedes Item ein Motiv.

## Stil

> A single flat vector icon of …, drawn in the style of a Fallout Pip-Boy
> terminal interface: monochrome phosphor green line art (#39ff14) on a solid
> pure black background. Thick, clean, uniform stroke width. Upright, centered,
> filling about 80% of the square frame, narrow black margin. No text, no
> letters, no numbers, no border, no frame, no shadow, no gradient.

Vier Zusätze, die aus Fehlversuchen entstanden sind. Sie gehören in **jeden**
Prompt — ohne sie liegt die Trefferquote bei etwa 85 %:

| Zusatz | verhindert |
|---|---|
| `on a SOLID PURE BLACK BACKGROUND (no white, no light grey)` | weißen Hintergrund |
| `perfectly centered, at least 15 percent margin on every side` | weißen Streifen am Bildrand |
| `outline line art, hollow interior, no solid fill` | vollflächig gefüllte Silhouette |
| `pure black, no dark green tint, no haze, no vignette` | dunkelgrünen Schleier |

**Lage:** aufrecht oder diagonal, aber die Form muss die Fläche füllen. Die
erste Spritze lag flach diagonal in einem 2048er Quadrat und war bei 32 px nur
ein Strich.

**Fleisch:** zuerst die FORM nennen (Steak, Rippchen, Keule), die Herkunft nur
als kleines Detail. „a lump of raw insect meat with legs attached" wurde als
ganzes Insekt gelesen — `meat_roach`, `meat_fly` und `meat_mole` zeigten
zunächst das Tier statt des Fleisches.

**Rohstoffe:** Einzelteil statt Kiste. Eine Schraube ist bei 32 px lesbar, eine
Schraubenschachtel nicht.

**Rüstung:** die vier Teile einer Stufe trennen über die Silhouette (Brustplatte,
Helm, Armschutz, Beinschutz), die Stufen untereinander über die Oberfläche
(Schrott, Naht, Nieten, Verbundplatten, glatte Naht).

## Die vier Fehlerklassen

Bei 126 Motiven waren rund 20 Rohbilder unbrauchbar — fast nie, weil das Motiv
misslang, sondern wegen der Aufbereitung. Drei der vier Klassen sind an der
Datei nicht zu erkennen: 1024 × 1024, schwarz, grün, ladbar, technisch
einwandfrei.

### 1. Weißer Hintergrund

Der Stilsatz wird nicht zuverlässig befolgt. Bei `gears` stimmte das Motiv
vollständig — nur der Hintergrund war weiß statt schwarz.

Erkennung: Anteil weißer Pixel über **0,5 %**.

### 2. Weißer Streifen am Bildrand

`duct_tape` scheiterte zweimal mit einem weißen Streifen über die volle Breite
am unteren Rand (y 896–1023, dann y 925–1023). Das Motiv war jedes Mal richtig.
Beim Zuschneiden wäre daraus eine weiße Kante im Icon geworden.

Erkennung: weiße Pixel über 0,5 % **plus** Meldung, ob sie in einem
zusammenhängenden Streifen an der ersten oder letzten Bildzeile liegen.

### 3. Dunkelgrüner Schleier

`wrench` und `camp_kit` hatten einen Hintergrund von (5,22,5) statt (0,1,0).
Grünwert 22 liegt weit unter der Weiß-Schwelle, die Prüfung sah nichts. Im
Inventar wirken solche Icons als hellere Kacheln neben 118 sauberen.

Erkennung: Anteil der Hintergrundpixel (Grünwert ≤ 60) mit Grünwert über 8 —
bei mehr als **30 %** ist der Hintergrund nicht schwarz.

### 4. Gefüllte statt gezeichneter Silhouette

`cooked_lurk` kam vollflächig gefüllt zurück (25,4 % helle Pixel gegen 6,7 %
Median). Die Datei war einwandfrei.

**Diese Klasse fängt keine Pixelmetrik.** Sie fiel nur beim Ansehen des
Kontrollblatts auf. Deshalb ist Schritt 4 oben nicht optional.

## App-Icon (eigene Quelle)

Nicht zu verwechseln mit den Item-Bildern: das App-Icon fuer Startbildschirm,
Homescreen und Browser-Tab hat ein eigenes Rohbild und ein eigenes Skript.

| | |
|---|---|
| Rohbild | `docs/muster/app-icon.png` |
| Aufbereitung | `node tools/app-icon.mjs` (`npm run icons:app`) |
| Quelle | `shell/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.ico`, `icon.svg`, `manifest.webmanifest` |
| Ausgeliefert | dieselben Namen im Wurzelverzeichnis (Build kopiert) |

Alle Groessen entstehen aus dem einen Rohbild. Wer eine nachpflegt, hat nach
der naechsten Aenderung zwei verschiedene Icons im Umlauf.

Besonderheiten gegenueber den Item-Bildern:

- **kein Rand** bei den normalen Groessen: iOS rundet selbst, ein eigener Rand
  stuende als schwarzer Rahmen um das gerundete Icon
- **maskable** skaliert auf 80 % und setzt auf schwarzen Grund - Android
  beschneidet je nach Launcher Kreis oder Tropfen
- **`favicon.ico`** schreibt das Skript selbst (PNG-Eintraege, drei Groessen);
  `sharp` kann kein ICO

## Werkzeuge

```sh
npm run icons:check    # Item-Rohbilder nur prüfen
npm run icons          # Item-Bilder prüfen + aufbereiten + Tabelle schreiben
npm run icons:app      # App-Icon in allen Groessen
npm run assets         # alles zusammen
npm test               # u. a. tests/item-bilder.test.mjs, tests/app-icon.test.mjs
```

`tools/icons.mjs` schneidet auf den Inhalt zu (`trim`, Schwelle 40), legt 8 %
Rand an, skaliert in **zwei getrennten `sharp`-Instanzen** auf 128 px und
schreibt als PNG-Palette mit Stufe 9.

Die Trennung ist Pflicht: `sharp` führt pro Pipeline nur **einen** `resize`
aus, ein zweiter in derselben Kette wird still ignoriert. Alle Bilder kamen
dadurch mit 254–276 px statt 128 heraus.

## Test

`tests/item-bilder.test.mjs` prüft:

- Tabelle und Dateibestand sind deckungsgleich
- jedes Bild gehört zu einem existierenden Item
- 128 × 128 und unter 20 kB
- Pfade sind relativ (`img/items/…`, kein führender Schrägstrich — sonst bricht
  einer der beiden Hosts, GitHub Pages und Vercel)
- **jedes** Item hat ein Bild; schlägt das fehl, ist der Emoji-Rückfall wieder
  im Spiel und braucht einen eigenen Test

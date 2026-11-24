# Balancing-Befunde

Grundlage: `docs/BALANCING.md` (Zahlen) und `tests/balance.test.mjs` (Wächter).
Der Bericht wird von `node tools/balance.mjs --write` erzeugt und gegen das
gebaute Bündel gerechnet, nicht gegen die Quellen — die Zahlen sind also die,
die der Spieler sieht.

Stand: Version 14.0.0, 34 Waffen, 33 Rüstungsteile, 10 Perks,
14 Verbrauchsgüter, 9 Monster.

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

## B1 — Rüstung schützt nicht

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

**Vorschlag:** `def` an die Rüstungsteile schreiben, gestaffelt und am END-Bonus
orientiert:

| Stufe | Beispiel | `def` |
|---|---|---|
| Stoff, Leder | Lederkappe, Lederhose | 1–2 |
| Metall, Raider | Metallrüstung, Raider-Beinschutz | 3–4 |
| Kampf, Synth | Kampfrüstung, Synth-Rüstung | 5–6 |
| Power Rüstung | T-45 | 10–12 |

Das ist reine Datenänderung (`data_items.js`), kein Codeeingriff.

---

## B2 — 30 % der Truhen sind nicht zu öffnen

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

**Vorschlag:** Der Schlüssel muss `defusal` heißen. Das Minispiel existiert und
ist fertig — aber es hat einen zweiten Mangel: `defusal.end()` akzeptiert
keinen Rückruf, die Truhe bliebe also auch dann zu. Es braucht eine
`init(onSuccess, onFail)` wie `memory`, die `end(true)` / `end(false)`
weiterreicht.

Bis das behoben ist: den Bomben-Zweig abschalten (`isBomb = false`), sonst
verliert ein Drittel der Truhen den Spielstand-Fortschritt.

---

## B3 — Buff-Items wirken nicht

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

**Vorschlag:** `state.buffs: [{id, bonus, expires}]` einführen, `getStat` um die
aktiven Buffs erweitern, Buffout und Jet dauerhaft über `state.stats` (dann
aber die `duration` aus den Daten entfernen).

---

## B4 — Strahlungsresistenz wird ignoriert

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

**Vorschlag:** In `addRadiation` zusätzlich `getStat('RAD_RESIST')` abziehen,
gedeckelt auf 90 %. Dann wirkt der Anzug (1000 → Deckel 90 %) und Rad-X
addiert dazu.

---

## B5 — CHA hat keine Wirkung

**Was passiert:** `CHA` ist im Spielstand angelegt und wird im Admin-Panel
angezeigt, aber von keiner Spielmechanik gelesen. `STR` (Nahkampfschaden),
`PER` (Trefferchance), `END` (Maximal-HP), `AGI` (gegnerische Trefferchance),
`INT` (Hacken, Merksequenz) und `LUC` (Krit, Würfelspiel) wirken alle.

**Vorschlag:** Zwei naheliegende Punkte, an denen CHA zählen kann:
Händlerpreise (`Preis × (1 − CHA/50)`, gedeckelt) und die Anzahl der
Quest-Belohnungen. Beides ist wenig Code.

---

## B6 — Zwei Minispiele sind unerreichbar

| Minispiel | Auslöser |
|---|---|
| `lockpicking` | Truhen (`game_map.js`) |
| `memory` | Truhen ab Dungeon-Ebene 3 |
| `dice` | Stadtansicht (seit BEFUNDE.md 9) |
| `hacking` | **nirgends** |
| `defusal` | **nirgends** (siehe B2) |

`hacking` ist die einzige Stelle, an der INT die Schwierigkeit senkt
(12 − INT Wörter). Solange es an keinem Terminal hängt, hat INT nur Einfluß
auf die Merksequenz.

Es gibt einen Debug-Dialog (`Game.testMinigames`) an einem Kachel-Typ `?` —
der Generator (`game_world_gen.js`) setzt dieses Zeichen aber nie.

---

## B7 — Die Minigun ist die schlechteste Waffe im Spiel

Kaufpreis 1500 KK (die teuerste), 15 Schaden (Platz 18 von 34), Verbrauch
5 Mikro-Zellen pro Schuss. Ergebnis: **100 KK pro Schadenspunkt** — das
25-Fache der Doppelflinte (11,67 KK/DMG).

Gerechnet auf Schaden pro Kronkorken (Kaufpreis + Munition):

| Waffe | DMG | Mun./Schuss | KK pro DMG |
|---|---:|---:|---:|
| Doppelflinte | 30 | 8,00 | 11,67 |
| Plasmagewehr | 45 | 15,00 | 20,00 |
| Minigun | 15 | 10,00 | **100,00** |

**Vorschlag:** Die Minigun braucht entweder deutlich mehr Schaden (30–35, dann
trägt der Preis), oder sie braucht einen Sonderfall: mehrere Treffer pro
Schuss, wie es die Beschreibung („Extremes Schnellfeuer (Mehrfach-Treffer)")
verspricht. Der Code kennt keinen Mehrfachtreffer.

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

## Was zuerst?

| Reihenfolge | Befund | Aufwand | Wirkung |
|---|---|---|---|
| 1 | **B2** Truhen | klein | 30 % der Truhen sind kaputt |
| 2 | **B1** Rüstung | Daten | ganzes Ausrüstungssystem |
| 3 | **B4** Strahlung | klein | Anzug und Rad-X funktionieren |
| 4 | **B3** Buffs | mittel | 310 KK Ladenwert |
| 5 | **B5** CHA | klein | ein SPECIAL-Wert mehr |
| 6 | **B6/B7** | mittel | Feinschliff |

B2 zuerst, weil es kein Balancing ist, sondern ein Fehler mit Datenverlust.

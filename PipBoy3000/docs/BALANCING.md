# Balancing-Bericht

Erzeugt von `node tools/balance.mjs --write`. Nicht von Hand ändern —
die Zahlen kommen aus dem gebauten Bündel und dem Quelltext.

Stand: Version 14.0.0

## 1. Waffen

| Waffe | Katalog | Kampf | Munition | Verbrauch | Mun./Schuss | Preis | Preis/DMG |
|---|---:|---:|---|---:|---:|---:|---:|
| Alien Blaster | 80 | 80 | — | 1 | 0.00 KK | 3000 | 37.50 |
| Todeskralle | 50 | 50 | — | 1 | 0.00 KK | 1000 | 20.00 |
| Superhammer | 45 | 45 | — | 1 | 0.00 KK | 700 | 15.56 |
| Plasmagewehr | 45 | 45 | Energiezellen | 3 | 15.00 KK | 900 | 20.00 |
| Kampfflinte | 38 | 38 | Schrotpatronen | 2 | 8.00 KK | 600 | 15.79 |
| Scharfschützengewehr | 35 | 35 | .308-Munition | 1 | 3.00 KK | 700 | 20.00 |
| Plasmapistole | 35 | 35 | Energiezellen | 3 | 15.00 KK | 600 | 17.14 |
| Lasergewehr | 32 | 32 | Energiezellen | 2 | 10.00 KK | 650 | 20.31 |
| Powerfaust | 30 | 30 | — | 1 | 0.00 KK | 450 | 15.00 |
| Doppelflinte | 30 | 30 | Schrotpatronen | 2 | 8.00 KK | 350 | 11.67 |
| Sturmgewehr | 28 | 28 | .308-Munition | 2 | 6.00 KK | 550 | 19.64 |
| Vorschlaghammer | 25 | 25 | — | 1 | 0.00 KK | 180 | 7.20 |
| .44 Revolver | 25 | 25 | .308-Munition | 1 | 3.00 KK | 250 | 10.00 |
| Laserpistole | 22 | 22 | Energiezellen | 2 | 10.00 KK | 400 | 18.18 |
| Jagdgewehr | 20 | 20 | .308-Munition | 1 | 3.00 KK | 200 | 10.00 |
| Ripper | 18 | 18 | — | 1 | 0.00 KK | 350 | 19.44 |
| Nagelschläger | 16 | 16 | — | 1 | 0.00 KK | 150 | 9.38 |
| Minigun | 15 | 15 | Mikro-Zellen | 5 | 10.00 KK | 1500 | 100.00 |
| Alu-Schläger | 13 | 13 | — | 1 | 0.00 KK | 120 | 9.23 |
| Machete | 12 | 12 | — | 1 | 0.00 KK | 80 | 6.67 |
| Rohr-Sniper | 12 | 12 | Schrott-Munition (.38) | 2 | 2.00 KK | 60 | 5.00 |
| 10mm Pistole | 12 | 12 | 10mm-Munition | 1 | 2.00 KK | 120 | 10.00 |
| Baseballschläger | 10 | 10 | — | 1 | 0.00 KK | 60 | 6.00 |
| Maschinenpistole | 10 | 10 | 10mm-Munition | 3 | 6.00 KK | 300 | 30.00 |
| Rohrrevolver | 9 | 9 | Schrott-Munition (.38) | 1 | 1.00 KK | 45 | 5.00 |
| Kampfmesser | 8 | 8 | — | 1 | 0.00 KK | 50 | 6.25 |
| Schlagstock | 7 | 7 | — | 1 | 0.00 KK | 40 | 5.71 |
| Rohrgewehr | 7 | 7 | Schrott-Munition (.38) | 1 | 1.00 KK | 30 | 4.29 |
| Rohrzange | 6 | 6 | — | 1 | 0.00 KK | 30 | 5.00 |
| Springmesser | 5 | 5 | — | 1 | 0.00 KK | 15 | 3.00 |
| Rohrpistole | 5 | 5 | Schrott-Munition (.38) | 1 | 1.00 KK | 15 | 3.00 |
| Schlagring | 4 | 4 | — | 1 | 0.00 KK | 25 | 6.25 |
| Nudelholz | 3 | 3 | — | 1 | 0.00 KK | 5 | 1.67 |
| Fäuste | 2 | 2 | — | 1 | 0.00 KK | 0 | 0.00 |

Katalog- und Kampfwert stimmen bei 34 von 34 Waffen überein.

Günstigste Leistung: **Nudelholz** (1.67 KK pro Schadenspunkt).
Teuerste Leistung: **Minigun** (100.00 KK pro Schadenspunkt).

Preis gegen Schaden: Steigung 28.69 KK pro Schadenspunkt, Korrelation r = 0.83.
Der Preis folgt dem Schaden nur locker. Einzelne Waffen sind deutlich über- oder unterbezahlt.

## 2. Rüstung

| Teil | Slot | Preis | Boni | Punkte | Schutz | KK/Punkt |
|---|---|---:|---|---:|---|---:|
| Metallarme | arms | 120 | STR+1 END+1 | 2 | — | 60.00 |
| Kampfarmschienen | arms | 250 | STR+2 | 2 | — | 125.00 |
| Raider-Armschiene (L) | arms | 30 | STR+1 | 1 | — | 30.00 |
| Lederarmschienen | arms | 80 | STR+1 | 1 | — | 80.00 |
| Taktischer Rucksack | back | 600 | slots+14 END+1 | 1 | — | 600.00 |
| Rucksack-Gestell | back | 20 | slots+2 | 0 | — | — |
| Leder-Rucksack | back | 100 | slots+6 | 0 | — | — |
| Verstärkter Rucksack | back | 250 | slots+10 AGI-1 | -1 | — | — |
| Brahmin-Kiepe | back | 550 | slots+22 AGI-2 | -2 | — | — |
| Strahlenschutzanzug | body | 400 | RAD+1000 END-2 | 998 | — | 0.40 |
| Power Rüstung T-45 | body | 2500 | END+12 STR+4 RAD+100 AGI-3 | 113 | — | 22.12 |
| Kampfrüstung | body | 600 | END+6 STR+1 | 7 | — | 85.71 |
| Synth-Rüstung | body | 800 | END+5 INT+2 | 7 | — | 114.29 |
| Lederrüstung | body | 150 | END+2 AGI+2 | 4 | — | 37.50 |
| Metallrüstung | body | 300 | END+5 AGI-2 | 3 | — | 100.00 |
| Raider-Rüstung | body | 80 | END+1 STR+1 | 2 | — | 40.00 |
| Vault-Anzug | body | 0 | END+1 INT+1 | 2 | — | 0.00 |
| Kampfstiefel | feet | 150 | AGI+1 END+1 | 2 | — | 75.00 |
| Lederstiefel | feet | 70 | AGI+1 | 1 | — | 70.00 |
| Alte Stiefel | feet | 20 |  | 0 | — | — |
| Gasmaske | head | 120 | RAD+20 | 20 | — | 6.00 |
| Kampfhelm | head | 300 | END+2 PER+1 | 3 | — | 100.00 |
| Synth-Feldhelm | head | 400 | PER+2 INT+1 | 3 | — | 133.33 |
| Lederkappe | head | 60 | PER+1 | 1 | — | 60.00 |
| Metallhelm | head | 150 | END+2 PER-1 | 1 | — | 150.00 |
| Baseballkappe | head | 20 | PER+1 | 1 | — | 20.00 |
| Minenhelm | head | 50 | END+1 | 1 | — | 50.00 |
| Sackgassen-Helm | head | 40 | PER-1 END+1 | 0 | — | — |
| Kampfbeinschützer | legs | 280 | END+2 AGI+1 | 3 | — | 93.33 |
| Raider-Beinschutz | legs | 35 | END+1 | 1 | — | 35.00 |
| Lederhose | legs | 100 | AGI+1 | 1 | — | 100.00 |
| Metallbeinschienen | legs | 140 | END+2 AGI-1 | 1 | — | 140.00 |
| Jeans | legs | 30 | AGI+1 | 1 | — | 30.00 |

**Schutzfeld:** 0 von 33 Rüstungsteilen haben `def` oder `DR`.

Der Kampf rechnet mit `Math.max(1, Schaden - Math.floor(armor / 2))` und liest dafür
`equip[slot].def` — ein Feld, das kein Rüstungsteil besitzt. Ausrüstung mindert den
erlittenen Schaden also **nicht**.

Die END- und AGI-Boni wirken trotzdem: END erhöht die Maximal-HP, AGI senkt die Trefferchance der Gegner (85 − AGI×3).

## 3. Perks

| Perk | Stufen | Wirkung | wird gelesen |
|---|---:|---|---|
| Zähigkeit | 5 | +10 Max HP pro Stufe. | ja |
| Sanitäter | 5 | +20% Heilung durch Stimpacks pro Stufe. | ja |
| Rad-Resistenz | 5 | -10% Strahlungsaufnahme pro Stufe. | ja |
| Starker Rücken | 5 | +2 Inventar-Slots pro Stufe. | ja |
| Schatzsucher | 5 | +10% mehr Kronkorken finden pro Stufe. | ja |
| Wiederverwerter | 3 | Höhere Chance auf seltene Teile beim Zerlegen. | ja |
| Heller Kopf | 5 | +5% Erfahrungspunkte (XP) pro Stufe. | ja |
| Mysteriöser Fremder | 5 | +2% Krit-Chance im V.A.T.S. pro Stufe. | ja |
| Revolverheld | 5 | +10% Schaden mit Schusswaffen pro Stufe. | ja |
| Schläger | 5 | +10% Schaden im Nahkampf pro Stufe. | ja |

Alle 10 Perks werden im Code gelesen.

## 4. SPECIAL

| Wert | gelesen an | Anzahl | Boni aus Rüstung |
|---|---|---:|---:|
| STR | `src/game/game_combat.js:253` | 1 | 11 |
| PER | `src/data/data_minigames.js:172`<br>`src/game/game_combat.js:193` | 2 | 3 |
| END | `src/game/game_core.js:141` | 1 | 44 |
| CHA | **nirgends** | 0 | 0 |
| INT | `src/data/data_minigames.js:11`<br>`src/data/data_minigames.js:252` | 2 | 4 |
| AGI | `src/data/data_minigames.js:171`<br>`src/game/game_combat.js:311` | 2 | -2 |
| LUC | `src/data/data_minigames.js:133`<br>`src/game/game_core.js:147`<br>`src/ui/ui_render_minigames.js:264` | 3 | 0 |

**CHA** wird von keiner Spielmechanik gelesen.

## 5. Verbrauchsgüter

| Item | Effekt | Wert | Strahlung | Preis | HP pro KK |
|---|---|---:|---:|---:|---:|
| Gegrillte Kakerlake | heal_rad | 15 | 2 | 10 | 1.50 |
| Gegrillte Fliege | heal_rad | 15 | 2 | 10 | 1.50 |
| Ratten-Steak | heal_rad | 25 | 3 | 20 | 1.25 |
| Mirelurk-Happen | heal_rad | 35 | 4 | 30 | 1.17 |
| Skorpion-Überraschung | heal_rad | 45 | 5 | 40 | 1.13 |
| Nuka Cola | heal | 10 | 0 | 10 | 1.00 |
| Nuka Quantum | heal | 100 | 0 | 100 | 1.00 |
| Super-Stimpack | heal | 100 | 0 | 120 | 0.83 |
| Stimpack | heal | 40 | 0 | 50 | 0.80 |
| Stealth Boy | buff {"AGI":10} | — | 0 | 200 | — |
| RadAway | rad | -50 | 0 | 40 | — |
| Rad-X | buff {"RAD_RESIST":20} | — | 0 | 40 | — |
| Jet | buff {"AP":20} | — | 0 | 30 | — |
| Buffout | buff {"STR":2,"END":2} | — | 0 | 40 | — |

### Wirken die Effekte?

- **Heilung** (`heal`, `heal_rad`): wirkt. 9 Items heilen, der Sanitäter-Perk verstärkt sie.
- **Buffs** (`buff`, 4 Items: Stealth Boy, Rad-X, Jet, Buffout): **wirken nicht**. `useItem` schreibt nur „Effekte noch WIP" ins Log und verbraucht das Item. Kein Code legt den Bonus je auf `state.stats` oder führt eine Dauer.
- **Strahlungsresistenz** (`RAD_RESIST` aus Rad-X und Strahlenschutzanzug): **wird nirgends gelesen**. `addRadiation` kennt nur den Rad-Resistenz-Perk.

## 6. Minispiele

| Minispiel | erreichbar über |
|---|---|
| hacking | **nicht erreichbar** |
| lockpicking | `src/game/game_map.js` |
| memory | `src/game/game_map.js` |
| defusal | **nicht erreichbar** |
| dice | `src/ui/ui_view_town.js`<br>`src/ui/ui_view_town.js` |

**Aufruf auf einen Schlüssel, den es nicht gibt:**

- `startMinigame('bomb')` in `src/game/game_map.js` — `MiniGames.bomb` existiert nicht.

`startMinigame` bricht bei unbekanntem Schlüssel still ab (`if (!MiniGames[type]) return;`).
Der Aufrufer bekommt weder Erfolg noch Fehlschlag, also bleibt sein Zustand hängen.

`hacking`, `defusal` werden von keiner Spielsituation gestartet.

Das betrifft die Werte: `hacking` ist die einzige Stelle, an der INT die Schwierigkeit senkt
(12 − INT Wörter). Solange es unerreichbar ist, hat INT keine Wirkung im Spiel.

## 7. Monster gegen Waffen

Treffer bis zum Kill bei 50 % Trefferchance (die Grundchance liegt bei 50 + PER×5).

| Monster | HP | Gegenschaden | XP | Fäuste | Kampfmesser | 10mm Pistole | Jagdgewehr | Plasmagewehr | Alien Blaster |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rad-Kakerlake | 15 | 3 | 10-20 | 16 | 4 | 4 | 2 | 2 | 2 |
| Blähfliege | 20 | 15 | 20-35 | 20 | 6 | 4 | 2 | 2 | 2 |
| Maulwurfsratte | 25 | 5 | 15-30 | 26 | 8 | 6 | 4 | 2 | 2 |
| Wilder Hund | 35 | 8 | 25-40 | 36 | 10 | 6 | 4 | 2 | 2 |
| Raider | 60 | 12 | 50-80 | 60 | 16 | 10 | 6 | 4 | 2 |
| Wilder Ghul | 80 | 18 | 60-90 | 80 | 20 | 14 | 8 | 4 | 2 |
| Rad-Skorpion | 120 | 25 | 100-150 | 120 | 30 | 20 | 12 | 6 | 4 |
| Supermutant | 200 | 30 | 150-250 | 200 | 50 | 34 | 20 | 10 | 6 |
| Todeskralle | 500 | 80 | 500-800 | 500 | 126 | 84 | 50 | 24 | 14 |

## 8. Wirtschaft

- Waffenpreise: 0 bis 3000 KK (Median 200)
- Startkapital: 50 KK
- Höchste Beute pro Kampf: 50 KK
- Kämpfe bis zur teuersten Waffe (nur Beute, ohne Verkäufe): **60**

## 9. Fazit

Das Spiel hat 34 Waffen, 33 Rüstungsteile, 10 Perks,
14 Verbrauchsgüter und 9 Monster. Die Schadens- und Preiskurve
der Waffen ist in Ordnung. Die Lücken liegen bei allem, was *nicht* Schaden ist:

- Rüstung schützt nicht (kein `def`-Feld).
- Minispiele ohne Auslöser: hacking, defusal.
- Minispiel-Aufruf auf unbekannten Schlüssel: bomb.
- Buff-Items wirken nicht (Bonus wird nie angewandt).
- Strahlungsresistenz wird ignoriert.
- SPECIAL ohne Wirkung: CHA.

Details und Behebungsvorschläge in `docs/BALANCE_BEFUNDE.md`.


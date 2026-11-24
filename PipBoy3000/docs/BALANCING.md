# Balancing-Bericht

Erzeugt von `node tools/balance.mjs --write`. Nicht von Hand ändern —
die Zahlen kommen aus dem gebauten Bündel und dem Quelltext.

Stand: Version 14.0.2

## 1. Waffen

| Waffe | Katalog | Kampf | Munition | Verbrauch | Mun./Schuss | Preis | Preis/DMG |
|---|---:|---:|---|---:|---:|---:|---:|
| Alien Blaster | 80 | 80 | — | 1 | 0.00 KK | 3000 | 37.50 |
| Todeskralle | 50 | 50 | — | 1 | 0.00 KK | 1000 | 20.00 |
| Minigun | 48 | 48 | Mikro-Zellen | 5 | 10.00 KK | 1700 | 35.42 |
| Lasergewehr | 48 | 48 | Energiezellen | 2 | 10.00 KK | 1250 | 26.04 |
| Superhammer | 45 | 45 | — | 1 | 0.00 KK | 700 | 15.56 |
| Scharfschützengewehr | 45 | 45 | .308-Munition | 1 | 3.00 KK | 1150 | 25.56 |
| Sturmgewehr | 45 | 45 | .308-Munition | 2 | 6.00 KK | 1150 | 25.56 |
| Plasmagewehr | 45 | 45 | Energiezellen | 3 | 15.00 KK | 900 | 20.00 |
| Plasmapistole | 40 | 40 | Energiezellen | 3 | 15.00 KK | 880 | 22.00 |
| Kampfflinte | 38 | 38 | Schrotpatronen | 2 | 8.00 KK | 600 | 15.79 |
| Powerfaust | 30 | 30 | — | 1 | 0.00 KK | 450 | 15.00 |
| Doppelflinte | 30 | 30 | Schrotpatronen | 2 | 8.00 KK | 350 | 11.67 |
| Vorschlaghammer | 25 | 25 | — | 1 | 0.00 KK | 180 | 7.20 |
| .44 Revolver | 25 | 25 | .308-Munition | 1 | 3.00 KK | 250 | 10.00 |
| Laserpistole | 22 | 22 | Energiezellen | 2 | 10.00 KK | 240 | 10.91 |
| Jagdgewehr | 20 | 20 | .308-Munition | 1 | 3.00 KK | 230 | 11.50 |
| Ripper | 18 | 18 | — | 1 | 0.00 KK | 420 | 23.33 |
| Nagelschläger | 16 | 16 | — | 1 | 0.00 KK | 150 | 9.38 |
| Alu-Schläger | 13 | 13 | — | 1 | 0.00 KK | 120 | 9.23 |
| Machete | 12 | 12 | — | 1 | 0.00 KK | 80 | 6.67 |
| Rohr-Sniper | 12 | 12 | Schrott-Munition (.38) | 2 | 2.00 KK | 60 | 5.00 |
| 10mm Pistole | 12 | 12 | 10mm-Munition | 1 | 2.00 KK | 150 | 12.50 |
| Baseballschläger | 10 | 10 | — | 1 | 0.00 KK | 60 | 6.00 |
| Maschinenpistole | 10 | 10 | 10mm-Munition | 3 | 6.00 KK | 55 | 5.50 |
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
Teuerste Leistung: **Alien Blaster** (37.50 KK pro Schadenspunkt).

Preis gegen Schaden: Steigung 31.78 KK pro Schadenspunkt, Korrelation r = 0.93.
Der Preis folgt dem Schaden fast linear — es gibt keine Waffe, die ihr Geld nicht wert ist.

## 2. Rüstung

| Teil | Slot | Preis | Boni | Punkte | Schutz | KK/Punkt |
|---|---|---:|---|---:|---|---:|
| Metallarme | arms | 120 | STR+1 END+1 | 2 | def | 60.00 |
| Kampfarmschienen | arms | 250 | STR+2 | 2 | def | 125.00 |
| Raider-Armschiene (L) | arms | 30 | STR+1 | 1 | def | 30.00 |
| Lederarmschienen | arms | 80 | STR+1 | 1 | def | 80.00 |
| Taktischer Rucksack | back | 600 | slots+14 END+1 | 1 | — | 600.00 |
| Rucksack-Gestell | back | 20 | slots+2 | 0 | — | — |
| Leder-Rucksack | back | 100 | slots+6 | 0 | — | — |
| Verstärkter Rucksack | back | 250 | slots+10 AGI-1 | -1 | — | — |
| Brahmin-Kiepe | back | 550 | slots+22 AGI-2 | -2 | — | — |
| Strahlenschutzanzug | body | 400 | RAD+1000 END-2 | 998 | def | 0.40 |
| Power Rüstung T-45 | body | 2500 | END+12 STR+4 RAD+100 AGI-3 | 113 | def | 22.12 |
| Kampfrüstung | body | 600 | END+6 STR+1 | 7 | def | 85.71 |
| Synth-Rüstung | body | 800 | END+5 INT+2 | 7 | def | 114.29 |
| Lederrüstung | body | 150 | END+2 AGI+2 | 4 | def | 37.50 |
| Metallrüstung | body | 300 | END+5 AGI-2 | 3 | def | 100.00 |
| Raider-Rüstung | body | 80 | END+1 STR+1 | 2 | def | 40.00 |
| Vault-Anzug | body | 0 | END+1 INT+1 | 2 | def | 0.00 |
| Kampfstiefel | feet | 150 | AGI+1 END+1 | 2 | def | 75.00 |
| Lederstiefel | feet | 70 | AGI+1 | 1 | def | 70.00 |
| Alte Stiefel | feet | 20 |  | 0 | def | — |
| Gasmaske | head | 120 | RAD+20 | 20 | def | 6.00 |
| Kampfhelm | head | 300 | END+2 PER+1 | 3 | def | 100.00 |
| Synth-Feldhelm | head | 400 | PER+2 INT+1 | 3 | def | 133.33 |
| Lederkappe | head | 60 | PER+1 | 1 | def | 60.00 |
| Metallhelm | head | 150 | END+2 PER-1 | 1 | def | 150.00 |
| Baseballkappe | head | 20 | PER+1 | 1 | def | 20.00 |
| Minenhelm | head | 50 | END+1 | 1 | def | 50.00 |
| Sackgassen-Helm | head | 40 | PER-1 END+1 | 0 | def | — |
| Kampfbeinschützer | legs | 280 | END+2 AGI+1 | 3 | def | 93.33 |
| Raider-Beinschutz | legs | 35 | END+1 | 1 | def | 35.00 |
| Lederhose | legs | 100 | AGI+1 | 1 | def | 100.00 |
| Metallbeinschienen | legs | 140 | END+2 AGI-1 | 1 | def | 140.00 |
| Jeans | legs | 30 | AGI+1 | 1 | def | 30.00 |

**Schutzfeld:** 28 von 33 Rüstungsteilen haben `def` oder `DR`.

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
| PER | `src/data/data_minigames.js:191`<br>`src/game/game_combat.js:193` | 2 | 3 |
| END | `src/game/game_core.js:141` | 1 | 44 |
| CHA | `src/game/game_world_logic.js:321` | 1 | 0 |
| INT | `src/data/data_minigames.js:17`<br>`src/data/data_minigames.js:277` | 2 | 4 |
| AGI | `src/data/data_minigames.js:190`<br>`src/game/game_combat.js:311` | 2 | -2 |
| LUC | `src/data/data_minigames.js:144`<br>`src/game/game_core.js:147`<br>`src/ui/ui_render_minigames.js:276` | 3 | 0 |

## 5. Verbrauchsgüter

| Item | Effekt | Wert | Strahlung | Preis | HP pro KK |
|---|---|---:|---:|---:|---:|
| Gegrillte Kakerlake | heal_rad | 15 | 2 | 10 | 1.50 |
| Gegrillte Fliege | heal_rad | 15 | 2 | 10 | 1.50 |
| Hunde-Steak | heal_rad | 28 | 3 | 22 | 1.27 |
| Ratten-Steak | heal_rad | 25 | 3 | 20 | 1.25 |
| Mirelurk-Happen | heal_rad | 35 | 4 | 30 | 1.17 |
| Skorpion-Überraschung | heal_rad | 45 | 5 | 40 | 1.13 |
| Nuka Cola | heal | 10 | 0 | 10 | 1.00 |
| Nuka Quantum | heal | 100 | 0 | 100 | 1.00 |
| Yao Guai Steak | heal_rad | 50 | 6 | 55 | 0.91 |
| Super-Stimpack | heal | 100 | 0 | 120 | 0.83 |
| Stimpack | heal | 40 | 0 | 50 | 0.80 |
| Stealth Boy | buff {"AGI":10} | — | 0 | 200 | — |
| RadAway | rad | -50 | 0 | 40 | — |
| Rad-X | buff {"RAD_RESIST":20} | — | 0 | 40 | — |
| Jet | buff {"AP":20} | — | 0 | 30 | — |
| Buffout | buff {"STR":2,"END":2} | — | 0 | 40 | — |

### Wirken die Effekte?

- **Heilung** (`heal`, `heal_rad`): wirkt. 11 Items heilen, der Sanitäter-Perk verstärkt sie.
- **Buffs** (`buff`, 4 Items: Stealth Boy, Rad-X, Jet, Buffout): werden angewandt, mit Ablaufzeit.
- **Strahlungsresistenz** (`RAD_RESIST` aus Rad-X und Strahlenschutzanzug): wird gelesen.

### Roh oder gebraten

| Roh | +HP | +RAD | Gebraten | +HP | +RAD |
|---|---:|---:|---|---:|---:|
| Kakerlakenfleisch | 8 | 6 | Gegrillte Kakerlake | 15 | 2 |
| Fliegenfleisch | 8 | 6 | Gegrillte Fliege | 15 | 2 |
| Rattenfleisch | 12 | 9 | Ratten-Steak | 25 | 3 |
| Hundefleisch | 15 | 10 | Hunde-Steak | 28 | 3 |
| Mirelurk-Fleisch | 18 | 12 | Mirelurk-Happen | 35 | 4 |
| Skorpiondrüse | 22 | 14 | Skorpion-Überraschung | 45 | 5 |
| Yao Guai Rippchen | 30 | 16 | Yao Guai Steak | 50 | 6 |

Roh essen heilt weniger und verstrahlt mehr — das ist die Entscheidung zwischen „jetzt essen" und „erst am Lagerfeuer braten".

## 6. Minispiele

| Minispiel | erreichbar über |
|---|---|
| hacking | `src/game/game_map.js` |
| lockpicking | `src/game/game_map.js` |
| memory | `src/game/game_map.js` |
| defusal | `src/game/game_map.js` |
| dice | `src/ui/ui_view_town.js` |

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

- Waffenpreise: 0 bis 3000 KK (Median 180)
- Startkapital: 50 KK
- Höchste Beute pro Kampf: 50 KK
- Kämpfe bis zur teuersten Waffe (nur Beute, ohne Verkäufe): **60**

## 9. Fazit

Das Spiel hat 34 Waffen, 33 Rüstungsteile, 10 Perks,
16 Verbrauchsgüter und 9 Monster.

- ✓ Rüstung mindert Schaden
- ✓ Buffs wirken
- ✓ Strahlungsresistenz zählt
- ✓ jedes Minispiel hat einen Auslöser
- ✓ kein Aufruf auf unbekannten Minispiel-Schlüssel
- ✓ jeder SPECIAL-Wert wird gelesen

Details in `docs/BALANCE_BEFUNDE.md`.


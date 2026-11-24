# Item-Bilder — was noch fehlt

Stand: 23 von 126 Items haben ein Bild (`img/items/`).
Werkzeug: `npm run icons` (beschneiden, Rand, 128 px, Tabelle schreiben).
Rohbilder liegen in `docs/muster/<id>.png`, ausgeliefert wird `img/items/<id>.png`.

## Stil (für alle Prompts gleich)

> monochrome phosphor green line art (#39ff14) on a solid pure black background,
> thick clean uniform stroke width, upright, centered, filling about 80% of the
> square frame, narrow black margin. No text, no letters, no numbers, no border,
> no frame, no shadow, no gradient.

Die Lage ist entscheidend: **aufrecht oder diagonal mit gefüllter Fläche.**
Die erste Spritze lag flach diagonal im Bild und war bei 32 px nur ein Strich.

## Fertig (23)

Verbrauchsgüter: `stimpack` `radaway` `radx` `nuka_cola` `nuka_quantum`
`jet` `buffout` `stealth_boy`
Munition: `ammo_10mm` `ammo_shell` `ammo_micro`
Waffen: `pistol_10mm` `revolver_44` `shotgun` `combat_shotgun` `smg`
`assault_rifle` `minigun` `laser_pistol` `laser_rifle` `plasma_pistol` `plasma_rifle`
Rüstung: `power_armor`

## Inhaltsfehler: Tiere statt Fleisch

`meat_roach` `meat_fly` `meat_mole` zeigen das ganze Tier (Kakerlake,
Fliege, Ratte) statt eines Fleischstuecks. Das Pruefskript kann das nicht
fangen - die Bilder sind technisch einwandfrei, nur inhaltlich falsch.

Ursache: "a lump of raw insect meat with legs attached" wurde als ganzes
Insekt gelesen. Richtig ist: das Fleischstueck ist die Hauptform, die
Herkunft nur ein kleines Detail.

Regel: bei Fleisch zuerst die FORM nennen (Steak, Rippchen, Klaue,
Braten), die Herkunft nur als Beigabe.

## Ausschuss in Block 5

`bp_stimpack` und `gears` hatten weissen Hintergrund (85,6 % / 36,3 %) —
mit dem Zusatz "on a SOLID PURE BLACK BACKGROUND (no white, no light grey)"
im Prompt beide im zweiten Anlauf sauber.

`duct_tape` ist aufgegeben: zwei Versuche, beide Male ein weisser
Streifen ueber die volle Breite am unteren Rand (y 896-1023 und
y 925-1023). Das Motiv selbst war richtig, der Streifen ist ein Artefakt
der Erzeugung. Weitere Versuche mit demselben Motiv sind unrentabel.

## Regel: Hintergrund pruefen

Ein Motiv kann inhaltlich stimmen und trotzdem unbrauchbar sein, wenn der
Hintergrund weiss ist. Das Faerbungsmuster "green line art on a solid pure
black background" wird nicht immer befolgt. `tools/icon-check.mjs` zaehlt
weisse Pixel und bricht ab - bei `gears` war nur der Hintergrund falsch,
die Zahnraeder selbst waren sauber.

## Ausschuss in Block 4 — erledigt

`greaves_metal` und `helmet_combat` wurden vom Pruefskript abgefangen
(14,9 % und 80,5 % weisse Pixel) und neu gezeichnet. Beide sind jetzt im Set.

## Bildfehler-Prüfung

`node tools/icon-check.mjs` (laeuft bei `npm run icons` zuerst) meldet Rohbilder
mit mehr als 0,5 % weissen Pixeln und bricht dann ab.

Bisher gefunden: `knuckles` (weisse Stoerung in allen vier Ecken) und
`pipe_sniper` (gefuellte Grafik auf Weiss statt Linien auf Schwarz). Beide neu
gezeichnet, die Pruefung greift jetzt vor der Aufbereitung.

## Erledigt in Block 3 — Restliche Waffen (23)

Schusswaffen:

| id | Motiv |
|---|---|
| `pipe_pistol` | Rohrpistole aus Rohren und Klebeband |
| `pipe_rifle` | Rohrgewehr mit langem Rohr und Holzschaft |
| `pipe_revolver` | Rohrrevolver, grob, mit Trommel |
| `pipe_sniper` | Rohr-Sniper mit Zielfernrohr aus Rohren |
| `hunting_rifle` | Jagdgewehr, Holzschaft, Repetierhebel |
| `sniper_rifle` | Scharfschützengewehr mit großem Zielfernrohr und Zweibein |
| `alien_blaster` | außerirdische Strahlenwaffe, organisch gerundet |

Nahkampf:

| id | Motiv |
|---|---|
| `fists` | gepanzerte Faust / Schlaghandschuh |
| `knuckles` | Schlagring mit vier Löchern und Noppen |
| `switchblade` | Springmesser, schmale Klinge, Knopf am Griff |
| `knife` | Kampfmesser, kurze Klinge, Parierstange |
| `machete` | Machete, breite Klinge |
| `rolling_pin` | Nudelholz aus Holz mit zwei Griffen |
| `pipe_wrench` | Rohrzange, gezahnte Backe |
| `police_baton` | Schlagstock mit Seitengriff |
| `baseball_bat` | Baseballschläger aus Holz |
| `bat_alum` | Alu-Schläger, glatter Lauf, Klebeband am Griff |
| `bat_spiked` | Baseballschläger mit Nägeln |
| `sledgehammer` | Vorschlaghammer, schwerer Kopf |
| `super_sledge` | Superhammer, überdimensionierter Kopf mit Bolzen |
| `ripper` | Kettensäge-Klinge mit Motor und Kabel |
| `power_fist` | angetriebene Powerfaust mit Hydraulik |
| `deathclaw_gauntlet` | Handschuh aus Todeskrallen-Klauen |

## Block 4 — Rüstung (25) — KOMPLETT

| Stufe | ids |
|---|---|
| Raider ✓ | `raider_armor` `raider_helm` `raider_arm_l` `raider_leg_r` |
| Leder ✓ | `leather_armor` `leather_helm` `bracers_leather` `pants_leather` `boots_leather` |
| Metall ✓ | `metal_armor` `helmet_metal` `metal_arms` `greaves_metal` |
| Kampf ✓ | `combat_armor` `helmet_combat` `combat_arms` `combat_legs` `boots_combat` |
| Synth ✓ | `synth_armor` `synth_helmet` |
| Sonstiges ✓ | `vault_suit` `hazmat_suit` `cap_baseball` `helmet_mining` `gas_mask` `jeans` `boots_worn` |

## Block 5 — Handwerk, Rohstoffe, Rucksäcke (42)  ← laeuft

Rucksäcke (fertig): `backpack_frame` `backpack_leather` `backpack_metal`
`backpack_military` `backpack_cargo`

Werkzeug: `camp_kit` `lockpick` `wrench` `clipboard` `tin_can`
`radio_part` `fusion_core`

Baupläne ✓: `bp_ammo` `bp_stimpack`

Munition (fertig): `ammo` (Schrott .38) `ammo_308` `ammo_cell`

Rohstoffe (11/12): `junk_metal` `cloth` `screws` `glue` `springs` `plastic` `leather`
`gears` `circuit` `adhesive` `oil` · aufgegeben: `duct_tape`

Selten (4/8): `nuclear_mat` `legendary_part` `titanium` `bone`
Offen: `deathclaw_hand` `acid` `poison_gland` `gunpowder`

Nahrung (roh) 5/8: `meat_dog` `meat_scorp` `meat_yao` `meat_lurk` `hide_yao`
Falsch, neu: `meat_roach` `meat_fly` `meat_mole`

Nahrung (gebraten): `cooked_roach` `cooked_mole` `cooked_fly`
`cooked_scorp` `cooked_lurk` `cooked_dog` `cooked_yao`

Verbrauchsgut ✓: `super_stimpack`

## Regel für die Rohstoffe

Bei Rohmaterial reicht ein **Symbol-Motiv** (Schraube, Zahnrad, Klebeband-
Rolle) statt einer realistischen Darstellung — bei 32 px ist eine
Schraubenschachtel nicht lesbar, eine einzelne Schraube schon.

## Prüfung nach jedem Block

```sh
npm run icons          # aufbereiten + Tabelle schreiben
npm test               # tests/item-bilder.test.mjs prüft Tabelle, Größe, Pfade
```

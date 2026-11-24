# GAME_PLAN.md: Tiny Tycoon Towns

**Status:** Umsetzungsplan v1.0
**Modus:** Solo-first, Multiplayer als Addon
**Sprache:** Dokument Deutsch, Code und Bezeichner Englisch

> Dieses Dokument ist die Single Source of Truth für Design, Technik und Plan. Maßgeblich sind die Zahlen in `packages/data/*.json`. Hier stehen Startwerte. Designänderungen erfolgen per PR auf dieses Dokument und werden im ADR-Log (Abschnitt 6.4) festgehalten.

---

## 0. So arbeitest du mit diesem Dokument

- **Prioritäten:** `P1` Solo-MVP · `P2` Solo-Handel · `P3` Multiplayer-Addon · `P4` Ausbau und Release
- **Tickets:** Jede Checkbox ist ein GitHub-Issue. Labels: `phase-1` bis `phase-4`, `area-domain`, `area-render`, `area-ui`, `area-firebase`, `area-data`. Milestones entsprechen Wochen.
- **Regel:** Nichts aus P3 oder P4 wird in P1 gebaut. Ausgenommen sind die Architekturvorbereitungen aus Abschnitt 6.2.

---

## 1. Vision

| | |
|---|---|
| **Pitch** | Baue eine kleine Stadt, die auch ohne dich wächst. Dein Biom entscheidet, was du selbst herstellen kannst, und warum du handeln willst. |
| **Genre** | Idle / Tycoon mit Platzierungs-Puzzle |
| **Zielgruppe** | Casual- und Cozy-Spieler, 25 bis 45 Jahre, 2 bis 4 kurze Sessions pro Tag (3 bis 15 Minuten) |
| **Plattformen** | Browser (PWA) zuerst, Android und iOS per Capacitor (P4), Desktop über PWA-Installation |
| **Sprachen** | Deutsch (primär), Englisch |
| **Referenzen** | Dorfromantik (ruhige Platzierung), Egg Inc (Offline-Fortschritt), Cookie Clicker (Prestige), Stardew Valley (Wohlfühl-Ästhetik) |

**Designsäulen**
1. **Ruhe ohne Leerlauf:** Immer gibt es eine kleine, sinnvolle Entscheidung, aber niemals Zeitdruck.
2. **Planung statt Klickwettlauf:** Platzierung, Biom und Lieferketten zählen mehr als Tippgeschwindigkeit.
3. **Rückkehr-Freude:** Wer zurückkommt, sieht, was in der Zwischenzeit passiert ist.

**Nicht-Ziele**
- Keine Energie- oder Wartezeit-Mechanik, die das Spielen blockiert
- Keine Echtgeld-Ressourcen und keine Premium-Währung für Beschleunigung
- Kein PvP in v1, keine Werbung im MVP
- Kein Spielstand, der nur lokal liegt (Cloud-Save ist Pflicht)

---

## 2. Scope und Phasen

| Phase | Inhalt | Dauer (solo) | Ergebnis |
|---|---|---|---|
| **P1 Solo-Kern** | Raster, 10 Gebäude, 8 Ressourcen, Biome, Verkauf, Händler, Stadtlevel, Freibriefe, Cloud-Save, Offline-Fortschritt, Onboarding, PWA | ca. 4 Wochen | Vollständiges, spielbares Idle-Spiel |
| **P2 Solo-Handel** | NPC-Städte, Routen, Konvois, Kronen, Kosmetik, 2 Push-Nachrichten | ca. 3 Wochen | Handel als Kernspaß ohne Mitspieler |
| **P3 Multiplayer** | Freundescode, Deep-Links, Besuchsmodus, Spieler-Routen, serverseitige Validierung, Routenanfragen | ca. 3 Wochen | MP per Feature-Flag aktiv |
| **P4 Ausbau** | Ligen, Saisonfest, Geisterstädte, App-Store-Builds, Monetarisierung | laufend | Retention und Release |

**Außerhalb des Scopes (P1 bis P3):** native Apps, Leaderboards, Chat, Gilden, Marktplatz zwischen Spielern.

---

## 3. Kernschleife

```
 Produzieren ──► Verkaufen/Lagern ──► Münzen + Material ──► Bauen/Upgraden
      ▲                                                          │
      │                                                          ▼
 Neuer Ort ◄── Freibrief (Prestige) ◄── Stadtlevel & Fläche ◄───┘
                                              ▲
                  Handel (P2): NPC oder Freund liefert Seltenes
```

Zwei Zeitskalen: **Minuten** (Upgrades, Verkauf, Händler) und **Stunden bis Tage** (Konvois, Stadtlevel, Freibriefe).

---

## 4. Spielmechanik

### 4.1 Ressourcen

| ID | Name (DE / EN) | Basispreis (Münzen je Einheit) |
|---|---|---|
| `grain` | Getreide / Grain | 2 |
| `fish` | Fisch / Fish | 4 |
| `lumber` | Holz / Lumber | 3 |
| `honey` | Honig / Honey | 6 |
| `stone` | Stein / Stone | 4 |
| `iron` | Eisen / Iron | 8 |
| `salt` | Salz / Salt | 7 |
| `pearls` | Perlen / Pearls | 15 |

Startbestand: je 10 Einheiten jeder Ressource.

### 4.2 Biome

Jedes Biom hat 2 **Reich-Ressourcen** (Faktor 1,5), 2 **Karg-Ressourcen** (Faktor 0,25) und 4 **neutrale** Ressourcen (Faktor 1,0).

| Biom | Reich (×1,5) | Karg (×0,25) | Startgelände |
|---|---|---|---|
| Flusslande (`riverlands`) | Getreide, Fisch | Stein, Holz | Fluss quer durch die Mitte |
| Tiefwald (`deepwoods`) | Holz, Honig | Fisch, Eisen | Viel Wald, kleiner Teich |
| Hochland (`highlands`) | Stein, Eisen | Getreide, Fisch | Viel Fels |
| Küstenstrich (`coast`) | Salz, Perlen | Holz, Eisen | Strand und Meer am Rand |

Bei jeder Stadtgründung wird ein Biom zufällig gewählt. Es gilt die Regel, dass nicht dasselbe Biom wie in der letzten Stadt kommt. Biome beeinflussen die Produktion, nie den Zugang: Jede Ressource bleibt erreichbar.

### 4.3 Gelände und Nachbarschaft

Jedes Feld hat einen Terrain-Typ: `meadow` (Wiese), `forest` (Wald), `rock` (Fels), `water` (Wasser), `sand` (Strand). Gebäude erhalten Boni, wenn sie passendes Gelände treffen (4er-Nachbarschaft) oder neben einem bestimmten Gebäude stehen.

| Gebäude | Bonus |
|---|---|
| Hof | Wiese +20 % |
| Sägewerk | Wald +25 % |
| Steinbruch | Fels +25 % |
| Imkerei | Neben Hof +15 % |
| Fischerei | Neben Wasser +30 % |
| Saline | Strand +30 % |
| Eisenmine | Fels +20 %, neben Steinbruch +15 % |
| Perlentaucherhütte | Neben Wasser +40 % |

Boni wirken multiplikativ. Das Platzierungs-Puzzle hat keine Strafe, und die UI zeigt die Boni vor dem Bau als Vorschau.

### 4.4 Gebäude

Das Rathaus steht fest in der Mitte. Es zählt nicht zu den 10 Gebäuden, produziert nichts und verkauft Grundmengen (siehe 4.6).

| ID | Name | Produktion | Basis-Münzen | Basis-Material | Stadtlevel | Basisrate (Stufe 1) |
|---|---|---|---|---|---|---|
| `farm` | Hof | Getreide | 40 | 5 Holz | 1 | 6/min |
| `sawmill` | Sägewerk | Holz | 60 | 5 Stein | 1 | 4/min |
| `quarry` | Steinbruch | Stein | 80 | 5 Holz | 1 | 3/min |
| `warehouse` | Lager | Kapazität +250 je Stufe | 100 | 10 Holz | 1 | n. a. |
| `apiary` | Imkerei | Honig | 150 | 5 Getreide | 2 | 2/min |
| `fishery` | Fischerei | Fisch | 180 | 5 Holz | 2 | 3/min |
| `marketSquare` | Marktplatz | Verkauf +40/min je Stufe | 200 | 10 Stein | 2 | n. a. |
| `saltworks` | Saline | Salz | 300 | 10 Stein | 3 | 2/min |
| `mine` | Eisenmine | Eisen | 400 | 10 Stein | 3 | 1,5/min |
| `pearlHut` | Perlentaucherhütte | Perlen | 800 | 5 Eisen | 4 | 1/min |

**Maximalstufen:** Produktionsgebäude 30, Lager 20, Marktplatz 10.

**Material ist der Grund zu handeln.** Jeder Bau und jedes Upgrade kostet Münzen und Material. Wer eine Karg-Ressource braucht, muss sie beim Händler kaufen, über Routen beziehen (P2) oder selbst mit geringer Rate produzieren.

### 4.5 Produktion und Formeln

```
Produktion je Gebäude (Einheiten pro Sekunde), Stufe L:
  rate = baseRatePerMin × L / 60 × M

Multiplikator:
  M = biomeFactor × (1 + 0,02 × (townLevel − 1)) × (1 + 0,05 × perk.yield)
      × terrainBonus × adjacencyBonus

  biomeFactor: Reich 1,5 · neutral 1,0 · Karg 0,25

Kosten für Bau (Stufe 0 → 1) und Upgrade (Stufe L → L+1), L = 0 beim Bau:
  coins    = ceil(baseCoins × 1,15^L)
  material = ceil(baseMaterial × 1,08^L)

Lagerkapazität je Ressource:
  cap = (500 + 250 × warehouseLevel) × (1 + 0,20 × perk.storage)

Verkaufsdurchsatz (Einheiten pro Minute, gesamt):
  throughput = 20 (Rathaus, immer) + 40 × marketLevel

Verkaufspreis:
  price = basePrice × (1 + 0,05 × perk.market)

Offline-Obergrenze (Stunden):
  cap_h = min(8 + perk.memory + adBonus, 16)

Freibrief-Gewinn:
  charters = floor(sqrt(lifetimeCoinsThisTown / 100000))
```

### 4.6 Verkauf, Lager und Reserve

- Das Rathaus verkauft automatisch insgesamt 20 Einheiten pro Minute. Jeder Marktplatz fügt 40 Einheiten pro Minute hinzu.
- Jede Ressource hat einen Schalter **Verkaufen**. Standard: AN für Reich- und neutrale Ressourcen, AUS für Karg-Ressourcen.
- **Reserve:** 20 Einheiten je Ressource werden nie verkauft. Das schützt Baumaterial.
- Der Durchsatz wird gleichmäßig auf aktive Ressourcen mit Überschuss verteilt. Nicht genutzter Durchsatz geht an die nächste.
- Ist der Verkauf aus, füllt sich das Lager bis zur Kapazität und stoppt. Ab P2 erfolgt eine Benachrichtigung.

### 4.7 Stadtlevel und XP

Schwellen für die Gesamt-XP, Stufe 1 bis 12: `0, 50, 150, 400, 900, 1500, 2400, 3800, 6000, 9500, 15000, 24000`.

| Aktion | XP |
|---|---|
| Gebäude platziert | 20 |
| Gebäude-Upgrade | 5 × neue Stufe |
| Händler-Kauf | 2 |
| Konvoi geliefert (P2) | 25 |

Jede Stadtstufe über 1 bringt +2 % Produktion und schaltet Gebäude und Fläche frei.

### 4.8 Stadtfläche

Das Raster hat immer 10×10 Koordinaten. Freigeschaltet ist ein zentriertes Quadrat der jeweiligen Größe.

| Stadtlevel | Freigeschaltetes Raster |
|---|---|
| 1 | 6×6 |
| 3 | 7×7 |
| 5 | 8×8 |
| 8 | 9×9 |
| 12 | 10×10 |

Gesperrte Felder sind im Nebel sichtbar, aber nicht bebaubar. Bei einer Erweiterung wächst das Gras als kurze Animation.

### 4.9 Wanderhändler „Eberhard“

- Jeden lokalen Tag gibt es 3 Angebote. Sie werden deterministisch aus `hash(townId + dateKey)` erzeugt, daher braucht es keinen Server.
- Gewichtung nach Klasse: Karg 3, neutral 2, Reich 1.
- Menge: 20 bis 60 Einheiten, Schritt 5.
- Preis: `ceil(Basispreis × Zufallszahl zwischen 2,5 und 3,0)`. Der Händler ist damit stets teurer als Handel mit NPC-Städten (P2).
- Angebote verfallen um Mitternacht. Verpasste Tage werden nicht nachgeholt.
- Drei Stimmungen (gierig, freundlich, geschwätzig) bestimmen nur die Dialoge.

**Garantie:** Jede Ressource ist solo erreichbar, nur zu einem höheren Preis.

### 4.10 Offline-Fortschritt

- Gespeichert wird `lastTick` als Server-Zeitstempel. Pro-Sekunde-Kontostände werden nicht gespeichert.
- Beim Öffnen wird `advance(state, now)` mit `dt = min(now − lastTick, offlineCap)` ausgeführt.
- Der Willkommens-Dialog zeigt die produzierte Menge, die verkauften Münzen und ob die Obergrenze erreicht wurde.
- Ab 60 Sekunden Abwesenheit erscheint der Dialog, darunter wird der Fortschritt still angewendet.

### 4.11 Freibriefe (Prestige)

**Gründung:** ab Stadtlevel 10 und mindestens 100.000 Lifetime-Münzen in dieser Stadt.
**Gewinn:** `floor(sqrt(lifetimeCoinsThisTown / 100000))` Freibriefe.
**Effekt:** Die Stadt wird zurückgesetzt: Münzen, Gebäude, Lager, Stadtlevel, Raster und Biom (neu gewürfelt). Freibriefe, Perks, Kronen, Kosmetik und Lifetime-Statistiken bleiben erhalten, sie gelten account-weit.

**Perk-Baum.** Ausgabe: 1 Freibrief pro Stufe.

| Perk | ID | Max | Effekt pro Stufe |
|---|---|---|---|
| Ertrag | `yield` | 5 | +5 % Produktion |
| Lagerhaus | `storage` | 5 | +20 % Lagerkapazität |
| Warenkenner | `market` | 5 | +5 % Verkaufspreis |
| Startkapital | `startCoins` | 5 | +250 Münzen beim Start |
| Gedächtnis | `memory` | 3 | +1 h Offline-Obergrenze |
| Eilpost | `express` | 5 | −5 % Konvoi-Dauer (ab P2 aktiv) |

Gesamt: 28 Punkte.

### 4.12 Währungen

| Währung | Umfang | Verdienst | Ausgabe |
|---|---|---|---|
| Münzen | pro Stadt | Verkauf, Konvois | Gebäude, Upgrades, Händler |
| Material | pro Stadt | Produktion, Händler, Konvois | Bau und Upgrades |
| Kronen | account-weit | Konvois (P2) | Kosmetik (P2) |
| Freibriefe | account-weit | Stadtgründung | Perks |

**Nie** werden Ressourcen oder Kronen gegen Echtgeld verkauft.

### 4.13 Handel mit NPC-Städten (P2)

- **NPC-Städte:** 8 Namen in der Startliste. Jede Stadt hat ein Biom, eine Entfernung (1 bis 10 Felder), ein Porträt und eine Vorliebe („liebt Honig“). Daten liegen in `npcs.json`.
- **Route:** Partner, Richtung (Export oder Import), Ressource und Menge pro Konvoi (10 bis 100). Die Route läuft automatisch, bis sie gekündigt wird.
- **Konvoi-Dauer:** `120 min + 30 min × Entfernung`, maximal 480 min. Eilpost verkürzt sie.
- **Preise:** Export zahlt 0,9 × Basispreis plus Kronen. Import kostet 1,8 × Basispreis, also günstiger als der Händler.
- **Distanzsteuer:** 1 % Verlust je Entfernungsfeld, maximal 15 %.
- **Reziprozitätsbonus:** Routen in beide Richtungen mit demselben Partner bringen +25 % auf beiden Seiten.
- **Konvoi-Limit:** 2 gleichzeitig aktive Konvois.
- **Kronen:** `floor(Warenwert / 300)`, wobei Warenwert = Menge × Basispreis.
- **Konvoi-Zustände:** `travelling` → `arrived` → `settled`. Die Abrechnung ist idempotent, der Schlüssel ist die Konvoi-ID.

### 4.14 Kosmetik (P2)

Kronen kaufen reine Dekoration ohne Spielvorteile:
- Gartenzwerg: 15 Kronen
- Laterne: 25 Kronen
- Springbrunnen: 60 Kronen
- Marmorstatue: 120 Kronen

Dekoration liegt auf freien Feldern und blockiert keine Gebäude.

### 4.15 Onboarding (4 Schritte, ca. 3 Minuten)

1. **Willkommen:** Stadtname (Vorschlag, änderbar), Biom-Karte, 150 Münzen.
2. **Erster Hof:** Ein Feld ist hervorgehoben, Bauvorschau mit Materialhinweis.
3. **Verkauf:** Pfeil auf die Münzanzeige: „Dein Rathaus verkauft für dich.“
4. **Händler:** Eberhard erscheint und erklärt Seltenes und Preise.

Danach gibt es keine Pop-ups mehr. Der Fortschritt steht in `town.tutorialStep`.

### 4.16 Benachrichtigungen (P2)

| Ereignis | Beispieltext (DE) | Limit |
|---|---|---|
| Konvoi angekommen | „Dein Konvoi aus Eichenfeld ist angekommen.“ | 1× pro Konvoi |
| Lager voll | „Dein Lager für Stein ist voll.“ | max. 1× pro Tag |

Opt-in erst nach der 3. Session, niemals beim ersten Start.

### 4.17 Balancing-Zielwerte

Dies sind Startannahmen, die die Simulation (Abschnitt 8.2) justiert.

| Meilenstein | Zielwert (kumuliert) |
|---|---|
| Erster automatischer Verkauf | ≤ 3 min nach erstem Hof |
| 5 Gebäude | ≤ 15 min aktive Spielzeit |
| Stadtlevel 5 | 4 bis 8 h |
| Erster Freibrief | 36 bis 72 h |
| Alle 28 Perk-Punkte | 2 bis 4 Wochen |
| Händlerpreis für Karg-Ressourcen | ≤ 3,0 × Basispreis |
| Offline-Obergrenze spürbar | Lager oder Verkaufsdurchsatz begrenzt nach ca. 8 h |

---

## 5. Grafik und Audio

### 5.1 Art Direction

- **Stil:** warme Miniaturlandschaft, Pixel-Art im 3/4-Top-Down-Blick (Stardew-Wärme, Dorfromantik-Übersicht).
- **Logik-Raster:** 32×32 px je Feld. Export in 2× (64×64) für Retina. Anzeige mit Nearest-Neighbour-Sampling.
- **Gebäude:** 32×48 px, ragen nach oben über das Feld. Anker unten mittig. Sortierung nach Y.
- **Licht:** keine harten Schatten. Ein Tagesfilter folgt der lokalen Uhrzeit: morgens warm, mittags neutral, abends orange, nachts blau-gedämpft.
- **Lesbarkeit:** Ressourcen-Icons sind bei 16 px erkennbar. Jedes Gebäude hat eine eigene Silhouette und einen Dachfarbton.
- **Ruhe:** Auf dem Standardbildschirm sind maximal 4 Animationen gleichzeitig sichtbar.

### 5.2 Farbpalette

| Rolle | Hex | Verwendung |
|---|---|---|
| Gras hell | `#A9D684` | Wiese, Highlights |
| Gras mittel | `#8FBF6A` | Wiese, Basis |
| Gras dunkel | `#6FA653` | Wiese, Schatten |
| Wald dunkel | `#2F6B3B` | Baumkronen, Schatten |
| Wald mittel | `#3F8A4C` | Baumkronen |
| Stamm | `#7A4E2D` | Bäume, Holzteile |
| Wasser hell | `#A6E3F2` | Wellen |
| Wasser mittel | `#5EB8D9` | Wasser |
| Wasser dunkel | `#3E8FC1` | Wassertiefe |
| Sand | `#F2D9A0` | Strand, Wege |
| Fels hell | `#C9D0D4` | Fels, Highlights |
| Fels mittel | `#9AA3A8` | Fels |
| Fels dunkel | `#6E777D` | Fels, Schatten |
| Dach Terrakotta | `#C0503A` | Gebäude |
| Dach Orange | `#E08A3C` | Gebäude |
| Dach Blau | `#4F7CAC` | Gebäude |
| Dach Lila | `#8E5BA8` | Gebäude, Akzent |
| Holz | `#B07A45` | Gebäude, Icons |
| Tinte | `#3B2F2F` | Text, Umrisse |
| Papier | `#FFF6E5` | UI-Panels |
| Akzent Gold | `#E9A23B` | Primärbuttons, Münzen |
| Erfolg | `#6BAA5B` | positive Werte |
| Warnung | `#C75146` | Fehler, Lager voll |

**Kontrast:** Text in Tinte auf Papier erreicht mindestens 7:1. Grün und Rot tragen nie allein die Bedeutung. Immer mit Icon oder Vorzeichen.

### 5.3 Asset-Liste

| Kategorie | Anzahl | Größe (Logik) | Phase |
|---|---|---|---|
| Terrain (Wiese 3, Wald 2, Fels 2, Wasser 4 Frames, Strandkanten 4, Weg 4) | ca. 20 | 32×32 | P1 |
| Gebäude (10 × 3 Stufen + Baustelle) | 31 | 32×48 | P1 |
| Rathaus (3 Stufen) | 3 | 32×48 | P1 |
| Wanderhändler (Idle 4 Frames, Gehen 2 Richtungen × 4 Frames) | 12 | 32×48 | P1 |
| Ressourcen-Icons (groß und klein) | 16 | 32 und 16 | P1 |
| UI-Icons (Währungen, Buttons, Tabs, Info) | ca. 25 | 24 und 32 | P1 |
| UI-Elemente (9-Slice-Panel, Button, Balken, Tab) | 8 | variabel | P1 |
| FX (Münze, Funke, Staub, Level-Stern, Rauch 4 Frames) | 12 | 16 bis 32 | P1 |
| Ambient (Tagesfilter, Wolkentextur) | 2 | n. a. | P1 |
| Konvoi-Karren (4 Richtungen × 2 Frames) | 8 | 24×24 | P2 |
| NPC-Porträts | 8 | 128×128 | P2 |
| Kosmetik-Deko (Startset) | 4 | 32×32 bis 32×64 | P2 |
| Deko-Pakete | ca. 24 | variabel | P4 |

**Gebäudestufen:** Stufe 1 ist einfach. Stufe 2 bis 4 zeigt Anbauten oder einen Schornstein. Stufe 5 und höher ist die Prachtform mit Goldakzent. Der Sprung zwischen den Stufen ist der wichtigste visuelle Fortschrittsmoment.

### 5.4 Grafik-Pipeline

1. **Entwurf:** Moodboard in Figma (5 Stilreferenzen), danach Pixel-Skizzen in Aseprite oder LibreSprite (kostenlos).
2. **Zeichnen:** Palette aus 5.2 als `.gpl`-Datei importieren. Nur diese Farben verwenden.
3. **Export:** PNG je Sprite. Atlanten mit `free-tex-packer` oder TexturePacker: `atlas-terrain`, `atlas-buildings`, `atlas-ui`, maximal 2048×2048.
4. **Kompression:** PNG optimieren (Squoosh oder oxipng). Ziel: höchstens 1,5 MB gesamt.
5. **Laden:** Pixi `Assets.load` pro Atlas beim Start. P2- und P4-Atlanten werden nachgeladen.
6. **Platzhalter:** Bis P1-Woche 3 CC0-Packs verwenden (z. B. Kenney). Danach durch eigene Sprites ersetzen. Die Sprite-Schlüssel bleiben gleich, ein Codeumbau ist nicht nötig.

**Lizenzen:** Jede Quelle wird in `docs/ASSETS.md` mit Autor, Lizenz und URL erfasst. Erlaubt sind CC0, eigene Werke oder lizenzierte Assets mit kommerzieller Nutzung. KI-generierte Bilder nur nach Stilkonsistenz-Prüfung und Lizenzcheck.

### 5.5 Animationen und Effekte

| Effekt | Umsetzung | Häufigkeit |
|---|---|---|
| Wasser wellt | 4-Frame-Loop, 4 fps | dauerhaft |
| Bäume wiegen | 2 Frames, leicht versetzt | dauerhaft |
| Getreide wiegt | 2 Frames auf dem Hof | bei Produktion |
| Schornsteinrauch | 4-Frame-Loop | ab Stufe 2 |
| Produktions-Pop | Icon steigt 24 px auf, blendet aus, 400 ms | max. 1× pro Sekunde je Gebäude |
| Münzregen | 5 Münz-Sprites, 600 ms | beim Verkauf, gedrosselt |
| Bau-Staub | 6 Partikel, 300 ms | bei Platzierung |
| Level-Stern | Skalierung und Funken | ab Stufe 5, 10 und 20 |
| Konvoi | Karren wandert auf dem Weg | P2 |

`prefers-reduced-motion` schaltet Pop-Icons und Partikel ab. Der Stern wird als statisches Icon angezeigt. Partikel laufen über einen Pool mit maximal 60 aktiven Objekten.

### 5.6 Screens und Layout

```
┌────────────────────────────────────────────────┐
│ Münzen 1.234   Kronen 12   Freibriefe 3   [Menü]│
│ Eichenhain · Stadtlevel 5 ▓▓▓▓▓░░░░░ 62 %     │
├────────────────────────────────────────────────┤
│                                                │
│                 Spielfeld                      │
│                                                │
├────────────────────────────────────────────────┤
│ Getreide 340/500 ▓▓▓░  [Verkauf ✓]  Holz …     │
├────────────────────────────────────────────────┤
│ [Bauen] [Händler] [Handel] [Freibrief] [Lager] │
└────────────────────────────────────────────────┘
```

**Responsive:**
- ab 1024 px: Seitenpanel rechts statt Bottom-Sheets, Spielfeld zentriert.
- 360 bis 767 px: Bottom-Sheets, Ressourcenleiste horizontal scrollbar.

| Screen | Inhalt | Phase |
|---|---|---|
| Stadt | Spielfeld, HUD, Tabs | P1 |
| Bauen | Gebäudeliste mit Kosten, Sperren, Vorschau | P1 |
| Gebäudedetails | Stufe, Rate, Boni, Upgrade-Button | P1 |
| Lager und Verkauf | Bestände, Schalter, Reserve, Durchsatz | P1 |
| Händler | 3 Angebote, Kauf, Stimmungstext | P1 |
| Freibrief | Stand, Gründen-Button, Perk-Baum | P1 |
| Willkommen zurück | Offline-Bericht | P1 |
| Einstellungen | Sprache, Ton, Bewegung, Zahlenformat, Export/Import, Konto | P1 |
| Handel | Partner, Routen, Konvois | P2 |
| Kosmetik | Deko-Shop (Kronen) | P2 |
| Besuch | Fremde Stadt ansehen (nur lesen) | P3 |

Touch-Ziele sind mindestens 44×44 px groß.

### 5.7 Typografie und Icons

- **Schrift:** Fredoka für UI und Überschriften, Nunito als Alternative (beide SIL Open Font License). Zahlen mit `font-variant-numeric: tabular-nums`.
- **Größen:** Basis 16 px, Überschriften 24, 20 und 18 px.
- **Icons:** eigene Pixel-Icons mit einheitlicher Strichstärke (1 px im Logik-Raster). Fallback: CC0-Packs.

### 5.8 Audio

| SFX | Auslöser |
|---|---|
| `click` | Button |
| `build` | Platzierung |
| `coin` | Verkauf (gedrosselt) |
| `levelup` | Stadtlevel |
| `convoy_depart` / `convoy_arrive` | Konvoi (P2) |
| `chime` | Willkommen zurück |
| `error` | Ungültige Aktion |

- Ein Ambient-Loop (60 bis 90 Sekunden) in P1, je Biom ein eigener Loop in P4.
- Formate: MP3 (Pflicht), OGG (optional). Lautstärke für Musik und SFX getrennt. Standard leise.
- Quellen: CC0 (Kenney, OpenGameArt mit CC0-Filter).

---

## 6. Technische Architektur

### 6.1 Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Sprache | TypeScript (strict) | Typsicherheit für Balance-Daten und Save-Schema |
| Build | Vite | schnelle Entwicklung, PWA-Plugin |
| Rendering | PixiJS v8 | performant für Sprite-Raster, Partikel, Animation |
| UI | HTML/CSS mit kleinen TS-Komponenten | barrierefrei, schnelle Iteration, kein Framework-Zwang |
| State | Zustand (vanilla) mit immer | einfach, testbar, unabhängig von React |
| Validierung | zod | Balance-JSON und Save-Schema zur Laufzeit prüfen |
| Backend | Firebase: Auth, Firestore (lokaler Cache), Hosting, Remote Config, FCM, Functions ab P2 | gemäß Vorgabe, kein eigener Server |
| Tests | Vitest, Firebase-Emulator mit `@firebase/rules-unit-testing`, Playwright | Logik, Regeln, Flows |
| Lint | ESLint (flat config) und Prettier | Konsistenz |
| CI/CD | GitHub Actions mit `FirebaseExtended/action-hosting-deploy` | Preview-Channels pro PR |
| Native (P4) | Capacitor | gleiche Webbasis für iOS und Android |
| Monorepo | npm Workspaces | `@ttt/domain` wird von Cloud Functions mitgenutzt |

Versionen beim Projektstart auf die aktuell stabilen Releases setzen und `package-lock.json` einchecken.

### 6.2 Architekturprinzipien

1. **Die Domain ist rein.** `packages/domain` importiert nichts aus Browser, Pixi oder Firebase. Jede Regel ist eine Funktion `(state, action, ctx) → { state, events, error? }`.
2. **Zahlen sind Daten.** Balancing liegt in `packages/data/*.json` und wird per zod validiert. Gespeichert werden nur Fakten (Gebäude, Stufe, Bestand), niemals abgeleitete Werte.
3. **Die UI ist eine Funktion des States.** Renderer und UI abonnieren den Store und zeichnen neu. Keine Spiellogik in Komponenten.
4. **Persistenz ist austauschbar.** Ein `Repository`-Interface mit `FirestoreRepository` (Standard) und `MemoryRepository` (Tests und Simulation).
5. **Multiplayer-Vorbereitung ab Tag 1:**
   - Spielstand ist ein serialisierbares Dokument `towns/{id}`, das Profil liegt in `players/{uid}`.
   - Auth ist von Anfang an aktiv (anonym, später mit Google verknüpft).
   - Soziale Referenzen sind eine Union `{ type: 'npc' | 'player', id }`.
   - Konvoi-Struktur ist für NPCs und Spieler identisch.
   - Feature-Flag `mp_enabled` in Remote Config, standardmäßig aus.
   - Zeit wird als Server-Zeitstempel gespeichert (`lastTick`).

### 6.3 Projektstruktur

```
tiny-tycoon-towns/
├─ apps/
│  └─ web/                        # Vite-App: Pixi, UI, Firebase-Client
│     ├─ public/                  # Manifest, Icons, Atlanten
│     └─ src/
│        ├─ main.ts
│        ├─ app/                  # Bootstrap, Auth-Flow, Offline-Dialog
│        ├─ render/               # Kamera, TileLayer, BuildingSprites, FX-Pool
│        ├─ ui/                   # HUD, Panels, Sheets, Toasts, Onboarding
│        ├─ persistence/          # firebase.ts, repository.ts, save-policy.ts
│        ├─ i18n/                 # de.json, en.json, t()
│        └─ styles/               # tokens.css, components.css
├─ packages/
│  ├─ domain/                     # @ttt/domain: reine Spiellogik
│  │  └─ src/
│  │     ├─ types.ts
│  │     ├─ advance.ts            # Zeitfortschritt: Produktion, Verkauf, Konvois
│  │     ├─ actions.ts            # placeBuilding, upgrade, demolish, toggleSell, buyOffer, foundTown, buyPerk
│  │     ├─ economy.ts            # Kosten, Preise, Lager, Durchsatz
│  │     ├─ terrain.ts            # Terrain-Generator (seeded), Boni
│  │     ├─ merchant.ts           # Tagesangebote
│  │     ├─ progression.ts        # XP, Stadtlevel, Freischaltungen
│  │     ├─ charters.ts           # Prestige, Perks
│  │     ├─ migrations.ts         # Schema-Migrationen
│  │     ├─ rng.ts                # mulberry32, FNV-1a-Hash
│  │     └─ __tests__/
│  └─ data/
│     ├─ src/*.json               # resources, biomes, buildings, economy, merchant, charters, npcs, cosmetics
│     └─ src/schemas.ts           # zod-Schemas
├─ functions/                     # Cloud Functions (ab P2), nutzt @ttt/domain
├─ scripts/
│  ├─ validate-data.ts
│  ├─ simulate-balance.ts
│  └─ build-atlas.ts
├─ tests/
│  ├─ e2e/                        # Playwright
│  ├─ rules/                      # Firestore-Regeltests
│  └─ fixtures/                   # town-v1.json, town-v2.json, …
├─ docs/
│  ├─ GAME_PLAN.md                # dieses Dokument
│  ├─ adr/                        # Architekturentscheidungen
│  ├─ playtests/                  # Protokolle
│  ├─ ASSETS.md                   # Lizenzen
│  ├─ PRIVACY.md · IMPRESSUM.md
│  └─ CHANGELOG.md
├─ firebase/
│  ├─ firestore.rules
│  └─ firestore.indexes.json
├─ firebase.json · .firebaserc · .env.example
├─ .github/workflows/ci.yml
└─ package.json                   # npm workspaces
```

### 6.4 ADR-Log (Architekturentscheidungen)

| ADR | Entscheidung | Begründung |
|---|---|---|
| 001 | Pixi für das Spielfeld, DOM für die UI | schnelle Iteration, Barrierefreiheit im DOM |
| 002 | Monorepo mit reiner Domain | Cloud Functions und Simulation nutzen dieselben Regeln |
| 003 | Firestore als Spielstand mit lokalem Cache | Offline-first ohne eigene Persistenzlogik |
| 004 | Berechnung bei Abruf (Compute-on-read) für Produktion | keine Schreibkosten pro Sekunde |
| 005 | Region `europe-west3` (Frankfurt) | DSGVO-freundlich. **Der Standort ist später nicht änderbar.** |
| 006 | Deterministischer Händler per Seed | kein Server nötig, konsistent, testbar |
| 007 | Auto-Verkauf mit Reserve und Schaltern | Idle-Komfort ohne Verlust von Baumaterial |

**Vor dem ersten Deploy festlegen:** Firestore-Standort (ADR-005). Das ist eine der wenigen unumkehrbaren Entscheidungen.

### 6.5 Datenmodell

**Domain-Typen**

```ts
// packages/domain/src/types.ts
export type ResourceId = 'grain' | 'fish' | 'lumber' | 'honey'
  | 'stone' | 'iron' | 'salt' | 'pearls';

export type BuildingId = 'farm' | 'sawmill' | 'quarry' | 'warehouse'
  | 'apiary' | 'fishery' | 'marketSquare' | 'saltworks' | 'mine'
  | 'pearlHut' | 'townHall';

export type TerrainId = 'meadow' | 'forest' | 'rock' | 'water' | 'sand';
export type Biome = 'riverlands' | 'deepwoods' | 'highlands' | 'coast';
export type PerkId = 'yield' | 'storage' | 'market' | 'startCoins' | 'memory' | 'express';

export type PartnerRef = { type: 'npc' | 'player'; id: string };

export interface Tile {
  terrain: TerrainId;
  building?: { id: BuildingId; level: number };
  decor?: string;                           // Kosmetik-ID (P2)
}

export interface Route {
  id: string;
  partner: PartnerRef;
  direction: 'export' | 'import';
  resource: ResourceId;
  quantity: number;
  active: boolean;
}

export interface Convoy {
  id: string;
  routeId: string;
  partner: PartnerRef;
  resource: ResourceId;
  quantity: number;
  departAt: number;                         // ms
  arriveAt: number;                         // ms
  status: 'travelling' | 'arrived' | 'settled';
}

export interface TownState {
  schemaVersion: number;
  id: string;
  ownerUid: string;
  name: string;
  biome: Biome;
  seed: number;
  townLevel: number;
  townXp: number;
  coins: number;
  lifetimeCoins: number;                    // in dieser Stadt
  stock: Record<ResourceId, number>;
  sellEnabled: Record<ResourceId, boolean>;
  tiles: Record<string, Tile>;              // Schlüssel "x,y"
  merchant: { dateKey: string; bought: Record<number, number> };
  routes: Record<string, Route>;            // P2, in P1 leer
  convoys: Convoy[];                        // P2, in P1 leer
  tutorialStep: number;
  lastTick: number;                         // ms seit Epoch (Server-Zeit)
}

export interface PlayerProfile {
  schemaVersion: number;
  uid: string;
  locale: 'de' | 'en';
  activeTownId: string;
  charters: number;                         // insgesamt verdient
  charterPerks: Partial<Record<PerkId, number>>;  // ausgegeben
  crowns: number;                           // P2
  cosmetics: string[];                      // P2
  lifetime: { coins: number; townsFounded: number; buildingsPlaced: number };
  createdAt: number;
  lastSeenAt: number;
  friendCode?: string;                      // P3
}
```

**Firestore-Pfade**

| Pfad | Inhalt | Schreibzeitpunkt |
|---|---|---|
| `players/{uid}` | Profil, Freibriefe, Kronen, Lifetime | Gründung, Perk-Kauf, Konvoi-Abrechnung (P2) |
| `towns/{townId}` | gesamter Stadtzustand | debounced, höchstens 1× pro 60 s, sowie bei `pagehide` |

**Hinweis zu `lastTick`:** In Firestore als Timestamp (`serverTimestamp()`) gespeichert, in der Domain als Zahl in Millisekunden. Die Umwandlung erfolgt im Repository.

### 6.6 Speicherstrategie

- **Lokaler Cache:** `persistentLocalCache` mit `persistentMultipleTabManager`, damit mehrere Tabs funktionieren.
- **Schreibpolitik:** `dirty`-Flag. Speichern höchstens einmal pro 60 Sekunden, sofort bei `visibilitychange` (hidden) und `pagehide`.
- **Schreibbudget:** Ziel höchstens 30 Schreibvorgänge pro aktivem Spieler und Tag. Das Free-Tier von Firestore (ca. 20.000 Schreibvorgänge pro Tag) reicht damit für mehrere hundert aktive Spieler. Budget-Alarm in der Google-Cloud-Konsole setzen.
- **Serverzeit lesen:** `snapshot.data({ serverTimestamps: 'estimate' })`, damit ausstehende Zeitstempel offline nicht `null` sind.
- **Konflikte (solo):** „Letzter Schreiber gewinnt“ ist akzeptabel. Ab P3 gilt: Handel läuft nur über Transaktionen.
- **Web-Konfiguration** ist nicht geheim. Schutz erfolgt über Security Rules und App Check (P3).

```ts
// apps/web/src/persistence/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

### 6.7 Zeit und Offline-Logik

**Der Kern ist `advance()`:**

```ts
// packages/domain/src/advance.ts
export interface AdvanceResult {
  state: TownState;
  events: DomainEvent[];
}

export function advance(
  state: TownState,
  nowMs: number,
  ctx: GameContext,            // Balance-Daten, Perk-Werte, maxElapsedSec
): AdvanceResult {
  const elapsedSec = Math.max(0, (nowMs - state.lastTick) / 1000);
  const dt = Math.min(elapsedSec, ctx.maxElapsedSec);

  // 1. Produktion (linear, exakt für dt)
  // 2. Verkauf (Durchsatz × dt, Reserve beachten, Lagerkappe)
  // 3. Konvoi-Ankünfte (P2, idempotent)
  // 4. lastTick = nowMs
  return { state: /* … */, events: [] };
}
```

- **Live-Tick:** 1 Sekunde über einen Akkumulator. UI-Aktualisierung höchstens 4 Mal pro Sekunde.
- **Erststart:** braucht Netzwerk für die anonyme Anmeldung. Danach funktioniert alles offline.
- **Ablauf beim Start:**
  1. Anonyme Anmeldung
  2. `players/{uid}` lesen, falls leer anlegen
  3. Aktive Stadt laden (`towns/{activeTownId}`), Cache als Fallback
  4. Migrationen anwenden
  5. `advance()` mit der Offline-Zeit ausführen
  6. Willkommens-Dialog zeigen, falls mehr als 60 Sekunden vergangen sind
  7. Speicherpolitik aktivieren
- **Bekannte Grenze (solo):** Eine manipulierte Gerätezeit kann den Offline-Gewinn bis zur Obergrenze von 16 Stunden erhöhen. Bis P3 akzeptiert.

### 6.8 Save-Migrationen

- `schemaVersion` steht in jedem Dokument.
- `migrations.ts` enthält `Record<number, (raw: unknown) => unknown>`. Beim Laden werden alle Schritte bis zur aktuellen Version angewendet.
- **Regel:** Schemaänderungen nur mit Migration und Test. Jede Version wird als Fixture gespeichert (`tests/fixtures/town-v1.json`), und der Test lädt jede Fixture bis zur aktuellen Version.
- **Sicherheitsnetz:** Vor jeder Migration wird eine Kopie im lokalen Cache abgelegt. Der Export in den Einstellungen bietet zusätzlich ein Backup.

### 6.9 Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /players/{uid} {
      allow create, read, update, delete: if request.auth != null
        && request.auth.uid == uid;
    }

    match /towns/{townId} {
      allow read, delete: if request.auth != null
        && resource.data.ownerUid == request.auth.uid;

      allow create: if request.auth != null
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.schemaVersion is int
        && request.resource.size() < 200000;

      allow update: if request.auth != null
        && resource.data.ownerUid == request.auth.uid
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.schemaVersion >= resource.data.schemaVersion
        && request.resource.size() < 200000;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- **P1:** Die Rules vertrauen dem Client bei Zahlenwerten. Das ist für Solo vertretbar.
- **Ab P3:** Kritische Felder (Kronen, Freibriefe, Konvois) werden nur noch über Cloud Functions geschrieben.
- **Tests (P1-W4):** Fremde UID wird blockiert, Schema-Downgrade wird blockiert, Übergröße wird blockiert.

### 6.10 Firebase-Dienste

| Dienst | Phase | Verwendung | Hinweis |
|---|---|---|---|
| Authentication | P1 | anonym, später Google-Verknüpfung | kostenlos |
| Firestore | P1 | Spielstand, Profil | Budget beachten |
| Hosting | P1 | PWA, Preview-Channels | Preview-Channels mit Ablauf |
| Remote Config | P1 | Flags, Live-Tuning einzelner Werte | kostenlos |
| Analytics (GA4) | P1 | Events (6.12) | nur mit Einwilligung |
| Cloud Messaging | P2 | Web-Push | kostenlos |
| Cloud Functions | P2 (geplant), P3 (aufrufbar) | Benachrichtigungen, Handel | Blaze-Plan nötig |
| App Check | P3 | Schutz gegen Missbrauch | reCAPTCHA für Web |

### 6.11 Remote Config

Beispielschlüssel: `mp_enabled` (bool, Standard `false`), `offline_base_hours` (Zahl, Standard 8), `merchant_price_max` (Zahl, Standard 3,0), `save_debounce_seconds` (Zahl, Standard 60).

**Regel:** Remote Config überschreibt ausschließlich Zahlen aus `economy.json`. Die JSON-Datei bleibt der Standard und die Dokumentation.

### 6.12 Analytics und Fehlerdaten

**Events (GA4):**
- `session_start` (Tage seit Installation, Sprache)
- `tutorial_step` (step)
- `building_placed` (building, biome, townLevel)
- `building_upgraded` (building, level)
- `town_level_up` (level, minutesPlayed)
- `merchant_purchase` (resource, quantity, price)
- `offline_report_shown` (hours, capped)
- `charter_founded` (charters, townLevel, hoursSinceStart)
- `perk_bought` (perk, level)
- P2: `route_created`, `convoy_settled`, `cosmetic_bought`
- P4: `ad_offline_bonus`, `purchase_*`

**Fehler:** `window.onerror` und `unhandledrejection` werden protokolliert. Optional Sentry (Free-Tier).

**Datenschutz:** Keine personenbezogenen Daten in Events, keine Stadtnamen, keine Freundescodes.

### 6.13 PWA und Performance-Budgets

- `vite-plugin-pwa` mit Workbox: App-Shell offline verfügbar, Atlanten werden vorab gecacht. Der Firestore-Cache ist davon getrennt.
- **Manifest:** Name „Tiny Tycoon Towns“, Kurzname „TTT“, Theme `#FFF6E5`, Icons 192 px, 512 px und maskable.

| Metrik | Ziel |
|---|---|
| JavaScript initial (gzip) | höchstens 300 KB. Pixi und Firebase-Kern, Handel und Charter lazy |
| Assets initial | höchstens 1,5 MB |
| Time to Interactive (4G, Mittelklasse) | höchstens 3 s |
| Framerate (Mittelklasse-Android) | 60 fps bei 100 Feldern und maximal 60 sichtbaren Sprites |
| PWA-Kriterien | installierbar und offline-fähig |
| Lighthouse Accessibility | mindestens 95 |

### 6.14 Barrierefreiheit

- **Tastatur:** Pfeiltasten bewegen den Cursor über das Raster. `Enter` wählt, `Esc` bricht ab, `Tab` wechselt durch Panels.
- **ARIA:** Buttons haben Textlabels. Toasts laufen über `aria-live="polite"`. Das Spielfeld hat eine Textalternative: eine Liste der Gebäude für Screenreader.
- **Weitere Punkte:** Bewegung reduzieren, Schrift bis 200 % skalierbar, Farbe nie als einziger Hinweis.
- **Textlänge:** Deutsche Texte können 30 % breiter sein. Layouts entsprechend planen.

### 6.15 Lokalisierung

- Schlüssel statt Fließtext (`t('build.farm.name')`), die Schlüssel werden typisiert.
- Zahlen: `Intl.NumberFormat(locale, { notation: 'compact' })` oder voll. Einstellbar unter „Zahlenformat“.
- Datum: lokale Tageszeit für den Händler-Tag. Keine Zeitzonen-Strings selbst zusammenbauen.
- Stadtnamen: Wortlisten pro Sprache.

### 6.16 Multiplayer-Erweiterung (P3)

| Komponente | Umsetzung |
|---|---|
| Freundescode | `players/{uid}.friendCode`, Eindeutigkeit über `friendCodes/{code}` per Transaktion |
| Besuch | Lesezugriff auf `towns/{id}`, wenn `visitable == true`. Nur Rendering, keine Schreibrechte |
| Spieler-Routen | `PartnerRef { type: 'player', id: townId }` |
| Konvoi senden | Callable `sendConvoy`: prüft Bestand und Limits in einer Transaktion, schreibt nach `convoys/{id}` |
| Abrechnung | Callable `settleConvoy` plus geplanter Fallback, idempotent über `status` |
| Anti-Cheat | Plausibilität: maximale Produktion je Gebäude und Zeit. Auffälligkeiten nach `anomalies/{id}` |
| Routenanfrage | `routeRequests/{id}`, Push an den Empfänger |
| Rate Limits | pro UID und Minute, zusätzlich App Check |

**Migration:** `towns.convoys` wandert in die Collection `convoys`. Dafür Schema-Version 2 mit Migration und Fixture.

**Bewusster Kompromiss:** Die Produktion bleibt clientseitig. Nur der Handel wird serverseitig validiert.

---

## 7. Balance-Daten

Dateien liegen in `packages/data/src/`. Auszüge:

```json
// buildings.json (Auszug)
{
  "farm": {
    "name": { "de": "Hof", "en": "Farm" },
    "resource": "grain",
    "baseCoins": 40,
    "baseMaterial": { "resource": "lumber", "amount": 5 },
    "baseRatePerMin": 6,
    "maxLevel": 30,
    "unlockTownLevel": 1,
    "terrainBonus": { "terrain": "meadow", "multiplier": 1.2 },
    "adjacencyBonus": null
  },
  "apiary": {
    "name": { "de": "Imkerei", "en": "Apiary" },
    "resource": "honey",
    "baseCoins": 150,
    "baseMaterial": { "resource": "grain", "amount": 5 },
    "baseRatePerMin": 2,
    "maxLevel": 30,
    "unlockTownLevel": 2,
    "terrainBonus": null,
    "adjacencyBonus": { "adjacentTo": "farm", "multiplier": 1.15 }
  }
}
```

```json
// economy.json
{
  "startCoins": 150,
  "startStockPerResource": 10,
  "upgradeCostGrowth": 1.15,
  "materialCostGrowth": 1.08,
  "levelBonusPerTownLevel": 0.02,
  "sell": {
    "reserve": 20,
    "townHallThroughputPerMin": 20,
    "throughputPerMarketLevel": 40,
    "perkMarketPctPerLevel": 5
  },
  "storage": { "base": 500, "perWarehouseLevel": 250, "maxWarehouseLevel": 20 },
  "townLevelThresholds": [0, 50, 150, 400, 900, 1500, 2400, 3800, 6000, 9500, 15000, 24000],
  "gridSizeByTownLevel": { "1": 6, "3": 7, "5": 8, "8": 9, "12": 10 },
  "xp": { "buildingPlaced": 20, "upgradePerNewLevel": 5, "merchantPurchase": 2, "convoyDelivered": 25 },
  "offline": { "baseCapHours": 8, "maxCapHours": 16, "adBonusHours": 4 },
  "charter": { "minTownLevel": 8, "minLifetimeCoins": 100000, "coinsPerCharter": 100000 },
  "save": { "debounceSeconds": 60 }
}
```

```json
// merchant.json
{
  "offersPerDay": 3,
  "weightByClass": { "scarce": 3, "neutral": 2, "abundant": 1 },
  "quantity": { "min": 20, "max": 60, "step": 5 },
  "priceMultiplier": { "min": 2.5, "max": 3.0 },
  "moods": ["greedy", "friendly", "chatty"]
}
```

```json
// charters.json (Auszug)
{
  "perks": {
    "yield":      { "maxLevel": 5, "effect": { "productionPct": 5 } },
    "storage":    { "maxLevel": 5, "effect": { "storagePct": 20 } },
    "market":     { "maxLevel": 5, "effect": { "sellPricePct": 5 } },
    "startCoins": { "maxLevel": 5, "effect": { "startCoins": 250 } },
    "memory":     { "maxLevel": 3, "effect": { "offlineHours": 1 } },
    "express":    { "maxLevel": 5, "effect": { "convoyDurationPct": -5 } }
  }
}
```

**Regeln:**
- Jede Balance-Änderung ist ein PR mit Simulationsergebnis im Kommentar (automatisch über die CI).
- Die Validierung erfolgt über `validate-data` (zod). Alle IDs werden auf Referenzen geprüft.

---

## 8. Qualitätssicherung

### 8.1 Testebenen

| Ebene | Werkzeug | Gegenstand |
|---|---|---|
| Unit (Domain) | Vitest | Kosten, Preise, Lager, Durchsatz, Offline, Händler-Seed, Perks, XP |
| Property-Tests | fast-check (optional) | Lager nie negativ und nie über der Kapazität, Münzen nie negativ |
| Daten | `validate-data` (zod) | Alle JSON-Dateien valide, alle IDs referenziert |
| Migrationen | Vitest mit Fixtures | jede Schemaversion lädt korrekt |
| Regeln | Emulator und rules-unit-testing | fremde UID blockiert, Downgrade blockiert |
| Simulation | `simulate-balance` | Meilensteine im Korridor (4.17) |
| E2E | Playwright | Onboarding, Platzieren, Offline-Dialog, Freibrief |
| Visuell | Playwright-Screenshots | Stadt bei 360, 768 und 1280 px |
| Manuell | Playtests | 5 Personen ab P1-W3 |

### 8.2 Balance-Simulation

`scripts/simulate-balance.ts`:
- Nutzt `advance()` und die Aktionen aus `@ttt/domain`. Kein Browser nötig.
- **Bot-Strategie:** kauft in jeder Runde die Option mit der besten Amortisation. Sessions: 2 × 15 Minuten aktiv pro Tag, der Rest offline.
- **Ausgabe:** Tabelle mit Zeitpunkten für alle Meilensteine aus 4.17 und einer Kurve Münzen pro Stunde.
- **CI-Check:** Schlägt fehl, wenn ein Meilenstein außerhalb des Korridors liegt. Das Ergebnis erscheint als PR-Kommentar.

### 8.3 Playtest-Protokoll (ab P1-W3)

- **Gruppe:** 5 Personen, davon 3 Casual-Spieler und 2 erfahrene Idle-Spieler.
- **Ablauf:** 20 Minuten Session, dann Rückkehr-Test am nächsten Tag.
- **Leitfragen:** Wann war dir langweilig? Was hast du nicht verstanden? Wie fühlte sich die Rückkehr an? Wofür würdest du bezahlen?
- **Dokumentation:** `docs/playtests/YYYY-MM-DD.md`.
- **Zielwerte:** Onboarding abgeschlossen bei mindestens 80 %. Rückkehr am Tag 2 bei mindestens 40 %.

---

## 9. CI/CD und Repo

### 9.1 Branching und Commits

- `main` ist Produktion. Feature-Branches gehen per PR in einen Preview-Channel und werden nach dem Review gemergt.
- Conventional Commits: `feat(domain): …`, `fix(render): …`, `chore(data): …`.
- `CHANGELOG.md` wird aus den Commits gepflegt.
- Branch-Protection auf `main`: CI grün ist Pflicht. Bei Solo-Entwicklung zusätzlich eine Selbst-Review-Checkliste (Abschnitt 15).

### 9.2 `.github/workflows/ci.yml`

Die Firebase-Konfiguration wird über GitHub-Variablen (`vars`) bereitgestellt. Die Service-Account-Schlüssel liegen als Secrets. `firebase init hosting:github` richtet beides automatisch ein.

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ vars.FIREBASE_API_KEY }}
      VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.FIREBASE_AUTH_DOMAIN }}
      VITE_FIREBASE_PROJECT_ID: ${{ vars.FIREBASE_PROJECT_ID }}
      VITE_FIREBASE_APP_ID: ${{ vars.FIREBASE_APP_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run validate:data
      - run: npm test
      - run: npm run simulate:balance
      - run: npm run build

  preview:
    if: github.event_name == 'pull_request'
    needs: verify
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    env:
      VITE_FIREBASE_API_KEY: ${{ vars.STAGING_FIREBASE_API_KEY }}
      VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.STAGING_FIREBASE_AUTH_DOMAIN }}
      VITE_FIREBASE_PROJECT_ID: ${{ vars.STAGING_FIREBASE_PROJECT_ID }}
      VITE_FIREBASE_APP_ID: ${{ vars.STAGING_FIREBASE_APP_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}
          projectId: tiny-tycoon-towns-staging
          channelId: pr-${{ github.event.number }}
          expires: 7d

  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: verify
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ vars.FIREBASE_API_KEY }}
      VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.FIREBASE_AUTH_DOMAIN }}
      VITE_FIREBASE_PROJECT_ID: ${{ vars.FIREBASE_PROJECT_ID }}
      VITE_FIREBASE_APP_ID: ${{ vars.FIREBASE_APP_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}
          projectId: tiny-tycoon-towns
          channelId: live
```

**Hinweise:**
- Preview läuft gegen ein eigenes Staging-Projekt. So werden keine Testdaten in die Produktion geschrieben.
- Regeltests (`npm run test:rules`) laufen über `firebase emulators:exec` in einem eigenen Job.
- Firestore-Rules werden zunächst manuell deployt (`firebase deploy --only firestore:rules`). Ein eigener Workflow folgt, sobald die Regeln stabil sind.

### 9.3 Skripte (`package.json`)

| Skript | Zweck |
|---|---|
| `dev` | Vite-Dev-Server, optional mit Emulatoren |
| `emulators` | `firebase emulators:start --only auth,firestore,hosting` |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `validate:data` | zod-Prüfung aller JSON-Dateien |
| `test` | Vitest (Domain, Migrationen) |
| `test:rules` | Firestore-Regeltests gegen den Emulator |
| `test:e2e` | Playwright |
| `simulate:balance` | Bot-Simulation mit Korridor-Prüfung |
| `build` | Vite-Produktionsbuild |

### 9.4 Umgebungen

| Umgebung | Firebase | Zweck |
|---|---|---|
| Lokal | Emulator-Suite | Entwicklung und Tests |
| Preview | Staging-Projekt, Hosting-Channel `pr-N` (7 Tage) | Review je PR |
| Produktion | Projekt `tiny-tycoon-towns`, Channel `live` | Spieler |

---

## 10. Monetarisierung (P4)

**Prinzipien:**
- Kein Vorteil, der Fortschritt kauft. Erlaubt ist nur Komfort, etwa bei Zeit oder Kosmetik.
- Ressourcen werden nie verkauft, weil sie den Handel tragen.
- Werbung unterbricht den Spielfluss nie. Sie erscheint nur freiwillig per Button.

| Produkt | Preis (Start) | Inhalt | Plattform |
|---|---|---|---|
| Supporter-Pass | 4,99 € einmalig | +1 Konvoi-Slot, exklusive Deko, Abzeichen | Store-IAP (App). Web optional über Stripe |
| Deko-Pakete | 1,99 bis 2,99 € | Kosmetik-Sets | IAP |
| Rewarded Ad | kostenlos | +4 h Offline-Obergrenze, einmal pro 8 h, Gesamtmaximum 16 h | Web: Ad-Netzwerk prüfen. Native: AdMob |

**Store-Regeln:** Digitale Güter laufen in Apps über In-App-Käufe. Kein Verweis auf externe Web-Käufe innerhalb der App. Preisexperimente nur bei Kosmetik, über Remote Config. Keine Kaufbuttons vor stabiler Launch-Version.

---

## 11. Recht und Datenschutz

- [ ] **Impressum** (DDG § 5), verlinkt auf der Website und in den Einstellungen
- [ ] **Datenschutzerklärung** (Art. 13 DSGVO): Firebase und Google als Dienstleister, Analytics, anonyme IDs, Speicherdauer, Betroffenenrechte
- [ ] **Einwilligung:** Analytics nur nach Zustimmung (TDDDG § 25). Ablehnen muss gleichwertig möglich sein
- [ ] **Konto löschen:** entfernt `players/{uid}`, `towns/*` und den Auth-Account (Art. 17 DSGVO)
- [ ] **Datenexport:** JSON-Download als Teil des Auskunftsrechts
- [ ] **Altersfreigabe:** keine Glücksspielmechaniken, keine Lootboxen, keine Zufallskäufe. Einstufung über den IARC-Fragebogen der Stores
- [ ] **Markenprüfung** des Namens (DPMA-Recherche) vor dem Store-Release
- [ ] **Store-Datenschutzangaben** (Apple Privacy Nutrition Labels, Google Data Safety) ab P4
- [ ] **Sign in with Apple:** Pflicht, sobald eine iOS-App einen anderen Social Login anbietet (z. B. Google)

---

## 12. Roadmap und Arbeitspakete

> **Hinweis (2026-11-24):** Dieser Abschnitt ist überholt. Er beschreibt einen Technikstack (TypeScript, Pixi, Firestore), der nicht gebaut wurde. Den laufenden Fahrplan führt [`ROADMAP.md`](ROADMAP.md).

### Phase 1: Solo-Kern (4 Wochen)

**Woche 1: Fundament**
- [ ] Monorepo mit npm Workspaces, TypeScript strict, ESLint, Prettier, Vitest
- [ ] Firebase-Projekte anlegen: Produktion `tiny-tycoon-towns` und Staging `tiny-tycoon-towns-staging`, Standort `europe-west3`
- [ ] Auth (anonym und Google), Firestore, Hosting, lokale Emulator-Suite
- [ ] `packages/data` mit JSON-Dateien, zod-Schemas und `validate:data`
- [ ] Domain: `advance()`, Produktion, Lager, Verkauf, Kosten, jeweils mit Unit-Tests
- [ ] CI-Pipeline (`verify`, `preview`) läuft grün

*Akzeptanz:* 24 Stunden Spielzeit ohne UI in unter 2 Sekunden simuliert. Domain-Abdeckung mindestens 90 %.

**Woche 2: Welt und Rendering**
- [ ] Pixi-App, Kamera (Verschieben, Zoomen, Pinch), Raster-Renderer
- [ ] Terrain-Generator (seeded, 4 Biome), Nebel für gesperrte Felder
- [ ] Bauen, Upgraden, Abreißen mit Maus, Touch und Tastatur
- [ ] Platzhalter-Sprites (CC0) im Atlas, Vorschau der Boni
- [ ] HUD: Münzen, Lagerbalken, Verkaufsschalter

*Akzeptanz:* 100 Gebäude-Sprites flüssig auf einem Mittelklasse-Android (60 fps, geprüft über Chrome Remote Debugging).

**Woche 3: Fortschritt und Persistenz**
- [ ] Stadtlevel, XP, Freischaltungen, Rastererweiterung
- [ ] Wanderhändler (Seed, Tagesangebote, Kaufhistorie)
- [ ] Repository mit Firestore und lokalem Cache, Debounce-Speichern, `pagehide`
- [ ] Offline-Fortschritt und Willkommens-Dialog
- [ ] Google-Verknüpfung (`linkWithPopup`), Export und Import als JSON
- [ ] Erste Playtests (2 Personen)

*Akzeptanz:* Spiel schließen, 3 Stunden warten, wieder öffnen: der Offline-Gewinn stimmt. Gerätewechsel mit Google zeigt denselben Stand.

**Woche 4: Freibrief, Onboarding, Feinschliff, Beta**
- [ ] Freibrief-Screen, Perks, Stadt-Reset mit Biom-Neuwurf
- [ ] Onboarding (4 Schritte)
- [ ] Einstellungen: Sprache DE und EN, Ton, Bewegung reduzieren, Zahlenformat
- [ ] Effekte, Animationen, SFX, Tagesfilter
- [ ] PWA: Manifest, Service Worker, Offline-Shell
- [ ] E2E-Tests für drei Abläufe, Regeltests, Migrationstest
- [ ] Playtest mit 5 Personen, Beta auf dem Preview-Channel

*Akzeptanz:* Die Simulation trifft alle Meilensteine aus 4.17. Onboarding ist in unter 5 Minuten abschließbar. Keine Blocker-Bugs.

### Phase 2: Solo-Handel (3 Wochen)

**W5: Handelsengine**
- [ ] `npcs.json` mit 8 Städten, Generator, Porträt-Platzhalter
- [ ] Routen-Datenmodell und Routen-UI (anlegen, pausieren, kündigen)
- [ ] Konvoi-Logik in `advance()`, idempotente Abrechnung
- [ ] Konvoi-Limit und Eilpost-Perk

*Akzeptanz:* 1.000 simulierte Konvois ohne doppelte Abrechnung. Tests für die exakte Ankunftszeit.

**W6: Wirtschaft und Kosmetik**
- [ ] Handelsposten als Gebäude (Stadtlevel 4)
- [ ] Distanzsteuer, Reziprozitätsbonus, Kronen
- [ ] Kosmetik-Shop mit 4 Items, Platzierung als Deko
- [ ] Konvoi-Animation (Karren auf dem Weg)
- [ ] Simulation neu kalibrieren

*Akzeptanz:* Handel mit NPC-Städten ist im Schnitt mindestens 30 % günstiger als der Händler bei Karg-Ressourcen. Sonst lohnt sich der Handel nicht.

**W7: Benachrichtigungen und Abschluss**
- [ ] Cloud Messaging für Web-Push, Opt-in nach der 3. Session
- [ ] Feld `nextEventAt` im Stadt-Dokument, geplante Function alle 5 Minuten
- [ ] Schätzung „Lager voll“ über die gemeinsame Domain
- [ ] Playtest mit 5 Personen, Schwerpunkt Handel

*Akzeptanz:* Push kommt höchstens 10 Minuten nach Ankunft. Keine Pushes ohne Opt-in.

### Phase 3: Multiplayer-Addon (3 Wochen, hinter Feature-Flag)

**W8: Identität und Besuch**
- [ ] Freundescode (6 Zeichen, eindeutig per Transaktion über `friendCodes/{code}`)
- [ ] Deep-Links `?visit=CODE`, Besuchsmodus (nur lesen)
- [ ] Feld `visitable` im Stadt-Dokument, Regeln für den Besuch

*Akzeptanz:* Zwei Testkonten sehen gegenseitig die Stadt, ohne Schreibrechte.

**W9: Spieler-Handel**
- [ ] `PartnerRef.type = 'player'` aktivieren
- [ ] Callables `createRoute` und `sendConvoy` mit Transaktionen (Bestand prüfen, Limits, Rate Limit)
- [ ] Migration: Konvois aus `towns.convoys` in die Collection `convoys`
- [ ] Abrechnung über Callable `settleConvoy` und geplanten Fallback

*Akzeptanz:* Konvoi von A nach B, Ankunft, beidseitige Abrechnung. Ein Retry führt zu keiner Doppelgutschrift.

**W10: Missbrauchsschutz und Routenanfragen**
- [ ] Plausibilitätsprüfung mit Anomalie-Einträgen
- [ ] App Check für Callables
- [ ] Routenanfragen (annehmen oder ablehnen)
- [ ] Kritische Felder (Kronen, Freibriefe) nur serverseitig schreibbar
- [ ] Feature-Flag `mp_enabled` stufenweise ausrollen (5 %, 50 %, 100 %)

*Akzeptanz:* Manipulierte Client-Werte werden abgelehnt. Rollback des Flags in unter 5 Minuten möglich.

### Phase 4: Ausbau (laufend, nach Nachweis der Retention)

- [ ] Ligen (Wochenranking je Stadtstufe), Saisonfest mit Themenwaren
- [ ] Geisterstadt „Oma Marta“: inaktive Städte von Freunden produzieren zu 20 %
- [ ] Biom-Musik, optional weitere Biome
- [ ] Capacitor-Builds für iOS und Android, Store-Einträge, In-App-Käufe
- [ ] Monetarisierung nach Abschnitt 10
- [ ] Vollständige englische Lokalisierung, optional weitere Sprachen

**Start von P4:** Tag-7-Retention von mindestens 15 %, und die Playtests zeigen Wiederkehr.

---

## 13. Risiken

| Risiko | Wahrscheinlichkeit | Gegenmaßnahme |
|---|---|---|
| Scope Creep | hoch | feste Phasen-Grenzen, neue Ideen ins Backlog-Label `ideas` |
| Balance wirkt langweilig oder zu schnell | hoch | Simulation im CI, Playtests ab W3 |
| Pixel-Art kostet zu viel Zeit | mittel | CC0-Platzhalter, stabile Sprite-Schlüssel |
| Firestore-Kosten steigen | mittel | Schreibbudget, Debounce, Budget-Alarm |
| Zeitmanipulation | mittel | Obergrenze 16 h, Serverprüfung in P3 |
| Schemabruch | mittel | Migrationen, Fixtures, Export-Button |
| Anonymes Konto geht verloren (Browserdaten gelöscht) | hoch | Google-Verknüpfung nach 3 Sessions anbieten, Export |
| Ablehnung im Store | niedrig | Compliance-Checkliste, IAP-Regeln |
| Burnout als Solo-Entwickler | mittel | Wochenziele, Meilensteine feiern, feste Scope-Grenzen |

---

## 14. Offene Entscheidungen

| Frage | Optionen | Frist |
|---|---|---|
| Name und Marke | „Tiny Tycoon Towns“ (Markenprüfung nötig) oder Alternative | vor P1-W4 |
| Stilrichtung | Pixel 32 px (Plan) oder flache Vektoren | vor P1-W2 |
| Werbung im Web | kein Netzwerk oder Anbieter prüfen | vor P4 |
| Native Strategie | Capacitor (Plan) oder reine PWA | vor P4 |
| Web-Zahlungen | Stripe oder keine | vor P4 |
| Studio und Impressum | Name und Adresse | vor der Beta |
| Sprachen | DE und EN (Plan) | vor der Beta |

---

## 15. Definition of Done

Ein Ticket gilt als fertig, wenn:

- [ ] **Code:** TypeScript ohne Fehler, Lint sauber, kein `any` in der Domain
- [ ] **Tests:** Neue Logik hat Unit-Tests. Balance-Änderungen haben einen Simulationslauf.
- [ ] **Daten:** JSON ist validiert, IDs sind referenziert
- [ ] **UI:** funktioniert bei 360 px, mit Tastatur, mit Screenreader-Labels und mit reduzierter Bewegung
- [ ] **Offline:** Verhalten ohne Netz geprüft, falls Persistenz betroffen ist
- [ ] **Analytics:** Event vorhanden, falls spielrelevant
- [ ] **Dokumentation:** CHANGELOG-Eintrag, bei Bedarf ADR
- [ ] **Preview:** auf dem Preview-Channel geprüft

---

## 16. Glossar

| Begriff | Bedeutung |
|---|---|
| Biom | Landschaftstyp der Stadt, bestimmt Reich- und Karg-Ressourcen |
| Dirty-Flag | Markierung „Stand hat sich geändert, muss gespeichert werden“ |
| Durchsatz | maximale Verkaufsmenge pro Minute |
| Freibrief | Prestigepunkt, ausgegeben für Perks |
| Konvoi | Warentransport zwischen Städten (ab P2) |
| Lager | Kapazität je Ressource |
| Material | Ressource, die beim Bau und Upgrade verbraucht wird |
| Offline-Obergrenze | maximale Zeitspanne, die beim Öffnen nachberechnet wird |
| Partner (PartnerRef) | NPC-Stadt oder Spielerstadt als Handelspartner |
| Reserve | Mindestbestand einer Ressource, der nie verkauft wird |
| Seed | Startwert für deterministische Zufallszahlen |

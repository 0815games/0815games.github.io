# Tiny Tycoon Towns

Idle-/Tycoon-Spiel mit Platzierungs-Puzzle. Vollständiger Plan: [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md).

## Stand (Vertical Slice, P1-Kern ohne Firebase)

Umgesetzt:
- 10×10-Raster mit gesperrten Feldern, Stadtlevel und XP, Freischaltung der Fläche
- 4 Biome mit seeded Gelände, Biom-Faktoren (Reich ×1,5, neutral ×1,0, Karg ×0,25)
- 10 Gebäude mit Gelände- und Nachbarschaftsboni, Upgrades bis Maximalstufe
- Produktion, Lager (mit Lagerhaus), automatischer Verkauf mit Reserve und Schaltern
- Marktplatz als Verkaufsdurchsatz
- Wanderhändler „Eberhard“ mit deterministischen Tagesangeboten
- Offline-Fortschritt mit 8 h Obergrenze und Willkommens-Dialog
- Spielstand im Browser (`localStorage`)

Noch nicht umgesetzt (siehe Plan): Firebase/Cloud-Save, Google-Verknüpfung, Freibriefe und Perks, Onboarding-Schritte, Englisch, Pixi-Rendering und Grafik, PWA-Manifest, Handel (P2+).

## Starten

Das Spiel lädt Balance-Daten per `fetch`, daher über einen Webserver öffnen, nicht per Doppelklick:

```bash
cd tiny-tycoon-towns
python3 -m http.server 8080
# dann http://localhost:8080
```

## Tests

Die Domain ist rein und hat keine Abhängigkeiten:

```bash
node --test tests/domain.test.mjs
```

## Struktur

```
data/          Balance-Daten als JSON (Quelle der Zahlen)
src/domain/    Reine Spiellogik: Regeln, Formeln, Händler, Gelände
src/main.js    UI: rendert den Zustand und ruft die Domain auf
tests/         Unit-Tests der Domain
docs/          Spielplan
```

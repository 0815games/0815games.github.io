# INKFALL – Coop Foundation

Neuaufbau von Inkfall als Coop-first-Spiel für **maximal 2 Spieler**.

## Start

```bash
# beliebigem statischen Server starten, z. B.
npx serve inkfall
```

Dann `http://localhost:3000/inkfall/` öffnen.

## Architektur

- `src/core/` – Game-Loop, Input und Basissysteme
- `src/coop/` – Lobby, Session, Host/Guest-Logik und Netzadapter
- `src/player/` – Spielerzustand und Steuerung
- `src/world/` – Arena und Wellen
- `src/enemies/` – Gegnerlogik
- `src/ui/` – HUD und Anzeigen

## Coop-Regeln

- Eine Session hat immer maximal 2 Spieler.
- Der erste Spieler wird Host, der zweite Gast.
- Ein dritter Beitritt wird abgelehnt.
- Der Host besitzt die verbindliche Spiellogik; der Gast sendet Inputs.

## Nächste Schritte

1. Firebase Realtime Database konfigurieren.
2. Lobby und Session an den Netzadapter anbinden.
3. Erste gemeinsame Welle mit zwei Helden implementieren.
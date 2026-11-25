# Konvois (P2) – Umsetzungsplan

Stand: 2026-11-24. Grundlage: `docs/GAME_PLAN.md`, Abschnitte 4.13 (Handel mit NPC-Städten), 4.14 (Kosmetik),
4.16 (Benachrichtigungen) und 8 (Architektur). Dieser Plan ist ein Vorschlag. Umgesetzt wird erst nach Freigabe.

## Ausgangslage

- Im Code gibt es heute keine NPC-Städte, keine Routen, keine Konvois und keine Kronen.
  `data/` enthält keine `npcs.json`.
- Der Eilpost-Perk (`express`) ist im Freibrief-Baum schon da, wirkt aber erst mit den Konvois.
  Die UI markiert ihn als „Wirkung folgt (Konvois, ab P2)“.
- Der Freibrief-Gründung, der Perk-Baum und die Regeln sind umgesetzt. Die Regeln sind live.

## Ziel von P2

Handel mit NPC-Städten als Spielspaß ohne Mitspieler. Der Spieler richtet eine Route ein, ein Konvoi
fährt eine Zeit lang, kommt an und wird abgerechnet. Das ergibt Münzen und Kronen, und Eilpost wirkt.

## Festgelegte Regeln (aus GAME_PLAN 4.13)

| Regel | Wert |
|---|---|
| Konvoi-Dauer | `120 min + 30 min × Entfernung`, maximal 480 min |
| Eilpost | −5 % je Stufe, maximal Stufe 5 |
| Menge pro Konvoi | 10 bis 100 |
| Gleichzeitig aktive Konvois | 2 |
| Preis Export | 0,9 × Basispreis plus Kronen |
| Preis Import | 1,8 × Basispreis |
| Distanzsteuer | 1 % je Entfernungsfeld, maximal 15 % |
| Reziprozitätsbonus | +25 % auf beiden Seiten bei Routen in beide Richtungen mit demselben Partner |
| Kronen | `floor(Warenwert / 300)`, Warenwert = Menge × Basispreis |
| XP | 25 je gelieferten Konvoi (`convoyDelivered`) |
| Zustände | `travelling` → `arrived` → `settled`, Abrechnung idempotent über die Konvoi-ID |

## Scheiben (jede Scheibe ist einzeln prüfbar und committbar)

1. **Daten und Berechnung, ohne Oberfläche.** `data/npcs.json` mit 8 Städten (Biom, Entfernung 1 bis 10,
   Vorliebe). Reine Funktionen für Dauer, Preis, Steuer, Bonus, Kronen. Tests zu jeder Formel.
2. **Zustandsmodell und Fortschritt.** Konvois im Spielstand (`towns.convoys`, anfangs leer). Schritt
   `advance()` setzt `travelling` → `arrived`. Tests für Limit 2, Ankunft, Eilpost-Verkürzung.
3. **Abrechnung.** `settled` über die Konvoi-ID, einmal und nie doppelt. Münzen, Kronen, XP.
   Test: zweimal abrechnen ergibt dasselbe Ergebnis.
4. **Oberfläche.** Routen-Dialog, Konvoi-Liste mit Restzeit, Ankunftsmeldung. Keine Browser-Dialoge.
5. **Kronen-Konto.** Kronen sind account-weit (nicht pro Stadt) und werden über den Freibrief-Stand gespeichert.
6. **Eilpost wirkt.** Der Perk verkürzt die Dauer in Scheibe 1 bereits; hier wird er verdrahtet und
   aus der „folgt“-Markierung genommen.

## Offene Entscheidungen (Nutzer)

- **Serverseitige Abrechnung oder Client?** GAME_PLAN 8 sieht Cloud Functions für `sendConvoy` und
  `settleConvoy` vor. Laut Abschnitt 8 gilt das ab P3 für kritische Felder. Vorschlag: P2 zuerst
  clientseitig mit Tests, Cloud Functions später.
- **Anti-Cheat** (Plausibilität je Gebäude und Zeit) gehört in P2 laut Tabelle. Vorschlag: nach Scheibe 3.
- **Push-Nachrichten** (2 Stück, Abschnitt 4.16) sind nicht Teil dieses Plans.
- **Kosmetik und Supporter-Pass** (4.14, 14) sind nicht Teil dieses Plans.

## Nicht im Plan

Multiplayer-Routen mit echten Spielern (Konvoi zu Freunden) bleiben bei P3. Die Datenstruktur
`PartnerRef { type: 'player' }` wird vorbereitet, aber nicht genutzt.

## Aufwand

Grob ein bis zwei Arbeitstage je Scheibe, insgesamt etwa zwei Wochen. Der Plan schätzt P2 auf drei Wochen,
das schließt Kosmetik und Push ein.

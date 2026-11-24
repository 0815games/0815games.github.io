# Vorlage für einen Patch-Log-Eintrag

Ein Eintrag je in sich abgeschlossenem Schritt, Kennung `TTT-NNNN`. Der Ablauf steht in
[`PATCH-ABLAUF.md`](PATCH-ABLAUF.md), die Regeln in [`../AGENTS.md`](../AGENTS.md).

```text
## TTT-NNNN – kurzer Titel (Welle `20YYMMDD-name`)
- Zeit / Quelle: … (nur belegt; abweichende Uhren getrennt nennen)
- Block / Ziel: … (Blockzuordnung in PATCH-BLOECKE.md, Nutzerwunsch wörtlich)
- Branch / Basis: … (Zweigname und Basis-Commit)
- Änderungen / Dateien: … (tatsächlich geändert, je Datei)
- Prüfungen: Befehl, Ergebnis mit Zahlen (tests / pass / fail, Exit-Code), Art des
  Nachweises (Unit, Emulator, Browser mit Test-Doubles, Gerät, produktiv), Grenzen
- Git / PR / Veröffentlichung: exakte belegte Kennungen und tatsächlicher Status
- Offen / nächster Schritt: … (wer, und welches Hindernis)
```

## Nicht hineingehören

Keine Passwörter, Tokens, UIDs, privaten Profile oder Firebase-Schlüssel. Keine
erfundenen Commits, PRs, Freigaben oder Nutzerbestätigungen.

## Nachträge

Ereignis-Nachträge stehen als Abschnitt `### Ereignis-Nachtrag zu TTT-NNNN` unter dem
Eintrag. Sie überschreiben nichts.

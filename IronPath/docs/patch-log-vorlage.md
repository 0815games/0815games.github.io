# Vorlage für einen Patch-Log-Eintrag

Ein Eintrag je in sich abgeschlossenem Arbeitsschritt, Kennung `IPL-NNNN`
(fortlaufend, ohne Lücke, ohne Doppelte). Die Regeln stehen in
[`../../AGENTS.md`](../../AGENTS.md), der Ablauf in
[`PATCH-ABLAUF.md`](PATCH-ABLAUF.md). Ein ausgefülltes Beispiel aus echter
Arbeit: `IPL-0090` (Rückbau) und `IPL-0091` (Neubau auf echten Kurven) in
[`PATCH-LOG.md`](PATCH-LOG.md).

```text
## IPL-NNNN – kurzer Titel (Welle `20YYMMDD-name`, PR #NNN)
- Zeit / Quelle: … (oder nicht sicher; abweichende Uhren getrennt nennen)
- Block / Ziel: … (Zuordnung im Patchplan, Nutzerwunsch wörtlich)
- Branch / Basis: … (Zweigname und Basis-Commit)
- Änderungen / Dateien: … (was tatsächlich geändert wurde, je Datei)
- Prüfungen: Befehl, Ergebnis mit Zahlen, Art des Tests, Grenzen …
- Git / PR / Release: exakte belegte Kennungen und tatsächlicher Status …
- Offen / nächster Schritt: …
```

## Was in jedes Feld gehört

- **Zeit / Quelle:** Nur angeben, was belegt ist. Sitzungsdatum, Umgebungsuhr und
  GitHub-Zeitstempel können auseinanderlaufen — getrennt nennen, Reihenfolge
  anhand von Commits prüfen. Ein Build-Token ist kein Nachweis für einen
  Releasetag.
- **Block / Ziel:** Der Nutzerwunsch im Wortlaut, dazu eigene Entscheidungen und
  was verworfen wurde. Spätere Leser müssen sehen, was Auftrag und was Umsetzung
  war.
- **Änderungen / Dateien:** Tatsächliche Änderungen, nicht die Absicht. Bei
  Korrekturen am eigenen Zwischenstand die Korrektur nennen (z. B. „zwei
  Reset-Stellen geleert statt einer").
- **Prüfungen:** Der Befehl, die echten Zahlen (`tests / pass / skipped / fail`
  und Exit-Code), die Art des Nachweises (Unit-Test, Emulator, Browser mit
  Test-Doubles, echtes Gerät, produktiv) und was **nicht** geprüft wurde. Ein
  grüner Test ohne Zahlen ist kein Nachweis.
- **Git / PR / Release:** Hashes, PR-Nummer, Check-Namen, Pages-Build-Status.
  Erst nach dem tatsächlichen Ereignis eintragen. Ein Commit kann seinen eigenen
  Hash nicht enthalten — der Nachtrag kommt als eigener Abschnitt oder als neuer
  Eintrag und darf bis zum nächsten freigegebenen Commit uncommittet bleiben,
  muss dann aber als `lokal/uncommittet` erkennbar sein.
- **Offen / nächster Schritt:** Was liegen bleibt, wer es tun muss (Betreiber oder
  Agent) und welches Hindernis besteht (z. B. `403` auf Branch-Protection).

## Was nicht hineingehört

Keine Passwörter, Token, UIDs, Freundes- oder Partycodes, privaten Profile oder
geheimen Firebase-Kennungen. Keine erfundenen PRs, Merges, Freigaben oder
Nutzerbestätigungen. Keine Geräteabnahme behaupten, die nicht stattgefunden hat.

## Nachträge

Ereignis-Nachträge stehen als eigener Abschnitt unter dem Eintrag, den sie
betreffen, mit Überschrift `### Ereignis-Nachtrag zu IPL-NNNN` und den belegten
Kennungen. Sie überschreiben nichts: Was einmal falsch eingetragen wurde, bleibt
als Korrektur sichtbar.

## Archiv

Die neuesten **20** Einträge liegen in [`PATCH-LOG.md`](PATCH-LOG.md), ältere in
[`PATCH-LOG-ARCHIV.md`](PATCH-LOG-ARCHIV.md). Beim Verschieben wandert der ganze
Eintrag einschließlich seiner Nachträge; beide Dateien zusammen müssen lückenlos
und doppelfrei sein. `../scripts/patch-check.mjs` und
`../tests/patch-log-archive.test.mjs` prüfen das.

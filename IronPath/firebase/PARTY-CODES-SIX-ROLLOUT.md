# Sechsstellige Party-Codes veröffentlichen (AUSBAU-PLAN Punkt 5)

**Datei:** [`PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json`](PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json)
(= aktueller Live-Stand `PRESTIGE-EFFORT-TO-PUBLISH.json`, an exakt
17 Regel-Stellen vom Code-Format `^[0-9]{4}$` auf `^[0-9]{4}([0-9]{2})?$`
geweitet; Diff ist per Test gepinnt,
`IronPath/tests/party-codes-six-rules.test.mjs`.)

## Warum

Ein vierstelliger Code hat nur 10.000 Möglichkeiten. Jeder angemeldete
Nutzer kann den gesamten Raum in Sekunden durchprobieren und an jede
offene Party eine Beitrittsanfrage schicken — die Datenbank-Regeln
können Raten nicht begrenzen. Sechs Stellen (1.000.000) machen das
Hundertfache an Aufwand daraus. Die eigentliche Zutrittskontrolle
bleibt wie bisher die Freigabe durch den Host; der Code wird nur vom
trivial erratbaren zum praktisch nicht erratbaren Türschild.

## Was sich ändert — und was nicht

Nur das Code-Format, an den Stellen, die es festnageln: die
Code-Knoten `partyCodes`/`fourCodes` (Anlegen, Lesen, Anfragen), das
hinterlegte `inviteCode` auf `parties`/`fourParties` und der Code in
Freundes-Einladungen (`coopInvites`). Keine neuen Felder, keine
geänderten Rechte, keine anderen Zeilen — die Zuwachs-Deckel und die
Prestige-/War-Effort-Felder des Live-Stands bleiben unverändert.

**Vierstellige Codes bleiben gültig.** Partys leben eine Sitzung;
Codes von vor der Umstellung laufen aus, statt mitten im Spiel zu
brechen. Der neue Client erzeugt nur noch sechsstellige Codes.

## Veröffentlichen

1. Firebase Console → Realtime Database → Regeln.
2. Inhalt von `PARTY-CODES-SIX-DIGIT-TO-PUBLISH.json` vollständig
   einfügen und veröffentlichen.
3. Kurz prüfen: Party erstellen — der Code hat sechs Stellen, ein
   zweiter Spieler tritt bei, der Host gibt frei. Fertig.

## Ohne Veröffentlichung

Der Client ist dagegen tolerant gebaut: Verweigert die Datenbank den
sechsstelligen Schlüssel (alte Regeln), fällt die Party-Erzeugung für
die Sitzung auf vierstellige Codes zurück — Partys funktionieren in
der Zwischenzeit wie bisher, nur eben weiter erratbar.

## Sicherheit

- Emulator-Beweis liegt in `rules-test/party-codes-six.test.mjs`
  (CI-Schritt `test:party-six`): sechsstellig anlegen/anfragen/
  hinterlegen, vierstellig weiter gültig, fünf-/siebenstellig
  verweigert, übrige Regeln (Delta-Deckel, Prestige-Leiter) unverändert.
- Falls etwas klemmt: einfach die vorherige Datei
  (`PRESTIGE-EFFORT-TO-PUBLISH.json`) wieder einfügen — sechsstellige
  Partys enden dann mit ihrer Sitzung, vierstellige laufen weiter.

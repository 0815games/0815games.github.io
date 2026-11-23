# Prestige-Leiter und Kriegsanstrengung veröffentlichen (AUSBAU-PLAN Punkt 4)

**Datei:** [`PRESTIGE-EFFORT-TO-PUBLISH.json`](PRESTIGE-EFFORT-TO-PUBLISH.json)
(= aktueller Live-Stand `PROGRESSION-DELTA-CAPS-TO-PUBLISH.json` + exakt
zwei neue Profilfelder; Diff ist per Test gepinnt,
`IronPath/tests/prestige-effort-rules.test.mjs`.)

## Was sich ändert — und was nicht

Der Client bekommt zwei Fortschritts-Felder auf dem Profil
(`players/$uid`), die die live Regeln heute noch verweigern
(`$other: false`). Alles andere bleibt Zeile für Zeile gleich —
inklusive der Zuwachs-Deckel aus `IPL-0116`:

| Feld | Bedeutung | Regel |
| --- | --- | --- |
| `campaignPrestige` | Höchste geschaffte NG+-Stufe (0–10) | Ganzzahl, monoton, **max. +1 pro Schreibung** (wie der Client sie schreibt) |
| `warEffort` | Insgesamt gespendeter Scrap (Scrap-Senke) | Ganzzahl, monoton wachsend, max. +1.000 pro Schreibung (eine Spende) |

Keine neuen Lese-/Schreibrechte, keine geänderten Felder. Der
Prestige-Bonus (150–600 Scrap pro Stufe) läuft über das bestehende
`armory.scrap` und bleibt unter dessen Zuwachs-Deckel (+1.000);
Spenden senken den Scrap-Bestand, was wie bisher frei ist.

## Veröffentlichen

1. Firebase Console → Realtime Database → Regeln.
2. Inhalt von `PRESTIGE-EFFORT-TO-PUBLISH.json` vollständig einfügen
   und veröffentlichen.
3. Kurz prüfen: Im Armory lässt sich Scrap an die „Kriegsanstrengung“
   spenden, und eine geschaffte Prestige-Mission zählt die Leiter hoch.
   Fertig.

## Ohne Veröffentlichung

Der Client ist dagegen tolerant gebaut: Spenden und Prestige-Zählung
laufen in eigenen Transaktionen und schalten sich bei Ablehnung für die
Sitzung ab — Missionen, XP und alle anderen Speicherungen funktionieren
in der Zwischenzeit wie bisher, nur Leiter und Fonds bleiben auf dem
zuletzt bestätigten Stand.

## Sicherheit

- Emulator-Beweis liegt in `rules-test/prestige-effort-rules.test.mjs`
  (CI-Schritt `test:prestige-effort`): Sprossen einzeln, kein Springen,
  kein Abstieg, Spenden nur in Deckel-Schritten, Altes unverändert.
- Falls etwas klemmt: einfach die vorherige Datei
  (`PROGRESSION-DELTA-CAPS-TO-PUBLISH.json`) wieder einfügen — die
  Änderung ist rein additiv und jederzeit umkehrbar. Bereits
  geschriebene Feldwerte bleiben dann einfach ungenutzt liegen.

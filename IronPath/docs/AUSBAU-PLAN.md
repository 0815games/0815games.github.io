# Iron Path – Ausbau-Plan (beschlossene Reihenfolge)

**Betreiber-Entscheid vom 2026-11-23:** Die Vorschläge aus dem Rundum-Check
werden in genau dieser Reihenfolge abgearbeitet – erst die oberen Blöcke
(Block E mit Tutorial) fertigstellen, dann alles Sicherheitsrelevante, dann
geradeaus weiter durch die Liste. Diese Datei ist die jederzeit greifbare
Arbeitsliste dazu; der Haken wandert mit jedem ausgelieferten Paket weiter.
Details zu Block E stehen in [PATCH-BLOECKE.md](PATCH-BLOECKE.md), die
Umsetzungshistorie im [PATCH-LOG.md](PATCH-LOG.md).

**Status-Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` ausgeliefert
(Code gemergt, Pages `built`; Betreiber prüft Spielinhalte selbst im Spiel).

## Die Reihenfolge

| # | Paket | Inhalt (Kurzform) | Status |
| --- | --- | --- | --- |
| 1 | **Block E Scheibe 2** | Treffer-Feedback (wer wird getroffen, wie reagieren), Tutorial-Einführung ins Schadenssystem (E2), Host-/Reconnect-Prüfung im Detail (E5), automatisierte Balance-Nachmessung. | [x] erledigt – E2 geliefert (`IPL-0114`), E5 geprüft (`IPL-0115`, kein Codefehler), Nachmessung grün. Der menschliche Balance-Eindruck ist Betreiber-Sache im Spiel und steht ausdrücklich **nicht** als offener Punkt in dieser Liste (Entscheid 2026-11-23). |
| 2 | **Sicherheit: Zuwachs-Deckel in den Firebase-Regeln** | Heutige Fortschritts-Regeln begrenzen nur Monotonie + Maximum: Ein manipulierter Client kann XP auf 10.000.000, die Bestwelle auf 10.000 und den Endlos-Zähler ans Limit in **einer** Schreibung springen lassen. Fix: Delta-Deckel pro Schreibung als additiver Regel-Kandidat + Publish-Datei (Betreiber veröffentlicht selbst, `WORKSHOP-RULES-TO-PUBLISH.json` wird nie editiert). | [x] erledigt (`IPL-0116`, PR `#378`); **vom Betreiber am 2026-11-23 veröffentlicht** |
| 3 | **Sektor-Modifikatoren für Endlos-Identität** | Jede Endlos-Sektor-Stufe bekommt ein erkennbares Profil (z. B. Nacht, Panzer-Schwerpunkt, Luft-Schwerpunkt); im Funk-Fallback (`#sectorPanel`) angekündigt, damit sich Sektoren nicht nur über Zahlen unterscheiden. | [x] erledigt (`IPL-0117`, PR `#379`) |
| 4a | **Scrap-Senke fürs Spätspiel** | Sinnvolle Dauer-Ausgabe für überschüssigen Scrap (Fortschrittsziel statt wachsendem nutzlosem Guthaben), auf Profil gespeichert. | [x] erledigt (`IPL-0118`, PR `#380`): „Kriegsanstrengung“ im Armory (250er-Spenden, 10 Stufen à +3 Startvorräte); **Regeln vom Betreiber am 2026-11-23 veröffentlicht** |
| 4b | **Kampagnen-NG+ über das vorhandene Druck-System** | Wiederholte Kampagne mit steigendem Druck als Langzeit-Fortschrittsziel, ohne neue Währung. | [x] erledigt (`IPL-0118`, PR `#380`): Prestige-Stufen 1–10 auf abgeschlossenen Missionen (+15 % Leben/+10 % Schaden je Stufe, breitere Anstürme, Scrap-Bonus); **Regeln vom Betreiber am 2026-11-23 veröffentlicht** |
| 5 | **6-stellige Party-Codes** | Schwerer zu erraten/zu brutforcen als heutige 4-stellige Codes; Einladungs-Ablauf unverändert, alte Codes sauber auslaufen lassen. | [x] erledigt (`IPL-0119`, PR `#381`): Erzeugung 6-stellig, Beitritt/Einladungen akzeptieren beide Längen (Alt-Codes laufen aus); **Regeln vom Betreiber am 2026-11-23 veröffentlicht** |
| 6 | **Start-Requests erst messen** | ~180 Modul-Requests beim Start: erst real messen (Ladezeit/Netz), dann entscheiden, ob Bundling sich lohnt – nicht vorschnell umbauen. | [x] erledigt (`IPL-0120`): 191 Module / ~666 KB gzip / Tiefe 6 gemessen ([Bericht](START-REQUESTS-MESSUNG.md)); **Entscheidung: kein Bundling** — flacher Wasserfall über HTTP/2, Bytes dominieren, Umbau würde Test-/Wellen-Netze abbauen. Messung läuft als Test mit; Hebel dokumentiert |
| 7 | **Quick-Win: Block-Übersicht aktuell halten** | Die Übersichtstabelle in `PATCH-BLOECKE.md` zeigt Block E veraltet mit „5 %“; auf den echten Stand (Scheibe 1 + Scheibe 2) nachziehen und bei jedem Block-Paket mitpflegen. | [x] erledigt (`IPL-0121`): Schnellübersicht, Reihenfolge-Tabelle und Abschnitts-Status auf den Stand 2026-11-23 gezogen – alle Blöcke ausgeliefert, Block E Scheibe 1 + 2 live; Geräteabnahmen sind Betreiber-Sache und keine offenen Punkte mehr. |

## Arbeitsregeln zu dieser Liste

- **Ein Paket pro PR**, eigene Cache-Welle pro Paket, Patch-Log-Eintrag
  (`IPL-` fortlaufend) und Feldnotizen DE+EN wie bisher.
- Geräteabnahmen führt der Betreiber generell selbst durch und testet
  Spielinhalte ingame; sie stehen hier **nicht** als offene Punkte.
- Regel-Änderungen nur als additive Kandidaten/Publish-Dateien; der
  Betreiber veröffentlicht Firebase-Regeln selbst.
- Alles wird immer auf Account/Charakter gespeichert (Profil zuerst,
  Geräte-Kopie nur als Spiegel), nie gerätelokal als Sollzustand.

## Nach der Reihe (Betreiber-Wünsche ab 2026-11-23)

| # | Paket | Inhalt (Kurzform) | Status |
| --- | --- | --- | --- |
| 8 | **Lebendiges Feld, Scheibe 1** | Drehender MG-Turmkopf (geschichtet: gemalte Stellung + gezeichneter Oberbau, Prototyp), Schadens-Rauch an Fahrzeugen/Bossen, Soldaten-Atmung/-Zielen/-Zucken. Nur Darstellung. | [~] gebaut (`IPL-0122`, PR `#384`), Betreiber-Sichtung steht aus |
| 9 | **Lebendiges Feld, Scheibe 2** | Drehende Köpfe auch für Kanone, Flak und Scharfschütze; Feinschliff nach Sichtung von Scheibe 1. | [x] gebaut (`IPL-0123`, PR `#385`), Betreiber-Sichtung steht aus |

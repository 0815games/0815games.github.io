# Charakter-Namen: Offline-Vorprüfung (Entwurf)

Dieser Schritt **reserviert und ändert keine Namen**. Er startet keinen Dienst,
verbindet sich nicht mit Firebase und benötigt keine Zugangsdaten. Die globale
Eindeutigkeit ist weiterhin nicht implementiert. Ein realer Export, eine
Migration, produktive Rules und jede Veröffentlichung erfordern die jeweils
separate Freigabe und einen aktuellen Sicherheits-/Backup-Check.

## Was das Werkzeug prüft

`../scripts/audit-character-names.py` liest ausschließlich eine ausdrücklich
angegebene lokale JSON-Datei mit einem `players`-Objekt auf der obersten Ebene.
Es zählt alle dort enthaltenen Profile, auch solche ohne Freundes-Suchindex,
und meldet unbrauchbare Profile und Kollisionen. Auf der Konsole stehen nur
aggregierte Zahlen, keine Namen, Schlüssel, Account-IDs oder Dateipfade.
Ungültige JSON-Daten, doppelte Objektkeys, fehlendes `players` und Dateien über
128 MiB werden abgelehnt. Unbrauchbare Namen und Account-Keys werden gezählt;
zu kurze oder zu lange nichtleere Namen bleiben bei der Kollisionssuche dabei.

Ein Dateiinhaltscheck kann **nicht beweisen**, dass der Export tatsächlich alle
Konten enthält. `completeExportVerified` ist deshalb immer `false`; auch ein
Ergebnis ohne Konflikte erlaubt keine Migration. Verwaiste Suchindizes, bereits
vergebene Reservierungen, zusätzliche Datenquellen und spätere Änderungen
werden nicht geprüft. Ein autorisierter vollständiger, konsistenter Bestand
muss unter Wartung gesichert und getrennt auf Vollständigkeit geprüft werden.

## Vergleichsregel: im Spiel und im Audit vereinheitlicht (`NFC_CASEFOLD_V2`)

Das Spiel verwendet jetzt dieselbe strenge Vergleichsregel wie dieses Audit
(`IronPath/character-name.mjs`, `NFC_CASEFOLD_V2`): äußere ECMAScript-Leerzeichen
entfernen, Unicode-NFC, Unicode Default Case Folding, erneut NFC. Sie gilt
einheitlich für Registrierung, Umbenennung und Freundessuche – ein Name kann
also nicht unter einem Schlüssel gefunden und unter einem anderen reserviert
werden.

Damit kollidieren beispielsweise `Straße`, `STRASSE` und `STRAẞE`, `ΜΑΡΚΟΣ` und
`μαρκοσ`, Ligaturen (`ﬁn`/`FIN`) sowie zusammengesetzte/zerlegte Akzente; eine
rein visuelle Ähnlichkeit zwischen Schriften oder Kompatibilitätszeichen wie
`Ａ`/`A` bleibt dagegen verschieden. Die gemeinsame Test-Fixture
`firebase/name-policy-fixtures.json` (Version 2) hält diese Übereinstimmung
zwischen Spiel-Client und Audit-Skript verbindlich fest.

Die Regel garantiert keine serverseitige Normalisierung allein durch Firebase
Rules: sie wird im Client angewendet. Die begleitenden Rules-Kandidaten
erzwingen nur, dass pro Schlüssel höchstens ein Eintrag existiert und nur dessen
Inhaber ihn löscht; sie können nicht prüfen, ob ein Schlüssel wirklich die
Normalisierung des gespeicherten Namens ist (`firebase/character-name-candidate.mjs`).

## Wie dieses Audit vergleicht (entspricht dem Spiel)

Für diese Diagnose werden äußere ECMAScript-Leerzeichen entfernt, dann Unicode
NFC, Unicode Default Case Folding und erneut NFC angewendet. Das Werkzeug nennt
die Unicode-Tabellenversion der verwendeten Python-Laufzeit. Bei bestehendem
Altbestand ohne `characterNames`-Eintrag reserviert der Client den Namen still
beim Login und öffnet im Konfliktfall einen dedizierten Namenskonflikt-Dialog,
über den genau der betroffene Soldat ohne Fortschrittsverlust einen freien
neuen Namen wählt.

## Nur nach Freigabe eines sicheren Exports

```sh
# Ohne Namen/IDs auf stdout; Dateiname dient hier nur als Beispiel.
python3 IronPath/scripts/audit-character-names.py /sicherer-ort/export.json

# Optional: vertraulicher Konfliktbericht außerhalb des Git-Checkouts.
# Er wird exklusiv neu angelegt (0600), niemals überschrieben.
python3 IronPath/scripts/audit-character-names.py /sicherer-ort/export.json \
  --private-report /sicherer-ort/name-konflikte.json
```

Der optionale Bericht enthält normalisierte Namen und zugehörige Account-IDs;
Backup und Bericht müssen geschützt und nach vereinbarter Frist gelöscht
werden. Dateirechte allein garantieren keine Verschlüsselung oder geschützte
Sicherung. Keine dieser Daten im Repository, Chat, Log oder CI-Artefakt ablegen.
Kein Konto wird automatisch bevorzugt, umbenannt oder gelöscht. Wie bestehende
Doppelungen behandelt und verwaiste Reservierungen freigegeben werden, ist erst
nach der autorisierten Bestandsaufnahme gesondert zu entscheiden.

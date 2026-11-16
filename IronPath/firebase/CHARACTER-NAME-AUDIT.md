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

## Vergleichsregel: im Spiel entschieden, im Audit strenger

Das Spiel hat jetzt eine feste Regel (`IronPath/character-name.mjs`,
`NFC_LOWERCASE_V1`): äußere ECMAScript-Leerzeichen entfernen, Unicode-NFC,
Kleinschreibung, erneut NFC. Sie gilt für die Freundessuche **und** für die
Reservierung neuer Namen – ein Name kann also nicht unter einem Schlüssel
gefunden und unter einem anderen reserviert werden.

Dieses Offline-Audit vergleicht **strenger** (Unicode Default Case Folding).
Die praktische Folge: `Straße` und `STRASSE` sind hier ein gemeldeter Konflikt,
im Spiel zwei erlaubte Namen. `Ａ`/`A` bleibt in beiden verschieden. Diese
Abweichung ist gewollt, in `firebase/name-policy-fixtures.json` festgehalten und
wird von beiden Seiten durch Tests behauptet – sie darf nicht stillschweigend in
nur einer der beiden Prüfmaschinen geändert werden. Vor einer Migration ist zu
entscheiden, welche der beiden Regeln für Altbestände gilt.

Die Regel garantiert keine Vollständigkeit: Sie wird im Client angewendet. Die
begleitenden Rules-Kandidaten erzwingen nur, dass pro Schlüssel höchstens ein
Eintrag existiert und nur dessen Inhaber ihn löscht; sie können nicht prüfen, ob
ein Schlüssel wirklich die Normalisierung des gespeicherten Namens ist
(`firebase/character-name-candidate.mjs`).

## Wie dieses Audit vergleicht (strenger als das Spiel)

Für diese Diagnose werden äußere ECMAScript-Leerzeichen entfernt, dann Unicode
NFC, Unicode Default Case Folding und erneut NFC angewendet. Damit kollidieren
beispielsweise `Straße`/`STRASSE` und zusammengesetzte/zerlegte Akzente; eine
rein visuelle Ähnlichkeit zwischen Schriften oder Kompatibilitätszeichen wie
`Ａ`/`A` wird dagegen nicht gleichgesetzt. Das Werkzeug nennt die Unicode-
Tabellenversion der verwendeten Python-Laufzeit. Eine produktive Vergabe muss
nach abgestimmter Namensregel dieselbe, versionierte Transformation auf der
vertrauenswürdigen Seite verwenden und alte wie manipulierte Clients absichern;
dieses Skript setzt das nicht um. Die bestehende Freundessuche verwendet derzeit
`trim().toLowerCase()` und ist **kein** eindeutiges Namensregister.

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

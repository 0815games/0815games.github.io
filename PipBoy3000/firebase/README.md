# Firebase-Regeln: Bestandsaufnahme

`database.rules.current.json` ist eine am 24.11.2026 vom Betreiber mitgeteilte
Momentaufnahme der Realtime-Database-Regeln. Die Datei ist **kein Deployment**
und wurde nicht gegen das Live-Projekt verifiziert. Kommentare wurden für
valide JSON-Syntax entfernt; die Regel-Ausdrücke sind unverändert.

## Ein Konto auf mehreren Geräten

Die aktuellen Regeln erlauben jedem authentifizierten Gerät desselben Accounts,
`/saves/$uid` und `/players/$uid` zu schreiben. Ein `lastSeen`-Check allein ist
keine Schreibsperre: Beim Umschalten könnte eine alte Sitzung noch Spielstände
überschreiben oder die gemeinsame Presence löschen. Insbesondere entfernt das
bestehende `onDisconnect().remove()` den kompletten Presence-Knoten.

Eine Umstellung muss daher den Besitz einer Sitzung serverseitig durchsetzen,
Speicher- und Löschvorgänge atomar absichern, alte Clients und unterbrochene
Verbindungen berücksichtigen und mit den vorhandenen Spielständen und dem
Admin-Zugriff verträglich sein. Client-Abfragen allein sind keine ausreichende
Garantie. Die Regeln sind auf dem Realtime-Database-Server zu veröffentlichen;
ein Website-Deployment ändert sie nicht. Vor einem Rollout müssen die neuen
Regeln samt Client mit Emulator und anschließend gegen eine Testdatenbank
geprüft werden. Kein produktives Regelwerk ohne diese Prüfung veröffentlichen.

## Neue Regeln und Rollout

`database.rules.json` gehört zum neuen Client auf diesem Arbeitsbranch. Die
Regeln und die Anmeldung wurden mit getrennten Accounts/Sitzungen im Firebase
Auth- und Realtime-Database-Emulator getestet. Ein Test auf dem echten Gerät
oder gegen das produktive Firebase-Projekt wurde nicht durchgeführt.

**Vor der Umstellung:** In Firebase Realtime Database ein vollständiges
JSON-Backup exportieren und alle Spiel-Tabs schließen. Die alte Website darf
während der Umstellung nicht speichern. Neue Regeln mit altem Client sperren
Cloud-Speichern; neuer Client mit alten Regeln kann keine Sitzung anlegen.
Die Veröffentlichung der Website und das Einspielen der Regeln müssen daher
in einem Wartungsfenster unmittelbar aufeinanderfolgen.

In der Firebase-Konsole des Projekts `pipboy-rpg`: Realtime Database → Regeln,
Inhalt von `database.rules.json` vollständig einsetzen und veröffentlichen.
Danach die neue Website öffnen, neu laden und Anmeldung, Speichern, Abbrechen
und Übernahme in zwei Tabs testen. Bei Problemen beide Tabs schließen; nicht
weiterspielen, bis Ursache und Wiederherstellung geklärt sind.

Die Admin-Ausnahme erlaubt Bearbeitung anderer Accounts; Änderungen am eigenen
Admin-Account brauchen eine aktive Spielsitzung, direkte Löschung des eigenen
Slots ist im Admin-Panel nicht erlaubt. Die Leaderboard-Regeln bleiben wie
bisher und sind nicht sitzungsgeschützt. Marker schützen nicht vor absichtlicher
Manipulation durch jemanden mit Zugriff auf denselben Account.

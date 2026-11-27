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

## Aktueller Arbeitsstand

`database.rules.session-candidate.json` ist ein **Regelentwurf**, noch nicht
in Firebase oder im Emulator getestet. Er gehört ausschließlich zum ebenfalls
unveröffentlichten Client dieser Änderung; weder diese Regeln noch den Client einzeln
produktiv schalten. Die bisherigen Regeln und bisheriger Client funktionieren weiterhin.

Der Entwurf verlangt einen zum aktiven Sitzungsmarker passenden Marker im
kompletten Save bzw. Presence-Eintrag. Löschungen sind markierte Tombstones.
Die Admin-Ausnahme erlaubt Bearbeitung anderer Accounts; Änderungen am eigenen
Admin-Account brauchen eine aktive Spielsitzung, direkte Löschung des eigenen
Slots ist im Admin-Panel nicht erlaubt. Die Leaderboard-Regeln bleiben wie
bisher und sind nicht sitzungsgeschützt. Marker schützen nicht vor absichtlicher
Manipulation durch jemanden mit Zugriff auf denselben Account.

Vor einer späteren Umstellung: vollständiges RTDB-Backup exportieren, alle alten
Tabs schließen und Regeln sowie Client in einem abgestimmten Wartungsfenster
bereitstellen. Neue Regeln mit altem Client sperren Cloud-Speichern; neuer Client
mit alten Regeln kann keine Sitzung anlegen. Regeln und Verhalten sind zunächst
mit einer Testdatenbank oder dem Firebase-Emulator zu überprüfen, vor allem
Verdrängung während Offline-Betrieb und verspätete Saves und Deletes. Auch der
Admin-Eigenaccount und alte `onDisconnect`-Operationen sind zu prüfen.

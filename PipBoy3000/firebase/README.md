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

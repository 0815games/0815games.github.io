# Sitzungsübernahme: Entwurf und Testplan (noch nicht einsatzbereit)

Stand: 24.11.2026. Dieses Dokument ist kein Regelwerk und schaltet nichts frei.

## Vorhandene Risiken

* Ein Gerät, das von einer Übernahme noch nichts weiß, kann derzeit weiter
  `saves/<uid>/<slot>` schreiben oder löschen. Firebase Auth unterscheidet in
  den vorhandenen Regeln keine Tabs desselben Accounts.
* `players/<uid>` wird vom alten Tab per `onDisconnect().remove()` gelöscht.
  Das kann nach der Übernahme die Presence der neuen Sitzung entfernen.
* Ein ausgelöster Speichervorgang wird derzeit nicht abgewartet. `logout()`
  speichert beim Verdrängen erneut; zusätzlich gibt es verzögerte Spiel-Saves.
* Das Admin-Panel schreibt einzelne Felder unmittelbar und besitzt wegen der
  übergeordneten `.write`-Regel ausdrücklich einen unbegrenzten Bypass.
  Auch das Admin-Panel ruft `Network.login()` auf.
* Die lokale Kopie `pipboy_save` ist nicht nach Account und Sitzung getrennt.
  Ihre Verwendung beim Offline-Spiel und bei einer Übernahme muss geprüft
  werden, damit sie keinen alten Cloud-Spielstand wiederherstellt.

## Anforderungen an eine gemeinsame Änderung von Client und Regeln

Die Anmeldung muss einen eindeutigen Sitzungsmarker erzeugen, eine bestehende
Sitzung anzeigen und nur nach Zustimmung übernehmen. Die Übernahme muss bei
parallel stattfindenden Anmeldungen atomar erfolgen. Der verdrängte Client muss
nach Bekanntwerden der Übernahme ohne abschließendes Cloud-Speichern stoppen;
noch ausstehende Writes müssen auch serverseitig abgelehnt werden. Zeitstempel
allein sind dafür nicht ausreichend. Das gilt ebenso für Löschungen und
Presence: Ein überholtes `onDisconnect` darf keine neue Sitzung entfernen.

Realtime-Database-Regeln benötigen dafür einen bei jedem Schreibvorgang auf
Serverseite überprüfbaren Sitzungsnachweis. Schreibrechte an einem Elternknoten
können durch Kindregeln nicht nachträglich eingeschränkt werden. Insbesondere
muss der Admin-Bypass bewusst behandelt werden, statt versehentlich die
Sitzungssperre auszuschalten. Ein Sitzungsmarker ist bei gemeinsamem Account
keine Sicherheitsgrenze gegen einen absichtlich manipulierten Client, der
auf den gleichen Account zugreifen und den Marker auslesen kann. Schutz vor
solchen Clients verlangt eine serverseitig vertrauenswürdige Identität pro
Sitzung, beispielsweise ein Backend mit passenden Authentifizierungs-Claims.

## Vor Produktivbetrieb prüfen

1. Komplettes Datenbank-Backup exportieren; Regeln und Spielversion notieren.
2. Mit einer separaten Testdatenbank oder Firebase-Emulator testen, ohne
   Produktionsdaten zu überschreiben. Browser A und B gleichzeitig anmelden.
3. Abbrechen: A bleibt angemeldet und B schreibt nicht. Bestätigen: B übernimmt,
   A wird beendet; ein bewusst verzögerter Save und eine Löschung von A dürfen
   B nicht überschreiben. Danach Spielstand neu laden und vergleichen.
4. Gleichzeitige Übernahme, Offline-/Reconnect und Tab-Schließen testen;
   insbesondere darf As altes `onDisconnect` B nicht entfernen.
5. Registrierung, Logout, Charakterauswahl, mehrere Slots, Permadeath,
   Offline-Spiel und Admin-Panel mit alten und neuen Daten testen.
6. Erst nach erfolgreichen Tests abgestimmte Client- und Regelversion
   veröffentlichen. Offene alte Tabs vor der Umstellung schließen. Bei
   Problemen kein weiteres Spiel speichern, sondern Backup wiederherstellen.

Es gibt einen Client- und Regelentwurf auf dem Arbeitsbranch. Der Regelentwurf
wurde noch nicht im Firebase-Emulator oder gegen eine Testdatenbank geprüft
und ist nicht für die produktive Umstellung freigegeben.
`database.rules.current.json` enthält die bisherigen Regeln.

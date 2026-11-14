# Iron Path: kostenloser Firebase-/GitHub-Pages-Ablauf

**Status: Arbeitsbranch, nicht produktiv veröffentlicht.** Die normalen
GitHub-Pages-Dateien, Firebase-Produktions-Rules und der produktive
Wartungsdatensatz wurden durch diese Arbeit nicht umgestellt. Der offene PR ist
ein Draft. Die folgenden Schritte sind ein **abzustimmender Operatorplan**, kein
Hinweis, dass ein Cutover oder Rollback bereits stattgefunden hat.

Dieser Ansatz verwendet die bestehende Firebase Realtime Database und GitHub
Pages. Er benötigt **keinen Vercel-Dienst, keinen Custom-Token-Austausch und
keinen Service-Account-Schlüssel**. Das frühere Vercel-Experiment und sein
abweichendes Control-Format sind in `PAGES-ROLLOUT.md` nur historisch dokumentiert
und dürfen mit diesem Ablauf nicht vermischt werden. Keine weiteren Tests auf
`ironpathtest`. Keine Abrechnung aktivieren; Firebase-Spark- und Pages-Kontingente
und ihre aktuellen Bedingungen vorab prüfen.

## Was der lokale Kandidat kann – und was nicht

- Eine öffentliche RTDB-Statusabfrage hält den normalen Spieleinstieg vor der
  Firebase-Initialisierung an. Die Wartungsanzeige ist auf Deutsch und Englisch
  verfügbar und lässt sich auch bei einem nicht ladenden Firebase-SDK anzeigen.
  Das Spiel lauscht anschließend auf den Status und beendet seine lokale
  Sitzung bei Wartung oder einem geänderten Cutoff. Nicht bestätigte Saves
  können bei einer Wartung verloren sein.
- Die **Kandidaten-Rules** verweigern die bisherigen Spiel-Lese- und Schreib-
  freigaben, solange `mode` nicht `open` ist. Nach dem Wiederöffnen verweigern
  sie Tokens, deren `auth_time` nicht strikt nach `authAfterMs` liegt. Der
  Statuspfad selbst ist öffentlich lesbar und für Spielclients nicht
  schreibbar. Der Kandidat enthält zusätzlich die fünf Social-Cleanup-
  Änderungen; er muss als Gesamtes geprüft werden.
- Firebase Authentication selbst bleibt erreichbar: Andere Anwendungen oder
  manipulierte/ältere Clients können Auth-Tokens beziehen. Ein alter Client,
  der sich **nach** der Wiederöffnung neu authentifiziert, kann wieder Zugriff
  erhalten. Der Cutoff ist kein Nachweis für den ausgeführten Code. Die Uhren
  von Auth und RTDB sind getrennt; die exakte Behandlung von Grenzzeitpunkten
  ist nicht als vollständige Auth-Sperre garantiert.
- Ein offline oder suspendiertes Gerät kann nicht sofort benachrichtigt werden;
  bereits gespeicherte Daten lassen sich nicht aus der Ferne löschen. Bis zur
  Wiederverbindung kann es lokal weiterlaufen. Server-Rules verweigern erst
  serverseitige Zugriffe, und nur nachdem die passenden Rules veröffentlicht
  wurden. Andere Tabs/Geräte sowie bewusst manipulierte Software werden durch
  das Browser-UI nicht kontrolliert.
- Das Versionsmanifest ist eine **Komfortfunktion**, keine Sicherheitsgrenze.
  Ein normales Update unterbricht laufende Partien nicht: neue Starts werden
  überprüft, und der automatische Reload wartet auf die bekannten Spiel-,
  Party-, Dialog- und Speichervorgänge. Nicht bestätigte oder fehlgeschlagene
  Saves können den Reload bewusst unbegrenzt blockieren. Manuelles Schließen
  oder Neuladen kann trotzdem Daten verwerfen. CDN-/Proxy-/Service-Worker-
  Caches und eine Auslieferung verschiedener Dateien zu unterschiedlichen
  Zeitpunkten bleiben möglich; `version.html` beweist keinen ausgeführten Code.

## 1. Vorbedingungen für einen tatsächlichen Erst-Cutover

Nur ein abgestimmter Operator, keine parallele Rules-/Statusänderung. Bei jedem
unerwarteten Zustand **stoppen**, nicht überschreiben. Projekt
`iron-path-dc727`, Datenbankinstanz `iron-path-dc727-default-rtdb` in Europa,
Berechtigungen, Anmeldeanbieter und das eigene Backup-Verfahren unabhängig
prüfen. Zugangsdaten, private Daten und Exportdateien nicht im Chat oder Git
ablegen.

1. Im Firebase-Dashboard die **aktuell live geltenden gesamten RTDB-Rules**
   unabhängig exportieren und geschützt sichern. Die frühere, vom Nutzer
   übermittelte Kopie ist kein unabhängiger Live-Abruf. Zusätzlich einen
   geeigneten Daten-Backup-/Rollbackplan vorsehen. Die Rules vor Veröffentlichung
   erneut lesen und bei jeder zwischenzeitlichen Änderung neu abgleichen.
2. Den frischen Export offline mit der gepinnten Referenz vergleichen und den
   Kandidaten in einer noch nicht vorhandenen Datei erzeugen:

   ```sh
   python3 IronPath/release-tools/prepare-maintenance-rules.py \
     /privat/frischer-rules-export.json /tmp/ironpath-maintenance-candidate.json
   ```

   Das Werkzeug veröffentlicht nichts, liest keine Daten aus Firebase und
   verweigert abweichende JSON-Inhalte, doppelte Schlüssel, veränderte Hashes
   und vorhandene Ausgabedateien. Referenz-SHA-256:
   `8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577`;
   lokaler Kandidat-SHA-256:
   `369bf819546c4f063dfe88212bd61f1599e88e4eef9b30d77089d9fc7982f029`.
   Eine Übereinstimmung beweist weder Herkunft noch Aktualität des Exports.
   Bei Abweichungen die Rules zuerst manuell zusammenführen und erneut prüfen,
   nicht den Export oder die Produktion passend machen.
3. Den **neuesten** PR-Commit, vollständige Tests und insbesondere den
   offiziellen Firebase-Emulatorlauf `npm run test:maintenance` prüfen. Die
   lokalen Chromium-Fälle verwenden Firebase-Doubles; sie beweisen keine
   produktiven Rules, kein echtes CORS/CDN-Verhalten und keinen Live-Cutover.
   Die kombinierte Rules-Datei ersetzt beim Veröffentlichen die gesamte
   produktive Ruleset-Datei, nicht nur einen Teil.
4. GitHub **Settings → Pages** und den tatsächlichen Veröffentlichungsweg
   frisch überprüfen. Ein Merge nach `main` kann das ganze Repository als
   Website veröffentlichen; bei einer anderen Source kann er auch gar kein
   Pages-Deployment auslösen. Der alte, standardmäßig deaktivierte
   `ironpath-guarded-pages`-Workflow ist für den Vercel-Experimentpfad und wird
   für diesen Ablauf nicht aktiviert. Vor dem Merge müssen Regelreihenfolge,
   Freigabe, bestätigte Seitenveröffentlichung und Fehlerbehandlung feststehen.
5. Den bestehenden Knoten `/_ironpathMaintenance` administrativ **lesen**.
   Ist er nicht leer oder ist die Instanz unklar, stoppen und den Zustand
   unabhängig prüfen. Keine produktiven Spielerknoten verändern.

## 2. Erstmalige koordinierte Veröffentlichung

Dies ist nicht atomar: Rules und Pages sind getrennte Systeme. Ein Wartungsfenster
ankündigen und während der Umstellung nicht von erfolgreicher Zugangssperre
ausgehen, bevor die neuen Rules tatsächlich aktiv sind.

1. Nur wenn der Knoten nach Schritt 1 nachweislich fehlt, den **ganzen** Record
   `{ "format": 1, "mode": "maintenance", "authAfterMs": 0 }` unter
   `/_ironpathMaintenance` administrativ setzen und zurücklesen. Dies allein
   sperrt alte Clients mit den bisherigen Rules **nicht**. Ein späterer
   Wartungswechsel muss stattdessen den zuletzt gelesenen numerischen Cutoff
   beibehalten – niemals ungeprüft auf null zurücksetzen.
2. Den unmittelbar zuvor erneut verglichenen und geprüften **Firebase-only**-
   Kandidaten veröffentlichen. Sofort die live gelesenen Rules und den gesamten
   Control-Record prüfen. Eine öffentliche, nicht authentifizierte Abfrage von
   `/_ironpathMaintenance.json` und deren CORS im Browser müssen funktionieren;
   ein administrativer Read beweist nicht den öffentlichen Zugriff. Wenn etwas
   nicht passt: geschlossen bleiben, nicht mit einem alten Ruleset öffnen.
3. Erst nach Freigabe den geprüften Branch über den bestätigten Pages-Weg
   veröffentlichen und den Abschluss des tatsächlichen Deployments abwarten.
   Die gelieferte Spielseite, das Manifest, relevante Modul-URLs und die
   Wartungsanzeige unabhängig prüfen. Alte Clients und echte Geräte sind damit
   noch nicht vollständig abgenommen. Fehlende oder nicht lesbare Statusdaten
   halten den neuen Spieleinstieg geschlossen.
4. Nur wenn alle Prüfungen passen: den **ganzen** Record in einem atomaren Set
   mit `mode: "open"` und einem von RTDB im selben Set aufgelösten
   Serverzeitstempel schreiben. Inhalt der JSON-Datei:

   ```json
   { "format": 1, "mode": "open", "authAfterMs": { ".sv": "timestamp" } }
   ```

   Für einen bereits lokal angemeldeten Operator ist beispielsweise der
   spezifische Knoten über `firebase database:set /_ironpathMaintenance DATEI
   --project iron-path-dc727 --instance iron-path-dc727-default-rtdb` setzbar.
   **Nicht** den Datenbank-Root setzen. Sofort mit `firebase database:get
   /_ironpathMaintenance` und denselben Projekt-/Instanzoptionen zurücklesen;
   der Wert muss nun ein numerischer Zeitstempel und größer als der bisherige
   Cutoff sein. Erneute Anmeldung kann nötig sein. Bei Timeout oder unklarem
   Ergebnis zuerst den wirklichen Zustand lesen, nicht blind wiederholen.
   Ohne transaktionale Koordination mehrerer Operatoren und bei getrennten
   Serveruhren ist dies keine perfekte, beweisbare Auth-Zeitschranke.
5. Bei Fehlern wieder `maintenance` setzen bzw. geschlossen bleiben und
   untersuchen. Ein Rückfall auf alte, ungeschützte Rules kann alte Sitzungen
   wieder zulassen und ist eine gesonderte bewusste Notfallentscheidung. Ein
   automatischer produktiver Rollback wurde nicht getestet.

## 3. Spätere Wartung und normale Updates

- Vor Wartung Record lesen, angekündigt den **ganzen** Record mit
  `mode: "maintenance"` und dem unveränderten aktuellen numerischen Cutoff
  setzen und zurücklesen. Angemeldete neue Clients sollten stoppen; offline
  Geräte reagieren erst später. Nach Arbeiten nur mit einem neuen
  RTDB-Serverzeitstempel wie oben vollständig öffnen und zurücklesen. Keine
  alten `open`-Records wiederverwenden.
- Für ein normales Update ohne Wartung eine neue eindeutige Build-ID in
  `release-version.json`, HTML-Meta und beiden angezeigten Build-Stempeln
  verwenden. Cache-Tokens aller geänderten Dateien **und ihrer Importstellen**
  konsistent aktualisieren; Manifest und Spielcode gehören in dasselbe
  veröffentlichte Paket. Tests und den tatsächlichen Pages-Deploy abwarten.
  Ein CDN kann dennoch zwischenzeitlich alte und neue Dateien mischen; der
  Client stoppt Reload-Schleifen und bietet eine erneute Prüfung an.
- Bei einem Signal- oder Manifest-Ausfall werden neue Starts vorsichtig
  blockiert; laufende Partien werden durch ein normales Versionsupdate nicht
  absichtlich beendet. Der Signalmonitor kann Offline-Zustände nicht zuverlässig
  sofort von einem noch gültigen gecachten Listenerwert unterscheiden.

Der Firebase-Spark-Tarif und GitHub Pages haben Nutzungs- und Kapazitätsgrenzen;
Kostenfreiheit ist nur innerhalb der jeweils geltenden Bedingungen zu erwarten.
Bei unklaren Berechtigungen, Limits, Rules, Status oder Pages-Konfiguration
keine Live-Umstellung durchführen.

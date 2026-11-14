# Iron Path: kostenloser Firebase-/GitHub-Pages-Ablauf

**Status: Arbeitsbranch, nicht produktiv veröffentlicht.** Die normalen
GitHub-Pages-Dateien, Firebase-Produktions-Rules und der produktive
Wartungsdatensatz wurden durch diese Arbeit nicht umgestellt. Der offene PR ist
ein Draft. Die folgenden Schritte sind ein **abzustimmender Operatorplan**, kein
Hinweis, dass ein Cutover oder Rollback bereits stattgefunden hat.

Dieser Ansatz verwendet die bestehende Firebase Realtime Database und GitHub
Pages. Er benötigt **keinen Vercel-Dienst, keinen Custom-Token-Austausch und
keinen Service-Account-Schlüssel**. Der Wartungsschalter nutzt ein separates
Firebase-Auth-Administratorkonto mit eigener, in den Rules freigeschalteter UID.
Das frühere Vercel-Experiment und sein abweichendes Control-Format sind in
`PAGES-ROLLOUT.md` nur historisch dokumentiert und dürfen mit diesem Ablauf nicht
vermischt werden. Keine weiteren Tests auf `ironpathtest`. Keine Abrechnung
aktivieren; Firebase-Spark- und Pages-Kontingente und ihre aktuellen Bedingungen
vorab prüfen.

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
  Statuspfad ist öffentlich lesbar und **nur für eine explizit freigeschaltete
  Admin-UID** in erlaubten Zustandsübergängen schreibbar; normale Spielkonten
  können ihn nicht schalten. Der Kandidat enthält zusätzlich die fünf
  Social-Cleanup-Änderungen; er muss als Gesamtes geprüft werden.
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
- Nach 30 Minuten ohne echte Eingabe im sicheren Menü wird die lokale Firebase-
  Sitzung abgemeldet und die Version frisch geprüft. Nur bei einem bestätigten
  neuen Build wird automatisch neu geladen; ansonsten erscheint die Anmeldung.
  Laufende Einsätze/Gruppen, Dialoge, Formulare und bekannte unbestätigte
  Speicherungen verhindern die Abmeldung und starten danach eine neue
  Inaktivitätsfrist. Pausierte oder schlafende Browser reagieren erst später.
- Firebase kann die Anmeldung zwischen Tabs derselben Origin teilen. Neue,
  kooperierende Spiel-Tabs halten dafür einen gemeinsamen Web Lock: Die AFK-
  Abmeldung wartet, solange ein anderer solcher Tab offen ist – auch wenn er
  selbst nur das Login zeigt. Ohne Web Locks ist die AFK-Abmeldung deaktiviert;
  die bestehende Versionsprüfung bleibt aktiv. Ältere/offline/manipulierte Tabs
  können nicht zuverlässig erkannt oder geschützt werden. Andere Geräte werden
  nicht durch diese lokale Abmeldung abgemeldet; es ist keine serverseitige
  Session-Ablauffrist und keine Versions- oder Code-Sicherheitsgarantie.
- `admin.html` ist ein separater, öffentlich erreichbarer Einstieg und bleibt
  während Wartung bedienbar. Eine benannte Firebase-App mit Session-Persistenz
  trennt die Admin-Anmeldung vom gewöhnlichen Spiel-Login. Die Rules begrenzen
  den Zugriff auf die bestätigte Admin-UID; der Admin darf keinen fremden
  Spielstand ändern. Der Schalter überprüft den öffentlichen Status frisch,
  verwendet eine vergleichende RTDB-Transaktion und verlangt eine ausdrückliche
  Bestätigung. Beim Öffnen erzwingen die Rules einen neuen Serverzeitstempel.
  Ein kompromittiertes Admin-Konto kann Wartung auslösen; starke Zugangsdaten
  und deren Schutz bleiben Aufgabe des Betreibers.

## 1. Vorbedingungen für einen tatsächlichen Erst-Cutover

Nur ein abgestimmter Operator, keine parallele Rules-/Statusänderung. Bei jedem
unerwarteten Zustand **stoppen**, nicht überschreiben. Projekt
`iron-path-dc727`, Datenbankinstanz `iron-path-dc727-default-rtdb` in Europa,
Berechtigungen, Anmeldeanbieter und das eigene Backup-Verfahren unabhängig
prüfen. Zugangsdaten, private Daten und Exportdateien nicht im Chat oder Git
ablegen. Vorab in **diesem** Firebase-Projekt ein separates Admin-Konto anlegen
bzw. überprüfen und seine Auth-UID unabhängig aus der Firebase-Authentication-
Benutzerliste ablesen. Diese UID ist kein Passwort. Kein Passwort, Token oder
Service-Account-Schlüssel ist für die Vorbereitung erforderlich. Das Panel
registriert selbst keine Konten.

1. Im Firebase-Dashboard die **aktuell live geltenden gesamten RTDB-Rules**
   unabhängig exportieren und geschützt sichern. Die frühere, vom Nutzer
   übermittelte Kopie ist kein unabhängiger Live-Abruf. Zusätzlich einen
   geeigneten Daten-Backup-/Rollbackplan vorsehen. Die Rules vor Veröffentlichung
   erneut lesen und bei jeder zwischenzeitlichen Änderung neu abgleichen.
2. Den frischen Export offline mit der gepinnten Referenz vergleichen und den
   Kandidaten in einer noch nicht vorhandenen Datei erzeugen:

   ```sh
   python3 IronPath/release-tools/prepare-maintenance-rules.py \
     /privat/frischer-rules-export.json /tmp/ironpath-maintenance-candidate.json \
     --admin-uid 'HIER_DIE_GEPRUEFTE_ADMIN_UID'
   ```

   Die UID im Beispiel durch die unabhängig geprüfte UID ersetzen; niemals
   einen Spielstand-Namen oder ein Passwort verwenden. Das Werkzeug veröffentlicht
   nichts, liest keine Daten aus Firebase und verweigert abweichende JSON-Inhalte,
   doppelte Schlüssel, ungültige UIDs, veränderte Vorlagen und vorhandene
   Ausgabedateien. Referenz-SHA-256:
   `8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577`.
   Der alte, schreibgeschützte Basis-Kandidat wird intern gegen SHA-256
   `369bf819546c4f063dfe88212bd61f1599e88e4eef9b30d77089d9fc7982f029`
   geprüft; der finale Hash **hängt von der Admin-UID ab** und wird ausgegeben.
   Den gesamten Kandidaten einschließlich genau dieser UID und der erlaubten
   Übergänge manuell prüfen. Eine Übereinstimmung beweist weder Herkunft noch
   Aktualität des Exports. Bei Abweichungen die Rules zuerst manuell
   zusammenführen und erneut prüfen, nicht die Produktion passend machen.
3. Den **neuesten** PR-Commit, vollständige Tests und insbesondere die
   offiziellen Emulatorläufe `npm run test:maintenance` und
   `npm run test:maintenance-browser` prüfen. Der Rules-Lauf prüft auch
   Social-/Charakterbereinigung sowie Zwei- und Vier-Spieler-Lobbys und -Partien
   mit den **kombinierten** Wartungs-Rules. Er prüft außerdem, dass eine laufende
   Vierer-Verbindung bei Wartung gesperrt wird und alte Sitzungen nach dem Öffnen
   gesperrt bleiben. Die Admin- und AFK-Browsertests verwenden das echte
   Firebase-SDK mit lokalen Auth-/RTDB-Emulatoren; weitere lokale Chromium-Fälle
   verwenden Firebase-Doubles. Der lokal verwendete Ersatz-Emulator ist nicht
   vollständig produktionsgetreu (`productionExact:false`).
   Keiner dieser Tests beweist produktive Rules, echtes CORS/CDN-Verhalten oder
   den Live-Cutover. Die kombinierte Rules-Datei ersetzt beim Veröffentlichen
   die gesamte produktive Ruleset-Datei, nicht nur einen Teil.
4. GitHub **Settings → Pages** und den tatsächlichen Veröffentlichungsweg
   frisch überprüfen. Ein Merge nach `main` kann das ganze Repository als
   Website veröffentlichen; bei einer anderen Source kann er auch gar kein
   Pages-Deployment auslösen. Der alte, standardmäßig deaktivierte
   `ironpath-guarded-pages`-Workflow ist für den Vercel-Experimentpfad und wird
   für diesen Ablauf nicht aktiviert. Vor dem Merge müssen Regelreihenfolge,
   Freigabe, bestätigte Seitenveröffentlichung und Fehlerbehandlung feststehen.
5. Die Knoten `/_ironpathMaintenance` und `/_ironpathMaintenanceAdminAccess`
   administrativ **lesen**. Ist einer davon nicht leer oder ist die Instanz
   unklar, stoppen und den Zustand unabhängig prüfen. Der Zugriffstest-Knoten
   soll keine Daten enthalten. Keine produktiven Spielerknoten verändern.

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
   Wartungsanzeige unabhängig prüfen. `admin.html` muss bei laufender Wartung
   erreichbar sein; das separate Admin-Konto muss die Berechtigungsprüfung
   bestehen. Ohne gezielte Freigabe noch keinen Schalter betätigen. Alte Clients
   und echte Geräte sind damit noch nicht vollständig abgenommen. Fehlende oder
   nicht lesbare Statusdaten halten den neuen Spieleinstieg geschlossen.
4. Nur wenn alle Prüfungen passen und die Freigabe vorliegt: Im geprüften
   `admin.html` **WARTUNG BEENDEN** wählen und bestätigen. Das Panel verwendet
   eine vergleichende Transaktion und den von RTDB aufgelösten Serverzeitstempel.
   Anschließend den vollständigen Record unabhängig zurücklesen und den neuen
   numerischen Cutoff prüfen. Bei ausstehendem oder unklarem Ergebnis nicht
   erneut schalten, solange die Transaktion noch laufen kann.

   Nur als abgestimmte Operator-Alternative, etwa falls das Panel nicht
   erreichbar ist: den **ganzen** Record in einem atomaren administrativen Set
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

- Vor Wartung Status prüfen und die Unterbrechung ankündigen. Im Admin-Panel
  **WARTUNG AKTIVIEREN** ausdrücklich bestätigen; das Panel erhält den Cutoff
  und prüft den Zustand erneut. Angemeldete Online-Clients sollten stoppen;
  unbestätigte Saves können verloren gehen, offline Geräte reagieren erst
  später. Nach Arbeiten mit **WARTUNG BEENDEN** und neuem RTDB-Serverzeitstempel
  vollständig öffnen und zurücklesen. Keine alten `open`-Records wiederverwenden.
  Bei Netzwerkfehler oder unbekanntem Transaktionsausgang zuerst den tatsächlichen
  Zustand unabhängig prüfen; eine Zeitüberschreitung bricht Firebase-Writes
  nicht sicher ab.
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

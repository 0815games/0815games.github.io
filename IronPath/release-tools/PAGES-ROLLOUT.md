# Iron Path: früherer Vercel-Guard-Versuch (historisch)

> **Nicht der aktuelle kostenlose Ablauf.** Der Firebase-/Pages-Kandidat auf
> dem Arbeitsbranch benötigt weder Vercel noch Service-Account-Schlüssel oder
> Custom-Token-Rules. Für seinen Status und seine Voraussetzungen ausschließlich
> [`FIREBASE-PAGES-ROLLOUT.md`](FIREBASE-PAGES-ROLLOUT.md) heranziehen. Die
> nachstehenden Schritte gehören zu einem anderen Experiment und dürfen nicht
> als Anweisung für den neuen Kandidaten ausgeführt oder mit ihm vermischt
> werden. Kein weiterer Test auf `ironpathtest`.

**Historischer Stand: vorbereitet, nicht live.** Weder produktive Firebase-Regeln noch der
Pages-Ursprung wurden durch diese Vorbereitung geändert. Der Dienst
`ironpath-live-session` ist ein separates Vercel-Hobby-Projekt; es hat noch
keinen Produktionsschlüssel und kein Deployment. Die Vercel-Schnittstelle
kann dessen erstes Deployment nicht anlegen, weil sie die dafür verlangten
`projectSettings` nicht übermittelt. Das erste Deployment muss im Dashboard
angelegt werden. Keine Abrechnung aktivieren; bei fehlender kostenfreier
Berechtigung stoppen.

Das normale Spiel auf GitHub Pages ist derzeit **nicht** durch den Guard
abgesichert. Die kombinierten Rules allein würden es aussperren. Die folgenden
Schritte sind ein Ablaufplan, keine Aufforderung, einzelne Rules vorzeitig zu
veröffentlichen. Ein tatsächlicher Cutover und Rollback wurden nicht auf der
Produktion erprobt. Keine weiteren Tests auf `ironpathtest` durchführen.

## 1. Noch benötigte Einrichtung

- Projekt und Datenbank in Firebase unmittelbar vor dem Eingriff überprüfen:
  `iron-path-dc727` / `iron-path-dc727-default-rtdb` (Europa). Plan, aktivierte
  Anmeldeanbieter, Zuständigkeit und bestehende Daten prüfen. Den vollständigen
  **aktuellen** Rules-Stand exportieren und getrennt sichern; bei Bedarf ein
  privates Datenbackup nach dem eigenen Verfahren anfertigen. Die frühere
  Rules-Kopie aus dem Chat ist kein unabhängiger Live-Abruf und kann inzwischen
  veraltet sein. Keine Spielerdaten oder Zugangsdaten im Chat teilen.
- Für den Sessiondienst ein **eigenes** Servicekonto im Produktionsprojekt
  erstellen und ihm nur die für die Widerrufsprüfung benötigte Firebase-Auth-
  Leseberechtigung geben (vordefinierte Rolle `Firebase Authentication Viewer`,
  `roles/firebaseauth.viewer`). Keine RTDB-Administratorrechte vergeben. Ein
  JSON-Schlüssel dieses Kontos muss direkt als **Sensitive/Secret**, nur für
  **Production**, unter `IRONPATH_FIREBASE_SERVICE_ACCOUNT` im Vercel-Projekt
  `ironpath-live-session` hinterlegt werden. Niemals im Chat, Git, Preview,
  Build-Ausgabe oder Logs ablegen. Der Schlüssel ist trotz der lesenden Rolle
  hochsensibel: Er kann beliebige Firebase-Custom-Tokens signieren. Schlüssel
  bei Verdacht widerrufen/rotieren und die lokale Datei geschützt behandeln.
  Eine Schlüssel-Erstellungssperre nicht ohne Prüfung abschalten.
- Im [Vercel-Projekt](https://vercel.com/0815games/ironpath-live-session)
  unter **Deployments → … → Create Deployment** zuerst den Arbeitsstand
  `2396ea9bc59fdf8e6de8c59822e2a46659b937e7` auswählen. Danach kann ein
  ausdrücklich ausgewähltes Production-Deployment mit den Production-Variablen
  erstellt werden. Ein Preview-Deployment allein enthält den Produktionsschlüssel
  nicht. Der Dienst ist separat vom alten Testprojekt; er muss vor Freigabe auf
  der öffentlichen Production-Adresse erreichbar und passend konfiguriert sein.
  Die nicht geheimen Projekt-ID, Datenbank-URL und Game-Origin sind im neuen
  Vercel-Projekt bereits gesetzt. Git-Autodeploy ist dort deaktiviert.
- Vor größerer Nutzung kostenlos verfügbare Vercel-WAF-Limits für
  `/api/session` und die freien Kontingente prüfen. CORS und die im Dienst
  vorgesehenen Eingabegrenzen ersetzen kein verteiltes Rate-Limit. Eine
  Kontingentsperre kann auch bei einer kostenlosen Konfiguration ausfallen.

## 2. Was das neue Pages-Paket tut

`build-pages-site.mjs` exportiert die getrackte Website in ein **neues
Verzeichnis außerhalb des Repositories** und ersetzt nur dort den Iron-Path-
Einstieg durch den Launcher. Andere Website-Inhalte bleiben im Artefakt.
Versionen werden aus gepinnten Git-Commits und der öffentlichen Konfiguration
reproduzierbar aufgebaut und ihre Dateien lokal geprüft. Ausgabe und große
Assets werden nicht in Git eingecheckt.

`pages-release-pins.json` enthält den ersten Kandidaten und einen älteren
Guard-Build als begrenzten Rückfall. Im älteren Build ist die bekannte
nicht-atomare Charakterentlassung im erzeugten Client deaktiviert. Er enthält
aber ältere Social-/Party-Logik, ist **kein** Nachweis für einen erfolgreichen
Produktions-Rollback und behebt keinen defekten Sessiondienst oder defekte
Rules. Der Rückfall muss im Störungsfall bewusst gewählt und überprüft werden.

Die neue Workflow-Datei veröffentlicht **nicht** von sich aus: Erst die
Repository-Variable `IRONPATH_GUARDED_PAGES_ENABLED=true` erlaubt ein Deployment
von `main`. Vor jedem Deployment liest der Workflow den öffentlichen
Produktions-Control-Record und verweigert es, falls dessen aktuelle Version
nicht im Artefakt enthalten ist. Danach werden Launcher und kritische Dateien
mit dem Artefakt verglichen; bei manuellem Lauf mit `full_verification` zusätzlich
alle inventarisierten Dateien. Die Prüfungen ändern keinen Control-Record und
öffnen das Spiel nicht. Netz-/CDN- und konkurrierende Änderungen bleiben ein
Risiko; Pages und Firebase werden nicht atomar zusammen umgeschaltet.

Lokal, ohne Netzwerkzugriff und ohne ein Deployment:

```sh
node IronPath/release-tools/build-pages-site.mjs "$PWD" /tmp/ironpath-pages-neu \
  IronPath/release-tools/production-public-config.json \
  IronPath/release-tools/pages-release-pins.json
```

Das Ziel darf vorher nicht existieren. Der ausgegebene `candidate.build` ist
der genaue Build für den Control-Record. Eine geänderte öffentliche
Firebase-/Dienst-Konfiguration erzeugt andere Build-IDs; bestehende Release-URLs
dürfen nicht mit anderen Inhalten wiederverwendet werden.

## 3. Rules-Kandidat aus einem frischen Export

Nach Prüfung von Projekt und Instanz kann ein **neuer** lokaler Kandidat
vorbereitet werden:

```sh
python3 IronPath/release-tools/prepare-production-rules.py \
  /pfad/zum/frischen-rules-export.json /tmp/ironpath-rules-kandidat.json
```

Das Werkzeug verweigert abweichende Rules, doppelte JSON-Schlüssel, veränderte
Referenz/Kandidat-Hashes und ein vorhandenes Ausgabefile. Es transformiert nur
die gepinnte Referenz: fünf Social-Expressions plus Guard-Umhüllung von 45
Lese- und 41 Schreibfreigaben. Es liest keine Firebase-Daten und publiziert
nichts. Ein Treffer beweist weder die Herkunft des Exports noch, dass zwischen
Export und Veröffentlichung keine zweite Person die Rules geändert hat. Ist
der Export anders, **nicht überschreiben**, sondern zuerst abgleichen.

## 4. Abgestimmter Erst-Cutover

Nur ein Operator; Änderung ankündigen und Fehlerfall vorab klären. Die alte
Website und Rules sichern. Soll ein Fehler den alten ungeschützten Dienst
zurückbringen, wäre das eine gesonderte Notfallentscheidung: Damit könnten alte
Sitzungen wieder Zugriff erhalten. Der sichere Standard ist, geschlossen zu
bleiben und zu reparieren.

1. Produktivdienst, Schlüssel, öffentliche Adresse und beide lokal gepackten
   Builds vorbereiten. Den Live-Rules-Export direkt vor Veröffentlichung noch
   einmal lesen und mit dem gesicherten Stand vergleichen. Bestehenden
   `/_ironpathRelease`-Knoten administrativ lesen; bei unerwartetem Inhalt
   stoppen statt ihn zu überschreiben.
2. Für die erste Anlage einen **ganzen** `maintenance`-Record für den
   Kandidaten-Build mit neuer zufälliger Epoche schreiben. Das reine Anlegen
   dieses Knotens sperrt das alte Spiel noch nicht. Die vorbereiteten Daten
   enthalten `authAfterMs: {".sv":"timestamp"}`; Firebase muss diesen Wert im
   selben atomaren Set auflösen. Nach dem Set den gesamten Record zurücklesen.
3. Erst dann die frisch verglichenen kombinierten Rules veröffentlichen. Ab
   diesem Moment verweigern die Rules den alten direkten Clients den Zugriff.
   Ohne passenden Launcher/Dienst bleibt das Spiel geschlossen.
4. Die Änderungen mit einem regulären Merge-Commit nach `main` bringen, damit
   die gepinnten Commits Vorfahren bleiben. GitHub Pages von `main:/` auf
   **GitHub Actions** umstellen; das betrifft die Veröffentlichung der
   gesamten Website. Erst danach die Repository-Variable
   `IRONPATH_GUARDED_PAGES_ENABLED=true` setzen und den Workflow von `main`
   mit `deploy=true` und `full_verification=true` starten. Bei Fehlern nicht
   öffnen. Der lokale Dateivergleich ist kein Nachweis aller Cache- oder
   Service-Worker-Zustände.
5. Produktivdienst, Regeln, Status, öffentliche Launcher- und Build-Dateien
   sowie die Reaktion alter Sitzungen prüfen. Nur wenn alles passt, durch ein
   weiteres **ganzes** Set `mode=open`, den ausgewählten Build, eine neue,
   noch nie verwendete Epoche und den RTDB-Serverzeitstempel schreiben. Nichts
   feldweise oder mit zuvor abgetasteter Zeit öffnen. Auth und RTDB haben
   getrennte Uhren; eine harte Grenze gegen jedes während der Wartung außerhalb
   des Spiels ausgestellte Firebase-Auth-Token ist damit nicht nachgewiesen.
   Bestehende Offline-Daten lassen sich nicht aus der Ferne löschen.
6. Nach Problemen geschlossen bleiben. Ein Rückfall auf einen erhaltenen
   Guard-Build braucht ebenfalls eine **neue** Epoche und neuen Cutoff; niemals
   einen alten offenen Record wiederherstellen. Nach dem ersten Cutover müssen
   künftige Pins den tatsächlich aktiven und den gewünschten Rückfall-Build
   behalten. Für neue Spielversionen Code zuerst committen und anschließend
   `gameRevision` auf diesen Commit setzen; die alte Version als `rollback`
   behalten. Ungepinnten Spielcode veröffentlicht der Launcher nicht.

`prepare-pages-control.mjs` kann einen solchen Record lokal erstellen. Es
prüft den angegebenen Build gegen die Pins und erzeugt frische Zufallswerte,
prüft aber **nicht** den aktuellen Firebase-Stand oder parallele Operatoren:

```sh
node IronPath/release-tools/prepare-pages-control.mjs maintenance <build> <aktuelle-epoche-oder-none> /tmp/control-neu.json
# Nur nach tatsächlichem Read-back des maintenance-Records:
node IronPath/release-tools/prepare-pages-control.mjs open <build> <gelesene-maintenance-epoche> /tmp/control-open.json
```

Für einen autorisierten ganzen Set kann ein bereits angemeldeter Operator
`firebase database:set /_ironpathRelease <datei> --project iron-path-dc727
--instance iron-path-dc727-default-rtdb` verwenden. Dies ersetzt ausschließlich
jenen Knoten; niemals den Datenbank-Root angeben. Danach mit `firebase
database:get /_ironpathRelease` und denselben Projekt-/Instanzparametern
zurücklesen. Bei Timeout/unklarem Ergebnis zuerst lesen und untersuchen, nicht
blind wiederholen. CLI-Login und private Schlüssel bleiben beim Operator.

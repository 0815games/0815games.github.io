# Vendetta · Das Quartier (0.1)

Spielbarer deutschsprachiger Einzelspieler-Prototyp, statisches HTML/CSS/ES-Module, keine Abhängigkeiten. Im übergeordneten Git-Repository ist dieser komplette Ordner als `Vendetta/` vorgesehen. Ein bestehendes Remote-Repository wurde nicht verändert.

## Start

Im Ordner `Vendetta/`: `python3 -m http.server 8080` und http://localhost:8080 öffnen. Nicht per file:// starten. Tests: `node --test test.mjs` (Node 20+). Kein Build nötig. Für statisches Hosting `Vendetta` als Veröffentlichungsverzeichnis verwenden. `Belege/` und Dossier sind Rechercheunterlagen; vor öffentlicher Bereitstellung Bildrechte prüfen und ggf. aus der Veröffentlichung ausschließen.

## Erster Durchlauf

Räume → Munitionskammer bauen → +1 Stunde → Trainingslager bauen → +12 Stunden → Trainingslager → einen Schläger rekrutieren → +1 Stunde. Danach steht er in der Mannschaft und im Journal. Vorspulen betrifft nur den eigenen Spielstand. Ohne Testuhr laufen Aufträge in Echtzeit, auch während Abwesenheit (nach Browseruhr). Ein Spielstand pro Browser/Origin; bitte nicht in mehreren Tabs gleichzeitig spielen.

## Aufbau und Quellen

- `engine.mjs`: Ressourcen, Stufenkosten, Bauzeit, Ereignisabrechnung und FIFO-Rekrutierung.
- `ui.mjs`: Menüs, lokales Speichern, Testuhr und Meldungen. `viertel.svg`: eigene Stadtillustration.
- `Vendetta-Dossier.html`: bebilderte Recherche mit Primärbelegen. `Daten/`: Quellenwerte, nicht ungeprüft als universelle Spielregeln verwenden.
- Spielakte in der App trennt belegte Werte von Annahmen. Noch keine Konten, Multiplayer, Standortwechsel, Einsätze oder Kämpfe. Kein Backend. Lokaler Zustand ist nicht für kompetitives Spiel vertrauenswürdig.

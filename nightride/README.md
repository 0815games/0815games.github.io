# Nachtfahrt – drei Lieferungen, Nachrichten und Inventar

Dieses Paket ersetzt vier Dateien im bestehenden Ordner `/night`: `mission.js`, `game.js`, `index.html`, `README.md`. `city-world.js`, `style.css` und `favicon.svg` bleiben unverändert. Alle betroffenen Dateien liegen im ZIP vollständig vor.

## Ablauf

Nach dem animierten Intro Enter drücken. Bei der Garage im Stillstand E drücken: Missionsbrief lesen und mit E/Enter schließen. Dem orangefarbenen Pfeil folgen; die Abgabe erfordert 1,2 Sekunden fast im Stillstand. Nach jeder Lieferung erscheint eine neue Nachricht mit Belohnung. E/Enter nimmt die nächste Nachricht an und öffnet ihren Brief; Esc schließt nur die Belohnungsnachricht, sodass die nächste Mission später mit E gestartet werden kann.

1. Mara → Leyla am Nachtkiosk: Ersatzlampen und Sicherungen. Belohnung 80 € und LED-Leuchtmodul. Lieferfeld (-198, -120).
2. Leyla → Enzo im Café Nova: Kaffeebohnen. Belohnung 100 € und kompaktes Werkzeugset. Lieferfeld (42, -120).
3. Enzo → Sven am Nachtdepot: versiegelte Fahrzeugteile. Belohnung 140 € und Performance-Reifensatz. Lieferfeld (162, 120).

Geldbeutel steht im HUD. Teileinventar mit dem HUD-Button oder `I` öffnen. Guthaben, Teile und Missionsstand werden lokal im Browser unter `nachtfahrt-profile-v1` gespeichert; auf demselben Browser nicht doppelt auszahlbar. Es gibt noch keine Cloud-Synchronisierung. Die Rückkehr-zur-Garage-Abrechnung kommt in einem späteren Paket.

## Testfolge

1. Spiel starten; vor E darf kein aktiver Missionspfeil vorhanden sein.
2. Kioskbrief öffnen; durchfahren zählt nicht, Anhalten zählt einmal.
3. Nach Zahlung den Geldbeutel (+80 €) und das Inventar (LED-Leuchtmodul ×1) prüfen.
4. Folgemission per E annehmen; Café und Depot ebenso testen.
5. Vor und nach einem Browser-Neuladen Geldbeutel und Missionsstand vergleichen.
6. Zwischen Lieferungen in den Rennmodus wechseln und zurückkehren: der Fortschritt bleibt erhalten.

Bei Bedarf für einen erneuten Test aller drei Missionen im Browser-Speicher den einzelnen Schlüssel `nachtfahrt-profile-v1` löschen. Syntax und datengetriebene Missionsfolge wurden geprüft; ein kompletter Browser-Test war nicht möglich.

# v0.4.17 – Sitzungsintegration

- Sitzungssperre ohne Functions auf dark_rpg/sessions/uid, 120 Sekunden Lease, 25 Sekunden Verlängerung.
- Tab-isolierte Authentifizierung, zweite normale Spielsitzung wird abgewiesen.
- Eigene Spielstandpfade; Prüfung vor Laden, Speichern und Löschen.
- Mobile-first Pause bei Verbindungsverlust und Rückkehr aus dem Hintergrund.
- Mittigen Login-Mute-Button entfernt, Cloud-Status ausgeblendet.
- Manuelle Speicher-Rückmeldung; automatische Meldungen werden im Kompatibilitätsadapter ausgefiltert.
- Reguläre Abmeldung gibt Sitzung frei; AFK-Abmeldung wird nach spätestens 25 Sekunden erkannt.

Grenzen: Kein atomarer serverseitiger Sitzungsschutz der Spielstände; keine Absicherung gegen manipulierte oder alte Clients. Offline gepufferte Schreibvorgänge können später übertragen werden. Kein echter Browser-/Handy-/Firebase-Test. SDK-Anmeldung ist nicht persistent; Seitenneuladen kann bis zum Ablauf der alten Lease blockieren. Bestehende main.js wird nicht ersetzt; bekannte unabhängige Fehler dort sind nicht Teil dieses Commits. Firebase-Regeln müssen zuvor passend veröffentlicht sein.

## Projektvorgabe
Mobile-first, anschließend Desktop-Browser. Keine ungetesteten Funktionsgarantien. Touchbedienung, kleine Bildschirme, Hintergrund/Rückkehr, Netzwerkverlust und zwei Fenster separat testen.

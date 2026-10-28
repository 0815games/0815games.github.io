# INKFALL: Freundeslisten-Komponenten (noch nicht im Repository integriert)

## Dateien
social-client.js: read-only Firebase-Adapter und injizierte Backend-Aktionen.
social-store.js: Sessionwechsel, Listener-Lebenszyklus, asynchrone Auswahl und Fehlerzustand.
social-ui.js / social-ui.css: nativer Dialog, Liste/Details, Anfragen, Hinzufuegen und mobile Navigation.
character-inspector.js: schreibgeschuetztes Charakterblatt und Skillliste mit Beschreibungen.
social-bootstrap.js: Hauptmenue-/Topbar-Einstieg, Auth-Anbindung und Bereinigung.

## Integration
Diese Dateien zusammen nach inkfall/src/social/ uebernehmen.
Im head von inkfall/src/index.html:
<link rel="stylesheet" href="social/social-ui.css">
Am Ende des body, NACH bestehenden Firebase-, Menue- und UI-Scripts:
<script src="social/social-client.js"></script>
<script src="social/social-store.js"></script>
<script src="social/character-inspector.js"></script>
<script src="social/social-ui.js"></script>
<script src="social/social-bootstrap.js"></script>

Default: deaktivierter Datenadapter, sichtbare Erklaerung statt Fake-Kontakten.
Freunde-Button ist nur mit Anmeldung bedienbar. Kein Online-Zaehler ohne Presence.
Erst nach Backend-/Regelfreigabe VOR Bootstrap konfigurieren:
window.INKFALL_SOCIAL_CONFIG = {enabled:true, actions:{ ... }};
Aktionen: requestByCode({friendCode}), accept/decline/remove/block/invite({targetUid}).
Nur verifizierte Backend-Aufrufe injizieren; niemals direkte Graphwrites als Ersatz.
Jede nicht konfigurierte Aktion bleibt deaktiviert. Presence ist noch nicht implementiert.
Anfragen mit fehlendem Absendernamen koennen nicht angenommen werden.

## Datenschutz und Sicherheit
Daten nur unter social lesen, niemals komplette private users-Spielstaende.
Profile/Charakteransichten einzeln, Charakteransichten pro knight/mage laden.
Listener fuer aktuell ausgewahltes Profil/Charakter beachten Zugriffsfehler/Entzug.
Logout/Accountwechsel/Freund entfernen verwirft alte Antworten und fremde Daten.
Text wird ausschliesslich mit textContent eingesetzt, nicht als dynamisches HTML.
Der Charakterinspektor ist vorerst eine Nur-Lese-Skillliste, NICHT die grafische Skillkarte.
Kein Kaufen/Reset und keine Aenderung eigener globals skills/skillPoints.
Native showModal()/Dialog-Toplayer statt weiterer lokaler Z-Index-Ueberlagerungen.
Dialog schliesst mit Escape/Schliessen; Fokus wird zum Ausloeser zurueckgegeben.
Tastaturereignisse werden bei offenem Dialog auf Window-Capture gestoppt.
Bereits frueher registrierte Window-Capture-Handler (z.B. F2-Diagnose) muessen im
spaeteren gemeinsamen Overlay-Manager ebenfalls beruecksichtigt werden.
Das Oeffnen aendert weder Spielgeschwindigkeit noch Coop-Pausenzustand.

## Pruefstand
node --test inkfall/src/social/social-components.test.cjs
15 Adapter-/Store-Tests lokal bestanden; JS-Syntax geprueft.
Keine echten Firebase-/Backend-Aufrufe ausgefuehrt.
Kein Browser-, Fokus-, Tastatur- oder Layouttest: vor Integration erforderlich.
Die bestehenden Firebase-Regeln und der letzte Social-CI-Lauf wurden hier nicht freigegeben.
Nicht committed, nicht gepusht, nicht auf der Website aktiviert.

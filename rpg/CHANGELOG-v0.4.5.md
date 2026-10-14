# v0.4.5 – Ingame-Löschdialog

- Recken-Löschbuttons öffnen den Fantasy-Dialog statt window.confirm.
- Vorhandenen ModalManager erweitert: dynamische Dialogstruktur, Spielstil, Name/Slot, Warntext und Fehleranzeige.
- Abbrechen vorausgewählt; Tab-Fokus, Esc-Abbruch und Fokus-Rückgabe.
- Async-Löschen mit deaktivierten Buttons; Fehler erhalten den Recken und erlauben erneuten Versuch.
- Erfolgreiches Löschen aktualisiert die Auswahl über die bestehende openSlotScreen-Funktion.
- Kontoidentität vor dem Löschen geprüft.
- Bestehende main.js bleibt unverändert; der alte Browser-confirm-Handler wird für Löschbuttons durch Capture-Interception nicht mehr aufgerufen.

Prüfstatus: kein realer Browser-/Firebase-End-to-End-Test. Laufzeit-Version v0.4.5; HTML-Fallback und Service-Worker-Cachename unverändert. Andere nicht eingebundene Altsysteme wurden nicht vollständig migriert.

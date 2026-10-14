# v0.4.4 – Tutorial und Hilfe

- Begrüßung beim ersten Spiel-Einstieg mit Starten und Überspringen.
- Kontext-Hinweise zu Bewegung, Interaktion, erstem Kampf, Ausrüstung, Skillpunkten und Treppe.
- Nicht-blockierende Hinweise mit Verstanden-Button; Hilfe als modaler Dialog.
- HUD-Button ❔ Hilfe, H außerhalb Texteingaben, Esc im Kampf.
- Hilfe umfasst Touch-/Tastatursteuerung, Kampf, Recken und Spielablauf.
- Tutorial erneut startbar; lokaler Status nach Konto-UID, kein Schreiben nach Firebase.
- Tastaturereignisse des Hilfe-Dialogs erreichen die Spielsteuerung nicht.
- Laufzeit-Version v0.4.4, bestehende Mobile-/Charakter-/Tastaturmodule bleiben eingebunden.

Grenzen: Tutorialstatus gilt pro Konto und Browser, nicht geräteübergreifend. Kein Browser-/Safari-/Firebase-End-to-End-Test durchgeführt. Hinweise sind kompakte Textfenster ohne Spotlight-Markierung; spätere Schritte bleiben bis zum Verstanden-Button ausstehend. main.js, HTML-Fallback-Version und Service-Worker-Cachename bleiben unverändert.

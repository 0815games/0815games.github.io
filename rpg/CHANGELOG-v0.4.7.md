# v0.4.7 – Audio und Reckenrahmen

- Musiklautstärke, Effektlautstärke und Musik-Stummschaltung lokal gespeichert und vor main.js-Start wiederhergestellt.
- Gemeinsames Audiofenster über sichtbaren Audio-Button im Intro, Login, Auswahl und Spiel.
- Regler und Musikbuttons synchronisiert; Regler heben die Stummschaltung nicht mehr automatisch auf.
- Lokale Audioeinstellungen werden auch zwischen offenen Tabs übernommen.
- Recken-Auswahl mit festem Safe-Area-Rahmen, fester Überschrift und Fußleiste; nur die Reckenliste scrollt vertikal.
- Fokussierte Reckenaktionen werden beim Tastaturwechsel in die Ansicht gescrollt.
- Bestehende Module bleiben erhalten; Laufzeit-Version v0.4.7.

Grenzen: Speicherung gilt pro Browser/Gerät, nicht über Firebase. Kein Browser-/Safari-End-to-End-Test durchgeführt. main.js, index.html-Fallback und Service-Worker-Cachename bleiben unverändert. Browser kann Audiowiedergabe bis zur Benutzerinteraktion blockieren.

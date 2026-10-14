# v0.4.1 – Mobile Hotfix aktiviert

- Versionsnummer auf v0.4.1 angehoben.
- Vorhandenes mobile-hotfix-v041.css wird über das von main.js importierte version.js und mobile-ui.js geladen; index.html bleibt unverändert.
- Intro mit begrenzter Breite, Safe-Area-Rahmen und vertikalem Scrollen.
- Kampf aus der Seitenleiste in den Body verschoben; eigene TP-/MP-Anzeige, Gegner-TP, effektive ATK/DEF und Trankbestand.
- Kampfwerte nach Aktionen inklusive Ausweichen aktualisiert.
- Canvas-Seitenverhältnis und sichtbare Feldgröße an verfügbaren Platz angepasst.
- Touch-Wegfindung nur auf entdeckten Feldern, keine Wege durch andere Gegner; neue Eingabe unterbricht Auto-Lauf.
- Bewegung während Tod, Übergang, Level-Up und verstecktem Spiel gesperrt.
- Veralteten Service-Worker-Cache ersetzt; Cache-Bereinigung auf Spiele-Caches beschränkt.
- Bestehende main.js und Skilltree bleiben erhalten.

Nicht durchgeführt: realer Browser-/iPhone-Test, Firebase-End-to-End-Test. CSS kann initial vor Modulstart noch den alten Zustand zeigen. HTML-Fallback-Version bleibt v0.4.0, bis JavaScript die Versionsanzeigen aktualisiert. Kein Offline-Start garantiert, solange die benötigten Dateien nicht zuvor geladen wurden.

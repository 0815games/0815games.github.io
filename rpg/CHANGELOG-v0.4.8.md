# v0.4.8 – Kampfvisualisierung

- Stabile eigene Kampf-HUD mit dauerhaft angelegten TP-/MP-Balkenelementen; alte überschreibbare Text-HUD ausgeblendet.
- Heldenvorschau mit tatsächlicher Ausrüstung und Gegnerdarstellung im Kampffenster.
- Fliegende Treffer-, Krit- und Heilungszahlen anhand der vorhandenen Aktionsausführung; Trankheilung zeigt tatsächlich hinzugewonnene TP.
- Hieb/Stabimpuls, Feuerprojektil, Trefferblitz, Heilung, Ausweichtext und Staubwolke bei Flucht.
- Visuelle Effekte für Blutrausch und Arkanwiederkehr bei Sieg.
- Kurzzeitige Aktionssperre für Touch und Tastatur; Kampffenster bleibt bei Kampfende für die Effektdauer sichtbar.
- Bewegungsreduzierung berücksichtigt.
- Laufzeit-Version v0.4.8, bestehende Module erhalten.

Grenzen: zugrunde liegende Kampfberechnung bleibt synchron in main.js; Animationen visualisieren den ausgeführten Spielzug nachträglich. Keine vollständige zeitlich gestaffelte Gegner-KI. Passive Heil-/Mana-Zahlen bei gleichzeitigem Level-Up sind Näherungen, da main.js keine separaten Proc-Ereignisse liefert. Kein realer Browser-/Safari-/Firebase-End-to-End-Test. HTML-Fallback und Service-Worker-Cachename unverändert.

# v0.4.6 – Funkenflug und Ebenenfortschritt

- Eigener Canvas-Funkenflug hinter dem Intro, mit Pause bei verstecktem Intro/Tab und reduzierter Bewegung.
- Treppenfreigabe platziert neue Treppen auf erreichbaren Feldern nahe dem Helden, bevorzugt in 2–5 Schritten Entfernung.
- Treppenfeld und direkte Umgebung werden sichtbar gemacht; vorhandene erreichbare Treppen bleiben erhalten.
- Leere Ebenen ohne Treppe werden beim Laden repariert.
- Neue Ebenen speichern enemyTotal im vorhandenen world-Objekt; besiegt = enemyTotal minus verbleibende Monster.
- HUD zeigt Gegnerfortschritt, Siegelstatus und Treppenkoordinaten.
- Alte Speicherstände ohne Gesamtzahl zeigen nur verbleibende Gegner und einen Hinweis statt erfundener Gesamtzahlen.
- Bestehende Spiel-, Charakter-, Tutorial- und Tastaturmodule bleiben eingebunden.

Grenzen: kein Browser-/Safari-/Firebase-End-to-End-Test. Kein zusätzlicher Treppen-Partikeleffekt in diesem Commit; bisheriger Sieg-Effekt bleibt bestehen. Historischer Fortschritt alter Ebenen wird nicht rekonstruiert. Laufzeit-Version v0.4.6, HTML-Fallback und Service-Worker-Cachename unverändert.

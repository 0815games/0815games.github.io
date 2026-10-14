# v0.4.2 – Recken und Klassenoptik

- Gemeinsamer Canvas-Charakterrenderer statt quadratischer Heldenmarkierung.
- Eigenständige Silhouetten für Eisenbrecher, Arkanist und Schattenläufer.
- Sichtbare Layer für Kettenhemd, Ritterharnisch, Helm, Stiefel, Schild, Dolch, Langschwert, Runenklinge und Rubinring.
- Recken-Auswahl nutzt die von Firebase geladenen Spieler inklusive Ausrüstung, ohne zusätzliche Datenbankabfragen.
- Klassenwahl zeigt die vorhandene Startausrüstung.
- Intro bleibt bis zu Tap/Klick/Enter sichtbar; Scrollgesten öffnen es nicht.
- Intro-Kompatibilitätsmodul verhindert den bisherigen automatischen Wechsel über einen Klassen-Observer; der bestehende Lade-Timer in main.js bleibt bestehen.
- Mobile-Fixes aus v0.4.1 bleiben eingebunden; Version v0.4.2.

Grafik: prozedurale Canvas-Figuren, keine externen Sprite-Sheets. Noch keine Laufanimation. Nicht durchgeführt: realer Safari-/Firebase-End-to-End-Test.

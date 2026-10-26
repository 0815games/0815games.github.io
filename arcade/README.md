# Zwischen den Welten — 2.0.1

- Vollständiger Ersatz der bisherigen Hero-/Kartenoberfläche.
- Fünf animierte Portal-Szenen, zyklischer 3D-Wechsel und Startübergang.
- Vorhandene SVG-Motive werden in die neuen Szenen eingebunden, nicht als Vorschau-Fenster gezeigt.
- Keine iFrames, Spielprozesse oder automatisch abgespielter Ton.
- theme.js bleibt die System-/Hell-/Dunkel-Steuerung.
- Intro: überspringbar, automatische Beendigung, unabhängiger 1,8-s-Sicherheitsausstieg.
- Reduzierte Bewegung: kein Intro, keine Kamerafahrt, direkter Spielstart.
- Nur das aktive Portal animiert; bei verborgenem Dokument pausieren Portal-Animationen.
- Die Navigation funktioniert ohne JavaScript über zusätzliche Direktlinks.
- games.json und eingebettete Daten sind durch Node-Test auf Gleichheit geprüft.
- Test: node arcade/tests/portals.test.cjs
- Browser-, Touch-, Performance- und Deployment-Abnahme bleiben separat erforderlich.

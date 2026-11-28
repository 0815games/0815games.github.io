# 0815 Games — Spielkacheln 3.2.0

Die Startseite zeigt ausschließlich die vier Spielkacheln: Pipboy3003, Tiny Tycoon Towns, IronPath und Schattengruft. Die Schattengruft-Kachel und das App-Icon haben eigens gestaltete Artwork.

- Desktop: vier Spielkarten mit Vorschaubildern nebeneinander.
- Mobil: eine aktive Kachel; Wechsel per Wischen, WASD, Pfeiltasten, Vor/Zurück oder direkter Punktauswahl. Enter und Leertaste starten das ausgewählte Spiel.
- iOS-Web-App-Metadaten, Apple-Touch-Icon, SVG/PNG/ICO-Favicons, Safari-Pinned-Tab-Icon und Manifest mit passenden Icons und Spiel-Kurzbefehlen.
- Root-Service-Worker cached Dashboard, Icons und Karten-Artwork offline. Die Spiele selbst benötigen weiterhin ihre normalen Netzwerkverbindungen.
- Installation auf iPhone/iPad: in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
- Keine zusätzliche Überschrift, Intro-Kopie, Markenleiste oder Fußzeile.
- Jede Karte startet das Spiel direkt; Spiele werden nicht in iframes geladen.
- Tests: `node arcade/tests/portals.test.cjs`.

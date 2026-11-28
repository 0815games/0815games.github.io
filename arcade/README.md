# 0815 Games — Spielzentrale 3.0.0

Die Startseite ist ein kompakter Launcher für genau vier Spiele: Pipboy3003, Tiny Tycoon Towns, IronPath und Schattengruft.

- Desktop: vier Spielkarten mit direkt eingebundenen Vorschaubildern nebeneinander.
- Mobil: jeweils eine aktive Karte; Wechsel per Wischen, Pfeiltasten, Vor/Zurück oder direkter Punktauswahl.
- Jede Karte startet das Spiel direkt. Es werden keine Spiele in iframes geladen.
- Helles und dunkles Farbschema über die kleine Kopfzeilen-Steuerung; die Wahl bleibt in `theme.js` erhalten.
- Mobile Navigation und Pfeiltasten respektieren reduzierte Bewegung; keine automatisch abspielenden Inhalte.
- Tests: `node arcade/tests/portals.test.cjs`.

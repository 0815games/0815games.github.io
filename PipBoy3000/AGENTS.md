# Pip-Boy 3003: Vorgabe für Oberflächen

Alle zum Spiel oder zur Verwaltung gehörenden Dialoge, Bestätigungen,
Fehlermeldungen und Eingaben müssen zum grünen 1950er-Retrofuturismus-/
Pip-Boy-Design passen und auf Desktop wie Mobilgerät bedienbar bleiben.
Keine nativen Browserdialoge (`alert`, `confirm`, `prompt`) verwenden, auch
nicht als Fehler- oder Fallbackpfad. Für systemweite Bestätigungen und Hinweise
`window.PipDialog` verwenden; bei komplexen Eingaben ein zugängliches
spielinternes Overlay gestalten. Tastatur, Abbrechen, Fokus und bestehende
Funktionen berücksichtigen. Änderungen mit passenden Tests absichern.

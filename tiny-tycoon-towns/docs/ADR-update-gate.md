# ADR: Versions-Gate und Anmeldung

Status: angenommen (2026-11-24)

## Entscheidung
- Das Versions-Gate wird aus IronPath übernommen: `src/version-check.mjs`, `src/version-ui.mjs`,
  `src/bounded-json.mjs`. Namensräume sind auf `ttt` umgestellt (Meta-Tag `ttt-build`,
  Parameter `_ttt_*`, Speicherschlüssel `ttt:last-confirmed-build`).
- `release-version.json` ist `{"format":1,"build":"…"}`, wie bei IronPath.
- Ablauf: Beim Start prüft das Gate den Build frisch vom Server (ohne Cache). Ist eine neue
  Version da, lädt die Seite neu, sobald keine Speicherung offen ist. Danach erscheint im Spiel
  der Hinweis „Neue Version … wurde geladen“. Prüfung nach dem Start, nach Hintergrundwechsel
  und jede Minute.
- Der Anmeldebildschirm ist die erste Ansicht. Das Spiel erscheint erst nach der Anmeldung.
  Die Szene im Hintergrund ist eine animierte Insel (`src/world/login-scene.js`), keine Bilddatei.

## Bewusste Abweichung
IronPath blockiert den Start, solange die Version nicht bestätigt ist (auch offline). Das
übernehmen wir zunächst so. Für TTT ist Offline-Fortschritt ein Ziel. Eine Entscheidung,
ob offline ein lokaler Start erlaubt wird, steht aus und wird der Nutzerin bzw. dem Nutzer vorgelegt.

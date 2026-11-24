# ADR: Weltdarstellung mit Canvas 2D, flaches Layout, Plain JavaScript

Status: angenommen (2026-11-24)

## Kontext
GAME_PLAN.md sieht PixiJS v8, TypeScript strict und ein `apps/`/`packages/`-Layout vor.
Die Nutzerin bzw. der Nutzer hat das Kachel-Design abgelehnt und eine große, animierte
Spielwelt verlangt. Der Build-Schritt (Vite) ist im Projekt bisher nicht eingerichtet.

## Entscheidung
- Die Welt wird mit der Canvas-2D-API gezeichnet (`src/world/`), nicht mit PixiJS.
- Layout bleibt flach (`src/`, `data/`, `tests/`), Code bleibt Plain JavaScript mit
  `?v=`-Cache-Token wie im restlichen Projekt.
- Die Domäne (`src/domain/`) bleibt rein und kennt weder Canvas noch DOM.

## Gründe
- Kein Build-Schritt nötig, GitHub Pages liefert die Dateien direkt aus.
- Canvas 2D reicht für die gewünschte Animation mit isometrischer Projektion.
- Mit `@napi-rs/canvas` lassen sich Szenen ohne Browser als PNG prüfen.

## Abweichungen von GAME_PLAN.md (bewusst, nicht stillschweigend)
| Plan | Umsetzung | Grund |
|---|---|---|
| PixiJS v8 | Canvas 2D | siehe oben |
| TypeScript strict | Plain JavaScript | kein Build-Schritt |
| `apps/` + `packages/` | flaches Layout | ein Spiel, kein Monorepo |

Zu prüfen, sobald das Spiel in einem echten Browser läuft: Bildrate auf schwächeren Geräten.

// Tutorial: ein freies, passendes Feld für ein Gebäude finden. Nur Lesen, verändert den Stand nicht.
import { HALL, parseKey, isUnlocked } from './grid.js?v=20261125-bal7';
import { checkPlacement } from './placement.js?v=20261125-bal7';

/**
 * Das nächste freie Feld am Rathaus, auf dem `buildingId` gebaut werden darf.
 * Gibt { x, y } oder null zurück. Gleicher Abstand: erst kleineres y, dann kleineres x.
 * `anchor` (optional, { x, y }): Abstand wird zu diesem Feld gemessen, Standard ist das Rathaus.
 */
export function tutorialSpot(state, buildingId, data, anchor = HALL) {
  if (!state || !data.buildings[buildingId]) return null;
  const best = [];
  for (const key of Object.keys(state.tiles)) {
    const [x, y] = parseKey(key);
    if (x === HALL.x && y === HALL.y) continue;
    if (!isUnlocked(x, y, state.townLevel, data)) continue;
    if (!checkPlacement(state, x, y, buildingId, data).ok) continue;
    best.push({ x, y, d: Math.abs(x - anchor.x) + Math.abs(y - anchor.y) });
  }
  if (!best.length) return null;
  best.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
  return { x: best[0].x, y: best[0].y };
}

/** Feld eines bereits gebauten Gebäudes (ohne Rathaus), für Schritte wie „ausbauen“. */
export function builtSpot(state, buildingId) {
  if (!state) return null;
  for (const key of Object.keys(state.tiles)) {
    if (state.tiles[key].building?.id === buildingId) {
      const [x, y] = parseKey(key);
      return { x, y };
    }
  }
  return null;
}

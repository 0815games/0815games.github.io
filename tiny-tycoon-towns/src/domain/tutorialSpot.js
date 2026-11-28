// Tutorial: ein freies, passendes Feld für ein Gebäude finden. Nur Lesen, verändert den Stand nicht.
import { hallOf, parseKey, isUnlocked, sizeOf } from './grid.js?v=20261127-karten1';
import { checkPlacement } from './placement.js?v=20261127-karten1';

/**
 * Das nächste freie Feld am Rathaus, auf dem `buildingId` gebaut werden darf.
 * Gibt { x, y } oder null zurück. Gleicher Abstand: erst kleineres y, dann kleineres x.
 * `anchor` (optional, { x, y }): Abstand wird zu diesem Feld gemessen, Standard ist das Rathaus.
 */
export function tutorialSpot(state, buildingId, data, anchor = null) {
  if (!state || !data.buildings[buildingId]) return null;
  const hall = hallOf(sizeOf(state));
  const from = anchor ?? hall;
  const best = [];
  for (const key of Object.keys(state.tiles)) {
    const [x, y] = parseKey(key);
    if (x === hall.x && y === hall.y) continue;
    if (!isUnlocked(x, y, state.townLevel, data, sizeOf(state))) continue;
    if (!checkPlacement(state, x, y, buildingId, data).ok) continue;
    best.push({ x, y, d: Math.abs(x - from.x) + Math.abs(y - from.y) });
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

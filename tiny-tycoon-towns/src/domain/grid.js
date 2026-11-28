// Grid coordinates and unlocked area. Pure helpers, no state.
// Jede Stadt hat ihre eigene Kartengröße (state.mapSize). Das Rathaus steht in der Mitte der Karte.

/** Größe der Karte bestehender Städte (vor den Karten-Stufen). */
export const BASE_MAP = 10;
/** Kleinste Karte: Start einer neuen Stadt ohne Freibrief. */
export const START_MAP = 8;
/** Größte Karte, wenn die Freibriefe weiter steigen. */
export const MAX_MAP = 16;

/** Rathaus-Position: die Mitte der Karte (bei 10 × 10 wie bisher (4, 4)). */
export function hallOf(size = BASE_MAP) {
  const m = Math.floor((size - 1) / 2);
  return { x: m, y: m };
}

/** Kartengröße einer Stadt in Abhängigkeit von der Zahl ihrer Freibriefe: 8, 10, 12, 14, 16. */
export function mapSizeFor(charterCount) {
  const n = Math.max(0, Math.floor(charterCount || 0));
  return Math.min(MAX_MAP, START_MAP + 2 * n);
}

/** Kartengröße eines Stadtstands. Alte Stände ohne Feld bleiben bei 10 × 10. */
export function sizeOf(state) {
  return state?.mapSize ?? BASE_MAP;
}

export const keyOf = (x, y) => `${x},${y}`;
export const parseKey = (k) => k.split(',').map(Number);

/** Liegt (x, y) auf der Karte der Größe `size`. */
export const inBounds = (x, y, size = BASE_MAP) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < size && y < size;

export function gridSize(townLevel, data) {
  let size = 6;
  const entries = Object.entries(data.economy.gridSizeByTownLevel)
    .map(([lvl, s]) => [Number(lvl), s])
    .sort((a, b) => a[0] - b[0]);
  for (const [lvl, s] of entries) if (townLevel >= lvl) size = s;
  return size;
}

/** Freigeschaltetes, mittiges Quadrat um das Rathaus. Nie größer als die Karte selbst. */
export function isUnlocked(x, y, townLevel, data, mapSize = BASE_MAP) {
  const size = Math.min(gridSize(townLevel, data), mapSize);
  const h = hallOf(mapSize);
  const off = h.x - Math.floor((size - 1) / 2);
  return x >= off && y >= off && x < off + size && y < off + size;
}

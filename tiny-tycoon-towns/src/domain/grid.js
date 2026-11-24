// Grid coordinates and unlocked area. Pure helpers, no state.

export const GRID = 10;
export const HALL = { x: 4, y: 4 };

export const keyOf = (x, y) => `${x},${y}`;
export const parseKey = (k) => k.split(',').map(Number);
export const inBounds = (x, y) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < GRID && y < GRID;

export function gridSize(townLevel, data) {
  let size = 6;
  const entries = Object.entries(data.economy.gridSizeByTownLevel)
    .map(([lvl, s]) => [Number(lvl), s])
    .sort((a, b) => a[0] - b[0]);
  for (const [lvl, s] of entries) if (townLevel >= lvl) size = s;
  return size;
}

/** Centered square of the current size is unlocked. */
export function isUnlocked(x, y, townLevel, data) {
  const size = gridSize(townLevel, data);
  const off = Math.floor((GRID - size) / 2);
  return x >= off && y >= off && x < off + size && y < off + size;
}

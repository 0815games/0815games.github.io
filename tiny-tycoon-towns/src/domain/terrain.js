import { mulberry32 } from './rng.js?v=20261124-sitz10';
import { GRID, HALL } from './grid.js?v=20261124-sitz10';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Seeded terrain generator. Returns a GRID x GRID array (rows = y, cols = x).
 * Biome decides the layout; the hall tile is always meadow.
 */
export function generateTerrain(biome, seed) {
  const rnd = mulberry32(seed);
  const g = Array.from({ length: GRID }, () => Array(GRID).fill('meadow'));

  switch (biome) {
    case 'riverlands': {
      // A river meanders north-south through the middle of the starting area.
      let cx = rnd() < 0.5 ? 3 : 4;
      for (let y = 0; y < GRID; y++) {
        if (rnd() < 0.35) cx = clamp(cx + (rnd() < 0.5 ? -1 : 1), 2, 6);
        g[y][cx] = 'water';
      }
      scatter(g, rnd, 0.06, 'forest');
      break;
    }
    case 'deepwoods': {
      scatter(g, rnd, 0.55, 'forest');
      const px = 2 + Math.floor(rnd() * 4);
      const py = 2 + Math.floor(rnd() * 4);
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g[py + dy][px + dx] = 'water';
      break;
    }
    case 'highlands': {
      scatter(g, rnd, 0.35, 'rock');
      break;
    }
    case 'coast': {
      // Sea on one side, a sandy shore just inside it.
      const left = rnd() < 0.5;
      for (let y = 0; y < GRID; y++) {
        const wobble = rnd() < 0.3 ? 1 : 0;
        for (let i = 0; i < 2 + wobble; i++) {
          const x = left ? i : GRID - 1 - i;
          g[y][x] = 'water';
        }
        const sx = left ? 2 + wobble : GRID - 3 - wobble;
        g[y][sx] = 'sand';
      }
      scatter(g, rnd, 0.05, 'forest');
      break;
    }
    default:
      throw new Error(`Unknown biome: ${biome}`);
  }

  g[HALL.y][HALL.x] = 'meadow';
  return g;
}

function scatter(g, rnd, prob, terrain) {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (x === HALL.x && y === HALL.y) continue;
      if (g[y][x] === 'meadow' && rnd() < prob) g[y][x] = terrain;
    }
  }
}

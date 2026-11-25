import { mulberry32 } from './rng.js?v=20261125-bal6';
import { GRID, HALL } from './grid.js?v=20261125-bal6';

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

  // Berge: Hochland hat mehrere Gebirgszüge, andere Biome höchstens einen kleinen.
  const ranges = biome === 'highlands' ? 2 + Math.floor(rnd() * 2) : (rnd() < 0.5 ? 1 : 0);
  for (let i = 0; i < ranges; i++) grow(g, rnd, 'mountain', biome === 'highlands' ? 6 : 3);

  // Startfläche: mindestens Wald (Holz für fast alles) und ein wenig Fels (Steinbruch).
  ensureStart(g, rnd, 'forest', 4);
  ensureStart(g, rnd, 'rock', 2);
  // Startlayout entschärfen: nicht zu viel Wasser, genug Wiese für Farmen.
  limitStartWater(g, 4);
  ensureStartMeadow(g, 12);

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

/** Lässt einen zusammenhängenden Gebirgszug aus einem zufälligen Startfeld wachsen (nur auf Wiese und Fels). */
function grow(g, rnd, terrain, size) {
  let x = 1 + Math.floor(rnd() * (GRID - 2));
  let y = 1 + Math.floor(rnd() * (GRID - 2));
  let placed = 0;
  for (let tries = 0; tries < 200 && placed < size; tries++) {
    const ok = !(x === HALL.x && y === HALL.y) && (g[y][x] === 'meadow' || g[y][x] === 'rock');
    if (ok) {
      g[y][x] = terrain;
      placed++;
    }
    // Nächster Schritt: vom letzten Berg aus, damit der Zug zusammenhängt.
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
    x = clamp(x + dx, 0, GRID - 1);
    y = clamp(y + dy, 0, GRID - 1);
  }
}

/** Die Startfläche (Mitte, sechs mal sechs Kacheln) braucht mindestens `count` Kacheln von `terrain`. */
function ensureStart(g, rnd, terrain, count) {
  const cells = [];
  for (let y = 2; y <= 7; y++) for (let x = 2; x <= 7; x++) {
    if (x === HALL.x && y === HALL.y) continue;
    cells.push([x, y]);
  }
  const have = cells.filter(([x, y]) => g[y][x] === terrain).length;
  let need = count - have;
  // Nur Wiesen umwandeln, Wasser und Berge bleiben, wie sie sind.
  const meadows = cells.filter(([x, y]) => g[y][x] === 'meadow');
  while (need > 0 && meadows.length) {
    const i = Math.floor(rnd() * meadows.length);
    const [x, y] = meadows.splice(i, 1)[0];
    g[y][x] = terrain;
    need--;
  }
}

/** Die Startfläche (6×6 in der Mitte) hat höchstens `max` Wasserkacheln. Überzählige werden Furt-Strand. */
function limitStartWater(g, max) {
  const cells = startCells();
  const water = cells.filter(([x, y]) => g[y][x] === 'water');
  for (const [x, y] of water.slice(0, Math.max(0, water.length - max))) g[y][x] = 'sand';
}

/**
 * Die Startfläche hat mindestens `min` Wiesenkacheln (Farmen brauchen Wiese). Es wird nur Wald und Fels
 * oberhalb der Mindestmengen umgewandelt, damit Holz und Stein für den Start bleiben.
 */
function ensureStartMeadow(g, min) {
  const cells = startCells();
  const count = (t) => cells.filter(([x, y]) => g[y][x] === t).length;
  const keep = { forest: 4, rock: 2 };
  for (const t of ['forest', 'rock']) {
    let need = min - count('meadow');
    for (const [x, y] of cells) {
      if (need <= 0) break;
      if (g[y][x] !== t) continue;
      const surplus = count(t) - keep[t];
      if (surplus <= 0) break;
      g[y][x] = 'meadow';
      need--;
    }
  }
}

function startCells() {
  const cells = [];
  for (let y = 2; y <= 7; y++) for (let x = 2; x <= 7; x++) {
    if (x === HALL.x && y === HALL.y) continue;
    cells.push([x, y]);
  }
  return cells;
}

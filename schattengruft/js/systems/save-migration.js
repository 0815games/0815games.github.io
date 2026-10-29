// S02b – Validierung, Migration und Laufzeit-Zurücksetzung geladener Spielstände
import { normalizePlayer } from '../core/state.js';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finiteNumber = (value, fallback, minimum = -Infinity) =>
  Number.isFinite(value) && value >= minimum ? value : fallback;

function normalizeEntityList(value, label) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter(entry => entry != null);
  if (isRecord(value)) {
    return Object.keys(value)
      .map(key => Number(key))
      .filter(Number.isInteger)
      .sort((a, b) => a - b)
      .map(key => value[key])
      .filter(entry => entry != null);
  }
  throw new TypeError(`Spielstand: ${label} hat ein ungültiges Format.`);
}

function normalizeWorld(world) {
  const base = {
    depth: 1,
    cols: 20,
    rows: 15,
    tiles: [],
    chests: [],
    monsters: [],
    stairs: { x: 17, y: 12 },
    discovered: []
  };
  if (!isRecord(world)) return base;
  return {
    ...base,
    ...world,
    depth: finiteNumber(world.depth, 1, 1),
    cols: finiteNumber(world.cols, 20, 1),
    rows: finiteNumber(world.rows, 15, 1),
    tiles: Array.isArray(world.tiles) ? world.tiles : [],
    chests: normalizeEntityList(world.chests, 'Truhenliste'),
    monsters: normalizeEntityList(world.monsters, 'Gegnerliste'),
    discovered: Array.isArray(world.discovered) ? world.discovered : [],
    stairs: isRecord(world.stairs)
      && Number.isFinite(world.stairs.x)
      && Number.isFinite(world.stairs.y)
      ? { x: world.stairs.x, y: world.stairs.y }
      : base.stairs
  };
}

function normalizeMeta(meta) {
  if (!isRecord(meta)) return { gold: 0, bestDepth: 1 };
  return {
    gold: finiteNumber(meta.gold, 0, 0),
    bestDepth: finiteNumber(meta.bestDepth, 1, 1)
  };
}

export function normalizeSaveSlot(slot) {
  if (!isRecord(slot) || !isRecord(slot.player)) {
    throw new TypeError('Spielstand: Slot oder Heldendaten sind ungültig.');
  }
  const player = normalizePlayer(slot.player);
  const world = normalizeWorld(slot.world);
  const meta = normalizeMeta(slot.meta);
  return {
    ...slot,
    schemaVersion: finiteNumber(slot.schemaVersion, 1, 1),
    currentSlot: Number.isInteger(slot.currentSlot) && slot.currentSlot >= 0 ? slot.currentSlot : 0,
    player,
    world,
    meta,
    inCombat: false,
    activeMonster: null
  };
}

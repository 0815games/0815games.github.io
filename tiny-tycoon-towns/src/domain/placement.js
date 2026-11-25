// Platzierungsregeln: Welches Gelände ein Gebäude braucht, und wie Felder der Farm funktionieren.
// Reine Funktionen ohne Zustandsänderung. Alle Regeln stehen in data/buildings.json („placement“).
import { inBounds, keyOf, isUnlocked } from './grid.js?v=20261125-bal6';

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

export const TERRAIN_NAMES_DE = {
  meadow: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', sand: 'Strand', mountain: 'Berg',
};

const terrainAt = (state, x, y) => (inBounds(x, y) ? state.tiles[keyOf(x, y)]?.terrain : undefined);

/** Land heißt jedes Gelände außer Wasser. */
const isLand = (t) => t !== undefined && t !== 'water';

/** Ufer: Landkachel mit mindestens einer Wasserkachel direkt daneben (ohne Diagonale). */
function isShore(state, x, y) {
  return isLand(terrainAt(state, x, y)) && N4.some(([dx, dy]) => terrainAt(state, x + dx, y + dy) === 'water');
}

/** Ein Regel-Eintrag aus „on“ passt auf die Kachel? */
function ruleFits(rule, state, x, y) {
  if (rule === 'land') return isLand(terrainAt(state, x, y));
  if (rule === 'shore') return isShore(state, x, y);
  return terrainAt(state, x, y) === rule;
}

function ruleText(rule) {
  if (rule === 'land') return 'Land';
  if (rule === 'shore') return 'Ufer';
  return TERRAIN_NAMES_DE[rule] ?? rule;
}

/** Kurztext für die Bauauswahl, z. B. „Nur auf Wiese“. Aus dem Eintrag „hint“ oder den Regeln. */
export function placementHint(def) {
  if (def.placement?.hint) return def.placement.hint;
  return '';
}

/**
 * Prüft, ob `buildingId` auf (x, y) stehen darf. Gibt { ok, mode?, reason?, need? } zurück.
 * mode gilt für die Fischerei: „steg“ auf Wasser, „boot“ am Ufer.
 * Bereits gebaute Gebäude bleiben gültig, auch wenn sich das Gelände später ändern würde.
 */
export function checkPlacement(state, x, y, buildingId, data) {
  const def = data.buildings[buildingId];
  const rules = def?.placement;
  const tile = inBounds(x, y) ? state.tiles[keyOf(x, y)] : null;
  if (!tile) return { ok: false, reason: 'outOfBounds' };
  if (tile.field) return { ok: false, reason: 'fieldOccupied' };
  if (!rules) return { ok: true };

  let mode;
  if (def.modes) {
    if (tile.terrain === 'water' && rules.on.includes('water')) mode = 'steg';
    else if (rules.on.includes('shore') && isShore(state, x, y)) mode = 'boot';
    else return { ok: false, reason: 'terrain', need: placementHint(def) };
  } else if (!rules.on.some((r) => ruleFits(r, state, x, y))) {
    return { ok: false, reason: 'terrain', need: placementHint(def) || rules.on.map(ruleText).join(' oder ') };
  }

  if (rules.near) {
    const wanted = [].concat(rules.near.terrain);
    const near = N8.some(([dx, dy]) => wanted.includes(terrainAt(state, x + dx, y + dy)));
    if (!near) return { ok: false, reason: 'near', need: `${wanted.map((t) => TERRAIN_NAMES_DE[t]).join(' oder ')} direkt daneben` };
  }
  return mode ? { ok: true, mode } : { ok: true };
}

/** 8er-Nachbarschaft, nur innerhalb des Rasters. */
export function neighbours8(x, y) {
  return N8.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => inBounds(nx, ny));
}

/** Schlüssel aller Felder, die zu der Farm auf (fx, fy) gehören. */
export function fieldsOf(state, fx, fy) {
  const owner = keyOf(fx, fy);
  return Object.entries(state.tiles)
    .filter(([, t]) => t.field?.owner === owner)
    .map(([k]) => k);
}

/** Wie viele Felder eine Farm der Stufe `level` anlegen darf: eines je Stufe. */
export const fieldSlots = (level) => level;

/** Felder, die eine Farm auf (fx, fy) noch anlegen kann, als Schlüssel. Nur freie, aufgedeckte Wiesen daneben. */
export function plantableNeighbours(state, fx, fy, data) {
  return neighbours8(fx, fy)
    .filter(([x, y]) => {
      const t = state.tiles[keyOf(x, y)];
      return t && t.terrain === 'meadow' && !t.building && !t.field
        && isUnlocked(x, y, state.townLevel, data);
    })
    .map(([x, y]) => keyOf(x, y));
}

// Handel mit NPC-Städten (GAME_PLAN 4.13). Reine Rechenregeln, kein Zustand, keine Oberfläche.
// Annahmen, wo der Plan nicht eindeutig ist, stehen am jeweiligen Test und unten in KONVOI-PLAN.md.

export const CONVOY_BASE_MIN = 120;
export const CONVOY_PER_DISTANCE_MIN = 30;
export const CONVOY_MAX_MIN = 480;
export const EXPRESS_PCT_PER_LEVEL = 5;   // Eilpost: −5 % je Stufe
export const CONVOY_MIN_QTY = 10;
export const CONVOY_MAX_QTY = 100;
export const MAX_ACTIVE_CONVOYS = 2;
export const EXPORT_PRICE_FACTOR = 0.9;
export const IMPORT_PRICE_FACTOR = 1.8;
export const DISTANCE_TAX_PER_FIELD = 0.01;
export const DISTANCE_TAX_MAX = 0.15;
export const RECIPROCITY_BONUS = 1.25;
export const CROWN_VALUE = 300;           // Kronen = floor(Warenwert / 300)

/** Dauer in Minuten: 120 + 30 × Entfernung, max. 480. Eilpost wirkt auf den Grundwert (vor dem Deckel). */
export function convoyDurationMin(distance, expressLevel = 0) {
  if (!Number.isInteger(distance) || distance < 1 || distance > 10) throw new RangeError('distance 1 bis 10');
  const lvl = Math.min(5, Math.max(0, expressLevel));
  const base = CONVOY_BASE_MIN + CONVOY_PER_DISTANCE_MIN * distance;
  return Math.min(CONVOY_MAX_MIN, Math.round(base * (1 - (EXPRESS_PCT_PER_LEVEL / 100) * lvl)));
}

/** Verlustanteil durch Distanz: 1 % je Feld, höchstens 15 %. */
export function distanceTax(distance) {
  return Math.min(DISTANCE_TAX_MAX, DISTANCE_TAX_PER_FIELD * Math.max(0, distance));
}

export function isValidQuantity(qty) {
  return Number.isInteger(qty) && qty >= CONVOY_MIN_QTY && qty <= CONVOY_MAX_QTY;
}

/** Warenwert einer Lieferung: Menge × Basispreis. */
export function goodsValue(qty, basePrice) {
  return qty * basePrice;
}

/** Kronen aus einer Export-Lieferung: floor(Warenwert / 300). */
export function crownsFor(qty, basePrice) {
  return Math.floor(goodsValue(qty, basePrice) / CROWN_VALUE);
}

/**
 * Export: die Stadt liefert Ware und bekommt Münzen (0,9 × Basispreis je Einheit, abzüglich Distanzsteuer)
 * plus Kronen. Annahme: die Distanzsteuer mindert die Münzen, die Kronen nicht.
 * `reciprocal` = true, wenn es in dieselbe Richtung mit demselben Partner eine Gegenlieferung gibt.
 */
export function exportPayout({ qty, basePrice, distance, reciprocal = false }) {
  const bonus = reciprocal ? RECIPROCITY_BONUS : 1;
  const coins = Math.floor(qty * basePrice * EXPORT_PRICE_FACTOR * (1 - distanceTax(distance)) * bonus);
  return { coins, crowns: crownsFor(qty, basePrice) };
}

/**
 * Import: die Stadt kauft Ware (1,8 × Basispreis je Einheit). Annahme: die Distanzsteuer mindert die
 * gelieferte Menge, der Preis gilt für die gesamte bestellte Menge. Gibt Kosten und tatsächlich ankommende Menge zurück.
 */
export function importCost({ qty, basePrice, distance, reciprocal = false }) {
  const bonus = reciprocal ? RECIPROCITY_BONUS : 1;
  const coins = Math.ceil(qty * basePrice * IMPORT_PRICE_FACTOR / bonus);
  const arrived = Math.floor(qty * (1 - distanceTax(distance)));
  return { coins, arrived };
}

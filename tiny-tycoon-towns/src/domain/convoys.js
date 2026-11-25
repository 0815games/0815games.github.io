// Konvois im Spielstand (GAME_PLAN 4.13, Scheibe 2 aus docs/KONVOI-PLAN.md).
// Abfahrt und Ankunft. Die Abrechnung (settled) folgt in Scheibe 3.
// Reine Funktionen: Eingabezustand wird nicht verändert.
import {
  convoyDurationMin, importCost, exportPayout, isValidQuantity, MAX_ACTIVE_CONVOYS,
} from './trade.js?v=20261125-bal6';

const clone = (o) => structuredClone(o);
const fail = (state, error) => ({ state, events: [], error });

/** Aktive Konvois (noch unterwegs). Fertige zählen nicht gegen das Limit. */
export function activeConvoys(state) {
  return (state.convoys ?? []).filter((c) => c.status === 'travelling');
}

/**
 * Schickt einen Konvoi los.
 * - export: Ware verlässt das Lager sofort. Münzen und Kronen kommen bei der Abrechnung.
 * - import: Münzen werden sofort bezahlt. Die Ware kommt bei Ankunft.
 * `partner` = { id, distance }. Die Dauer nutzt `ctx.data.economy.expressLevel` (Eilpost).
 */
export function startConvoy(state, { partner, direction, resource, qty }, ctx) {
  const { data, nowMs } = ctx;
  if (!partner || !Number.isInteger(partner.distance)) return fail(state, 'noPartner');
  if (direction !== 'export' && direction !== 'import') return fail(state, 'badDirection');
  if (!data.resources[resource]) return fail(state, 'unknownResource');
  if (!isValidQuantity(qty)) return fail(state, 'badQuantity');
  if (activeConvoys(state).length >= MAX_ACTIVE_CONVOYS) return fail(state, 'convoyLimit');

  const basePrice = data.resources[resource].basePrice;
  const s = clone(state);
  if (direction === 'export') {
    if ((s.stock[resource] ?? 0) < qty) return fail(state, 'noStock');
    s.stock[resource] -= qty;
  } else {
    const cost = importCost({ qty, basePrice, distance: partner.distance });
    if (s.coins < cost.coins) return fail(state, 'noCoins');
    s.coins -= cost.coins;
  }

  const durationMin = convoyDurationMin(partner.distance, data.economy.expressLevel ?? 0);
  s.convoySeq = (s.convoySeq ?? 0) + 1;
  const convoy = {
    id: `${s.id}-k${s.convoySeq}`,
    partnerId: partner.id,
    distance: partner.distance,
    direction,
    resource,
    qty,
    departAt: nowMs,
    arriveAt: nowMs + durationMin * 60_000,
    status: 'travelling',
  };
  s.convoys = [...(s.convoys ?? []), convoy];
  return { state: s, events: [{ type: 'convoy_depart', id: convoy.id }] };
}

/** Setzt fertige Konvois auf `arrived`. Idempotent: ein Konvoi wird nur einmal angekommen gemeldet. */
export function arriveConvoys(state, nowMs) {
  const due = (state.convoys ?? []).filter((c) => c.status === 'travelling' && nowMs >= c.arriveAt);
  if (due.length === 0) return { state, events: [] };
  const s = clone(state);
  const events = [];
  for (const c of s.convoys) {
    if (c.status === 'travelling' && nowMs >= c.arriveAt) {
      c.status = 'arrived';
      events.push({ type: 'convoy_arrive', id: c.id });
    }
  }
  return { state: s, events };
}

/**
 * Gegenkonvoi mit demselben Partner in die andere Richtung, der schon angekommen oder abgerechnet ist.
 * Offene Frage (siehe KONVOI-PLAN.md): Der Bonus gilt für die Seite, die als Zweite abgerechnet wird.
 */
export function hasReciprocal(state, convoy) {
  return (state.convoys ?? []).some((o) => o.id !== convoy.id
    && o.partnerId === convoy.partnerId
    && o.direction !== convoy.direction
    && (o.status === 'arrived' || o.status === 'settled'));
}

/** Auszahlung eines angekommenen Konvois. Export: Münzen und Kronen. Import: Ware kommt ins Lager. */
export function payoutFor(state, convoy, data) {
  const basePrice = data.resources[convoy.resource].basePrice;
  const reciprocal = hasReciprocal(state, convoy);
  if (convoy.direction === 'export') {
    const p = exportPayout({ qty: convoy.qty, basePrice, distance: convoy.distance, reciprocal });
    return { coins: p.coins, crowns: p.crowns, goods: 0, xp: data.economy.xp.convoyDelivered };
  }
  const arrived = importCost({ qty: convoy.qty, basePrice, distance: convoy.distance }).arrived;
  return { coins: 0, crowns: 0, goods: arrived, xp: data.economy.xp.convoyDelivered };
}

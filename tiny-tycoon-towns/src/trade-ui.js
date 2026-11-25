// Handel mit Nachbarstädten: Oberfläche (GAME_PLAN 4.13, Scheibe 4). Reines HTML, keine Zustandsänderung.
// Die Aktionen laufen in main.js über startConvoy und settleConvoyAction.
import {
  convoyDurationMin, exportPayout, importCost, CONVOY_MIN_QTY, CONVOY_MAX_QTY, MAX_ACTIVE_CONVOYS,
} from './domain/trade.js?v=20261125-bal4';
import { activeConvoys } from './domain/convoys.js?v=20261125-bal4';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Dauer als „2 h 30 min“. */
export function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h} h ${m} min`;
}

/** Eine Vorschau für die gewählte Lieferung: Dauer und erwartete Werte. Reine Funktion. */
export function previewFor({ partner, direction, resource, qty, data }) {
  const basePrice = data.resources[resource]?.basePrice ?? 0;
  const durationMin = convoyDurationMin(partner.distance, data.economy.expressLevel ?? 0);
  if (direction === 'export') {
    const p = exportPayout({ qty, basePrice, distance: partner.distance });
    return { durationMin, text: `Du bekommst etwa ${p.coins} 🪙 und ${p.crowns} Kronen.` };
  }
  const i = importCost({ qty, basePrice, distance: partner.distance });
  return { durationMin, text: `Kostet ${i.coins} 🪙, es kommen etwa ${i.arrived} Einheiten an.` };
}

/** Formular: Partner, Richtung, Ware, Menge. Die Vorschau aktualisiert main.js beim Ändern. */
export function tradeFormHtml(data, crowns = 0) {
  const towns = data.npcs?.towns ?? [];
  const partnerOpts = towns.map((t) => {
    const biome = data.biomes[t.biome]?.name.de ?? t.biome;
    return `<option value="${esc(t.id)}">${esc(t.name)} · ${esc(biome)} · ${t.distance} Felder</option>`;
  }).join('');
  const resOpts = Object.entries(data.resources).map(([id, r]) =>
    `<option value="${esc(id)}">${esc(r.icon ?? '')} ${esc(r.name.de)}</option>`).join('');
  return `<form id="trade-form" class="auth-form trade-form" novalidate>
    <h2 id="trade-title">Handel</h2>
    <p class="small">Kronen auf dem Konto: <strong data-crowns>${crowns}</strong></p>
    <p class="small">Schick einen Konvoi zu einer Nachbarstadt. Höchstens ${MAX_ACTIVE_CONVOYS} Konvois gleichzeitig.</p>
    <label>Partnerstadt<select name="partner">${partnerOpts}</select></label>
    <fieldset class="trade-dir"><legend>Richtung</legend>
      <label><input type="radio" name="direction" value="export" checked> Verkaufen (Export)</label>
      <label><input type="radio" name="direction" value="import"> Kaufen (Import)</label>
    </fieldset>
    <label>Ware<select name="resource">${resOpts}</select></label>
    <label>Menge (${CONVOY_MIN_QTY} bis ${CONVOY_MAX_QTY})
      <input name="qty" type="number" inputmode="numeric" min="${CONVOY_MIN_QTY}" max="${CONVOY_MAX_QTY}" step="1" value="${CONVOY_MIN_QTY}"></label>
    <p id="trade-preview" class="small" aria-live="polite"></p>
    <p id="trade-msg" class="warn small" role="alert"></p>
    <button type="submit" class="primary">Losschicken</button>
  </form>
  <section class="trade-list" aria-label="Konvois">
    <h3>Konvois</h3>
    <ul id="trade-list"></ul>
  </section>`;
}

/** Liste aller Konvois mit Restzeit, Abrechnen-Knopf und Ergebnis. */
export function convoyListHtml(state, data, nowMs) {
  const list = [...(state.convoys ?? [])].reverse();
  if (list.length === 0) return '<li class="small muted">Noch keine Konvois.</li>';
  const names = Object.fromEntries((data.npcs?.towns ?? []).map((t) => [t.id, t.name]));
  return list.map((c) => {
    const name = esc(names[c.partnerId] ?? c.partnerId);
    const res = data.resources[c.resource];
    const what = `${c.direction === 'export' ? 'Verkauf' : 'Kauf'} · ${c.qty} ${esc(res?.name.de ?? c.resource)} · ${esc(name)}`;
    let status;
    if (c.status === 'travelling') {
      const left = Math.max(0, Math.ceil((c.arriveAt - nowMs) / 60000));
      status = `<span class="small">unterwegs, noch ${fmtDuration(left)}</span>`;
    } else if (c.status === 'arrived') {
      status = `<button type="button" class="primary" data-settle="${esc(c.id)}">Abrechnen</button>`;
    } else {
      const p = c.payout ?? {};
      const parts = [];
      if (p.coins) parts.push(`+${p.coins} 🪙`);
      if (p.goods) parts.push(`+${p.goods} ${esc(res?.name.de ?? '')}`);
      if (p.crowns) parts.push(`+${p.crowns} Kronen`);
      status = `<span class="small">abgerechnet${parts.length ? ': ' + parts.join(', ') : ''}</span>`;
    }
    return `<li class="trade-item"><span>${what}</span> ${status}</li>`;
  }).join('');
}

/** Wie viele Konvois gerade unterwegs sind (für den Hinweis im Formular). */
export function travellingCount(state) {
  return activeConvoys(state).length;
}

// UI layer: renders the state and forwards player input to the pure domain.
// No game rules live here.
import {
  SCHEMA_VERSION, createTown, newSeed, chooseBiome, placeBuilding, upgradeBuilding,
  toggleSell, buyOffer, advance,
} from './domain/engine.js';
import {
  productionMultiplier, ratePerMin, buildCost, storageCap,
  classOf,
} from './domain/economy.js';
import { GRID, keyOf, isUnlocked, gridSize } from './domain/grid.js';
import { merchantOffers, localDateKey } from './domain/merchant.js';

const SAVE_KEY = 'ttt.save.v1';
const LAST_BIOME_KEY = 'ttt.lastBiome';
const OFFLINE_DIALOG_MS = 60_000;
const SAVE_EVERY_MS = 5_000;
const TOWN_NAMES = ['Eichenhain', 'Kieselau', 'Sonnenbrück', 'Mühlbach', 'Fuchsfurt', 'Silberwiese', 'Nebelhorn', 'Tannenbach'];
const TERRAIN_DE = { meadow: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', sand: 'Strand' };
const CLASS_DE = { abundant: 'Reich (×1,5)', neutral: 'neutral', scarce: 'Karg (×0,25)' };
const MOOD_DE = {
  greedy: 'Eberhard reibt sich die Hände: Gute Ware hat ihren Preis.',
  friendly: 'Eberhard winkt freundlich: Für dich habe ich etwas Besonderes.',
  chatty: 'Eberhard plaudert: Stell dir vor, was ich unterwegs gesehen habe!',
};
const ERR_DE = {
  outOfBounds: 'Dieses Feld gibt es nicht.',
  locked: 'Dieses Feld ist noch gesperrt. Mehr Fläche gibt es mit höherem Stadtlevel.',
  occupied: 'Hier steht schon etwas.',
  unknownBuilding: 'Dieses Gebäude gibt es nicht.',
  townLevelTooLow: 'Dafür brauchst du ein höheres Stadtlevel.',
  noCoins: 'Nicht genug Münzen.',
  noMaterial: 'Nicht genug Material.',
  notUpgradable: 'Das Rathaus lässt sich nicht ausbauen.',
  maxLevel: 'Maximalstufe erreicht.',
  noBuilding: 'Hier steht kein Gebäude.',
  noOffer: 'Dieses Angebot gibt es nicht mehr.',
  alreadyBought: 'Dieses Angebot hast du heute schon gekauft.',
  storageFull: 'Das Lager für diese Ressource wäre überfüllt.',
  unknownResource: 'Unbekannte Ressource.',
};

const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => nf0.format(Math.floor(n));
const fmtRate = (n) => nf2.format(n);

let data = null;
let state = null;
let selected = { x: 4, y: 4 };
let dirty = false;

// ---------- Boot ----------

async function loadData() {
  const names = ['resources', 'biomes', 'buildings', 'economy', 'merchant'];
  const parts = await Promise.all(names.map((n) =>
    fetch(`data/${n}.json`).then((r) => {
      if (!r.ok) throw new Error(`data/${n}.json: HTTP ${r.status}`);
      return r.json();
    })));
  return Object.fromEntries(names.map((n, i) => [n, parts[i]]));
}

function ctx() {
  return {
    data,
    dateKey: localDateKey(),
    maxElapsedSec: data.economy.offline.baseCapHours * 3600,
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s.schemaVersion === SCHEMA_VERSION ? s : null;
  } catch {
    return null;
  }
}

function save() {
  if (!state) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    dirty = false;
  } catch {
    toast('Speichern nicht möglich. Ist der Speicher des Browsers voll?', 'error');
  }
}

async function boot() {
  try {
    data = await loadData();
  } catch (e) {
    $('#panel').innerHTML = `<p class="warn">Spieldaten konnten nicht geladen werden. Bitte über einen Webserver öffnen.</p><p class="small">${esc(e.message)}</p>`;
    return;
  }
  bindStatic();
  state = loadSave();
  if (!state) {
    showFounding();
  } else {
    startGame();
  }
}

function startGame() {
  const before = state.lastTick;
  const now = Date.now();
  const r = advance(state, now, ctx());
  state = r.state;
  save();
  const awaySec = (now - before) / 1000;
  if (now - before >= OFFLINE_DIALOG_MS) showOfflineReport(r, awaySec);
  renderAll();
  setInterval(tick, 1000);
  setInterval(() => { if (dirty) save(); }, SAVE_EVERY_MS);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
}

function tick() {
  const r = advance(state, Date.now(), ctx());
  state = r.state;
  dirty = true;
  renderHud();
  updateStockNumbers();
}

// ---------- Actions ----------

function dispatch(result, okMsg) {
  if (result.error) {
    toast(ERR_DE[result.error] ?? 'Aktion nicht möglich.', 'error');
    return;
  }
  state = result.state;
  save();
  for (const e of result.events) {
    if (e.type === 'levelUp') {
      toast(`Stadtlevel ${e.level} erreicht. Dein Raster wächst!`);
    }
  }
  if (okMsg && !result.events.some((e) => e.type === 'levelUp')) toast(okMsg);
  renderAll();
}

function onBoardClick(e) {
  const cell = e.target.closest('[data-x]');
  if (!cell) return;
  selected = { x: Number(cell.dataset.x), y: Number(cell.dataset.y) };
  renderBoard();
  renderPanel();
  cell.focus();
}

function onBoardKey(e) {
  const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const d = map[e.key];
  if (!d) return;
  e.preventDefault();
  selected = {
    x: Math.min(GRID - 1, Math.max(0, selected.x + d[0])),
    y: Math.min(GRID - 1, Math.max(0, selected.y + d[1])),
  };
  renderBoard();
  renderPanel();
  document.querySelector(`[data-x="${selected.x}"][data-y="${selected.y}"]`)?.focus();
}

function bindStatic() {
  $('#board').addEventListener('click', onBoardClick);
  $('#board').addEventListener('keydown', onBoardKey);
  $('#panel').addEventListener('click', onPanelClick);
  $('#stock').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sell]');
    if (!btn) return;
    dispatch(toggleSell(state, { resource: btn.dataset.sell }));
  });
  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Die aktuelle Stadt wird gelöscht. Wirklich neu beginnen?')) return;
    localStorage.removeItem(SAVE_KEY);
    state = null;
    selected = { x: 4, y: 4 };
    showFounding();
  });
}

function onPanelClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn || btn.disabled) return;
  const { action, id, index } = btn.dataset;
  const { x, y } = selected;
  if (action === 'build') dispatch(placeBuilding(state, { x, y, buildingId: id }, ctx()), 'Gebaut.');
  if (action === 'upgrade') dispatch(upgradeBuilding(state, { x, y }, ctx()), 'Aufgewertet.');
  if (action === 'buy') dispatch(buyOffer(state, { index: Number(index) }, ctx()), 'Gekauft. Eberhard nickt zufrieden.');
}

// ---------- Rendering ----------

function renderAll() {
  renderHud();
  renderBoard();
  renderStock();
  renderPanel();
}

function renderHud() {
  const t = state;
  const biome = data.biomes[t.biome].name.de;
  $('#town-name').textContent = t.name;
  $('#town-meta').textContent = `${biome} · Raster ${gridSize(t.townLevel, data)} × ${gridSize(t.townLevel, data)}`;
  $('#coins').textContent = fmt0(t.coins);
  $('#level-label').textContent = `Stadtlevel ${t.townLevel}`;

  const th = data.economy.townLevelThresholds;
  const lo = th[t.townLevel - 1] ?? 0;
  const hi = th[t.townLevel];
  const bar = $('#xp-bar');
  if (hi === undefined) {
    bar.max = 1;
    bar.value = 1;
    bar.setAttribute('aria-valuetext', 'Maximales Stadtlevel');
  } else {
    bar.max = hi - lo;
    bar.value = t.townXp - lo;
    bar.setAttribute('aria-valuetext', `${t.townXp} von ${hi} XP`);
  }
}

function renderBoard() {
  const t = state;
  const cells = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const tile = t.tiles[keyOf(x, y)];
      const unlocked = isUnlocked(x, y, t.townLevel, data);
      const b = tile.building;
      const isHall = b?.id === 'townHall';
      const bName = b ? data.buildings[b.id].name.de : '';
      const label = [
        `Feld ${x + 1}, ${y + 1}`,
        TERRAIN_DE[tile.terrain],
        unlocked ? '' : 'gesperrt',
        bName,
        b && !isHall ? `Stufe ${b.level}` : '',
      ].filter(Boolean).join(', ');
      const classes = ['cell', `t-${tile.terrain}`];
      if (!unlocked) classes.push('locked');
      if (isHall) classes.push('hall');
      if (selected.x === x && selected.y === y) classes.push('selected');
      const icon = b ? data.buildings[b.id].icon : '';
      const lvl = b && !isHall ? `<span class="lvl">${b.level}</span>` : '';
      cells.push(
        `<button type="button" class="${classes.join(' ')}" data-x="${x}" data-y="${y}"`
        + ` aria-label="${esc(label)}" tabindex="${selected.x === x && selected.y === y ? 0 : -1}">`
        + `<span aria-hidden="true">${unlocked ? icon : ''}</span>${lvl}</button>`,
      );
    }
  }
  $('#board').innerHTML = cells.join('');
}

function totalRates() {
  const rates = {};
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const b = state.tiles[keyOf(x, y)].building;
      if (!b) continue;
      const res = data.buildings[b.id].resource;
      if (!res) continue;
      rates[res] = (rates[res] ?? 0) + ratePerMin(state, x, y, data);
    }
  }
  return rates;
}

function renderStock() {
  const cap = storageCap(state, data);
  const rates = totalRates();
  const items = Object.keys(data.resources).map((r) => {
    const res = data.resources[r];
    const on = state.sellEnabled[r];
    const cls = classOf(state.biome, r, data);
    return `<li data-res="${r}">
      <span class="name"><span aria-hidden="true">${res.icon}</span> ${esc(res.name.de)}
        <span class="small muted">${esc(CLASS_DE[cls])}</span></span>
      <button type="button" data-sell="${r}" aria-pressed="${on}"
        aria-label="Verkauf ${esc(res.name.de)} ${on ? 'an' : 'aus'}">Verkauf ${on ? 'an' : 'aus'}</button>
      <span class="amount"><span data-amount>${fmt0(state.stock[r])}</span> / ${fmt0(cap)}
        <span class="small muted" data-rate>${rates[r] ? `+${fmtRate(rates[r])}/min` : ''}</span></span>
      <div class="bar" aria-hidden="true"><span data-bar style="width:${Math.min(100, state.stock[r] / cap * 100).toFixed(1)}%"></span></div>
    </li>`;
  });
  $('#stock').innerHTML = items.join('');
  updateStockNumbers();
}

function updateStockNumbers() {
  const cap = storageCap(state, data);
  const rates = totalRates();
  for (const li of document.querySelectorAll('#stock li[data-res]')) {
    const r = li.dataset.res;
    li.querySelector('[data-amount]').textContent = fmt0(state.stock[r]);
    li.querySelector('[data-rate]').textContent = rates[r] ? `+${fmtRate(rates[r])}/min` : '';
    li.querySelector('[data-bar]').style.width = `${Math.min(100, state.stock[r] / cap * 100).toFixed(1)}%`;
  }
}

function renderPanel() {
  const { x, y } = selected;
  const tile = state.tiles[keyOf(x, y)];
  const unlocked = isUnlocked(x, y, state.townLevel, data);
  const b = tile.building;
  let html = `<section><h2>Feld ${x + 1}, ${y + 1}</h2><p class="muted">${TERRAIN_DE[tile.terrain]}${unlocked ? '' : ' · gesperrt'}</p></section>`;

  if (!unlocked) {
    html += `<section><p>Dieses Feld ist noch im Nebel. Mit höherem Stadtlevel wird die Fläche größer.</p></section>`;
  } else if (b?.id === 'townHall') {
    html += `<section><h3>${data.buildings.townHall.icon} Rathaus</h3>
      <p>Verkauft automatisch ${data.economy.sell.townHallThroughputPerMin} Einheiten pro Minute. Mehr Durchsatz gibt der Marktplatz.</p></section>`;
  } else if (b) {
    html += buildingDetails(b, x, y);
  } else {
    html += buildMenu(x, y);
  }

  html += merchantSection();
  html += `<section class="small muted"><p>Tipp: Ein Hof auf einer Wiese bringt +20 %. Nachbarschaft zählt auch, zum Beispiel Imkerei neben Hof.</p></section>`;
  $('#panel').innerHTML = html;
}

function multiplierText(m) {
  return `×${nf2.format(m)}`;
}

function buildingDetails(b, x, y) {
  const def = data.buildings[b.id];
  const m = productionMultiplier(state, x, y, b.id, data);
  let html = `<section><h3>${def.icon} ${esc(def.name.de)} <span class="muted">Stufe ${b.level}/${def.maxLevel}</span></h3>`;
  if (def.resource) {
    const rate = ratePerMin(state, x, y, data);
    html += `<p>Produktion: <strong>${fmtRate(rate)} ${esc(data.resources[def.resource].name.de)} / min</strong></p>`;
    html += `<p class="small">Faktor ${multiplierText(m)} (Biom, Stadtlevel, Gelände, Nachbarn)</p>`;
  } else {
    html += `<p class="small">${def.id === 'warehouse' ? 'Erhöht die Lagerkapazität um 250 je Stufe.' : 'Erhöht den Verkaufsdurchsatz um 40 pro Minute je Stufe.'}</p>`;
  }
  if (b.level < def.maxLevel) {
    const c = buildCost(b.id, b.level, data);
    const matName = data.resources[c.material.resource].name.de;
    const ok = state.coins >= c.coins && state.stock[c.material.resource] >= c.material.amount;
    html += `<p class="small">Upgrade: ${fmt0(c.coins)} 🪙 und ${c.material.amount} ${esc(matName)}</p>`;
    html += `<button type="button" class="primary" data-action="upgrade" ${ok ? '' : 'disabled'}>Auf Stufe ${b.level + 1} ausbauen</button>`;
    if (!ok) html += `<p class="small warn">Dir fehlen Münzen oder Material.</p>`;
  } else {
    html += `<p class="small ok">Maximalstufe erreicht.</p>`;
  }
  return html + '</section>';
}

function buildMenu(x, y) {
  const rows = Object.entries(data.buildings)
    .filter(([, d]) => !d.fixed)
    .map(([id, d]) => {
      const c = buildCost(id, 0, data);
      const matName = data.resources[c.material.resource].name.de;
      const locked = d.unlockTownLevel > state.townLevel;
      const affordable = state.coins >= c.coins && state.stock[c.material.resource] >= c.material.amount;
      let meta;
      if (d.resource) {
        const m = productionMultiplier({ ...state, tiles: withTempBuilding(x, y, id) }, x, y, id, data);
        const rate = d.baseRatePerMin * m;
        meta = `${fmtRate(rate)} ${esc(data.resources[d.resource].name.de)}/min auf diesem Feld (${multiplierText(m)})`;
      } else {
        meta = id === 'warehouse' ? 'Mehr Lagerkapazität' : 'Mehr Verkaufsdurchsatz';
      }
      return `<div class="opt">
        <div><strong>${d.icon} ${esc(d.name.de)}</strong>
          <div class="meta">${fmt0(c.coins)} 🪙 · ${c.material.amount} ${esc(matName)}</div>
          <div class="meta">${meta}</div>
          ${locked ? `<div class="locked-note">Ab Stadtlevel ${d.unlockTownLevel}</div>` : ''}
          ${!locked && !affordable ? `<div class="locked-note">Dir fehlen Münzen oder Material</div>` : ''}
        </div>
        <button type="button" data-action="build" data-id="${id}" ${locked || !affordable ? 'disabled' : ''}>Bauen</button>
      </div>`;
    });
  return `<section><h3>Bauen</h3>${rows.join('')}</section>`;
}

/** Temporary tile map with a building placed, used only for bonus previews. */
function withTempBuilding(x, y, id) {
  const tiles = { ...state.tiles };
  tiles[keyOf(x, y)] = { ...tiles[keyOf(x, y)], building: { id, level: 1 } };
  return tiles;
}

function merchantSection() {
  const offers = merchantOffers(state.id, localDateKey(), state.biome, data);
  const rows = offers.map((o) => {
    const res = data.resources[o.resource];
    const bought = !!state.merchant.bought[o.index];
    const total = o.unitPrice * o.quantity;
    const can = !bought && state.coins >= total && state.stock[o.resource] + o.quantity <= storageCap(state, data);
    return `<div class="opt">
      <div><strong>${res.icon} ${o.quantity} ${esc(res.name.de)}</strong>
        <div class="meta">${fmt0(o.unitPrice)} 🪙 je Einheit · gesamt ${fmt0(total)} 🪙</div>
        <div class="meta small">${esc(MOOD_DE[o.mood])}</div>
      </div>
      <button type="button" data-action="buy" data-index="${o.index}" ${can ? '' : 'disabled'}>${bought ? 'Gekauft' : 'Kaufen'}</button>
    </div>`;
  });
  return `<section><h3>Wanderhändler Eberhard</h3>
    <p class="small muted">Angebote gelten bis Mitternacht. Die Preise sind höher als im Handel mit anderen Städten.</p>
    ${rows.join('')}</section>`;
}

// ---------- Dialogs and toasts ----------

let toastTimer = null;
function toast(msg, kind = 'info') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast show ${kind === 'error' ? 'error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

function openDialog(html) {
  const dlg = $('#dlg');
  dlg.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}

function closeDialog() {
  const dlg = $('#dlg');
  if (dlg.open) dlg.close();
}

function randomTownName() {
  return TOWN_NAMES[Math.floor(Math.random() * TOWN_NAMES.length)];
}

function showFounding() {
  let biome = chooseBiome(Math.random, localStorage.getItem(LAST_BIOME_KEY));
  const dlg = openDialog('');
  const paint = () => {
    const b = data.biomes[biome];
    const names = (ids) => ids.map((r) => `${data.resources[r].icon} ${data.resources[r].name.de}`).join(', ');
    dlg.innerHTML = `<form method="dialog" id="found-form" class="dlg-body">
      <h2 id="dlg-title">Willkommen in Tiny Tycoon Towns</h2>
      <p>Deine kleine Stadt wächst auch dann, wenn du nicht spielst. Dein Biom entscheidet, was du selbst herstellen kannst.</p>
      <div class="biome-card">
        <h3>${esc(b.name.de)}</h3>
        <p class="small"><strong>Reich:</strong> ${names(b.abundant)}</p>
        <p class="small"><strong>Karg:</strong> ${names(b.scarce)}</p>
        <button type="button" id="reroll">Anderes Biom würfeln</button>
      </div>
      <label>Stadtname<br><input name="name" id="town-input" value="${esc(randomTownName())}" maxlength="24" required></label>
      <button type="submit" class="primary">Stadt gründen (150 🪙)</button>
    </form>`;
    dlg.querySelector('#reroll').addEventListener('click', () => {
      biome = chooseBiome(Math.random, biome);
      paint();
    });
  };
  paint();
  dlg.querySelector('#found-form').addEventListener('submit', (e) => {
    const name = new FormData(e.target).get('name').toString().trim() || randomTownName();
    localStorage.setItem(LAST_BIOME_KEY, biome);
    state = createTown({ name, biome, seed: newSeed(), now: Date.now(), data });
    save();
    closeDialog();
    selected = { x: 4, y: 4 };
    startGame();
    if (!state.townXp) toast('Tipp: Wähle eine Wiese und baue deinen ersten Hof.');
  });
  dlg.addEventListener('cancel', (e) => e.preventDefault());
}

function showOfflineReport(r, awaySec) {
  const ev = r.events;
  const produced = ev.find((e) => e.type === 'produced')?.amounts ?? {};
  const sold = ev.find((e) => e.type === 'sold');
  const hours = Math.floor(awaySec / 3600);
  const mins = Math.floor((awaySec % 3600) / 60);
  const prodLines = Object.entries(produced)
    .filter(([, v]) => v >= 0.5)
    .map(([k, v]) => `<li>${data.resources[k].icon} ${fmt0(v)} ${esc(data.resources[k].name.de)}</li>`)
    .join('') || '<li>Keine Produktion. Baue einen Hof oder ein Sägewerk.</li>';
  openDialog(`<form method="dialog" class="dlg-body">
    <h2 id="dlg-title">Willkommen zurück</h2>
    <p>Du warst ${hours} h ${mins} min weg. Deine Stadt hat in dieser Zeit gearbeitet.</p>
    <ul>${prodLines}</ul>
    <p>Verkauft für <strong>${fmt0(sold?.coins ?? 0)} 🪙</strong>.</p>
    ${r.capped ? `<p class="small">Die Obergrenze von ${data.economy.offline.baseCapHours} Stunden wurde erreicht. Länger weg zu sein bringt nicht mehr.</p>` : ''}
    <button type="submit" class="primary">Weiter</button>
  </form>`);
}

boot();

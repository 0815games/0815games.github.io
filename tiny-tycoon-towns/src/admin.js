// Betreiber-Bereich: Anmeldung, Spielerliste und Stadt-Editor.
// Sicherheit: Die Datenbankregeln lassen nur Admins fremde Städte lesen und schreiben.
// Dieser Code zeigt nur an, was die Regeln ohnehin erlauben.
import * as cloud from './cloud.js?v=20261125-eco1';
import { createLoginScene } from './world/login-scene.js?v=20261125-eco1';
import { checkTownName, townKey } from './town-names.js?v=20261125-eco1';
import { GRID, keyOf, gridSize, isUnlocked } from './domain/grid.js?v=20261125-eco1';

const HOUR = 3_600_000;
const TERRAIN_ICON = { meadow: '🌿', forest: '🌲', rock: '🪨', water: '🌊', sand: '🏖️' };

const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt0 = (n) => Math.round(Number(n) || 0).toLocaleString('de-DE');

let data = null;
let me = null;          // angemeldetes Konto
let players = [];       // [{ uid, town }]
let selectedUid = null; // Stadt im Editor
let draft = null;       // Bearbeitungskopie der gewählten Stadt
let tile = { x: 4, y: 4 };
let note = '';          // Statuszeile im Editor
let scene = null;

async function loadData() {
  const names = ['resources', 'buildings', 'economy'];
  const parts = await Promise.all(names.map((n) =>
    fetch(`data/${n}.json?v=20261125-eco1`).then((r) => {
      if (!r.ok) throw new Error(`data/${n}.json: HTTP ${r.status}`);
      return r.json();
    })));
  return Object.fromEntries(names.map((n, i) => [n, parts[i]]));
}

// ---------- Rückfrage im Spiel-Design (kein Browser-Dialog) ----------

function askConfirm(title, text, { ok = 'Ja', cancel = 'Abbrechen', danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = $('#admin-dlg');
    dlg.innerHTML = `<div class="dlg-body confirm">
      <h2 id="admin-dlg-title">${esc(title)}</h2>
      <p>${esc(text)}</p>
      <div class="confirm-row">
        <button type="button" class="ghost" id="confirm-no">${esc(cancel)}</button>
        <button type="button" class="${danger ? 'danger' : 'primary'}" id="confirm-yes">${esc(ok)}</button>
      </div>
    </div>`;
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      resolve(value);
      if (dlg.open) dlg.close();
    };
    dlg.querySelector('#confirm-yes').addEventListener('click', () => finish(true));
    dlg.querySelector('#confirm-no').addEventListener('click', () => finish(false));
    dlg.addEventListener('close', () => finish(false), { once: true });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) finish(false); }, { once: true });
    dlg.showModal();
    dlg.querySelector('#confirm-yes').focus();
  });
}

// ---------- Anmeldung ----------

function showAuth(msg = '') {
  $('#adminAuth').hidden = false;
  $('#adminApp').hidden = true;
  $('#admin-msg').textContent = msg;
  if (!scene) scene = createLoginScene($('#authCanvas'));
  scene.start();
}

function showApp() {
  scene?.stop();
  $('#adminAuth').hidden = true;
  $('#adminApp').hidden = false;
  $('#admin-who').textContent = me?.email ? `· ${me.email}` : '';
}

function showGate(text) {
  const gate = $('#admin-gate');
  gate.hidden = false;
  gate.innerHTML = `<p class="warn">${esc(text)}</p>`;
  $('#admin-list').innerHTML = '';
  $('#admin-editor').innerHTML = '';
}

$('#admin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await cloud.login(String(fd.get('email') ?? '').trim(), String(fd.get('password') ?? ''));
    // onUser() übernimmt ab hier.
  } catch (err) {
    btn.disabled = false;
    $('#admin-msg').textContent = cloud.authErrorDe(err);
  }
});

$('#admin-logout').addEventListener('click', () => cloud.logout());
$('#admin-refresh').addEventListener('click', () => loadPlayers());

cloud.onUser(async (user) => {
  if (!user) {
    me = null;
    selectedUid = null;
    draft = null;
    showAuth();
    return;
  }
  me = user;
  let admin = false;
  try {
    admin = await cloud.isAdmin(user.uid);
  } catch {
    admin = false;
  }
  showApp();
  if (!admin) {
    showGate('Dieses Konto hat keinen Betreiber-Zugang. Melde dich mit dem Betreiber-Konto an.');
    $('#admin-msg').textContent = '';
    return;
  }
  $('#admin-gate').hidden = true;
  if (!data) data = await loadData();
  await loadPlayers();
});

// ---------- Spielerliste ----------

async function loadPlayers() {
  try {
    players = await cloud.listSaves();
  } catch (err) {
    players = [];
    $('#admin-list').innerHTML = `<li class="warn small">${esc(cloud.dbErrorDe(err))}</li>`;
    return;
  }
  players.sort((a, b) => String(a.town.name).localeCompare(String(b.town.name), 'de'));
  renderList();
  if (selectedUid && !players.some((p) => p.uid === selectedUid)) {
    selectedUid = null;
    draft = null;
    $('#admin-editor').innerHTML = '<p class="muted">Diese Stadt gibt es nicht mehr.</p>';
  }
}

function renderList() {
  $('#admin-list').innerHTML = players.map(({ uid, town }) => `
    <li><button type="button" class="admin-player${uid === selectedUid ? ' is-on' : ''}" data-uid="${esc(uid)}" aria-pressed="${uid === selectedUid}">
      <strong>${esc(town.name)}</strong>${uid === me?.uid ? ' <span class="admin-tag">du</span>' : ''}
      <span class="small muted">Stufe ${Number(town.townLevel) || 1} · ${fmt0(town.coins)} 🪙</span>
    </button></li>`).join('') || '<li class="muted small">Noch keine Städte.</li>';
}

$('#admin-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-uid]');
  if (!btn) return;
  selectPlayer(btn.dataset.uid);
});

function selectPlayer(uid) {
  const entry = players.find((p) => p.uid === uid);
  if (!entry) return;
  selectedUid = uid;
  draft = structuredClone(entry.town);
  tile = { x: 4, y: 4 };
  note = '';
  renderList();
  renderEditor();
}

// ---------- Editor ----------

function renderEditor() {
  const el = $('#admin-editor');
  if (!draft || !data) {
    el.innerHTML = '<p class="muted">Wähle links eine Stadt.</p>';
    return;
  }
  const size = gridSize(draft.townLevel, data);
  const res = Object.keys(data.resources);
  const { x, y } = tile;
  const t = draft.tiles[keyOf(x, y)] ?? { terrain: 'meadow', building: null };
  const bId = t.building?.id ?? '';
  const bDef = bId ? data.buildings[bId] : null;
  const maxLevel = bDef?.maxLevel ?? 1;
  const buildingOptions = ['<option value="">— leer —</option>']
    .concat(Object.entries(data.buildings).map(([id, d]) =>
      `<option value="${id}" ${id === bId ? 'selected' : ''}>${esc(d.icon)} ${esc(d.name.de)}</option>`))
    .join('');

  let grid = '';
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const tt = draft.tiles[keyOf(gx, gy)];
      const open = isUnlocked(gx, gy, draft.townLevel, data);
      const icon = tt?.building ? data.buildings[tt.building.id]?.icon ?? '?' : (TERRAIN_ICON[tt?.terrain] ?? '·');
      const on = gx === x && gy === y;
      grid += `<button type="button" class="admin-tile${open ? '' : ' is-closed'}${on ? ' is-on' : ''}" data-act="pick" data-x="${gx}" data-y="${gy}" aria-pressed="${on}" aria-label="Feld ${gx + 1}, ${gy + 1}${open ? '' : ', gesperrt'}">${icon}</button>`;
    }
  }

  const stockRows = res.map((r) => {
    const def = data.resources[r];
    const on = !!draft.sellEnabled?.[r];
    return `<div class="admin-row">
      <label>${def.icon} ${esc(def.name.de)}
        <input type="number" name="stock:${r}" min="0" max="1000000" step="1" value="${Number(draft.stock?.[r]) || 0}"></label>
      <label class="admin-check"><input type="checkbox" name="sell:${r}" ${on ? 'checked' : ''}> Verkauf</label>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="admin-editor-head">
      <div>
        <h2>${esc(draft.name)}</h2>
        <p class="small muted">Stufe ${draft.townLevel} · Raster ${size}×${size} · letzter Stand ${draft.lastTick ? new Date(draft.lastTick).toLocaleString('de-DE') : '–'}</p>
        <p class="small muted">UID: ${esc(selectedUid)}</p>
      </div>
    </div>

    <fieldset class="admin-box">
      <legend>Stadt</legend>
      <div class="admin-grid2">
        <label>Name <input name="name" maxlength="24" value="${esc(draft.name)}"></label>
        <label>Münzen <input type="number" name="coins" min="0" step="1" value="${Number(draft.coins) || 0}"></label>
        <label>Stadtlevel <input type="number" name="townLevel" min="1" max="12" step="1" value="${draft.townLevel}"></label>
        <label>Erfahrung <input type="number" name="townXp" min="0" step="1" value="${Number(draft.townXp) || 0}"></label>
        <label>Tutorial-Schritt <input type="number" name="tutorialStep" min="0" max="99" step="1" value="${Number(draft.tutorialStep) || 0}"></label>
      </div>
    </fieldset>

    <fieldset class="admin-box">
      <legend>Lager und Verkauf</legend>
      ${stockRows}
    </fieldset>

    <fieldset class="admin-box">
      <legend>Zeit und Händler</legend>
      <p class="small muted">Vorspulen setzt den letzten Stand zurück. Beim nächsten Laden produziert die Stadt die Zeit nach, bis zur üblichen Obergrenze.</p>
      <div class="admin-actions">
        <button type="button" data-act="time" data-hours="1">+1 h</button>
        <button type="button" data-act="time" data-hours="8">+8 h</button>
        <button type="button" data-act="time" data-hours="24">+24 h</button>
        <button type="button" data-act="merchant">Händler-Angebote neu</button>
      </div>
    </fieldset>

    <fieldset class="admin-box">
      <legend>Gebäude</legend>
      <div class="admin-tiles" style="grid-template-columns: repeat(${GRID}, 1fr)">${grid}</div>
      <p class="small">Feld ${x + 1}, ${y + 1}: ${TERRAIN_ICON[t.terrain] ?? ''} ${esc(t.terrain ?? '')}${isUnlocked(x, y, draft.townLevel, data) ? '' : ' · gesperrt'}</p>
      <div class="admin-grid2">
        <label>Gebäude <select name="building" ${bId === 'townHall' ? 'disabled' : ''}>${buildingOptions}</select></label>
        <label>Stufe <input type="number" name="level" min="1" max="${maxLevel}" step="1" value="${t.building?.level ?? 1}"></label>
      </div>
      <div class="admin-actions"><button type="button" data-act="apply-tile" class="primary" ${bId === 'townHall' ? 'disabled' : ''}>Feld übernehmen</button></div>
    </fieldset>

    <div class="admin-savebar">
      <button type="button" data-act="save" class="primary">Speichern</button>
      <button type="button" data-act="delete" class="danger">Stadt löschen</button>
      <p id="admin-note" class="small" role="status">${esc(note)}</p>
    </div>`;
}

function setNote(text) {
  note = text;
  const n = $('#admin-note');
  if (n) n.textContent = text;
}

/** Änderungen aus Eingabefeldern in die Bearbeitungskopie übernehmen (ohne neu zu zeichnen). */
$('#admin-editor').addEventListener('change', (e) => {
  if (!draft) return;
  const el = e.target;
  const name = el.name;
  const num = (min, max) => Math.min(max, Math.max(min, Math.round(Number(el.value) || 0)));
  if (name === 'name') {
    const v = String(el.value).trim();
    if (!v || v.length > 24) return setNote('Name: 1 bis 24 Zeichen.');
    draft.name = v;
  } else if (name === 'coins') draft.coins = num(0, 1e12);
  else if (name === 'townLevel') draft.townLevel = num(1, 12);
  else if (name === 'townXp') draft.townXp = num(0, 1e12);
  else if (name === 'tutorialStep') draft.tutorialStep = num(0, 99);
  else if (name.startsWith('stock:')) draft.stock[name.slice(6)] = num(0, 1000000);
  else if (name.startsWith('sell:')) draft.sellEnabled[name.slice(5)] = el.checked;
  else if (name === 'level' || name === 'building') return; // wird mit „Feld übernehmen“ gesetzt
  else return;
  setNote('Geändert, noch nicht gespeichert.');
  if (name === 'townLevel') renderEditor();
});

$('#admin-editor').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn || !draft) return;
  const act = btn.dataset.act;
  if (act === 'pick') {
    tile = { x: Number(btn.dataset.x), y: Number(btn.dataset.y) };
    renderEditor();
    return;
  }
  if (act === 'time') {
    draft.lastTick = Number(draft.lastTick) - Number(btn.dataset.hours) * HOUR;
    setNote(`Um ${btn.dataset.hours} h vorgespult. Noch nicht gespeichert.`);
    return;
  }
  if (act === 'merchant') {
    draft.merchant = { dateKey: draft.merchant?.dateKey ?? '', bought: {} };
    setNote('Händler-Angebote zurückgesetzt. Noch nicht gespeichert.');
    return;
  }
  if (act === 'apply-tile') {
    const sel = document.querySelector('select[name=building]').value;
    const lvl = Math.round(Number(document.querySelector('input[name=level]').value) || 1);
    const k = keyOf(tile.x, tile.y);
    if (!draft.tiles[k]) draft.tiles[k] = { terrain: 'meadow', building: null };
    if (!sel) {
      draft.tiles[k].building = null;
    } else {
      const max = data.buildings[sel].maxLevel ?? 1;
      draft.tiles[k].building = { id: sel, level: Math.min(max, Math.max(1, lvl)) };
    }
    setNote('Feld geändert. Noch nicht gespeichert.');
    renderEditor();
    return;
  }
  if (act === 'save') {
    btn.disabled = true;
    try {
      // Stadtnamen bleiben eindeutig: bei Umbenennung zuerst den neuen Namen sichern.
      const before = players.find((p) => p.uid === selectedUid)?.town?.name;
      const check = checkTownName(draft.name);
      if (!check.ok) {
        setNote(check.reason);
        btn.disabled = false;
        return;
      }
      if (before && check.key !== townKey(before)) {
        const renamed = await cloud.renameTownName(selectedUid, before, check.name);
        if (!renamed) {
          setNote('Dieser Stadtname ist schon vergeben.');
          btn.disabled = false;
          return;
        }
      }
      draft.name = check.name;
      draft.adminEditedAt = Date.now(); // Spieler bekommt dadurch einen Hinweis zum Neuladen
      await cloud.saveTown(selectedUid, draft);
      const entry = players.find((p) => p.uid === selectedUid);
      if (entry) entry.town = structuredClone(draft);
      renderList();
      setNote('Gespeichert.');
    } catch (err) {
      setNote(cloud.dbErrorDe(err));
    } finally {
      btn.disabled = false;
    }
    return;
  }
  if (act === 'delete') {
    if (!(await askConfirm('Stadt löschen?', `„${draft.name}“ wird gelöscht, auch in der Cloud.`, { ok: 'Ja, löschen', danger: true }))) return;
    try {
      await cloud.deleteTown(selectedUid);
      players = players.filter((p) => p.uid !== selectedUid);
      selectedUid = null;
      draft = null;
      renderList();
      $('#admin-editor').innerHTML = '<p class="muted">Stadt gelöscht. Wähle links eine andere.</p>';
    } catch (err) {
      setNote(cloud.dbErrorDe(err));
    }
  }
});

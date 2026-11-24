// UI layer: renders the state and forwards player input to the pure domain.
// No game rules live here. Firebase is only touched through ./cloud.js.
import {
  createTown, newSeed, chooseBiome, placeBuilding, upgradeBuilding,
  toggleSell, buyOffer, advance, hydrateTown, setTutorialStep,
} from './domain/engine.js?v=20261124-sitz14';
import {
  productionMultiplier, ratePerMin, buildCost, storageCap, classOf,
} from './domain/economy.js?v=20261124-sitz14';
import { GRID, keyOf, isUnlocked, gridSize } from './domain/grid.js?v=20261124-sitz14';
import { merchantOffers, localDateKey } from './domain/merchant.js?v=20261124-sitz14';
import { RELEASED_PATCHES, OPEN_ITEMS } from './patch-notes.mjs?v=20261124-sitz14';
const SEEN_NOTES_KEY = 'ttt:notes-seen';
import { withTimeout } from './async-util.js?v=20261124-sitz14';
import { checkTownName } from './town-names.js?v=20261124-sitz14';
import { friendsShell, mountFriends } from './friends-ui.js?v=20261124-sitz14';
import { createBoard } from './world/board.js?v=20261124-sitz14';
import { createLoginScene } from './world/login-scene.js?v=20261124-sitz14';
import { TUTORIAL_STEPS, HELP_SECTIONS } from './tutorial.js?v=20261124-sitz14';
import { createVersionUI } from './version-ui.mjs?v=20261124-sitz14';

const BUILD = '20261124-sitz14';
console.info(`Tiny Tycoon Towns ${BUILD}`);
const LAST_BIOME_KEY = 'ttt.lastBiome';
const LOCAL_KEY = (uid) => `ttt.save.v1.${uid}`;
const OFFLINE_DIALOG_MS = 60_000;
const LOCAL_SAVE_MS = 5_000;
const CLOUD_SAVE_MS = 60_000;
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
let cloud = null;          // ./cloud.js, loaded after the data
let uid = null;            // signed-in user, null when signed out
let state = null;          // current town, null until loaded or founded
let selected = { x: 4, y: 4 };
let popupOpen = false;     // Feld-Popup sichtbar
let buildIdx = 0;          // gezeigte Bauoption im Popup
let lastSelKey = '';       // Feld, zu dem buildIdx gehört

/** Schreibt Inhalt ins Popup und zeigt es (für Meldungen wie Laden, Fehler, Sitzung). */
function setPanelHtml(html) {
  const p = $('#panel');
  p.innerHTML = html;
  p.hidden = false;
}
let cloudDirty = false;    // local change not yet confirmed by the cloud
let cloudPending = false;  // a cloud write is in flight
let lastCloudAt = 0;
let currentUser = null;    // Firebase user object while signed in
let remoteLoaded = false;  // true once the cloud copy was read successfully; no writes before that
let remoteRetryPending = false;
let board = null;          // Weltansicht (canvas), see ./world/board.js
let loginScene = null;     // animated backdrop of the sign-in screen
let versionGate = null;    // update gate (see ./version-ui.mjs and docs/ADR-update-gate.md)
let connected = true;      // Realtime Database connection, from .info/connected
const REMOTE_TIMEOUT_MS = 10_000;

// ---------- Boot and account ----------

async function loadData() {
  const names = ['resources', 'biomes', 'buildings', 'economy', 'merchant'];
  const parts = await Promise.all(names.map((n) =>
    fetch(`data/${n}.json?v=20261124-sitz14`).then((r) => {
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

async function boot() {
  // This build must be confirmed current before the game starts (docs/ADR-update-gate.md).
  // While the check runs, or after it failed, the release overlay holds the screen.
  try {
    versionGate = createVersionUI({
      document,
      window,
      safety: versionSafety,
      beforeReload: () => { if (state) saveLocal(); },
    });
  } catch (e) {
    showFatal(`Versionsprüfung nicht möglich (${e.message}). Bitte Seite neu laden.`);
    return;
  }
  await versionGate.start();
  try {
    data = await loadData();
  } catch (e) {
    showFatal(`Spieldaten konnten nicht geladen werden. Bitte über einen Webserver öffnen. (${e.message})`);
    return;
  }
  bindStatic();
  setInterval(tick, 1000);
  setInterval(cloudTick, LOCAL_SAVE_MS);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushNow(); });
  window.addEventListener('pagehide', flushNow);
  window.addEventListener('online', updateSync);
  window.addEventListener('offline', updateSync);

  try {
    cloud = await import('./cloud.js?v=20261124-sitz14');
  } catch {
    showFatal('Das Konto-System konnte nicht geladen werden. Ohne Anmeldung lässt sich nicht spielen. Bitte Verbindung prüfen und neu laden.');
    return;
  }
  cloud.onConnected((on) => { connected = on; updateSync(); });
  cloud.onUser(onUser);
}

/** Reads the cloud copy with a time limit. Never throws; reports the outcome instead. */
async function fetchRemote(u) {
  try {
    const raw = await withTimeout(cloud.loadTown(u), REMOTE_TIMEOUT_MS, 'Cloud-Lesen');
    return { ok: true, remote: raw ? hydrateTown(raw) : null };
  } catch (error) {
    return { ok: false, error };
  }
}

function cloudErrorText(error) {
  if (error?.code === 'timeout') {
    return 'Die Cloud antwortet nicht (Zeitlimit). Prüfe deine Verbindung oder Werbeblocker und versuche es erneut.';
  }
  return `${cloud.dbErrorDe(error)} (${error?.code ?? error?.message ?? 'unbekannt'})`;
}

/** Entry point for every sign-in change. Errors while showing the town become a visible message. */
async function onUser(user) {
  try {
    await enterAccount(user);
  } catch (error) {
    console.error('Anzeige des Spielstands fehlgeschlagen:', error);
    showRetry(`Der Spielstand konnte nicht angezeigt werden (${error?.message ?? 'unbekannter Fehler'}).`);
  }
}

async function enterAccount(user) {
  if (!user) {
    if (adminUnwatch) adminUnwatch();
    adminUnwatch = null;
    adminChanged = false;
    uid = null;
    currentUser = null;
    state = null;
    remoteLoaded = false;
    releaseCurrentSession();
    endTutorial();
    renderSignedOut();
    showLoginScreen('login');
    return;
  }
  hideLoginScreen();
  closeDialog();
  if (uid === user.uid && state) return; // token refresh, nothing to load
  if (activeUid !== user.uid) {
    if (activeUid) releaseCurrentSession(); // anderes Konto: alte Sitzung freigeben
    currentUser = user;
    uid = null;
    state = null;
    const free = await acquireSession(user.uid);
    if (!free) return; // Hinweis steht bereits im Panel, hier wird nichts geladen oder gespeichert
  }
  currentUser = user;
  uid = user.uid;
  remoteLoaded = false;
  showLoading('Verbinde mit deinem Spielstand …');

  const local = loadLocal(uid);
  const res = await fetchRemote(uid);
  if (!res.ok) {
    console.error('Spielstand aus der Cloud nicht geladen:', res.error);
    // Kein Spielen ohne bestätigten Cloud-Stand: kein Offline-Start, auch nicht mit lokalem Stand.
    // Der lokale Stand bleibt unangetastet als Sicherung.
    showRetry(cloudErrorText(res.error));
    return;
  }

  remoteLoaded = true;
  const remote = res.remote;
  watchAdminChanges(uid, remote?.adminEditedAt);
  const candidates = [remote, local].filter(Boolean).sort((a, b) => b.lastTick - a.lastTick);
  if (!candidates.length) {
    state = null;
    showLoading('Gründe deine Stadt, sobald du bereit bist.');
    showFounding();
    return;
  }
  state = candidates[0];
  claimExistingName(uid, state.name);
  // A newer local copy that the cloud does not have yet must be pushed.
  cloudDirty = state === local && (!remote || local.lastTick > remote.lastTick);
  lastCloudAt = 0;
  startGame();
}

/** Tries the cloud read again after an offline start. The newer copy wins. */
async function retryRemote() {
  if (remoteLoaded || remoteRetryPending || !uid || !state) return;
  remoteRetryPending = true;
  const res = await fetchRemote(uid);
  remoteRetryPending = false;
  if (!res.ok || !uid || !state) return; // still unreachable, the next tick tries again
  remoteLoaded = true;
  const remote = res.remote;
  watchAdminChanges(uid, remote?.adminEditedAt);
  if (remote && remote.lastTick > state.lastTick) {
    state = remote;
    cloudDirty = false;
    renderAll();
    toast('Neuerer Stand aus der Cloud übernommen.');
  } else {
    cloudDirty = true;
  }
  updateSync();
}

function showLoading(text) {
  setPanelHtml(`<p class="muted">${esc(text)}</p>`);
}

function showRetry(text) {
  setPanelHtml(`<p class="warn">${esc(text)}</p>
    <p><button type="button" id="retry-load" class="primary">Erneut versuchen</button></p>`);
  $('#retry-load').addEventListener('click', () => {
    if (!currentUser) return;
    uid = null;
    onUser(currentUser);
  });
}

// Unhandled errors show up as a message instead of a silent freeze.
window.addEventListener('error', (e) => {
  console.error(e.error ?? e.message);
  toast(`Fehler: ${e.message ?? 'unbekannt'}`, 'error');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error(e.reason);
  toast(`Fehler: ${e.reason?.message ?? e.reason ?? 'unbekannt'}`, 'error');
});

function renderSignedOut() {
  $('#logout-btn').hidden = true;
  $('#sync').textContent = '';
  $('#town-name').textContent = 'Tiny Tycoon Towns';
  $('#town-meta').textContent = 'Bitte anmelden, um zu spielen.';
  board?.destroy();
  board = null;
  $('#board').innerHTML = '';
  $('#stock').innerHTML = '';
  setPanelHtml('');
}

function showFatal(text, { quiet = false } = {}) {
  if (!quiet) setPanelHtml(`<p class="warn">${esc(text)}</p>`);
  else setPanelHtml(`<p class="muted">${esc(text)}</p>`);
}

// ---------- Saving ----------

function loadLocal(u) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(u));
    return raw ? hydrateTown(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveLocal() {
  if (!state || !uid || sessionLost || adminChanged) return;
  try {
    localStorage.setItem(LOCAL_KEY(uid), JSON.stringify(state));
  } catch {
    toast('Lokales Speichern nicht möglich. Ist der Speicher des Browsers voll?', 'error');
  }
}

function cloudSave() {
  if (!state || !uid || !cloudDirty || cloudPending || !remoteLoaded || sessionLost || adminChanged) return;
  const sentUid = uid;
  const snapshot = JSON.parse(JSON.stringify(state));
  cloudDirty = false;
  cloudPending = true;
  updateSync();
  cloud.saveTown(sentUid, snapshot)
    .then(() => {
      lastCloudAt = Date.now();
      // Profil für Freunde und Namenssuche. Fehler sind nicht kritisch, die Stadt ist gespeichert.
      cloud.saveProfile(sentUid, { townName: snapshot.name, townLevel: snapshot.townLevel }).catch(() => {});
    })
    .catch((e) => {
      cloudDirty = true;
      toast(cloud.dbErrorDe(e), 'error');
    })
    .finally(() => { cloudPending = false; updateSync(); });
}

/** Runs every few seconds: local copy always, cloud copy at most once a minute. */
function cloudTick() {
  saveLocal();
  if (!remoteLoaded) retryRemote();
  if (cloudDirty && Date.now() - lastCloudAt >= CLOUD_SAVE_MS) cloudSave();
  updateSync();
}

function flushNow() {
  saveLocal();
  if (cloudDirty) cloudSave();
}

function updateSync() {
  const el = $('#sync');
  if (!uid) { el.textContent = ''; return; }
  let text;
  if (!navigator.onLine) text = 'Offline · lokal gesichert';
  else if (!connected) text = 'Keine Verbindung zur Cloud · lokal gesichert';
  else if (!remoteLoaded) text = 'Cloud noch nicht gelesen · lokal gesichert';
  else if (cloudPending) text = 'Speichert in der Cloud …';
  else if (cloudDirty) text = 'Änderungen warten auf Cloud-Speicherung';
  else text = 'In der Cloud gespeichert';
  el.textContent = text;
}

/** Sign-in screen: the first thing a visitor sees. The game only appears after sign-in. */
function showLoginScreen(mode, msg = '') {
  const screen = $('#authScreen');
  const isLogin = mode === 'login';
  $('#loading').inert = true;
  screen.hidden = false;
  $('#auth-card').innerHTML = `<form id="auth-form" class="auth-form" novalidate>
    <img class="auth-card-logo" src="icons/logo.png" alt="Tiny Tycoon Towns" width="220">
    <h2 id="auth-title">${isLogin ? 'Anmelden' : 'Konto erstellen'}</h2>
    <p class="small">Deine Stadt wird in der Cloud gespeichert. Mit demselben Konto spielst du auf jedem Gerät weiter.</p>
    <label>E-Mail<input name="email" type="email" autocomplete="email" required></label>
    <label>Passwort (mindestens 6 Zeichen)
      <input name="password" type="password" minlength="6" required
        autocomplete="${isLogin ? 'current-password' : 'new-password'}"></label>
    <p id="auth-msg" class="warn small" role="alert">${esc(msg)}</p>
    <button type="submit" class="primary">${isLogin ? 'Anmelden' : 'Konto erstellen'}</button>
    <button type="button" id="auth-switch" class="ghost">${isLogin ? 'Neu hier? Konto erstellen' : 'Schon registriert? Anmelden'}</button>
  </form>`;
  $('#auth-switch').addEventListener('click', () => showLoginScreen(isLogin ? 'register' : 'login'));
  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      if (isLogin) await cloud.login(email, password);
      else await cloud.register(email, password);
      // onUser() takes over from here and hides the sign-in screen.
    } catch (err) {
      btn.disabled = false;
      $('#auth-msg').textContent = cloud.authErrorDe(err);
    }
  });
  if (!loginScene) loginScene = createLoginScene($('#authCanvas'));
  loginScene.start();
  playIntro();
  $('#auth-card').querySelector('input[name=email]')?.focus({ preventScroll: true });
}

/** Intro einmal pro Seitenaufruf: Klick oder Taste überspringt, die Karte erscheint danach. */
let introStarted = false;
function playIntro() {
  if (introStarted) return;
  introStarted = true;
  const screen = $('#authScreen');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  screen.classList.add('intro-running');
  screen.classList.remove('intro-done');
  let timer = null;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    screen.removeEventListener('pointerdown', finish);
    window.removeEventListener('keydown', finish);
    const intro = $('#auth-intro');
    const introImg = intro?.querySelector('.auth-intro-logo');
    const target = screen.querySelector('#auth-card .auth-card-logo');
    // Das Logo fliegt vom Intro an seinen Platz auf der Karte. Das Karten-Logo bleibt bis dahin unsichtbar.
    const flight = !reduce && introImg && target ? flyLogo(introImg, target, screen) : null;
    if (flight) screen.classList.add('logo-flying');
    screen.classList.remove('intro-running');
    screen.classList.add('intro-done');
    intro?.remove();
    if (flight) {
      const land = () => {
        flight.ghost.remove();
        screen.classList.remove('logo-flying');
      };
      flight.finished.then(land, land);
    }
  };
  screen.addEventListener('pointerdown', finish);
  window.addEventListener('keydown', finish);
  timer = setTimeout(finish, reduce ? 300 : 3600);
}

/**
 * Kopie des Intro-Logos fliegt von seiner aktuellen Stelle an die Zielstelle und bleibt dort.
 * Liefert { ghost, finished } oder null, wenn nichts zu messen ist.
 */
function flyLogo(from, to, screen) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) return null;
  const ghost = from.cloneNode(false);
  ghost.removeAttribute('class');
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.cssText = `position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:auto;margin:0;transform-origin:0 0;z-index:2;pointer-events:none;filter:drop-shadow(0 12px 24px rgba(0,0,0,.45));`;
  screen.appendChild(ghost);
  const scale = b.width / a.width;
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const anim = ghost.animate(
    [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
    { duration: 900, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
  );
  return { ghost, finished: anim.finished };
}

function hideLoginScreen() {
  $('#authScreen').hidden = true;
  $('#loading').inert = false;
  loginScene?.stop();
}

/** Safety check for the update gate: reload only when nothing is lost. Returns 'ready' or a reason. */
function versionSafety() {
  const form = $('#auth-form');
  if (form && [...form.querySelectorAll('input')].some((el) => el.value)) return 'form';
  if ($('#dlg')?.open) return 'dialog';
  if (sessionLost) return 'dialog';
  if (state && (cloudDirty || cloudPending || (uid && !remoteLoaded))) return 'saving';
  return 'ready';
}

// ---------- Actions ----------

function dispatch(result, okMsg) {
  if (result.error) {
    toast(ERR_DE[result.error] ?? 'Aktion nicht möglich.', 'error');
    return;
  }
  state = result.state;
  cloudDirty = true;
  saveLocal();
  for (const e of result.events) {
    if (e.type === 'levelUp') toast(`Stadtlevel ${e.level} erreicht. Dein Raster wächst!`);
  }
  if (okMsg && !result.events.some((e) => e.type === 'levelUp')) toast(okMsg);
  renderAll();
}

function selectTile({ x, y }) {
  const key = `${x},${y}`;
  if (key !== lastSelKey) {
    lastSelKey = key;
    buildIdx = 0;
  }
  selected = { x, y };
  popupOpen = true;
  renderBoard();
  renderPanel();
  board?.focusTile(x, y);
}

function describeTile(x, y) {
  if (!state) return '';
  const tile = state.tiles[keyOf(x, y)];
  const b = tile.building;
  const bName = b ? data.buildings[b.id].name.de : '';
  const unlocked = isUnlocked(x, y, state.townLevel, data);
  return [
    `Feld ${x + 1}, ${y + 1}`,
    TERRAIN_DE[tile.terrain],
    unlocked ? '' : 'gesperrt',
    bName,
    b && b.id !== 'townHall' ? `Stufe ${b.level}` : '',
  ].filter(Boolean).join(', ');
}

function ensureBoard() {
  if (board || !state) return;
  board = createBoard($('#board'), {
    getSelected: () => selected,
    onSelect: selectTile,
    // Klick auf die Karte neben einem Feld schließt das Feld-Popup.
    onEmpty: () => {
      if (!popupOpen) return;
      popupOpen = false;
      renderPanel();
    },
    describe: describeTile,
    getModel: () => ({
      state,
      data,
      unlocked: (x, y) => isUnlocked(x, y, state.townLevel, data),
    }),
  });
}

function bindStatic() {
  // Enter wählt das markierte Feld: Bedienfeld öffnen.
  $('#board').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && state) {
      popupOpen = true;
      renderPanel();
    }
  });
  $('#panel').addEventListener('click', onPanelClick);
  $('#stock-btn').addEventListener('click', openStock);
  $('#stock-close').addEventListener('click', () => $('#stock-sheet').close());
  $('#stock-sheet').addEventListener('click', onPanelClick); // Händler: Kaufen
  // Klick auf den abgedunkelten Hintergrund schließt Dialoge (außer, wo eine Entscheidung nötig ist).
  for (const dlg of [$('#stock-sheet'), $('#dlg')]) {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg && dlg.dataset.persist !== '1') dlg.close();
    });
  }
  // Escape schließt zuerst den offenen Dialog, sonst das Feld-Popup.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !popupOpen || $('#dlg')?.open || $('#stock-sheet').open) return;
    popupOpen = false;
    renderPanel();
  });
  $('#stock').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sell]');
    if (!btn || !state) return;
    dispatch(toggleSell(state, { resource: btn.dataset.sell }));
  });
  $('#feld-btn').addEventListener('click', showFieldNotes);
  $('#logout-btn').addEventListener('click', askLogout);
  $('#help-btn').addEventListener('click', showHelp);
  $('#friends-btn').addEventListener('click', openFriends);
  $('#visit-exit').addEventListener('click', endVisit);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && visit) endVisit(); });
  // Menü oben rechts: öffnet und schließt die Schaltflächen Hilfe, Feldnotizen, Neu beginnen, Abmelden.
  const menuBtn = $('#menu-btn');
  const menuList = $('#menu-list');
  const setMenu = (open) => {
    menuList.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(menuList.hidden);
  });
  menuList.addEventListener('click', (e) => {
    if (e.target.closest('button')) setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!menuList.hidden && !e.target.closest('.hud')) setMenu(false);
  });
  $('#reset-btn').addEventListener('click', async () => {
    if (!state || !uid) return;
    const yes = await askConfirm('Neu beginnen?', 'Die aktuelle Stadt wird gelöscht, auch in der Cloud.', { ok: 'Ja, neu beginnen', danger: true });
    if (!yes || !state || !uid) return;
    const doomed = uid;
    localStorage.removeItem(LOCAL_KEY(doomed));
    cloud.deleteTown(doomed).catch((e) => toast(cloud.dbErrorDe(e), 'error'));
    state = null;
    cloudDirty = false;
    selected = { x: 4, y: 4 };
    showFounding();
  });
}

function onPanelClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn || btn.disabled || !state) return;
  const { action, id, index } = btn.dataset;
  const { x, y } = selected;
  if (action === 'build') dispatch(placeBuilding(state, { x, y, buildingId: id }, ctx()), 'Gebaut.');
  if (action === 'upgrade') dispatch(upgradeBuilding(state, { x, y }, ctx()), 'Aufgewertet.');
  if (action === 'buy') dispatch(buyOffer(state, { index: Number(index) }, ctx()), 'Gekauft. Eberhard nickt zufrieden.');
  if (action === 'close') {
    popupOpen = false;
    renderPanel();
  }
  if (action === 'cycle') {
    const count = Object.values(data.buildings).filter((d) => !d.fixed).length;
    buildIdx = (buildIdx + Number(btn.dataset.dir) + count) % count;
    renderPanel();
  }
}

function openStock() {
  renderStock();
  const sheet = $('#stock-sheet');
  if (!sheet.open) sheet.showModal();
}

// ---------- Game loop ----------

function startGame() {
  versionGate?.afterGame();
  endTutorial();
  const before = state.lastTick;
  const now = Date.now();
  const r = advance(state, now, ctx());
  state = r.state;
  saveLocal();
  if (now - before >= OFFLINE_DIALOG_MS) showOfflineReport(r, (now - before) / 1000);
  renderAll();
  updateSync();
  $('#logout-btn').hidden = false;
  if (state.townXp === 0) {
    toast('Tipp: Wähle eine Wiese und baue deinen ersten Hof.');
  }
  // Nach einem Update einmal die Neuerungen zeigen. Danach (oder bei Neuinstallation) das Tutorial.
  if (!showWhatsNewIfUpdated()) maybeStartTutorial();
}

/** Einmal pro Browser pro Version. Liefert true, wenn der Dialog offen ist. */
function showWhatsNewIfUpdated() {
  let seen = null;
  try {
    seen = localStorage.getItem(SEEN_NOTES_KEY);
    localStorage.setItem(SEEN_NOTES_KEY, BUILD);
  } catch { /* Ohne Speicher gibt es keinen Hinweis, das Spiel läuft trotzdem. */ }
  // Neuinstallation (kein Eintrag) oder dieselbe Version: nichts anzeigen.
  if (!seen || seen === BUILD) return false;
  const entry = RELEASED_PATCHES.find((p) => p.build === BUILD);
  if (!entry) return false;
  const items = entry.items.map((it) => `<li>${esc(it.de)}</li>`).join('');
  openDialog(`<div class="dlg-body help">
    <h2 id="dlg-title">Neu in dieser Version</h2>
    <p class="small muted">Version ${esc(BUILD)} · ${esc(entry.date)}</p>
    <ul>${items}</ul>
    <p class="row"><button type="button" id="whatsnew-ok" class="primary">Verstanden</button></p>
  </div>`);
  $('#whatsnew-ok').addEventListener('click', () => {
    closeDialog();
    maybeStartTutorial();
  });
  $('#whatsnew-ok').focus();
  return true;
}

// ---------- Tutorial und Hilfe ----------
// Das Tutorial läuft einmal pro Konto. Fortschritt steht in state.tutorialStep.
// Hilfe (Knopf „Hilfe“) öffnet die Übersicht jederzeit erneut.
let tutorialIndex = null; // aktueller Schritt, null wenn keiner offen ist

function clearTutorialHighlight() {
  document.querySelectorAll('.tut-target').forEach((el) => el.classList.remove('tut-target'));
}

function endTutorial() {
  tutorialIndex = null;
  clearTutorialHighlight();
  const el = $('#tutorial');
  if (el) {
    el.hidden = true;
    el.innerHTML = '';
  }
}

function saveTutorialStep(step) {
  if (!state) return;
  dispatch(setTutorialStep(state, Math.min(step, TUTORIAL_STEPS.length)));
}

function showTutorialStep(index) {
  const step = TUTORIAL_STEPS[index];
  if (!step || !state) return endTutorial();
  tutorialIndex = index;
  clearTutorialHighlight();
  if (step.target) document.querySelector(step.target)?.classList.add('tut-target');
  const last = index === TUTORIAL_STEPS.length - 1;
  const el = $('#tutorial');
  el.hidden = false;
  el.innerHTML = `<section class="tut-card" role="dialog" aria-labelledby="tut-title">
    <p class="small muted">Schritt ${index + 1} von ${TUTORIAL_STEPS.length}</p>
    <h2 id="tut-title">${esc(step.title)}</h2>
    <p>${esc(step.text)}</p>
    <p class="row">
      <button type="button" id="tut-skip" class="ghost">Überspringen</button>
      <button type="button" id="tut-next" class="primary">${last ? 'Fertig' : 'Weiter'}</button>
    </p>
  </section>`;
  $('#tut-next').addEventListener('click', () => {
    if (last) {
      saveTutorialStep(TUTORIAL_STEPS.length);
      endTutorial();
    } else {
      saveTutorialStep(index + 1);
      showTutorialStep(index + 1);
    }
  });
  $('#tut-skip').addEventListener('click', () => {
    saveTutorialStep(TUTORIAL_STEPS.length);
    endTutorial();
  });
  $('#tut-next').focus({ preventScroll: true });
}

/** Hilfe-Übersicht: alle Abschnitte, jederzeit über den Hilfe-Knopf. */
function showHelp() {
  const sections = HELP_SECTIONS.map((sec) => `<section>
      <h3>${esc(sec.title)}</h3>
      ${sec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    </section>`).join('');
  openDialog(`<div class="dlg-body help">
    <h2 id="dlg-title">Hilfe</h2>
    ${sections}
    <p class="row"><button type="button" id="help-close" class="primary">Schließen</button></p>
  </div>`);
  $('#help-close').addEventListener('click', closeDialog);
}

function maybeStartTutorial() {
  if (state && (state.tutorialStep ?? 0) < TUTORIAL_STEPS.length) showTutorialStep(state.tutorialStep ?? 0);
}

function tick() {
  if (!state) return;
  const coinsBefore = state.coins;
  const r = advance(state, Date.now(), ctx());
  state = r.state;
  cloudDirty = true;
  board?.gain(state.coins - coinsBefore);
  renderHud();
  updateStockNumbers();
}

// ---------- Rendering ----------

function renderAll() {
  renderHud();
  renderBoard();
  renderStock();
  renderPanel();
}

function renderHud() {
  if (!state) return;
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
  if (!state) return;
  ensureBoard();
  board?.redraw();
  const { x, y } = selected;
  $('#board').setAttribute('aria-label', `Spielfeld. Ausgewählt: ${describeTile(x, y)}`);
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
  if (!state) return;
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
  $('#merchant').innerHTML = merchantSection();
  updateStockNumbers();
}

function updateStockNumbers() {
  if (!state) return;
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
  if (!state) return;
  const panel = $('#panel');
  if (!popupOpen) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const { x, y } = selected;
  const tile = state.tiles[keyOf(x, y)];
  const unlocked = isUnlocked(x, y, state.townLevel, data);
  const b = tile.building;
  let html = `<div class="panel-head"><div><h2>Feld ${x + 1}, ${y + 1}</h2>
    <p class="muted small">${TERRAIN_DE[tile.terrain]}${unlocked ? '' : ' · gesperrt'}</p></div>
    <button type="button" data-action="close" class="ghost" aria-label="Fenster schließen">✕</button></div>`;

  if (!unlocked) {
    html += '<p>Dieses Feld ist noch im Nebel. Mit höherem Stadtlevel wird die Fläche größer.</p>';
  } else if (b?.id === 'townHall') {
    html += `<section><h3>${data.buildings.townHall.icon} Rathaus</h3>
      <p>Verkauft automatisch ${data.economy.sell.townHallThroughputPerMin} Einheiten pro Minute. Mehr Durchsatz gibt der Marktplatz.</p></section>`;
  } else if (b) {
    html += buildingDetails(b, x, y);
  } else {
    html += buildMenu(x, y);
  }
  panel.innerHTML = html;
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
    if (!ok) html += '<p class="small warn">Dir fehlen Münzen oder Material.</p>';
  } else {
    html += '<p class="small ok">Maximalstufe erreicht.</p>';
  }
  return `${html}</section>`;
}

/** Eine Bauoption je Ansicht. ‹ › blättert durch alle Gebäude. */
function buildMenu(x, y) {
  const entries = Object.entries(data.buildings).filter(([, d]) => !d.fixed);
  if (buildIdx >= entries.length) buildIdx = 0;
  const [id, d] = entries[buildIdx];
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
  return `<section>
    <div class="cycle">
      <button type="button" data-action="cycle" data-dir="-1" data-cycle aria-label="Vorherige Option">‹</button>
      <div class="opt">
        <div><strong>${d.icon} ${esc(d.name.de)}</strong> <span class="muted small">${buildIdx + 1} / ${entries.length}</span>
          <div class="meta">${fmt0(c.coins)} 🪙 · ${c.material.amount} ${esc(matName)}</div>
          <div class="meta">${meta}</div>
          ${locked ? `<div class="locked-note">Ab Stadtlevel ${d.unlockTownLevel}</div>` : ''}
          ${!locked && !affordable ? '<div class="locked-note">Dir fehlen Münzen oder Material</div>' : ''}
        </div>
        <button type="button" data-action="build" data-id="${id}" ${locked || !affordable ? 'disabled' : ''}>Bauen</button>
      </div>
      <button type="button" data-action="cycle" data-dir="1" data-cycle aria-label="Nächste Option">›</button>
    </div>
  </section>`;
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

/** Rückfrage vor dem Abmelden. Der Stand wird vorher gesichert. */
function askLogout() {
  openDialog(`<div class="dlg-body">
    <h2 id="dlg-title">Abmelden?</h2>
    <p>Deine Stadt wird vorher gesichert. Zum Weiterspielen meldest du dich wieder an.</p>
    <p class="row">
      <button type="button" id="logout-cancel">Abbrechen</button>
      <button type="button" id="logout-ok" class="primary">Abmelden</button>
    </p>
  </div>`);
  $('#logout-cancel').addEventListener('click', closeDialog);
  $('#logout-ok').addEventListener('click', async () => {
    closeDialog();
    flushNow();
    try { await cloud.logout(); } catch { toast('Abmelden fehlgeschlagen. Du bist noch angemeldet.', 'error'); }
  });
  $('#logout-cancel').focus();
}

// Eine Sitzung pro Konto, über alle Fenster und Geräte (Regeln: sessions/{uid}).
// Jedes Fenster hat eine eigene Kennung. Ein Herzschlag hält die Sitzung frisch.
// Die Kennung gilt pro Tab und überlebt Neuladen (sessionStorage), damit ein Reload das Konto nicht sperrt.
const SESSION_ID = (() => {
  try {
    const kept = sessionStorage.getItem('ttt:session-id');
    if (kept) return kept;
    const fresh = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('ttt:session-id', fresh);
    return fresh;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
})();
const HEARTBEAT_MS = 30_000;
const SESSION_TAKEN_TEXT = 'Dieses Konto ist gerade in einem anderen Fenster oder auf einem anderen Gerät geöffnet. Schließe das andere Fenster oder übernimm die Sitzung hier.';
const SESSION_LOST_TEXT = 'Dieses Konto wurde in einem anderen Fenster oder auf einem anderen Gerät übernommen. Hier wird nichts mehr gespeichert, bis du es hier übernimmst.';
let activeUid = null;       // Konto, dessen Sitzung dieses Fenster hält
let sessionLost = false;    // true, sobald ein anderes Fenster übernommen hat: nichts mehr speichern
let sessionUnwatch = null;
// Betreiber-Hinweis: Stadt wurde von außen geändert. Ab dann wird nichts mehr gespeichert, bis neu geladen wurde.
let adminChanged = false;
let adminKnownAt = 0;       // Zeitstempel der Betreiber-Änderung, den dieses Gerät kennt
let adminUnwatch = null;

function watchAdminChanges(forUid, remoteAt) {
  if (adminUnwatch) adminUnwatch();
  adminKnownAt = remoteAt ?? 0;
  adminUnwatch = cloud.watchAdminEdit(forUid, (at) => {
    if (at > adminKnownAt && !adminChanged) showAdminNotice();
  });
}

function showAdminNotice() {
  adminChanged = true;
  // Die lokale Sicherung wäre sonst neuer und würde die Änderung beim Neuladen überschreiben.
  try { localStorage.removeItem(LOCAL_KEY(uid)); } catch { /* ignorieren */ }
  const dlg = openDialog(`<div class="dlg-body confirm">
    <h2 id="dlg-title">Deine Stadt wurde geändert</h2>
    <p>Der Betreiber hat deine Stadt angepasst. Damit nichts überschrieben wird, lade das Spiel neu.</p>
    <div class="confirm-row">
      <button type="button" class="primary" id="admin-reload">Neu laden</button>
    </div>
  </div>`);
  dlg.dataset.persist = '1'; // Entscheidung erzwingen: nicht per Klick oder Escape schließen
  dlg.addEventListener('cancel', (e) => e.preventDefault());
  dlg.querySelector('#admin-reload').addEventListener('click', () => location.reload());
}
let heartbeatTimer = null;

/** Belegt die Sitzung für das Konto. Liefert true, wenn dieses Fenster spielen darf. */
async function acquireSession(sessionUid) {
  let ok = false;
  try {
    ok = await cloud.claimSession(sessionUid, SESSION_ID);
  } catch (error) {
    console.error('Sitzung nicht prüfbar:', error);
    showRetry(cloudErrorText(error));
    return false;
  }
  if (!ok) {
    showSessionTaken(sessionUid);
    return false;
  }
  activeUid = sessionUid;
  sessionLost = false;
  startSessionGuard(sessionUid);
  return true;
}

function startSessionGuard(sessionUid) {
  stopSessionGuard();
  sessionUnwatch = cloud.watchSession(sessionUid, SESSION_ID, () => onSessionLost(sessionUid));
  heartbeatTimer = setInterval(async () => {
    if (sessionLost || activeUid !== sessionUid) return;
    try {
      const ok = await cloud.claimSession(sessionUid, SESSION_ID);
      if (!ok) onSessionLost(sessionUid);
    } catch {
      // Offline: der nächste Herzschlag versucht es erneut. Verwaiste Sitzungen laufen nach 2 Minuten ab.
    }
  }, HEARTBEAT_MS);
}

function stopSessionGuard() {
  sessionUnwatch?.();
  sessionUnwatch = null;
  if (heartbeatTimer !== null) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function releaseCurrentSession() {
  const prev = activeUid;
  stopSessionGuard();
  activeUid = null;
  sessionLost = false;
  if (prev) cloud.releaseSession(prev, SESSION_ID).catch(() => { /* Ablauf nach 2 Minuten greift */ });
}

function onSessionLost(sessionUid) {
  if (sessionLost || activeUid !== sessionUid) return;
  sessionLost = true;
  stopSessionGuard();
  activeUid = null;
  setPanelHtml(`<p class="warn">${esc(SESSION_LOST_TEXT)}</p>`);
  openDialog(`<div class="dlg-body">
    <h2 id="dlg-title">Sitzung übernommen</h2>
    <p>${esc(SESSION_LOST_TEXT)}</p>
    <p class="row">
      <button type="button" id="lost-logout">Abmelden</button>
      <button type="button" id="lost-take" class="primary">Hier übernehmen</button>
    </p>
  </div>`);
  $('#dlg').addEventListener('cancel', (e) => e.preventDefault(), { once: true });
  $('#dlg').dataset.persist = '1'; // Entscheidung erzwingen: nicht per Klick daneben schließen
  $('#lost-take').addEventListener('click', () => takeOverSession(sessionUid));
  $('#lost-logout').addEventListener('click', async () => {
    closeDialog();
    try { await cloud.logout(); } catch { toast('Abmelden fehlgeschlagen.', 'error'); }
  });
}

function showSessionTaken(sessionUid) {
  setPanelHtml(`<p class="warn">${esc(SESSION_TAKEN_TEXT)}</p>
    <p class="row">
      <button type="button" id="session-take" class="primary">Hier übernehmen</button>
      <button type="button" id="session-retry">Erneut prüfen</button>
    </p>`);
  $('#session-take').addEventListener('click', () => takeOverSession(sessionUid));
  $('#session-retry').addEventListener('click', () => { uid = null; void onUser(currentUser); });
}

/** Übernimmt die Sitzung für dieses Fenster und lädt den Stand neu (der neuere Stand gewinnt). */
async function takeOverSession(sessionUid) {
  let ok = false;
  try {
    ok = await cloud.claimSession(sessionUid, SESSION_ID, { force: true });
  } catch (error) {
    toast(cloud.dbErrorDe(error), 'error');
    return;
  }
  if (!ok) return;
  closeDialog();
  activeUid = sessionUid;
  sessionLost = false;
  startSessionGuard(sessionUid);
  uid = null;
  state = null;
  void onUser(currentUser);
}

function openDialog(html) {
  const dlg = $('#dlg');
  dlg.dataset.persist = ''; // Standard: Klick daneben schließt
  dlg.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}

function closeDialog() {
  const dlg = $('#dlg');
  if (dlg.open) dlg.close();
}

/** Rückfrage im Spiel-Design (ersetzt den Browser-Dialog confirm). Resolve: true = Ja, false = Nein/Abbruch. */
function askConfirm(title, text, { ok = 'Ja', cancel = 'Abbrechen', danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = openDialog(`<div class="dlg-body confirm">
      <h2 id="dlg-title">${esc(title)}</h2>
      <p>${esc(text)}</p>
      <div class="confirm-row">
        <button type="button" class="ghost" id="confirm-no">${esc(cancel)}</button>
        <button type="button" class="${danger ? 'danger' : 'primary'}" id="confirm-yes">${esc(ok)}</button>
      </div>
    </div>`);
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      resolve(value);
      closeDialog();
    };
    dlg.querySelector('#confirm-yes').addEventListener('click', () => finish(true));
    dlg.querySelector('#confirm-no').addEventListener('click', () => finish(false));
    dlg.addEventListener('close', () => finish(false), { once: true });
    dlg.querySelector('#confirm-yes').focus();
  });
}

function randomTownName() {
  return TOWN_NAMES[Math.floor(Math.random() * TOWN_NAMES.length)];
}

function showFounding() {
  let biome = chooseBiome(Math.random, localStorage.getItem(LAST_BIOME_KEY));
  const dlg = openDialog('');
  dlg.dataset.persist = '1'; // Gründung: die Stadt muss angelegt werden
  const paint = () => {
    const b = data.biomes[biome];
    const names = (ids) => ids.map((r) => `${data.resources[r].icon} ${data.resources[r].name.de}`).join(', ');
    dlg.innerHTML = `<form method="dialog" id="found-form" class="dlg-body" novalidate>
      <h2 id="dlg-title">Willkommen in Tiny Tycoon Towns</h2>
      <p>Deine kleine Stadt wächst auch dann, wenn du nicht spielst. Dein Biom entscheidet, was du selbst herstellen kannst.</p>
      <div class="biome-card">
        <h3>${esc(b.name.de)}</h3>
        <p class="small"><strong>Reich:</strong> ${names(b.abundant)}</p>
        <p class="small"><strong>Karg:</strong> ${names(b.scarce)}</p>
        <button type="button" id="reroll">Anderes Biom würfeln</button>
      </div>
      <label>Stadtname<br><input name="name" id="town-input" value="${esc(randomTownName())}" maxlength="24"></label>
      <p id="found-msg" class="warn small" role="alert"></p>
      <button type="submit" class="primary">Stadt gründen (150 🪙)</button>
    </form>`;
    dlg.querySelector('#reroll').addEventListener('click', () => {
      biome = chooseBiome(Math.random, biome);
      paint();
    });
  };
  paint();
  dlg.querySelector('#found-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = dlg.querySelector('#found-msg');
    const check = checkTownName(new FormData(e.target).get('name')?.toString() ?? '');
    if (!check.ok) {
      msg.textContent = check.reason;
      return;
    }
    // Stadtnamen sind eindeutig: den Namen zuerst für dieses Konto sichern.
    msg.textContent = 'Prüfe den Namen …';
    let claimed = false;
    try {
      claimed = await cloud.claimTownName(uid, check.key);
    } catch (err) {
      msg.textContent = cloud.dbErrorDe(err);
      return;
    }
    if (!claimed) {
      msg.textContent = 'Dieser Name ist schon vergeben. Wähle einen anderen.';
      return;
    }
    const name = check.name;
    localStorage.setItem(LAST_BIOME_KEY, biome);
    state = createTown({ name, biome, seed: newSeed(), now: Date.now(), data });
    selected = { x: 4, y: 4 };
    closeDialog();
    cloudDirty = true;
    lastCloudAt = 0;
    startGame();
    cloudSave();
  });
  dlg.addEventListener('cancel', (e) => e.preventDefault());
}

// ---------- Besuch: Stadt eines Freundes, nur ansehen ----------
// Der Stand des Freundes wird nur im Speicher weitergerechnet. Er wird nie gespeichert,
// und auch der eigene Stand bleibt unberührt.
let visit = null; // { uid, model: { state }, board, timer }

async function startVisit(friendUid, friendName) {
  closeDialog();
  let raw;
  try {
    raw = await withTimeout(cloud.loadTown(friendUid), REMOTE_TIMEOUT_MS, 'Besuch laden');
  } catch (err) {
    toast(cloudErrorText(err), 'error');
    return;
  }
  if (!raw) {
    toast(`${friendName} hat noch keine Stadt gegründet.`, 'error');
    return;
  }
  endVisit();
  const town = hydrateTown(raw);
  const model = { state: advance(town, Date.now(), ctx()).state };
  visit = { uid: friendUid, model, board: null, timer: null };
  $('#visit-name').textContent = town.name;
  $('#visit').hidden = false;
  visit.board = createBoard($('#visit-board'), {
    getSelected: () => null,
    onSelect: () => {}, // nur ansehen
    describe: (x, y) => describeIn(model.state, x, y),
    getModel: () => ({
      state: model.state,
      data,
      unlocked: (x, y) => isUnlocked(x, y, model.state.townLevel, data),
    }),
  });
  updateVisitInfo();
  visit.timer = setInterval(() => {
    if (!visit || visit.model !== model) return;
    model.state = advance(model.state, Date.now(), ctx()).state;
    visit.board?.redraw();
    updateVisitInfo();
  }, 1000);
}

function endVisit() {
  if (!visit) return;
  clearInterval(visit.timer);
  visit.board?.destroy();
  visit = null;
  $('#visit').hidden = true;
}

function updateVisitInfo() {
  const st = visit?.model.state;
  if (!st) return;
  const count = Object.values(st.tiles).filter((t) => t.building).length;
  $('#visit-info').textContent = `Level ${st.townLevel} · 🪙 ${Math.floor(st.coins)} · 🏠 ${count} Gebäude`;
}

function describeIn(st, x, y) {
  const tile = st?.tiles[keyOf(x, y)];
  if (!tile) return '';
  const b = tile.building;
  return [`Feld ${x + 1}, ${y + 1}`, TERRAIN_DE[tile.terrain], b ? data.buildings[b.id].name.de : 'frei'].join(' · ');
}

/** Altbestand: Stadtnamen, die noch niemand beansprucht hat, für dieses Konto sichern. Vergebene bleiben unverändert. */
function claimExistingName(forUid, name) {
  const check = checkTownName(name);
  if (!check.ok) return;
  cloud.claimTownName(forUid, check.key).catch(() => {});
}

/** Freunde-Fenster: eigene Stadt, Code, Einladung, Anfragen, klappbare Liste. */
function openFriends() {
  if (!state || !uid) {
    toast('Melde dich an und lade deine Stadt, dann öffnen sich die Freunde.', 'error');
    return;
  }
  const count = (o) => Object.values(o).filter((t) => t.building).length;
  const info = {
    townName: state.name,
    level: state.townLevel,
    coins: Math.floor(state.coins),
    buildings: count(state.tiles),
  };
  const dlg = openDialog(friendsShell(info));
  const unmount = mountFriends(dlg, {
    me: uid,
    myName: () => state?.name ?? '',
    toast,
    confirm: askConfirm,
    visit: (friendUid, friendName) => startVisit(friendUid, friendName),
  });
  dlg.addEventListener('close', unmount, { once: true });
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

function showFieldNotes() {
  const list = (items) => items.map((it) => `<li>${esc(it.de)}<br><span class="small muted">${esc(it.en)}</span></li>`).join('');
  const patches = RELEASED_PATCHES.map((p) => `<h3>${esc(p.build)} · ${esc(p.date)}</h3><ul>${list(p.items)}</ul>`).join('');
  openDialog(`<form method="dialog" class="dlg-body">
    <h2 id="dlg-title">Feldnotizen</h2>
    <h3>Stand dieser Welle</h3>
    ${patches}
    <h3>Offen</h3>
    <ul>${list(OPEN_ITEMS)}</ul>
    <button type="submit" class="primary">Schließen</button>
  </form>`);
}

boot();

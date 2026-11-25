// UI layer: renders the state and forwards player input to the pure domain.
// No game rules live here. Firebase is only touched through ./cloud.js.
import {
  createTown, newSeed, chooseBiome, placeBuilding, upgradeBuilding,
  toggleSell, buyOffer, advance, hydrateTown, setTutorialStep, settleConvoyAction,
  plantField, removeField, renewField,
} from './domain/engine.js?v=20261125-bal1';
import { forestHealth, fishStock, fishingGround, soilOf, FULL } from './domain/economy.js?v=20261125-bal1';
import {
  checkPlacement, placementHint, fieldsOf, plantableNeighbours, fieldSlots,
} from './domain/placement.js?v=20261125-bal1';
import { startConvoy } from './domain/convoys.js?v=20261125-bal1';
import { tradeFormHtml, convoyListHtml, previewFor } from './trade-ui.js?v=20261125-bal1';
import {
  productionMultiplier, ratePerMin, buildCost, storageCap, classOf,
} from './domain/economy.js?v=20261125-bal1';
import { GRID, keyOf, isUnlocked, gridSize } from './domain/grid.js?v=20261125-bal1';
import { merchantOffers, localDateKey } from './domain/merchant.js?v=20261125-bal1';
import { RELEASED_PATCHES, OPEN_ITEMS } from './patch-notes.mjs?v=20261125-bal1';
import {
  PERKS, canFoundCharter, grantCharters, buyPerk, perkEffect, perkLevel, availableCharters, emptyCharter,
  applyCharterToData, reconcileCrowns,
} from './domain/charters.js?v=20261125-bal1';
const SEEN_NOTES_KEY = 'ttt:notes-seen';
import { withTimeout } from './async-util.js?v=20261125-bal1';
import { checkTownName } from './town-names.js?v=20261125-bal1';
import { friendsShell, mountFriends } from './friends-ui.js?v=20261125-bal1';
import { createBoard } from './world/board.js?v=20261125-bal1';
import { createLoginScene } from './world/login-scene.js?v=20261125-bal1';
import { TUTORIAL_STEPS, HELP_SECTIONS } from './tutorial.js?v=20261125-bal1';
import { createVersionUI } from './version-ui.mjs?v=20261125-bal1';
import { startAfkWatch, showAfkOverlay } from './afk.js?v=20261125-bal1';
import { fullResources, fillPercent } from './stock-dock.js?v=20261125-bal1';
import { nextRequestToShow, requestBadgeLabel } from './friend-requests.js?v=20261125-bal1';

const BUILD = '20261125-bal1';
console.info(`Tiny Tycoon Towns ${BUILD}`);
const LAST_BIOME_KEY = 'ttt.lastBiome';
const LOCAL_KEY = (uid) => `ttt.save.v1.${uid}`;
const OFFLINE_DIALOG_MS = 60_000;
const LOCAL_SAVE_MS = 5_000;
const CLOUD_SAVE_MS = 60_000;
const TOWN_NAMES = ['Eichenhain', 'Kieselau', 'Sonnenbrück', 'Mühlbach', 'Fuchsfurt', 'Silberwiese', 'Nebelhorn', 'Tannenbach'];
const TERRAIN_DE = { meadow: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', sand: 'Strand', mountain: 'Berg' };
const CLASS_DE = { abundant: 'Reich (×1,5)', neutral: 'neutral', scarce: 'Karg (×0,25)' };
const MOOD_DE = {
  greedy: 'Eberhard reibt sich die Hände: Gute Ware hat ihren Preis.',
  friendly: 'Eberhard winkt freundlich: Für dich habe ich etwas Besonderes.',
  chatty: 'Eberhard plaudert: Stell dir vor, was ich unterwegs gesehen habe!',
};
const ERR_DE = {
  noPartner: 'Diese Partnerstadt gibt es nicht.',
  badDirection: 'Wähle Verkaufen oder Kaufen.',
  badQuantity: 'Die Menge muss zwischen 10 und 100 liegen.',
  noStock: 'So viel hast du nicht auf Lager.',
  convoyLimit: 'Es sind schon zwei Konvois unterwegs. Warte, bis einer ankommt.',
  noConvoy: 'Diesen Konvoi gibt es nicht.',
  alreadySettled: 'Dieser Konvoi ist schon abgerechnet.',
  notArrived: 'Dieser Konvoi ist noch unterwegs.',
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
  terrain: 'Dafür ist dieses Gelände nicht geeignet.',
  near: 'Das passende Gelände fehlt direkt daneben.',
  fieldOccupied: 'Auf diesem Feld liegt ein Acker.',
  alreadyField: 'Hier liegt schon ein Feld.',
  notNextToFarm: 'Felder legst du direkt neben dem Hof an.',
  noFieldSlot: 'Der Hof hat keinen freien Feldplatz. Mehr Plätze gibt es mit einer höheren Stufe.',
  noFarm: 'Hier steht kein Hof.',
  noField: 'Hier liegt kein Feld.',
  soilFine: 'Der Boden ist noch in Ordnung.',
};

const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => nf0.format(Math.floor(n));
const fmtRate = (n) => nf2.format(n);

let data = null;
let baseData = null; // Spieldaten ohne Freibrief-Perks, z. B. für Besuche
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
  const names = ['resources', 'biomes', 'buildings', 'economy', 'merchant', 'npcs'];
  const parts = await Promise.all(names.map((n) =>
    fetch(`data/${n}.json?v=20261125-bal1`).then((r) => {
      if (!r.ok) throw new Error(`data/${n}.json: HTTP ${r.status}`);
      return r.json();
    })));
  return Object.fromEntries(names.map((n, i) => [n, parts[i]]));
}

function ctx(d = data) {
  return {
    data: d,
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
    baseData = await loadData();
    refreshData();
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
    cloud = await import('./cloud.js?v=20261125-bal1');
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
    charter = null;
    charterLoaded = false;
    refreshData();
    if (adminUnwatch) adminUnwatch();
    adminUnwatch = null;
    adminChanged = false;
    uid = null;
    currentUser = null;
    state = null;
    remoteLoaded = false;
    stopRequestWatch();
    releaseCurrentSession();
    endTutorial();
    renderSignedOut();
    if (afkStop) { afkStop(); afkStop = null; }
    const notice = nextLoginNotice;
    nextLoginNotice = null;
    showLoginScreen('login', notice && !notice.afk ? notice.text : '');
    if (notice?.afk) showAfkOverlay(notice.text);
    return;
  }
  hideLoginScreen();
  closeDialog();
  if (!afkStop) afkStop = startAfkWatch(onAfkTimeout);
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
  startRequestWatch(uid);
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
  loadCharterFor(uid);
  const candidates = [remote, local].filter(Boolean).sort((a, b) => b.lastTick - a.lastTick);
  if (!candidates.length) {
    state = null;
    showLoading('Gründe deine Stadt, sobald du bereit bist.');
    showFounding();
    return;
  }
  state = candidates[0];
  claimExistingName(uid, state);
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
    <a class="auth-admin-link" href="admin.html">Betreiber-Bereich</a>
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
    { duration: 1100, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' },
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

// iOS Safari: Pinch-Zoom der Seite unterdrücken, Karte bleibt davon ausgenommen (eigene Pointer-Events).
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => { if (!e.target.closest?.('.board, .visit-board')) e.preventDefault(); }, { passive: false });
}
document.addEventListener('dblclick', (e) => { if (!e.target.closest?.('.board, .visit-board')) e.preventDefault(); }, { passive: false });

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
  // Kein Zentrieren der Karte bei Klick oder Tipp: das Feld bleibt, wo es ist.
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
  $('#dock-toggle').addEventListener('click', () => setDockOpen($('#dock-body').hidden));
  setDockOpen(window.matchMedia?.('(min-width: 900px)').matches ?? false); // Desktop offen, Mobile eingeklappt
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
  $('#charter-btn').addEventListener('click', openCharters);
  $('#trade-btn').addEventListener('click', openTrade);
  $('#visit-exit').addEventListener('click', endVisit);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && visit) endVisit(); });
  // Menü oben rechts: öffnet und schließt die Schaltflächen Hilfe, Stadtchronik, Neu beginnen, Abmelden.
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
  if (action === 'plant') {
    dispatch(plantField(state, { fx: x, fy: y, x: Number(btn.dataset.tx), y: Number(btn.dataset.ty) }, ctx()), 'Feld angelegt.');
  }
  if (action === 'unfield') dispatch(removeField(state, { x: Number(btn.dataset.tx), y: Number(btn.dataset.ty) }), 'Feld entfernt.');
  if (action === 'renew') dispatch(renewField(state, { x: Number(btn.dataset.tx), y: Number(btn.dataset.ty) }, ctx()), 'Feld erneuert.');
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
  if (r.events.some((e) => e.type === 'convoy_arrive')) toast('Ein Konvoi ist angekommen. Rechne ihn im Handel ab.');
  board?.gain(state.coins - coinsBefore);
  renderHud();
  updateStockNumbers();
  maybeShowRequestPopup();
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
  $('#hud-coins').textContent = fmt0(t.coins);
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
  renderDock();
  const cap = storageCap(state, data);
  const rates = totalRates();
  for (const li of document.querySelectorAll('#stock li[data-res]')) {
    const r = li.dataset.res;
    li.querySelector('[data-amount]').textContent = fmt0(state.stock[r]);
    li.querySelector('[data-rate]').textContent = rates[r] ? `+${fmtRate(rates[r])}/min` : '';
    li.querySelector('[data-bar]').style.width = `${Math.min(100, state.stock[r] / cap * 100).toFixed(1)}%`;
  }
}

/** Lager unten links: Kopf mit Münzen, bei vollem Lager rot mit „!“. Die Liste klappt auf Mobile ein. */
function renderDock() {
  if (!state) return;
  const cap = storageCap(state, data);
  const ids = Object.keys(data.resources);
  const full = fullResources(state.stock, cap, ids);
  const rates = totalRates();
  $('#stock-dock').classList.toggle('is-full', full.length > 0);
  $('#dock-coins').textContent = fmt0(state.coins);
  const alert = $('#dock-alert');
  alert.hidden = full.length === 0;
  alert.title = full.length ? 'Lager voll: ' + full.map((r) => data.resources[r].name.de).join(', ') : '';
  $('#dock-list').innerHTML = ids.map((r) => {
    const res = data.resources[r];
    const amount = state.stock[r];
    const isFull = amount >= cap;
    const rate = rates[r] ? ` <span class="dock-rate">+${fmtRate(rates[r])}/min</span>` : '';
    const fullTag = isFull ? ' <span class="dock-full">voll</span>' : '';
    return `<li data-res="${r}" class="${isFull ? 'is-full' : ''}">
      <span class="dock-name"><span aria-hidden="true">${res.icon}</span> ${esc(res.name.de)}${rate}</span>
      <span class="dock-amount">${fmt0(amount)} / ${fmt0(cap)}${fullTag}</span>
      <span class="dock-bar" aria-hidden="true"><span style="width:${fillPercent(amount, cap).toFixed(1)}%"></span></span>
    </li>`;
  }).join('');
}

function setDockOpen(open) {
  $('#dock-body').hidden = !open;
  const t = $('#dock-toggle');
  t.setAttribute('aria-expanded', String(open));
  t.textContent = open ? '▾' : '▴';
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

/**
 * Kosten als Symbole mit Vorrat („Vorrat / Bedarf“). Grün = genug, rot = zu wenig.
 */
function costChips(c) {
  const mat = data.resources[c.material.resource];
  const coins = Math.floor(state.coins);
  const stock = Math.floor(state.stock[c.material.resource] ?? 0);
  const chip = (icon, name, have, need) => {
    const ok = have >= need;
    const label = `${name}: ${fmt0(have)} von ${fmt0(need)}, ${ok ? 'genug' : 'zu wenig'}`;
    return `<span class="cost-chip ${ok ? 'ok' : 'short'}" aria-label="${esc(label)}"><span aria-hidden="true">${icon}</span> ${fmt0(have)} / ${fmt0(need)}</span>`;
  };
  return `<div class="cost-row">${chip('🪙', 'Münzen', coins, c.coins)}${chip(mat.icon, mat.name.de, stock, c.material.amount)}</div>`;
}

/** Sagt, was genau fehlt. Leer, wenn alles reicht. */
function missingText(c) {
  const mat = data.resources[c.material.resource];
  const miss = [];
  const coins = Math.ceil(c.coins - state.coins);
  const units = Math.ceil(c.material.amount - (state.stock[c.material.resource] ?? 0));
  if (coins > 0) miss.push(`${fmt0(coins)} 🪙`);
  if (units > 0) miss.push(`${fmt0(units)} ${esc(mat.name.de)}`);
  return miss.length ? `Dir fehlen: ${miss.join(' und ')}` : '';
}

function buildingDetails(b, x, y) {
  const def = data.buildings[b.id];
  const m = productionMultiplier(state, x, y, b.id, data);
  let html = `<section><h3>${def.icon} ${esc(def.name.de)} <span class="muted">Stufe ${b.level}/${def.maxLevel}</span></h3>`;
  if (def.modes && b.mode) {
    html += `<p class="small">Betriebsart: <strong>${esc(def.modes[b.mode].name.de)}</strong></p>`;
  }
  if (b.id === 'sawmill') {
    const h = Math.round(forestHealth(state, x, y));
    html += `<p class="small">Waldbestand: <strong>${h} %</strong>${h < 40 ? ' · Der Wald wird knapp. Er wächst langsam nach.' : ''}</p>`;
  }
  if (b.id === 'fishery') {
    const g = fishingGround(state, x, y);
    const f = g ? Math.round(fishStock(state, g[0], g[1])) : 0;
    html += `<p class="small">Fischbestand am Fangplatz: <strong>${f} %</strong>${f < 40 ? ' · Der Bestand sinkt. Er erholt sich langsam.' : ''}</p>`;
  }
  if (def.resource) {
    const rate = ratePerMin(state, x, y, data);
    html += `<p>Produktion: <strong>${fmtRate(rate)} ${esc(data.resources[def.resource].name.de)} / min</strong></p>`;
    html += `<p class="small">Faktor ${multiplierText(m)} (Biom, Stadtlevel, Gelände, Nachbarn)</p>`;
  } else {
    html += `<p class="small">${def.id === 'warehouse' ? 'Erhöht die Lagerkapazität um 250 je Stufe.' : 'Erhöht den Verkaufsdurchsatz um 40 pro Minute je Stufe.'}</p>`;
  }
  if (def.perField) html += farmFieldsHtml(b, x, y);
  if (b.level < def.maxLevel) {
    const c = buildCost(b.id, b.level, data);
    const ok = state.coins >= c.coins && state.stock[c.material.resource] >= c.material.amount;
    html += `<p class="small">Upgrade:</p>${costChips(c)}`;
    html += `<button type="button" class="primary" data-action="upgrade" ${ok ? '' : 'disabled'}>Auf Stufe ${b.level + 1} ausbauen</button>`;
    if (!ok) html += `<p class="small warn">${missingText(c)}</p>`;
  } else {
    html += '<p class="small ok">Maximalstufe erreicht.</p>';
  }
  return `${html}</section>`;
}

/** Felder der Farm: angelegte Felder mit Entfernen, freie Wiesen daneben zum Anlegen. */
function farmFieldsHtml(b, x, y) {
  const slots = fieldSlots(b.level);
  const owned = fieldsOf(state, x, y);
  const free = plantableNeighbours(state, x, y, data);
  const cost = data.economy.fields;
  const coinsOk = state.coins >= cost.coins;
  const woodOk = (state.stock[cost.material.resource] ?? 0) >= cost.material.amount;
  const fieldLabel = (k) => k.split(',').map((v) => Number(v) + 1).join(', ');
  const tired = owned.filter((k) => soilOf(state.tiles[k]) < data.economy.ecology.soil.renewBelow).length;
  let html = `<p>Felder: <strong>${owned.length} / ${slots}</strong> <span class="small muted">(eines je Stufe, nur direkt daneben)</span></p>`;
  if (tired) html += `<p class="small warn">${tired} Feld(er) sind ausgelaugt. Erneuern bringt den Boden zurück.</p>`;
  if (owned.length) {
    html += '<div class="field-list">';
    for (const k of owned) {
      const [tx, ty] = k.split(',');
      const soil = Math.round(soilOf(state.tiles[k]));
      const renew = soil < FULL
        ? ` <button type="button" class="ghost small" data-action="renew" data-tx="${tx}" data-ty="${ty}">Erneuern</button>`
        : '';
      html += `<span class="field-chip">Feld ${fieldLabel(k)} · Boden ${soil} %${renew} <button type="button" class="ghost small" data-action="unfield" data-tx="${tx}" data-ty="${ty}">Entfernen</button></span>`;
    }
    html += '</div>';
  }
  if (owned.length < slots) {
    if (!free.length) {
      html += '<p class="small warn">Keine freie Wiese daneben. Ein Feld braucht eine unbebaute Wiese direkt am Hof.</p>';
    } else {
      html += `<p class="small">Feld anlegen: ${fmt0(cost.coins)} 🪙 und ${cost.material.amount} ${esc(data.resources[cost.material.resource].name.de)}</p><div class="field-list">`;
      for (const k of free) {
        const [tx, ty] = k.split(',');
        const disabled = !coinsOk || !woodOk ? 'disabled' : '';
        html += `<button type="button" data-action="plant" data-tx="${tx}" data-ty="${ty}" ${disabled}>Feld ${fieldLabel(k)}</button>`;
      }
      html += '</div>';
      if (!coinsOk || !woodOk) html += `<p class="small warn">${missingText({ coins: cost.coins, material: cost.material })}</p>`;
    }
  }
  return html;
}

/** Eine Bauoption je Ansicht. ‹ › blättert durch alle Gebäude. */
function buildMenu(x, y) {
  const entries = Object.entries(data.buildings).filter(([, d]) => !d.fixed);
  if (buildIdx >= entries.length) buildIdx = 0;
  const [id, d] = entries[buildIdx];
  const c = buildCost(id, 0, data);
  const locked = d.unlockTownLevel > state.townLevel;
  const affordable = state.coins >= c.coins && state.stock[c.material.resource] >= c.material.amount;
  const place = checkPlacement(state, x, y, id, data);
  let meta;
  if (d.resource) {
    const preview = withTempBuilding(x, y, id, place.mode);
    const m = productionMultiplier({ ...state, tiles: preview }, x, y, id, data);
    const units = d.perField ? 0 : 1;
    const rate = d.baseRatePerMin * (units || 1) * m;
    meta = d.perField
      ? `je angelegtem Feld ${fmtRate(rate)} ${esc(data.resources[d.resource].name.de)}/min (${multiplierText(m)})`
      : `${fmtRate(rate)} ${esc(data.resources[d.resource].name.de)}/min auf diesem Feld (${multiplierText(m)})`;
    if (place.mode && d.modes) meta += ` · ${esc(d.modes[place.mode].name.de)}`;
  } else {
    meta = id === 'warehouse' ? 'Mehr Lagerkapazität' : 'Mehr Verkaufsdurchsatz';
  }
  const hint = placementHint(d);
  const placeNote = !place.ok && !locked
    ? `<div class="locked-note">${esc(hint || ERR_DE[place.reason] || 'Hier nicht möglich.')}</div>`
    : (hint ? `<div class="meta small">${esc(hint)}</div>` : '');
  return `<section>
    <div class="cycle">
      <button type="button" data-action="cycle" data-dir="-1" data-cycle aria-label="Vorherige Option">‹</button>
      <div class="opt">
        <div><strong>${d.icon} ${esc(d.name.de)}</strong> <span class="muted small">${buildIdx + 1} / ${entries.length}</span>
          ${costChips(c)}
          <div class="meta">${meta}</div>
          ${locked ? `<div class="locked-note">Ab Stadtlevel ${d.unlockTownLevel}</div>` : ''}
          ${!locked && !affordable ? `<div class="locked-note">${missingText(c)}</div>` : ''}
          ${placeNote}
        </div>
        <button type="button" data-action="build" data-id="${id}" ${locked || !affordable || !place.ok ? 'disabled' : ''}>Bauen</button>
      </div>
      <button type="button" data-action="cycle" data-dir="1" data-cycle aria-label="Nächste Option">›</button>
    </div>
  </section>`;
}

/** Temporary tile map with a building placed, used only for bonus previews. */
function withTempBuilding(x, y, id, mode) {
  const tiles = { ...state.tiles };
  tiles[keyOf(x, y)] = { ...tiles[keyOf(x, y)], building: mode ? { id, level: 1, mode } : { id, level: 1 } };
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
const SESSION_TAKEN_TEXT = 'Dieses Konto ist gerade in einem anderen Fenster oder auf einem anderen Gerät geöffnet. Abmelden oder hierbleiben? Hierbleiben beendet die Sitzung dort.';
const SESSION_LOST_TEXT = 'Dieses Konto ist jetzt auf einem anderen Gerät geöffnet. Melde dich hier erneut an, um weiterzuspielen.';
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

// AFK und Sitzungswechsel. Der Hinweis erscheint nach dem Abmelden auf dem Anmeldebildschirm.
let afkStop = null;
let nextLoginNotice = null; // { text, afk }
const AFK_TEXT = 'Du warst 5 Minuten inaktiv und wurdest abgemeldet. Deine Stadt ist gesichert.';

/** AFK: Stadt sichern, abmelden, Hinweis auf dem Anmeldebildschirm. */
async function onAfkTimeout() {
  if (!currentUser) return;
  flushNow();
  nextLoginNotice = { text: AFK_TEXT, afk: true };
  try {
    await cloud.logout();
  } catch {
    nextLoginNotice = null;
    toast('Abmelden fehlgeschlagen. Du bist noch angemeldet.', 'error');
  }
}

/** Ein anderes Gerät hat das Konto übernommen. Dieses Gerät meldet sich ohne Rückfrage ab. */
async function onSessionLost(sessionUid) {
  if (sessionLost || activeUid !== sessionUid) return;
  sessionLost = true; // bleibt gesetzt, bis die Abmeldung durch ist: nichts speichern
  stopSessionGuard();
  activeUid = null;
  nextLoginNotice = { text: SESSION_LOST_TEXT, afk: false };
  try {
    await cloud.logout();
  } catch {
    nextLoginNotice = null;
    toast('Abmelden fehlgeschlagen. Hier wird nichts mehr gespeichert.', 'error');
  }
}

/** Konto ist woanders offen. Die Rückfrage gibt es nur auf dem neu anmeldenden Gerät. */
function showSessionTaken(sessionUid) {
  openDialog(`<div class="dlg-body confirm">
    <h2 id="dlg-title">Konto ist schon offen</h2>
    <p>${esc(SESSION_TAKEN_TEXT)}</p>
    <div class="confirm-row">
      <button type="button" id="session-logout">Abmelden</button>
      <button type="button" id="session-stay" class="primary">Hierbleiben</button>
    </div>
  </div>`);
  const dlg = $('#dlg');
  dlg.dataset.persist = '1'; // Entscheidung erzwingen: nicht per Klick oder Escape schließen
  dlg.addEventListener('cancel', (e) => e.preventDefault(), { once: true });
  $('#session-stay').addEventListener('click', () => takeOverSession(sessionUid));
  $('#session-logout').addEventListener('click', async () => {
    closeDialog();
    try { await cloud.logout(); } catch { toast('Abmelden fehlgeschlagen.', 'error'); }
  });
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
  const model = { state: advance(town, Date.now(), ctx(baseData)).state, at: Date.now() };
  visit = { uid: friendUid, model, board: null, timer: null, refreshing: false, lastError: false };
  $('#visit-name').textContent = town.name;
  $('#visit').hidden = false;
  visit.board = createBoard($('#visit-board'), {
    getSelected: () => null,
    onSelect: () => {}, // nur ansehen
    describe: (x, y) => describeIn(model.state, x, y),
    getModel: () => ({
      state: model.state,
      data: baseData,
      unlocked: (x, y) => isUnlocked(x, y, model.state.townLevel, data),
    }),
  });
  updateVisitInfo();
  visit.timer = setInterval(() => {
    if (!visit || visit.model !== model) return;
    if (Date.now() - model.at >= VISIT_REFRESH_MS && !visit.refreshing) void refreshVisit(friendUid, model);
    model.state = advance(model.state, Date.now(), ctx(baseData)).state;
    visit.board?.redraw();
    updateVisitInfo();
  }, 1000);
}

// Besuch: der Stand kommt alle 30 s frisch aus der Cloud. Nur lesen, nichts wird zurückgeschrieben.
// Der Anzeigestand ist damit höchstens etwa 60 s alt. Fällt das Laden aus, bleibt der alte Stand sichtbar und wird als veraltet markiert.
const VISIT_REFRESH_MS = 30_000;
const VISIT_STALE_MS = 60_000;

async function refreshVisit(friendUid, model) {
  if (!visit || visit.model !== model) return;
  visit.refreshing = true;
  try {
    const raw = await withTimeout(cloud.loadTown(friendUid), REMOTE_TIMEOUT_MS, 'Besuch aktualisieren');
    if (visit && visit.model === model && raw) {
      model.state = advance(hydrateTown(raw), Date.now(), ctx(baseData)).state;
      model.at = Date.now();
      visit.lastError = false;
      visit.board?.redraw();
    }
  } catch {
    if (visit && visit.model === model) visit.lastError = true;
  } finally {
    if (visit && visit.model === model) visit.refreshing = false;
    updateVisitInfo();
  }
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
  const age = Math.max(0, Math.round((Date.now() - visit.model.at) / 1000));
  const stale = visit.lastError && age > VISIT_STALE_MS / 1000 ? ' · veraltet, keine Verbindung' : '';
  $('#visit-info').textContent = `Level ${st.townLevel} · 🪙 ${Math.floor(st.coins)} · 🏠 ${count} Gebäude · Stand vor ${age} s${stale}`;
}

function describeIn(st, x, y) {
  const tile = st?.tiles[keyOf(x, y)];
  if (!tile) return '';
  const b = tile.building;
  return [`Feld ${x + 1}, ${y + 1}`, TERRAIN_DE[tile.terrain], b ? baseData.buildings[b.id].name.de : 'frei'].join(' · ');
}

/**
 * Beim Laden: Name sichern und Profil schreiben. Ohne Profil findet dich kein Freund,
 * und Stände, die nicht mehr gespeichert werden, würden es nie bekommen.
 * Vergebene Namen bleiben unverändert.
 */
function claimExistingName(forUid, town) {
  const check = checkTownName(town.name);
  if (check.ok) cloud.claimTownName(forUid, check.key).catch(() => {});
  cloud.saveProfile(forUid, { townName: town.name, townLevel: town.townLevel }).catch(() => {});
}

/** Freunde-Fenster: eigene Stadt, Code, Einladung, Anfragen, klappbare Liste. */
// ---------- Freundschaftsanfragen: Hinweis im Menü, Popup beim Spielen ----------
let requestUnwatch = null;
let requestUid = null;
let pendingRequests = [];
const shownRequests = new Set(); // Absender, deren Popup in dieser Sitzung schon kam

function startRequestWatch(forUid) {
  if (requestUid === forUid) return;
  stopRequestWatch();
  requestUid = forUid;
  requestUnwatch = cloud.watchRequests(forUid, (items) => {
    pendingRequests = items;
    renderRequestBadge();
    maybeShowRequestPopup();
  });
}

function stopRequestWatch() {
  requestUnwatch?.();
  requestUnwatch = null;
  requestUid = null;
  pendingRequests = [];
  shownRequests.clear();
  renderRequestBadge();
}

/** Roter Punkt mit Anzahl am Menü, solange Anfragen offen sind (auch nach dem Anmelden). */
function renderRequestBadge() {
  const n = pendingRequests.length;
  const btn = $('#menu-btn');
  const badge = $('#menu-badge');
  badge.hidden = n === 0;
  badge.textContent = String(n);
  btn.classList.toggle('has-requests', n > 0);
  btn.setAttribute('aria-label', requestBadgeLabel(n));
}

/** Popup nur beim Spielen und nur, wenn gerade kein anderes Fenster offen ist. Sonst später erneut. */
function maybeShowRequestPopup() {
  if (!state || !uid || requestUid !== uid) return;
  if ($('#dlg').open || $('#stock-sheet').open) return;
  const next = nextRequestToShow(pendingRequests, shownRequests);
  if (!next) return;
  shownRequests.add(next.from);
  showRequestPopup(next);
}

function showRequestPopup(r) {
  openDialog(`<div class="dlg-body confirm">
    <h2 id="dlg-title">Freundschaftsanfrage</h2>
    <p><strong>${esc(r.name)}</strong> möchte dich als Freund hinzufügen.</p>
    <div class="confirm-row">
      <button type="button" id="req-decline">Ablehnen</button>
      <button type="button" id="req-later">Später</button>
      <button type="button" id="req-accept" class="primary">Annehmen</button>
    </div>
  </div>`);
  const dlg = $('#dlg');
  dlg.dataset.persist = '1'; // Entscheidung: nicht per Klick oder Escape schließen
  dlg.addEventListener('cancel', (e) => e.preventDefault(), { once: true });
  const act = async (fn, okText) => {
    closeDialog();
    if (!fn) return maybeShowRequestPopup();
    try {
      await fn();
      if (okText) toast(okText);
    } catch (err) {
      toast(cloud.dbErrorDe(err), 'error');
    }
    maybeShowRequestPopup();
  };
  $('#req-accept').addEventListener('click', () => act(() => cloud.acceptRequest(uid, r.from), 'Freund hinzugefügt.'));
  $('#req-decline').addEventListener('click', () => act(() => cloud.declineRequest(uid, r.from), 'Anfrage abgelehnt.'));
  $('#req-later').addEventListener('click', () => act(null));
}

// ---------- Freibriefe (Prestige), Regeln in src/domain/charters.js ----------
// Der Stand liegt unter charters/{uid} und bleibt beim Neubeginn erhalten.
// Solange er nicht geladen ist, wird nichts geschrieben, damit ein leerer Stand nicht den echten überschreibt.
let charter = null;
let charterLoaded = false;
// Nur diese Perks wirken schon. „Eilpost“ kommt mit den Konvois (P2) und ist bis dahin markiert.
const WIRED_PERKS = new Set(['startCoins', 'yield', 'storage', 'market', 'memory']);

/** Spieldaten mit den Perk-Wirkungen dieses Kontos neu berechnen. */
function refreshData() {
  if (baseData) data = applyCharterToData(baseData, charter);
}

async function loadCharterFor(forUid) {
  charter = null;
  charterLoaded = false;
  try {
    const raw = await cloud.loadCharter(forUid);
    const base = emptyCharter();
    charter = raw ? { ...base, ...raw, perks: raw.perks ?? {}, founded: raw.founded ?? {} } : base;
    charterLoaded = true;
    refreshData();
  } catch (err) {
    console.error('Freibriefe nicht geladen:', err);
  }
}

// ---------- Handel mit Nachbarstädten (Konvois) ----------
function openTrade() {
  if (!state || !uid) {
    toast('Melde dich an und lade deine Stadt, dann öffnet sich der Handel.', 'error');
    return;
  }
  if (!baseData?.npcs) {
    toast('Die Handelsdaten fehlen. Lade das Spiel neu.', 'error');
    return;
  }
  void syncCrowns();
  const dlg = openDialog(`<div class="dlg-body">${tradeFormHtml(data, charter?.crowns ?? 0)}<p class="row"><button type="button" id="trade-close" class="ghost">Schließen</button></p></div>`);
  const form = dlg.querySelector('#trade-form');
  const readForm = () => {
    const fd = new FormData(form);
    const partner = data.npcs.towns.find((t) => t.id === fd.get('partner'));
    return {
      partner,
      direction: fd.get('direction'),
      resource: fd.get('resource'),
      qty: Number(fd.get('qty')),
    };
  };
  const paintPreview = () => {
    const f = readForm();
    const preview = dlg.querySelector('#trade-preview');
    if (!f.partner || !Number.isInteger(f.qty) || f.qty < 10 || f.qty > 100) {
      preview.textContent = 'Menge zwischen 10 und 100 wählen.';
      return;
    }
    const p = previewFor({ ...f, data });
    preview.textContent = `Dauer: ${fmtTradeDuration(p.durationMin)}. ${p.text}`;
  };
  const paintList = () => {
    const list = dlg.querySelector('#trade-list');
    if (list) list.innerHTML = convoyListHtml(state, data, Date.now());
  };
  form.addEventListener('input', paintPreview);
  form.addEventListener('change', paintPreview);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = readForm();
    const msg = dlg.querySelector('#trade-msg');
    msg.textContent = '';
    const r = startConvoy(state, { partner: f.partner, direction: f.direction, resource: f.resource, qty: f.qty },
      { data, nowMs: Date.now() });
    if (r.error) {
      msg.textContent = ERR_DE[r.error] ?? 'Konvoi nicht möglich.';
      return;
    }
    dispatch(r, 'Konvoi ist losgefahren.');
    paintList();
  });
  dlg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-settle]');
    if (btn) {
      dispatch(settleConvoyAction(state, { id: btn.dataset.settle }, ctx()), 'Konvoi abgerechnet.');
      paintList();
      void syncCrowns();
    }
    if (e.target.closest('#trade-close')) closeDialog();
  });
  paintPreview();
  paintList();
  const timer = setInterval(() => {
    if (!dlg.open) return;
    paintList();
  }, 1000);
  dlg.addEventListener('close', () => clearInterval(timer), { once: true });
}

function fmtTradeDuration(min) {
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

function openCharters() {
  if (!state || !uid) {
    toast('Melde dich an und lade deine Stadt, dann öffnen sich die Freibriefe.', 'error');
    return;
  }
  const dlg = openDialog('');
  const paint = () => {
    dlg.innerHTML = charterHtml();
    dlg.querySelector('#found-charter')?.addEventListener('click', foundCharter);
    dlg.querySelectorAll('button[data-perk]').forEach((b) => {
      b.addEventListener('click', () => buyPerkUi(b.dataset.perk, paint));
    });
  };
  paint();
}

/** Kronen abgerechneter Konvois dem Konto gutschreiben. Speichert nur, wenn sich etwas ändert. */
async function syncCrowns() {
  if (!state || !uid || !charterLoaded || !charter) return;
  const r = reconcileCrowns(charter, state);
  if (!r.changed) return;
  try {
    await cloud.saveCharter(uid, r.charter);
    charter = r.charter;
    document.querySelectorAll('[data-crowns]').forEach((el) => { el.textContent = String(charter.crowns); });
  } catch (err) {
    // Die Gutschrift bleibt offen und wird beim nächsten Abgleich erneut versucht.
    toast(cloud.dbErrorDe(err), 'error');
  }
}

function charterHtml() {
  const c = charter ?? emptyCharter();
  const f = state && charterLoaded ? canFoundCharter(state, c) : { ok: false, reason: 'Keine Stadt geladen.' };
  const avail = availableCharters(c);
  const status = !charterLoaded
    ? 'Freibriefe konnten nicht geladen werden. Prüfe deine Verbindung.'
    : f.ok ? `Du kannst jetzt einen Freibrief gründen: +${f.gain}.` : f.reason;
  const rows = PERKS.map((p) => {
    const lvl = perkLevel(c, p.id);
    const canBuy = charterLoaded && lvl < p.max && avail >= 1;
    const note = WIRED_PERKS.has(p.id) ? '' : ' · Wirkung folgt (Konvois, ab P2)';
    return `<li class="friend-card">
      <div><strong>${esc(p.label)}</strong> <span class="small">Stufe ${lvl}/${p.max}</span>
        <div class="small">${esc(p.effect)}${note}</div></div>
      <button type="button" class="${canBuy ? 'primary' : 'ghost'}" data-perk="${p.id}" ${canBuy ? '' : 'disabled'}>+1</button>
    </li>`;
  }).join('');
  return `<div class="dlg-body charters">
    <h2 id="dlg-title">Freibriefe</h2>
    <p>Verfügbar: <strong>${avail}</strong> · Insgesamt gewonnen: ${c.earned}</p>
    <section class="friends-me charter-box">
      <p>${esc(status)}</p>
      <button type="button" class="primary" id="found-charter" ${charterLoaded && f.ok ? '' : 'disabled'}>Freibrief gründen</button>
      <p class="small">Die Stadt startet neu: Münzen, Gebäude, Lager, Level und Biom. Name und Freunde bleiben. Freibriefe und Perks bleiben erhalten.</p>
    </section>
    <h3>Perk-Baum</h3>
    <ul class="friend-list">${rows}</ul>
  </div>`;
}

async function foundCharter() {
  if (!state || !uid || !charterLoaded || !charter) return;
  const check = canFoundCharter(state, charter);
  if (!check.ok) return toast(check.reason, 'error');
  const n = check.gain;
  const yes = await askConfirm(
    'Freibrief gründen?',
    `Deine Stadt startet neu. Du bekommst ${n} Freibrief${n === 1 ? '' : 'e'}. Name und Freunde bleiben, Freibriefe und Perks bleiben.`,
    { ok: 'Ja, gründen' },
  );
  if (!yes || !state || !uid || !charterLoaded) return;
  // Zuerst den Gewinn sichern, dann erst die Stadt neu starten.
  // Ausstehende Kronen vorher sichern, weil die Stadt danach neu startet.
  const recon = reconcileCrowns(charter, state).charter;
  const next = grantCharters(recon, state);
  try {
    await cloud.saveCharter(uid, next);
  } catch (err) {
    toast(cloud.dbErrorDe(err), 'error');
    return;
  }
  charter = next;
  const biome = chooseBiome(Math.random, state.biome);
  const fresh = createTown({ name: state.name, biome, seed: newSeed(), now: Date.now(), data });
  fresh.coins += perkEffect(charter, 'startCoins');
  state = fresh;
  selected = { x: 4, y: 4 };
  cloudDirty = true;
  lastCloudAt = 0;
  saveLocal();
  renderAll();
  cloudSave();
  closeDialog();
  toast(`Neuer Start! +${n} Freibrief${n === 1 ? '' : 'e'} gutgeschrieben.`);
}

async function buyPerkUi(id, repaint) {
  if (!uid || !charterLoaded || !charter) return;
  const r = buyPerk(charter, id);
  if (!r.ok) return toast(r.reason, 'error');
  try {
    await cloud.saveCharter(uid, r.charter);
  } catch (err) {
    toast(cloud.dbErrorDe(err), 'error');
    return;
  }
  charter = r.charter;
  refreshData();
  renderAll();
  repaint();
  toast('Perk gekauft.');
}

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
    <h2 id="dlg-title">Stadtchronik</h2>
    <h3>Stand dieser Welle</h3>
    ${patches}
    <h3>Offen</h3>
    <ul>${list(OPEN_ITEMS)}</ul>
    <button type="submit" class="primary">Schließen</button>
  </form>`);
}

boot();

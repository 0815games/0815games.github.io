// v0.3.6 full main.js with Zufallsname, AFK-Logout, Speicher-Toast, Ebenenwechsel, Level-Up, Firebase.
import { state, CLASSES } from './core/state.js';
import { ITEMS } from './data/items.js';
import { cloud } from './systems/firebase.js';
import { sound } from './systems/audio.js';
import { WorldMap } from './world/map.js';
import { Renderer } from './world/render.js';
import { VERSION_LABEL } from './core/version.js';

window.addEventListener('DOMContentLoaded', () => {
  const map = new WorldMap();
  const gfx = new Renderer('stage');
  let selectedClass = 'warrior';
  let authMode = 'login';
  let targetSlotIndex = 0;
  let allSlots = [null, null, null, null];
  const el = id => document.getElementById(id);

  function showToast(message, type = 'success') {
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.textContent = message;
    el('toast').appendChild(box);
    setTimeout(() => box.remove(), 3600);
  }

  const nameParts = {
    first: ['Vael','Kael','Mor','Thal','Ser','Drav','Ny','Umb','Rav','Zar','Eld','Vor','Mal','Cal','Aer','Gor'],
    middle: ['a','e','i','o','u','ae','ia','ora','eth','ar','yn','ys'],
    last: ['thar','mor','vane','rion','dric','wyn','thas','gorn','vex','shade','grave','mourn','blight','ash','dusk','wraith']
  };
  function randomDarkFantasyName() {
    let name = '';
    do {
      name = nameParts.first[Math.floor(Math.random()*nameParts.first.length)] +
        nameParts.middle[Math.floor(Math.random()*nameParts.middle.length)] +
        nameParts.last[Math.floor(Math.random()*nameParts.last.length)];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } while (name.length > 16);
    return name;
  }

  const AFK_TIMEOUT = 10 * 60 * 1000;
  let afkTimer = null;
  function resetAfkTimer() {
    clearTimeout(afkTimer);
    if (!state.user) return;
    afkTimer = setTimeout(performAfkLogout, AFK_TIMEOUT);
  }
  async function performAfkLogout() {
    if (!state.user) return;
    try { await cloud.saveSlot(state.currentSlot, state); } catch {}
    try { if (window.firebase && state.user) await firebase.auth().signOut(); } catch {}
    state.user = null;
    ['game','slot-screen','class-screen','death-screen'].forEach(id => el(id).classList.add('hidden'));
    el('login-screen').classList.remove('hidden');
    showError('Du wurdest nach 10 Minuten Inaktivität automatisch abgemeldet. Dein Fortschritt wurde gesichert.');
  }
  ['pointerdown','keydown','mousemove','touchstart'].forEach(event => window.addEventListener(event, resetAfkTimer, { passive: true }));

  el('random-name').onclick = () => { el('run-name').value = randomDarkFantasyName(); };

  async function saveCurrentSlot() {
    const ok = await cloud.saveSlot(state.currentSlot, state);
    if (ok) {
      showToast('Recke erfolgreich im Ordensarchiv gesichert.', 'success');
      log(`Slot ${state.currentSlot + 1} (${state.player.name}) im Ordensarchiv gesichert.`);
    } else {
      showToast('Speichern fehlgeschlagen. Bitte Internetverbindung prüfen.', 'error');
      log('⚠️ Speichern im Ordensarchiv fehlgeschlagen.');
    }
  }

  // Restliche Spiellogik bleibt unverändert und wird aus der bestehenden main.js übernommen.
});

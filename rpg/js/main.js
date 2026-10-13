// [2026-10-13 07:45] - js/main.js: v0.2.1 Intro-Rückkehr & Versionsanzeige
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

  // v0.2.1: Zentrale Versionsanzeige
  document.title = `Chroniken der Schattengruft – ${VERSION_LABEL}`;
  document.querySelectorAll('[data-version]').forEach(node => {
    node.textContent = VERSION_LABEL;
  });

  // v0.2.1: Intro vor dem Login
  const intro = el('intro-screen');
  const introBar = el('intro-bar');
  const loginScreen = el('login-screen');
  let introProgress = 0;
  let introFinished = false;

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    introBar.style.width = '100%';
    setTimeout(() => {
      intro.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    }, 250);
  }

  const introTimer = setInterval(() => {
    introProgress = Math.min(100, introProgress + 5);
    introBar.style.width = `${introProgress}%`;
    if (introProgress >= 100) {
      clearInterval(introTimer);
      finishIntro();
    }
  }, 45);

  intro.addEventListener('click', () => {
    clearInterval(introTimer);
    finishIntro();
  }, { once: true });

  window.addEventListener('keydown', function introKey(e) {
    if (e.key === 'Enter' && !introFinished) {
      clearInterval(introTimer);
      finishIntro();
      window.removeEventListener('keydown', introKey);
    }
  });

  // Hintergrund-Feuerpartikel
  const loginCanvas = el('login-canvas');
  if (loginCanvas) {
    const lx = loginCanvas.getContext('2d');
    let w = loginCanvas.width = window.innerWidth, h = loginCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      w = loginCanvas.width = window.innerWidth, h = loginCanvas.height = window.innerHeight;
    });
    const embers = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 1.5 + Math.random() * 2.5,
      v: 0.5 + Math.random() * 1.5,
      a: Math.random()
    }));
    setInterval(() => {
      lx.clearRect(0, 0, w, h);
      for (const e of embers) {
        e.y -= e.v;
        e.x += Math.sin(e.y * 0.02) * 0.7;
        if (e.y < 0) { e.y = h; e.x = Math.random() * w; }
        lx.fillStyle = `rgba(255, 140, 40, ${e.a})`;
        lx.fillRect(e.x, e.y, e.s, e.s);
      }
    }, 33);
  }

  // Cloud Status prüfen
  const fbOk = cloud.init();
  if (fbOk) {
    el('cloud-status').className = 'cloud ok';
    el('cloud-status').textContent = '● CLOUD-ARCHIV VERBUNDEN';
  } else {
    el('cloud-status').className = 'cloud offline';
    el('cloud-status').textContent = '● OFFLINE-MODUS (LOKAL)';
  }

  // Umschaltung Anmelden / Registrieren
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      authMode = btn.dataset.mode;
      el('auth-error').classList.add('hidden');
      el('auth-submit').textContent = authMode === 'login' ? '⚔️ IN DIE GRUFT HERABSTEIGEN' : '🛡️ NEUES KONTO ERSTELLEN';
    };
  });

  function showError(msg) {
    const box = el('auth-error');
    if (box) {
      box.textContent = msg;
      box.classList.remove('hidden');
    }
  }

  // Formular-Submit
  el('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = el('auth-email').value.trim();
    const pw = el('auth-password').value.trim();

    if (!email || !pw) {
      showError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    if (pw.length < 6) {
      showError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    el('auth-error').classList.add('hidden');
    el('auth-submit').textContent = '⏳ Siegel werden geprüft...';

    try {
      if (authMode === 'login') {
        state.user = await cloud.login(email, pw);
        state.isGuest = false;
      } else {
        state.user = await cloud.register(email, pw);
        state.isGuest = false;
      }
      await openSlotScreen();
    } catch (err) {
      showError(err.message || 'Fehler beim Authentifizieren.');
      el('auth-submit').textContent = authMode === 'login' ? '⚔️ IN DIE GRUFT HERABSTEIGEN' : '🛡️ NEUES KONTO ERSTELLEN';
    }
  };

  // Gastreisender starten
  el('guest-btn').onclick = async () => {
    state.isGuest = true;
    state.user = null;
    await openSlotScreen();
  };

  // 4 SLOTS ANZEIGEN
  async function openSlotScreen() {
    el('login-screen').classList.add('hidden');
    el('class-screen').classList.add('hidden');
    el('death-screen').classList.add('hidden');
    el('game').classList.add('hidden');
    el('slot-screen').classList.remove('hidden');

    allSlots = await cloud.loadAllSlots();
    renderSlots();
  }

  function renderSlots() {
    const grid = el('slots-grid');
    grid.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const slotData = allSlots[i];
      const box = document.createElement('div');

      if (!slotData || !slotData.player) {
        box.className = 'slot-box empty';
        box.innerHTML = `
          <div class="slot-num">SLOT ${i + 1}</div>
          <div class="empty-label">➕ FREIER RECKENPLATZ</div>
          <small>Hier klicken zum Erschaffen</small>
        `;
        box.onclick = () => {
          targetSlotIndex = i;
          openClassCreator(i);
        };
      } else {
        box.className = 'slot-box';
        const p = slotData.player;
        const cTitle = CLASSES[p.heroClass]?.title || 'Krieger';
        const depth = slotData.world?.depth || 1;

        box.innerHTML = `
          <div>
            <div class="slot-header">
              <span class="slot-num">SLOT ${i + 1}</span>
              <span class="slot-class">${cTitle}</span>
            </div>
            <div class="slot-hero-name">${p.name}</div>
            <div class="slot-meta">
              Stufe ${p.level} • Verlies-Ebene ${depth}<br>
              ${p.gold || 0} 🪙 Gold • ${p.hp}/${p.maxHp} TP
            </div>
          </div>
          <div class="slot-buttons">
            <button type="button" class="btn-slot-play">⚔️ SPIELEN</button>
            <button type="button" class="btn-slot-del" title="Diesen Recken löschen">🗑️</button>
          </div>
        `;

        box.querySelector('.btn-slot-play').onclick = (ev) => {
          ev.stopPropagation();
          loadAndLaunchSlot(i, slotData);
        };

        box.querySelector('.btn-slot-del').onclick = async (ev) => {
          ev.stopPropagation();
          if (confirm(`Möchtest du den Recken "${p.name}" (Slot ${i + 1}) wirklich endgültig löschen?`)) {
            await cloud.deleteSlot(i);
            allSlots[i] = null;
            renderSlots();
          }
        };
      }

      grid.appendChild(box);
    }
  }

  function openClassCreator(slotIdx) {
    el('slot-screen').classList.add('hidden');
    el('class-screen').classList.remove('hidden');
    el('class-screen-title').textContent = `RECKEN FÜR SLOT ${slotIdx + 1} WEIHEN`;
  }

  el('cancel-create').onclick = () => { openSlotScreen(); };
  el('btn-slot-logout').onclick = () => { location.reload(); };

  // Klassenwahl
  document.querySelectorAll('.class').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.class').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedClass = btn.dataset.class;
    };
  });

  el('start-run').onclick = () => {
    const name = el('run-name').value.trim() || 'Schattenjäger';
    createAndLaunchSlot(targetSlotIndex, selectedClass, name);
    el('class-screen').classList.add('hidden');
  };

  function createAndLaunchSlot(slotIdx, cId, name) {
    state.currentSlot = slotIdx;
    const c = CLASSES[cId] || CLASSES.warrior;
    state.player.name = name;
    state.player.heroClass = cId;
    state.player.level = 1;
    state.player.xp = 0;
    state.player.nextXp = 100;
    state.player.hp = state.player.maxHp = c.hp;
    state.player.mp = state.player.maxMp = c.mp;
    state.player.atk = c.atk;
    state.player.def = c.def;
    state.player.gold = 40;
    state.player.inventory = c.items.map(x => ({ ...x }));

    state.player.equipped = {
      head: null,
      body: c.armor || null,
      mainhand: c.weapon || null,
      offhand: null,
      feet: null,
      ring: null
    };

    map.generate(1);
    cloud.saveSlot(slotIdx, state);
    openGame();
  }

  function loadAndLaunchSlot(slotIdx, slotData) {
    state.currentSlot = slotIdx;
    Object.assign(state, slotData);
    if (!state.player.equipped) {
      state.player.equipped = { head: null, body: null, mainhand: null, offhand: null, feet: null, ring: null };
    }
    map.ensureValid();
    el('slot-screen').classList.add('hidden');
    openGame();
  }

  function openGame() {
    el('slot-screen').classList.add('hidden');
    el('class-screen').classList.add('hidden');
    el('game').classList.remove('hidden');
    el('hud-slot-name').textContent = `SLOT ${state.currentSlot + 1}`;
    hud();
    log(`Du betrittst Ebene ${state.world.depth} der Schattengruft.`);
    if (state.world.isBossFloor) {
      log('⚠️ BOSS-EBENE: Besiege den Wächter, um das Runensiegel zu brechen!');
    } else {
      log('🔒 Das Runensiegel versiegelt den Abstieg. Besiege alle Kreaturen!');
    }
  }

  function saveCurrentSlot() {
    cloud.saveSlot(state.currentSlot, state);
    log(`Slot ${state.currentSlot + 1} (${state.player.name}) gesichert.`);
  }

  function equipItemFromInv(invIndex) {
    const s = state.player.inventory[invIndex];
    if (!s) return;
    const it = ITEMS[s.id];
    if (!it || !it.slot) return;

    const targetSlot = it.slot;
    const currentEquippedId = state.player.equipped[targetSlot];

    if (currentEquippedId) {
      addItem(currentEquippedId);
    }

    state.player.equipped[targetSlot] = s.id;
    sound.sword();
    log(`${it.name} ausgerüstet (${targetSlot}).`);

    s.count--;
    if (s.count <= 0) state.player.inventory.splice(invIndex, 1);

    hud();
  }

  function unequipSlot(slotKey) {
    const itemId = state.player.equipped[slotKey];
    if (!itemId) return;

    if (state.player.inventory.length >= 15) {
      log('Gürteltasche ist voll! Kann Item nicht ablegen.');
      return;
    }

    addItem(itemId);
    state.player.equipped[slotKey] = null;
    sound.sword();
    log(`Ausrüstung abgelegt: ${ITEMS[itemId]?.name || slotKey}.`);
    hud();
  }

  function calculateCombatStats() {
    const p = state.player;
    let totalAtk = p.atk;
    let totalDef = p.def;

    for (const [sKey, itemId] of Object.entries(p.equipped)) {
      if (!itemId) continue;
      const it = ITEMS[itemId];
      if (!it) continue;

      if (it.type === 'weapon' || (it.stat === 'atk')) {
        totalAtk += it.val || 0;
      } else if (it.type === 'armor' || it.type === 'shield' || it.type === 'helmet' || it.type === 'boots') {
        totalDef += it.val || 0;
      }
    }

    return { totalAtk, totalDef };
  }

  function hud() {
    const p = state.player;
    el('hero-name').textContent = p.name;
    el('hero-class').textContent = CLASSES[p.heroClass]?.title || 'Krieger';
    el('level').textContent = p.level;
    el('gold').textContent = `${p.gold} 🪙`;
    el('depth').textContent = state.world.depth;
    el('hp').style.width = `${Math.max(0, p.hp / p.maxHp * 100)}%`;
    el('hptext').textContent = `${p.hp}/${p.maxHp}`;
    el('mp').style.width = `${Math.max(0, p.mp / p.maxMp * 100)}%`;
    el('mptext').textContent = `${p.mp}/${p.maxMp}`;
    el('xp').style.width = `${Math.max(0, p.xp / p.nextXp * 100)}%`;
    el('xptext').textContent = `${p.xp}/${p.nextXp}`;

    renderInv();
    renderEquipmentMenu();
  }

  function renderInv() {
    const box = el('items');
    box.innerHTML = '';
    el('slots').textContent = `(${state.player.inventory.length}/15)`;
    state.player.inventory.forEach((s, idx) => {
      const it = ITEMS[s.id];
      if (!it) return;
      const d = document.createElement('div');
      d.className = 'item';

      const actionLabel = it.slot ? '[Ausrüsten]' : '[Nutzen]';
      d.innerHTML = `<span>${it.name} x${s.count}</span><span>${actionLabel}</span>`;

      d.onclick = () => {
        el('iteminfo').innerHTML = `<strong>${it.name}</strong> (${it.type})<br>${it.desc}`;
        if (it.slot) {
          equipItemFromInv(idx);
        } else {
          useItem(idx);
        }
      };
      box.append(d);
    });
  }

  function renderEquipmentMenu() {
    const p = state.player;
    const stats = calculateCombatStats();

    const slots = ['head', 'body', 'mainhand', 'offhand', 'feet', 'ring'];
    slots.forEach(slotKey => {
      const itemId = p.equipped[slotKey];
      const nameEl = el(`slot-item-${slotKey}`);
      const parentBox = nameEl.closest('.equip-slot-box');
      const unequipBtn = parentBox.querySelector('.btn-unequip');

      if (itemId && ITEMS[itemId]) {
        nameEl.textContent = ITEMS[itemId].name;
        parentBox.classList.add('equipped');
        unequipBtn.classList.remove('hidden');
        unequipBtn.onclick = (e) => {
          e.stopPropagation();
          unequipSlot(slotKey);
        };
      } else {
        nameEl.textContent = 'Leer';
        parentBox.classList.remove('equipped');
        unequipBtn.classList.add('hidden');
      }
    });

    el('stats').innerHTML = `
      <strong>KAMPFWERTE:</strong><br>
      🗡️ Effektive Schlagkraft: <span style="color:#ffe082;">${stats.totalAtk}</span> (Basis ${p.atk})<br>
      🛡️ Effektiver Schutz: <span style="color:#90caf9;">${stats.totalDef}</span> (Basis ${p.def})<br>
      ❤️ Max. Lebenskraft: ${p.maxHp} TP<br>
      🔮 Max. Arkane Kraft: ${p.maxMp} MP<br>
      🏆 Tiefste Ebene im Run: Ebene ${state.world.depth}
    `;
  }

  function useItem(idx) {
    const s = state.player.inventory[idx];
    const it = ITEMS[s?.id];
    if (!it) return;
    if (it.type === 'potion') {
      if (it.effect === 'hp') state.player.hp = Math.min(state.player.maxHp, state.player.hp + it.val);
      if (it.effect === 'mp') state.player.mp = Math.min(state.player.maxMp, state.player.mp + it.val);
      sound.potion();
      s.count--;
      if (s.count <= 0) state.player.inventory.splice(idx, 1);
      log(`${it.name} getrunken.`);
    }
    hud();
  }

  function log(msg) {
    const d = document.createElement('div');
    d.textContent = `🗡️ ${msg}`;
    el('logs').prepend(d);
  }

  function move(dx, dy) {
    if (state.inCombat) return;
    const tx = state.player.x + dx, ty = state.player.y + dy;
    if (map.isWall(tx, ty)) return;

    const mon = state.world.monsters.find(m => m.x === tx && m.y === ty);
    if (mon) {
      startCombat(mon);
      return;
    }

    state.player.x = tx;
    state.player.y = ty;
    sound.step();
    map.reveal();

    const ch = state.world.chests.find(c => c.x === tx && c.y === ty && !c.open);
    if (ch) {
      ch.open = true;
      sound.chest();
      gfx.burst(tx, ty);
      gfx.text('✨ REICHTUM!', tx, ty);
      state.player.gold += ch.caps;
      addItem(ch.item);
      log(`Reliquientruhe geborgen: +${ch.caps} Gold.`);
      setTimeout(() => {
        state.world.chests = state.world.chests.filter(c => c.id !== ch.id);
      }, 800);
    }

    if (state.world.stairs && tx === state.world.stairs.x && ty === state.world.stairs.y) {
      log('Steintreppe in die Tiefe! [E] oder [✦] zum Hinabsteigen.');
    }
    hud();
  }

  function addItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    const e = state.player.inventory.find(x => x.id === id);
    if (it.type === 'potion' || it.type === 'loot') {
      if (e) e.count++;
      else state.player.inventory.push({ id, count: 1 });
    } else {
      state.player.inventory.push({ id, count: 1 });
    }
  }

  function interact() {
    if (state.inCombat) return;
    const s = state.world.stairs;
    if (s && state.player.x === s.x && state.player.y === s.y) {
      sound.stairs();
      map.generate(state.world.depth + 1);
      state.meta.bestDepth = Math.max(state.meta.bestDepth, state.world.depth);
      log(`Du steigst hinab auf Ebene ${state.world.depth}. Die Kreaturen erstarken.`);
      hud();
      saveCurrentSlot();
    }
  }

  function startCombat(m) {
    state.inCombat = true;
    state.activeMonster = m;
    el('combat').classList.remove('hidden');
    combatInfo();
    el('combat-log').textContent = `${m.name} lauert in den Schatten!`;
  }

  function combatInfo() {
    const m = state.activeMonster;
    const p = state.player;
    el('combat-info').innerHTML = `<div><b>${p.name}</b><br>${p.hp}/${p.maxHp} TP · ${p.mp} MP</div><div>⚔️</div><div><b>${m.name}</b><br>${m.hp}/${m.maxHp} TP</div>`;
  }

  el('attack').onclick = () => {
    if (!state.inCombat) return;
    sound.sword();
    const p = state.player, m = state.activeMonster;
    const stats = calculateCombatStats();
    const dmg = Math.max(1, stats.totalAtk - m.def + Math.floor(Math.random() * 4));
    m.hp -= dmg;
    gfx.text(`-${dmg}`, m.x, m.y, '#ffca28');
    if (m.hp <= 0) { winCombat(); return; }
    enemyTurn();
  };

  el('fire').onclick = () => {
    if (!state.inCombat) return;
    const p = state.player, m = state.activeMonster;
    if (p.mp < 8) {
      el('combat-log').textContent = 'Nicht genügend Mana!';
      return;
    }
    p.mp -= 8;
    sound.fire();
    const stats = calculateCombatStats();
    const dmg = Math.max(8, (stats.totalAtk * 2) - m.def + Math.floor(Math.random() * 5));
    m.hp -= dmg;
    gfx.text(`-${dmg}`, m.x, m.y, '#ff7043');
    if (m.hp <= 0) { winCombat(); return; }
    enemyTurn();
  };

  el('heal').onclick = () => {
    const idx = state.player.inventory.findIndex(x => x.id === 'health_potion');
    if (idx >= 0) {
      useItem(idx);
      enemyTurn();
    } else {
      el('combat-log').textContent = 'Kein Heiltrank!';
    }
  };

  el('flee').onclick = () => {
    if (Math.random() > 0.4) {
      state.inCombat = false;
      el('combat').classList.add('hidden');
      log('Du fliehst in die Schatten.');
    } else {
      enemyTurn();
    }
  };

  function enemyTurn() {
    const p = state.player, m = state.activeMonster;
    const stats = calculateCombatStats();
    const dmg = Math.max(1, m.atk - stats.totalDef + Math.floor(Math.random() * 3));
    p.hp -= dmg;
    sound.hurt();
    gfx.text(`-${dmg}`, p.x, p.y, '#f44336');
    el('combat-log').textContent = `${m.name} trifft dich für ${dmg} Schaden!`;
    combatInfo();
    hud();
    if (p.hp <= 0) die();
  }

  function winCombat() {
    const m = state.activeMonster;
    state.player.gold += m.gold;
    state.player.xp += m.xp;
    state.world.monsters = state.world.monsters.filter(x => x.id !== m.id);
    state.inCombat = false;
    el('combat').classList.add('hidden');

    log(`${m.name} bezwungen! +${m.gold} Gold, +${m.xp} EP.`);

    if (m.id === 'boss') {
      state.meta.gold += 50;
      gfx.burst(m.x, m.y);
      gfx.text('👑 BOSS BESIEGT!', m.x, m.y, '#e1bee7');
      log('👑 Der Schattenfürst ist gefallen! +50 Ordensgold.');
    }

    if (state.world.monsters.length === 0) {
      const stairs = map.spawnStairsAfterClear();
      gfx.burst(stairs.x, stairs.y);
      gfx.text('⬇️ TREPPE!', stairs.x, stairs.y, '#ffd54f');
      log(state.world.isBossFloor
        ? '✨ DER BOSS IST GEFALLEN – Das Runensiegel bricht und der Abstieg ist frei!'
        : '✨ DAS RUNENSIEGEL BRICHT – Die Treppe erscheint in der Gruft!');
    } else {
      log(`🔒 Runensiegel aktiv – ${state.world.monsters.length} Gegner verbleiben.`);
    }

    if (state.player.xp >= state.player.nextXp) {
      state.player.level++;
      state.player.xp -= state.player.nextXp;
      state.player.nextXp = Math.floor(state.player.nextXp * 1.5);
      state.player.maxHp += 15;
      state.player.maxMp += 10;
      state.player.hp = state.player.maxHp;
      state.player.mp = state.player.maxMp;
      state.player.atk += 2;
      state.player.def++;
      log(`LEVEL UP! Stufe ${state.player.level}!`);
    }
    hud();
    saveCurrentSlot();
  }

  function die() {
    state.inCombat = false;
    sound.death();
    el('combat').classList.add('hidden');
    state.meta.gold += state.player.gold;
    state.meta.bestDepth = Math.max(state.meta.bestDepth, state.world.depth);
    el('death-stats').innerHTML = `<div>Ebene: <b>${state.world.depth}</b></div><div>Gold im Run: <b>${state.player.gold}</b></div><div>Ordensschatz: <b>${state.meta.gold} 🪙</b></div>`;
    el('death-screen').classList.remove('hidden');

    state.player.hp = state.player.maxHp;
    state.world.depth = 1;
    map.generate(1);
    saveCurrentSlot();
  }

  el('btn-revive').onclick = () => {
    el('death-screen').classList.add('hidden');
    openGame();
  };

  el('btn-back-to-slots').onclick = () => {
    el('death-screen').classList.add('hidden');
    openSlotScreen();
  };

  el('btn-chars').onclick = () => {
    saveCurrentSlot();
    openSlotScreen();
  };

  el('sound').onclick = (e) => {
    const on = sound.toggle();
    e.currentTarget.textContent = on ? '🔊' : '🔇';
  };

  el('save').onclick = () => {
    saveCurrentSlot();
  };

  el('logout').onclick = async () => {
    if (window.firebase && state.user) await firebase.auth().signOut();
    location.reload();
  };

  window.onkeydown = (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
    if (el('game').classList.contains('hidden')) return;

    const k = e.key.toLowerCase();
    const dirs = {
      w: [0, -1], arrowup: [0, -1],
      s: [0, 1], arrowdown: [0, 1],
      a: [-1, 0], arrowleft: [-1, 0],
      d: [1, 0], arrowright: [1, 0]
    };
    if (dirs[k]) {
      e.preventDefault();
      move(...dirs[k]);
    }
    if (k === 'e' || k === ' ') {
      e.preventDefault();
      interact();
    }
  };

  document.querySelectorAll('#touch button').forEach(b => b.onpointerdown = (e) => {
    e.preventDefault();
    const m = b.dataset.m;
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    if (dirs[m]) move(...dirs[m]);
    if (m === 'act') interact();
  });

  document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    el(b.dataset.tab)?.classList.add('active');
  });
});

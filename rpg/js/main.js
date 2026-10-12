// [2026-10-12 19:40] - js/main.js: v0.1.1
import { state, CLASSES } from './core/state.js';
import { ITEMS } from './data/items.js';
import { cloud } from './systems/firebase.js';
import { sound } from './systems/audio.js';
import { WorldMap } from './world/map.js';
import { Renderer } from './world/render.js';

window.addEventListener('DOMContentLoaded', () => {
  const map = new WorldMap();
  const gfx = new Renderer('stage');
  let selectedClass = 'warrior';
  let authMode = 'login';

  const el = id => document.getElementById(id);

  // Animierter Glutregen auf dem Login-Screen
  const loginCanvas = el('login-canvas');
  if (loginCanvas) {
    const lx = loginCanvas.getContext('2d');
    let w = loginCanvas.width = window.innerWidth;
    let h = loginCanvas.height = window.innerHeight;
    window.onresize = () => {
      w = loginCanvas.width = window.innerWidth;
      h = loginCanvas.height = window.innerHeight;
    };
    const embers = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 1 + Math.random() * 3,
      v: 0.4 + Math.random() * 1.2,
      a: Math.random()
    }));
    setInterval(() => {
      lx.clearRect(0, 0, w, h);
      for (const e of embers) {
        e.y -= e.v;
        e.x += Math.sin(e.y * 0.02) * 0.6;
        if (e.y < 0) {
          e.y = h;
          e.x = Math.random() * w;
        }
        lx.fillStyle = `rgba(255,140,40,${e.a})`;
        lx.fillRect(e.x, e.y, e.s, e.s);
      }
    }, 33);
  }

  // Cloud Status prüfen
  cloud.init();
  if (cloud.ready) {
    el('cloud-status').className = 'cloud ok';
    el('cloud-status').textContent = '● CLOUD-ARCHIV VERBUNDEN';
  } else {
    el('cloud-status').className = 'cloud offline';
    el('cloud-status').textContent = '● OFFLINE-MODUS (LOKAL)';
  }

  // Auth Tabs
  el('tab-login').onclick = () => {
    el('tab-login').classList.add('active');
    el('tab-register').classList.remove('active');
    authMode = 'login';
    el('auth-submit').textContent = '⚔️ IN DIE GRUFT HERABSTEIGEN';
    el('auth-error').classList.add('hidden');
  };

  el('tab-register').onclick = () => {
    el('tab-register').classList.add('active');
    el('tab-login').classList.remove('active');
    authMode = 'register';
    el('auth-submit').textContent = '🛡️ NEUEN ACCOUNT ERSTELLEN';
    el('auth-error').classList.add('hidden');
  };

  function showError(msg) {
    const box = el('auth-error');
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  // Submit Login/Register
  el('auth-submit').onclick = async () => {
    sound.ensureContext();
    const em = el('auth-email').value.trim();
    const pw = el('auth-password').value.trim();

    if (!em || !pw) {
      showError('Bitte Email und Passwort eingeben.');
      return;
    }

    el('auth-error').classList.add('hidden');
    el('auth-submit').disabled = true;
    el('auth-submit').textContent = '⏳ VERBINDE MIT ORDENSARCHIV...';

    try {
      if (authMode === 'login') {
        state.user = await cloud.login(em, pw);
        state.isGuest = false;
      } else {
        state.user = await cloud.register(em, pw);
        state.isGuest = false;
      }
      await startAfterAuth();
    } catch (err) {
      showError(err.message || 'Fehler bei der Anmeldung.');
      el('auth-submit').disabled = false;
      el('auth-submit').textContent = authMode === 'login' ? '⚔️ IN DIE GRUFT HERABSTEIGEN' : '🛡️ NEUEN ACCOUNT ERSTELLEN';
    }
  };

  // Gast Login
  el('guest-btn').onclick = async () => {
    sound.ensureContext();
    state.isGuest = true;
    state.user = null;
    await startAfterAuth();
  };

  async function startAfterAuth() {
    el('login-screen').classList.add('hidden');
    const saved = await cloud.load();

    if (saved && saved.player && saved.player.name) {
      Object.assign(state.player, saved.player);
      if (saved.meta) Object.assign(state.meta, saved.meta);

      // Verhindere korrupte Weltkarten aus älteren Versionen
      if (saved.world && Array.isArray(saved.world.tiles) && saved.world.tiles.length === 15) {
        Object.assign(state.world, saved.world);
        map.reveal();
      } else {
        map.generate(saved.world?.depth || 1);
      }
      openGame();
    } else {
      el('class-screen').classList.remove('hidden');
    }
  }

  // Klassenwahl
  document.querySelectorAll('.class').forEach(b => {
    b.onclick = () => {
      sound.ensureContext();
      document.querySelectorAll('.class').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      selectedClass = b.dataset.class;
    };
  });

  el('start-run').onclick = () => {
    sound.ensureContext();
    const nm = el('run-name').value.trim() || 'Schattenjäger';
    newRun(selectedClass, nm);
    el('class-screen').classList.add('hidden');
    openGame();
  };

  function newRun(cId, name) {
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
    state.player.equipped.weapon = c.weapon ? c.weapon : null;
    state.player.equipped.armor = c.armor ? c.armor : null;
    map.generate(1);
    cloud.save(state);
  }

  function openGame() {
    el('game').classList.remove('hidden');
    hud();
    log(`Du betrittst Ebene ${state.world.depth} der Schattengruft.`);
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
    renderStats();
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
      d.innerHTML = `<span>${it.name} x${s.count}</span><span>[Nutzen]</span>`;
      d.onclick = () => { useItem(idx); };
      box.append(d);
    });
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
    } else if (it.type === 'weapon') {
      state.player.equipped.weapon = s.id;
      sound.sword();
    } else if (it.type === 'armor') {
      state.player.equipped.armor = s.id;
    }
    hud();
  }

  function renderStats() {
    const p = state.player;
    const w = ITEMS[p.equipped.weapon];
    const a = ITEMS[p.equipped.armor];
    el('stats').textContent = `Waffe: ${w ? w.name : 'Keine'}\nRüstung: ${a ? a.name : 'Keine'}\nSchlagkraft: ${p.atk + (w ? w.val : 0)}\nSchutz: ${p.def + (a ? a.val : 0)}\nTiefe: Ebene ${state.world.depth}\nMeta-Gold: ${state.meta.gold} 🪙`;
  }

  function log(msg) {
    const d = document.createElement('div');
    d.textContent = `🗡️ ${msg}`;
    el('logs').prepend(d);
  }

  function move(dx, dy) {
    if (state.locked || state.inCombat) return;
    const tx = state.player.x + dx;
    const ty = state.player.y + dy;
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

    // Schatztruhe öffnen & nach 800ms auflösen
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
      log('Steintreppe in die Tiefe! [E], [Leertaste] oder [✦] zum Hinabsteigen.');
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
    if (state.locked || state.inCombat) return;
    const s = state.world.stairs;
    if (s && state.player.x === s.x && state.player.y === s.y) {
      sound.stairs();
      map.generate(state.world.depth + 1);
      state.meta.bestDepth = Math.max(state.meta.bestDepth, state.world.depth);
      log(`Du steigst hinab auf Ebene ${state.world.depth}. Die Kreaturen erstarken.`);
      hud();
      cloud.save(state);
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
    const p = state.player;
    const m = state.activeMonster;
    const w = ITEMS[p.equipped.weapon];
    const dmg = Math.max(1, p.atk + (w ? w.val : 0) - m.def + Math.floor(Math.random() * 4));
    m.hp -= dmg;
    gfx.text(`-${dmg}`, m.x, m.y, '#ffca28');
    if (m.hp <= 0) {
      winCombat();
      return;
    }
    enemyTurn();
  };

  el('fire').onclick = () => {
    if (!state.inCombat) return;
    const p = state.player;
    const m = state.activeMonster;
    if (p.mp < 8) {
      el('combat-log').textContent = 'Nicht genügend Mana!';
      return;
    }
    p.mp -= 8;
    sound.fire();
    const dmg = Math.max(8, (p.atk * 2) - m.def + Math.floor(Math.random() * 5));
    m.hp -= dmg;
    gfx.text(`-${dmg}`, m.x, m.y, '#ff7043');
    if (m.hp <= 0) {
      winCombat();
      return;
    }
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
    const p = state.player;
    const m = state.activeMonster;
    const a = ITEMS[p.equipped.armor];
    const dmg = Math.max(1, m.atk - (p.def + (a ? a.val : 0)) + Math.floor(Math.random() * 3));
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
    cloud.save(state);
  }

  function die() {
    state.inCombat = false;
    sound.death();
    el('combat').classList.add('hidden');
    state.meta.gold += state.player.gold;
    state.meta.bestDepth = Math.max(state.meta.bestDepth, state.world.depth);
    el('death-stats').innerHTML = `<div>Ebene: <b>${state.world.depth}</b></div><div>Gold im Run: <b>${state.player.gold}</b></div><div>Ordensschatz: <b>${state.meta.gold} 🪙</b></div>`;
    el('death-screen').classList.remove('hidden');
    cloud.save(null);
  }

  el('new-run').onclick = () => {
    el('death-screen').classList.add('hidden');
    el('class-screen').classList.remove('hidden');
  };

  el('sound').onclick = (e) => {
    const on = sound.toggle();
    e.currentTarget.textContent = on ? '🔊' : '🔇';
  };

  el('save').onclick = () => {
    cloud.save(state);
    log('Spielstand gesichert (Cloud/Lokal).');
  };

  el('logout').onclick = async () => {
    if (window.firebase && state.user) await firebase.auth().signOut();
    location.reload();
  };

  window.onkeydown = (e) => {
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

  document.querySelectorAll('#touch button').forEach(b => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      const m = b.dataset.m;
      const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      if (dirs[m]) move(...dirs[m]);
      if (m === 'act') interact();
    };
  });

  document.querySelectorAll('nav button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      el(b.dataset.tab)?.classList.add('active');
    };
  });
});

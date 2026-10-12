// [2026-10-12 18:55] - js/world/map.js: v0.0.9 Verliesebenen, Treppen-Abstieg & Validierte Spawns
// Änderungen:
// - Verliesebenen-System: `descend()` erhöht Tiefe, generiert neues Layout & skaliert Gegner/Beute.
// - Treppen-Kachel nach unten (`state.world.stairs = {x, y}`) platziert.
// - Zuverlässige Spawn-Validierung: Keine Monster oder Kisten mehr in Wänden.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';
import { MONSTER_TYPES } from '../data/monsters.js';

export const TILE_FLOOR = 0;
export const TILE_STONE_WALL = 1;
export const TILE_CRYPT_CHAMBER = 2;

export class WorldMap {
  constructor() {
    this.initMap();
  }

  initMap() {
    const { cols, rows } = state.world;
    state.world.tiles = [];

    // Sauberes Raster initialisieren
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
          row.push(TILE_STONE_WALL);
        } else {
          row.push(TILE_FLOOR);
        }
      }
      state.world.tiles.push(row);
    }

    // Grabkammern
    this.createChamber(4, 3, 5, 4);
    this.createChamber(12, 7, 5, 4);
    this.createPillars();

    // Fog-of-War Raster initialisieren
    if (!Array.isArray(state.world.discovered) || state.world.discovered.length !== rows) {
      state.world.discovered = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    // Truhen initialisieren
    if (!Array.isArray(state.world.chests) || state.world.chests.length === 0) {
      this.spawnChests();
    }

    // Monster spawnen & an Ebenentiefe anpassen
    if (!Array.isArray(state.world.monsters) || state.world.monsters.length === 0) {
      this.spawnMonsters();
    }

    // Steintreppe nach unten platzieren
    state.world.stairs = this.findSafeFloorTile(17, 12);

    // Entitäten-Positionen validieren
    this.repairPositions();

    // Spieler-Sichtfeld aufdecken
    const px = Number.isFinite(state.player.x) ? state.player.x : 2;
    const py = Number.isFinite(state.player.y) ? state.player.y : 2;
    state.player.x = px;
    state.player.y = py;
    this.revealTorchLight(px, py);
  }

  spawnChests() {
    const d = state.world.depth || 1;
    const bonusGold = (d - 1) * 15;
    state.world.chests = [
      { id: `c_d${d}_1`, ...this.findSafeFloorTile(6, 5), opened: false, item: d > 1 ? 'runic_blade' : 'iron_sword', caps: 25 + bonusGold },
      { id: `c_d${d}_2`, ...this.findSafeFloorTile(14, 9), opened: false, item: d > 1 ? 'knight_armor' : 'chainmail', caps: 35 + bonusGold },
      { id: `c_d${d}_3`, ...this.findSafeFloorTile(17, 3), opened: false, item: d > 1 ? 'elixir_vitality' : 'health_potion', caps: 15 + bonusGold }
    ];
  }

  spawnMonsters() {
    const d = state.world.depth || 1;
    const hpScale = 1 + (d - 1) * 0.25;
    const atkScale = 1 + (d - 1) * 0.15;
    const goldScale = 1 + (d - 1) * 0.3;

    const makeMon = (id, tmpl, x, y) => ({
      id,
      ...tmpl,
      x,
      y,
      maxHp: Math.round(tmpl.maxHp * hpScale),
      hp: Math.round(tmpl.maxHp * hpScale),
      atk: Math.round(tmpl.atk * atkScale),
      minCaps: Math.round(tmpl.minCaps * goldScale),
      maxCaps: Math.round(tmpl.maxCaps * goldScale)
    });

    state.world.monsters = [
      makeMon(`m_d${d}_1`, MONSTER_TYPES.goblin, ...Object.values(this.findSafeFloorTile(5, 8))),
      makeMon(`m_d${d}_2`, MONSTER_TYPES.goblin, ...Object.values(this.findSafeFloorTile(10, 3))),
      makeMon(`m_d${d}_3`, MONSTER_TYPES.skeleton_warrior, ...Object.values(this.findSafeFloorTile(14, 4))),
      makeMon(`m_d${d}_4`, MONSTER_TYPES.skeleton_warrior, ...Object.values(this.findSafeFloorTile(10, 12))),
      makeMon(`m_d${d}_5`, MONSTER_TYPES.crypt_lord, ...Object.values(this.findSafeFloorTile(16, 11)))
    ];
  }

  isWall(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
    if (x <= 0 || x >= state.world.cols - 1 || y <= 0 || y >= state.world.rows - 1) return true;
    const t = state.world.tiles[y]?.[x];
    return t === TILE_STONE_WALL || t === TILE_CRYPT_CHAMBER;
  }

  findSafeFloorTile(prefX, prefY) {
    if (!this.isWall(prefX, prefY)) {
      return { x: prefX, y: prefY };
    }

    for (let r = 1; r < 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = prefX + dx;
          const ty = prefY + dy;
          if (!this.isWall(tx, ty)) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return { x: 2, y: 2 };
  }

  repairPositions() {
    state.world.chests.forEach(c => {
      if (this.isWall(c.x, c.y)) {
        const safe = this.findSafeFloorTile(c.x, c.y);
        c.x = safe.x;
        c.y = safe.y;
      }
    });

    state.world.monsters.forEach(m => {
      if (this.isWall(m.x, m.y)) {
        const safe = this.findSafeFloorTile(m.x, m.y);
        m.x = safe.x;
        m.y = safe.y;
      }
    });

    if (this.isWall(state.trader.x, state.trader.y)) {
      const safe = this.findSafeFloorTile(3, 4);
      state.trader.x = safe.x;
      state.trader.y = safe.y;
    }
  }

  createChamber(rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (x === rx || x === rx + rw - 1 || y === ry || y === ry + rh - 1) {
          if (!(x === rx + 2 && y === ry)) {
            state.world.tiles[y][x] = TILE_CRYPT_CHAMBER;
          }
        }
      }
    }
  }

  createPillars() {
    const pillars = [
      { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 9, y: 8 },
      { x: 14, y: 2 }, { x: 14, y: 3 }
    ];
    pillars.forEach(p => {
      if (state.world.tiles[p.y]) state.world.tiles[p.y][p.x] = TILE_STONE_WALL;
    });
  }

  revealTorchLight(px, py) {
    const radius = 4;
    for (let y = Math.max(0, py - radius); y <= Math.min(state.world.rows - 1, py + radius); y++) {
      for (let x = Math.max(0, px - radius); x <= Math.min(state.world.cols - 1, px + radius); x++) {
        const dist = Math.hypot(x - px, y - py);
        if (dist <= radius && state.world.discovered[y]) {
          if (!state.world.discovered[y][x]) {
            state.world.discovered[y][x] = true;
            state.player.tilesVisited++;
          }
        }
      }
    }
  }

  tryMovePlayer(dx, dy) {
    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (this.isWall(newX, newY)) {
      eventBus.emit('log:message', 'Eine massive Steinmauer versperrt den Pfad.');
      return false;
    }

    if (newX === state.trader.x && newY === state.trader.y) {
      eventBus.emit('shop:engage');
      return false;
    }

    const mon = state.world.monsters.find(m => m.x === newX && m.y === newY);
    if (mon) {
      eventBus.emit('fx:encounter', { x: newX, y: newY });
      eventBus.emit('combat:engage', mon);
      return false;
    }

    state.player.x = newX;
    state.player.y = newY;
    this.revealTorchLight(newX, newY);

    // Kisten berühren / öffnen
    const chest = state.world.chests.find(c => c.x === newX && c.y === newY && !c.opened);
    if (chest) {
      eventBus.emit('chest:opened', chest);
    }

    // Auf Treppe getreten
    if (state.world.stairs && newX === state.world.stairs.x && newY === state.world.stairs.y) {
      eventBus.emit('stairs:reached');
    }

    eventBus.emit('hud:updated');
    eventBus.emit('storage:autosave');
    return true;
  }

  // Abstieg in die nächste Verlies-Ebene
  descend() {
    state.world.depth = (state.world.depth || 1) + 1;
    state.player.bestDepth = Math.max(state.player.bestDepth || 1, state.world.depth);

    // Neuer Nebel, neue Truhen und stärkere Monster
    state.world.discovered = Array.from({ length: state.world.rows }, () => Array(state.world.cols).fill(false));
    state.world.chests = [];
    state.world.monsters = [];

    // Spieler zurück an den Eingang
    state.player.x = 2;
    state.player.y = 2;

    this.initMap();

    eventBus.emit('audio:stairs');
    eventBus.emit('log:message', `⚔️ Du steigst hinab in Verlies-Ebene ${state.world.depth}! Die Schatten werden kälter...`);
    eventBus.emit('hud:updated');
    eventBus.emit('storage:autosave');
    return true;
  }
}

// [2026-10-12 13:30] - js/world/map.js: v0.0.5 Katakomben-Kartenaufbau
// Änderungen:
// - Barrieren, Truhen und Monster auf 20x15 Raster platziert.

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

    const needDiscInit = !state.world.discovered || state.world.discovered.length === 0;
    if (needDiscInit) state.world.discovered = [];

    for (let y = 0; y < rows; y++) {
      const row = [];
      const discRow = [];
      for (let x = 0; x < cols; x++) {
        if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
          row.push(TILE_STONE_WALL);
        } else {
          row.push(TILE_FLOOR);
        }
        discRow.push(false);
      }
      state.world.tiles.push(row);
      if (needDiscInit) state.world.discovered.push(discRow);
    }

    this.createChamber(4, 3, 5, 4);
    this.createChamber(12, 7, 5, 4);
    this.createPillars();

    if (!state.world.chests || state.world.chests.length === 0) {
      state.world.chests = [
        { id: 'c1', x: 7, y: 5, opened: false, item: 'iron_sword', caps: 25 },
        { id: 'c2', x: 15, y: 9, opened: false, item: 'chainmail', caps: 35 },
        { id: 'c3', x: 17, y: 3, opened: false, item: 'health_potion', caps: 15 }
      ];
    }

    if (!state.world.monsters || state.world.monsters.length === 0) {
      state.world.monsters = [
        { id: 'm1', ...MONSTER_TYPES.goblin, x: 5, y: 8, hp: 22 },
        { id: 'm2', ...MONSTER_TYPES.goblin, x: 8, y: 3, hp: 22 },
        { id: 'm3', ...MONSTER_TYPES.skeleton_warrior, x: 13, y: 4, hp: 38 },
        { id: 'm4', ...MONSTER_TYPES.skeleton_warrior, x: 10, y: 12, hp: 38 },
        { id: 'm5', ...MONSTER_TYPES.crypt_lord, x: 16, y: 11, hp: 65 }
      ];
    }

    this.revealTorchLight(state.player.x, state.player.y);
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
      {x: 8, y: 7}, {x: 8, y: 8}, {x: 9, y: 8},
      {x: 14, y: 2}, {x: 14, y: 3}
    ];
    pillars.forEach(p => { state.world.tiles[p.y][p.x] = TILE_STONE_WALL; });
  }

  revealTorchLight(px, py) {
    const radius = 4;
    for (let y = Math.max(0, py - radius); y <= Math.min(state.world.rows - 1, py + radius); y++) {
      for (let x = Math.max(0, px - radius); x <= Math.min(state.world.cols - 1, px + radius); x++) {
        const dist = Math.hypot(x - px, y - py);
        if (dist <= radius) {
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

    if (newX < 0 || newX >= state.world.cols || newY < 0 || newY >= state.world.rows) return;

    const tile = state.world.tiles[newY][newX];
    if (tile === TILE_STONE_WALL || tile === TILE_CRYPT_CHAMBER) {
      eventBus.emit('log:message', 'Eine massive Steinmauer versperrt den Pfad.');
      return;
    }

    if (newX === state.trader.x && newY === state.trader.y) {
      eventBus.emit('shop:engage');
      return;
    }

    const mon = state.world.monsters.find(m => m.x === newX && m.y === newY);
    if (mon) {
      eventBus.emit('combat:engage', mon);
      return;
    }

    state.player.x = newX;
    state.player.y = newY;
    this.revealTorchLight(newX, newY);

    const chest = state.world.chests.find(c => c.x === newX && c.y === newY && !c.opened);
    if (chest) {
      eventBus.emit('chest:opened', chest);
    }

    eventBus.emit('world:updated');
    eventBus.emit('hud:updated');
    eventBus.emit('storage:autosave');
  }
}

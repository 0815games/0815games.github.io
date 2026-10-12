// [2026-10-12 13:15] - js/world/map.js: v0.0.2 Kartenlogik mit Händler-Interaktion
// Änderungen:
// - Händler-Kollision und automatisches Öffnen des Handelspostens bei Betreten des Händlerfeldes.
// - Saubere Initialisierung unter Berücksichtigung geladener Speicherstände.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';
import { MONSTER_TYPES } from '../data/monsters.js';

export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_RUIN = 2;

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
          row.push(TILE_WALL);
        } else {
          row.push(TILE_EMPTY);
        }
        discRow.push(false);
      }
      state.world.tiles.push(row);
      if (needDiscInit) state.world.discovered.push(discRow);
    }

    this.createRuinRoom(4, 3, 4, 4);
    this.createRuinRoom(11, 7, 5, 4);
    this.createWallBarriers();

    if (!state.world.chests || state.world.chests.length === 0) {
      state.world.chests = [
        { id: 'c1', x: 6, y: 5, opened: false, item: 'pipe_pistol', caps: 15 },
        { id: 'c2', x: 14, y: 9, opened: false, item: 'leather_armor', caps: 30 },
        { id: 'c3', x: 17, y: 3, opened: false, item: 'stimpack', caps: 10 }
      ];
    }

    if (!state.world.monsters || state.world.monsters.length === 0) {
      state.world.monsters = [
        { id: 'm1', ...MONSTER_TYPES.rad_roach, x: 5, y: 8, hp: 20 },
        { id: 'm2', ...MONSTER_TYPES.rad_roach, x: 8, y: 3, hp: 20 },
        { id: 'm3', ...MONSTER_TYPES.mutant_dog, x: 13, y: 4, hp: 35 },
        { id: 'm4', ...MONSTER_TYPES.mutant_dog, x: 10, y: 12, hp: 35 },
        { id: 'm5', ...MONSTER_TYPES.raider, x: 16, y: 11, hp: 55 }
      ];
    }

    this.revealFog(state.player.x, state.player.y);
  }

  createRuinRoom(rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (x === rx || x === rx + rw - 1 || y === ry || y === ry + rh - 1) {
          if (!(x === rx + 2 && y === ry)) {
            state.world.tiles[y][x] = TILE_RUIN;
          }
        }
      }
    }
  }

  createWallBarriers() {
    const rocks = [
      {x: 8, y: 7}, {x: 8, y: 8}, {x: 9, y: 8},
      {x: 15, y: 2}, {x: 15, y: 3}
    ];
    rocks.forEach(r => { state.world.tiles[r.y][r.x] = TILE_WALL; });
  }

  revealFog(px, py) {
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

    // Wandkollision
    const tile = state.world.tiles[newY][newX];
    if (tile === TILE_WALL || tile === TILE_RUIN) {
      eventBus.emit('log:message', 'Weg versperrt.');
      return;
    }

    // Händler betreten
    if (newX === state.trader.x && newY === state.trader.y) {
      eventBus.emit('shop:engage');
      return;
    }

    // Monsterkollision
    const mon = state.world.monsters.find(m => m.x === newX && m.y === newY);
    if (mon) {
      eventBus.emit('combat:engage', mon);
      return;
    }

    state.player.x = newX;
    state.player.y = newY;
    this.revealFog(newX, newY);

    const chest = state.world.chests.find(c => c.x === newX && c.y === newY && !c.opened);
    if (chest) {
      eventBus.emit('chest:opened', chest);
    }

    eventBus.emit('world:updated');
    eventBus.emit('hud:updated');
    eventBus.emit('storage:autosave');
  }
}

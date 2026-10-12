// [2026-10-12 13:50] - js/world/map.js: v0.0.8 Bugfix für Monster-Wand-Spawns & Validiertes Layout
// Änderungen:
// - BUGFIX: Koordinaten für Monster und Truhen werden strikt gegen Wände geprüft (kein Spawn in Wänden oder Säulen mehr).
// - Methode `findSafeFloorTile`: Garantiert freie Bodenkacheln für alle Entitäten.
// - Event `fx:encounter` bei Kollision mit Monstern für Schock- und Ruckeleffekte.

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

    // Grabkammern platzieren
    this.createChamber(4, 3, 5, 4);
    this.createChamber(12, 7, 5, 4);
    this.createPillars();

    // Validiere Truhenspawns (NUR auf TILE_FLOOR)
    if (!state.world.chests || state.world.chests.length === 0) {
      state.world.chests = [
        { id: 'c1', ...this.findSafeFloorTile(6, 5), opened: false, item: 'iron_sword', caps: 25 },
        { id: 'c2', ...this.findSafeFloorTile(14, 9), opened: false, item: 'chainmail', caps: 35 },
        { id: 'c3', ...this.findSafeFloorTile(17, 3), opened: false, item: 'health_potion', caps: 15 }
      ];
    } else {
      // Bestehende Kisten korrigieren, falls in Wand gespeichert
      state.world.chests.forEach(c => {
        if (this.isWall(c.x, c.y)) {
          const safe = this.findSafeFloorTile(c.x, c.y);
          c.x = safe.x;
          c.y = safe.y;
        }
      });
    }

    // Validiere Monsterspawns (NUR auf TILE_FLOOR)
    if (!state.world.monsters || state.world.monsters.length === 0) {
      state.world.monsters = [
        { id: 'm1', ...MONSTER_TYPES.goblin, ...this.findSafeFloorTile(5, 8), hp: 22 },
        { id: 'm2', ...MONSTER_TYPES.goblin, ...this.findSafeFloorTile(10, 3), hp: 22 },
        { id: 'm3', ...MONSTER_TYPES.skeleton_warrior, ...this.findSafeFloorTile(14, 4), hp: 38 },
        { id: 'm4', ...MONSTER_TYPES.skeleton_warrior, ...this.findSafeFloorTile(10, 12), hp: 38 },
        { id: 'm5', ...MONSTER_TYPES.crypt_lord, ...this.findSafeFloorTile(16, 11), hp: 65 }
      ];
    } else {
      // Bereits gespeicherte Monster korrigieren, falls sie in Wänden standen!
      state.world.monsters.forEach(m => {
        if (this.isWall(m.x, m.y)) {
          const safe = this.findSafeFloorTile(m.x, m.y);
          m.x = safe.x;
          m.y = safe.y;
        }
      });
    }

    this.revealTorchLight(state.player.x, state.player.y);
  }

  isWall(x, y) {
    if (x <= 0 || x >= state.world.cols - 1 || y <= 0 || y >= state.world.rows - 1) return true;
    const t = state.world.tiles[y][x];
    return t === TILE_STONE_WALL || t === TILE_CRYPT_CHAMBER;
  }

  findSafeFloorTile(prefX, prefY) {
    // Falls Wunschkoordinate frei ist
    if (!this.isWall(prefX, prefY) && !this.isOccupied(prefX, prefY)) {
      return { x: prefX, y: prefY };
    }

    // Spiralförmige Suche nach der nächsten freien Kachel
    for (let r = 1; r < 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const testX = prefX + dx;
          const testY = prefY + dy;
          if (!this.isWall(testX, testY) && !this.isOccupied(testX, testY)) {
            return { x: testX, y: testY };
          }
        }
      }
    }
    return { x: 2, y: 2 };
  }

  isOccupied(x, y) {
    if (x === state.player.x && y === state.player.y) return true;
    if (x === state.trader.x && y === state.trader.y) return true;
    if (state.world.chests && state.world.chests.some(c => c.x === x && c.y === y)) return true;
    if (state.world.monsters && state.world.monsters.some(m => m.x === x && m.y === y)) return true;
    return false;
  }

  createChamber(rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (x === rx || x === rx + rw - 1 || y === ry || y === ry + rh - 1) {
          // Offener Durchgang
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

    if (this.isWall(newX, newY)) {
      eventBus.emit('log:message', 'Eine massive Steinmauer versperrt den Pfad.');
      return;
    }

    if (newX === state.trader.x && newY === state.trader.y) {
      eventBus.emit('shop:engage');
      return;
    }

    const mon = state.world.monsters.find(m => m.x === newX && m.y === newY);
    if (mon) {
      // Schock-Effekt und Gefecht starten
      eventBus.emit('fx:encounter', { x: newX, y: newY });
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

    eventBus.emit('hud:updated');
    eventBus.emit('storage:autosave');
  }
}

// [2026-10-12 08:13] - js/world/map.js: Zonen- & Kollisionsverwaltung
// Änderungen:
// - Kollisionsberechnung für feste Barrieren und Auslösen von Monster-Interaktionen.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';
import { MONSTER_TEMPLATES } from '../data/monsters.js';

export class ZoneMap {
  constructor() {
    this.initZone();
  }

  initZone() {
    state.activeZone.walls = [
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
      { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 }
    ];

    state.activeZone.monsters = [
      { id: 101, ...MONSTER_TEMPLATES.rad_roach, x: 5, y: 2, currentHp: 18 },
      { id: 102, ...MONSTER_TEMPLATES.wild_dog, x: 9, y: 7, currentHp: 32 },
      { id: 103, ...MONSTER_TEMPLATES.raider_scout, x: 12, y: 12, currentHp: 50 }
    ];
  }

  tryMovePlayer(dx, dy) {
    const targetX = state.player.x + dx;
    const targetY = state.player.y + dy;

    if (targetX < 0 || targetX >= state.activeZone.width || targetY < 0 || targetY >= state.activeZone.height) {
      return;
    }

    const hitWall = state.activeZone.walls.some(w => w.x === targetX && w.y === targetY);
    if (hitWall) return;

    const monster = state.activeZone.monsters.find(m => m.x === targetX && m.y === targetY);
    if (monster) {
      eventBus.emit('combat:engage', monster);
      return;
    }

    state.player.x = targetX;
    state.player.y = targetY;
    eventBus.emit('world:updated');
  }
}

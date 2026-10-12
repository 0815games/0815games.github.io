// [2026-10-12 13:15] - js/systems/combat.js: v0.0.2 Kampfsystem mit Speicherschnittstelle
// Änderungen:
// - Automatisches Zwischenspeichern nach gewonnenen Gefechten.
// - Beuteübernahme und Levelaufstieg optimiert.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';

export class CombatSystem {
  constructor(inventorySys, storageSys) {
    this.invSys = inventorySys;
    this.storageSys = storageSys;
  }

  startCombat(monster) {
    state.inCombat = true;
    state.activeMonster = monster;
    eventBus.emit('combat:started', monster);
    eventBus.emit('log:message', `Gefecht begonnen mit ${monster.name}!`);
  }

  attack(isCritAttempt = false) {
    if (!state.inCombat || !state.activeMonster) return;
    const m = state.activeMonster;

    let baseDmg = this.invSys.getTotalAtk();
    let playerDmg = 0;

    if (isCritAttempt) {
      if (Math.random() < 0.55) {
        playerDmg = Math.max(2, (baseDmg * 2) - m.def);
        eventBus.emit('combat:log', `KRITISCHER TREFFER! ${m.name} erleidet ${playerDmg} Schaden!`);
      } else {
        playerDmg = Math.max(1, Math.floor(baseDmg * 0.5) - m.def);
        eventBus.emit('combat:log', `Schuss ging daneben/gestreift! Nur ${playerDmg} Schaden.`);
      }
    } else {
      playerDmg = Math.max(1, baseDmg - m.def + Math.floor(Math.random() * 4));
      eventBus.emit('combat:log', `Du triffst ${m.name} für ${playerDmg} Schaden.`);
    }

    m.hp -= playerDmg;
    eventBus.emit('fx:dmg', { text: `-${playerDmg}`, x: m.x, y: m.y, color: '#ffcc00' });

    if (m.hp <= 0) {
      this.winCombat(m);
      return;
    }

    const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef() + Math.floor(Math.random() * 3));
    state.player.hp = Math.max(0, state.player.hp - monDmg);
    eventBus.emit('combat:log', `${m.name} schlägt zurück für ${monDmg} Schaden!`);
    eventBus.emit('fx:dmg', { text: `-${monDmg}`, x: state.player.x, y: state.player.y, color: '#ff3333' });

    if (state.player.hp <= 0) {
      eventBus.emit('combat:log', 'Du bist den Wunden erlegen!');
      setTimeout(() => {
        alert('💀 DU BIST IM ÖDLAND GESTORBEN! 💀');
        location.reload();
      }, 500);
    }

    eventBus.emit('combat:updated');
    eventBus.emit('hud:updated');
  }

  healInBattle() {
    const stimIdx = state.player.inventory.findIndex(i => (i.itemId === 'stimpack' || i.itemId === 'stimpack_super') && i.count > 0);
    if (stimIdx === -1) {
      eventBus.emit('combat:log', 'Kein Stimpak im Rucksack!');
      return;
    }

    this.invSys.useItem(stimIdx);
    eventBus.emit('combat:log', 'Stimpak im Gefecht injiziert!');

    if (state.activeMonster) {
      const m = state.activeMonster;
      const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef());
      state.player.hp = Math.max(0, state.player.hp - monDmg);
      eventBus.emit('combat:log', `${m.name} nutzt deine Ablenkung: -${monDmg} TP.`);
    }

    eventBus.emit('combat:updated');
    eventBus.emit('hud:updated');
  }

  flee() {
    if (Math.random() > 0.45) {
      eventBus.emit('log:message', 'Erfolgreich aus dem Gefecht getürmt!');
      this.endCombat();
    } else {
      eventBus.emit('combat:log', 'Fluchtversuch abgefangen!');
      const m = state.activeMonster;
      const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef());
      state.player.hp = Math.max(0, state.player.hp - monDmg);
      eventBus.emit('combat:updated');
      eventBus.emit('hud:updated');
    }
  }

  winCombat(m) {
    const capsEarned = Math.floor(Math.random() * (m.maxCaps - m.minCaps + 1)) + m.minCaps;
    state.player.caps += capsEarned;
    state.player.exp += m.exp;

    if (m.loot) {
      m.loot.forEach(l => {
        if (Math.random() <= l.chance) {
          this.invSys.addItem(l.id, 1);
          eventBus.emit('log:message', `Beute erhalten: ${l.id}!`);
        }
      });
    }

    state.world.monsters = state.world.monsters.filter(entry => entry.id !== m.id);
    eventBus.emit('log:message', `${m.name} besiegt! +${capsEarned} Korken, +${m.exp} EP.`);

    this.checkLevelUp();
    this.endCombat();
    this.storageSys.saveGame(true);
  }

  checkLevelUp() {
    if (state.player.exp >= state.player.nextExp) {
      state.player.level++;
      state.player.exp -= state.player.nextExp;
      state.player.nextExp = Math.floor(state.player.nextExp * 1.5);
      state.player.maxHp += 15;
      state.player.hp = state.player.maxHp;
      state.player.baseAtk += 2;
      state.player.baseDef += 1;
      eventBus.emit('log:message', `⭐ LEVEL-UP! Du hast Stufe ${state.player.level} erreicht!`);
    }
  }

  endCombat() {
    state.inCombat = false;
    state.activeMonster = null;
    eventBus.emit('combat:ended');
    eventBus.emit('world:updated');
    eventBus.emit('hud:updated');
  }
}

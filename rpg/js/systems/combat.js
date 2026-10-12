// [2026-10-12 13:25] - js/systems/combat.js: v0.0.4 Fantasy-Kampfsystem mit Magie
// Änderungen:
// - Zauberangriff "Feuerball" eingeführt (verbraucht 8 MP für garantierten Durchschlagsschaden).
// - TP & MP Ressourcenverwaltung im Kampf integriert.

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
    eventBus.emit('log:message', `Ein feindseliger ${monster.name} tritt aus den Schatten hervor!`);
  }

  attack(useSpell = false) {
    if (!state.inCombat || !state.activeMonster) return;
    const m = state.activeMonster;

    let baseDmg = this.invSys.getTotalAtk();
    let playerDmg = 0;

    if (useSpell) {
      if (state.player.mp < 8) {
        eventBus.emit('combat:log', 'Nicht genügend Mana für einen Feuerball!');
        return;
      }
      state.player.mp -= 8;
      playerDmg = Math.max(8, (baseDmg * 2) - Math.floor(m.def * 0.5) + Math.floor(Math.random() * 4));
      eventBus.emit('combat:log', `🔥 FEUERBALL entfacht! ${m.name} verbrennt für ${playerDmg} Schaden!`);
    } else {
      playerDmg = Math.max(1, baseDmg - m.def + Math.floor(Math.random() * 4));
      eventBus.emit('combat:log', `Du triffst ${m.name} für ${playerDmg} Schaden.`);
    }

    m.hp -= playerDmg;
    eventBus.emit('fx:dmg', { text: `-${playerDmg}`, x: m.x, y: m.y, color: '#ffb300' });

    if (m.hp <= 0) {
      this.winCombat(m);
      return;
    }

    // Gegenangriff des Monsters
    const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef() + Math.floor(Math.random() * 3));
    state.player.hp = Math.max(0, state.player.hp - monDmg);
    eventBus.emit('combat:log', `${m.name} schlägt erbarmungslos zurück: -${monDmg} TP!`);
    eventBus.emit('fx:dmg', { text: `-${monDmg}`, x: state.player.x, y: state.player.y, color: '#d32f2f' });

    if (state.player.hp <= 0) {
      eventBus.emit('combat:log', 'Deine Lebenskraft ist erloschen...');
      setTimeout(() => {
        alert('💀 DU BIST IN DEN KATAKOMBEN GEFALLEN! 💀');
        location.reload();
      }, 500);
    }

    eventBus.emit('combat:updated');
    eventBus.emit('hud:updated');
  }

  healInBattle() {
    const potIdx = state.player.inventory.findIndex(i => (i.itemId === 'health_potion' || i.itemId === 'elixir_vitality') && i.count > 0);
    if (potIdx === -1) {
      eventBus.emit('combat:log', 'Kein Heiltrank im Rucksack!');
      return;
    }

    this.invSys.useItem(potIdx);
    eventBus.emit('combat:log', 'Heiltrank im Kampf getrunken!');

    if (state.activeMonster) {
      const m = state.activeMonster;
      const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef());
      state.player.hp = Math.max(0, state.player.hp - monDmg);
      eventBus.emit('combat:log', `${m.name} attackiert während des Trinkens: -${monDmg} TP.`);
    }

    eventBus.emit('combat:updated');
    eventBus.emit('hud:updated');
  }

  flee() {
    if (Math.random() > 0.45) {
      eventBus.emit('log:message', 'Erfolgreich in den Schutz der Schatten geflohen!');
      this.endCombat();
    } else {
      eventBus.emit('combat:log', 'Rückzug abgeschnitten!');
      const m = state.activeMonster;
      const monDmg = Math.max(1, m.atk - this.invSys.getTotalDef());
      state.player.hp = Math.max(0, state.player.hp - monDmg);
      eventBus.emit('combat:updated');
      eventBus.emit('hud:updated');
    }
  }

  winCombat(m) {
    const goldEarned = Math.floor(Math.random() * (m.maxCaps - m.minCaps + 1)) + m.minCaps;
    state.player.caps += goldEarned;
    state.player.exp += m.exp;

    if (m.loot) {
      m.loot.forEach(l => {
        if (Math.random() <= l.chance) {
          this.invSys.addItem(l.id, 1);
          eventBus.emit('log:message', `Beute geborgen: ${l.id}!`);
        }
      });
    }

    state.world.monsters = state.world.monsters.filter(entry => entry.id !== m.id);
    eventBus.emit('log:message', `${m.name} bezwungen! +${goldEarned} Gold, +${m.exp} EP.`);

    eventBus.emit('monster:killed', m.typeId);

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
      state.player.maxMp += 10;
      state.player.hp = state.player.maxHp;
      state.player.mp = state.player.maxMp;
      state.player.baseAtk += 2;
      state.player.baseDef += 1;
      eventBus.emit('log:message', `⭐ LEVEL-UP! Du hast Heldenstufe ${state.player.level} erklommen!`);
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

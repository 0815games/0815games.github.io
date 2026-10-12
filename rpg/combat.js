// [2026-10-12 08:13] - js/systems/combat.js: Rundenbasiertes Kampfsystem
// Änderungen:
// - Dynamische Schadensberechnung unter Einbezug ausgerüsteter Waffen.
// - Beute- und Fluchtberechnung mit Benachrichtigung des EventBus.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';

export class CombatSystem {
  startCombat(monster) {
    state.inCombat = true;
    state.activeMonster = monster;
    eventBus.emit('combat:started', monster);
    eventBus.emit('log:message', `${monster.name} greift an!`);
  }

  executeAttack() {
    if (!state.inCombat || !state.activeMonster) return;
    const monster = state.activeMonster;

    const weaponBonus = state.player.equipped.weapon ? state.player.equipped.weapon.power : 0;
    const playerAtk = state.player.baseAtk + weaponBonus;
    const dmgToMonster = Math.max(1, playerAtk - monster.def + Math.floor(Math.random() * 3));
    monster.currentHp -= dmgToMonster;

    eventBus.emit('log:message', `Du triffst ${monster.name} für ${dmgToMonster} Schaden.`);

    if (monster.currentHp <= 0) {
      this.resolveVictory(monster);
      return;
    }

    const armorBonus = state.player.equipped.armor ? state.player.equipped.armor.power : 0;
    const playerDef = state.player.baseDef + armorBonus;
    const dmgToPlayer = Math.max(1, monster.atk - playerDef + Math.floor(Math.random() * 2));
    state.player.hp = Math.max(0, state.player.hp - dmgToPlayer);

    eventBus.emit('log:message', `${monster.name} fügt dir ${dmgToPlayer} Schaden zu.`);

    if (state.player.hp <= 0) {
      alert('Du bist im Gefecht gefallen!');
      location.reload();
    }

    eventBus.emit('hud:updated');
  }

  resolveVictory(monster) {
    const goldDrop = Math.floor(Math.random() * (monster.goldMax - monster.goldMin + 1)) + monster.goldMin;
    state.player.gold += goldDrop;
    state.player.exp += monster.exp;

    state.activeZone.monsters = state.activeZone.monsters.filter(m => m.id !== monster.id);
    state.inCombat = false;
    state.activeMonster = null;

    eventBus.emit('log:message', `${monster.name} erledigt! +${goldDrop} Korken, +${monster.exp} EXP.`);
    eventBus.emit('combat:ended');
    eventBus.emit('hud:updated');
    eventBus.emit('world:updated');
  }

  attemptFlee() {
    if (Math.random() > 0.45) {
      state.inCombat = false;
      state.activeMonster = null;
      eventBus.emit('log:message', 'Erfolgreich abgesetzt!');
      eventBus.emit('combat:ended');
      eventBus.emit('world:updated');
    } else {
      eventBus.emit('log:message', 'Flucht fehlgeschlagen!');
      const m = state.activeMonster;
      state.player.hp = Math.max(0, state.player.hp - m.atk);
      eventBus.emit('hud:updated');
      if (state.player.hp <= 0) {
        alert('Auf der Flucht überwältigt worden!');
        location.reload();
      }
    }
  }
}

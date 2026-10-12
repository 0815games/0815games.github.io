// [2026-10-12 13:50] - js/systems/quest.js: v0.0.8 Quest-System
import { state } from '../core/state.js';
import { QUEST_DATABASE } from '../data/quests.js';
import { eventBus } from '../core/eventBus.js';

export class QuestSystem {
  constructor(inventorySys, storageSys) {
    this.invSys = inventorySys;
    this.storageSys = storageSys;
    this.initQuestChain();
  }

  initQuestChain() {
    if (!state.quests) {
      state.quests = {
        active: [],
        completed: []
      };
    }

    if (state.quests.active.length === 0 && state.quests.completed.length === 0) {
      this.activateQuest('q_goblin_slayer');
      this.activateQuest('q_visit_alchemist');
      this.activateQuest('q_collect_shards');
    }
  }

  activateQuest(questId) {
    const proto = QUEST_DATABASE[questId];
    if (!proto) return;

    if (state.quests.completed.includes(questId)) return;
    if (state.quests.active.some(q => q.id === questId)) return;

    state.quests.active.push({
      id: questId,
      current: 0,
      target: proto.targetCount
    });

    eventBus.emit('log:message', `📜 Neue Ordens-Aufgabe erhalten: "${proto.title}"!`);
    eventBus.emit('quests:updated');
  }

  onMonsterKilled(typeId) {
    state.quests.active.forEach(q => {
      const proto = QUEST_DATABASE[q.id];
      if (proto && proto.type === 'kill' && proto.targetId === typeId) {
        q.current = Math.min(q.target, q.current + 1);
        eventBus.emit('log:message', `Missions-Fortschritt: ${proto.title} (${q.current}/${q.target})`);
        this.checkQuestStatus(q);
      }
    });
    eventBus.emit('quests:updated');
  }

  onTraderVisited() {
    state.quests.active.forEach(q => {
      const proto = QUEST_DATABASE[q.id];
      if (proto && proto.type === 'visit_trader') {
        q.current = 1;
        this.checkQuestStatus(q);
      }
    });
    eventBus.emit('quests:updated');
  }

  checkInventoryItems() {
    state.quests.active.forEach(q => {
      const proto = QUEST_DATABASE[q.id];
      if (proto && proto.type === 'collect') {
        const itemSlot = state.player.inventory.find(i => i.itemId === proto.targetId);
        const count = itemSlot ? itemSlot.count : 0;
        q.current = Math.min(q.target, count);
        this.checkQuestStatus(q);
      }
    });
    eventBus.emit('quests:updated');
  }

  checkQuestStatus(q) {
    if (q.current >= q.target) {
      this.completeQuest(q.id);
    }
  }

  completeQuest(questId) {
    const proto = QUEST_DATABASE[questId];
    if (!proto) return;

    state.quests.active = state.quests.active.filter(entry => entry.id !== questId);
    if (!state.quests.completed.includes(questId)) {
      state.quests.completed.push(questId);
    }

    state.player.caps += proto.rewardCaps;
    state.player.exp += proto.rewardExp;
    if (proto.rewardItem) {
      this.invSys.addItem(proto.rewardItem, proto.rewardCount || 1);
    }

    eventBus.emit('audio:levelup');
    eventBus.emit('log:message', `🏆 AUFGABE VOLLBRACHT: "${proto.title}"!`);
    eventBus.emit('log:message', `Lohn: +${proto.rewardCaps} Gold, +${proto.rewardExp} EP!`);
    eventBus.emit('fx:dmg', { text: 'QUEST ERFÜLLT!', x: state.player.x, y: state.player.y, color: '#ffd54f' });

    if (questId === 'q_goblin_slayer') {
      this.activateQuest('q_banish_crypt_lord');
    }

    this.checkLevelUp();
    this.storageSys.saveGame(true);
    eventBus.emit('quests:updated');
    eventBus.emit('hud:updated');
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
      eventBus.emit('audio:levelup');
      eventBus.emit('log:message', `⭐ LEVEL-UP! Du hast Heldenstufe ${state.player.level} erklommen!`);
    }
  }
}

// [2026-10-12 13:25] - js/ui/uiManager.js: v0.0.4 Fantasy UI-Manager
// Änderungen:
// - Anzeige von Leben (Rubinrot), Mana (Saphirblau), Goldmünzen und Zauberaktionsschaltflächen.

import { state } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';
import { QUEST_DATABASE } from '../data/quests.js';

export class UIManager {
  constructor(inventorySys, combatSys, shopSys, storageSys, questSys) {
    this.invSys = inventorySys;
    this.combatSys = combatSys;
    this.shopSys = shopSys;
    this.storageSys = storageSys;
    this.questSys = questSys;
    this.shopMode = 'buy';
    this.selectedInvSlot = null;

    this.initTabs();
    this.initCombatEvents();
    this.initShopEvents();
    this.initStorageButtons();
  }

  initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  initCombatEvents() {
    document.getElementById('act-attack').addEventListener('click', () => this.combatSys.attack(false));
    document.getElementById('act-crit').addEventListener('click', () => this.combatSys.attack(true)); // Feuerball
    document.getElementById('act-heal').addEventListener('click', () => this.combatSys.healInBattle());
    document.getElementById('act-flee').addEventListener('click', () => this.combatSys.flee());
  }

  initShopEvents() {
    const buyTab = document.getElementById('shop-tab-buy');
    const sellTab = document.getElementById('shop-tab-sell');
    const closeBtn = document.getElementById('shop-close-btn');

    buyTab.addEventListener('click', () => {
      this.shopMode = 'buy';
      buyTab.classList.add('active');
      sellTab.classList.remove('active');
      this.renderShop();
    });

    sellTab.addEventListener('click', () => {
      this.shopMode = 'sell';
      sellTab.classList.add('active');
      buyTab.classList.remove('active');
      this.renderShop();
    });

    closeBtn.addEventListener('click', () => this.shopSys.closeShop());
  }

  initStorageButtons() {
    const saveBtn = document.getElementById('btn-save-game');
    const resetBtn = document.getElementById('btn-reset-game');

    if (saveBtn) saveBtn.addEventListener('click', () => this.storageSys.saveGame(false));
    if (resetBtn) resetBtn.addEventListener('click', () => this.storageSys.resetGame());
  }

  updateHUD() {
    const p = state.player;
    document.getElementById('stat-level').innerText = p.level;
    document.getElementById('stat-caps').innerText = `${p.caps} 🪙 Gold`;
    document.getElementById('stat-hp-text').innerText = `${p.hp}/${p.maxHp}`;
    document.getElementById('stat-mp-text').innerText = `${p.mp}/${p.maxMp}`;
    document.getElementById('stat-xp-text').innerText = `${p.exp}/${p.nextExp}`;

    const hpPercent = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    const mpPercent = Math.max(0, Math.min(100, (p.mp / p.maxMp) * 100));
    const xpPercent = Math.max(0, Math.min(100, (p.exp / p.nextExp) * 100));
    document.getElementById('hp-bar-fill').style.width = `${hpPercent}%`;
    document.getElementById('mp-bar-fill').style.width = `${mpPercent}%`;
    document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;

    document.getElementById('equip-weapon').innerText = p.equipped.weapon ? p.equipped.weapon.name : 'Keine';
    document.getElementById('equip-armor').innerText = p.equipped.armor ? p.equipped.armor.name : 'Keine';
    document.getElementById('stat-total-atk').innerText = this.invSys.getTotalAtk();
    document.getElementById('stat-total-def').innerText = this.invSys.getTotalDef();
    document.getElementById('stat-tiles-visited').innerText = p.tilesVisited;

    this.renderInventory();
    this.renderQuests();
    if (state.inShop) this.renderShop();
  }

  renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    const totalItems = state.player.inventory.reduce((sum, item) => sum + item.count, 0);
    document.getElementById('inv-count').innerText = totalItems;

    state.player.inventory.forEach((slot, idx) => {
      const item = ITEM_DATABASE[slot.itemId];
      if (!item) return;

      const row = document.createElement('div');
      row.className = 'item-row';
      if (this.selectedInvSlot === idx) row.classList.add('selected');

      row.innerHTML = `<span>${item.name} x${slot.count}</span><span>[Nutzen]</span>`;
      row.addEventListener('click', () => {
        this.selectedInvSlot = idx;
        this.showItemDetails(item);
        this.invSys.useItem(idx);
      });

      grid.appendChild(row);
    });
  }

  renderQuests() {
    const list = document.getElementById('quest-list');
    const badge = document.getElementById('quest-badge');
    if (!list) return;

    list.innerHTML = '';
    const activeCount = state.quests ? state.quests.active.length : 0;
    if (badge) badge.innerText = activeCount;

    if (state.quests && state.quests.active.length > 0) {
      state.quests.active.forEach(q => {
        const proto = QUEST_DATABASE[q.id];
        if (!proto) return;

        const card = document.createElement('div');
        card.className = 'quest-card';

        const progressPct = Math.min(100, Math.round((q.current / q.target) * 100));

        card.innerHTML = `
          <div class="quest-title-row">
            <span>${proto.title}</span>
            <span>${q.current} / ${q.target}</span>
          </div>
          <div class="quest-desc">${proto.desc}</div>
          <div class="progress-bar">
            <div class="bar-fill quest-fill" style="width: ${progressPct}%;"></div>
          </div>
          <div class="quest-reward">Lohn: ${proto.rewardCaps} Gold, ${proto.rewardExp} EP ${proto.rewardItem ? '+ ' + proto.rewardItem : ''}</div>
        `;
        list.appendChild(card);
      });
    } else {
      const emptyNote = document.createElement('div');
      emptyNote.className = 'small-text';
      emptyNote.innerText = 'Keine unvollendeten Aufträge in der Chronik.';
      list.appendChild(emptyNote);
    }

    if (state.quests && state.quests.completed.length > 0) {
      const completedHeader = document.createElement('div');
      completedHeader.className = 'panel-subtitle';
      completedHeader.style.marginTop = '10px';
      completedHeader.innerText = `Erfüllt (${state.quests.completed.length})`;
      list.appendChild(completedHeader);

      state.quests.completed.forEach(qid => {
        const proto = QUEST_DATABASE[qid];
        if (!proto) return;

        const card = document.createElement('div');
        card.className = 'quest-card completed';
        card.innerHTML = `
          <div class="quest-title-row">
            <span>✓ ${proto.title}</span>
            <span>VOLLENDET</span>
          </div>
          <div class="quest-desc">${proto.desc}</div>
        `;
        list.appendChild(card);
      });
    }
  }

  showItemDetails(item) {
    const box = document.getElementById('item-details');
    box.innerHTML = `<strong>${item.name}</strong> (${item.type})<br>${item.desc}<br>Handelswert: ${item.price} Gold`;
  }

  showShop() {
    document.getElementById('shop-box').classList.remove('hidden');
    this.renderShop();
  }

  hideShop() {
    document.getElementById('shop-box').classList.add('hidden');
  }

  renderShop() {
    const list = document.getElementById('shop-goods-list');
    list.innerHTML = '';

    document.getElementById('shop-player-caps').innerText = `${state.player.caps} 🪙`;
    document.getElementById('shop-trader-caps').innerText = `${state.trader.caps} 🪙`;

    if (this.shopMode === 'buy') {
      state.trader.inventory.forEach(entry => {
        if (entry.count <= 0) return;
        const proto = ITEM_DATABASE[entry.itemId];
        if (!proto) return;

        const row = document.createElement('div');
        row.className = 'shop-row';
        row.innerHTML = `<span>${proto.name} (Vorrat: ${entry.count})</span><strong>${entry.price} 🪙 [Kauf]</strong>`;
        row.addEventListener('click', () => {
          this.showShopItemInfo(proto, entry.price, 'buy');
          this.shopSys.buyItem(entry.itemId);
        });
        list.appendChild(row);
      });
    } else {
      state.player.inventory.forEach((slot, idx) => {
        const proto = ITEM_DATABASE[slot.itemId];
        if (!proto) return;
        const sellPrice = Math.max(1, Math.floor(proto.price * 0.5));

        const row = document.createElement('div');
        row.className = 'shop-row';
        row.innerHTML = `<span>${proto.name} x${slot.count}</span><strong>+${sellPrice} 🪙 [Verkauf]</strong>`;
        row.addEventListener('click', () => {
          this.showShopItemInfo(proto, sellPrice, 'sell');
          this.shopSys.sellItem(idx);
        });
        list.appendChild(row);
      });
    }
  }

  showShopItemInfo(proto, price, mode) {
    const box = document.getElementById('shop-item-info');
    box.innerHTML = `<strong>${proto.name}</strong> (${proto.type})<br>${proto.desc}<br><strong>${mode === 'buy' ? 'Kaufpreis' : 'Verkaufswert'}:</strong> ${price} Gold`;
  }

  showCombat(monster) {
    document.getElementById('combat-box').classList.remove('hidden');
    document.getElementById('combat-mon-name').innerText = monster.name;
    this.updateCombatView();
  }

  updateCombatView() {
    const p = state.player;
    const m = state.activeMonster;
    if (!m) return;

    document.getElementById('combat-player-hp-val').innerText = `${p.hp} / ${p.maxHp} TP`;
    document.getElementById('combat-mon-hp-val').innerText = `${m.hp} / ${m.maxHp} TP`;

    const pHpPct = Math.max(0, (p.hp / p.maxHp) * 100);
    const mHpPct = Math.max(0, (m.hp / m.maxHp) * 100);
    document.getElementById('combat-player-hp-bar').style.width = `${pHpPct}%`;
    document.getElementById('combat-mon-hp-bar').style.width = `${mHpPct}%`;
  }

  hideCombat() {
    document.getElementById('combat-box').classList.add('hidden');
  }

  logMessage(text) {
    const box = document.getElementById('activity-log');
    const line = document.createElement('div');
    line.innerText = `🗡️ ${text}`;
    box.prepend(line);
  }

  combatLog(text) {
    document.getElementById('combat-log-text').innerText = text;
    this.logMessage(`[SCHLACHT] ${text}`);
  }
}

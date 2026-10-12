// [2026-10-12 13:50] - js/ui/introFlow.js: v0.0.8 Intro-Controller
import { state, CLASS_PROFILES } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';
import { eventBus } from '../core/eventBus.js';

export class IntroFlow {
  constructor(inventorySys, storageSys) {
    this.invSys = inventorySys;
    this.storageSys = storageSys;
    this.selectedClass = 'warrior';
    this.initElements();
  }

  initElements() {
    this.bootScreen = document.getElementById('boot-screen');
    this.titleScreen = document.getElementById('title-screen');
    this.charSelectScreen = document.getElementById('char-select-screen');
    this.gameApp = document.getElementById('game-app');
    this.bootBar = document.getElementById('boot-bar');

    this.startBootSequence();
    this.initTitleScreenEvents();
    this.initCharSelectEvents();
  }

  startBootSequence() {
    state.isInputLocked = true;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (this.bootBar) this.bootBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => this.showTitleScreen(), 300);
      }
    }, 40);

    this.bootScreen.addEventListener('click', () => {
      clearInterval(interval);
      this.showTitleScreen();
    }, { once: true });
  }

  showTitleScreen() {
    this.bootScreen.classList.add('hidden');
    this.titleScreen.classList.remove('hidden');
  }

  initTitleScreenEvents() {
    const startAction = () => {
      if (this.titleScreen.classList.contains('hidden')) return;
      this.titleScreen.classList.add('hidden');

      const hasSave = localStorage.getItem('dark_fantasy_rpg_v004');
      if (hasSave) {
        this.launchGame();
      } else {
        this.charSelectScreen.classList.remove('hidden');
      }
    };

    this.titleScreen.addEventListener('click', startAction);
    window.addEventListener('keydown', (e) => {
      if (!this.titleScreen.classList.contains('hidden') && e.key === 'Enter') {
        startAction();
      }
    });
  }

  initCharSelectEvents() {
    const cards = document.querySelectorAll('.hero-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedClass = card.getAttribute('data-class');
      });
    });

    const confirmBtn = document.getElementById('btn-confirm-char');
    confirmBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('char-name-input');
      const chosenName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Schattenjäger';
      this.applyClassToPlayer(this.selectedClass, chosenName);
      this.charSelectScreen.classList.add('hidden');
      this.launchGame();
    });
  }

  applyClassToPlayer(classId, name) {
    const profile = CLASS_PROFILES[classId] || CLASS_PROFILES.warrior;
    const p = state.player;

    p.name = name;
    p.classId = classId;
    p.className = profile.className;
    p.hp = profile.hp;
    p.maxHp = profile.hp;
    p.mp = profile.mp;
    p.maxMp = profile.mp;
    p.baseAtk = profile.baseAtk;
    p.baseDef = profile.baseDef;
    p.inventory = [];

    if (profile.startWeapon && ITEM_DATABASE[profile.startWeapon]) {
      p.equipped.weapon = ITEM_DATABASE[profile.startWeapon];
    }
    if (profile.startArmor && ITEM_DATABASE[profile.startArmor]) {
      p.equipped.armor = ITEM_DATABASE[profile.startArmor];
    }

    profile.startItems.forEach(item => {
      p.inventory.push({ itemId: item.itemId, count: item.count });
    });

    this.storageSys.saveGame(true);
  }

  launchGame() {
    this.gameApp.classList.remove('hidden');
    state.isInputLocked = false;
    eventBus.emit('hud:updated');
    eventBus.emit('world:updated');
    eventBus.emit('log:message', `Willkommen, ${state.player.name} vom Orden der ${state.player.className}!`);
  }
}

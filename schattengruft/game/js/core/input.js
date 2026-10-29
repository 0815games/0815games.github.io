// [2026-10-12 13:30] - js/core/input.js: v0.0.5 Eingabesteuerung
// Änderungen:
// - Tastensperre während Boot-, Titel- und Dialogbildschirmen.

import { state } from './state.js';
import { eventBus } from './eventBus.js';

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.inShop) {
        eventBus.emit('shop:close_request');
        return;
      }
    }

    if (state.isInputLocked || state.inCombat || state.inShop) return;

    let dx = 0;
    let dy = 0;
    const key = e.key.toLowerCase();

    if (key === 'w' || key === 'arrowup') dy = -1;
    if (key === 's' || key === 'arrowdown') dy = 1;
    if (key === 'a' || key === 'arrowleft') dx = -1;
    if (key === 'd' || key === 'arrowright') dx = 1;

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      eventBus.emit('player:move', { dx, dy });
    }
  });

  const bind = (id, dx, dy) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      if (state.isInputLocked || state.inCombat || state.inShop) return;
      eventBus.emit('player:move', { dx, dy });
    });
  };

  bind('dpad-up', 0, -1);
  bind('dpad-down', 0, 1);
  bind('dpad-left', -1, 0);
  bind('dpad-right', 1, 0);

  const actBtn = document.getElementById('dpad-action');
  if (actBtn) {
    actBtn.addEventListener('click', () => {
      const tr = state.trader;
      const dist = Math.hypot(state.player.x - tr.x, state.player.y - tr.y);
      if (dist <= 1.5) {
        eventBus.emit('shop:engage');
      } else {
        eventBus.emit('log:message', 'Kein Ziel in Reichweite.');
      }
    });
  }
}

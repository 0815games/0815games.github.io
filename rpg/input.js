// [2026-10-12 08:13] - js/core/input.js: Tastatur- und Touch-Routing
// Änderungen:
// - Überprüfung von state.isInputLocked und state.inCombat blockiert Schritte zuverlässig.

import { state } from './state.js';
import { eventBus } from './eventBus.js';

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (state.isInputLocked || state.inCombat) return;

    const key = e.key.toLowerCase();
    let dx = 0;
    let dy = 0;

    if (key === 'w' || key === 'arrowup') dy = -1;
    if (key === 's' || key === 'arrowdown') dy = 1;
    if (key === 'a' || key === 'arrowleft') dx = -1;
    if (key === 'd' || key === 'arrowright') dx = 1;

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      eventBus.emit('player:request_move', { dx, dy });
    }
  });

  const bindBtn = (id, dx, dy) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      if (state.isInputLocked || state.inCombat) return;
      eventBus.emit('player:request_move', { dx, dy });
    });
  };

  bindBtn('dpad-up', 0, -1);
  bindBtn('dpad-down', 0, 1);
  bindBtn('dpad-left', -1, 0);
  bindBtn('dpad-right', 1, 0);
}

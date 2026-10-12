// [2026-10-12 18:55] - js/core/input.js: v0.0.9 Tastatur- & Touch-Steuerung
// Änderungen:
// - Alte Action-Buttons komplett entfernt.
// - Tastatur: WASD / Pfeile für Schritte; [E] oder [Leertaste] für Interaktionen (Treppe / Händler).
// - Touch: Eleganter On-Screen-Joystick (#touch-controls) mit 4 Richtungen und Aktionsknopf (✦).

import { state } from './state.js';
import { eventBus } from './eventBus.js';

export function initInput() {
  let lastMoveTime = 0;

  function doMove(dx, dy) {
    if (state.isInputLocked || state.inCombat || state.inShop) return;
    const now = performance.now();
    if (now - lastMoveTime < 100) return; // Debounce gegen Mehrfachtasten
    lastMoveTime = now;
    eventBus.emit('player:move', { dx, dy });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.inShop) {
        eventBus.emit('shop:close_request');
        return;
      }
    }

    if (state.isInputLocked || state.inCombat || state.inShop) return;

    const key = e.key.toLowerCase();

    if (key === 'e' || key === ' ') {
      e.preventDefault();
      eventBus.emit('player:interact');
      return;
    }

    let dx = 0;
    let dy = 0;

    if (key === 'w' || key === 'arrowup') dy = -1;
    if (key === 's' || key === 'arrowdown') dy = 1;
    if (key === 'a' || key === 'arrowleft') dx = -1;
    if (key === 'd' || key === 'arrowright') dx = 1;

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      doMove(dx, dy);
    }
  });

  // Touch-Controls (Joystick)
  document.querySelectorAll('.touch-key[data-dx]').forEach(btn => {
    const handlePress = (e) => {
      e.preventDefault();
      const dx = parseInt(btn.getAttribute('data-dx'), 10) || 0;
      const dy = parseInt(btn.getAttribute('data-dy'), 10) || 0;
      doMove(dx, dy);
    };
    btn.addEventListener('pointerdown', handlePress);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  const centerActionBtn = document.querySelector('.touch-key[data-action="interact"]');
  if (centerActionBtn) {
    centerActionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      eventBus.emit('player:interact');
    });
  }
}

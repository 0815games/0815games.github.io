'use strict';

(() => {
  const grid = document.getElementById('game-grid');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('[data-game-card]')];
  const choices = [...document.querySelectorAll('[data-game-select]')];
  const counter = document.getElementById('switch-count');
  const mobile = matchMedia('(max-width: 640px)');
  let active = 0;
  let touchStart = null;

  function select(index, focusChoice = false) {
    active = (index + cards.length) % cards.length;
    cards.forEach((card, i) => card.classList.toggle('is-selected', i === active));
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
    counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    if (focusChoice) choices[active]?.focus({preventScroll: true});
  }

  grid.dataset.mobileReady = 'true';
  choices.forEach((button, index) => button.addEventListener('click', () => select(index)));
  document.getElementById('previous-game').addEventListener('click', () => select(active - 1));
  document.getElementById('next-game').addEventListener('click', () => select(active + 1));

  grid.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = {x: touch.clientX, y: touch.clientY};
  }, {passive: true});
  grid.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (mobile.matches && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) select(active + (dx < 0 ? 1 : -1));
  }, {passive: true});
  grid.addEventListener('touchcancel', () => { touchStart = null; }, {passive: true});

  document.addEventListener('keydown', event => {
    if (!mobile.matches || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('a,button,input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(active + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
  });

  select(0);
})();

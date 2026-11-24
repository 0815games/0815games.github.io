// DOM-Brücke für die Weltansicht: Canvas, Kamera (Ziehen, Zoom), Tastatur, Animation.
// Der Spielzustand kommt von außen (main.js). Diese Datei verändert ihn nie.
import { toScreen } from './iso.js?v=20261124-konto2';
import { renderWorld, pickTile, makeFx, stepFx, produceIcons, coinGain, dayFactor, GRID_SIZE, HALL } from './scene.js?v=20261124-konto2';

const DRAG_PX = 6;
const K_MIN = 0.45;
const K_MAX = 2.6;

/**
 * Baut die Weltansicht in `container` (das #board-Element).
 * opts: { getModel(): {state,data,unlocked(x,y)}, getSelected(), onSelect({x,y}), describe(x,y): string }
 * Liefert { redraw(), gain(coins), destroy() }.
 */
export function createBoard(container, opts) {
  const canvas = document.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const cam = { x: 0, y: 0, k: 1 };      // Mitte in Weltpixeln, Zoomfaktor relativ zur Grundgröße
  let W = 0, H = 0, dpr = 1, base = 0.9;
  let fx = makeFx();
  let hover = null;
  let last = performance.now();
  let t0 = last;
  let rafId = 0;
  let dirty = true;
  const drag = { active: false, moved: false, sx: 0, sy: 0, cx: 0, cy: 0 };
  const center = toScreen(HALL.x + 0.5, HALL.y + 0.5);
  cam.x = center.x;
  cam.y = center.y;

  // Kamera darf nicht weit ins Leere: Mitte bleibt im Umkreis der Insel.
  const bounds = {
    x0: toScreen(-3, GRID_SIZE / 2).x, x1: toScreen(GRID_SIZE + 3, GRID_SIZE / 2).x,
    y0: toScreen(GRID_SIZE / 2, -3).y, y1: toScreen(GRID_SIZE / 2, GRID_SIZE + 3).y,
  };
  const clampCam = () => {
    cam.x = Math.min(bounds.x1, Math.max(bounds.x0, cam.x));
    cam.y = Math.min(bounds.y1, Math.max(bounds.y0, cam.y));
  };

  function resize() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(280, Math.floor(rect.width));
    const h = Math.max(320, Math.min(560, Math.round(w * 0.66)));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w;
    H = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Grundgröße so, dass die Insel bei k = 1 ins Bild passt.
    base = Math.min(W / 1400, H / 880);
    dirty = true;
  }

  const view = () => ({ x: cam.x, y: cam.y, zoom: base * cam.k });

  function screenToTile(e) {
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    return pickTile(sx, sy, W, H, view());
  }

  function model() {
    const m = opts.getModel();
    return { ...m, selected: opts.getSelected(), reduceMotion: reduce, size: GRID_SIZE };
  }

  // ----- Eingabe -----
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag.active = true;
    drag.moved = false;
    drag.sx = e.clientX;
    drag.sy = e.clientY;
    drag.cx = cam.x;
    drag.cy = cam.y;
  });
  window.addEventListener('pointermove', (e) => {
    if (drag.active) {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) > DRAG_PX) {
        drag.moved = true;
        canvas.classList.add('dragging');
      }
      if (drag.moved) {
        const z = base * cam.k;
        cam.x = drag.cx - dx / z;
        cam.y = drag.cy - dy / z;
        clampCam();
        dirty = true;
      }
      return;
    }
    if (e.target !== canvas) return;
    const t = screenToTile(e);
    const next = t && opts.getModel().unlocked(t.x, t.y) ? t : null;
    if (JSON.stringify(next) !== JSON.stringify(hover)) {
      hover = next;
      canvas.title = next ? opts.describe(next.x, next.y) : '';
      dirty = true;
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (!drag.active) return;
    drag.active = false;
    canvas.classList.remove('dragging');
    if (!drag.moved && e.target === canvas) {
      const t = screenToTile(e);
      if (t) opts.onSelect(t);
    }
  });
  canvas.addEventListener('pointerleave', () => {
    if (hover) { hover = null; dirty = true; }
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      cam.k = Math.min(K_MAX, Math.max(K_MIN, cam.k * Math.exp(-e.deltaY * 0.0012)));
      clampCam();
      dirty = true;
    },
    { passive: false },
  );

  // Tastatur: Pfeile bewegen die Auswahl, Enter wählt, Plus/Minus zoomen.
  container.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = map[e.key];
    if (d) {
      e.preventDefault();
      const s = opts.getSelected();
      const nx = Math.min(GRID_SIZE - 1, Math.max(0, s.x + d[0]));
      const ny = Math.min(GRID_SIZE - 1, Math.max(0, s.y + d[1]));
      opts.onSelect({ x: nx, y: ny });
      return;
    }
    if (e.key === '+' || e.key === '-') {
      cam.k = Math.min(K_MAX, Math.max(K_MIN, cam.k * (e.key === '+' ? 1.2 : 1 / 1.2)));
      clampCam();
      dirty = true;
    }
  });

  // ----- Animation -----
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const m = model();
    const hasState = !!m.state;
    if (hasState) {
      stepFx(fx, dt, m);
      produceIcons(fx, dt, m);
      coinGain(fx, dt, 0);
    }
    if (hasState || dirty || fx.items.length) {
      const time = (now - t0) / 1000;
      const day = dayFactor(new Date());
      renderWorld(ctx, { W, H, view: view(), model: m, time, day, fx, hover });
      dirty = false;
    }
    rafId = requestAnimationFrame(frame);
  }

  function drawOnce() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now();
    last = now;
    const m = model();
    renderWorld(ctx, { W, H, view: view(), model: m, time: (now - t0) / 1000, day: dayFactor(new Date()), fx, hover });
  }

  const ro = new ResizeObserver(() => {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  ro.observe(container);
  resize();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!reduce) rafId = requestAnimationFrame(frame);
  else drawOnce();

  return {
    /** Neu zeichnen nach einer Zustandsänderung (Auswahl, Bau, Level). */
    redraw() {
      dirty = true;
      if (reduce) drawOnce();
    },
    /** Münzgewinn anzeigen (schwebende Zahl am Rathaus). */
    gain(coins) {
      if (coins > 0) fx.coinsPending += coins;
    },
    /** Eine Kachel im Blick halten (nach Tastaturauswahl). */
    focusTile(x, y) {
      const c = toScreen(x + 0.5, y + 0.5);
      cam.x = c.x;
      cam.y = c.y;
      clampCam();
      dirty = true;
    },
    destroy() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.remove();
    },
  };
}


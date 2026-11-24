// DOM-Brücke für die Weltansicht: Canvas, Kamera (Ziehen, Zoom), Tastatur, Animation.
// Der Spielzustand kommt von außen (main.js). Diese Datei verändert ihn nie.
import { toScreen } from './iso.js?v=20261124-sitz15';
import { renderWorld, pickTile, makeFx, stepFx, produceIcons, coinGain, dayFactor, GRID_SIZE, HALL } from './scene.js?v=20261124-sitz15';

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
  const drag = { active: false, id: null, moved: false, sx: 0, sy: 0, cx: 0, cy: 0 };
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
    // Vollbild: die Karte nimmt die ganze Höhe des Containers. Fallback auf das alte Seitenverhältnis.
    const h = Math.max(320, Math.floor(rect.height) || Math.round(w * 0.66));
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
  // Maus und Touch über Pointer-Events. Ein Finger zieht oder klickt, zwei Finger zoomen (Pinch).
  const pointers = new Map();     // pointerId -> {x, y}
  let pinch = null;               // {dist, k} while two pointers are down
  const dist2 = () => {
    const [p, q] = [...pointers.values()];
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  const setZoom = (k) => {
    cam.k = Math.min(K_MAX, Math.max(K_MIN, k));
    clampCam();
    dirty = true;
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      drag.active = true;
      drag.id = e.pointerId;
      drag.moved = false;
      drag.sx = e.clientX;
      drag.sy = e.clientY;
      drag.cx = cam.x;
      drag.cy = cam.y;
    } else if (pointers.size === 2) {
      // Zweiter Finger: ab jetzt Zoom, und die Geste darf nicht als Klick enden.
      pinch = { dist: dist2(), k: cam.k };
      drag.moved = true;
      canvas.classList.add('dragging');
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const d = dist2();
      if (pinch.dist > 0) setZoom(pinch.k * (d / pinch.dist));
      return;
    }
    if (drag.active && e.pointerId === drag.id) {
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
    if (drag.active || e.target !== canvas) return;
    const t = screenToTile(e);
    const next = t && opts.getModel().unlocked(t.x, t.y) ? t : null;
    if (JSON.stringify(next) !== JSON.stringify(hover)) {
      hover = next;
      canvas.setAttribute('aria-label', next ? opts.describe(next.x, next.y) : 'Karte');
      dirty = true;
    }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    const wasDragPointer = e.pointerId === drag.id && drag.active;
    pointers.delete(e.pointerId);
    if (pinch && pointers.size < 2) pinch = null;
    if (!wasDragPointer) return;
    drag.active = false;
    // Den verbleibenden Finger nicht als neuen Zug weiterführen.
    if (pointers.size === 0) canvas.classList.remove('dragging');
    if (!drag.moved && e.type === 'pointerup' && e.target === canvas) {
      const t = screenToTile(e);
      if (t) opts.onSelect(t);
      else opts.onEmpty?.(); // Klick auf die Karte, aber auf kein Feld
    }
  };
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
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


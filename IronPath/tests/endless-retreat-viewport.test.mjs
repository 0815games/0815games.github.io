import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

function loadGameSource() {
  return readFile(new URL('../game.js', import.meta.url), 'utf8').then(src =>
    src.replace(/(['"])\.\/([\w.-]+\.mjs)(?:\?[^'"]*)?\1/g, (_, q, file) => JSON.stringify(new URL(`../${file}`, import.meta.url).href))
  );
}

function createHarness({ screen = 'endless', width = 390, height = 844, coarse = true, hidden = false, boardOpen = 'false' } = {}) {
  const elements = new Map(), calls = [], resizeObservers = [];
  let recordCalls = false;
  const ctx = new Proxy({}, {
    get(target, key) {
      return target[key] || ((...args) => { if (recordCalls) calls.push([key, ...args]); });
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  let vpWidth = width, vpHeight = height, nowMs = 1000;

  function makeClassList() {
    const set = new Set();
    return {
      add: (...c) => c.forEach(x => set.add(x)),
      remove: (...c) => c.forEach(x => set.delete(x)),
      toggle: (c, force) => { const on = force === undefined ? !set.has(c) : !!force; if (on) set.add(c); else set.delete(c); return on; },
      contains: c => set.has(c),
    };
  }

  function makeElement(id) {
    if (elements.has(id)) return elements.get(id);
    const style = {
      _props: new Map(),
      setProperty(k, v) { this._props.set(k, v); },
      touchAction: '',
    };
    const handlers = new Map();
    const el = {
      id, textContent: '', innerHTML: '', disabled: false,
      hidden: ['radialMenu', 'runPerkPanel', 'sectorPanel', 'gameOver', 'towerDetails'].includes(id),
      open: false,
      style, dataset: {}, attributes: {}, value: '',
      classList: makeClassList(),
      scrollLeft: 0, scrollTop: 0,
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] ?? null; },
      removeAttribute(k) { delete this.attributes[k]; },
      toggleAttribute(k, f) { const on = f === undefined ? !(k in this.attributes) : !!f; if (on) this.attributes[k] = ''; else delete this.attributes[k]; return on; },
      contains() { return false; },
      replaceChildren() {},
      querySelector() { return null; },
      addEventListener(type, fn) {
        const list = handlers.get(type) || []; list.push(fn); handlers.set(type, list);
      },
      removeEventListener(type, fn) {
        handlers.set(type, (handlers.get(type) || []).filter(f => f !== fn));
      },
      dispatch(type, event = {}) {
        for (const fn of handlers.get(type) || []) fn(event);
      },
      click(event = {}) { this.onclick?.(event); this.dispatch('click', event); },
      scrollTo() {}, showModal() { this.open = true; }, close() { this.open = false; },
      focus() {},
      setPointerCapture() {}, releasePointerCapture() {},
      getContext: () => ctx,
    };
    if (id === 'gameWorkspace') {
      el.hidden = hidden;
      el.dataset = { screen, onlineReady: 'false' };
    } else if (id === 'campaignPanel') {
      el.dataset = { boardOpen };
    } else if (id === 'mapViewport') {
      Object.defineProperties(el, {
        clientWidth: { get: () => vpWidth },
        clientHeight: { get: () => vpHeight },
        scrollWidth: { get: () => {
          const cw = parseFloat(elements.get('game')?.style.width);
          return Number.isFinite(cw) ? Math.max(vpWidth, cw) : (el.classList.contains('map-large') ? vpWidth * 2 : vpWidth);
        } },
      });
      el.getBoundingClientRect = () => ({ left: 0, top: 0, width: vpWidth, height: vpHeight, right: vpWidth, bottom: vpHeight });
    } else if (id === 'game') {
      el.width = 960;
      el.height = 540;
      el.getBoundingClientRect = () => {
        if (el.dataset.fullBattle === 'true') {
          return { left: 0, top: 0, width: vpWidth, height: vpHeight, right: vpWidth, bottom: vpHeight };
        }
        const cw = parseFloat(el.style.width) || vpWidth;
        const ch = cw * el.height / el.width;
        const top = Math.max(0, (vpHeight - ch) / 2);
        return { left: 0, top, width: cw, height: ch, right: cw, bottom: top + ch };
      };
    } else {
      el.clientWidth = 400; el.clientHeight = 200; el.scrollWidth = 400;
      el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 });
    }
    elements.set(id, el);
    return el;
  }

  let rafSeq = 0;
  const rafCallbacks = new Map();
  const winHandlers = new Map();
  globalThis.document = {
    hasFocus: () => true,
    hidden: false,
    documentElement: { style: { setProperty() {} } },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    getElementById: makeElement,
    activeElement: { tagName: 'BODY' },
  };
  globalThis.window = {
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: 2,
    scrollBy() {},
    matchMedia: q => ({
      matches: q.includes('pointer: coarse') ? coarse : (q.includes('portrait') ? vpHeight > vpWidth : false),
      addEventListener() {},
    }),
    addEventListener(type, fn) {
      const list = winHandlers.get(type) || []; list.push(fn); winHandlers.set(type, list);
    },
    removeEventListener() {},
  };
  globalThis.ResizeObserver = class {
    constructor(cb) { resizeObservers.push(cb); }
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = fn => { const id = ++rafSeq; rafCallbacks.set(id, fn); return id; };
  globalThis.cancelAnimationFrame = id => { rafCallbacks.delete(id); };
  const origPerfNow = performance.now.bind(performance);
  globalThis.performance.now = () => nowMs;

  return {
    el: makeElement,
    calls,
    setViewport(w, h) {
      vpWidth = w; vpHeight = h;
      globalThis.window.innerWidth = w; globalThis.window.innerHeight = h;
      for (const cb of resizeObservers) cb();
      for (const fn of winHandlers.get('resize') || []) fn();
    },
    triggerResize() {
      for (const cb of resizeObservers) cb();
    },
    stepFrame(dtMs = 50, capture = false) {
      recordCalls = capture;
      calls.length = 0;
      nowMs += dtMs;
      const batch = [...rafCallbacks.entries()];
      rafCallbacks.clear();
      for (const [, fn] of batch) fn(nowMs);
      recordCalls = false;
    },
    restore() {
      globalThis.performance.now = origPerfNow;
    },
  };
}

const ACCOUNT = {
  // Max-level soldier with full damage/bunker investment can easily sweep early waves on automated taps.
  getProfile: () => ({ name: 'Tester', gender: 'male', xp: 40000, armory: '1', skills: 'a5,s5,r5,m5,e5,l5', storyProgress: 12 }),
  getUserId: () => 'local',
  isReady: () => true,
  canChooseSolo: () => true,
  getLevel: () => 20,
  onSessionChange() {},
  awardXP: async () => {},
  recordScore() {},
  saveCampaign: async () => ({ committed: true }),
};

test('portrait endless waves 1-10 zoom cleanly and real wave-10 #sectorAdvance retreat switches to full-portrait battleViewport', async t => {
  const h = createHarness({ screen: 'endless', width: 390, height: 844, coarse: true });
  t.after(() => h.restore());
  const src = await loadGameSource();
  const { startGame } = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const { getMap } = await import('../maps.mjs');
  const draws = ['g3-0dfdd99a1', 'g3-0dfdd99a1', 'g3-2f1bbcd88'];
  const control = startGame(ACCOUNT, {
    deferTutorial: true,
    confirmAction: async () => true,
    nextMapId: () => draws.length > 1 ? draws.shift() : draws[0],
  });

  // 1. Deploy into Endless Sector 1 (960x540): touchZoom owns zoom and enlarges portrait canvas.
  assert.equal(await control.chooseEndless(null), true);
  const canvas = h.el('game');
  assert.equal(canvas.dataset.fullBattle, 'false', 'Sector 1 uses touchZoom layout');
  assert.equal(canvas.style.touchAction, '', 'Sector 1 does not attach battleViewport');
  h.el('mapQuickZoom').click();
  assert.equal(canvas.style.width, '780px', 'tapping ZOOM MAP on waves 1-10 enlarges portrait canvas');
  assert.equal(h.el('mapQuickZoom').textContent, 'FIT MAP');
  // Toggle back to 1x overview before waves.
  h.el('mapQuickZoom').click();
  assert.equal(canvas.style.width, '390px');

  // Place towers along pads during waves 1-10 and simulate clearing through wave 10.
  const map1 = getMap(control.getMapId());
  const placeAvailableTowers = () => {
    for (let padIndex = 0; padIndex < map1.pads.length; padIndex++) {
      const pad = map1.pads[padIndex], rect = canvas.getBoundingClientRect();
      const cx = rect.left + pad.x * rect.width / 960, cy = rect.top + pad.y * rect.height / 540;
      canvas.click({ clientX: cx, clientY: cy });
      if (!h.el('radialMenu').hidden) {
        h.el('radial0').click();
        if (!h.el('towerDetailsConfirm').disabled) h.el('towerDetailsConfirm').click();
        h.el('towerDetails').close();
        h.el('radialClose').click();
      }
    }
  };
  placeAvailableTowers();
  while (!h.el('speed').textContent.includes('3')) h.el('speed').onclick();
  for (let wave = 1; wave <= 10; wave++) {
    placeAvailableTowers();
    h.el('start').onclick();
    for (let step = 0; step < 3000; step++) {
      h.stepFrame(50);
      if (!h.el('runPerkPanel').hidden) h.el('runPerk0').onclick();
      if (!h.el('sectorPanel').hidden) break;
      if (!h.el('start').disabled && h.el('wave').textContent.startsWith(`${wave} `)) break;
    }
    if (!h.el('runPerkPanel').hidden) h.el('runPerk0').onclick();
  }
  assert.equal(h.el('sectorPanel').hidden, false, 'wave 10 clear presents #sectorPanel retreat prompt');
  assert.match(h.el('sectorTitle').textContent, /SECTOR 1 CLEARED/i);

  // 2. Click actual #sectorAdvance ("FALL BACK ->") into Sector 2 (1320x720):
  //    must use full 390x844 portrait screen instead of shrinking into a 1/3 strip!
  h.el('sectorAdvance').onclick();
  assert.equal(h.el('sectorPanel').hidden, true);
  assert.match(h.el('mapName').textContent, /SECTOR 2/i);
  assert.equal(canvas.dataset.fullBattle, 'true', 'retreated Sector 2 enables fullBattle in solo endless');
  assert.equal(canvas.style.touchAction, 'none', 'battleViewport takes over touch handling cleanly');
  assert.equal(canvas.style.width, '', 'stale inline touchZoom width is cleared');
  assert.equal(canvas.style.height, '', 'stale inline touchZoom height is cleared');
  assert.ok(Math.abs(canvas.width / canvas.height - 390 / 844) < 0.01, `canvas aspect ${canvas.width}x${canvas.height} fills 390x844 portrait`);

  h.stepFrame(16, true);
  const firstScale = h.calls.find(c => c[0] === 'scale')?.[1] || 0;
  const firstRect = h.calls.find(c => c[0] === 'rect');
  assert.ok(firstScale >= 2078 / 720 - 0.05, `portrait Sector 2 opens filling full screen height (scale=${firstScale})`);
  assert.equal(firstRect?.[3], 1320, 'world clip uses Sector 2 width');
  assert.equal(firstRect?.[4], 720, 'world clip uses Sector 2 height');

  // 3. Tapping FIT MAP zooms out to full Sector 2 overview inside the full portrait canvas;
  //    tapping ZOOM MAP zooms right back to fill the full 390x844 portrait screen.
  assert.equal(h.el('mapZoom').textContent, 'MAP: FIT');
  assert.equal(h.el('mapQuickZoom').textContent, 'FIT MAP');
  h.el('mapQuickZoom').click();
  assert.equal(h.el('mapZoom').textContent, 'MAP: ZOOM');
  assert.equal(h.el('mapQuickZoom').textContent, 'ZOOM MAP');
  h.stepFrame(16, true);
  const overviewScale = h.calls.find(c => c[0] === 'scale')?.[1] || 0;
  assert.ok(Math.abs(overviewScale - 960 / 1320) < 0.02, `overview fits full 1320 map horizontally (scale=${overviewScale})`);

  h.el('mapQuickZoom').click();
  assert.equal(h.el('mapZoom').textContent, 'MAP: FIT');
  assert.equal(h.el('mapQuickZoom').textContent, 'FIT MAP');
  h.stepFrame(16, true);
  const rezoomedScale = h.calls.find(c => c[0] === 'scale')?.[1] || 0;
  assert.ok(rezoomedScale >= 2078 / 720 - 0.05, `re-zooming fills full portrait screen again (scale=${rezoomedScale})`);

  // Tapping on an empty Sector 2 build pad via battleViewport opens the radial build menu.
  const map2 = getMap(control.getMapId());
  const scaleIdx = h.calls.findIndex(c => c[0] === 'scale');
  const trAfterScale = scaleIdx >= 0 ? h.calls[scaleIdx + 1] : null;
  const viewX = -(trAfterScale?.[1] || 0), viewY = -(trAfterScale?.[2] || 0);
  const viewCenterX = viewX + 480 / rezoomedScale;
  const viewCenterY = viewY + 1039 / rezoomedScale;
  const tap2Pad = map2.pads.slice().sort((a, b) => Math.hypot(a.x - viewCenterX, a.y - viewCenterY) - Math.hypot(b.x - viewCenterX, b.y - viewCenterY))[0];
  h.el('radialClose').click();
  const sx = (tap2Pad.x - viewX) * rezoomedScale * (390 / 960);
  const sy = (tap2Pad.y - viewY) * rezoomedScale * (844 / 2078);
  canvas.dispatch('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: sx, clientY: sy, preventDefault() {} });
  canvas.dispatch('pointerup', { pointerId: 1, pointerType: 'touch', clientX: sx, clientY: sy, preventDefault() {} });
  assert.equal(h.el('radialMenu').hidden, false, `tapping a Sector 2 pad (${sx.toFixed(1)},${sy.toFixed(1)}) opens radial menu through battleViewport`);
  h.el('radialClose').click();

  // 4. Rotation to landscape (844x390) updates fullBattle logical dimensions cleanly.
  h.setViewport(844, 390);
  assert.equal(canvas.dataset.fullBattle, 'true');
  assert.ok(Math.abs(canvas.width / canvas.height - 844 / 390) < 0.01, `landscape rotation keeps full viewport aspect (${canvas.width}x${canvas.height})`);
  h.setViewport(390, 844);

  // 5. Sector 3 retreat (1680x960) rebuilds battleViewport cleanly for the larger world.
  assert.equal(await control.chooseEndless(null), true);
  h.stepFrame(16, true);
  const s3Rect = h.calls.find(c => c[0] === 'rect');
  assert.equal(canvas.dataset.fullBattle, 'true');
  assert.equal(s3Rect?.[3], 1680);
  assert.equal(s3Rect?.[4], 960);

  // Returning to Sector 1 / standard map cleanly restores non-fullBattle touchZoom layout.
  draws[0] = 'g3-0dfdd99a1';
  assert.equal(await control.chooseEndless(null), true);
  assert.equal(canvas.dataset.fullBattle, 'false', 'Sector 1 restores touchZoom');
  assert.equal(canvas.style.touchAction, '', 'battleViewport destroyed on Sector 1');
  control.stopForRelease();
});

test('classic map without dimensions emits boolean "false" for dataset.fullBattle even when experimentalFourViewport is true', async t => {
  const h = createHarness({ screen: 'endless', width: 390, height: 844, coarse: true });
  t.after(() => h.restore());
  const src = await loadGameSource();
  const { startGame } = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const control = startGame(ACCOUNT, {
    experimentalFourViewport: true,
    deferTutorial: true,
    confirmAction: async () => true,
    nextMapId: () => 'road',
  });
  assert.equal(h.el('game').dataset.fullBattle, 'false', 'classic road map sets dataset.fullBattle strictly to "false"');
  control.stopForRelease();
});

test('desktop retreat fills viewport at crisp >=1x scale and hidden/board-open states guard fullBattle cleanly', async t => {
  const h = createHarness({ screen: 'endless', width: 1280, height: 800, coarse: false, hidden: true });
  t.after(() => h.restore());
  const src = await loadGameSource();
  const { startGame } = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const draws = ['g3-0dfdd99a1', 'g3-2f1bbcd88'];
  const control = startGame(ACCOUNT, {
    deferTutorial: true,
    confirmAction: async () => true,
    nextMapId: () => draws.length > 1 ? draws.shift() : draws[0],
  });

  // Unhiding workspace after deploy triggers ResizeObserver -> fullBattle engages seamlessly.
  h.el('gameWorkspace').hidden = false;
  h.triggerResize();
  const canvas = h.el('game');
  assert.equal(canvas.dataset.fullBattle, 'false', 'Sector 1 stays responsive classic sizing');

  // Retreat onto Sector 3 (1680x960) on desktop 1280x800.
  assert.equal(await control.chooseEndless(null), true);
  assert.equal(canvas.dataset.fullBattle, 'true', 'Sector 3 fills 1280x800 desktop viewport');
  assert.ok(Math.abs(canvas.width / canvas.height - 1280 / 800) < 0.01);
  h.stepFrame(16, true);
  const desktopScale = h.calls.find(c => c[0] === 'scale')?.[1] || 0;
  assert.ok(desktopScale >= 1 - 1e-6, `desktop Sector 3 opens at >=1x reading scale (scale=${desktopScale})`);
  assert.equal(h.el('mapZoom').textContent, 'MAP: FIT');

  // Opening the campaign board turns off fullBattle while board is open; closing restores it.
  h.el('gameWorkspace').dataset.screen = 'campaign';
  h.el('campaignShowBoard').onclick();
  assert.equal(canvas.dataset.fullBattle, 'false', 'campaign mission board open disables fullBattle');
  h.el('campaignCloseBoard').onclick();
  assert.equal(canvas.dataset.fullBattle, 'true', 'closing mission board restores fullBattle on large field');

  control.stopForRelease();
});

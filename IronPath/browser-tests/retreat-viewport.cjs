// The wave-10 fallback regression: a solo endless run that retreats onto a big
// generated sector field must land in the pan-and-zoom battle viewport - full
// canvas inside the viewport, working zoom, the phone hint, and no browser
// pinch stealing the gesture. Runs against a static server on 127.0.0.1:8765
// (same as the other browser tests); the Firebase transport stays blocked and
// the game is booted directly with a stub account.
//   node browser-tests/retreat-viewport.cjs
const PW = process.env.PW_PATH || 'playwright';
const { chromium } = require(PW);
const assert = require('node:assert/strict');

const ACCOUNT = `(() => {
  const profile = { uid: 'u1', name: 'Tester', xp: 40000, gender: 'male',
    armory: '', skills: '', storyProgress: 12, loadout: 0 };
  return {
    getUserId: () => 'u1',
    getProfile: () => ({ ...profile }),
    getLevel: () => 20,
    isReady: () => true,
    canChooseSolo: () => true,
    sandbox: () => false,
    awardXP: async () => {},
    recordScore: () => {},
    saveCampaign: async () => {},
    getToken: async () => 'tok',
    onSessionChange: () => {},
  };
})()`;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    });
    await context.addInitScript(() => {
      try { localStorage.setItem('ironpath:language', 'en'); } catch {}
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1') return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:8765/IronPath/', { waitUntil: 'load' });
    await page.evaluate(() => {
      for (const id of ['introOverlay', 'loading', 'authView', 'entry'])
        document.getElementById(id)?.setAttribute('hidden', '');
      document.getElementById('gameView').hidden = false;
    });

    // Boot the real game with a scripted endless draw: boot + first deploy on a
    // small sector-one field, the next deploy on a big sector field - the map
    // switch the wave-10 fallback performs in place.
    const booted = await page.evaluate(async accountSource => {
      const { startGame } = await import('./game.js');
      const draws = ['g3-0dfdd99a1', 'g3-0dfdd99a1', 'g3-2f1bbcd88'];
      window.__control = startGame(eval(accountSource), {
        confirmAction: async () => true, deferTutorial: true,
        onReturnToCommand: () => {}, onResumeBattle: () => {},
        nextMapId: () => draws.length > 1 ? draws.shift() : draws[0],
      });
      return true;
    }, ACCOUNT);
    assert.ok(booted, 'the game boots with the stub account');

    const deploy = async () => {
      await page.evaluate(() => {
        document.getElementById('campaignSelect').value = 'free';
        document.getElementById('campaignQuickLoad').click();
        // The real account unhides the battle on onResumeBattle; so does the stub.
        document.getElementById('gameWorkspace').hidden = false;
      });
      await page.waitForTimeout(600);
    };
    const probe = () => page.evaluate(() => {
      const canvas = document.getElementById('game'), viewport = document.getElementById('mapViewport');
      const rect = canvas.getBoundingClientRect();
      return {
        mapName: document.getElementById('mapName').textContent,
        touchAction: canvas.style.touchAction,
        computedTouchAction: getComputedStyle(canvas).touchAction,
        hint: document.getElementById('mapHint').textContent,
        zoomLabel: document.getElementById('mapZoom').textContent,
        width: Math.round(rect.width), left: Math.round(rect.left),
        viewportWidth: viewport.clientWidth,
      };
    });

    // 1. The small field: phone pinch-zoom path, and the phone hint from the
    //    start (the desktop hint here was the stale-label bug).
    await deploy();
    let s = await probe();
    assert.match(s.mapName, /SECTOR 1|Marshland|Scorched|Urban|Scrub|Arctic/i);
    assert.equal(s.touchAction, '', 'small field: no battle viewport');
    assert.match(s.hint, /pinch/i, 'a phone opens with the touch hint, not the desktop text');
    await page.evaluate(() => document.getElementById('mapZoom').click());
    await page.waitForTimeout(250);
    s = await probe();
    assert.ok(s.width > 390 * 1.5, `phone zoom enlarges the canvas (${s.width}px)`);

    // 2. The fallback: mid-run switch to the big sector field.
    await deploy();
    s = await probe();
    assert.equal(s.touchAction, 'none', 'the battle viewport owns the canvas');
    assert.doesNotMatch(s.computedTouchAction, /pinch-zoom/, 'the browser pinch no longer competes for the gesture');
    assert.ok(s.width <= s.viewportWidth + 1, `the canvas fits the viewport (${s.width} of ${s.viewportWidth})`);
    assert.ok(s.left >= -1, `the canvas is not parked half off-screen (left ${s.left})`);
    assert.match(s.hint, /pinch/i, 'the big field explains pan and zoom');

    // 3. Zoom must do something on the big field: the button toggles, and the
    //    label follows the view.
    const before = s.zoomLabel;
    await page.evaluate(() => document.getElementById('mapZoom').click());
    await page.waitForTimeout(300);
    let after = (await probe()).zoomLabel;
    assert.notEqual(after, before, 'the MAP button changes the zoom state');
    await page.mouse.move(195, 420);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(300);
    after = (await probe()).zoomLabel;
    assert.notEqual(after, 'MAP: ZOOM', `wheel zoom moves the view (label ${after})`);

    assert.deepEqual(errors, [], 'no page errors during the fallback flow');
  } finally {
    await browser.close();
  }
  console.log('Retreat viewport regression passed.');
})().catch(e => { console.error(e); process.exit(1); });

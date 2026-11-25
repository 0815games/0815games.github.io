// Zoomgrenze der Weltansicht: auf dem Handy muss man so nah heranzoomen können wie am Desktop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraMaxK } from '../src/world/board.js';

const desktopBase = Math.min(1280 / 1400, 800 / 880);
const phoneBase = Math.min(390 / 1400, 844 / 880);
const bigBase = Math.min(1920 / 1400, 1080 / 880);

test('desktop keeps the old camera limit K_MAX = 2.6', () => {
  assert.equal(cameraMaxK(desktopBase).toFixed(3), '2.600');
});

test('phone reaches the same world zoom as the desktop', () => {
  const worldDesktop = desktopBase * cameraMaxK(desktopBase);
  const worldPhone = phoneBase * cameraMaxK(phoneBase);
  assert.ok(Math.abs(worldPhone - worldDesktop) < 1e-9, `phone ${worldPhone} vs desktop ${worldDesktop}`);
  // Und liegt über der Detailgrenze 0,75 (DETAIL_MIN_ZOOM in scene.js).
  assert.ok(worldPhone >= 0.75);
});

test('large screens keep at least K_MAX', () => {
  assert.ok(cameraMaxK(bigBase) >= 2.6);
});

test('unknown base falls back to K_MAX', () => {
  assert.equal(cameraMaxK(0), 2.6);
});

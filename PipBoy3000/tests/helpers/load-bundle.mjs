// Lädt das gebaute Bündel in einer echten DOM-Umgebung (jsdom) und prüft, dass
// die Spielobjekte vollständig ankommen. Damit ist ein kaputter Build ein
// Testergebnis und nicht erst ein Fund im Browser.
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

export const MINIMUM = {
  items: 100,
  monsters: 9,
  recipes: 16,
  questDefs: 7,
  perks: 10
};

export function loadBundle(bundlePath) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://example.test/PipBoy3000/',
    pretendToBeVisual: true
  });
  const errors = [];
  dom.window.console = {
    log() {},
    warn() {},
    error: (...args) => errors.push(args.join(' '))
  };
  dom.window.fetch = () =>
    Promise.resolve({ok: true, text: async () => '0.0.0', json: async () => ({})});
  dom.window.eval(readFileSync(bundlePath, 'utf8'));
  return {window: dom.window, errors, dom};
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {JSDOM} from 'jsdom';

const source = readFileSync(new URL('../shell/pip-dialog.js', import.meta.url), 'utf8');
function makeDom() {
  const dom = new JSDOM('<!doctype html><html><body><button id="login">ANMELDEN</button></body></html>', {url:'https://example.test/', runScripts:'outside-only'});
  dom.window.eval(source);
  return dom;
}

test('Sitzungsfrage ist ein Pip-Boy-Dialog und bestätigt erst nach Klick', async () => {
  const dom = makeDom();
  const {window:w} = dom;
  const vorher = w.document.getElementById('login'); vorher.focus();
  let settled = false;
  const result = w.PipDialog.confirm({titel:'SITZUNG AKTIV', text:'Andere Sitzung ersetzen?', bestaetigen:'SITZUNG ERSETZEN'}).then(value => {settled = true; return value;});
  const panel = w.document.querySelector('[role="dialog"]');
  assert.equal(panel.getAttribute('aria-modal'), 'true');
  assert.equal(panel.querySelector('h2').textContent, 'SITZUNG AKTIV');
  assert.equal(w.document.activeElement.textContent, 'ABBRECHEN');
  await Promise.resolve(); assert.equal(settled, false);
  panel.querySelector('.pip-dialog-primary').click();
  assert.equal(await result, true);
  assert.equal(w.document.querySelector('[role="dialog"]'), null);
  assert.equal(w.document.activeElement, vorher);
  dom.window.close();
});

test('Abbrechen und Escape lehnen die Übernahme ab, Fokus bleibt im Dialog', async () => {
  const dom = makeDom(), w = dom.window;
  let result = w.PipDialog.confirm({titel:'SITZUNG', text:'ÜBERNEHMEN?'});
  const panel = w.document.querySelector('[role="dialog"]');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Tab', bubbles:true}));
  assert.equal(w.document.activeElement, panel.querySelector('.pip-dialog-primary'));
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  assert.equal(await result, false);
  result = w.PipDialog.confirm({titel:'SITZUNG', text:'ÜBERNEHMEN?'});
  w.document.querySelector('.pip-dialog-cancel').click();
  assert.equal(await result, false);
  dom.window.close();
});

test('Hinweise werden warteschlangenfähig und ohne HTML-Injektion angezeigt', async () => {
  const dom = makeDom(), w = dom.window;
  const one = w.PipDialog.info({titel:'<img src=x>', text:'<script>unerwünscht</script>'});
  const two = w.PipDialog.info({titel:'ZWEI', text:'Zweiter Hinweis'});
  assert.equal(w.document.querySelectorAll('[role="dialog"]').length, 1);
  assert.equal(w.document.querySelector('h2').textContent, '<img src=x>');
  assert.equal(w.document.querySelector('img'), null);
  w.document.querySelector('.pip-dialog-primary').click();
  await one;
  assert.equal(w.document.querySelector('h2').textContent, 'ZWEI');
  w.document.querySelector('.pip-dialog-primary').click();
  await two;
  dom.window.close();
});

test('Spielquellen verwenden keine nativen Browser-Dialoge', () => {
  const root = new URL('..', import.meta.url).pathname;
  function files(dir) {
    return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : /\.(js|html)$/.test(e.name) ? [join(dir,e.name)] : []);
  }
  const native = /(?:\b(?:window|globalThis|self)\s*\.\s*(?:alert|confirm|prompt)|(?<![\w.$])(?:alert|confirm|prompt))\s*\(/g;
  for (const dir of ['src','shell','templates']) for (const file of files(join(root,dir))) {
    const content = readFileSync(file,'utf8');
    assert.equal(content.match(native), null, `Browser-Dialog in ${file}`);
  }
});

test('beide ausgelieferten Seiten enthalten das gemeinsame Systemfenster vor dem Spielcode', () => {
  const root = new URL('..', import.meta.url);
  for (const name of ['index.html', 'admin.html']) {
    const html = readFileSync(new URL(name, root), 'utf8');
    assert.ok(html.includes('window.PipDialog = {'), `${name}: Systemfenster fehlt`);
    assert.ok(html.indexOf('window.PipDialog = {') < html.lastIndexOf(name === 'index.html' ? 'app.js?v=' : 'admin.js?v='));
  }
});

test('Sitzungsübernahme wartet auf das sichtbare Fenster und Abbrechen verändert nichts', async () => {
  const dom = makeDom(), w = dom.window;
  w.eval(readFileSync(new URL('../src/network.js', import.meta.url), 'utf8'));
  let session = {id:'alt', lastSeen:Date.now()}, changed = false;
  const ref = {
    on() {}, off() {},
    once: async () => ({val: () => session}),
    transaction: async fn => { const next = fn(session); if (next === undefined) return {committed:false}; changed = true; session = next; return {committed:true}; }
  };
  w.Network.db = {ref: path => path ? ref : {push: () => ({key:'neu'})}};
  const pending = w.Network.acquireSession('spieler');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(w.document.querySelector('[role="dialog"]'));
  assert.equal(changed, false);
  w.document.querySelector('.pip-dialog-cancel').click();
  await assert.rejects(pending, /abgebrochen/);
  assert.equal(session.id, 'alt'); assert.equal(changed, false);
  dom.window.close();
});

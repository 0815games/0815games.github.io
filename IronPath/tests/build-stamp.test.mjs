// The visible build stamp (Punkt: "Ist noch die alte Maske aktuell?"). When a
// report says "still the old screen", the stamp shows which build the BROWSER
// actually runs: a stale stamp means cache, not code. These pins keep the
// stamp honest - and keep the stamp bump from ever eating UI text again.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

test('the build stamp is present, formatted and consistent',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const stamps=[...html.matchAll(/class="build-stamp"[^>]*>BUILD ([^<]+)</g)].map(m=>m[1]);
  assert.equal(stamps.length,2,'one stamp in the loading scene, one in the settings dialog');
  assert.ok(new Set(stamps).size===1,'both stamps carry the same build');
  assert.match(stamps[0],/^20\d{6}-[a-z0-9]+$/,'the build is a dated wave token');
  assert.match(html,/<div id="loading">[^]*?class="build-stamp"/,'the loading scene shows the stamp');
  assert.match(html,/<dialog id="settingsDialog"[^]*?class="build-stamp"/,'the settings dialog shows the stamp');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(css,/\.build-stamp\{/,'the stamp has styling');
});

test('the stamp bump never touches UI text',()=>{
  // Regression: a greedy /BUILD \w+/ rewrite once corrupted the legend and the
  // help text. The bump is anchored on the stamp class now - these must hold.
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<span data-i18n-text="BUILD PAD">BUILD PAD<\/span>/,'the legend still says BUILD PAD');
  assert.match(html,/Tap a BUILD marker to choose a tower/,'the help text still says BUILD marker');
});

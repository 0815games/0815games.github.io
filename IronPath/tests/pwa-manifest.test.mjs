// IPL-0142: saving IronPath to the home screen must open /IronPath/, never
// https://0815games.github.io/IronPath/assets/index.html. The manifest lives
// under assets/, so a relative start_url like ./index.html resolves against
// the manifest URL and the browser stores exactly that wrong address on the
// icon. Resolve the URLs the way a browser does and pin the result; also keep
// the manifest link cache-busted (iOS caches web app manifests stubbornly).
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../assets/manifest.webmanifest',import.meta.url),'utf8'));
const MANIFEST_URL='https://0815games.github.io/IronPath/assets/manifest.webmanifest';

test('start_url and scope resolve to the game root, not into assets/',()=>{
  assert.equal(manifest.start_url,'/IronPath/');
  assert.equal(manifest.scope,'/IronPath/');
  // Exactly how the browser builds the home-screen URL from the manifest.
  const start=new URL(manifest.start_url,MANIFEST_URL);
  assert.equal(start.href,'https://0815games.github.io/IronPath/','the home-screen icon opens the game root');
  const scope=new URL(manifest.scope,MANIFEST_URL);
  assert.equal(scope.href,'https://0815games.github.io/IronPath/','the standalone scope covers the game');
  // The reported bug, as a standing regression pin.
  assert.notEqual(start.href,'https://0815games.github.io/IronPath/assets/index.html');
  assert.ok(!new URL(manifest.start_url,MANIFEST_URL).pathname.startsWith('/IronPath/assets/'),'start_url never lands under assets/');
});

test('the manifest link shares the wave token with every icon link',()=>{
  const tokens=['favicon.svg?v=','favicon.ico?v=','apple-touch-icon.png?v=','manifest.webmanifest?v=']
    .map(ref=>{
      const hit=html.match(new RegExp(`assets/${ref.replace(/[.?]/g,'\\$&')}([0-9a-z-]+)`));
      assert.ok(hit,`manifest link present: ${ref}`);
      return hit[1];
    });
  assert.equal(new Set(tokens).size,1,'all four asset links share one cache-busting token');
});

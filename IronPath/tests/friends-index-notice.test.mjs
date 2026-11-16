import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

// Reported: "Ganz oben die Meldung 'Die spielersuche konnte nicht aktualisiert
// werden. Erneut versuchen.'" - the search-listing error stood as a bar at the
// very top of the game view, permanently, over the Command Center and every
// match. The search listing is a background sync: it now retries quietly and
// the notice lives inside the friends dialog where the search happens.
test('the search-listing notice lives inside the friends dialog, not over the game',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const bar=html.indexOf('id="friendIndexError"');
  const dialog=html.indexOf('id="friendsDialog"');
  assert.ok(bar>dialog,'the notice moved into the friends dialog');
  const gameView=html.slice(html.indexOf('id="gameView"'),html.indexOf('id="gameWorkspace"'));
  assert.ok(!gameView.includes('friendIndexError'),'nothing search-related floats over the game view anymore');
  assert.ok(bar>html.indexOf('id="friendsClose"'),'it sits under the dialog header, where the search is');
});

test('a failed listing update retries quietly before anything is shown',()=>{
  const source=readFileSync(new URL('../friends-ui.mjs',import.meta.url),'utf8');
  assert.match(source,/let indexRetries=0,indexTimer=null,indexFailed=false,connectionStop=null;/,'retry state exists');
  assert.match(source,/if\(indexRetries>=3\)return false;/,'at most three quiet retries');
  assert.match(source,/const delay=30000\*\(indexRetries\+1\);/,'growing delays: 30s, 60s, 120s');
  assert.match(source,/if\(indexSession===session&&getProfile\(\)&&auth\.currentUser\)void indexAccount\(\);/,'a retry only runs while the session is alive');
  assert.match(source,/if\(!scheduleIndexRetry\(current\)\)\{\$\('friendIndexError'\)\.hidden=false;/,'the notice appears only after the quiet retries are exhausted');
  assert.match(source,/indexSession\+\+;indexPromise=null;clearTimeout\(indexTimer\);indexTimer=null;indexRetries=0;/,'start and sign-out clear the retry state');
  // Three quiet retries are not enough on their own: the notice lives inside
  // the friends dialog, so a player who never opens it stays unfindable in
  // silence. The connection coming back earns one more attempt.
  assert.match(source,/sdk\.onValue\(sdk\.ref\(db,'\.info\/connected'\)/,'the connection is watched');
  assert.match(source,/if\(snapshot\?\.val\?\.\(\)!==true\|\|!indexFailed\|\|indexPromise\)return;/,'only after a failure, and never while one is running');
  assert.match(source,/stopConnectionWatch\(\);indexFailed=false;/,'sign-out detaches the watch');
  assert.match(source,/indexFailed=true;if\(!scheduleIndexRetry\(current\)\)/,'a failure is remembered so a reconnect can retry it');
  assert.match(source,/indexRetries=0;indexFailed=false;\}return true;/,'and a success forgets it');
  const css=readFileSync(new URL('../interface-redesign.css',import.meta.url),'utf8');
  assert.match(css,/\.friend-index-error\{[^}]*margin:12px/,'styled as a dialog notice');
  assert.match(css,/\.friend-index-error\[hidden\]\{display:none\}/,'still hides cleanly');
});

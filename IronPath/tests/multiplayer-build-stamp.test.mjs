import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

test('multiplayer camera, CSS and account entry use the current build wave',()=>{
 const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
 const html=read('index.html'),account=read('account.js'),game=read('game.js'),controller=read('battle-viewport-controller.mjs');
 const stamp=/class="build-stamp"[^>]*>BUILD ([^<]+)/.exec(html)?.[1];
 assert.ok(stamp,'the client advertises a build wave');
 assert.ok(html.includes(`account-entry.mjs?v=${stamp}`));
 assert.ok(read('account-entry.mjs').includes(`account.js?v=${stamp}`));
 assert.ok(account.includes(`game.js?v=${stamp}`));
 // The entire game has a new release ID, but unchanged multiplayer assets can
 // keep their own revision. All paths to that shared revision must still agree.
 const camera=/battle-viewport\.mjs\?v=([a-z0-9-]+)/.exec(game)?.[1];
 assert.ok(camera,'the multiplayer assets advertise their revision');
 assert.ok(html.includes(`field-command.css?v=${camera}`));
 assert.ok(game.includes(`battle-viewport-controller.mjs?v=${camera}`));
 assert.ok(controller.includes(`battle-viewport.mjs?v=${camera}`));
 // A larger duel also changes versus's bunker spawn. Revalidate every path
 // from account to that simulation, including workshop and host recovery.
 const dependencies={
  'account.js':['firebase-party-game.mjs','firebase-recoverable-game.mjs'],
  'firebase-party-game.mjs':['versus.mjs','party-host.mjs','firebase-party-session.mjs','workshop-multiplayer-game.mjs'],
  'firebase-recoverable-game.mjs':['versus.mjs','party-host.mjs','firebase-recovery-store.mjs','firebase-durable-client-session.mjs','workshop-multiplayer-game.mjs'],
  'workshop-multiplayer-game.mjs':['versus.mjs'],
  'firebase-recovery-store.mjs':['party-host.mjs'],
  'party-host.mjs':['protocol.mjs'],
  'firebase-party-session.mjs':['protocol.mjs'],
  'firebase-durable-client-session.mjs':['protocol.mjs'],
  'protocol.mjs':['versus.mjs'],
 };
 for(const [file,modules] of Object.entries(dependencies))for(const module of modules)
  assert.ok(read(file).includes(`${module}?v=${camera}`),`${file} must import the current ${module}`);
});

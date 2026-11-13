import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

test('multiplayer camera, CSS and account entry use the current build wave',()=>{
 const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
 const html=read('index.html'),account=read('account.js'),game=read('game.js'),controller=read('battle-viewport-controller.mjs');
 const stamp=/class="build-stamp"[^>]*>BUILD ([^<]+)/.exec(html)?.[1];
 assert.ok(stamp,'the client advertises a build wave');
 assert.ok(html.includes(`account.js?v=${stamp}`));
 assert.ok(html.includes(`field-command.css?v=${stamp}`));
 assert.ok(account.includes(`game.js?v=${stamp}`));
 assert.ok(game.includes(`battle-viewport-controller.mjs?v=${stamp}`));
 assert.ok(game.includes(`battle-viewport.mjs?v=${stamp}`));
 assert.ok(controller.includes(`battle-viewport.mjs?v=${stamp}`));
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
  assert.ok(read(file).includes(`${module}?v=${stamp}`),`${file} must import the current ${module}`);
});

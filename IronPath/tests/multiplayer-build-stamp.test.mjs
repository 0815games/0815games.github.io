import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync} from 'node:fs';

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
 // The wave protocol has changed, independently of the unchanged camera and
 // field CSS. Every route to the revised host/simulation must bypass old cache,
 // including the opt-in workshop and recovery routes.
 const dependencies={
  'account.js':['game.js','match.mjs','firebase-party-game.mjs','firebase-recoverable-game.mjs'],
  'game.js':['match.mjs','simulation.mjs','four-game-view.mjs'],
  'firebase-party-game.mjs':['versus.mjs','four-modes.mjs','simulation.mjs','party-host.mjs','firebase-party-session.mjs','workshop-multiplayer-game.mjs'],
  'firebase-recoverable-game.mjs':['versus.mjs','four-modes.mjs','simulation.mjs','party-host.mjs','firebase-recovery-store.mjs','firebase-durable-client-session.mjs','workshop-multiplayer-game.mjs'],
  'workshop-multiplayer-game.mjs':['versus.mjs','four-modes.mjs','simulation.mjs'],
  'firebase-recovery-store.mjs':['party-host.mjs'],
  'party-host.mjs':['protocol.mjs'],
  'firebase-party-session.mjs':['protocol.mjs'],
  'firebase-durable-client-session.mjs':['protocol.mjs'],
  'protocol.mjs':['versus.mjs','four-modes.mjs','match.mjs','simulation.mjs','multiplayer-speed.mjs'],
  'versus.mjs':['match.mjs','simulation.mjs','wave-consensus.mjs'],
  'four-modes.mjs':['match.mjs','simulation.mjs','wave-consensus.mjs'],
  'simulation.mjs':['match.mjs'],
  'match.mjs':['wave-consensus.mjs'],
 };
 for(const [file,modules] of Object.entries(dependencies))for(const module of modules)
  assert.ok(read(file).includes(`${module}?v=${stamp}`),`${file} must import the current ${module}`);
});

test('changed browser modules and their importers share one cache wave without splitting singleton services',()=>{
 const root=new URL('../',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8');
 const stamp=JSON.parse(read('release-version.json')).build;
 // This includes transitive importers, not only the files with gameplay edits:
 // cached JS is not re-evaluated just because its own dependency has changed.
 const names=new Set([
  'account-entry.mjs','account.js','auth-form.mjs','cartoon-art.mjs','character-name-claim.mjs','character-name.mjs','command-center.mjs','confirmation.mjs',
  'coop-input.mjs','coop-invites.mjs','coop-rewards.mjs','discharge-notice.mjs','endless-launcher.mjs','field-menu.mjs',
  'firebase-durable-client-session.mjs','firebase-durable-host-session.mjs','firebase-four-digit-panel.mjs','firebase-four-panel.mjs',
  'firebase-party-game.mjs','firebase-party-session.mjs','firebase-recoverable-game.mjs','firebase-recovery-store.mjs',
  'first-run-coach.mjs','first-run-ending.mjs','first-run-guide.mjs','four-game-view.mjs','four-modes.mjs',
  'friend-portrait.mjs','friends-ui.mjs','friends.mjs','game.js','intro.mjs','language.mjs','leaderboards-ui.mjs','leaderboards.mjs',
  'localization-account-de.mjs','localization-battle-de.mjs','localization-game-errors-de.mjs','localization-more-static-de.mjs','localization-results-de.mjs',
  'maps.mjs','match.mjs','multiplayer-prompts.mjs','multiplayer-speed.mjs','party-end-coordinator.mjs','party-signout.mjs','party-host.mjs','patch-notes.mjs','protocol.mjs','rank-insignia.mjs','recruit-screen.mjs','simulation.mjs',
  'social-notifications.mjs','soldier-screen.mjs','solo-deployment.mjs','story-map-art.mjs','tutorial.mjs',
  'version-check.mjs','version-ui.mjs','versus.mjs','wave-consensus.mjs','workshop-multiplayer-game.mjs','workshop-solo.mjs'
 ]);
 const seen=new Set(),pattern=/["'](?:\.\/)?([\w.-]+\.(?:mjs|js))(?:\?v=([\w-]+))?["']/g;
 for(const file of readdirSync(root).filter(name=>/\.(?:mjs|js|html)$/.test(name))){
  for(const match of read(file).matchAll(pattern))if(names.has(match[1])){
   seen.add(match[1]);assert.equal(match[2],stamp,`${file} must not cache an old ${match[1]} or load a second instance`);
  }
 }
 for(const name of names)assert.ok(seen.has(name),`cache-chain fixture must exercise ${name}`);
 // The unchanged maintenance boot holds module-level state. These two imports
 // must remain identical even if that separate singleton is not on this wave.
 const boot=file=>/maintenance-bootstrap\.mjs\?v=([\w-]+)/.exec(read(file))?.[1];
 assert.ok(boot('account-entry.mjs'));assert.equal(boot('account-entry.mjs'),boot('account.js'));
});

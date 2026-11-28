// Source pins for the Konto & Charakter tools: the panel must ship its own
// elements, the loader must wire the module, and the publish file must keep
// the operator-only authorization boundary (players stay gated, the name
// index stays closed for in-game accounts).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const html=read('admin.html');
const css=read('admin.css');
const module=read('core/admin-players.mjs');
const wiring=read('core/admin-firebase.mjs');
const rules=JSON.parse(read('firebase/ADMIN-ACCOUNT-RULES-TO-PUBLISH.json')).rules;
const ADMIN='fKrII8AGsHPhKlrS3IWy0LXQ3cp1';

test('the dashboard ships every element the player tools require',()=>{
 const ids=['adminPlayerLookup','adminPlayerLoad','adminPlayerCard','adminPlayerName','adminPlayerUid','adminPlayerMeta','adminXpInput','adminXpApply','adminNameInput','adminNameApply','adminPlayerMessage','adminPlayerConfirm','adminPlayerConfirmTitle','adminPlayerConfirmDetail','adminPlayerConfirmAction','adminPlayerConfirmCancel'];
 for(const id of ids)assert.ok(html.includes(`id="${id}"`),`missing #${id}`);
 assert.ok(html.includes('KONTO &amp; CHARAKTER'),'section heading');
 assert.ok(wiring.includes('admin-players.mjs'),'module entry token');
 assert.ok(css.includes('.player-tools'),'player tools styles');
});

test('the Firebase bootstrap imports update and starts the player tools',()=>{
 assert.ok(/import \{[^}]*\bupdate\b[^}]*\} from 'https:\/\/www\.gstatic\.com\/firebasejs\/[^']*firebase-database\.js'/.test(wiring),'update must be imported from the database SDK');
 assert.ok(wiring.includes('createAdminPlayers({document,window,auth,db'),'player tools must be created');
 assert.ok(wiring.includes('update:sdk.update')||wiring.includes('update,')||/sdk:\{[^}]*update/.test(wiring),'update must reach the player tools sdk');
 assert.ok(module.includes('export function createAdminPlayers'),'export');
 assert.ok(module.includes("from './character-name.mjs"),'name validation must be shared');
 assert.ok(module.includes("from './progression.mjs"),'level display must be shared');
 assert.ok(module.includes('runTransaction'),'XP is written transactionally');
 assert.ok(module.includes('characterNames/'),'reservation moves with the name');
});

test('the publish file keeps players monotone and the name index admin-only',()=>{
 const player=rules.players.$uid;
 assert.ok(player['.read'].includes(ADMIN),'operator read');
 assert.ok(player['.write'].includes(ADMIN),'operator write');
 assert.ok(player['.write'].includes("child('gender').val() === data.child('gender').val()"),'operator writes never swap the avatar gender');
 assert.ok(player['.write'].includes('data.exists()'),'operator edits existing accounts');
 assert.ok(player.xp['.validate'].includes('10000000'),'XP ceiling for everyone');
 assert.ok(player.xp['.validate'].includes('data.val()'),'players keep monotone XP');
 assert.ok(player.name['.validate'].includes('data.val()'),'players keep the immutable name');
 assert.equal(rules.characterNames['.read'],`auth != null && auth.uid === '${ADMIN}'`);
 assert.equal(rules.characterNames['.write'],`auth != null && auth.uid === '${ADMIN}'`);
 assert.ok(rules.characterNames.$key['.validate'].includes('uid'),'reservation shape');
});

test('the emulator suite runs the account rules in CI',()=>{
 const chain=JSON.parse(read('firebase/rules-test/package.json')).scripts['test:maintenance'];
 assert.ok(chain.includes('admin-account.test.mjs'),'account rules must be in the maintenance chain');
 const test=read('firebase/rules-test/admin-account.test.mjs');
 assert.ok(test.includes('ADMIN-ACCOUNT-RULES-TO-PUBLISH.json'),'the test must load the publish file');
 assert.ok(test.includes(`const ADMIN='${ADMIN}'`),'the test must use the published admin UID');
 const publish=read('firebase/ADMIN-ACCOUNT-RULES-TO-PUBLISH.json');
 assert.ok(!publish.includes('isObject'),'RTDB rules have no isObject() method');
 const browser=read('firebase/rules-test/admin-panel-browser.cjs');
 assert.ok(!browser.includes("admin-entry.mjs?v=202610"),"the panel test must not pin a cache-wave token");
 assert.ok(browser.includes('admin-entry\\.mjs\\?v='),'the panel test swaps the entry token generically');
});

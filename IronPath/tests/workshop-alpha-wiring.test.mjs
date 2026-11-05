import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
// Static wiring checks for the alpha access switch. The account module needs a
// browser and Firebase, so this asserts the important invariants at source level
// and leaves behaviour to workshop-access.test.mjs.
const source=await readFile(new URL('../account.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('the release gate is on but never grants access by itself',()=>{
 assert.match(source,/const WORKSHOP_RELEASE_READY=true;/);
 // The gate must not be used directly for the UI or a game; only the resolved
 // access decision may open anything.
 assert.doesNotMatch(source,/experimentalWorkshop:WORKSHOP_RELEASE_READY/,'games must follow the runtime access decision');
 assert.doesNotMatch(source,/soldierWorkshop'\)\.hidden=!WORKSHOP_RELEASE_READY/);
 assert.match(source,/accessGranted\(\{releaseReady:WORKSHOP_RELEASE_READY,optIn:/);
});

test('access is required by every workshop entry point',()=>{
 for(const pattern of [/canEdit:\(\)=>workshopAccess&&canEditSkills\(\)/,/onWorkshop:\(\)=>\{if\(!workshopAccess/,/experimentalWorkshop:workshopAccess/,/workshop:workshopAccess/])assert.match(source,pattern);
 assert.doesNotMatch(source,/soldierWorkshop'\)\.hidden=!WORKSHOP_RELEASE_READY/,'the button is no longer tied to the compile-time gate');
});

test('access is recomputed on profile load and reset on sign-out',()=>{
 assert.match(source,/\$\('soldierWorkshop'\)\.hidden=!granted/);
 assert.match(source,/if\(first\)void refreshWorkshopAccess\(currentUser\)/);
 assert.match(source,/workshopAccess=false;\$\('soldierWorkshop'\)\.hidden=true/);
});

test('solo rewards only send receipts when access is granted, and stop after a rejection',()=>{
 assert.match(source,/const fallback=workshopReceiptFallback\|\|!workshopAccess;/);
 assert.match(source,/if\(outcome\.status==='legacy-fallback'\)workshopReceiptFallback=true/);
});

test('the opt-in is documented in the page and the module is cache-busted',()=>{
 assert.match(source,/workshop-access\.mjs\?v=20261112-free6/);
 assert.match(html,/<div class="workshop-content" id="workshopContent"><\/div>/,'the workshop dialog stays in the page for gated access');
});

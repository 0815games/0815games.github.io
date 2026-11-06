import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
// The account module needs a browser and Firebase, so these assert the wiring
// contract at source level; behaviour is covered by the workshop-* unit tests.
const source=await readFile(new URL('../account.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('the workshop is a tab inside the armory, not a separate screen',()=>{
 assert.match(html,/id="armoryWorkshopTab"/);
 assert.match(html,/id="armoryWorkshop" class="workshop-content"/);
 assert.doesNotMatch(html,/id="workshopDialog"/,'the separate workshop dialog is gone');
 assert.doesNotMatch(html,/id="soldierWorkshop"/,'one button opens the armory, not two screens');
 assert.match(source,/armoryTabs=\[\['armoryEquipmentTab','equipment'\],\['armoryWorkshopTab','workshop'\]/);
});

test('opening the workshop tab prepares it once through the guarded service',()=>{
 // The tutorial sandbox has no save to prepare, so practice never asks the service.
 assert.match(source,/if\(!inSandbox\(\)&&!Object\.hasOwn\(profile\|\|\{\},'workshop'\)\)void prepareWorkshop\(\);/,'only the workshop tab prepares it, and never in the sandbox');
 assert.match(source,/workshopPrepare=workshopAccount\.initialize\(\)/,'the migration uses the same canEdit-guarded service');
 assert.match(source,/const settle=\(status,error\)=>\{/);
 assert.match(source,/if\(status==='rejected'\)/,'a rejected write is reported and nothing is claimed as prepared');
 assert.match(source,/\.finally\(\(\)=>\{workshopPrepare=null;/,'the in-flight attempt is cleared');
 assert.match(source,/if\(workshopPrepareFailed\)return \{status:'failed'\}/,'one attempt per session, not one write per render');
});

test('every workshop write goes through the account transaction and match state',()=>{
 assert.match(source,/createWorkshopAccount\(\{db,auth,sdk:\{ref,onValue,runTransaction\},canEdit:\(\)=>[^}]*canEditSkills\(\)\}\)/,'the service is canEdit-guarded, and the tutorial sandbox is refused first');
 assert.match(source,/experimentalWorkshop:true,/,'endless solo uses the workshop effects');
 assert.match(source,/const rewardOptions=\{db,auth,sdk:partySdk,partyId:party\.partyId,workshop:true,/,'co-op credits the workshop, not only legacy scrap');
 assert.match(source,/creditSoloWave\(\{sdk:\{runTransaction\}/);
 assert.match(source,/const fallback=workshopReceiptFallback;/,'a rules rejection falls back to the legacy save');
});

test('the old equipment screens still exist and still save',()=>{
 for(const pattern of [/function renderArmory\(\)/,/async function saveArmory\(change\)/,/upgradeArmory,equipArmory,encodeLoadout/,/renderArmory\(\);\$\('armoryDialog'\)\.showModal\(\)/])assert.match(source,pattern);
});

test('armory state exists before the first language render',()=>{
 // setupLanguage() renders once synchronously, so anything its onChange reads
 // must already be initialised; a later `let` would throw on page load.
 const setup=source.indexOf('setupLanguage({');
 for(const pattern of [/let armoryCategory/,/commandCenter=null/,/profile=null/]){
  const declaration=source.search(pattern);
  assert.ok(declaration>=0&&declaration<setup,`${pattern} must be declared before setupLanguage()`);
 }
});

test('repeated profile snapshots never restart the game or social listeners',()=>{
 // showProfile() starts the game, the friend listener and the score reporter;
 // running it again on every snapshot duplicated popups and leaderboard writes.
 assert.match(source,/if\(first\)\{showProfile\(value\);void backfillPrestige\(value\);refreshDogTags\(\);void startFirstRunTutorial\(\);\}else \{commandCenter\?\.render\(\);/,'showProfile still runs exactly once; the tag is only re-drawn');
});

test('the workshop view is cache-busted with the build',()=>{
 assert.match(source,/workshop-view\.mjs\?v=20261112-firstrun5/);
 assert.match(html,/account\.js\?v=20261117-firstrunde1/);
 assert.match(html,/workshop-view\.css\?v=20261112-firstrun5/);
});

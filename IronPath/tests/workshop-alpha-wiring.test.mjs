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
 assert.match(source,/if\(!Object\.hasOwn\(profile\|\|\{\},'workshop'\)\)void prepareWorkshop\(\);/,'only the workshop tab prepares it');
 assert.match(source,/workshopPrepare=workshopAccount\.initialize\(\)/,'the migration uses the same canEdit-guarded service');
 assert.match(source,/const settle=\(status,error\)=>\{/);
 assert.match(source,/if\(status==='rejected'\)/,'a rejected write is reported and nothing is claimed as prepared');
 assert.match(source,/\.finally\(\(\)=>\{workshopPrepare=null;/,'the in-flight attempt is cleared');
 assert.match(source,/if\(workshopPrepareFailed\)return \{status:'failed'\}/,'one attempt per session, not one write per render');
});

test('every workshop write goes through the account transaction and match state',()=>{
 assert.match(source,/createWorkshopAccount\(\{db,auth,sdk:\{ref,onValue,runTransaction\},canEdit:\(\)=>canEditSkills\(\)\}\)/);
 assert.match(source,/experimentalWorkshop:true,/,'endless solo uses the workshop effects');
 assert.match(source,/creditSoloWave\(\{sdk:\{runTransaction\}/);
 assert.match(source,/const fallback=workshopReceiptFallback;/,'a rules rejection falls back to the legacy save');
});

test('the old equipment screens still exist and still save',()=>{
 for(const pattern of [/function renderArmory\(\)/,/async function saveArmory\(change\)/,/upgradeArmory,equipArmory,encodeLoadout/,/renderArmory\(\);\$\('armoryDialog'\)\.showModal\(\)/])assert.match(source,pattern);
});

test('the workshop view is cache-busted with the build',()=>{
 assert.match(source,/workshop-view\.mjs\?v=20261112-armory1/);
 assert.match(html,/account\.js\?v=20261112-armory1/);
 assert.match(html,/workshop-view\.css\?v=20261112-armory1/);
});

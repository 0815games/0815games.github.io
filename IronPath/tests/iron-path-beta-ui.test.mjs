import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {renderRunResults} from '../results-view.mjs';
import {renderCampaign} from '../campaign-view.mjs';
import {CAMPAIGN_MISSIONS} from '../campaign.mjs';
import {summarizeRun} from '../run-summary.mjs';
import {feedbackUrl} from '../feedback.mjs';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const game=await readFile(new URL('../game.js',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');

// Every element the battle code looks up must exist in the page.
const ids=new Set([...game.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g)].map(m=>m[1]));
const missing=[...ids].filter(id=>!html.includes(`id="${id}"`));
assert.deepEqual(missing,[],'game.js references page elements that are missing');
for(const id of ['campaignOpen','missionLine','campaignDialog','campaignList','runResults','resultsStats','resultsRewards','resultsFeedback','resultsNewRun','feedbackLink'])
  assert.ok(ids.has(id)||html.includes(`id="${id}"`),`${id} is present`);
assert.match(html,/<dialog id="runResults"[\s\S]*?<\/dialog>/);
assert.match(html,/href="https:\/\/github\.com\/0815games\/0815games\.github\.io\/issues\/new\?labels=iron-path%2Cfeedback/,'footer feedback link is static and safe');
assert.match(html,/id="campaignOpen"[^>]*>CAMPAIGN</,'campaign button is in the profile bar');
assert.match(css,/\.results-dialog/);assert.match(css,/\.campaign-mission/);

// Minimal DOM that records text as text, so markup in names must stay inert.
function fakeDocument(ids){
  const nodes=new Map();
  const make=tag=>({tagName:tag,textContent:'',className:'',style:{},children:[],append(...n){this.children.push(...n);},set innerHTML(v){throw new Error('innerHTML must not be used');}});
  for(const id of ids)nodes.set(id,make('div'));
  return {getElementById:id=>{if(!nodes.has(id))nodes.set(id,make('div'));return nodes.get(id);},createElement:make,nodes};
}
const doc=fakeDocument(['resultsEyebrow','resultsTitle','resultsMission','resultsStats','resultsContributions','resultsRewards','resultsFeedback']);
const hostile='<img src=x onerror=alert(1)>';
const summary=summarizeRun({ended:true,endReason:'defeat',wave:3,clearedWaves:2,lootKills:6,players:{a:{name:hostile,record:{heroDamage:10,towerDamage:20,kills:2,supplies:40,combos:1}}}},{playerId:'a',startXP:0,startOwned:0});
renderRunResults(doc,summary,{feedbackHref:feedbackUrl({outcome:'defeat',wave:3})});
const contributor=doc.nodes.get('resultsContributions').children[0];
const strong=contributor.children[0].children[0];
assert.equal(strong.textContent,`${hostile} (you)`,'player names render as plain text');
assert.equal(doc.nodes.get('resultsTitle').textContent,'The bunker fell');
assert.equal(doc.nodes.get('resultsEyebrow').textContent,'OPERATION FAILED');
assert.equal(doc.nodes.get('resultsStats').children.length,8);
assert.equal(doc.nodes.get('resultsFeedback').href,feedbackUrl({outcome:'defeat',wave:3}));

// Campaign picker: locked missions cannot be started, and co-op cannot start a campaign.
const cdoc=fakeDocument(['campaignList']);
const started=[];
renderCampaign(cdoc,CAMPAIGN_MISSIONS,2,{onStart:m=>started.push(m.id)});
const cards=cdoc.nodes.get('campaignList').children;
assert.equal(cards.length,4);
const buttonOf=card=>card.children.at(-1);
assert.equal(buttonOf(cards[0]).disabled,false);assert.equal(buttonOf(cards[1]).disabled,false);
assert.equal(buttonOf(cards[2]).disabled,true,'level 3 mission is locked at level 2');
assert.equal(buttonOf(cards[2]).textContent,'LOCKED');
buttonOf(cards[1]).onclick();assert.deepEqual(started,['arctic-thin-ice']);
const coopDoc=fakeDocument(['campaignList']);
renderCampaign(coopDoc,CAMPAIGN_MISSIONS,9,{onStart:()=>assert.fail('co-op must not start missions'),coop:true});
for(const card of coopDoc.nodes.get('campaignList').children)assert.equal(buttonOf(card).disabled,true);
console.log('Iron Path beta UI wiring, escaping and campaign picker checks passed.');

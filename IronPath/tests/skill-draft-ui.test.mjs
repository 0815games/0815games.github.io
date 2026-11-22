import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {SKILL_PATHS,parseBuild,encodeBuild,pointsLeft,WEB_NODES,webReady,webRequirement} from '../core/skills.mjs';
import {skillBuildSummary,canSaveSkillDraft} from '../core/skill-planner.mjs';
import {localizeSkillSummary} from '../core/skill-summary-localization.mjs';
import {bindDialogBackdrop} from '../ui/dialog-dismiss.mjs';
import {characterProgress} from '../core/progression.mjs';

const source=await readFile(new URL('../account.js',import.meta.url),'utf8');
const start=source.indexOf('function canEditSkills()'),end=source.indexOf('\nconst armoryTabs=[',start);
assert.ok(start>0&&end>start);
globalThis.window={matchMedia:()=>({matches:false})};
const nodes=new Map();
function $(id){
  if(!nodes.has(id))nodes.set(id,{textContent:'',value:'all',disabled:false,hidden:false,open:false,querySelector(){return null},addEventListener(name,fn){this['on'+name]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true},close(){this.open=false}});
  return nodes.get(id);
}
let lastRender,store={name:'Alice',gender:'female',xp:750,skills:'v2;assault;1;0;00000000000000'},allow=false,resets=0,select,pristine=true;
const confirmation={async ask(){return allow;}},gameControl={canEditSkills:()=>pristine,resetSkills(){resets++;}},skillMap={center(){}};
const renderSkillTree=options=>{lastRender=options;select=options.onSelect;};
const runTransaction=async(_ref,update)=>{const next=update(structuredClone(store));if(!next)return {committed:false};store=next;return {committed:true,snapshot:{val:()=>structuredClone(store)}};};
const init=new Function('$','profile','user','sessionVersion','partyPanel','fourPanel','gameControl','commandCenter','confirmation','skillMap','level','pointsLeft','parseBuild','encodeBuild','SKILL_PATHS','WEB_NODES','webReady','webRequirement','skillBuildSummary','localizeSkillSummary','canSaveSkillDraft','renderSkillTree','document','runTransaction','ref','db','updateSkillPrompt','bindDialogBackdrop','translateText',`
let sandbox=null,skillMigrationSummary=null;
const inSandbox=()=>sandbox!==null;const viewProfile=()=>profile;const assertWritable=()=>{};const syncContextBackButtons=()=>{};
let draftSkills=null,selectedSkill={path:'assault',rank:1},openedSkills='',savingSkills=false,closingSkills=false,skillsOpenGeneration=0;
${source.slice(start,end)}
return {getDraft:()=>draftSkills};`);

const ui=init($,structuredClone(store),{uid:'alice'},1,{isActive:()=>false},null,gameControl,null,confirmation,skillMap,xp=>characterProgress(xp).level,pointsLeft,parseBuild,encodeBuild,SKILL_PATHS,WEB_NODES,webReady,webRequirement,skillBuildSummary,localizeSkillSummary,canSaveSkillDraft,renderSkillTree,{querySelectorAll:()=>[]},runTransaction,(_db,path)=>path,{},()=>{},bindDialogBackdrop,(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(m,k)=>values[k]??m));

$('skillOpen').onclick();
assert.equal($('skillDialog').open,true);
assert.match($('skillSummaryActive').textContent,/Airstrike/);
assert.match($('skillStatus').textContent,/unchanged/);
$('skillFilter').value='combo';$('skillPathFilter').value='assault';$('skillFilter').onchange();
assert.equal(lastRender.filter,'combo');
assert.equal(store.skills,'v2;assault;1;0;00000000000000','filtering never changes saved data');

await $('skillReset').onclick();
assert.equal(ui.getDraft().assault,1,'cancel reset leaves draft untouched');
allow=true;await $('skillReset').onclick();
assert.equal(ui.getDraft().classId,null,'accepted reset refunds to unchosen class');
assert.equal(ui.getDraft().active,null);
assert.match($('skillStatus').textContent,/Unsaved draft/);

allow=false;await $('skillCancel').onclick();
assert.equal($('skillDialog').open,true,'cancelling discard keeps the draft');
allow=true;await $('skillCancel').onclick();
assert.equal(store.skills,'v2;assault;1;0;00000000000000','closing discards unsaved draft');

$('skillOpen').onclick();await $('skillReset').onclick();await $('skillSave').onclick();
assert.equal(store.skills,'v2;none');assert.equal(resets,1);assert.equal($('skillDialog').open,false);

$('skillOpen').onclick();select({path:'recon',rank:1},false);$('skillDetailAction').onclick();
assert.equal(ui.getDraft().classId,'recon');
assert.match($('skillStatus').textContent,/Unsaved draft/);
store.skills='v2;engineer;1;0;00000000000000';
await $('skillSave').onclick();
assert.equal(store.skills,'v2;engineer;1;0;00000000000000');
assert.match($('skillStatus').textContent,/changed elsewhere/);
assert.equal($('skillDialog').open,true);

await $('skillCancel').onclick();store.skills='v2;none';pristine=false;$('commandCenter').hidden=false;$('skillOpen').onclick();
assert.equal($('skillDialog').open,true,'skills can be edited from command center during a paused run');
select({path:'airDefense',rank:1},false);$('skillDetailAction').onclick();await $('skillSave').onclick();
assert.equal(store.skills,'v2;airDefense;1;0;00000000000000');
assert.equal(resets,1,'saving for a future match must not reset an active run');
$('commandCenter').hidden=true;$('skillOpen').onclick();
assert.equal($('skillDialog').open,false,'active battle still blocks mid-match editing');
console.log('V2 draft class selection, reset confirmation, discard, save and conflict handling passed.');

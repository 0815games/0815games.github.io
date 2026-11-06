import {test} from 'node:test';
import { strict as assert } from 'node:assert';
import {createTutorial,TUTORIAL_STEPS} from '../tutorial.mjs';
import {readFileSync,readdirSync} from 'node:fs';
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{open:false,dataset:{},attrs:{},setAttribute(key,value){this.attrs[key]=value;},addEventListener(type,fn){this['on'+type]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);}};
const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const changes=[];let tour=createTutorial({document,storage,onVisibilityChange:x=>changes.push(x)});
const el=id=>document.getElementById(id);
assert.match(TUTORIAL_STEPS.find(s=>s.title==='Play together').text,/requests waves/i);assert.match(TUTORIAL_STEPS.find(s=>s.title==='Play together').text,/disconnects/i);assert.match(TUTORIAL_STEPS.find(s=>s.practice==='skills').text,/skill card/i);assert.doesNotMatch(TUTORIAL_STEPS.find(s=>s.practice==='skills').text,/drag|zoom|node/i);assert.equal(TUTORIAL_STEPS.find(s=>s.practice==='skills')!==undefined,true);
// Every practice step drives a real dialog, and step 3 of the first-run work is that
// there are no stand-in panels left.
assert.deepEqual(TUTORIAL_STEPS.filter(step=>step.practice).map(step=>step.dialogs),
 [['skills'],['armory'],['armoryWorkshop'],['armoryPrestige']],'every practice step names a real dialog');
// The last two steps open the REAL armory (workshop, prestige) in sandbox mode.
const workshopStep=TUTORIAL_STEPS.find(s=>s.practice==='workshop'),prestigeStep=TUTORIAL_STEPS.find(s=>s.practice==='prestige');
assert.ok(workshopStep&&prestigeStep,'the armory practice steps exist');
assert.deepEqual(workshopStep.dialogs,['armoryWorkshop']);
assert.match(workshopStep.text,/craft/i);assert.match(workshopStep.text,/saved/i);
assert.match(prestigeStep.text,/prestige/i);assert.match(prestigeStep.text,/campaign/i);
tour.startIfNeeded('first');assert.equal(tour.isOpen(),true);assert.equal(el('tutorialTitle').textContent,TUTORIAL_STEPS[0].title);assert.equal(el('tutorialBack').disabled,true);
el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,TUTORIAL_STEPS[1].title);el('tutorialBack').onclick();assert.equal(el('tutorialTitle').textContent,TUTORIAL_STEPS[0].title);
tour.stop();assert.equal(tour.isOpen(),false);tour.startIfNeeded('first');assert.equal(tour.isOpen(),true,'interrupted tutorial should reopen');
for(let i=0;i<TUTORIAL_STEPS.length-2;i++)el('tutorialNext').onclick();
// Skills practice: no mock panel, the step points at the real dialog and waits for
// the result the account reports once the build is saved.
assert.equal(tour.currentStep().practice,'skills');
assert.deepEqual(tour.currentStep().dialogs,['skills'],'the skills step opens the real Skills dialog');
assert.equal(el('tutorialNext').disabled,true);
el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Practice the Skills menu','cannot accidentally skip the exercise');
tour.practiceResult('skills',{upgraded:true});
assert.equal(el('tutorialNext').disabled,true,'a point alone is not a saved build');
tour.practiceResult('skills',{saved:true});
assert.equal(el('tutorialNext').disabled,false);
el('tutorialNext').onclick();
// Armory practice: same contract, the real armory.
assert.equal(tour.currentStep().practice,'armory');
assert.deepEqual(tour.currentStep().dialogs,['armory']);
assert.equal(el('tutorialNext').disabled,true);
tour.practiceResult('armory',{equipped:true});
assert.equal(el('tutorialNext').disabled,true,'equipping alone does not finish the armory step');
tour.practiceResult('armory',{upgraded:true});
assert.equal(el('tutorialNext').disabled,false);
el('tutorialBack').onclick();assert.equal(el('tutorialNext').disabled,false,'completed practice survives going back');
el('tutorialNext').onclick();assert.equal(el('tutorialNext').disabled,false);
// The last two steps drive the real dialogs, so they report their result instead
// of using the mock screens: complete both, then finish the tour.
for(let guard=0;guard<8&&tour.isOpen();guard++){
 const practice=tour.currentStep()?.practice;
 if(practice==='workshop')tour.practiceResult('workshop',{crafted:true,equipped:true});
 if(practice==='prestige')tour.practiceResult('prestige',{});
 if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();
 el('tutorialNext').onclick();
}
assert.equal(tour.isOpen(),false,'the tour finishes');
assert.deepEqual([...saved.keys()],['ironpath:tutorial:v2:first'],'training never saves skill or armory data');
tour.startIfNeeded('first');assert.equal(tour.isOpen(),false,'completed tutorial should not reopen');
tour.startIfNeeded('second');assert.equal(tour.isOpen(),true,'different account should see tutorial');el('tutorialSkip').onclick();assert.equal(tour.isOpen(),false);
tour.replay('first');for(let i=0;i<TUTORIAL_STEPS.findIndex(s=>s.practice==='skills');i++)el('tutorialNext').onclick();assert.equal(el('tutorialNext').disabled,true,'replay resets the practice: the real dialog result is needed again');assert.deepEqual(tour.currentStep().dialogs,['skills']);// Walk the remaining steps, skipping each practice gate, and prove the tour ends.
for(let guard=0;guard<20&&tour.isOpen();guard++){if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();el('tutorialNext').onclick();}
assert.equal(tour.isOpen(),false,'a skipped walk still finishes the tour');
tour.startIfNeeded('outside');const dialog=el('tutorialDialog'),outside={target:dialog,button:0,clientX:-1,clientY:-1,preventDefault(){}};dialog.onpointerdown(outside);dialog.onclick(outside);assert.equal(tour.isOpen(),false);tour.startIfNeeded('outside');assert.equal(tour.isOpen(),true,'outside dismissal does not mark tutorial complete');tour.stop();
tour.replay('first');el('tutorialDialog').oncancel({preventDefault(){}});assert.equal(tour.isOpen(),false);assert.ok(changes.includes(true)&&changes.includes(false));
const bad=createTutorial({document,storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),true);el('tutorialSkip').onclick();bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),false);
console.log('Interactive tutorial, safe practice and completion tests passed.');
const {setupLanguage}=await import('../language.mjs?v=20261118-settings1');
const selector={value:'',addEventListener(_type,fn){this.change=fn;}},languageDoc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:{},querySelectorAll:()=>[]};setupLanguage({document:languageDoc,storage:{getItem:()=> 'de',setItem(){}}});
tour=createTutorial({document,storage,onVisibilityChange:x=>changes.push(x)});tour.replay('first');assert.equal(el('tutorialTitle').textContent,'Willkommen, Soldat');assert.equal(el('tutorialStep').textContent,`FELDEINWEISUNG · 1 / ${TUTORIAL_STEPS.length}`,'the step count follows the real tour');// Jump straight to the Skills practice step, which the German run exercises.
for(let i=0;i<TUTORIAL_STEPS.findIndex(step=>step.practice==='skills');i++)el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Übe das Fähigkeitenmenü');assert.equal(el('tutorialNext').disabled,true);
 assert.equal(
  JSON.stringify(tour.currentStep().dialogs),
  JSON.stringify(['skills']),
  'German run also opens the real dialog'
 );tour.practiceResult('skills',{upgraded:true,saved:true});assert.equal(el('tutorialNext').disabled,false);el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Übe die Waffenkammer');assert.deepEqual(tour.currentStep().dialogs,['armory'],'German run opens the real armory too');tour.practiceResult('armory',{equipped:true,upgraded:true});assert.equal(el('tutorialNext').disabled,false);
// The tour now ends with the two real-dialog steps; finish them to reach the end.
for(let guard=0;guard<10&&tour.isOpen();guard++){
 const practice=tour.currentStep()?.practice;
 if(practice==='skills')tour.practiceResult('skills',{upgraded:true,saved:true});
 if(practice==='armory')tour.practiceResult('armory',{equipped:true,upgraded:true});
 if(practice==='workshop')tour.practiceResult('workshop',{crafted:true,equipped:true});
 if(practice==='prestige')tour.practiceResult('prestige',{});
 if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();
 el('tutorialNext').onclick();
}
assert.equal(tour.isOpen(),false);assert.deepEqual([...saved.keys()],['ironpath:tutorial:v2:first','ironpath:tutorial:v2:second']);
selector.value='en';selector.change();
// Practice steps must open a real dialog, and only once the briefing is visible:
// a second `createTutorial` rebinds the shared DOM handlers, so this goes last.
const opened=[];const probe=createTutorial({document,storage,onPractice:r=>opened.push(r)});
probe.startIfNeeded('probe');assert.equal(probe.isOpen(),true);
for(let i=0;i<TUTORIAL_STEPS.findIndex(step=>step.practice==='skills');i++)el('tutorialNext').onclick();
assert.deepEqual(opened,['skills'],'the skills step opens the real Skills dialog as it becomes current');
el('tutorialNext').onclick();assert.deepEqual(opened,['skills'],'an unskipped practice step does not re-open anything');

// Regression: the new briefing reused the old tour's completion key
// (`ironpath:tutorial:v1:<id>`), so every account that had finished the 8-step
// tour looked "already briefed" for ever. There was no way out of it either: the
// replay button lives inside Help, not on the Command Center menu.
test('an account that finished the old briefing is offered the new one',()=>{
 const store=new Map([['ironpath:tutorial:v1:old-account','done']]);
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const tour=createTutorial({document,storage});
 tour.startIfNeeded('old-account');
 assert.equal(tour.isOpen(),true,'the old marker must not hide the new briefing');
 assert.equal(tour.currentStep().title,TUTORIAL_STEPS[0].title);
 // Skipping it is remembered, so a returning player is asked once, not every time.
 el('tutorialSkip').onclick();
 tour.stop();
 const reopened=createTutorial({document,storage});
 reopened.startIfNeeded('old-account');
 assert.equal(reopened.isOpen(),false,'a skipped edition stays skipped');
 assert.equal(store.get('ironpath:tutorial:v2:old-account'),'done');
 // And the edition is in the key, so the next bump can reach them again.
 assert.equal(store.has('ironpath:tutorial:v1:old-account'),true,'the old marker is left alone');
});

test('only tutorial.mjs spells out the briefing marker',()=>{
 // The bug was a second copy of the key that did not move when the tour changed,
 // so the invariant worth pinning is that there is no second copy at all.
 assert.match(readFileSync(new URL('../tutorial.mjs',import.meta.url),'utf8'),/const TUTORIAL_EDITION=\d+;/);
 for(const name of ['account.js','game.js','first-run-ending.mjs','training-run.mjs','command-center.mjs']){
  const source=readFileSync(new URL('../'+name,import.meta.url),'utf8');
  assert.ok(!/ironpath:tutorial:v/.test(source),`${name} must not hard-code the briefing key`);
 }
});

test('a replay walked to the end hands over the training contract, a skipped one does not',()=>{
 const store=new Map();
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const handed=[];
 const tour=createTutorial({document,storage,onFinish:id=>handed.push(id)});
 tour.replay('old-account');
 for(let i=0;i<TUTORIAL_STEPS.length;i++){
  const practice=tour.currentStep().practice;
  if(practice)tour.practiceResult(practice,{upgraded:true,saved:true,equipped:true,crafted:true});
  el('tutorialNext').onclick();
 }
 assert.deepEqual(handed,['old-account'],'finishing the replay reaches the contract code path');
 handed.length=0;
 tour.replay('old-account');
 el('tutorialSkip').onclick();
 assert.deepEqual(handed,[],'skipping a replay must not start a battle');
 // game.js owns the "already offered" half of the rule.
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(game,/onFinish:id=>\{if\(trainingSeen\(id,tutorialStorage\)\)return;markTrainingSeen/);
});

test('every import of a module agrees on that module cache token',()=>{
 // A stale `?v=` means browsers keep running the old copy of one module. That is how
 // the briefing fix nearly shipped while game.js still asked for the old tour: the
 // token had been bumped everywhere but in the one import that loads the tour.
 const files=readdirSync(new URL('..',import.meta.url)).filter(f=>/\.(mjs|js|html)$/.test(f));
 const tokens=new Map();
 for(const file of files){
  const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const [,target,token] of source.matchAll(/['"`]\.\/([\w./-]+\.mjs)\?v=([a-z0-9-]+)/g)){
   if(!tokens.has(target))tokens.set(target,new Map());
   const seen=tokens.get(target);
   if(!seen.has(token))seen.set(token,[]);
   seen.get(token).push(file);
  }
 }
 const split=[...tokens].filter(([,seen])=>seen.size>1);
 assert.deepEqual(split.map(([target,seen])=>`${target}: ${[...seen.keys()].join(' vs ')} (${[...seen.values()].flat().join(', ')})`),[],
  'importers of one module must share its cache token');
 assert.ok(tokens.get('tutorial.mjs')?.size===1,'the tour is imported through a token');
});

import { strict as assert } from 'node:assert';
import { createTutorial, TUTORIAL_STEPS } from '../tutorial.mjs';
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
assert.deepEqual([...saved.keys()],['ironpath:tutorial:v1:first'],'training never saves skill or armory data');
tour.startIfNeeded('first');assert.equal(tour.isOpen(),false,'completed tutorial should not reopen');
tour.startIfNeeded('second');assert.equal(tour.isOpen(),true,'different account should see tutorial');el('tutorialSkip').onclick();assert.equal(tour.isOpen(),false);
tour.replay('first');for(let i=0;i<TUTORIAL_STEPS.findIndex(s=>s.practice==='skills');i++)el('tutorialNext').onclick();assert.equal(el('tutorialNext').disabled,true,'replay resets the practice: the real dialog result is needed again');assert.deepEqual(tour.currentStep().dialogs,['skills']);// Walk the remaining steps, skipping each practice gate, and prove the tour ends.
for(let guard=0;guard<20&&tour.isOpen();guard++){if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();el('tutorialNext').onclick();}
assert.equal(tour.isOpen(),false,'a skipped walk still finishes the tour');
tour.startIfNeeded('outside');const dialog=el('tutorialDialog'),outside={target:dialog,button:0,clientX:-1,clientY:-1,preventDefault(){}};dialog.onpointerdown(outside);dialog.onclick(outside);assert.equal(tour.isOpen(),false);tour.startIfNeeded('outside');assert.equal(tour.isOpen(),true,'outside dismissal does not mark tutorial complete');tour.stop();
tour.replay('first');el('tutorialDialog').oncancel({preventDefault(){}});assert.equal(tour.isOpen(),false);assert.ok(changes.includes(true)&&changes.includes(false));
const bad=createTutorial({document,storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),true);el('tutorialSkip').onclick();bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),false);
console.log('Interactive tutorial, safe practice and completion tests passed.');
const {setupLanguage}=await import('../language.mjs?v=20261112-firstrun3');
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
assert.equal(tour.isOpen(),false);assert.deepEqual([...saved.keys()],['ironpath:tutorial:v1:first','ironpath:tutorial:v1:second']);
selector.value='en';selector.change();
// Practice steps must open a real dialog, and only once the briefing is visible:
// a second `createTutorial` rebinds the shared DOM handlers, so this goes last.
const opened=[];const probe=createTutorial({document,storage,onPractice:r=>opened.push(r)});
probe.startIfNeeded('probe');assert.equal(probe.isOpen(),true);
for(let i=0;i<TUTORIAL_STEPS.findIndex(step=>step.practice==='skills');i++)el('tutorialNext').onclick();
assert.deepEqual(opened,['skills'],'the skills step opens the real Skills dialog as it becomes current');
el('tutorialNext').onclick();assert.deepEqual(opened,['skills'],'an unskipped practice step does not re-open anything');

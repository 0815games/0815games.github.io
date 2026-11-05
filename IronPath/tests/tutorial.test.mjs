import { strict as assert } from 'node:assert';
import { createTutorial, TUTORIAL_STEPS } from '../tutorial.mjs';
const nodes=new Map();
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{open:false,dataset:{},attrs:{},setAttribute(key,value){this.attrs[key]=value;},addEventListener(type,fn){this['on'+type]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);}};
const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const changes=[];const tour=createTutorial({document,storage,onVisibilityChange:x=>changes.push(x)});
const el=id=>document.getElementById(id);
assert.match(TUTORIAL_STEPS.find(s=>s.title==='Play together').text,/requests waves/i);assert.match(TUTORIAL_STEPS.find(s=>s.title==='Play together').text,/disconnects/i);assert.match(TUTORIAL_STEPS.find(s=>s.practice==='skills').text,/skill card/i);assert.doesNotMatch(TUTORIAL_STEPS.find(s=>s.practice==='skills').text,/drag|zoom|node/i);assert.equal(TUTORIAL_STEPS.find(s=>s.practice==='skills')!==undefined,true);
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
assert.equal(el('tutorialSkillsPractice').hidden,false);assert.equal(el('tutorialNext').disabled,true);el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Practice the Skills menu','cannot accidentally skip the exercise');
el('tutorialSkillUpgrade').onclick();assert.match(el('tutorialSkillPoints').textContent,/1 POINT/,'cannot upgrade before inspecting');
el('tutorialSkillNode').onclick();assert.equal(el('tutorialSkillUpgrade').disabled,false);el('tutorialSkillUpgrade').onclick();assert.match(el('tutorialSkillPoints').textContent,/0 POINT/);assert.equal(el('tutorialNext').disabled,true);el('tutorialSkillSave').onclick();assert.equal(el('tutorialNext').disabled,false);
el('tutorialNext').onclick();assert.equal(el('tutorialArmoryPractice').hidden,false);assert.equal(el('tutorialNext').disabled,true);el('tutorialEquip').onclick();assert.equal(el('tutorialNext').disabled,true);el('tutorialBunkerUpgrade').onclick();assert.equal(el('tutorialBunkerConfirmArea').hidden,true,'cannot upgrade in Equipment');el('tutorialServiceTab').onclick();assert.equal(el('tutorialServicePanel').hidden,false);el('tutorialBunkerTab').onclick();assert.equal(el('tutorialBunkerPanel').hidden,false);el('tutorialBunkerUpgrade').onclick();assert.equal(el('tutorialBunkerConfirmArea').hidden,false);el('tutorialBunkerCancel').onclick();assert.equal(el('tutorialBunkerConfirmArea').hidden,true);el('tutorialBunkerUpgrade').onclick();el('tutorialBunkerConfirm').onclick();assert.equal(el('tutorialNext').disabled,false);assert.match(el('tutorialScrap').textContent,/30 SCRAP/);
el('tutorialBack').onclick();assert.equal(el('tutorialNext').disabled,false,'completed practice survives going back');
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
tour.replay('first');for(let i=0;i<TUTORIAL_STEPS.findIndex(s=>s.practice==='skills');i++)el('tutorialNext').onclick();assert.match(el('tutorialSkillPoints').textContent,/1 POINT/,'replay resets the practice');// Walk the remaining steps, skipping each practice gate, and prove the tour ends.
for(let guard=0;guard<20&&tour.isOpen();guard++){if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();el('tutorialNext').onclick();}
assert.equal(tour.isOpen(),false,'a skipped walk still finishes the tour');
tour.startIfNeeded('outside');const dialog=el('tutorialDialog'),outside={target:dialog,button:0,clientX:-1,clientY:-1,preventDefault(){}};dialog.onpointerdown(outside);dialog.onclick(outside);assert.equal(tour.isOpen(),false);tour.startIfNeeded('outside');assert.equal(tour.isOpen(),true,'outside dismissal does not mark tutorial complete');tour.stop();
tour.replay('first');el('tutorialDialog').oncancel({preventDefault(){}});assert.equal(tour.isOpen(),false);assert.ok(changes.includes(true)&&changes.includes(false));
const bad=createTutorial({document,storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),true);el('tutorialSkip').onclick();bad.startIfNeeded('storage-blocked');assert.equal(bad.isOpen(),false);
console.log('Interactive tutorial, safe practice and completion tests passed.');
const {setupLanguage}=await import('../language.mjs?v=20261112-prestige1');
const selector={value:'',addEventListener(_type,fn){this.change=fn;}},languageDoc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:{},querySelectorAll:()=>[]};setupLanguage({document:languageDoc,storage:{getItem:()=> 'de',setItem(){}}});
tour.replay('first');assert.equal(el('tutorialTitle').textContent,'Willkommen, Soldat');assert.equal(el('tutorialStep').textContent,`FELDEINWEISUNG · 1 / ${TUTORIAL_STEPS.length}`,'the step count follows the real tour');// Jump straight to the Skills practice step, which the German run exercises.
for(let i=0;i<TUTORIAL_STEPS.findIndex(step=>step.practice==='skills');i++)el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Übe das Fähigkeitenmenü');assert.equal(el('tutorialNext').disabled,true);el('tutorialSkillNode').onclick();el('tutorialSkillUpgrade').onclick();el('tutorialSkillSave').onclick();assert.equal(el('tutorialNext').disabled,false);el('tutorialNext').onclick();assert.equal(el('tutorialTitle').textContent,'Übe die Waffenkammer');el('tutorialEquip').onclick();el('tutorialBunkerTab').onclick();el('tutorialBunkerUpgrade').onclick();el('tutorialBunkerConfirm').onclick();assert.equal(el('tutorialScrap').textContent,'30 SCHROTT');
// The tour now ends with the two real-dialog steps; finish them to reach the end.
for(let guard=0;guard<10&&tour.isOpen();guard++){
 const practice=tour.currentStep()?.practice;
 if(practice==='workshop')tour.practiceResult('workshop',{crafted:true,equipped:true});
 if(practice==='prestige')tour.practiceResult('prestige',{});
 if(el('tutorialNext').disabled)el('tutorialPracticeSkip').onclick();
 el('tutorialNext').onclick();
}
assert.equal(tour.isOpen(),false);assert.deepEqual([...saved.keys()],['ironpath:tutorial:v1:first','ironpath:tutorial:v1:second']);
selector.value='en';selector.change();

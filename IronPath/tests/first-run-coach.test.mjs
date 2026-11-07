import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {COACH_STEPS,createCoach,coachSeen,markCoachSeen} from '../first-run-coach.mjs';

// A DOM small enough to be honest: only the elements the coach touches.
function makeDocument(){
 const nodes=new Map();
 const make=id=>({id,hidden:false,textContent:'',disabled:false,attrs:{},dataset:{},handlers:{},
  addEventListener(type,fn){this.handlers[type]=fn;},
  setAttribute(name,value){this.attrs[name]=value;},
  getAttribute(name){return this.attrs[name]??null;}});
 for(const id of ['firstRunCoach','coachStep','coachTitle','coachText','coachCaption','coachAsk','coachNext','coachClose'])nodes.set(id,make(id));
 return {getElementById:id=>nodes.get(id)??null,nodes};
}
// The card proves a step by reading the field. This is a field the test can move:
// towers stand or are sold, the soldier stands where he stands.
function makeField(){
 const field={towers:[],x:100,y:130,wave:1,running:false};
 return {field,observe:()=>({towers:field.towers,localId:'local',players:{local:{x:field.x,y:field.y}},wave:field.wave,running:field.running,x:field.x,y:field.y}),
  build(id=7,level=1){field.towers.push({id,pad:0,type:0,level});return id;},
  upgrade(id=7){const t=field.towers.find(t=>t.id===id);if(t)t.level++;},
  sell(id=7){field.towers=field.towers.filter(t=>t.id!==id);},
  walkTo(x){field.x=x;}};
}
const store=()=>{const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};

test('the coach is a hint over a live field, never a modal step list',()=>{
 assert.ok(COACH_STEPS.length>=5,'five or more cards');
 assert.ok(COACH_STEPS.length<11,'fewer cards than the old screenshot tour');
 // Every card but the welcome is driven by something the player really does.
 const driven=COACH_STEPS.filter(step=>step.when).map(step=>step.when);
 assert.deepEqual(driven,['build','upgrade','move','deploy','boss'],'one card per real action');
 assert.equal(COACH_STEPS[0].when,null,'the welcome waits for the player');
 for(const step of COACH_STEPS){
  assert.ok(step.title&&step.text&&step.caption,`${step.id} has copy`);
  assert.ok(step.text.length<220,`${step.id} is one short sentence, not a paragraph`);
 }
});

test('the card opens on the welcome and moves on what the player does',()=>{
 const document=makeDocument(),storage=store(),changes=[],field=makeField();
 const coach=createCoach({document,storage,observe:field.observe,onVisibilityChange:open=>changes.push(open)});
 assert.equal(coach.start('soldier-a'),true);
 assert.equal(document.getElementById('firstRunCoach').hidden,false);
 assert.equal(document.getElementById('coachTitle').textContent,'Welcome, soldier');
 assert.equal(coach.step().id,'welcome');
 // An unrelated event changes nothing.
 assert.equal(coach.event('sell'),false);
 // The welcome is not dismissed by playing: it is the one card the player reads.
 assert.equal(coach.event('deploy'),false);
 assert.equal(coach.step().id,'welcome');
 const next=()=>document.getElementById('coachNext').onclick();
 next();assert.equal(coach.step().id,'build');

 // Building is not evidence: the field has to show a tower. A successful callback
 // with nothing on the field changes nothing at all.
 coach.event('build');
 assert.equal(coach.step().id,'build','a claimed build without a tower proves nothing');
 assert.equal(document.getElementById('coachNext').disabled,true,'NEXT is closed');

 const id=field.build();
 coach.event('build',{builtTowerId:id});
 assert.equal(coach.step().id,'upgrade');

 // Upgrading is about *that* tower: a level that did not move is not evidence.
 coach.event('upgrade',{builtTowerId:id});
 assert.equal(coach.step().id,'upgrade','the tower is still level 1');
 field.upgrade(id);
 coach.event('upgrade',{builtTowerId:id});
 assert.equal(coach.step().id,'hero');

 // Moving means the soldier really left: the command alone is not enough.
 coach.event('move',{moveFrom:{x:field.field.x,y:field.field.y}});
 assert.equal(coach.step().id,'hero','standing still is not moving');
 field.walkTo(400);
 coach.tick();
 assert.equal(coach.step().id,'money');

 // Two cards are read rather than earned: the greeting and the explanation of what
 // supplies are. They advance on their own button, or they would block the run.
 next();assert.equal(coach.step().id,'deploy');
 coach.event('deploy');assert.equal(coach.step().id,'boss');
 assert.deepEqual(changes,[true],'one open, and no pause events anywhere');
});

test('every card that asks for something refuses NEXT until the field agrees',()=>{
 const document=makeDocument(),storage=store(),field=makeField();
 const coach=createCoach({document,storage,observe:field.observe});
 coach.start('soldier-a');
 const button=()=>document.getElementById('coachNext');
 const ask=()=>document.getElementById('coachAsk');
 assert.equal(button().disabled,false,'the welcome asks for nothing');
 assert.equal(ask().hidden,true,'and says nothing');
 button().onclick();
 // The gate: the button exists, looks closed and does nothing while the step is open.
 assert.equal(coach.step().id,'build');
 assert.equal(button().disabled,true);
 assert.equal(button().getAttribute('aria-disabled'),'true');
 assert.equal(ask().hidden,false);
 assert.equal(ask().textContent,'Build one tower to continue','the card says what is missing');
 assert.match(document.getElementById('firstRunCoach').dataset.awaiting,/build/);
 button().onclick();
 assert.equal(coach.step().id,'build','a click on a closed gate must not skip the step');

 const id=field.build();
 coach.event('build',{builtTowerId:id});
 assert.equal(button().disabled,true,'the upgrade step is gated too');
 assert.equal(ask().textContent,'Upgrade that tower to continue');

 // Selling the tower puts the requirement back: the gate follows the field in both
 // directions, so a player cannot earn the step and then undo it.
 field.sell(id);
 coach.event('upgrade',{builtTowerId:id});
 assert.equal(coach.step().id,'upgrade','a tower that is gone cannot be upgraded');
 assert.equal(button().disabled,true,'and the gate is closed again');
});

test('a tower that already stands when the card comes up opens the gate by itself',()=>{
 // No event at all: the state is enough. That is what makes the card survive a
 // reload, or a player who built during the welcome.
 const document=makeDocument(),storage=store(),field=makeField();
 const id=field.build();
 field.upgrade(id);
 const coach=createCoach({document,storage,observe:field.observe});
 coach.start('soldier-b');
 document.getElementById('coachNext').onclick();
 assert.equal(coach.step().id,'build');
 coach.tick();
 assert.equal(coach.step().id,'upgrade','the standing tower counts');
 coach.tick();
 assert.equal(coach.step().id,'upgrade','but it is not a level 2 tower');
});

test('the boss card can jump the queue, and finishing is remembered once',()=>{
 const document=makeDocument(),storage=store();
 let done=null;
 const coach=createCoach({document,storage,onDone:id=>{done=id;}});
 coach.start('soldier-a');
 coach.boss();
 assert.equal(coach.step().id,'boss','a boss arriving jumps to the card that matters');
 coach.event('boss');
 assert.equal(document.getElementById('firstRunCoach').hidden,true);
 assert.equal(done,'soldier-a','finishing hands over to the ending');
 assert.equal(coachSeen('soldier-a',storage),true);
 assert.equal(coach.start('soldier-a'),false,'never twice for the same soldier');
 assert.equal(coach.start('soldier-b'),true,'a different soldier gets their own');
});

test('closing the card ends the coaching without pretending it was finished',()=>{
 const document=makeDocument(),storage=store();
 let done=0;
 const coach=createCoach({document,storage,onDone:()=>done++});
 coach.start('soldier-c');
 document.getElementById('coachClose').onclick();
 assert.equal(document.getElementById('firstRunCoach').hidden,true);
 assert.equal(coach.isOpen(),false);
 assert.equal(coachSeen('soldier-c',storage),true,'a skipped hint is not repeated');
 assert.equal(done,0,'the ending is a separate step, not this card');
});

test('the coach never pauses the field and is not a modal dialog',()=>{
 // Comments explain the old modal design, so strip them before looking for code.
 const coach=readFileSync(new URL('../first-run-coach.mjs',import.meta.url),'utf8').replace(/^\s*\/\/.*$/gm,'');
 assert.equal(/showModal|createElement\(['"]dialog/.test(coach),false,'a modal would swallow every tap on the field');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id="firstRunCoach"[^>]*role="dialog"/);
 assert.match(html,/id="firstRunCoach"[^>]*aria-modal="false"/);
 // The one thing that made the first run unplayable on a phone.
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 const pauseLines=game.split('\n').filter(line=>/accumulator=0;return;|const paused=/.test(line));
 assert.ok(pauseLines.length>=2,'the pause conditions still exist');
 for(const line of pauseLines){
  assert.equal(/coach\.isOpen\(\)/.test(line),false,'the coach must never be part of a pause condition');
 }
});

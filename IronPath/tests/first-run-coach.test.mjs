import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {COACH_STEPS,createCoach,coachSeen,markCoachSeen} from '../first-run-coach.mjs';

// A DOM small enough to be honest: only the elements the coach touches.
function makeDocument(){
 const nodes=new Map();
 const make=id=>({id,hidden:false,textContent:'',dataset:{},handlers:{},
  addEventListener(type,fn){this.handlers[type]=fn;}});
 for(const id of ['firstRunCoach','coachStep','coachTitle','coachText','coachCaption','coachNext','coachClose'])nodes.set(id,make(id));
 return {getElementById:id=>nodes.get(id)??null,nodes};
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
 const document=makeDocument(),storage=store(),changes=[];
 const coach=createCoach({document,storage,onVisibilityChange:open=>changes.push(open)});
 assert.equal(coach.start('soldier-a'),true);
 assert.equal(document.getElementById('firstRunCoach').hidden,false);
 assert.equal(document.getElementById('coachTitle').textContent,'Welcome, soldier');
 assert.equal(coach.step().id,'welcome');
 // An unrelated event changes nothing.
 assert.equal(coach.event('sell'),false);
 // The welcome is not dismissed by playing: it is the one card the player reads.
 assert.equal(coach.event('deploy'),false);
 assert.equal(coach.step().id,'welcome');
 document.getElementById('coachNext').onclick();
 assert.equal(coach.step().id,'build');
 coach.event('build');assert.equal(coach.step().id,'upgrade');
 coach.event('upgrade');assert.equal(coach.step().id,'hero');
 coach.event('move');assert.equal(coach.step().id,'deploy');
 coach.event('deploy');assert.equal(coach.step().id,'boss');
 assert.deepEqual(changes,[true],'one open, and no pause events anywhere');
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

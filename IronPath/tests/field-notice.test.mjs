import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createFieldNotice} from '../ui/field-notice.mjs';

// The one message the field still shows.
//
// Ordinary traffic is spoken and not painted: it goes to the screen-reader live
// region and nowhere else, because a player in a firefight does not read a
// ticker. What is left IS worth interrupting for - the player asked for
// something and did not get it, or the field turned against them - and it
// flutters in under the status bar, takes its turn and steps aside.

// A document stub that carries only the nodes the notice touches. Anything the
// notice reaches for that is not here will come back null and be skipped -
// which is also how a missing element must behave: the field still plays.
function stubDocument(){
  const nodes=new Map();
  for(const id of ['fieldNotice','fieldNoticeText','fieldNoticeMore'])
    nodes.set(id,{id,textContent:'',hidden:false,dataset:{}});
  return {
    getElementById:id=>nodes.get(id)??null,
    node:id=>nodes.get(id),
    // The notice must not invent nodes: a missing box is a field without a
    // message, not a reason to break.
    remove(id){nodes.delete(id);}
  };
}
const alert=(document,options={})=>createFieldNotice(document,{translate:(text,vars={})=>Object.entries(vars).reduce((out,[key,value])=>out.replace(`{${key}}`,value),text),...options});
// A clock the test holds: with no button, the clock is the only thing that
// moves the queue on, so it has to be checkable rather than waited for.
function clock(){
  const jobs=new Map();let serial=0;
  return {
    set:fn=>{const id=++serial;jobs.set(id,fn);return id;},
    clear:id=>{jobs.delete(id);},
    tick(){for(const [id,fn] of [...jobs])if(jobs.delete(id))fn();},
    pending:()=>jobs.size
  };
}

test('a warning takes the notice, holds it for its turn, then steps aside',()=>{
  const doc=stubDocument(),time=clock();
  const a=alert(doc,{setTimer:time.set,clearTimer:time.clear,showMs:8000});
  assert.equal(doc.node('fieldNotice').hidden,true,'the notice is quiet while nothing is wrong');

  a.warn('Not enough supplies to upgrade.');
  assert.equal(doc.node('fieldNotice').hidden,false,'the warning raises the notice');
  assert.equal(doc.node('fieldNoticeText').textContent,'Not enough supplies to upgrade.');
  assert.equal(doc.node('fieldNoticeMore').hidden,true,'with nothing waiting behind it');
  assert.equal(time.pending(),1,'and the clock is set: nothing else can end its turn');

  time.tick();
  assert.equal(doc.node('fieldNotice').hidden,true,'its turn is over and the notice goes');
  assert.equal(time.pending(),0,'with nothing left to show');
  assert.equal(a.dismiss(),false,'nothing left to dismiss');
});

test('there is no dismiss button: the notice takes no taps at all',()=>{
  // A button floating over the battlefield is a wall however small it is. The
  // notice is a caption over the field, and taps go through it to the ground.
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const card=html.slice(html.indexOf('id="fieldNotice"'),html.indexOf('<section id="runPerkPanel"'));
  assert.ok(card&&card.includes('id="fieldNoticeMore"'),'the notice markup exists');
  assert.doesNotMatch(card,/<button/,'no button on the notice');
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  const rule=/#gameView \.field-notice\{([^}]*)\}/.exec(css)?.[1]||'';
  assert.match(rule,/pointer-events:none/,'the notice lets taps through to the field');
  // It flutters in from above and stands under the status row, which the game
  // measures - not in a corner, and not in the middle of the fighting.
  assert.match(rule,/var\(--map-hud-bottom/, 'it hangs under the measured status row');
  assert.match(css,/@keyframes field-notice-flutter/,'and it flutters in');
  assert.match(css,/prefers-reduced-motion:reduce\)\{#gameView \.field-notice\{animation:none/,'but not for a player who asked for no motion');
  assert.doesNotMatch(css,/field-notice-dismiss/,'and there is no dismiss control left to style');
});

test('the newest warning is the one shown; the one it displaces waits behind it',()=>{
  const doc=stubDocument(),time=clock(),a=alert(doc,{setTimer:time.set,clearTimer:time.clear});
  a.warn('Bomber struck the bunker! −2.5 health.');
  a.warn('Not enough supplies to upgrade.');
  // Newest first: it describes the field as it is now. (The first version of
  // this read the queue oldest first and buried the newest message.)
  assert.equal(doc.node('fieldNoticeText').textContent,'Not enough supplies to upgrade.');
  assert.equal(doc.node('fieldNoticeMore').hidden,false,'and it says there is more');
  assert.equal(doc.node('fieldNoticeMore').textContent,'+1 more');
  // Dismissing walks back through the history, most recent first.
  a.dismiss();
  assert.equal(doc.node('fieldNoticeText').textContent,'Bomber struck the bunker! −2.5 health.',
    'the bunker hit is one tap away, not lost behind a refused upgrade');
  assert.equal(doc.node('fieldNoticeMore').hidden,true,'and then the history is empty');
  a.dismiss();
  assert.equal(doc.node('fieldNotice').hidden,true);
});

test('the history is short: the oldest warning goes when a fourth arrives',()=>{
  const doc=stubDocument(),a=alert(doc);
  a.warn('one');a.warn('two');a.warn('three');a.warn('four');a.warn('five');
  assert.equal(doc.node('fieldNoticeText').textContent,'five');
  assert.equal(a.waiting(),3,'three behind it, not four - an old warning describes a field that has changed');
  a.dismiss();assert.equal(doc.node('fieldNoticeText').textContent,'four');
  a.dismiss();assert.equal(doc.node('fieldNoticeText').textContent,'three');
  a.dismiss();assert.equal(doc.node('fieldNoticeText').textContent,'two','and "one" is gone, as the oldest');
  a.dismiss();assert.equal(doc.node('fieldNotice').hidden,true);
});

test('a finished run clears the warnings: they describe a field that no longer exists',()=>{
  const doc=stubDocument(),time=clock(),a=alert(doc,{setTimer:time.set,clearTimer:time.clear});
  a.warn('Bunker lost. The operation has failed.');a.warn('Thin ice broke! Tanks slow down and take more damage.');
  a.clear();
  assert.equal(a.alerting(),false);assert.equal(a.waiting(),0);
  assert.equal(doc.node('fieldNotice').hidden,true);
  assert.equal(time.pending(),0,'and no turn is left ticking - it would wake a card on a field that is gone');
});

test('a language change re-reads the warning instead of showing yesterday’s words',()=>{
  const doc=stubDocument();let language='en';
  const table={'Not enough supplies to upgrade.':{en:'Not enough supplies to upgrade.',de:'Nicht genug Vorräte zum Verbessern.'}};
  const a=createFieldNotice(doc,{translate:text=>table[text]?.[language]??text});
  a.warn('Not enough supplies to upgrade.');
  assert.equal(doc.node('fieldNoticeText').textContent,'Not enough supplies to upgrade.');
  language='de';a.refresh();
  assert.equal(doc.node('fieldNoticeText').textContent,'Nicht genug Vorräte zum Verbessern.','the warning is translated, not remembered');
  // A function is asked again on every render: a refusal names a number that
  // has since changed.
  let supplies=70;
  const docB=stubDocument();
  const b=createFieldNotice(docB,{translate:t=>t});
  b.warn(()=>`Not enough supplies. You need ${supplies}.`);
  assert.equal(docB.node('fieldNoticeText').textContent,'Not enough supplies. You need 70.');
  supplies=95;b.refresh();
  assert.equal(docB.node('fieldNoticeText').textContent,'Not enough supplies. You need 95.','and it is re-read, not remembered');
});

test('a field without the card is not a broken field',()=>{
  const doc=stubDocument();doc.remove('fieldNotice');doc.remove('fieldNoticeText');doc.remove('fieldNoticeMore');
  const a=alert(doc);
  a.warn('Bomber struck the bunker! −2.5 health.');
  assert.equal(a.alerting(),true,'the warning is still recorded');
  assert.equal(a.dismiss(),true,'and can still be dismissed');
  assert.throws(()=>createFieldNotice(null),/Invalid field notice/,'but a caller that hands over nothing is told');
  assert.throws(()=>createFieldNotice(stubDocument(),{maxWaiting:0}),/Invalid field notice queue/,'and so is a queue that cannot hold one');
});

// Which messages count as warnings is a contract, not a mood: the player asked
// for something and did not get it, or the field turned against them. Anything
// else is radio traffic and stays in the line. Pinning the list keeps a later
// edit from quietly promoting a warning back into chatter.
test('the game raises a warning for exactly these messages',()=>{
  const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  const warned=[...source.matchAll(/warn\(([\s\S]{0,120}?)\)(?=[;,])/g)].map(m=>m[1]);
  assert.ok(warned.length>=15,`a fair number of messages are warnings (${warned.length})`);
  // Something went wrong on the field.
  for(const part of ['reached the bunker','hit the bunker','Bomber struck the bunker','Rail guns struck the bunker',
    'Thin ice broke','Rubble cleared','Bunker lost. The operation has failed'])
    assert.ok(warned.some(entry=>entry.includes(part)),`a warning is raised when: ${part}`);
  // The player asked for something and did not get it.
  for(const part of ["result.reason",'Build spot could not be reserved','Not enough supplies to upgrade',
    'Build reservation expired','Choose an ability under SKILLS','Confirm or retry your story save',
    'That is your opponent'])
    assert.ok(warned.some(entry=>entry.includes(part)),`a warning is raised when: ${part}`);
  // Every refusal from the simulation: `notice(result.reason)` must be gone.
  assert.doesNotMatch(source,/notice\(result\.reason/,'no refusal is filed as ordinary radio traffic');
  // And the ordinary traffic stays ordinary: these are reports, not alarms.
  // (They are still spoken for a screen reader - they are just not painted.)
  for(const part of ['Hero moving to position','Wave started','Tower menu closed',
    'Supply cache found','New battlefield ready'])
    assert.ok(new RegExp(`notice\\([^)]{0,160}${part.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}`).test(source),
      `ordinary traffic stays in the line: ${part}`);
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createFieldAlert} from '../field-alert.mjs';

// The field radio's second voice.
//
// Ordinary radio traffic replaces the previous line and nobody has to answer
// it. A warning - the player asked for something and did not get it, or the
// field turned against them - must not be overwritten by the next "Hero moving
// to position.", because a message that was never read is not a message.

// A document stub that carries only the six nodes the alert touches. Anything
// the alert reaches for that is not here will come back null and be skipped -
// which is also how a missing element must behave: the field still plays.
function stubDocument(){
  const nodes=new Map();
  for(const id of ['radioAlert','radioAlertText','radioAlertMore','radioAlertDismiss','message'])
    nodes.set(id,{id,textContent:'',hidden:false,dataset:{}});
  return {
    getElementById:id=>nodes.get(id)??null,
    node:id=>nodes.get(id),
    // The alert must not invent nodes: a missing box is a field without a
    // radio, not a reason to break.
    remove(id){nodes.delete(id);}
  };
}
const alert=(document,options={})=>createFieldAlert(document,{translate:(text,vars={})=>Object.entries(vars).reduce((out,[key,value])=>out.replace(`{${key}}`,value),text),...options});
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

test('a warning takes the card, holds it for its turn, then steps aside',()=>{
  const doc=stubDocument(),time=clock();
  const a=alert(doc,{setTimer:time.set,clearTimer:time.clear,showMs:8000});
  assert.equal(doc.node('radioAlert').hidden,true,'the card is quiet while nothing is wrong');

  a.warn('Not enough supplies to upgrade.');
  assert.equal(doc.node('radioAlert').hidden,false,'the warning raises the card');
  assert.equal(doc.node('radioAlertText').textContent,'Not enough supplies to upgrade.');
  assert.equal(doc.node('radioAlertMore').hidden,true,'with nothing waiting behind it');
  assert.equal(time.pending(),1,'and the clock is set: nothing else can end its turn');

  time.tick();
  assert.equal(doc.node('radioAlert').hidden,true,'its turn is over and the card goes');
  assert.equal(time.pending(),0,'with nothing left to show');
  assert.equal(a.dismiss(),false,'nothing left to dismiss');
});

test('there is no dismiss button: the card takes no taps at all',()=>{
  // A button floating over the battlefield is a wall however small it is. The
  // card is a caption, like the radio below it, and taps go through it.
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const card=html.slice(html.indexOf('id="radioAlert"'),html.indexOf('id="radioLabel"'));
  assert.ok(card,'the card markup exists');
  assert.doesNotMatch(card,/<button/,'no button on the card');
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  const rule=/\.radio-alert\{([^}]*)\}/.exec(css)?.[1]||'';
  assert.match(rule,/pointer-events:none/,'the card lets taps through to the field');
  assert.doesNotMatch(css,/\.radio-alert-dismiss/,'and there is no dismiss control left to style');
});

test('the newest warning is on the card; the one it displaces waits behind it',()=>{
  const doc=stubDocument(),time=clock(),a=alert(doc,{setTimer:time.set,clearTimer:time.clear});
  a.warn('Bomber struck the bunker! −2.5 health.');
  a.warn('Not enough supplies to upgrade.');
  // Newest first: it describes the field as it is now. (The first version of
  // this read the queue oldest first and buried the newest message.)
  assert.equal(doc.node('radioAlertText').textContent,'Not enough supplies to upgrade.');
  assert.equal(doc.node('radioAlertMore').hidden,false,'and it says there is more');
  assert.equal(doc.node('radioAlertMore').textContent,'+1 more');
  // Dismissing walks back through the history, most recent first.
  a.dismiss();
  assert.equal(doc.node('radioAlertText').textContent,'Bomber struck the bunker! −2.5 health.',
    'the bunker hit is one tap away, not lost behind a refused upgrade');
  assert.equal(doc.node('radioAlertMore').hidden,true,'and then the history is empty');
  a.dismiss();
  assert.equal(doc.node('radioAlert').hidden,true);
});

test('the history is short: the oldest warning goes when a fourth arrives',()=>{
  const doc=stubDocument(),a=alert(doc);
  a.warn('one');a.warn('two');a.warn('three');a.warn('four');a.warn('five');
  assert.equal(doc.node('radioAlertText').textContent,'five');
  assert.equal(a.waiting(),3,'three behind it, not four - an old warning describes a field that has changed');
  a.dismiss();assert.equal(doc.node('radioAlertText').textContent,'four');
  a.dismiss();assert.equal(doc.node('radioAlertText').textContent,'three');
  a.dismiss();assert.equal(doc.node('radioAlertText').textContent,'two','and "one" is gone, as the oldest');
  a.dismiss();assert.equal(doc.node('radioAlert').hidden,true);
});

test('a finished run clears the warnings: they describe a field that no longer exists',()=>{
  const doc=stubDocument(),time=clock(),a=alert(doc,{setTimer:time.set,clearTimer:time.clear});
  a.warn('Bunker lost. The operation has failed.');a.warn('Thin ice broke! Tanks slow down and take more damage.');
  a.clear();
  assert.equal(a.alerting(),false);assert.equal(a.waiting(),0);
  assert.equal(doc.node('radioAlert').hidden,true);
  assert.equal(time.pending(),0,'and no turn is left ticking - it would wake a card on a field that is gone');
});

test('a language change re-reads the warning instead of showing yesterday’s words',()=>{
  const doc=stubDocument();let language='en';
  const table={'Not enough supplies to upgrade.':{en:'Not enough supplies to upgrade.',de:'Nicht genug Vorräte zum Verbessern.'}};
  const a=createFieldAlert(doc,{translate:text=>table[text]?.[language]??text});
  a.warn('Not enough supplies to upgrade.');
  assert.equal(doc.node('radioAlertText').textContent,'Not enough supplies to upgrade.');
  language='de';a.refresh();
  assert.equal(doc.node('radioAlertText').textContent,'Nicht genug Vorräte zum Verbessern.','the warning is translated, not remembered');
  // A function is asked again on every render: a refusal names a number that
  // has since changed.
  let supplies=70;
  const docB=stubDocument();
  const b=createFieldAlert(docB,{translate:t=>t});
  b.warn(()=>`Not enough supplies. You need ${supplies}.`);
  assert.equal(docB.node('radioAlertText').textContent,'Not enough supplies. You need 70.');
  supplies=95;b.refresh();
  assert.equal(docB.node('radioAlertText').textContent,'Not enough supplies. You need 95.','and it is re-read, not remembered');
});

test('a field without the card is not a broken field',()=>{
  const doc=stubDocument();doc.remove('radioAlert');doc.remove('radioAlertText');doc.remove('radioAlertMore');
  const a=alert(doc);
  a.warn('Bomber struck the bunker! −2.5 health.');
  assert.equal(a.alerting(),true,'the warning is still recorded');
  assert.equal(a.dismiss(),true,'and can still be dismissed');
  assert.throws(()=>createFieldAlert(null),/Invalid field alert/,'but a caller that hands over nothing is told');
  assert.throws(()=>createFieldAlert(stubDocument(),{maxWaiting:0}),/Invalid field alert queue/,'and so is a queue that cannot hold one');
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
    'Thin ice broke','Bunker lost. The operation has failed'])
    assert.ok(warned.some(entry=>entry.includes(part)),`a warning is raised when: ${part}`);
  // The player asked for something and did not get it.
  for(const part of ["result.reason",'Build spot could not be reserved','Not enough supplies to upgrade',
    'Build reservation expired','Choose an ability under SKILLS','Confirm or retry your story save',
    'That is your opponent'])
    assert.ok(warned.some(entry=>entry.includes(part)),`a warning is raised when: ${part}`);
  // Every refusal from the simulation: `notice(result.reason)` must be gone.
  assert.doesNotMatch(source,/notice\(result\.reason/,'no refusal is filed as ordinary radio traffic');
  // And the ordinary traffic stays ordinary: these are reports, not alarms.
  for(const part of ['Hero moving to position','Wave started','Tower menu closed','Rubble cleared',
    'Supply cache found','New battlefield ready'])
    assert.ok(new RegExp(`notice\\([^)]{0,160}${part.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}`).test(source),
      `ordinary traffic stays in the line: ${part}`);
});

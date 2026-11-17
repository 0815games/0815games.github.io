import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createFieldRadio} from '../field-radio.mjs';

// The field radio as a device: closed until asked, counting what it was told,
// and keeping the words even when nobody opened it.
//
// Two ways to get this wrong, and the tests are built against both: a radio that
// loses everything said while it was shut (the player opens it after a fight and
// finds nothing), and a radio that counts taps or clears its badge behind the
// player's back (the badge is a promise that there is something to read).

function stubDocument(){
  const nodes=new Map();
  for(const id of ['radioLog','radioLogList','radioUnread','radioToggle'])
    nodes.set(id,{id,textContent:'',hidden:false,children:[],dataset:{},attributes:{},
      setAttribute(name,value){this.attributes[name]=value;},
      getAttribute(name){return this.attributes[name]??null;},
      replaceChildren(...children){this.children=children;},
      append(child){this.children.push(child);}});
  const document={
    getElementById:id=>nodes.get(id)??null,
    createElement:()=>({className:'',textContent:''}),
    node:id=>nodes.get(id)
  };
  return document;
}
const radio=(document,options={})=>createFieldRadio(document,{translate:text=>text,...options});

test('it starts closed, and a message closes nothing: it counts instead',()=>{
  const doc=stubDocument(),r=radio(doc);
  assert.equal(r.isOpen(),false,'the radio starts shut');
  assert.equal(doc.node('radioLog').hidden,true,'and the log is not on the field');
  assert.equal(doc.node('radioToggle').getAttribute('aria-expanded'),'false','and the handset says it is shut');
  r.say('Hero moving to position.');
  assert.equal(doc.node('radioLog').hidden,true,'a message does not open the panel over the battle');
  assert.equal(r.unread(),1,'it counts instead');
  assert.equal(doc.node('radioUnread').hidden,false,'and the badge says so');
  assert.equal(doc.node('radioUnread').textContent,'1');
  r.say('Wave cleared! +20 supplies.');
  assert.equal(r.unread(),2);
  assert.equal(doc.node('radioUnread').textContent,'2');
});

test('nothing is lost while it is shut: the log holds what happened',()=>{
  const doc=stubDocument(),r=radio(doc);
  for(const line of ['one','two','three'])r.say(line);
  r.open();
  assert.equal(doc.node('radioLog').hidden,false,'opening shows the log');
  // Oldest first: reading down is reading the battle forwards.
  assert.deepEqual(doc.node('radioLogList').children.map(item=>item.textContent),['one','two','three']);
  assert.equal(r.unread(),0,'and the count is cleared by reading, not by arriving');
  assert.equal(doc.node('radioUnread').hidden,true,'so the badge goes away');
});

test('the log is short: the oldest line goes when a thirteenth arrives',()=>{
  const doc=stubDocument(),r=radio(doc);
  for(let index=1;index<=15;index++)r.say(`line ${index}`);
  r.open();
  const lines=doc.node('radioLogList').children.map(item=>item.textContent);
  assert.equal(lines.length,12,'a dozen lines, not an endless scroll over the field');
  assert.equal(lines.at(0),'line 4','the oldest three are gone');
  assert.equal(lines.at(-1),'line 15','and the newest is the last one, the one that just happened');
});

test('open, shut, open again: the handset toggles and the count resets once',()=>{
  const doc=stubDocument(),r=radio(doc);
  r.say('Bunker lost. The operation has failed.');
  assert.equal(r.open(),true);assert.equal(r.unread(),0);
  assert.equal(r.open(),false,'opening an open radio does nothing');
  assert.equal(r.close(),true,'and shutting it works');
  r.say('Thin ice broke! Tanks slow down and take more damage.');
  assert.equal(r.unread(),1,'a message arriving after reading counts again');
  assert.equal(r.toggle(),true,'the handset opens it');
  assert.equal(r.unread(),0);
  assert.equal(r.toggle(),true,'and shuts it');
  assert.equal(doc.node('radioToggle').getAttribute('aria-expanded'),'false');
  assert.equal(r.close(),false,'shutting a shut radio does nothing');
});

test('a new run empties the log: the old battle has nothing left to say',()=>{
  const doc=stubDocument(),r=radio(doc);
  r.say('one');r.say('two');r.open();
  r.clear();
  assert.equal(r.isOpen(),false);assert.equal(r.unread(),0);
  assert.equal(doc.node('radioLog').hidden,true);
  r.open();
  assert.equal(doc.node('radioLogList').children.length,0,'and the log is empty, not full of yesterday');
});

test('a language change re-reads the log instead of keeping yesterday’s words',()=>{
  const doc=stubDocument();let language='en';
  const table={'Hero moving to position.':{en:'Hero moving to position.',de:'Held bewegt sich zur Position.'}};
  const r=createFieldRadio(doc,{translate:text=>table[text]?.[language]??text});
  r.say('Hero moving to position.');r.open();
  assert.equal(doc.node('radioLogList').children[0].textContent,'Hero moving to position.');
  language='de';r.refresh();
  assert.equal(doc.node('radioLogList').children[0].textContent,'Held bewegt sich zur Position.');
  // A function is asked again: a refusal names a number that has since changed.
  let supplies=70;
  const doc2=stubDocument();
  const r2=createFieldRadio(doc2,{translate:text=>text});
  r2.say(()=>`Not enough supplies. You need ${supplies}.`);r2.open();
  assert.equal(doc2.node('radioLogList').children[0].textContent,'Not enough supplies. You need 70.');
  supplies=95;r2.refresh();
  assert.equal(doc2.node('radioLogList').children[0].textContent,'Not enough supplies. You need 95.');
});

test('a field without the device is not a broken field',()=>{
  const doc=stubDocument();
  for(const id of ['radioLog','radioLogList','radioUnread','radioToggle'])doc.node(id);
  const nodes=doc;
  assert.throws(()=>createFieldRadio(null),/Invalid field radio/,'a caller that hands over nothing is told');
  assert.throws(()=>createFieldRadio(nodes,{maxEntries:0}),/Invalid field radio log/,'and so is a log that cannot hold one line');
});

// The device has to be a device in the shipped markup: a real button, a badge,
// and a panel that starts hidden. And the old noticeboard - a permanent line
// over the battlefield - must be gone from the paint.
test('the radio is a handset in the field, not a line printed over it',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const box=html.slice(html.indexOf('id="battleFoot"'),html.indexOf('id="battleFoot"')+1200);
  assert.match(box,/id="radioToggle"/,'a handset to tap');
  assert.match(box,/id="radioUnread"[^>]*hidden/,'a badge that starts empty');
  assert.match(box,/id="radioLog"[^>]*hidden/,'and a log that starts closed');
  assert.match(box,/id="message"[^>]*aria-live="polite"/,'the spoken line stays for screen readers');
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  // The line is no longer painted: it is clipped for assistive technology only.
  assert.match(css,/\.radio-live\{[^}]*clip-path/,'and it is no longer printed across the field');
  assert.match(css,/\.radio-toggle\{[^}]*pointer-events:auto/,'the handset takes taps');
  assert.match(css,/\.radio-log\{[^}]*pointer-events:auto/,'and so does the open panel - deliberately');
  assert.match(css,/#gameView \.battle-foot\{[^}]*pointer-events:none/,'but the box around them stays out of the way');
});

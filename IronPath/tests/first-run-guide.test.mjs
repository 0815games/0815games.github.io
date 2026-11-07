import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createGuide, STEPS, CLASSES} from '../first-run-guide.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// The smallest DOM the guide actually touches. Anything it needs that is missing
// here is something it would need from the game, which it must not have.
function makeDocument() {
  const nodes = new Map();
  const node = (id, extra = {}) => {
    const el = {
      id, hidden: false, textContent: '', dataset: {}, style: {},
      getBoundingClientRect: () => ({left: 10, top: 20, width: 200, height: 120}),
      ...extra,
    };
    nodes.set(id, el);
    return el;
  };
  for (const id of ['firstRunGuide', 'guideStep', 'guideTitle', 'guideText', 'guideCaption', 'guideNext', 'coachHighlight', 'coachRing']) node(id);
  nodes.get('firstRunGuide').hidden = true;
  return { getElementById: id => nodes.get(id) ?? null, _nodes: nodes };
}
const store = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), _map: map }; };

test('the guide walks rewards -> equip -> skills -> workshop, in that order', () => {
  const document = makeDocument(), storage = store();
  const guide = createGuide({ document, storage, resolve: () => ({ getBoundingClientRect: () => ({ left: 5, top: 5, width: 100, height: 80 }) }) });
  assert.equal(guide.start('soldier-a'), true);
  assert.equal(guide.step().id, 'rewards');
  assert.equal(document._nodes.get('guideTitle').textContent, 'Your first reward');
  assert.equal(document._nodes.get('firstRunGuide').hidden, false);
  // The reward card is read, so it has a button.
  assert.equal(document._nodes.get('guideNext').hidden, false);
  guide.next(); assert.equal(guide.step().id, 'equip');
  // The equip card waits for the gear to be put on. Clicking NEXT must NOT skip it,
  // or the guide becomes a wall of text again.
  assert.equal(document._nodes.get('guideNext').hidden, true, 'no button on an action card');
  guide.next(); assert.equal(guide.step().id, 'equip', 'an action card cannot be clicked past');
  assert.equal(guide.event('skills'), false, 'the wrong screen does not advance it');
  guide.event('equip'); assert.equal(guide.step().id, 'skills');
  guide.event('skills'); assert.equal(guide.step().id, 'workshop');
  assert.equal(document._nodes.get('guideNext').hidden, false);
  guide.next();
  assert.equal(guide.isOpen(), false, 'the last card closes the guide');
  assert.equal(storage.getItem('ironpath:guide:v1:soldier-a'), 'done');
});

test('the guide is shown once per account, and stopping does not count as finishing', () => {
  const document = makeDocument(), storage = store();
  const guide = createGuide({ document, storage });
  guide.start('soldier-b');
  guide.stop();
  assert.equal(guide.isOpen(), false);
  assert.equal(storage.getItem('ironpath:guide:v1:soldier-b'), null, 'a closed guide is offered again');
  const again = createGuide({ document, storage });
  assert.equal(again.start('soldier-b'), true);
  // An account that walked it end to end is never asked twice.
  const walked = store();
  const finished = createGuide({ document, storage: walked });
  finished.start('soldier-c');
  finished.next();            // rewards -> equip
  finished.event('equip');    // -> skills
  finished.event('skills');   // -> workshop
  finished.next();            // closes and marks
  assert.equal(walked.getItem('ironpath:guide:v1:soldier-c'), 'done');
  assert.equal(createGuide({ document, storage: walked }).start('soldier-c'), false, 'never asked twice');
});

test('every card explains one screen, and the classes are actually explained', () => {
  assert.deepEqual(STEPS.map(step => step.id), ['rewards', 'equip', 'skills', 'workshop']);
  for (const step of STEPS) {
    assert.ok(step.title && step.text.length > 60, `${step.id} says something useful`);
    assert.ok(step.target?.element, `${step.id} names the screen it is about`);
    assert.ok(html.includes(`id="${step.target.element.slice(1)}"`), `${step.id} points at a real element`);
    assert.ok(['button', 'action'].includes(step.advance));
  }
  // The four paths are the thing the armory never explained.
  assert.deepEqual(CLASSES.map(c => c.id), ['assault', 'engineer', 'recon', 'command']);
  for (const klass of CLASSES) assert.ok(klass.what.length > 20, `${klass.id} says what it does`);
});

test('the guide never becomes a modal', () => {
  const block = readFileSync(new URL('../interface-redesign.css', import.meta.url), 'utf8');
  const start = block.indexOf('.first-run-guide{');
  const guide = block.slice(start, start + 1200);
  assert.match(guide, /position:fixed/);
  assert.doesNotMatch(block, /<dialog[^>]*firstRunGuide/, 'it is an aside, not a dialog');
  assert.match(html, /<aside id="firstRunGuide"[^>]*aria-modal="false"/);
  assert.match(html, /<aside id="firstRunGuide"[^>]*hidden/);
  // It must not cover the thing it explains: on a laptop the dialog is centred.
  assert.match(guide, /top:calc\(8px/, 'it sits at the top, clear of the dialog body');
  assert.match(block, /@media\(max-height:460px\)/);
});

test('the card outranks the modal dialogs it explains, and re-raises above them',()=>{
 // Reported: "nach dem Erhalt der dog tag wird man einfach ins nächste Menü
 // geschossen ohne Erklärung." The card was there all along - under the dark
 // backdrop of the armory dialog, because a z-index cannot cross the top layer.
 // A manual popover can, so the card is shown as one wherever the browser has
 // them, and `raise()` re-joins above a dialog that opened after it.
 const calls=[];
 const document=makeDocument();
 const card=document.getElementById('firstRunGuide');
 card.showPopover=()=>{calls.push('show');};
 card.hidePopover=()=>{calls.push('hide');};
 card.matches=selector=>selector===':popover-open'&&calls[calls.length-1]==='show';
 const guide=createGuide({document,storage:store(),resolve:()=>({getBoundingClientRect:()=>({left:5,top:5,width:100,height:80})})});
 assert.equal(guide.start('soldier-x'),true);
 assert.deepEqual(calls,['show'],'showing the card shows the popover');
 // The armory opens above it; the account re-raises the card.
 guide.raise();
 assert.deepEqual(calls,['show','hide','show'],'raise re-joins the top layer above the dialog');
 // Putting the card away closes the popover and hides the element.
 guide.stop();
 assert.deepEqual(calls,['show','hide','show','hide']);
 assert.equal(card.hidden,true);
 // Without the popover API nothing breaks: the old layering simply stands.
 const plain=makeDocument();
 const plainGuide=createGuide({document:plain,storage:store(),resolve:()=>null});
 assert.equal(plainGuide.start('soldier-y'),true);
 assert.equal(plainGuide.raise(),true);
 plainGuide.stop();
});

test('a dismissed guide keeps its place, still counts the screen, and returns at the next step', () => {
  const document = makeDocument(), storage = store();
  const seen = [];
  const guide = createGuide({ document, storage, resolve: () => ({ getBoundingClientRect: () => ({ left: 5, top: 5, width: 100, height: 80 }) }), onVisibilityChange: open => seen.push(open) });
  guide.start('soldier-d');
  guide.next(); // rewards -> equip (action card)
  assert.equal(guide.step().id, 'equip');
  // Reported: "Bei Fähigkeiten, Armory etc. soll die Mission auch ausgeblendet
  // werden können und wieder aufgerufen werden." ✕ puts it away - a pause.
  assert.equal(guide.dismiss(), true);
  assert.equal(guide.isOpen(), false);
  assert.equal(guide.dismissed(), true);
  assert.equal(storage.getItem('ironpath:guide:v1:soldier-d'), null, 'a dismissed guide is not finished');
  // The recall brings it back at the step it was on; reopening an open card is a no-op.
  assert.equal(guide.reopen(), true);
  assert.equal(guide.isOpen(), true);
  assert.equal(guide.step().id, 'equip', 'it comes back at the SAME step, not restarted');
  assert.equal(guide.reopen(), false, 'nothing to recall while it is already open');
  guide.dismiss();
  // The screen still counts while the card is away - and the card comes back
  // BY ITSELF at the next step, the same principle as the field card at 5/7.
  assert.equal(guide.event('equip'), true);
  assert.equal(guide.step().id, 'skills');
  assert.equal(document._nodes.get('firstRunGuide').hidden, false, 'it returns at the next step');
  assert.equal(guide.dismissed(), false);
  // Dismissed again, then recalled by hand: same step, not restarted.
  guide.dismiss();
  assert.equal(guide.event('skills'), true);
  guide.dismiss();
  assert.equal(guide.reopen(), true);
  assert.equal(guide.step().id, 'workshop');
  guide.next();
  assert.equal(guide.isOpen(), false);
  assert.equal(guide.dismissed(), false, 'a finished guide has no recall state');
  assert.equal(storage.getItem('ironpath:guide:v1:soldier-d'), 'done');
});

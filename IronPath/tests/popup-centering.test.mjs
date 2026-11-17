import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

// Where a popup appears.
//
// The request centre was moved to the middle for the multiplayer votes; the
// answer to "and the rest?" is one file, not one rule per popup. This test is
// the inventory: it names every popup that interrupts, insists each of them is
// centred, and insists the selectors are real - a rule that matches nothing is
// worse than no rule, because it looks like the work was done.
//
// It deliberately does NOT cover:
//   * the sandbox bar (.sandbox-banner) - it is sticky furniture that stays
//     while a mode is switched on, not an interruption;
//   * sheets and rings (.tower-sheet, #radialMenu) - they belong to the pad or
//     the page they were opened from, and moving them would move the finger;
//   * native <dialog> elements - the browser already centres those.
//
// The version notice IS covered, and that is the point of this file: it used to
// be exempt because it is called a banner, while carrying RETRY CHECK and
// DISMISS. What decides is what an element does, not what it is called.
const css=readFileSync(new URL('../popup-center.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fieldCommand=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');

// Rule groups, in source order. Comments are stripped first: the file explains
// itself at the top, and a comment is not a rule.
const rules=[...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(match=>({selector:match[1].trim(),body:match[2]}));

function declarations(body){
  const found={};
  for(const part of body.split(';')){
    const [property,value]=part.split(':');
    if(property&&value)found[property.trim()]=value.trim();
  }
  return found;
}

test('every popup that interrupts is centred, and named in one place',()=>{
  assert.equal(rules.length,4,'four notices are covered; a new one belongs in this file');
  for(const rule of rules){
    const style=declarations(rule.body);
    assert.equal(style.left,'50%',`${rule.selector} sits on the horizontal middle`);
    assert.equal(style.top,'50%',`${rule.selector} sits on the vertical middle`);
    assert.equal(style.transform,'translate(-50%, -50%)'.replace(', ',','),`${rule.selector} halves its own size, not a magic number`);
    assert.equal(style.right,'auto',`${rule.selector} releases the old right edge`);
    assert.equal(style.bottom,'auto',`${rule.selector} releases the old bottom edge`);
    assert.ok(!('position' in style),`${rule.selector} keeps the position its own stylesheet gave it`);
  }
  // The four, by name: the site-wide invitation, the new-build notice, the
  // battle vote and the mission decision.
  assert.deepEqual(rules.map(rule=>rule.selector.split(',')[0].trim()),
    ['.social-popup','.version-notice','#gameView .battle .wave-request:not([hidden])','#gameView .map-frame .story-decision:not([hidden])']);
});

test('every selector in the file matches an element in the real page',()=>{
  for(const rule of rules){
    for(const selector of rule.selector.split(',').map(part=>part.trim())){
      const id=selector.match(/#([\w-]+)/)?.[1],classes=[...selector.matchAll(/\.([\w-]+)/g)].map(match=>match[1]);
      if(id)assert.match(html,new RegExp(`id="${id}"`),`${selector} names a real element`);
      for(const name of classes)assert.match(html,new RegExp(`class="[^"]*\\b${name}\\b`),`${selector} names a real class (${name})`);
    }
  }
  // The vote card covers both votes: #waveRequest and #speedRequest carry the
  // same class, and the speed vote used to be offset separately.
  assert.match(html,/id="speedRequest" class="wave-request speed-request"/,'the speed vote is a wave-request too');
});

test('the overrides land after the rules they replace',()=>{
  for(const file of ['style.css','field-command.css'])
    assert.ok(html.indexOf(`${file}?v=`) < html.indexOf('popup-center.css?v='),`popup-center.css is linked after ${file}`);
  assert.match(html,/popup-center\.css\?v=\d{8}-[\w]+/,'and carries its own cache wave');
});

test('the field decision no longer pushes the radio out of its slot',()=>{
  // While the decision card sat in the bottom-left corner, the radio was lifted
  // above it. The card is in the middle now, so those lifts are stale - and a
  // stale lift would float the radio in the middle of the field for no reason.
  assert.doesNotMatch(fieldCommand,/story-decision:not\(\[hidden\]\)\) \.story-radio/,'no leftover radio lift');
  assert.match(fieldCommand,/#gameView \.map-frame \.story-radio\{bottom:80px;/,'the radio keeps its own slot');
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

// The ability HUD is placed with `position:absolute` against the battlefield
// frame. That only works while it hangs on that frame: the command panel inside
// the frame is positioned too, and an absolute button nested in it measures from
// the panel - landing on top of DEPLOY / START WAVE instead of on the field.
// Chromium found that by refusing to click the start button; this test finds it
// without a browser, by counting tags.
//
// It hangs on the frame through the field-controls COLUMN: "fit map", the field
// upgrade reminder and the ability used to be placed independently and met each
// other on a phone. One column places them all, so the HUD is a grandchild of
// the frame and a child of the column - never a child of the command panel.
const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);

function depthBetween(html,from,to){
  let depth=0;
  for(const match of html.slice(from,to).matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)){
    const [,closing,tag,,selfClosing]=match;
    if(VOID.has(tag.toLowerCase())||selfClosing) continue;
    depth+=closing?-1:1;
  }
  return depth;
}

test('the ability HUD hangs on the battlefield frame, not on the command panel',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const frame=html.indexOf('class="map-frame"');
  assert.ok(frame>0,'the battlefield frame exists');
  const frameEnd=frame+html.slice(frame).indexOf('>')+1;
  const ability=html.indexOf('id="ability"');
  assert.ok(ability>frame,'the ability HUD lives inside the battlefield frame');
  const panel=html.indexOf('class="panel command"');
  assert.ok(panel>frame,'the command panel lives inside the frame too');
  assert.ok(ability>panel,'and the HUD comes after it in the document');

  const column=html.indexOf('class="field-controls"');
  assert.ok(column>frame,'the field controls live in the battlefield frame');
  assert.ok(column>panel,'after the command panel, not inside it');
  assert.ok(ability>column,'and the ability HUD is one of them');
  // The column is what the frame measures: everything between frame and column
  // is closed again, so the column is a direct child of the frame.
  assert.equal(depthBetween(html,frameEnd,column),0,
    'the column is a direct child of the frame: every open tag between them is closed again');
  assert.equal(depthBetween(html,column+html.slice(column).indexOf('>')+1,ability),0,
    'and the HUD is a direct child of the column: no nested wrapper in between');
  assert.equal(html.slice(panel,column).includes('</section>'),true,
    'in particular the command panel is closed before the column starts');
  // Nothing between the column and the HUD may open a positioned box: the HUD
  // measures from the column, and the column from the frame.
  assert.doesNotMatch(html.slice(column,ability),/class="[^"]*(panel|command)[^"]*"/,
    'no command panel is opened inside the column');
});

test('the frame is the box the HUD measures against',()=>{
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  const frameRule=/#gameView \.map-frame\{[^}]*\}/.exec(css)?.[0]||'';
  assert.match(frameRule,/position:relative/,'the frame establishes the containing block');
  const columnRule=/#gameView \.map-frame \.field-controls\{[^}]*\}/.exec(css)?.[0]||'';
  assert.match(columnRule,/position:absolute/,'and the column that carries the HUD is placed inside it');
  assert.match(columnRule,/right:/,'on the right edge, at the rim of the frame');
  // One stack, one gap: the three field controls can no longer sit on top of
  // each other, however tall any one of them grows.
  assert.match(columnRule,/flex-direction:column/,'they stack, they do not pile up');
  assert.match(columnRule,/gap:8px/,'with one gap between them');
  assert.match(columnRule,/pointer-events:none/,'and the empty part of the column lets taps through to the field');
  // The HUD itself is laid out by the column now, not placed by its own
  // coordinates - that is the whole point of the stack.
  const hudRule=/#gameView \.map-frame \.ability-hud\{[^}]*\}/.exec(css)?.[0]||'';
  assert.match(hudRule,/position:relative/,'the HUD is laid out by the column, not placed by its own coordinates');
  assert.doesNotMatch(hudRule,/position:absolute/,'no second set of coordinates that can drift apart from the stack');
  // In the bottom-right corner, where a thumb rests. NOT vertically centred:
  // that is the middle of the field, where the fighting is - which is exactly
  // what the first version did and what the operator objected to.
  assert.match(columnRule,/bottom:calc\(100px/,'low in the frame, within reach');
  assert.doesNotMatch(columnRule,/top:50%/,'never parked in the middle of the battlefield');
  // A width, not a maximum: no ability name, in any language, may stretch the
  // button into a bar across the field.
  assert.match(hudRule,/width:min\(196px/,'a button, not a bar');
  // Found on a phone: 196px on a 360px screen reaches across the field. Half
  // the viewport minus margins is the most the HUD can ever take.
  assert.match(hudRule,/calc\(50vw - 20px\)/,'and never wider than half the field');
  // Narrow screens, not only touch ones: measured on a 320px field, where the
  // HUD lay across the whole width. Both the width query and the pointer query
  // have to narrow it - a narrow desktop window has a fine pointer and exactly
  // the same crowding.
  const reserved=[...css.matchAll(/@media\((?:max-width:850px|pointer:coarse)\)\{\n #gameView \.map-frame \.ability-hud\{width:min\(130px[^}]*\)\}\n\}/g)];
  assert.equal(reserved.length,2,`the 150px column is reserved for narrow screens and for touch alike (${reserved.length} of 2)`);
  // The shared frame has to outrank the iron-stamp rule in
  // interface-redesign.css (`button:not(.primary):not([disabled]):not(.mode-card):not(.act-node)`,
  // specificity 0-3-1). Chromium measured what happens otherwise: the zoom button
  // stayed a stamped gradient bar with a silver rim next to the ability's dark
  // plate - "verschiedene Optik", exactly the complaint. A class-only rule
  // (0-1-1) loses to it, so the frame carries an id.
  const iron=readFileSync(new URL('../interface-redesign.css',import.meta.url),'utf8');
  assert.match(iron,/button:not\(\.primary\):not\(\[disabled\]\):not\(\.mode-card\):not\(\.act-node\)[\s\S]*?\{[^}]*background:linear-gradient/,
    'the stamped-iron button rule this has to outrank still exists');
  const sharedFrame=css.split('\n').find(line=>line.includes('.field-controls>button')&&line.includes('border-radius'))||'';
  assert.match(sharedFrame,/#gameView \.field-controls>button:not\(\.ability-hud\)\{[^}]*background:#162b21f2/,
    'the frame is declared with an id, so it beats the 0-3-1 iron rule');
  assert.match(sharedFrame,/min-height:48px/,'and it carries the ability button\'s own height');
  assert.match(sharedFrame,/padding:8px 12px 8px 10px/,'its padding');
  assert.match(sharedFrame,/border-radius:8px/,'and its corner - the three field buttons are one family');
  assert.doesNotMatch(sharedFrame,/width:min\(196px/,'but not the ability\'s width - that one belongs to the HUD alone');
  // A disabled HUD must not swallow taps meant for the battlefield under it.
  const disabled=css.split('\n').find(line=>line.includes('.ability-hud:disabled'))||'';
  assert.match(disabled,/pointer-events:none/,'a disabled HUD lets taps through to the field');
});

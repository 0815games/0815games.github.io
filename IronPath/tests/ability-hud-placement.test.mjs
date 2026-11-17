import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

// The ability HUD is placed with `position:absolute` against the battlefield
// frame. That only works while it is a CHILD of that frame: the command panel
// inside the frame is positioned too, and an absolute button nested in it
// measures from the panel - landing on top of DEPLOY / START WAVE instead of on
// the field. Chromium found that by refusing to click the start button; this
// test finds it without a browser, by counting tags.
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

  assert.equal(depthBetween(html,frameEnd,ability),0,
    'the HUD is a direct child of the frame: every open tag between them is closed again');
  assert.equal(html.slice(panel,ability).includes('</section>'),true,
    'in particular the command panel is closed before the HUD starts');
});

test('the frame is the box the HUD measures against',()=>{
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  const frameRule=/#gameView \.map-frame\{[^}]*\}/.exec(css)?.[0]||'';
  assert.match(frameRule,/position:relative/,'the frame establishes the containing block');
  const hudRule=/#gameView \.map-frame \.ability-hud\{[^}]*\}/.exec(css)?.[0]||'';
  assert.match(hudRule,/position:absolute/,'and the HUD is placed inside it');
  assert.match(hudRule,/right:/,'on the right edge, at the rim of the frame');
  // In the bottom-right corner, where a thumb rests. NOT vertically centred:
  // that is the middle of the field, where the fighting is - which is exactly
  // what the first version did and what the operator objected to.
  assert.match(hudRule,/bottom:calc\(100px/,'low in the frame, within reach');
  assert.doesNotMatch(hudRule,/top:50%/,'never parked in the middle of the battlefield');
  // A width, not a maximum: no ability name, in any language, may stretch the
  // button into a bar across the field.
  assert.match(hudRule,/width:min\(196px/,'a button, not a bar');
  // Found on a phone: 196px on a 360px screen reaches into the bottom-left
  // corner, and the field radio lives there. Half the viewport minus margins is
  // the most the HUD can ever take without meeting it.
  assert.match(hudRule,/calc\(50vw - 20px\)/,'and never wider than the half that is not the field radio');
  // Narrow screens, not only touch ones: measured on a 320px field, where the
  // radio spans the whole width and the HUD lay across it. Both the width query
  // and the pointer query have to reserve the column - a narrow desktop window
  // has a fine pointer and exactly the same crowding.
  const reserved=[...css.matchAll(/@media\((?:max-width:850px|pointer:coarse)\)\{\n #gameView \.battle-foot\{max-width:calc\(100% - 150px\)\}\n #gameView \.map-frame \.ability-hud\{width:min\(130px[^}]*\)\}\n\}/g)];
  assert.equal(reserved.length,2,`the 150px column is reserved for narrow screens and for touch alike (${reserved.length} of 2)`);
  // A disabled HUD must not swallow taps meant for the battlefield under it.
  const disabled=css.split('\n').find(line=>line.includes('.ability-hud:disabled'))||'';
  assert.match(disabled,/pointer-events:none/,'a disabled HUD lets taps through to the field');
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createBattleXpHud} from '../battle-xp-hud.mjs';

// The soldier tile on the battlefield. The rule under test is the one the block
// asked for: unconfirmed saves must not fake a level-up. The module therefore
// has no parameter for "a wave just paid 120 XP" - it can only read the profile
// the account has already confirmed, so these cases are about what it does with
// what it is allowed to see.
const GERMAN={'{current} / {required} XP':'{current} / {required} EP','{amount} XP to level {level}':'Noch {amount} EP bis Stufe {level}'};
function fixture(profile){
  const elements=new Map();
  for(const id of ['level','levelXpBox','levelXpBar','levelXpText','levelXpLeft'])elements.set(id,{id,textContent:'',hidden:false});
  const state={language:'en'};
  // The real `tr` answers in the language the field is showing at that moment.
  const tr=(text,values={})=>String(state.language==='de'&&GERMAN[text]||text).replace(/\{(\w+)\}/g,(whole,key)=>key in values?String(values[key]):whole);
  const document={getElementById:id=>elements.get(id)??null};
  return {elements,state,hud:createBattleXpHud({document,getProfile:()=>profile,tr})};
}
const shown=f=>f.elements.get('level').textContent;
const text=f=>f.elements.get('levelXpText').textContent;
const left=f=>f.elements.get('levelXpLeft').textContent;

test('a confirmed profile shows level, current/required, the bar and what is missing',()=>{
  // 300 XP is exactly the step from level 1 to level 2: 0 of the next 450 earned.
  const f=fixture({xp:300});
  assert.deepEqual(f.hud.render(1),{level:2,current:0,required:450,remaining:450});
  assert.equal(shown(f),'2');
  assert.equal(text(f),'0 / 450 XP');
  assert.equal(left(f),'450 XP to level 3');
  assert.equal(f.elements.get('levelXpBar').max,450);
  assert.equal(f.elements.get('levelXpBar').value,0);
  assert.equal(f.elements.get('levelXpBox').hidden,false);
});

test('a partly filled level counts what is still missing, not what was earned',()=>{
  const f=fixture({xp:470});
  assert.deepEqual(f.hud.render(1),{level:2,current:170,required:450,remaining:280});
  assert.equal(text(f),'170 / 450 XP');
  assert.equal(left(f),'280 XP to level 3');
});

test('no confirmed XP hides the progress and keeps the level the soldier came in with',()=>{
  for(const profile of [null,undefined,{},{xp:undefined},{xp:null},{xp:-1},{xp:12.5},{xp:'300'}]){
    const f=fixture(profile);
    assert.equal(f.hud.render(4),null,JSON.stringify(profile));
    assert.equal(shown(f),'4');
    assert.equal(f.elements.get('levelXpBox').hidden,true,'no confirmed number, no bar');
  }
  // A missing or unusable fallback still shows a soldier, never a blank tile.
  const f=fixture({xp:null});
  f.hud.render(undefined);
  assert.equal(shown(f),'1');
});

test('a wave that has not been saved cannot lift the level',()=>{
  // The whole point: the profile is the only source. awardXP's promise, the
  // reward queue and the report live elsewhere; until the account profile moves,
  // the tile does not. 299 XP is one point short of level 2 - the pending wave
  // would push it over, and the tile must not care.
  let profile={xp:299};
  const elements=new Map();
  for(const id of ['level','levelXpBox','levelXpBar','levelXpText','levelXpLeft'])elements.set(id,{id,textContent:'',hidden:false});
  const hud=createBattleXpHud({document:{getElementById:id=>elements.get(id)??null},getProfile:()=>profile,
    tr:(text,values={})=>text.replace(/\{(\w+)\}/g,(whole,key)=>key in values?String(values[key]):whole)});
  hud.render(1);
  assert.equal(elements.get('level').textContent,'1');
  assert.equal(elements.get('levelXpText').textContent,'299 / 300 XP');
  // The save comes back: only now does the level move.
  profile={xp:419};
  hud.render(1);
  assert.equal(elements.get('level').textContent,'2');
  assert.equal(elements.get('levelXpText').textContent,'119 / 450 XP');
  assert.equal(elements.get('levelXpLeft').textContent,'331 XP to level 3');
});

test('a language switch re-renders the strings instead of keeping the old ones',()=>{
  const f=fixture({xp:300});
  f.hud.render(1);
  assert.equal(text(f),'0 / 450 XP');
  f.state.language='de';
  f.hud.render(1);
  assert.equal(text(f),'0 / 450 EP');
  assert.equal(left(f),'Noch 450 EP bis Stufe 3');
  assert.equal(shown(f),'2','the level is a number in every language');
});

test('the tile it writes is part of the real page and starts hidden',()=>{
  // The ids live in index.html, but no other guard scans this module's lookups.
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  for(const id of ['level','levelXpBox','levelXpBar','levelXpText','levelXpLeft'])assert.match(html,new RegExp(`id="${id}"`),id);
  assert.match(html,/id="levelXpBox" hidden>/,'nothing is claimed before the first confirmed read');
  // `.hud-xp{display:block}` outranks the browser's `[hidden]` rule, so the
  // stylesheet has to say it again - otherwise hiding the block does nothing.
  assert.match(css,/\.hud-xp\[hidden\]\{display:none\}/);
});

test('the factory rejects a caller that cannot read a confirmed profile',()=>{
  for(const options of [null,undefined,{},{document:{getElementById:()=>null}},
    {document:{getElementById:()=>null},getProfile:()=>({})},
    {document:{getElementById:()=>null},getProfile:()=>({}),tr:null}])
    assert.throws(()=>createBattleXpHud(options),/Invalid XP display/);
});

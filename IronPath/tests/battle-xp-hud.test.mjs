import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createBattleXpHud} from '../battle/battle-xp-hud.mjs';

// The soldier tile on the battlefield. The rule under test is the one the block
// asked for: unconfirmed saves must not fake a level-up. The module therefore
// has no parameter for "a wave just paid 120 XP" - it can only read the profile
// the account has already confirmed, so these cases are about what it does with
// what it is allowed to see.
//
// The second rule is newer: the tile shows the LEVEL and nothing else. The XP
// bar, the "0 / 450 XP" and the "450 XP to level 3" were removed from the field
// on the operator's word - the status row was unreadable with them in it.
function fixture(profile){
  const elements=new Map();
  for(const id of ['level','levelXpBox','levelXpBar','levelXpText','levelXpLeft'])elements.set(id,{id,textContent:'',hidden:false});
  const state={language:'en'};
  const tr=(text,values={})=>String(text).replace(/\{(\w+)\}/g,(whole,key)=>key in values?String(values[key]):whole);
  const document={getElementById:id=>elements.get(id)??null};
  return {elements,state,hud:createBattleXpHud({document,getProfile:()=>profile,tr})};
}
const shown=f=>f.elements.get('level').textContent;

test('a confirmed profile shows the level - and writes no XP anywhere',()=>{
  // 300 XP is exactly the step from level 1 to level 2.
  const f=fixture({xp:300});
  assert.deepEqual(f.hud.render(1),{level:2,current:0,required:450,remaining:450});
  assert.equal(shown(f),'2');
  // The numbers are still returned for the report; they are just not painted.
  for(const id of ['levelXpBar','levelXpText','levelXpLeft'])
    assert.equal(f.elements.get(id).textContent,'',`${id} is not written any more`);
});

test('no confirmed XP keeps the level the soldier came in with',()=>{
  for(const profile of [null,undefined,{},{xp:undefined},{xp:null},{xp:-1},{xp:12.5},{xp:'300'}]){
    const f=fixture(profile);
    assert.equal(f.hud.render(4),null,JSON.stringify(profile));
    assert.equal(shown(f),'4');
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
  for(const id of ['level'])elements.set(id,{id,textContent:'',hidden:false});
  const hud=createBattleXpHud({document:{getElementById:id=>elements.get(id)??null},getProfile:()=>profile,
    tr:(text,values={})=>text.replace(/\{(\w+)\}/g,(whole,key)=>key in values?String(values[key]):whole)});
  hud.render(1);
  assert.equal(elements.get('level').textContent,'1');
  // The save comes back: only now does the level move.
  profile={xp:419};
  assert.deepEqual(hud.render(1),{level:2,current:119,required:450,remaining:331});
  assert.equal(elements.get('level').textContent,'2');
});

test('the tile it writes is part of the real page, and the XP furniture is not',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="level"/,'the level is on the field');
  // Removed on the operator's word: the bar, the current/required line and the
  // "still missing" line. A guard, so they do not creep back in.
  for(const id of ['levelXpBox','levelXpBar','levelXpText','levelXpLeft'])
    assert.doesNotMatch(html,new RegExp(`id="${id}"`),`${id} is gone from the status row`);
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/hud-xp/,'and so is the stylesheet that dressed it');
});

test('the factory rejects a caller that cannot read a confirmed profile',()=>{
  for(const options of [null,undefined,{},{document:{getElementById:()=>null}},
    {document:{getElementById:()=>null},getProfile:()=>({})},
    {document:{getElementById:()=>null},getProfile:()=>({}),tr:null}])
    assert.throws(()=>createBattleXpHud(options),/Invalid XP display/);
});

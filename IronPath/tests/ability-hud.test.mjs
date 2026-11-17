import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {abilityHud,abilityTargets,abilityHudSvg,ABILITY_ICON_KINDS} from '../ability-hud.mjs';
import {SKILL_PATHS} from '../skills.mjs';

// The ability HUD: what the button says, and why it is grey.
//
// The old button answered "can I press it?" and nothing else - a soldier with a
// dead button got no reason. These tests pin the reason and its order: the one
// the player can act on first, not the first one the code happened to check.
const skills=(active,extra={})=>({active,variant:0,...extra});

test('a ready ability says so, and nothing else',()=>{
  const hud=abilityHud({skills:skills('assault'),running:true,enemies:3});
  assert.deepEqual({ready:hud.ready,reason:hud.reason,name:hud.name},{ready:true,reason:'ready',name:'Airstrike'});
  for(const path of SKILL_PATHS){
    const ready=abilityHud({skills:skills(path.id),running:true,enemies:2});
    assert.equal(ready.reason,'ready',`${path.id} is usable in a running wave`);
    assert.equal(ready.name,path.ability,'and shows its own name');
  }
});

test('every reason is one the player can act on, in the order they would ask',()=>{
  const cases=[
    [{},'no-skill','no ability chosen at all'],
    [{skills:skills('assault'),ended:true},'ended','the operation is over'],
    [{skills:skills('assault'),menuOpen:true},'panel-open','a panel is in the way'],
    [{skills:skills('assault'),cooldown:12.4},'cooldown','still recharging'],
    [{skills:skills('assault'),coopReady:false},'waiting','the party is not complete'],
    [{skills:skills('assault')},'not-running','no wave has started'],
    [{skills:skills('assault'),running:true,enemies:0},'no-targets','nothing to hit'],
  ];
  for(const [input,reason,label] of cases)assert.equal(abilityHud(input).reason,reason,label);
  // The order matters: with everything wrong at once the first actionable
  // reason wins, and "ended" beats everything - there is nothing to wait for.
  assert.equal(abilityHud({skills:skills('assault'),ended:true,cooldown:9,menuOpen:true,coopReady:false}).reason,'ended');
  assert.equal(abilityHud({skills:skills('assault'),menuOpen:true,cooldown:9}).reason,'panel-open');
  assert.equal(abilityHud({skills:skills('assault'),cooldown:9,coopReady:false}).reason,'cooldown');
});

test('only the abilities that need a target wait for one',()=>{
  assert.equal(abilityTargets('assault'),true,'an airstrike over an empty field is a wasted cooldown');
  assert.equal(abilityTargets('recon'),true);
  for(const id of ['engineer','logistics','medic']){
    assert.equal(abilityTargets(id),false,`${id} works on towers, supplies or the bunker`);
    assert.equal(abilityHud({skills:skills(id),running:true,enemies:0}).reason,'ready','which are always there');
  }
  assert.equal(abilityTargets(undefined),false);
});

test('the cooldown counts whole seconds and never a negative one',()=>{
  assert.equal(abilityHud({skills:skills('medic'),cooldown:12.1}).seconds,13,'a part-second is still a second to wait');
  assert.equal(abilityHud({skills:skills('medic'),cooldown:0.2}).seconds,1);
  for(const cooldown of [-5,0,undefined,null,NaN,'9',{}]){
    const hud=abilityHud({skills:skills('medic'),running:true,cooldown});
    assert.notEqual(hud.reason,'cooldown',`${String(cooldown)} is not a cooldown`);
  }
});

test('unreadable input produces a quiet button, never a broken one',()=>{
  for(const input of [undefined,null,{},[],{skills:null},{skills:{}},{skills:skills('assault'),enemies:'3'}]){
    const hud=abilityHud(input);
    assert.equal(typeof hud.reason,'string');
    assert.equal(typeof hud.name,'string');
    assert.equal(hud.ready,false,'nothing unreadable is ever usable');
  }
  assert.equal(abilityHud({}).reason,'no-skill');
  assert.equal(abilityHud({skills:skills('assault'),running:true,enemies:'3'}).reason,'no-targets','a count that is not a number is no count');
});

test('every ability carries its own mark, and the marks differ',()=>{
  const marks=ABILITY_ICON_KINDS.map(kind=>abilityHudSvg(kind,{size:26}));
  for(const [index,kind] of ABILITY_ICON_KINDS.entries()){
    assert.match(marks[index],/^<svg [^>]*viewBox="0 0 24 24"[^>]*>.*<\/svg>$/s,`${kind} is one drawn mark`);
    assert.match(marks[index],/aria-hidden="true"|focusable="false"/,`${kind} is decorative: the name is written next to it`);
  }
  assert.equal(new Set(marks).size,ABILITY_ICON_KINDS.length,'no two abilities share a mark');
  assert.equal(ABILITY_ICON_KINDS.length,SKILL_PATHS.length,'and every path has one');
  assert.equal(abilityHudSvg('assault',{size:8}).includes('width="8"'),true,'the size is honoured');
  assert.equal(abilityHudSvg(null),'','an unknown ability gets no mark at all');
  assert.equal(abilityHudSvg('assault',{size:-3}).includes('width="8"'),true,'and never a broken one');
});

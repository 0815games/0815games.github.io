import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createSoldierScreen} from '../ui/soldier-screen.mjs';
import {soldierProfile} from '../core/soldier-profile.mjs';
import {characterProgress} from '../core/progression.mjs';
import {encodeWorkshop} from '../workshop/workshop-wire.mjs';

function element(tag){
  return {tag,width:0,height:0,clientWidth:220,hidden:false,open:false,type:'',className:'',value:'',textContent:'',
    src:'',style:{},dataset:{},attrs:{},children:[],
    classList:{toggle(){},add(){},remove(){}},
    append(...els){this.children.push(...els);},
    replaceChildren(...els){this.children=[...els];},
    setAttribute(k,v){this.attrs[k]=String(v);},
    addEventListener(type,fn){this['on'+type]=fn;},
    showModal(){this.open=true;},
    close(){this.open=false;},
  };
}

function fixture(profile,{workshopService=null,onProfile=()=>{}}={}){
  const nodes=new Map();
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);},
    createElement:element,
    querySelector(){return null;},
  };
  const tr=(text,values={})=>String(text).replace(/\{(\w+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
  let current=profile;
  const screen=createSoldierScreen({document,translate:tr,
    getProfile:()=>current,getPortrait:()=>'data:image/png;base64,portrait',
    onArmory:()=>{},onSkills:()=>{},workshopService,
    onProfile:value=>{current=value;onProfile(value);}});
  return {screen,nodes,document,profile:()=>current};
}

const PROFILE={name:'Test Soldier',gender:'male',xp:0,armory:null,skills:''};
const WORKSHOP=extra=>encodeWorkshop({version:2,components:0,owned:['boots'],equipped:[],mods:{},...extra});

test('the dossier renders identity, XP progress and the combat profile',()=>{
  const {screen,nodes}=fixture(PROFILE);
  screen.open();
  const data=soldierProfile(PROFILE),progress=characterProgress(0);
  assert.equal(nodes.get('soldierNameDisplay').textContent,'Test Soldier');
  assert.equal(nodes.get('soldierLevelDisplay').textContent,'LEVEL 1');
  assert.equal(nodes.get('soldierPortrait').src,'data:image/png;base64,portrait','the layered portrait from the account cache');
  assert.equal(nodes.get('soldierDamage').textContent,String(data.damage));
  // The paper doll starts on the neutral loadout.
  assert.equal(nodes.get('soldierSlotWeaponName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierSlotGearName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierSlotGadgetName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierSlotVestName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierSlotBootsName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierInventoryCount').textContent,'0 pieces owned');
  assert.equal(nodes.get('soldierLegacyNote').hidden,true,'no legacy equipment, no note');
  assert.equal(nodes.get('soldierCollectionEmpty').hidden,false,'an empty collection says so');
  assert.equal(nodes.get('soldierCollectionList').children.length,0);
  // The XP rail: level progress towards the next level, like the dossier.
  assert.equal(Number(nodes.get('soldierXpBar').value),progress.current);
  assert.equal(Number(nodes.get('soldierXpBar').max),progress.required);
  assert.match(nodes.get('soldierXpText').textContent,new RegExp(`^${progress.current} / ${progress.required} XP$`));
});

test('owned equipment fills the collection and the legacy note names the old piece',()=>{
  const {screen,nodes}=fixture({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}});
  screen.open();
  const items=soldierProfile({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}}).inventory.filter(i=>i.owned);
  assert.equal(nodes.get('soldierCollectionList').children.length,items.length,'one row per owned piece');
  assert.equal(nodes.get('soldierCollectionEmpty').hidden,true);
  assert.equal(nodes.get('soldierLegacyNote').hidden,false,'the legacy slot is explained');
  assert.match(nodes.get('soldierLegacyNote').textContent,/Field Scope/,'the equipped legacy piece is named');
});

test('the loadout slots equip through the workshop service',async()=>{
  const profile={...PROFILE,workshop:WORKSHOP()};
  const calls=[];
  const {screen,nodes,profile:current}=fixture(profile,{
    workshopService:{command:async command=>{calls.push(command);
      return {status:'saved',profile:{...profile,workshop:WORKSHOP({equipped:['boots']})}};}},
    onProfile:()=>{},
  });
  screen.open();
  assert.equal(nodes.get('soldierSlotGearName').textContent,'NOTHING TAKEN');
  assert.equal(nodes.get('soldierSlotBootsName').textContent,'NOTHING TAKEN');
  // Open the gear picker: it lists the owned boots.
  nodes.get('soldierSlotGear').onclick();
  assert.equal(nodes.get('soldierSlotPicker').hidden,false,'the slot picker opens');
  assert.equal(nodes.get('soldierSlotGear').attrs['aria-expanded'],'true','the open slot reports itself');
  const picker=nodes.get('soldierSlotPicker');
  assert.match(picker.children[0].textContent,/GEAR/,'the picker names the slot');
  const row=picker.children[1],equipButton=row.children.at(-1);
  assert.ok(row.children.some(child=>child.textContent==='Field Boots'),'the owned piece is listed by name');
  assert.match(equipButton.textContent,/^TAKE$/,'not worn yet');
  equipButton.onclick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls,[{type:'equip',item:'boots'}],'the change goes through the service, never a local write');
  screen.refresh();
  assert.equal(nodes.get('soldierSlotBootsName').textContent,'Field Boots','the doll shows what she wears now on the boots place');
  assert.equal(nodes.get('soldierInventoryCount').textContent,'1 pieces owned');
});

test('the reworked markup: slim identity rail, paper doll with three slot cards',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const rail=html.indexOf('class="soldier-id"'),name=html.indexOf('id="soldierNameDisplay"'),rank=html.indexOf('id="soldierRank"'),bar=html.indexOf('id="soldierXpBar"'),panels=html.indexOf('soldier-main');
  assert.ok(rail>=0&&name>rail&&bar>rail,'name and XP bar live in the identity rail');
  assert.ok(name<rank&&rank<bar,'the rank line sits between name and XP bar');
  assert.ok(panels>rail,'the three panels sit beside the rail');
  const doll=html.indexOf('id="soldierDoll"');
  assert.ok(doll>panels,'the paper doll sits inside the panels');
  assert.ok(html.indexOf('id="soldierPortrait"')>doll,'the portrait stands in the doll');
  for(const slot of ['Gear','Weapon','Gadget','Vest','Boots']){
    assert.ok(html.indexOf(`id="soldierSlot${slot}"`)>doll,`the ${slot} slot card exists`);
    assert.ok(html.includes(`id="soldierSlot${slot}Name"`),`the ${slot} card names its piece`);
  }
  assert.ok(html.includes('id="soldierSlotPicker"'),'the inline picker exists');
  assert.ok(html.includes('id="soldierLegacyNote"'),'the legacy note exists');
  // The contract the browser smoke test pins stays intact.
  for(const id of ['soldierDialog','soldierScreenTitle','soldierNameDisplay','soldierDamage','soldierCollectionEmpty','soldierCollectionList','soldierArmory','soldierClose','soldierLevelDisplay','soldierAbility','soldierRange','soldierMovement','soldierCooldown','soldierInventoryCount','soldierSkills','soldierCollectionTitle','soldierPortrait'])
    assert.ok(html.includes(`id="${id}"`),'kept id: '+id);
  assert.ok(!html.includes('soldierEquipped'),'the one-slot line is gone with the rework');
});

test('the reworked dossier styling: rail layout, phone doll, no hero photo',()=>{
  const css=readFileSync(new URL('../soldier-screen.css',import.meta.url),'utf8');
  assert.match(css,/\.soldier-body\{[^}]*grid-template-columns:264px/,'a dedicated identity rail');
  assert.doesNotMatch(css,/soldier-workbench\.jpg/,'the hero photo is gone - the soldier is the photo now (reported: complete rework)');
  assert.match(css,/\.soldier-doll\{[^}]*grid-template-areas/,'the paper doll positions figure and slots');
  const phone=css.slice(css.indexOf('@media(max-width:640px)'));
  assert.match(phone,/\.soldier-body\{[^}]*grid-template-columns:1fr/,'phone: single column');
  assert.match(phone,/\.soldier-doll\{[^}]*grid-template-areas:"figure"/,'phone: the doll stacks under the figure');
});

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

// Recursive helpers over the stub tree: text of a node and all its cells.
const flatten=node=>[node,...(node.children||[]).flatMap(flatten)];
const texts=node=>flatten(node).map(n=>n.textContent||'').filter(Boolean);
const cells=list=>list.children.map(li=>li.children[0]);
const ownedCells=list=>cells(list).filter(c=>c&&String(c.className).includes('is-owned'));

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
  // The board always shows the full 26-piece catalogue, all dashed so far.
  assert.equal(nodes.get('soldierCollectionList').children.length,26,'the progress grid lists every piece');
  assert.equal(ownedCells(nodes.get('soldierCollectionList')).length,0,'nothing owned, nothing filled');
  // The XP rail: level progress towards the next level, like the dossier.
  assert.equal(Number(nodes.get('soldierXpBar').value),progress.current);
  assert.equal(Number(nodes.get('soldierXpBar').max),progress.required);
  assert.match(nodes.get('soldierXpText').textContent,new RegExp(`^${progress.current} / ${progress.required} XP$`));
});

test('owned equipment fills the collection and the legacy note names the old piece',()=>{
  const {screen,nodes}=fixture({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}});
  screen.open();
  const items=soldierProfile({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}}).inventory.filter(i=>i.owned);
  assert.equal(ownedCells(nodes.get('soldierCollectionList')).length,items.length,'one filled cell per owned piece');
  assert.equal(nodes.get('soldierCollectionList').children.length,26,'the empty slots stay visible as dashed cells');
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
  for(const id of ['soldierDialog','soldierScreenTitle','soldierNameDisplay','soldierDamage','soldierCollectionEmpty','soldierCollectionList','soldierArmory','soldierClose','soldierLevelDisplay','soldierAbility','soldierRange','soldierMovement','soldierCooldown','soldierInventoryCount','soldierSkills','soldierCollectionTitle','soldierPortrait','soldierInvTabAll','soldierInvTabWeapon','soldierInvTabGear','soldierInvTabGadget','soldierInventorySearch','soldierItemDetails'])
    assert.ok(html.includes(`id="${id}"`),'kept id: '+id);
  assert.ok(!html.includes('soldierEquipped'),'the one-slot line is gone with the rework');
});

test('the inventory board filters by tab and search, details open on the first piece',()=>{
  const profile={...PROFILE,armory:{scrap:0,owned:0b11,equipped:1},workshop:WORKSHOP({owned:['legacy-1','legacy-2','marksman','boots'],equipped:['legacy-1','marksman']})};
  const {screen,nodes}=fixture(profile);
  screen.open();
  const list=nodes.get('soldierCollectionList');
  assert.equal(list.children.length,26,'full catalogue');
  assert.equal(ownedCells(list).length,4,'the two legacy bits plus the workshop pieces');
  // Details default to the first owned piece with the take toggle.
  const details=nodes.get('soldierItemDetails');
  assert.equal(details.hidden,false,'the details panel is open');
  assert.ok(texts(details).includes('Field Scope'),'the first owned piece is detailed');
  assert.ok(texts(details).includes('EQUIPPED'),'the worn state is shown');
  const action=flatten(details).find(n=>n.tag==='button');
  assert.ok(action&&action.textContent==='TAKEN','the worn piece offers the remove toggle');
  // Missing cells explain where the piece comes from instead of a button.
  nodes.get('soldierInvTabAll').onclick();
  const missing=cells(list).find(c=>String(c.className).includes('is-locked'));
  missing.onclick();
  const missingDetails=nodes.get('soldierItemDetails');
  assert.ok(texts(missingDetails).some(t=>t.includes('Found on completed waves')||t.includes('Armory workshop')||t.includes('finish')),'a missing piece names its source');
  assert.equal(flatten(missingDetails).some(n=>n.tag==='button'),false,'nothing owned, no take toggle');
  // Category tab narrows the grid to its slot.
  nodes.get('soldierInvTabGear').onclick();
  const gearOnly=cells(nodes.get('soldierCollectionList'));
  assert.ok(gearOnly.length>0&&gearOnly.length<26,'the gear tab filters the grid');
  const gearTitles=['Reinforced Vest','Combat Boots','Supply Satchel','Mechanic Kit','Field Boots','Convoy Plate','Tidelock Seal','Bridge Marker','Transformer Coil'];
  assert.ok(gearOnly.every(c=>gearTitles.includes(c.title)),'only gear titles remain');
  // Search narrows by name.
  nodes.get('soldierInvTabAll').onclick();
  nodes.get('soldierInventorySearch').oninput({target:{value:'scope'}});
  const found=cells(nodes.get('soldierCollectionList'));
  assert.equal(found.length,1,'search finds Field Scope');
  assert.equal(found[0].title,'Field Scope');
});

test('the details toggle takes a missing piece off and on through the service',async()=>{
  const profile={...PROFILE,workshop:WORKSHOP({owned:['marksman'],equipped:[]})};
  const calls=[];
  const {screen,nodes}=fixture(profile,{workshopService:{command:async command=>{calls.push(command);return {status:'saved',profile:{...profile,workshop:WORKSHOP({owned:['marksman'],equipped:['marksman']})}};}},onProfile:()=>{}});
  screen.open();
  const details=nodes.get('soldierItemDetails');
  assert.ok(texts(details).includes('Marksman Rifle'),'the first owned piece is detailed');
  const action=flatten(details).find(n=>n.tag==='button'&&n.textContent==='TAKE');
  assert.ok(action,'the unowned-by-slot piece offers TAKE');
  action.onclick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls,[{type:'equip',item:'marksman'}],'the details toggle uses the same service command');
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

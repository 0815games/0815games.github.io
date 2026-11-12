import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createSoldierScreen} from '../soldier-screen.mjs';
import {soldierProfile} from '../soldier-profile.mjs';
import {characterProgress} from '../progression.mjs';

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

function fixture(profile){
  const nodes=new Map();
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);},
    createElement:element,
    querySelector(){return null;},
  };
  const tr=(text,values={})=>String(text).replace(/\{(\w+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
  const screen=createSoldierScreen({document,translate:tr,
    getProfile:()=>profile,getPortrait:()=>'data:image/png;base64,portrait',
    onArmory:()=>{},onSkills:()=>{}});
  return {screen,nodes,document};
}

const PROFILE={name:'Test Soldier',gender:'male',xp:0,armory:null,skills:''};

test('the dossier renders identity, XP progress and the combat profile',()=>{
  const {screen,nodes}=fixture(PROFILE);
  screen.open();
  const data=soldierProfile(PROFILE),progress=characterProgress(0);
  assert.equal(nodes.get('soldierNameDisplay').textContent,'Test Soldier');
  assert.equal(nodes.get('soldierLevelDisplay').textContent,'LEVEL 1');
  assert.equal(nodes.get('soldierPortrait').src,'data:image/png;base64,portrait','the layered portrait from the account cache');
  assert.equal(nodes.get('soldierDamage').textContent,String(data.damage));
  assert.equal(nodes.get('soldierEquipped').textContent,'No equipment');
  assert.equal(nodes.get('soldierCollectionEmpty').hidden,false,'an empty collection says so');
  assert.equal(nodes.get('soldierCollectionList').children.length,0);
  // The XP rail: level progress towards the next level, like the dossier.
  assert.equal(Number(nodes.get('soldierXpBar').value),progress.current);
  assert.equal(Number(nodes.get('soldierXpBar').max),progress.required);
  assert.match(nodes.get('soldierXpText').textContent,new RegExp(`^${progress.current} / ${progress.required} XP$`));
});

test('owned equipment fills the collection and marks the equipped piece',()=>{
  const {screen,nodes}=fixture({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}});
  screen.open();
  const items=soldierProfile({...PROFILE,armory:{scrap:0,owned:0b11,equipped:1}}).inventory.filter(i=>i.owned);
  assert.equal(nodes.get('soldierCollectionList').children.length,items.length,'one row per owned piece');
  assert.equal(nodes.get('soldierCollectionEmpty').hidden,true);
  const equipped=nodes.get('soldierCollectionList').children.find(row=>row.classList===undefined?false:false)||null;
  assert.ok(nodes.get('soldierEquipped').textContent!=='No equipment','the equipped piece is named');
});

test('the reworked markup: identity rail with portrait and XP, panels on the right',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const rail=html.indexOf('soldier-id-visual'),name=html.indexOf('id="soldierNameDisplay"'),bar=html.indexOf('id="soldierXpBar"'),panels=html.indexOf('soldier-main');
  assert.ok(rail>=0&&name>rail&&bar>rail,'portrait, name and XP bar live in the identity rail');
  assert.ok(!html.includes('soldierDogTag'),'the dog tag is gone from the rail');
  assert.ok(panels>rail,'the three panels sit beside the rail');
  assert.ok(html.includes('id="soldierXpText"'),'the XP numbers are labelled');
  // The contract the browser smoke test pins stays intact.
  for(const id of ['soldierDialog','soldierScreenTitle','soldierNameDisplay','soldierDamage','soldierEquipped','soldierCollectionEmpty','soldierCollectionList','soldierArmory','soldierClose','soldierLevelDisplay','soldierAbility','soldierRange','soldierMovement','soldierCooldown','soldierEquippedEffect','soldierInventoryCount','soldierSkills','soldierCollectionTitle','soldierPortrait'])
    assert.ok(html.includes(`id="${id}"`),'kept id: '+id);
});

test('the reworked dossier styling: rail layout, phone showcase, no hero photo',()=>{
  const css=readFileSync(new URL('../soldier-screen.css',import.meta.url),'utf8');
  assert.match(css,/\.soldier-body\{[^}]*grid-template-columns:264px/,'a dedicated identity rail');
  assert.doesNotMatch(css,/soldier-workbench\.jpg/,'the hero photo is gone - the soldier is the photo now (reported: complete rework)');
  const phone=css.slice(css.indexOf('@media(max-width:640px)'));
  assert.match(phone,/\.soldier-body\{[^}]*grid-template-columns:1fr/,'phone: single column');
  assert.match(phone,/\.soldier-id-visual\{[^}]*display:flex/,'phone: the rail becomes a showcase row');
});

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/systems/armory-preview.js',import.meta.url),'utf8');
let checks=0;const test=(name,fn)=>{try{fn();checks++;}catch(error){error.message=name+': '+error.message;throw error;}};
class Element{constructor(tag){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.className='';this.textContent='';this.attrs={};this.hidden=false;this.id='';}append(...nodes){this.children.push(...nodes);}prepend(node){this.children.unshift(node);}replaceChildren(...nodes){this.children=nodes;}setAttribute(key,value){this.attrs[key]=value;}getAttribute(key){return this.attrs[key];}closest(selector){let node=this;while(node){if(selector==='.equip-slot-box'&&node.className==='equip-slot-box')return node;node=node.parent;}return null;}querySelector(selector){const find=node=>{if(selector[0]==='#'&&node.id===selector.slice(1)||selector[0]==='.'&&node.className.split(' ').includes(selector.slice(1)))return node;for(const child of node.children){const found=find(child);if(found)return found;}return null;};return find(this);}querySelectorAll(selector){const found=[];const walk=node=>{if(selector[0]==='.'&&node.className.split(' ').includes(selector.slice(1)))found.push(node);for(const child of node.children)walk(child);};walk(this);return found;}scrollIntoView(){}}
const doc={hidden:false,createElement:tag=>new Element(tag),querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>elements.get(id)||null};
const elements=new Map();
function setup(occupied){
 const calls=[];const player={name:'Held',heroClass:'warrior',level:6,hp:20,maxHp:75,maxMp:30,gold:10,atk:8,def:4,xp:0,nextXp:100,skillPoints:0,needsPreparation:false,inventory:[{id:'helm',count:1}],equipped:{head:occupied?'old':null}};
 const state={player,user:{uid:'user'},currentSlot:0,inCombat:false,world:{tiles:{}}};
 const cloud={auth:{currentUser:{uid:'user'}}};
 const items={helm:{slot:'head'}};
 const row={inventoryEquipAction(){calls.push('equip');player.inventory=[];player.equipped={head:'helm'};}};
 const detail=new Element('div');detail.id='inventory-detail-0';detail.parent=row;elements.set('inventory-detail-0',detail);
 const slotItem=new Element('div');slotItem.id='slot-item-head';slotItem.parent=slotBox;
 const slotBox=new Element('div');slotBox.className='equip-slot-box';slotBox.parent=slotItem;slotItem.children.push(slotBox);
 const grid=new Element('div');grid.className='equip-grid';grid.children.push(slotBox);
 const panel=new Element('section');panel.ownerDocument=doc;panel.children.push(grid);
 const context={state,cloud,ITEMS:items,document:doc,console};
 vm.runInNewContext(source.replace(/^import .*;\n/gm,'').replace('export function','function')+'\nthis.render=renderArmory;this.equip=equipSlotChoice;',context);
 const ticket={player,slot:'head',section:null,uid:'user',saveSlot:0,world:state.world,tiles:state.world.tiles,inventory:player.inventory,equipped:player.equipped,busy:false,done:false};
 const item={index:0,entry:player.inventory[0],id:'helm',count:1};
 return {player,state,cloud,items,row,calls,ticket,item,render:context.render,equip:(section)=>{ticket.section=section;return context.equip(ticket,item,doc);}};
}
function openChoices(h){const section=new Element('section');section.isConnected=true;h.ticket.section=section;return section;}
for(const occupied of [false,true])test((occupied?'occupied':'empty')+' slot equips once',()=>{const h=setup(occupied),section=openChoices(h);assert.equal(h.equip(section),true);assert.equal(h.player.equipped.head,'helm');assert.equal(h.calls.length,1);assert.equal(h.equip(section),false);assert.equal(h.calls.length,1);});
for(const occupied of [false,true])for(const change of [h=>h.state.inCombat=true,h=>h.state.currentSlot=1,h=>h.cloud.auth.currentUser=null,h=>h.state.player={...h.player},h=>h.state.world.tiles={},h=>h.player.inventory=[...h.player.inventory],h=>h.player.inventory[0].count=2,h=>h.player.equipped.head='other',h=>doc.hidden=true,h=>h.ticket.section.isConnected=false])test((occupied?'occupied':'empty')+' slot rejects changed context',()=>{const h=setup(occupied),section=openChoices(h);change(h);assert.equal(h.equip(section),false);assert.equal(h.calls.length,0);});
for(const occupied of [false,true])test((occupied?'occupied':'empty')+' slot rejects invalid item',()=>{const h=setup(occupied),section=openChoices(h);h.item.count=2;assert.equal(h.equip(section),false);assert.equal(h.calls.length,0);});
for(const occupied of [false,true])test((occupied?'occupied':'empty')+' slot requires existing action',()=>{const h=setup(occupied),section=openChoices(h);delete h.row.inventoryEquipAction;assert.equal(h.equip(section),false);assert.equal(h.calls.length,0);});
for(const occupied of [false,true])test((occupied?'occupied':'empty')+' slot keeps ticket reusable after action error',()=>{const h=setup(occupied),section=openChoices(h);h.row.inventoryEquipAction=()=>{throw new Error('action failed');};assert.equal(h.equip(section),false);assert.equal(h.ticket.busy,false);assert.equal(h.ticket.done,false);});
console.log(JSON.stringify({checks,passed:checks,scope:'Actual unified empty/occupied slot adapter with state/auth/DOM/action doubles; no browser, Firebase or real inventory-action test.'}));

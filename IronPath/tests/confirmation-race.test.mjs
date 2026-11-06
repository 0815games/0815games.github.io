import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createConfirmation} from '../confirmation.mjs';
test('a delayed close event from the previous prompt does not cancel the new one',async()=>{
 const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{open:false,addEventListener(type,fn){this['on'+type]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};const confirmation=createConfirmation({getElementById:el});const first=confirmation.ask({title:'First',text:'First'});el('gameConfirmCancel').onclick();assert.equal(await first,false);const second=confirmation.ask({title:'Second',text:'Second'});el('gameConfirm').onclose();assert.equal(el('gameConfirm').open,true);el('gameConfirmAccept').onclick();assert.equal(await second,true);
});

test('backdrop cancels rather than accepts a confirmation',async()=>{const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{open:false,addEventListener(type,fn){this['on'+type]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);},confirm=createConfirmation({getElementById:el}),answer=confirm.ask({title:'Spend?',text:'Sure?'}),d=el('gameConfirm'),e={target:d,button:0,clientX:-1,clientY:-1,preventDefault(){}};d.onpointerdown(e);d.onclick(e);assert.equal(await answer,false);});

test('an open confirmation can change language without changing its pending decision',async()=>{
 const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{open:false,textContent:'',addEventListener(type,fn){this['on'+type]=fn;},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};let de=false;const tr=text=>de?({'End this run?':'Diesen Einsatz beenden?','END RUN':'EINSATZ BEENDEN'}[text]||text):text;const confirmation=createConfirmation({getElementById:el},tr),answer=confirmation.ask({title:'End this run?',text:'Text',accept:'END RUN'});assert.equal(el('gameConfirmTitle').textContent,'End this run?');de=true;confirmation.refresh();assert.equal(el('gameConfirmTitle').textContent,'Diesen Einsatz beenden?');assert.equal(el('gameConfirmAccept').textContent,'EINSATZ BEENDEN');assert.equal(el('gameConfirm').open,true);de=false;confirmation.refresh();assert.equal(el('gameConfirmTitle').textContent,'End this run?');el('gameConfirmCancel').onclick();assert.equal(await answer,false);
});

// Moved here from controls-stage1.test.mjs when that file went with the retired
// skill-tree pan/zoom. These are the only tests that check the plain answers:
// accept, decline, and a programmatic cancel from outside the dialog.
test('accept, decline and an outside cancel all resolve the pending question',async()=>{
 const nodes={};for(const id of ['gameConfirm','gameConfirmTitle','gameConfirmText','gameConfirmAccept','gameConfirmCancel'])nodes[id]={textContent:'',open:false,handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},showModal(){this.open=true},close(){this.open=false;this.handlers.close?.()}};
 const c=createConfirmation({getElementById:id=>nodes[id]});
 let p=c.ask({title:'Confirm',text:'Proceed?'});assert.equal(nodes.gameConfirm.open,true);nodes.gameConfirmAccept.onclick();assert.equal(await p,true);
 p=c.ask({title:'Again',text:'Proceed?'});nodes.gameConfirm.handlers.cancel({preventDefault(){}});assert.equal(await p,false);
 p=c.ask({title:'Cancel',text:'Proceed?'});c.cancel();assert.equal(await p,false);assert.equal(nodes.gameConfirm.open,false);
});

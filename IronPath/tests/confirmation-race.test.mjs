import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createConfirmation} from '../confirmation.mjs';
test('a delayed close event from the previous prompt does not cancel the new one',async()=>{
 const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,{open:false,addEventListener(type,fn){this['on'+type]=fn;},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};const confirmation=createConfirmation({getElementById:el});const first=confirmation.ask({title:'First',text:'First'});el('gameConfirmCancel').onclick();assert.equal(await first,false);const second=confirmation.ask({title:'Second',text:'Second'});el('gameConfirm').onclose();assert.equal(el('gameConfirm').open,true);el('gameConfirmAccept').onclick();assert.equal(await second,true);
});

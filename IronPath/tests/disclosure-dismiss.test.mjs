import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bindDisclosureDismiss} from '../disclosure-dismiss.mjs';
test('outside click closes disclosures without cancelling the underlying click',()=>{
 const events={},a={open:true,contains:t=>t==='a'},b={open:true,contains:t=>t==='b'},doc={addEventListener(type,fn){events[type]=fn;},querySelectorAll:()=>[a,b].filter(d=>d.open),querySelector:()=>null};bindDisclosureDismiss(doc);events.click({target:'a'});assert.equal(a.open,true);assert.equal(b.open,false);events.click({target:'elsewhere'});assert.equal(a.open,false);a.open=true;events.keydown({key:'Escape'});assert.equal(a.open,false);
});
test('Escape in a modal leaves underlying disclosures alone',()=>{const events={},d={open:true},doc={addEventListener(type,fn){events[type]=fn;},querySelectorAll:()=>[d],querySelector:()=>({})};bindDisclosureDismiss(doc);events.keydown({key:'Escape'});assert.equal(d.open,true);});

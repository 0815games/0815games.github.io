import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const itemsURL=moduleURL(await readFile(new URL('../js/data/items.js',import.meta.url),'utf8'));
const source=await readFile(new URL('../js/systems/inventory.js',import.meta.url),'utf8');
const api=await import(moduleURL(source.replace("'../data/items.js'",JSON.stringify(itemsURL))));
const {ITEMS}=await import(itemsURL);
let checks=0;
function check(fn){fn();checks++;}
function unchanged(fn,inv,reason){const before=structuredClone(inv),refs=inv.slice();assert.deepEqual(fn(),{ok:false,reason});assert.deepEqual(inv,before);refs.forEach((s,i)=>assert.equal(inv[i],s));}
check(()=>{const inv=[{id:'health_potion',count:8},...Array.from({length:14},()=>({id:'iron_sword',count:1}))];unchanged(()=>api.tryAddItem(inv,'health_potion',2),inv,'INVENTORY_FULL');});
check(()=>{const inv=[{id:'health_potion',count:1}];unchanged(()=>api.tryRemoveItem(inv,'health_potion',2),inv,'INSUFFICIENT_ITEMS');});
for(const count of [0,-1,1.5,NaN,Infinity,'1',Number.MAX_SAFE_INTEGER+1])for(const op of ['tryAddItem','tryRemoveItem'])check(()=>{const inv=[];unchanged(()=>api[op](inv,'health_potion',count),inv,'INVALID_COUNT');});
for(const id of ['missing','__proto__','constructor'])for(const op of ['tryAddItem','tryRemoveItem'])check(()=>{const inv=[];unchanged(()=>api[op](inv,id),inv,'UNKNOWN_ITEM');});
check(()=>{const inv=[];assert.equal(api.addItem(inv,'iron_sword'),true);assert.equal(api.removeItem(inv,'iron_sword'),true);assert.equal(api.removeItem(inv,'iron_sword'),false);});
check(()=>{const inv=new Array(1);assert.deepEqual(api.tryAddItem(inv,'iron_sword'),{ok:false,reason:'INVALID_INVENTORY'});assert.equal(0 in inv,false);});
check(()=>{const inv=[{id:'health_potion',count:10}];unchanged(()=>api.tryRemoveItem(inv,'health_potion'),inv,'INVALID_INVENTORY');});
check(()=>{ITEMS.s01a_test_item={stack:1};try{const inv=[];assert.equal(api.addItem(inv,'s01a_test_item'),true);}finally{delete ITEMS.s01a_test_item;}});
check(()=>{const inv=[];assert.equal(api.addItem(inv,'health_potion',20),true);assert.deepEqual(inv.map(s=>s.count),[9,9,2]);assert.equal(api.removeItem(inv,'health_potion',19),true);assert.equal(api.countItem(inv,'health_potion'),1);});
let seed=12345;function rnd(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;}
for(let i=0;i<1000;i++)check(()=>{
 const inv=Array.from({length:rnd(16)},()=>rnd(2)?{id:'health_potion',count:1+rnd(9)}:{id:'iron_sword',count:1});
 const before=structuredClone(inv),id=rnd(2)?'health_potion':'iron_sword',count=1+rnd(25),total=api.countItem(inv,id),remove=rnd(2)===1;
 const expected=remove?total>=count:count<=inv.reduce((sum,s)=>sum+(s.id===id?ITEMS[id].stack-s.count:0),0)+(15-inv.length)*ITEMS[id].stack;
 const result=remove?api.tryRemoveItem(inv,id,count):api.tryAddItem(inv,id,count);
 assert.equal(result.ok,expected);
 if(!result.ok)assert.deepEqual(inv,before);
 else{assert.equal(api.countItem(inv,id),total+(remove?-count:count));assert.ok(inv.length<=15);assert.ok(inv.every(s=>s.count>0&&s.count<=ITEMS[s.id].stack));assert.deepEqual(inv.filter(s=>s.id!==id),before.filter(s=>s.id!==id));}
});
console.log(JSON.stringify({checks,passed:checks,failed:0,scope:'S01a inventory unit tests; no browser or Firebase'}));

"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../src/social/social-store.js');
const {ownCodeCard}=require('../src/social/social-ui.js');
const CODE='Abcd_0123456789-EfghIJKL';
function fixture({enabled=true}={}){
 const calls=[],pending=[];
 const client={has:()=>enabled,watch(uid,next){next({available:enabled,friends:[],requests:[]});return()=>{};},invoke(name,payload){calls.push({name,payload});return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
 const store=create(client);store.setUser('alice');return {store,calls,pending};
}
const tick=()=>new Promise(setImmediate);
test('Anonymous user never calls getCode',async()=>{const f=fixture();f.store.setUser(null);assert.equal(await f.store.loadCode(),false);assert.equal(f.calls.length,0);});
test('Disabled feature never calls backend',async()=>{const f=fixture({enabled:false});assert.equal(await f.store.loadCode(),false);assert.equal(f.calls.length,0);});
test('Code is loaded from getCode and cached',async()=>{const f=fixture();const p=f.store.loadCode();assert.equal(f.store.snapshot().codeLoading,true);await tick();assert.deepEqual(f.calls,[{name:'getCode',payload:{}}]);f.pending[0].resolve({friendCode:CODE});assert.equal(await p,CODE);assert.equal(f.store.snapshot().friendCode,CODE);assert.equal(await f.store.loadCode(),CODE);assert.equal(f.calls.length,1);});
test('Concurrent loads share one request',async()=>{const f=fixture();const a=f.store.loadCode(),b=f.store.loadCode();assert.equal(a,b);await tick();assert.equal(f.calls.length,1);f.pending[0].resolve({friendCode:CODE});await a;});
test('Backend error permits retry',async()=>{const f=fixture();const p=f.store.loadCode();await tick();f.pending[0].reject(Error('network'));assert.equal(await p,false);assert.equal(f.store.snapshot().codeLoading,false);assert.ok(f.store.snapshot().codeError);const second=f.store.loadCode();await tick();f.pending[1].resolve({friendCode:CODE});assert.equal(await second,CODE);});
for(const value of [null,'short','<script>alert(1)</script>',3])test('Invalid code response '+JSON.stringify(value),async()=>{const f=fixture();const p=f.store.loadCode();await tick();f.pending[0].resolve({friendCode:value});assert.equal(await p,false);assert.equal(f.store.snapshot().friendCode,null);});
test('Logout clears cached code',async()=>{const f=fixture();const p=f.store.loadCode();await tick();f.pending[0].resolve({friendCode:CODE});await p;assert.equal(f.store.snapshot().friendCode,CODE);f.store.setUser(null);assert.equal(f.store.snapshot().friendCode,null);assert.equal(f.store.snapshot().codeLoading,false);});
test('Late result after account change is discarded',async()=>{const f=fixture();const old=f.store.loadCode();await tick();f.store.setUser('bob');const fresh=f.store.loadCode();await tick();f.pending[0].resolve({friendCode:CODE});await old;assert.equal(f.store.snapshot().friendCode,null);assert.equal(f.store.snapshot().codeLoading,true);f.pending[1].resolve({friendCode:'B'.repeat(24)});await fresh;assert.equal(f.store.snapshot().friendCode,'B'.repeat(24));});
test('Logout before dispatch prevents backend request',async()=>{const f=fixture();const p=f.store.loadCode();f.store.setUser(null);await p;assert.equal(f.calls.length,0);});
function dom(){
 const doc={activeElement:null};doc.createElement=tag=>({tagName:tag,children:[],dataset:{},style:{},attrs:{},isConnected:true,textContent:'',append(...nodes){this.children.push(...nodes);},setAttribute(k,v){this.attrs[k]=v;},focus(){doc.activeElement=this;},select(){this.selected=true;},setSelectionRange(a,b){this.selection=[a,b];}});return doc;
}
function nodes(root){return [root,...root.children.flatMap(nodes)];}
function cardFixture({clipboard,code=CODE,enabled=true}={}){const doc=dom();let state={uid:'alice',friendCode:code,codeLoading:false,codeError:null};let loads=0;const store={snapshot:()=>({...state}),has:()=>enabled,loadCode:()=>loads++};const card=ownCodeCard({doc,win:{navigator:{clipboard}},store});return {doc,card,get loads(){return loads;},setUser(uid){state.uid=uid;},find:tag=>nodes(card).find(n=>n.tagName===tag),note:()=>nodes(card).find(n=>n.id==='if-social-own-code-note')};}
test('Own code field is readonly and exact',()=>{const f=cardFixture();assert.equal(f.find('input').value,CODE);assert.equal(f.find('input').readOnly,true);});
test('Copy button copies exact code',async()=>{let copied;const f=cardFixture({clipboard:{writeText:async value=>copied=value}});await f.find('button').onclick();assert.equal(copied,CODE);assert.equal(f.note().textContent,'Freundescode kopiert.');});
test('Missing clipboard selects field without browser prompt',async()=>{const f=cardFixture();await f.find('button').onclick();assert.equal(f.find('input').selected,true);assert.deepEqual(f.find('input').selection,[0,CODE.length]);assert.match(f.note().textContent,/manuell/);});
test('Clipboard rejection uses manual fallback',async()=>{const f=cardFixture({clipboard:{writeText:async()=>{throw Error('denied');}}});await f.find('button').onclick();assert.equal(f.find('input').selected,true);});
test('Old card cannot copy after account switch',async()=>{let writes=0;const f=cardFixture({clipboard:{writeText:async()=>writes++}});f.setUser('bob');await f.find('button').onclick();assert.equal(writes,0);});
test('Disabled backend displays no placeholder code or copy button',()=>{const f=cardFixture({enabled:false,code:null});assert.equal(f.find('input'),undefined);assert.equal(f.find('button'),undefined);assert.match(f.note().textContent,/freigeschaltet/);});
test('Code load button invokes loader',()=>{const f=cardFixture({code:null});f.find('button').onclick();assert.equal(f.loads,1);});

test('Late clipboard completion does not update another account UI',async()=>{let resolve;const f=cardFixture({clipboard:{writeText:()=>new Promise(done=>resolve=done)}});const p=f.find('button').onclick();f.setUser('bob');resolve();await p;assert.notEqual(f.note().textContent,'Freundescode kopiert.');});
test('Removed card receives no clipboard feedback',async()=>{let resolve;const f=cardFixture({clipboard:{writeText:()=>new Promise(done=>resolve=done)}});const p=f.find('button').onclick();f.card.isConnected=false;resolve();await p;assert.notEqual(f.note().textContent,'Freundescode kopiert.');});

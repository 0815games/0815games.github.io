import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMaintenanceUI} from '../maintenance-ui.mjs';

const turn=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(initial='open'){
 const ids=['maintenanceGate','maintenanceTitle','maintenanceDetail','maintenanceExtra','maintenanceRetry','maintenanceLanguage'];
 const nodes=new Map(ids.map(id=>[id,{id,hidden:true,open:false,textContent:'',disabled:false,onclick:null,showModal(){this.open=true;},close(){this.open=false;},setAttribute(){this.open=true;},addEventListener(type,cb){this[`on${type}`]=cb;}}]));
 const doc={documentElement:{lang:'de'},getElementById:id=>nodes.get(id)};let status=initial,id=0;const timers=new Map(),navigations=[];
 const win={location:{href:'https://example.test/IronPath/',replace:target=>navigations.push(target)},localStorage:{getItem:()=> 'de'},
  setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
 const fetcher=async()=>status==='unavailable'?new Response('offline',{status:503}):new Response(JSON.stringify({format:1,mode:status,authAfterMs:0}));
 const ui=createMaintenanceUI({document:doc,window:win,databaseUrl:'https://demo.firebaseio.com',fetcher,intervalMs:15000});
 return {ui,nodes,navigations,setStatus:s=>{status=s;},timers,async tick(){const [key,{fn}]=timers.entries().next().value;timers.delete(key);fn();await turn();}};
}

test('opening waits for fresh Firebase status and retries maintenance without initializing the game',async()=>{
 const f=fixture('maintenance');let resolved=false;const ready=f.ui.waitForOpen().then(value=>{resolved=true;return value;});await turn();
 assert.equal(resolved,false);assert.equal(f.nodes.get('maintenanceGate').open,true);assert.match(f.nodes.get('maintenanceTitle').textContent,/Wartung/);
 let prevented=false;f.nodes.get('maintenanceGate').oncancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);
 f.setStatus('open');await f.tick();const result=await ready;assert.equal(result.delayed,true);assert.equal(result.control.mode,'open');assert.equal(f.nodes.get('maintenanceGate').hidden,true);
 const second=await f.ui.waitForOpen();assert.equal(second.delayed,false,'the second status must be a new probe');
});

test('maintenance text can be switched between German and English before the game loads',async()=>{
 const f=fixture('maintenance');f.ui.waitForOpen();await turn();
 assert.match(f.nodes.get('maintenanceTitle').textContent,/Wartung/);
 f.nodes.get('maintenanceLanguage').onclick();assert.match(f.nodes.get('maintenanceTitle').textContent,/Maintenance/);
 assert.equal(f.nodes.get('maintenanceGate').lang,'en');
 f.nodes.get('maintenanceLanguage').onclick();assert.match(f.nodes.get('maintenanceTitle').textContent,/Wartung/);
});

test('failed account module loading stays blocked and offers a fresh document',async()=>{
 const f=fixture('open');await f.ui.waitForOpen();f.ui.loadFailure();
 assert.equal(f.nodes.get('maintenanceGate').open,true);assert.match(f.nodes.get('maintenanceDetail').textContent,/Spieldateien/);
 assert.equal(f.nodes.get('maintenanceExtra').hidden,true,'no session was necessarily running');
 f.nodes.get('maintenanceRetry').onclick();await turn();assert.equal(f.navigations.length,1);
});

test('an unavailable status stays blocked, and manual retry can recover',async()=>{
 const f=fixture('unavailable'),result=f.ui.waitForOpen();await turn();assert.equal(f.nodes.get('maintenanceGate').open,true);assert.match(f.nodes.get('maintenanceDetail').textContent,/nicht geprüft/);
 f.setStatus('open');f.nodes.get('maintenanceRetry').onclick();assert.equal((await result).delayed,true);assert.equal(f.nodes.get('maintenanceGate').hidden,true);
});

test('an ended live session remains blocked and reloads a fresh document only after sign-out settles',async()=>{
 const f=fixture('open');await f.ui.waitForOpen();let finish;const signout=new Promise(resolve=>{finish=resolve;});f.ui.halt('maintenance',signout);
 assert.equal(f.nodes.get('maintenanceGate').open,true);assert.match(f.nodes.get('maintenanceExtra').textContent,/nicht bestätigte Speicherungen/);
 await f.tick();assert.match(f.nodes.get('maintenanceTitle').textContent,/verfügbar/);f.nodes.get('maintenanceRetry').onclick();await turn();assert.deepEqual(f.navigations,[],'sign-out is still pending');
 finish();await turn();assert.equal(f.navigations.length,1);assert.equal(new URL(f.navigations[0]).searchParams.has('_ip_nonce'),true);
});

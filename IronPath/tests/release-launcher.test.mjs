import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createReleaseLauncher} from '../release-tools/release-launcher.mjs';

const config={firebase:{apiKey:'fake-public-key',authDomain:'demo-ironpath.firebaseapp.com',
 databaseURL:'https://demo-ironpath.firebaseio.com',projectId:'demo-ironpath'},sessionEndpoint:'https://release.example/api/session'};
const open={mode:'open',build:'site-1',epoch:'a'.repeat(32),authAfterMs:1000000};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function until(predicate){
 for(let n=0;n<200;n++){if(predicate())return;await new Promise(resolve=>setImmediate(resolve));}
 throw Error('Condition was not reached');
}
function setup({initial=open,verify,manualRetry=false,onView,navigate}={}){
 let status=initial;const views=[],navigations=[],checks=[];
 const launcher=createReleaseLauncher({config,origin:'https://game.example',manualRetry,intervalMs:60000,
  fetcher:async(url,options)=>{checks.push({url,options});if(status instanceof Error)throw status;return new Response(JSON.stringify(status));},
  verify:verify??(async({build})=>`/IronPath/releases/${build}/`),
  onView:value=>{views.push(value);return onView?.(value);},
  navigate:value=>{navigations.push(value);return navigate?.(value);}
 });
 return {launcher,views,navigations,checks,setStatus:value=>{status=value;}};
}

test('the launcher rechecks open status after verification and navigates only to the fixed build path',async()=>{
 const h=setup();h.launcher.start();await until(()=>h.navigations.length===1);
 assert.deepEqual(h.navigations,['/IronPath/releases/site-1/']);
 assert.equal(h.views[0],'checking');assert.ok(h.views.includes('updating'));
 assert.ok(h.checks.length>=2,'verification is followed by a fresh control check');
 assert.ok(h.checks.every(c=>c.url==='https://demo-ironpath.firebaseio.com/_ironpathRelease.json'&&c.options.cache==='no-store'));
 h.launcher.stop();
});

test('a late verified build cannot navigate after maintenance or a newer release',async()=>{
 const jobs=[];
 const h=setup({verify:options=>{const d=deferred();jobs.push({...d,options});return d.promise;}});
 h.launcher.start();await until(()=>jobs.length===1);
 h.setStatus({...open,mode:'maintenance'});await h.launcher.refresh();
 assert.equal(jobs[0].options.signal.aborted,true);jobs[0].resolve('/IronPath/releases/site-1/');
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(h.navigations,[]);assert.equal(h.views.at(-1),'maintenance');
 h.setStatus({...open,build:'site-2',epoch:'b'.repeat(32)});await h.launcher.refresh();await until(()=>jobs.length===2);
 jobs[1].resolve('/IronPath/releases/site-2/');await until(()=>h.navigations.length===1);
 assert.deepEqual(h.navigations,['/IronPath/releases/site-2/']);h.launcher.stop();
});

test('a fresh status failure during the final check never opens the game',async()=>{
 const d=deferred(),h=setup({verify:()=>d.promise});h.launcher.start();
 await until(()=>h.views.includes('updating'));h.setStatus(new Error('offline'));
 d.resolve('/IronPath/releases/site-1/');await until(()=>h.views.at(-1)==='unavailable');
 assert.deepEqual(h.navigations,[]);h.launcher.stop();
});

test('an unavailable return or failed artifact requires an explicit retry and cannot loop',async()=>{
 let verifies=0;
 const h=setup({manualRetry:true,verify:async()=>{verifies++;if(verifies===1)throw Error('broken build');return '/IronPath/releases/site-1/';}});
 h.launcher.start();await until(()=>h.views.at(-1)==='unavailable');
 assert.equal(verifies,0);await h.launcher.refresh();assert.equal(verifies,0);
 await h.launcher.retry();await until(()=>verifies===1&&h.views.at(-1)==='unavailable');
 await h.launcher.refresh();assert.equal(verifies,1,'no repeated download or redirect loop');
 await h.launcher.retry();await until(()=>h.navigations.length===1);assert.equal(verifies,2);h.launcher.stop();
});

test('bad destinations, asynchronous callbacks and a stopped launcher fail closed',async()=>{
 const bad=setup({verify:async()=> 'https://attacker.example/'});bad.launcher.start();
 await until(()=>bad.views.at(-1)==='unavailable');assert.deepEqual(bad.navigations,[]);bad.launcher.stop();
 const broken=setup({onView:async()=>{throw Error('broken renderer');}});broken.launcher.start();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(broken.checks.length,0);assert.deepEqual(broken.navigations,[]);
 const d=deferred(),stopped=setup({verify:()=>d.promise});stopped.launcher.start();
 await until(()=>stopped.views.includes('updating'));stopped.launcher.stop();d.resolve('/IronPath/releases/site-1/');
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(stopped.navigations,[]);
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {createMaintenanceProbe,createMaintenanceMonitor,parseMaintenanceControl,isSessionAfterCutoff,MAINTENANCE_PATH} from '../maintenance-check.mjs';
import {buildMaintenanceRulesCandidate,MAINTENANCE_GATE} from '../release-tools/maintenance-rules.mjs';
import {buildSocialCleanupCandidate} from '../firebase/social-cleanup-candidate.mjs';

const open={format:1,mode:'open',authAfterMs:0};

test('the early maintenance probe and normal account use the same public database',async()=>{
 const account=await readFile(new URL('../account.js',import.meta.url),'utf8'),html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const admin=await readFile(new URL('../admin.html',import.meta.url),'utf8');
 const url=/<meta name="ironpath-maintenance-database" content="([^"]+)">/.exec(html)?.[1];
 const adminUrl=/<meta name="ironpath-admin-database-url" content="([^"]+)">/.exec(admin)?.[1];
 assert.ok(url);assert.ok(account.includes(`databaseURL:'${url}'`));assert.equal(adminUrl,url,'admin and game target the same public instance');
 assert.match(account,/maintenanceBoot\.databaseUrl!==accountServiceOptions\.config\.databaseURL/,'a mismatch stops startup');
});

test('the public maintenance record is small, strict and fails closed',()=>{
 assert.deepEqual(parseMaintenanceControl(open),open);
 for(const value of [null,[],{}, {...open,mode:'opened'}, {...open,format:2}, {...open,authAfterMs:-1}, {...open,authAfterMs:0.1}, {...open,authAfterMs:'0'}, {...open,extra:true}])assert.equal(parseMaintenanceControl(value),null);
});

test('status uses only the configured Firebase database with a fresh bounded request',async()=>{
 const calls=[];let value=open;
 const probe=createMaintenanceProbe({databaseUrl:'https://demo-ironpath-default-rtdb.europe-west1.firebasedatabase.app',fetcher:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(value));}});
 assert.deepEqual(await probe(),open);value={...open,mode:'maintenance'};assert.deepEqual(await probe(),value);
 assert.notEqual(calls[0].url,calls[1].url);assert.equal(new URL(calls[0].url).pathname,`/${MAINTENANCE_PATH}.json`);assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.redirect,'error');
 value={...open,extra:'x'};assert.equal(await probe(),null);
 const big=createMaintenanceProbe({databaseUrl:'https://demo.firebaseio.com',fetcher:async()=>new Response('x'.repeat(1025))});assert.equal(await big(),null);
 const stalled=createMaintenanceProbe({databaseUrl:'https://demo.firebaseio.com',timeoutMs:10,fetcher:()=>new Promise(()=>{})});assert.equal(await stalled(),null);
 for(const url of ['http://demo.firebaseio.com','https://evil.test','https://demo.firebaseio.com/path','https://user@demo.firebaseio.com','https://demo.firebaseio.com?x=1'])assert.throws(()=>createMaintenanceProbe({databaseUrl:url}),/Invalid/);
});

test('a monitor ends the document on maintenance, a rotated cutoff or loss of authorization',()=>{
 for(const [change,reason] of [[{...open,mode:'maintenance'},'maintenance'],[{...open,authAfterMs:1000},'session'],[null,'unavailable']]){
  let accept,fail,stops=0;const halted=[];
  const monitor=createMaintenanceMonitor({initial:open,subscribe:(next,error)=>{accept=next;fail=error;return ()=>stops++;},onHalt:r=>halted.push(r)});
  accept(open);assert.deepEqual(halted,[]);accept(change);assert.deepEqual(halted,[reason]);assert.equal(monitor.isStopped(),true);assert.equal(stops,1);accept(open);fail();assert.deepEqual(halted,[reason]);
 }
 const halted=[];createMaintenanceMonitor({initial:open,subscribe:()=>{throw Error('denied');},onHalt:r=>halted.push(r)});assert.deepEqual(halted,['unavailable']);
});

test('a synchronous first listener event still unsubscribes exactly once',()=>{
 let stops=0;const events=[];
 createMaintenanceMonitor({initial:open,subscribe:next=>{next({...open,mode:'maintenance'});return ()=>stops++;},onHalt:r=>events.push(r)});
 assert.deepEqual(events,['maintenance']);assert.equal(stops,1);
});

test('auth_time must be after the cutoff, not just a refreshed token',()=>{
 assert.equal(isSessionAfterCutoff(10,0),true);assert.equal(isSessionAfterCutoff(10,9999),true);assert.equal(isSessionAfterCutoff(10,10000),false);assert.equal(isSessionAfterCutoff(10,10001),false);
 for(const value of [null,'11',0,1.1,Infinity])assert.equal(isSessionAfterCutoff(value,1),false);
});

test('the Firebase-only candidate wraps every grant and leaves control public/read-only',async()=>{
 const source=buildSocialCleanupCandidate(await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url)));
 const {candidate,counts}=buildMaintenanceRulesCandidate(source);assert.equal(counts.readWrapped,45);assert.equal(counts.writeWrapped,41);
 assert.deepEqual(candidate.rules[MAINTENANCE_PATH],{'.read':true,'.write':false});assert.equal(candidate.rules['.read'],false);assert.equal(candidate.rules['.write'],false);
 assert.match(candidate.rules.players.$uid['.read'],/auth\.token\.auth_time/);assert.ok(candidate.rules.players.$uid['.read'].includes(MAINTENANCE_GATE));
 assert.equal(candidate.rules.players.$uid.xp['.validate'],source.rules.players.$uid.xp['.validate']);
 assert.doesNotMatch(MAINTENANCE_GATE,/ip_release_epoch|sign_in_provider|custom/,'no Vercel or custom tokens');
 const withAdmin=buildMaintenanceRulesCandidate(source,{adminUid:'example-admin'}).candidate.rules[MAINTENANCE_PATH];
 assert.match(withAdmin['.write'],/auth\.uid === 'example-admin'/);
 assert.match(withAdmin['.write'],/\.val\(\) === now/);assert.equal(withAdmin.$other['.validate'],false);
 assert.throws(()=>buildMaintenanceRulesCandidate(source,{adminUid:"x' || true"}),/UID/);
 assert.throws(()=>buildMaintenanceRulesCandidate({rules:{'.read':true,'.write':false}}),/Root/);
 assert.throws(()=>buildMaintenanceRulesCandidate({rules:{'.read':false,'.write':false,$path:{'.read':true}}}),/wildcard/);
 assert.throws(()=>buildMaintenanceRulesCandidate({rules:{'.read':false,'.write':false,[MAINTENANCE_PATH]:{}}}),/audit/);
 assert.throws(()=>buildMaintenanceRulesCandidate({rules:{'.read':false,'.write':false,foo:{'.unexpected':true}}}),/Unknown/);
});

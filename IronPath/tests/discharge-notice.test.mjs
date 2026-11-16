import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createDischargeNotice,createDischargeSignOut,DISCHARGE_MESSAGE} from '../discharge-notice.mjs';
import {germanMoreStatic} from '../localization-more-static-de.mjs';

function store(){const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};}

test('the confirmed deletion notice is one-shot, tab-local and contains no identity',()=>{
 const storage=store(),notice=createDischargeNotice(storage),alice={uid:'alice'};
 assert.equal(notice.observe(null),false,'no deletion means no notice');
 notice.arm(alice);assert.deepEqual([...storage.data.values()],['confirmed']);
 assert.equal(notice.observe(alice),false,'the existing session is not the login page');
 assert.equal(notice.observe(null),true);assert.equal(notice.observe(null),false,'a second login screen does not repeat it');
 assert.equal(germanMoreStatic[DISCHARGE_MESSAGE],'Dein Charakter wurde aus dem Dienst entlassen. Bitte melde dich erneut an.');
});

test('a guarded document replacement delivers the notice only on a signed-out screen',()=>{
 const storage=store(),before=createDischargeNotice(storage),alice={uid:'alice'};before.arm(alice);
 const after=createDischargeNotice(storage);assert.equal(after.observe(null),true);assert.equal(after.observe(null),false);
 before.arm(alice);const stillSignedIn=createDischargeNotice(storage);assert.equal(stillSignedIn.observe(alice),false);assert.equal(stillSignedIn.observe(null),false,'a new document with an active user clears an unconfirmed sign-out');
});

test('failed sign-out, account changes and denied storage cannot leak a stale notice',()=>{
 const storage=store(),notice=createDischargeNotice(storage),alice={uid:'alice'};
 notice.arm(alice);notice.cancel();assert.equal(notice.observe(null),false,'failed sign-out clears the marker');
 notice.arm(alice);notice.observe({uid:'bob'});assert.equal(notice.observe(null),false,'another account clears the old attempt');
 notice.arm(alice);notice.observe({uid:'alice'});assert.equal(notice.observe(null),false,'a replacement session with the same account also clears the old attempt');
 const broken=createDischargeNotice({setItem(){throw Error('blocked');},getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}});
 broken.arm(alice);assert.equal(broken.observe(null),true,'same-document fallback works without storage');assert.equal(broken.observe(null),false);
});

test('failed sign-out is distinct from deletion and can be retried without reenlistment',async()=>{
 const storage=store(),notice=createDischargeNotice(storage),alice={uid:'alice'},auth={currentUser:alice};let version=1,failures=0,calls=0,shown=false,flow;
 flow=createDischargeSignOut({auth,notice,isCurrent:(user,v)=>auth.currentUser===user&&version===v,onFailure:()=>failures++,logout:async()=>{calls++;if(calls===1)throw Error('offline');auth.currentUser=null;shown=flow.observe(null);}});
 assert.equal(await flow.start(alice,1),false);assert.equal(failures,1);assert.equal(flow.hasRetry(),true);assert.equal(notice.observe(alice),false);assert.equal(storage.data.size,0);
 assert.equal(await flow.retry(),true);assert.equal(shown,true,'the login screen gets the notice after Auth changes');assert.equal(flow.hasRetry(),false);assert.equal(calls,2);
});

test('a delayed old rejection cannot cancel a newer account sign-out',async()=>{
 const storage=store(),notice=createDischargeNotice(storage),alice={uid:'alice'},bob={uid:'bob'},auth={currentUser:alice};let version=1,failures=0,rejectOld,resolveNew,calls=0,flow;
 flow=createDischargeSignOut({auth,notice,isCurrent:(user,v)=>auth.currentUser===user&&version===v,onFailure:()=>failures++,logout:()=>++calls===1?new Promise((_,reject)=>{rejectOld=reject;}):new Promise(resolve=>{resolveNew=resolve;})});
 const old=flow.start(alice,1);auth.currentUser=bob;version=2;assert.equal(flow.observe(bob),false);const next=flow.start(bob,2);
 rejectOld(Error('late error'));assert.equal(await old,false);assert.equal(failures,0);assert.deepEqual([...storage.data.values()],['confirmed'],'the newer notice remains armed');
 auth.currentUser=null;assert.equal(flow.observe(null),true);resolveNew();assert.equal(await next,true);assert.equal(storage.data.size,0);
});

test('guarded logout retains a generic notice for the replacement document',async()=>{
 const storage=store(),notice=createDischargeNotice(storage),alice={uid:'alice'},auth={currentUser:alice};
 const flow=createDischargeSignOut({auth,notice,guarded:true,isCurrent:user=>user===alice,logout:()=>{}});
 assert.equal(await flow.start(alice,1),true);assert.equal(createDischargeNotice(storage).observe(null),true);
});

test('the account waits for deletion confirmation and keeps sign-out failures distinct',()=>{
 const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 const removal=source.indexOf('await deletion.remove(currentName)');
 const signout=source.indexOf('await signOutDischarged(currentUser,version)',removal);
 assert.ok(removal>=0&&signout>removal,'sign-out is attempted only after the awaited deletion');
 assert.match(source,/dischargeSignOut\.observe\(currentUser\)/);
 assert.match(source,/Character deleted, but sign out failed/);
});

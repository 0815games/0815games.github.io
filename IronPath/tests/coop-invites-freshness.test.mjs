import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createCoopInvites} from '../coop-invites.mjs';

const original={partyId:'a'.repeat(32),code:'1234',name:'Alice',createdAt:1000};
const replacement={...original,partyId:'b'.repeat(32),code:'5678',createdAt:2000};

function fixture(initial,{replaceDuringTransaction=null}={}){
 let server=structuredClone(initial),removes=0,transactions=0,unsubscribed=0;
 const auth={currentUser:{uid:'bob'}};
 const sdk={ref:(_db,path)=>path,onValue(_path,onData){queueMicrotask(()=>onData({val:()=>structuredClone(server)}));return ()=>{unsubscribed++;};},
  async remove(){removes++;server=null;},
  async runTransaction(_path,change){
   transactions++;let next=change(structuredClone(server));
   if(replaceDuringTransaction){server=structuredClone(replaceDuringTransaction);next=change(structuredClone(server));}
   if(next===undefined)return {committed:false};server=next;return {committed:true};
  }};
 const service=createCoopInvites({db:{},auth,sdk});
 return {service,auth,server:()=>server,removes:()=>removes,transactions:()=>transactions,unsubscribed:()=>unsubscribed};
}

test('a stale decline cannot remove a replacement invitation',async()=>{
 const f=fixture(replacement);
 assert.equal(await f.service.dismiss('alice',original),false);
 assert.deepEqual(f.server(),replacement);assert.equal(f.removes(),0,'never use an unconditional remove');
 assert.equal(f.transactions(),1);assert.equal(f.unsubscribed(),1);
});

test('the invitation is compared again when the transaction retries',async()=>{
 const f=fixture(original,{replaceDuringTransaction:replacement});
 assert.equal(await f.service.dismiss('alice',original),false);
 assert.deepEqual(f.server(),replacement,'a replacement arriving during the transaction survives');
});

test('only the matching invitation is deleted; absent, incomplete and old copies fail closed',async()=>{
 const f=fixture(original);
 await assert.rejects(()=>f.service.dismiss('alice',null),/invitation/i);
 assert.deepEqual(f.server(),original);assert.equal(f.transactions(),0);
 assert.equal(await f.service.dismiss('alice',original),true);assert.equal(f.server(),null);
 assert.equal(await f.service.dismiss('alice',original),false);assert.equal(f.server(),null);
});

test('malformed invite identities and Firebase path keys are rejected before a transaction',async()=>{
 const f=fixture(original);
 for(const invalid of [
  {...original,partyId:{toString:()=>original.partyId}}, {...original,code:1234},
  {...original,createdAt:1.5}, {...original,createdAt:-1}, {...original,createdAt:Number.MAX_SAFE_INTEGER+1}
 ])await assert.rejects(()=>f.service.dismiss('alice',invalid),/invitation/i);
 for(const from of ['alice/path','bad.key','x'.repeat(129),'bob',''])await assert.rejects(()=>f.service.dismiss(from,original),/invitation/i);
 assert.equal(f.transactions(),0);assert.deepEqual(f.server(),original);
});

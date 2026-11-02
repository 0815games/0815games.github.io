import {strict as assert} from 'node:assert';
import {createFirebaseFourLobby} from '../firebase-four-lobby.mjs';
// In-memory SDK validates client flows and transaction races, not Firebase rules.
const root={},listeners=new Map();let tx=Promise.resolve(),counter=0;
const clone=x=>x==null?null:structuredClone(x);
function get(path){let p=root;for(const key of path.split('/')){if(!p||typeof p!=='object'||!Object.hasOwn(p,key))return null;p=p[key];}return clone(p);}
function set(path,value){const keys=path.split('/'),last=keys.pop();let p=root;for(const key of keys)p=p[key]||(p[key]={});if(value===null)delete p[last];else p[last]=clone(value);for(const [key,cbs] of listeners)if(path===key||path.startsWith(key+'/')||key.startsWith(path+'/'))for(const cb of cbs)cb({val:()=>get(key)});}
const sdk={ref:(_db,path)=>path,async get(path){return {val:()=>get(path),exists:()=>get(path)!==null};},async set(path,value){set(path,value);},async remove(path){set(path,null);},runTransaction(path,fn){const work=tx.then(()=>{const value=fn(get(path));if(value===undefined)return {committed:false,snapshot:{val:()=>get(path)}};set(path,value);return {committed:true,snapshot:{val:()=>get(path)}};});tx=work.catch(()=>{});return work;},onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb({val:()=>get(path)});return()=>listeners.get(path).delete(cb);}};
const crypto={getRandomValues(bytes){bytes.fill(++counter);return bytes;}},profile=name=>({name,gender:'female',level:1}),make=(uid)=>createFirebaseFourLobby({db:{},sdk,crypto,auth:{currentUser:{uid}}});
const alice=make('alice'),bob=make('bob'),cara=make('cara'),dan=make('dan'),eve=make('eve');
const {partyId,inviteCode}=await alice.create(profile('Alice'));assert.match(inviteCode,/^\d{4}$/);assert.equal(get(`fourParties/${partyId}/hostId`),'alice');
for(const [api,name] of [[bob,'Bob'],[cara,'Cara'],[dan,'Dan'],[eve,'Eve']])await api.request(inviteCode,name);
const duplicate=await Promise.allSettled([alice.approve(partyId,inviteCode,'bob'),alice.approve(partyId,inviteCode,'bob')]);assert.equal(duplicate.filter(r=>r.status==='fulfilled').length,1,'racing approvals cannot place one player twice');
await Promise.all([alice.approve(partyId,inviteCode,'cara'),alice.approve(partyId,inviteCode,'dan')]);assert.deepEqual(Object.values(get(`fourParties/${partyId}/slots`)).sort(),['bob','cara','dan']);
await assert.rejects(()=>alice.approve(partyId,inviteCode,'eve'),/full|changed/);await assert.rejects(()=>eve.publishProfile(partyId,profile('Eve')),/roster/);await assert.rejects(()=>alice.start(partyId),/ready/);
for(const [api,name] of [[bob,'Bob'],[cara,'Cara'],[dan,'Dan']])await api.publishProfile(partyId,profile(name));
await assert.rejects(()=>bob.configure(partyId,{mode:'two-vs-two',teams:[0,1,0,1]}),/configure/);await assert.rejects(()=>alice.configure(partyId,{mode:'two-vs-two',teams:[0,0,0,1]}),/configure/);
await alice.configure(partyId,{mode:'two-vs-two',teams:[0,1,0,1]});const match=await alice.start(partyId);assert.deepEqual(match.playerIds,['alice','bob','cara','dan']);assert.equal(match.mode,'two-vs-two');assert.deepEqual(match.teams,[0,1,0,1]);assert.deepEqual(match.teamRosters,[['alice','cara'],['bob','dan']]);const rejoin=await bob.reconnect(partyId,inviteCode);assert.deepEqual(rejoin.teamRosters,match.teamRosters);await assert.rejects(()=>eve.reconnect(partyId,inviteCode),/roster/);
await assert.rejects(()=>alice.start(partyId),/ready/);await assert.rejects(()=>bob.leave(partyId),/locked/);await assert.rejects(()=>alice.approve(partyId,inviteCode,'eve'),/unavailable/);await assert.rejects(()=>bob.publishProfile(partyId,profile('Bob')),/editable/);
await alice.close(partyId,inviteCode);assert.equal(get(`fourParties/${partyId}`),null);assert.equal(get(`fourCodes/${inviteCode}`),null);
console.log('Four-player Firebase lobby client flow tested with mock SDK; security rules remain required.');

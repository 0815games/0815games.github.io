import {strict as assert} from 'node:assert';
import {createFirebasePartyPresence} from '../firebase-party-presence.mjs';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let now=100000;
const values=new Map(),listeners=new Map(),disconnects=new Set(),events=[];let allowRegistration=null;
function read(path){if(values.has(path))return values.get(path);const children={};for(const [key,value] of values){if(key.startsWith(path+'/'))children[key.slice(path.length+1)]=value;}return Object.keys(children).length?children:null;}
function notify(path){for(const [name,callbacks] of listeners)if(path===name||path.startsWith(name+'/'))for(const cb of callbacks)cb({val:()=>read(name)});}
const sdk={ref:(_db,path)=>path,onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb({val:()=>read(path)});return()=>listeners.get(path).delete(cb);},onDisconnect(path){return {async remove(){events.push(['register',path]);if(allowRegistration)await allowRegistration;disconnects.add(path);}};},async set(path,value){events.push(['set',path]);values.set(path,value);notify(path);},async remove(path){events.push(['remove',path]);values.delete(path);notify(path);},serverTimestamp(){return now;}};
let counter=0;const crypto={getRandomValues(bytes){bytes.fill(++counter);return bytes;}};
const shared={db:{},sdk,crypto,partyId:'party',playerIds:['alice','bob'],heartbeatMs:100,expiryMs:300,clock:()=>now};
let aliceStates=[],bobStates=[],aliceConn=[];
const alice=createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'alice'}},onPresence:(...args)=>aliceStates.push(args),onConnection:value=>aliceConn.push(value)});
const bob=createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'bob'}},onPresence:(...args)=>bobStates.push(args)});
alice.start();bob.start();assert.deepEqual(aliceConn,[false]);
values.set('.info/serverTimeOffset',0);notify('.info/serverTimeOffset');values.set('.info/connected',true);notify('.info/connected');await sleep(5);
assert.equal(events.filter(e=>e[0]==='register').length,2);assert.equal(events.filter(e=>e[0]==='set').length,2);
for(const [,path] of events.filter(e=>e[0]==='set'))assert.ok(events.findIndex(e=>e[0]==='register'&&e[1]===path)<events.findIndex(e=>e[0]==='set'&&e[1]===path));
assert.deepEqual(aliceStates.slice(-2),[['alice',true],['bob',true]]);assert.ok(bobStates.some(([id,online])=>id==='alice'&&online));
// Old data cannot leave a player marked online indefinitely, even without a
// working onDisconnect; local connection loss immediately makes both offline.
now+=301;await sleep(110);assert.ok(aliceStates.some(([id,online])=>id==='bob'&&!online));
values.set('.info/connected',false);notify('.info/connected');assert.deepEqual(aliceStates.slice(-2),[['alice',false],['bob',false]]);
for(const path of disconnects){values.delete(path);notify(path);}disconnects.clear();
values.set('.info/connected',true);notify('.info/connected');await sleep(5);assert.equal(events.filter(e=>e[0]==='register').length,4);
await bob.stop();assert.deepEqual(aliceStates.at(-1),['bob',false]);await alice.stop();assert.equal(aliceConn.at(-1),false);
// A disconnect while registration is pending must never publish online.
let release;allowRegistration=new Promise(resolve=>{release=resolve;});const before=events.filter(e=>e[0]==='set').length;const states=[];
const delayed=createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'alice'}},onPresence:(...args)=>states.push(args)});
delayed.start();await sleep(0);values.set('.info/connected',false);notify('.info/connected');release();await sleep(0);
assert.equal(events.filter(e=>e[0]==='set').length,before);assert.equal(states.some(([,online])=>online),false);await delayed.stop();
assert.throws(()=>createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'eve'}}}),/Authenticated/);
console.log('Firebase presence, heartbeat, expiry and disconnect-race tests passed (mock SDK).');
// Authentication changes fail closed without waiting for a network event.
allowRegistration=null;values.set('.info/connected',true);notify('.info/connected');const changingAuth={currentUser:{uid:'alice'}},authErrors=[];let authConnection;
const changed=createFirebasePartyPresence({...shared,auth:changingAuth,onConnection:value=>{authConnection=value;},onError:error=>authErrors.push(error.message)});
changed.start();await sleep(5);assert.equal(authConnection,true);changingAuth.currentUser={uid:'eve'};await sleep(110);
assert.equal(authConnection,false);assert.deepEqual(authErrors,['Party identity changed']);await changed.stop();
// Wire the presence events into the real player-hosted session.
const {createPartyHost}=await import('../party-host.mjs');
const {createFirebasePartyHostSession}=await import('../firebase-party-session.mjs');
const {createMatch}=await import('../simulation.mjs');
const {createPlayer}=await import('../match.mjs');
const gameHost=createPartyHost(createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'}))));
const hostSession=createFirebasePartyHostSession({host:gameHost,playerIds:['alice','bob'],epoch:'test-epoch',channel:{watchInputs(){return()=>{};},async publishViews(){},async close(){}}});
hostSession.start();
const hostPresence=createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'alice'}},onPresence:(id,online)=>hostSession.setPresence(id,online)});
const guestPresence=createFirebasePartyPresence({...shared,auth:{currentUser:{uid:'bob'}}});
hostPresence.start();guestPresence.start();await sleep(5);assert.equal(gameHost.ready(),true);assert.ok(hostSession.step());
await guestPresence.stop();assert.equal(gameHost.ready(),true);assert.ok(hostSession.step(),'host keeps advancing without guest');
await hostPresence.stop();assert.equal(gameHost.ready(),false);assert.equal(hostSession.step(),null);await hostSession.stop();

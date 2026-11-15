import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createAccountServicesRegistry,requiresAccountGuard} from '../account-services.mjs';

function fakeSdk(){
 const calls=[],auth={},db={},app={};
 const sdk={
  initializeApp:config=>{calls.push(['app',config]);return app;},
  getAuth:actual=>{calls.push(['auth',actual]);return auth;},
  getDatabase:actual=>{calls.push(['db',actual]);return db;},
  onAuthStateChanged:(...args)=>{calls.push(['observe',...args]);return ()=>{};},
  signInWithEmailAndPassword:(...args)=>{calls.push(['signin',...args]);return 'signed';},
  createUserWithEmailAndPassword:(...args)=>{calls.push(['register',...args]);return 'registered';},
  sendPasswordResetEmail:(...args)=>{calls.push(['reset',...args]);return 'reset';},
  signOut:(...args)=>{calls.push(['logout',...args]);return 'out';}
 };
 return {sdk,calls,auth,db,app};
}
function fakeSession(){
 const calls=[],auth={},db={};let observer,errorObserver;
 const session={auth,db,onAuthStateChanged:(next,onError)=>{calls.push(['observe']);observer=next;errorObserver=onError;return ()=>{};},
  signIn:(...args)=>{calls.push(['signin',...args]);return 'signed';},
  register:(...args)=>{calls.push(['register',...args]);return 'registered';},
  resetPassword:(...args)=>{calls.push(['reset',...args]);return 'reset';},
  logout:()=>{calls.push(['logout']);return 'out';}};
 return {session,calls,auth,db,emit:value=>observer(value),emitError:value=>errorObserver?.(value)};
}

test('only an absent marker permits ordinary account initialization',()=>{
 assert.equal(requiresAccountGuard(undefined),false);assert.equal(requiresAccountGuard('required'),true);
 for(const invalid of ['', 'true','Required',null,false])assert.throws(()=>requiresAccountGuard(invalid),/Invalid guarded document/);
});

test('ordinary account services preserve the existing Firebase SDK calls',()=>{
 const h=fakeSdk(),config={projectId:'demo'},registry=createAccountServicesRegistry();
 const services=registry.create({config,sdk:h.sdk});
 assert.equal(services.guarded,false);assert.equal(services.auth,h.auth);assert.equal(services.db,h.db);assert.equal(services.signal,null);
 const next=()=>{},onError=()=>{};services.observe(next,onError);
 assert.equal(services.signIn('alice','p'),'signed');assert.equal(services.register('bob','p'),'registered');
 assert.equal(services.resetPassword('alice'),'reset');assert.equal(services.logout(),'out');
 assert.deepEqual(h.calls,[['app',config],['auth',h.app],['db',h.app],['observe',h.auth,next,onError],
  ['signin',h.auth,'alice','p'],['register',h.auth,'bob','p'],['reset',h.auth,'alice'],['logout',h.auth]]);
 assert.throws(()=>registry.create({config,sdk:h.sdk}),/already claimed/);
 assert.throws(()=>registry.installGuarded(),/Invalid guarded/);
});

test('a guarded document uses only the installed session and stops observer delivery on abort',()=>{
 const h=fakeSession(),controller=new AbortController(),registry=createAccountServicesRegistry(),seen=[],errors=[];
 registry.installGuarded({session:h.session,signal:controller.signal});
 assert.throws(()=>registry.installGuarded({session:h.session,signal:controller.signal}),/Invalid guarded/);
 const services=registry.create({requireGuard:true});
 assert.equal(services.guarded,true);assert.equal(services.auth,h.auth);assert.equal(services.db,h.db);assert.equal(services.signal,controller.signal);
 assert.throws(()=>services.observe(()=>{},'not a callback'),/Invalid account observer/);
 services.observe(value=>seen.push(value),error=>errors.push(error));h.emit('approved');h.emitError('before-abort');
 assert.equal(services.signIn('alice','p'),'signed');assert.equal(services.register('bob','p'),'registered');
 assert.equal(services.resetPassword('alice'),'reset');assert.equal(services.logout(),'out');
 controller.abort();h.emit('too-late');h.emitError('too-late');assert.deepEqual(seen,['approved']);assert.deepEqual(errors,['before-abort']);
 assert.throws(()=>services.signIn('alice','p'),/terminated/);
 assert.throws(()=>services.register('alice','p'),/terminated/);
 assert.throws(()=>services.resetPassword('alice'),/terminated/);
 assert.throws(()=>services.observe(()=>{}),/terminated/);
 assert.deepEqual(h.calls,[['observe'],['signin','alice','p'],['register','bob','p'],['reset','alice'],['logout']]);
});

test('guarded builds fail closed without a complete live session and cannot fall back to direct auth',()=>{
 const registry=createAccountServicesRegistry(),h=fakeSdk(),controller=new AbortController(),guard=fakeSession();
 assert.throws(()=>registry.create({requireGuard:true,config:{},sdk:h.sdk}),/required/);
 assert.deepEqual(h.calls,[]);
 assert.throws(()=>registry.installGuarded({session:{auth:{},db:{}},signal:controller.signal}),/Invalid guarded/);
 controller.abort();
 assert.throws(()=>registry.installGuarded({session:guard.session,signal:controller.signal}),/Invalid guarded/);
 const valid=new AbortController();registry.installGuarded({session:guard.session,signal:valid.signal});valid.abort();
 assert.throws(()=>registry.create({requireGuard:true,config:{},sdk:h.sdk}),/terminated/);
 assert.deepEqual(h.calls,[]);
});

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialClient=api;})(globalThis,()=>{
'use strict';
const validUid=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(x);
const operations=['accept','decline','cancel','remove','block','unblock'];
const actionNames=['getCode','requestByCode','setPrivacy',...operations];
function error(code){const e=new Error(code);e.code=code;return e;}
function nameOf(value){return typeof value==='string'&&!/[\u0000-\u001f\u007f]/.test(value)?value.slice(0,80):null;}
function decodeIndex(raw,kind,now){
 if(!['friends','requests'].includes(kind)||!Number.isFinite(now)||!raw||typeof raw!=='object'||Array.isArray(raw))return [];
 return Object.keys(raw).filter(validUid).sort().flatMap(uid=>{
  const value=raw[uid];
  if(kind==='friends'&&value===true)return [{uid,displayName:null}];
  if(!value||typeof value!=='object'||Array.isArray(value)||value.active!==true||!Number.isSafeInteger(value.revision)||value.revision<0)return [];
  if(kind==='requests'&&(!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=now))return [];
  return [{uid,displayName:nameOf(value.displayName),...(kind==='requests'?{expiresAt:value.expiresAt}:{})}];
 });
}
function createRtdbActions({db,getUser,clock=Date.now}){
 if(!db||typeof db.ref!=='function'||typeof getUser!=='function')throw error('backend-unavailable');
 const codePattern=/^[A-Za-z0-9_-]{24}$/;
 const ttl=7*24*60*60*1000;
 function actor(){const uid=getUser()?.uid;if(!validUid(uid))throw error('unauthenticated');return uid;}
 function sameUser(uid){if(getUser()?.uid!==uid)throw error('session-changed');}
 async function read(path){return (await db.ref('social/'+path).get()).val();}
 async function serverNow(){const snap=await db.ref('.info/serverTimeOffset').get();const offset=snap.val();return clock()+(Number.isFinite(offset)?offset:0);}
 function pair(me,peer){if(!validUid(peer)||peer===me)throw error('invalid-argument');return [me,peer].sort();}
 function randomCode(){const bytes=new Uint8Array(18);globalThis.crypto.getRandomValues(bytes);let raw='';for(const byte of bytes)raw+=String.fromCharCode(byte);return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
 async function getCode(){
  const me=actor();
  for(let attempt=0;attempt<3;attempt++){
   const existing=await read('ownCodes/'+me);sameUser(me);
   if(existing!==null){
    if(typeof existing!=='string'||!codePattern.test(existing)||await read('codeLookup/'+existing)!==me)throw error('invalid-code-mapping');
    sameUser(me);return {friendCode:existing};
   }
   const code=randomCode();
   if(!codePattern.test(code))throw error('invalid-generated-code');
   try{sameUser(me);await db.ref('social').update({['ownCodes/'+me]:code,['codeLookup/'+code]:me});sameUser(me);return {friendCode:code};}
   catch(e){sameUser(me);if(await read('ownCodes/'+me)!==null)continue;const owner=await read('codeLookup/'+code);if(owner!==null&&owner!==me)continue;throw e;}
  }
  throw error('code-reservation-conflict');
 }
 function batch(rel){
  const patch={['relationships/'+rel.a+'/'+rel.b]:rel};
  for(const [owner,peer] of [[rel.a,rel.b],[rel.b,rel.a]]){
   const pending=rel.status==='pending';
   patch['friends/'+owner+'/'+peer]={active:rel.status==='friends',revision:rel.revision};
   patch['requests/'+owner+'/'+peer]={active:pending&&rel.requestedBy===peer,revision:rel.revision,requestedAt:pending?rel.requestedAt:null,expiresAt:pending?rel.expiresAt:null,displayName:pending&&rel.requestedBy===peer?rel.requesterName:null};
   patch['sentRequests/'+owner+'/'+peer]={active:pending&&rel.requestedBy===owner,revision:rel.revision,requestedAt:pending?rel.requestedAt:null,expiresAt:pending?rel.expiresAt:null};
  }
  return patch;
 }
 async function transition(me,peer,operation){
  const [a,b]=pair(me,peer),path='relationships/'+a+'/'+b;
  for(let attempt=0;attempt<3;attempt++){
   const previous=await read(path),time=await serverNow();sameUser(me);
   if(previous&&(previous.a!==a||previous.b!==b||!Number.isSafeInteger(previous.revision)||previous.revision<0))throw error('invalid-relationship');
   let next;
   if(operation==='request'){
    if(previous?.status==='friends')return {status:'friends'};
    if(previous&&!['none','pending'].includes(previous.status))throw error('request-not-allowed');
    if(previous?.status==='pending'&&previous.expiresAt>time){if(previous.requestedBy!==me)throw error('incoming-request-exists');return {status:'pending'};}
    const name=(await db.ref('users/'+me+'/profile/displayName').get()).val();
    if(typeof name!=='string'||name.trim().length<3||name.trim().length>20)throw error('invalid-profile');
    next={a,b,status:'pending',requestedBy:me,requesterName:name.trim(),requestedAt:time,expiresAt:time+ttl};
   }else{
    if(!previous)throw error('relationship-missing');
    if(operation==='accept'&&previous.status==='friends')return {status:'friends'};
    if(operation==='remove'){if(previous.status!=='friends')throw error('not-friends');}
    else{
     if(previous.status!=='pending')throw error('request-missing');
     const expectedSender=operation==='cancel'?me:peer;
     if(previous.requestedBy!==expectedSender)throw error('wrong-actor');
     if(operation==='accept'&&previous.expiresAt<=time)throw error('request-expired');
    }
    next={a,b,status:operation==='accept'?'friends':'none'};
   }
   next.revision=(previous?.revision||0)+1;next.updatedAt=time;
   try{sameUser(me);await db.ref('social').update(batch(next));sameUser(me);return {status:next.status,revision:next.revision};}
   catch(e){sameUser(me);const latest=await read(path);if((latest?.revision||0)!==(previous?.revision||0))continue;throw e;}
  }
  throw error('relationship-conflict');
 }
 async function requestByCode(data){
  if(!data||Object.keys(data).some(k=>k!=='friendCode')||typeof data.friendCode!=='string')throw error('invalid-argument');
  const code=data.friendCode.trim();if(!codePattern.test(code))throw error('invalid-argument');
  const me=actor(),peer=await read('codeLookup/'+code);sameUser(me);
  if(!validUid(peer))throw error('friend-code-not-found');
  return transition(me,peer,'request');
 }
 async function setPrivacy(data){
  const me=actor();
  if(!data||Object.keys(data).some(k=>!['profile','characters'].includes(k))||!['private','friends'].includes(data.profile)||!['private','friends'].includes(data.characters))throw error('invalid-argument');
  sameUser(me);await db.ref('social/privacy/'+me).update({profile:data.profile,characters:data.characters});sameUser(me);return {profile:data.profile,characters:data.characters};
 }
 async function block(data){const me=actor(),peer=target(data);sameUser(me);await db.ref('social/blocks/'+me+'/'+peer).set(true);sameUser(me);return {blocked:true};}
 async function unblock(data){const me=actor(),peer=target(data);sameUser(me);await db.ref('social/blocks/'+me+'/'+peer).remove();sameUser(me);return {blocked:false};}
 function target(data){if(!data||Object.keys(data).some(k=>k!=='targetUid')||!validUid(data.targetUid))throw error('invalid-argument');return data.targetUid;}
 const actions={getCode,requestByCode,setPrivacy,block,unblock};
 for(const operation of ['accept','decline','cancel','remove'])actions[operation]=data=>transition(actor(),target(data),operation);
 return Object.freeze(actions);
}
function create({db,enabled=false,actions={},clock=Date.now,schedule=setTimeout,cancel=clearTimeout}={}){
 const bound=enabled?{...createRtdbActions({db,getUser:()=>globalThis.firebase?.auth?.currentUser,clock}),...actions}:{};
 const has=name=>enabled&&actionNames.includes(name)&&typeof bound[name]==='function';
 function watch(uid,onData,onError){
  if(!validUid(uid))throw error('invalid-uid');
  if(!enabled){onData({available:false,friends:[],requests:[]});return()=>{};}
  if(!db)throw error('missing-database');
  let alive=true,timer=null,offset=0;
  const ready={friends:false,requests:false,offset:false},raw={friends:null,requests:null},names=new Map(),unsubs=[];
  function cleanup(){if(timer!==null)cancel(timer);timer=null;unsubs.forEach(fn=>fn());names.clear();}
  function fail(e){if(!alive)return;alive=false;cleanup();onError(e);}
  function publish(){
   if(!alive||!ready.friends||!ready.requests||!ready.offset)return;
   if(timer!==null)cancel(timer);timer=null;
   const now=clock()+offset;
   const friends=decodeIndex(raw.friends,'friends',now),requests=decodeIndex(raw.requests,'requests',now);
   const active=new Set(friends.map(f=>f.uid));
   for(const id of names.keys())if(!active.has(id))names.delete(id);
   for(const friend of friends){
    if(!names.has(friend.uid)){
     const entry={displayName:null};names.set(friend.uid,entry);
     Promise.resolve().then(()=>alive&&names.get(friend.uid)===entry?db.ref('social/profiles/'+friend.uid).get():null).then(snap=>{
      if(!snap||!alive||names.get(friend.uid)!==entry)return;
      const name=nameOf(snap.val()?.displayName);
      if(entry.displayName!==name){entry.displayName=name;publish();}
     }).catch(()=>{});
    }
    friend.displayName=names.get(friend.uid).displayName;
   }
   if(requests.length){const expiry=requests.reduce((min,r)=>Math.min(min,r.expiresAt),Infinity);timer=schedule(publish,Math.min(2147483647,Math.max(1,expiry-now+1)));}
   onData({available:true,friends,requests});
  }
  function listen(path,callback){
   if(!alive)return;
   const ref=db.ref(path);ref.on('value',callback,fail);unsubs.push(()=>ref.off('value',callback));
  }
  listen('.info/serverTimeOffset',snap=>{if(!alive)return;offset=Number.isFinite(snap.val())?snap.val():0;ready.offset=true;publish();});
  for(const kind of ['friends','requests'])listen('social/'+kind+'/'+uid,snap=>{if(!alive)return;raw[kind]=snap.val();ready[kind]=true;publish();});
  if(!alive)cleanup();
  return()=>{alive=false;cleanup();};
 }
 async function getProfile(uid){if(!enabled||!validUid(uid))throw error('unavailable');return (await db.ref('social/profiles/'+uid).get()).val();}
 async function getCharacter(uid,classId){if(!enabled||!validUid(uid)||!['knight','mage'].includes(classId))throw error('unavailable');return (await db.ref('social/characterViews/'+uid+'/'+classId).get()).val();}
 function watchValue(path,onData,onError){let alive=true;const ref=db.ref(path),cb=snap=>{if(alive)onData(snap.val());};ref.on('value',cb,e=>{if(alive){alive=false;ref.off('value',cb);onError(e);}});return()=>{alive=false;ref.off('value',cb);};}
 function watchProfile(uid,onData,onError){if(!enabled||!validUid(uid))throw error('unavailable');return watchValue('social/profiles/'+uid,onData,onError);}
 function watchCharacter(uid,classId,onData,onError){if(!enabled||!validUid(uid)||!['knight','mage'].includes(classId))throw error('unavailable');return watchValue('social/characterViews/'+uid+'/'+classId,onData,onError);}
 async function invoke(name,payload){if(!has(name))throw error('backend-unavailable');return bound[name](payload);}
 return Object.freeze({watch,getProfile,getCharacter,watchProfile,watchCharacter,has,invoke,enabled});
}
return {create,validUid,decodeIndex,createRtdbActions};
});

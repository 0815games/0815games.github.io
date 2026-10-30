(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialClient=api;})(globalThis,()=>{
'use strict';
const root=globalThis;
const validUid=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(x);
const operations=['accept','decline','cancel','remove','block','unblock'];
const actionNames=['requestByUid','requestByName','requestByCode','getCode','setPrivacy',...operations];
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
 const ttl=7*24*60*60*1000;
 function actor(){const uid=getUser()?.uid;if(!validUid(uid))throw error('unauthenticated');return uid;}
 function sameUser(uid){if(getUser()?.uid!==uid)throw error('session-changed');}
 async function read(path){return (await db.ref('social/'+path).get()).val();}
 async function serverNow(){return new Promise((resolve,reject)=>{const ref=db.ref('.info/serverTimeOffset');const callback=snap=>{ref.off('value',callback);const offset=snap.val();resolve(clock()+(Number.isFinite(offset)?offset:0));};ref.on('value',callback,reject);});}
 function pair(me,peer){if(!validUid(peer)||peer===me)throw error('invalid-argument');return [me,peer].sort();}
 function target(data){if(!data||Object.keys(data).some(k=>k!=='targetUid')||!validUid(data.targetUid))throw error('invalid-argument');return data.targetUid;}
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
 function indexBatch(rel){
  const patch={};
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
    if(previous?.status==='friends'){await db.ref('social').update(indexBatch(previous));return {status:'friends'};}
    if(previous&&!['none','pending'].includes(previous.status))throw error('request-not-allowed');
    if(previous?.status==='pending'&&previous.expiresAt>time){await db.ref('social').update(indexBatch(previous));if(previous.requestedBy!==me)throw error('incoming-request-exists');return {status:'pending'};}
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
 async function requestByUid(data){return transition(actor(),target(data),'request');}
 async function requestByName(data){
  const name=typeof data?.playerName==='string'?data.playerName.trim():'';
  if(!/^[A-Za-z0-9_-]{3,20}$/.test(name))throw error('invalid-argument');
  const snapshot=await db.ref('usernames/'+name.toLowerCase()).get();
  const uid=snapshot.val()?.uid;
  if(!validUid(uid))throw error('player-not-found');
  return requestByUid({targetUid:uid});
 }
 async function setPrivacy(data){
  const me=actor();
  if(!data||Object.keys(data).some(k=>!['profile','characters'].includes(k))||!['private','friends'].includes(data.profile)||!['private','friends'].includes(data.characters))throw error('invalid-argument');
  sameUser(me);await db.ref('social/privacy/'+me).update({profile:data.profile,characters:data.characters});sameUser(me);return {profile:data.profile,characters:data.characters};
 }
 async function block(data){const me=actor(),peer=target(data);sameUser(me);await db.ref('social/blocks/'+me+'/'+peer).set(true);sameUser(me);return {blocked:true};}
 async function unblock(data){const me=actor(),peer=target(data);sameUser(me);await db.ref('social/blocks/'+me+'/'+peer).remove();sameUser(me);return {blocked:false};}
 const actions={requestByUid,requestByName,setPrivacy,block,unblock};
 for(const operation of ['accept','decline','cancel','remove'])actions[operation]=data=>transition(actor(),target(data),operation);
 return Object.freeze(actions);
}
function createCallableActions({getFunctions,getUser,timeout=15000}){
 if(typeof getFunctions!=='function'||typeof getUser!=='function')throw error('backend-unavailable');
 async function invoke(name,payload){
  const uid=getUser()?.uid;
  if(!validUid(uid))throw error('unauthenticated');
  const functions=await getFunctions();
  if(getUser()?.uid!==uid)throw error('session-changed');
  const callable=functions.httpsCallable(name,{timeout});
  const response=await callable(payload);
  if(getUser()?.uid!==uid)throw error('session-changed');
  return response?.data;
 }
 function respond(operation){
  return async data=>{
   if(!data||Object.keys(data).some(key=>key!=='targetUid')||!validUid(data.targetUid))throw error('invalid-argument');
   return invoke('socialRespond',{operation,targetUid:data.targetUid});
  };
 }
 return Object.freeze({
  getCode:async()=>invoke('socialGetCode',{}),
  requestByCode:async data=>{
   const code=typeof data?.friendCode==='string'?data.friendCode.trim():'';
   if(!/^[A-Za-z0-9_-]{24}$/.test(code))throw error('invalid-argument');
   return invoke('socialRequestByCode',{friendCode:code});
  },
  setPrivacy:async data=>{
   if(!data||Object.keys(data).some(key=>!['profile','characters'].includes(key))||!['private','friends'].includes(data.profile)||!['private','friends'].includes(data.characters))throw error('invalid-argument');
   return invoke('socialSetPrivacy',{profile:data.profile,characters:data.characters});
  },
  accept:respond('accept'),
  decline:respond('decline'),
  cancel:respond('cancel'),
  remove:respond('remove'),
  block:respond('block'),
  unblock:respond('unblock')
 });
}
function createBrowserFunctions({region}){
 let loader=null;
 return async()=>{
  if(!loader){
   loader=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-functions-compat.js';
    script.onload=()=>resolve();
    script.onerror=()=>{loader=null;script.remove();reject(error('functions-sdk-unavailable'));};
    document.head.append(script);
   });
  }
  try{await loader;}
  catch(loadError){loader=null;throw loadError;}
  const functions=root.firebase?.app?.()?.functions?.(region);
  if(!functions)throw error('functions-sdk-unavailable');
  return functions;
 };
}
function create({db,enabled=false,actions={},clock=Date.now,schedule=setTimeout,cancel=clearTimeout,config=root.INKFALL_SOCIAL_CONFIG||{}}={}){
 const bound=enabled?{...(db?createRtdbActions({db,getUser:()=>root.firebase?.auth?.()?.currentUser,clock}):{}),...actions}:{};
 if(enabled&&!db&&!bound.getCode&&!bound.requestByCode){
  Object.assign(bound,createCallableActions({getFunctions:createBrowserFunctions({region:config.functionsRegion}),getUser:()=>root.firebase?.auth?.()?.currentUser}));
 }
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
return {create,validUid,decodeIndex,createRtdbActions,createCallableActions};
});

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
function createCallableActions({getFunctions,getUser}){
 if(typeof getFunctions!=='function'||typeof getUser!=='function')throw error('backend-unavailable');
 async function call(endpoint,payload){
  const uid=getUser()?.uid;if(!validUid(uid))throw error('unauthenticated');
  const functions=await getFunctions();
  if(getUser()?.uid!==uid)throw error('session-changed');
  const result=await functions.httpsCallable(endpoint,{timeout:15000})(payload);
  if(getUser()?.uid!==uid)throw error('session-changed');
  return result.data;
 }
 function target(data){if(!data||Object.keys(data).some(k=>k!=='targetUid')||!validUid(data.targetUid))throw error('invalid-argument');return data.targetUid;}
 const actions={
  getCode:()=>call('socialGetCode',{}),
  requestByCode:data=>{if(!data||Object.keys(data).some(k=>k!=='friendCode')||typeof data.friendCode!=='string'||!/^[A-Za-z0-9_-]{24}$/.test(data.friendCode.trim()))throw error('invalid-argument');return call('socialRequestByCode',{friendCode:data.friendCode.trim()});},
  setPrivacy:data=>{if(!data||Object.keys(data).some(k=>!['profile','characters'].includes(k))||!['private','friends'].includes(data.profile)||!['private','friends'].includes(data.characters))throw error('invalid-argument');return call('socialSetPrivacy',{profile:data.profile,characters:data.characters});}
 };
 for(const operation of operations)actions[operation]=data=>call('socialRespond',{operation,targetUid:target(data)});
 return Object.freeze(actions);
}
let sdkLoading=null;
function loadFunctionsSdk(firebase){
 if(typeof firebase.functions==='function')return Promise.resolve();
 if(sdkLoading)return sdkLoading;
 const doc=globalThis.document;
 const appScript=doc&&[...doc.scripts].find(s=>/^https:\/\/www\.gstatic\.com\/firebasejs\/[0-9.]+\/firebase-app-compat\.js(?:\?.*)?$/.test(s.src));
 if(!appScript)return Promise.reject(error('functions-sdk-unavailable'));
 sdkLoading=new Promise((resolve,reject)=>{
  const script=doc.createElement('script');script.async=true;
  script.src=appScript.src.split('?')[0].replace('firebase-app-compat.js','firebase-functions-compat.js');
  let settled=false;
  const finish=e=>{if(settled)return;settled=true;clearTimeout(timer);if(e){script.remove();reject(e);}else resolve();};
  const timer=setTimeout(()=>finish(error('functions-sdk-timeout')),10000);
  script.onload=()=>finish(typeof firebase.functions==='function'?null:error('functions-sdk-unavailable'));
  script.onerror=()=>finish(error('functions-sdk-unavailable'));
  doc.head.append(script);
 }).catch(e=>{sdkLoading=null;throw e;});
 return sdkLoading;
}
function defaultActions(){
 const firebase=globalThis.firebase,region=globalThis.INKFALL_SOCIAL_CONFIG?.functionsRegion;
 if(typeof region!=='string'||!/^[a-z][a-z0-9-]{1,62}$/.test(region)||typeof firebase?.auth!=='function'||typeof firebase?.app!=='function')return {};
 return createCallableActions({getUser:()=>firebase.auth().currentUser,getFunctions:async()=>{await loadFunctionsSdk(firebase);return firebase.app().functions(region);}});
}
function create({db,enabled=false,actions={},clock=Date.now,schedule=setTimeout,cancel=clearTimeout}={}){
 const bound=enabled?{...defaultActions(),...actions}:{};
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
return {create,validUid,decodeIndex,createCallableActions};
});

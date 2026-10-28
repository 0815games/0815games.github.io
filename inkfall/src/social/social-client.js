(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialClient=api;})(globalThis,()=>{
'use strict';
const validUid=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(x);
function create({db,enabled=false,actions={}}={}){
 const has=name=>enabled&&typeof actions[name]==='function';
 function watch(uid,onData,onError){
  if(!validUid(uid))throw Error('invalid-uid');
  if(!enabled){onData({available:false,friends:[],requests:[]});return()=>{};}
  if(!db)throw Error('missing-database');
  let alive=true,friendReady=false,requestReady=false;
  const state={available:true,friends:[],requests:[]};
  const unsubs=[];let revision=0;
  function fail(error){if(!alive)return;alive=false;revision++;unsubs.forEach(fn=>fn());onError(error);}
  async function publish(){
   const ticket=++revision;
   const friends=await Promise.all(state.friends.map(async friend=>{
    try{const value=(await db.ref('social/profiles/'+friend.uid).get()).val();return {...friend,displayName:typeof value?.displayName==='string'?value.displayName:null};}
    catch{return {...friend,displayName:null};}
   }));
   if(alive&&ticket===revision)onData({...state,friends,requests:[...state.requests]});
  }
  for(const [key,path] of [['friends','friends'],['requests','requests']]){
   const ref=db.ref('social/'+path+'/'+uid);
   const callback=snap=>{
    if(!alive)return;
    const raw=snap.val();
    state[key]=raw&&typeof raw==='object'&&!Array.isArray(raw)?Object.keys(raw).filter(validUid).sort().map(id=>({uid:id,displayName:typeof raw[id]?.displayName==='string'?raw[id].displayName.slice(0,80):null})):[];
    if(key==='friends')friendReady=true;else requestReady=true;
    if(friendReady&&requestReady)publish();
   };
   ref.on('value',callback,fail);
   unsubs.push(()=>ref.off('value',callback));
  }
  if(!alive)unsubs.forEach(fn=>fn());
  return()=>{alive=false;revision++;unsubs.forEach(fn=>fn());};
 }
 async function getProfile(uid){if(!enabled||!validUid(uid))throw Error('unavailable');return (await db.ref('social/profiles/'+uid).get()).val();}
 async function getCharacter(uid,classId){if(!enabled||!validUid(uid)||!['knight','mage'].includes(classId))throw Error('unavailable');return (await db.ref('social/characterViews/'+uid+'/'+classId).get()).val();}
 function watchValue(path,onData,onError){const ref=db.ref(path);const cb=snap=>onData(snap.val());ref.on('value',cb,onError);return()=>ref.off('value',cb);}
 function watchProfile(uid,onData,onError){if(!enabled||!validUid(uid))throw Error('unavailable');return watchValue('social/profiles/'+uid,onData,onError);}
 function watchCharacter(uid,classId,onData,onError){if(!enabled||!validUid(uid)||!['knight','mage'].includes(classId))throw Error('unavailable');return watchValue('social/characterViews/'+uid+'/'+classId,onData,onError);}
 async function invoke(name,payload){if(!has(name))throw Error('backend-unavailable');return actions[name](payload);}
 return Object.freeze({watch,getProfile,getCharacter,watchProfile,watchCharacter,has,invoke,enabled});
}
return {create,validUid};
});

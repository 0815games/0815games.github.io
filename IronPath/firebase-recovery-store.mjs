import {restorePartyHost} from './party-host.mjs?v=20261103-recovery1';
// Experimental: not connected to the live game. Owner-specific paths fence
// stale writers. A checkpoint and all recipient views are one atomic record.
const validKey=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(v);
const ownerPattern=/^[a-f0-9]{32}$/;
const bytes=new TextEncoder();
export function createFirebaseRecoveryStore({db,auth,sdk,partyId,manifest,crypto=globalThis.crypto}){
  const uid=auth?.currentUser?.uid;
  if(!db||!validKey(uid)||! /^[a-f0-9]{32}$/.test(partyId)||!sdk||!['ref','get','onValue','runTransaction'].every(k=>typeof sdk[k]==='function')||typeof crypto?.getRandomValues!=='function'||!manifest||manifest.hostId!==uid||!Array.isArray(manifest.playerIds)||manifest.playerIds[0]!==uid||manifest.playerIds.some(id=>!validKey(id)))throw Error('Invalid recovery configuration');
  const roster=[...manifest.playerIds],options={hostId:uid,playerIds:roster,mode:manifest.mode,teams:manifest.teamRosters},base=`fourParties/${partyId}/recovery`,lease=sdk.ref(db,`${base}/lease`);
  const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Party identity changed');};
  const token=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');};
  function checkpointData(checkpoint){restorePartyHost(checkpoint,options);const result=JSON.stringify(checkpoint);if(bytes.encode(result).length>1048576)throw Error('Checkpoint too large');return result;}
  function viewData(views){if(!views||typeof views!=='object'||Array.isArray(views)||Object.keys(views).length!==roster.length||roster.some(id=>!Object.hasOwn(views,id)))throw Error('Invalid recovery views');return Object.fromEntries(roster.map(id=>{const value=JSON.stringify(views[id]);if(typeof value!=='string'||bytes.encode(value).length>262144)throw Error('Recovery view too large');return [id,value];}));}
  async function transact(path,update){check();let unwatch;await new Promise((resolve,reject)=>{unwatch=sdk.onValue(path,resolve,reject);});try{check();const result=await sdk.runTransaction(path,update,{applyLocally:false});check();return result;}finally{unwatch?.();}}
  async function publish(fence,checkpoint,views){if(!Number.isSafeInteger(fence?.generation)||fence.generation<1||!ownerPattern.test(fence?.owner||''))throw Error('Invalid recovery fence');const encoded=checkpointData(checkpoint),encodedViews=viewData(views),path=sdk.ref(db,`${base}/sessions/${fence.owner}`);const result=await transact(path,current=>{if(current){if(current.generation!==fence.generation)return;let old;try{old=JSON.parse(current.checkpoint);}catch{return;}if(!Number.isSafeInteger(old.tick)||checkpoint.tick<old.tick)return;}return {generation:fence.generation,checkpoint:encoded,views:encodedViews};});if(!result.committed)throw Error('Recovery fence or checkpoint changed');return true;}
  return {
    async initialize(checkpoint,views){checkpointData(checkpoint);viewData(views);const owner=token();const result=await transact(lease,current=>current===null?{generation:1,owner}:undefined);if(!result.committed)throw Error('Recovery already initialized');const fence={generation:1,owner};await publish(fence,checkpoint,views);return fence;},
    async claim(expectedGeneration){if(!Number.isSafeInteger(expectedGeneration)||expectedGeneration<1)throw Error('Invalid generation');const owner=token();let previousOwner;const result=await transact(lease,current=>{if(!current||current.generation!==expectedGeneration)return;previousOwner=current.owner;return {generation:expectedGeneration+1,owner,previousOwner};});if(!result.committed)throw Error('Recovery generation changed');const previous=(await sdk.get(sdk.ref(db,`${base}/sessions/${previousOwner}`))).val();check();if(!previous||previous.generation!==expectedGeneration)throw Error('Previous durable checkpoint unavailable');const checkpoint=JSON.parse(previous.checkpoint);checkpointData(checkpoint);const views=Object.fromEntries(roster.map(id=>[id,JSON.parse(previous.views[id])]));const fence={generation:expectedGeneration+1,owner};await publish(fence,checkpoint,views);return {...fence,checkpoint};},
    publish
  };
}

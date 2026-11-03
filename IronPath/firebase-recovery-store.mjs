import {restorePartyHost} from './party-host.mjs?v=20261103-recovery1';
// Experimental durable store. Not connected to the live game yet. Transactions
// fence writes by generation and commit a checkpoint and all views together.
const validKey=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(v);
const ownerPattern=/^[a-f0-9]{32}$/;
const bytes=new TextEncoder();
export function createFirebaseRecoveryStore({db,auth,sdk,partyId,manifest,crypto=globalThis.crypto}){
  const uid=auth?.currentUser?.uid;
  if(!db||!validKey(uid)||! /^[a-f0-9]{32}$/.test(partyId)||!sdk||!['ref','onValue','runTransaction'].every(k=>typeof sdk[k]==='function')||typeof crypto?.getRandomValues!=='function'||!manifest||manifest.hostId!==uid||!Array.isArray(manifest.playerIds)||manifest.playerIds[0]!==uid||manifest.playerIds.some(id=>!validKey(id)))throw Error('Invalid recovery configuration');
  const roster=[...manifest.playerIds],teams=manifest.teamRosters,options={hostId:uid,playerIds:roster,mode:manifest.mode,teams},path=sdk.ref(db,`fourParties/${partyId}/recovery`);
  const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Party identity changed');};
  const token=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');};
  function checkpointData(checkpoint){restorePartyHost(checkpoint,options);const result=JSON.stringify(checkpoint);if(bytes.encode(result).length>1048576)throw Error('Checkpoint too large');return result;}
  function viewData(views){if(!views||typeof views!=='object'||Array.isArray(views)||Object.keys(views).length!==roster.length||roster.some(id=>!Object.hasOwn(views,id)))throw Error('Invalid recovery views');return Object.fromEntries(roster.map(id=>{const value=JSON.stringify(views[id]);if(typeof value!=='string'||bytes.encode(value).length>262144)throw Error('Recovery view too large');return [id,value];}));}
  async function transact(update){check();let unwatch;await new Promise((resolve,reject)=>{unwatch=sdk.onValue(path,resolve,reject);});try{check();const result=await sdk.runTransaction(path,update,{applyLocally:false});check();return result;}finally{unwatch?.();}}
  return {
    async initialize(checkpoint,views){const encoded=checkpointData(checkpoint),encodedViews=viewData(views),owner=token();const result=await transact(current=>current===null?{generation:1,owner,checkpoint:encoded,views:encodedViews}:undefined);if(!result.committed)throw Error('Recovery already initialized');return {generation:1,owner};},
    async claim(expectedGeneration){if(!Number.isSafeInteger(expectedGeneration)||expectedGeneration<1)throw Error('Invalid generation');const owner=token();const result=await transact(current=>current&&current.generation===expectedGeneration?{...current,generation:expectedGeneration+1,owner}:undefined);if(!result.committed)throw Error('Recovery generation changed');const value=result.snapshot.val();return {generation:value.generation,owner,checkpoint:JSON.parse(value.checkpoint)};},
    async publish(fence,checkpoint,views){if(!Number.isSafeInteger(fence?.generation)||fence.generation<1||!ownerPattern.test(fence?.owner||''))throw Error('Invalid recovery fence');const encoded=checkpointData(checkpoint),encodedViews=viewData(views);const result=await transact(current=>{if(!current||current.generation!==fence.generation||current.owner!==fence.owner)return;let old;try{old=JSON.parse(current.checkpoint);}catch{return;}if(!Number.isSafeInteger(old.tick)||checkpoint.tick<old.tick)return;return {...current,checkpoint:encoded,views:encodedViews};});if(!result.committed)throw Error('Recovery fence or checkpoint changed');return true;}
  };
}

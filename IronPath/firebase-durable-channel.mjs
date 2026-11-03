// Experimental transport for the recovery protocol. Lease changes switch the
// subscription to the new owner-scoped view. Not wired into live gameplay.
const key=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(v),owner=v=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v),enc=new TextEncoder();
export function createFirebaseDurableChannel({db,auth,sdk,partyId,hostId,playerIds,onError=()=>{}}){
 const uid=auth?.currentUser?.uid;if(!db||!key(uid)||!key(hostId)||! /^[a-f0-9]{32}$/.test(partyId)||!Array.isArray(playerIds)||![2,3,4].includes(playerIds.length)||new Set(playerIds).size!==playerIds.length||!playerIds.includes(uid)||!playerIds.includes(hostId)||!playerIds.every(key)||!sdk||!['ref','onValue','set'].every(k=>typeof sdk[k]==='function')||typeof onError!=='function')throw Error('Invalid durable channel');
 const root=`fourParties/${partyId}`,ref=p=>sdk.ref(db,`${root}/${p}`);let closed=false,lease=null,stopLease=null,stopView=null,leaseListener=null,viewListener=null,viewVersion=0,inputVersion=0,inputListener=null;const inputStops=[];
 const authorized=()=>!closed&&auth.currentUser?.uid===uid;
 function bindView(){
   viewVersion++;stopView?.();stopView=null;if(!authorized()||!viewListener||!lease)return;const current={...lease},version=viewVersion;
   stopView=sdk.onValue(ref(`recovery/sessions/${current.owner}/views/${uid}`),snapshot=>{if(!authorized()||version!==viewVersion)return;const raw=snapshot.val();if(raw===null)return;try{if(typeof raw!=='string'||enc.encode(raw).length>262144)throw Error('Invalid view');const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid view');viewListener({...value,generation:current.generation,owner:current.owner});}catch(error){onError(error);}},()=>{/* A lease change can revoke the old view before the new lease arrives. */});
 }
 function bindInputs(){
   inputVersion++;while(inputStops.length)inputStops.pop()();if(!authorized()||!lease||!inputListener)return;
   const current={...lease},version=inputVersion;
   for(const id of playerIds){const stop=sdk.onValue(ref(`recovery/inputs/${current.owner}/${id}`),snapshot=>{if(!authorized()||version!==inputVersion)return;const raw=snapshot.val();if(raw===null)return;try{if(typeof raw!=='string'||enc.encode(raw).length>4096)throw Error('Invalid input');const packet=JSON.parse(raw);if(!packet||typeof packet!=='object'||Array.isArray(packet))throw Error('Invalid input');inputListener(id,packet);}catch(error){onError(error);}},()=>{/* Previous owner access can be revoked before the lease event arrives. */});inputStops.push(stop);}
 }
 function bindLease(){if(stopLease||!authorized())return;stopLease=sdk.onValue(ref('recovery/lease'),snapshot=>{if(!authorized())return;const value=snapshot.val();if(!value||!Number.isSafeInteger(value.generation)||value.generation<1||!owner(value.owner))return;if(lease&&(value.generation<lease.generation||value.generation===lease.generation&&value.owner!==lease.owner)){onError(Error('Invalid recovery lease'));return;}if(!lease||value.generation!==lease.generation){lease={generation:value.generation,owner:value.owner};leaseListener?.({...lease});bindView();bindInputs();}},error=>{if(authorized())onError(error);});}
 return {
   watchLease(callback){if(typeof callback!=='function'||!authorized()||leaseListener)throw Error('Invalid lease subscription');leaseListener=callback;bindLease();if(lease)callback({...lease});return()=>{if(leaseListener===callback)leaseListener=null;};},
   watchView(callback){if(typeof callback!=='function'||!authorized()||viewListener)throw Error('Invalid view subscription');viewListener=callback;bindLease();bindView();return()=>{if(viewListener===callback){viewListener=null;viewVersion++;stopView?.();stopView=null;}};},
   watchInputs(callback){if(!authorized()||uid!==hostId||typeof callback!=='function'||inputListener)throw Error('Host required');inputListener=callback;bindLease();bindInputs();return()=>{if(inputListener===callback){inputListener=null;inputVersion++;while(inputStops.length)inputStops.pop()();}};},
   async writeInput(packet){if(!authorized())throw Error('Party identity changed');if(!lease||packet?.generation!==lease.generation||packet?.owner!==lease.owner)throw Error('Stale input');const raw=JSON.stringify(packet);if(enc.encode(raw).length>4096)throw Error('Input too large');await sdk.set(ref(`recovery/inputs/${lease.owner}/${uid}`),raw);if(!authorized())throw Error('Party identity changed');},
   async close(){closed=true;viewVersion++;inputVersion++;stopView?.();stopLease?.();while(inputStops.length)inputStops.pop()();}
 };
}

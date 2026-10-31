// Experimental player-hosted Firebase lobby primitives. Access control MUST be
// provided by Realtime Database rules; this module is not itself authorization.
// No game UI should enable these operations until those rules are tested.
const CODE=/^[a-f0-9]{32}$/;
const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
export function createFirebasePartyLobby({db,auth,sdk,crypto=globalThis.crypto}){
  if(!db||!auth||!sdk||typeof sdk.ref!=='function'||typeof sdk.runTransaction!=='function'||typeof sdk.get!=='function'||typeof sdk.onValue!=='function'||typeof crypto?.getRandomValues!=='function')throw new Error('Invalid party lobby configuration');
  const uid=auth.currentUser?.uid;if(!validUid(uid))throw new Error('Sign in required');
  function check(){if(auth.currentUser?.uid!==uid)throw new Error('Party identity changed');}
  function ref(code,path){if(!CODE.test(code))throw new Error('Invalid party code');return sdk.ref(db,`parties/${code}/${path}`);}
  function code(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
  return {
    // Generate a high-entropy capability locally, reserve its owner atomically.
    // Never use codes as URLs to choose where Firebase tokens are sent.
    async create(){
      check();for(let attempt=0;attempt<3;attempt++){
        const partyId=code();const result=await sdk.runTransaction(ref(partyId,'hostId'),current=>current===null?uid:undefined,{applyLocally:false});
        check();if(result.committed)return {partyId,hostId:uid};
      }throw new Error('Could not create party');
    },
    async join(partyId){
      check();const hostId=(await sdk.get(ref(partyId,'hostId'))).val();check();
      if(!validUid(hostId)||hostId===uid)throw new Error('Party unavailable');
      const result=await sdk.runTransaction(ref(partyId,'guestId'),current=>current===null||current===uid?uid:undefined,{applyLocally:false});
      check();if(!result.committed)throw new Error('Party unavailable');
      return {partyId,hostId,guestId:uid};
    },
    // Host may remove the entire party atomically; rules must enforce host-only
    // deletion without granting parent-level write access for normal edits.
    async close(partyId){
      check();if(typeof sdk.remove!=='function')throw new Error('Party cleanup unavailable');
      const hostId=(await sdk.get(ref(partyId,'hostId'))).val();check();
      if(hostId!==uid)return false;
      await sdk.remove(sdk.ref(db,`parties/${partyId}`));check();return true;
    },
    async leaveGuest(partyId){
      check();const result=await sdk.runTransaction(ref(partyId,'guestId'),current=>current===uid?null:undefined,{applyLocally:false});check();return result.committed;
    },
    watchGuest(partyId,callback,onError=()=>{}){
      check();if(typeof callback!=='function'||typeof onError!=='function')throw new Error('Callback required');
      return sdk.onValue(ref(partyId,'guestId'),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val());},onError);
    }
  };
}

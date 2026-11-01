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
      check();if(typeof sdk.remove!=='function')throw new Error('Party cleanup unavailable');
      const slot=ref(partyId,'guestId'),current=(await sdk.get(slot)).val();check();if(current!==uid)return false;
      // The database rules re-check ownership atomically at deletion time. A
      // transaction that aborts on the SDK's initial uncached null can silently
      // leave the guest slot occupied, so don't use one for this operation.
      await sdk.remove(slot);check();return true;
    },
    async publishProfile(partyId,profile){
      check();if(typeof sdk.set!=='function'||!profile||typeof profile.name!=='string'||profile.name.length<2||profile.name.length>24||!['male','female'].includes(profile.gender)||!Number.isInteger(profile.level)||profile.level<1||profile.level>1000)throw new Error('Invalid party profile');
      await sdk.set(ref(partyId,`profiles/${uid}`),{name:profile.name,gender:profile.gender,level:profile.level});check();
    },
    async startMatch(partyId){
      check();const hostId=(await sdk.get(ref(partyId,'hostId'))).val();const guestId=(await sdk.get(ref(partyId,'guestId'))).val();check();
      if(hostId!==uid||!validUid(guestId)||guestId===uid)throw new Error('Party is not ready');
      const [a,b]=await Promise.all([sdk.get(ref(partyId,`profiles/${uid}`)),sdk.get(ref(partyId,`profiles/${guestId}`))]);check();
      const profiles=[a.val(),b.val()];
      if(profiles.some(p=>!p||typeof p.name!=='string'||p.name.length<2||p.name.length>24||!['male','female'].includes(p.gender)||!Number.isInteger(p.level)||p.level<1||p.level>1000))throw new Error('Players are not ready');
      const result=await sdk.runTransaction(ref(partyId,'startedGuest'),value=>value===null?guestId:undefined,{applyLocally:false});check();
      if(!result.committed)throw new Error('Match already started');
      return {partyId,hostId,guestId,profiles};
    },
    watchMatch(partyId,callback,onError=()=>{}){check();return sdk.onValue(ref(partyId,'startedGuest'),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val());},onError);},
    watchHost(partyId,callback,onError=()=>{}){check();return sdk.onValue(ref(partyId,'hostId'),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val());},onError);},
    watchGuest(partyId,callback,onError=()=>{}){
      check();if(typeof callback!=='function'||typeof onError!=='function')throw new Error('Callback required');
      return sdk.onValue(ref(partyId,'guestId'),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val());},onError);
    }
  };
}

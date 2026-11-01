// Staged four-digit request flow. The separate four-digit Firebase rules must be
// deployed before this adapter can be enabled; the code alone grants no access.
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(value);
const validCode=value=>typeof value==='string'&&/^[0-9]{4}$/.test(value);
const validParty=value=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);
export function createFourDigitLobby({db,auth,sdk,crypto=globalThis.crypto,lobby}){
  if(!db||!auth||!sdk||!lobby||!['ref','get','set','remove','runTransaction','onValue'].every(k=>typeof sdk[k]==='function')||typeof crypto?.getRandomValues!=='function')throw Error('Invalid four-digit lobby');
  const uid=auth.currentUser?.uid;if(!validId(uid))throw Error('Sign in required');
  const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Party identity changed');};
  const ref=path=>sdk.ref(db,path);
  function code(){const bytes=new Uint32Array(1);do{crypto.getRandomValues(bytes);}while(bytes[0]>=4294960000);return String(bytes[0]%10000).padStart(4,'0');}
  return {
    async create(){
      check();const party=await lobby.create();let inviteCode=null;
      try{
        for(let i=0;i<40;i++){
          const candidate=code();const claimed=await sdk.runTransaction(ref(`partyCodes/${candidate}/hostId`),value=>value===null?uid:undefined,{applyLocally:false});check();
          if(claimed.committed){inviteCode=candidate;break;}
        }
        if(inviteCode===null)throw Error('No party code available');
        await sdk.set(ref(`parties/${party.partyId}/inviteCode`),inviteCode);check();
        await sdk.set(ref(`partyCodes/${inviteCode}/partyId`),party.partyId);check();
        return {...party,inviteCode};
      }catch(error){if(inviteCode!==null)await sdk.remove(ref(`partyCodes/${inviteCode}`)).catch(()=>{});await lobby.close(party.partyId).catch(()=>{});throw error;}
    },
    async request(inviteCode,name){
      check();if(!validCode(inviteCode)||typeof name!=='string'||name.length<2||name.length>24)throw Error('Invalid request');
      const base=`partyCodes/${inviteCode}`;
      const [hostSnap,partySnap]=await Promise.all([sdk.get(ref(`${base}/hostId`)),sdk.get(ref(`${base}/partyId`))]);check();
      const hostId=hostSnap.val(),partyId=partySnap.val();if(!validId(hostId)||hostId===uid||!validParty(partyId))throw Error('Party unavailable');
      await sdk.set(ref(`${base}/requests/${uid}`),{name});check();
      return {inviteCode,partyId,hostId,guestId:uid};
    },
    async readGuest(partyId){check();if(!validParty(partyId))throw Error('Invalid party');const result=await sdk.get(ref(`parties/${partyId}/guestId`));check();return result.val();},
    watchOwnRequest(inviteCode,callback,onError=()=>{}){check();if(!validCode(inviteCode))throw Error('Invalid code');return sdk.onValue(ref(`partyCodes/${inviteCode}/requests/${uid}`),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val());},onError);},
    async readStarted(partyId){check();if(!validParty(partyId))throw Error('Invalid party');const result=await sdk.get(ref(`parties/${partyId}/startedGuest`));check();return result.val();},
    watchRequests(inviteCode,callback,onError=()=>{}){check();if(!validCode(inviteCode))throw Error('Invalid code');return sdk.onValue(ref(`partyCodes/${inviteCode}/requests`),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val()||{});},onError);},
    async approve(partyId,inviteCode,guestId){
      check();if(!validParty(partyId)||!validCode(inviteCode)||!validId(guestId)||guestId===uid)throw Error('Invalid approval');
      // Rules require this exact requester, an empty slot, and the original guest
      // if the match has started. Do not silently replace a current guest.
      const result=await sdk.runTransaction(ref(`parties/${partyId}/guestId`),current=>current===null?guestId:undefined,{applyLocally:false});check();
      if(!result.committed)throw Error('Guest slot unavailable');
      await sdk.remove(ref(`partyCodes/${inviteCode}/requests/${guestId}`));check();return true;
    },
    async reject(inviteCode,guestId){check();if(!validCode(inviteCode)||!validId(guestId))throw Error('Invalid request');await sdk.remove(ref(`partyCodes/${inviteCode}/requests/${guestId}`));check();},
    async cancel(inviteCode){check();if(!validCode(inviteCode))throw Error('Invalid code');await sdk.remove(ref(`partyCodes/${inviteCode}/requests/${uid}`));check();},
    async close(partyId,inviteCode){check();if(!validCode(inviteCode))throw Error('Invalid code');await sdk.remove(ref(`partyCodes/${inviteCode}`));check();return lobby.close(partyId);}
  };
}

// Invitations are delivered only between accepted friends; direct joins use lobby rules.
export function createCoopInvites({db,auth,sdk}){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in required');
 const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Account changed');};
 const path=p=>sdk.ref(db,p);
 return {
  watch(callback,onError){check();return sdk.onValue(path(`coopInvites/${uid}`),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val()||{});},onError);},
  async send(to,party,name){check();if(!party||!/^\d{4}$/.test(party.code)||!/^[a-f0-9]{32}$/.test(party.partyId))throw Error('Create a multiplayer party first.');await sdk.set(path(`coopInvites/${to}/${uid}`),{partyId:party.partyId,code:party.code,name,createdAt:sdk.serverTimestamp()});check();},
  async dismiss(from,expected){
   check();
   if(typeof from!=='string'||!from||from.length>128||from===uid||/[.#$\[\]/\u0000-\u001f\u007f]/.test(from)||!expected||
      typeof expected.partyId!=='string'||!/^[a-f0-9]{32}$/.test(expected.partyId)||typeof expected.code!=='string'||!/^\d{4}$/.test(expected.code)||typeof expected.name!=='string'||
      !Number.isSafeInteger(expected.createdAt)||expected.createdAt<0||typeof sdk.onValue!=='function'||typeof sdk.runTransaction!=='function')throw Error('Invitation is no longer available. Check the inbox.');
   // A sender can overwrite the same path while the receiver is reading it.
   // Compare the observed invitation on every transaction retry; a delayed
   // decline/cleanup must not delete a later invitation from that sender.
   const identity={partyId:expected.partyId,code:expected.code,name:expected.name,createdAt:expected.createdAt},node=path(`coopInvites/${uid}/${from}`);let stop;
   try{
    // Warm the local SDK cache before the transaction: otherwise a first null
    // callback could abort even while the server has a matching invitation.
    await new Promise((resolve,reject)=>{stop=sdk.onValue(node,resolve,reject);});check();
    const result=await sdk.runTransaction(node,current=>current&&Object.keys(identity).every(key=>current[key]===identity[key])?null:undefined,{applyLocally:false});
    check();return result.committed===true;
   }finally{stop?.();}
  }
 };
}

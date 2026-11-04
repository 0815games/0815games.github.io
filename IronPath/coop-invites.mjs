// Invitations are delivered only between accepted friends; direct joins use lobby rules.
export function createCoopInvites({db,auth,sdk}){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in required');
 const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Account changed');};
 const path=p=>sdk.ref(db,p);
 return {
  watch(callback,onError){check();return sdk.onValue(path(`coopInvites/${uid}`),snapshot=>{if(auth.currentUser?.uid===uid)callback(snapshot.val()||{});},onError);},
  async send(to,party,name){check();if(!party||!/^\d{4}$/.test(party.code)||!/^[a-f0-9]{32}$/.test(party.partyId))throw Error('Create a multiplayer party first.');await sdk.set(path(`coopInvites/${to}/${uid}`),{partyId:party.partyId,code:party.code,name,createdAt:sdk.serverTimestamp()});check();},
  async dismiss(from){check();await sdk.remove(path(`coopInvites/${uid}/${from}`));check();}
 };
}

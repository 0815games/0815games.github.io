// Reserving a soldier name so two accounts cannot take the same one.
//
// The reservation lives under `characterNames/<key>` and holds exactly
// `{uid, name}`. It is claimed BEFORE the profile is written and released again
// if the profile never materializes, so a crashed enlistment does not squat a
// name forever.
//
// What this can and cannot promise:
//
//   * with the companion Rules published, two accounts racing for one name get
//     at most one winner - the loser is told the name is taken. THIS IS NOT
//     YET LIVE: the index path does not exist in the published Rules;
//   * until those Rules are published the write is refused, and the module
//     says `unsupported` instead of failing the enlistment. Character creation
//     keeps working exactly as before, and the module falls back to a
//     read-only check against the existing friend search index (best effort:
//     it only sees accounts that ever published a listing);
//   * it does NOT retroactively split names that already exist twice. Legacy
//     duplicates stay until the authorized inventory and migration - see
//     firebase/CHARACTER-NAME-AUDIT.md.

import {characterNameKey,sameCharacterName} from './character-name.mjs?v=20261031-patch4';

const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);

// The Firebase client rejects a rules denial with a PERMISSION_DENIED error;
// older bundles spell it `permission_denied`. Both mean the same thing here:
// the index is not part of the deployed ruleset yet.
function refused(error){
  const code=String(error?.code??'').toUpperCase();
  return /PERMISSION[_ -]?DENIED/.test(code)||/permission[_ -]?denied/i.test(String(error?.message??''));
}

export function createCharacterNameClaim({db,auth,sdk,isCurrent=()=>true}={}){
  const uid=auth?.currentUser?.uid;
  if(!validUid(uid)||![sdk?.ref,sdk?.get,sdk?.remove,sdk?.runTransaction].every(fn=>typeof fn==='function'))
    throw Error('Invalid name reservation session');
  const ref=path=>sdk.ref(db,path);
  const check=()=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account changed');};

  // Best-effort read of the public search index: no write, no promise. Used
  // only while the reservation rules are not live, and only to give the player
  // an honest "already taken" instead of a silent duplicate.
  async function indexedElsewhere(key,name){
    if(typeof sdk.query!=='function'||typeof sdk.orderByKey!=='function'||typeof sdk.limitToFirst!=='function')return null;
    try{
      const snap=await sdk.get(sdk.query(ref(`friendNames/${key}`),sdk.orderByKey(),sdk.limitToFirst(30)));
      const value=snap?.val?.()??null;
      if(!value||typeof value!=='object')return false;
      return Object.entries(value).some(([other,item])=>other!==uid&&typeof item?.name==='string'&&sameCharacterName(item.name,name));
    }catch{return null;} // Unknown, not free: never claim a name on an unreadable index.
  }

  return Object.freeze({
    // `claimed` - the name is reserved for this account.
    // `taken`   - another account holds it (`source` says where that was seen).
    // `unsupported` - the deployed rules do not know the index; enlistment may
    //                 continue, uniqueness is not enforced.
    async claim(name){
      check();
      const key=characterNameKey(name);
      // Read first. A refused read is the fast, ordinary signal that the
      // deployed rules do not know this path - and it cannot leave a
      // transaction retrying against a denial.
      try{
        const snap=await sdk.get(ref(`characterNames/${key}`));
        check();
        const value=snap?.val?.()??null;
        if(value?.uid===uid)return {status:'claimed',key};
        if(value?.uid)return {status:'taken',key,source:'index'};
      }catch(error){
        if(!refused(error))throw error;
        const elsewhere=await indexedElsewhere(key,name);
        if(elsewhere===true)return {status:'taken',key,source:'search'};
        return {status:'unsupported',key,seen:elsewhere};
      }
      // The read says the name is free; only the transaction decides a race.
      try{
        const result=await sdk.runTransaction(ref(`characterNames/${key}`),current=>{
          if(current===null||current===undefined)return {uid,name};
          if(current?.uid===uid)return current;          // already ours: keep it
          return undefined;                              // taken: abort without writing
        },{applyLocally:false});
        check();
        const value=result?.snapshot?.val?.()??null;
        if(value?.uid===uid)return {status:'claimed',key};
        return {status:'taken',key,source:'index'};
      }catch(error){
        if(refused(error))return {status:'unsupported',key};
        throw error;
      }
    },
    // Only the owner can free a name, and only their own. Used when enlistment
    // fails after reserving, and when a character is deleted on purpose.
    async release(name){
      check();
      const key=characterNameKey(name);
      try{
        const snap=await sdk.get(ref(`characterNames/${key}`));
        const value=snap?.val?.()??null;
        if(value?.uid!==uid)return {released:false};
        await sdk.remove(ref(`characterNames/${key}`));
        return {released:true,key};
      }catch(error){
        if(refused(error))return {released:false,unsupported:true};
        throw error;
      }
    },
  });
}

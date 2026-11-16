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
//     firebase/CHARACTER-NAME-AUDIT.md;
//   * a reservation whose owner never got a character (crashed enlistment),
//     or whose character was deleted in a different session, would otherwise
//     squat the name forever. Once such an entry is older than the grace
//     window it can be taken over - but ONLY THE RULES decide whether an entry
//     is abandoned; this module attempts the write and reads the refusal.
//     Until those Rules are published an abandoned entry simply stays put,
//     which is the safe direction: the name is blocked, not duplicated.

import {characterNameKey,sameCharacterName} from './character-name.mjs?v=20261031-patch4';

const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);

// The Firebase client rejects a rules denial with a PERMISSION_DENIED error;
// older bundles spell it `permission_denied`. Both mean the same thing here:
// the index is not part of the deployed ruleset yet.
function refused(error){
  const code=String(error?.code??'').toUpperCase(),message=String(error?.message??'');
  return /PERMISSION[_ -]?DENIED/.test(code)
    ||/permission[_ -]?denied/i.test(message)
    // A refused TRANSACTION is phrased differently by the client library:
    // "Client doesn't have permission to access the desired data."
    ||/doesn'?t have permission to access/i.test(message);
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
      const entry=()=>({uid,name,at:Date.now()});
      // Read first. A refused read is the fast, ordinary signal that the
      // deployed rules do not know this path - and it cannot leave a
      // transaction retrying against a denial.
      let held=null;
      try{
        const snap=await sdk.get(ref(`characterNames/${key}`));
        check();
        const value=snap?.val?.()??null;
        if(value?.uid===uid)return {status:'claimed',key};
        // Somebody else holds it. That is either a live character or an
        // abandoned reservation, and this client cannot tell which:
        // `players/<uid>` is readable by its owner only. So it asks the server.
        if(value?.uid)held=value;
      }catch(error){
        if(!refused(error))throw error;
        const elsewhere=await indexedElsewhere(key,name);
        if(elsewhere===true)return {status:'taken',key,source:'search'};
        return {status:'unsupported',key,seen:elsewhere};
      }
      try{
        const result=await sdk.runTransaction(ref(`characterNames/${key}`),current=>{
          if(current?.uid===uid)return current;                    // already ours: keep it
          if(held===null&&(current===null||current===undefined))return entry();
          if(held===null)return undefined;                         // lost the race: abort
          // Attempt to take over. THE RULES decide: the write passes only for
          // an abandoned entry (owner gone, older than the grace window).
          return entry();
        },{applyLocally:false});
        check();
        const value=result?.snapshot?.val?.()??null;
        if(value?.uid===uid)return held===null?{status:'claimed',key}:{status:'claimed',key,reclaimed:true};
        return {status:'taken',key,source:'index'};
      }catch(error){
        if(!refused(error))throw error;
        // This point is only reached after a SUCCESSFUL read of the index, so
        // the rules know the path. A refusal now refuses THIS write: the entry
        // still belongs to a live account. Reporting `unsupported` here would
        // wave the player through into creating a duplicate.
        if(held!==null)return {status:'taken',key,source:'index'};
        return {status:'unsupported',key};
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

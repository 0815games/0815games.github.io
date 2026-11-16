// Renaming a soldier.
//
// Block 2 needs this for the one case the operator's inventory will surface:
// two accounts already holding the same name, where one of them keeps it and
// the other chooses a new one. WHO may rename, WHEN, and what it costs is their
// decision and is not decided here - this is the mechanism.
//
// A name is stored in four places, and all four have to move together or they
// start disagreeing: the profile (`players/<uid>/name`), the public search
// listing (`friendNames/<key>/<uid>` plus `friendPrivate/<uid>/searchKey`), the
// friend code (`friendCodes/<code>/name`) and the name reservation
// (`characterNames/<key>`). This module writes them in ONE multi-location
// update, so the server sees them all at once and the Rules can check that
// they agree.
//
// What it can and cannot promise:
//
//   * with the companion Rules published, the rename is atomic: either every
//     one of those places moves, or none does. A rename into a name another
//     account holds is refused, and the player is told so;
//   * until those Rules are published the write is refused, because
//     `players/<uid>/name` is immutable today. The module reports
//     `unsupported` and changes NOTHING - renaming into a name we cannot check
//     would be exactly the duplicate this whole index exists to prevent;
//   * it does not rewrite names already stored inside existing friendships,
//     pending requests or leaderboard entries. Those keep the name as it was
//     when they were written; a friend sees the new name the next time that
//     record is refreshed. Known and documented, not silently "fixed".
import {validateCharacterName,characterNameKey,sameCharacterName} from './character-name.mjs?v=20261031-patch4';

const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const codePattern=/^[a-f0-9]{32}$/;

// The Firebase client rejects a rules denial with PERMISSION_DENIED; older
// bundles spell it `permission_denied`. A refused TRANSACTION or multi-location
// update is phrased differently again by the client library.
function refused(error){
 const code=String(error?.code??'').toUpperCase(),message=String(error?.message??'');
 return /PERMISSION[_ -]?DENIED/.test(code)
  ||/permission[_ -]?denied/i.test(message)
  ||/doesn'?t have permission to access/i.test(message);
}

export function createCharacterRename({db,auth,sdk,isCurrent=()=>true}={}){
 const uid=auth?.currentUser?.uid;
 if(!validUid(uid)||![sdk?.ref,sdk?.get,sdk?.update].every(fn=>typeof fn==='function'))
  throw Error('Invalid rename session');
 const ref=path=>sdk.ref(db,path);
 const check=()=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account changed');};
 const read=async path=>{check();const snap=await sdk.get(ref(path));check();return snap?.val?.()??null;};

 // Best effort, read-only: used only when the name index is not live yet, and
 // only to avoid a rename into a name that is plainly visible already.
 async function visibleElsewhere(key,name){
  if(typeof sdk.query!=='function'||typeof sdk.orderByKey!=='function'||typeof sdk.limitToFirst!=='function')return null;
  try{
   const snap=await sdk.get(sdk.query(ref(`friendNames/${key}`),sdk.orderByKey(),sdk.limitToFirst(30)));
   const value=snap?.val?.()??null;
   if(!value||typeof value!=='object')return false;
   return Object.entries(value).some(([other,item])=>other!==uid&&typeof item?.name==='string'&&sameCharacterName(item.name,name));
  }catch{return null;} // Unknown, not free: never rename into a name we cannot check.
 }

 return Object.freeze({
  // `renamed`      - every place moved; `moved` lists the paths that changed.
  // `unchanged`    - that is already the soldier's name (same comparison key).
  // `taken`        - another account holds the new name (`source` says where).
  // `unsupported`  - the deployed rules do not permit renaming; nothing changed.
  async rename(next){
   check();
   const validated=validateCharacterName(next);
   if(!validated.ok)throw Error('Enter the full soldier name (2–24 characters).');
   const name=validated.name,key=characterNameKey(name);

   let current,oldKey,code,held;
   try{
    current=await read(`players/${uid}/name`);
    oldKey=await read(`friendPrivate/${uid}/searchKey`);
    code=await read(`friendPrivate/${uid}/code`);
    held=await read(`characterNames/${key}`);
   }catch(error){
    if(!refused(error))throw error;
    return {status:'unsupported',key};
   }
   if(typeof current!=='string'||!current)throw Error('No soldier to rename.');
   if(characterNameKey(current)===key)return {status:'unchanged',key,current};
   if(typeof oldKey==='string'&&oldKey&&!/^(?:[a-f0-9]{2}){1,96}$/.test(oldKey))throw Error('Invalid friend search key');
   if(held===null){
    // The index is live (the read succeeded) but says nothing about the name?
    // That is a half-answer, so fall back to what is publicly visible.
    const elsewhere=await visibleElsewhere(key,name);
    if(elsewhere===false)held=undefined;
    else if(elsewhere===true)return {status:'taken',key,source:'search'};
   }
   if(held?.uid&&held.uid!==uid)return {status:'taken',key,source:'index'};

   const moved={
    [`players/${uid}/name`]:name,
    [`friendPrivate/${uid}/searchKey`]:key,
    [`friendNames/${key}/${uid}`]:{name,code:typeof code==='string'&&codePattern.test(code)?code:null},
    [`characterNames/${key}`]:{uid,name,at:Date.now()},
   };
   // The listing under the new key is what the Rules check the new name
   // against, so it is part of the same write - never a second step.
   if(typeof oldKey==='string'&&oldKey&&oldKey!==key){
    moved[`friendNames/${oldKey}/${uid}`]=null;
    moved[`characterNames/${oldKey}`]=null;
   }
   // The code keeps its value; only the advertised name follows the soldier.
   if(typeof code==='string'&&codePattern.test(code))moved[`friendCodes/${code}/name`]=name;

   try{
    await sdk.update(ref('/'),moved);
    check();
    return {status:'renamed',key,previous:current,moved:Object.keys(moved)};
   }catch(error){
    if(!refused(error))throw error;
    return {status:'unsupported',key,previous:current};
   }
  },
 });
}

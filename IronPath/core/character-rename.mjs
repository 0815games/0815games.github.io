// Renaming a soldier.
//
// Block 2 needs this for the one case the operator's inventory will surface:
// two accounts already holding the same name, where one of them keeps it and
// the other chooses a new one. WHO may rename, WHEN, and what it costs is their
// decision and is not decided here - this is the mechanism. There is no button
// wired to it yet, on purpose.
//
// A name is stored in four places, and all four have to move: the profile
// (`players/<uid>/name`), the public search listing (`friendNames/<key>/<uid>`
// plus `friendPrivate/<uid>/searchKey`), the friend code
// (`friendCodes/<code>/name`) and the name reservation
// (`characterNames/<key>`).
//
// The Rules cannot be made to check that they move TOGETHER: `root` inside a
// rule is the data as it was BEFORE the write, so a rule never sees what the
// client is moving in the same multi-location update. (The repository's own
// deletion path depends on exactly that: the leaderboard rules need the player
// to still exist while the player is being deleted in the same update.)
//
// So the invariant the Rules enforce is a different, checkable one:
//
//      A soldier who is published in the search index cannot change their
//      name. Unpublish first, rename, then publish again under the new name.
//
// What that buys, in order:
//
//   * the new name is RESERVED FIRST (character-name-claim.mjs). The index is
//     what stops two accounts from ending up with one name, and it is the one
//     place where the Rules say no - a rename into a name another account
//     holds is refused here, before anything else moves;
//   * the rename itself can then only contradict a listing that no longer
//     exists, which is why the listing is dropped first;
//   * every remaining step is an ordinary single write the game already makes
//     today, and every intermediate state is one the game already knows how to
//     heal: friends.mjs republishes the listing on the next account load.
//
// What it can and cannot promise:
//
//   * with the companion Rules published, a rename into a name another account
//     holds is refused, and the player is told so. Nothing moves in that case;
//   * until those Rules are published the index is unknown too, the very first
//     step reports `unsupported`, and NOTHING is touched - renaming into a name
//     nobody checked would be exactly the duplicate this whole index exists to
//     prevent;
//   * it does not rewrite names already stored inside existing friendships,
//     pending requests or leaderboard entries. Those keep the name as it was
//     when they were written; a friend sees the new name the next time that
//     record is refreshed. Known and documented, not silently "fixed";
//   * an interruption between two steps leaves a soldier who is temporarily
//     not findable - never one who is findable under a name that is not
//     theirs. The next account load republishes them.
import {validateCharacterName,characterNameKey} from './character-name.mjs?v=20261124-aim7';
import {createCharacterNameClaim} from './character-name-claim.mjs?v=20261124-aim7';
import {createFriendService} from './friends.mjs?v=20261124-aim7';

const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const codePattern=/^[a-f0-9]{32}$/;
const keyPattern=/^(?:[a-f0-9]{2}){1,96}$/;

// The Firebase client rejects a rules denial with PERMISSION_DENIED; older
// bundles spell it `permission_denied`. A refused transaction is phrased
// differently again by the client library.
function refused(error){
 const code=String(error?.code??'').toUpperCase(),message=String(error?.message??'');
 return /PERMISSION[_ -]?DENIED/.test(code)
  ||/permission[_ -]?denied/i.test(message)
  ||/doesn'?t have permission to access/i.test(message);
}

export function createCharacterRename({db,auth,sdk,crypto=globalThis.crypto,isCurrent=()=>true}={}){
 const uid=auth?.currentUser?.uid;
 if(!validUid(uid)||![sdk?.ref,sdk?.get,sdk?.set,sdk?.remove,sdk?.runTransaction].every(fn=>typeof fn==='function'))
  throw Error('Invalid rename session');
 const ref=path=>sdk.ref(db,path);
 const check=()=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account changed');};
 const read=async path=>{check();const snap=await sdk.get(ref(path));check();return snap?.val?.()??null;};
 const claim=createCharacterNameClaim({db,auth,sdk,isCurrent});
 const friends=createFriendService({db,auth,sdk,crypto});

 // Best effort, never fatal: put the soldier back into the index under the
 // name they still carry, so a refused rename does not leave them unfindable.
 async function republish(previous){
  try{
   const [searchKey,code]=await Promise.all([read(`friendPrivate/${uid}/searchKey`),read(`friendPrivate/${uid}/code`)]);
   if(typeof searchKey==='string'&&keyPattern.test(searchKey)&&typeof code==='string'&&codePattern.test(code))
    await sdk.set(ref(`friendNames/${searchKey}/${uid}`),{name:previous,code});
  }catch{} // The next account load publishes them anyway; never hide the real error.
 }

 return Object.freeze({
  // `renamed`      - the profile moved and the soldier was published again
  //                  under the new name (`republished:false` if only the
  //                  listing is still missing; the next account load fixes it).
  // `unchanged`    - that is already the soldier's name (same comparison key).
  // `taken`        - another account holds the new name (`source` says where).
  // `unsupported`  - the deployed rules do not permit renaming; nothing changed.
  async rename(next){
   check();
   const validated=validateCharacterName(next);
   if(!validated.ok)throw Error('Enter the full soldier name (2–24 characters).');
   const name=validated.name,key=characterNameKey(name);

   const current=await read(`players/${uid}/name`);
   if(typeof current!=='string'||!current)throw Error('No soldier to rename.');
   if(characterNameKey(current)===key)return {status:'unchanged',key,current};

   // 1. Reserve the new name. This is the step the Rules refuse when another
   //    account holds it, and it happens before anything else moves. It is
   //    also the step that reports `unsupported` while the index is not live -
   //    no name may change while uniqueness cannot be enforced.
   const reservation=await claim.claim(name);
   if(reservation.status!=='claimed')return reservation;

   const oldKey=await read(`friendPrivate/${uid}/searchKey`);
   if(oldKey!=null&&(typeof oldKey!=='string'||!keyPattern.test(oldKey)))throw Error('Invalid friend search key');

   // 2. Unpublish. The Rules allow the rename only while no listing of this
   //    account contradicts the new name - and a listing of the OLD name does.
   try{
    if(oldKey)await sdk.remove(ref(`friendNames/${oldKey}/${uid}`));
    check();
    // 3. The rename itself.
    await sdk.set(ref(`players/${uid}/name`),name);
    check();
   }catch(error){
    await republish(current);
    await claim.release(name);         // Give the new name back.
    if(!refused(error))throw error;
    return {status:'unsupported',key,previous:current};
   }

   // 4. Free the old name - last, never before the rename: between "old name
   //    released" and "profile renamed" another account could take it, and
   //    that is the duplicate this whole mechanism exists to prevent.
   const released=await claim.release(current);

   // 5. Publish again under the new name: moves the search key, writes the
   //    listing and refreshes the friend code. All ordinary writes, all
   //    already done by friends.mjs on every account load - so if this fails,
   //    the next load finishes the job.
   let republished=true,note=null;
   try{
    await friends.ensureSearchListing(name);
    check();
   }catch(error){
    republished=false;note=String(error?.message??error);
   }

   return {status:'renamed',key,previous:current,previousKey:oldKey??null,released:released.released===true,republished,note};
  },
 });
}

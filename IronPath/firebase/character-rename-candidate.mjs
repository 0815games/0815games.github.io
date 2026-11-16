// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Letting a soldier change their name. Block 2 needs this for the one case the
// operator's inventory will surface: two accounts already holding the same
// name, where exactly one of them keeps it. Who that is, and when a player may
// rename at all, is THEIR decision (see PATCH-BLOECKE.md, A1). What lives here
// is the mechanism, and the guard rails around it.
//
// Every change below is an OR added to an existing rule: nothing that is
// allowed today becomes forbidden. Two permissions are added:
//
//   1. `players/$uid/name` may change - but only when the search listing under
//      the account's CURRENT search key already carries the new name. The
//      rules cannot compute the name hash, so they cannot check that the key
//      matches the name; they CAN check that the listing and the profile agree.
//      A rename that forgets to move the listing is therefore refused.
//   2. `friendCodes/$code` may be refreshed by its owner - only to their own
//      current profile name. Today an entry can only be created, never
//      updated, so a renamed soldier's code would keep advertising the old
//      name forever.
//
// Both need the same atomic write: profile, search key, listing, code and the
// name reservation all move together. See character-rename.mjs.
const NAME_IMMUTABLE='(!data.exists() || newData.val() === data.val())';

// The listing under the account's current search key must already show the new
// name. `root` sees the whole multi-location update, so this holds only if the
// client moved the listing in the same write as the profile name.
const RENAME_CONSISTENT="root.child('friendPrivate').child($uid).child('searchKey').exists() && root.child('friendNames').child(root.child('friendPrivate').child($uid).child('searchKey').val()).child($uid).child('name').val() === newData.val()";

// Only the owner, only their own code, only the name, only to the profile name.
const CODE_REFRESH="data.exists() && data.child('uid').val() === auth.uid && newData.child('uid').val() === auth.uid && newData.child('name').val() === root.child('players').child(auth.uid).child('name').val()";

export function applyCharacterRenameRules(rules){
 const player=rules.players?.$uid;
 const name=player?.name?.['.validate'];
 if(typeof name!=='string'||!name.includes(NAME_IMMUTABLE))throw Error('Name rule reference changed; re-audit before building a candidate');
 // OR, never AND: a rename becomes permitted, nothing else changes.
 player.name['.validate']=name.replace(NAME_IMMUTABLE,`(!data.exists() || newData.val() === data.val() || (${RENAME_CONSISTENT}))`);

 const code=rules.friendCodes?.$code;
 const write=code?.['.write'];
 if(typeof write!=='string'||!write.includes('!data.exists()'))throw Error('Friend code rule reference changed; re-audit before building a candidate');
 code['.write']=`(${write}) || (auth != null && $code.matches(/^[a-f0-9]{32}$/) && ${CODE_REFRESH})`;
 return rules;
}

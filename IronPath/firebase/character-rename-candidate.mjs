// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Letting a soldier change their name. Block 2 needs this for legacy duplicate
// conflict resolution on login: two accounts already holding the same name,
// where the later login picks a new unique name without losing progress.
//
// Every change below is an OR added to an existing rule: nothing that is
// allowed today becomes forbidden.
//
// THE ONE THING THAT SHAPES ALL OF IT: `root` inside a rule is the data as it
// was BEFORE the write. A rule therefore cannot see what the client is moving
// in the same multi-location update, and no rule here may pretend otherwise.
// (The repository's own deletion path relies on exactly this: the leaderboard
// rules need the player to still exist while the player is being deleted.)
// So the rules cannot check that a rename and its listing AGREE. What they can
// check is that nothing CONTRADICTS the new name at the moment it is written.
//
// That gives one invariant, and it is the whole design:
//
//        A soldier who is published in the search index cannot change
//        their name. Unpublish first, then rename, then publish again.
//
// The module character-rename.mjs does exactly that, in that order. Every step
// of it is a single ordinary write, each one checked on its own, and every
// intermediate state is one the game already produces today and already knows
// how to heal (friends.mjs `ensureSearchListing` republishes on the next load).
//
// Three permissions, all additive (and recognizing bases such as BLOCK9D that
// already shipped owner searchKey/friendCode updates under MAINTENANCE_GATE):
//
//   1. `players/$uid/name` may change - while the soldier is not listed.
//   2. `friendPrivate/$uid/searchKey` may move - either added via OR on legacy
//      single-write rules, or preserved when social-cleanup/BLOCK9D already
//      allows owner searchKey updates.
//   3. `friendCodes/$code` may be refreshed by its owner - either added via OR
//      on legacy create-only rules, or preserved when social-cleanup/BLOCK9D
//      already allows owner refreshes matching `players/$uid/name`.
const NAME_IMMUTABLE='(!data.exists() || newData.val() === data.val())';

// No listing of this account under the key the account currently publishes.
// Either there is no key at all (never published, or the key was dropped), or
// the listing that belonged to it is already gone.
const UNLISTED="!root.child('friendPrivate').child($uid).child('searchKey').exists() || !root.child('friendNames').child(root.child('friendPrivate').child($uid).child('searchKey').val()).child($uid).exists()";

// The search key, twice: the legacy rule (first write only), the social-cleanup /
// BLOCK9D owner repair rule, and the move rule for legacy bases.
const SEARCH_KEY_FIRST_WRITE="auth != null && auth.uid === $uid && !data.exists() && root.child('players').child(auth.uid).exists()";
const SEARCH_KEY_SOCIAL_REPAIR="(!newData.exists() && data.exists()) || (newData.isString() && root.child('players').child(auth.uid).exists())";
const SEARCH_KEY_MOVE="auth != null && auth.uid === $uid && data.exists() && !root.child('friendNames').child(data.val()).child($uid).exists()";

// Only the owner, only their own code, only to their own current profile name.
const CODE_REFRESH="data.exists() && data.child('uid').val() === auth.uid && newData.child('uid').val() === auth.uid && newData.child('name').val() === root.child('players').child(auth.uid).child('name').val()";
const CODE_SOCIAL_REPAIR="data.exists() && data.child('uid').val() === auth.uid && (!newData.exists() || (newData.child('uid').val() === auth.uid && root.child('players').child(auth.uid).exists()))";
const CODE_SOCIAL_VALIDATE="newData.child('name').val() === root.child('players').child(auth.uid).child('name').val()";

export function applyCharacterRenameRules(rules){
 // 1. The name itself. The listing is the only thing that could contradict a
 //    new name, and it has to be gone first - see the header.
 const player=rules.players?.$uid;
 const name=player?.name?.['.validate'];
 if(typeof name!=='string'||!name.includes(NAME_IMMUTABLE))throw Error('Name rule reference changed; re-audit before building a candidate');
 player.name['.validate']=name.replace(NAME_IMMUTABLE,`(!data.exists() || newData.val() === data.val() || (auth != null && auth.uid === $uid && (${UNLISTED})))`);

 // 2. The search key has to be able to follow the name, or the soldier can
 //    never be found under the new one.
 const private$=rules.friendPrivate?.$uid;
 const searchKey=private$?.searchKey?.['.write'];
 if(typeof searchKey!=='string')throw Error('Search key rule reference changed; re-audit before building a candidate');
 if(searchKey.includes(SEARCH_KEY_SOCIAL_REPAIR)){
  // Already supports moving/updating searchKey (WORKSHOP / BLOCK5 / BLOCK9D),
  // preserving MAINTENANCE_GATE and owner boundary verbatim.
 }else if(searchKey.includes(SEARCH_KEY_FIRST_WRITE)){
  private$.searchKey['.write']=`(${searchKey}) || (${SEARCH_KEY_MOVE})`;
 }else{
  throw Error('Search key rule reference changed; re-audit before building a candidate');
 }

 // 3. The friend code advertises the name; let its owner refresh it.
 const code=rules.friendCodes?.$code;
 const write=code?.['.write'];
 const codeValidate=code?.['.validate'];
 if(typeof write!=='string')throw Error('Friend code rule reference changed; re-audit before building a candidate');
 if(write.includes(CODE_SOCIAL_REPAIR)&&typeof codeValidate==='string'&&codeValidate.includes(CODE_SOCIAL_VALIDATE)){
  // Already allows owner name refreshes under MAINTENANCE_GATE while enforcing
  // match with players/$uid/name (WORKSHOP / BLOCK5 / BLOCK9D).
 }else if(write.includes('!data.exists()')){
  code['.write']=`(${write}) || (auth != null && $code.matches(/^[a-f0-9]{32}$/) && ${CODE_REFRESH})`;
 }else{
  throw Error('Friend code rule reference changed; re-audit before building a candidate');
 }

 return rules;
}

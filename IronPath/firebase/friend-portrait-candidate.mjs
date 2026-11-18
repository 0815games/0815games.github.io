// OFFLINE candidate only. No credentials, network calls or deployment.
// The pinned workshop reference is not a fresh export of the live Rules:
// rebase and re-audit it before any separately authorized publication.
import {buildSocialCleanupCandidate} from './social-cleanup-candidate.mjs';

// The face, as the client stores it: the bounded string the avatar encoder
// produces ("g:f|face:crop|hair:bob"). Exactly the condition the pinned
// workshop reference, the pre-Block-2 draft and the staged draft all carry for
// `players/$uid/avatar` - 8 characters is the shortest encoding ("g:f|face:1"
// is not one we produce; "g:m|face:buzz" is 13), 64 leaves room for a face, a
// hair and a beard. The bound is a storage guard, not a format check: the
// client decodes anything it cannot understand to the gender's default face,
// so a stranger's junk string can never break a render.
export const AVATAR_VALIDATE='newData.isString() && newData.val().length >= 8 && newData.val().length <= 64';

// The already-reviewed friend condition: an accepted friendship, in either
// direction, plus the owner. Worded exactly as the friend-stats read grant in
// the pinned reference, because two spellings of the same permission is how a
// ruleset drifts apart.
export const FRIEND_READ="auth != null && (auth.uid === $uid || root.child('friendships').child($uid).child(auth.uid).child('status').val() === 'accepted' || root.child('friendships').child(auth.uid).child($uid).child('status').val() === 'accepted')";

const AUDIT='Portrait rule reference changed; re-audit before building a candidate';

// Applied to an existing ruleset, in place. It only ever ADDS:
//   * the `avatar` child of a player, when the ruleset does not have one yet -
//     today's published rules have no such field at all, and without it the
//     catch-all (`$other: {".validate": false}`) refuses the write, which is
//     why a freshly enlisted soldier's face never reaches the server;
//   * two child READ grants (gender + avatar) for confirmed friends.
// Never mutates a caller's object it was not handed, and never grants a write
// to anyone who does not already own the profile.
export function applyFriendPortraitRules(rules){
 const player=rules.players?.$uid;
 if(!player)throw Error(AUDIT);
 // Reuse exactly the already-reviewed access condition for friend stats when
 // the base has one; a base without friend stats (the published rules) gets the
 // same wording from the constant above, never a looser one.
 const shared=player.xp?.['.read'];
 if(shared!==undefined&&shared!==FRIEND_READ)throw Error(AUDIT);
 const friendRead=shared??FRIEND_READ;
 if(!player.gender||player.gender['.read'])throw Error(AUDIT);
 player.gender['.read']=friendRead;
 // RTDB read grants cascade: adding these two child grants does NOT permit
 // reading the parent profile or any other child, nor does it grant writes.
 const avatar=player.avatar;
 if(!avatar){
  // A ruleset that has never heard of the face: the field is created with the
  // pinned validation, so the owner may store it and nobody else may.
  player.avatar={'.validate':AVATAR_VALIDATE};
 }
 else {
  if(avatar['.read']||avatar['.validate']!==AVATAR_VALIDATE)throw Error(AUDIT);
 }
 player.avatar['.read']=friendRead;
 return rules;
}

export function buildFriendPortraitCandidate(bytes){
 const result=buildSocialCleanupCandidate(bytes);
 applyFriendPortraitRules(result.rules);
 return result;
}

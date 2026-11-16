// OFFLINE candidate only. No credentials, network calls or deployment.
// The pinned workshop reference is not a fresh export of the live Rules:
// rebase and re-audit it before any separately authorized publication.
import {buildSocialCleanupCandidate} from './social-cleanup-candidate.mjs';

// Applied to an existing ruleset, in place, and only ever ADDING two child
// read grants. Never mutates a caller's object it was not handed.
export function applyFriendPortraitRules(rules){
 const player=rules.players?.$uid;
 if(!player)throw Error('Portrait rule reference changed; re-audit before building a candidate');
 // Reuse exactly the already-reviewed access condition for friend stats.
 // RTDB read grants cascade: adding these two child grants does NOT permit
 // reading the parent profile or any other child, nor does it grant writes.
 const shared=player.xp?.['.read'];
 if(typeof shared!=='string'||!player.gender||!player.avatar||player.gender['.read']||player.avatar['.read'])throw Error('Portrait rule reference changed; re-audit before building a candidate');
 player.gender['.read']=shared;
 player.avatar['.read']=shared;
 return rules;
}

export function buildFriendPortraitCandidate(bytes){
 const result=buildSocialCleanupCandidate(bytes);
 applyFriendPortraitRules(result.rules);
 return result;
}

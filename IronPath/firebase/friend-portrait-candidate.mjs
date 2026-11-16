// OFFLINE candidate only. No credentials, network calls or deployment.
// The pinned workshop reference is not a fresh export of the live Rules:
// rebase and re-audit it before any separately authorized publication.
import {buildSocialCleanupCandidate} from './social-cleanup-candidate.mjs';

export function buildFriendPortraitCandidate(bytes){
 const result=buildSocialCleanupCandidate(bytes),player=result.rules.players.$uid;
 // Reuse exactly the already-reviewed access condition for friend stats.
 // RTDB read grants cascade: adding these two child grants does NOT permit
 // reading the parent profile or any other child, nor does it grant writes.
 const shared=player.xp['.read'];
 if(typeof shared!=='string'||!player.gender||!player.avatar||player.gender['.read']||player.avatar['.read'])throw Error('Portrait rule reference changed; re-audit before building a candidate');
 player.gender['.read']=shared;
 player.avatar['.read']=shared;
 return result;
}

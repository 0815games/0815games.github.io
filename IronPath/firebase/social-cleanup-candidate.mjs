// OFFLINE candidate only. This does not read credentials or publish Rules.
// The pinned source is the owner's checked-in reference, NOT a fresh export of
// production. Rebase and re-audit against the actual deployed Rules before use.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const SOCIAL_SOURCE_SHA256='8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577';
export function buildSocialCleanupCandidate(bytes){
 if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||createHash('sha256').update(bytes).digest('hex')!==SOCIAL_SOURCE_SHA256)throw Error('Social rules reference changed; re-audit before building a candidate');
 const result=JSON.parse(String(bytes)),rules=result.rules;
 // Keep ownership and profile-name validation. The owner may delete its old
 // code or refresh its name after an earlier re-enlistment, but cannot claim
 // another player's code. Deleting a code invalidates it; it is not rotated in
 // place or silently transferred to someone else.
 rules.friendCodes.$code['.write']="auth != null && $code.matches(/^[a-f0-9]{32}$/) && ((!data.exists() && newData.exists() && newData.child('uid').val() === auth.uid && root.child('players').child(auth.uid).exists()) || (data.exists() && data.child('uid').val() === auth.uid && (!newData.exists() || (newData.child('uid').val() === auth.uid && root.child('players').child(auth.uid).exists()))))";
 // The two private fields can be removed with the old character. Existing
 // accounts affected by the previous incomplete purge can also move their key
 // after re-enlisting; public listings still require the current profile name.
 rules.friendPrivate.$uid.code['.write']="auth != null && auth.uid === $uid && ((!data.exists() && newData.isString() && root.child('friendCodes').child(newData.val()).child('uid').val() === auth.uid) || (data.exists() && !newData.exists()))";
 rules.friendPrivate.$uid.searchKey['.write']="auth != null && auth.uid === $uid && ((!newData.exists() && data.exists()) || (newData.isString() && root.child('players').child(auth.uid).exists()))";
 // A request recipient may delete the sender's pointer *to that recipient*;
 // only the owner can create/change a pointer and only the owner can read it.
 rules.friendOutgoing.$uid.$other['.write']="auth != null && $uid !== $other && ((!newData.exists() && (auth.uid === $uid || auth.uid === $other)) || (auth.uid === $uid && newData.exists() && newData.child('code').val().matches(/^[a-f0-9]{32}$/) && root.child('friendCodes').child(newData.child('code').val()).child('uid').val() === $other && root.child('friendCodes').child(newData.child('code').val()).child('name').val() === newData.child('name').val()))";
 // A stale tab cannot publish new presence after its soldier was deleted.
 // Existing per-connection entries may still be removed by their owner.
 rules.friendPresence.$uid.$connection['.write']="auth != null && auth.uid === $uid && $connection.matches(/^[a-f0-9]{32}$/) && (!newData.exists() || root.child('players').child($uid).exists())";
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==2){console.error('Usage: node social-cleanup-candidate.mjs > reviewed-candidate.json');process.exitCode=2;}
 else {
  try{const bytes=await readFile(new URL('./WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));process.stdout.write(JSON.stringify(buildSocialCleanupCandidate(bytes),null,2)+'\n');}
  catch(error){console.error(error.message);process.exitCode=1;}
 }
}

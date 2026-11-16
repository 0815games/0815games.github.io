// OFFLINE candidate only. No credentials, network calls or deployment.
// The pinned workshop reference is not a fresh export of the live Rules:
// rebase and re-audit it before any separately authorized publication.
//
// What this adds: a `characterNames` index so two accounts cannot reserve the
// same soldier name. The Rules CANNOT verify that a key really is the
// normalization of the stored name - Firebase has no Unicode normalization -
// so what they enforce is: at most one entry per key, owned by the account
// that wrote it, removable only by that account. The comparison itself happens
// in character-name.mjs, the same code for every current client. Old or
// manipulated clients are therefore NOT fully covered by this alone; see
// CHARACTER-NAME-AUDIT.md. Legacy duplicates are not split by this candidate.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildSocialCleanupCandidate} from './social-cleanup-candidate.mjs';
import {CHARACTER_NAME_RESERVATION_GRACE_MS} from '../character-name.mjs';

// The same regex style the published rules use for `friendNames`. Firebase
// evaluates these with RE2; a non-capturing group made every read AND write
// fail, which is invisible to assertFails - only an assertSucceeds caught it.
export const CHARACTER_NAME_KEY_PATTERN='/^([a-f0-9]{2}){1,96}$/';

// A reservation is abandoned when its owner has no character AND the entry is
// older than the grace window. Both conditions, never one alone:
//   * profile missing alone - a live enlistment is mid-flight for a few
//     seconds, and stealing its name would create exactly the duplicate this
//     index exists to prevent;
//   * old alone - a character that has been playing for months is not
//     abandoned, no matter how stale the entry looks.
// `now` is the server clock, so a client cannot shorten the wait. The number
// comes from character-name.mjs, so the client and these rules cannot drift.
const ABANDONED=`data.exists() && newData.exists() && data.child('uid').isString() && data.child('at').isNumber() && data.child('at').val() <= now - ${CHARACTER_NAME_RESERVATION_GRACE_MS} && !root.child('players').child(data.child('uid').val()).exists()`;

// The index rules themselves, kept in ONE place: the offline candidate below
// and the composed Block 2 candidate share them, so what the emulator tests is
// what a publication would actually deploy.
export function characterNameIndexRules(){
 return {
    // No read at the root: the whole index at once would hand any signed-in
    // account the complete roster of names. A read of ONE key is granted by
    // the rule below - a deeper grant is not revoked by a shallower `false`,
    // which is what `friendNames` relies on today, and the emulator suite
    // asserts both halves of that.
    '.read':false,
    '$key':{
      '.read':`auth != null && $key.matches(${CHARACTER_NAME_KEY_PATTERN})`,
      '.write':`auth != null && $key.matches(${CHARACTER_NAME_KEY_PATTERN}) && ((!data.exists() && newData.exists()) || (data.exists() && data.child('uid').val() === auth.uid) || (${ABANDONED}))`,
      '.validate':"newData.hasChildren(['uid','name','at'])",
      // uid and name need their own named nodes BEFORE `$other` may say no:
      // `$other` matches every child not named here, so listing it while uid
      // and name were only checked in the parent `.validate` blocked the whole
      // node - every read and write failed, for a reason `assertFails` cannot
      // see. Same order as `players` in the reference rules.
      uid:{'.validate':"newData.isString() && newData.val() === auth.uid"},
      name:{'.validate':"newData.isString() && newData.val().length >= 2 && newData.val().length <= 24"},
      // The reservation time, and the only thing that makes the grace window
      // enforceable. An entry without a usable `at` stays protected: it cannot
      // be told apart from an enlistment that is still running.
      at:{'.validate':'newData.isNumber()'},
      '$other':{'.validate':false},
    },
  };
}

// Applied to an existing ruleset. NEVER mutates it: a publication replaces the
// whole ruleset, so this has to be additive on whatever base is handed in.
export function applyCharacterNameRules(rules){
 if(rules.characterNames)throw Error('Character name rules already present; rebase the candidate before rebuilding');
 rules.characterNames=characterNameIndexRules();
 return rules;
}

export function buildCharacterNameCandidate(bytes){
 const result=buildSocialCleanupCandidate(bytes);
 return applyCharacterNameRules(result.rules) && result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==2){console.error('Usage: node character-name-candidate.mjs > reviewed-candidate.json');process.exitCode=2;}
  else{
    try{
      const bytes=await readFile(new URL('./WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
      process.stdout.write(JSON.stringify(buildCharacterNameCandidate(bytes),null,2)+'\n');
    }catch(error){console.error(error.message);process.exitCode=1;}
  }
}

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

export const CHARACTER_NAME_KEY_PATTERN='/^(?:[a-f0-9]{2}){1,96}$/';

export function buildCharacterNameCandidate(bytes){
  const result=buildSocialCleanupCandidate(bytes),rules=result.rules;
  if(rules.characterNames)throw Error('Character name rules already present; rebase the candidate before rebuilding');
  // Reserve: signed in, path-shaped key, own uid, and nobody else holds it.
  // Release: only the owner. Nobody may hand a name to another account.
  // Read: a signed-in player must be able to check whether a name is free -
  // the same information the public friend search already exposes, and the
  // entry holds nothing but a uid and the display name.
  rules.characterNames={
    '.read':"auth != null",
    '$key':{
      '.read':`auth != null && $key.matches(${CHARACTER_NAME_KEY_PATTERN})`,
      '.write':`auth != null && $key.matches(${CHARACTER_NAME_KEY_PATTERN}) && ((!data.exists() && newData.exists()) || (data.exists() && data.child('uid').val() === auth.uid))`,
      '.validate':"newData.hasChildren(['uid','name']) && newData.child('uid').isString() && newData.child('uid').val() === auth.uid && newData.child('name').isString() && newData.child('name').val().length >= 2 && newData.child('name').val().length <= 24",
    },
  };
  return result;
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

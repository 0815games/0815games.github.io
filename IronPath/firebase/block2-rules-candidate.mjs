// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Applies the Block 2 rules cleanly onto a ruleset that is handed in:
//
//   1. friend portrait reads  - `players/$uid/{gender,avatar}` readable for
//      confirmed friends (added if missing, preserved verbatim when already
//      shipped in bases such as BLOCK9D-RULES-TO-PUBLISH.json).
//   2. the soldier name index - `characterNames/<key>`, so two accounts cannot
//      hold the same name, including the takeover rule for abandoned entries
//      (wrapped in MAINTENANCE_GATE when `_ironpathMaintenance` is present).
//   3. renaming - `players/$uid/name` may change while unlisted (and `searchKey`
//      / `friendCodes` updates are added on legacy bases or preserved on
//      BLOCK9D-style bases that already include them).
//
// Additive only: never drops, reorders, or weakens any live rule.
//
//   node block2-rules-candidate.mjs [base.json] [output.json]
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {applyFriendPortraitRules,AVATAR_VALIDATE,FRIEND_READ} from './friend-portrait-candidate.mjs';
import {applyCharacterNameRules} from './character-name-candidate.mjs';
import {applyCharacterRenameRules} from './character-rename-candidate.mjs';
import {MAINTENANCE_GATE} from '../release-tools/maintenance-rules.mjs';

const GATED_FRIEND_READ=`(${MAINTENANCE_GATE}) && (${FRIEND_READ})`;

// Firebase exports may wrap the rules in {rules:...}; the console copy is bare.
export function unwrapRules(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Rules must be a JSON object');
 const inner=value.rules;
 return inner&&typeof inner==='object'&&!Array.isArray(inner)?inner:value;
}

function hasExactFriendPortraitRules(rules){
 const player=rules?.players?.$uid;
 if(!player?.gender||!player?.avatar)return false;
 if(player.avatar['.validate']!==AVATAR_VALIDATE)return false;
 const validRead=rule=>rule===FRIEND_READ||rule===GATED_FRIEND_READ;
 return validRead(player.gender['.read'])&&validRead(player.avatar['.read']);
}

export function buildBlock2RulesCandidate(base){
 // Deep copy: the caller's ruleset must survive this call unchanged, and a
 // publication built from a half-mutated object is exactly the kind of mistake
 // that is invisible until players lose access.
 const rules=JSON.parse(JSON.stringify(unwrapRules(base)));
 if(!hasExactFriendPortraitRules(rules))applyFriendPortraitRules(rules);
 applyCharacterNameRules(rules);
 applyCharacterRenameRules(rules);
 return rules;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [baseFile,outputFile]=process.argv.slice(2);
 try{
  const file=baseFile??new URL('./pre-block2.complete.draft.rules.json',import.meta.url);
  const base=JSON.parse(await readFile(file,'utf8'));
  const text=JSON.stringify({rules:buildBlock2RulesCandidate(base)},null,2)+'\n';
  if(outputFile)await writeFile(outputFile,text);
  else process.stdout.write(text);
 }catch(error){console.error(error.message);process.exitCode=1;}
}

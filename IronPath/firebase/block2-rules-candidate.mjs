// OFFLINE candidate only. No credentials, network calls or deployment.
//
// The two rule blocks Block 2 still needs, in one place, applied to a ruleset
// that is handed in:
//
//   1. friend portrait reads  - `players/$uid/{gender,avatar}` readable for
//      confirmed friends, using the same condition the friend stats already
//      use. Read grants only; nothing becomes writable.
//   2. the soldier name index - `characterNames/<key>`, so two accounts cannot
//      hold the same name, including the takeover rule for abandoned entries.
//
// Both are ADDITIVE. Publishing a Realtime Database ruleset replaces it whole,
// so this builder never drops, reorders or rewrites a path it was not asked to
// change - it only adds.
//
// The base matters more than the builder. Two rulesets in this repository
// disagree with each other on `friendCodes`, `friendOutgoing`, `friendPresence`
// and `friendPrivate`: the pinned workshop reference and the staged complete
// draft. Only a FRESH EXPORT can say which one is live. So this takes the base
// as an argument:
//
//   node block2-rules-candidate.mjs [base.json] > candidate.json
//
// with no argument it uses the staged complete draft. Before any publication:
// export the live rules, keep a backup, run
// `IronPath/scripts/rules-publish-dry-run.mjs <export>` against the result, and
// compare. See BLOCK2-RULES-HANDOVER.md.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {applyFriendPortraitRules} from './friend-portrait-candidate.mjs';
import {applyCharacterNameRules} from './character-name-candidate.mjs';

// Firebase exports may wrap the rules in {rules:...}; the console copy is bare.
export function unwrapRules(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Rules must be a JSON object');
 const inner=value.rules;
 return inner&&typeof inner==='object'&&!Array.isArray(inner)?inner:value;
}

export function buildBlock2RulesCandidate(base){
 // Deep copy: the caller's ruleset must survive this call unchanged, and a
 // publication built from a half-mutated object is exactly the kind of mistake
 // that is invisible until players lose access.
 const rules=JSON.parse(JSON.stringify(unwrapRules(base)));
 applyFriendPortraitRules(rules);
 applyCharacterNameRules(rules);
 return rules;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [target]=process.argv.slice(2);
 const file=target??new URL('./workshop.complete.draft.rules.json',import.meta.url);
 try{
  const base=JSON.parse(await readFile(file,'utf8'));
  const text=JSON.stringify({rules:buildBlock2RulesCandidate(base)},null,2)+'\n';
  if(target)await writeFile(target.replace(/\.json$/,'')+'.block2.rules.json',text);
  else process.stdout.write(text);
 }catch(error){console.error(error.message);process.exitCode=1;}
}

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
//   3. renaming - so a name can be changed without leaving the search index,
//      the friend code or the name reservation behind. Who may rename, and
//      when, is the operator's decision; this only makes it possible and keeps
//      the four places that store a name in step.
//
// Both are ADDITIVE. Publishing a Realtime Database ruleset replaces it whole,
// so this builder never drops, reorders or rewrites a path it was not asked to
// change - it only adds.
//
// The base matters more than the builder, so it is an ARGUMENT, never a guess:
//
//   node block2-rules-candidate.mjs [base.json] [output.json]
//
// Default base is `pre-block2.complete.draft.rules.json`, the ruleset known
// before this step - NOT the staged draft, which already carries these rules
// and would make the guards refuse (that refusal is deliberate: applying the
// same block twice is exactly the mistake it prevents). Default output is
// stdout.
//
// Two rulesets in this repository disagree with each other on `friendCodes`,
// `friendOutgoing`, `friendPresence` and `friendPrivate`: the pinned workshop
// reference and the pre-Block-2 draft. Only a FRESH EXPORT can say which one
// is live, so for publication feed the export in here. Before any publication:
// export the live rules, keep a backup, run
// `IronPath/scripts/rules-publish-dry-run.mjs <export>` against the result, and
// compare. See BLOCK2-RULES-HANDOVER.md.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {applyFriendPortraitRules} from './friend-portrait-candidate.mjs';
import {applyCharacterNameRules} from './character-name-candidate.mjs';
import {applyCharacterRenameRules} from './character-rename-candidate.mjs';

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

// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Consolidated publish candidate (Block 2 + pre-wired Block 6 tutorial rules):
// Applies additively over `BLOCK9D-RULES-TO-PUBLISH.json` (or a fresh live
// export passed on argv[2]), preserving activeSessions, Block 5 V2 skills,
// Block 4 friend portraits, social cleanup, and MAINTENANCE_GATE:
//   1. Adds `characterNames/$key` protected by MAINTENANCE_GATE when
//      `_ironpathMaintenance` exists on the base ruleset.
//   2. Allows `players/$uid/name` updates only while the soldier is unlisted
//      from `friendNames` (enforcing the unpublish -> rename -> republish order).
//   3. Adds `players/$uid/tutorial` for per-character Block 6 tutorial status,
//      pause/resume phase+step, and monotonic `rewarded`/`missionCompleted`
//      locks (wiped cleanly on full character deletion).
//
// Rebase onto a fresh live Firebase export before any separately authorized
// publication:
//   node IronPath/firebase/block2-publish-candidate.mjs [live-export.json] > candidate.json
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildBlock2RulesCandidate} from './block2-rules-candidate.mjs';
import {applyBlock6TutorialRules} from './block6-tutorial-candidate.mjs';

export const BLOCK9D_RULES_SHA256='087da120ac86774f536c98c220270aa069920abca82b15a7018ac53c610fee1b';

export function applyBlock2PublishRules(rules){
 return applyBlock6TutorialRules(buildBlock2RulesCandidate(rules));
}

export function buildBlock2PublishCandidate(bytes){
 if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||createHash('sha256').update(bytes).digest('hex')!==BLOCK9D_RULES_SHA256){
  throw Error('Block 9D rules reference changed; re-audit before building Block 2 publish candidate');
 }
 const parsed=JSON.parse(String(bytes));
 if(!parsed?.rules)throw Error('Expected complete rules wrapper');
 return {rules:applyBlock2PublishRules(parsed)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length>3){
  console.error('Usage: node block2-publish-candidate.mjs [base-export.json] > candidate.json');
  process.exitCode=2;
 }else{
  try{
   const basePath=process.argv[2];
   const bytes=await readFile(basePath?resolve(basePath):new URL('./BLOCK9D-RULES-TO-PUBLISH.json',import.meta.url));
   if(basePath){
    const parsed=JSON.parse(String(bytes));
    process.stdout.write(JSON.stringify({rules:applyBlock2PublishRules(parsed)},null,2)+'\n');
   }else{
    process.stdout.write(JSON.stringify(buildBlock2PublishCandidate(bytes),null,2)+'\n');
   }
  }catch(error){
   console.error(error.message);
   process.exitCode=1;
  }
 }
}

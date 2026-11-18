// OFFLINE candidate only. No credentials, network calls or deployment.
//
// Block 5 skill overhaul RTDB rules update:
// Updates the three `skills/.validate` expressions (players/$uid/skills,
// parties/$partyId/profiles/$uid/skills, fourParties/$partyId/profiles/$uid/skills)
// so they accept BOTH:
//   - V2 encoded class builds (`v2;none` and `v2;<classId>;<rank 1..3>;<variant 0..2>;<14-bit tree>`
//     across the 6 classes: assault, engineer, logistics, medic, recon, airDefense), AND
//   - Legacy V1 builds during rolling upgrades & client-driven migration
//     (`0,0,0,0,0;assault`..75-bit suffixes across the original 5 paths).
//
// Additive & guarded: never touches `WORKSHOP-RULES-TO-PUBLISH.json` in place,
// never loosens ownership or `$other: { ".validate": false }`, never adds
// unreviewed read/write grants, and fails loudly if any of the 3 skill validators
// differs from the pinned baseline. Rebase onto a fresh live Firebase export
// before any separately authorized publication:
//
//   node IronPath/firebase/block5-skills-candidate.mjs [exported-live.json] > candidate.json
//
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BLOCK5_SOURCE_SHA256='8041607e1adb3f235afffde8f581ebf6a06afdee99eb642a4d460ad938a04577';

export const LEGACY_SKILLS_VALIDATE='newData.isString() && newData.val().matches(/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10}(;[12]|;[012];[01]{40}([01]{15}([01]{20})?)?)?)?$/)';
export const V2_SKILLS_MATCH='newData.val().matches(/^v2;(none|(assault|engineer|logistics|medic|recon|airDefense);[1-3];[0-2];[01]{14})$/)';
export const BLOCK5_SKILLS_VALIDATE=`newData.isString() && (${V2_SKILLS_MATCH} || newData.val().matches(/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10}(;[12]|;[012];[01]{40}([01]{15}([01]{20})?)?)?)?$/))`;

const AUDIT='Block 5 skills rule reference changed; re-audit before building a candidate';

export function unwrapRules(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Rules must be a JSON object');
  const inner=value.rules;
  return inner&&typeof inner==='object'&&!Array.isArray(inner)?inner:value;
}

export function applyBlock5SkillsRules(rules){
  const targets=[
    rules?.players?.$uid?.skills,
    rules?.parties?.$partyId?.profiles?.$uid?.skills,
    rules?.fourParties?.$partyId?.profiles?.$uid?.skills
  ];
  for(const node of targets){
    if(!node||node['.validate']!==LEGACY_SKILLS_VALIDATE)throw Error(AUDIT);
  }
  for(const node of targets){
    node['.validate']=BLOCK5_SKILLS_VALIDATE;
  }
  return rules;
}

export function buildBlock5SkillsCandidate(bytes){
  if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||createHash('sha256').update(bytes).digest('hex')!==BLOCK5_SOURCE_SHA256){
    throw Error(AUDIT);
  }
  const result=JSON.parse(String(bytes));
  if(!result?.rules)throw Error(AUDIT);
  applyBlock5SkillsRules(result.rules);
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length>3){
    console.error('Usage: node block5-skills-candidate.mjs [base-export.json] > candidate.json');
    process.exitCode=2;
  }else{
    try{
      const basePath=process.argv[2];
      const bytes=await readFile(basePath?resolve(basePath):new URL('./WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
      const output=basePath
        ? (()=>{const parsed=JSON.parse(String(bytes));const wrapped=parsed?.rules?parsed:{rules:unwrapRules(parsed)};applyBlock5SkillsRules(wrapped.rules);return wrapped;})()
        : buildBlock5SkillsCandidate(bytes);
      process.stdout.write(JSON.stringify(output,null,2)+'\n');
    }catch(error){
      console.error(error.message);
      process.exitCode=1;
    }
  }
}

// OFFLINE candidate only. No credentials, network calls, or deployment.
//
// Block 9D single-session RTDB rules update:
// Adds `/rules/activeSessions/$uid` over `BLOCK5-RULES-TO-PUBLISH.json` (or a
// fresh live export passed on argv[2]) so concurrent logins from separate
// browser profiles, private/incognito windows, or devices are refused server-side
// while an active session's heartbeat is fresh (`heartbeatAt + 45000 >= now`).
//
// Additive & guarded:
//   - Keeps `WORKSHOP-RULES-TO-PUBLISH.json` and `BLOCK5-RULES-TO-PUBLISH.json`
//     pinned and untouched.
//   - Refuses to overwrite an existing `activeSessions` rule or un-audited
//     `_ironpathRelease` root control.
//   - Wraps `activeSessions.$uid` reads and writes in `MAINTENANCE_GATE` when
//     `_ironpathMaintenance` is present on the base ruleset.
//
// Rebase onto a fresh live Firebase export before any separately authorized
// publication:
//   node IronPath/firebase/block9d-session-candidate.mjs [live-export.json] > candidate.json
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {MAINTENANCE_GATE} from '../release-tools/maintenance-rules.mjs';
import {MAINTENANCE_PATH} from '../maintenance-check.mjs';

export const BLOCK5_RULES_SHA256='ab8421e7e3ae2070b96f831f5963251c363d1520ce3bd2374d1e4ace068dd72d';
export const ACTIVE_SESSION_LEASE_MS=45_000;

export function buildActiveSessionsRules({withMaintenanceGate=true}={}){
 const gate=withMaintenanceGate?`(${MAINTENANCE_GATE}) && `:'';
 return {
  $uid:{
   '.read':`${gate}(auth != null && auth.uid === $uid)`,
   '.write':`${gate}(auth != null && auth.uid === $uid && (!newData.exists() || !data.exists() || data.child('clientId').val() === newData.child('clientId').val() || (data.child('heartbeatAt').isNumber() && data.child('heartbeatAt').val() + ${ACTIVE_SESSION_LEASE_MS} < now)))`,
   '.validate':"newData.hasChildren(['clientId', 'claimedAt', 'heartbeatAt'])",
   clientId:{
    '.validate':'newData.isString() && newData.val().matches(/^[a-f0-9]{32}$/)'
   },
   claimedAt:{
    '.validate':'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= now'
   },
   heartbeatAt:{
    '.validate':'newData.isNumber() && newData.val() === now'
   },
   $other:{
    '.validate':false
   }
  }
 };
}

export function applyBlock9dSessionRules(rules){
 if(!rules||typeof rules!=='object'||Array.isArray(rules))throw Error('Rules must be a JSON object');
 if(Object.hasOwn(rules,'_ironpathRelease'))throw Error('Existing _ironpathRelease control requires manual audit');
 if(Object.hasOwn(rules,'activeSessions'))throw Error('activeSessions rule already exists; audit before regenerating');
 const withMaintenanceGate=Object.hasOwn(rules,MAINTENANCE_PATH);
 rules.activeSessions=buildActiveSessionsRules({withMaintenanceGate});
 return rules;
}

export function buildBlock9dSessionCandidate(bytes){
 if(!(typeof bytes==='string'||bytes instanceof Uint8Array)||createHash('sha256').update(bytes).digest('hex')!==BLOCK5_RULES_SHA256){
  throw Error('Block 5 rules reference changed; re-audit before building Block 9D candidate');
 }
 const result=JSON.parse(String(bytes));
 if(!result?.rules)throw Error('Expected complete rules wrapper');
 applyBlock9dSessionRules(result.rules);
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length>3){
  console.error('Usage: node block9d-session-candidate.mjs [base-export.json] > candidate.json');
  process.exitCode=2;
 }else{
  try{
   const basePath=process.argv[2];
   const bytes=await readFile(basePath?resolve(basePath):new URL('./BLOCK5-RULES-TO-PUBLISH.json',import.meta.url));
   if(basePath){
    const parsed=JSON.parse(String(bytes));
    const wrapped=parsed?.rules&&typeof parsed.rules==='object'?parsed:{rules:parsed};
    applyBlock9dSessionRules(wrapped.rules);
    process.stdout.write(JSON.stringify(wrapped,null,2)+'\n');
   }else{
    process.stdout.write(JSON.stringify(buildBlock9dSessionCandidate(bytes),null,2)+'\n');
   }
  }catch(error){
   console.error(error.message);
   process.exitCode=1;
  }
 }
}

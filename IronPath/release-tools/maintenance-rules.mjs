// LOCAL CANDIDATE ONLY: no credentials, network calls, or deployment.
// Every original RTDB grant must be wrapped: parent grants cascade and cannot
// be revoked by a child denial. The public control node itself is read-only.
// An auth_time cutoff invalidates old ordinary Firebase logins after reopening;
// it does not attest the executing build, or stop a manipulated client from
// signing in again. Rules and actual live state must be independently reviewed.
import {MAINTENANCE_PATH} from '../maintenance-check.mjs';

export const MAINTENANCE_GATE=`auth != null && root.child('${MAINTENANCE_PATH}').child('format').val() === 1 && root.child('${MAINTENANCE_PATH}').child('mode').val() === 'open' && root.child('${MAINTENANCE_PATH}').child('authAfterMs').isNumber() && root.child('${MAINTENANCE_PATH}').child('authAfterMs').val() >= 0 && root.child('${MAINTENANCE_PATH}').child('authAfterMs').val() % 1 === 0 && auth.token.auth_time * 1000 > root.child('${MAINTENANCE_PATH}').child('authAfterMs').val()`;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const denied=value=>value===false||(typeof value==='string'&&value.trim()==='false');

export function buildMaintenanceRulesCandidate(source){
 if(!object(source)||!object(source.rules))throw Error('Expected a complete Rules object');
 const original=source.rules;
 for(const key of ['.read','.write'])if(!Object.hasOwn(original,key)||!denied(original[key]))throw Error(`Root ${key} must be explicitly false`);
 if(Object.hasOwn(original,MAINTENANCE_PATH)||Object.hasOwn(original,'_ironpathRelease'))throw Error('An existing release control requires a manual audit');
 if(Object.keys(original).some(key=>key.startsWith('$')))throw Error('Root wildcards require a manual audit');
 const counts={readWrapped:0,writeWrapped:0,readDenied:0,writeDenied:0};
 function visit(node,path){
  if(!object(node))throw Error(`Invalid Rules node at ${path||'/'}`);
  const result=Object.create(null);
  for(const [key,value] of Object.entries(node)){
   if(key==='.read'||key==='.write'){
    if(!(typeof value==='boolean'||(typeof value==='string'&&value.trim())))throw Error(`Invalid ${key} at ${path||'/'}`);
    const prefix=key==='.read'?'read':'write';
    if(denied(value)){counts[`${prefix}Denied`]++;result[key]=value;}
    else{counts[`${prefix}Wrapped`]++;result[key]=`(${MAINTENANCE_GATE}) && (${String(value)})`;}
   }else if(key==='.validate'||key==='.indexOn')result[key]=structuredClone(value);
   else if(key.startsWith('.'))throw Error(`Unknown Rules directive ${key} at ${path||'/'}`);
   else result[key]=visit(value,`${path}/${key}`);
  }
  return result;
 }
 const rules=visit(original,'');rules[MAINTENANCE_PATH]={'.read':true,'.write':false};
 return {candidate:{...structuredClone(source),rules},counts:Object.freeze(counts)};
}

// LOCAL CANDIDATE ONLY: no credentials, network calls, or deployment.
// Every original RTDB grant must be wrapped: parent grants cascade and cannot
// be revoked by a child denial. The control node is publicly readable; writes
// are denied unless a separately specified administrator UID is configured.
// An auth_time cutoff invalidates old ordinary Firebase logins after reopening;
// it does not attest the executing build, or stop a manipulated client from
// signing in again. Rules and actual live state must be independently reviewed.
import {MAINTENANCE_PATH,MAINTENANCE_ADMIN_ACCESS_PATH} from '../maintenance-check.mjs';

export const MAINTENANCE_GATE=`auth != null && root.child('${MAINTENANCE_PATH}').child('format').val() === 1 && root.child('${MAINTENANCE_PATH}').child('mode').val() === 'open' && root.child('${MAINTENANCE_PATH}').child('authAfterMs').isNumber() && root.child('${MAINTENANCE_PATH}').child('authAfterMs').val() >= 0 && root.child('${MAINTENANCE_PATH}').child('authAfterMs').val() % 1 === 0 && auth.token.auth_time * 1000 > root.child('${MAINTENANCE_PATH}').child('authAfterMs').val()`;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const denied=value=>value===false||(typeof value==='string'&&value.trim()==='false');

// A dedicated Firebase Auth UID is a public identifier, not a password or a
// token. Restrict its syntax before embedding it in a Rules expression. The
// operator must obtain and verify the real UID independently; there is no
// default administrator. These rules authorize ONLY the maintenance record,
// including while the game is closed, and only valid state transitions.
function validateAdminUid(adminUid){
 if(typeof adminUid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(adminUid))throw Error('Invalid administrator UID');
}
export function maintenanceAdminAccessRules(adminUid){
 validateAdminUid(adminUid);
 return {'.read':`auth != null && auth.uid === '${adminUid}'`,'.write':false};
}
export function maintenanceAdminRules(adminUid){
 validateAdminUid(adminUid);
 const current="data.child('authAfterMs')",next="newData.child('authAfterMs')";
 const write=`auth != null && auth.uid === '${adminUid}' && data.child('format').val() === 1 && ${current}.isNumber() && ${current}.val() >= 0 && ${current}.val() % 1 === 0 && ((data.child('mode').val() === 'open' && newData.child('mode').val() === 'maintenance' && ${next}.val() === ${current}.val()) || (data.child('mode').val() === 'maintenance' && newData.child('mode').val() === 'open' && ${next}.val() === now && ${next}.val() > ${current}.val()))`;
 return {
  '.read':true,'.write':write,
  '.validate':"newData.hasChildren(['format','mode','authAfterMs'])",
  format:{'.validate':'newData.isNumber() && newData.val() === 1'},
  mode:{'.validate':"newData.isString() && (newData.val() === 'open' || newData.val() === 'maintenance')"},
  authAfterMs:{'.validate':'newData.isNumber() && newData.val() >= 0 && newData.val() <= 9007199254740991 && newData.val() % 1 === 0'},
  $other:{'.validate':false}
 };
}

export function buildMaintenanceRulesCandidate(source,{adminUid=null}={}){
 if(!object(source)||!object(source.rules))throw Error('Expected a complete Rules object');
 const original=source.rules;
 for(const key of ['.read','.write'])if(!Object.hasOwn(original,key)||!denied(original[key]))throw Error(`Root ${key} must be explicitly false`);
 if(Object.hasOwn(original,MAINTENANCE_PATH)||Object.hasOwn(original,MAINTENANCE_ADMIN_ACCESS_PATH)||Object.hasOwn(original,'_ironpathRelease'))throw Error('An existing release control requires a manual audit');
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
 const rules=visit(original,'');rules[MAINTENANCE_PATH]=adminUid===null?{'.read':true,'.write':false}:maintenanceAdminRules(adminUid);
 if(adminUid!==null)rules[MAINTENANCE_ADMIN_ACCESS_PATH]=maintenanceAdminAccessRules(adminUid);
 return {candidate:{...structuredClone(source),rules},counts:Object.freeze(counts)};
}

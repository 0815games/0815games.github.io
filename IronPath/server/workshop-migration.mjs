// Offline migration rehearsal helpers. These DO NOT read, write, back up or
// migrate any real account. Checkpoints must be stored in trusted, access-
// controlled storage and applied by an authenticated server-side transaction.
import {createHash} from 'node:crypto';
import {initializeWireWorkshop,decodeWorkshop} from '../workshop-wire.mjs';
const validUid=value=>typeof value==='string'&&value.length>0&&value.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(value);
function canonical(value,ancestors=new Set(),depth=0){
 if(depth>50)throw Error('Nested profile too deep');
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(typeof value!=='object'||ancestors.has(value))throw Error('Invalid profile value');
 if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw Error('Invalid profile object');
 ancestors.add(value);let result;
 if(Array.isArray(value)){if(Object.keys(value).length!==value.length)throw Error('Invalid profile array');result='['+value.map(item=>canonical(item,ancestors,depth+1)).join(',')+']';}
 else result='{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key],ancestors,depth+1)).join(',')+'}';
 ancestors.delete(value);return result;
}
function digest(uid,profile){return createHash('sha256').update(JSON.stringify(['workshop-migration-v1',uid,canonical(profile)])).digest('hex');}
// Produces detached values for review. Caller must never commit this result
// without comparing the original inside a real account transaction.
export function planMigration(uid,profile){
 if(!validUid(uid)||!profile||typeof profile!=='object'||Array.isArray(profile))return {status:'invalid'};
 try{
  canonical(profile);
  if(Object.hasOwn(profile,'workshop'))return {status:decodeWorkshop(profile.workshop)?'already-migrated':'unsupported'};
  const after=initializeWireWorkshop(profile);if(!after)return {status:'invalid'};
  return {status:'ready',before:structuredClone(profile),after:structuredClone(after),beforeDigest:digest(uid,profile),checkpoint:{version:1,uid,afterDigest:digest(uid,after)}};
 }catch{return {status:'invalid'};}
}
// Compare the current profile against the reviewed preimage *inside* the
// account transaction, not on a cached get. Returns null if anything changed.
export function applyPlannedMigration(uid,current,plan){
 if(!plan||plan.status!=='ready'||!validUid(uid)||plan.checkpoint?.uid!==uid)return null;
 try{if(digest(uid,current)!==plan.beforeDigest)return null;const next=initializeWireWorkshop(current);if(!next||digest(uid,next)!==plan.checkpoint.afterDigest)return null;return next;}catch{return null;}
}
// Conservative rollback is permitted only if the entire account is byte-for-
// byte equivalent as JSON data to its recorded post-migration state. ANY later
// progress, spending, receipts, skills or unrelated change requires manual
// reconciliation; never restore the old profile over the new one.
export function rollbackUnchangedMigration(uid,current,checkpoint){
 if(!validUid(uid)||!checkpoint||checkpoint.version!==1||checkpoint.uid!==uid||typeof checkpoint.afterDigest!=='string'||!current||typeof current!=='object'||Array.isArray(current)||!Object.hasOwn(current,'workshop'))return null;
 try{if(digest(uid,current)!==checkpoint.afterDigest)return null;const restored={...current};delete restored.workshop;return restored;}catch{return null;}
}

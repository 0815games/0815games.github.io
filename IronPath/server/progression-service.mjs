// Experimental, transport-independent server-side account operations.
// Not mounted as an endpoint or deployed. Never expose this without a verified
// token provider, Admin-backed transactions, durable match fencing, request
// limits, secure deployment and an explicit migration/rollback plan.
import {createHash} from 'node:crypto';
import {initializeWireWorkshop,applyWireWorkshopCommand,decodeWorkshop} from '../workshop-wire.mjs';
import {validLegacy} from '../workshop-model.mjs';
import {readArmory,upgradeArmory} from '../armory.mjs?v=20261102-longterm1';
import {characterProgress} from '../progression.mjs?v=20261105-prestige1';
import {canSaveSkillDraft} from '../skill-planner.mjs?v=20261104-doctrines1';
const MAX_REQUESTS=4096,MAX_TOKEN=8192;
const keys=(v,names)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===names.length&&names.every(k=>Object.hasOwn(v,k));
const idValid=v=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const validUid=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(v);
const level=xp=>characterProgress(xp).level;
function normalize(c){
 if(!c||typeof c!=='object'||Array.isArray(c))return null;
 switch(c.type){
  case 'initialize':return keys(c,['type'])?{type:c.type}:null;
  case 'craft':return keys(c,['type','item'])&&typeof c.item==='string'?{type:c.type,item:c.item}:null;
  case 'equip':return keys(c,['type','slot','item'])&&typeof c.slot==='string'&&typeof c.item==='string'?{type:c.type,slot:c.slot,item:c.item}:null;
  case 'modify':return keys(c,['type','item','mod'])&&typeof c.item==='string'&&typeof c.mod==='string'?{type:c.type,item:c.item,mod:c.mod}:null;
  case 'upgrade':return keys(c,['type','kind','expectedRank'])&&['fortify','plating','repair','gun','supply','safeguard'].includes(c.kind)&&Number.isInteger(c.expectedRank)&&c.expectedRank>=0&&c.expectedRank<3?{type:c.type,kind:c.kind,expectedRank:c.expectedRank}:null;
  case 'skills':return keys(c,['type','expected','build'])&&typeof c.expected==='string'&&c.expected.length<=128&&typeof c.build==='string'&&c.build.length<=128?{type:c.type,expected:c.expected,build:c.build}:null;
  default:return null; // never accept XP, currency or completion claims here
 }
}
function reduce(profile,c){
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||!Number.isInteger(profile.xp)||profile.xp<0||profile.xp>10000000||!validLegacy(profile.armory))return null;
 if(c.type==='initialize')return initializeWireWorkshop(profile);
 // Never touch an absent, corrupt or future workshop on an opted-in account.
 if(!decodeWorkshop(profile.workshop))return null;
 if(['craft','equip','modify'].includes(c.type))return applyWireWorkshopCommand(profile,c);
 if(c.type==='upgrade'){
  const a=readArmory(profile.armory);if(a[c.kind]!==c.expectedRank||(['supply','safeguard'].includes(c.kind)&&level(profile.xp)<5))return null;
  const next=upgradeArmory(a,c.kind);return next?{...profile,armory:next}:null;
 }
 if(c.type==='skills')return canSaveSkillDraft(profile,c.expected,c.build,level)?{...profile,skills:c.build}:null;
 return null;
}
// transact(uid, callback) must be a durable server-side transaction on exactly
// players/{uid}; its result must expose committed and snapshot.val(). The
// required isUnlocked predicate MUST inspect a durable lock in the same
// transaction snapshot. A process-local lobby check alone is not sufficient.
export function createProgressionService({verifyToken,transact,isUnlocked}){
 if(typeof verifyToken!=='function'||typeof transact!=='function'||typeof isUnlocked!=='function')throw new Error('Verified auth, transaction and durable match fencing required');
 return {async execute({token,requestId,command}={}){
  if(typeof token!=='string'||!token||token.length>MAX_TOKEN||!idValid(requestId))return {status:'invalid'};
  const c=normalize(command);if(!c)return {status:'invalid'};
  let identity;try{identity=await verifyToken(token);}catch{return {status:'unauthorized'};}
  const uid=identity?.uid;if(!validUid(uid))return {status:'unauthorized'};
  const digest=createHash('sha256').update(JSON.stringify(c)).digest('hex');
  try{
   const result=await transact(uid,current=>{
    if(!current||typeof current!=='object'||Array.isArray(current))return undefined;
    const log=current.progressionRequests??{};if(!log||typeof log!=='object'||Array.isArray(log))return undefined;
    if(Object.hasOwn(log,requestId))return undefined;
    if(Object.keys(log).length>=MAX_REQUESTS||isUnlocked(current,uid)!==true)return undefined;
    const next=reduce(current,c);return next?{...next,progressionRequests:{...log,[requestId]:digest}}:undefined;
   });
   const profile=result?.snapshot?.val?.();if(!profile)return {status:'rejected'};
   const prior=profile.progressionRequests?.[requestId];
   if(prior!==undefined&&prior!==digest)return {status:'request-conflict'};
   if(result.committed&&prior===digest)return {status:'applied',profile};
   if(!result.committed&&prior===digest)return {status:'already-applied',profile};
   return {status:'rejected'};
  }catch{return {status:'unavailable'};}
 }};
}

// Experimental server-side credit for a verified endless match event.
// Never expose credit() directly to clients. The producer must persist and
// replay authenticated, authoritative completion events with stable run IDs.
import {createHash} from 'node:crypto';
import {applyWorkshopWaveCredit} from '../workshop-wave-credit.mjs';
import {MAX_WAVE_MASK,WAVE_COUNT} from '../combat.mjs?v=20261112-finale1';

const validUid=v=>typeof v==='string'&&v.length>0&&v.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(v);
const validId=v=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
// Domain-separated hashes prevent the additive block-ID collisions of the old
// client receipt scheme. Run IDs must be unique random server-issued IDs.
export function endlessReceiptId({mode,runId,block}) {
 if(!['solo','coop'].includes(mode)||!validId(runId)||!Number.isSafeInteger(block)||block<0||!Number.isSafeInteger((block+1)*WAVE_COUNT))return null;
 return createHash('sha256').update(JSON.stringify(['ironpath-endless-workshop-receipt-v1',mode,runId,block])).digest('hex').slice(0,32);
}
export function createEndlessCreditService({transact}={}) {
 if(typeof transact!=='function')throw Error('Durable account transaction required');
 return {async credit(event){
  if(!event||typeof event!=='object'||Array.isArray(event)||Object.keys(event).sort().join(',')!=='block,mask,mode,runId,uid'||!validUid(event.uid)||!Number.isInteger(event.mask)||event.mask<=0||event.mask>MAX_WAVE_MASK)return {status:'invalid'};
  const receiptId=endlessReceiptId(event);if(!receiptId)return {status:'invalid'};
  try{
   const result=await transact(event.uid,current=>{
    if(!current||typeof current!=='object'||Array.isArray(current))return undefined;
    const receipts=current.endlessWorkshopReceipts??{};
    if(!receipts||typeof receipts!=='object'||Array.isArray(receipts))return undefined;
    // Isolate new receipt namespace from pre-alpha coopRewards and old solo
    // receipts. Never replace or interpret those historical receipt fields.
    const field=event.mode==='solo'?'soloWorkshopReceipts':'coopRewards';
    const reduced=applyWorkshopWaveCredit({...current,[field]:receipts},{kind:event.mode,receiptId,mask:event.mask,block:event.block});
    if(!reduced)return undefined;
    const next={...reduced,endlessWorkshopReceipts:reduced[field]};
    if(Object.hasOwn(current,field))next[field]=current[field];else delete next[field];
    return next;
   });
   const profile=result?.snapshot?.val?.(),stored=profile?.endlessWorkshopReceipts?.[receiptId];
   if(Number.isInteger(stored)&&stored>=0&&stored<=MAX_WAVE_MASK&&(stored&event.mask)===event.mask)return {status:result.committed?'applied':'already-applied'};
   return {status:'rejected'};
  }catch{return {status:'unavailable'};}
 }};
}

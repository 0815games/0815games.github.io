// Free-tier solo receipt identity: random per run, deterministic per wave block.
// This only prevents accidental double credit; it cannot prove a wave was completed.
import {WAVE_COUNT,MAX_WAVE_MASK} from './combat.mjs?v=20261102-battle2';

export function newRunReceiptId(source=globalThis.crypto){
 if(!source||typeof source.getRandomValues!=='function')return null;
 const bytes=new Uint8Array(16);source.getRandomValues(bytes);
 return Array.from(bytes,b=>String(b.toString(16)).padStart(2,'0')).join('');
}
export function receiptForBlock(runId,block){
 if(typeof runId!=='string'||!/^[a-f0-9]{32}$/.test(runId)||!Number.isSafeInteger(block)||block<0||!Number.isSafeInteger((block+1)*WAVE_COUNT))return null;
 return block===0?runId:((BigInt('0x'+runId)+BigInt(block))%(1n<<128n)).toString(16).padStart(32,'0');
}
// Wave number -> {block,mask} for the single completed wave. Null when invalid.
export function waveCredit(wave){
 if(!Number.isInteger(wave)||wave<1||!Number.isSafeInteger(wave))return null;
 const index=(wave-1)%WAVE_COUNT,block=(wave-1-index)/WAVE_COUNT,mask=1<<index;
 return mask>MAX_WAVE_MASK?null:{block,mask,receiptId:null};
}

// Client-side admin coordinator; RTDB Rules are the authorization boundary.
// No credentials are stored here and this module does not publish Rules.
import {parseMaintenanceControl} from './maintenance-check.mjs?v=20261031-update2';

export function sameMaintenanceControl(a,b){
 const left=parseMaintenanceControl(a),right=parseMaintenanceControl(b);
 return !!left&&!!right&&left.mode===right.mode&&left.authAfterMs===right.authAfterMs;
}

// The operator sees a fresh public read, then a transaction compares that exact
// record again. A concurrent operator, invalid record, outage, or account switch
// fails closed. A timeout does not cancel an SDK transaction: the UI must keep
// the operation busy until its actual promise settles and must never retry it
// blindly. `serverTimestamp` is supplied by the Firebase SDK, not the browser clock.
export async function transitionMaintenance({expected,target,probe,readCurrent,transact,serverTimestamp,isCurrent=()=>true}={}){
 const before=parseMaintenanceControl(expected);
 if(!before||!['open','maintenance'].includes(target)||target===before.mode||
    ![probe,readCurrent,transact,serverTimestamp,isCurrent].every(fn=>typeof fn==='function'))throw Error('Invalid maintenance transition');
 if(!isCurrent())return {kind:'cancelled'};
 const fresh=parseMaintenanceControl(await probe());
 if(!isCurrent())return {kind:'cancelled'};
 if(!fresh)return {kind:'unavailable'};
 if(!sameMaintenanceControl(fresh,before))return {kind:'changed',control:fresh};
 const observed=parseMaintenanceControl(await readCurrent());
 if(!isCurrent())return {kind:'cancelled'};
 if(!sameMaintenanceControl(observed,before))return {kind:'changed',control:observed};
 let timestamp=null;
 if(target==='open'){
  timestamp=serverTimestamp();
  if(!timestamp||typeof timestamp!=='object'||Array.isArray(timestamp)||
     Object.keys(timestamp).join(',')!=='.sv'||timestamp['.sv']!=='timestamp')throw Error('Invalid server timestamp');
 }
 const result=await transact(current=>{
  if(!isCurrent()||!sameMaintenanceControl(current,before))return;
  return {format:1,mode:target,authAfterMs:target==='open'?timestamp:before.authAfterMs};
 });
 if(!result?.committed)return {kind:'changed',control:parseMaintenanceControl(result?.snapshot?.val?.())};
 // An accepted transaction remains accepted even if the operator signed out or
 // another tab changed state while the acknowledgement was in flight.
 if(!isCurrent())return {kind:'unconfirmed'};
 const confirmed=parseMaintenanceControl(await probe());
 if(!isCurrent())return {kind:'unconfirmed'};
 if(!confirmed||confirmed.mode!==target||
    (target==='maintenance'&&confirmed.authAfterMs!==before.authAfterMs)||
    (target==='open'&&confirmed.authAfterMs<=before.authAfterMs))return {kind:'unconfirmed',control:confirmed};
 return {kind:'confirmed',control:confirmed};
}

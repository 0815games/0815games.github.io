// Workshop transaction service, live for every signed-in soldier through the
// armory. Writes fail closed when the workshop rules are not published; the
// legacy path keeps working in that case.
import {initializeWireWorkshop,applyWireWorkshopCommand,meltPrestige} from './workshop-wire.mjs?v=20261219-trains1';

export function createWorkshopAccount({db,auth,sdk,canEdit=()=>false}){
 if(!db||!auth||!sdk||typeof sdk.ref!=='function'||typeof sdk.onValue!=='function'||typeof sdk.runTransaction!=='function'||typeof canEdit!=='function')throw new Error('Invalid workshop account service');
 let busy=false;
 async function transact(reducer){
  const session=auth.currentUser,uid=session?.uid;if(!uid)return {status:'signed-out'};
  if(busy)return {status:'busy'};if(!canEdit())return {status:'locked'};busy=true;let unwatch;
  try{
   const reference=sdk.ref(db,`players/${uid}`);
   await new Promise((resolve,reject)=>{unwatch=sdk.onValue(reference,resolve,reject);});
   if(auth.currentUser!==session||auth.currentUser?.uid!==uid||!canEdit())return {status:'cancelled'};
   const result=await sdk.runTransaction(reference,current=>{
    if(auth.currentUser!==session||auth.currentUser?.uid!==uid||!canEdit())return undefined;
    return reducer(current)??undefined;
   },{applyLocally:false});
   if(auth.currentUser!==session||auth.currentUser?.uid!==uid)return {status:'cancelled'};
   if(!result.committed)return {status:'rejected'};
   return {status:'saved',profile:result.snapshot.val()};
  }catch(error){return {status:'error',error};}
  finally{unwatch?.();busy=false;}
 }
 // Backfill campaign trophies for missions already finished. Free and
 // idempotent: meltPrestige only adds what the stored story progress proves.
 return {initialize:()=>transact(initializeWireWorkshop),command:command=>transact(p=>applyWireWorkshopCommand(p,command)),sync:()=>transact(meltPrestige),isBusy:()=>busy};
}

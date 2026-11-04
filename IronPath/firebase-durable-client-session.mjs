import {normalizeCommand} from './protocol.mjs?v=20261104-buildreservation1';
// Experimental generation-aware client. The channel must derive each view's
// owner/generation from a rules-protected lease and owner-scoped view path, and
// hosts must reject input envelopes from old generations. Not wired live.
export function createDurableClientSession({channel,onView=()=>{},onState=()=>{},onConnections=()=>{},timeoutMs=15000}){
  if(!channel||!['watchLease','watchView','writeInput','close'].every(k=>typeof channel[k]==='function')||typeof onView!=='function'||typeof onState!=='function'||typeof onConnections!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Invalid durable client');
  let started=false,closed=false,invalid=false,lease=null,latest=null,maxTick=-1,pending=null,stops=[];
  function settle(item,result){if(item.timer)clearTimeout(item.timer);if(!item.settled){item.settled=true;item.resolve(result);}}
  function fail(reason){if(invalid||closed)return;invalid=true;latest=null;if(pending){settle(pending,{ok:false,reason});pending=null;}onState('error');}
  function observeLease(value){
    if(closed||invalid||!value||!Number.isSafeInteger(value.generation)||value.generation<1||!/^[a-f0-9]{32}$/.test(value.owner||''))return;
    if(lease&&(value.generation<lease.generation||(value.generation===lease.generation&&value.owner!==lease.owner))){fail('Invalid recovery generation.');return;}
    if(!lease||value.generation!==lease.generation){lease={generation:value.generation,owner:value.owner};latest=null;onState('waiting');}
  }
  function observeView(view){
    if(closed||invalid||!lease||view?.generation!==lease.generation||view?.owner!==lease.owner||typeof view.ready!=='boolean'||!view.snapshot||!Number.isSafeInteger(view.snapshot.tick)||view.snapshot.tick<0||!Number.isSafeInteger(view.snapshot.nextSeq)||view.snapshot.nextSeq<1||!Array.isArray(view.snapshot.receipts))return;
    const snapshot=view.snapshot;if(snapshot.tick<maxTick){if(latest&&snapshot.tick<latest.snapshot.tick)return;fail('Recovery checkpoint is older than the last committed view.');return;}
    maxTick=snapshot.tick;latest=view;
    if(pending){
      const receipt=snapshot.receipts.find(r=>r?.seq===pending.seq);
      if(receipt?.status==='applied'){settle(pending,receipt.result);pending=null;}
      else if(receipt?.status==='cancelled'){settle(pending,{ok:false,reason:'Command cancelled when a player disconnected.'});pending=null;}
      else if(pending.generation!==lease.generation){
        if(snapshot.nextSeq===pending.seq){settle(pending,{ok:false,reason:'Command was not committed before recovery. Please retry.'});pending=null;}
        else {fail('Command outcome could not be reconciled after recovery.');return;}
      }
    }
    onConnections(Array.isArray(view.connections)?view.connections.filter(id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id)).slice(0,64):[]);onState(pending?.settled?'syncing':view.ready?'ready':'waiting');onView(snapshot);
  }
  return {
    start(){if(started||closed)throw Error('Client already started or closed');started=true;stops=[channel.watchLease(observeLease),channel.watchView(observeView)];onState(latest?.ready?'ready':'waiting');},
    command(command){
      if(!started||closed||invalid||!latest?.ready)return Promise.resolve({ok:false,reason:'Party is not ready.'});if(pending)return Promise.resolve({ok:false,reason:'Waiting for the previous command to be reconciled.'});const normalized=normalizeCommand(command);if(!normalized)return Promise.resolve({ok:false,reason:'Invalid command.'});const active={...lease},seq=latest.snapshot.nextSeq;
      return new Promise(resolve=>{const item={seq,generation:active.generation,resolve,settled:false,timer:null};pending=item;item.timer=setTimeout(()=>{if(pending===item&&!item.settled){item.settled=true;onState('syncing');resolve({ok:false,reason:'Command outcome unknown; waiting for synchronization.'});}},timeoutMs);
        Promise.resolve().then(()=>{if(closed||invalid||pending!==item||lease?.generation!==active.generation||lease?.owner!==active.owner)throw Error('Session changed');return channel.writeInput({generation:active.generation,owner:active.owner,envelope:{version:1,seq,command:normalized}});}).catch(()=>{if(pending===item&&!item.settled){clearTimeout(item.timer);item.settled=true;onState('syncing');resolve({ok:false,reason:'Command outcome unknown; waiting for synchronization.'});}});
      });
    },
    async stop(){if(closed)return;closed=true;for(const stop of stops)stop?.();if(pending){settle(pending,{ok:false,reason:'Party closed.'});pending=null;}await channel.close();}
  };
}

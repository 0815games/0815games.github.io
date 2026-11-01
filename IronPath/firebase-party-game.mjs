import {createFirebasePartyChannel} from './firebase-party-channel.mjs';
import {createFirebasePartyPresence} from './firebase-party-presence.mjs';
import {createFirebasePartyClientSession,createFirebasePartyHostSession} from './firebase-party-session.mjs?v=20261101-hostcontinues1';
import {createPartyHost} from './party-host.mjs?v=20261101-hostcontinues1';
import {createMatch,STEP} from './simulation.mjs?v=20261101-hostcontinues1';

// Game-facing adapter for an already-established party. It is not a lobby or
// an authentication boundary. Security rules must enforce the roster and paths.
export function createFirebasePartyGame({db,auth,sdk,partyId,hostId,playerIds,players,crypto=globalThis.crypto,onState=()=>{},onStatus=()=>{},onSnapshot=()=>{}}){
  const uid=auth?.currentUser?.uid;
  if(!Array.isArray(playerIds)||playerIds.length!==2||new Set(playerIds).size!==2||!playerIds.includes(uid)||!playerIds.includes(hostId)||typeof crypto?.getRandomValues!=='function')throw new Error('Invalid party roster');
  if(uid===hostId&&(!Array.isArray(players)||players.length!==2||players.some((p,i)=>p?.id!==playerIds[i])))throw new Error('Host requires party players');
  if(![onState,onStatus,onSnapshot].every(fn=>typeof fn==='function'))throw new Error('Invalid callbacks');
  let active=false,started=false,failed=false,client=null,host=null,presence=null,timer=null,sessionReady=false,ready=false;
  const online=new Map(playerIds.map(id=>[id,false]));
  function refresh(){
    const next=active&&!failed&&sessionReady&&online.get(hostId)&&online.get(uid);
    if(next!==ready){ready=next;onStatus(ready);}
    if(active&&!failed)onState(ready?'ready':'waiting');
  }
  function fail(){if(!active||failed)return;failed=true;sessionReady=false;refresh();onState('error');}
  const options={db,auth,sdk,partyId,hostId,playerIds,onError:fail};
  return {
    start(){
      if(started)throw new Error('Party game already started');started=true;active=true;onState('connecting');
      try{
        const channel=createFirebasePartyChannel(options);
        client=createFirebasePartyClientSession({channel,onState:state=>{if(!active)return;if(state==='error'){fail();return;}sessionReady=state==='ready';refresh();},onView:snapshot=>{if(active&&!failed)onSnapshot(snapshot);}});
        if(uid===hostId){
          const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const epoch=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
          host=createFirebasePartyHostSession({channel:createFirebasePartyChannel(options),host:createPartyHost(createMatch(players),{hostId}),playerIds,epoch,onError:fail});
        }
        client.start();host?.start();
        presence=createFirebasePartyPresence({...options,crypto,onPresence:(id,value)=>{if(!active)return;online.set(id,value);host?.setPresence(id,value);refresh();},onConnection:connected=>{if(!active)return;if(!connected){for(const id of playerIds)online.set(id,false);refresh();}}});
        presence.start();
        if(host)timer=setInterval(()=>{if(active&&!failed)host.step();},STEP*1000);
      }catch(error){fail();void this.stop();throw error;}
    },
    command(command){if(!active||failed||!ready)return Promise.resolve({ok:false,reason:'Party is not ready.'});return client.command(command);},
    async stop(){
      if(!active&&!client)return;active=false;sessionReady=false;refresh();if(timer)clearInterval(timer);timer=null;
      // Stop presence first so the host pauses before channels are closed.
      const p=presence,c=client,h=host;presence=null;client=null;host=null;
      await Promise.allSettled([p?.stop(),c?.stop(),h?.stop()]);
    }
  };
}

import {createWorkshopMultiplayerMatch} from './workshop-multiplayer-game.mjs?v=20261112-alpha2';
import {validWorkshopMatchLock,validWorkshopMatchState} from './workshop-match-validation.mjs?v=20261112-alpha2';
import {guardMultiplayerTab} from './multiplayer-tab-guard.mjs?v=20261103-hardening2';
import {createFourCoop,createTwoVsTwo,FOUR_PLAYER_MAP} from './four-modes.mjs?v=20261105-workshop3';
import {createVersus} from './versus.mjs?v=20261105-workshop3';
import {createFixedStepClock} from './fixed-step-clock.mjs?v=20261102-coopmotion1';
import {isMapId,DEFAULT_MAP} from './maps.mjs?v=20261102-fourbase1';
import {MAX_WAVE_MASK} from './combat.mjs?v=20261102-battle2';
import {createFirebasePartyChannel} from './firebase-party-channel.mjs?v=20261103-unified1';
import {createFirebasePartyPresence} from './firebase-party-presence.mjs?v=20261103-unified1';
import {createFirebasePartyClientSession,createFirebasePartyHostSession} from './firebase-party-session.mjs?v=20261105-workshop3';
import {createPartyHost} from './party-host.mjs?v=20261105-workshop3';
import {createMatch,STEP} from './simulation.mjs?v=20261105-workshop3';

// Game-facing adapter for an already-established party. It is not a lobby or
// an authentication boundary. Security rules must enforce the roster and paths.
export function createFirebasePartyGame({db,auth,sdk,partyId,hostId,playerIds,players,mapId=DEFAULT_MAP,mode='coop',teams=null,partyRoot=null,workshopLock=null,crypto=globalThis.crypto,onState=()=>{},onStatus=()=>{},onSnapshot=()=>{},onWaveRewards=()=>{},clock=()=>performance.now(),lockManager=globalThis.navigator?.locks}){
  const uid=auth?.currentUser?.uid,four=mode==='four-coop'||mode==='two-vs-two',count=mode==='four-coop'&&Array.isArray(playerIds)?playerIds.length:four?4:2;
  if(!['coop','versus','four-coop','two-vs-two'].includes(mode))throw new Error('Invalid mode');
  if(!Array.isArray(playerIds)||(mode==='four-coop'&&![3,4].includes(count))||playerIds.length!==count||new Set(playerIds).size!==count||!playerIds.includes(uid)||!playerIds.includes(hostId)||typeof crypto?.getRandomValues!=='function')throw new Error('Invalid party roster');
  if(uid===hostId&&!isMapId(mapId))throw new Error('Invalid host map');
  if(uid===hostId&&(!Array.isArray(players)||players.length!==count||players.some((p,i)=>p?.id!==playerIds[i])))throw new Error('Host requires party players');
  if(uid===hostId&&mode==='two-vs-two'&&(!Array.isArray(teams)||teams.length!==2||teams.some(t=>!Array.isArray(t)||t.length!==2)||new Set(teams.flat()).size!==4||teams.flat().some(id=>!playerIds.includes(id))))throw new Error('Invalid teams');
  if(workshopLock!==null){if(!validWorkshopMatchLock(workshopLock,{partyId,mode,playerIds}))throw new Error('Invalid workshop match lock');workshopLock=structuredClone(workshopLock);}
  if(![onState,onStatus,onSnapshot,onWaveRewards,clock].every(fn=>typeof fn==='function'))throw new Error('Invalid callbacks');
  let active=false,started=false,failed=false,client=null,host=null,presence=null,timer=null,ticker=null,sessionReady=false,ready=false,localConnection=null,acknowledged=[],lastState=null,releaseTab=null,focusPaused=false;
  const online=new Map(playerIds.map(id=>[id,false]));
  function refresh(){
    const next=active&&!failed&&sessionReady&&localConnection!==null&&acknowledged.includes(localConnection)&&online.get(hostId)&&online.get(uid);
    if(next!==ready){ready=next;onStatus(ready);}
    if(active&&!failed){const state=ready?'ready':'waiting';if(state!==lastState){lastState=state;onState(state);}}
  }
  function fail(reason='error'){if(!active||failed)return;failed=true;sessionReady=false;refresh();onState(reason==='duplicate'?'duplicate':'error');queueMicrotask(()=>void stop());}
  const options={db,auth,sdk,partyId,hostId,playerIds,partyRoot:partyRoot||(four?'fourParties':'parties'),onError:fail};
  let stopping=null;
  function stop(){
    if(stopping)return stopping;
    if(!active&&!client)return Promise.resolve();active=false;sessionReady=false;refresh();if(timer)clearInterval(timer);timer=null;ticker=null;releaseTab?.();releaseTab=null;
    const p=presence,c=client,h=host;presence=null;client=null;host=null;
    stopping=Promise.allSettled([p?.stop(),c?.stop(),h?.stop()]).then(()=>{});return stopping;
  }
  return {
    start(){
      if(started)throw new Error('Party game already started');started=true;active=true;onState('connecting');
      releaseTab=guardMultiplayerTab({locks:lockManager,partyId,uid,onConflict:()=>fail('duplicate'),onAcquired:()=>{
      try{
        if(uid===hostId){
          const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const epoch=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
          const initial=workshopLock?createWorkshopMultiplayerMatch(players,workshopLock,{hostId,mapId,teams}):mode==='two-vs-two'?createTwoVsTwo(players,hostId,teams):mode==='four-coop'?createFourCoop(players,hostId):mode==='versus'?createVersus(players,mapId,hostId):createMatch(players,mapId);const core=createPartyHost(initial,{hostId});core.setFocusPaused(focusPaused);host=createFirebasePartyHostSession({channel:createFirebasePartyChannel(options),host:core,playerIds,epoch,localPlayerId:uid,onError:fail});
        }
        const channel=host?host.localChannel():createFirebasePartyChannel(options);
        client=createFirebasePartyClientSession({channel,onConnections:ids=>{acknowledged=ids;},onState:state=>{if(!active)return;if(state==='error'){fail();return;}sessionReady=state==='ready';refresh();},onView:snapshot=>{if(!active||failed)return;const game=snapshot?.match;if(workshopLock&&!validWorkshopMatchState(game,workshopLock)){fail();return;}let fields;if(four){if(game?.mode!==mode||game.hostId!==hostId||Object.keys(game.members||{}).length!==count||playerIds.some(id=>!Object.hasOwn(game.members,id))){fail();return;}fields=mode==='four-coop'?[game.match]:game.lanes;if(mode==='two-vs-two'&&(!Array.isArray(game.teams)||game.teams.length!==2||new Set(game.teams.flat()).size!==4||game.teams.some((team,i)=>!Array.isArray(team)||team.length!==2||team.some(id=>!Object.hasOwn(game.lanes?.[i]?.players||{},id))))) {fail();return;}if(!Array.isArray(fields)||fields.length!==(mode==='four-coop'?1:2)||fields.some(lane=>lane?.mapId!==FOUR_PLAYER_MAP||lane.individualSupplies!==true)||playerIds.some(id=>fields.filter(lane=>Object.hasOwn(lane.players||{},id)).length!==1)){fail();return;}}else{if(!game||game.hostId!==hostId||(mode==='versus'?game.mode!=='versus':game.mode==='versus')||(game.mapId!==undefined&&!isMapId(game.mapId))||game.individualSupplies!==true||!game.players||Object.keys(game.players).length!==count||playerIds.some(id=>!Object.hasOwn(game.players,id))){fail();return;}fields=[game];}const playerFor=id=>fields.find(lane=>Object.hasOwn(lane.players||{},id))?.players[id];if(!playerIds.every(id=>Number.isFinite(playerFor(id)?.money)&&Number.isInteger(playerFor(id)?.completedWaveMask)&&playerFor(id).completedWaveMask>=0&&playerFor(id).completedWaveMask<=MAX_WAVE_MASK)){fail();return;}const player=playerFor(uid),blocks=player.completedWaveBlocks||{};
        if(typeof blocks!=='object'||Array.isArray(blocks)||Object.entries(blocks).some(([key,value])=>!/^\d+$/.test(key)||!Number.isSafeInteger(Number(key))||Number(key)<1||!Number.isInteger(value)||value<0||value>MAX_WAVE_MASK)){fail();return;}
        onWaveRewards(player.completedWaveMask,0);for(const [block,mask] of Object.entries(blocks))onWaveRewards(mask,Number(block));onSnapshot(snapshot);}});
        client.start();host?.start();
        presence=createFirebasePartyPresence({...options,crypto,onConnections:(id,ids)=>{if(active)host?.setConnections(id,ids);},onPresence:(id,value)=>{if(!active)return;online.set(id,value);if(id===hostId)ticker?.reset();host?.setPresence(id,value);refresh();},onConnection:(connected,id)=>{if(!active)return;localConnection=connected?id:null;if(!connected){for(const id of playerIds)online.set(id,false);refresh();}}});
        presence.start();
        if(host){ticker=createFixedStepClock({step:STEP,now:clock,advance:()=>host.step()});timer=setInterval(()=>{if(active&&!failed)ticker.tick();},STEP*1000);}
      }catch(error){fail();}
      }});
    },
    setFocusPaused(value){if(uid!==hostId||typeof value!=='boolean')return false;if(focusPaused===value)return true;focusPaused=value;ticker?.reset();host?.setFocusPaused(value);return true;},
    command(command){if(!active||failed||!ready)return Promise.resolve({ok:false,reason:'Party is not ready.'});return client.command(command);},
    stop
  };
}

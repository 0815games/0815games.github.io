import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';import {initializeWireWorkshop} from '../workshop-wire.mjs';import {makeWorkshopOffer,lockWorkshopRoster} from '../workshop-multiplayer.mjs';import {createWorkshopMultiplayerMatch} from '../workshop-multiplayer-game.mjs';import {validWorkshopMatchLock,validWorkshopMatchState} from '../workshop-match-validation.mjs';import {createPartyHost,restorePartyHost} from '../party-host.mjs';
const partyId='a'.repeat(32),all=['a','b','c','d'];
for(const [mode,count] of [['coop',2],['versus',2],['four-coop',3],['four-coop',4],['two-vs-two',4]])test(`locked ${mode} ${count} snapshots and checkpoints retain equipment`,()=>{
 const ids=all.slice(0,count),players=ids.map(id=>createPlayer(id,{name:id,gender:'male',loadout:'0,0,1'}));
 const profile=initializeWireWorkshop({armory:{owned:1,equipped:1}}),offers=Object.fromEntries(ids.map(id=>[id,makeWorkshopOffer(profile,mode)]));
 const lock=lockWorkshopRoster({matchId:partyId,mode,playerIds:ids,offers}),options={hostId:'a',teams:mode==='two-vs-two'?[['a','b'],['c','d']]:undefined};
 assert.equal(validWorkshopMatchLock(lock,{partyId,mode,playerIds:ids}),true);assert.equal(validWorkshopMatchLock(lock,{partyId:'b'.repeat(32),mode,playerIds:ids}),false);
 const match=createWorkshopMultiplayerMatch(players,lock,options);assert.equal(validWorkshopMatchState(match,lock),true);
 const host=createPartyHost(match,{hostId:'a'}),checkpoint=host.checkpoint();assert.equal(validWorkshopMatchState(checkpoint.match,lock),true);
 const restored=restorePartyHost(checkpoint,{...options,playerIds:ids,mode});for(const id of ids){assert.equal(validWorkshopMatchState(restored.snapshotFor(id).match,lock),true);}
 const changed=structuredClone(checkpoint.match),lane=mode==='four-coop'?changed.match:mode==='two-vs-two'?changed.lanes[0]:mode==='versus'?changed.lanes.a:changed;lane.experimentalWorkshop.loadouts.a='tampered';assert.equal(validWorkshopMatchState(changed,lock),false);
 delete lane.experimentalWorkshop;assert.equal(validWorkshopMatchState(changed,lock),false);
});

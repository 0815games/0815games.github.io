import {reserveBuildPad,releaseBuildPad,releaseBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
import {getMap} from './maps.mjs?v=20261102-fourbase1';
import {activateCombos} from './skill-combos.mjs?v=20261102-results1';
import {parseLoadout} from './armory.mjs?v=20261102-longterm1';
import {parseBuild,abilityName,webBonuses} from './skills.mjs?v=20261104-doctrines1';
// Shared command rules. These functions have no DOM, Firebase or network dependency.
// The caller must derive playerId from the authenticated session, never the payload.
import { upgradeCost, towerUpgradeInvestment } from './progression.mjs?v=20261105-prestige1';
import { waveFormation } from './combat.mjs?v=20261102-battle2';
import { RUN_PERKS,perkOffers } from './run-perks.mjs?v=20261102-terrain4';
export const TOWER_COSTS = [50, 80, 65, 75];
export const PAD_COUNT = 10;
// All investments have fixed costs in this version, so the refund can be derived
// from trusted match state without accepting a price from a client.
export function towerRefund(tower) {
  const investment=towerUpgradeInvestment(tower.level);
  if(investment===null||!Number.isSafeInteger(investment+TOWER_COSTS[tower.type]))throw new Error('Invalid tower investment');
  return Math.floor((TOWER_COSTS[tower.type]+investment)/2);
}
export function createPlayer(id, profile, x=850, y=450) {
  if(typeof id!=='string'||!id||!profile||!['male','female'].includes(profile.gender)||typeof profile.name!=='string'||!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Invalid player');
  const level=Number.isInteger(profile.level)&&profile.level>0?profile.level:1;
  return {id, name:profile.name, gender:profile.gender, x, y, target:null, direction:{x:0,y:0}, level, skills:parseBuild(profile.skills,level),loadout:parseLoadout(profile.loadout), cooldown:0, shotTimer:0,overdrive:0};
}
// Solo keeps its original shared balance; co-op stores separate player wallets.
export function getSupplies(state,playerId){return state.individualSupplies?(state.players[playerId]?.money??0):state.money;}
export function addSupplies(state,playerId,amount){if(state.individualSupplies){const player=state.players[playerId];if(!player)throw new Error('Unknown supplies owner');player.money+=amount;}else state.money+=amount;}
function startNextWave(state){state.wave++;state.running=true;state.pendingWave=0;state.spawnLeft=waveFormation(state.wave).length;state.spawnIndex=0;state.spawnTimer=.2;}
// Shared pads; abilities, movement and co-op supplies are owned by each player.
// Returns an explicit result rather than trusting a client-side UI decision.
export function applyCommand(state, playerId, command) {
  const player=Object.hasOwn(state.players,playerId)?state.players[playerId]:null;
  if(!player)return {ok:false,reason:'Unknown player.'};
  if(!command||typeof command.type!=='string')return {ok:false,reason:'Invalid command.'};
  if(state.ended)return {ok:false,reason:'The operation is over.'};
  if(state.hostId&&player.active===false)return {ok:false,reason:'Player is offline.'};
  switch(command.type){
    case 'leaveRun': {
      if(!state.individualSupplies||!state.hostId||playerId===state.hostId)return {ok:false,reason:'Only the guest can leave individually.'};
      player.active=false;player.direction={x:0,y:0};player.target=null;state.pendingWave=0;releaseBuildReservations(state,playerId);return {ok:true};
    }
    case 'endRun': {
      if(state.individualSupplies&&state.hostId&&playerId!==state.hostId)return {ok:false,reason:'Only the host can end the shared run. Leave the party to exit.'};
      state.pendingWave=0;state.ended=true;state.running=false;state.endReason='retired';state.pendingPerk=0;state.spawnLeft=0;
      return {ok:true};
    }
    case 'startWave': {
      if(state.running||state.pendingPerk||!Number.isSafeInteger(state.wave)||state.wave>=Number.MAX_SAFE_INTEGER-1)return {ok:false,reason:state.pendingPerk?'Choose a field upgrade first.':'Cannot start a wave now.'};
      if(state.individualSupplies&&state.hostId){
        if(playerId!==state.hostId)return {ok:false,reason:'Only the host can request the next wave.'};
        if(state.pendingWave)return {ok:false,reason:'Waiting for your teammate to approve.'};
        const teammate=Object.keys(state.players).find(id=>id!==state.hostId);
        if(teammate&&state.players[teammate].active!==false){state.waveRequestId=(state.waveRequestId||0)+1;state.pendingWave=state.wave+1;return {ok:true,waitingForGuest:true};}
      }
      startNextWave(state);return {ok:true};
    }
    case 'approveWave': {
      if(!state.individualSupplies||!state.hostId||playerId===state.hostId||!state.pendingWave||command.requestId!==state.waveRequestId||state.pendingWave!==state.wave+1||state.running||state.pendingPerk||state.players[state.hostId]?.active===false)return {ok:false,reason:'No wave is waiting for your approval.'};
      startNextWave(state);return {ok:true};
    }
    case 'declineWave': {
      if(!state.individualSupplies||!state.hostId||playerId===state.hostId||!state.pendingWave||command.requestId!==state.waveRequestId||state.running)return {ok:false,reason:'No wave request to decline.'};
      state.pendingWave=0;return {ok:true};
    }
    case 'cancelWave': {
      if(!state.individualSupplies||!state.hostId||playerId!==state.hostId||!state.pendingWave||command.requestId!==state.waveRequestId||state.running)return {ok:false,reason:'No wave request to cancel.'};
      state.pendingWave=0;return {ok:true};
    }
    case 'choosePerk': {
      if(!state.pendingPerk||state.running||!Number.isInteger(command.index)||command.index<0||command.index>2)return {ok:false,reason:'No such field upgrade is available.'};
      const choice=perkOffers(state.mapId,state.pendingPerk)[command.index],perk=RUN_PERKS[choice];
      const perks=state.runPerks||(state.runPerks={});perks[perk.key]=(perks[perk.key]||0)+1;
      if(perk.key==='bunker'){state.maxHp+=20;state.hp=Math.min(state.maxHp,state.hp+20);}
      if(perk.key==='supplies'){if(state.individualSupplies){for(const id of Object.keys(state.players))if(state.players[id].active!==false)addSupplies(state,id,60);}else addSupplies(state,playerId,60);}
      state.pendingPerk=0;return {ok:true,perk:perk.name};
    }
    case 'direction': {
      if(!Number.isInteger(command.x)||!Number.isInteger(command.y)||Math.abs(command.x)>1||Math.abs(command.y)>1)return {ok:false,reason:'Invalid direction.'};
      player.direction={x:command.x,y:command.y};if(command.x||command.y)player.target=null;return {ok:true};
    }
    case 'move': {
      if(!Number.isFinite(command.x)||!Number.isFinite(command.y)||command.x<12||command.x>(getMap(state.mapId).width||960)-12||command.y<12||command.y>(getMap(state.mapId).height||540)-12)return {ok:false,reason:'Invalid destination.'};
      player.direction={x:0,y:0};player.target={x:command.x,y:command.y};return {ok:true};
    }
    case 'reserveBuild': {
      const {pad}=command;
      if(!Number.isInteger(pad)||pad<0||pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      if(state.towers.some(t=>t.pad===pad))return {ok:false,reason:'Pad already occupied.'};
      return reserveBuildPad(state,playerId,pad);
    }
    case 'releaseBuild': {
      const {pad}=command;
      if(!Number.isInteger(pad)||pad<0||pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      return releaseBuildPad(state,playerId,pad);
    }
    case 'build': {
      const {pad,towerType}=command;
      if(!Number.isInteger(pad)||pad<0||pad>=getMap(state.mapId).pads.length||!Number.isInteger(towerType)||towerType<0||towerType>=TOWER_COSTS.length)return {ok:false,reason:'Invalid build selection.'};
      if(state.towers.some(t=>t.pad===pad))return {ok:false,reason:'Pad already occupied.'};
      const reserved=state.buildReservations?.[pad];if(reserved&&reserved.playerId!==playerId)return {ok:false,reason:'Another player is choosing a tower here.'};
      const cost=TOWER_COSTS[towerType];if(getSupplies(state,playerId)<cost)return {ok:false,reason:`Not enough supplies. This tower costs ${cost}.`};
      addSupplies(state,playerId,-cost);state.nextTowerId=(state.nextTowerId||0)+1;state.towers.push({id:state.nextTowerId,pad,type:towerType,level:1,timer:0,ownerId:playerId});releaseBuildPad(state,playerId,pad);return {ok:true};
    }
    case 'upgrade': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const tower=state.towers.find(t=>t.pad===command.pad);
      if(!tower)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&(tower.id!==command.expectedTowerId||tower.level!==command.expectedLevel))return {ok:false,reason:'Tower changed. Select it again.'};
      if(upgradeCost(tower.level)===null||towerUpgradeInvestment(tower.level+1)===null||!Number.isSafeInteger(TOWER_COSTS[tower.type]+towerUpgradeInvestment(tower.level+1)))return {ok:false,reason:'Tower cannot be upgraded further.'};
      if(tower.level===2&&![0,1,2,3].includes(command.branch))return {ok:false,reason:'Choose a valid specialization.'};
      if(tower.level===2&&command.branch===2&&player.level<5)return {ok:false,reason:'Veteran specialization unlocks at soldier level 5.'};
      if(tower.level===2&&command.branch===3&&player.level<10)return {ok:false,reason:'Boss Hunter specialization unlocks at soldier level 10.'};
      const cost=upgradeCost(tower.level);if(getSupplies(state,playerId)<cost)return {ok:false,reason:`Not enough supplies. You need ${cost}.`};
      addSupplies(state,playerId,-cost);if(tower.level===2)tower.branch=command.branch;tower.level++;return {ok:true};
    }
    case 'sell': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const index=state.towers.findIndex(t=>t.pad===command.pad);
      if(index<0)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&(state.towers[index].id!==command.expectedTowerId||state.towers[index].level!==command.expectedLevel))return {ok:false,reason:'Tower changed. Select it again.'};
      const tower=state.towers[index],refund=towerRefund(tower),refundTo=state.individualSupplies?tower.ownerId:playerId;
      if(state.individualSupplies&&!Object.hasOwn(state.players,refundTo))return {ok:false,reason:'Tower owner not found.'};
      state.towers.splice(index,1);addSupplies(state,refundTo,refund);
      return {ok:true,refund,...(state.individualSupplies?{refundTo}:{})};
    }
    case 'airstrike': { // Legacy command name; the active path determines the effect.
      if(player.cooldown>0)return {ok:false,reason:`${abilityName(player.skills)} is recharging.`};
      const active=player.skills?.active,variant=player.skills?.variant||0;if(!active)return {ok:false,reason:'Unlock a main skill in the skill tree first.'};
      if(active==='assault'||active==='recon'){
        if(!state.enemies.some(e=>e.hp>0))return {ok:false,reason:'No enemies in the field.'};
      }else if(!state.running)return {ok:false,reason:'This ability can only be used during a wave.'};
      if(active==='engineer'&&!state.towers.some(t=>t.ownerId===playerId))return {ok:false,reason:'Build a tower first.'};
      if(active==='medic'&&state.hp>=(state.maxHp??100))return {ok:false,reason:'Bunker health is already full.'};
      player.cooldown=Math.max(10,(player.skills?.extra?.[3]?25:30)-(player.loadout?.equipped===5?4:0)+((active==='logistics'||active==='medic'||active==='recon')&&variant===1?8:0)-webBonuses(player.skills).cooldown);
      if(active==='assault'){
        const bonus=state.wave>=6&&player.loadout?.equipped===7?10:0;
        if(variant===2){const target=state.enemies.filter(e=>e.hp>0).reduce((a,b)=>!a||b.hp>a.hp?b:a,null);if(target)target.hp-=80+bonus;}
        else {for(const enemy of state.enemies)enemy.hp-=(variant===1?25:35)+bonus;if(variant===1)state.suppression=Math.max(state.suppression||0,3);}
      }else if(active==='engineer'){player.overdrive=variant===1?15:variant===2?6:10;player.overdriveFactor=variant===1?1.35:variant===2?1.8:1.5;}
      else if(active==='logistics'){addSupplies(state,playerId,(variant===1?45:variant===2?20:30)+(player.skills?.extra?.[5]?15:0));if(variant===2)state.hp=Math.min(state.maxHp??100,state.hp+6);}
      else if(active==='medic'){state.hp=Math.min(state.maxHp??100,state.hp+(variant===1?25:variant===2?10:15)+(player.skills?.extra?.[7]?10:0));if(variant===2)addSupplies(state,playerId,12);}
      else if(active==='recon'){state.suppression=(variant===1?12:variant===2?4:8)+(player.skills?.extra?.[9]?3:0);if(variant===2)for(const enemy of state.enemies)enemy.hp-=20;}
      const combos=activateCombos(state,playerId,active,addSupplies);return {ok:true,combos};
    }
    default:return {ok:false,reason:'Unknown command.'};
  }
}

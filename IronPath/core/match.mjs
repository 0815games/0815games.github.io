import {equipmentForPlayer} from '../workshop/workshop-combat.mjs?v=20261112-tagless1';
import {reserveBuildPad,releaseBuildPad,releaseBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
import {getMap,createRandomMapId,sectorOf} from './maps.mjs?v=20261123-aim5';
import {activateCombos} from './skill-combos.mjs?v=20261123-aim5';
import {parseLoadout} from './armory.mjs?v=20261112-tagless1';
import {parseBuild,abilityName,webBonuses,specialistUnlocked} from './skills.mjs?v=20261123-aim5';
import {classUpgradeState,classPathConfig,classPathInvested} from './tower-class-paths.mjs?v=20261123-aim5';
// Shared command rules. These functions have no DOM, Firebase or network dependency.
// The caller must derive playerId from the authenticated session, never the payload.
import { upgradeCost, towerUpgradeInvestment } from './progression.mjs?v=20261105-prestige1';
import { waveFormation,missionFormation,SOLDIER_MAX_HP,towerMaxHp,repairQuote } from './combat.mjs?v=20261123-aim5';
import { upgradeCostFor, branchUnlocked } from './tower-specialization.mjs?v=20261123-aim5';
import { RUN_PERKS,perkOffers } from './run-perks.mjs?v=20261102-terrain4';
import {campaignSurge} from './campaign-pressure.mjs?v=20261112-pressure1';
import {waveRosterPresent,waveFieldsReady,makeWaveRequest,replyToWaveRequest} from './wave-consensus.mjs?v=20261123-aim5';
export const TOWER_COSTS = [50, 80, 65, 75];
export const PAD_COUNT = 10;

export function towerRefund(tower) {
  const investment=towerUpgradeInvestment(tower.level);
  if(investment===null||!Number.isSafeInteger(investment+TOWER_COSTS[tower.type]))throw new Error('Invalid tower investment');
  return Math.floor((TOWER_COSTS[tower.type]+investment+classPathInvested(tower))/2);
}

export function advanceSector(state,nextMapId){
  if(!state||state.individualSupplies||state.hostId||!state.pendingSector||sectorOf(state.mapId)<1)return null;
  const refund=state.towers.reduce((sum,tower)=>sum+Math.floor(.6*(TOWER_COSTS[tower.type]+(towerUpgradeInvestment(tower.level)??0)+classPathInvested(tower))),0);
  const factory=typeof nextMapId==='function'?nextMapId:createRandomMapId;
  const mapId=factory(state.mapId,globalThis.crypto,sectorOf(state.mapId)+1),map=getMap(mapId);
  state.mapId=mapId;state.pendingSector=0;state.towers=[];state.shots=[];state.enemies=[];state.spawnLeft=0;state.dustClouds=[];state.money=(state.money||0)+refund;
  for(const id of Object.keys(state.players))releaseBuildReservations(state,id);
  state.hp=Math.max(state.hp,Math.round(state.maxHp*.75));
  for(const player of Object.values(state.players)){player.x=Math.max(90,map.bunker.x-90);player.y=Math.min(map.height-60,map.bunker.y+60);player.target=null;player.direction={x:0,y:0};}
  return {sector:sectorOf(mapId),refund};
}

export function trainingBuildLocked(state){
  return state?.campaignContract?.threat==='training'&&state.towers.length>=1&&!state.towers.some(tower=>tower.level>=2);
}

export function createPlayer(id, profile, x=850, y=450) {
  if(typeof id!=='string'||!id||!profile||!['male','female'].includes(profile.gender)||typeof profile.name!=='string'||!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Invalid player');
  const level=Number.isInteger(profile.level)&&profile.level>0?profile.level:1;
  return {id, name:profile.name, gender:profile.gender, x, y, target:null, direction:{x:0,y:0}, level, skills:parseBuild(profile.skills,level),loadout:parseLoadout(profile.loadout), cooldown:0, shotTimer:0,overdrive:0, hp:SOLDIER_MAX_HP};
}

// Block E repair offer: up to 50 percent points back for about 20% of the
// tower's total investment; a smaller heal costs proportionally less. The
// price is quoted before anyone confirms, and the confirming player pays.
export function repairOffer(tower){
  const quote=repairQuote(tower);if(!quote)return null;
  const investment=TOWER_COSTS[tower.type]+(towerUpgradeInvestment(tower.level)??0)+classPathInvested(tower);
  const cost=Math.max(1,Math.round(investment*.2*(quote.heal/(quote.maxHp*.5))));
  return {...quote,cost};
}
export function getSupplies(state,playerId){return state.individualSupplies?(state.players[playerId]?.money??0):state.money;}
export function addSupplies(state,playerId,amount){if(state.individualSupplies){const player=state.players[playerId];if(!player)throw new Error('Unknown supplies owner');player.money+=amount;}else state.money+=amount;}
function clearWaveRequest(state){state.pendingWave=0;state.waveRequest=null;}
function startNextWave(state){state.wave++;state.running=true;clearWaveRequest(state);
  const surge=state.campaignContract?campaignSurge(state.campaignContract.threat,state.wave):0;
  state.spawnLeft=missionFormation(state.wave,state.campaignContract).length+surge+(surge>0?(state.campaignContract.surgeBonus||0):0);
  state.spawnIndex=0;state.spawnTimer=.2;}

export function applyCommand(state, playerId, command) {
  const player=Object.hasOwn(state.players,playerId)?state.players[playerId]:null;
  if(!player)return {ok:false,reason:'Unknown player.'};
  if(!command||typeof command.type!=='string')return {ok:false,reason:'Invalid command.'};
  if(state.ended)return {ok:false,reason:'The operation is over.'};
  if(state.hostId&&player.active===false)return {ok:false,reason:'Player is offline.'};
  switch(command.type){
    case 'leaveRun': {
      if(!state.individualSupplies||!state.hostId||playerId===state.hostId)return {ok:false,reason:'Only the guest can leave individually.'};
      player.active=false;player.departed=true;player.direction={x:0,y:0};player.target=null;clearWaveRequest(state);releaseBuildReservations(state,playerId);return {ok:true};
    }
    case 'endRun': {
      if(state.individualSupplies&&state.hostId&&playerId!==state.hostId)return {ok:false,reason:'Only the host can end the shared run. Leave the party to exit.'};
      clearWaveRequest(state);state.ended=true;state.running=false;state.endReason='retired';state.pendingPerk=0;state.spawnLeft=0;
      return {ok:true};
    }
    case 'startWave': {
      if(state.running||state.pendingPerk||state.pendingSector||!Number.isSafeInteger(state.wave)||state.wave>=Number.MAX_SAFE_INTEGER-1)return {ok:false,reason:state.pendingSector?'Order the retreat to the next sector first.':state.pendingPerk?'Choose a field upgrade first.':'Cannot start a wave now.'};
      if(state.individualSupplies&&state.hostId){
        if(state.pendingWave||state.waveRequest)return {ok:false,reason:'A wave request is already pending.'};
        if(!waveRosterPresent(state.players))return {ok:false,reason:'All players must reconnect before requesting a wave.'};
        if(!waveFieldsReady([state]))return {ok:false,reason:'All fields must be ready for the next wave.'};
        const previous=state.waveRequestId??0;
        if(!Number.isSafeInteger(previous)||previous<0||previous>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'No new wave request ID is available.'};
        if(command.expectedRequestId!==undefined&&command.expectedRequestId!==previous)return {ok:false,reason:'The request changed. Please try again.'};
        state.waveRequestId=previous+1;state.pendingWave=state.wave+1;
        state.waveRequest=makeWaveRequest(state.waveRequestId,state.pendingWave,playerId,state.players);
        return {ok:true,waitingForGuest:true,requestId:state.waveRequestId};
      }
      startNextWave(state);return {ok:true};
    }
    case 'advanceSector': {
      const retreat=advanceSector(state);
      if(!retreat)return {ok:false,reason:'No sector is waiting for this field.'};
      return {ok:true,sector:retreat.sector,refund:retreat.refund};
    }
    case 'approveWave': case 'declineWave': case 'cancelWave': {
      const request=state.individualSupplies&&state.hostId?state.waveRequest:null;
      if(command.type==='approveWave'&&request&&(!waveRosterPresent(state.players)||!waveFieldsReady([state],request.wave))){clearWaveRequest(state);return {ok:false,reason:'All fields and players must be ready for the next wave.'};}
      const reply=replyToWaveRequest(request,playerId,command);if(!reply.ok)return reply;
      if(reply.cancelled){clearWaveRequest(state);return {ok:true};}
      if(reply.complete){startNextWave(state);return {ok:true};}
      return {ok:true,waitingForPlayers:true};
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
      if(trainingBuildLocked(state))return {ok:false,reason:'Training contract: upgrade your first tower before building another one.'};
      const reserved=state.buildReservations?.[pad];if(reserved&&reserved.playerId!==playerId)return {ok:false,reason:'Another player is choosing a tower here.'};
      const cost=TOWER_COSTS[towerType];if(getSupplies(state,playerId)<cost)return {ok:false,reason:`Not enough supplies. This tower costs ${cost}.`};
      addSupplies(state,playerId,-cost);state.nextTowerId=(state.nextTowerId||0)+1;state.towers.push({id:state.nextTowerId,pad,type:towerType,level:1,timer:0,ownerId:playerId,hp:towerMaxHp(1),maxHp:towerMaxHp(1)});releaseBuildPad(state,playerId,pad);return {ok:true};
    }
    case 'upgrade': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const tower=state.towers.find(t=>t.pad===command.pad);
      if(!tower)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&(tower.id!==command.expectedTowerId||tower.level!==command.expectedLevel))return {ok:false,reason:'Tower changed. Select it again.'};
      if(upgradeCost(tower.level)===null||towerUpgradeInvestment(tower.level+1)===null||!Number.isSafeInteger(TOWER_COSTS[tower.type]+towerUpgradeInvestment(tower.level+1)))return {ok:false,reason:'Tower cannot be upgraded further.'};
      if(tower.level===2&&![0,1,2,3].includes(command.branch))return {ok:false,reason:'Choose a valid specialization.'};
      if(tower.level===2&&!branchUnlocked(command.branch,player.level))return {ok:false,reason:command.branch===2?'Veteran specialization unlocks at soldier level 5.':'Boss Hunter specialization unlocks at soldier level 10.'};
      if(tower.repairing>0)return {ok:false,reason:'Let the repair finish first.'};
      const cost=upgradeCostFor(tower,upgradeCost(tower.level));if(getSupplies(state,playerId)<cost)return {ok:false,reason:`Not enough supplies. You need ${cost}.`};
      addSupplies(state,playerId,-cost);const oldMax=tower.maxHp||towerMaxHp(tower.level),oldHp=tower.hp??oldMax;if(tower.level===2)tower.branch=command.branch;tower.level++;tower.maxHp=towerMaxHp(tower.level);tower.hp=oldHp<=0?0:Math.max(1,Math.round(tower.maxHp*oldHp/oldMax));return {ok:true};
    }
    case 'classUpgrade': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const tower=state.towers.find(t=>t.pad===command.pad);
      if(!tower)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&(tower.id!==command.expectedTowerId||tower.level!==command.expectedLevel))return {ok:false,reason:'Tower changed. Select it again.'};
      const info=classUpgradeState(player,tower);
      if(!info.available)return {ok:false,reason:info.requirement||'Class tower upgrade is not available.'};
      if(getSupplies(state,playerId)<info.cost)return {ok:false,reason:`Not enough supplies. You need ${info.cost}.`};
      addSupplies(state,playerId,-info.cost);
      tower.classPath=info.classId;
      tower.classTier=info.nextTier;
      return {ok:true,classPath:info.classId,tier:info.nextTier,label:classPathConfig(info.classId)?.name||info.classId};
    }
    case 'sell': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const index=state.towers.findIndex(t=>t.pad===command.pad);
      if(index<0)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&(state.towers[index].id!==command.expectedTowerId||state.towers[index].level!==command.expectedLevel))return {ok:false,reason:'Tower changed. Select it again.'};
      const tower=state.towers[index],refund=towerRefund(tower),refundTo=state.individualSupplies?tower.ownerId:playerId;
      if(state.individualSupplies&&!Object.hasOwn(state.players,refundTo))return {ok:false,reason:'Tower owner not found.'};
      state.towers.splice(index,1);addSupplies(state,refundTo,refund);
      // Selling before a paid repair lands returns the reserved repair cost.
      if(tower.repairing>0&&tower.repairCost>0){const payer=tower.repairPaidBy;if(!state.individualSupplies||Object.hasOwn(state.players,payer))addSupplies(state,payer,tower.repairCost);}
      return {ok:true,refund,...(state.individualSupplies?{refundTo}:{})};
    }
    case 'repairTower': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=getMap(state.mapId).pads.length)return {ok:false,reason:'Invalid pad.'};
      const tower=state.towers.find(t=>t.pad===command.pad);
      if(!tower)return {ok:false,reason:'Tower not found.'};
      if(command.expectedTowerId!==undefined&&tower.id!==command.expectedTowerId)return {ok:false,reason:'Tower changed. Select it again.'};
      if(tower.repairing>0)return {ok:false,reason:'A repair is already running for this tower.'};
      const offer=repairOffer(tower);
      if(!offer)return {ok:false,reason:'This tower is undamaged.'};
      if(getSupplies(state,playerId)<offer.cost)return {ok:false,reason:`Not enough supplies. You need ${offer.cost}.`};
      addSupplies(state,playerId,-offer.cost);
      tower.hp=offer.hp;tower.maxHp=offer.maxHp;tower.repairing=2;tower.repairHeal=offer.heal;tower.repairCost=offer.cost;tower.repairPaidBy=playerId;
      return {ok:true,cost:offer.cost,heal:offer.heal};
    }
    case 'airstrike': {
      if(player.downed>0)return {ok:false,reason:'You are down and cannot use your ability yet.'};
      if(player.cooldown>0)return {ok:false,reason:`${abilityName(player.skills)} is recharging.`};
      const active=player.skills?.active,variant=player.skills?.variant||0;if(!active)return {ok:false,reason:'Choose a class in Skills first.'};
      if(active==='assault'||active==='recon'||active==='airDefense'){
        if(!state.enemies.some(e=>e.hp>0))return {ok:false,reason:'No enemies in the field.'};
      }else if(!state.running)return {ok:false,reason:'This ability can only be used during a wave.'};
      if(active==='engineer'&&!state.towers.some(t=>t.ownerId===playerId))return {ok:false,reason:'Build a tower first.'};
      if(active==='medic'&&state.hp>=(state.maxHp??100))return {ok:false,reason:'Bunker health is already full.'};
      const rapidOrders=specialistUnlocked(player.skills,'engineer',1);
      const variantCooldown=((active==='logistics'||active==='medic'||active==='recon')&&variant===1)?8:(active==='airDefense'&&variant===2)?6:0;
      player.cooldown=Math.max(10,(rapidOrders?25:30)-equipmentForPlayer(state,player).cooldown+variantCooldown-webBonuses(player.skills).cooldown);
      const waveNow=state.wave||0,abilityScale=1+Math.max(0,waveNow-5)*.04;
      if(active==='assault'){
        const bonus=equipmentForPlayer(state,player).airstrikeDamage;
        if(variant===2){
          const target=state.enemies.filter(e=>e.hp>0).reduce((a,b)=>!a||b.hp>a.hp?b:a,null);
          if(target)target.hp-=Math.round((80+bonus)*abilityScale);
        }else{
          const burst=Math.round((variant===1?25:35)*abilityScale)+bonus;
          for(const enemy of state.enemies)enemy.hp-=burst;
          if(variant===1)state.suppression=Math.max(state.suppression||0,3);
        }
      }else if(active==='engineer'){
        player.overdrive=variant===1?15:variant===2?6:10;
        player.overdriveFactor=variant===1?1.35:variant===2?1.8:1.5;
      }else if(active==='logistics'){
        const extraRations=specialistUnlocked(player.skills,'logistics',1)?15:0;
        addSupplies(state,playerId,(variant===1?45:variant===2?20:30)+extraRations);
        if(variant===2)state.hp=Math.min(state.maxHp??100,state.hp+6);
      }else if(active==='medic'){
        const fieldSurgeon=specialistUnlocked(player.skills,'medic',1)?10:0;
        state.hp=Math.min(state.maxHp??100,state.hp+(variant===1?25:variant===2?10:15)+fieldSurgeon+Math.floor(Math.max(0,waveNow-5)/6));
        if(variant===2)addSupplies(state,playerId,12);
      }else if(active==='recon'){
        const pinningBonus=specialistUnlocked(player.skills,'recon',1)?3:0;
        state.suppression=(variant===1?12:variant===2?4:8)+pinningBonus;
        if(variant===2)for(const enemy of state.enemies)enemy.hp-=Math.round(20*abilityScale);
      }else if(active==='airDefense'){
        const markSeconds=variant===1?8:variant===2?5:6;
        const airDmg=Math.round((variant===1?25:variant===2?60:45)*abilityScale);
        const groundDmg=Math.round((variant===1?25:variant===2?20:20)*abilityScale);
        for(const enemy of state.enemies){
          if(enemy.hp<=0)continue;
          const isAir=enemy.kind==='plane'||enemy.baseKind==='plane';
          enemy.hp-=isAir?airDmg:groundDmg;
          enemy.marked=Math.max(enemy.marked||0,markSeconds);
          enemy.markedByAirDefense=true;
          if(variant===2)enemy.pinned=Math.max(enemy.pinned||0,3);
        }
        if(variant===2)state.suppression=Math.max(state.suppression||0,3);
      }
      const combos=activateCombos(state,playerId,active,addSupplies);
      return {ok:true,combos};
    }
    default:return {ok:false,reason:'Unknown command.'};
  }
}

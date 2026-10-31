// Shared command rules. These functions have no DOM, Firebase or network dependency.
// The caller must derive playerId from the authenticated session, never the payload.
import { MAX_TOWER_LEVEL, upgradeCost } from './progression.mjs';
import { WAVES } from './combat.mjs';
export const TOWER_COSTS = [50, 80, 65, 75];
export const PAD_COUNT = 10;
export function createPlayer(id, profile, x=850, y=450) {
  if(typeof id!=='string'||!id||!profile||!['male','female'].includes(profile.gender)||typeof profile.name!=='string'||!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Invalid player');
  return {id, name:profile.name, gender:profile.gender, x, y, target:null, direction:{x:0,y:0}, level:Number.isInteger(profile.level)&&profile.level>0?profile.level:1, cooldown:0, shotTimer:0};
}
// Shared resources and pads; abilities and movement are owned by each player.
// Returns an explicit result rather than trusting a client-side UI decision.
export function applyCommand(state, playerId, command) {
  const player=Object.hasOwn(state.players,playerId)?state.players[playerId]:null;
  if(!player)return {ok:false,reason:'Unknown player.'};
  if(!command||typeof command.type!=='string')return {ok:false,reason:'Invalid command.'};
  if(state.ended)return {ok:false,reason:'The operation is over.'};
  switch(command.type){
    case 'startWave': {
      if(state.running||state.wave>=WAVES.length)return {ok:false,reason:'Cannot start a wave now.'};
      state.wave++;state.running=true;state.spawnLeft=WAVES[state.wave-1].length;state.spawnIndex=0;state.spawnTimer=.2;return {ok:true};
    }
    case 'direction': {
      if(!Number.isInteger(command.x)||!Number.isInteger(command.y)||Math.abs(command.x)>1||Math.abs(command.y)>1)return {ok:false,reason:'Invalid direction.'};
      player.direction={x:command.x,y:command.y};if(command.x||command.y)player.target=null;return {ok:true};
    }
    case 'move': {
      if(!Number.isFinite(command.x)||!Number.isFinite(command.y)||command.x<12||command.x>948||command.y<12||command.y>528)return {ok:false,reason:'Invalid destination.'};
      player.direction={x:0,y:0};player.target={x:command.x,y:command.y};return {ok:true};
    }
    case 'build': {
      const {pad,towerType}=command;
      if(!Number.isInteger(pad)||pad<0||pad>=PAD_COUNT||!Number.isInteger(towerType)||towerType<0||towerType>=TOWER_COSTS.length)return {ok:false,reason:'Invalid build selection.'};
      if(state.towers.some(t=>t.pad===pad))return {ok:false,reason:'Pad already occupied.'};
      const cost=TOWER_COSTS[towerType];if(state.money<cost)return {ok:false,reason:`Not enough supplies. This tower costs ${cost}.`};
      state.money-=cost;state.towers.push({pad,type:towerType,level:1,timer:0,ownerId:playerId});return {ok:true};
    }
    case 'upgrade': {
      if(!Number.isInteger(command.pad)||command.pad<0||command.pad>=PAD_COUNT)return {ok:false,reason:'Invalid pad.'};
      const tower=state.towers.find(t=>t.pad===command.pad);
      if(!tower)return {ok:false,reason:'Tower not found.'};
      if(tower.level>=MAX_TOWER_LEVEL)return {ok:false,reason:'Tower is already at maximum level.'};
      if(tower.level===2&&command.branch!==0&&command.branch!==1)return {ok:false,reason:'Choose a valid specialization.'};
      const cost=upgradeCost(tower.level);if(state.money<cost)return {ok:false,reason:`Not enough supplies. You need ${cost}.`};
      state.money-=cost;if(tower.level===2)tower.branch=command.branch;tower.level++;return {ok:true};
    }
    case 'airstrike': {
      if(player.cooldown>0)return {ok:false,reason:'Airstrike is recharging.'};
      if(!state.enemies.some(e=>e.hp>0))return {ok:false,reason:'No enemies in the field.'};
      player.cooldown=30;for(const enemy of state.enemies)enemy.hp-=35;return {ok:true};
    }
    default:return {ok:false,reason:'Unknown command.'};
  }
}

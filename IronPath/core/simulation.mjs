import {equipmentForPlayer} from '../workshop/workshop-combat.mjs?v=20261112-tagless1';
import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261107-balance1';
import {advanceBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
import {comboTier,comboCue} from './skill-combos.mjs?v=20261123-aim6';
import {webBonuses,specialistUnlocked,hasCapstone} from './skills.mjs?v=20261123-aim6';
import {classTowerRangeFactor,classTowerIntervalFactor,classTowerIgnoresClouds,classTowerDamageFactor,applyClassTowerHitEffects} from './tower-class-paths.mjs?v=20261123-aim6';
import {bossPhase,bossWeaponFactor,crossedCycle} from './boss-mechanics.mjs?v=20261031-finale1';
import {terrainFor,soldierSpeedFactor,enemySpeedFactor,iceDamage,targetingRange,weaponDamageFactor} from './terrain.mjs?v=20261124-zones1';
import {getMap,isMapId,DEFAULT_MAP,sectorOf,zoneAt,mapPlayerCap} from './maps.mjs?v=20261123-aim6';
import { WAVE_COUNT,waveFormation,missionFormation,sectorFormation,makeEnemy,towerDamage,SOLDIER_MAX_HP,SOLDIER_RETURN_SECONDS,SOLDIER_PROTECT_SECONDS,ENEMY_ATTACKS,ENEMY_ATTACK_FIRST_WAVE,MAX_ATTACKERS_PER_TARGET,towerMaxHp } from './combat.mjs?v=20261123-aim6';
import { waveXP } from './progression.mjs?v=20261105-prestige1';
import {addSupplies} from './match.mjs?v=20261123-aim6';
import {towerIntervalFactor,towerRangeFactor,towerIgnoresClouds,towerDamageBonus,applyHitEffects} from './tower-specialization.mjs?v=20261123-aim6';
export const STEP = 1/30;
export const PATH=getMap(DEFAULT_MAP).path, PADS=getMap(DEFAULT_MAP).pads;
const towerStats=[{range:125,interval:.55,color:'#d9d884'},{range:145,interval:1.4,color:'#e49b67'},{range:155,interval:.8,color:'#8cc0a6'},{range:210,interval:1.8,color:'#a9a4d4'}];
const branchStats=[[{interval:.55,range:1},{interval:1,range:1},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.6,range:1},{interval:1,range:1},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.55,range:1},{interval:1,range:1.45},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.6,range:1},{interval:1,range:1.1},{interval:.85,range:1.15},{interval:1.25,range:1}]];
export function getTowerRange(tower){
  const stats=towerStats[tower.type],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;
  return stats.range*(branch?branch.range:1)*classTowerRangeFactor(tower);
}
export function createMatch(players,mapId=DEFAULT_MAP){
  if(!isMapId(mapId))throw new Error('Invalid map');
  if(!Array.isArray(players)||players.length<1||players.length>mapPlayerCap(mapId)||new Set(players.map(p=>p.id)).size!==players.length)throw new Error('Invalid match roster');
  const individualSupplies=players.length>1;
  const fortify=Math.max(...players.map(p=>p.loadout?.fortify||0)),plating=Math.max(...players.map(p=>p.loadout?.plating||0));
  const repair=Math.max(...players.map(p=>p.loadout?.repair||0)),gun=Math.max(...players.map(p=>p.loadout?.gun||0));
  const supply=Math.max(...players.map(p=>p.loadout?.supply||0)),safeguard=Math.max(...players.map(p=>p.loadout?.safeguard||0));
  const maxHp=100+fortify*10+players.reduce((n,p)=>n+5*(p.skills?.medic||0)+(specialistUnlocked(p.skills,'medic',0)?10:0)+legacyEquipmentEffects(p.loadout?.equipped).bunkerHealth+webBonuses(p.skills).health,0);
  return {mapId,wave:0,hp:maxHp,maxHp,plating,repair,gun,supply,safeguard,gunTimer:0,lootKills:0,suppression:0,...(individualSupplies?{individualSupplies:true}:{money:125+legacyEquipmentEffects(players[0].loadout?.equipped).startSupplies+webBonuses(players[0].skills).start}),enemies:[],towers:[],shots:[],running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:Object.fromEntries(players.map(p=>[p.id,individualSupplies?{...p,money:125+legacyEquipmentEffects(p.loadout?.equipped).startSupplies+webBonuses(p.skills).start,completedWaveMask:0,lootCaches:0}:p]))};
}
export const COOP_REWARD_RATE=.7;
export const COOP_ENEMY_HEALTH=1.5;
export const COOP_THREE_REWARD_RATE=.6;
export const COOP_THREE_ENEMY_HEALTH=1.75;
export const COOP_FOUR_REWARD_RATE=.55;
export const COOP_FOUR_ENEMY_HEALTH=2;
export const MULTIPLAYER_SECTOR_START_WAVE=11;
function activePlayers(state){return Object.keys(state.players).sort().filter(id=>state.players[id].active!==false);}
function assaultRankDamage(wave){return 2+(wave>=6?Math.min(3,1+Math.floor((wave-6)/6)):0);}
function airDefenseDamageMultiplier(skills,bonus,target){
  if(!target)return 1;
  let factor=1;
  const isAir=target.kind==='plane'||target.baseKind==='plane';
  const adRank=skills?.airDefense||0;
  if(isAir){
    factor+=.12*adRank+(bonus?.airDamage||0)/100;
  }
  if(target.marked>0&&target.markedByAirDefense){
    factor+=.06*adRank+(bonus?.markDamage||0)/100+(specialistUnlocked(skills,'airDefense',0)?.12:0)+(skills?.classId==='airDefense'&&hasCapstone(skills)?.2:0);
  }
  return factor;
}
function rewardTeam(state,amount,enemyKill=false){
  const active=activePlayers(state),salvage=enemyKill?(state.runPerks?.salvage||0):0,rate=active.length>3?COOP_FOUR_REWARD_RATE:active.length>2?COOP_THREE_REWARD_RATE:COOP_REWARD_RATE,base=state.individualSupplies&&active.length>1?Math.floor(amount*rate):amount;
  const killBonus=p=>(p.skills?.logistics||0)+(specialistUnlocked(p.skills,'logistics',0)?1:0)+webBonuses(p.skills).supplies;
  if(state.individualSupplies){for(const id of active)addSupplies(state,id,base+salvage+(enemyKill?killBonus(state.players[id]):0));}
  else state.money+=base+salvage+(enemyKill?killBonus(Object.values(state.players)[0]):0);
  return base;
}

export function stepMatch(state){
  const events=[];if(state.ended)return events;advanceBuildReservations(state,STEP);const bonuses=Object.fromEntries(Object.entries(state.players).map(([id,p])=>[id,webBonuses(p.skills)]));const dt=STEP,map=getMap(state.mapId),{path:PATH,pads:PADS}=map,theme=terrainFor(map),paths=map.paths||[PATH],bunker=map.bunker||{x:900,y:400},sector=sectorOf(state.mapId);
  const pathForEnemy=enemy=>paths[enemy.road]||paths[0],onRoad=enemy=>enemy.segment<pathForEnemy(enemy).length;
  const zones=map.zones||null,zoneInfoOf=enemy=>{if(!zones)return null;const zone=zoneAt(map,enemy.x,enemy.y);return zone?{kind:zone.kind,broken:!!state.zoneBroken?.[zone.id],cleared:!!state.zoneCleared?.[zone.id]}:null;};
  const shotDuration=state.individualSupplies ? .55 : .24;
  state.shots=state.shots.filter(s=>(s.life-=dt)>0);if(state.combatPops)state.combatPops=state.combatPops.filter(p=>(p.life-=dt)>0);
  const jamField=state.enemies.some(e=>e.boss==='bossRiegel'&&e.hp>0&&bossPhase(e)==='jam');
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;p.protect=Math.max(0,(p.protect||0)-dt);
    if(p.downed>0){p.downed=Math.max(0,p.downed-dt);if(p.downed<=0){p.hp=p.maxHp||SOLDIER_MAX_HP;p.x=Math.max(90,bunker.x-90);p.y=Math.min((map.height||540)-60,bunker.y+60);p.target=null;p.direction={x:0,y:0};p.protect=SOLDIER_PROTECT_SECONDS;events.push({type:'soldierReturn',playerId:id});}}
    const speed=(150+10*(p.skills?.recon||0)+bonuses[id].movement+(p.mobileSupply?.remaining>0?p.mobileSupply.bonus:0)+equipmentForPlayer(state,p).movement)*soldierSpeedFactor(theme,p,PATH);p.overdrive=Math.max(0,(p.overdrive||0)-dt);if(p.mobileSupply)p.mobileSupply.remaining=Math.max(0,p.mobileSupply.remaining-dt);if(p.healingField?.remaining>0&&state.running){const elapsed=Math.min(dt,p.healingField.remaining);p.healingField.remaining=Math.max(0,p.healingField.remaining-elapsed);state.hp=Math.min(state.maxHp,state.hp+p.healingField.rate*elapsed);}let {x:dx,y:dy}=p.downed>0?{x:0,y:0}:p.direction;
    if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;}
    else if(p.target&&!(p.downed>0)){dx=p.target.x-p.x;dy=p.target.y-p.y;const len=Math.hypot(dx,dy),step=Math.min(len,speed*dt);if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}if(len<=step)p.target=null;}
    p.x=Math.max(12,Math.min((map.width||960)-12,p.x));p.y=Math.max(12,Math.min((map.height||540)-12,p.y));
    if(!jamField&&state.running)p.cooldown=Math.max(0,p.cooldown-dt);
  }
  if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const spawnIndex=state.spawnIndex++,formation=sectorFormation(missionFormation(state.wave,state.campaignContract),(state.individualSupplies||state.hostId)?0:sector),kind=formation[spawnIndex%formation.length],enemy=makeEnemy(kind,state.wave),count=activePlayers(state).length,road=spawnIndex%paths.length,path=paths[road],effectiveSector=(state.individualSupplies||state.hostId)&&state.wave<MULTIPLAYER_SECTOR_START_WAVE?1:sector;
      if(effectiveSector>1){enemy.hp=enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*(1+.12*(effectiveSector-1))));enemy.speed*=1+.05*(effectiveSector-1);}if(state.individualSupplies&&count>1){const healthMult=count>3?COOP_FOUR_ENEMY_HEALTH:count>2?COOP_THREE_ENEMY_HEALTH:COOP_ENEMY_HEALTH;enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*healthMult);}
      if(state.campaignContract){enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*state.campaignContract.unit);enemy.campaign=true;}
      if(state.campaignContract?.bossUnit&&enemy.boss)enemy.hp=enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*state.campaignContract.bossUnit));
      state.enemies.push({...enemy,...(paths.length>1?{road}:{}),x:path[0].x,y:path[0].y,segment:1});
      if(enemy.boss)events.push({type:'bossSpawn',boss:enemy.boss,wave:state.wave});
      state.spawnLeft--;state.spawnTimer=.8;}}
  if(theme==='scrub'||zones){
    state.dustClouds=(state.dustClouds||[]).map(c=>({...c,life:c.life-dt})).filter(c=>c.life>0);
    state.dustTimer=(state.dustTimer||0)-dt;
    if(state.dustTimer<=0){
      const tanks=state.enemies.filter(e=>e.kind==='tank'&&e.hp>0&&e.speed>0&&onRoad(e)&&(theme==='scrub'||zoneAt(map,e.x,e.y)?.kind==='dust'));
      if(tanks.length){const start=(state.dustCursor||0)%tanks.length;for(let i=0;i<Math.min(3,tanks.length);i++){const e=tanks[(start+i)%tanks.length];state.dustClouds.push({x:e.x,y:e.y,life:2});}state.dustCursor=(start+3)%tanks.length;}
      state.dustClouds=state.dustClouds.slice(-12);state.dustTimer=.75;
    }
  }
  function hitRubble(target,damage){
    if(zones){
      const zone=zoneAt(map,target.x,target.y);
      if(zone?.kind==='rubble'&&!state.zoneCleared?.[zone.id]&&damage>0){
        state.zoneDamage={...state.zoneDamage,[zone.id]:Math.min(200,(state.zoneDamage?.[zone.id]||0)+Math.min(damage,Math.max(0,target.hp)))};
        if(state.zoneDamage[zone.id]>=200){(state.zoneCleared||(state.zoneCleared={}))[zone.id]=true;events.push({type:'rubbleCleared'});}
      }
      return;
    }
    if(theme!=='urban'||state.rubbleCleared||target.segment!==3||damage<=0)return;
    state.rubbleDamage=Math.min(200,(state.rubbleDamage||0)+Math.min(damage,Math.max(0,target.hp)));
    if(state.rubbleDamage>=200){state.rubbleCleared=true;events.push({type:'rubbleCleared'});}
  }
  state.suppression=Math.max(0,(state.suppression||0)-dt);
  for(const e of state.enemies)if(e.boss&&e.hp>0){
    const before=e.bossClock||0,after=before+dt;e.bossClock=after;e.bossFlash=Math.max(0,(e.bossFlash||0)-dt);
    if(e.boss==='bossJuggernaut'&&crossedCycle(before,after,10)){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.02);e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'repair'});}
    if(e.boss==='bossKolt'&&crossedCycle(before,after,18)){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'flood'});}
    if(e.boss==='bossA7'){const phase=bossPhase(e);if(e.a7Phase&&e.a7Phase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'a7-'+phase});}e.a7Phase=phase;}
    if(e.boss==='bossZugsmeister'){const phase=bossPhase(e);if(e.zugsPhase&&e.zugsPhase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'zugs-'+phase});}e.zugsPhase=phase;
      const period=phase==='wire'?18:phase==='guns'?12:0;
      if(period&&crossedCycle(before,after,period)){
        const damage=10*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0)*(state.wave>=6?1-.02*(state.safeguard||0):1):1);
        state.hp-=damage;e.bossFlash=.8;state.bunkerImpact={seq:(state.bunkerImpact?.seq||0)+1,kind:'bossZugsmeister',damage};events.push({type:'bossAbility',boss:e.boss,ability:'railgun',damage});
      }
    }
    if(e.boss==='bossRook'){const phase=bossPhase(e);if(e.rookPhase&&e.rookPhase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'rook-'+phase});}e.rookPhase=phase;
      if(phase==='guard'&&crossedCycle(before,after,16)){
        const guard={...makeEnemy('tank',state.wave),campaign:true};guard.hp=guard.maxHp=Math.max(1,Math.round(guard.maxHp*.6));
        state.enemies.push({...guard,...(e.road!==undefined?{road:e.road}:{}),x:e.x,y:e.y,segment:e.segment});
        e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'guard',count:1});
      }
    }
    if(e.boss==='bossRiegel'&&crossedCycle(before,after,18)){
      const count=3;
      for(let i=0;i<count;i++){const swarm={...makeEnemy('runner',state.wave),campaign:true};swarm.hp=swarm.maxHp=Math.max(1,Math.round(swarm.maxHp*.5));swarm.speed*=1.35;state.enemies.push({...swarm,...(e.road!==undefined?{road:e.road}:{}),x:e.x,y:e.y,segment:e.segment});}
      e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'interceptors',count});
    }
    if(e.boss==='bossBomber'&&crossedCycle(before,after,12)){
      const damage=8*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0)*(state.wave>=6?1-.02*(state.safeguard||0):1):1);
      state.hp-=damage;e.bossFlash=.8;state.bunkerImpact={seq:(state.bunkerImpact?.seq||0)+1,kind:'bossBomber',damage};events.push({type:'bossAbility',boss:e.boss,ability:'bomb',damage});
    }
  }
  const commander=state.enemies.find(e=>e.boss==='bossCommander'&&e.hp>0),rally=commander&&bossPhase(commander)==='rally';
  const kolt=state.enemies.find(e=>e.boss==='bossKolt'&&e.hp>0),flood=kolt&&bossPhase(kolt)==='flood';
  // Block E: infantry threatens soldiers in reach, tanks threaten nearby
  // towers. Every attack is telegraphed in the enemy's windup first; a
  // target that leaves reach (or falls) in time is not hit, and at most a
  // capped number of attackers may wind up on the same target.
  if(state.running&&state.wave>=ENEMY_ATTACK_FIRST_WAVE){
    const attackersOn=key=>state.enemies.reduce((n,e)=>n+(e.windup?.key===key?1:0),0);
    for(const e of state.enemies){
      if(e.hp<=0||e.boss)continue;
      const cfg=ENEMY_ATTACKS[e.kind];if(!cfg)continue;
      e.attackTimer=Math.max(0,(e.attackTimer||0)-dt);
      if(e.windup){
        e.windup.time-=dt;
        if(e.windup.time>0)continue;
        const windup=e.windup;e.windup=null;e.attackTimer=cfg.cooldown;
        if(windup.kind==='soldier'){
          const target=state.players[windup.id];
          if(target&&target.active!==false&&!(target.downed>0)&&(target.hp??target.maxHp??SOLDIER_MAX_HP)>0&&Math.hypot(e.x-target.x,e.y-target.y)<=cfg.range*1.3){
            const damage=target.protect>0?0:cfg.damage;
            if(damage>0){target.hp=Math.max(0,(target.hp??target.maxHp??SOLDIER_MAX_HP)-damage);events.push({type:'enemyAttack',target:'soldier',playerId:windup.id,damage});if(target.hp<=0){target.downed=SOLDIER_RETURN_SECONDS;target.direction={x:0,y:0};target.target=null;events.push({type:'soldierDown',playerId:windup.id,seconds:SOLDIER_RETURN_SECONDS});}}
          }
        }else{
          const tower=state.towers.find(t=>t.pad===windup.pad),padPoint=PADS[windup.pad];
          if(tower&&padPoint&&(tower.hp??tower.maxHp??towerMaxHp(tower.level))>0&&Math.hypot(e.x-padPoint.x,e.y-padPoint.y)<=cfg.range*1.3){
            const maxHp=tower.maxHp||towerMaxHp(tower.level);tower.maxHp=maxHp;tower.hp=Math.max(0,(tower.hp??maxHp)-cfg.damage);events.push({type:'enemyAttack',target:'tower',pad:windup.pad,damage:cfg.damage});if(tower.hp<=0)events.push({type:'towerDisabled',pad:windup.pad});
          }
        }
        continue;
      }
      if(e.attackTimer>0||e.pinned>0||!onRoad(e))continue;
      if(cfg.target==='soldier'){
        let best=null,bestDist=cfg.range;
        for(const pid of Object.keys(state.players).sort()){const p=state.players[pid];if(p.active===false||p.downed>0||(p.hp??p.maxHp??SOLDIER_MAX_HP)<=0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<=bestDist){best=pid;bestDist=d;}}
        if(best&&attackersOn('s:'+best)<MAX_ATTACKERS_PER_TARGET)e.windup={key:'s:'+best,kind:'soldier',id:best,time:cfg.windup};
      }else{
        let best=null,bestDist=cfg.range;
        for(const tower of state.towers){if((tower.hp??tower.maxHp??towerMaxHp(tower.level))<=0)continue;const padPoint=PADS[tower.pad];if(!padPoint)continue;const d=Math.hypot(e.x-padPoint.x,e.y-padPoint.y);if(d<=bestDist){best=tower.pad;bestDist=d;}}
        if(best!==null&&attackersOn('t:'+best)<MAX_ATTACKERS_PER_TARGET)e.windup={key:'t:'+best,kind:'tower',pad:best,time:cfg.windup};
      }
    }
  }
  if(zones)for(const zone of zones){
    if(zone.kind!=='ice'||state.zoneBroken?.[zone.id])continue;
    const tanks=state.enemies.filter(e=>e.hp>0&&e.kind==='tank'&&Math.hypot(e.x-zone.x,e.y-zone.y)<=zone.r).length;
    if(tanks){
      state.zoneStress={...state.zoneStress,[zone.id]:(state.zoneStress?.[zone.id]||0)+tanks*dt};
      if(state.zoneStress[zone.id]>=4){(state.zoneBroken||(state.zoneBroken={}))[zone.id]=true;events.push({type:'iceBroken'});}
    }
  }
  if(theme==='arctic'&&!state.iceBroken){
    const tanks=state.enemies.filter(e=>e.hp>0&&e.kind==='tank'&&e.segment===5).length;
    if(tanks){state.iceStress=(state.iceStress||0)+tanks*dt;if(state.iceStress>=4){state.iceBroken=true;events.push({type:'iceBroken'});}}
  }
  for(const e of state.enemies){const PATH=paths[e.road]||paths[0],zi=zoneInfoOf(e);if(e.siegeMarks)e.siegeMarks=e.siegeMarks.map(m=>({...m,time:m.time-dt})).filter(m=>m.time>0);e.pinned=Math.max(0,(e.pinned||0)-dt);e.marked=Math.max(0,(e.marked||0)-dt);if(e.marked<=0)e.markedByAirDefense=false;if(e.boss==='bossJuggernaut'&&e.hp>0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.002*dt);e.hp-=iceDamage(theme,e,dt,state.iceBroken,zi);let distance=e.speed*dt*(theme==='arctic'&&state.iceBroken&&e.kind==='tank'&&e.segment===5?.75:1)*(e.pinned>0?.8:1)*enemySpeedFactor(theme,e,zi)*(state.suppression>0?.5:1)*(e.kind!=='plane'&&!e.boss&&commander&&Math.hypot(e.x-commander.x,e.y-commander.y)<(rally?180:100)?(rally?1.4:1.25):1)*(flood&&!e.boss?1.45:1)*(e.boss==='bossA7'?(bossPhase(e)==='kern'?1.35:bossPhase(e)==='torso'?1.12:1):1)*(e.boss==='bossZugsmeister'?(bossPhase(e)==='loco'?1.35:bossPhase(e)==='guns'?1.12:1):1)*(e.boss==='bossRook'?(bossPhase(e)==='vow'?1.15:bossPhase(e)==='order'?.85:1):1);while(distance>0&&onRoad(e)){const target=PATH[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
  if(state.gun>0&&state.running){
    state.gunTimer=Math.max(0,(state.gunTimer||0)-dt);
    if(state.gunTimer<=0){const target=state.enemies.find(e=>e.hp>0&&onRoad(e)&&Math.hypot(e.x-bunker.x,e.y-bunker.y)<=170);if(target){target.hp-=5*state.gun;state.gunTimer=3;state.shots.push({x:bunker.x,y:bunker.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff',id:(state._shotSeq=(state._shotSeq||0)+1),fx:'bunker'});}}
  }
  for(const tower of state.towers){tower.timer-=dt;
    if(tower.repairing>0){tower.repairing=Math.max(0,tower.repairing-dt);if(tower.repairing<=0){const maxHp=tower.maxHp||towerMaxHp(tower.level);tower.maxHp=maxHp;tower.hp=Math.min(maxHp,(tower.hp??maxHp)+(tower.repairHeal||0));tower.repairHeal=0;tower.repairCost=0;tower.repairPaidBy=null;events.push({type:'towerRepaired',pad:tower.pad});}continue;}
    if((tower.hp??1)<=0)continue;
    const type=towerStats[tower.type],p=PADS[tower.pad],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;if(tower.timer<=0){const owner=state.players[tower.ownerId];const flakNet=specialistUnlocked(owner?.skills,'airDefense',1);const target=state.enemies.filter(e=>e.hp>0&&onRoad(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=targetingRange(theme,getTowerRange(tower)*towerRangeFactor(tower,e)*(flakNet&&(e.kind==='plane'||e.baseKind==='plane')?1.15:1),e,state.enemies,{sniper:tower.type===3,clouds:(towerIgnoresClouds(tower)||classTowerIgnoresClouds(tower))?[]:(state.dustClouds||[])})).sort((a,b)=>b.segment-a.segment)[0];if(target){const perks=state.runPerks||{};tower.shotCount=(tower.shotCount||0)+1;
      const engineerSuppressed=owner?.skills?.classId==='engineer'&&state.suppression>0?.08*comboTier(owner?.skills,'engineer'):0;
      const dealt=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind)*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.1*(perks.damage||0))*(target.kind==='tank'&&(tower.type===1||tower.type===3)?1+.2*(perks.tankhunter||0):1)*(tower.type===3&&tower.shotCount%4===0?1+.75*(perks.critical||0):1)*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(owner?.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared,zoneInfo:zoneInfoOf(target)})*(1+.1*(owner?.skills?.engineer||0)+.01*(bonuses[tower.ownerId]?.tower||0)+engineerSuppressed)*(target.kind==='tank'?equipmentForPlayer(state,owner).tankTowerMultiplier:1)*(tower.branch===3&&target.boss?1.5:1)*(owner?.active!==false&&owner?.overdrive>0?(owner.overdriveFactor||1.5):1)*towerDamageBonus(state,tower,target)*classTowerDamageFactor(tower,target)*airDefenseDamageMultiplier(owner?.skills,bonuses[tower.ownerId],target);
      hitRubble(target,dealt);if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(Math.max(0,target.hp),dealt);}target.hp-=dealt;
      applyHitEffects(state,tower,target,dealt,events,rewardTeam);
      applyClassTowerHitEffects(state,tower,target,events,rewardTeam,addSupplies);
      if(owner?.active!==false&&owner?.skills?.classId==='engineer'&&hasCapstone(owner.skills)&&tower.shotCount%4===0){const other=state.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=100);if(other){if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(22,Math.max(0,other.hp));}other.hp-=22;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#f8a466',id:(state._shotSeq=(state._shotSeq||0)+1),fx:'chain'});comboCue(owner,'War Machine',other.x,other.y);events.push({type:'skillCombo',name:'War Machine',x:other.x,y:other.y});}}

      if(tower.type===0&&perks.pinning&&target.kind!=='plane')target.pinned=Math.max(target.pinned||0,2+perks.pinning-1);
      if(tower.type===2&&perks.chain){const other=state.enemies.find(e=>e!==target&&e.hp>0&&onRoad(e)&&Math.hypot(e.x-target.x,e.y-target.y)<=85);if(other){const chain=dealt*.3*perks.chain*bossWeaponFactor(other);if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(Math.max(0,other.hp),chain);}other.hp-=chain;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#8cc0a6',id:(state._shotSeq=(state._shotSeq||0)+1),fx:'chain'});}}
      const engSpeed=specialistUnlocked(owner?.skills,'engineer',0)?.9:1;
      const flakSpeed=tower.type===2&&flakNet?.9:1;
      const shotFx=(tower.type===3&&((tower.level>=4&&tower.branch===0&&tower.shotCount%3===0)||(tower.shotCount%4===0&&(perks.critical||0)>0)))?'crit':(tower.type===1&&tower.level>=5&&tower.branch===0&&tower.shotCount%6===0)?'splash':null;
      tower.timer=type.interval*Math.max(.5,1-(bonuses[tower.ownerId]?.towerSpeed||0)/100)*(branch?branch.interval:1)*engSpeed*flakSpeed*Math.pow(.92,state.runPerks?.speed||0)*towerIntervalFactor(state,tower,p)*classTowerIntervalFactor(tower);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:tower.type,color:type.color,id:(state._shotSeq=(state._shotSeq||0)+1),...(shotFx?{fx:shotFx}:{})});}}}
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;p.shotTimer-=dt;if(state.wave>0&&p.shotTimer<=0&&!(p.downed>0)){const rangeBonus=(specialistUnlocked(p.skills,'assault',1)?25:0)+(specialistUnlocked(p.skills,'recon',0)?25:0);const target=state.enemies.find(e=>e.hp>0&&onRoad(e)&&Math.hypot(e.x-p.x,e.y-p.y)<targetingRange(theme,150+bonuses[id].heroRange+rangeBonus+equipmentForPlayer(state,p).range,e,state.enemies,{clouds:state.dustClouds||[]}));if(target){const dealt=(10+Math.min(p.level-1,20)+assaultRankDamage(state.wave)*(p.skills?.assault||0)+bonuses[id].damage+equipmentForPlayer(state,p).damage)*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.15*(state.runPerks?.hero||0))*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(p.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared,zoneInfo:zoneInfoOf(target)})*airDefenseDamageMultiplier(p.skills,bonuses[id],target);hitRubble(target,dealt);target.hp-=dealt;p.heroShotCount=(p.heroShotCount||0)+1;
      if(p.skills?.classId==='assault'&&hasCapstone(p.skills)&&p.heroShotCount%4===0){const other=state.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=120);if(other){other.hp-=24;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#f8a466',id:(state._shotSeq=(state._shotSeq||0)+1),fx:'chain'});comboCue(p,'War Hero',other.x,other.y);events.push({type:'skillCombo',name:'War Hero',x:other.x,y:other.y});}}
      if(p.skills?.classId==='recon'&&hasCapstone(p.skills)&&p.heroShotCount%4===0&&target.hp>0){target.pinned=Math.max(target.pinned||0,3);comboCue(p,'Ghost Operative',target.x,target.y);events.push({type:'skillCombo',name:'Ghost Operative',x:target.x,y:target.y});}
      if(p.skills?.classId==='airDefense'&&hasCapstone(p.skills)&&p.heroShotCount%5===0&&target.hp>0){target.marked=Math.max(target.marked||0,3);target.markedByAirDefense=true;comboCue(p,'Sky Sovereign',target.x,target.y);events.push({type:'skillCombo',name:'Sky Sovereign',x:target.x,y:target.y});}
      const quickTrigger=specialistUnlocked(p.skills,'assault',0)?.85:1;
      p.shotTimer=.65*Math.max(.5,1-bonuses[id].heroSpeed/100)*quickTrigger*equipmentForPlayer(state,p).shotIntervalMultiplier;state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff',id:(state._shotSeq=(state._shotSeq||0)+1)});}}
  }
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0){if(Number.isFinite(e.x)&&Number.isFinite(e.y)){const pops=state.combatPops||(state.combatPops=[]);pops.push({x:e.x,y:e.y,life:.65,boss:!!e.boss,kind:e.kind,id:(state._popSeq=(state._popSeq||0)+1)});if(pops.length>20)pops.shift();}rewardTeam(state,e.reward,true);state.lootKills=(state.lootKills||0)+1;if(state.lootKills%5===0){const cacheReward=rewardTeam(state,15);if(state.individualSupplies)for(const p of Object.values(state.players))if(p.active!==false)p.lootCaches=(p.lootCaches||0)+1;events.push({type:'lootDrop',supplies:cacheReward});}return false;}if(e.segment>=pathForEnemy(e).length){const damage=e.damage*(state.campaignContract?.damage||1)*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0)*(state.wave>=6?1-.02*(state.safeguard||0):1):1);state.hp-=damage;state.bunkerImpact={seq:(state.bunkerImpact?.seq||0)+1,kind:e.boss||e.kind,damage};events.push({type:'bunkerHit',kind:e.boss||e.kind,damage});return false;}return true;});
  if(state.running&&state.hp>0&&state.hp<state.maxHp*.35)for(const id of activePlayers(state)){const p=state.players[id];if(p.skills?.classId==='medic'&&hasCapstone(p.skills)&&p.guardWave!==state.wave){p.guardWave=state.wave;state.hp=Math.min(state.maxHp,state.hp+22);comboCue(p,'Bunker Guardian',bunker.x+10,bunker.y);events.push({type:'skillCombo',name:'Bunker Guardian',x:bunker.x+10,y:bunker.y});}}
  if(state.hp<=0){state.ended=true;state.running=false;events.push({type:'defeat'});}
  else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){
    state.running=false;state.completedWave=state.wave;state.hp=Math.min(state.maxHp,state.hp+3*(state.repair||0)+12*(state.runPerks?.repair||0));
    if(state.individualSupplies)for(const player of Object.values(state.players))if(player.active!==false){
      const block=Math.floor((state.wave-1)/WAVE_COUNT),bit=1<<((state.wave-1)%WAVE_COUNT);
      if(block===0)player.completedWaveMask|=bit;else{const blocks=player.completedWaveBlocks||(player.completedWaveBlocks={});blocks[block]=(blocks[block]||0)|bit;}
    }
    rewardTeam(state,20);for(const id of activePlayers(state)){const p=state.players[id];if(p.skills?.classId==='logistics'&&hasCapstone(p.skills)){addSupplies(state,id,12);comboCue(p,'War Economy');events.push({type:'skillCombo',name:'War Economy',x:p.x,y:p.y});}}if(state.wave>=6){for(const id of activePlayers(state))addSupplies(state,id,3*(state.supply||0)+equipmentForPlayer(state,state.players[id]).waveSupplies);}
    const perkEvery=state.campaignContract?.bossEvery||5;
    if(state.wave%perkEvery===0&&state.wave!==state.campaignContract?.waves)state.pendingPerk=state.wave;
    if(state.wave%10===0&&sector>0&&!state.individualSupplies&&!state.hostId&&!state.campaignContract){state.pendingSector=state.wave+1;events.push({type:'sectorClear',wave:state.wave,sector});}
    // Block E: after a survived wave every damaged tower gets a quarter of
    // its life back for free - a tower at zero rejoins the line this way.
    for(const tower of state.towers){const maxHp=tower.maxHp||towerMaxHp(tower.level),towerHp=tower.hp??maxHp;if(towerHp<maxHp){tower.maxHp=maxHp;tower.hp=Math.min(maxHp,towerHp+Math.ceil(maxHp*.25));}}
    events.push({type:'waveCleared',wave:state.wave,xp:waveXP(state.wave),victory:false});
  }
  return events;
}

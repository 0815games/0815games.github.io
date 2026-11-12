import {equipmentForPlayer} from './workshop-combat.mjs?v=20261112-tagless1';
import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261107-balance1';
import {advanceBuildReservations} from './build-reservations.mjs?v=20261104-buildreservation1';
import {comboTier,comboCue} from './skill-combos.mjs?v=20261102-results1';
import {webBonuses} from './skills.mjs?v=20261107-balance1';
import {bossPhase,bossWeaponFactor,crossedCycle} from './boss-mechanics.mjs?v=20261031-finale1';
import {terrainFor,soldierSpeedFactor,enemySpeedFactor,iceDamage,targetingRange,weaponDamageFactor} from './terrain.mjs?v=20261124-zones1';
import {getMap,isMapId,DEFAULT_MAP,sectorOf,zoneAt,mapPlayerCap} from './maps.mjs?v=20261031-finale1';
// Fixed-step simulation. Browser and a future server can execute the same rules.
// Not a networking protocol or an anti-cheat system by itself.
import { WAVE_COUNT,waveFormation,missionFormation,makeEnemy,towerDamage } from './combat.mjs?v=20261031-finale1';
import { waveXP } from './progression.mjs?v=20261105-prestige1';
import {addSupplies} from './match.mjs?v=20261112-tagless1';
import {towerIntervalFactor,towerRangeFactor,towerIgnoresClouds,towerDamageBonus,applyHitEffects} from './tower-specialization.mjs?v=20261112-kits1';
export const STEP = 1/30;
export const PATH=getMap(DEFAULT_MAP).path, PADS=getMap(DEFAULT_MAP).pads;
const towerStats=[{range:125,interval:.55,color:'#d9d884'},{range:145,interval:1.4,color:'#e49b67'},{range:155,interval:.8,color:'#8cc0a6'},{range:210,interval:1.8,color:'#a9a4d4'}];
const branchStats=[[{interval:.55,range:1},{interval:1,range:1},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.6,range:1},{interval:1,range:1},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.55,range:1},{interval:1,range:1.45},{interval:.85,range:1.15},{interval:1.25,range:1}],[{interval:.6,range:1},{interval:1,range:1.1},{interval:.85,range:1.15},{interval:1.25,range:1}]];
export function getTowerRange(tower){
  const stats=towerStats[tower.type],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;
  return stats.range*(branch?branch.range:1);
}
export function createMatch(players,mapId=DEFAULT_MAP){
  if(!isMapId(mapId))throw new Error('Invalid map');
  if(!Array.isArray(players)||players.length<1||players.length>mapPlayerCap(mapId)||new Set(players.map(p=>p.id)).size!==players.length)throw new Error('Invalid match roster');
  const individualSupplies=players.length>1;
  // The shared bunker uses the strongest purchased upgrade of each type;
  // equipment and Medic bonuses from each player stack.
  const fortify=Math.max(...players.map(p=>p.loadout?.fortify||0)),plating=Math.max(...players.map(p=>p.loadout?.plating||0));
  const repair=Math.max(...players.map(p=>p.loadout?.repair||0)),gun=Math.max(...players.map(p=>p.loadout?.gun||0));
  const supply=Math.max(...players.map(p=>p.loadout?.supply||0)),safeguard=Math.max(...players.map(p=>p.loadout?.safeguard||0));
  const maxHp=100+fortify*10+players.reduce((n,p)=>n+5*(p.skills?.medic||0)+(p.skills?.extra?.[6]?10:0)+legacyEquipmentEffects(p.loadout?.equipped).bunkerHealth+webBonuses(p.skills).health,0);
  return {mapId,wave:0,hp:maxHp,maxHp,plating,repair,gun,supply,safeguard,gunTimer:0,lootKills:0,suppression:0,...(individualSupplies?{individualSupplies:true}:{money:125+legacyEquipmentEffects(players[0].loadout?.equipped).startSupplies+webBonuses(players[0].skills).start}),enemies:[],towers:[],shots:[],running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:Object.fromEntries(players.map(p=>[p.id,individualSupplies?{...p,money:125+legacyEquipmentEffects(p.loadout?.equipped).startSupplies+webBonuses(p.skills).start,completedWaveMask:0,lootCaches:0}:p]))};
}
// Co-op rewards are personal: when both players are active, each gets 65% of
// the base reward (rounded down); the owner's Logistics bonus remains intact.
// An absent guest earns nothing; the remaining host receives the solo base rate.
// Two soldiers each earn 70% (140% for the pair against 1.5x enemy health), so
// a new pair keeps pace with the endless curve - the friendliest team size.
export const COOP_REWARD_RATE=.7;
export const COOP_ENEMY_HEALTH=1.5;
function activePlayers(state){return Object.keys(state.players).sort().filter(id=>state.players[id].active!==false);}
// Assault ranks pay +2 damage per rank; from wave 6 the rank grows by +1 every
// six waves (capped at +3) so the skill path stays relevant next to towers in
// long endless runs instead of fading behind the wave curve.
function assaultRankDamage(wave){return 2+(wave>=6?Math.min(3,1+Math.floor((wave-6)/6)):0);}
function rewardTeam(state,amount,enemyKill=false){
  // Larger squads split each reward, but the team total grows with the enemy
  // health bill: 65% each for two, 50% for three, 45% for four soldiers.
  const active=activePlayers(state),salvage=enemyKill?(state.runPerks?.salvage||0):0,base=state.individualSupplies&&active.length>1?Math.floor(amount*(active.length>2?(active.length>3?.45:.5):COOP_REWARD_RATE)):amount;
  if(state.individualSupplies){for(const id of active)addSupplies(state,id,base+salvage+(enemyKill?((state.players[id].skills?.logistics||0)+(state.players[id].skills?.extra?.[4]?1:0)+webBonuses(state.players[id].skills).supplies):0));}
  else state.money+=base+salvage+(enemyKill?((Object.values(state.players)[0]?.skills?.logistics||0)+(Object.values(state.players)[0]?.skills?.extra?.[4]?1:0)+webBonuses(Object.values(state.players)[0]?.skills).supplies):0);
  return base;
}
// Exactly one fixed step per call. Events are transient, not a record of validated rewards.
export function stepMatch(state){
  const events=[];if(state.ended)return events;advanceBuildReservations(state,STEP);const bonuses=Object.fromEntries(Object.entries(state.players).map(([id,p])=>[id,webBonuses(p.skills)]));const dt=STEP,map=getMap(state.mapId),{path:PATH,pads:PADS}=map,theme=terrainFor(map),paths=map.paths||[PATH],bunker=map.bunker||{x:900,y:400},sector=sectorOf(state.mapId);
  // Marked patches (g3): effects key off the enemy's position, not fixed path
  // indices - that is what lets one field mix several terrains.
  const zones=map.zones||null,zoneInfoOf=enemy=>{if(!zones)return null;const zone=zoneAt(map,enemy.x,enemy.y);return zone?{kind:zone.kind,broken:!!state.zoneBroken?.[zone.id],cleared:!!state.zoneCleared?.[zone.id]}:null;};
  // Purely visual trails persist long enough to reach 5 Hz co-op snapshots.
  const shotDuration=state.individualSupplies ? .55 : .24;
  state.shots=state.shots.filter(s=>(s.life-=dt)>0);if(state.combatPops)state.combatPops=state.combatPops.filter(p=>(p.life-=dt)>0);
  const jamField=state.enemies.some(e=>e.boss==='bossRiegel'&&e.hp>0&&bossPhase(e)==='jam');
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;const speed=(150+10*(p.skills?.recon||0)+bonuses[id].movement+(p.mobileSupply?.remaining>0?p.mobileSupply.bonus:0)+equipmentForPlayer(state,p).movement)*soldierSpeedFactor(theme,p,PATH);p.overdrive=Math.max(0,(p.overdrive||0)-dt);if(p.mobileSupply)p.mobileSupply.remaining=Math.max(0,p.mobileSupply.remaining-dt);if(p.healingField?.remaining>0&&state.running){const elapsed=Math.min(dt,p.healingField.remaining);p.healingField.remaining=Math.max(0,p.healingField.remaining-elapsed);state.hp=Math.min(state.maxHp,state.hp+p.healingField.rate*elapsed);}let {x:dx,y:dy}=p.direction;
    if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;}
    else if(p.target){dx=p.target.x-p.x;dy=p.target.y-p.y;const len=Math.hypot(dx,dy),step=Math.min(len,speed*dt);if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}if(len<=step)p.target=null;}
    p.x=Math.max(12,Math.min((map.width||960)-12,p.x));p.y=Math.max(12,Math.min((map.height||540)-12,p.y));
    // Riegel's jam field reaches into every radio on the field: while it is up,
    // the active ability stops recharging. Nothing else about the soldier
    // changes, and the field itself is telegraphed two seconds ahead.
    if(!jamField)p.cooldown=Math.max(0,p.cooldown-dt);
  }
  if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const spawnIndex=state.spawnIndex++,formation=missionFormation(state.wave,state.campaignContract),kind=formation[spawnIndex%formation.length],enemy=makeEnemy(kind,state.wave),count=activePlayers(state).length,road=spawnIndex%paths.length,path=paths[road];
      // A retreat buys a longer road, and the enemy pays for it: every sector
      // past the first toughens each unit, so a bigger field is never an easier
      // one. Bosses included - they already scale with their wave.
      if(sector>1){enemy.hp=enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*(1+.12*(sector-1))));enemy.speed*=1+.05*(sector-1)};if(state.individualSupplies&&count>1){enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*(count>2?2:COOP_ENEMY_HEALTH));}
      // A campaign contract is harder by construction: tougher units, and extra
      // units on surge waves. Endless solo and multiplayer are untouched.
      if(state.campaignContract){enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*state.campaignContract.unit);enemy.campaign=true;}
      // The training contract is the exception: a weakened first operation (see
      // training-run.mjs). `bossUnit` only ever arrives with the training
      // contract, so a story mission keeps its full-strength bosses.
      if(state.campaignContract?.bossUnit&&enemy.boss)enemy.hp=enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*state.campaignContract.bossUnit));
      state.enemies.push({...enemy,...(paths.length>1?{road}:{}),x:path[0].x,y:path[0].y,segment:1});
      // A boss arriving is worth its own event: the first-run coach and the
      // presentation both want to react to it, and inferring it from the enemy
      // list would mean guessing which frame it appeared on.
      if(enemy.boss)events.push({type:'bossSpawn',boss:enemy.boss,wave:state.wave});
      state.spawnLeft--;state.spawnTimer=.8;}}
  if(theme==='scrub'||zones){
    state.dustClouds=(state.dustClouds||[]).map(c=>({...c,life:c.life-dt})).filter(c=>c.life>0);
    state.dustTimer=(state.dustTimer||0)-dt;
    if(state.dustTimer<=0){
      const tanks=state.enemies.filter(e=>e.kind==='tank'&&e.hp>0&&e.speed>0&&e.segment<PATH.length&&(theme==='scrub'||zoneAt(map,e.x,e.y)?.kind==='dust'));
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
  // Timers live on enemies, so co-op snapshots and reconnects retain telegraphs.
  for(const e of state.enemies)if(e.boss&&e.hp>0){
    const before=e.bossClock||0,after=before+dt;e.bossClock=after;e.bossFlash=Math.max(0,(e.bossFlash||0)-dt);
    if(e.boss==='bossJuggernaut'&&crossedCycle(before,after,10)){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.02);e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'repair'});}
    if(e.boss==='bossKolt'&&crossedCycle(before,after,18)){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'flood'});}
    // A-7's armor phases are health thresholds, so the change itself is the
    // event: works shell down to torso, torso stripped to the open core. The
    // remembered phase travels with the snapshot; recomputing from hp stays
    // deterministic for reconnects.
    if(e.boss==='bossA7'){const phase=bossPhase(e);if(e.a7Phase&&e.a7Phase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'a7-'+phase});}e.a7Phase=phase;}
    if(e.boss==='bossZugsmeister'){const phase=bossPhase(e);if(e.zugsPhase&&e.zugsPhase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'zugs-'+phase});}e.zugsPhase=phase;
      // Rail guns fire on the boss clock - every 18 seconds behind the signal
      // wire, every 12 once the guns stand exposed. Uncoupled, they fall silent.
      const period=phase==='wire'?18:phase==='guns'?12:0;
      if(period&&crossedCycle(before,after,period)){
        const damage=10*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0)*(state.wave>=6?1-.02*(state.safeguard||0):1):1);
        state.hp-=damage;e.bossFlash=.8;state.bunkerImpact={seq:(state.bunkerImpact?.seq||0)+1,kind:'bossZugsmeister',damage};events.push({type:'bossAbility',boss:e.boss,ability:'railgun',damage});
      }
    }
    if(e.boss==='bossRook'){const phase=bossPhase(e);if(e.rookPhase&&e.rookPhase!==phase){e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'rook-'+phase});}e.rookPhase=phase;
      // While the honour guard stands, one veteran steps in front of him
      // every 16 seconds - a field unit like any spawn, so a wave cannot end
      // while the guard still runs. Past the vow, Rook fights alone.
      if(phase==='guard'&&crossedCycle(before,after,16)){
        const guard={...makeEnemy('tank',state.wave),campaign:true};guard.hp=guard.maxHp=Math.max(1,Math.round(guard.maxHp*.6));
        state.enemies.push({...guard,...(e.road!==undefined?{road:e.road}:{}),x:e.x,y:e.y,segment:e.segment});
        e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'guard',count:1});
      }
    }
    if(e.boss==='bossRiegel'&&crossedCycle(before,after,18)){
      // The field collapses and the damage window opens - covered by a swarm of
      // fast interceptors dropped right on top of the boss. They count as field
      // units like any spawn, so a wave cannot end while they still run.
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
  // Kolt's flood pulse is read straight off the authoritative boss clock, so
  // co-op snapshots and reconnects show the same surge without extra state.
  const kolt=state.enemies.find(e=>e.boss==='bossKolt'&&e.hp>0),flood=kolt&&bossPhase(kolt)==='flood';
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
  for(const e of state.enemies){const PATH=paths[e.road]||paths[0],zi=zoneInfoOf(e);if(e.siegeMarks)e.siegeMarks=e.siegeMarks.map(m=>({...m,time:m.time-dt})).filter(m=>m.time>0);e.pinned=Math.max(0,(e.pinned||0)-dt);e.marked=Math.max(0,(e.marked||0)-dt);if(e.boss==='bossJuggernaut'&&e.hp>0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.002*dt);e.hp-=iceDamage(theme,e,dt,state.iceBroken,zi);let distance=e.speed*dt*(theme==='arctic'&&state.iceBroken&&e.kind==='tank'&&e.segment===5?.75:1)*(e.pinned>0?.8:1)*enemySpeedFactor(theme,e,zi)*(state.suppression>0?.5:1)*(e.kind!=='plane'&&!e.boss&&commander&&Math.hypot(e.x-commander.x,e.y-commander.y)<(rally?180:100)?(rally?1.4:1.25):1)*(flood&&!e.boss?1.45:1)*(e.boss==='bossA7'?(bossPhase(e)==='kern'?1.35:bossPhase(e)==='torso'?1.12:1):1)*(e.boss==='bossZugsmeister'?(bossPhase(e)==='loco'?1.35:bossPhase(e)==='guns'?1.12:1):1)*(e.boss==='bossRook'?(bossPhase(e)==='vow'?1.15:bossPhase(e)==='order'?.85:1):1);while(distance>0&&e.segment<PATH.length){const target=PATH[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
  if(state.gun>0&&state.running){
    state.gunTimer=Math.max(0,(state.gunTimer||0)-dt);
    if(state.gunTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-bunker.x,e.y-bunker.y)<=170);if(target){target.hp-=5*state.gun;state.gunTimer=3;state.shots.push({x:bunker.x,y:bunker.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  for(const tower of state.towers){tower.timer-=dt;const type=towerStats[tower.type],p=PADS[tower.pad],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<=targetingRange(theme,getTowerRange(tower)*towerRangeFactor(tower,e),e,state.enemies,{sniper:tower.type===3,clouds:towerIgnoresClouds(tower)?[]:(state.dustClouds||[])})).sort((a,b)=>b.segment-a.segment)[0];if(target){const owner=state.players[tower.ownerId];const perks=state.runPerks||{};tower.shotCount=(tower.shotCount||0)+1;
      const dealt=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind)*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.1*(perks.damage||0))*(target.kind==='tank'&&(tower.type===1||tower.type===3)?1+.2*(perks.tankhunter||0):1)*(tower.type===3&&tower.shotCount%4===0?1+.75*(perks.critical||0):1)*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(owner?.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared,zoneInfo:zoneInfoOf(target)})*(1+.1*(owner?.skills?.engineer||0)+.01*(bonuses[tower.ownerId]?.tower||0)+(state.suppression>0&&owner?.active!==false?.08*comboTier(owner?.skills,52):0))*(target.kind==='tank'?equipmentForPlayer(state,owner).tankTowerMultiplier:1)*(tower.branch===3&&target.boss?1.5:1)*(owner?.active!==false&&owner?.overdrive>0?(owner.overdriveFactor||1.5):1)*towerDamageBonus(state,tower,target);
      hitRubble(target,dealt);if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(Math.max(0,target.hp),dealt);}target.hp-=dealt;
      if(owner?.active!==false&&comboTier(owner?.skills,25)&&target.hp>0){const marks=target.siegeMarks||(target.siegeMarks=[]),mark=marks.find(m=>m.id===tower.ownerId);if(mark)mark.time=5;else marks.push({id:tower.ownerId,time:5});}
      applyHitEffects(state,tower,target,dealt,events,rewardTeam);
      if(owner?.active!==false&&owner?.skills?.web?.[9]&&tower.shotCount%4===0){const other=state.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=100);if(other){if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(20,Math.max(0,other.hp));}other.hp-=20;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#f8a466'});comboCue(owner,'War Machine',other.x,other.y);events.push({type:'skillCombo',name:'War Machine',x:other.x,y:other.y});}}

      if(tower.type===0&&perks.pinning&&target.kind!=='plane')target.pinned=Math.max(target.pinned||0,2+perks.pinning-1);
      if(tower.type===2&&perks.chain){const other=state.enemies.find(e=>e!==target&&e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-target.x,e.y-target.y)<=85);if(other){const chain=dealt*.3*perks.chain*bossWeaponFactor(other);if(owner){const stats=owner.towerDamage||(owner.towerDamage=[0,0,0,0]);stats[tower.type]+=Math.min(Math.max(0,other.hp),chain);}other.hp-=chain;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#8cc0a6'});}}tower.timer=type.interval*Math.max(.5,1-(bonuses[tower.ownerId]?.towerSpeed||0)/100)*(branch?branch.interval:1)*(owner?.skills?.extra?.[2] ? .9 : 1)*Math.pow(.92,state.runPerks?.speed||0)*towerIntervalFactor(state,tower,p);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:tower.type,color:type.color});}}}
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;p.shotTimer-=dt;if(state.wave>0&&p.shotTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<targetingRange(theme,150+bonuses[id].heroRange+(p.skills?.extra?.[1]?25:0)+(p.skills?.extra?.[8]?25:0)+equipmentForPlayer(state,p).range,e,state.enemies,{clouds:state.dustClouds||[]}));if(target){const dealt=(10+Math.min(p.level-1,20)+assaultRankDamage(state.wave)*(p.skills?.assault||0)+bonuses[id].damage+equipmentForPlayer(state,p).damage)*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.15*(state.runPerks?.hero||0))*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(p.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared,zoneInfo:zoneInfoOf(target)});hitRubble(target,dealt);target.hp-=dealt;p.heroShotCount=(p.heroShotCount||0)+1;
      if(p.skills?.web?.[4]&&p.heroShotCount%5===0){const other=state.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=120);if(other){other.hp-=20;state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#f8a466'});comboCue(p,'War Hero',other.x,other.y);events.push({type:'skillCombo',name:'War Hero',x:other.x,y:other.y});}}
      if(p.skills?.web?.[24]&&p.heroShotCount%4===0&&target.hp>0){target.pinned=Math.max(target.pinned||0,3);comboCue(p,'Ghost Operative',target.x,target.y);events.push({type:'skillCombo',name:'Ghost Operative',x:target.x,y:target.y});}
      p.shotTimer=.65*Math.max(.5,1-bonuses[id].heroSpeed/100)*(p.skills?.extra?.[0] ? .85 : 1)*equipmentForPlayer(state,p).shotIntervalMultiplier;state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0){if(Number.isFinite(e.x)&&Number.isFinite(e.y)){const pops=state.combatPops||(state.combatPops=[]);pops.push({x:e.x,y:e.y,life:.65,boss:!!e.boss});if(pops.length>20)pops.shift();}rewardTeam(state,e.reward,true);state.lootKills=(state.lootKills||0)+1;if(state.lootKills%5===0){const cacheReward=rewardTeam(state,15);if(state.individualSupplies)for(const p of Object.values(state.players))if(p.active!==false)p.lootCaches=(p.lootCaches||0)+1;events.push({type:'lootDrop',supplies:cacheReward});}return false;}if(e.segment>=PATH.length){const damage=e.damage*(state.campaignContract?.damage||1)*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0)*(state.wave>=6?1-.02*(state.safeguard||0):1):1);state.hp-=damage;state.bunkerImpact={seq:(state.bunkerImpact?.seq||0)+1,kind:e.boss||e.kind,damage};events.push({type:'bunkerHit',kind:e.boss||e.kind,damage});return false;}return true;});
  if(state.running&&state.hp>0&&state.hp<state.maxHp*.3)for(const id of activePlayers(state)){const p=state.players[id];if(p.skills?.web?.[19]&&p.guardWave!==state.wave){p.guardWave=state.wave;state.hp=Math.min(state.maxHp,state.hp+20);comboCue(p,'Bunker Guardian',bunker.x+10,bunker.y);events.push({type:'skillCombo',name:'Bunker Guardian',x:bunker.x+10,y:bunker.y});}}
  if(state.hp<=0){state.ended=true;state.running=false;events.push({type:'defeat'});}
  else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){
    state.running=false;state.completedWave=state.wave;state.hp=Math.min(state.maxHp,state.hp+3*(state.repair||0)+12*(state.runPerks?.repair||0));
    if(state.individualSupplies)for(const player of Object.values(state.players))if(player.active!==false){
      const block=Math.floor((state.wave-1)/WAVE_COUNT),bit=1<<((state.wave-1)%WAVE_COUNT);
      if(block===0)player.completedWaveMask|=bit;else{const blocks=player.completedWaveBlocks||(player.completedWaveBlocks={});blocks[block]=(blocks[block]||0)|bit;}
    }
    rewardTeam(state,20);for(const id of activePlayers(state)){const p=state.players[id];if(p.skills?.web?.[14]){addSupplies(state,id,10);comboCue(p,'War Economy');events.push({type:'skillCombo',name:'War Economy',x:p.x,y:p.y});}}if(state.wave>=6){for(const id of activePlayers(state))addSupplies(state,id,3*(state.supply||0)+equipmentForPlayer(state,state.players[id]).waveSupplies);}// A field upgrade is offered on every fifth cleared wave. It used to be a bare
      // `wave % 5`, which meant wave 5 of the six-wave training contract asked a new
      // soldier to pick an upgrade - and `startWave` refuses to deploy while one is
      // pending, so the run stopped dead one wave before the boss. The contract
      // carries its own rhythm now (training-run.mjs), so nothing is offered between
      // its last two waves.
      const perkEvery=state.campaignContract?.bossEvery||5;
      if(state.wave%perkEvery===0&&state.wave!==state.campaignContract?.waves)state.pendingPerk=state.wave;
      // Every tenth cleared wave a solo endless run falls back to the next
      // sector. Missions, training and every multiplayer mode hold their map
      // for the whole match: only a g3 solo field retreats.
      if(state.wave%10===0&&sector>0&&!state.individualSupplies&&!state.hostId&&!state.campaignContract){state.pendingSector=state.wave+1;events.push({type:'sectorClear',wave:state.wave,sector});}
    events.push({type:'waveCleared',wave:state.wave,xp:waveXP(state.wave),victory:false});
  }
  return events;
}

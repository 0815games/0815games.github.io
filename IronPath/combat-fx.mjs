import {getMap} from './maps.mjs?v=20261121-order1';
// Client-only effects. They never affect commands, damage, rewards or match state.
export function createCombatEffects({clock=()=>performance.now(),reducedMotion=false}={}){
  let effects=[],cooldowns=null,comboSeqs=null,previous=null;
  function resolveTargets(kind,player,match){
    if(kind==='assault'||kind==='airDefense'||kind==='recon'){
      return (match?.enemies||[]).filter(e=>e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y)).slice(0,10).map(e=>({x:e.x,y:e.y,air:e.kind==='plane'||e.baseKind==='plane'}));
    }
    if(kind==='engineer'&&match?.mapId&&Array.isArray(match?.towers)){
      try{
        const pads=getMap(match.mapId)?.pads||[];
        return match.towers.filter(t=>!player?.id||t.ownerId===player.id).map(t=>pads[t.pad]).filter(pt=>pt&&Number.isFinite(pt.x)&&Number.isFinite(pt.y)).slice(0,10).map(pt=>({x:pt.x,y:pt.y,air:false}));
      }catch{}
    }
    return [];
  }
  function emit(kind,player,match){
    if(reducedMotion||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y))return;
    const now=clock(),targets=resolveTargets(kind,player,match);
    const variant=Number.isInteger(player.skills?.variant)?player.skills.variant:0;
    const x=kind==='medic'&&variant!==1?910:player.x,y=kind==='medic'&&variant!==1?400:player.y;
    effects.push({kind,variant,x,y,hx:player.x,hy:player.y,targets,label:player.comboLabel||"",started:now,duration:950});
    if(effects.length>12)effects=effects.slice(-12);
  }
  return {
    emit,
    // Cooldown transitions are already in each authoritative view. Treat the
    // first view as a baseline so joins/rejoins never replay an old ability.
    observe(match,pads){
      if(!match?.players)return [];
      const changes=[];
      const next=new Map(),nextCombos=new Map();
      if(previous&&(match.bunkerImpact?.seq||0)>(previous.bunkerImpact?.seq||0)){const hit=match.bunkerImpact;
        // The bunker sits wherever the generated map put it, not at the old
        // fixed 900/400 of the first three maps.
        let at={x:900,y:400};try{at=getMap(match.mapId).bunker||at;}catch{}
        emit('bunkerHit',{x:at.x,y:at.y,comboLabel:`−${Math.round(hit.damage*10)/10}`},match);changes.push('impact');}
      for(const [id,p] of Object.entries(match.players)){
        const value=Number.isFinite(p.cooldown)?p.cooldown:0;next.set(id,value);const seq=p.comboCue?.seq||0;nextCombos.set(id,seq);if(comboSeqs?.has(id)&&seq>comboSeqs.get(id)&&p.active!==false){emit('combo',{x:p.comboCue.x,y:p.comboCue.y,comboLabel:p.comboCue.name},match);changes.push('combo');}
        if(cooldowns?.has(id)&&p.active!==false&&value>cooldowns.get(id)+1){emit(p.skills?.active||'assault',{...p,id},previous||match);changes.push('ability');}
      }
      if(Array.isArray(previous?.towers)&&Array.isArray(match.towers)&&Array.isArray(pads)){
        for(const tower of match.towers){const old=previous.towers.find(t=>t.id===tower.id&&t.pad===tower.pad),point=pads[tower.pad];
          if(!point||!Number.isSafeInteger(tower.id))continue;
          const kind=!old?'build':(tower.classTier||0)>(old.classTier||0)?'classUpgrade':tower.level>old.level?'upgrade':null;if(kind){emit(kind,point,match);changes.push(kind);}
        }
      }
      cooldowns=next;comboSeqs=nextCombos;previous=match;return changes;
    },
    active(){const now=clock();effects=effects.filter(e=>now-e.started<e.duration);return effects.map(e=>({...e,progress:Math.max(0,Math.min(1,(now-e.started)/e.duration))}));},
    clear(){effects=[];cooldowns=null;comboSeqs=null;previous=null;}
  };
}

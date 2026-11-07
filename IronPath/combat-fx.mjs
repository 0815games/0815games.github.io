import {getMap} from './maps.mjs?v=20261128-randomends1';
// Client-only effects. They never affect commands, damage, rewards or match state.
export function createCombatEffects({clock=()=>performance.now(),reducedMotion=false}={}){
  let effects=[],cooldowns=null,comboSeqs=null,previous=null;
  function emit(kind,player,match){
    if(reducedMotion||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y))return;
    const now=clock(),targets=kind==='assault'?(match?.enemies||[]).filter(e=>e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y)).slice(0,8).map(e=>({x:e.x,y:e.y})):[];
    const x=kind==='medic'?910:player.x,y=kind==='medic'?400:player.y;
    effects.push({kind,x,y,targets,label:player.comboLabel||"",started:now,duration:950});if(effects.length>12)effects=effects.slice(-12);
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
        if(cooldowns?.has(id)&&p.active!==false&&value>cooldowns.get(id)+1){emit(p.skills?.active||'assault',p,previous||match);changes.push('ability');}
      }
      if(Array.isArray(previous?.towers)&&Array.isArray(match.towers)&&Array.isArray(pads)){
        for(const tower of match.towers){const old=previous.towers.find(t=>t.id===tower.id&&t.pad===tower.pad),point=pads[tower.pad];
          if(!point||!Number.isSafeInteger(tower.id))continue;
          const kind=!old?'build':tower.level>old.level?'upgrade':null;if(kind){emit(kind,point,match);changes.push(kind);}
        }
      }
      cooldowns=next;comboSeqs=nextCombos;previous=match;return changes;
    },
    active(){const now=clock();effects=effects.filter(e=>now-e.started<e.duration);return effects.map(e=>({...e,progress:Math.max(0,Math.min(1,(now-e.started)/e.duration))}));},
    clear(){effects=[];cooldowns=null;comboSeqs=null;previous=null;}
  };
}

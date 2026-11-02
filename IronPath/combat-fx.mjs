// Client-only effects. They never affect commands, damage, rewards or match state.
export function createCombatEffects({clock=()=>performance.now(),reducedMotion=false}={}){
  let effects=[],cooldowns=null,previous=null;
  function emit(kind,player,match){
    if(reducedMotion||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y))return;
    const now=clock(),targets=kind==='assault'?(match?.enemies||[]).filter(e=>e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y)).slice(0,8).map(e=>({x:e.x,y:e.y})):[];
    const x=kind==='medic'?910:player.x,y=kind==='medic'?400:player.y;
    effects.push({kind,x,y,targets,started:now,duration:950});if(effects.length>12)effects=effects.slice(-12);
  }
  return {
    emit,
    // Cooldown transitions are already in each authoritative view. Treat the
    // first view as a baseline so joins/rejoins never replay an old ability.
    observe(match){
      if(!match?.players)return;
      const next=new Map();
      for(const [id,p] of Object.entries(match.players)){
        const value=Number.isFinite(p.cooldown)?p.cooldown:0;next.set(id,value);
        if(cooldowns?.has(id)&&p.active!==false&&value>cooldowns.get(id)+1)emit(p.skills?.active||'assault',p,previous||match);
      }
      cooldowns=next;previous=match;
    },
    active(){const now=clock();effects=effects.filter(e=>now-e.started<e.duration);return effects.map(e=>({...e,progress:Math.max(0,Math.min(1,(now-e.started)/e.duration))}));},
    clear(){effects=[];cooldowns=null;previous=null;}
  };
}

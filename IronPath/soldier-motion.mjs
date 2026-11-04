// Render-only animation driven by observed positions, not input intent. This
// avoids walking in place while paused, disconnected or pressed against a wall.
export function createSoldierMotion(){
  const tracks=new Map();
  function sample(players,now,{reducedMotion=false,paused=false}={}){
    const time=Number.isFinite(now)?now:0,poses={};
    for(const [id,p] of Object.entries(players||{})){
      if(!Number.isFinite(p?.x)||!Number.isFinite(p?.y)||p.active===false){tracks.delete(id);continue;}
      const previous=tracks.get(id),dt=previous?(time-previous.time):0,dx=previous?p.x-previous.x:0,dy=previous?p.y-previous.y:0,distance=Math.hypot(dx,dy);
      // Treat large discontinuities or long frame gaps as a fresh observation,
      // not a burst of walking animation after a reconnect/teleport.
      const validFrame=!!previous&&!paused&&dt>0&&dt<=.4&&distance<=Math.max(12,dt*600);
      const advanced=validFrame&&distance>.04;
      let phase=previous?.phase||0,facing=previous?.facing||1,lastMoved=validFrame?(previous.lastMoved??-Infinity):-Infinity;
      if(advanced){phase=(phase+distance*.24)%(2*Math.PI);lastMoved=time;if(Math.abs(dx)>.04)facing=dx<0?-1:1;}
      const moving=validFrame&&time-lastMoved<.12;
      tracks.set(id,{x:p.x,y:p.y,time,phase,facing,lastMoved});
      const swing=moving&&!reducedMotion?Math.sin(phase):0;
      poses[id]={moving:moving&&!reducedMotion,facing,bob:moving&&!reducedMotion?-Math.abs(swing)*1.8:0,lean:moving&&!reducedMotion?swing*.075:0,step:swing};
    }
    for(const id of tracks.keys())if(!Object.hasOwn(players||{},id))tracks.delete(id);
    return poses;
  }
  return {sample,reset:()=>tracks.clear()};
}

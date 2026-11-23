// Render-only animation driven by observed positions, not input intent. This
// avoids walking in place while paused, disconnected or pressed against a wall.
// Standing soldiers stay alive in small ways that never touch state: they
// breathe, they face the nearest threat instead of staring at the last step
// they took, and their stance kicks for a frame when their own rifle fires
// or a hit lands (the kick is keyed to shot ids and observed life, both of
// which the painter already sees). Everything folds into the same pose the
// painter has always consumed - facing, bob, lean, step.
export function createSoldierMotion(){
  const tracks=new Map();
  const phaseOf=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return (h%628)/100;};
  function sample(players,now,{reducedMotion=false,paused=false,threats=null,shots=null}={}){
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
      // Stance events: the newest hero shot from this soldier's position is
      // his rifle firing; a life drop since the last frame is a hit landing.
      // Both only arm on first sight, so joining mid-fight kicks nobody.
      let lastShotId=previous?previous.lastShotId:null,recoilAt=previous?previous.recoilAt:-Infinity,flinchAt=previous?previous.flinchAt:-Infinity,lastHp=previous?previous.lastHp:null;
      if(shots)for(const s of shots){
        if(!s||s.kind!=='hero'||s.x!==p.x||s.y!==p.y||!Number.isFinite(s.id))continue;
        if(lastShotId==null)lastShotId=s.id;
        else if(s.id>lastShotId){lastShotId=s.id;recoilAt=time;}
      }
      if(Number.isFinite(p.hp)){
        if(lastHp!=null&&p.hp<lastHp)flinchAt=time;
        lastHp=p.hp;
      }
      // A standing soldier turns toward the nearest living threat once he
      // has actually settled - never mid-stride, never while walking orders
      // are still arriving.
      if(!moving&&!paused&&threats&&time-lastMoved>.35){
        let best=null,bestDistance=190;
        for(const e of threats){
          if(!e||!(e.hp>0)||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
          const d=Math.hypot(e.x-p.x,e.y-p.y);
          if(d<bestDistance){best=e;bestDistance=d;}
        }
        if(best&&Math.abs(best.x-p.x)>8)facing=best.x<p.x?-1:1;
      }
      tracks.set(id,{x:p.x,y:p.y,time,phase,facing,lastMoved,lastShotId,recoilAt,flinchAt,lastHp});
      const swing=moving&&!reducedMotion?Math.sin(phase):0;
      const recoil=reducedMotion||paused?0:Math.max(0,1-(time-recoilAt)/.18);
      const flinch=reducedMotion||paused?0:Math.max(0,1-(time-flinchAt)/.22);
      // Breathing is the smallest possible motion: a slow half-pixel sway
      // that keeps a waiting soldier from reading as a cardboard cutout.
      const breath=!moving&&!reducedMotion&&!paused?Math.sin(time*1.7+phaseOf(id))*.55:0;
      poses[id]={moving:moving&&!reducedMotion,facing,bob:(moving&&!reducedMotion?-Math.abs(swing)*1.8:breath)+flinch*1.5,lean:(moving&&!reducedMotion?swing*.075:0)-facing*.15*recoil-facing*.1*flinch,step:swing};
    }
    for(const id of tracks.keys())if(!Object.hasOwn(players||{},id))tracks.delete(id);
    return poses;
  }
  return {sample,reset:()=>tracks.clear()};
}

// Render-only turret aim: which way a tower's head points, and how hard it
// just kicked. Nothing here is simulation: the angle is read off the same
// state the painter already gets (towers, pads, enemies, shots), so host and
// guests draw the same picture from the same snapshot and no byte of this
// ever travels. The target rule mirrors the simulation's own choice - the
// most advanced living enemy inside the tower's range - so the head tracks
// the enemy the tower is actually about to engage, and between engagements
// it settles on the newest shot's line or simply holds its last heading.
//
// The swing is rate-limited like a real traverse: a turret that teleports
// between targets reads as a glitch, a turret that sweeps reads as a
// machine. Recoil is keyed to the shot sequence ids the simulation already
// stamps on every shot, so a kick lands on the frame the shot leaves.
export function createTowerAim({turnRate=3.4,recoilSeconds=.13}={}={}){
  const tracks=new Map();
  const wrap=angle=>{while(angle>Math.PI)angle-=Math.PI*2;while(angle<-Math.PI)angle+=Math.PI*2;return angle;};
  function sample(field,now,{reducedMotion=false,paused=false}={}={}){
    const {towers=[],pads=[],enemies=[],shots=[],getRange=null}=field||{};
    const time=Number.isFinite(now)?now:0,aims={},alive=new Set();
    for(const tower of towers||[]){
      if(!tower||!Number.isFinite(tower.pad))continue;
      const p=(pads||[])[tower.pad];
      if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      alive.add(tower.pad);
      const previous=tracks.get(tower.pad),dt=previous?time-previous.time:0;
      // Long gaps (tab hidden, reconnect) restart the observation like the
      // soldier motion does: no swing across a second of missing frames.
      const validFrame=!!previous&&!paused&&dt>0&&dt<=.4;
      // A tower that is down or under repair does not hunt: it holds its
      // last heading while the crew works, like the simulation holds fire.
      let desired=null;
      if((tower.hp??1)>0&&!(tower.repairing>0)){
        const range=getRange?Number(getRange(tower)):0;
        let best=null,bestSegment=-Infinity,bestDistance=Infinity;
        for(const e of enemies||[]){
          if(!e||!(e.hp>0)||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
          const distance=Math.hypot(e.x-p.x,e.y-p.y);
          if(Number.isFinite(range)&&range>0&&distance>range)continue;
          const segment=Number.isFinite(e.segment)?e.segment:0;
          if(segment>bestSegment||(segment===bestSegment&&distance<bestDistance)){best=e;bestSegment=segment;bestDistance=distance;}
        }
        if(best)desired=Math.atan2(best.y-p.y,best.x-p.x);
      }
      let angle=previous?previous.angle:(desired??-Math.PI/2);
      if(desired!=null){
        if(!previous||reducedMotion)angle=desired;
        else if(validFrame){
          const diff=wrap(desired-angle),step=turnRate*dt;
          angle=wrap(angle+(Math.abs(diff)<=step?diff:Math.sign(diff)*step));
        }
      }
      // Recoil: a shot whose sequence id is newer than the last one seen
      // from this pad left the barrel since the previous frame. The first
      // shot ever observed only arms the tracker - joining mid-fight must
      // not kick every turret at once.
      let lastShotId=previous?previous.lastShotId:null,recoilAt=previous?previous.recoilAt:-Infinity;
      for(const s of shots||[]){
        if(!s||s.kind!==tower.type||s.x!==p.x||s.y!==p.y||!Number.isFinite(s.id))continue;
        if(lastShotId==null)lastShotId=s.id;
        else if(s.id>lastShotId){lastShotId=s.id;recoilAt=time;}
      }
      const recoil=reducedMotion||!Number.isFinite(recoilAt)?0:Math.max(0,1-(time-recoilAt)/recoilSeconds);
      tracks.set(tower.pad,{angle,lastShotId,recoilAt,time});
      aims[tower.pad]={angle,recoil};
    }
    for(const pad of tracks.keys())if(!alive.has(pad))tracks.delete(pad);
    return aims;
  }
  return {sample,reset:()=>tracks.clear()};
}

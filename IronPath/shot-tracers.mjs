// How a shot LOOKS. Never what it does.
//
// This module knows nothing about the canvas and nothing about damage: it turns
// one entry of `state.shots` into the numbers a painter needs - where the streak
// is right now, how heavy it is, whether the barrel is still flashing and
// whether the shell has landed. Everything here is a rule, so it can be checked
// without a browser.
//
// The old picture drew the WHOLE line from tower to target for the whole life of
// the shot. Twenty towers firing meant twenty lines lying across the field for a
// quarter second each: enemies, roads and warnings disappeared behind a web of
// noodles. What replaces it is a short streak that RUNS along the line - you see
// where it came from, where it is going, and it is gone again.
//
// Each weapon keeps its own handwriting, in shape and in timing:
//   MG     - a quick light dash, often; the smallest thing that still reads.
//   Cannon - a slow fat shell: heavy streak, long muzzle flash, big impact.
//   Flak   - a burst in the air: medium streak, and the impact opens twice.
//   Sniper - a long thin crack that crosses the field almost at once, then a
//            slow bright ring where it landed.
//   Hero   - the soldier's own rifle: a short bright dash.

// The weapon index is the tower type; 'hero' is the soldier's rifle. A shot the
// module does not recognise is drawn as an MG - the lightest hand, never the
// heaviest, so an unknown shot can never smear over the field.
export function shotStyle(kind){
  if(kind===1) return 'cannon';
  if(kind===3) return 'sniper';
  if(kind===2) return 'flak';
  if(kind==='hero') return 'hero';
  return 'mg';
}

export const SHOT_STYLES={
  // travel: how much of the shot's life the streak needs to cross the gap.
  // tail:   how much of the line is lit at once, in world units.
  // ink/core: the outline and the bright centre, in world units at scale 1.
  // flashEnd: the muzzle flash is over this far into the life.
  // flash/impact/impactGrow: radii, in world units at scale 1.
  mg:     {travel:.42,tail:44, ink:3.4,core:1.7,flashEnd:.30,flash:9, impact:7, impactGrow:7, tip:1.5},
  cannon: {travel:.72,tail:26, ink:5.6,core:3.2,flashEnd:.46,flash:15,impact:11,impactGrow:12,tip:2.4},
  flak:   {travel:.52,tail:32, ink:4.2,core:2.1,flashEnd:.34,flash:10,impact:9, impactGrow:15,tip:1.8},
  sniper: {travel:.18,tail:130,ink:2.8,core:1.3,flashEnd:.12,flash:7, impact:6, impactGrow:5, tip:1.4},
  hero:   {travel:.34,tail:36, ink:3.4,core:1.8,flashEnd:.28,flash:8, impact:7, impactGrow:7, tip:1.6},
};

// How many shots a frame may draw. The simulation keeps firing, the field keeps
// its temper: past this the OLDEST shots are left out, because the newest ones
// carry the news. The rest still exist and still hit - they are simply not
// painted. Nothing here changes how much data travels; that is the network's
// business, not the painter's.
export const SHOT_LIMIT=24;

const num=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

// A shot drawn in world units shrinks with the zoom and vanishes on a phone. A
// shot scaled to the screen grows over the field when zoomed out and hides the
// very things it must not hide. So the correction is clamped: enough to stay
// visible, never enough to take over.
export function shotZoomFix(renderScale=1){
  return 1/clamp(num(renderScale,1)||1,.6,1.6);
}

export function shotTrace(shot,age=0,options={}){
  if(!shot) return null;
  const {renderScale=1,reducedMotion=false}=options||{};
  const life=num(shot.life,.12)-num(age,0);
  if(!(life>0)) return null;
  const duration=num(shot.duration,0)>0?shot.duration:.12;
  const progress=1-clamp(life/duration,0,1);
  // A shot with an unreadable end is not a shot: sending it to the painter
  // would draw a streak to nowhere - or, worse, to 0,0. Better no shot than a
  // lie about where the fighting is.
  const ends=[shot.x,shot.y,shot.tx,shot.ty];
  if(!ends.every(Number.isFinite)) return null;
  const x=shot.x,y=shot.y,tx=shot.tx,ty=shot.ty;
  const dx=tx-x,dy=ty-y,reach=Math.hypot(dx,dy);
  if(!Number.isFinite(reach)) return null;
  const style=SHOT_STYLES[shotStyle(shot.kind)];
  const zoom=shotZoomFix(renderScale);
  const width=value=>clamp(value*zoom,.8,9);
  // The streak never overshoots its target, and it never lights more line than
  // the shot actually has.
  const headAt=Math.min(1,progress/style.travel)*reach;
  const tailAt=Math.max(0,headAt-Math.min(style.tail,reach));
  const ux=reach>0?dx/reach:0,uy=reach>0?dy/reach:0;
  // Zero once the streak is still travelling; one when the life runs out.
  const landed=clamp((progress-style.travel)/(1-style.travel||1),0,1);
  const base={
    kind:shot.kind,style:shotStyle(shot.kind),colour:shot.color||'#ffec9e',
    x,y,tx,ty,ux,uy,reach,progress,landed,
    head:{x:x+ux*headAt,y:y+uy*headAt},
    tail:{x:x+ux*tailAt,y:y+uy*tailAt},
    headAt,tailAt,
    ink:width(style.ink),core:width(style.core),tip:width(style.tip),
    alpha:1-landed*landed,
  };
  if(reducedMotion) return {...base,flash:null,impact:null};
  // Two beats, both dimmer than the palette would like: a field full of muzzle
  // flashes is a glare, not a battle, and the eye has to keep the enemies.
  const flashProgress=progress/style.flashEnd;
  const flash=progress<style.flashEnd?{r:(3+style.flash*(1-flashProgress))*zoom,alpha:.9*(1-flashProgress)}:null;
  const impact=progress>=style.travel?{r:(style.impact+style.impactGrow*landed)*zoom,alpha:.85*(1-landed)}:null;
  return {...base,flash,impact};
}

// The newest shots are the ones worth painting: they are what just happened.
export function shotsToDraw(shots,limit=SHOT_LIMIT){
  if(!Array.isArray(shots)) return [];
  if(shots.length<=limit) return shots;
  return shots.slice(shots.length-limit);
}

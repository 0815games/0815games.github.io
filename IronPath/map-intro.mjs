// The map, announced once.
//
// The name of the battlefield used to sit bottom-left for the whole run, next to
// nothing else, saying the same thing over and over. The operator's wish: the
// map gets a TITLE - the field drawn in the game's own art, the name set wide
// and centred, when the map is loaded - and then it goes away. After that the
// player knows where they are; they do not need to be told.
//
// The rules that matter:
//
//   * it takes NO TAPS. It is a title card over a field the player may already
//     be building on, and a card that swallows a tap is a wall. `pointer-events`
//     is the stylesheet's business, but nothing here may fight it;
//   * it leaves on its own. There is no button to dismiss it - the same lesson
//     the warning card taught twice in Chromium: a control floating over the
//     battlefield is in the way however small it is. The clock is injected so a
//     test can hold it;
//   * it is drawn with the field's own art, from the map's own geometry, so the
//     picture is the battlefield the player is about to fight on and not a
//     decoration that merely looks like one. If there is no canvas - a test
//     harness, a broken template, a very old browser - the title still shows,
//     without a picture;
//   * one map, one announcement. The same map loaded twice is announced again
//     (it is a new battle), but a redraw of the same battle is not.
import {drawRoad,drawGroundDetails,themeGroundColor} from './cartoon-art.mjs?v=20261122-battle1';

// The seed the ground is drawn from, so the same map always paints the same
// picture. A number from the map's own id - no new randomness, no second truth.
function seedOf(id){
  let seed=2166136261;
  for(const char of String(id||'')){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619);}
  return seed>>>0;
}

// A small picture of the battlefield: the ground of its theme, the road the
// enemies will walk, the pads a tower can stand on and the bunker they protect.
// Painted at the map's own scale into whatever size the canvas has.
export function paintMapPreview(canvas,map){
  if(!canvas||!map||typeof canvas.getContext!=='function')return false;
  const ctx=canvas.getContext('2d');
  if(!ctx)return false;
  try{
    const width=Number(canvas.width)||480,height=Number(canvas.height)||270;
    const worldWidth=Number(map.width)||960,worldHeight=Number(map.height)||540;
    const scale=Math.min(width/worldWidth,height/worldHeight);
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle=themeGroundColor(map.theme);
    ctx.fillRect(0,0,width,height);
    ctx.translate((width-worldWidth*scale)/2,(height-worldHeight*scale)/2);
    ctx.scale(scale,scale);
    // The ground tells the map's own story: the same scatter the field will show
    // seconds later, from the same seed.
    drawGroundDetails(ctx,map.theme||'road',worldWidth,worldHeight,seedOf(map.id));
    const paths=map.paths?.length?map.paths:(map.path?[map.path]:[]);
    for(const path of paths)if(Array.isArray(path)&&path.length>1)drawRoad(ctx,path,map.theme);
    // Build pads: the places the player will be choosing between in a moment.
    for(const pad of map.pads||[]){
      ctx.beginPath();
      ctx.ellipse(pad.x,pad.y,17,12,0,0,Math.PI*2);
      ctx.fillStyle='rgba(232,213,150,.2)';
      ctx.fill();
      ctx.lineWidth=2.5;
      ctx.strokeStyle='rgba(240,224,168,.75)';
      ctx.stroke();
    }
    const bunker=map.bunker||{x:worldWidth-60,y:worldHeight-140};
    ctx.fillStyle='#d8c58a';
    ctx.fillRect(bunker.x-19,bunker.y-15,38,30);
    ctx.strokeStyle='#3a3025';
    ctx.lineWidth=2.5;
    ctx.strokeRect(bunker.x-19,bunker.y-15,38,30);
    ctx.restore();
    return true;
  }catch{
    // A picture is a nice thing to have, not a reason to break the field.
    return false;
  }
}

export function createMapIntro(document,{translate=text=>text,getMap=()=>null,holdMs=2600,
  setTimer=setTimeout,clearTimer=clearTimeout,onChange=null}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid map title');
  if(!Number.isSafeInteger(holdMs)||holdMs<200)throw Error('Invalid map title timing');
  if([setTimer,clearTimer].some(fn=>typeof fn!=='function'))throw Error('Invalid map title timer');
  const $=id=>document.getElementById(id);
  const card=$('mapIntro'),art=$('mapIntroArt'),name=$('mapName'),label=$('mapIntroLabel');
  let timer=null,current=null;
  function cancel(){if(timer!==null){clearTimer(timer);timer=null;}}
  // The stylesheet owns the fade; a DOM without `classList` (a test harness, an
  // older browser) still gets the title, only without the animation. The card is
  // never allowed to fail over a decoration.
  function fading(on){
    if(!card||typeof card.classList?.remove!=='function')return;
    if(on)card.classList.add('is-leaving');else card.classList.remove('is-leaving');
  }
  function hide(){
    cancel();
    fading(false);
    if(card)card.hidden=true;
    current=null;
    onChange?.({showing:false,mapId:null});
  }
  return Object.freeze({
    // The map is loaded: show its name, its label and its picture, then let it
    // go. Called again for a new battle, never for a redraw of this one.
    // The name is the caller's, not the module's: the field composes it (map plus
    // sector, or "1 VS 1") and reads it back, so the title must not rewrite it
    // with a shorter version of its own. Chromium found that: a retreat flow read
    // "Urban Ruin" where "SEKTOR 4" belonged. Without a name the module still
    // names the map itself from its own geometry.
    show(mapId,{label:mode='',name:title=null}={}){
      const map=typeof getMap==='function'?getMap(mapId):null;
      current=mapId??null;
      if(name)name.textContent=title??(map?translate(String(map.name)):'');
      if(label)label.textContent=mode?translate(String(mode)):'';
      if(art)paintMapPreview(art,map);
      fading(false);
      if(card)card.hidden=false;
      cancel();
      // Two steps: hold it, then fade it out, then take it out of the way. The
      // class is what animates the leaving; `hidden` is what removes it.
      timer=setTimer(()=>{
        timer=null;
        fading(true);
        timer=setTimer(()=>{timer=null;hide();},450);
      },holdMs);
      onChange?.({showing:true,mapId:current});
      return !!map;
    },
    hide,
    showing(){return !!card&&!card.hidden;},
    mapId(){return current;},
    // Leaving the field, or a run that ended: no title hangs over the debrief.
    clear(){hide();}
  });
}

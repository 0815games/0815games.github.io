import {translateText as tr} from './language.mjs?v=20261112-firstrun3';
// Solo campaign presentation only. These decorations never change map geometry,
// hit testing, terrain rules or simulation state.
const STYLES={
 'lost-signal':{ground:'#7d9169',light:'#aab88a',dark:'#506a50',water:'#86a9a0',weather:'mist',feature:'wreck',accent:'#e6ca83'},
 'pinewood-rescue':{ground:'#66865c',light:'#a2b682',dark:'#395d45',water:'#7eaaa0',weather:'mist',feature:'shelter',accent:'#d5c389'},
 'blackout':{ground:'#998970',light:'#c2ae87',dark:'#635e4e',water:'#7c8a79',weather:'embers',feature:'antenna',accent:'#e7a570'},
 'supply-line':{ground:'#708e64',light:'#afbd8c',dark:'#47654d',water:'#86aaa0',weather:'mist',feature:'convoy',accent:'#ead398'},
 'intercept':{ground:'#93816b',light:'#c0a588',dark:'#675b4a',water:'#85958b',weather:'embers',feature:'dispatch',accent:'#e9ac73'},
 'bridge':{ground:'#83916b',light:'#b2be8a',dark:'#536b51',water:'#739d99',weather:'rain',feature:'bridge',accent:'#ead398'},
 'dead-air':{ground:'#718a6f',light:'#a6b99a',dark:'#4b6656',water:'#78a19c',weather:'rain',feature:'receiver',accent:'#d9d08b'},
 'white-noise':{ground:'#c2d8d3',light:'#e3ece0',dark:'#7da3a5',water:'#85b6bf',weather:'snow',feature:'station',accent:'#e6be74'},
 'long-switch':{ground:'#b77959',light:'#dca17b',dark:'#785946',water:'#99a592',weather:'embers',feature:'transformer',accent:'#efd484'},
 'city-of-glass':{ground:'#8a8d80',light:'#b7b6a0',dark:'#59665d',water:'#7d9e9c',weather:'rain',feature:'prison',accent:'#e2b876'},
 'tidelock':{ground:'#728b75',light:'#a8b9a0',dark:'#4b675c',water:'#6e9da0',weather:'rain',feature:'relay',accent:'#ead48a'},
 'last-transmission':{ground:'#879188',light:'#bec3ab',dark:'#52645c',water:'#739da3',weather:'mist',feature:'dam',accent:'#ead18b'}
};
export function storyMapStyle(id){return STYLES[id]||null;}
function distanceSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function storyAnchors(path,pads,stages){
 const result=[];for(let row=0;row<=6;row++)for(let col=0;col<=12;col++){const x=55+col*70+((col*13+row*7)%19)-9,y=52+row*70+((col*5+row*11)%19)-9;const p={x,y};if(path.slice(1).some((b,i)=>distanceSegment(p,path[i],b)<56))continue;if(pads.some(q=>Math.hypot(q.x-x,q.y-y)<55))continue;if(stages.some(q=>Number.isFinite(q.x)&&Math.hypot(q.x-x,q.y-y)<65))continue;if(Math.hypot(900-x,400-y)<80)continue;result.push(p);}return result;
}
const layoutCache=new WeakMap();
function layout(mission,path,pads){let item=layoutCache.get(mission);if(!item||item.path!==path||item.pads!==pads){item={path,pads,spots:storyAnchors(path,pads,mission.stages||[])};layoutCache.set(mission,item);}return item.spots;}
function disk(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function stroke(ctx,x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
// Load illustrated landmark art once. A version change invalidates cached terrain
// as images arrive, while missing assets retain a clear functional fallback.
const artFiles={antenna:'radio',receiver:'radio',relay:'radio',station:'radio',transformer:'transformer',convoy:'truck',dispatch:'truck',wreck:'wreck',bridge:'bridge',dam:'dam',shelter:'shelter',prison:'prison'};
const artEntries=new Map();let artVersion=0;
export function prepareStoryArt(doc){
 if(!doc?.createElement)return {version:0,get:()=>null};
 for(const name of new Set(Object.values(artFiles))){if(artEntries.has(name))continue;const image=doc.createElement('img'),entry={image,ready:false};artEntries.set(name,entry);image.onload=()=>{entry.ready=true;artVersion++;};image.src=`assets/landmark-${name}-sprite.png`;}
 return {version:artVersion,get:kind=>{const item=artEntries.get(artFiles[kind]);return item?.ready?item.image:null;}};
}
function building(ctx,x,y,kind,s,art=null){
 const image=art?.get(kind);if(image){const scale=Math.min(64/(image.naturalWidth||256),56/(image.naturalHeight||256)),w=(image.naturalWidth||256)*scale,h=(image.naturalHeight||256)*scale;ctx.drawImage(image,x-w/2,y+20-h,w,h);return;}
 // Neutral field marker while the illustrated asset is unavailable.
 ctx.save();ctx.fillStyle='#1b3028';ctx.fillRect(x-21,y-13,42,29);ctx.strokeStyle=s.accent;ctx.lineWidth=2;ctx.strokeRect(x-21,y-13,42,29);ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillStyle='#f4e8c3';ctx.fillText(tr(({antenna:'RADIO',receiver:'RADIO',relay:'RELAY',station:'STATION',transformer:'POWER',convoy:'CONVOY',dispatch:'TRUCK',wreck:'WRECK',bridge:'BRIDGE',dam:'DAM',shelter:'AID',prison:'PRISON'})[kind]||'SITE'),x,y+4);ctx.restore();
}
export function drawStoryTerrain(ctx,mission,path,pads,width=960,height=540,texture=null,art=null){
 const s=storyMapStyle(mission?.id);if(!s)return false;ctx.save();ctx.fillStyle=s.ground;ctx.fillRect(0,0,width,height);
 // Textured terrain replaces the old cartoon underpainting when artwork is ready.
 if(texture){ctx.save();ctx.globalAlpha=.88;ctx.drawImage(texture,0,0,width,height);ctx.restore();}
 if(!texture)for(let i=0;i<42;i++){const x=(i*197+41)%width,y=(i*131+33)%height;ctx.globalAlpha=.22;disk(ctx,x,y,20+(i%4)*8,7+(i%3)*4,i%2?s.light:s.dark);ctx.globalAlpha=.65;stroke(ctx,x-9,y+1,x-3,y-3,s.dark,1.4);stroke(ctx,x+4,y+3,x+10,y-1,s.light,1.5);}ctx.globalAlpha=1;
 const spots=layout(mission,path,pads);
 // Place two distinct mission landmarks away from paths, build pads and objectives.
 const locations=spots.filter((_,i)=>i%4===0);if(locations.length){const a=locations[Math.floor(locations.length/3)],b=locations[Math.floor(locations.length*2/3)];building(ctx,a.x,a.y,s.feature,s,art);if(b!==a){const second={wreck:'antenna',shelter:'convoy',antenna:'wreck',convoy:'shelter',dispatch:'antenna',bridge:'convoy',receiver:'shelter',station:'receiver',transformer:'station',prison:'antenna',relay:'bridge',dam:'relay'};building(ctx,b.x,b.y,second[s.feature],s,art);}}
 ctx.restore();return true;
}
export function drawStoryAtmosphere(ctx,mission,time,reducedMotion=false,width=960,height=540,path=[],pads=[]){
 const s=storyMapStyle(mission?.id);if(!s||reducedMotion)return;const t=Number.isFinite(time)?time:0;ctx.save();const spots=layout(mission,path,pads).filter((_,i)=>i%4===0);if(spots.length){const point=spots[Math.floor(spots.length/3)];ctx.globalAlpha=.18+.08*Math.sin(t*1.3);disk(ctx,point.x,point.y-18,17,12,s.accent);ctx.globalAlpha=.7;disk(ctx,point.x,point.y-18,2.5,2.5,s.accent);}ctx.globalAlpha=s.weather==='mist'?.12:.32;
 if(s.weather==='mist'){for(let i=0;i<4;i++){const x=((i*260+t*8)%(width+250))-125;disk(ctx,x,85+i*120,100,18,s.light);}}
 else if(s.weather==='rain'){for(let i=0;i<32;i++){const x=((i*83+t*75)%(width+20))-10,y=(i*113+t*150)%height;stroke(ctx,x,y,x-5,y+11,'#e2f0df',1);}}
 else if(s.weather==='snow'){for(let i=0;i<36;i++){const x=(i*97+t*11)%width,y=(i*71+t*27)%height;disk(ctx,x,y,1.7,1.7,'#f4faf2');}}
 else {for(let i=0;i<25;i++){const x=(i*113+t*8)%width,y=((i*71-t*18)%height+height)%height;disk(ctx,x,y,1.5,1.5,'#ffd69a');}}
 ctx.restore();
}

// Story objectives are painted as scenery; the objective engine owns all logic.
export function drawStoryObjective(ctx,mission,stage,time=0,reducedMotion=false,art=null){
 const s=storyMapStyle(mission?.id);if(!s||stage?.type!=='protect'||!Number.isFinite(stage.x)||!Number.isFinite(stage.y))return;
 const feature=stage.asset?.toLowerCase().includes('transformer')?'transformer':'receiver';building(ctx,stage.x,stage.y,feature,s,art);
 if(!reducedMotion){ctx.save();ctx.globalAlpha=.25+.1*Math.sin((Number.isFinite(time)?time:0)*2);disk(ctx,stage.x,stage.y-32,12,10,s.accent);ctx.restore();}
}

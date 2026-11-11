import {translateText as tr} from './language.mjs?v=20261112-pressure1';
// Solo campaign presentation only. These decorations never change map geometry,
// hit testing, terrain rules or simulation state.
const STYLES={
 'lost-signal':{ground:'#7d9169',light:'#aab88a',dark:'#506a50',water:'#86a9a0',weather:'mist',feature:'wreck',accent:'#e6ca83'},
 'pinewood-rescue':{ground:'#66865c',light:'#a2b682',dark:'#395d45',water:'#7eaaa0',weather:'mist',feature:'shelter',accent:'#d5c389'},
 'ghost-frequency':{ground:'#6d8a63',light:'#a4b884',dark:'#3d5c46',water:'#7eaaa0',weather:'mist',feature:'mast',accent:'#e0cd8e'},
'blackout':{ground:'#998970',light:'#c2ae87',dark:'#635e4e',water:'#7c8a79',weather:'embers',feature:'antenna',accent:'#e7a570'},
 'ash-market':{ground:'#8d8676',light:'#bfb69c',dark:'#5c5a4c',water:'#7d9e9c',weather:'embers',feature:'market',accent:'#e7b077'},
'the-list':{ground:'#718769',light:'#a6bb96',dark:'#4a6452',water:'#78a19c',weather:'rain',feature:'hospital',accent:'#dbd38d'},
'brothers-keeper':{ground:'#c4d9d4',light:'#e6efe3',dark:'#80a6a8',water:'#87b8c1',weather:'snow',feature:'satchel',accent:'#e4bd75'},
'quiet-road':{ground:'#9b8168',light:'#c9a988',dark:'#6e5c48',water:'#8b9887',weather:'embers',feature:'timetable',accent:'#ecb37b'},
'signal-home':{ground:'#5f7f5a',light:'#9cb281',dark:'#35523f',water:'#7ba89f',weather:'mist',feature:'broadcast',accent:'#ead18b'},
'supply-line':{ground:'#708e64',light:'#afbd8c',dark:'#47654d',water:'#86aaa0',weather:'mist',feature:'convoy',accent:'#ead398'},
 'intercept':{ground:'#93816b',light:'#c0a588',dark:'#675b4a',water:'#85958b',weather:'embers',feature:'dispatch',accent:'#e9ac73'},
 'bridge':{ground:'#83916b',light:'#b2be8a',dark:'#536b51',water:'#739d99',weather:'rain',feature:'bridge',accent:'#ead398'},
 'dead-air':{ground:'#718a6f',light:'#a6b99a',dark:'#4b6656',water:'#78a19c',weather:'rain',feature:'receiver',accent:'#d9d08b'},
 'white-noise':{ground:'#c2d8d3',light:'#e3ece0',dark:'#7da3a5',water:'#85b6bf',weather:'snow',feature:'station',accent:'#e6be74'},
 'long-switch':{ground:'#b77959',light:'#dca17b',dark:'#785946',water:'#99a592',weather:'embers',feature:'transformer',accent:'#efd484'},
 // Act II - the Marsch & Eis region: dyke, hospital, night truck, sledge
 // shelter and the prison transport's frozen junction.
 'high-water':{ground:'#6e8a6c',light:'#a4bb98',dark:'#486350',water:'#7aa39e',weather:'rain',feature:'dam',accent:'#d9d08b'},
 'ward-line':{ground:'#7c7f74',light:'#adb3a2',dark:'#515549',water:'#84989b',weather:'rain',feature:'hospital',accent:'#e0cf95'},
 'the-count':{ground:'#5f7a68',light:'#93ac8e',dark:'#3a5548',water:'#6f9c96',weather:'rain',feature:'truck',accent:'#cfcc86'},
 'ice-run':{ground:'#c6dad5',light:'#e8f0e5',dark:'#82a8aa',water:'#8ab9c2',weather:'snow',feature:'shelter',accent:'#e6be74'},
 'cold-start':{ground:'#b9d1cc',light:'#dfe9e2',dark:'#78a0a2',water:'#84b4bd',weather:'snow',feature:'prison',accent:'#e2bb72'},
 // Act III - the occupied city: the registry hall's paper war and the forge
 // where the original timetable survived.
 'paper-war':{ground:'#7f8378',light:'#b3b39b',dark:'#4f5a52',water:'#7d9e9c',weather:'rain',feature:'dispatch',accent:'#e3cd8e'},
 'the-mentor':{ground:'#7a7468',light:'#ada288',dark:'#4c463c',water:'#7d9e9c',weather:'embers',feature:'market',accent:'#ecb377'},
 'workshop-of-ghosts':{ground:'#6f6a60',light:'#a89d82',dark:'#453f35',water:'#7d9e9c',weather:'embers',feature:'market',accent:'#eeb67a'},
 'night-shift':{ground:'#5c665f',light:'#8fa08e',dark:'#38443c',water:'#6f9c96',weather:'rain',feature:'convoy',accent:'#e6cf8f'},
 // Act III - the road to the tower: the marsh council, the relay trace and the
 // counterfeit key forging.
 // Act IV - the long winter: the pass climb, the burning moor depot and the
 // frozen warm-line relay.
 'night-of-lights':{ground:'#43484a',light:'#75797a',dark:'#24272a',water:'#54696d',weather:'mist',feature:'broadcast',accent:'#e8cf8f'},
 'the-prison-train':{ground:'#4d524d',light:'#7e827b',dark:'#2b2e2b',water:'#5a7370',weather:'embers',feature:'convoy',accent:'#e6bb7f'},
 'rooks-line':{ground:'#4f544e',light:'#80847c',dark:'#2c2f2b',water:'#5b746e',weather:'rain',feature:'antenna',accent:'#e4ca8c'},
 'the-core':{ground:'#4a4f4a',light:'#7c807a',dark:'#282b28',water:'#5a7370',weather:'rain',feature:'station',accent:'#e4c98e'},
 'last-order':{ground:'#4d524e',light:'#7f837c',dark:'#2b2e2b',water:'#5c7570',weather:'rain',feature:'dispatch',accent:'#ecd692'},
 'homecoming':{ground:'#565a52',light:'#8b8d7f',dark:'#33362f',water:'#5f7a74',weather:'embers',feature:'broadcast',accent:'#e8c87e'},
 'the-descent':{ground:'#565a52',light:'#8b8d7f',dark:'#33362f',water:'#5f7a74',weather:'mist',feature:'station',accent:'#e6cd8b'},
 'dead-timetable':{ground:'#4e534f',light:'#7f837b',dark:'#2c2f2b',water:'#5c7570',weather:'mist',feature:'timetable',accent:'#ecd692'},
 'the-quartermaster':{ground:'#585245',light:'#8a8272',dark:'#34302a',water:'#5f7568',weather:'embers',feature:'market',accent:'#e8b97a'},
 'two-keys':{ground:'#4a4f4c',light:'#7b807a',dark:'#282b28',water:'#59726c',weather:'rain',feature:'dam',accent:'#e2c98e'},
 'storm-gate':{ground:'#9db8b2',light:'#cadcd6',dark:'#5f8b8d',water:'#78a9b2',weather:'snow',feature:'dam',accent:'#e8c87e'},
 'the-work-camp':{ground:'#a5bfb9',light:'#d2e1da',dark:'#638e91',water:'#7cacb5',weather:'snow',feature:'prison',accent:'#e0b976'},
 'avalanche':{ground:'#bccfca',light:'#e0ebe6',dark:'#7fa3a4',water:'#84b5be',weather:'snow',feature:'dam',accent:'#e8c57c'},
 'the-long-span':{ground:'#a9c2bd',light:'#d6e5df',dark:'#699495',water:'#7fb0b9',weather:'snow',feature:'bridge',accent:'#ecc97e'},
 'rooks-trail':{ground:'#8a7f6a',light:'#bcae94',dark:'#5b5342',water:'#84968c',weather:'embers',feature:'antenna',accent:'#ecab72'},
 'iron-yard':{ground:'#7c8177',light:'#afb29c',dark:'#4d5349',water:'#7d9e9c',weather:'snow',feature:'station',accent:'#e9cd8d'},
 'the-second-list':{ground:'#9fbab4',light:'#cfe0da',dark:'#67908f',water:'#7aacb5',weather:'snow',feature:'hospital',accent:'#e4d494'},
 'the-pass':{ground:'#b7d0cb',light:'#dceae5',dark:'#75a0a2',water:'#83b4bd',weather:'snow',feature:'shelter',accent:'#e5c077'},
 'wrens-fire':{ground:'#a9c3be',light:'#d5e4de',dark:'#679295',water:'#7fb0b9',weather:'embers',feature:'dispatch',accent:'#efa96a'},
 'frozen-relay':{ground:'#c0d6d1',light:'#e4ede1',dark:'#7ea4a6',water:'#86b7c0',weather:'snow',feature:'relay',accent:'#e2bd75'},
 'the-confession':{ground:'#63806c',light:'#98b092',dark:'#3e5749',water:'#6f9c96',weather:'rain',feature:'shelter',accent:'#e3d291'},
 'the-signal-above':{ground:'#8a7f68',light:'#bcae90',dark:'#5b5240',water:'#83958b',weather:'embers',feature:'antenna',accent:'#ecb37b'},
 'counterfeit-key':{ground:'#767b70',light:'#a9ac96',dark:'#484f47',water:'#7d9e9c',weather:'rain',feature:'dispatch',accent:'#e6c98c'},
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
const artFiles={antenna:'radio',receiver:'radio',relay:'radio',station:'radio',transformer:'transformer',convoy:'truck',dispatch:'truck',truck:'truck',wreck:'wreck',bridge:'bridge',dam:'dam',shelter:'shelter',prison:'prison',mast:'radio',broadcast:'radio',satchel:'truck',timetable:'truck',hospital:'shelter',market:'wreck'};
const artEntries=new Map();let artVersion=0;
export function prepareStoryArt(doc){
 if(!doc?.createElement)return {version:0,get:()=>null};
 for(const name of new Set(Object.values(artFiles))){if(artEntries.has(name))continue;const image=doc.createElement('img'),entry={image,ready:false};artEntries.set(name,entry);image.onload=()=>{entry.ready=true;artVersion++;};image.src=`assets/landmark2-${name}-sprite.png`;}
 return {version:artVersion,get:kind=>{const item=artEntries.get(artFiles[kind]);return item?.ready?item.image:null;}};
}
function building(ctx,x,y,kind,s,art=null){
 const image=art?.get(kind);if(image){const scale=Math.min(64/(image.naturalWidth||256),56/(image.naturalHeight||256)),w=(image.naturalWidth||256)*scale,h=(image.naturalHeight||256)*scale;ctx.drawImage(image,x-w/2,y+20-h,w,h);return;}
 // Neutral field marker while the illustrated asset is unavailable.
 ctx.save();ctx.fillStyle='#1b3028';ctx.fillRect(x-21,y-13,42,29);ctx.strokeStyle=s.accent;ctx.lineWidth=2;ctx.strokeRect(x-21,y-13,42,29);ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillStyle='#f4e8c3';ctx.fillText(tr(({antenna:'RADIO',receiver:'RADIO',relay:'RELAY',station:'STATION',transformer:'POWER',convoy:'CONVOY',dispatch:'TRUCK',truck:'TRUCK',wreck:'WRECK',bridge:'BRIDGE',dam:'DAM',shelter:'AID',prison:'PRISON',mast:'MAST',broadcast:'RELAY',satchel:'SATCHEL',timetable:'TIMETABLE',hospital:'AID POST',market:'MARKET'})[kind]||'SITE'),x,y+4);ctx.restore();
}
export function drawStoryTerrain(ctx,mission,path,pads,width=960,height=540,texture=null,art=null){
 const s=storyMapStyle(mission?.id);if(!s)return false;ctx.save();ctx.fillStyle=s.ground;ctx.fillRect(0,0,width,height);
 // Textured terrain replaces the old cartoon underpainting when artwork is ready.
 if(texture){ctx.save();ctx.globalAlpha=.88;ctx.drawImage(texture,0,0,width,height);ctx.restore();}
 if(!texture)for(let i=0;i<42;i++){const x=(i*197+41)%width,y=(i*131+33)%height;ctx.globalAlpha=.22;disk(ctx,x,y,20+(i%4)*8,7+(i%3)*4,i%2?s.light:s.dark);ctx.globalAlpha=.65;stroke(ctx,x-9,y+1,x-3,y-3,s.dark,1.4);stroke(ctx,x+4,y+3,x+10,y-1,s.light,1.5);}ctx.globalAlpha=1;
 const spots=layout(mission,path,pads);
 // Place two distinct mission landmarks away from paths, build pads and objectives.
 const locations=spots.filter((_,i)=>i%4===0);if(locations.length){const a=locations[Math.floor(locations.length/3)],b=locations[Math.floor(locations.length*2/3)];building(ctx,a.x,a.y,s.feature,s,art);if(b!==a){const second={wreck:'antenna',shelter:'convoy',antenna:'wreck',convoy:'shelter',dispatch:'antenna',bridge:'convoy',receiver:'shelter',station:'receiver',transformer:'station',prison:'antenna',relay:'bridge',dam:'relay',mast:'broadcast',broadcast:'mast',satchel:'timetable',timetable:'satchel',hospital:'shelter',market:'antenna'};building(ctx,b.x,b.y,second[s.feature],s,art);}}
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

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
function scenery(ctx,x,y,s,index){
 ctx.save();ctx.translate(x,y);disk(ctx,0,12,15,5,s.dark);
 const rocky=['station','prison','dispatch','antenna','transformer','dam'].includes(s.feature);
 if(rocky){
  ctx.beginPath();ctx.moveTo(-15,9);ctx.lineTo(-10,-4);ctx.lineTo(-3,-13);ctx.lineTo(8,-11);ctx.lineTo(15,9);ctx.closePath();ctx.fillStyle=s.dark;ctx.fill();ctx.strokeStyle='#344a40';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-9,3);ctx.lineTo(-2,-9);ctx.lineTo(6,-8);ctx.lineTo(10,3);ctx.closePath();ctx.fillStyle=s.light;ctx.globalAlpha=.8;ctx.fill();ctx.globalAlpha=1;
  if(s.weather==='snow'){stroke(ctx,-10,-1,-3,-8,'#f1f8eb',3);stroke(ctx,-3,-8,4,-5,'#f1f8eb',3);}
 }else if(['receiver','relay','bridge'].includes(s.feature)){
  disk(ctx,0,5,16,7,s.water);stroke(ctx,-10,3,8,3,s.light,1.5);for(const dx of [-8,0,8]){stroke(ctx,dx,4,dx+2,-12,s.dark,2);disk(ctx,dx+2,-13,2,4,s.dark);}
 }else{
  ctx.fillStyle='#725c40';ctx.fillRect(-3,-5,6,17);ctx.beginPath();ctx.moveTo(-15,-2);ctx.lineTo(-7,-11);ctx.lineTo(-11,-11);ctx.lineTo(0,-26);ctx.lineTo(11,-11);ctx.lineTo(7,-11);ctx.lineTo(15,-2);ctx.closePath();ctx.fillStyle=s.dark;ctx.fill();ctx.strokeStyle='#344d39';ctx.lineWidth=2;ctx.stroke();stroke(ctx,-8,-6,0,-13,s.light,2);stroke(ctx,0,-13,7,-6,s.light,2);
 }
 ctx.restore();
}
function building(ctx,x,y,kind,s){
 ctx.save();ctx.translate(x,y);disk(ctx,2,19,31,12,s.dark);ctx.strokeStyle='#293b33';ctx.lineWidth=2;
 if(['antenna','receiver','relay','station'].includes(kind)){
  ctx.fillStyle=s.light;ctx.fillRect(-17,0,34,18);ctx.strokeRect(-17,0,34,18);ctx.fillStyle=s.dark;ctx.fillRect(-12,5,8,5);ctx.fillRect(5,5,8,5);
  stroke(ctx,0,0,0,-31,'#293b33',3);stroke(ctx,-12,-18,12,-18,'#293b33',2);stroke(ctx,-9,-6,9,-6,'#293b33',2);stroke(ctx,-12,-18,9,-6,'#293b33',1);stroke(ctx,12,-18,-9,-6,'#293b33',1);disk(ctx,0,-32,4,4,s.accent);
 }else if(kind==='transformer'){
  ctx.fillStyle=s.light;ctx.fillRect(-24,-8,48,27);ctx.strokeRect(-24,-8,48,27);for(let i=-1;i<=1;i++){ctx.fillStyle=s.dark;ctx.fillRect(i*14-4,-19,8,13);ctx.strokeRect(i*14-4,-19,8,13);stroke(ctx,i*14-5,-12,i*14+5,-12,s.accent,2);}stroke(ctx,-19,5,19,5,'#293b33',2);
 }else if(['convoy','dispatch','wreck'].includes(kind)){
  ctx.fillStyle=kind==='wreck'?'#927659':s.light;ctx.fillRect(-26,-8,34,21);ctx.strokeRect(-26,-8,34,21);ctx.fillStyle=s.dark;ctx.fillRect(8,-3,17,16);ctx.strokeRect(8,-3,17,16);disk(ctx,-16,15,5,5,'#293b33');disk(ctx,16,15,5,5,'#293b33');stroke(ctx,-20,-3,2,-3,s.accent,2);
  if(kind==='wreck'){stroke(ctx,-18,-10,0,10,'#4a4639',3);stroke(ctx,-24,9,-6,-9,'#4a4639',2);}
 }else if(kind==='dam'||kind==='bridge'){
  ctx.fillStyle=s.water;ctx.fillRect(-32,-13,64,29);ctx.strokeRect(-32,-13,64,29);ctx.fillStyle=s.light;ctx.fillRect(-27,-4,54,13);ctx.strokeRect(-27,-4,54,13);for(let i=-20;i<=20;i+=10)stroke(ctx,i,-3,i,8,s.dark,2);
 }else{
  ctx.fillStyle=s.light;ctx.fillRect(-24,-12,48,31);ctx.strokeRect(-24,-12,48,31);ctx.fillStyle=s.dark;ctx.fillRect(-18,-7,12,8);ctx.fillRect(7,-7,12,8);ctx.fillRect(-4,7,8,12);stroke(ctx,-28,-12,28,-12,'#293b33',3);
  if(kind==='prison'){for(let i=-17;i<=17;i+=6)stroke(ctx,i,-6,i,0,'#293b33',1);}
  if(kind==='shelter'){stroke(ctx,-6,-2,6,-2,s.accent,3);stroke(ctx,0,-8,0,4,s.accent,3);}
 }
 ctx.restore();
}
export function drawStoryTerrain(ctx,mission,path,pads,width=960,height=540,texture=null){
 const s=storyMapStyle(mission?.id);if(!s)return false;ctx.save();ctx.fillStyle=s.ground;ctx.fillRect(0,0,width,height);
 // Textured terrain replaces the old cartoon underpainting when artwork is ready.
 if(texture){ctx.save();ctx.globalAlpha=.88;ctx.drawImage(texture,0,0,width,height);ctx.restore();}
 if(!texture)for(let i=0;i<42;i++){const x=(i*197+41)%width,y=(i*131+33)%height;ctx.globalAlpha=.22;disk(ctx,x,y,20+(i%4)*8,7+(i%3)*4,i%2?s.light:s.dark);ctx.globalAlpha=.65;stroke(ctx,x-9,y+1,x-3,y-3,s.dark,1.4);stroke(ctx,x+4,y+3,x+10,y-1,s.light,1.5);}ctx.globalAlpha=1;
 const spots=layout(mission,path,pads);if(!texture)for(let i=0;i<spots.length;i++){const {x,y}=spots[i];if(i%3===1){scenery(ctx,x,y,s,i);}else if(i%5===3){disk(ctx,x,y,14,6,s.water);stroke(ctx,x-8,y,x+7,y,s.light,1);}else{stroke(ctx,x-5,y+4,x-7,y-5,s.dark,2);stroke(ctx,x+2,y+4,x+5,y-7,s.dark,2);}}
 // Place two distinct mission landmarks away from paths, build pads and objectives.
 const locations=spots.filter((_,i)=>i%4===0);if(locations.length){const a=locations[Math.floor(locations.length/3)],b=locations[Math.floor(locations.length*2/3)];building(ctx,a.x,a.y,s.feature,s);if(b!==a){const second={wreck:'antenna',shelter:'convoy',antenna:'wreck',convoy:'shelter',dispatch:'antenna',bridge:'convoy',receiver:'shelter',station:'receiver',transformer:'station',prison:'antenna',relay:'bridge',dam:'relay'};building(ctx,b.x,b.y,second[s.feature],s);}}
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
export function drawStoryObjective(ctx,mission,stage,time=0,reducedMotion=false){
 const s=storyMapStyle(mission?.id);if(!s||stage?.type!=='protect'||!Number.isFinite(stage.x)||!Number.isFinite(stage.y))return;
 const feature=stage.asset?.toLowerCase().includes('transformer')?'transformer':'receiver';building(ctx,stage.x,stage.y,feature,s);
 if(!reducedMotion){ctx.save();ctx.globalAlpha=.25+.1*Math.sin((Number.isFinite(time)?time:0)*2);disk(ctx,stage.x,stage.y-32,12,10,s.accent);ctx.restore();}
}

import {getWeaponVisual} from './character.js';

const SUPPORTED=new Set([
 'goblin','skeleton','rat','slime','bat'
]);

export function figureKind(value,hero){
 if(hero){
  return ['warrior','mage','rogue'].includes(value.heroClass)
   ?value.heroClass:'warrior';
 }
 return value.id==='boss'||value.key==='lord'
  ?'lord':value.shape||value.key||'goblin';
}

export function equipmentVisual(value){
 const e=value.equipped||{};
 return {
  weapon:getWeaponVisual(e.mainhand),
  helmet:!!e.head,
  armor:!!e.body,
  boots:!!e.feet,
  shield:!!e.offhand,
  ring:!!e.ring
 };
}

export function figureSignature(value,hero){
 return JSON.stringify(hero
  ?[figureKind(value,true),value.equipped||{}]
  :[
    figureKind(value,false),
    value.color||'',
    value.elite===true
   ]
 );
}

function color(value,fallback){
 return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)
  ?parseInt(value.slice(1),16):fallback;
}

export function createFigureFactory(T){
 const geometries=new Map(),materials=new Map();
 let closed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');

 function geo(type,...args){
  const key=type+JSON.stringify(args);
  if(!geometries.has(key)){
   geometries.set(key,new T[type](...args));
  }
  return geometries.get(key);
 }

 function material(c,metal=0,glow=0){
  const key=[c,metal,glow].join(':');
  if(!materials.has(key)){
   materials.set(key,new T.MeshStandardMaterial({
    color:c,
    metalness:metal,
    roughness:metal?.47:.87,
    emissive:glow,
    emissiveIntensity:glow?.55:0
   }));
  }
  return materials.get(key);
 }

 function mesh(parent,type,args,mat,x=0,y=0,z=0,name=''){
  const m=new T.Mesh(geo(type,...args),mat);
  m.position.set(x,y,z);
  m.castShadow=true;
  m.receiveShadow=true;
  m.name=name;
  parent.add(m);
  return m;
 }

 const box=(p,w,h,d,m,x=0,y=0,z=0,name='')=>
  mesh(p,'BoxGeometry',[w,h,d],m,x,y,z,name);

 const ball=(p,r,m,x=0,y=0,z=0,name='')=>
  mesh(p,'SphereGeometry',[r,10,8],m,x,y,z,name);

 function pivot(parent,x=0,y=0,z=0){
  const g=new T.Group();
  g.position.set(x,y,z);
  parent.add(g);
  return g;
 }

 function humanoid(root,value,kind,hero){
  const core=pivot(root);
  const facing=pivot(core);
  const legs=[],arms=[];

  const equipment=hero
   ?equipmentVisual(value)
   :{weapon:kind==='skeleton'?'sword':'club'};

  const cloth=material(
   kind==='mage'?0x51426f:
   kind==='rogue'?0x283a42:
   kind==='skeleton'?0x655d53:0x615344
  );

  const skin=material(
   kind==='skeleton'?0xc9c9b7:
   kind==='goblin'?color(value.color,0x78916b):0xc4a083
  );

  const steel=material(0x8fa2aa,.65);
  const bronze=material(0xba9963,.55);
  const dark=material(0x17242a);

  box(
   facing,kind==='skeleton'?.18:.32,.38,.19,
   hero&&equipment.armor?steel:cloth,
   0,.69,0,'torso'
  );

  if(kind==='mage'){
   mesh(
    facing,'ConeGeometry',[.26,.55,8],
    cloth,0,.34,0,'robe'
   );
   const trim=mesh(
    facing,'CylinderGeometry',[.24,.24,.035,8],
    bronze,0,.085,0
   );
   trim.castShadow=false;
  }else if(kind==='rogue'){
   box(
    facing,.34,.37,.025,dark,
    0,.64,-.13,'cloak'
   );
   box(
    facing,.055,.32,.225,bronze,
    .04,.7,.01,'belt-strap'
   ).rotation.z=-.55;
  }

  box(facing,.35,.055,.215,bronze,0,.52,.01,'belt');

  for(const sign of [-1,1]){
   const leg=pivot(facing,sign*.09,.48,0);
   legs.push(leg);

   mesh(
    leg,'CylinderGeometry',
    [
     kind==='skeleton'?.03:.052,
     kind==='skeleton'?.03:.048,
     .32,6
    ],
    kind==='skeleton'?skin:cloth,
    0,-.16,0
   );

   box(
    leg,.13,.12,.22,
    hero&&equipment.boots?steel:dark,
    0,-.36,.035,'boot'
   );

   const arm=pivot(facing,sign*.235,.86,0);
   arms.push(arm);

   ball(
    arm,.082,hero&&equipment.armor?steel:cloth,
    0,0,0,'shoulder'
   );

   mesh(
    arm,'CylinderGeometry',
    [
     kind==='skeleton'?.027:.04,
     kind==='skeleton'?.027:.038,
     .28,6
    ],
    kind==='skeleton'?skin:cloth,
    0,-.15,0
   );

   ball(arm,.048,skin,0,-.31,.01,'hand');
  }

  const head=pivot(facing,0,1.03,0);

  if(kind==='rogue'){
   ball(head,.165,dark,0,.015,-.035,'hood');
  }

  ball(
   head,.128,skin,
   0,.02,kind==='rogue'?.055:.015,'head'
  );

  for(const sign of [-1,1]){
   ball(
    head,.014,
    material(
     0x20313a,0,kind==='skeleton'?0x222a20:0
    ),
    sign*.047,.04,kind==='rogue'?.17:.135,'eye'
   );
  }

  if(kind==='rogue'){
   box(head,.21,.065,.035,dark,0,-.025,.16,'mask');
  }

  if(kind==='goblin'){
   for(const sign of [-1,1]){
    const ear=mesh(
     head,'ConeGeometry',[.067,.18,4],
     skin,sign*.16,.035,.01,'ear'
    );
    ear.rotation.z=sign*-1.1;
   }
   root.scale.set(.8,.8,.8);
  }

  if(kind==='skeleton'){
   for(let i=0;i<3;i++){
    box(
     facing,.25,.025,.055,skin,
     0,.62+i*.065,.13,'rib'
    );
   }
  }

  if(hero&&equipment.helmet){
   ball(head,.145,steel,0,.085,-.035,'helmet');
   box(
    head,.30,.04,.19,steel,
    0,.08,.05,'helmet-rim'
   );
   box(
    head,.025,.14,.035,steel,
    0,.005,.15,'noseguard'
   );
  }else if(kind==='mage'){
   mesh(
    head,'ConeGeometry',[.16,.3,8],
    cloth,0,.26,0,'hat'
   );
   mesh(
    head,'CylinderGeometry',[.21,.21,.025,10],
    bronze,0,.11,0,'hat-brim'
   );
  }else if(kind==='warrior'){
   ball(
    head,.13,material(0x49392f),
    0,.095,-.035,'hair'
   );
  }

  const hand=pivot(arms[1],0,-.31,.04);

  if(equipment.weapon==='staff'){
   mesh(
    hand,'CylinderGeometry',[.022,.027,.85,6],
    material(0x79563a),0,.03,0,'staff'
   );
   mesh(
    hand,'OctahedronGeometry',[.075,0],
    material(0xab95dd,.15,0x6f55a8),
    0,.51,0,'crystal'
   );
  }else if(equipment.weapon==='club'){
   mesh(
    hand,'CylinderGeometry',[.027,.025,.34,6],
    material(0x785c3a),0,.12,0,'club'
   );
   ball(hand,.075,material(0x655c4e),0,.30,0);
  }else if(equipment.weapon!=='none'){
   const length=equipment.weapon==='dagger'?.23:.43;
   const blade=equipment.weapon==='runic'
    ?material(0xb3e6e9,.55,0x316878):steel;

   box(
    hand,.035,length,.025,blade,
    0,.04+length/2,0,'blade'
   );
   mesh(
    hand,'ConeGeometry',[.028,.085,4],
    blade,0,.04+length+.035,0,'blade-tip'
   );
   box(hand,.15,.025,.04,bronze,0,.025,0,'guard');
   box(
    hand,.035,.13,.035,material(0x78533a),
    0,-.05,0,'grip'
   );
  }

  if(hero&&equipment.shield){
   const shield=pivot(arms[0],0,-.21,.08);
   const plate=mesh(
    shield,'CylinderGeometry',[.17,.145,.045,6],
    steel,0,0,0,'shield'
   );
   plate.rotation.x=Math.PI/2;
   ball(shield,.04,bronze,0,0,.045,'shield-boss');
  }

  if(hero&&equipment.ring){
   ball(
    arms[1],.023,
    material(
     value.equipped?.ring==='obsidian_ring'
      ?0xa582c7:0xc96d70,
     .3
    ),
    .035,-.31,.055,'ring'
   );
  }

  return {
   core,facing,legs,arms,
   height:kind==='goblin'?1.08:1.4,
   style:'humanoid'
  };
 }

 function creature(root,value,kind){
  const core=pivot(root),facing=pivot(core);
  const legs=[],arms=[];

  const skin=material(color(
   value.color,
   kind==='slime'?0x729e88:
   kind==='bat'?0x665374:0x7c756a
  ));
  const dark=material(0x18242c);
  const eye=material(0xead9ac,0,0x5e4728);

  if(kind==='slime'){
   const body=ball(
    facing,.23,skin,0,.19,0,'slime'
   );
   body.scale.set(1.25,.8,1.1);

   for(const sign of [-1,1]){
    ball(facing,.025,dark,sign*.075,.24,.22,'eye');
   }

   return {
    core,facing,legs,arms,height:.7,
    style:'slime',body
   };
  }

  if(kind==='bat'){
   ball(facing,.11,skin,0,.58,0,'bat');

   for(const sign of [-1,1]){
    const wing=pivot(facing,sign*.075,.59,0);
    arms.push(wing);

    const membrane=mesh(
     wing,'ConeGeometry',[.26,.022,3],
     skin,sign*.17,0,0,'wing'
    );
    membrane.rotation.y=sign*.45;

    ball(
     facing,.017,eye,
     sign*.035,.61,.10,'eye'
    );
   }

   return {
    core,facing,legs,arms,
    height:1.03,style:'bat'
   };
  }

  const body=ball(
   facing,.19,skin,0,.2,0,'rat-body'
  );
  body.scale.set(.9,.65,1.35);

  const head=ball(
   facing,.105,skin,0,.22,.23,'rat-head'
  );
  head.scale.set(.85,.85,1.2);

  ball(
   facing,.028,material(0xb58d87),
   0,.21,.35,'nose'
  );

  for(const sign of [-1,1]){
   ball(
    facing,.052,skin,
    sign*.075,.31,.19,'ear'
   );
   ball(
    facing,.013,eye,
    sign*.065,.25,.29,'eye'
   );

   for(const z of [-.13,.14]){
    const leg=pivot(facing,sign*.13,.13,z);
    legs.push(leg);
    box(
     leg,.04,.1,.045,dark,
     0,-.05,0,'paw'
    );
   }
  }

  const tail=pivot(facing,0,.12,-.24);
  const tailMesh=mesh(
   tail,'CylinderGeometry',[.014,.02,.3,5],
   material(0xaa8c84),0,0,-.14,'tail'
  );
  tailMesh.rotation.x=Math.PI/2;

  return {
   core,facing,legs,arms,
   height:.68,style:'rat',tail
  };
 }

 function create(value,hero){
  if(closed){
   throw new Error('Figurenressourcen bereits freigegeben.');
  }

  const kind=figureKind(value,hero);
  if(!hero&&!SUPPORTED.has(kind))return null;

  const node=new T.Group();
  node.name=hero?'hero-model':'monster-model-'+kind;

  const rig=hero||kind==='goblin'||kind==='skeleton'
   ?humanoid(node,value,kind,hero)
   :creature(node,value,kind);

  const hp=pivot(node,0,rig.height,0);

  if(!hero){
   box(hp,.54,.045,.035,material(0x392831));
  }

  const bar=!hero
   ?box(
     hp,1,.035,.04,material(0xa95b59),
     0,0,.01,'health'
    )
   :null;

  if(!hero&&value.elite===true){
   const ring=mesh(
    node,'TorusGeometry',[.24,.016,6,20],
    material(0xd0af6d,.5),
    0,.025,0,'elite-ring'
   );
   ring.rotation.x=Math.PI/2;
   ring.castShadow=false;
  }

  let started=false;
  let targetX=0,targetZ=0,fromX=0,fromZ=0;
  let moveAt=-Infinity,heading=0;
  let lastHP=value.hp,hurtAt=-Infinity,disposed=false;

  function update(next,time){
   if(disposed)return;

   const x=next.x+.5,z=next.y+.5;
   const still=reduced.matches;

   if(!started){
    node.position.set(x,0,z);
    targetX=fromX=x;
    targetZ=fromZ=z;
    started=true;
   }

   if(x!==targetX||z!==targetZ){
    const dx=x-targetX,dz=z-targetZ;
    fromX=node.position.x;
    fromZ=node.position.z;

    if(Math.abs(dx)+Math.abs(dz)>2){
     fromX=x;
     fromZ=z;
    }

    heading=Math.atan2(dx,dz);
    targetX=x;
    targetZ=z;
    moveAt=time;
   }

   if(Number.isFinite(lastHP)
    &&Number.isFinite(next.hp)&&next.hp<lastHP){
    hurtAt=time;
   }
   lastHP=next.hp;

   const progress=still?1:
    Math.max(0,Math.min(1,(time-moveAt)/.17));
   const ease=progress*progress*(3-2*progress);

   node.position.set(
    fromX+(targetX-fromX)*ease,
    0,
    fromZ+(targetZ-fromZ)*ease
   );

   rig.facing.rotation.y=heading;

   const walking=!still&&time-moveAt<.24;
   const gait=walking
    ?Math.sin((time-moveAt)*30)*.65:0;

   rig.legs.forEach((part,i)=>{
    part.rotation.x=(i%2?1:-1)*gait;
   });
   rig.arms.forEach((part,i)=>{
    part.rotation.x=rig.style==='humanoid'
     ?(i%2?-1:1)*gait*.65:0;
   });

   rig.core.position.y=still?0:
    walking?Math.abs(gait)*.025:
    Math.sin(time*2)*.008;

   const hurt=!still&&time-hurtAt<.25
    ?Math.sin((time-hurtAt)*35)*.12:0;

   rig.core.rotation.z=hurt;
   rig.core.rotation.x=next.hp<=0?.8:0;

   if(rig.style==='slime'){
    const pulse=still?0:Math.sin(time*3)*.055;
    rig.body.scale.set(1.25+pulse,.8-pulse,1.1);
   }

   if(rig.style==='bat'){
    rig.arms.forEach((wing,i)=>{
     wing.rotation.z=still?0:
      (i?1:-1)*Math.sin(time*8)*.65;
    });
    rig.core.position.y=still?0:Math.sin(time*3)*.035;
   }

   if(rig.tail){
    rig.tail.rotation.y=still?0:Math.sin(time*5)*.2;
   }

   if(bar){
    const ratio=Number.isFinite(next.hp)
     &&Number.isFinite(next.maxHp)&&next.maxHp>0
     ?Math.max(0,Math.min(1,next.hp/next.maxHp)):0;

    bar.scale.x=.5*ratio;
    bar.position.x=-.25*(1-ratio);
   }
  }

  return {
   node,kind,update,
   dispose(){
    disposed=true;
    node.visible=false;
   }
  };
 }

 return {
  supports:(value,hero)=>
   hero||SUPPORTED.has(figureKind(value,false)),
  signature:figureSignature,
  create,
  dispose(){
   if(closed)return;
   closed=true;
   for(const g of geometries.values())g.dispose();
   for(const m of materials.values())m.dispose();
   geometries.clear();
   materials.clear();
  }
 };
}

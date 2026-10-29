/* Nachtfahrt: wiederhergestellte Lieferstadt mit Hochstraße und drei Vierteln. */
export function createCity(THREE,scene){
  const grid=[-240,-120,0,120,240],width=19,curveWidth=20,samples=[];
  const curve=new THREE.CatmullRomCurve3([
    [-240,-240],[-190,-303],[-110,-275],[-30,-317],
    [48,-268],[124,-312],[194,-270],[240,-240]
  ].map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const heightAt=t=>14*Math.sin(Math.PI*t)**2;
  const mat=(color,more={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...more});
  const roadMat=mat(0x172633,{roughness:.43,metalness:.14});
  const walk=mat(0x25333d),dark=mat(0x0d1926);
  const white=mat(0xdbe3d1,{emissive:0x434e3d,emissiveIntensity:.15});
  const teal=mat(0x58e8db,{emissive:0x19b0a7,emissiveIntensity:2});
  const orange=mat(0xffbd72,{emissive:0xe48738,emissiveIntensity:1.9});
  const red=mat(0xff4c5e,{emissive:0xea1b33,emissiveIntensity:2});
  const palettes=[
    [0x183847,0x244955,0x263e4d,0x152b39],
    [0x403246,0x403649,0x2f344c,0x4a3348],
    [0x3a3e40,0x344147,0x455049,0x343d45]
  ].map(row=>row.map(c=>mat(c)));
  const glass=[
    mat(0x78f0e1,{emissive:0x23b6ac,emissiveIntensity:1.3}),
    mat(0xf9c298,{emissive:0xd57861,emissiveIntensity:1.35}),
    mat(0xe5b976,{emissive:0xae7f3d,emissiveIntensity:1.1})
  ];
  const names=[
    'NACHTKIOSK','VINYL','GARAGE 7','MARKT',
    'BAR 24','KINO','REIFEN','TANKSTELLE',
    'CAFÉ NOVA','RAMEN','WERKSTATT','TEILELAGER',
    'ARCADE','SPÄTKAUF','DEPOT','HOTEL'
  ];
  function box(w,h,d,x,y,z,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.castShadow=h>1;mesh.receiveShadow=true;
    scene.add(mesh);return mesh;
  }
  function sign(text,x,y,z,color='#6ce6e0'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(4,20,35,.9)';ctx.fillRect(0,0,512,128);
    ctx.lineWidth=8;ctx.strokeStyle=color;ctx.strokeRect(4,4,504,120);
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 52px Arial';ctx.fillText(text,256,65,485);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(13,3.25),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true,depthWrite:false}));
    plane.position.set(x,y,z);plane.renderOrder=2;scene.add(plane);return plane;
  }
  function building(x,z,w,d,h,seed,district){
    box(w,h,d,x,h/2+.12,z,palettes[district][seed%4]);
    box(w+.6,.35,d+.6,x,h+.28,z,dark);
    const lit=mat(0xf0ae65,{emissive:0xd68c49,emissiveIntensity:1.25});
    const cool=mat(0x83bdd0,{emissive:0x4086a9,emissiveIntensity:.6});
    for(let floor=0;floor<Math.min(8,Math.floor(h/4));floor++){
      for(let j=0;j<Math.min(5,Math.floor(w/6));j++){
        if((floor*7+j+seed)%4===0)continue;
        const px=x-w/2+4+j*6,py=3.3+floor*3.7;
        if(px>x+w/2-2||py>h-1)continue;
        box(1.9,1.4,.08,px,py,z+d/2+.055,(floor+j+seed)%3?lit:cool);
      }
    }
    if(seed%3===0)box(2,.8,2,x,h+.75,z,dark);
  }
  function shop(x,z,index,district){
    const front=z+38,accent=[teal,red,orange][district];
    box(24,2.9,.14,x-18,2.25,front+.25,glass[district]);
    box(2.7,3,.18,x-18,2.1,front+.39,dark);
    box(29,.23,2.2,x-18,4.25,front+1.25,accent);
    sign(names[index],x-18,6.4,front+.55,['#6ce6e0','#ff8a99','#ffc27f'][district]);
  }
  function nearest(x,z){
    let best=Infinity,along=0;
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i],dx=b.x-a.x,dz=b.z-a.z;
      const u=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
      const px=a.x+u*dx,pz=a.z+u*dz,d=(x-px)**2+(z-pz)**2;
      if(d<best){best=d;along=a.t+u*(b.t-a.t)}
    }
    return {distance:Math.sqrt(best),t:along};
  }
  function scenic(){
    const verts=[],faces=[],count=160;
    for(let i=0;i<=count;i++){
      const t=i/count,p=curve.getPoint(t),dir=curve.getTangent(t).normalize();
      const nx=-dir.z,nz=dir.x,h=heightAt(t);samples.push({x:p.x,z:p.z,t});
      verts.push(p.x+nx*curveWidth/2,h+.18,p.z+nz*curveWidth/2);
      verts.push(p.x-nx*curveWidth/2,h+.18,p.z-nz*curveWidth/2);
      if(i<count){const k=i*2;faces.push(k,k+1,k+2,k+1,k+3,k+2)}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex(faces);geo.computeVertexNormals();
    const road=new THREE.Mesh(geo,mat(0x1b303a,{roughness:.47,metalness:.09,side:THREE.DoubleSide}));
    road.receiveShadow=true;road.castShadow=true;scene.add(road);
    const supports=mat(0x394b53);
    for(let i=8;i<count-8;i+=12){const p=samples[i],h=heightAt(p.t);if(h>1)box(2,h,2,p.x,h/2,p.z,supports)}
    for(let i=6;i<count-6;i+=8){
      const a=samples[i],b=samples[i+1];
      const mark=box(.24,.015,4,a.x,heightAt(a.t)+.2,a.z,white);
      mark.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
    }
    for(const side of [-1,1]){
      const v=[],f=[];
      for(let i=0;i<samples.length;i++){
        const p=samples[i],dir=curve.getTangent(p.t).normalize();
        const nx=-dir.z*side,nz=dir.x*side,base=heightAt(p.t)+.18;
        for(const offset of [curveWidth/2+.07,curveWidth/2+.57]){
          v.push(p.x+nx*offset,base,p.z+nz*offset);
          v.push(p.x+nx*offset,base+1.15,p.z+nz*offset);
        }
        if(i<samples.length-1){const k=i*4;f.push(k,k+4,k+1,k+1,k+4,k+5,k+2,k+3,k+6,k+3,k+7,k+6,k+1,k+5,k+3,k+3,k+5,k+7)}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
      g.setIndex(f);g.computeVertexNormals();scene.add(new THREE.Mesh(g,mat(0x74818b,{side:THREE.DoubleSide})));
    }
    const steel=mat(0x536a73,{metalness:.5}),bulb=mat(0xffdb9a,{emissive:0xffae5d,emissiveIntensity:2.6});
    for(let i=12;i<samples.length-12;i+=18){
      const p=samples[i],dir=curve.getTangent(p.t).normalize(),side=Math.floor(i/18)%2?1:-1;
      const nx=-dir.z*side,nz=dir.x*side,y=heightAt(p.t)+.18;
      const px=p.x+nx*(curveWidth/2+1.9),pz=p.z+nz*(curveWidth/2+1.9);
      box(.35,7,.35,px,y+3.5,pz,steel);
      const lx=px-nx*2.15,lz=pz-nz*2.15;
      const lamp=box(.9,.25,.8,lx,y+7,lz,bulb);lamp.castShadow=false;
      const glow=new THREE.PointLight(0xffc984,4.5,35,2);glow.position.set(lx,y+6.8,lz);scene.add(glow);
    }
    const north=sign('NORDKURVE',-222,9,-249,'#ffc27f');north.rotation.y=Math.PI/2;
  }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),mat(0x0d1923));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  for(const c of grid){
    box(width,.09,500,c,.04,0,roadMat);box(500,.09,width,0,.05,c,roadMat);
    for(let t=-240;t<240;t+=20){
      if(grid.some(s=>Math.abs(s-t)<15))continue;
      box(.22,.012,7,c,.105,t,white);box(7,.012,.22,t,.115,c,white);
    }
  }
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){
    const x=(grid[i]+grid[i+1])/2,z=(grid[j]+grid[j+1])/2,k=i*4+j;
    const district=j<2?(i<2?0:1):2;
    box(97,.22,97,x,.05,z,walk);
    building(x-22,z-22,37,38,15+(k*7)%19,k,district);
    building(x+22,z-20,34,32,14+(k*11)%18,k+2,district);
    building(x-18,z+22,42,32,12+(k*13)%22,k+4,district);
    building(x+24,z+22,30,37,17+(k*5)%20,k+6,district);
    shop(x,z,k,district);
  }
  box(40,12,32,-274,6,0,mat(0x273c46));box(1,8,14,-253.4,4,0,teal);
  const garage=sign('GARAGE',-251.9,9.4,0);garage.rotation.y=Math.PI/2;
  for(let x=-240;x<=240;x+=120)for(let z=-240;z<=240;z+=120){
    if((x+z)%240!==0)continue;
    const post=box(.5,9,.5,x+12,4.5,z+12,mat(0x344858));post.castShadow=false;
    box(2.4,.25,1,x+11,9,z+12,orange);
  }
  scenic();
  const skyline=mat(0x111e2b);
  for(let t=-430;t<=430;t+=38){
    box(27,19+Math.abs(t*7)%24,25,t,10,-411,skyline);
    box(25,20+Math.abs(t*11)%29,24,t,11,411,skyline);
  }
  // Rennstrecken-Einfahrt an der nordwestlichen Straßenkreuzung, ohne die Hochstraße zu blockieren.
  box(1.4,10,1.4,-248,5,-240,orange);
  box(1.4,10,1.4,-232,5,-240,orange);
  box(18,1,1.4,-240,10,-240,orange);
  const racing=sign('RENN-NACHT',-240,13,-240,'#ffc27f');racing.rotation.y=Math.PI/2;
  const entry=new THREE.Mesh(new THREE.RingGeometry(5,7,32),new THREE.MeshBasicMaterial({color:0xffbb70,transparent:true,opacity:.75,side:THREE.DoubleSide}));
  entry.rotation.x=-Math.PI/2;entry.position.set(-240,.2,-240);scene.add(entry);
  return {
    start:{x:-240,z:0,heading:0},gate:{x:-240,z:-240,radius:8},
    isRoad(x,z){
      const inside=Math.abs(x)<=249&&Math.abs(z)<=249;
      const normal=inside&&(grid.some(n=>Math.abs(x-n)<width/2-1)||grid.some(n=>Math.abs(z-n)<width/2-1));
      return normal||nearest(x,z).distance<curveWidth/2-2;
    },
    height(x,z){
      if(z>-249)return 0;
      const n=nearest(x,z);
      return n.distance<curveWidth/2-2?heightAt(n.t):0;
    }
  };
}

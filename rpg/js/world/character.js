const motionPreference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
const motionTracks=new WeakMap();
export function heroPose(context,player,time=performance.now()/1000,reduce=motionPreference?.matches===true){
 const still={step:0,bob:0};
 if(context.canvas?.id!=='stage'||reduce||player.hp<=0||!Number.isFinite(time)||!Number.isFinite(player.x)||!Number.isFinite(player.y)){motionTracks.delete(context);return still;}
 let track=motionTracks.get(context);
 if(!track||track.player!==player||time-track.seen>.5||time<track.seen){track={player,x:player.x,y:player.y,start:-Infinity,sign:1,seen:time};motionTracks.set(context,track);}
 if(track.x!==player.x||track.y!==player.y){const distance=Math.abs(track.x-player.x)+Math.abs(track.y-player.y);track.start=distance===1?time:-Infinity;track.sign*=-1;track.x=player.x;track.y=player.y;}
 track.seen=time;
 const age=time-track.start,step=age>=0&&age<.18?(Math.sin(age/.18*Math.PI)*track.sign||0):0;
 return {step,bob:step?-.5*Math.abs(step):Math.sin(time*2)*.2};
}
export function getWeaponVisual(id){
 if(!id)return 'none';
 if(['arcane_staff','runewood_staff','eclipse_staff','emergency_mage'].includes(id)||/^order_mage_(?:[1-9]|1\d|20)$/.test(id))return 'staff';
 if(['dagger','bone_dagger','night_fang','emergency_rogue'].includes(id)||/^order_rogue_(?:[1-9]|1\d|20)$/.test(id))return 'dagger';
 return id==='runic_blade'?'runic':'sword';
}
export function drawCharacter(c,p,x,y,size=32){
 const pose=heroPose(c,p),step=pose.step;
 const cls=['warrior','mage','rogue'].includes(p.heroClass)?p.heroClass:'warrior',e=p.equipped||{};
 c.save();c.translate(x,y);c.scale(size/32,size/32);c.lineJoin='round';
 const poly=(points,fill,stroke='#080b12')=>{c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=.8;c.stroke();};
 const rect=(a,b,w,h,color)=>{c.fillStyle=color;c.fillRect(a,b,w,h);};
 c.fillStyle='#0007';c.beginPath();c.ellipse(16,29,10,2,0,0,Math.PI*2);c.fill();
 c.translate(0,pose.bob);
 const base=cls==='mage'?'#51438c':cls==='rogue'?'#253946':'#594238';
 if(cls==='warrior')poly([[8,11],[24,11],[25,24],[7,24]],'#392d30');
 else if(cls==='rogue')poly([[11,9],[21,9],[24,28],[17,25],[8,28]],'#111b28');
 else poly([[10,10],[22,10],[25,28],[7,28]],'#302b55');
 rect(11,23+step,4,6,'#242333');rect(18,23-step,4,6,'#242333');
 const boots=e.feet==='leather_boots'?'#99623c':e.feet?'#566473':'#3b3030';rect(10,27+step,6,3,boots);rect(18,27-step,6,3,boots);
 if(e.feet){rect(10,27+step,6,1,'#b6a27a');rect(18,27-step,6,1,'#b6a27a');}
 if(cls==='mage'){
  poly([[12,11],[20,11],[23,27],[9,27]],'#7560b0');
  rect(14,13,2,12,'#a18bc9');rect(10,25,12,2,'#cfb77a');
 }else{
  poly(cls==='warrior'?[[9,11],[23,11],[22,23],[10,23]]:[[11,11],[21,11],[21,23],[11,23]],base);
  if(cls==='warrior'){poly([[7,11],[12,10],[12,15],[7,15]],'#78604a');poly([[20,10],[25,11],[25,15],[20,15]],'#78604a');rect(14,12,4,7,'#8b7051');}
  else{poly([[11,12],[14,11],[21,20],[19,22]],'#655548');rect(12,15,2,5,'#94a0a4');}
 }
 rect(10,21,12,2,'#b18a48');rect(15,21,3,2,'#e3c58b');
 const armor=e.body,plate=armor==='knight_armor'||armor==='warden_plate';
 if(armor){poly([[10,11],[22,11],[21,21],[11,21]],plate?'#9bafbf':armor==='bone_mail'?'#8b887b':'#566976');if(plate){poly([[8,11],[12,11],[11,15],[7,14]],'#bed0d7');poly([[20,11],[24,11],[25,14],[21,15]],'#bed0d7');rect(15,12,2,9,'#d0dde3');}else{for(let j=12;j<21;j+=2)for(let i=11;i<21;i+=3)rect(i,j,1,1,'#b1bbc1');}}
 poly([[9,12],[7,13],[7,21],[10,21]],armor?'#728795':base);poly([[22,12],[25,13],[25,21],[22,21]],armor?'#728795':base);
 rect(7,20,3,3,'#cf9a78');rect(22,20,3,3,'#cf9a78');
 poly([[12,4],[20,4],[21,9],[18,12],[14,12],[11,9]],'#d4a783');
 if(cls!=='warrior')poly([[10,9],[12,3],[16,1],[20,3],[22,9],[19,7],[13,7]],cls==='mage'?'#66509b':'#182936');else poly([[11,6],[12,3],[19,3],[21,6]],'#503d31');
 rect(13,7,2,1,'#c3e8fa');rect(18,7,2,1,'#c3e8fa');if(cls==='rogue'){rect(12,9,8,3,'#152631');rect(12,9,8,1,'#425467');}
 if(e.head==='iron_helmet'||e.head==='warden_helmet'||/^order_head_(?:[1-9]|1\d|20)$/.test(e.head||'')){poly([[10,7],[11,3],[16,1],[21,3],[22,7],[21,12],[18,12],[18,8],[14,8],[14,12],[11,12]],'#91a6b4');rect(15,2,2,6,'#d9e4e9');rect(12,7,8,1,'#121c2a');}
 if(e.offhand==='iron_shield'||e.offhand==='runic_shield'||/^order_offhand_(?:[1-9]|1\d|20)$/.test(e.offhand||'')){poly([[4,16],[10,14],[13,17],[11,25],[7,28],[3,24]],'#748b9d','#d0dde2');rect(7,17,2,8,e.offhand==='runic_shield'?'#9ff5ff':'#c9b57c');}
 const weapon=e.mainhand,visual=getWeaponVisual(weapon);
 if(visual==='staff'){const crystal=weapon==='eclipse_staff'?'#bd83db':weapon==='runewood_staff'?'#91c8bc':'#9b8aff';rect(25,7,2,22,'#936137');rect(24,10,4,2,'#d9af68');poly([[23,5],[26,2],[29,5],[26,9]],crystal,'#d6ceff');rect(26,4,1,3,'#efffff');}
 else if(visual!=='none'){const dagger=visual==='dagger',runic=visual==='runic';c.save();c.translate(25,21);c.rotate(.25);rect(-1,0,2,5,'#9e6d3d');rect(-3,-1,6,2,'#d6b16c');poly([[-1,-2],[-1,dagger?-8:-16],[0,dagger?-10:-19],[2,dagger?-8:-16],[2,-2]],runic?'#9ff5ff':weapon==='blacksteel_sword'?'#81929f':'#d6e4ec');if(runic){rect(0,-14,1,10,'#4ce4ff');c.shadowColor='#62eaff';c.shadowBlur=4;rect(0,-12,1,2,'#fff');}c.restore();}
 if(e.ring==='ruby_ring'||e.ring==='obsidian_ring'||/^order_ring_(?:[1-9]|1\d|20)$/.test(e.ring||'')){c.fillStyle=e.ring==='obsidian_ring'?'#b78fdf':'#ff617e';c.beginPath();c.arc(23,21,1.3,0,Math.PI*2);c.fill();}c.restore();
}

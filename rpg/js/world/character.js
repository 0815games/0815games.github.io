export function drawCharacter(c,p,x,y,size=32){
 const cls=p.heroClass||'warrior',e=p.equipped||{};
 c.save();c.translate(x,y);c.scale(size/32,size/32);c.lineJoin='round';
 const poly=(points,fill,stroke='#080b12')=>{c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=.8;c.stroke();};
 const rect=(a,b,w,h,color)=>{c.fillStyle=color;c.fillRect(a,b,w,h);};
 c.fillStyle='#0007';c.beginPath();c.ellipse(16,29,10,2,0,0,Math.PI*2);c.fill();
 const base=cls==='mage'?'#51438c':cls==='rogue'?'#253946':'#594238';
 poly([[10,10],[22,10],[25,26],[7,26]],cls==='rogue'?'#111b28':base);
 rect(11,23,4,6,'#242333');rect(18,23,4,6,'#242333');
 const boots=e.feet==='leather_boots'?'#99623c':'#3b3030';rect(10,27,6,3,boots);rect(18,27,6,3,boots);
 if(cls==='mage')poly([[12,11],[20,11],[23,27],[9,27]],'#7560b0');
 else poly([[10,11],[22,11],[21,23],[11,23]],base);
 rect(10,21,12,2,'#b18a48');
 const armor=e.body;
 if(armor){const plate=armor==='knight_armor';poly([[10,11],[22,11],[21,21],[11,21]],plate?'#9bafbf':'#566976');if(plate){poly([[8,11],[12,11],[11,15],[7,14]],'#bed0d7');poly([[20,11],[24,11],[25,14],[21,15]],'#bed0d7');rect(15,12,2,9,'#d0dde3');}else{for(let j=12;j<21;j+=2)for(let i=11;i<21;i+=3)rect(i,j,1,1,'#b1bbc1');}}
 poly([[9,12],[7,13],[7,21],[10,21]],armor?'#728795':base);poly([[22,12],[25,13],[25,21],[22,21]],armor?'#728795':base);
 rect(7,20,3,3,'#cf9a78');rect(22,20,3,3,'#cf9a78');
 poly([[12,4],[20,4],[21,9],[18,12],[14,12],[11,9]],'#d4a783');
 if(cls!=='warrior')poly([[10,9],[12,3],[16,1],[20,3],[22,9],[19,7],[13,7]],cls==='mage'?'#66509b':'#182936');
 else poly([[11,6],[12,3],[19,3],[21,6]],'#503d31');
 rect(13,7,2,1,'#c3e8fa');rect(18,7,2,1,'#c3e8fa');
 if(cls==='rogue')rect(12,9,8,3,'#152631');
 if(e.head==='iron_helmet'){poly([[10,7],[11,3],[16,1],[21,3],[22,7],[21,12],[18,12],[18,8],[14,8],[14,12],[11,12]],'#91a6b4');rect(15,2,2,6,'#d9e4e9');rect(12,7,8,1,'#121c2a');}
 if(e.offhand==='iron_shield')poly([[4,16],[10,14],[13,17],[11,25],[7,28],[3,24]],'#748b9d','#d0dde2');
 const weapon=e.mainhand;
 if(weapon){const dagger=weapon==='dagger',runic=weapon==='runic_blade';c.save();c.translate(25,21);c.rotate(.25);rect(-1,0,2,5,'#9e6d3d');rect(-3,-1,6,2,'#d6b16c');poly([[-1,-2],[-1,dagger?-8:-16],[0,dagger?-10:-19],[2,dagger?-8:-16],[2,-2]],runic?'#9ff5ff':'#d6e4ec');if(runic){rect(0,-14,1,10,'#4ce4ff');c.shadowColor='#62eaff';c.shadowBlur=4;rect(0,-12,1,2,'#fff');}c.restore();}
 if(e.ring==='ruby_ring'){c.fillStyle='#ff617e';c.beginPath();c.arc(23,21,1.3,0,Math.PI*2);c.fill();}
 c.restore();
}

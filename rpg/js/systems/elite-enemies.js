export function rollElite(world,rnd=Math.random){
 if(world.eliteRollDone===true)return null;
 world.eliteRollDone=true;
 if(world.depth<3||world.isBossFloor)return null;
 const monsters=world.monsters||[];
 if(monsters.some(m=>m.elite===true))return null;
 const candidates=monsters.filter(m=>
  m.id!=='boss'&&m.hp>0&&m.maxHp>0
 );
 if(!candidates.length||rnd()>=.30)return null;
 const m=candidates[Math.min(
  candidates.length-1,Math.floor(rnd()*candidates.length)
 )];
 const ratio=Math.max(0,Math.min(1,m.hp/m.maxHp));
 m.elite=true;
 m.eliteVersion='v0.6.6';
 m.name='Elite: '+m.name;
 m.maxHp=Math.round(m.maxHp*1.40);
 m.hp=Math.max(1,Math.round(m.maxHp*ratio));
 m.atk=Math.round(m.atk*1.15);
 m.xp=Math.round(m.xp*1.50);
 m.gold=Math.round(m.gold*1.50);
 return m;
}

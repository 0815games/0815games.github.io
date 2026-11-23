import {SKILL_PATH_MAP} from './skills.mjs?v=20261123-blocke2';

export const COMBOS=[
  {id:'assault',name:'Assault Barrage',paths:['assault'],description:'Assault abilities launch a ground salvo against hit enemies, pinning them and striking the strongest target.'},
  {id:'engineer',name:'Combat Grid',paths:['engineer'],description:'Engineer abilities grant extra supplies and suppress enemies for 2 seconds per tier.'},
  {id:'logistics',name:'Mobile Convoy',paths:['logistics'],description:'Logistics abilities grant bonus movement speed for 5 seconds and slowly repair the bunker.'},
  {id:'medic',name:'Combat Hospital',paths:['medic'],description:'Medic abilities heal 1 bunker health per living enemy per tier and grant +25% tower overdrive.'},
  {id:'recon',name:'Vanguard Sweep',paths:['recon'],description:'Recon abilities pin up to 8 enemies and extend active suppression.'},
  {id:'airDefense',name:'Flak Resonance',paths:['airDefense'],description:'Air Defense abilities unleash bonus anti-air flak blasts, crack heavy ground armor, and paint all targets.'}
];

export const CAPSTONES=Object.freeze({
  assault:{id:6,name:'War Hero',description:'Every fourth soldier shot chains 24 damage to another nearby enemy.'},
  engineer:{id:20,name:'War Machine',description:'Every fourth shot from your towers deals 22 splash damage to a nearby enemy.'},
  logistics:{id:34,name:'War Economy',description:'Gain 12 personal supplies after each completed wave.'},
  medic:{id:48,name:'Bunker Guardian',description:'Once per wave, restore 22 bunker health when it falls below 35%, if it survives the hit.'},
  recon:{id:62,name:'Ghost Operative',description:'Every fourth soldier shot pins its target for 3 seconds.'},
  airDefense:{id:76,name:'Sky Sovereign',description:'Attacks deal +20% damage to Air-Defense-marked enemies and every fifth soldier shot refreshes a 3s mark.'}
});

export function comboTier(build,id){
  if(!build||!build.classId)return 0;
  if(typeof id==='string'&&id!==build.classId)return 0;
  if(typeof id==='number'){
    const path=SKILL_PATH_MAP[build.classId];
    if(!path)return 0;
  }
  const e=build.extra||[];
  return (e[11]?1:0)+(e[12]?1:0)+(e[13]?1:0);
}

export function comboCue(player,name,x=player.x,y=player.y){
  const counts=player.comboCounts||(player.comboCounts={});
  for(const key of name.split(' + '))counts[key]=(counts[key]||0)+1;
  player.comboCue={seq:(player.comboCue?.seq||0)+1,name,x,y};
}

export function activateCombos(state,id,active,addSupplies){
  const p=state.players[id],triggered=[];
  if(!p?.skills?.classId||p.skills.classId!==active)return triggered;
  const combo=COMBOS.find(c=>c.id===active);
  const tier=comboTier(p.skills,active);
  if(!combo||!tier)return triggered;
  const alive=()=>state.enemies.filter(e=>e.hp>0);
  let applied=false;
  switch(active){
    case 'assault':{
      for(const e of alive()){
        e.hp-=8*tier;
        e.pinned=Math.max(e.pinned||0,1.5+0.5*tier);
        applied=true;
      }
      if(tier>=2){
        const strongest=alive().reduce((a,b)=>!a||b.hp>a.hp?b:a,null);
        if(strongest){strongest.hp-=8*tier;applied=true;}
      }
      break;
    }
    case 'engineer':{
      addSupplies(state,id,4*tier);
      state.suppression=Math.max(state.suppression||0,2*tier);
      applied=true;
      break;
    }
    case 'logistics':{
      p.mobileSupply={remaining:5,bonus:15*tier};
      p.healingField={remaining:6,rate:tier*0.5};
      applied=true;
      break;
    }
    case 'medic':{
      const healing=Math.min(6,alive().length)*tier,old=state.hp;
      state.hp=Math.min(state.maxHp??100,state.hp+healing);
      if(state.towers.some(t=>t.ownerId===id)){
        if(!(p.overdrive>0)){p.overdrive=3+tier;p.overdriveFactor=1.25;}
        else p.overdrive=Math.max(p.overdrive,3+tier);
        applied=true;
      }
      if(state.hp>old)applied=true;
      break;
    }
    case 'recon':{
      for(const e of alive().slice(0,8)){e.pinned=Math.max(e.pinned||0,2+tier);applied=true;}
      if(state.suppression>0){state.suppression+=1.5*tier;applied=true;}
      break;
    }
    case 'airDefense':{
      for(const e of alive()){
        const air=e.kind==='plane'||e.baseKind==='plane';
        const heavy=e.kind==='tank'||e.boss;
        if(air)e.hp-=12*tier;
        else if(heavy)e.hp-=6*tier;
        e.marked=Math.max(e.marked||0,3+tier);
        e.markedByAirDefense=true;
        applied=true;
      }
      break;
    }
  }
  if(applied){
    triggered.push(combo.name);
    comboCue(p,triggered.join(' + '));
  }
  return triggered;
}

// These effects live on existing paid nodes: no save migration or free points.
export const COMBOS=[
 {id:25,name:'Siege Command',paths:['assault','engineer'],description:'Your tower hits mark enemies for 5 seconds. Assault or Engineer abilities detonate your marks for 10 damage per tier.'},
 {id:28,name:'Combat Logistics',paths:['engineer','logistics'],description:'Engineer and Logistics abilities grant you 4 supplies per tier.'},
 {id:31,name:'Humanitarian Supply',paths:['logistics','medic'],description:'Logistics and Medic abilities heal the bunker for 3 health per tier over 6 seconds while a wave is running.'},
 {id:34,name:'Rapid Response',paths:['medic','recon'],description:'Medic abilities suppress enemies for 2 seconds per tier; Recon abilities extend suppression by that amount.'},
 {id:37,name:'Vanguard',paths:['recon','assault'],description:'Recon and Assault abilities pin up to 8 living enemies for 2 seconds plus 1 second per tier.'},
 {id:40,name:'Supply Shock',paths:['assault','logistics'],description:'Assault and Logistics abilities strike the strongest living enemy for 10 damage per tier.'},
 {id:43,name:'Combat Medics',paths:['engineer','medic'],description:'Engineer and Medic abilities give your towers 25% extra damage for 3 seconds plus 1 second per tier, without weakening existing overdrive.'},
 {id:46,name:'Mobile Supply',paths:['logistics','recon'],description:'Logistics and Recon abilities grant you 15 movement speed per tier for 5 seconds.'},
 {id:49,name:'Combat Hospital',paths:['medic','assault'],description:'Medic and Assault abilities restore 1 bunker health per living enemy per tier, up to 6 health per tier.'},
 {id:52,name:'Recon Engineering',paths:['recon','engineer'],description:'Engineer abilities suppress enemies for 2 seconds per tier. Your towers deal 8% extra damage per tier while enemies are suppressed.'}
];
export const CAPSTONES={
 4:'Every fifth soldier shot chains 20 damage to another nearby enemy.',
 9:'Every fourth shot from your towers deals 20 splash damage to a nearby enemy.',
 14:'Gain 10 personal supplies after each completed wave.',
 19:'Once per wave, restore 20 bunker health when it falls below 30%, if it survives the hit.',
 24:'Every fourth soldier shot pins its target for 3 seconds.'
};
export function comboTier(build,id){return (build?.web?.[id]?1:0)+(build?.web?.[id+1]?1:0)+(build?.web?.[id+2]?1:0);}
// Per-player run record: credited by the host's authoritative simulation and shown on the results screen.
export function playerRecord(p){return p.record||(p.record={heroDamage:0,towerDamage:0,kills:0,supplies:0,combos:0});}
export function comboCue(player,name,x=player.x,y=player.y,count=1){player.comboCue={seq:(player.comboCue?.seq||0)+1,name,x,y};playerRecord(player).combos+=count;}
export function activateCombos(state,id,active,addSupplies){
  const p=state.players[id],triggered=[];
  for(const combo of COMBOS){
    const tier=comboTier(p.skills,combo.id);if(!tier||!combo.paths.includes(active))continue;
    let applied=false;const alive=()=>state.enemies.filter(e=>e.hp>0);
    switch(combo.id){
      case 25: for(const e of alive()){const mark=e.siegeMarks?.find(m=>m.id===id&&m.time>0);if(mark){e.hp-=10*tier;mark.time=0;applied=true;}}break;
      case 28: addSupplies(state,id,4*tier);applied=true;break;
      case 31: p.healingField={remaining:6,rate:tier*.5};applied=true;break;
      case 34: if(active==='recon')state.suppression=(state.suppression||0)+2*tier;else state.suppression=Math.max(state.suppression||0,2*tier);applied=true;break;
      case 37: for(const e of alive().slice(0,8)){e.pinned=Math.max(e.pinned||0,2+tier);applied=true;}break;
      case 40: {const target=alive().reduce((a,b)=>!a||b.hp>a.hp?b:a,null);if(target){target.hp-=10*tier;applied=true;}break;}
      case 43: if(state.towers.some(t=>t.ownerId===id)){if(!(p.overdrive>0)){p.overdrive=3+tier;p.overdriveFactor=1.25;}else p.overdrive=Math.max(p.overdrive,3+tier);applied=true;}break;
      case 46: p.mobileSupply={remaining:5,bonus:15*tier};applied=true;break;
      case 49: {const healing=Math.min(6,alive().length)*tier,old=state.hp;state.hp=Math.min(state.maxHp??100,state.hp+healing);applied=state.hp>old;break;}
      case 52: if(active==='engineer'){state.suppression=Math.max(state.suppression||0,2*tier);applied=true;}else if(state.suppression>0)applied=true;break;
    }
    if(applied)triggered.push(combo.name);
  }
  if(triggered.length)comboCue(p,triggered.join(' + '),p.x,p.y,triggered.length);return triggered;
}

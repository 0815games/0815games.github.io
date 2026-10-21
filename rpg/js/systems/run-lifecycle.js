const SLOTS=['head','body','mainhand','offhand','feet','ring'];

export function ensureRunIdentity(player){
 if(typeof player.runId!=='string'||!player.runId.trim()){
  player.runId=crypto.randomUUID();
 }
 return player.runId;
}

export function beginRun(player){
 player.runId=crypto.randomUUID();
 player.deathReceipt=null;
 player.needsPreparation=false;
 return player.runId;
}

export function processRunDeath(player,meta,depth){
 const runId=ensureRunIdentity(player);
 if(player.needsPreparation||player.deathReceipt?.runId===runId)return null;
 const gold=Number.isFinite(player.gold)?Math.max(0,player.gold):0;
 const receipt={runId,gold,depth:Number.isFinite(depth)?Math.max(1,depth):1};
 meta.gold=(Number.isFinite(meta.gold)?Math.max(0,meta.gold):0)+gold;
 meta.bestDepth=Math.max(meta.bestDepth||1,receipt.depth);
 player.deathReceipt=receipt;
 player.lastRunGold=gold;
 player.gold=0;
 player.inventory=[];
 player.equipped=Object.fromEntries(SLOTS.map(slot=>[slot,null]));
 player.hp=player.maxHp;
 player.mp=player.maxMp;
 player.buffs={shield:0,block:false,evade:false};
 player.cooldowns={};
 player.preparationBought={};
 player.needsPreparation=true;
 return receipt;
}

export function createRestartPlayer(player,fallbackWeapon){
 const next=structuredClone(player);
 if(!next.equipped.mainhand)next.equipped.mainhand=fallbackWeapon;
 beginRun(next);
 next.hp=next.maxHp;
 next.mp=next.maxMp;
 next.buffs={shield:0,block:false,evade:false};
 next.cooldowns={};
 return next;
}

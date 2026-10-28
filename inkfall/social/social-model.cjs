"use strict";
const TTL=7*24*60*60*1000;
const requireThat=(ok,message)=>{if(!ok)throw Error(message);};
function pair(actor,target){
 const valid=x=>typeof x==='string'&&x.length>=1&&x.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(x);
 requireThat(valid(actor)&&valid(target)&&actor!==target,'invalid-participants');
 return [actor,target].sort();
}
function reduceRelationship(current,{actorUid,targetUid,action,now},accounts){
 const [a,b]=pair(actorUid,targetUid);
 requireThat(accounts instanceof Set&&accounts.has(a)&&accounts.has(b),'missing-account');
 requireThat(Number.isSafeInteger(now)&&now>=0,'invalid-time');
 requireThat(['request','accept','decline','cancel','remove','block','unblock'].includes(action),'invalid-action');
 const old=current?JSON.parse(JSON.stringify(current)):{schemaVersion:1,a,b,status:'none',blockedBy:{},revision:0,createdAt:now,updatedAt:now};
 requireThat(old.a===a&&old.b===b&&old.schemaVersion===1,'wrong-pair');
 requireThat(Number.isSafeInteger(old.revision)&&now>=old.updatedAt,'invalid-order');
 const next=JSON.parse(JSON.stringify(old));
 const blocked=Object.values(next.blockedBy||{}).some(x=>x===true);
 if(action==='block'){
  if(next.blockedBy?.[actorUid]===true)return old;
  next.blockedBy={...next.blockedBy,[actorUid]:true};next.status='blocked';
  delete next.requestedBy;delete next.expiresAt;delete next.friendSince;
 }else if(action==='unblock'){
  if(next.blockedBy?.[actorUid]!==true)return old;
  delete next.blockedBy[actorUid];next.status=Object.values(next.blockedBy).some(x=>x===true)?'blocked':'none';
 }else{
  requireThat(!blocked,'blocked');
  if(action==='request'){
   if(next.status==='friends')return old;
   if(next.status==='pending'&&now<next.expiresAt){requireThat(next.requestedBy===actorUid,'incoming-request-exists');return old;}
   next.status='pending';next.requestedBy=actorUid;next.expiresAt=now+TTL;
  }else if(action==='accept'){
   if(next.status==='friends')return old;
   requireThat(next.status==='pending'&&now<next.expiresAt,'no-live-request');
   requireThat(next.requestedBy===targetUid,'recipient-only');
   next.status='friends';next.friendSince=now;delete next.requestedBy;delete next.expiresAt;
  }else if(action==='cancel'||action==='decline'){
   requireThat(next.status==='pending','no-request');
   requireThat(action==='cancel'?next.requestedBy===actorUid:next.requestedBy===targetUid,'wrong-actor');
   next.status='none';delete next.requestedBy;delete next.expiresAt;
  }else if(action==='remove'){
   if(next.status!=='friends')return old;
   next.status='none';delete next.friendSince;
  }
 }
 next.revision++;next.updatedAt=now;return next;
}
function projectCharacter(classId,source,now){
 requireThat(['knight','mage'].includes(classId)&&source&&typeof source==='object','invalid-character');
 const integer=(value,min,max)=>{requireThat(Number.isSafeInteger(value)&&value>=min&&value<=max,'invalid-character-number');return value;};
 const name=typeof source.heroName==='string'?source.heroName.trim():'';
 const heroName=name.length>=3&&name.length<=20&&!/[\u0000-\u001f\u007f]/.test(name)?name:classId==='mage'?'Elementarmagier':'Ritter';
 const skills=Object.fromEntries(Object.entries(source.skills||{}).filter(([id,v])=>/^(blade|arcane|bastion|shadow|wealth|band)[1-4]$/.test(id)&&v===true));
 const result={schemaVersion:1,heroClass:classId,heroName,level:integer(source.level,1,999),xp:integer(source.xp,0,999999999),skillPoints:integer(source.skillPoints,0,999),skills,updatedAt:integer(now,0,Number.MAX_SAFE_INTEGER),progressSource:'client-save'};
 if(Number.isSafeInteger(source.soloRun?.wave)&&source.soloRun.wave>=0&&source.soloRun.wave<=999)result.checkpointWave=source.soloRun.wave;
 return result;
}
module.exports={pair,reduceRelationship,projectCharacter,TTL};

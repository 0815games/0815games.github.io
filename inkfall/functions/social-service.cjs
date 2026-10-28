"use strict";
const {randomBytes}=require("node:crypto");
const {pair,reduceRelationship,projectCharacter}=require("../social/social-model.cjs");
class SocialError extends Error {constructor(code,message){super(message);this.code=code;}}
const fail=(code,message)=>{throw new SocialError(code,message);};
const uid=value=>{if(typeof value!=="string"||value.length<1||value.length>128||/[.#$\[\]/\u0000-\u001f\u007f]/.test(value))fail("invalid-argument","Ungültige Account-ID.");return value;};
function payload(data,keys){if(!data||typeof data!=="object"||Array.isArray(data)||Object.keys(data).some(key=>!keys.includes(key)))fail("invalid-argument","Ungültige Anfrage.");return data;}
function createSocialService({db,clock=Date.now,makeCode=()=>randomBytes(18).toString("base64url"),limit=30}){
 const read=async path=>(await db.ref(path).get()).val();
 function actor(value){if(!value)fail("unauthenticated","Bitte anmelden.");return uid(value);}
 async function budget(id){
  const now=clock(),window=Math.floor(now/60000);
  const result=await db.ref("social/limits/"+id).transaction(current=>{
   if(current?.window===window&&current.count>=limit)return;
   return {window,count:current?.window===window?current.count+1:1};
  });
  if(!result.committed)fail("resource-exhausted","Zu viele Aktionen. Bitte später erneut versuchen.");
 }
 async function account(id){const profile=await read("users/"+id+"/profile");if(!profile||typeof profile.displayName!=="string")fail("failed-precondition","Spielerprofil nicht verfügbar.");const name=profile.displayName.trim();if(name.length<3||name.length>20||/[\u0000-\u001f\u007f]/.test(name))fail("failed-precondition","Spielerprofil nicht verfügbar.");return {displayName:name};}
 async function index(path,entry){
  await db.ref(path).transaction(current=>{
   if(current&&Number.isSafeInteger(current.revision)&&current.revision>=entry.revision)return;
   return entry;
  });
 }
 async function reconcile(a,b){
  const sorted=pair(a,b);if(sorted[0]!==a||sorted[1]!==b)fail("invalid-argument","Ungültiges Spielerpaar.");
  const rel=await read("social/relationships/"+a+"/"+b);if(!rel)return;
  if(rel.a!==a||rel.b!==b||!Number.isSafeInteger(rel.revision))fail("failed-precondition","Ungültige Beziehung.");
  const now=clock(),pending=rel.status==="pending"&&rel.expiresAt>now;
  const entries=[];
  for(const [owner,other] of [[a,b],[b,a]]){
   const common={revision:rel.revision,updatedAt:rel.updatedAt};
   const received=pending&&rel.requestedBy===other;
   const sent=pending&&rel.requestedBy===owner;
   entries.push(index("social/friends/"+owner+"/"+other,{...common,active:rel.status==="friends",since:rel.friendSince||0}));
   entries.push(index("social/requests/"+owner+"/"+other,{...common,active:received,...(received?{displayName:rel.requesterName,expiresAt:rel.expiresAt}: {})}));
   entries.push(index("social/sentRequests/"+owner+"/"+other,{...common,active:sent,...(sent?{expiresAt:rel.expiresAt}: {})}));
   entries.push(index("social/blocks/"+owner+"/"+other,{...common,active:rel.blockedBy?.[owner]===true}));
  }
  await Promise.all(entries);
 }
 async function change(actorUid,targetUid,operation){
  const [a,b]=pair(actorUid,uid(targetUid));
  const me=await account(actorUid);
  if(operation==="request"||operation==="accept")await account(targetUid);
  const result=await db.ref("social/relationships/"+a+"/"+b).transaction(current=>{
   let next;
   try{next=reduceRelationship(current,{actorUid,targetUid,action:operation,now:Math.max(clock(),current?.updatedAt||0)},new Set([a,b]));}
   catch{fail("failed-precondition","Diese Freundschaftsaktion ist nicht möglich.");}
   if(operation==="request"&&next.status==="pending"&&next.requestedBy===actorUid)next.requesterName=me.displayName;
   return next;
  });
  if(!result.committed)fail("aborted","Aktion wurde nicht bestätigt.");
  await reconcile(a,b);
  const value=result.snapshot.val();return {status:value.status,revision:value.revision};
 }
 async function getCode(actorUid,data={}){
  const id=actor(actorUid);payload(data,[]);await budget(id);await account(id);
  const candidate=makeCode();if(typeof candidate!=="string"||!/^[A-Za-z0-9_-]{24}$/.test(candidate))fail("internal","Code konnte nicht erstellt werden.");
  const result=await db.ref("social/privateCodes/"+id).transaction(current=>current||{code:candidate,createdAt:clock()});
  const code=result.snapshot.val()?.code;if(typeof code!=="string"||!/^[A-Za-z0-9_-]{24}$/.test(code))fail("internal","Code konnte nicht erstellt werden.");
  const lookup=await db.ref("social/codeLookup/"+code).transaction(current=>current===null?id:current);
  if(lookup.snapshot.val()!==id)fail("internal","Code konnte nicht reserviert werden.");
  return {friendCode:code};
 }
 async function requestByCode(actorUid,data){
  const id=actor(actorUid);payload(data,["friendCode"]);await budget(id);
  const code=typeof data.friendCode==="string"?data.friendCode.trim():"";
  if(!/^[A-Za-z0-9_-]{24}$/.test(code))fail("invalid-argument","Ungültiger Freundescode.");
  const target=await read("social/codeLookup/"+code);if(typeof target!=="string")fail("not-found","Freundescode nicht verfügbar.");
  if(target===id)fail("invalid-argument","Du kannst dir selbst keine Anfrage senden.");
  return change(id,target,"request");
 }
 async function respond(actorUid,data){
  const id=actor(actorUid);payload(data,["operation","targetUid"]);
  if(!["accept","decline","cancel","remove","block","unblock"].includes(data.operation))fail("invalid-argument","Ungültige Aktion.");
  uid(data.targetUid);await budget(id);return change(id,data.targetUid,data.operation);
 }
 async function publishOwner(id){
  const user=await read("users/"+uid(id));
  const privacy=await read("social/privacy/"+id);
  const patch={};
  patch["social/profiles/"+id]=privacy?.profile==="friends"&&user?.profile?{displayName:(await account(id)).displayName,updatedAt:clock()}:null;
  for(const classId of ["knight","mage"]){
   let view=null;
   if(privacy?.characters==="friends"&&user?.characters?.[classId])view=projectCharacter(classId,user.characters[classId],clock());
   patch["social/characterViews/"+id+"/"+classId]=view;
  }
  await db.ref().update(patch);
 }
 async function setPrivacy(actorUid,data){
  const id=actor(actorUid);payload(data,["profile","characters"]);
  if(!["private","friends"].includes(data.profile)||!["private","friends"].includes(data.characters))fail("invalid-argument","Ungültige Sichtbarkeit.");
  await budget(id);await account(id);
  await db.ref("social/privacy/"+id).set({profile:data.profile,characters:data.characters});
  await publishOwner(id);return {ok:true};
 }
 return {getCode,requestByCode,respond,setPrivacy,reconcile,publishOwner};
}
module.exports={createSocialService,SocialError};

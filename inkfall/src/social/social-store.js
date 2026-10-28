(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallSocialStore=api;})(globalThis,()=>{
'use strict';
function create(client){
 let state={uid:null,available:false,loading:false,friends:[],requests:[],selectedUid:null,profile:null,profileLoading:false,character:null,characterLoading:false,classId:'knight',error:null,busy:false};
 let generation=0,selection=0,characterTicket=0,stop=null,stopProfile=null,stopCharacter=null;
 const listeners=new Set();
 const snapshot=()=>JSON.parse(JSON.stringify(state));
 const emit=()=>listeners.forEach(fn=>fn(snapshot()));
 const isFriend=uid=>state.friends.some(x=>x.uid===uid);
 function clearSelection(){selection++;characterTicket++;if(stopProfile)stopProfile();stopProfile=null;if(stopCharacter)stopCharacter();stopCharacter=null;Object.assign(state,{selectedUid:null,profile:null,profileLoading:false,character:null,characterLoading:false});}
 function setUser(uid){
  generation++;if(stop)stop();stop=null;clearSelection();
  state={uid:uid||null,available:false,loading:!!uid,friends:[],requests:[],selectedUid:null,profile:null,profileLoading:false,character:null,characterLoading:false,classId:'knight',error:null,busy:false};emit();
  if(!uid)return;
  const token=generation;
  try{stop=client.watch(uid,data=>{
   if(token!==generation)return;
   state.available=data.available;state.loading=false;state.friends=data.friends;state.requests=data.requests;state.error=null;
   if(state.selectedUid&&!isFriend(state.selectedUid))clearSelection();emit();
  },()=>{if(token!==generation)return;clearSelection();Object.assign(state,{friends:[],requests:[],loading:false,available:false,error:'Freundesdaten konnten nicht geladen werden.'});emit();});}
  catch{state.loading=false;state.error='Freundesdaten konnten nicht geladen werden.';emit();}
 }
 async function selectFriend(uid){
  if(!isFriend(uid))return;
  clearSelection();const token=selection,session=generation;
  Object.assign(state,{selectedUid:uid,profileLoading:true,error:null});emit();
  if(client.watchProfile){
   try{stopProfile=client.watchProfile(uid,profile=>{if(session!==generation||token!==selection||!isFriend(uid))return;state.profile=profile;state.profileLoading=false;if(!profile){characterTicket++;if(stopCharacter)stopCharacter();stopCharacter=null;state.character=null;state.characterLoading=false;}emit();},()=>{if(session!==generation||token!==selection)return;characterTicket++;if(stopCharacter)stopCharacter();stopCharacter=null;Object.assign(state,{profile:null,profileLoading:false,character:null,characterLoading:false,error:'Profil nicht verfügbar oder nicht freigegeben.'});emit();});}
   catch{state.profileLoading=false;state.error='Profil nicht verfügbar oder nicht freigegeben.';emit();}return;
  }
  try{const profile=await client.getProfile(uid);if(session!==generation||token!==selection||!isFriend(uid))return;state.profile=profile;}
  catch{if(session!==generation||token!==selection)return;state.error='Profil nicht verfügbar oder nicht freigegeben.';}
  if(session===generation&&token===selection){state.profileLoading=false;emit();}
 }
 async function selectCharacter(classId){
  if(!state.selectedUid||!['knight','mage'].includes(classId))return;
  if(stopCharacter)stopCharacter();stopCharacter=null;
  const uid=state.selectedUid,token=++characterTicket,session=generation;
  Object.assign(state,{classId,character:null,characterLoading:true,error:null});emit();
  if(client.watchCharacter){
   try{stopCharacter=client.watchCharacter(uid,classId,value=>{if(session!==generation||token!==characterTicket||state.selectedUid!==uid||!isFriend(uid))return;state.character=value;state.characterLoading=false;emit();},()=>{if(session!==generation||token!==characterTicket)return;Object.assign(state,{character:null,characterLoading:false,error:'Charakter nicht verfügbar oder nicht freigegeben.'});emit();});}
   catch{state.characterLoading=false;state.error='Charakter nicht verfügbar oder nicht freigegeben.';emit();}return;
  }
  try{const value=await client.getCharacter(uid,classId);if(session!==generation||token!==characterTicket||state.selectedUid!==uid||!isFriend(uid))return;state.character=value;}
  catch{if(session!==generation||token!==characterTicket)return;state.error='Charakter nicht verfügbar oder nicht freigegeben.';}
  if(session===generation&&token===characterTicket){state.characterLoading=false;emit();}
 }
 async function action(name,payload){
  if(state.busy||!state.uid||!client.has(name))return false;
  const token=generation;state.busy=true;state.error=null;emit();
  try{await client.invoke(name,payload);return token===generation;}
  catch{if(token===generation)state.error='Aktion fehlgeschlagen. Bitte erneut versuchen.';return false;}
  finally{if(token===generation){state.busy=false;emit();}}
 }
 return {snapshot,setUser,selectFriend,selectCharacter,action,clearSelection(){clearSelection();emit();},has:client.has,
 subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},
 destroy(){setUser(null);listeners.clear();}};
}
return {create};
});

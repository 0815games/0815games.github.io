// Friends are consent-based account links, separate from four-digit match codes.
// Firebase rules are the authorization boundary; the client is not a rate limiter.
const codePattern=/^[a-f0-9]{32}$/;
export function createFriendService({db,auth,sdk,crypto=globalThis.crypto}){
 const uid=auth.currentUser?.uid;if(!uid||!crypto?.getRandomValues)throw Error('Sign in required');
 const path=p=>sdk.ref(db,p),check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Account changed');};
 const read=async p=>{check();const snap=await sdk.get(path(p));check();return snap.val();};
 const set=async(p,v)=>{check();await sdk.set(path(p),v);check();};
 const remove=async p=>{check();await sdk.remove(path(p));check();};
 async function ensureCode(name){
  let code=await read(`friendPrivate/${uid}/code`);if(code){if(!codePattern.test(code))throw Error('Invalid friend code');return code;}
  for(let i=0;i<3;i++){
   const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const candidate=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   try{await set(`friendCodes/${candidate}`,{uid,name});}catch{code=await read(`friendPrivate/${uid}/code`);if(code)return code;continue;}
   try{await set(`friendPrivate/${uid}/code`,candidate);return candidate;}catch{code=await read(`friendPrivate/${uid}/code`);if(code)return code;throw Error('Could not save your friend code');}
  }throw Error('Could not create your friend code');
 }
 async function send(input,name){
  const code=String(input).trim().toLowerCase();if(!codePattern.test(code))throw Error('Enter the full 32-character friend code.');
  const person=await read(`friendCodes/${code}`);if(!person?.uid||!person?.name)throw Error('Friend code not found.');if(person.uid===uid)throw Error('That is your own friend code.');
  const incoming=await read(`friendships/${uid}/${person.uid}`);if(incoming)throw Error(incoming.status==='accepted'?'You are already friends.':'They already sent you a request. Accept it below.');
  const outgoing=`friendships/${person.uid}/${uid}`,existing=await read(outgoing);
  await set(`friendOutgoing/${uid}/${person.uid}`,{code,name:person.name});
  if(existing)throw Error(existing.status==='accepted'?'You are already friends.':'Request already sent.');
  if(!existing){try{await set(outgoing,{status:'pending',senderName:name,receiverName:person.name,code});}catch(error){const after=await read(outgoing);if(!after)throw error;}}
  return person.name;
 }
 function watch(callback,onError){
  check();let closed=false,incoming={},outgoing={},edges={},edgeStops=new Map();
  const emit=()=>{if(!closed&&auth.currentUser?.uid===uid)callback({incoming,outgoing,edges});};
  const error=e=>{if(!closed)onError(e);};
  const unIn=sdk.onValue(path(`friendships/${uid}`),s=>{incoming=s.val()||{};emit();},error);
  const unOut=sdk.onValue(path(`friendOutgoing/${uid}`),s=>{
   outgoing=s.val()||{};for(const [id,stop] of edgeStops)if(!Object.hasOwn(outgoing,id)){stop();edgeStops.delete(id);delete edges[id];}
   for(const id of Object.keys(outgoing))if(!edgeStops.has(id)){const entry={stop:null};edgeStops.set(id,()=>entry.stop?.());entry.stop=sdk.onValue(path(`friendships/${id}/${uid}`),snap=>{edges[id]=snap.val();emit();},error);}
   emit();
  },error);
  return ()=>{closed=true;unIn();unOut();for(const stop of edgeStops.values())stop();edgeStops.clear();};
 }
 return {ensureCode,send,watch,accept:sender=>set(`friendships/${uid}/${sender}/status`,'accepted'),removeIncoming:sender=>remove(`friendships/${uid}/${sender}`),removeOutgoing:async other=>{const edge=await read(`friendships/${other}/${uid}`);if(edge)await remove(`friendships/${other}/${uid}`);await remove(`friendOutgoing/${uid}/${other}`);}};
}

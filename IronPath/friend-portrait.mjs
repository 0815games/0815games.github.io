import {decodeAvatar,looksFor} from './avatar.mjs?v=20261112-live1';
import {composePortrait,layerOptions} from './avatar-layers.mjs?v=20261112-live1';

// No other account's local avatar mirror is ever read. Until both permitted
// profile fields are available, a neutral placeholder is the honest answer.
export const FRIEND_PORTRAIT_PLACEHOLDER='assets/friend-placeholder.svg?v=20261031-patch4';
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const isImage=value=>typeof value==='string'&&value.length<=1000000&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);

// decodeAvatar deliberately clamps stale or malformed parts for the owner's
// own UI. For a friend's portrait that could misrepresent an unknown face as a
// real one, so recognize only the formats produced by the old and current
// encoders, with choices that the current renderer can actually reproduce.
// Comic-era values and future/unknown layers stay neutral until supported.
function knownAvatar(encoded,gender){
 if(typeof encoded!=='string'||encoded.length<8||encoded.length>64||!['male','female'].includes(gender))return null;
 const legacy=/^g:([mf])\|look:([a-z0-9]{1,24})$/.exec(encoded);
 if(legacy){
  if(legacy[1]!==gender[0]||!looksFor(gender).some(item=>item.id===legacy[2]))return null;
  return decodeAvatar(encoded,gender);
 }
 const current=/^g:([mf])\|face:([a-z0-9]{1,24})(?:\|hair:([a-z0-9]{1,24}))?(?:\|beard:([a-z0-9]{1,24}))?$/.exec(encoded);
 if(!current||current[1]!==gender[0])return null;
 const {faces,hairs,beards}=layerOptions(gender);
 if(!faces.some(item=>item.id===current[2])||
    (current[3]&&!hairs.some(item=>item.id===current[3]))||
    (current[4]&&!beards.some(item=>item.id===current[4])))return null;
 return decodeAvatar(encoded,gender);
}

async function renderPortrait(document,avatar){
 const canvas=document.createElement('canvas');
 if(!await composePortrait(canvas,avatar,128))throw Error('Portrait unavailable');
 return canvas.toDataURL('image/png');
}

// The caller creates one watch per accepted friend and shares the resulting
// URL between the list and the dossier. Only the two individual fields are
// read; granting access to the full player profile is neither needed nor safe.
// Each asynchronous render is fenced against later snapshots, removal, dialog
// closure and account switches. A terminated permission listener stays failed
// until a fresh watch is created.
export function watchFriendPortrait({db,auth,sdk,id,document,onChange,render=renderPortrait}){
 const uid=auth?.currentUser?.uid;
 if(!db||!validId(uid)||!validId(id)||uid===id||typeof sdk?.ref!=='function'||typeof sdk?.onValue!=='function'||typeof onChange!=='function'||typeof render!=='function')throw Error('Invalid friend');
 let stopped=false,revision=0,last=null;
 const fields={gender:{ready:false,value:null,failed:false},avatar:{ready:false,value:null,failed:false}},unsubscribes=[];
 const current=()=>!stopped&&auth.currentUser?.uid===uid;
 const notify=url=>{if(current()&&url!==last){last=url;try{onChange(url);}catch{/* A consumer cannot interrupt listener cleanup. */}}};
 function update(){
  const version=++revision,gender=fields.gender.value,encoded=fields.avatar.value;
  // In particular, do not display another person's local-only mirror or
  // guess which face a missing/invalid value represented.
  const avatar=fields.gender.ready&&fields.avatar.ready?knownAvatar(encoded,gender):null;
  if(!avatar){notify(FRIEND_PORTRAIT_PLACEHOLDER);return;}
  notify(FRIEND_PORTRAIT_PLACEHOLDER);
  Promise.resolve().then(()=>render(document,avatar)).then(url=>{
   if(current()&&revision===version)notify(isImage(url)?url:FRIEND_PORTRAIT_PLACEHOLDER);
  },()=>{if(current()&&revision===version)notify(FRIEND_PORTRAIT_PLACEHOLDER);});
 }
 notify(FRIEND_PORTRAIT_PLACEHOLDER);
 try{
  for(const key of ['avatar','gender']){
   const field=fields[key];
   const stop=sdk.onValue(sdk.ref(db,`players/${id}/${key}`),snapshot=>{
    if(!current()||field.failed)return;
    try{field.value=snapshot.val();field.ready=true;}catch{field.value=null;field.ready=false;}
    update();
   },()=>{if(!current())return;field.failed=true;field.ready=false;field.value=null;update();});
   if(typeof stop==='function')unsubscribes.push(stop);
  }
 }catch(error){stopped=true;revision++;for(const stop of unsubscribes)stop();throw error;}
 return ()=>{if(stopped)return;stopped=true;revision++;for(const stop of unsubscribes)stop();};
}

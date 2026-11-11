// The soldier's face: a small, purely cosmetic set of choices made at enlistment
// and worn everywhere the soldier appears (recruiting preview, dossier portrait,
// soldier screen). It stores no stat, grants no bonus and never touches the match.
//
// Storage: the encoded string rides in the profile field `avatar` once the rules
// accept it (same bounded-string pattern as `workshop`); until that publish, the
// same string is mirrored to localStorage so the face is never lost. Reading
// prefers the profile, falls back to storage, then to the gender default.
//
// Encoding: "g:m|s:2|h:3|c:1|e:0|b:2|x:0" - one letter per part, index into the
// option tables below. Decode is strict: anything unknown falls back to that
// part's default, so an old client reading a future avatar still draws a face.

export const SKIN_TONES=Object.freeze(['#f0cfae','#e0b18c','#c68d63','#9c6b45','#6f4a2f']);
export const HAIR_COLORS=Object.freeze(['#2b2118','#57402a','#8a6134','#b98e4e','#7c7f82','#3f4a3a']);
export const EYE_COLORS=Object.freeze(['#5b7f9e','#5f7d4f','#6b4a32','#596066','#7a5c49']);
// Hair styles are drawn per gender (see avatar-art); the ids are shared.
export const HAIR_STYLES=Object.freeze(Object.keys({buzz:0,short:0,side:0,long:0,bun:0}));
export const BEARDS=Object.freeze(Object.keys({none:0,stubble:0,mustache:0,full:0}));
export const EXTRAS=Object.freeze(Object.keys({none:0,scar:0,earring:0,glasses:0}));

export const AVATAR_PARTS=Object.freeze({g:['male','female'],s:SKIN_TONES,h:HAIR_STYLES,c:HAIR_COLORS,e:EYE_COLORS,b:BEARDS,x:EXTRAS});
export const AVATAR_STORAGE_KEY='ironpath:avatar';

export function defaultAvatar(gender='female'){
  return Object.freeze({gender:gender==='male'?'male':'female',skin:1,hair:'short',hairColor:0,eyes:2,beard:'none',extra:'none'});
}

export function encodeAvatar(avatar){
  const face=avatar||defaultAvatar();
  const pick=(list,value)=>String(Math.max(0,list.indexOf(value)));
  return `g:${face.gender==='male'?'m':'f'}|s:${face.skin}|h:${face.hair}|c:${face.hairColor}|e:${face.eyes}|b:${face.beard}|x:${face.extra}`;
}

export function decodeAvatar(encoded,gender='female'){
  const face={...defaultAvatar(gender)};
  if(typeof encoded!=='string'||!encoded)return face;
  const parts=encoded.split('|');
  if(parts.length>8)return face;
  for(const part of parts){
    const [key,value]=part.split(':');
    if(!Object.hasOwn(AVATAR_PARTS,key)||value===undefined)continue;
    if(key==='g'){if(value==='m')face.gender='male';else if(value==='f')face.gender='female';continue;}
    if(key==='s'||key==='c'||key==='e'){
      const index=Number.parseInt(value,10);
      if(Number.isInteger(index)&&index>=0&&index<AVATAR_PARTS[key].length)face[key==='s'?'skin':key==='c'?'hairColor':'eyes']=index;
      continue;
    }
    // A beard is a male-only choice; a female face ignores the part entirely.
    if(key==='b'&&face.gender!=='male')continue;
    if(AVATAR_PARTS[key].includes(value))face[key==='h'?'hair':key==='b'?'beard':'extra']=value;
  }
  return Object.freeze(face);
}

// Profile field first (cross-device), then the local mirror from before the
// rules publish, then the plain default for the gender the account chose.
export function resolveAvatar(profile,storage){
  const gender=profile?.gender==='male'?'male':'female';
  let mirrored=null;
  try{mirrored=storage?.getItem(AVATAR_STORAGE_KEY)??null;}catch{/* Locked storage reads as no mirror. */}
  return decodeAvatar(typeof profile?.avatar==='string'&&profile.avatar?profile.avatar:mirrored,gender);
}

export function storeAvatar(storage,avatar){
  const encoded=encodeAvatar(avatar);
  try{storage?.setItem(AVATAR_STORAGE_KEY,encoded);}catch{/* The mirror is a convenience only. */}
  return encoded;
}

// "SURPRISE ME": every part rolled once, but the result stays a valid face.
export function randomAvatar(gender='female',random=Math.random){
  const pick=list=>list[Math.floor(random()*list.length)%list.length];
  const face={...defaultAvatar(gender)};
  face.skin=Math.floor(random()*SKIN_TONES.length);
  face.hair=pick(HAIR_STYLES);
  face.hairColor=Math.floor(random()*HAIR_COLORS.length);
  face.eyes=Math.floor(random()*EYE_COLORS.length);
  if(face.gender==='male')face.beard=pick(BEARDS);
  face.extra=pick(EXTRAS);
  return Object.freeze(face);
}

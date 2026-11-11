// The soldier's face: a curated set of rendered portraits chosen at
// enlistment and worn everywhere the soldier appears (recruiting preview,
// dossier portrait, soldier screen). It stores no stat, grants no bonus and
// never touches the match.
//
// Looks are strictly per gender - the female and male hairstyle sets are two
// separate lists, never shared (reported: "Frisuren sollen für man und frau
// separat sein, nicht beides möglich für beide"). Each look is one rendered
// portrait file in the game's art style; the fine-grained color sliders of
// the first comic build went away with the switch to rendered portraits
// (reported: the face should be "realistisches Rendering", not a comic
// figure).
//
// Storage: the encoded string "g:f|look:bob" rides in the profile field
// `avatar` (bounded string, see the rules); the same string is mirrored to
// localStorage as the offline bridge. Reading prefers the profile, then the
// mirror, then the gender's default look.

export const FEMALE_LOOKS=Object.freeze([
  Object.freeze({id:'crop',file:'f-crop.jpg',name:'Crop'}),
  Object.freeze({id:'bob',file:'f-bob.jpg',name:'Bob'}),
  Object.freeze({id:'ponytail',file:'f-ponytail.jpg',name:'Ponytail'}),
  Object.freeze({id:'bun',file:'f-bun.jpg',name:'Bun'}),
  Object.freeze({id:'long',file:'f-long.jpg',name:'Long hair'}),
  Object.freeze({id:'braid',file:'f-braid.jpg',name:'Braid'}),
]);
export const MALE_LOOKS=Object.freeze([
  Object.freeze({id:'buzz',file:'m-buzz.jpg',name:'Buzz cut'}),
  Object.freeze({id:'short',file:'m-short.jpg',name:'Short'}),
  Object.freeze({id:'side',file:'m-side.jpg',name:'Side part'}),
  Object.freeze({id:'medium',file:'m-medium.jpg',name:'Medium'}),
  Object.freeze({id:'stubble',file:'m-stubble.jpg',name:'Stubble'}),
  Object.freeze({id:'beard',file:'m-beard.jpg',name:'Full beard'}),
]);

// The two lists are deliberately never merged: asking for a gender always
// yields only that gender's hairstyles.
export function looksFor(gender){return gender==='male'?MALE_LOOKS:FEMALE_LOOKS;}

export const AVATAR_STORAGE_KEY='ironpath:avatar';

export function defaultAvatar(gender='female'){
  return Object.freeze({gender:gender==='male'?'male':'female',look:0});
}

export function encodeAvatar(avatar){
  const face=avatar||defaultAvatar();
  const looks=looksFor(face.gender);
  const index=Math.min(Math.max(0,Number(face.look)||0),looks.length-1);
  return `g:${face.gender==='male'?'m':'f'}|look:${looks[index].id}`;
}

export function decodeAvatar(encoded,gender='female'){
  const face={...defaultAvatar(gender)};
  if(typeof encoded!=='string'||!encoded)return face;
  if(encoded.split('|').length>8)return face;
  for(const part of encoded.split('|')){
    const [key,value]=part.split(':');
    if(value===undefined)continue;
    if(key==='g'){
      if(value==='m')face.gender='male';
      else if(value==='f')face.gender='female';
      continue;
    }
    if(key==='look'){
      const index=looksFor(face.gender).findIndex(entry=>entry.id===value);
      if(index>=0)face.look=index;
      continue;
    }
    // Legacy faces from the comic build (s/h/c/e/b/x parts) have no rendered
    // portrait; they decode to their gender's default look and never throw.
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

// "SURPRISE ME": one roll within the chosen gender's own looks.
export function randomAvatar(gender='female',random=Math.random){
  const looks=looksFor(gender);
  const face={...defaultAvatar(gender)};
  face.look=Math.floor(random()*looks.length)%looks.length;
  return Object.freeze(face);
}

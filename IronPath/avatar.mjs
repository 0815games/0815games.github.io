// The soldier's face: a layered portrait chosen at enlistment and worn
// everywhere the soldier appears (recruiting showcase, dossier portrait,
// soldier screen). It stores no stat, grants no bonus and never touches the
// match.
//
// Since the layered build the avatar is a combination: one base FACE per
// gender plus optional HAIR and BEARD overlays (requested: "verschiedene
// Varianten mit Haaren und Bart" as separate rows). The fine-grained color
// sliders of the first comic build went away long ago (reported: the face
// should be "realistisches Rendering"); the single-look filmstrip followed
// the layered rows.
//
// Storage: the encoded string "g:f|face:crop|hair:bob|beard:full" rides in
// the profile field `avatar` (bounded string, see the rules); the same string
// is mirrored to localStorage as the offline bridge. Reading prefers the
// profile, then the mirror, then the gender's default face. Old saves that
// still carry "look:bob" (the single-look era, twelve ids) are mapped to the
// closest combination on decode - nobody loses their soldier.

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
// yields only that gender's hairstyles. They remain the source of truth for
// decoding the legacy single-look strings.
export function looksFor(gender){return gender==='male'?MALE_LOOKS:FEMALE_LOOKS;}

// The twelve single-look-era ids and the layered combination each one
// becomes. Face 2 of a gender keeps its own base image where one exists;
// stubble and full beard survive as beard choices.
const LEGACY_COMBINATIONS={
  female:{
    crop:{faceId:'crop',hairId:null,beardId:null},
    bob:{faceId:'crop',hairId:'bob',beardId:null},
    ponytail:{faceId:'crop',hairId:'ponytail',beardId:null},
    bun:{faceId:'bun',hairId:null,beardId:null},
    long:{faceId:'crop',hairId:'long',beardId:null},
    braid:{faceId:'crop',hairId:'braid',beardId:null},
  },
  male:{
    buzz:{faceId:'buzz',hairId:null,beardId:null},
    short:{faceId:'buzz',hairId:'short',beardId:null},
    side:{faceId:'buzz',hairId:'side',beardId:null},
    medium:{faceId:'buzz',hairId:'medium',beardId:null},
    stubble:{faceId:'buzz',hairId:null,beardId:'stubble'},
    beard:{faceId:'buzz',hairId:null,beardId:'full'},
  },
};

export const AVATAR_STORAGE_KEY='ironpath:avatar';

export function defaultAvatar(gender='female'){
  return Object.freeze({gender:gender==='male'?'male':'female',
    faceId:gender==='male'?'buzz':'crop',hairId:null,beardId:null});
}

function partId(value){
  return typeof value==='string'&&/^[a-z0-9]{1,24}$/.test(value)?value:null;
}

export function encodeAvatar(avatar){
  const face=avatar||defaultAvatar();
  const gender=face.gender==='male'?'m':'f';
  const parts=[`g:${gender}`];
  const faceId=partId(face.faceId)??defaultAvatar(face.gender).faceId;
  parts.push(`face:${faceId}`);
  const hair=partId(face.hairId);
  if(hair)parts.push(`hair:${hair}`);
  const beard=partId(face.beardId);
  if(beard)parts.push(`beard:${beard}`);
  return parts.join('|');
}

export function decodeAvatar(encoded,gender='female'){
  const face={...defaultAvatar(gender)};
  if(typeof encoded!=='string'||!encoded)return Object.freeze(face);
  if(encoded.split('|').length>8)return Object.freeze(face);
  for(const part of encoded.split('|')){
    const [key,value]=part.split(':');
    if(value===undefined)continue;
    if(key==='g'){
      if(value==='m')face.gender='male';
      else if(value==='f')face.gender='female';
      else continue;
      // The gender's own default face unless a later part says otherwise.
      face.faceId=defaultAvatar(face.gender).faceId;
      face.hairId=null;face.beardId=null;
      continue;
    }
    if(key==='face'){
      const id=partId(value);
      if(id)face.faceId=id;
      continue;
    }
    if(key==='hair'){
      const id=partId(value);
      face.hairId=id; // null when malformed: no hair overlay
      continue;
    }
    if(key==='beard'){
      const id=partId(value);
      face.beardId=id;
      continue;
    }
    if(key==='look'){
      // Legacy single-look saves: map the old id to its combination. An
      // unknown id decodes to the gender's default and never throws.
      const mapped=LEGACY_COMBINATIONS[face.gender]?.[value];
      if(mapped){face.faceId=mapped.faceId;face.hairId=mapped.hairId;face.beardId=mapped.beardId;}
      continue;
    }
    // Older legacy faces from the comic build (s/h/c/e/b/x parts) have no
    // layered equivalent; they decode to their gender's default face.
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

// "SURPRISE ME": one free roll across the gender's faces, hairs and beards -
// the base cut and no beard are valid rolls too, and hair and beard roll
// independently (that is the point of the layered build).
import { layerOptions } from './avatar-layers.mjs?v=20261112-live1';
export function randomAvatar(gender='female',random=Math.random){
  const g=gender==='male'?'male':'female';
  const {faces,hairs,beards}=layerOptions(g);
  const face=faces[Math.floor(random()*faces.length)%faces.length]??faces[0];
  // Roll space per row is options+1, with the "none" choice first: roll 0
  // is the base cut / clean shave, the deepest roll the last option.
  const hairRoll=Math.floor(random()*(hairs.length+1))%(hairs.length+1);
  const beardRoll=Math.floor(random()*(beards.length+1))%(beards.length+1);
  return Object.freeze({gender:g,faceId:face.id,
    hairId:hairRoll>0?hairs[hairRoll-1].id:null,
    beardId:beardRoll>0?beards[beardRoll-1].id:null});
}

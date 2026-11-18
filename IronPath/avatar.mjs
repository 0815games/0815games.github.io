// The soldier's face: a layered frontal portrait chosen at enlistment and
// worn everywhere the soldier appears (recruiting showcase, dossier portrait,
// soldier screen, friend list). It stores no stat, grants no bonus and never
// touches the match.
//
// Storage: "g:f|face:f1|hair:bob|beard:full|color:auburn" (8..64 chars in
// players/{uid}/avatar); mirrored locally as offline fallback. Default brown
// omits `color:brown` to stay compact. Legacy "look:*" saves and PR #313
// single-cut face ids ("crop", "bun", "beard", ...) migrate cleanly onto the
// closest new frontal head + hair/beard combination so zero ghosting survives.

import {DEFAULT_COLOR_ID,layerOptions} from './avatar-layers.mjs?v=20261119-avatar3';

export const DEFAULT_HAIR_COLOR=DEFAULT_COLOR_ID;

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

export function looksFor(gender){return gender==='male'?MALE_LOOKS:FEMALE_LOOKS;}

const LEGACY_COMBINATIONS={
  female:{
    crop:{faceId:'f1',hairId:'crop',beardId:null},
    bob:{faceId:'f1',hairId:'bob',beardId:null},
    ponytail:{faceId:'f1',hairId:'ponytail',beardId:null},
    bun:{faceId:'f2',hairId:'bun',beardId:null},
    long:{faceId:'f1',hairId:'long',beardId:null},
    braid:{faceId:'f1',hairId:'braid',beardId:null},
  },
  male:{
    buzz:{faceId:'m1',hairId:'buzz',beardId:null},
    short:{faceId:'m1',hairId:'short',beardId:null},
    side:{faceId:'m1',hairId:'side',beardId:null},
    medium:{faceId:'m1',hairId:'medium',beardId:null},
    stubble:{faceId:'m1',hairId:'buzz',beardId:'stubble'},
    beard:{faceId:'m1',hairId:'buzz',beardId:'full'},
  },
};

export const LEGACY_FACES=Object.freeze({
  female:{
    crop:{faceId:'f1',hairId:'crop',beardId:null},
    bun:{faceId:'f2',hairId:'bun',beardId:null},
    ponytail:{faceId:'f3',hairId:'ponytail',beardId:null},
    bob:{faceId:'f4',hairId:'bob',beardId:null},
    long:{faceId:'f5',hairId:'long',beardId:null},
    braid:{faceId:'f6',hairId:'braid',beardId:null},
    slick:{faceId:'f1',hairId:'slick',beardId:null},
  },
  male:{
    buzz:{faceId:'m1',hairId:'buzz',beardId:null},
    short:{faceId:'m2',hairId:'short',beardId:null},
    side:{faceId:'m3',hairId:'side',beardId:null},
    medium:{faceId:'m4',hairId:'medium',beardId:null},
    stubble:{faceId:'m5',hairId:'short',beardId:'stubble'},
    beard:{faceId:'m6',hairId:'short',beardId:'full'},
  },
});

export const AVATAR_STORAGE_KEY='ironpath:avatar';

export function defaultAvatar(gender='female'){
  const g=gender==='male'?'male':'female';
  return Object.freeze({
    gender:g,
    faceId:g==='male'?'m1':'f1',
    hairId:g==='male'?'buzz':'crop',
    beardId:null,
    colorId:DEFAULT_HAIR_COLOR,
  });
}

function partId(value){
  return typeof value==='string'&&/^[a-z0-9]{1,24}$/.test(value)?value:null;
}

export function encodeAvatar(avatar){
  const spec=avatar||defaultAvatar();
  const gender=spec.gender==='male'?'m':'f';
  const g=gender==='m'?'male':'female';
  const parts=[`g:${gender}`];
  const faceId=partId(spec.faceId)??defaultAvatar(g).faceId;
  parts.push(`face:${faceId}`);
  const hair=partId(spec.hairId);
  if(hair)parts.push(`hair:${hair}`);
  const beard=g==='male'?partId(spec.beardId):null;
  if(beard)parts.push(`beard:${beard}`);
  const color=partId(spec.colorId);
  if(color&&color!==DEFAULT_HAIR_COLOR)parts.push(`color:${color}`);
  return parts.join('|');
}

export function decodeAvatar(encoded,gender='female'){
  const base=defaultAvatar(gender);
  if(typeof encoded!=='string'||!encoded)return base;
  const rawParts=encoded.split('|');
  if(rawParts.length>8)return base;

  const face={gender:base.gender,faceId:base.faceId,hairId:base.hairId,beardId:base.beardId,colorId:DEFAULT_HAIR_COLOR};
  let legacyHair,legacyBeard,explicitHair,explicitBeard,hasValidGender=false;

  for(const part of rawParts){
    const [key,value]=part.split(':');
    if(value===undefined)continue;
    if(key==='g'){
      if(value==='m')face.gender='male';
      else if(value==='f')face.gender='female';
      else continue;
      hasValidGender=true;
      face.faceId=face.gender==='male'?'m1':'f1';
      face.hairId=null;face.beardId=null;face.colorId=DEFAULT_HAIR_COLOR;
      legacyHair=undefined;legacyBeard=undefined;
      continue;
    }
    if(key==='face'){
      const id=partId(value);
      if(!id)continue;
      const legacy=LEGACY_FACES[face.gender]?.[id];
      if(legacy){
        face.faceId=legacy.faceId;
        legacyHair=legacy.hairId;
        legacyBeard=legacy.beardId;
      }else{
        face.faceId=id;
      }
      continue;
    }
    if(key==='hair'){
      explicitHair=partId(value);
      continue;
    }
    if(key==='beard'){
      explicitBeard=partId(value);
      continue;
    }
    if(key==='color'){
      const id=partId(value);
      const {colors}=layerOptions(face.gender);
      face.colorId=colors.some(c=>c.id===id)?id:DEFAULT_HAIR_COLOR;
      continue;
    }
    if(key==='look'){
      const mapped=LEGACY_COMBINATIONS[face.gender]?.[value];
      if(mapped){
        face.faceId=mapped.faceId;
        legacyHair=mapped.hairId;
        legacyBeard=mapped.beardId;
      }else if(hasValidGender){
        // Unknown foreign look id reverts cleanly to the gender default
        const def=defaultAvatar(face.gender);
        face.faceId=def.faceId;legacyHair=def.hairId;legacyBeard=def.beardId;
      }
      continue;
    }
  }

  if(explicitHair!==undefined)face.hairId=explicitHair;
  else if(legacyHair!==undefined)face.hairId=legacyHair;

  if(explicitBeard!==undefined)face.beardId=explicitBeard;
  else if(legacyBeard!==undefined)face.beardId=legacyBeard;

  if(face.gender!=='male')face.beardId=null;
  return Object.freeze(face);
}

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

export function randomAvatar(gender='female',random=Math.random){
  const g=gender==='male'?'male':'female';
  const {faces,hairs,beards,colors}=layerOptions(g);
  const face=faces[Math.floor(random()*faces.length)%faces.length]??faces[0];
  const hairRoll=Math.floor(random()*(hairs.length+1))%(hairs.length+1);
  const beardRoll=beards.length?Math.floor(random()*(beards.length+1))%(beards.length+1):0;
  const color=colors[Math.floor(random()*colors.length)%colors.length]??colors[0];
  return Object.freeze({
    gender:g,
    faceId:face.id,
    hairId:hairRoll>0?hairs[hairRoll-1].id:null,
    beardId:beardRoll>0?beards[beardRoll-1].id:null,
    colorId:color?.id??DEFAULT_HAIR_COLOR,
  });
}

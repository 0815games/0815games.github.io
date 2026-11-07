// The dog tag: a soldier's identity plate, drawn as SVG.
//
// Design rule: it stores nothing. Every line on the tag is derived at render
// time from data the account already has (soldier name, gender, account id and
// the issue date of the first run), so an old save, an old client and a new
// client all draw the same tag without a migration, a database field or a rules
// change. It is cosmetic: no stat, no bonus, never equipped, always worn.
import {armoryIcon} from './development-ui.mjs?v=20261107-balance1';

const SALT='0815-IRON-PATH';
export const DOG_TAG_BRAND='0815 GAMES · IRON PATH';

// The eight blood types, in the order the German armed forces label them. The
// tag needs a value that never changes and never gets stored, so it is derived
// from the same salted account id as the serial. This is a mark on a prop, not a
// medical record: the UI labels it IDENTITY so nobody mistakes it for one.
export const BLOOD_TYPES=Object.freeze(['0 RH+','0 RH−','A RH+','A RH−','B RH+','B RH−','AB RH+','AB RH−']);

export function dogTagBloodType(accountId){
 const text=String(accountId??'');
 if(!text)return null;
 // A separate FNV-1a pass with its own seed, so the blood type is not just a
 // re-slicing of the serial (two accounts with the same serial still differ).
 let hash=0x811c9dc5;
 for(const char of 'BLOOD'+SALT+text){hash^=char.charCodeAt(0);hash=Math.imul(hash,0x01000193)>>>0;}
 return BLOOD_TYPES[hash%BLOOD_TYPES.length];
}

// A short, stable serial from the account id. Deterministic: the same soldier
// always gets the same tag, on any device, with no write of any kind.
const DOG_TAG_BLOOD_LABEL='BLOOD TYPE';

export function dogTagSerial(accountId){
 const text=String(accountId??'');
 if(!text)return '0000-0000';
 // FNV-1a over the salted id; two independent 16-bit halves keep it readable.
 let hash=0x811c9dc5,second=0x01000193;
 for(const char of SALT+text){
  hash^=char.charCodeAt(0);hash=Math.imul(hash,0x01000193)>>>0;
  second=(second+char.charCodeAt(0)*16777619)>>>0;
 }
 const pad=value=>value.toString(16).toUpperCase().padStart(4,'0').slice(-4);
 return `${pad(hash>>>16)}-${pad(second>>>16)}`;
}

// The issue date is the first run's date, else today. Rendered, never saved:
// the account has no birth date for the soldier and does not need one.
export function dogTagIssueDate(value=new Date()){
 const date=value instanceof Date&&!Number.isNaN(value.getTime())?value:new Date();
 return {year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate(),
  text:`${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()}`};
}

// Everything the tag needs, derived. `profile` only supplies name and gender;
// `accountId` may be missing (signed-out preview) and still yields a valid tag.
export function dogTag({profile,accountId,issued=new Date()}={}){
 const name=typeof profile?.name==='string'&&profile.name.trim()?profile.name.trim():'UNKNOWN';
 const gender=profile?.gender==='male'||profile?.gender==='female'?profile.gender:null;
 return Object.freeze({name,gender,serial:dogTagSerial(accountId),bloodType:dogTagBloodType(accountId),brand:DOG_TAG_BRAND,issued:dogTagIssueDate(issued)});
}

// A male/female pictogram in the same line style as the armory icons.
function genderPictogram(document,gender){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','dog-tag-gender');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');
 path.setAttribute('stroke-width','1.5');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
 // Female: circle head, tapered body. Male: circle head, square shoulders.
 path.setAttribute('d',gender==='female'
  ?'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11v6 M9 21l3-4 3 4'
  :'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11v10 M6 15h12 M8 21h8');
 svg.append(path);return svg;
}

// Draw the tag into a container. Returns the element so callers can refresh it
// when the language or the profile changes.
export function renderDogTag(document,container,data){
 if(!container)return null;
 const tag=dogTag(data);
 const root=document.createElement('article');
 root.className='dog-tag';
 root.dataset.serial=tag.serial;
 root.setAttribute('aria-label',`${tag.name} · ${tag.brand} · ${tag.serial}`);

 const top=document.createElement('div');top.className='dog-tag-top';
 const brand=document.createElement('span');brand.className='dog-tag-brand';brand.textContent=tag.brand;
 top.append(brand,genderPictogram(document,tag.gender));

 const name=document.createElement('strong');name.className='dog-tag-name';name.textContent=tag.name;

 const serial=document.createElement('span');serial.className='dog-tag-serial';serial.textContent=tag.serial;

 // Name, serial and blood type: the three lines a real tag carries. Without an
 // account id there is no honest blood type, so the row is left out rather than
 // filled with a placeholder.
 let blood=null;
 if(tag.bloodType){
  blood=document.createElement('span');blood.className='dog-tag-blood';blood.textContent=tag.bloodType;
  blood.setAttribute('aria-label',`${DOG_TAG_BLOOD_LABEL} ${tag.bloodType}`);
 }

 const bottom=document.createElement('div');bottom.className='dog-tag-bottom';
 const stamp=document.createElement('span');stamp.className='dog-tag-stamp';
 stamp.append(armoryIcon(document,'badge'));
 const date=document.createElement('span');date.className='dog-tag-date';date.textContent=tag.issued.text;
 bottom.append(stamp,date);

 root.append(top,name,serial,...(blood?[blood]:[]),bottom);
 container.replaceChildren(root);
 return root;
}

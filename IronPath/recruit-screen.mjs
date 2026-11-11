// The recruiting office: the character-creation screen as an event, not a
// form. One live avatar preview, the dog tag stamping the name letter by
// letter, option rows for the face, and an ENLIST stamp that slams down on the
// paper. Pure presentation and choice collection - the actual profile write
// stays in account.js (exactly {name, gender, xp} plus the avatar string).
import {SKIN_TONES,HAIR_COLORS,EYE_COLORS,HAIR_STYLES,BEARDS,EXTRAS,defaultAvatar,randomAvatar,storeAvatar,AVATAR_STORAGE_KEY} from './avatar.mjs?v=20261112-avatar1';
import {drawAvatarFace} from './avatar-art.mjs?v=20261112-avatar1';
import {drawDogTagArt} from './dog-tag-art.mjs?v=20261112-avatar1';
import {translateText as tr} from './language.mjs?v=20261112-avatar1';

const SKIN_NAMES=['Light','Fair','Tan','Brown','Deep'];
const HAIR_COLOR_NAMES=['Black','Dark brown','Brown','Blond','Grey','Field green'];
const EYE_NAMES=['Blue','Green','Brown','Grey','Hazel'];
const HAIR_NAMES={buzz:'Buzz cut',short:'Short',side:'Side part',long:'Long',bun:'Bun'};
const BEARD_NAMES={none:'Clean',stubble:'Stubble',mustache:'Mustache',full:'Full beard'};
const EXTRA_NAMES={none:'None',scar:'Scar',earring:'Earring',glasses:'Glasses'};
const FLAVOR={female:'Pathfinder · sharp eye, steady hand',male:'Point man · first in, last out'};

function fitCanvas(canvas,ratio){
  const width=Math.round(canvas.clientWidth||192);
  const size=Math.round(width*ratio);
  if(canvas.width!==size){canvas.width=size;canvas.height=size;}
  return size;
}

// Builds and drives the whole screen. Callers hand in the account id (for the
// tag's serial) and receive the chosen avatar through getAvatar() at submit.
export function setupRecruitScreen({document,storage,getAccountId=()=>null,onAvatarChange=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const avatarPreview=$('avatarPreview'),tagCanvas=$('recruitTag'),optionsRoot=$('avatarOptions');
  if(!avatarPreview||!tagCanvas||!optionsRoot||typeof avatarPreview.getContext!=='function')return {getAvatar:()=>defaultAvatar(),stamp:()=>{}};
  let avatar=defaultAvatar('female');

  function paintAvatar(){
    const ratio=Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
    const size=fitCanvas(avatarPreview,ratio);
    const ctx=avatarPreview.getContext('2d');
    if(ctx)drawAvatarFace(ctx,size,avatar);
  }
  function paintTag(){
    const ratio=Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
    const cssWidth=tagCanvas.clientWidth||220;
    const size=Math.round(cssWidth*ratio);
    if(tagCanvas.width!==size){tagCanvas.width=size;tagCanvas.height=Math.round(size*.98);}
    tagCanvas.style.height='auto';
    const ctx=tagCanvas.getContext('2d');
    if(ctx)drawDogTagArt(ctx,tagCanvas.width,{profile:{name:$('soldierName')?.value||'',gender:avatar.gender},accountId:getAccountId()},{rotation:-.05});
  }
  function commit(next){
    avatar=next;
    storeAvatar(storage,avatar); // the local mirror; the profile write happens at ENLIST
    paintAvatar();paintTag();renderOptions();
    try{onAvatarChange(avatar);}catch{/* Presentation never blocks the screen. */}
  }

  function chipRow({label,key,entries,isColor}){
    const row=document.createElement('div');
    row.className='recruit-row';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label',tr(label));
    const title=document.createElement('span');title.className='recruit-row-label';title.textContent=tr(label);
    const group=document.createElement('div');group.className='recruit-choices';
    for(const entry of entries){
      const button=document.createElement('button');
      button.type='button';button.className='recruit-choice'+(isColor?' recruit-swatch':'');
      const value=entry.value;
      const selected=avatar[key]===value||(key==='gender'&&avatar.gender===value);
      button.setAttribute('aria-checked',String(selected));
      button.classList.toggle('selected',selected);
      if(isColor){
        button.style.background=entry.color;
        button.setAttribute('aria-label',tr(entry.name));
        button.title=tr(entry.name);
      }else{
        button.textContent=tr(entry.name);
      }
      button.addEventListener('click',()=>commit({...avatar,[key]:value}));
      group.append(button);
    }
    row.append(title,group);
    return row;
  }

  function renderOptions(){
    optionsRoot.replaceChildren(
      chipRow({label:'CHARACTER',key:'gender',entries:[{value:'female',name:'Female soldier'},{value:'male',name:'Male soldier'}]}),
      chipRow({label:'SKIN',key:'skin',isColor:true,entries:SKIN_TONES.map((color,i)=>({value:i,color,name:SKIN_NAMES[i]}))}),
      chipRow({label:'HAIR',key:'hair',entries:HAIR_STYLES.map(style=>({value:style,name:HAIR_NAMES[style]}))}),
      chipRow({label:'HAIR COLOR',key:'hairColor',isColor:true,entries:HAIR_COLORS.map((color,i)=>({value:i,color,name:HAIR_COLOR_NAMES[i]}))}),
      chipRow({label:'EYES',key:'eyes',isColor:true,entries:EYE_COLORS.map((color,i)=>({value:i,color,name:EYE_NAMES[i]}))}),
    );
    // The beard row only exists for a male face; female keeps her row count.
    if(avatar.gender==='male')optionsRoot.append(chipRow({label:'BEARD',key:'beard',entries:BEARDS.map(beard=>({value:beard,name:BEARD_NAMES[beard]}))}));
    optionsRoot.append(chipRow({label:'EXTRAS',key:'extra',entries:EXTRAS.map(extra=>({value:extra,name:EXTRA_NAMES[extra]}))}));
  }

  // The flavor line rides under the gender row, so the choice reads like a
  // dossier entry rather than a toggle.
  const flavorLine=document.createElement('p');
  flavorLine.className='recruit-flavor';flavorLine.textContent=tr(FLAVOR.female);
  optionsRoot.addEventListener('click',()=>{flavorLine.textContent=tr(FLAVOR[avatar.gender]);});
  optionsRoot.after(flavorLine);

  const random=$('avatarRandom');
  if(random)random.addEventListener('click',()=>commit(randomAvatar(avatar.gender)));

  const name=$('soldierName');
  if(name)name.addEventListener('input',paintTag);
  // The stamp text ships in English markup; localize it once on setup so the
  // first slam and any screen reader see the player's language.
  const stampEl=$('enlistStamp');if(stampEl)stampEl.textContent=tr('ENLISTED · IRON PATH');

  // A resize re-fits both canvases; the phone rotates, the card reflows.
  try{window.addEventListener('resize',()=>{paintAvatar();paintTag();});}catch{/* No window in tests. */}

  paintAvatar();paintTag();renderOptions();

  return {
    getAvatar:()=>avatar,
    refresh(){paintAvatar();paintTag();renderOptions();},
    // The ENLIST stamp: slammed onto the paper by account.js on submit.
    stamp(){
      const stamp=$('enlistStamp'),card=document.querySelector('#characterView .recruit-card');
      if(!stamp)return;
      stamp.textContent=tr('ENLISTED · IRON PATH');
      stamp.hidden=false;stamp.classList.remove('stamped');
      void stamp.offsetWidth; // restart the animation on rapid retries
      stamp.classList.add('stamped');
      if(card){card.classList.remove('stamped');void card.offsetWidth;card.classList.add('stamped');}
      setTimeout(()=>{stamp.hidden=true;},1100);
    },
  };
}

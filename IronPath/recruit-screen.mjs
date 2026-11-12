// The recruiting office: a compact dark dossier in the game's own panel
// language. The layered portrait build (requested: "verschiedene Varianten
// mit Haaren und Bart" as separate choices) replaced the single-look
// filmstrip: the big showcase portrait is composed from the chosen FACE,
// HAIR and BEARD, every option tile is a live composite of that option with
// the current rest of the selection, and women and men offer the same number
// of choices. The dog tag with the live-stamped name sits beside the
// portrait. Pure presentation and choice collection - the actual profile
// write stays in account.js (exactly {name, gender, xp, enlisted} plus the
// avatar string).
import {defaultAvatar,randomAvatar,storeAvatar} from './avatar.mjs?v=20261112-live1';
import {layerOptions,composePortrait} from './avatar-layers.mjs?v=20261112-live1';
import {drawDogTagArt,onDogTagArtReady} from './dog-tag-art.mjs?v=20261112-live1';
import {translateText as tr} from './language.mjs?v=20261112-live1';

function todayISO(){
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}

function deviceRatio(){
  return Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
}

// Builds and drives the whole screen. The chosen avatar is read through
// getAvatar() at submit; every change is mirrored to storage immediately.
// deps.loadImage is injectable so the unit tests can compose without a
// browser image loader.
export function setupRecruitScreen({document,storage,getAccountId=()=>null,onAvatarChange=()=>{},deps={}}={}){
  const $=id=>document.getElementById(id);
  const preview=$('avatarPreview'),tagCanvas=$('recruitTag'),optionsRoot=$('avatarOptions');
  if(!preview||!tagCanvas||!optionsRoot)return {getAvatar:()=>defaultAvatar(),stamp:()=>{},reset:()=>{}};
  let avatar=defaultAvatar('female');
  const composeDeps=deps.loadImage?{loadImage:deps.loadImage}:{};

  async function composeInto(canvas,target,cssSize){
    try{
      await composePortrait(canvas,target,Math.round(cssSize*deviceRatio()),composeDeps);
    }catch{
      // A failed asset paints a dark plate, never a blank or a throw: the
      // screen stays usable and the player sees WHICH tile is broken.
      const ctx=canvas.getContext&&canvas.getContext('2d');
      if(ctx){
        const size=Math.round(cssSize*deviceRatio());
        if(canvas.width!==size){canvas.width=size;canvas.height=size;}
        ctx.fillStyle='#3a2323';ctx.fillRect(0,0,size,size);
      }
    }
  }

  function paintAvatar(){
    const cssWidth=preview.clientWidth||180;
    void composeInto(preview,avatar,cssWidth);
  }
  function paintTag(){
    const ratio=deviceRatio();
    const cssWidth=tagCanvas.clientWidth||220;
    const size=Math.round(cssWidth*ratio);
    if(tagCanvas.width!==size){tagCanvas.width=size;tagCanvas.height=size;}
    tagCanvas.style.height='auto';
    const ctx=tagCanvas.getContext&&tagCanvas.getContext('2d');
    if(ctx){
      const lines=drawDogTagArt(ctx,tagCanvas.width,{profile:{name:$('soldierName')?.value||'',gender:avatar.gender,enlisted:todayISO()}});
      if(lines)tagCanvas.setAttribute('aria-label',`${tr('Your dog tag')}: ${lines.name} · ${lines.gender} · ${lines.date}`);
    }
  }
  function commit(next){
    avatar=next;
    storeAvatar(storage,avatar); // the local mirror; the profile write happens at ENLIST
    paintAvatar();paintTag();renderOptions();
    try{onAvatarChange(avatar);}catch{/* Presentation never blocks the screen. */}
  }

  function chipRow({label,key,entries}){
    const row=document.createElement('div');
    row.className='recruit-row';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label',tr(label));
    const title=document.createElement('span');title.className='recruit-row-label';title.textContent=tr(label);
    const group=document.createElement('div');group.className='recruit-choices';
    for(const entry of entries){
      const button=document.createElement('button');
      button.type='button';button.className='recruit-choice';
      const selected=avatar[key]===entry.value;
      button.setAttribute('aria-checked',String(selected));
      button.classList.toggle('selected',selected);
      button.textContent=tr(entry.name);
      // An entry may carry its own apply(): the gender switch resets the
      // whole combination to the new gender's default face instead of
      // dragging a foreign face id along.
      button.addEventListener('click',()=>commit(entry.apply?entry.apply():{...avatar,[key]:entry.value}));
      group.append(button);
    }
    row.append(title,group);
    return row;
  }

  // The option tiles: each one is a live composite of the option combined
  // with the CURRENT rest of the selection - the picture IS the button and
  // always previews what a tap would produce.
  function tileRow({label,key,entries}){
    const row=document.createElement('div');
    row.className='recruit-row';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label',tr(label));
    const title=document.createElement('span');title.className='recruit-row-label';title.textContent=tr(label);
    const group=document.createElement('div');group.className='recruit-choices recruit-looks';
    for(const entry of entries){
      const button=document.createElement('button');
      button.type='button';button.className='recruit-look';
      button.setAttribute('aria-checked',String(avatar[key]===entry.value));
      button.setAttribute('aria-label',tr(entry.name));
      button.title=tr(entry.name);
      const canvas=document.createElement('canvas');
      button.append(canvas);
      void composeInto(canvas,{...avatar,[key]:entry.value},64);
      button.addEventListener('click',()=>commit({...avatar,[key]:entry.value}));
      group.append(button);
    }
    row.append(title,group);
    return row;
  }

  function renderOptions(){
    const {faces,hairs,beards}=layerOptions(avatar.gender);
    // The "none" entries: the base face's own cut and a clean shave.
    const hairEntries=[{value:null,name:'BASIC CUT'},...hairs.map(h=>({value:h.id,name:h.label}))];
    const beardEntries=[{value:null,name:'NO BEARD'},...beards.map(b=>({value:b.id,name:b.label}))];
    const rows=[
      chipRow({label:'CHARACTER',key:'gender',entries:[
        {value:'female',name:'Female soldier',apply:()=>defaultAvatar('female')},
        {value:'male',name:'Male soldier',apply:()=>defaultAvatar('male')},
      ]}),
      tileRow({label:'FACE',key:'faceId',entries:faces.map(f=>({value:f.id,name:f.label}))}),
      tileRow({label:'HAIR',key:'hairId',entries:hairEntries}),
    ];
    // Beards are a male-only row, so both genders offer the same number of
    // choices (reported: "Frauen brauchen gleich viel Optionen wie Maenner").
    if(avatar.gender==='male')rows.push(tileRow({label:'BEARD',key:'beardId',entries:beardEntries}));
    optionsRoot.replaceChildren(...rows);
  }

  const random=$('avatarRandom');
  if(random)random.addEventListener('click',()=>commit(randomAvatar(avatar.gender)));

  const name=$('soldierName');
  if(name)name.addEventListener('input',paintTag);
  // The stamp text ships in English markup; localize it once on setup so the
  // first slam and any screen reader see the player's language.
  const stampEl=$('enlistStamp');if(stampEl)stampEl.textContent=tr('ENLISTED · IRON PATH');

  // A resize re-fits the tag canvas; the portrait reflows on its own.
  try{window.addEventListener('resize',()=>{paintTag();});}catch{/* No window in tests. */}

  // The tag's stencil font can arrive after the first paint; repaint once
  // it lands, not on the next unrelated repaint.
  onDogTagArtReady(()=>paintTag());

  paintAvatar();paintTag();renderOptions();

  return {
    getAvatar:()=>avatar,
    refresh(){paintAvatar();paintTag();renderOptions();},
    // After a character deletion: a clean desk, no leftover face or mirror.
    reset(){avatar=defaultAvatar('female');storeAvatar(storage,avatar);paintAvatar();paintTag();renderOptions();},
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

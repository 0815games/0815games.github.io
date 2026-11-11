// The recruiting office: a compact dark dossier in the game's own panel
// language. One rendered portrait beside the briefing text, the dog tag with
// the live-stamped name as the ID row, and exactly two choice rows - the
// gender and one rendered look per hairstyle, strictly separated by gender.
// The looks are a slim filmstrip: the photo IS the button, no huge tiles,
// and the whole card fits a phone screen without scrolling. Pure
// presentation and choice collection - the actual profile write stays in
// account.js (exactly {name, gender, xp, enlisted} plus the avatar string).
import {looksFor,defaultAvatar,randomAvatar,storeAvatar} from './avatar.mjs?v=20261112-avatar3';
import {avatarPortrait} from './avatar-art.mjs?v=20261112-avatar3';
import {drawDogTagArt} from './dog-tag-art.mjs?v=20261112-tagbg1';
import {translateText as tr} from './language.mjs?v=20261112-kits1';

function todayISO(){
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}

// Builds and drives the whole screen. The chosen avatar is read through
// getAvatar() at submit; every change is mirrored to storage immediately.
export function setupRecruitScreen({document,storage,getAccountId=()=>null,onAvatarChange=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const preview=$('avatarPreview'),tagCanvas=$('recruitTag'),optionsRoot=$('avatarOptions');
  if(!preview||!tagCanvas||!optionsRoot)return {getAvatar:()=>defaultAvatar(),stamp:()=>{},reset:()=>{}};
  let avatar=defaultAvatar('female');

  function paintAvatar(){preview.src=avatarPortrait(avatar);}
  function paintTag(){
    const ratio=Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
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
      button.addEventListener('click',()=>commit({...avatar,[key]:entry.value}));
      group.append(button);
    }
    row.append(title,group);
    return row;
  }

  // The look tiles: one rendered portrait per hairstyle of the chosen
  // gender - the picture is the button.
  function lookRow(){
    const row=document.createElement('div');
    row.className='recruit-row';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label',tr('LOOK'));
    const title=document.createElement('span');title.className='recruit-row-label';title.textContent=tr('LOOK');
    const group=document.createElement('div');group.className='recruit-choices recruit-looks';
    looksFor(avatar.gender).forEach((look,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className='recruit-look';
      button.setAttribute('aria-checked',String(avatar.look===index));
      button.setAttribute('aria-label',tr(look.name));
      button.title=tr(look.name);
      button.style.backgroundImage=`url('${avatarPortrait({...avatar,look:index})}')`;
      button.addEventListener('click',()=>commit({...avatar,look:index}));
      group.append(button);
    });
    row.append(title,group);
    return row;
  }

  function renderOptions(){
    // Switching gender clamps the look into that gender's own list - the
    // hairstyle sets are separate and never mix.
    const looks=looksFor(avatar.gender);
    if(avatar.look>=looks.length)avatar={...avatar,look:looks.length-1};
    optionsRoot.replaceChildren(
      chipRow({label:'CHARACTER',key:'gender',entries:[{value:'female',name:'Female soldier'},{value:'male',name:'Male soldier'}]}),
      lookRow(),
    );
  }

  const random=$('avatarRandom');
  if(random)random.addEventListener('click',()=>commit(randomAvatar(avatar.gender)));

  const name=$('soldierName');
  if(name)name.addEventListener('input',paintTag);
  // The stamp text ships in English markup; localize it once on setup so the
  // first slam and any screen reader see the player's language.
  const stampEl=$('enlistStamp');if(stampEl)stampEl.textContent=tr('ENLISTED · IRON PATH');

  // A resize re-fits the tag canvas; the portrait is an image and reflows
  // on its own. The phone rotates, the card reflows.
  try{window.addEventListener('resize',()=>{paintTag();});}catch{/* No window in tests. */}

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

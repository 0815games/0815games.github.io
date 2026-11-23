// The recruiting office ("Umsetzungsidee A"): compact dark military dossier
// featuring a gender selector, a central high-res layered portrait flanked at
// forehead, face, and chin heights by direct ◀ / ▶ steppers, a live status
// readout, and a 5-dot hair & beard color bar. Zero bottom tile rows.
import {defaultAvatar,randomAvatar,storeAvatar} from '../core/avatar.mjs?v=20261119-avatar3';
import {layerOptions,composePortrait,DEFAULT_COLOR_ID} from '../core/avatar-layers.mjs?v=20261119-avatar3';
import {translateText as tr} from '../language.mjs?v=20261122-ring1';

function deviceRatio(){
  return Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
}

export function setupRecruitScreen({document,storage,getAccountId=()=>null,onAvatarChange=()=>{},deps={}}={}){
  const $=id=>document.getElementById(id);
  const preview=$('avatarPreview'),optionsRoot=$('avatarOptions');
  if(!preview||!optionsRoot)return {getAvatar:()=>defaultAvatar(),stamp:()=>{},reset:()=>{},refresh:()=>{}};
  const stage=$('avatarStage'),genderBar=$('avatarGenderBar');
  let avatar=defaultAvatar('female');
  let renderSeq=0;
  const composeDeps=deps.loadImage?{loadImage:deps.loadImage}:{};

  async function composeInto(canvas,target,cssSize){
    const seq=++renderSeq;
    try{
      await composePortrait(canvas,target,Math.round(cssSize*deviceRatio()),composeDeps);
    }catch{
      if(seq!==renderSeq)return;
      const ctx=canvas.getContext&&canvas.getContext('2d');
      if(ctx){
        const size=Math.round(cssSize*deviceRatio());
        if(canvas.width!==size){canvas.width=size;canvas.height=size;}
        ctx.fillStyle='#3a2323';ctx.fillRect(0,0,size,size);
      }
    }
  }

  function paintAvatar(){
    const cssWidth=preview.clientWidth||210;
    void composeInto(preview,avatar,cssWidth);
  }

  function commit(next){
    avatar=next;
    storeAvatar(storage,avatar);
    paintAvatar();
    renderControls();
    try{onAvatarChange(avatar);}catch{/* Presentation never blocks the screen. */}
  }

  function cycleEntries(key){
    const {faces,hairs,beards}=layerOptions(avatar.gender);
    if(key==='face')return faces.map(f=>({value:f.id,name:f.label}));
    if(key==='hair')return [{value:null,name:'Bald'},...hairs.map(h=>({value:h.id,name:h.label}))];
    if(key==='beard')return [{value:null,name:'Clean-shaven'},...beards.map(b=>({value:b.id,name:b.label}))];
    return [];
  }

  const propFor=key=>key+'Id';

  function stepChoice(key,dir){
    const entries=cycleEntries(key),prop=propFor(key);
    if(!entries.length)return;
    const current=entries.findIndex(e=>e.value===avatar[prop]);
    const idx=current>=0?current:0;
    const next=entries[(idx+dir+entries.length)%entries.length];
    commit({...avatar,[prop]:next.value});
  }

  function makeStepButton(key,dir,ariaLabel,bandClass){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className=`recruit-step recruit-step-${dir<0?'prev':'next'} ${bandClass}`;
    btn.textContent=dir<0?'◀':'▶';
    btn.setAttribute('aria-label',tr(ariaLabel));
    btn.title=tr(ariaLabel);
    btn.dataset.step=key;
    btn.dataset.dir=String(dir);
    btn.addEventListener('click',()=>stepChoice(key,dir));
    return btn;
  }

  function buildGenderGroup(){
    const row=document.createElement('div');
    row.className='recruit-choices recruit-gender-choices';
    row.setAttribute('role','radiogroup');
    row.setAttribute('aria-label',tr('CHARACTER'));
    const genders=[
      {value:'female',name:'Female soldier'},
      {value:'male',name:'Male soldier'},
    ];
    for(const entry of genders){
      const button=document.createElement('button');
      button.type='button';
      button.className='recruit-choice';
      const selected=avatar.gender===entry.value;
      button.setAttribute('aria-checked',String(selected));
      button.classList.toggle('selected',selected);
      button.textContent=tr(entry.name);
      button.addEventListener('click',()=>commit(defaultAvatar(entry.value)));
      row.append(button);
    }
    return row;
  }

  function buildStageControls(){
    if(!stage)return;
    const controls=[
      makeStepButton('hair',-1,'Previous hair','recruit-band-hair'),
      makeStepButton('hair',1,'Next hair','recruit-band-hair'),
      makeStepButton('face',-1,'Previous face','recruit-band-face'),
      makeStepButton('face',1,'Next face','recruit-band-face'),
    ];
    if(avatar.gender==='male'){
      controls.push(
        makeStepButton('beard',-1,'Previous beard','recruit-band-beard'),
        makeStepButton('beard',1,'Next beard','recruit-band-beard'),
      );
    }
    stage.classList.toggle('has-beard',avatar.gender==='male');
    stage.replaceChildren(...controls,preview);
  }

  function activeName(key){
    const entries=cycleEntries(key);
    const match=entries.find(e=>e.value===avatar[propFor(key)])??entries[0];
    return match?tr(match.name):'';
  }

  function buildReadout(){
    const strip=document.createElement('div');
    strip.className='recruit-readout';
    const items=[
      {key:'hair',label:'HAIR',text:activeName('hair')},
      {key:'face',label:'FACE',text:activeName('face')},
    ];
    if(avatar.gender==='male')items.push({key:'beard',label:'BEARD',text:activeName('beard')});
    for(const item of items){
      const pill=document.createElement('button');
      pill.type='button';
      pill.className='recruit-readout-pill';
      pill.dataset.readout=item.key;
      const k=document.createElement('span');k.className='recruit-readout-key';k.textContent=tr(item.label);
      const v=document.createElement('strong');v.className='recruit-readout-val';v.textContent=item.text;
      pill.append(k,v);
      pill.addEventListener('click',()=>stepChoice(item.key,1));
      strip.append(pill);
    }
    return strip;
  }

  function buildColorBar(){
    const {colors}=layerOptions(avatar.gender);
    const row=document.createElement('div');
    row.className='recruit-row recruit-color-row';
    row.setAttribute('role','radiogroup');
    const colorHeading=avatar.gender==='male'?'HAIR & BEARD COLOR':'HAIR COLOR';
    row.setAttribute('aria-label',tr(colorHeading));
    const title=document.createElement('span');
    title.className='recruit-row-label';
    title.textContent=tr(colorHeading);
    const group=document.createElement('div');
    group.className='recruit-color-dots';
    const currentColor=avatar.colorId??DEFAULT_COLOR_ID;
    for(const color of colors){
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='recruit-color-dot';
      const selected=currentColor===color.id;
      btn.setAttribute('aria-checked',String(selected));
      btn.setAttribute('aria-label',tr(color.label));
      btn.title=tr(color.label);
      btn.dataset.color=color.id;
      btn.style.background=color.swatch;
      btn.classList.toggle('selected',selected);
      btn.addEventListener('click',()=>commit({...avatar,colorId:color.id}));
      group.append(btn);
    }
    row.append(title,group);
    return row;
  }

  function renderControls(){
    const genderGroup=buildGenderGroup();
    if(genderBar)genderBar.replaceChildren(genderGroup);
    buildStageControls();
    const parts=[];
    if(!genderBar)parts.push(genderGroup);
    parts.push(buildReadout(),buildColorBar());
    optionsRoot.replaceChildren(...parts);
  }

  const random=$('avatarRandom');
  if(random)random.addEventListener('click',()=>commit(randomAvatar(avatar.gender)));

  const stampEl=$('enlistStamp');
  if(stampEl)stampEl.textContent=tr('ENLISTED · IRON PATH');

  paintAvatar();
  renderControls();

  return {
    getAvatar:()=>avatar,
    refresh(){paintAvatar();renderControls();if(stampEl)stampEl.textContent=tr('ENLISTED · IRON PATH');},
    reset(){avatar=defaultAvatar('female');storeAvatar(storage,avatar);paintAvatar();renderControls();},
    stamp(){
      const stamp=$('enlistStamp'),card=document.querySelector('#characterView .recruit-card');
      if(!stamp)return;
      stamp.textContent=tr('ENLISTED · IRON PATH');
      stamp.hidden=false;stamp.classList.remove('stamped');
      void stamp.offsetWidth;
      stamp.classList.add('stamped');
      if(card){card.classList.remove('stamped');void card.offsetWidth;card.classList.add('stamped');}
      setTimeout(()=>{stamp.hidden=true;},1100);
    },
  };
}

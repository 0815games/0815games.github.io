// Silent legacy name-reservation backfill on login + conflict-only rename UI.
//
// Operator decision for Block 2 rollout:
//   * No public rename button in Soldier Dossier or Settings.
//   * On login, existing soldiers silently reserve their current name in
//     `characterNames/<key>` when it is free (`claimed`) or stay untouched if
//     the index rules are not yet deployed (`unsupported`).
//   * Only when another account already holds `characterNames/<key>` (`taken`),
//     a blocking modal dialog prompts the affected legacy player to choose a
//     unique new soldier name via `createCharacterRename`, preserving all XP,
//     equipment, skills, and campaign progress.
import {validateCharacterName,characterNameKey,sameCharacterName} from './character-name.mjs?v=20261125-aim12';
import {createCharacterNameClaim} from './character-name-claim.mjs?v=20261125-aim12';
import {createCharacterRename} from './character-rename.mjs?v=20261125-aim12';

export function createCharacterNameConflictHandler({
  document,
  db,
  auth,
  sdk,
  translate=text=>text,
  crypto=globalThis.crypto,
  isCurrent=()=>true,
  beforeOpen=()=>{},
  onReserved=()=>{},
  onRenamed=()=>{},
  onSignOut=()=>{},
}={}){
  const $=id=>document.getElementById(id);
  const reconciledKeys=new Set();
  let active=false,busy=false,conflictName='',conflictVersion=0,statusState={text:'',values:{}},bound=false;

  function setStatus(text='',values={}){
    statusState={text,values};
    const el=$('nameConflictStatus');
    if(el)el.textContent=text?translate(text,values):'';
  }

  function setControlsDisabled(disabled){
    const input=$('nameConflictInput'),submit=$('nameConflictSubmit'),logout=$('nameConflictLogout');
    if(input)input.disabled=disabled;
    if(submit)submit.disabled=disabled;
    if(logout)logout.disabled=disabled;
  }

  function closeDialog(){
    const dialog=$('nameConflictDialog');
    if(dialog?.open){
      try{dialog.close();}catch{}
    }
  }

  function openConflict(name){
    active=true;
    busy=false;
    conflictName=name;
    conflictVersion++;
    const currentEl=$('nameConflictCurrentName'),input=$('nameConflictInput'),dialog=$('nameConflictDialog');
    if(currentEl)currentEl.textContent=name;
    if(input)input.value='';
    setControlsDisabled(false);
    setStatus('');
    try{beforeOpen();}catch{}
    if(dialog&&!dialog.open){
      try{dialog.showModal?.();}catch{}
    }
    try{input?.focus?.();}catch{}
  }

  async function handleSubmit(event){
    event.preventDefault();
    if(!active||busy||!isCurrent())return;
    const uid=auth?.currentUser?.uid;
    if(!uid)return;
    const input=$('nameConflictInput');
    const typed=input?.value??'';
    const check=validateCharacterName(typed);
    if(!check.ok){
      setStatus(check.reason==='length'?'Soldier name must be 2–24 characters.':'That soldier name cannot be used. Choose another one.');
      try{input?.focus?.();}catch{}
      return;
    }
    if(sameCharacterName(check.name,conflictName)){
      setStatus('Choose a different name from your current duplicate name.');
      try{input?.focus?.();}catch{}
      return;
    }
    const submitVersion=conflictVersion;
    busy=true;
    setControlsDisabled(true);
    setStatus('Checking availability and updating your soldier name…');
    try{
      const renamer=createCharacterRename({db,auth,sdk,crypto,isCurrent:()=>isCurrent()&&submitVersion===conflictVersion});
      const result=await renamer.rename(check.name);
      if(!isCurrent()||submitVersion!==conflictVersion)return;
      if(result.status==='taken'){
        setStatus('That soldier name is already taken. Choose another one.');
        return;
      }
      if(result.status==='unchanged'){
        setStatus('Choose a different name from your current duplicate name.');
        return;
      }
      if(result.status==='unsupported'){
        reconciledKeys.add(`${uid}:${characterNameKey(conflictName)}`);
        active=false;
        conflictName='';
        closeDialog();
        return;
      }
      if(result.status==='renamed'){
        reconciledKeys.add(`${uid}:${result.key}`);
        active=false;
        conflictName='';
        setStatus('');
        closeDialog();
        await onRenamed(check.name,result);
        return;
      }
    }catch(error){
      if(!isCurrent()||submitVersion!==conflictVersion)return;
      const code=String(error?.code??error?.message??'').toUpperCase();
      if(/PERMISSION[_ -]?DENIED/.test(code)){
        setStatus('Database access denied. The Iron Path database rules may need to be deployed.');
      }else{
        setStatus('Could not update soldier name. Check your connection and try again.');
      }
    }finally{
      if(isCurrent()&&submitVersion===conflictVersion){
        busy=false;
        setControlsDisabled(false);
      }
    }
  }

  function bindOnce(){
    if(bound)return;
    bound=true;
    const dialog=$('nameConflictDialog'),form=$('nameConflictForm'),logout=$('nameConflictLogout');
    dialog?.addEventListener?.('cancel',event=>{
      if(active||busy)event.preventDefault();
    });
    form?.addEventListener?.('submit',handleSubmit);
    if(logout){
      logout.onclick=()=>{
        if(!busy)void onSignOut();
      };
    }
  }

  bindOnce();

  return Object.freeze({
    bind(){bindOnce();},
    isActive(){return active||busy;},
    refreshLanguage(){
      if(statusState.text)setStatus(statusState.text,statusState.values);
    },
    reset(){
      conflictVersion++;
      active=false;
      busy=false;
      conflictName='';
      reconciledKeys.clear();
      const currentEl=$('nameConflictCurrentName'),input=$('nameConflictInput');
      if(currentEl)currentEl.textContent='';
      if(input)input.value='';
      setControlsDisabled(false);
      setStatus('');
      closeDialog();
    },
    async reconcile(name,{alreadyReserved=false}={}){
      const uid=auth?.currentUser?.uid;
      if(!uid||!isCurrent())return {status:'cancelled'};
      let key;
      try{key=characterNameKey(name);}catch{return {status:'invalid'};}
      const cacheKey=`${uid}:${key}`;
      if(alreadyReserved){
        reconciledKeys.add(cacheKey);
        onReserved(key);
        if(active&&sameCharacterName(name,conflictName)){
          active=false;
          conflictName='';
          setStatus('');
          closeDialog();
        }
        return {status:'claimed',key};
      }
      if(reconciledKeys.has(cacheKey)&&!active)return {status:'claimed',key,cached:true};
      try{
        const claim=createCharacterNameClaim({db,auth,sdk,isCurrent});
        const result=await claim.claim(name);
        if(!isCurrent())return {status:'cancelled'};
        if(result.status==='claimed'){
          reconciledKeys.add(cacheKey);
          onReserved(result.key);
          if(active&&sameCharacterName(name,conflictName)){
            active=false;
            conflictName='';
            setStatus('');
            closeDialog();
          }
        }else if(result.status==='unsupported'){
          reconciledKeys.add(cacheKey);
        }else if(result.status==='taken'){
          openConflict(name);
        }
        return result;
      }catch{
        return {status:'error'};
      }
    },
  });
}

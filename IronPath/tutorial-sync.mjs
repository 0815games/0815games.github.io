// Per-character server persistence for Block 6 · Interactive Tutorial.
//
// Strictly matches the live-published RTDB rules (`players/$uid/tutorial`):
//   required: ['edition', 'status', 'rewarded']
//   edition: integer 1..100, monotonic (!data.exists() || new >= old)
//   status: 'offered' | 'accepted' | 'declined' | 'completed'
//   rewarded: boolean, monotonic (once true, stays true forever)
//   missionCompleted: boolean, monotonic (once true, stays true forever)
//   phase: 'dossier' | 'mission' | 'menu' | 'done'
//   step: integer 0..1000
//   $other: false (no extra properties allowed)
//
// Pure helpers plus a thin RTDB adapter so tests cover state transitions,
// duplicate-reward locking, and character-recreation behavior offline.

export const TUTORIAL_EDITION=3;
export const TUTORIAL_STATUSES=Object.freeze(['offered','accepted','declined','completed']);
export const TUTORIAL_PHASES=Object.freeze(['dossier','mission','menu','done']);

export function initialOfferedTutorial(edition=TUTORIAL_EDITION){
  const safeEdition=Number.isInteger(edition)&&edition>=1&&edition<=100?edition:TUTORIAL_EDITION;
  return {
    edition:safeEdition,
    status:'offered',
    rewarded:false,
    missionCompleted:false,
    phase:'dossier',
    step:0,
  };
}

export function sanitizeTutorialRecord(current,patch={},{isLegacyPaid=false}={}){
  const cur=current&&typeof current==='object'&&!Array.isArray(current)?current:{};
  const next=patch&&typeof patch==='object'&&!Array.isArray(patch)?patch:{};
  const oldEdition=Number.isInteger(cur.edition)&&cur.edition>=1&&cur.edition<=100?cur.edition:TUTORIAL_EDITION;
  const rawEdition=Number.isInteger(next.edition)?next.edition:oldEdition;
  const edition=Math.min(100,Math.max(oldEdition,rawEdition,TUTORIAL_EDITION));

  const rawStatus=next.status??cur.status??'offered';
  const status=TUTORIAL_STATUSES.includes(rawStatus)?rawStatus:'offered';

  const rawPhase=next.phase??cur.phase??(status==='completed'?'done':'dossier');
  const phase=TUTORIAL_PHASES.includes(rawPhase)?rawPhase:(status==='completed'?'done':'dossier');

  const rawStep=Number.isInteger(next.step)?next.step:(Number.isInteger(cur.step)?cur.step:0);
  const step=Math.min(1000,Math.max(0,rawStep));

  const rewarded=cur.rewarded===true||next.rewarded===true||(Object.keys(cur).length===0&&isLegacyPaid);
  const missionCompleted=cur.missionCompleted===true||next.missionCompleted===true||(Object.keys(cur).length===0&&isLegacyPaid);

  return {edition,status,rewarded,missionCompleted,phase,step};
}

// New characters receive `tutorial: initialOfferedTutorial()` at enlistment.
// Existing pre-Block-6 characters without `profile.tutorial` return `false` so
// they are never auto-interrupted, while still able to open the briefing from
// Settings or Command Center -> Field Tutorial whenever they choose.
export function shouldAutoPresentTutorial(profile){
  const tut=profile?.tutorial;
  if(!tut||typeof tut!=='object')return false;
  if(tut.status==='offered')return true;
  if(tut.status==='accepted')return tut.phase==='dossier'||tut.phase==='mission'||tut.phase==='menu';
  return false;
}

export function tutorialResumeTarget(profile){
  const tut=profile?.tutorial;
  if(!tut||typeof tut!=='object')return 'none';
  if(tut.status==='declined'||tut.status==='completed'||tut.phase==='done')return 'none';
  if(tut.status==='offered')return 'dossier';
  if(tut.status==='accepted'){
    if(tut.phase==='menu'||tut.missionCompleted===true)return 'menu';
    if(tut.phase==='mission')return 'mission-resume';
    return 'dossier';
  }
  return 'none';
}

export function shouldPayTutorialReward(profile,explicitRewards=true){
  if(explicitRewards===false)return false;
  if(!profile||typeof profile!=='object')return false;
  if(profile.tutorial?.rewarded===true)return false;
  // Pre-Block-6 characters who already earned XP before Block 6 shipped cannot
  // retroactively farm the recruit reward on a manual tutorial replay.
  if(!profile.tutorial&&Number(profile.xp||0)>0)return false;
  return true;
}

export function applyTutorialRewardProfile(current,{amount=0,wave=1,armoryRewardFn=null,markMissionCompleted=true,edition=TUTORIAL_EDITION}={}){
  if(!current||typeof current!=='object')return {nextProfile:null,credited:false,xpCredited:0};
  const legacyPaid=!current.tutorial&&Number(current.xp||0)>0;
  const alreadyRewarded=current.tutorial?.rewarded===true||legacyPaid;
  if(alreadyRewarded){
    const tutorial=sanitizeTutorialRecord(current.tutorial,{
      edition,
      status:current.tutorial?.status==='completed'?'completed':'accepted',
      rewarded:true,
      missionCompleted:markMissionCompleted||current.tutorial?.missionCompleted===true,
      phase:current.tutorial?.status==='completed'?'done':'menu',
      step:current.tutorial?.status==='completed'?(current.tutorial?.step??0):0,
    },{isLegacyPaid:legacyPaid});
    return {nextProfile:{...current,tutorial},credited:false,xpCredited:0};
  }
  const safeAmount=Number.isSafeInteger(amount)&&amount>0?amount:0;
  const nextXp=Math.min(10000000,(Number.isSafeInteger(current.xp)?current.xp:0)+safeAmount);
  const safeWave=Number.isInteger(wave)&&wave>=1?wave:1;
  const nextArmory=typeof armoryRewardFn==='function'?armoryRewardFn(current.armory,safeWave):current.armory;
  const tutorial=sanitizeTutorialRecord(current.tutorial,{
    edition,
    status:'accepted',
    rewarded:true,
    missionCompleted:!!markMissionCompleted,
    phase:'menu',
    step:0,
  });
  return {
    nextProfile:{
      ...current,
      xp:nextXp,
      ...(nextArmory!==undefined?{armory:nextArmory}:{}),
      tutorial,
    },
    credited:true,
    xpCredited:nextXp-(Number.isSafeInteger(current.xp)?current.xp:0),
  };
}

export function createTutorialSync({db=null,sdk=null,getUid=()=>null,isCurrent=()=>true,onProfile=null}={}){
  const canPersist=()=>!!(db&&sdk&&typeof sdk.ref==='function'&&typeof sdk.runTransaction==='function'&&getUid()&&isCurrent());

  async function writePatch(patch){
    const uid=getUid();
    if(!uid||!canPersist())return {committed:false,offline:true,tutorial:sanitizeTutorialRecord(null,patch)};
    try{
      const result=await sdk.runTransaction(sdk.ref(db,`players/${uid}`),current=>{
        if(!current||!isCurrent()||getUid()!==uid)return undefined;
        const legacyPaid=!current.tutorial&&Number(current.xp||0)>0;
        const nextTutorial=sanitizeTutorialRecord(current.tutorial,patch,{isLegacyPaid:legacyPaid});
        return {...current,tutorial:nextTutorial};
      },{applyLocally:false});
      if(!isCurrent()||getUid()!==uid)return {committed:false};
      if(result?.committed){
        const val=result.snapshot?.val?.();
        if(val&&typeof onProfile==='function')onProfile(val);
        return {committed:true,profile:val,tutorial:val?.tutorial??null};
      }
      return {committed:false};
    }catch(error){
      return {committed:false,error};
    }
  }

  async function claimReward({amount,wave,armoryRewardFn,markMissionCompleted=true}={}){
    const uid=getUid();
    if(!uid||!canPersist())return {committed:false,credited:false,xpCredited:0};
    let credited=false,xpCredited=0,before=null;
    try{
      const result=await sdk.runTransaction(sdk.ref(db,`players/${uid}`),current=>{
        if(!current||!isCurrent()||getUid()!==uid)return undefined;
        before=current;
        const applied=applyTutorialRewardProfile(current,{amount,wave,armoryRewardFn,markMissionCompleted});
        credited=applied.credited;
        xpCredited=applied.xpCredited;
        return applied.nextProfile;
      },{applyLocally:false});
      if(!isCurrent()||getUid()!==uid)return {committed:false,credited:false,xpCredited:0};
      if(result?.committed){
        const after=result.snapshot?.val?.();
        if(after&&typeof onProfile==='function')onProfile(after);
        return {committed:true,credited,xpCredited,before,profile:after};
      }
      return {committed:false,credited:false,xpCredited:0};
    }catch(error){
      return {committed:false,credited:false,xpCredited:0,error};
    }
  }

  return Object.freeze({
    writePatch,
    acceptMission:()=>writePatch({status:'accepted',phase:'mission',step:0}),
    declineMission:()=>writePatch({status:'declined',phase:'dossier',step:0}),
    recordMissionStep:step=>writePatch({status:'accepted',phase:'mission',step:Math.max(0,Math.min(1000,step|0))}),
    beginMenuTour:(step=0)=>writePatch({status:'accepted',missionCompleted:true,phase:'menu',step:Math.max(0,Math.min(1000,step|0))}),
    recordMenuStep:step=>writePatch({status:'accepted',missionCompleted:true,phase:'menu',step:Math.max(0,Math.min(1000,step|0))}),
    completeTour:(step=0)=>writePatch({status:'completed',missionCompleted:true,phase:'done',step:Math.max(0,Math.min(1000,step|0))}),
    restartForReplay:(targetPhase='mission',currentProfile=null)=>{
      const legacyPaid=!currentProfile?.tutorial&&Number(currentProfile?.xp||0)>0;
      const rewarded=currentProfile?.tutorial?.rewarded===true||legacyPaid;
      const missionCompleted=currentProfile?.tutorial?.missionCompleted===true||legacyPaid;
      return writePatch({status:'accepted',phase:targetPhase,step:0,rewarded,missionCompleted});
    },
    claimReward,
  });
}

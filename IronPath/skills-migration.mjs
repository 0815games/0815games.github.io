import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {DEFAULT_BUILD,isV2BuildString,isLegacyBuildString,parseBuild,pointsLeft} from './skills.mjs?v=20261119-block9';

export const LEGACY_SKILL_BACKUP_PREFIX='ironpath:skills-legacy-backup:';

const isStorage=v=>Boolean(v&&typeof v.getItem==='function'&&typeof v.setItem==='function');

export function needsSkillMigration(profile){
  if(!profile||typeof profile!=='object')return false;
  return !isV2BuildString(profile.skills);
}

export function backupLegacySkills(arg1,arg2,arg3){
  const [storage,uid,rawSkills]=isStorage(arg1)?[arg1,arg2,arg3]:[arg2,arg1,arg3];
  if(!storage||!uid||typeof rawSkills!=='string'||!rawSkills||isV2BuildString(rawSkills))return false;
  try{
    const key=`${LEGACY_SKILL_BACKUP_PREFIX}${uid}`;
    if(!storage.getItem(key)){
      storage.setItem(key,JSON.stringify({skills:rawSkills,savedAt:Date.now()}));
    }
    return true;
  }catch{
    return false;
  }
}

export function readLegacySkillBackup(arg1,arg2){
  const [storage,uid]=isStorage(arg1)?[arg1,arg2]:[arg2,arg1];
  if(!storage||!uid)return null;
  try{
    const raw=storage.getItem(`${LEGACY_SKILL_BACKUP_PREFIX}${uid}`);
    return raw?JSON.parse(raw):null;
  }catch{
    return null;
  }
}

export function summarizeSkillMigration(input,maybeLevel){
  const rawSkills=input&&typeof input==='object'?input.skills:input;
  const xp=input&&typeof input==='object'&&Number.isFinite(input.xp)?Math.max(0,input.xp):0;
  const level=Number.isInteger(maybeLevel)&&maybeLevel>=1?maybeLevel:characterProgress(xp).level;
  const hadLegacy=isLegacyBuildString(rawSkills);
  const parsed=parseBuild(rawSkills,level);
  const availablePoints=pointsLeft(parsed,level);
  return {
    hadLegacy,
    refundedFromSpent:parsed.legacyHadSpent,
    availablePoints,
    refundedPoints:availablePoints,
    targetBuild:DEFAULT_BUILD
  };
}

// Pure migration helper used by account.js RTDB transaction (plus archival backup
// in storage). Returns {migrated, profile, summary} safely & idempotently.
export function migrateSkillsProfile(profile,options={}){
  if(!profile||typeof profile!=='object')return {migrated:false,profile:null,summary:null};
  if(isV2BuildString(profile.skills))return {migrated:false,profile,summary:null};
  const {uid=null,storage=null,levelOf=null}=typeof options==='function'?{levelOf:options}:(options||{});
  const xp=Number.isInteger(profile.xp)&&profile.xp>=0?profile.xp:0;
  const level=typeof levelOf==='function'?levelOf(xp):characterProgress(xp).level;
  if(typeof profile.skills==='string'&&profile.skills)backupLegacySkills(storage,uid,profile.skills);
  const summary=summarizeSkillMigration(profile.skills,level);
  return {
    migrated:true,
    profile:{...profile,skills:DEFAULT_BUILD},
    summary
  };
}

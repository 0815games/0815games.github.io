import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_SKILL_BACKUP_PREFIX,
  needsSkillMigration,
  backupLegacySkills,
  readLegacySkillBackup,
  summarizeSkillMigration,
  migrateSkillsProfile
} from '../skills-migration.mjs';
import {DEFAULT_BUILD,MAX_CLASS_POINTS,pointsLeft,parseBuild} from '../skills.mjs';

function makeStorage(){
  const map=new Map();
  return {
    getItem:k=>map.has(k)?map.get(k):null,
    setItem:(k,v)=>map.set(k,String(v)),
    size:()=>map.size
  };
}

test('legacy V1 builds trigger one-time migration and archive backup while V2 builds are untouched',()=>{
  const storage=makeStorage();
  const legacyProfile={name:'Vet',xp:10000,skills:'3,2,1,0,0;assault;1010000000'};
  assert.equal(needsSkillMigration(legacyProfile),true);
  assert.equal(needsSkillMigration({xp:0,skills:DEFAULT_BUILD}),false);
  assert.equal(needsSkillMigration({xp:0,skills:'v2;recon;2;0;10000000000000'}),false);

  const first=migrateSkillsProfile(legacyProfile,{uid:'u1',storage,levelOf:()=>15});
  assert.equal(first.migrated,true);
  assert.equal(first.profile.skills,DEFAULT_BUILD);
  assert.equal(first.summary.hadLegacy,true);
  assert.equal(first.summary.refundedFromSpent,true);
  assert.equal(first.summary.availablePoints,14);
  assert.equal(first.summary.refundedPoints,14);

  const backup=readLegacySkillBackup(storage,'u1');
  assert.equal(backup.skills,'3,2,1,0,0;assault;1010000000');
  assert.ok(backup.savedAt>0);

  // Subsequent backup call never overwrites the original archived legacy string
  backupLegacySkills(storage,'u1','1,0,0,0,0;engineer');
  assert.equal(readLegacySkillBackup(storage,'u1').skills,'3,2,1,0,0;assault;1010000000');

  // Re-running migration on the already-migrated profile is an idempotent no-op
  const second=migrateSkillsProfile(first.profile,{uid:'u1',storage});
  assert.equal(second.migrated,false);
  assert.equal(second.profile.skills,DEFAULT_BUILD);
  assert.equal(second.summary,null);
});

test('high-level legacy refunds respect MAX_CLASS_POINTS and unallocated/invalid profiles migrate safely',()=>{
  const high=summarizeSkillMigration({xp:0,skills:'3,3,2,1,1;logistics'},30);
  assert.equal(high.hadLegacy,true);
  assert.equal(high.refundedPoints,MAX_CLASS_POINTS);
  assert.equal(pointsLeft(parseBuild(DEFAULT_BUILD,30),30),MAX_CLASS_POINTS);

  const empty=migrateSkillsProfile({name:'New',xp:0},{uid:'u2'});
  assert.equal(empty.migrated,true);
  assert.equal(empty.profile.skills,DEFAULT_BUILD);
  assert.equal(empty.summary.hadLegacy,false);
  assert.equal(empty.summary.refundedFromSpent,false);
  assert.equal(empty.summary.availablePoints,0);

  // Storage throwing errors never crashes migration
  const brokenStorage={
    getItem(){throw new Error('quota');},
    setItem(){throw new Error('quota');}
  };
  assert.equal(backupLegacySkills(brokenStorage,'u3','2,0,0,0,0;assault'),false);
  assert.equal(readLegacySkillBackup(brokenStorage,'u3'),null);
  const safe=migrateSkillsProfile({xp:250,skills:'1,0,0,0,0;assault'},{uid:'u3',storage:brokenStorage,levelOf:()=>2});
  assert.equal(safe.migrated,true);
  assert.equal(safe.profile.skills,DEFAULT_BUILD);
  assert.equal(safe.summary.refundedPoints,1);
  assert.equal(LEGACY_SKILL_BACKUP_PREFIX,'ironpath:skills-legacy-backup:');
});

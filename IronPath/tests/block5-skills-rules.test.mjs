import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {
  BLOCK5_SOURCE_SHA256,
  BLOCK5_SKILLS_VALIDATE,
  LEGACY_SKILLS_VALIDATE,
  applyBlock5SkillsRules,
  buildBlock5SkillsCandidate
} from '../firebase/block5-skills-candidate.mjs';
import {buildFriendPortraitCandidate} from '../firebase/friend-portrait-candidate.mjs';
import {buildMaintenanceRulesCandidate} from '../release-tools/maintenance-rules.mjs';
import {compareRules,compareRepoDrafts} from '../scripts/rules-publish-dry-run.mjs';
import {SKILL_PATHS,encodeBuild,parseBuild,DEFAULT_BUILD} from '../core/skills.mjs';

test('Block 5 offline skills RTDB candidate preserves reference SHA-256 and alters only the 3 skills validators',async()=>{
  const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),BLOCK5_SOURCE_SHA256,'live reference untouched');
  const baseline=JSON.parse(bytes),candidate=buildBlock5SkillsCandidate(bytes),changed=[];
  const walk=(a,b,path='')=>{
    if(a&&b&&typeof a==='object'&&typeof b==='object'){
      assert.deepEqual(Object.keys(b).sort(),Object.keys(a).sort(),path);
      for(const key of Object.keys(a))walk(a[key],b[key],`${path}/${key}`);
    }else if(a!==b)changed.push(path);
  };
  walk(baseline,candidate);
  assert.deepEqual(changed.sort(),[
    '/rules/fourParties/$partyId/profiles/$uid/skills/.validate',
    '/rules/parties/$partyId/profiles/$uid/skills/.validate',
    '/rules/players/$uid/skills/.validate'
  ]);
  assert.equal(candidate.rules.players.$uid.skills['.read'],baseline.rules.players.$uid.skills['.read'],'friend skills read grant preserved');
  assert.equal(candidate.rules.players.$uid.$other['.validate'],false,'catch-all preserved');
  assert.throws(()=>applyBlock5SkillsRules(structuredClone(candidate.rules)),/re-audit/,'double application refuses');
  assert.throws(()=>buildBlock5SkillsCandidate(Buffer.concat([bytes,Buffer.from(' ')])),/re-audit/);
});

test('Block 5 complete draft matches generated candidate, regex validates every V2 build, and CI emulator step is wired',async()=>{
  const bytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
  const expected=buildBlock5SkillsCandidate(bytes);
  const draft=JSON.parse(await readFile(new URL('../firebase/block5.complete.draft.rules.json',import.meta.url),'utf8'));
  assert.deepEqual(draft,expected,'checked-in draft matches candidate generator output');

  const v2Match=/^v2;(none|(assault|engineer|logistics|medic|recon|airDefense);[1-3];[0-2];[01]{14})$/;
  const legacyMatch=/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10}(;[12]|;[012];[01]{40}([01]{15}([01]{20})?)?)?)?$/;
  assert.ok(BLOCK5_SKILLS_VALIDATE.includes(LEGACY_SKILLS_VALIDATE.slice('newData.isString() && '.length)));
  assert.ok(v2Match.test(DEFAULT_BUILD));
  for(const p of SKILL_PATHS){
    const encoded=encodeBuild(parseBuild(`v2;${p.id};3;2;01111111111110`,18));
    assert.ok(v2Match.test(encoded),`valid V2 encoding matches rule for ${p.id}`);
  }
  assert.ok(legacyMatch.test('2,0,0,0,0;assault;1000000000;1'));
  assert.equal(v2Match.test('v2;bogus;1;0;00000000000000'),false);
  assert.equal(v2Match.test('v2;airDefense;4;0;00000000000000'),false);
  assert.equal(v2Match.test('v2;none;1;0;00000000000000'),false);

  const emu=await readFile(new URL('../firebase/firebase-block5.emulator.json',import.meta.url),'utf8');
  assert.match(emu,/block5\.complete\.draft\.rules\.json/);
  const pkg=JSON.parse(await readFile(new URL('../firebase/rules-test/package.json',import.meta.url),'utf8'));
  assert.ok(pkg.scripts['test:block5']);
  assert.match(pkg.scripts['test:block5'],/block5-publish-rules\.test\.mjs/);
  const ci=await readFile(new URL('../../.github/workflows/ironpath-firebase-rules.yml',import.meta.url),'utf8');
  assert.match(ci,/test:block5/);
});

test('Block 5 publish rules preserve live Block 4 additions and MAINTENANCE_GATE and differ only in the 3 skills validators',async()=>{
  const workshopBytes=await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url));
  const publishText=await readFile(new URL('../firebase/BLOCK5-RULES-TO-PUBLISH.json',import.meta.url),'utf8');
  assert.equal(publishText.includes('(?:'),false,'Firebase RTDB uses RE2 and rejects non-capturing groups');

  const publish=JSON.parse(publishText);
  assert.equal(publish.rules['.read'],false);
  assert.equal(publish.rules['.write'],false);

  const adminRead=publish.rules._ironpathMaintenanceAdminAccess?.['.read']??'';
  const match=adminRead.match(/^auth != null && auth\.uid === '([A-Za-z0-9_-]{1,128})'$/);
  assert.ok(match,'publish rules preserve the dedicated maintenance admin access rule');

  const liveBase=buildMaintenanceRulesCandidate(
    buildFriendPortraitCandidate(workshopBytes),
    {adminUid:match[1]}
  ).candidate;
  const report=compareRules(liveBase.rules,publish.rules);
  assert.deepEqual(report.blockers,[],'no blockers against reconstructed live baseline');
  assert.deepEqual(report.added,[],'no unexpected paths added');
  assert.deepEqual(report.warnings.map(item=>`${item.path}:${item.mode}`).sort(),[
    '/fourParties/$partyId/profiles/$uid/skills:.validate',
    '/parties/$partyId/profiles/$uid/skills:.validate',
    '/players/$uid/skills:.validate'
  ]);

  const expected=structuredClone(liveBase);
  applyBlock5SkillsRules(expected.rules);
  assert.deepEqual(publish,expected,'BLOCK5-RULES-TO-PUBLISH matches exact additive transform over live rules');

  const drafts=await compareRepoDrafts(publish.rules);
  assert.deepEqual(drafts.missing,[],'covers all shipped *.complete.draft.rules.json baselines');
  assert.throws(()=>applyBlock5SkillsRules(structuredClone(publish.rules)),/re-audit/);
});

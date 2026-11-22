import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {anchorReport,currentToken,tokenHistogram} from '../scripts/patch-lib.mjs';
import {planBump,applyBump,verifyBump,formatPlan} from '../scripts/patch-bump.mjs';
import {runPatchCheck,tapSummary,patchLogState,LOG_KEEP,CONTRACT_TESTS} from '../scripts/patch-check.mjs';

// Contract tests for the patch tooling.
//
// patch-bump.mjs rewrites the cache wave of a real release, and patch-check.mjs
// is the verdict people act on. Both are exercised here against a miniature
// repository that carries the same shapes as IronPath: the seven anchors, an
// older asset revision that must survive, and field notes whose historical
// `build:` fields must not move. Without a fixture these tools could only be
// tested by running a release.

const IRONPATH=fileURLToPath(new URL('..',import.meta.url));
// Assembled at runtime on purpose. The secret scan reads added lines of the real
// diff, so a literal credential header inside this test file would flag the test
// itself and force an allowlist entry for it. The fixture still receives the real
// shape, so the scan and its allowlist are both exercised end to end.
const pemHeader=['-----BEGIN','PRIVATE KEY-----'].join(' ');
const OLD='20260101-fixture0';
const NEW='20260102-fixture1';
const ANCIENT='20251201-ancient1';

const FILES={
  'release-version.json':`{\n  "format": 1,\n  "build": "${OLD}"\n}\n`,
  'index.html':`<!doctype html>
<html lang="de"><head>
  <meta name="ironpath-build" content="${OLD}">
  <link rel="stylesheet" href="style.css?v=${OLD}">
</head><body>
  <p class="build-stamp" aria-hidden="true">BUILD ${OLD}</p>
  <img src="assets/old-art.jpg?v=${ANCIENT}" alt="">
  <script type="module" src="account-entry.mjs?v=${OLD}"></script>
  <div id="loading"><p class="build-stamp" aria-hidden="true">BUILD ${OLD}</p></div>
</body></html>
`,
  'style.css':`/* unchanged */\n`,
  'account-entry.mjs':`import './account.js?v=${OLD}';\n`,
  'account.js':`import './game.js?v=${OLD}';\nimport './match.mjs?v=${OLD}';\n`,
  'game.js':`import './match.mjs?v=${OLD}';\n`,
  'match.mjs':`export const value=1;\n`,
  'language.mjs':`export const getLanguage=()=>'de';\n`,
  'login-scene.mjs':`import './language.mjs?v=${OLD}';\nexport const LOGIN_SCENE_VERSION='${OLD}';\n`,
  'patch-notes.mjs':`// Field notes. The protocol lives in docs/PATCH-LOG.md and the plan in
// docs/PATCH-BLOECKE.md.
import {getLanguage} from './language.mjs?v=${OLD}';
export const RELEASED_PATCHES=[
  {id:'fixture0',build:'${OLD}',pr:900,
   title:[{de:'Fixturwelle',en:'Fixture wave'}],
   shipped:[{de:'Alles neu',en:'All new'}],open:[]},
  {id:'older1',build:'20251231-older1',pr:899,
   title:[{de:'Älter',en:'Older'}],shipped:[{de:'Alt',en:'Old'}],open:[]},
];
export const PLANNED_PATCHES=[];
// Raised the cache wave to ${OLD} across four files, so a phone cannot keep
// serving the previous modules. Visual check: the stamp must read BUILD ${OLD}.
`,
  'browser-tests/avatar-handover.cjs':`const build=document.querySelector('meta[name="ironpath-build"]')?.content||'${OLD}';\nmodule.exports={build};\n`,
  'browser-tests/interface-smoke.cjs':`await page.evaluate(()=>{document.querySelector('#versionNoticeText').textContent='New version ${OLD}';});\n`,
  'README.md':'# Fixture\n\nStrukturkarte der Spielwurzel.\n',
  'docs/PATCH-LOG.md':`# Patch-Log

## IPL-0001 – Ausgangsstand
- Prüfungen: keine

## IPL-0002 – Erste Welle
- Prüfungen: Suite grün

## IPL-0003 – Welle ${OLD} veröffentlicht
- Git / PR / Release: PR #900 gemergt, Welle ${OLD}
`,
  'docs/PATCH-BLOECKE.md':'# Patchblöcke\n\n- [ ] offen\n',
  'docs/DATENBLATT.md':'# Datenblatt\n',
  'docs/CHECKLIST.md':'# Checkliste\n',
  'scripts/patch-bump.mjs':'// development tool, never shipped\nexport const tool=true;\n',
  'tests/fixture-only.test.mjs':`import {test} from 'node:test';\ntest('fixture',()=>{});\n`,
  'assets/old-art.jpg':'not really a jpg\n',
};

async function fixture(t,{git:withGit=false}={}){
  const repo=await mkdtemp(join(tmpdir(),'patch-tooling-'));
  t.after(()=>rm(repo,{recursive:true,force:true}));
  const root=join(repo,'IronPath');
  for(const [path,content] of Object.entries(FILES)){
    const full=join(root,path);
    await mkdir(join(full,'..'),{recursive:true});
    await writeFile(full,content);
  }
  // The working instruction sits above IronPath, like in the real repository.
  await writeFile(join(repo,'AGENTS.md'),'# Arbeitsanweisung\n');
  const git=(...args)=>execFileSync('git',['-c','user.email=fixture@example.invalid',
    '-c','user.name=Fixture','-c','commit.gpgsign=false',...args],{cwd:repo,encoding:'utf8'});
  if(withGit){git('init','-q');git('add','-A');git('commit','-qm','Basis');}
  return {repo,root,git,read:async path=>readFile(join(root,path),'utf8'),
    write:async(path,content)=>writeFile(join(root,path),content)};
}

test('the miniature tree carries one consistent wave before a bump',async t=>{
  const {root}=await fixture(t);
  assert.equal(currentToken(root),OLD);
  const report=anchorReport(root);
  assert.equal(report.length,7,'alle Anker werden gelesen');
  for(const anchor of report)
    assert.ok(anchor.ok&&anchor.unique[0]===OLD,`${anchor.label}: ${anchor.unique.join('/')}`);
  const ancient=tokenHistogram(root).find(entry=>entry.token===ANCIENT);
  assert.ok(ancient,'die alte Asset-Revision ist sichtbar');
  assert.deepEqual([...ancient.files],['index.html']);
});

test('a bump plan names exactly the known anchors and keeps the notes history',async t=>{
  const {root}=await fixture(t);
  const plan=planBump({root,from:OLD,to:NEW});
  assert.deepEqual(plan.problems,[],'keine unbekannte Stelle ohne ?v=');
  assert.deepEqual(plan.anchorFilesTouched,
    ['browser-tests/avatar-handover.cjs','browser-tests/interface-smoke.cjs','index.html',
     'login-scene.mjs','release-version.json'].sort(),
    'genau die fünf Anker-Dateien ändern Zeilen ohne ?v=');
  assert.ok(plan.nonVersion.length>=6,'index.html trägt die Welle an mehreren Stellen');
  assert.ok(plan.kept.length>=3,'patch-notes.mjs behält build:-Felder und Protokollsätze');
  for(const kept of plan.kept) assert.equal(kept.file,'patch-notes.mjs');
  assert.ok(plan.tokens>=10,`der Plan bewegt die Welle wirklich (${plan.tokens} Token)`);
  assert.ok(!JSON.stringify(plan.files).includes(ANCIENT),'die alte Asset-Revision bleibt stehen');
  assert.match(formatPlan(plan),/Cache-Welle/);
});

test('applying a bump moves imports but not the released history',async t=>{
  const {root,read}=await fixture(t);
  const plan=planBump({root,from:OLD,to:NEW});
  const applied=applyBump(plan);
  assert.equal(applied.written,plan.files.length);
  assert.equal(currentToken(root),NEW);
  assert.ok(verifyBump({root,to:NEW}).wrong.some(entry=>entry.label.includes('RELEASED_PATCHES')),
    'solange der neue Feldnotizen-Eintrag fehlt, ist die Prüfung rot - genau das soll sie');

  const notes=await read('patch-notes.mjs');
  assert.ok(notes.includes(`?v=${NEW}`),'der Import der Feldnotizen wandert mit');
  assert.ok(notes.includes(`build:'${OLD}'`),'die veröffentlichte Welle bleibt als Geschichte stehen');
  assert.ok(notes.includes(`build:'20251231-older1'`),'auch der ältere Eintrag bleibt');
  assert.ok(notes.includes(`cache wave to ${OLD}`),'Prosa über die alte Welle wird nicht umgeschrieben');
  const html=await read('index.html');
  assert.ok(html.includes(`?v=${ANCIENT}`),'keine alte Asset-Revision wurde überschrieben');
  assert.ok(html.includes(`?v=${NEW}`),'die Importe tragen die neue Welle');
  assert.ok(html.includes(`content="${NEW}"`),'der Meta-Tag wandert mit');
  assert.equal((await read('docs/PATCH-LOG.md')).includes(NEW),false,
    'Markdown ist kein Ziel des Bumps');
});

test('after the notes entry exists the check is green again',async t=>{
  const {root,read,write}=await fixture(t);
  applyBump(planBump({root,from:OLD,to:NEW}));
  const before=await runPatchCheck({root,contracts:false});
  assert.equal(before.failed,true);
  assert.ok(before.findings.some(finding=>finding.level==='fail'&&finding.check==='stempel'));

  // What a human does next: add the new entry at the top of RELEASED_PATCHES.
  const notes=await read('patch-notes.mjs');
  await write('patch-notes.mjs',notes.replace(
    'export const RELEASED_PATCHES=[',
    `export const RELEASED_PATCHES=[\n  {id:'fixture1',build:'${NEW}',pr:901,\n   title:[{de:'Neu',en:'New'}],shipped:[{de:'Neu',en:'New'}],open:[]},`));
  const after=await runPatchCheck({root,contracts:false});
  assert.deepEqual(after.findings.filter(finding=>finding.level==='fail'),[],
    'nach dem Feldnotizen-Eintrag ist kein Anker mehr rot');
  assert.equal(after.failed,false);
  assert.ok(verifyBump({root,to:NEW}).ok);
});

test('a forgotten anchor and stray documentation are reported by name',async t=>{
  const {root,read,write}=await fixture(t);
  await write('login-scene.mjs',(await read('login-scene.mjs')).split(OLD).join('20251130-stale1'));
  await write('PLAN-LEICHE.md','# vergessen\n');
  const result=await runPatchCheck({root,contracts:false});
  assert.equal(result.failed,true);
  const stempel=result.findings.filter(finding=>finding.check==='stempel'&&finding.level==='fail');
  assert.ok(stempel.some(finding=>finding.text.includes('login-scene.mjs')),
    'die vergessene Datei wird genannt');
  const wellen=result.findings.filter(finding=>finding.check==='wellen'&&finding.level==='fail');
  assert.ok(wellen.some(finding=>finding.text.includes('login-scene.mjs')&&finding.text.includes('20251130-stale1')),
    'eine zweite Welle in login-scene.mjs fällt auf');
  const struktur=result.findings.filter(finding=>finding.check==='struktur'&&finding.level==='fail');
  assert.ok(struktur.some(finding=>finding.text.includes('PLAN-LEICHE.md')),
    'Doku in der Spielwurzel wird genannt');
});

test('an older asset revision inside index.html is not a finding',async t=>{
  const {root}=await fixture(t);
  const result=await runPatchCheck({root,contracts:false});
  assert.deepEqual(result.findings.filter(finding=>finding.check==='wellen'&&finding.level==='fail'),[],
    `${ANCIENT} in index.html ist Vertrag, kein Fehler`);
  assert.equal(result.failed,false);
});

test('the log numbering, the archive boundary and the overflow are checked',async t=>{
  const {root,write,read}=await fixture(t);
  const intact=patchLogState(root);
  assert.equal(intact.entries,3);
  assert.equal(intact.newest,'IPL-0003');
  assert.deepEqual(intact.gaps,[]);
  assert.equal(intact.mentionsToken,true,'der neueste Eintrag nennt die aktuelle Welle');

  await write('docs/PATCH-LOG.md',(await read('docs/PATCH-LOG.md')).replace('## IPL-0002','## IPL-0004'));
  const gapped=patchLogState(root);
  // 0003 -> 0004 ist lückenlos; nur der Sprung über das umbenannte 0002 fehlt.
  assert.deepEqual(gapped.gaps,['IPL-0001 → IPL-0003']);

  await write('docs/PATCH-LOG.md',(await read('docs/PATCH-LOG.md')).replace('## IPL-0004','## IPL-0002'));
  await write('docs/PATCH-LOG-ARCHIV.md','# Archiv\n\n## IPL-0002 – doppelt abgelegt\n');
  const doubled=patchLogState(root);
  assert.deepEqual(doubled.duplicates,['IPL-0002']);
  assert.ok(doubled.misfiled.length,'Archiv und Log überlappen');

  await write('docs/PATCH-LOG-ARCHIV.md','# Archiv\n\n## IPL-0001 – alt\n');
  await write('docs/PATCH-LOG.md',(await read('docs/PATCH-LOG.md')).replace(/## IPL-0001[\s\S]*?\n\n/,''));
  const split=patchLogState(root);
  assert.deepEqual(split.duplicates,[]);
  assert.deepEqual(split.misfiled,[]);
  assert.deepEqual(split.gaps,[]);
  assert.equal(split.entries,3,'zusammen bleiben alle drei Einträge erhalten');
  assert.equal(split.archiveIds.length,1);
  assert.equal(split.logIds.length,2);
  assert.equal(split.overflow,0);
  assert.ok(LOG_KEEP===20,'die Vereinbarung lautet: die neuesten 20 Einträge im Log');

  const many=['# Log\n'];
  for(let index=1;index<=LOG_KEEP+5;index+=1)
    many.push(`## IPL-${String(index).padStart(4,'0')} – Eintrag\n- Prüfungen: keine\n`);
  await write('docs/PATCH-LOG.md',many.join('\n'));
  await rm(join(root,'docs','PATCH-LOG-ARCHIV.md'));
  const overflowed=patchLogState(root);
  assert.equal(overflowed.overflow,5,'fünf Einträge gehören ins Archiv');
  const result=await runPatchCheck({root,contracts:false});
  assert.ok(result.findings.some(finding=>finding.check==='patchlog'&&finding.level==='warn'&&
    finding.text.includes('PATCH-LOG-ARCHIV.md')),'der Hinweis nennt das Archiv');
});

test('the secret scan sees a new private key and skips known validation code',async t=>{
  const {root,write,read,git}=await fixture(t,{git:true});
  const clean=await runPatchCheck({root,contracts:false,base:'HEAD'});
  assert.equal(clean.failed,false,'ein sauberer Baum besteht die Prüfung');
  assert.ok(clean.findings.some(finding=>finding.check==='geheimnisse'&&finding.level==='ok'));

  await write('docs/PATCH-LOG.md',
    `${await read('docs/PATCH-LOG.md')}\n## IPL-0004 – Nachtrag\n- Schlüssel: ${pemHeader}\n`);
  const leaked=await runPatchCheck({root,contracts:false,base:'HEAD'});
  assert.equal(leaked.failed,true);
  assert.ok(leaked.findings.some(finding=>finding.check==='geheimnisse'&&finding.level==='fail'&&
    finding.text.includes('PEM-Privatschlüssel')));

  // Same line in a file that legitimately validates credentials: allowlisted.
  await write('docs/PATCH-LOG.md',(await read('docs/PATCH-LOG.md')).replace(/\n## IPL-0004[\s\S]*$/,'\n'));
  await mkdir(join(root,'release-tools','api'),{recursive:true});
  await writeFile(join(root,'release-tools','api','session.mjs'),
    `if(!key.startsWith('${pemHeader}'))throw Error('invalid');\n`);
  git('add','-A');   // git diff HEAD sieht nur tracked Inhalt
  const allowlisted=await runPatchCheck({root,contracts:false,base:'HEAD'});
  assert.deepEqual(allowlisted.findings.filter(finding=>finding.check==='geheimnisse'&&finding.level==='fail'),[],
    'Prüfcode ohne echten Schlüssel bleibt grün');
});

test('a shallow clone is reported before anybody trusts an ancestry check',async t=>{
  const {root}=await fixture(t,{git:true});
  const shallow=await runPatchCheck({root,contracts:false,base:'HEAD',isShallow:()=>true});
  const warn=shallow.findings.filter(finding=>finding.check==='git'&&finding.level==='warn'&&
    finding.text.includes('flacher Klon'));
  assert.equal(warn.length,1,'ein flacher Klon bekommt genau einen Hinweis');
  assert.match(warn[0].text,/--unshallow/,'der Hinweis nennt die Abhilfe');
  assert.equal(shallow.failed,false,'ein flacher Klon ist ein Hinweis, kein Fehler');

  const full=await runPatchCheck({root,contracts:false,base:'HEAD',isShallow:()=>false});
  assert.ok(full.findings.some(finding=>finding.check==='git'&&finding.level==='ok'&&
    finding.text.includes('voller Klon')),'ein voller Klon wird als aussagekräftig gemeldet');
});

test('a TAP summary is read by label, not by a literal placeholder',()=>{
  const output=['TAP version 13','ok 1 - first','not ok 2 - second case','# tests 2','# suites 0',
    '# pass 1','# fail 1','# cancelled 0','# skipped 0','# todo 0'].join('\n');
  const summary=tapSummary(output);
  assert.equal(summary.complete,true);
  assert.deepEqual({tests:summary.tests,pass:summary.pass,fail:summary.fail,skipped:summary.skipped},
    {tests:2,pass:1,fail:1,skipped:0});
  assert.deepEqual(summary.failing,['second case']);
  assert.equal(tapSummary('keine Ausgabe').complete,false);
});

test('the real tree passes the pre-flight check',async()=>{
  const result=await runPatchCheck({root:IRONPATH,contracts:true});
  assert.equal(result.failed,false,
    result.findings.filter(finding=>finding.level==='fail').map(finding=>`${finding.check}: ${finding.text}`).join('\n'));
  const contracts=result.findings.filter(finding=>finding.check==='verträge');
  assert.equal(contracts.length,1);
  assert.equal(contracts[0].level,'ok');
  assert.match(contracts[0].text,new RegExp(`^${CONTRACT_TESTS.length} Dateien: \\d+ Tests`));
},{timeout:240000});

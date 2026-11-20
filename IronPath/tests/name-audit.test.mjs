import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,readFile,writeFile,stat,rm,symlink,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../..',import.meta.url));
const script=join(root,'IronPath/scripts/audit-character-names.py');
const run=(...args)=>spawnSync('python3',[script,...args],{encoding:'utf8',cwd:root,timeout:5000});
async function fixture_(t,text){const dir=await mkdtemp(join(tmpdir(),'ironpath-name-audit-'));t.after(()=>rm(dir,{recursive:true,force:true}));const source=join(dir,'export.json');await writeFile(source,text);return {dir,source};}

test('the offline draft audit examines every exported profile, not only search listings',async t=>{
 const data={players:{a:{name:'  Straße '},b:{name:'STRASSE'},c:{name:'ÉLISE'},d:{name:'e\u0301lise'},e:{name:'Alex'},f:{name:'Ａlex'},bad:{name:42},empty:{name:'  '}},friendNames:{}};
 const {source}=await fixture_(t,JSON.stringify(data)),r=run(source);assert.equal(r.status,0,r.stderr);
 const summary=JSON.parse(r.stdout);
 assert.equal(summary.profiles,8);assert.equal(summary.namedProfiles,6);assert.equal(summary.invalidProfiles,2);
 assert.equal(summary.conflictGroups,2);assert.equal(summary.conflictingProfiles,4);
 assert.equal(summary.policy,'DRAFT_NFC_DEFAULT_CASEFOLD');assert.ok(summary.unicodeVersion);
 assert.equal(summary.completeExportVerified,false,'an offline file cannot prove the source export was complete');
 for(const secret of ['Straße','STRASSE','ÉLISE','e\u0301lise','Alex','Ａlex','"a"','"b"'])assert.ok(!r.stdout.includes(secret),`public summary does not reveal ${secret}`);
});

test('a deliberately requested private report is outside the repository, mode 0600 and never overwritten',async t=>{
 const {source,dir}=await fixture_(t,JSON.stringify({players:{alpha:{name:'Alice'},beta:{name:'ALICE'}}}));
 const output=join(dir,'private-report.json'),r=run(source,'--private-report',output);assert.equal(r.status,0,r.stderr);
 assert.ok(!r.stdout.includes('Alice'));assert.ok(!r.stdout.includes('alpha'));
 assert.equal((await stat(output)).mode&0o777,0o600);
 const report=JSON.parse(await readFile(output,'utf8'));
 assert.deepEqual(report.conflicts[0].members.map(x=>x.uid).sort(),['alpha','beta']);
 assert.equal(report.conflicts[0].canonical,'alice');
 const again=run(source,'--private-report',output);assert.notEqual(again.status,0,'existing private reports are never replaced');
 assert.deepEqual(JSON.parse(await readFile(output,'utf8')),report);
 const repoPath=resolve(root,'IronPath/tests/__forbidden-private-report.json');
 const forbidden=run(source,'--private-report',repoPath);assert.notEqual(forbidden.status,0,'reports cannot be written into the checkout');
 const link=join(dir,'existing-link.json');await symlink(output,link);
 assert.notEqual(run(source,'--private-report',link).status,0,'an existing symlink is never followed or replaced');
 assert.deepEqual(JSON.parse(await readFile(output,'utf8')),report);
 const repoLink=join(dir,'checkout-link');await symlink(root,repoLink,'dir');
 assert.notEqual(run(source,'--private-report',join(repoLink,'__forbidden-private-report.json')).status,0,'a symlinked path into the checkout is also refused');
});

test('the offline audit agrees with the shared fixture without divergence',async t=>{
 const fixture=JSON.parse(await readFile(new URL('../firebase/name-policy-fixtures.json',import.meta.url),'utf8'));
 assert.equal(fixture.version,2);
 for(const entry of fixture.cases){
  assert.equal(entry.same,entry.casefoldSame,`NFC_CASEFOLD_V2 eliminates engine divergence for ${JSON.stringify(entry.names)}`);
  const players={};
  entry.names.forEach((name,index)=>{players[`uid${index}`]={name};});
  const {source}=await fixture_(t,JSON.stringify({players})),r=run(source);
  assert.equal(r.status,0,r.stderr);
  const summary=JSON.parse(r.stdout);
  assert.equal(summary.conflictGroups,entry.casefoldSame?1:0,
   `case folding groups ${JSON.stringify(entry.names)}: ${entry.why}`);
  assert.equal(summary.policy,'DRAFT_NFC_DEFAULT_CASEFOLD');
  assert.equal(summary.completeExportVerified,false);
  assert.ok(!r.stdout.includes('Alex')&&!r.stdout.includes('Straße'),'stdout stays aggregated');
 }
 const game=await readFile(new URL('../character-name.mjs',import.meta.url),'utf8');
 assert.match(game,/CHARACTER_NAME_POLICY='NFC_CASEFOLD_V2'/);
});

test('invalid or incomplete-looking input fails closed without echoing data',async t=>{
 for(const text of ['{}','{"players":null}','{"players":{"one":{"name":"secret"},"one":{"name":"secret2"}}}','{"players":{},"other":NaN}','{bad json']){
  const {source}=await fixture_(t,text),r=run(source);assert.notEqual(r.status,0);assert.equal(r.stdout,'');assert.ok(!r.stderr.includes('secret'));
 }
});

test('legacy invalid profiles are counted rather than mistaken for a clean inventory',async t=>{
 const {source}=await fixture_(t,JSON.stringify({players:{a:{name:'a'},b:{name:' a '},c:null,d:{},e:{name:'\ud800'},f:{name:'valid'}}}));
 const r=run(source);assert.equal(r.status,0,r.stderr);const summary=JSON.parse(r.stdout);
 assert.equal(summary.profiles,6);assert.equal(summary.invalidProfiles,5);
 assert.equal(summary.conflictGroups,1,'even too-short names participate in conflict detection');assert.equal(summary.conflictingProfiles,2);
});

test('an invalid account key is flagged without excluding its name from collision detection',async t=>{
 const {source}=await fixture_(t,JSON.stringify({players:{bob:{name:'Alex'},'bad/path':{name:'alex'}}}));
 const r=run(source);assert.equal(r.status,0,r.stderr);const summary=JSON.parse(r.stdout);
 assert.equal(summary.invalidProfiles,1);assert.equal(summary.namedProfiles,1);
 assert.equal(summary.conflictGroups,1);assert.equal(summary.conflictingProfiles,2);
});

test('oversized files and non-regular inputs are rejected without hanging',async t=>{
 const {dir}=await fixture_(t,'{}'),huge=join(dir,'huge.json');const file=await open(huge,'w');await file.truncate(128*1024*1024+1);await file.close();
 assert.equal(run(huge).status,2);
 if(process.platform!=='win32'){
  const fifo=join(dir,'pipe');assert.equal(spawnSync('mkfifo',[fifo]).status,0);
  const r=run(fifo);assert.equal(r.signal,null,'FIFO must not block until the timeout');assert.equal(r.status,2);
 }
});

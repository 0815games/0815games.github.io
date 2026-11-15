import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPagesSite,disableLegacyCharacterDeletion,planPagesReleases} from '../release-tools/build-pages-site.mjs';
import {checkPagesControl,validatePagesArtifact,verifyPagesPublic} from '../release-tools/pages-safety.mjs';
import {preparePagesControl} from '../release-tools/prepare-pages-control.mjs';

const repo=fileURLToPath(new URL('../..',import.meta.url));
const config={firebase:{apiKey:'fake-public-key',authDomain:'demo-ironpath.firebaseapp.com',
 databaseURL:'https://demo-ironpath.firebaseio.com',projectId:'demo-ironpath'},sessionEndpoint:'https://release.example/api/session'};
const origin='http://127.0.0.1:8080',a='a'.repeat(40),b='b'.repeat(40);
const pins={format:1,gameRevision:a,rollback:{revision:b,disableCharacterDeletion:false}};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(){
 const plan=planPagesReleases(pins,config);
 return {format:1,siteRevision:a,origin,configSha256:plan.configSha256,launcher:plan.launcher,
  candidate:{...plan.candidate,fileCount:4},rollback:{...plan.rollback,fileCount:3},
  launcherFiles:{'index.html':{bytes:5,sha256:'a'.repeat(64)},[`launcher/${plan.launcher}/entry.mjs`]:{bytes:5,sha256:'b'.repeat(64)}}};
}
const control=build=>({mode:'maintenance',build,epoch:'1'.repeat(32),authAfterMs:100000});

test('Pages versions include the pinned commit and public configuration, and keep the rollback distinct',()=>{
 const first=planPagesReleases(pins,config);
 assert.equal(first.candidate.revision,a);assert.equal(first.rollback.revision,b);
 assert.match(first.candidate.build,/^prod-[a-f0-9]{40}-[a-f0-9]{12}$/);
 assert.ok(first.candidate.build.length<=64&&first.launcher.length<=64);
 assert.notEqual(first.candidate.build,first.rollback.build);
 assert.notEqual(first.candidate.build,planPagesReleases(pins,{...config,sessionEndpoint:'https://other.example/api/session'}).candidate.build);
 const legacy=planPagesReleases({...pins,rollback:{revision:b,disableCharacterDeletion:true}},config);
 assert.match(legacy.rollback.build,/^legacy-/);assert.notEqual(legacy.rollback.build,first.rollback.build);
 for(const invalid of [{...pins,gameRevision:'main'}, {...pins,gameRevision:'../main'},
  {...pins,rollback:{revision:a,disableCharacterDeletion:false}},{...pins,rollback:{revision:b}},
  {...pins,extra:1},{...pins,format:2}])assert.throws(()=>planPagesReleases(invalid,config),/Invalid Pages release pins/);
 assert.throws(()=>planPagesReleases(pins,{...config,secret:'never'}),/Invalid public/);
});

test('control preparation permits only retained builds and requires the current epoch when reopening',()=>{
 const plan=planPagesReleases(pins,config),random=()=>Buffer.from('2'.repeat(32),'hex');
 const value=preparePagesControl({mode:'maintenance',build:plan.candidate.build,currentEpoch:null,pins,publicConfig:config},random);
 assert.deepEqual(value,{mode:'maintenance',build:plan.candidate.build,epoch:'2'.repeat(32),authAfterMs:{'.sv':'timestamp'}});
 assert.throws(()=>preparePagesControl({mode:'open',build:plan.candidate.build,currentEpoch:null,pins,publicConfig:config},random),/maintenance epoch/);
 assert.throws(()=>preparePagesControl({mode:'open',build:'unretained',currentEpoch:'1'.repeat(32),pins,publicConfig:config},random),/not retained/);
 const reopened=preparePagesControl({mode:'open',build:plan.rollback.build,currentEpoch:'1'.repeat(32),pins,publicConfig:config},random);
 assert.equal(reopened.build,plan.rollback.build);assert.equal(reopened.epoch,'2'.repeat(32));
 assert.deepEqual(reopened.authAfterMs,{'.sv':'timestamp'});
});

test('the first legacy rollback cannot invoke the old partial character-deletion handler',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-pages-legacy-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const account=join(dir,'account.js'),manifest=join(dir,'release-manifest.json');
 const source=Buffer.from("const deleteCharacter=()=>{}; $('menuDeleteCharacter').onclick=deleteCharacter;\\n");
 await writeFile(account,source);
 await writeFile(manifest,JSON.stringify({files:{'account.js':{bytes:source.length,sha256:digest(source)}}}));
 await disableLegacyCharacterDeletion(dir);
 const changed=await readFile(account),contents=changed.toString();
 assert.match(contents,/menuDeleteCharacter'\)\.disabled=true/);
 assert.doesNotMatch(contents,/onclick=deleteCharacter/);
 assert.deepEqual(JSON.parse(await readFile(manifest,'utf8')).files['account.js'],{bytes:changed.length,sha256:digest(changed)});
 await assert.rejects(disableLegacyCharacterDeletion(dir),/not uniquely identifiable/);
});

test('Pages deployment fails closed if control is absent or the live build would be removed',async()=>{
 const artifact=fixture(),expected=planPagesReleases(pins,config),calls=[];
 const response=value=>async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(value));};
 assert.deepEqual(await checkPagesControl({artifact,pins,publicConfig:config,origin,fetcher:response(control(expected.rollback.build))}),
  {mode:'maintenance',build:expected.rollback.build});
 assert.equal(calls[0].url,'https://demo-ironpath.firebaseio.com/_ironpathRelease.json');
 assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.credentials,'omit');
 await assert.rejects(checkPagesControl({artifact,pins,publicConfig:config,origin,fetcher:response(null)}),/unavailable or invalid/);
 await assert.rejects(checkPagesControl({artifact,pins,publicConfig:config,origin,fetcher:response(control('unretained-build'))}),/not retained/);
 await assert.rejects(checkPagesControl({artifact,pins,publicConfig:config,origin,fetcher:async()=>new Response('',{status:403})}),/unavailable or invalid/);
 const bad={...artifact,launcherFiles:{'index.html':{bytes:5,sha256:'a'.repeat(64)},'../../private':{bytes:5,sha256:'b'.repeat(64)}}};
 assert.throws(()=>validatePagesArtifact({artifact:bad,pins,publicConfig:config,origin}),/Invalid launcher inventory/);
 assert.throws(()=>validatePagesArtifact({artifact:{...artifact,origin:'https://evil.example'},pins,publicConfig:config,origin}),/does not match/);
});

test('both pinned production artifacts stage offline and a legacy fallback disables character deletion', {timeout:60000},async t=>{
 const selected=JSON.parse(await readFile(join(repo,'IronPath/release-tools/pages-release-pins.json'),'utf8'));
 for(const revision of [selected.gameRevision,selected.rollback?.revision].filter(Boolean)){
  if(spawnSync('git',['-C',repo,'cat-file','-e',`${revision}^{commit}`]).status!==0){
   t.skip('Pinned ancestor commits require a full Git checkout');return;
  }
 }
 const publicConfig=JSON.parse(await readFile(join(repo,'IronPath/release-tools/production-public-config.json'),'utf8'));
 const dir=await mkdtemp(join(tmpdir(),'ironpath-pages-pins-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const site=join(dir,'site'),artifact=await buildPagesSite({repoDir:repo,outputDir:site,pins:selected,publicConfig});
 assert.ok(artifact.candidate.fileCount>500);assert.ok(artifact.rollback?.fileCount>500,'retain a rollback build');
 const root=join(site,'IronPath','releases',artifact.rollback.build);
 const account=await readFile(join(root,'account.js'));
 if(artifact.rollback.disableCharacterDeletion){
  assert.match(account.toString(),/menuDeleteCharacter'\)\.disabled=true/);
  assert.doesNotMatch(account.toString(),/menuDeleteCharacter'\)\.onclick=deleteCharacter/);
 }
 const manifest=JSON.parse(await readFile(join(root,'release-manifest.json'),'utf8'));
 assert.equal(manifest.files['account.js'].sha256,digest(account));
});

test('a real local Pages artifact preserves the rest of the site and verifies a guarded game without network', {timeout:60000},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-pages-unit-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const site=join(dir,'site'),head=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const selected={format:1,gameRevision:head,rollback:null};
 const artifact=await buildPagesSite({repoDir:repo,outputDir:site,pins:selected,publicConfig:config,origin});
 assert.equal(artifact.siteRevision,head);assert.equal(artifact.rollback,null);assert.ok(artifact.candidate.fileCount>500);
 assert.equal(await readFile(join(site,'index.html'),'utf8'),execFileSync('git',['-C',repo,'show',`${head}:index.html`],{encoding:'utf8'}));
 const html=await readFile(join(site,'IronPath','index.html'),'utf8');assert.match(html,/launcher\/launcher-/);
 const game=await readFile(join(site,'IronPath','releases',artifact.candidate.build,'index.html'),'utf8');
 assert.match(game,/data-ironpath-guard="required"/);assert.match(game,/ironpath-guarded-game" hidden inert/);
 const seen=[];
 const fetcher=async(url,options)=>{
  const target=new URL(url);assert.equal(target.origin,origin);seen.push(target.pathname);
  assert.equal(options.credentials,'omit');
  const path=target.pathname.endsWith('/')?`${target.pathname}index.html`:target.pathname;
  try{return new Response(await readFile(resolve(site,`.${path}`)));}catch{return new Response('missing',{status:404});}
 };
 assert.deepEqual(await verifyPagesPublic({siteDir:site,artifact,pins:selected,publicConfig:config,origin,fetcher}),
  {candidate:artifact.candidate.build,rollback:null,full:false});
 assert.ok(seen.includes('/IronPath/'));assert.ok(seen.some(path=>path.endsWith('/release-manifest.json')));
 const launcher=Object.keys(artifact.launcherFiles).find(name=>name.endsWith('/launcher.css'));
 const path=join(site,'IronPath',launcher),original=await readFile(path);await writeFile(path,Buffer.concat([original,Buffer.from('tampered')]));
 await assert.rejects(verifyPagesPublic({siteDir:site,artifact,pins:selected,publicConfig:config,origin,fetcher}),/Local launcher changed/);
 await writeFile(path,original);
 const replaced=async(url,options)=>url.endsWith('/release-manifest.json')?new Response('{}'):fetcher(url,options);
 await assert.rejects(verifyPagesPublic({siteDir:site,artifact,pins:selected,publicConfig:config,origin,fetcher:replaced}),/inventory differs/);
 await assert.rejects(buildPagesSite({repoDir:repo,outputDir:site,pins:selected,publicConfig:config,origin}),/already exists/);
 await assert.rejects(buildPagesSite({repoDir:repo,outputDir:join(repo,'unsafe-output'),pins:selected,publicConfig:config,origin}),/outside the repository/);
 assert.equal(digest(await readFile(join(site,'IronPath','index.html'))),artifact.launcherFiles['index.html'].sha256);
});

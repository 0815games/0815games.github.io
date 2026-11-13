import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink,stat,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageVersion} from '../release-tools/stage-version.mjs';
import {stageLauncher} from '../release-tools/stage-launcher.mjs';
import {CRITICAL_RELEASE_FILES,verifyStagedBuild} from '../release-tools/verify-staged-build.mjs';
import {verifyPublicRelease} from '../release-tools/verify-public-release.mjs';
import {formatGuardedAccountConfig,ACCOUNT_CONFIG_MARKER} from '../release-tools/public-site-config.mjs';

const source=fileURLToPath(new URL('..',import.meta.url));
const config={firebase:{apiKey:'fake-public-key',authDomain:'demo-ironpath.firebaseapp.com',
 databaseURL:'https://demo-ironpath.firebaseio.com',projectId:'demo-ironpath'},sessionEndpoint:'https://release.example/api/session'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function setup(t){
 const dir=await mkdtemp(join(tmpdir(),'ironpath-site-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const site=join(dir,'IronPath'),releases=join(site,'releases');await mkdir(releases,{recursive:true});
 return {dir,site,releases};
}
function fileFetcher(site,requests){
 return async(url,options)=>{
  requests.push({url,options});const target=new URL(url);
  assert.equal(target.origin,'http://127.0.0.1:8080');assert.ok(target.pathname.startsWith('/IronPath/'));
  const file=resolve(site,'.'+target.pathname.slice('/IronPath'.length));
  try{return new Response(await readFile(file));}catch{return new Response('missing',{status:404});}
 };
}

test('an explicitly guarded build and versioned launcher stage separately from the live source', {timeout:60000},async t=>{
 const {site,releases}=await setup(t),original=await readFile(join(source,'index.html'));
 const originalAccount=await readFile(join(source,'account.js'),'utf8');
 const result=await stageVersion({sourceDir:source,outputDir:releases,build:'site-1',guardedConfig:config});
 const launcher=await stageLauncher({sourceDir:source,outputDir:site,build:'launcher-1',config});
 assert.equal(launcher.build,'launcher-1');
 const entry=await readFile(join(site,'index.html'),'utf8');
 assert.match(entry,/launcher\/launcher-1\/launcher-entry\.mjs/);assert.doesNotMatch(entry,/__LAUNCHER_BUILD__/);
 const html=await readFile(join(result.directory,'index.html'),'utf8');
 assert.match(html,/data-ironpath-guard="required" data-ironpath-release-build="site-1"/);
 assert.match(html,/<div id="ironpath-guarded-game" hidden inert>/);
 assert.match(html,/<script type="module" src="release-tools\/guarded-game-entry\.mjs"><\/script>/);
 assert.doesNotMatch(html,/<script type="module" src="account\.js\?/);
 const inventory=JSON.parse(await readFile(join(result.directory,'release-manifest.json'),'utf8'));
 assert.equal(inventory.guarded,true);assert.equal(inventory.build,'site-1');
 for(const name of CRITICAL_RELEASE_FILES)assert.ok(inventory.files[name],name);
 assert.equal(await readFile(join(site,'launcher','launcher-1','release-config.mjs'),'utf8'),
  await readFile(join(result.directory,'release-config.mjs'),'utf8'));
 const stagedAccount=await readFile(join(result.directory,'account.js'),'utf8');
 assert.equal(stagedAccount.split(formatGuardedAccountConfig(config)).length,2,'the account fallback targets this staged project');
 const oldProject=originalAccount.match(/projectId:'([^']+)'/)?.[1],oldKey=originalAccount.match(/apiKey:'([^']+)'/)?.[1];
 assert.ok(oldProject && oldKey && oldProject!==config.firebase.projectId,'the test uses a different project');
 for(const [directory,prefix] of [[result.directory,''],[join(result.directory,'release-tools'),'release-tools/']]){
  for(const name of await readdir(directory))if(/\.(?:js|mjs)$/.test(name)){
   const text=await readFile(join(directory,name),'utf8');
   assert.ok(!text.includes(oldProject) && !text.includes(oldKey),`${prefix}${name} must not include the normal game Firebase config`);
  }
 }
 assert.equal(await readFile(join(source,'account.js'),'utf8'),originalAccount,'the source account is not modified');
 const requests=[],fetcher=fileFetcher(site,requests);
 assert.equal(await verifyStagedBuild({build:'site-1',origin:'http://127.0.0.1:8080',config,fetcher}),'/IronPath/releases/site-1/');
 assert.equal(requests.length,CRITICAL_RELEASE_FILES.length+1);
 assert.ok(requests.every(({options})=>options.cache==='no-store'&&options.credentials==='omit'&&options.redirect==='error'));
 const allRequests=[],full=await verifyPublicRelease({origin:'http://127.0.0.1:8080',
  manifestPath:join(result.directory,'release-manifest.json'),fetcher:fileFetcher(site,allRequests)});
 assert.equal(full.fileCount,Object.keys(inventory.files).length,'every real staged file is checked');
 assert.equal(allRequests.length,full.fileCount+1);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:releases,build:'site-1',guardedConfig:config}),/EEXIST/);
 await assert.rejects(stageLauncher({sourceDir:source,outputDir:site,build:'launcher-2',config}),/entry already exists/);
 assert.deepEqual(await readFile(join(source,'index.html')),original);
});

test('readiness rejects tampering, an unguarded entry, inconsistent settings and missing critical files', {timeout:60000},async t=>{
 const {site,releases}=await setup(t);
 const {directory}=await stageVersion({sourceDir:source,outputDir:releases,build:'site-1',guardedConfig:config});
 const fetcher=fileFetcher(site,[]),check=options=>verifyStagedBuild({build:'site-1',origin:'http://127.0.0.1:8080',config,fetcher,...options});
 await assert.rejects(check({config:{...config,sessionEndpoint:'https://other.example/api/session'}}),/configuration differs/);
 const account=join(directory,'account.js'),bytes=await readFile(account);await writeFile(account,Buffer.concat([bytes,Buffer.from('\n// changed')]));
 await assert.rejects(check(),/too large|Inconsistent/);await writeFile(account,bytes);
 // Even a matching manifest must not hide an account fallback for another
 // project; compare that line against the launcher's trusted local config.
 const manifestPath=join(directory,'release-manifest.json'),originalManifest=await readFile(manifestPath);
 const other={...config,firebase:{...config.firebase,projectId:'demo-other',authDomain:'demo-other.firebaseapp.com'}};
 const accountText=bytes.toString('utf8'),alteredAccount=Buffer.from(accountText.replace(formatGuardedAccountConfig(config),formatGuardedAccountConfig(other)));
 assert.notDeepEqual(alteredAccount,bytes);
 const changedInventory=JSON.parse(originalManifest);changedInventory.files['account.js']={bytes:alteredAccount.length,sha256:hash(alteredAccount)};
 await writeFile(account,alteredAccount);await writeFile(manifestPath,JSON.stringify(changedInventory));
 await assert.rejects(check(),/Account Firebase configuration differs/);
 await writeFile(account,bytes);await writeFile(manifestPath,originalManifest);
 const entry=join(directory,'index.html'),originalHtml=await readFile(entry,'utf8');
 const altered=Buffer.from(originalHtml.replace('data-ironpath-guard="required"','data-ironpath-guard="optional"'));
 await writeFile(entry,altered);
 const inventoryPath=join(directory,'release-manifest.json'),inventory=JSON.parse(await readFile(inventoryPath,'utf8'));
 inventory.files['index.html']={bytes:altered.length,sha256:hash(altered)};await writeFile(inventoryPath,JSON.stringify(inventory));
 await assert.rejects(check(),/required blocked entry/);
 await writeFile(entry,originalHtml);inventory.files['index.html']={bytes:Buffer.byteLength(originalHtml),sha256:hash(Buffer.from(originalHtml))};
 delete inventory.files['release-tools/runtime-fence.mjs'];await writeFile(inventoryPath,JSON.stringify(inventory));
 await assert.rejects(check(),/Incomplete build inventory/);
 inventory.guarded=false;await writeFile(inventoryPath,JSON.stringify(inventory));await assert.rejects(check(),/Invalid build inventory/);
});

test('packaging refuses secret-like config, overlaps, symlinked output and invalid IDs before publishing an entry',async t=>{
 const {site,releases}=await setup(t);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:releases,build:'bad',guardedConfig:{...config,serviceAccount:{private_key:'x'}}}),/Invalid public/);
 await assert.rejects(stat(join(releases,'bad')),{code:'ENOENT'});
 await assert.rejects(stageVersion({sourceDir:source,outputDir:releases,build:'bad',guardedConfig:null}),/Invalid public/);
 await assert.rejects(stageLauncher({sourceDir:source,outputDir:source,build:'launcher-1',config}),/separate/);
 await assert.rejects(stageLauncher({sourceDir:source,outputDir:site,build:'../bad',config}),/Invalid launcher build/);
 await symlink(tmpdir(),join(site,'launcher'));
 await assert.rejects(stageLauncher({sourceDir:source,outputDir:site,build:'launcher-1',config}),/Invalid launcher/);
 await assert.rejects(stat(join(site,'index.html')),{code:'ENOENT'});
});

test('guarded staging refuses a missing game, an ambiguous account config, mismatched registry or unsafe HTML',async t=>{
 const {dir,releases}=await setup(t),src=join(dir,'minimal-source');
 await mkdir(join(src,'assets'),{recursive:true});await mkdir(join(src,'release-tools'));
 const guardNames=['guarded-game-bootstrap.mjs','guarded-runtime.mjs','game-session.mjs','release-control.mjs',
  'runtime-fence.mjs','status-monitor.mjs','bounded-json.mjs','guarded-game-entry.mjs','public-site-config.mjs'];
 for(const name of guardNames)await writeFile(join(src,'release-tools',name),await readFile(join(source,'release-tools',name)));
 await writeFile(join(src,'assets','manifest.webmanifest'),'{"name":"Iron Path"}');
 await writeFile(join(src,'account-services.mjs'),'export const x=1;');await writeFile(join(src,'game.js'),'// game');
 const marked=` config:{projectId:'old-game'}, ${ACCOUNT_CONFIG_MARKER}`;
 const correct=`import {x} from './account-services.mjs?v=20261031-releaseguard1';\nconst fallback={\n${marked}\n};`;
 await writeFile(join(src,'account.js'),correct);
 const html='<!doctype html><html lang="en"><head></head><body><p class="build-stamp" aria-hidden="true">BUILD old</p><p class="build-stamp" aria-hidden="true">BUILD old</p><a href="../">← 0815 Games</a><script type="module" src="account.js?v=old"></script></body></html>';
 await writeFile(join(src,'index.html'),html);
 await stageVersion({sourceDir:src,outputDir:releases,build:'valid',guardedConfig:config});
 await writeFile(join(src,'account.js'),correct.replace('releaseguard1','releaseguard2'));
 await assert.rejects(stageVersion({sourceDir:src,outputDir:releases,build:'wrong-registry',guardedConfig:config}),/registry module URLs must match/);
 await writeFile(join(src,'account.js'),correct.replace(ACCOUNT_CONFIG_MARKER,'// missing marker'));
 await assert.rejects(stageVersion({sourceDir:src,outputDir:releases,build:'missing-config',guardedConfig:config}),/Unexpected account Firebase configuration/);
 await writeFile(join(src,'account.js'),correct.replace(marked,`${marked}\n${marked}`));
 await assert.rejects(stageVersion({sourceDir:src,outputDir:releases,build:'duplicate-config',guardedConfig:config}),/Unexpected account Firebase configuration/);
 await writeFile(join(src,'account.js'),correct);await rm(join(src,'game.js'));
 await assert.rejects(stageVersion({sourceDir:src,outputDir:releases,build:'missing-game',guardedConfig:config}),/Missing guarded runtime file/);
 await writeFile(join(src,'game.js'),'// game');await writeFile(join(src,'index.html'),html.replace('</head>',''));
 await assert.rejects(stageVersion({sourceDir:src,outputDir:releases,build:'bad-html',guardedConfig:config}),/Unexpected source HTML/);
});

test('build checks restrict destinations and time out even if fetch ignores abort',async()=>{
 for(const [build,origin] of [['../x','https://game.example'],['ok','http://attacker.example'],['ok','https://game.example/path']]){
  await assert.rejects(verifyStagedBuild({build,origin,config}));
 }
 await assert.rejects(verifyStagedBuild({build:'ok',origin:'http://127.0.0.1:8080',config,
  fetcher:()=>new Promise(()=>{}),timeoutMs:10}),/aborted/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(verifyStagedBuild({build:'ok',origin:'http://127.0.0.1:8080',config,signal:controller.signal,
  fetcher:()=>new Promise(()=>{})}),/aborted/);
});

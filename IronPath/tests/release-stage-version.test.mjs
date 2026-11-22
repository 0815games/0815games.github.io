import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {stageVersion,GAME_MODULE_FOLDERS} from '../release-tools/stage-version.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const guardFiles=['guarded-game-bootstrap.mjs','guarded-runtime.mjs','game-session.mjs',
 'release-control.mjs','runtime-fence.mjs','status-monitor.mjs','bounded-json.mjs'];
async function fixture(t){
 const base=await mkdtemp(join(tmpdir(),'ironpath-stage-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const source=join(base,'source'),output=join(base,'output');await mkdir(join(source,'assets','layers'),{recursive:true});await mkdir(output);
 await writeFile(join(source,'index.html'),'<!doctype html><html lang="en"><p class="build-stamp" aria-hidden="true">BUILD old</p><p class="build-stamp" aria-hidden="true">BUILD old</p><a href="../">← 0815 Games</a></html>');
 await writeFile(join(source,'account.js'),'import "./feature.mjs";');
 await writeFile(join(source,'feature.mjs'),'export const x=1;');
 await writeFile(join(source,'style.css'),'body{color:red}');
 await writeFile(join(source,'assets','manifest.webmanifest'),JSON.stringify({name:'Iron Path',start_url:'./index.html',icons:[]}));
 await writeFile(join(source,'assets','layers','unit.png'),Buffer.from([1,2,3,4]));
 await mkdir(join(source,'i18n','nested'),{recursive:true});
 await writeFile(join(source,'i18n','demo.mjs'),'export const demo=1;');
 await writeFile(join(source,'i18n','nested','deep.mjs'),'export const deep=1;');
 await mkdir(join(source,'ui'));
 await writeFile(join(source,'ui','panel.css'),'.panel{color:blue}');
 await mkdir(join(source,'release-tools'));
 for(const name of guardFiles)await writeFile(join(source,'release-tools',name),`// browser fixture ${name}\n`);
 await writeFile(join(source,'release-tools','server-secret-fixture.txt'),'must never be staged');
 return {base,source,output};
}

test('a staged release has an isolated path, matching stamp, stable PWA entry and hashed inventory',async t=>{
 const {source,output}=await fixture(t);
 const result=await stageVersion({sourceDir:source,outputDir:output,build:'release-1'});
 assert.equal(result.fileCount,9+guardFiles.length);
 const html=await readFile(join(result.directory,'index.html'),'utf8');
 assert.match(html,/data-ironpath-release-build="release-1"/);assert.match(html,/BUILD release-1/);assert.match(html,/<a href="\/">/);
 const webmanifest=JSON.parse(await readFile(join(result.directory,'assets','manifest.webmanifest'),'utf8'));
 assert.equal(webmanifest.start_url,'/IronPath/');assert.equal(webmanifest.scope,'/IronPath/');
 const inventory=JSON.parse(await readFile(join(result.directory,'release-manifest.json'),'utf8'));
 assert.equal(inventory.build,'release-1');
 for(const name of ['i18n/demo.mjs','i18n/nested/deep.mjs','ui/panel.css'])
  assert.ok(Object.hasOwn(inventory.files,name),`module folder file staged: ${name}`);
 assert.deepEqual(Object.keys(inventory.files).filter(name=>name.startsWith('release-tools/')).sort(),
  guardFiles.map(name=>`release-tools/${name}`).sort(),'only explicitly allowed browser modules are included');
 for(const [name,entry] of Object.entries(inventory.files)){
  const bytes=await readFile(join(result.directory,name));assert.equal(entry.bytes,bytes.length,name);assert.equal(entry.sha256,hash(bytes),name);
 }
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'release-1'}),/EEXIST/);
 const next=await stageVersion({sourceDir:source,outputDir:output,build:'release-2'});
 assert.notEqual(result.directory,next.directory,'a new build uses new URLs even for unchanged imports and assets');
 assert.equal(await readFile(join(source,'account.js'),'utf8'),'import "./feature.mjs";');
});

test('bad IDs, source overlap, unexpected HTML and symlinks are rejected',async t=>{
 const {source,output}=await fixture(t);
 for(const build of ['', '../x', 'UPPER', 'a'.repeat(65)]) await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build}),/Invalid build/);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:source,build:'release-1'}),/separate/);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:join(source,'assets'),build:'release-1'}),/separate/);
 await writeFile(join(source,'index.html'),'<html>not the expected game</html>');
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'release-2'}),/Unexpected source HTML/);
 await symlink('/etc/passwd',join(source,'assets','bad-link'));
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'release-3'}),/Symbolic link/);
});

test('game module folders reject non-code files and symlinks instead of dropping them silently',async t=>{
 const {source,output}=await fixture(t);
 await writeFile(join(source,'i18n','notes.md'),'working notes, not code');
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'stray-file'}),/Unsupported file in game module folder/);
 await rm(join(source,'i18n','notes.md'));
 await symlink('/etc/passwd',join(source,'i18n','linked.mjs'));
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'linked-module'}),/Symbolic link in release source/);
});

test('browser guard inputs cannot be missing, directories or symlinks',async t=>{
 const {source,output}=await fixture(t);
 const file=join(source,'release-tools','game-session.mjs');
 await rm(file);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'missing-guard'}),/ENOENT/);
 await symlink('/etc/passwd',file);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'linked-guard'}),/Invalid browser guard file/);
 await rm(file);await mkdir(file);
 await assert.rejects(stageVersion({sourceDir:source,outputDir:output,build:'directory-guard'}),/Invalid browser guard file/);
});

test('the current game runtime and full asset tree can be staged without changing source', {timeout:60000}, async t=>{
 const base=await mkdtemp(join(tmpdir(),'ironpath-real-stage-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const source=fileURLToPath(new URL('..',import.meta.url));
 const original=await readFile(join(source,'index.html'));
 const result=await stageVersion({sourceDir:source,outputDir:base,build:'local-test-1'});
 const inventory=JSON.parse(await readFile(join(result.directory,'release-manifest.json'),'utf8'));
 const files=Object.keys(inventory.files);
 assert.ok(files.length>500,`full runtime and assets copied: ${files.length}`);
 for(const name of ['account.js','core/account-services.mjs','game.js','core/maps.mjs','style.css',
  'core/friend-portrait.mjs','assets/friend-placeholder.svg','assets/layers/manifest.mjs',
  'core/multiplayer-prompts.mjs','multiplayer-prompts.css','core/party-end-coordinator.mjs','core/party-signout.mjs','core/wave-consensus.mjs',
  'assets/story-outpost.jpg','assets/manifest.webmanifest'])assert.ok(files.includes(name),name);
 assert.deepEqual(files.filter(name=>name.startsWith('release-tools/')).sort(),guardFiles.map(name=>`release-tools/${name}`).sort());
 const roots=(await readdir(source)).filter(name=>/\.(?:mjs|js|css)$/.test(name));
 for(const name of roots)assert.ok(files.includes(name),`runtime copied: ${name}`);
 // Every code file inside an approved game module folder must be staged under
 // its relative path - a moved module that the packager forgot would load from
 // Pages but vanish from the isolated release build.
 async function moduleFiles(dir,prefix){
  const found=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const rel=`${prefix}/${entry.name}`;
   if(entry.isDirectory())found.push(...await moduleFiles(join(dir,entry.name),rel));
   else if(entry.isFile()&&/\.(?:mjs|js|css)$/.test(entry.name))found.push(rel);
  }
  return found;
 }
 for(const folder of GAME_MODULE_FOLDERS){
  const dir=join(source,folder);
  const present=await readdir(dir).catch(()=>null);
  if(present===null)continue;
  for(const rel of await moduleFiles(dir,folder))assert.ok(files.includes(rel),`module staged: ${rel}`);
 }
 assert.deepEqual(await readFile(join(source,'index.html')),original,'source was not modified');
});

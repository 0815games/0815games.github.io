import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {stageVersion} from '../release-tools/stage-version.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t){
 const base=await mkdtemp(join(tmpdir(),'ironpath-stage-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const source=join(base,'source'),output=join(base,'output');await mkdir(join(source,'assets','layers'),{recursive:true});await mkdir(output);
 await writeFile(join(source,'index.html'),'<!doctype html><html lang="en"><p class="build-stamp" aria-hidden="true">BUILD old</p><p class="build-stamp" aria-hidden="true">BUILD old</p><a href="../">← 0815 Games</a></html>');
 await writeFile(join(source,'account.js'),'import "./feature.mjs";');
 await writeFile(join(source,'feature.mjs'),'export const x=1;');
 await writeFile(join(source,'style.css'),'body{color:red}');
 await writeFile(join(source,'assets','manifest.webmanifest'),JSON.stringify({name:'Iron Path',start_url:'./index.html',icons:[]}));
 await writeFile(join(source,'assets','layers','unit.png'),Buffer.from([1,2,3,4]));
 return {base,source,output};
}

test('a staged release has an isolated path, matching stamp, stable PWA entry and hashed inventory',async t=>{
 const {source,output}=await fixture(t);
 const result=await stageVersion({sourceDir:source,outputDir:output,build:'release-1'});
 assert.equal(result.fileCount,6);
 const html=await readFile(join(result.directory,'index.html'),'utf8');
 assert.match(html,/data-ironpath-release-build="release-1"/);assert.match(html,/BUILD release-1/);assert.match(html,/<a href="\/">/);
 const webmanifest=JSON.parse(await readFile(join(result.directory,'assets','manifest.webmanifest'),'utf8'));
 assert.equal(webmanifest.start_url,'/IronPath/');assert.equal(webmanifest.scope,'/IronPath/');
 const inventory=JSON.parse(await readFile(join(result.directory,'release-manifest.json'),'utf8'));
 assert.equal(inventory.build,'release-1');
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

test('the current game runtime and full asset tree can be staged without changing source', {timeout:60000}, async t=>{
 const base=await mkdtemp(join(tmpdir(),'ironpath-real-stage-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const source=fileURLToPath(new URL('..',import.meta.url));
 const original=await readFile(join(source,'index.html'));
 const result=await stageVersion({sourceDir:source,outputDir:base,build:'local-test-1'});
 const inventory=JSON.parse(await readFile(join(result.directory,'release-manifest.json'),'utf8'));
 const files=Object.keys(inventory.files);
 assert.ok(files.length>500,`full runtime and assets copied: ${files.length}`);
 for(const name of ['account.js','game.js','maps.mjs','style.css','assets/layers/manifest.mjs','assets/story-outpost.jpg','assets/manifest.webmanifest'])assert.ok(files.includes(name),name);
 const roots=(await readdir(source)).filter(name=>/\.(?:mjs|js|css)$/.test(name));
 for(const name of roots)assert.ok(files.includes(name),`runtime copied: ${name}`);
 assert.deepEqual(await readFile(join(source,'index.html')),original,'source was not modified');
});

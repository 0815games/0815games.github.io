import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=fileURLToPath(new URL('../..',import.meta.url));
const run=(input,output)=>spawnSync('python3',['IronPath/release-tools/prepare-maintenance-rules.py',input,output],{cwd:repo,encoding:'utf8'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('matching Rules prepare only the pinned Firebase-only candidate and never overwrite output',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-maint-rules-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=join(dir,'export.json'),output=join(dir,'candidate.json');
 const reference=JSON.parse(await readFile(join(repo,'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
 await writeFile(input,JSON.stringify(reference));const result=run(input,output);
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/nothing was published/);
 assert.equal(hash(await readFile(output)),'369bf819546c4f063dfe88212bd61f1599e88e4eef9b30d77089d9fc7982f029');
 const candidate=JSON.parse(await readFile(output,'utf8'));
 assert.deepEqual(candidate.rules._ironpathMaintenance,{'.read':true,'.write':false});
 assert.doesNotMatch(JSON.stringify(candidate),/ip_release_epoch|sign_in_provider.*custom/);
 const before=await readFile(output);assert.notEqual(run(input,output).status,0);assert.deepEqual(await readFile(output),before);
});

test('changed, duplicated and invalid exports cannot produce a maintenance candidate',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-maint-reject-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=join(dir,'export.json'),output=join(dir,'candidate.json');
 const reference=JSON.parse(await readFile(join(repo,'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
 reference.rules.players.$uid['.write']='true';
 for(const data of [JSON.stringify(reference),'{"rules":{},"rules":{}}','{"rules":NaN}','not JSON']){
  await writeFile(input,data);const result=run(input,output);assert.notEqual(result.status,0);await assert.rejects(readFile(output),{code:'ENOENT'});
 }
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=fileURLToPath(new URL('../..',import.meta.url));
const run=(input,output)=>spawnSync('python3',['IronPath/release-tools/prepare-production-rules.py',input,output],{cwd:repo,encoding:'utf8'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('a separately provided matching export prepares only the exact reviewed combined Rules',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-rules-prep-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=join(dir,'export.json'),output=join(dir,'candidate.json');
 const reference=JSON.parse(await readFile(join(repo,'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
 // Whitespace and top-level key order do not establish a semantic difference.
 await writeFile(input,JSON.stringify(reference));
 const result=run(input,output);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/nothing was published/);
 assert.equal(hash(await readFile(output)),'3228688deafc6b2989a03945f92f37043ffef22ac75a2df98bf5d73b688715e4');
 const before=await readFile(output);assert.notEqual(run(input,output).status,0,'existing output is never overwritten');
 assert.deepEqual(await readFile(output),before);
});

test('changed, duplicated, invalid and non-JSON exports fail before producing any candidate',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'ironpath-rules-reject-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=join(dir,'export.json'),output=join(dir,'candidate.json');
 const reference=JSON.parse(await readFile(join(repo,'IronPath/firebase/WORKSHOP-RULES-TO-PUBLISH.json'),'utf8'));
 reference.rules.players.$uid['.write']='true';
 for(const data of [JSON.stringify(reference),'{"rules":{},"rules":{}}','{"rules":NaN}','not JSON']){
  await writeFile(input,data);const result=run(input,output);assert.notEqual(result.status,0);
  await assert.rejects(readFile(output),{code:'ENOENT'});
 }
});

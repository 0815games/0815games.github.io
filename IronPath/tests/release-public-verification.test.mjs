import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CRITICAL_RELEASE_FILES} from '../release-tools/verify-staged-build.mjs';
import {verifyPublicRelease} from '../release-tools/verify-public-release.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t){
 const dir=await mkdtemp(join(tmpdir(),'ironpath-public-check-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const files=new Map([...CRITICAL_RELEASE_FILES,'assets/example.png','assets/layers/example.svg']
  .map(name=>[name,Buffer.from(`file ${name}\n`)]));
 const inventory={format:1,build:'test-1',guarded:true,files:Object.fromEntries([...files].map(([name,bytes])=>[name,{bytes:bytes.length,sha256:hash(bytes)}]))};
 const manifest=Buffer.from(`${JSON.stringify(inventory,null,2)}\n`),manifestPath=join(dir,'release-manifest.json');
 await writeFile(manifestPath,manifest);
 let publicManifest=manifest,active=0,maxActive=0;const seen=[];
 const server=createServer((req,res)=>{
  active++;maxActive=Math.max(active,maxActive);seen.push({url:req.url,cache:req.headers['cache-control']});
  setTimeout(()=>{
   const prefix='/IronPath/releases/test-1/',name=req.url.startsWith(prefix)?req.url.slice(prefix.length):'';
   const data=name==='release-manifest.json'?publicManifest:files.get(name);
   if(data)res.writeHead(200).end(data);else res.writeHead(404).end('missing');
   active--;
  },5);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 return {origin:`http://127.0.0.1:${server.address().port}`,manifestPath,manifest,inventory,files,seen,
  setManifest:value=>{publicManifest=value;},maxActive:()=>maxActive};
}

test('public check compares the entire inventory and limits concurrent no-cache downloads',async t=>{
 const f=await fixture(t),result=await verifyPublicRelease({...f,concurrency:3});
 assert.equal(result.build,'test-1');assert.equal(result.fileCount,f.files.size);
 assert.equal(result.totalBytes,[...f.files.values()].reduce((n,b)=>n+b.length,0));
 assert.equal(f.seen.length,f.files.size+1);assert.ok(f.seen.every(req=>req.cache==='no-cache'));
 assert.ok(f.maxActive()<=3,'bounded download concurrency');
});

test('public check rejects a missing or changed file and a different public manifest',async t=>{
 const f=await fixture(t);
 const name='assets/example.png',original=f.files.get(name);f.files.set(name,Buffer.from('tampered'));
 await assert.rejects(verifyPublicRelease(f),/Public release check failed: assets\/example.png/);
 f.files.set(name,original);f.files.delete('assets/layers/example.svg');
 await assert.rejects(verifyPublicRelease(f),/Public release check failed: assets\/layers\/example.svg/);
 f.setManifest(Buffer.from('{}'));await assert.rejects(verifyPublicRelease(f),/manifest differs/);
});

test('bad local inventories and unsafe or hanging destinations never trigger an unsafe request',async t=>{
 const f=await fixture(t),base={origin:f.origin,manifestPath:f.manifestPath};
 const corrupt={...f.inventory,files:{...f.inventory.files,'../secret':{bytes:0,sha256:hash(Buffer.alloc(0))}}};
 await writeFile(f.manifestPath,JSON.stringify(corrupt));
 let called=0;await assert.rejects(verifyPublicRelease({...base,fetcher:()=>{called++;}}),/Invalid local/);assert.equal(called,0);
 await writeFile(f.manifestPath,f.manifest);
 for(const origin of ['http://example.com','https://example.com/path','https://user:pass@example.com']){
  await assert.rejects(verifyPublicRelease({...base,origin}),/Invalid site origin/);
 }
 await assert.rejects(verifyPublicRelease({...base,timeoutMs:10,fetcher:()=>new Promise(()=>{})}),/Public release check failed/);
});

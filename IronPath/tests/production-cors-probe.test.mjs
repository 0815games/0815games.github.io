import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {probeUrls,isAllowedRequest,validateControl}=require('../browser-tests/production-cors-probe.cjs');
// The probe is started with a repository-relative path, so the child needs the
// repository root as cwd. Without it this test only passes when the suite runs
// from the repository root, and reports a red probe from anywhere else.
const repoRoot=fileURLToPath(new URL('../../',import.meta.url));

test('production browser probe requires explicit opt-in before loading browser tooling',()=>{
 const result=spawnSync(process.execPath,['IronPath/browser-tests/production-cors-probe.cjs'],{encoding:'utf8',cwd:repoRoot});
 assert.equal(result.status,2);assert.match(result.stderr,/--read-only-live/);
});

test('production browser probe permits only the exact anonymous GETs',()=>{
 const urls=probeUrls('cors-123-456');
 assert.equal(isAllowedRequest('GET',urls.document),true);
 assert.equal(isAllowedRequest('GET',urls.status),true);
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])assert.equal(isAllowedRequest(method,urls.status),false);
 for(const bad of [
  urls.status.replace('_ironpathMaintenance','players'),
  urls.status.replace('https://','http://'),
  urls.status.replace('europe-west1.firebasedatabase.app','europe-west1.firebasedatabase.app.example.org'),
  urls.status.replace('https://','https://someone:secret@'),
  `${urls.status}&auth=token`,`${urls.status}&probe=cors-2`,`${urls.status}#fragment`,
  urls.status.replace('cors-123-456','unexpected'),
 ])assert.equal(isAllowedRequest('GET',bad),false,bad);
 for(const headers of [{authorization:'Bearer secret'},{cookie:'x=1'},{'x-http-method-override':'PUT'}])
  assert.equal(isAllowedRequest('GET',urls.status,headers),false);
 assert.throws(()=>probeUrls(''),/Invalid probe nonce/);
});

test('production browser probe accepts only a complete maintenance record',()=>{
 assert.equal(validateControl({format:1,mode:'maintenance',authAfterMs:0}),true);
 assert.equal(validateControl({format:1,mode:'maintenance',authAfterMs:123}),true);
 for(const value of [null,[],{format:1,mode:'open',authAfterMs:0},{format:1,mode:'maintenance'},
  {format:1,mode:'maintenance',authAfterMs:-1},{format:1,mode:'maintenance',authAfterMs:1.1},
  {format:1,mode:'maintenance',authAfterMs:0,extra:true},{format:'1',mode:'maintenance',authAfterMs:0}])
  assert.equal(validateControl(value),false,JSON.stringify(value));
});

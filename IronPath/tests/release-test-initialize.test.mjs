import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hasOnlyLockedRootRules,initializeIsolatedTest} from '../release-tools/initialize-isolated-test.mjs';

const commit='abcdef0123456789abcdef0123456789abcdef01',accessToken='test-token-not-a-real-credential';
const locked=()=>({rules:{'.read':false,'.write':false}});
function firebaseMock({initialRules=locked(),initialStatus=null,failControl=false,changeRulesBeforePublish=false}={}) {
 let rules=structuredClone(initialRules),status=structuredClone(initialStatus),ruleReads=0;
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,method:options.method,headers:options.headers,body:options.body});
  assert.ok(url.startsWith('https://ironpathtest-default-rtdb.europe-west1.firebasedatabase.app/'));
  assert.ok(!url.includes(accessToken),'token is in the header, never the URL');
  if(options.headers.authorization)assert.equal(options.headers.authorization,`Bearer ${accessToken}`);
  const path=new URL(url).pathname;
  if(path==='/.settings/rules.json'){
   if(options.method==='PUT')rules=JSON.parse(options.body);
   else if(++ruleReads===2&&changeRulesBeforePublish)rules={rules:{'.read':true,'.write':false}};
   return Response.json(rules);
  }
  assert.equal(path,'/_ironpathRelease.json');
  if(options.method==='PUT'){
   assert.equal(options.headers['if-match'],'null_etag');
   if(failControl||status!==null)return Response.json({error:'mismatch'},{status:412});
   const input=JSON.parse(options.body);assert.deepEqual(input.authAfterMs,{'.sv':'timestamp'});
   status={...input,authAfterMs:1790000123456};
  }
  return Response.json(status);
 };
 return {fetcher,calls,getRules:()=>rules,getStatus:()=>status};
}

test('initializes only the locked test database, with an atomic closed status before Rules',async()=>{
 const mock=firebaseMock(),result=await initializeIsolatedTest({commit,accessToken,fetcher:mock.fetcher});
 assert.deepEqual(result,{build:`test-${commit}`,alreadyInitialized:false});
 assert.equal(mock.getStatus().mode,'maintenance');assert.equal(mock.getStatus().authAfterMs,1790000123456);
 assert.match(mock.getStatus().epoch,/^[a-f0-9]{32}$/);
 assert.equal(mock.getRules().rules['.read'],false);assert.equal(mock.getRules().rules['.write'],false);
 assert.deepEqual(mock.getRules().rules._ironpathRelease,{'.read':true,'.write':false});
 const puts=mock.calls.filter(call=>call.method==='PUT');
 assert.deepEqual(puts.map(call=>new URL(call.url).pathname),['/_ironpathRelease.json','/.settings/rules.json']);
 assert.equal(mock.calls.at(-1).headers.authorization,undefined,'public status is verified without credentials');
 const before=mock.calls.length;
 assert.deepEqual(await initializeIsolatedTest({commit,accessToken,fetcher:mock.fetcher}),{build:`test-${commit}`,alreadyInitialized:true});
 assert.equal(mock.calls.slice(before).filter(call=>call.method==='PUT').length,0);
});

test('rejects unknown rules, an existing status, invalid credentials and a concurrent initial write',async()=>{
 assert.equal(hasOnlyLockedRootRules({rules:{'.read':'false','.write':false}}),true);
 for(const value of [null,{extra:true,rules:{'.read':false,'.write':false}},{rules:{'.read':false,'.write':false,players:{'.read':true}}},{rules:{'.read':true,'.write':false}}]) {
  assert.equal(hasOnlyLockedRootRules(value),false);
 }
 for(const options of [
  {initialRules:{rules:{'.read':false,'.write':false,players:{'.read':true}}}},
  {initialStatus:{mode:'open'}}, {failControl:true}
 ]){
  const mock=firebaseMock(options);
  await assert.rejects(()=>initializeIsolatedTest({commit,accessToken,fetcher:mock.fetcher}),/TEST_/);
  assert.equal(mock.calls.filter(call=>new URL(call.url).pathname==='/.settings/rules.json'&&call.method==='PUT').length,0);
 }
 const mock=firebaseMock();
 await assert.rejects(()=>initializeIsolatedTest({commit:'bad',accessToken,fetcher:mock.fetcher}));
 await assert.rejects(()=>initializeIsolatedTest({commit,accessToken:'short',fetcher:mock.fetcher}));
 assert.equal(mock.calls.length,0);
});

test('a changed Rules export stops setup with maintenance closed',async()=>{
 const mock=firebaseMock({changeRulesBeforePublish:true});
 await assert.rejects(()=>initializeIsolatedTest({commit,accessToken,fetcher:mock.fetcher}),/TEST_RULES_CHANGED/);
 assert.equal(mock.getStatus().mode,'maintenance');
 assert.equal(mock.calls.filter(call=>new URL(call.url).pathname==='/.settings/rules.json'&&call.method==='PUT').length,0);
});

test('the operator entry refuses to run outside the explicitly selected Vercel test project',()=>{
 const file=fileURLToPath(new URL('../release-tools/initialize-isolated-test.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[file,'--apply-ironpathtest-only'],{encoding:'utf8',env:{PATH:process.env.PATH}});
 assert.equal(result.status,1);assert.match(result.stderr,/TEST_EXPLICIT_TARGET_REQUIRED/);
});

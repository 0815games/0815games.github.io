'use strict';

// Explicitly opt-in, read-only production probe. An actual document from the
// Pages origin performs the same anonymous cross-origin GET as the boot gate.
// This does not test Firebase Auth, private data, a deployed game build, or a
// physical device. Only two exact GET endpoints are allowed to leave Chromium.
const assert=require('node:assert/strict');

const PAGES_ORIGIN='https://0815games.github.io';
const DATABASE_ORIGIN='https://iron-path-dc727-default-rtdb.europe-west1.firebasedatabase.app';
const DOCUMENT_PATH='/IronPath/assets/fonts/OFL.txt';
const STATUS_PATH='/_ironpathMaintenance.json';

function probeUrls(nonce){
 if(!/^cors-[a-z0-9-]{1,40}$/.test(nonce))throw Error('Invalid probe nonce');
 const document=new URL(DOCUMENT_PATH,PAGES_ORIGIN),status=new URL(STATUS_PATH,DATABASE_ORIGIN);
 document.searchParams.set('probe',nonce);status.searchParams.set('probe',nonce);
 return Object.freeze({document:document.href,status:status.href});
}

function isAllowedRequest(method,address,headers={}){
 try{
  const url=new URL(address),query=[...url.searchParams.entries()];
  if(method!=='GET'||url.protocol!=='https:'||url.username||url.password||url.port||url.hash||
     headers.authorization||headers.cookie||headers['x-http-method-override']||
     query.length!==1||query[0][0]!=='probe'||!/^cors-[a-z0-9-]{1,40}$/.test(query[0][1]))return false;
  return (url.origin===PAGES_ORIGIN&&url.pathname===DOCUMENT_PATH)||
         (url.origin===DATABASE_ORIGIN&&url.pathname===STATUS_PATH);
 }catch{return false;}
}

function validateControl(value){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join(',')==='authAfterMs,format,mode'&&
  value.format===1&&value.mode==='maintenance'&&
  Number.isSafeInteger(value.authAfterMs)&&value.authAfterMs>=0;
}

async function main(){
 if(process.argv.length!==3||process.argv[2]!=='--read-only-live'){
  console.error('This public production probe is opt-in; pass --read-only-live.');
  process.exitCode=2;return;
 }
 const {chromium}=require('playwright');
 const urls=probeUrls(`cors-${Date.now()}-${process.pid}`);
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  const allowed=[];
  await context.route('**/*',route=>{
   const request=route.request();
   if(!isAllowedRequest(request.method(),request.url(),request.headers()))return route.abort('blockedbyclient');
   allowed.push(new URL(request.url()).pathname);
   return route.continue();
  });
  const page=await context.newPage();
  const document=await page.goto(urls.document,{waitUntil:'domcontentloaded',timeout:20000});
  assert.ok(document?.ok(),'The real Pages document was not available');
  assert.equal(new URL(page.url()).origin,PAGES_ORIGIN,'The document origin changed');
  const result=await page.evaluate(async statusUrl=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   try{
    const response=await fetch(statusUrl,{method:'GET',cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
    const reader=response.body?.getReader();if(!reader)throw Error('No readable status body');
    const chunks=[];let length=0;
    while(true){
     const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
     if(length>1024){await reader.cancel();throw Error('Status body too large');}chunks.push(value);
    }
    const bytes=new Uint8Array(length);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return {origin:location.origin,ok:response.ok,status:response.status,type:response.type,text:new TextDecoder('utf-8',{fatal:true}).decode(bytes)};
   }finally{clearTimeout(timer);}
  },urls.status);
  assert.equal(result.origin,PAGES_ORIGIN,'The fetch did not run under the Pages origin');
  assert.equal(result.type,'cors','The browser did not expose a CORS response');
  assert.equal(result.status,200,'The public status did not return HTTP 200');
  assert.ok(result.ok&&result.text.length<=1024,'The public status was unavailable or too large');
  const control=JSON.parse(result.text);
  assert.ok(validateControl(control),'The public record is not a valid maintenance state');
  assert.deepEqual(allowed.sort(),[DOCUMENT_PATH,STATUS_PATH].sort(),'Unexpected requests or missing read-only requests');
  console.log(`Read-only Chromium CORS probe passed: Pages origin -> Firebase public status; mode=${control.mode}, format=${control.format}, authAfterMs=${control.authAfterMs}.`);
 }finally{await browser.close();}
}

module.exports={probeUrls,isAllowedRequest,validateControl};
if(require.main===module)main().catch(error=>{console.error('Read-only production CORS probe failed:',error.message);process.exitCode=1;});

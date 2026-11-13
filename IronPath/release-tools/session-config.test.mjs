import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import handler,{readServiceConfig} from './api/session.mjs';

// Synthetic fields only; this is not a working key and is never deployed.
const fakeKey='-----BEGIN PRIVATE KEY-----\nnot-a-real-private-key\n-----END PRIVATE KEY-----\n';
const credentials={type:'service_account',project_id:'demo-test',client_email:'release@demo-test.iam.gserviceaccount.com',private_key:fakeKey};
const env={IRONPATH_FIREBASE_PROJECT_ID:'demo-test',IRONPATH_FIREBASE_DATABASE_URL:'https://demo-test.firebaseio.com',
 IRONPATH_GAME_ORIGIN:'https://0815games.github.io',IRONPATH_FIREBASE_SERVICE_ACCOUNT:JSON.stringify(credentials)};

test('candidate requests manual Git deployments and pins its Node runtime',async()=>{
 const vercel=JSON.parse(await readFile(new URL('./vercel.json',import.meta.url),'utf8'));
 const pkg=JSON.parse(await readFile(new URL('./package.json',import.meta.url),'utf8'));
 assert.equal(vercel.git.deploymentEnabled,false);assert.equal(vercel.outputDirectory,'public');
 assert.equal(pkg.engines.node,'22.x');
});

test('service requires an explicit HTTPS origin, Firebase database and matching dedicated service account',()=>{
 const actual=readServiceConfig(env);assert.equal(actual.projectId,'demo-test');assert.equal(actual.origin,'https://0815games.github.io');
 for(const values of [
  {IRONPATH_FIREBASE_PROJECT_ID:''}, {IRONPATH_FIREBASE_DATABASE_URL:'https://attacker.example'},
  {IRONPATH_GAME_ORIGIN:'http://0815games.github.io'}, {IRONPATH_GAME_ORIGIN:'https://0815games.github.io/path'},
  {IRONPATH_FIREBASE_SERVICE_ACCOUNT:'not-json'},
  {IRONPATH_FIREBASE_SERVICE_ACCOUNT:JSON.stringify({...credentials,project_id:'other-project'})},
  {IRONPATH_FIREBASE_SERVICE_ACCOUNT:JSON.stringify({...credentials,client_email:'someone@attacker.example'})},
  {IRONPATH_FIREBASE_SERVICE_ACCOUNT:JSON.stringify({...credentials,private_key:'fake'})},
  {FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099'}, {FIREBASE_DATABASE_EMULATOR_HOST:'127.0.0.1:9000'}
 ]) assert.throws(()=>readServiceConfig({...env,...values}), error=>{
  assert.doesNotMatch(error.message,/not-a-real-private-key|someone@|not-json/);return true;
 });
});

test('unconfigured function returns a generic no-store error instead of exposing config',async()=>{
 const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/session`,{method:'POST',
   headers:{origin:'https://0815games.github.io',authorization:'Bearer confidential', 'content-type':'application/json'},body:'{}'});
  assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(await response.text(),'{"status":"unavailable"}');
 }finally{await new Promise(resolve=>server.close(resolve));}
});

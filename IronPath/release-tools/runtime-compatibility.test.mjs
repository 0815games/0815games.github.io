import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cwd=fileURLToPath(new URL('.',import.meta.url));
function loadWith(option) {
  return spawnSync(process.execPath,['--input-type=module','-e',
    "await import('./api/session.mjs'); console.log('handler loaded');"],{
    cwd,encoding:'utf8',timeout:10000,env:{...process.env,NODE_OPTIONS:option}
  });
}

test('the real service entry loads with Vercel’s documented require-ESM option',()=>{
  // Vercel disables require(ESM) by default. firebase-admin 14 currently pulls
  // in a CommonJS jwks-rsa requiring ESM-only jose; Node 22 on CI enables it
  // by default and therefore does not model Vercel without an explicit test.
  const result=loadWith('--experimental-require-module');
  assert.equal(result.error,undefined);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/handler loaded/);
});

test('if disabled, the installed entry either loads or fails for the known ESM incompatibility',()=>{
  // Keep this negative control tolerant of a future upstream fix, but do not
  // mistake an unrelated import failure for the documented dependency issue.
  const result=loadWith('--no-experimental-require-module');
  assert.equal(result.error,undefined);
  if(result.status===0) assert.match(result.stdout,/handler loaded/);
  else assert.match(result.stderr,/ERR_REQUIRE_ESM/);
});

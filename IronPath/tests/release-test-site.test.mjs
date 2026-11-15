import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildIsolatedTestSite,isolatedTestBuildId,TEST_PUBLIC_CONFIG} from '../release-tools/build-isolated-test-site.mjs';
import {validatePublicSiteConfig} from '../release-tools/public-site-config.mjs';

const sha='abcdef0123456789abcdef0123456789abcdef01';
test('test builds have immutable, validated Git-derived identifiers and an isolated public configuration',()=>{
  assert.equal(isolatedTestBuildId(sha),`test-${sha}`);
  for(const bad of ['',sha.slice(0,7),sha.toUpperCase(),`${sha}/x`,null]) assert.throws(()=>isolatedTestBuildId(bad));
  const config=validatePublicSiteConfig(TEST_PUBLIC_CONFIG);
  assert.equal(config.firebase.projectId,'ironpathtest');
  assert.equal(config.firebase.databaseURL,'https://ironpathtest-default-rtdb.europe-west1.firebasedatabase.app');
  assert.equal(config.sessionEndpoint,'https://ironpath-release.vercel.app/api/session');
});

test('builds a guarded test launcher and game without overwriting an existing output', {timeout:60000}, async()=>{
  const output=await mkdtemp(join(tmpdir(),'ironpath-test-output-'));
  try {
    const source=fileURLToPath(new URL('../',import.meta.url));
    const result=await buildIsolatedTestSite({sourceDir:source,outputDir:output,commit:sha});
    assert.equal(result.build,`test-${sha}`);assert.equal(result.project,'ironpathtest');
    assert.ok(result.files>500);
    const site=join(output,'IronPath'), release=join(site,'releases',result.build);
    const [launcher,html,account,config,manifest]=await Promise.all([
      readFile(join(site,'index.html'),'utf8'),readFile(join(release,'index.html'),'utf8'),
      readFile(join(release,'account.js'),'utf8'),readFile(join(release,'release-config.mjs'),'utf8'),
      readFile(join(release,'release-manifest.json'),'utf8')
    ]);
    assert.match(launcher,new RegExp(`launcher-${sha}`));
    assert.match(html,/data-ironpath-guard="required"/);
    assert.match(html,/id="ironpath-guarded-game" hidden inert/);
    assert.match(account,/projectId":"ironpathtest"/);
    assert.match(config,/ironpath-release\.vercel\.app\/api\/session/);
    const inventory=JSON.parse(manifest);assert.equal(inventory.build,result.build);assert.equal(inventory.guarded,true);
    await assert.rejects(()=>buildIsolatedTestSite({sourceDir:source,outputDir:output,commit:sha}),/already exists/);
  } finally { await rm(output,{recursive:true,force:true}); }
});

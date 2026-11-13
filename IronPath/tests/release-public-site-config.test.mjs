import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {formatPublicSiteConfig,validatePublicSiteConfig,validateSiteOrigin} from '../release-tools/public-site-config.mjs';

const input={firebase:{projectId:'demo-ironpath',authDomain:'demo-ironpath.firebaseapp.com',
  databaseURL:'https://demo-ironpath.firebaseio.com',apiKey:'fake-public-key',appId:'1:123:web:abcdef'},
  sessionEndpoint:'https://release.example/api/session'};

test('public settings have a deterministic browser representation and no arbitrary fields',()=>{
  const config=validatePublicSiteConfig(input);
  assert.deepEqual(Object.keys(config.firebase),['apiKey','authDomain','databaseURL','projectId','appId']);
  assert.equal(Object.isFrozen(config),true);assert.equal(Object.isFrozen(config.firebase),true);
  assert.equal(formatPublicSiteConfig(input),formatPublicSiteConfig(config));
  assert.match(formatPublicSiteConfig(input),/export default/);
});

test('only HTTPS origins and local loopback HTTP are accepted',()=>{
 for(const origin of ['https://0815games.github.io','http://127.0.0.1:8765','http://localhost:8765','http://[::1]:8765']){
  assert.equal(validateSiteOrigin(origin),origin);
 }
 for(const origin of ['http://game.example','https://game.example/path','https://user:pass@game.example','file:///IronPath/','null']){
  assert.throws(()=>validateSiteOrigin(origin),/Invalid site origin/);
 }
});

test('bad endpoints, projects, database URLs and any secret-bearing fields fail closed',()=>{
  for(const config of [
    null,{}, {...input,serviceAccount:{private_key:'private'}},
    {...input,firebase:{...input.firebase,private_key:'private'}},
    {...input,firebase:{...input.firebase,apiKey:'---BEGIN PRIVATE KEY---'}},
    {...input,firebase:{...input.firebase,projectId:'other-project'}},
    {...input,firebase:{...input.firebase,databaseURL:'http://demo-ironpath.firebaseio.com'}},
    {...input,firebase:{...input.firebase,databaseURL:'https://attacker.example/'}},
    {...input,sessionEndpoint:'http://release.example/api/session'},
    {...input,sessionEndpoint:'https://release.example/api/session?token=bad'},
    {...input,sessionEndpoint:'https://user:pass@release.example/api/session'},
    {...input,sessionEndpoint:'https://release.example/other'},
    {...input,firebase:{...input.firebase,appId:'<script>'}}
  ])assert.throws(()=>validatePublicSiteConfig(config),/Invalid public release configuration/);
});

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {FEATURES,resolveFeatures,featureEnabled,applyFeatureVisibility} from '../features.mjs';

test('the switch surface is exactly the Stufe-1 feature list',()=>{
  assert.deepEqual(Object.keys(FEATURES).sort(),['actVideos','campaign','coach','endless','endlessMenu','friends','leaderboards','multiplayer','tutorial','voiceOver','workshop']);
  for(const [key,on] of Object.entries(FEATURES))assert.equal(on,true,`${key} ships enabled`);
});

test('resolveFeatures merges only known keys and only booleans',()=>{
  const merged=resolveFeatures({campaign:false,multiplayer:'yes',friends:0});
  assert.equal(merged.campaign,false);
  assert.equal(merged.multiplayer,false,'a non-true override is off, not truthy');
  assert.equal(merged.friends,false);
  assert.equal(merged.endless,true,'untouched keys keep the base value');
  assert.equal(Object.hasOwn(merged,'invented'),false,'unknown keys cannot sneak in');
  assert.ok(Object.isFrozen(merged));
  // The base object itself is never mutated by a merge.
  assert.equal(FEATURES.campaign,true);
});

test('resolveFeatures can switch a flag back on and honours a custom base',()=>{
  const merged=resolveFeatures({campaign:true},Object.freeze({campaign:false,endless:true}));
  assert.equal(merged.campaign,true);
  assert.equal(merged.endless,true);
  assert.deepEqual(resolveFeatures({},{a:true}),{a:true});
});

test('featureEnabled only answers for real switches',()=>{
  assert.equal(featureEnabled('campaign'),true);
  assert.equal(featureEnabled('endlessMenu'),true);
  assert.equal(featureEnabled('nope'),false);
  assert.equal(featureEnabled('campaign',{campaign:false}),false);
  assert.equal(featureEnabled('campaign',{campaign:'yes'}),false);
});

function element(feature){
  return {feature,hidden:false,getAttribute(name){return name==='data-feature'?this.feature:null;},setAttribute(){}};
}

test('applyFeatureVisibility hides exactly the marked entry points of off features',()=>{
  const campaignCard=element('campaign'),multiplayerCard=element('multiplayer'),typoCard=element('multiplaye');
  const document={querySelectorAll(){return [campaignCard,multiplayerCard,typoCard];}};
  applyFeatureVisibility(document,Object.freeze({campaign:true,multiplayer:false}));
  assert.equal(campaignCard.hidden,false);
  assert.equal(multiplayerCard.hidden,true);
  assert.equal(typoCard.hidden,false,'an unknown data-feature key is left alone - it belongs to no switch');
});

test('applyFeatureVisibility tolerates a missing DOM',()=>{
  assert.doesNotThrow(()=>applyFeatureVisibility(null));
  assert.doesNotThrow(()=>applyFeatureVisibility({}));
});

test('every data-feature anchor in index.html names a real switch',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const anchors=[...html.matchAll(/data-feature="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(anchors.length>=10,'the static menu carries its feature anchors');
  for(const key of anchors)assert.ok(Object.hasOwn(FEATURES,key),`index.html anchors unknown feature: ${key}`);
});

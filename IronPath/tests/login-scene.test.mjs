import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LOGIN_SCENES,LOGIN_SCENE_STORAGE_KEY,nextLoginSceneIndex,applyLoginScene} from '../ui/login-scene.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

test('all four rotating login scene assets exist on disk',()=>{
  assert.equal(LOGIN_SCENES.length,4);
  for(const rel of LOGIN_SCENES){
    const bytes=readFileSync(resolve(root,rel));
    assert.ok(bytes.length>1000,`login banner exists: ${rel}`);
  }
});

test('nextLoginSceneIndex cycles smoothly 0..3 and persists to storage',()=>{
  const store=new Map();
  const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
  assert.equal(nextLoginSceneIndex(storage),0);
  assert.equal(nextLoginSceneIndex(storage),1);
  assert.equal(nextLoginSceneIndex(storage),2);
  assert.equal(nextLoginSceneIndex(storage),3);
  assert.equal(nextLoginSceneIndex(storage),0);
  assert.equal(store.get(LOGIN_SCENE_STORAGE_KEY),'0');
});

test('applyLoginScene assigns rotating asset to #authSceneImg and degrades safely when storage throws',()=>{
  const img={src:''};
  const doc={getElementById:id=>id==='authSceneImg'?img:null};
  const throwingStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  const a=applyLoginScene({document:doc,storage:throwingStorage});
  const b=applyLoginScene({document:doc,storage:throwingStorage});
  assert.notEqual(a.src,b.src);
  assert.equal(img.src,b.src);
  assert.match(readFileSync(resolve(root,'account.js'),'utf8'),/applyLoginScene\(/);
});

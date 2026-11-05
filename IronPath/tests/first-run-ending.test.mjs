import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {runFirstRunEnding,endingDone,markEndingDone,endingKey,ENDING_STEPS,ENDING_KEY,FIELD_SCHOOL_ENTRIES} from '../first-run-ending.mjs';

const storage=()=>{const store=new Map();return {store,getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};};

test('the ending runs once per account: skills, tag, workshop, in that order',async()=>{
 const store=storage(),seen=[];
 const result=await runFirstRunEnding({
  id:'soldier-a',storage:store,
  steps:{
   skills:async()=>{seen.push('skills');return true;},
   tag:async()=>{seen.push('tag');return true;},
   workshop:async()=>{seen.push('workshop');return true;},
  },
 });
 assert.deepEqual(result,{status:'done',completed:3});
 assert.deepEqual(seen,['skills','tag','workshop'],'the skill point is spent before the tag is issued');
 assert.equal(store.store.get(endingKey('soldier-a')),'done');
 assert.equal(endingDone('soldier-a',store),true);
 const again=await runFirstRunEnding({id:'soldier-a',storage:store,steps:{skills:()=>{throw Error('must not run');}}});
 assert.deepEqual(again,{status:'done',completed:0},'a finished ending never runs twice');
});

test('declining a step stops the sequence without marking it done',async()=>{
 const store=storage(),seen=[];
 const result=await runFirstRunEnding({
  id:'soldier-b',storage:store,
  steps:{skills:async()=>{seen.push('skills');return true;},tag:async()=>{seen.push('tag');return false;},workshop:async()=>{seen.push('workshop');return true;}},
 });
 assert.equal(result.status,'stopped');
 assert.equal(result.step,'tag');
 assert.equal(result.reason,'declined');
 assert.deepEqual(seen,['skills','tag'],'the workshop is not opened behind a declined step');
 assert.equal(endingDone('soldier-b',store),false,'the ending can be offered again');
});

test('a throwing step is a stop, not a crash',async()=>{
 const result=await runFirstRunEnding({id:'soldier-c',storage:storage(),steps:{skills:async()=>{throw Error('no dialog');},tag:async()=>true,workshop:async()=>true}});
 assert.equal(result.status,'stopped');
 assert.equal(result.reason,'declined');
});

test('a missing step stops the sequence cleanly',async()=>{
 const result=await runFirstRunEnding({id:'soldier-d',storage:storage(),steps:{skills:async()=>true}});
 assert.deepEqual({status:result.status,step:result.step,reason:result.reason},{status:'stopped',step:'tag',reason:'unavailable'});
});

test('no account means no ending, and storage failures do not break it',async()=>{
 assert.equal((await runFirstRunEnding({id:null,storage:storage()})).completed,0);
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 markEndingDone('soldier-e',broken);
 assert.equal(endingDone('soldier-e',broken),true,'the session remembers even without storage');
 assert.equal(endingDone('someone-else',broken),false);
 assert.equal(ENDING_STEPS.join(','),'skills,tag,workshop');
 assert.equal(ENDING_KEY,'ironpath:firstrun:v1','a versioned key, so a future ending can differ');
});

test('the Field School points at existing controls, not a second way in',()=>{
 const ids=FIELD_SCHOOL_ENTRIES.map(entry=>entry.id);
 assert.deepEqual(ids,['armory','skills','campaign','multiplayer']);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 for(const entry of FIELD_SCHOOL_ENTRIES){
  assert.ok(html.includes(`id="fieldSchool-${entry.id}"`),`${entry.id} needs a real button`);
  assert.ok(html.includes(`id="${entry.action}"`),`${entry.action} must be an existing control`);
  assert.ok(account.includes('document.getElementById(entry.action)'),`${entry.action} is clicked, never reimplemented`);
  assert.ok(entry.title&&entry.text,`${entry.id} needs a title and one line of help`);
 }
 assert.match(html,/id="fieldSchool"[^>]*hidden/,'the Field School is hidden until the ending runs');
});

test('the ending uses the real dialogs, behind the sandbox write guard',()=>{
 const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 // The skill point is only real once the account saved it; the screen waits for that.
 assert.match(account,/const after=profile\?\.skills\|\|'',lvl=level\(profile\?\.xp\|\|0\);/);
 assert.match(account,/return after!==before&&pointsLeft\(parseBuild\(after,lvl\),lvl\)===0;/,'a saved build with the point spent is the proof');
 // The tag is drawn on every profile snapshot and stored nowhere.
 assert.match(account,/function refreshDogTags\(\)\{[\s\S]{0,220}renderDogTag\(document,container,data\)/);
 assert.match(account,/refreshDogTags\(\);\s*void startFirstRunTutorial\(\);|if\(first\)\{showProfile\(value\);void backfillPrestige\(value\);refreshDogTags\(\);/);
 assert.equal(/dogTag:\s*\{|saveDogTag|dogTagSerial:\s*\(/.test(account),false,'the tag is never written to the account');
 // Every write path in the sandbox refuses before a transaction is built.
 const sandbox=account.slice(account.indexOf('// --- Tutorial sandbox API'),account.indexOf('// --- First-run ending'));
 assert.match(sandbox,/refuseWrite:assertWritable/);
 for(const guard of ['saveCampaign','awardXP'])assert.match(account,new RegExp(`${guard}:[^\\n]{0,200}if\\(inSandbox\\(\\)\\)return`),`${guard} must refuse in the sandbox`);
 // Practice is the one exception, and it is deliberately narrow: the same service
 // methods run against the sample soldier through a local reducer, never a
 // transaction. The real service still refuses while the sandbox is on.
 assert.match(account,/canEdit:\(\)=>!inSandbox\(\)&&canEditSkills\(\)/,'the real service stays shut in the sandbox');
 const local=account.slice(account.indexOf('const sandboxWorkshop={'),account.indexOf('const workshopService={'));
 assert.ok(local.length>0,'practice has its own local service');
 assert.equal(/runTransaction|\bref\(|\bset\(/.test(local),false,'practice never builds a transaction');
 assert.match(account,/applySandboxWorkshop\(p=>applyWireWorkshopCommand\(p,command\),command\)/,'practice uses the workshop reducers');
 // And the real build is only ever applied to the sample profile.
 assert.match(account,/sandboxAPI\.apply\(\{\.\.\.viewProfile\(\),skills:build\}\)/);
});

test('the account literal never names something declared further down',()=>{
 const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
 // `const account={...}` is evaluated during module evaluation. Naming a `const`
 // that is declared later (the bug was `sandbox:sandboxAPI`, declared 130 lines
 // below) throws a temporal-dead-zone ReferenceError, which kills the whole module
 // and with it the Command Center. References inside arrow bodies are deferred and
 // therefore fine, so the check is limited to the shape that actually breaks: a
 // property given a bare identifier, `name:IDENT`, or an eager call/short-circuit.
 const start=account.indexOf('const account={');
 assert.ok(start>0,'the account object is still a top-level literal');
 // The literal ends at the first top-level statement after it; `const level=` sits
 // above it in this file, so search forward only.
 const tail=account.slice(start),stop=tail.search(/\n(?:const |function |let )/);
 const literal=tail.slice(0,stop>0?stop:tail.length);
 assert.ok(literal.length>500,'the account literal was found');
 const declaredAfter=new Set([...account.slice(start).matchAll(/^(?:const|let|class) ([A-Za-z_$][\w$]*)/gm)].map(match=>match[1]));
 for(const name of declaredAfter){
  if(name==='account')continue;
  // `name:IDENT` where IDENT is the late declaration is the fatal shape.
  const eagerProp=new RegExp(`[{,]\\s*[A-Za-z_$][\\w$]*:${name}\\b`);
  assert.equal(eagerProp.test(literal),false,`the account literal must not evaluate ${name} before its declaration`);
 }
 // The live one is attached after it exists, where it is safe and obvious.
 const attach=account.indexOf('account.sandbox=sandboxAPI;'),declared=account.indexOf('const sandboxAPI=');
 assert.ok(declared>0&&attach>declared,'the sandbox is attached after it exists');
 // And the game reads it from the account, not from a second global.
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(game,/const sandbox=account\.sandbox;/);
});

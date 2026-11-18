import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile,readdir} from 'node:fs/promises';

// Reported by Chromium (Block 4, IPL-0054): the account sat on "Game connection
// unavailable" with not a single console error. The cause was a synthetic
// Firebase double inside a browser test whose body did not parse - `async(){}`
// instead of `async()=>{}`. The module graph fails to instantiate, account.js
// never runs, and account-entry.mjs swallows the rejection, so nothing is ever
// logged: the double is a STRING until Chromium parses it, and `node --check`
// on the .cjs file sees only a template literal.
//
// These doubles are therefore parsed here, the way the browser parses them.

const directory=new URL('../browser-tests/',import.meta.url);
const files=(await readdir(directory)).filter(name=>name.endsWith('.cjs')).sort();

// Every `'name.js':`…`` pair in a browser test is a module the page imports.
// The body is read up to the next backtick: the doubles are plain JavaScript
// without template literals of their own, and a lazier pattern once swallowed
// the rest of the file and reported a syntax error that was not there.
function mocksIn(source){
 const found=[];
 const pattern=/'([a-z-]+\.js)':`([^`]*)`/g;
 for(const match of source.matchAll(pattern))found.push({name:match[1],body:match[2]});
 return found;
}

test('every browser test exists and was read',()=>{
 assert.ok(files.length>=10,'the browser tests are still where the harness expects them');
 assert.ok(files.includes('avatar-handover.cjs'),'the avatar hand-over test is part of the smoke run');
});

test('every synthetic browser module is syntactically valid JavaScript',async()=>{
 // The doubles may touch browser state at module scope; give them the two they
 // use so a missing global cannot masquerade as a syntax error.
 globalThis.sessionStorage??={getItem:()=>null,setItem(){},removeItem(){}};
 let checked=0;
 for(const file of files){
  const source=await readFile(new URL(file,directory),'utf8');
  for(const {name,body} of mocksIn(source)){
   checked++;
   // A data: URL is parsed and instantiated exactly like the file the page
   // fetches, imports and all.
   const url='data:text/javascript,'+encodeURIComponent(body);
   await assert.doesNotReject(()=>import(url),`${file}: the synthetic ${name} must parse`);
  }
 }
 assert.ok(checked>=12,`every harness contributes doubles (found ${checked})`);
});

test('the Firebase doubles export what the account imports',async()=>{
 // A double that parses but forgets an export fails just as silently at link
 // time, so the expected set is pinned here.
 const expected=['firebase-app.js','firebase-auth.js','firebase-database.js'];
 for(const file of ['avatar-handover.cjs','character-discharge.cjs','multiplayer-account-handoff.cjs']){
  const source=await readFile(new URL(file,directory),'utf8');
  const names=mocksIn(source).map(entry=>entry.name);
  for(const name of expected)assert.ok(names.includes(name),`${file} must provide ${name}`);
 }
});

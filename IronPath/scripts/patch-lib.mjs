// Shared definitions for the patch tooling.
//
// patch-check.mjs verifies a release stamp, patch-bump.mjs writes one. Both must
// agree on what "the stamp" is, otherwise a bump can pass its own check by
// accident. Everything they share lives here: the token shape, the places that
// carry the token outside a `?v=` import, which files a bump rewrites, and which
// occurrences must stay historical.
//
// Nothing in this module writes anything, talks to the network, or reads Git
// state. It only looks at files below IronPath/.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

export const IRONPATH=fileURLToPath(new URL('..',import.meta.url));
export const REPO_ROOT=fileURLToPath(new URL('../..',import.meta.url));

// A cache wave token: 20YYMMDD plus a lowercase release name.
export const TOKEN_PATTERN=/^20\d{6}-[a-z0-9]+$/;
export const TOKEN_IN_TEXT=/20\d{6}-[a-z0-9]+/g;

// Files a bump rewrites. Markdown is excluded on purpose: PATCH-LOG.md and the
// plans quote old tokens as history, and rewriting them would falsify the record.
const CODE_FILE=/\.(?:mjs|js|cjs|json|html|css)$/;
const SKIPPED_DIRECTORY=new Set(['node_modules','.git']);

export const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export function readIfExists(path){
  return existsSync(path)?readFileSync(path,'utf8'):null;
}

export function codeFiles(root=IRONPATH){
  const found=[],queue=[root];
  while(queue.length){
    const directory=queue.pop();
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      if(SKIPPED_DIRECTORY.has(entry.name)||entry.name.startsWith('.')) continue;
      const full=join(directory,entry.name);
      if(entry.isDirectory()) queue.push(full);
      else if(entry.isFile()&&CODE_FILE.test(entry.name)) found.push(full);
    }
  }
  return found.sort();
}

const one=(source,pattern)=>{const match=pattern.exec(source);return match?[match[1]]:[]};
const every=(source,pattern)=>[...source.matchAll(pattern)].map(match=>match[1]);

// Every occurrence of the build token that is not a `?v=` import.
//
// These are the places a hand-made bump forgets. Missing one of them does not
// stop the game from loading, which is exactly why they need a check instead of
// a habit: a phone then keeps serving the previous login art, or the loading
// scene advertises a build the modules do not have.
//
// `patch-notes.mjs` is deliberately part of this list. Its first `build:` field
// belongs to RELEASED_PATCHES[0], and tests/patch-notes.test.mjs requires that
// field to equal release-version.json. After a bump the check therefore fails
// until the new field-notes entry exists - the tool cannot ship a cache wave
// nobody documented.
export const STAMP_ANCHORS=Object.freeze([
  {label:'release-version.json → build',file:'release-version.json',
   find:source=>one(source,/"build":\s*"([^"]+)"/)},
  {label:'index.html → <meta name="ironpath-build">',file:'index.html',
   find:source=>one(source,/<meta name="ironpath-build" content="([^"]+)"/)},
  {label:'index.html → class="build-stamp"',file:'index.html',expect:2,
   find:source=>every(source,/class="build-stamp"[^>]*>BUILD ([^<]+)/g)},
  {label:'ui/login-scene.mjs → LOGIN_SCENE_VERSION',file:'ui/login-scene.mjs',
   find:source=>one(source,/LOGIN_SCENE_VERSION\s*=\s*'([^']+)'/)},
  {label:'patch-notes.mjs → RELEASED_PATCHES[0].build',file:'patch-notes.mjs',
   find:source=>one(source,/RELEASED_PATCHES[\s\S]*?build:'([^']+)'/)},
  {label:'browser-tests/avatar-handover.cjs → Fallback',file:'browser-tests/avatar-handover.cjs',
   find:source=>one(source,/\?\.\s*content\s*\|\|\s*'([^']+)'/)},
  {label:'browser-tests/interface-smoke.cjs → Meldung',file:'browser-tests/interface-smoke.cjs',
   find:source=>one(source,/New version ([0-9a-z-]+)/)},
]);

// Occurrences of an old token that must survive a bump. In `patch-notes.mjs`
// only `?v=` imports move; every `build:` field and every sentence quoting a
// wave stays, because those lines state what was actually released.
export const PROTECTED_FILES=Object.freeze([
  {file:'patch-notes.mjs',
   reason:'build:-Felder und Protokollsätze veröffentlichter Patches bleiben stehen; nur ?v=-Importe wandern'},
]);

export function currentToken(root=IRONPATH){
  const source=readIfExists(join(root,'release-version.json'));
  const match=source&&/"build":\s*"([^"]+)"/.exec(source);
  return match?match[1]:null;
}

// Reads every anchor and reports what it actually found.
export function anchorReport(root=IRONPATH){
  return STAMP_ANCHORS.map(anchor=>{
    const source=readIfExists(join(root,anchor.file));
    const expected=anchor.expect??1;
    const values=source===null?[]:anchor.find(source);
    const unique=[...new Set(values)];
    return {
      label:anchor.label,file:anchor.file,expected,found:values.length,values,unique,
      missingFile:source===null,
      ok:source!==null&&values.length===expected&&unique.length===1,
    };
  });
}

// Which wave tokens the tree carries, and how often. Many old tokens are correct:
// unchanged art and untouched multiplayer assets keep their own revision, so this
// is information for a human, never a verdict on its own.
export function tokenHistogram(root=IRONPATH){
  const counts=new Map();
  for(const file of codeFiles(root)){
    const source=readIfExists(file);
    if(!source) continue;
    for(const match of source.matchAll(TOKEN_IN_TEXT)){
      const entry=counts.get(match[0])??{token:match[0],count:0,files:new Set()};
      entry.count+=1;
      entry.files.add(relative(root,file));
      counts.set(match[0],entry);
    }
  }
  return [...counts.values()].sort((a,b)=>b.count-a.count||a.token.localeCompare(b.token));
}

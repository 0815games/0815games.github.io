import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Reference guard for the harness code around the game.
//
// The main suite imports the game modules it tests, so a broken game import
// turns a test file red on load. The harness code is different: server tests
// run under their own npm package, the rules tests need a Java emulator, and
// the browser drives only run in CI. When the core/ move (IPL-0100) renamed
// 101 modules, four CI rounds failed on reference shapes no local test could
// see: imports from two levels up (../../...), dynamic imports built with
// path.join(root, ...), and request paths a test server intercepts by name.
//
// This guard statically resolves exactly those shapes in the Node-executed
// harness directories. Browser-side module strings inside the drives are
// served below /IronPath/, so a './x' literal is accepted when it resolves
// either next to the harness file or against the IronPath root - both are
// real resolution contexts in these files, and a rename breaks both.
//
// Synthetic routes and runtime-copied modules cannot resolve on disk; they
// are listed here with reasons, in the open, instead of weakening the scan.

const IRONPATH=fileURLToPath(new URL('..',import.meta.url));
const SCOPED_DIRECTORIES=['browser-tests','firebase','server','stress-tests'];
const CODE_FILE=/\.(?:mjs|js|cjs)$/;
const SKIPPED_DIRECTORY=new Set(['node_modules','releases','.git']);

const KNOWN_UNRESOLVABLE=new Map([
  ['browser-tests/multiplayer-fullscreen.cjs::./battle-viewport-controller.mjs',
   'der Instrumentierungs-Wrapper loest gegen die abgefangene Modul-URL unter battle/ auf'],
  ['firebase/rules-test/release-site-browser.cjs::./firebase-auth-test-raw.js',
   'wird zur Laufzeit aus den SDK-Modulen des Emulator-Pakets bedient'],
  ['firebase/rules-test/release-site-browser.cjs::./firebase-database-test-raw.js',
   'wird zur Laufzeit aus den SDK-Modulen des Emulator-Pakets bedient'],
  ['firebase/rules-test/admin-panel-browser.cjs::/IronPath/admin-test-bootstrap.mjs',
   'synthetische Route: der Test-Server antwortet mit dem Bootstrap-Text aus dem Speicher'],
  ['firebase/rules-test/admin-panel-browser.cjs::/IronPath/game-test-bootstrap.mjs',
   'synthetische Route: der Test-Server antwortet mit dem Bootstrap-Text aus dem Speicher'],
  ['firebase/rules-test/admin-panel-browser.cjs::/IronPath/test-game-auth.html',
   'synthetische Route: der Test-Server erzeugt die Seite aus dem Speicher'],
  ['firebase/rules-test/release-game-browser.cjs::/IronPath/test-hold.html',
   'synthetische Route: der Test-Server erzeugt die Seite aus dem Speicher'],
]);

const IMPORT_LITERAL=/(?:from\s+|import\s*\(\s*|require\(\s*|import\s+)['"](\.\.?\/[^'"]+)['"]/g;
const JOIN_ROOT_LITERAL=/join\(\s*root\s*,\s*'([^']+)'/g;
const SERVED_PATH_LITERAL=/['"](\/IronPath\/[^'"]+)['"]/g;

function scopedFiles(base){
  const found=[],queue=SCOPED_DIRECTORIES.map(name=>join(base,name));
  while(queue.length){
    const directory=queue.pop();
    if(!existsSync(directory)) continue;
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      if(SKIPPED_DIRECTORY.has(entry.name)||entry.name.startsWith('.')) continue;
      const full=join(directory,entry.name);
      if(entry.isDirectory()) queue.push(full);
      else if(entry.isFile()&&CODE_FILE.test(entry.name)) found.push(full);
    }
  }
  return found.sort();
}

export function referenceFailures(base){
  const failures=[];
  const add=(file,line,kind,specifier)=>{
    if(KNOWN_UNRESOLVABLE.has(`${file}::${specifier.split('?')[0]}`)) return;
    failures.push(`${file}:${line} [${kind}] ${specifier}`);
  };
  for(const path of scopedFiles(base)){
    const source=readFileSync(path,'utf8');
    const file=relative(base,path);
    const lineOf=index=>source.slice(0,index).split('\n').length;
    for(const match of source.matchAll(IMPORT_LITERAL)){
      const specifier=match[1].split('?')[0];
      if(!/\.(?:mjs|js|cjs|json)$/.test(specifier)) continue;
      const nextToFile=resolve(join(path,'..'),specifier);
      const againstRoot=specifier.startsWith('./')?resolve(base,specifier.slice(2)):null;
      if(existsSync(nextToFile)||(againstRoot&&existsSync(againstRoot))) continue;
      add(file,lineOf(match.index),'import',match[1]);
    }
    for(const match of source.matchAll(JOIN_ROOT_LITERAL)){
      if(existsSync(join(base,match[1]))) continue;
      add(file,lineOf(match.index),'path.join(root)',match[1]);
    }
    for(const match of source.matchAll(SERVED_PATH_LITERAL)){
      const served=match[1].split('?')[0].slice('/IronPath/'.length);
      if(!served||served.endsWith('/')||served.startsWith('releases/')) continue;
      if(existsSync(join(base,served))) continue;
      add(file,lineOf(match.index),'serverpfad',match[1]);
    }
  }
  return failures;
}

test('every harness reference resolves after the folder moves',()=>{
  const failures=referenceFailures(IRONPATH);
  assert.deepEqual(failures,[],`nicht aufgeloeste Verweise:\n${failures.join('\n')}`);
});

test('the guard bites on the three shapes that cost four CI rounds',async t=>{
  const base=await mkdtemp(join(tmpdir(),'reference-guard-'));
  t.after(()=>rm(base,{recursive:true,force:true}));
  const root=join(base,'IronPath');
  await mkdir(join(root,'browser-tests'),{recursive:true});
  await mkdir(join(root,'core'),{recursive:true});
  await writeFile(join(root,'core','present.mjs'),'export const ok=true;\n');
  await writeFile(join(root,'browser-tests','drive.cjs'),[
    `const {x}=await import('../../weg.mjs');`,
    `const y=await import(pathToFileURL(path.join(root,'fehlt.mjs')).href);`,
    `if(pathname==='/IronPath/gibts-nicht.mjs')return;`,
    `const pageCode=\`import {ok} from './core/present.mjs'\`;`,
    `const local=await import('./core/present.mjs');`,
    '',
  ].join('\n'));
  const failures=referenceFailures(root);
  assert.equal(failures.length,3, failures.join('\n'));
  assert.ok(failures.some(entry=>entry.includes('weg.mjs')),'der ../../-Import wird gefunden');
  assert.ok(failures.some(entry=>entry.includes('fehlt.mjs')),'der path.join(root)-Import wird gefunden');
  assert.ok(failures.some(entry=>entry.includes('gibts-nicht.mjs')),'der Serverpfad wird gefunden');
});

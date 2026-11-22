import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {dirname,join,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';

// Structure guard for IronPath.
//
// GitHub Pages publishes this repository with `build_type: legacy`, so the whole
// tree is reachable and nothing is filtered at build time. The separation below
// is therefore about working, not about hiding files: the game root must contain
// only what a browser loads, because `release-tools/stage-version.mjs` copies
// every root-level `.mjs`, `.js` and `.css` into each staged release build.
// Documentation and development tooling live in `docs/` and `scripts/`.

const ironpath=fileURLToPath(new URL('..',import.meta.url));
const repo=dirname(ironpath);
const markdownFiles=dir=>readdirSync(dir).filter(name=>name.endsWith('.md')).sort();

test('the game root carries no documentation besides its structure map',()=>{
  assert.deepEqual(markdownFiles(ironpath),['README.md'],
    'IronPath/ is the release inventory: move documentation to IronPath/docs/ '+
    'and keep only README.md as the entry point');
});

test('the documented work folders exist',()=>{
  for(const name of ['docs','tests','browser-tests','stress-tests','firebase','release-tools','server','scripts','assets'])
    assert.ok(statSync(join(ironpath,name)).isDirectory(),`IronPath/${name}/ fehlt`);
  for(const name of ['PATCH-LOG.md','PATCH-BLOECKE.md','DATENBLATT.md','CHECKLIST.md'])
    assert.ok(existsSync(join(ironpath,'docs',name)),`IronPath/docs/${name} fehlt`);
});

test('the working instruction points at the moved protocol documents',()=>{
  const agents=readFileSync(join(repo,'AGENTS.md'),'utf8');
  assert.ok(agents.includes('IronPath/docs/PATCH-LOG.md'),'AGENTS.md muss das Log unter docs/ nennen');
  assert.ok(agents.includes('IronPath/docs/PATCH-BLOECKE.md'),'AGENTS.md muss den Patchplan unter docs/ nennen');
  assert.doesNotMatch(agents,/IronPath\/(?:PATCH-LOG|PATCH-BLOECKE|DATENBLATT)\.md/,
    'AGENTS.md zeigt noch auf einen alten Pfad in der Spielwurzel');
});

// The shipped graph: what the browser actually loads, read from real import
// statements and from the src/href attributes of the root HTML files. Prose and
// code comments do not count - road-geometry.mjs names its own tests in a
// comment, which must not make a development file look shipped.
const IMPORT=/\bfrom\s*["']([\w./?=-]+)["']|\bimport\s*\(\s*["']([\w./?=-]+)["']|^\s*import\s+["']([\w./?=-]+)["']/gm;
const ATTRIBUTE=/(?:src|href)\s*=\s*["']((?:\.\/)?[\w.\/-]+\.(?:mjs|js|css))(?:\?[\w=-]*)?["']/g;
const codeFiles=()=>readdirSync(ironpath).filter(name=>/\.(?:mjs|js|html|css)$/.test(name)).sort();
function shippedSpecifiers(){
  const specs=new Set();
  for(const name of codeFiles()){
    const source=readFileSync(join(ironpath,name),'utf8');
    for(const style of [IMPORT,ATTRIBUTE])
      for(const match of source.matchAll(style))
        for(const target of match.slice(1)) if(target) specs.add(target.split('?')[0]);
  }
  return specs;
}

test('every module in the release inventory is loaded by the game',()=>{
  // stage-version.mjs copies each root-level .mjs/.js/.css into every staged
  // build, so an orphan here is dead weight published to every player.
  const specs=shippedSpecifiers();
  const bases=new Set([...specs].map(spec=>spec.split('/').pop()));
  const inventory=codeFiles().filter(name=>/\.(?:mjs|js)$/.test(name));
  const orphans=inventory.filter(name=>!bases.has(name));
  assert.ok(inventory.length>150,`the scan still sees the game (found ${inventory.length} modules)`);
  assert.deepEqual(orphans,[],
    'Module ohne Importeur in der Spielwurzel werden mit jedem Release-Build '+
    'ausgeliefert. Sie gehören nach IronPath/scripts/ (oder weg).');
});

test('the shipped graph reaches only into assets/ and release-tools/',()=>{
  const allowed=new Set(['assets','release-tools']);
  const offenders=[];
  for(const spec of shippedSpecifiers()){
    if(/^[a-z][a-z0-9+.-]*:\/\//i.test(spec)) continue;   // absolute URL, not a folder
    const path=spec.replace(/^\.\//,'');
    if(!path.includes('/')) continue;                     // a plain root-level file
    const folder=path.split('/')[0];
    if(!allowed.has(folder)) offenders.push(spec);
  }
  assert.deepEqual(offenders.sort(),[],
    'Ein ausgeliefertes Modul greift in einen Arbeitsordner. docs/, tests/, '+
    'scripts/, browser-tests/, stress-tests/, server/, firebase/ und '+
    'browser-artifacts/ sind nicht Teil des Spiels.');
});

test('no development file is part of the critical release inventory',()=>{
  const critical=readFileSync(join(ironpath,'release-tools','verify-staged-build.mjs'),'utf8');
  const block=/CRITICAL_RELEASE_FILES=Object\.freeze\(\[([\s\S]*?)\]\)/.exec(critical);
  assert.ok(block,'verify-staged-build.mjs lists the critical release files');
  for(const folder of ['docs/','scripts/','tests/','browser-tests/','stress-tests/','server/','firebase/'])
    assert.ok(!block[1].includes(folder),`CRITICAL_RELEASE_FILES nennt ${folder}`);
});

test('every relative markdown link below IronPath resolves',()=>{
  const link=/\[[^\]]*\]\(([^)\s]+)\)/g;
  const queue=[ironpath],broken=[];
  let checked=0,files=0;
  while(queue.length){
    const dir=queue.pop();
    for(const entry of readdirSync(dir,{withFileTypes:true})){
      if(entry.name==='node_modules'||entry.name.startsWith('.')) continue;
      const full=join(dir,entry.name);
      if(entry.isDirectory()) queue.push(full);
      else if(entry.isFile()&&entry.name.endsWith('.md')) {
        files+=1;
        const source=readFileSync(full,'utf8');
        for(const match of source.matchAll(link)){
          const target=match[1];
          if(target.startsWith('http://')||target.startsWith('https://')||
             target.startsWith('mailto:')||target.startsWith('#')) continue;
          const base=target.split('#')[0];
          if(!base) continue;
          checked+=1;
          if(!existsSync(normalize(join(dirname(full),base))))
            broken.push(`${full.slice(ironpath.length)} -> ${target}`);
        }
      }
    }
  }
  assert.ok(files>=50,`the walk still sees the documentation (found ${files} files)`);
  assert.ok(checked>=150,`the walk still sees the links (found ${checked})`);
  assert.deepEqual(broken,[],'relative Markdown-Links ohne Ziel');
});

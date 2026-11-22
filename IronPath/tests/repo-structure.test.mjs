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

import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readdirSync,readFileSync,writeFileSync,mkdirSync,rmSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

// The browser loads account.js and game.js as strict ES modules, and a parse
// error there kills the whole module graph: the page boots into nothing and
// the only symptom is a hidden #gameWorkspace. `node --check` on a `.js` file
// does NOT guarantee that strict parse (it can accept input the browser
// rejects), so every production module is checked through an `.mjs` copy,
// which Node always parses as a module. Reported by the browser smoke test:
// "SyntaxError: Unexpected token '}'" with the suite green.

const root=fileURLToPath(new URL('..',import.meta.url));
const files=[];
const walk=d=>{for(const e of readdirSync(d)){if(['.git','node_modules','tests','browser-tests','firebase'].includes(e))continue;const f=join(d,e);if(statSync(f).isDirectory())walk(f);else if(/\.(js|mjs)$/.test(e))files.push(f);}};
walk(root);

test(`every production module parses as a strict ES module (${files.length} files)`,()=>{
 const tmp=join(tmpdir(),`ironpath-esm-check-${process.pid}`);
 mkdirSync(tmp,{recursive:true});
 try{
  const broken=[];
  for(const f of files){
   const copy=join(tmp,relative(root,f).replace(/[\\/]/g,'__')+'.mjs');
   writeFileSync(copy,readFileSync(f));
   const result=spawnSync(process.execPath,['--check',copy],{encoding:'utf8'});
   if(result.status!==0)broken.push(`${relative(root,f)}: ${(result.stderr||'').trim().split('\n')[0]}`);
  }
  assert.deepEqual(broken,[],'the browser loads these as strict ES modules - a parse error here boots the page into nothing');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});

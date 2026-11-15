// Build the existing ironpathtest project into the *test* Vercel service's
// public directory. This is never the GitHub Pages production build and never
// reads service-account credentials. The public Firebase settings are not keys
// to administrative access. A new Git commit gets a new immutable build ID.
import {cp, lstat, mkdir, mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {stageVersion} from './stage-version.mjs';
import {stageLauncher} from './stage-launcher.mjs';

export const TEST_PUBLIC_CONFIG = Object.freeze({
  firebase:Object.freeze({
    apiKey:'AIzaSyCY7Mz5OO7ql9Sqlq707mf9epbkiJ2oWIk',
    authDomain:'ironpathtest.firebaseapp.com',
    databaseURL:'https://ironpathtest-default-rtdb.europe-west1.firebasedatabase.app',
    projectId:'ironpathtest',
    storageBucket:'ironpathtest.firebasestorage.app',
    messagingSenderId:'669266106754',
    appId:'1:669266106754:web:b6c15be60d57cc82b2979b'
  }),
  sessionEndpoint:'https://ironpath-release.vercel.app/api/session'
});

export function isolatedTestBuildId(commit) {
  if (typeof commit !== 'string' || !/^[a-f0-9]{40}$/.test(commit)) {
    throw Error('A full Git commit SHA is required for the isolated test build');
  }
  return `test-${commit}`;
}

// Catch the production fallback in any staged file, not only account.js. This
// checks the two known public identifiers; it cannot detect every possible
// production destination or prove that the hosting environment is authentic.
async function assertNoGameProjectIdentifiers(dir, identifiers) {
  async function walk(path) {
    for (const entry of await readdir(path, {withFileTypes:true})) {
      const file=join(path,entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        const bytes=await readFile(file);
        if (identifiers.some(id=>bytes.includes(id))) throw Error('Production Firebase identifier found in test build');
      } else throw Error('Unexpected file in isolated test build');
    }
  }
  await walk(dir);
}

export async function buildIsolatedTestSite({sourceDir, outputDir, commit} = {}) {
  const build=isolatedTestBuildId(commit);
  if (typeof sourceDir !== 'string' || typeof outputDir !== 'string') throw Error('Source and output directories are required');
  const source=resolve(sourceDir), output=resolve(outputDir), target=join(output,'IronPath');
  // Do not replace or merge a previous build: each deploy must start from a
  // clean output directory so the public index cannot select stale content.
  try { await lstat(target); throw Error('Test site output already exists'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const account=await readFile(join(source,'account.js'),'utf8');
  const marked=account.split(/\r?\n/).filter(line=>line.includes('// @ironpath-account-firebase-config'));
  const project=marked[0]?.match(/projectId:'([^']+)'/)?.[1];
  const key=marked[0]?.match(/apiKey:'([^']+)'/)?.[1];
  if (marked.length!==1 || !project || !key || project===TEST_PUBLIC_CONFIG.firebase.projectId || key===TEST_PUBLIC_CONFIG.firebase.apiKey) {
    throw Error('Cannot independently identify the normal Firebase configuration');
  }
  const temporary=await mkdtemp(join(tmpdir(),'ironpath-test-site-'));
  try {
    const site=join(temporary,'IronPath'), releases=join(site,'releases');
    await mkdir(releases,{recursive:true});
    const staged=await stageVersion({sourceDir:source,outputDir:releases,build,guardedConfig:TEST_PUBLIC_CONFIG});
    await stageLauncher({sourceDir:source,outputDir:site,build:`launcher-${commit}`,config:TEST_PUBLIC_CONFIG});
    await assertNoGameProjectIdentifiers(site,[project,key]);
    await mkdir(output,{recursive:true});
    await cp(site,target,{recursive:true,errorOnExist:true,force:false});
    return {build,files:staged.fileCount,site:target,project:TEST_PUBLIC_CONFIG.firebase.projectId};
  } finally { await rm(temporary,{recursive:true,force:true}); }
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const tools=dirname(fileURLToPath(import.meta.url)), sourceDir=resolve(tools,'..');
  buildIsolatedTestSite({sourceDir,outputDir:join(tools,'public'),commit:process.env.VERCEL_GIT_COMMIT_SHA})
    .then(result=>console.log(`Isolated test site ready: ${result.build}; ${result.files} game files; Firebase ${result.project}`))
    .catch(error=>{console.error(error.message);process.exitCode=1;});
}

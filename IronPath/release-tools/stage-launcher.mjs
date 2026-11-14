// Builds a local, explicitly configured launcher candidate. It never writes to
// the source tree, overwrites an entry, deploys a site or changes Firebase.
import {mkdir,readFile,realpath,lstat,writeFile} from 'node:fs/promises';
import {join,relative,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {BUILD_PATTERN} from './release-control.mjs';
import {formatPublicSiteConfig,validatePublicSiteConfig} from './public-site-config.mjs';

const within=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith(`..${sep}`)&&r!=='..'&&!r.startsWith(sep));};
const sharedFiles=Object.freeze(['release-launcher.mjs','verify-staged-build.mjs','public-site-config.mjs',
  'status-monitor.mjs','release-control.mjs','bounded-json.mjs','maintenance-view.mjs']);
async function realDirectory(path){const info=await lstat(path);if(!info.isDirectory()||info.isSymbolicLink())throw Error('Invalid launcher source or output directory');}
async function regularFile(path){const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink())throw Error('Invalid launcher source file');return readFile(path);}

export async function stageLauncher({sourceDir,outputDir,build,config} = {}) {
  if(typeof build!=='string'||!BUILD_PATTERN.test(build))throw Error('Invalid launcher build ID');
  if(typeof sourceDir!=='string'||typeof outputDir!=='string')throw Error('Explicit source and output are required');
  const publicConfig=validatePublicSiteConfig(config);
  const source=await realpath(resolve(sourceDir)),output=await realpath(resolve(outputDir));
  if(within(source,output)||within(output,source))throw Error('Output and source must be separate directory trees');
  await realDirectory(source);await realDirectory(output);
  const index=join(output,'index.html');
  try{await lstat(index);throw Error('Launcher entry already exists');}catch(error){if(error.code!=='ENOENT')throw error;}
  const tools=join(source,'release-tools'),templates=join(tools,'launcher'),assets=join(source,'assets');
  await realDirectory(tools);await realDirectory(templates);await realDirectory(assets);
  const launcherRoot=join(output,'launcher');
  try{await mkdir(launcherRoot);}catch(error){if(error.code!=='EEXIST')throw error;}
  await realDirectory(launcherRoot);
  const target=join(launcherRoot,build);
  await mkdir(target); // Immutable launcher ID: no recursive overwrite or reuse.
  await mkdir(join(target,'assets'));
  let count=0;
  async function save(path,bytes){await writeFile(join(target,path),bytes,{flag:'wx'});count++;}
  for(const name of sharedFiles)await save(name,await regularFile(join(tools,name)));
  for(const name of ['launcher-entry.mjs','launcher.css'])await save(name,await regularFile(join(templates,name)));
  for(const name of ['story-outpost.jpg','iron-path-brand-cutout.png'])await save(join('assets',name),await regularFile(join(assets,name)));
  let css=(await regularFile(join(tools,'maintenance-view.css'))).toString('utf8');
  if(css.split('../assets/story-outpost.jpg').length!==2)throw Error('Unexpected maintenance stylesheet');
  css=css.replace('../assets/story-outpost.jpg','./assets/story-outpost.jpg');
  await save('maintenance-view.css',Buffer.from(css));
  await save('release-config.mjs',Buffer.from(formatPublicSiteConfig(publicConfig)));
  let html=(await regularFile(join(templates,'index.html'))).toString('utf8');
  if(!html.includes('__LAUNCHER_BUILD__'))throw Error('Unexpected launcher template');
  html=html.replaceAll('__LAUNCHER_BUILD__',build);
  // Publish the entry last and exclusively. If staging fails, no half-built
  // launcher becomes the site's index. This is not an atomic Pages deployment.
  await writeFile(index,html,{flag:'wx'});
  return {directory:output,launcher:target,build,fileCount:count+1};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [,,sourceDir,outputDir,build,configPath]=process.argv;
  if(process.argv.length!==6||!sourceDir||!outputDir||!build||!configPath){
    console.error('Usage: node stage-launcher.mjs <IronPath source directory> <separate site directory> <unique-launcher-id> <public-json-file>');
    process.exitCode=2;
  }else{
    (async()=>{
      const text=await readFile(configPath,'utf8');let config;
      try{config=JSON.parse(text);}catch{throw Error('Invalid public configuration JSON');}
      return stageLauncher({sourceDir,outputDir,build,config});
    })().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}

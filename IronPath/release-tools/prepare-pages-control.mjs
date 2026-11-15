// Prepare a local, server-timestamped control record for a retained Pages
// build. This does not read or write Firebase or acquire operator credentials.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {planPagesReleases} from './build-pages-site.mjs';
import {prepareReleaseControlWrite} from './release-control-write.mjs';

export function preparePagesControl({mode,build,currentEpoch,pins,publicConfig} = {},random) {
  const plan=planPagesReleases(pins,publicConfig);
  if(![plan.candidate,plan.rollback].filter(Boolean).some(item=>item.build===build)) {
    throw Error('Build is not retained in the Pages release plan');
  }
  if(mode==='open' && currentEpoch===null)throw Error('Read the existing maintenance epoch before reopening');
  return prepareReleaseControlWrite({mode,build,currentEpoch},random);
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [,,mode,build,epoch,output]=process.argv;
  if(process.argv.length!==6 || !['maintenance','open'].includes(mode) || !build || !epoch || !output){
    console.error('Usage: node prepare-pages-control.mjs <maintenance|open> <retained-build> <current-epoch|none> <new-output.json>');
    process.exitCode=2;
  }else{
    (async()=>{
      const [pins,publicConfig]=await Promise.all(['pages-release-pins.json','production-public-config.json']
        .map(async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'))));
      const value=preparePagesControl({mode,build,currentEpoch:epoch==='none'?null:epoch,pins,publicConfig});
      await writeFile(output,`${JSON.stringify(value,null,2)}\n`,{flag:'wx',mode:0o600});
      console.log('Prepared a local record only; no Firebase data was changed.');
    })().catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}

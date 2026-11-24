#!/usr/bin/env node
// Dry run for publishing the candidate Realtime Database rules. Never writes anything.
//
//   node scripts/rules-publish-dry-run.mjs <exported-live-rules.json>
//   node scripts/rules-publish-dry-run.mjs                     # nur Sperrmodus-Prüfung
//
// Nachbau von IronPath/scripts/rules-publish-dry-run.mjs. Der Vergleich mit dem
// Live-Export ist unverändert. Zusätzlich prüft dieses Projekt den Sperrmodus,
// weil es (noch) keinen Emulator gibt, der das übernimmt.
//
// Compares an exported live Realtime Database ruleset against the candidate and
// fails (exit 1) when the candidate would drop or loosen something that exists
// live. Publishing replaces the entire ruleset, so a missing path is a real
// regression for players. Use --json for machine-readable output.
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
export const CANDIDATE=resolve(here,'../firebase/database.rules.json');
const FIREBASE_DIR=resolve(here,'../firebase');

// Every other `*.complete.draft.rules.json` is treated as a full ruleset for a
// shipped feature. If one has paths the candidate lacks, publishing the
// candidate would remove that feature's rules. This compares the repository's
// drafts, not live Firebase, and cannot prove live parity.
export async function compareRepoDrafts(candidateRules=null){
  const rules=candidateRules??unwrapRules(JSON.parse(await readFile(CANDIDATE,'utf8')));
  const names=(await readdir(FIREBASE_DIR)).filter(name=>name.endsWith('.complete.draft.rules.json')&&resolve(FIREBASE_DIR,name)!==CANDIDATE).sort();
  const missing=[];
  for(const name of names){
    const draft=unwrapRules(JSON.parse(await readFile(resolve(FIREBASE_DIR,name),'utf8')));
    const covered=new Set(flatten(rules).keys());
    const gaps=[...flatten(draft).keys()].filter(path=>!covered.has(path));
    if(gaps.length)missing.push({draft:name,gaps});
  }
  return {drafts:names.length,missing};
}
const MODES=['.read','.write','.validate','.indexOn'];

// Firebase exports may wrap the result in {rules:...}; the console copy is the
// bare object. Accept both and reject anything that is not a rules tree.
export function unwrapRules(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Rules must be a JSON object');
  const inner=value.rules;
  if(inner&&typeof inner==='object'&&!Array.isArray(inner))return inner;
  return value;
}
function flatten(node,prefix='',out=new Map()){
  for(const [key,value] of Object.entries(node)){
    if(!value||typeof value!=='object'||Array.isArray(value))continue;
    const path=`${prefix}/${key}`;
    out.set(path,value);
    flatten(value,path,out);
  }
  return out;
}
const isBlank=value=>value===undefined||value===null||value===''||(typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===0);
const normalize=value=>Array.isArray(value)?value.join(','):String(value);

// Semantics: dropping a live restriction widens access, because Firebase
// cascades parent rules. A dropped .read/.write matters when an ancestor grants
// that same mode; a dropped .validate matters whenever the node stays writable.
export function compareRules(live,candidate){
  const livePaths=flatten(live),candPaths=flatten(candidate);
  const blockers=[],warnings=[];
  for(const [path,node] of livePaths){
    const target=candPaths.get(path),ancestors=ancestorModes(live,path);
    if(!target){
      const modes=MODES.filter(mode=>!isBlank(node[mode]));
      const widens=modes.filter(mode=>(mode==='.validate'?ancestors.includes('.write')||!isBlank(node['.write']):ancestors.includes(mode)));
      const line={path,modes};
      if(widens.length)blockers.push({reason:'live restriction would disappear and leave the path open',...line,widens,ancestors});
      else warnings.push({reason:'live path is absent from the candidate and no ancestor grants access',...line,ancestors});
      continue;
    }
    for(const mode of MODES){
      if(isBlank(node[mode]))continue;
      if(isBlank(target[mode])){
        if(mode==='.indexOn'){warnings.push({reason:'index would be dropped; queries past 100 children will fail',path,mode});continue;}
        const widens=mode==='.validate'?ancestors.includes('.write')||!isBlank(target['.write']):ancestors.includes(mode);
        (widens?blockers:warnings).push({reason:mode==='.validate'?'validation would be dropped':'access rule would be dropped',path,mode,live:normalize(node[mode]),candidate:null});
        continue;
      }
      if(normalize(node[mode])!==normalize(target[mode]))warnings.push({reason:'rule text differs; review the semantic change',path,mode,live:normalize(node[mode]),candidate:normalize(target[mode])});
    }
  }
  const added=[...candPaths.keys()].filter(path=>!livePaths.has(path));
  return {blockers,warnings,added,counts:{live:livePaths.size,candidate:candPaths.size,added:added.length}};
}
// Modes granted strictly above `path`; the node itself is excluded.
function ancestorModes(live,path){
  const modes=[],parts=path.split('/').filter(Boolean);
  let node=live;
  for(const part of parts.slice(0,-1)){node=node?.[part];for(const mode of ['.read','.write','.validate'])if(!isBlank(node?.[mode]))modes.push(mode);}
  return [...new Set(modes)];
}

// Sperrmodus: the root stays closed, only saves/$uid/town is reachable, and the
// owner check, schema validation and unknown-field rejection are present.
// Blockers: the same rules that the emulator suite would enforce in IronPath.
export function checkRules(raw){
  const errors=[];
  const rules=unwrapRules(raw);
  if(rules['.read']!==undefined||rules['.write']!==undefined)
    errors.push('Wurzel: .read oder .write gesetzt. Die Wurzel muss geschlossen bleiben.');
  for(const key of Object.keys(rules))
    if(!key.startsWith('.')&&key!=='saves')errors.push(`Unbekannter Zweig "${key}"`);
  walk(rules,'',(path,node)=>{
    for(const mode of ['.read','.write'])
      if(node[mode]===true||node[mode]==='true')errors.push(`${path||'/'}: ${mode} ist offen (true)`);
  });
  const owner=rules.saves?.$uid;
  if(!owner)errors.push('saves/$uid fehlt');
  else{
    if(!String(owner['.read']??'').includes('auth.uid === $uid'))errors.push('saves/$uid: .read ohne Eigentümerprüfung');
    const town=owner.town;
    if(!town)errors.push('saves/$uid/town fehlt');
    else{
      if(!String(town['.write']??'').includes('auth.uid === $uid'))errors.push('town: .write ohne Eigentümerprüfung');
      if(!String(town['.validate']??'').includes('newData'))errors.push('town: .validate prüft nichts');
      if(town.$other?.['.validate']!==false)errors.push('town: $other muss .validate false haben (unbekannte Felder abweisen)');
      if(!String(town['.validate']??'').includes('schemaVersion'))errors.push('town: Schema-Downgrade wird nicht geprüft');
    }
  }
  return {errors};
}
function walk(node,prefix,visit){
  visit(prefix,node);
  for(const [key,value] of Object.entries(node)){
    if(!value||typeof value!=='object'||Array.isArray(value))continue;
    if(key.startsWith('.'))continue;
    walk(value,`${prefix}/${key}`,visit);
  }
}

/** Pfade, die live existieren und im Kandidaten fehlen. */
export function missingPaths(liveRaw,candidateRaw){
  const live=unwrapRules(liveRaw);
  const cand=unwrapRules(candidateRaw);
  const paths=root=>{const out=new Set();walk(root,'',p=>{if(p)out.add(p)});return out};
  const have=paths(cand);
  return [...paths(live)].filter(p=>!have.has(p));
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),json=args.includes('--json');
  const candIdx=args.indexOf('--candidate');
  const candidateFile=candIdx>=0?args[candIdx+1]:null;
  if(candIdx>=0&&(!candidateFile||candidateFile.startsWith('--'))){
    console.error('Missing path after --candidate');
    process.exit(2);
  }
  const positional=args.filter((arg,index)=>!arg.startsWith('--')&&(candIdx<0||index!==candIdx+1));
  const file=positional[0];
  const candidatePath=candidateFile?resolve(candidateFile):CANDIDATE;
  try{
    const candidateRaw=JSON.parse(await readFile(candidatePath,'utf8'));
    const structure=checkRules(candidateRaw).errors;
    if(!file){
      // Ohne Live-Export nur die Struktur. Veröffentlichen erst mit Export.
      if(structure.length){
        console.error('Regeln: FEHLER (Sperrmodus)');
        for(const e of structure)console.error(`  - ${e}`);
        process.exit(1);
      }
      console.log(`Regeln: OK (Kandidat ${candidatePath.split('/').slice(-2).join('/')}). Ohne Live-Export nur Struktur geprüft.`);
      console.log('Export first: Firebase Console → Realtime Database → Rules, then paste into a local file (never commit it).');
      process.exit(0);
    }
    const live=unwrapRules(JSON.parse(await readFile(resolve(file),'utf8')));
    const candidate=unwrapRules(candidateRaw);
    const report=compareRules(live,candidate);
    report.structure=structure;
    for(const e of structure)report.blockers.push({path:'candidate',reason:e});
    report.repoDrafts=await compareRepoDrafts(candidate);
    for(const gap of report.repoDrafts.missing)report.blockers.push({path:gap.draft,reason:'candidate lacks paths from another complete draft',gaps:gap.gaps});
    if(json)console.log(JSON.stringify(report,null,2));
    else{
      console.log(`Candidate: ${candidatePath}`);
      console.log(`Live paths: ${report.counts.live} · candidate paths: ${report.counts.candidate} · new in candidate: ${report.counts.added}`);
      console.log(`Complete drafts cross-checked: ${report.repoDrafts.drafts}`);
      console.log(`Blockers: ${report.blockers.length} · review items: ${report.warnings.length}`);
      for(const item of report.blockers)console.log(`BLOCK  ${item.mode??(item.modes??[]).join(',')} ${item.path} — ${item.reason}${item.gaps?`: ${item.gaps.join(', ')}`:''}`);
      for(const item of report.added)console.log(`NEW    ${item}`);
      for(const item of report.warnings)console.log(`REVIEW ${item.mode??''} ${item.path} — ${item.reason}`);
      console.log(report.blockers.length?'\nDo not publish this candidate until every blocker is resolved.':'\nNo blockers. Still review every item and back up the live rules first. The emulator suite is not set up yet (see docs/FIREBASE.md).');
    }
    process.exit(report.blockers.length?1:0);
  }catch(error){
    console.error(`Dry run failed: ${error.message}`);
    process.exit(2);
  }
}

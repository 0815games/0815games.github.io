// Balance field report (IPL-0129) — the re-runnable evaluation file.
//
// One command runs the whole balance matrix (soldier classes, loadouts via
// gear tiers, tower placement scenarios, sector retreats), prints a linked
// table of every evaluation, and compares it against the committed baseline:
//
//   node tests/balance-field-report.mjs                  # matrix + table
//   node tests/balance-field-report.mjs --quick          # reduced matrix
//   node tests/balance-field-report.mjs --write-baseline # snapshot as new baseline (commit it!)
//   node tests/balance-field-report.mjs --check          # compare vs baseline, exit 1 on regression
//   node tests/balance-field-report.mjs --with-stress    # link the stress package's summary into the report
//
// Philosophy: every balance change is deliberate. Run the report, see the
// deltas, decide, then `--write-baseline` and commit the new baseline next
// to the code change — reverting a balance decision is `git revert` of that
// baseline together with the code. The wave trace (hp / money / towers /
// leaks per wave, sector advance events) makes any "the cliff is back"
// claim checkable instead of a feeling.

import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {runSoloTrace,runCoop,GEARS,CLASS_VARIANTS,classGear} from './balance-harness.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const BASELINE=path.join(HERE,'balance-baseline.json');
const LATEST=path.join(HERE,'balance-report-latest.json');
const TICKS_PER_SECOND=30;

const args=new Set(process.argv.slice(2));
const quick=args.has('--quick');
const check=args.has('--check');
const writeBaseline=args.has('--write-baseline');
const withStress=args.has('--with-stress');
// ---------------------------------------------------------------- scenarios
function scenarios(){
  const list=[];
  const soloMaps=quick?['road','g3-0b9f45231']:['road','forest','g3-0b9f45231','g3-0d3e7f521'];
  for(const map of soloMaps)
    for(const gear of [GEARS.rookie,GEARS.veteran,GEARS.elite])
      list.push({kind:'solo',map,gear:gear.label,gearDef:gear,placement:'coverage'});
  if(!quick){
    // Every soldier class, on the gentle intro and on the sector-retreat
    // field — same level/loadout/skill bits, only the class differs.
    for(const cls of CLASS_VARIANTS)
      for(const map of ['road','g3-0b9f45231'])
        list.push({kind:'solo',map,gear:`veteran-${cls}`,gearDef:classGear(cls),placement:'coverage'});
    // Where the towers sit: entrance-heavy, last line, spread out
    // (the default 'coverage' rows above are the fourth policy).
    for(const placement of ['roadside','bunker','spread'])
      for(const map of ['road','g3-0b9f45231'])
        list.push({kind:'solo',map,gear:'rookie',gearDef:GEARS.rookie,placement});
  }
  // Coarse coop rows (final outcome only — the pair runs are the pins'
  // territory, the report links them in for one table).
  for(const map of quick?['road']:['road','forest'])
    list.push({kind:'coop',map,gear:'rookie',gearDef:GEARS.rookie,placement:'coverage'});
  return list;
}

// ---------------------------------------------------------------- analysis
function analyzeTrace(trace){
  const starts=new Map(),ends=new Map();
  const advances=[];
  for(const e of trace){
    if(e.type==='wave')starts.set(e.wave,e);
    else if(e.type==='end')ends.set(e.wave,e);
    else if(e.type==='advance')advances.push(e);
  }
  // The operator's scenario is the FIRST map switch (wave 11) — the cliff
  // metrics measure that window; every later retreat is kept in `advances`.
  const advance=advances[0]||null;
  const damage={};
  const seconds={};
  for(const [w,start] of starts){
    const end=ends.get(w);
    if(end){
      damage[w]=Math.max(0,start.hp-end.hp);
      if(Number.isFinite(start.t)&&Number.isFinite(end.t)&&end.t>=start.t)
        seconds[w]=Math.round((end.t-start.t)/TICKS_PER_SECOND*10)/10;
    }
  }
  const band=(a,b)=>{let n=0;for(let w=a;w<=b;w++)n+=damage[w]||0;return n;};
  const from=advance?advance.wave+1:11;
  const cliff={from,to:from+2,damage:band(from,from+2)};
  const wave11=starts.get(from),wave12=starts.get(from+1);
  const avgSeconds=(a,b)=>{const v=[];for(let w=a;w<=b;w++)if(seconds[w]!=null)v.push(seconds[w]);
    return v.length?Math.round(v.reduce((n,x)=>n+x,0)/v.length*10)/10:null;};
  return {
    advance:advance?{wave:advance.wave,from:advance.from,to:advance.to,hp:advance.hp,money:advance.money}:null,
    advances:advances.map(a=>({wave:a.wave,from:a.from,to:a.to,hp:a.hp,money:a.money})),
    damageBands:{w1_5:band(1,5),w6_10:band(6,10),w11_15:band(from,from+4),w16_20:band(from+5,from+9)},
    cliff,
    graceWaveDamage:damage[from]??null,
    rebuild:{towersAtGraceStart:wave11?towersOf(wave11):null,towersAtNextStart:wave12?towersOf(wave12):null},
    waveSeconds:{early:avgSeconds(1,10),transition:avgSeconds(from,from+2)},
    hpAtWaveStart:Object.fromEntries([...starts].map(([w,e])=>[w,e.hp])),
  };
}
function towersOf(start){return start.towers;}

function analyzeSolo(result){
  const trace=result.trace||[];
  const base={
    outcome:result.ended, // laneResult already carries 'alive' | 'defeat'
    deathWave:result.ended==='defeat'?result.wave:null,
    finalWave:result.wave,
    hpFinal:Math.round(result.hp),
    maxHp:Math.round(result.maxHp),
    towers:result.towers,
    levels:result.levels,
  };
  const traced=analyzeTrace(trace);
  return {...base,...traced,cliffDamage:traced.cliff.damage};
}

function analyzeCoop(result){
  return {
    outcome:result.ended,
    deathWave:result.ended==='defeat'?result.wave:null,
    finalWave:result.wave,
    hpFinal:Math.round(result.hp),
    maxHp:Math.round(result.maxHp),
    towers:result.towers,
    levels:result.levels,
    advance:null,advances:[],damageBands:null,cliff:null,graceWaveDamage:null,
    rebuild:null,waveSeconds:null,hpAtWaveStart:null,
    coarse:true,
  };
}

// ---------------------------------------------------------------- execution
function scenarioId(sc){return `${sc.kind}:${sc.gear}:${sc.map}:${sc.placement}`;}

function runScenario(sc){
  const started=Date.now();
  const metrics=sc.kind==='solo'
    ? analyzeSolo(runSoloTrace(sc.map,sc.gearDef,25,{placement:sc.placement}))
    : analyzeCoop(runCoop(sc.map,2,sc.gearDef,40));
  return {id:scenarioId(sc),scenario:{kind:sc.kind,map:sc.map,gear:sc.gear,placement:sc.placement},ms:Date.now()-started,metrics};
}

function stressSummary(){
  const r=spawnSync(process.execPath,[path.join(HERE,'..','stress-tests','run.mjs')],{cwd:path.join(HERE,'..','..'),encoding:'utf8',timeout:600000});
  if(r.status!==0){
    console.error('stress package FAILED:\n'+String(r.stderr||'').slice(-2000));
    return {ok:false};
  }
  const jsonStart=r.stdout.indexOf('{');
  const summary=JSON.parse(r.stdout.slice(jsonStart));
  const outcomes=(list)=>({n:list.length,defeats:list.filter(x=>x.outcome==='defeat').length,
    maxTicks:Math.max(0,...list.map(x=>x.ticks||0))});
  return {
    ok:true,
    playthroughs:outcomes(summary.playthroughs),
    extended:outcomes(summary.extended),
    maps:{count:summary.maps.count,themes:summary.maps.themes},
    density:{n:summary.density.length,maxMs:Math.max(...summary.density.map(x=>x.elapsedMs)),
      maxViewBytes:Math.max(...summary.density.map(x=>x.maxViewBytes))},
    protocol:{n:summary.protocol.length,totalApplied:summary.protocol.reduce((n,x)=>n+x.applied,0),
      reconnectCycles:summary.protocol.reduce((n,x)=>n+x.reconnectCycles,0)},
  };
}

// ---------------------------------------------------------------- reporting
function fmtRow(run){
  const m=run.metrics;
  const cliff=m.cliffDamage!=null?String(m.cliffDamage):'-';
  const early=m.damageBands?String(m.damageBands.w6_10):'-';
  const grace=m.graceWaveDamage!=null?String(m.graceWaveDamage):'-';
  const rebuild=m.rebuild?`${m.rebuild.towersAtGraceStart??'-'}/${m.rebuild.towersAtNextStart??'-'}`:'-';
  return [run.id.padEnd(42),m.outcome.padEnd(7),String(m.finalWave).padStart(3),
    String(m.hpFinal).padStart(4),cliff.padStart(5),early.padStart(5),grace.padStart(5),
    rebuild.padStart(5),`${run.ms}ms`];
}

function compare(runs,base){
  const rows=[];const byId=Object.fromEntries(runs.map(r=>[r.id,r]));
  for(const [id,cur] of Object.entries(byId)){
    const b=base.runs[id];
    if(!b){rows.push({id,status:'NEW',fails:[]});continue;}
    const fails=[];
    const curM=cur.metrics;
    if(b.outcome==='alive'&&curM.outcome==='defeat')fails.push(`alive→defeat (wave ${curM.finalWave})`);
    if(b.outcome==='defeat'&&curM.outcome==='defeat'&&curM.deathWave<b.deathWave-1)
      fails.push(`dies ${b.deathWave}→${curM.deathWave} (−${b.deathWave-curM.deathWave} waves)`);
    if(curM.cliffDamage!=null&&b.cliffDamage!=null){
      const limit=Math.max(12,b.cliffDamage+6);
      if(curM.cliffDamage>limit)fails.push(`cliff damage ${b.cliffDamage}→${curM.cliffDamage} (limit ${limit})`);
    }
    if(curM.outcome==='alive'&&b.outcome==='alive'&&curM.finalWave<b.finalWave&&b.finalWave>=25)
      fails.push(`survives ${b.finalWave}→${curM.finalWave}`);
    rows.push({id,status:fails.length?'FAIL':'ok',fails});
  }
  for(const id of Object.keys(base.runs))if(!byId[id])rows.push({id,status:'REMOVED',fails:[]});
  return rows;
}

// ---------------------------------------------------------------- main
const list=scenarios();
console.log(`Balance field report — ${list.length} scenarios${quick?' (quick)':''}${withStress?' + stress':''}`);
const runs=[];
for(const sc of list){
  process.stdout.write(`  ${scenarioId(sc)} … `);
  const run=runScenario(sc);
  runs.push(run);
  console.log(`${run.metrics.outcome} w${run.metrics.finalWave} hp${run.metrics.hpFinal} (${run.ms}ms)`);
}
const report={
  meta:{created:new Date().toISOString(),node:process.version,quick,scenarios:runs.length,
    note:'IPL-0129 field matrix — compare with tests/balance-field-report.mjs --check'},
  runs:Object.fromEntries(runs.map(r=>[r.id,{scenario:r.scenario,
    outcome:r.metrics.outcome,deathWave:r.metrics.deathWave,finalWave:r.metrics.finalWave,
    hpFinal:r.metrics.hpFinal,maxHp:r.metrics.maxHp,towers:r.metrics.towers,levels:r.metrics.levels,
    advance:r.metrics.advance,advances:r.metrics.advances,cliff:r.metrics.cliff,cliffDamage:r.metrics.cliffDamage,
    graceWaveDamage:r.metrics.graceWaveDamage,rebuild:r.metrics.rebuild,
    damageBands:r.metrics.damageBands,waveSeconds:r.metrics.waveSeconds}])),
};
if(withStress){
  console.log('  stress package …');
  report.stress=stressSummary();
  if(report.stress.ok===false)process.exitCode=1;
}

writeFileSync(LATEST,JSON.stringify(report,null,2)+'\n');
console.log(`\nLatest report: ${path.relative(process.cwd(),LATEST)}`);

console.log('\n  scenario'.padEnd(44)+'outcome wave  hp  cliff early grace rebuild   time');
for(const r of runs)console.log('  '+fmtRow(r).join(' '));

const retreatRuns=runs.filter(r=>r.metrics.advance&&r.metrics.cliff);
if(retreatRuns.length){
  const mean=(k)=>Math.round(retreatRuns.reduce((n,r)=>n+(r.metrics.cliff[k]??0),0)/retreatRuns.length*10)/10;
  console.log(`\n  retreat runs: ${retreatRuns.length} | mean cliff damage (grace+2 waves): ${mean('damage')} hp | `+
    `mean rebuild towers at grace start/next wave: ${retreatRuns.map(r=>r.metrics.rebuild.towersAtGraceStart).join('/')}`);
}
const earlyRuns=runs.filter(r=>r.metrics.damageBands);
const butter=earlyRuns.filter(r=>r.metrics.damageBands.w6_10===0).length;
console.log(`  opening: ${butter}/${earlyRuns.length} runs take zero damage in waves 6-10 (the "butter" metric)`);

if(writeBaseline){
  writeFileSync(BASELINE,JSON.stringify(report,null,2)+'\n');
  console.log(`\nBaseline written: ${path.relative(process.cwd(),BASELINE)} — commit it with the change.`);
}else if(check){
  if(!existsSync(BASELINE)){
    console.error('\n--check: no baseline yet. Run --write-baseline first.');
    process.exit(2);
  }
  const base=JSON.parse(readFileSync(BASELINE,'utf8'));
  const rows=compare(runs,base);
  const fails=rows.filter(r=>r.status==='FAIL');
  const news=rows.filter(r=>r.status==='NEW');
  const removed=rows.filter(r=>r.status==='REMOVED');
  console.log(`\nBaseline check vs ${base.meta.created}: ${rows.length-fails.length}/${rows.length} ok`+
    (news.length?`, ${news.length} new`:'')+(removed.length?`, ${removed.length} removed`:''));
  for(const r of fails)console.log(`  FAIL ${r.id}: ${r.fails.join('; ')}`);
  for(const r of news)console.log(`  NEW  ${r.id} (not in baseline — refresh with --write-baseline if intended)`);
  for(const r of removed)console.log(`  GONE ${r.id} (in baseline but not in this run)`);
  if(fails.length){console.log('\nREGRESSION — fix the balance or consciously re-baseline (--write-baseline + commit).');process.exit(1);}
  console.log('OK — no regressions against the committed baseline.');
}

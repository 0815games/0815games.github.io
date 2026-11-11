import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {ENDLESS_THEMES,ENDLESS_THEME_KEY,ENDLESS_LAST_RUN_KEY,readEndlessTheme,readLastEndlessRun,writeLastEndlessRun,createEndlessLauncher} from '../endless-launcher.mjs';

function memory(saved={}){
  const store={...saved};
  return {getItem:k=>k in store?store[k]:null,setItem(k,v){store[k]=String(v);},get dump(){return store;}};
}

test('the theme list is random plus the five generated battlefields',()=>{
  assert.equal(ENDLESS_THEMES.length,6);
  assert.equal(ENDLESS_THEMES[0].key,null,'the first choice is true random');
  const keys=ENDLESS_THEMES.map(theme=>theme.key);
  assert.equal(new Set(keys).size,keys.length,'no duplicate themes');
  for(const theme of ENDLESS_THEMES){
    assert.ok(theme.label.length>3,theme.label);
    assert.ok(theme.hint.length>3,theme.hint);
  }
});

test('a saved theme survives only when it is one of the offered keys',()=>{
  const store=memory({[ENDLESS_THEME_KEY]:'forest'});
  assert.equal(readEndlessTheme(store),'forest');
  assert.equal(readEndlessTheme(memory({[ENDLESS_THEME_KEY]:'volcano'})),null,'an unknown theme falls back to random');
  assert.equal(readEndlessTheme(memory({[ENDLESS_THEME_KEY]:''})),null,'random is persisted as an empty string and reads back as null');
  assert.equal(readEndlessTheme(memory()),null);
  assert.equal(readEndlessTheme(),null,'no storage is random');
  assert.equal(readEndlessTheme({getItem(){throw new Error('blocked');}}),null,'a locked storage is random, not a crash');
});

test('the last-run card accepts only complete integer summaries',()=>{
  const good={waves:12,bosses:2,sector:3};
  assert.deepEqual(readLastEndlessRun(memory({[ENDLESS_LAST_RUN_KEY]:JSON.stringify(good)})),good);
  assert.equal(readLastEndlessRun(memory({[ENDLESS_LAST_RUN_KEY]:JSON.stringify({waves:12,bosses:2})})),null,'a sector is missing');
  assert.equal(readLastEndlessRun(memory({[ENDLESS_LAST_RUN_KEY]:JSON.stringify({waves:12.5,bosses:2,sector:3})})),null,'fractional waves are noise');
  assert.equal(readLastEndlessRun(memory({[ENDLESS_LAST_RUN_KEY]:JSON.stringify('12')})),null,'a bare number is not a summary');
  assert.equal(readLastEndlessRun(memory({[ENDLESS_LAST_RUN_KEY]:'not json'})),null);
  assert.equal(readLastEndlessRun(memory()),null);
  assert.equal(readLastEndlessRun(),null);
  assert.equal(readLastEndlessRun({getItem(){throw new Error('blocked');}}),null,'a locked storage reads as no run');
});

test('writing the last run is best effort',()=>{
  const store=memory();
  writeLastEndlessRun(store,{waves:9,bosses:1,sector:1});
  assert.equal(store.dump[ENDLESS_LAST_RUN_KEY],JSON.stringify({waves:9,bosses:1,sector:1}));
  assert.doesNotThrow(()=>writeLastEndlessRun({setItem(){throw new Error('quota');}},good0()));
  assert.doesNotThrow(()=>writeLastEndlessRun());
  function good0(){return {waves:0,bosses:0,sector:0};}
});

function fixture({record={},bestWave=0,lastRun=null,deployed=[],armory=[],skills=[],savedTheme=null}={}){
  const nodes=new Map();
  const make=kind=>({kind,hidden:false,textContent:'',value:'',children:[],type:'',className:'',
    append(...els){this.children.push(...els);},
    setAttribute(name,v){this[name]=String(v);},
    get innerHTML(){return '';},set innerHTML(_){this.children=[];},
    showModal(){this.open=true;},close(){this.open=false;}});
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,make('div'));return nodes.get(id);},
    createElement:()=>make('button'),
  };
  const dialog=make('dialog');nodes.set('endlessLaunch',dialog);
  const themes=make('div');nodes.set('endlessThemes',themes);
  const store=memory(savedTheme===null?{}:{[ENDLESS_THEME_KEY]:savedTheme});
  const launcher=createEndlessLauncher({document,storage:store,
    getRecord:()=>record,getBestWave:async()=>bestWave,getLastRun:()=>lastRun,
    onDeploy:theme=>deployed.push(theme),onOpenArmory:()=>armory.push(1),onOpenSkills:()=>skills.push(1)});
  return {launcher,nodes,themes,store,dialog,document};
}

test('open fills the record fields, zeroes as dashes',async()=>{
  const {launcher,nodes}=fixture({record:{runs:3,waves:41,bosses:8,bestSector:2,scrap:1200,loadout:'Rifle'}});
  launcher.open();
  assert.equal(nodes.get('endlessRuns').textContent,'3');
  assert.equal(nodes.get('endlessWaves').textContent,'41');
  assert.equal(nodes.get('endlessBosses').textContent,'8');
  assert.equal(nodes.get('endlessBestSector').textContent,'2');
  assert.equal(nodes.get('endlessScrap').textContent,'1200');
  assert.equal(nodes.get('endlessLoadout').textContent,'Rifle');
  const bare=fixture({record:{runs:0,waves:0,bosses:0,bestSector:0,scrap:0}});
  bare.launcher.open();
  for(const id of ['endlessRuns','endlessWaves','endlessBosses','endlessBestSector','endlessScrap'])
    assert.equal(bare.nodes.get(id).textContent,'—',id);
  assert.equal(bare.nodes.get('endlessLoadout').textContent,'command.none','no loadout falls back to the none label');
});

test('the best wave arrives asynchronously and survives a rejection',async()=>{
  const {launcher,nodes}=fixture({bestWave:47});
  launcher.open();
  assert.equal(nodes.get('endlessBestWave').textContent,'…','a placeholder while the leaderboard read is in flight');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(nodes.get('endlessBestWave').textContent,'47');
  const fail=fixture({bestWave:0});
  fail.launcher.open();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(fail.nodes.get('endlessBestWave').textContent,'—');
});

test('theme choice is a pressed button and persists to storage',()=>{
  const {launcher,themes,store}=fixture({savedTheme:'urban'});
  launcher.open();
  const buttons=()=>themes.children.slice(-6);
  assert.equal(buttons().length,6);
  const pressed=()=>buttons().filter(button=>button['aria-pressed']==='true');
  assert.equal(pressed().length,1,'exactly one battlefield is selected');
  assert.equal(pressed()[0].children[0].textContent,'Urban Ruin & Industrial Complex');
  // Choosing the marsh theme updates the pressed state and the storage.
  buttons()[5].onclick();
  assert.equal(store.dump[ENDLESS_THEME_KEY],'marsh');
  assert.equal(launcher.getSelectedTheme(),'marsh');
  assert.equal(pressed()[0].children[0].textContent,'Marshland & Delta Mudflats');
  // Random clears the choice back to null.
  buttons()[0].onclick();
  assert.equal(store.dump[ENDLESS_THEME_KEY],'');
  assert.equal(launcher.getSelectedTheme(),null);
});

test('the last-run line renders the summary or the empty state',()=>{
  const {launcher,nodes}=fixture({lastRun:{waves:12,bosses:2,sector:3}});
  launcher.open();
  assert.equal(nodes.get('endlessLastRun').textContent,'Last run: wave 12 · 2 bosses · sector 3');
  const empty=fixture({lastRun:null});
  empty.launcher.open();
  assert.equal(empty.nodes.get('endlessLastRun').textContent,'No endless run yet on this device.');
});

test('deploy closes the dialog with the chosen theme; the other buttons route out',()=>{
  const deployed=[],armory=[],skills=[];
  const {launcher,nodes,dialog}=fixture({deployed,armory,skills});
  launcher.open();
  nodes.get('endlessDeploy').onclick();
  assert.deepEqual(deployed,[null],'random is the default choice');
  assert.equal(dialog.open,false,'deploy closes the launcher');
  nodes.get('endlessCancel').onclick();
  nodes.get('endlessClose').onclick();
  assert.deepEqual(deployed,[null]);
  nodes.get('endlessArmory').onclick();
  assert.deepEqual(armory,[1]);
  nodes.get('endlessSkills').onclick();
  assert.deepEqual(skills,[1]);
  assert.deepEqual(deployed,[null],'nav buttons never start a run');
});

test('without a dialog element the launcher degrades to a no-op',()=>{
  const document={getElementById:()=>null,createElement:()=>null};
  let deployed=0;
  const launcher=createEndlessLauncher({document,getRecord:()=>({}),getBestWave:async()=>0,getLastRun:()=>null,onDeploy:()=>deployed++,onOpenArmory:()=>{},onOpenSkills:()=>{}});
  assert.doesNotThrow(()=>launcher.open());
  assert.equal(launcher.getSelectedTheme(),null);
  assert.equal(deployed,0);
});

// The launcher only hands a theme string to the game; the game has to turn it
// into a battlefield. This drives the real startGame (same rewrite harness the
// other game tests use) with a deterministic map queue, so the theme pipeline
// is pinned without waiting on the random generator.
test('chooseEndless redraws free maps until the chosen battlefield comes up',async()=>{
  const {getMap}=await import('../maps.mjs');
  // Real generated ids, one per theme (verified via getMap above).
  const urban='g3-002875330',scrub='g3-01c02eda4',forest='g3-00cf01250',arctic='g3-00ac4443d',marsh='g3-009b716fe';
  for(const id of [urban,scrub,forest,arctic,marsh])assert.ok(getMap(id),`known id ${id}`);
  let queue=[];
  const nextMapId=()=>queue.shift()||urban;
  const elements=new Map();
  const ctx=new Proxy({},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
  function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'}};
  globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
  globalThis.requestAnimationFrame=()=>{};
  const {readFile}=await import('node:fs/promises');
  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const gameControl=startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=>'theme-user',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){},canChooseSolo:()=>true},{nextMapId,confirmAction:async()=>true});
  element('tutorialSkip').onclick();
  // Forest is the third draw in the queue: two misses, then the chosen theme.
  queue=[urban,scrub,forest];
  assert.equal(await gameControl.chooseEndless('forest'),true,'the deploy reports a loaded run');
  assert.equal(gameControl.getMapId(),forest,'free maps redraw until the chosen battlefield comes up');
  assert.equal(getMap(gameControl.getMapId()).theme,'forest');
  // A later deploy keeps honouring the choice without repeating misses.
  queue=[marsh];
  assert.equal(await gameControl.chooseEndless('marsh'),true);
  assert.equal(gameControl.getMapId(),marsh);
  // True random takes the first draw as-is.
  queue=[scrub];
  assert.equal(await gameControl.chooseEndless(null),true);
  assert.equal(gameControl.getMapId(),scrub);
  // If the queue never offers the theme, the redraw gives up after 14 tries
  // and ships the next map instead of hanging the deploy.
  queue=Array(20).fill(urban);
  assert.equal(await gameControl.chooseEndless('arctic'),true);
  assert.equal(gameControl.getMapId(),urban,'a theme that never comes up falls back to the next map');
});

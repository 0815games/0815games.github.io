// The endless launch dialog: everything a soldier wants to see before free
// play - the personal record, the battlefield choice, the last run and the
// current loadout. Navigation only; the run itself starts through the same
// chooseEndless path the one-click flow used.
import {translateText} from './language.mjs?v=20261031-loading1';

// The free-play generator themes (maps.mjs draws one of five at random); the
// launcher offers them as a choice plus true random. Labels reuse the
// generated map names so translations stay in one place.
export const ENDLESS_THEMES=Object.freeze([
  {key:null,label:'Random battlefield',hint:'Let the valley decide.'},
  {key:'scrub',label:'Scorched Scrubland',hint:'Open heath, long sightlines.'},
  {key:'forest',label:'Dense Temperate Forest',hint:'Tight lanes between the trees.'},
  {key:'urban',label:'Urban Ruin & Industrial Complex',hint:'Streets, rubble and cover.'},
  {key:'arctic',label:'Arctic Tundra & Frozen Lake',hint:'Frozen ground, thin ice.'},
  {key:'marsh',label:'Marshland & Delta Mudflats',hint:'Slow ground and waterways.'},
]);
export const ENDLESS_THEME_KEY='ironpath:endlessTheme';
export const ENDLESS_LAST_RUN_KEY='ironpath:endlessLastRun';

export function readEndlessTheme(storage){try{const saved=storage?.getItem(ENDLESS_THEME_KEY);return ENDLESS_THEMES.some(t=>t.key===saved)?saved:null;}catch{return null;}}
export function readLastEndlessRun(storage){try{const raw=storage?.getItem(ENDLESS_LAST_RUN_KEY);const value=raw?JSON.parse(raw):null;return value&&Number.isInteger(value.waves)&&Number.isInteger(value.bosses)&&Number.isInteger(value.sector)?value:null;}catch{return null;}}
export function writeLastEndlessRun(storage,summary){try{storage?.setItem(ENDLESS_LAST_RUN_KEY,JSON.stringify(summary));}catch{/* The last-run card is a convenience; losing it is fine. */}}

const fmt=n=>Number.isFinite(n)&&n>0?String(n):'—';

export function createEndlessLauncher({document,getRecord=()=>({}),getBestWave=async()=>0,getLastRun=()=>null,onDeploy=()=>{},onOpenArmory=()=>{},onOpenSkills=()=>{},storage}){
  const $=id=>document.getElementById(id);
  const dialog=$('endlessLaunch');
  if(!dialog||typeof dialog.showModal!=='function')return {open:()=>{},getSelectedTheme:()=>null};
  let selected=readEndlessTheme(storage);
  function buildThemes(){
    const box=$('endlessThemes');if(!box)return;
    box.innerHTML='';
    for(const theme of ENDLESS_THEMES){
      const button=document.createElement('button');
      button.type='button';button.className='endless-theme';
      button.setAttribute('aria-pressed',String((theme.key??null)===selected));
      const name=document.createElement('strong');name.textContent=translateText(theme.label);
      const hint=document.createElement('small');hint.textContent=translateText(theme.hint);
      button.append(name,hint);
      button.onclick=()=>{selected=theme.key??null;try{storage?.setItem(ENDLESS_THEME_KEY,theme.key??'');}catch{}buildThemes();};
      box.append(button);
    }
  }
  function open(){
    buildThemes();
    const record=getRecord()||{};
    $('endlessBestWave').textContent='…';
    void Promise.resolve(getBestWave()).then(wave=>{$('endlessBestWave').textContent=fmt(wave);}).catch(()=>{$('endlessBestWave').textContent='—';});
    $('endlessRuns').textContent=fmt(record.runs);
    $('endlessWaves').textContent=fmt(record.waves);
    $('endlessBosses').textContent=fmt(record.bosses);
    $('endlessBestSector').textContent=fmt(record.bestSector);
    $('endlessScrap').textContent=fmt(record.scrap);
    const last=getLastRun();
    $('endlessLastRun').textContent=last?translateText('Last run: wave {wave} · {bosses} bosses · sector {sector}',{wave:last.waves,bosses:last.bosses,sector:last.sector}):translateText('No endless run yet on this device.');
    $('endlessLoadout').textContent=record.loadout||translateText('command.none');
    try{dialog.showModal();}catch{/* Already open or not supported. */}
  }
  const close=()=>{try{dialog.close();}catch{}};
  $('endlessClose').onclick=close;$('endlessCancel').onclick=close;
  $('endlessArmory').onclick=()=>{close();onOpenArmory();};
  $('endlessSkills').onclick=()=>{close();onOpenSkills();};
  $('endlessDeploy').onclick=()=>{close();onDeploy(selected);};
  return {open,getSelectedTheme:()=>selected};
}

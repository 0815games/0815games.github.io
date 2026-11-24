// The endless launch dialog: everything a soldier wants to see before free
// play - the personal record, the battlefield choice and the last run.
// Navigation only; the run itself starts through the same
// chooseEndless path the one-click flow used.
import {translateText} from '../language.mjs?v=20261123-aim6';

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
export function sanitizeEndlessLastRun(value){return value&&Number.isInteger(value.waves)&&Number.isInteger(value.bosses)&&Number.isInteger(value.sector)?{waves:value.waves,bosses:value.bosses,sector:value.sector}:null;}
export function readLastEndlessRun(storage){try{const raw=storage?.getItem(ENDLESS_LAST_RUN_KEY);return sanitizeEndlessLastRun(raw?JSON.parse(raw):null);}catch{return null;}}
export function writeLastEndlessRun(storage,summary){try{storage?.setItem(ENDLESS_LAST_RUN_KEY,JSON.stringify(summary));}catch{/* The last-run card is a convenience; losing it is fine. */}}

const fmt=n=>Number.isFinite(n)&&n>0?String(n):'—';

export function createEndlessLauncher({document,getRecord=()=>({}),getBestWave=async()=>0,getLastRun=()=>null,onDeploy=()=>{},storage}){
  const $=id=>document.getElementById(id);
  const dialog=$('endlessLaunch');
  if(!dialog||typeof dialog.showModal!=='function')return {open:()=>{},refreshLanguage:()=>{},getSelectedTheme:()=>null};
  let index=0;
  let lastBestWave='—';
  let lastRecord={};
  const currentTheme=()=>ENDLESS_THEMES[index]||ENDLESS_THEMES[0];
  function paintCarousel(){
    const active=currentTheme();
    const card=$('endlessThemeCard');
    if(card){
      if(card.dataset)card.dataset.theme=active.key??'random';
      card.setAttribute?.('data-theme',active.key??'random');
      card.setAttribute?.('aria-label',translateText(active.label));
    }
    const labelEl=$('endlessSelectedTheme');
    if(labelEl)labelEl.textContent=translateText(active.label);
  }
  function paintDetails(){
    const last=getLastRun();
    const lastEl=$('endlessLastRun');
    if(lastEl){
      lastEl.textContent=last?translateText('Last run: wave {wave} · {bosses} bosses · sector {sector}',{wave:last.waves,bosses:last.bosses,sector:last.sector}):translateText('No endless run yet.');
    }
  }
  function step(delta){
    index=(index+delta+ENDLESS_THEMES.length)%ENDLESS_THEMES.length;
    paintCarousel();
  }
  function open(){
    index=0;
    paintCarousel();
    lastRecord=getRecord()||{};
    lastBestWave='…';
    if($('endlessBestWave'))$('endlessBestWave').textContent=lastBestWave;
    void Promise.resolve(getBestWave()).then(wave=>{
      lastBestWave=fmt(wave);
      if($('endlessBestWave'))$('endlessBestWave').textContent=lastBestWave;
    }).catch(()=>{
      lastBestWave='—';
      if($('endlessBestWave'))$('endlessBestWave').textContent=lastBestWave;
    });
    if($('endlessRuns'))$('endlessRuns').textContent=fmt(lastRecord.runs);
    if($('endlessWaves'))$('endlessWaves').textContent=fmt(lastRecord.waves);
    if($('endlessBosses'))$('endlessBosses').textContent=fmt(lastRecord.bosses);
    if($('endlessBestSector'))$('endlessBestSector').textContent=fmt(lastRecord.bestSector);
    if($('endlessScrap'))$('endlessScrap').textContent=fmt(lastRecord.scrap);
    paintDetails();
    try{dialog.showModal();}catch{/* Already open or not supported. */}
  }
  function refreshLanguage(){
    if(!dialog.open)return;
    lastRecord=getRecord()||{};
    paintCarousel();
    paintDetails();
  }
  const close=()=>{try{dialog.close();}catch{}};
  const deploy=()=>{close();onDeploy(currentTheme().key??null);};
  if($('endlessPrev'))$('endlessPrev').onclick=()=>step(-1);
  if($('endlessNext'))$('endlessNext').onclick=()=>step(1);
  // The whole artwork is the deploy surface: a click anywhere on the
  // picture starts the run, exactly like the DEPLOY button on its bottom
  // edge. The arrows live outside the card, so they never deploy.
  $('endlessThemeCard')?.addEventListener?.('click',deploy);
  $('endlessThemeCard')?.addEventListener?.('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault?.();step(-1);}
    else if(event.key==='ArrowRight'){event.preventDefault?.();step(1);}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault?.();deploy();}
  });
  if($('endlessClose'))$('endlessClose').onclick=close;
  if($('endlessDeploy'))$('endlessDeploy').onclick=deploy;
  return {open,refreshLanguage,getSelectedTheme:()=>currentTheme().key??null};
}

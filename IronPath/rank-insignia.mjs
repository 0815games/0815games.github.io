// The soldier's rank, derived from the level - never stored, never awarded.
//
// A rank is what a uniform shows instead of a name plate: chevrons for the
// enlisted ranks, stars for the officers, a single bar for the recruit who has
// earned nothing yet. It is painted procedurally (no asset, no font) in the
// same stencil gold as the rest of the field kit, so it stays crisp from the
// 16 px profile strip to the dossier rail.
//
// The thresholds follow the first-run pacing: the tutorial ends at level 2
// (still a Recruit - the uniform is bare until the first real mission), the
// endless loop promotes roughly every few sessions, and Hauptmann at 15 is the
// long-term goal rather than a ceiling. Everything at or beyond the last rank
// stays there: no prestige cycles, no demotion, no storage.
import {translateText as tr} from './language.mjs?v=20261031-loading1';

// Ordered lowest first; `min` is the level the rank is reached AT.
export const RANKS=Object.freeze([
  Object.freeze({id:'recruit',name:'Recruit',min:1,chevrons:0,stars:0,bar:true}),
  Object.freeze({id:'private',name:'Private',min:3,chevrons:1,stars:0,bar:false}),
  Object.freeze({id:'sergeant',name:'Sergeant',min:6,chevrons:2,stars:0,bar:false}),
  Object.freeze({id:'lieutenant',name:'Lieutenant',min:10,chevrons:0,stars:1,bar:false}),
  Object.freeze({id:'captain',name:'Captain',min:15,chevrons:0,stars:2,bar:false}),
]);

// Fail-safe by design: an unknown level shows the lowest rank, never throws -
// the same rule the rest of the derived kit follows.
export function rankForLevel(level){
  const lvl=Number.isFinite(level)&&level>=1?Math.floor(level):1;
  let rank=RANKS[0];
  for(const candidate of RANKS)if(lvl>=candidate.min)rank=candidate;
  return rank;
}

// How far into the rank the soldier is, and what comes next. For tooltips and
// the dossier line; pure maths, no DOM.
export function rankProgress(level){
  const lvl=Number.isFinite(level)&&level>=1?Math.floor(level):1;
  const rank=rankForLevel(lvl);
  const index=RANKS.indexOf(rank);
  const next=RANKS[index+1]||null;
  return {rank,next,into:lvl-rank.min+1,span:next?next.min-rank.min:null};
}

// One stencil gold mark per rank, drawn in a 64x48 box so every rank keeps the
// same optical width: a bar for the recruit, stacked chevrons for the enlisted
// ranks, stars for the officers. `size` is the CSS width in px.
const GOLD='#e4ca89',EDGE='#1f3024';
const CHEVRON_D='M6 26 L32 12 L58 26 L58 35 L32 21 L6 35 Z';
const STAR_D='M32 24.5 L33.5 29.1 L38.3 29.2 L34.5 32.1 L35.9 36.7 L32 33.9 L28.1 36.7 L29.5 32.1 L25.7 29.2 L30.5 29.1 Z';

export function rankInsigniaSvg(rank,{size=24}={}){
  const marks=[];
  if(rank?.bar)marks.push(`<rect class="bar" x="16" y="20.5" width="32" height="7" rx="1.5" fill="${GOLD}"/>`);
  for(let i=0;i<(rank?.chevrons||0);i++){
    const y=i*14-(rank.chevrons-1)*7;
    marks.push(`<path class="chevron" d="${CHEVRON_D}" transform="translate(0 ${y.toFixed(1)})" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.8" stroke-linejoin="miter"/>`);
  }
  const stars=rank?.stars||0;
  if(stars===1){
    marks.push(`<path class="star" d="${STAR_D}" transform="translate(0 2) scale(1.35) translate(-32 -30.5)" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7" stroke-linejoin="round"/>`);
  }else if(stars>=2){
    for(const dx of [-12.5,12.5]){
      marks.push(`<path class="star" d="${STAR_D}" transform="translate(${dx} 1.5) scale(1.15) translate(-32 -30.5)" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7" stroke-linejoin="round"/>`);
    }
  }
  const w=Math.max(8,Math.round(size)),h=Math.round(w*48/64);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" width="${w}" height="${h}" aria-hidden="true" focusable="false">${marks.join('')}</svg>`;
}

// The rank name and the next threshold, as one line of plain text.
export function rankTooltip(level){
  const {rank,next}=rankProgress(level);
  const head=`${tr(rank.name)} · ${tr('LEVEL {level}',{level:Number.isFinite(level)&&level>=1?Math.floor(level):1})}`;
  return next?`${head} · ${tr('Next rank: {rank} at level {level}',{rank:tr(next.name),level:next.min})}`:head;
}

// Paints the insignia into a container and labels it for the pointer. The rank
// NAME is always written out somewhere next to it (dossier, menu level line),
// so the mark itself is decorative: aria-hidden, title for the tooltip.
export function renderRankInsignia(document,container,{level}={},opts={}){
  if(!container||!document)return null;
  const rank=rankForLevel(level);
  const size=Number.isFinite(opts.size)&&opts.size>=8?opts.size:24;
  container.innerHTML=rankInsigniaSvg(rank,{size});
  try{container.title=rankTooltip(level);}catch{/* no dictionary in unit tests */}
  return rank;
}

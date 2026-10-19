import {drawCharacter} from '../world/character.js';
export function renderPreparationHero(host,player,meta,stats,options={}){
 const doc=host.ownerDocument||document;
 const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const number=value=>Number.isFinite(value)?String(value):'—';
 const root=make('div','shop-hero');
 const canvas=make('canvas','shop-hero__preview');canvas.width=128;canvas.height=128;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${player.name||'Recke'} mit aktuell angelegter Ausrüstung`);
 const identity=make('div','shop-hero__identity');
 identity.append(make('h3','shop-hero__name',player.name||'Recke'),make('p','shop-hero__class',`${options.classLabel||player.heroClass||'Recke'} · Level ${number(player.level)}`),make('p','shop-hero__tier',`Angebot Stufe ${number(options.tier)}`));
 const values=make('dl','shop-hero__values');
 for(const [label,value,note] of [
  ['Ordensgold',number(meta?.gold??0),''],
  ['Letzter Run',(Number.isFinite(player.lastRunGold)&&player.lastRunGold<0?'':'+')+number(player.lastRunGold??0),''],
  ['Angriff',number(stats?.atk),`Basis ${number(player.atk)}`],
  ['Verteidigung',number(stats?.def),`Basis ${number(player.def)}`]
 ]){
  const card=make('div','shop-hero__stat'),term=make('dt','',label),valueNode=make('dd','',value);card.append(term,valueNode);if(note)card.append(make('span','shop-hero__base',note));values.append(card);
 }
 root.append(canvas,identity,values);
 const fallback=make('p','shop-hero__fallback','Vorschau derzeit nicht verfügbar.');fallback.hidden=true;root.append(fallback);
 host.replaceChildren(root);
 try{const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.clearRect(0,0,128,128);(options.draw||drawCharacter)(ctx,player,16,12,96);}catch(error){canvas.hidden=true;fallback.hidden=false;}
 return root;
}

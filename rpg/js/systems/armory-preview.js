import {drawCharacter} from '../world/character.js';
const views=new WeakMap();
export function renderArmory(panel,player,stats,depth,options={}){
 if(!panel)return false;
 const grid=panel.querySelector('.equip-grid'),box=panel.querySelector('#stats');if(!grid||!box)return false;
 const doc=panel.ownerDocument||document;
 const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const number=value=>Number.isFinite(value)?String(value):'—';
 let view=views.get(grid);
 if(!view){
  const figure=make('figure','armory-hero'),canvas=make('canvas','armory-hero__canvas'),caption=make('figcaption','armory-hero__caption'),name=make('strong','armory-hero__name'),identity=make('span','armory-hero__identity'),fallback=make('span','armory-hero__fallback','Vorschau nicht verfügbar.');
  canvas.width=128;canvas.height=128;canvas.setAttribute('role','img');fallback.hidden=true;caption.append(name,identity,fallback);figure.append(canvas,caption);grid.prepend(figure);view={figure,canvas,name,identity,fallback};views.set(grid,view);
 }
 view.name.textContent=player.name||'Recke';
 view.identity.textContent=`${options.classLabel||player.heroClass||'Recke'} · Level ${number(player.level)}`;
 view.canvas.setAttribute('aria-label',`${player.name||'Recke'} mit aktuell angelegter Ausrüstung`);
 view.canvas.hidden=false;view.fallback.hidden=true;
 try{const ctx=view.canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.clearRect(0,0,128,128);(options.draw||drawCharacter)(ctx,player,16,12,96);}catch(error){view.canvas.hidden=true;view.fallback.hidden=false;}
 const values=make('dl','armory-values');
 for(const [label,value,note] of [
  ['Run-Gold',number(player.gold),''],
  ['Angriff',number(stats?.totalAtk),`Basis ${number(player.atk)}`],
  ['Verteidigung',number(stats?.totalDef),`Basis ${number(player.def)}`],
  ['Max. TP',number(player.maxHp),''],
  ['Max. MP',number(player.maxMp),''],
  ['EP',`${number(player.xp)} / ${number(player.nextXp)}`,''],
  ['Skillpunkte',number(player.skillPoints??0),''],
  ['Ebene',number(depth),'']
 ]){const card=make('div','armory-value');card.append(make('dt','',label),make('dd','',value));if(note)card.append(make('span','armory-value__base',note));values.append(card);}
 box.replaceChildren(values);return true;
}

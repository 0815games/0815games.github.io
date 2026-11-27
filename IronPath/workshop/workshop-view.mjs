// Armoury workshop panel: craft, equip and modify field gear.
//
// Rendered inside the armory dialog so players find everything in one place.
// Every change goes through the account service, which runs the account
// transaction; nothing here writes a save directly.
import {RECIPES,MOD_SCRAP,modsOf,migrateWorkshop,validLegacy} from './workshop-model.mjs?v=20261121-skills4';
import {PRESTIGE,PRESTIGE_IDS,isPrestige,prestigeEarned} from '../core/prestige.mjs?v=20261112-pressure1';
import {CAMPAIGN,campaignProgress} from '../core/campaign.mjs?v=20261112-pressure1';
import {decodeWorkshop} from './workshop-wire.mjs?v=20261121-skills4';
import {readArmory,ITEMS} from '../core/armory.mjs?v=20261121-skills4';
import {WORKSHOP_CATALOG} from './workshop-catalog.mjs?v=20261108-balance2';
import {artOf} from '../ui/item-art.mjs?v=20261121-skills4';
// Which legacy item (by index) belongs to which new slot.
const legacySlots=['gadget','gear','gear','gadget','gadget','gear','gadget','gadget','gadget','gadget'];

export function createWorkshopView({document,root,getProfile,service,confirm,translate=key=>key,onProfile=()=>{}}){
 if(!document||!root||typeof getProfile!=='function'||!service||typeof confirm!=='function')throw new Error('Invalid workshop view');
 let working=false,status='';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const artThumb=id=>{const art=artOf(id);if(!art)return null;const img=el('img','workshop-art');img.src=art;img.alt='';return img;};
 const tr=(text,values)=>translate(text,values);
 const itemName=id=>{
  if(id==='standard')return tr('Standard weapon');
  if(id==='none')return tr('Empty slot');
  if(id.startsWith('legacy-'))return tr(ITEMS[Number(id.slice(7))-1]?.name||'Unknown item');
  if(isPrestige(id))return tr(PRESTIGE[id].name);
  return tr(WORKSHOP_CATALOG[id]?.name||'Unknown item');
 };
 const button=(label,disabled,action,cls='')=>{const b=el('button','workshop-button',tr(label));if(cls)b.className+=` ${cls}`;b.type='button';b.disabled=disabled||working||(!!service.hasPending?.()&&!retryAllowed(label));b.onclick=action;return b;};
 const statusLine=()=>{const line=el('p','workshop-status',status);line.setAttribute('role','status');return line;};
 // A pending retry is the only allowed action; every other button is blocked.
 const retryAllowed=label=>label==='RETRY SAVE'||label==='PREPARE WORKSHOP';
 async function run(command,confirmation){
  if(working)return;working=true;render();let result;
  try{
   if(confirmation&&!await confirm(confirmation))return;
   status=tr('Saving…');render();
   result=command==='retry'?await service.retryPending():command?await service.command(command):(typeof service.sync==='function'?await service.sync():await service.initialize());
   if(result.status==='saved'){onProfile(result.profile);status=tr('Saved for your next match.');}
   else if(result.status==='locked')status=tr('Finish the match and leave the party before changing gear.');
   else status=tr('Workshop could not be saved. Check your connection and try again.');
  }catch{status=tr('Workshop could not be saved. Check your connection and try again.');}
  finally{working=false;render();}
 }
 function render(){
  if(!root)return;
  const into=root;
  into.replaceChildren();
  const p=getProfile();
  if(!p){into.append(el('p','workshop-empty',tr('Sign in to use the workshop.')));return;}
  const has=Object.hasOwn(p,'workshop');
  if(!validLegacy(p.armory)){into.append(el('p','workshop-error',tr('Your saved equipment cannot be read, so the workshop is unavailable. Your progress has not been changed.')));return;}
  if(!has){
   // The account prepares the workshop on opening this tab; this is the manual
   // fallback if that write failed.
   const intro=el('section','workshop-intro');
   intro.append(el('p','',tr('The workshop keeps your existing equipment. Nothing is lost when you prepare it.')),button('PREPARE WORKSHOP',false,()=>run(null,{title:tr('Prepare workshop?'),text:tr('Your existing equipment and bunker upgrades will be kept.'),accept:tr('PREPARE WORKSHOP')})));
   into.append(intro);into.append(statusLine());return;
  }
  const workshop=decodeWorkshop(p.workshop);
  if(!workshop){into.append(el('p','workshop-error',tr('Workshop data is invalid or needs a newer version. Nothing has been changed; your existing equipment still works.')));return;}
  const armory=readArmory(p.armory);
  const wallet=el('div','workshop-wallet');
  wallet.append(el('strong','',tr('{count} scrap',{count:armory.scrap})),el('strong','',tr('{count} boss components',{count:workshop.components})),el('small','',tr('Earned from completed waves; boss waves pay components.')));
  into.append(wallet);
  if(service.hasPending?.()){const pending=el('section','workshop-intro');pending.append(el('p','',tr('A save needs confirmation. Retry it before making another change.')),button('RETRY SAVE',false,()=>run('retry')));into.append(pending);}

  // The taken list (IPL-0137): every worn piece shows at once and leaves with
  // its own TAKE OFF button — no slot ever replaces another.
  const slots=el('section','workshop-slots');slots.append(el('h3','',tr('Taken right now')));
  const list=el('div','workshop-slot-grid');
  if(!workshop.equipped.length)list.append(el('p','',tr('Nothing taken yet. Every piece you own can be worn at once.')));
  for(const id of workshop.equipped){
   const card=el('div','workshop-slot'),body=el('div','workshop-card-body'),thumb=artThumb(id);
   if(thumb)card.append(thumb);
   body.append(el('strong','',itemName(id)));
   if(id.startsWith('legacy-'))body.append(el('small','',tr('From your existing equipment. It counts the moment it is taken.')));
   body.append(button('TAKE OFF',false,()=>run({type:'equip',item:id})));
   card.append(body);list.append(card);
  }
  slots.append(list);into.append(slots);

  const section=el('section','workshop-items');section.append(el('h3','',tr('Craft and equip')));
  const grid=el('div','workshop-item-grid');
  for(const [id,recipe] of Object.entries(RECIPES)){
   const data=WORKSHOP_CATALOG[id],owned=workshop.owned.includes(id),taken=workshop.equipped.includes(id),card=el('article','workshop-item'),body=el('div','workshop-card-body'),thumb=artThumb(id);
   if(thumb)card.append(thumb);
   body.append(el('span','workshop-tag',tr(recipe.slot.toUpperCase())),el('h4','',tr(data.name)),el('p','',tr(data.effect)));
   if(!owned){
    const affordable=armory.scrap>=recipe.scrap&&workshop.components>=recipe.components;
    body.append(el('small','',tr('{scrap} scrap · {components} boss components',{scrap:recipe.scrap,components:recipe.components})),button('CRAFT',!affordable,()=>run({type:'craft',item:id},{title:tr('Craft {name}?',{name:tr(data.name)}),text:tr('Spend {scrap} scrap and {components} boss components?',{scrap:recipe.scrap,components:recipe.components}),accept:tr('CRAFT')})));
    if(!affordable)body.append(el('small','workshop-hint',tr('Not enough materials yet.')));
   }else{
    body.append(button(taken?'TAKEN':'TAKE',false,()=>run({type:'equip',item:id})));
    for(const [mod,info] of Object.entries(data.mods)){
     const chosen=workshop.mods[id]===mod,modRow=el('div','workshop-mod');
     modRow.append(el('strong','',tr(info.name)),el('p','',tr(info.effect)),button(chosen?'INSTALLED':tr('MODIFY · {scrap} SCRAP',{scrap:MOD_SCRAP}),chosen||armory.scrap<MOD_SCRAP,()=>run({type:'modify',item:id,mod},{title:tr('Install {name}?',{name:tr(info.name)}),text:tr('Spend {scrap} scrap? This replaces the current modification.',{scrap:MOD_SCRAP}),accept:tr('MODIFY')})));
     body.append(modRow);
    }
   }
   card.append(body);grid.append(card);
  }
  section.append(grid);into.append(section);

  // Campaign trophies: what the missions prove, never what scrap buys.
  const progress=campaignProgress(p);
  const trophies=el('section','workshop-prestige');
  trophies.append(el('h3','',tr('Prestige gear')),el('p','workshop-note',tr('Earned by finishing campaign missions. Not sold, not crafted.')));
  const trophyGrid=el('div','workshop-item-grid');
  for(const id of PRESTIGE_IDS){
   const item=PRESTIGE[id],mission=CAMPAIGN.find(m=>m.id===item.mission),earned=prestigeEarned(id,p),owned=workshop.owned.includes(id),taken=workshop.equipped.includes(id);
   const card=el('article',`workshop-item${earned?'':' is-locked'}`),body=el('div','workshop-card-body'),thumb=artThumb(id);
   if(thumb)card.append(thumb);
   body.append(el('span','workshop-tag',`${tr('TIER')} ${item.tier} · ${tr(item.slot.toUpperCase())}`),el('h4','',tr(item.name)),el('p','',tr(item.effect)));
   if(!earned){
    body.append(el('small','workshop-hint',tr('Locked · finish “{mission}”',{mission:tr(mission?.title||'')})));
   }else if(!owned){
    body.append(el('small','workshop-hint',tr('Earned. Reopen the workshop to collect it.')),button('COLLECT',false,()=>run(null)));
   }else{
    body.append(button(taken?'TAKEN':'TAKE',false,()=>run({type:'equip',item:id})));
    for(const [mod,info] of Object.entries(item.mods)){
     const chosen=workshop.mods[id]===mod,row=el('div','workshop-mod');
     row.append(el('strong','',tr(info.name)),el('p','',tr(info.effect)),button(chosen?'INSTALLED':tr('MODIFY · {scrap} SCRAP',{scrap:MOD_SCRAP}),chosen||armory.scrap<MOD_SCRAP,()=>run({type:'modify',item:id,mod},{title:tr('Install {name}?',{name:tr(info.name)}),text:tr('Spend {scrap} scrap? This replaces the current modification.',{scrap:MOD_SCRAP}),accept:tr('MODIFY')})));
     body.append(row);
    }
   }
   card.append(body);trophyGrid.append(card);
  }
  trophies.append(trophyGrid);
  into.append(trophies);

  const legacy=el('section','workshop-legacy');
  legacy.append(el('h3','',tr('Existing equipment')));
  const legacyOwned=workshop.owned.filter(value=>value.startsWith('legacy-'));
  if(!legacyOwned.length)legacy.append(el('p','',tr('No existing equipment yet. Every completed wave can find one of the ten pieces - FOUND in the report.')));
  for(const id of legacyOwned){
   const index=Number(id.slice(7))-1,item=ITEMS[index],taken=workshop.equipped.includes(id);
   const row=el('article','workshop-legacy-item'),body=el('div','workshop-card-body'),thumb=artThumb(id);
   if(thumb)row.append(thumb);
   body.append(el('strong','',itemName(id)),el('p','',tr(item.description)));
   body.append(button(taken?'TAKEN':'TAKE',false,()=>run({type:'equip',item:id})));
   row.append(body);legacy.append(row);
  }
  into.append(legacy);
  into.append(el('p','workshop-note',tr('Everything you own counts at once — vest, boots, radio and weapon together. Bunker upgrades stay in the Bunker tab.')));
  into.append(statusLine());
 }
 // The armory dialog owns the container; the view can be pointed at a new one
 // after the dialog is recreated without rebuilding state.
 function mount(nextRoot){root=nextRoot;}
 return {render,mount};
}

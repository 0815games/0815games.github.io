// The first-run ending: what happens after the boss of the last wave falls.
//
// Four steps, in this order, and each one is a real screen rather than a mock-up:
//   1. TAG     the dog tag is issued (drawn from the soldier, never stored);
//   2. EQUIP   the equipment the run earned is put on, in the real Armory;
//   3. SKILLS  the first skill point is spent in the real Skills dialog and SAVED,
//              so the build the player picks is active from their first mission;
//   4. WORKSHOP the workshop is opened for the first time, on the real Armory tab.
// Then the Field School lists where to go next.
//
// Equipment comes before skills on purpose. The last boss is the first thing
// the player ever wins, and putting it on is a reward they can see; a skill tree
// means nothing before there is gear to fight with.
//
// The sequence is storage-gated per account, so it runs once. Every step is
// injected: this module owns the ordering and the gate, the account owns the
// dialogs. If a step is declined the sequence stops without marking itself done,
// so it can be offered again instead of silently disappearing.
//
// `ENDING_EDITION` follows the same rule as the briefing edition in tutorial.mjs:
// the ending gained the tag and swapped the first two steps, so accounts that
// finished the old order are offered the new one. Reusing the old key would mean
// nobody who played the previous first run ever sees the dog tag.
export const ENDING_EDITION=2;
export const ENDING_KEY=`ironpath:firstrun:v${ENDING_EDITION}`;
export const ENDING_STEPS=Object.freeze(['tag','equip','skills','workshop']);

const keyFor=id=>`${ENDING_KEY}:${id}`;
const memory=new Set();

export function endingKey(id){return keyFor(id);}

// Once per account per browser, like the tutorial itself.
export function endingDone(id,storage){
 if(!id)return false;
 if(memory.has(id))return true;
 try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}
}

export function markEndingDone(id,storage){
 if(!id)return;
 memory.add(id);
 try{storage?.setItem(keyFor(id),'done');}catch{/* Continue in this session if storage is unavailable. */}
}

// Ordering and cancellation live here so the UI cannot drift from it. `steps` is
// a map of step name -> async function returning true when the player finished
// it. A missing step is treated as unavailable, which stops the sequence cleanly.
export async function runFirstRunEnding({id,storage,steps,onStep=()=>{},onDone=()=>{},onStopped=()=>{}}={}){
 if(!id||endingDone(id,storage))return {status:'done',completed:0};
 let completed=0;
 for(const name of ENDING_STEPS){
  const step=steps?.[name];
  if(typeof step!=='function'){onStopped({step:name,reason:'unavailable',completed});return {status:'stopped',step:name,reason:'unavailable',completed};}
  onStep(name);
  let ok=false;
  try{ok=await step()===true;}catch{ok=false;}
  if(!ok){onStopped({step:name,reason:'declined',completed});return {status:'stopped',step:name,reason:'declined',completed};}
  completed++;
 }
 markEndingDone(id,storage);
 onDone({completed});
 return {status:'done',completed};
}

// What the Field School offers after the ending. `action` is the id of an
// existing control, so this menu never invents a second way into a screen.
export const FIELD_SCHOOL_ENTRIES=Object.freeze([
 Object.freeze({id:'armory',action:'armoryOpen',title:'Armory & Workshop',text:'Craft gear from scrap, equip it, and upgrade your bunker.'}),
 Object.freeze({id:'skills',action:'skillOpen',title:'Skills',text:'Spend skill points and save a build for your next mission.'}),
 Object.freeze({id:'campaign',action:'campaignShowBoard',title:'Campaign',text:'Each mission lists its threat: tougher units, more waves, a smaller bunker.'}),
 Object.freeze({id:'multiplayer',action:'partyToggle',title:'Multiplayer',text:'Two to four players, one party code, shared waves.'}),
]);

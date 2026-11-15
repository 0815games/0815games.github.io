// The first-run ending: what happens after the boss of the last wave falls.
//
// Three steps, in this order, and each one is a real screen rather than a mock-up:
//   1. EQUIP    the equipment the run earned is put on, in the real Armory;
//   2. SKILLS   the first skill point is spent in the real Skills dialog and SAVED,
//               so the build the player picks is active from their first mission;
//   3. WORKSHOP the workshop is opened for the first time, on the real Armory tab.
// Then the Field School lists where to go next.
//
// Equipment comes before skills on purpose: putting on what the run earned is
// a reward the player can see, and a skill tree means nothing before there is
// gear to fight with.
//
// The sequence is storage-gated per account, so it runs once. Every step is
// injected: this module owns the ordering and the gate, the account owns the
// dialogs. If a step is declined the sequence stops without marking itself done,
// so it can be offered again instead of silently disappearing.
//
// `ENDING_EDITION` follows the same rule as the briefing edition in tutorial.mjs:
// it is raised whenever the step list changes, so accounts that finished an
// older order are offered the new one instead of silently skipping it.
export const ENDING_EDITION=2;
export const ENDING_KEY=`ironpath:firstrun:v${ENDING_EDITION}`;
export const ENDING_STEPS=Object.freeze(['equip','skills','workshop']);

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
// `shouldStop` is asked before every step: the account aborts the walkthrough
// this way when the player closes the guide in the Command Center (reported:
// the guide card and its SHOW TASK pill kept floating over the main menu after
// the tutorial ended, and closing them only paused - the pill came back).
export async function runFirstRunEnding({id,storage,steps,onStep=()=>{},onDone=()=>{},onStopped=()=>{},shouldStop=()=>false}={}){
 if(!id||endingDone(id,storage))return {status:'done',completed:0};
 let completed=0;
 for(const name of ENDING_STEPS){
  if(shouldStop()){onStopped({step:name,reason:'aborted',completed});return {status:'stopped',step:name,reason:'aborted',completed};}
  const step=steps?.[name];
  if(typeof step!=='function'){onStopped({step:name,reason:'unavailable',completed});return {status:'stopped',step:name,reason:'unavailable',completed};}
  onStep(name);
  let ok=false;
  try{ok=await step()===true;}catch{ok=false;}
  // The account can change while the last real dialog is open, too. Check
  // after *every* await, including the final step, before writing a marker or
  // letting a completed old walkthrough change the new session's interface.
  if(shouldStop()){onStopped({step:name,reason:'aborted',completed});return {status:'stopped',step:name,reason:'aborted',completed};}
  if(!ok){onStopped({step:name,reason:'declined',completed});return {status:'stopped',step:name,reason:'declined',completed};}
  completed++;
 }
 markEndingDone(id,storage);
 onDone({completed});
 return {status:'done',completed};
}

// Each delayed training-to-ending handoff owns its own marker. An older timer
// must not clear a newer handoff or allow an update while that handoff is still
// pending. The caller checks the captured account *session*, not just its UID.
export function createEndingHandoffs({isCurrent,offer,setTimer=setTimeout,delay=600}={}){
 if(typeof isCurrent!=='function'||typeof offer!=='function'||typeof setTimer!=='function'||!Number.isInteger(delay)||delay<0)throw Error('Invalid ending handoff');
 const pending=new Set();
 return Object.freeze({
  schedule(session){
   const marker={};pending.add(marker);
   try{setTimer(()=>{pending.delete(marker);if(isCurrent(session))offer(session);},delay);}
   catch(error){pending.delete(marker);throw error;}
  },
  isPending:()=>pending.size>0
 });
}

// What the Field School offers after the ending. `action` is the id of an
// existing control, so this menu never invents a second way into a screen.
export const FIELD_SCHOOL_ENTRIES=Object.freeze([
 Object.freeze({id:'armory',action:'armoryOpen',title:'Armory & Workshop',text:'Craft gear from scrap, equip it, and upgrade your bunker.'}),
 Object.freeze({id:'skills',action:'skillOpen',title:'Skills',text:'Spend skill points and save a build for your next mission.'}),
 Object.freeze({id:'campaign',action:'campaignShowBoard',title:'Campaign',text:'Each mission lists its threat: tougher units, more waves, a smaller bunker.'}),
 Object.freeze({id:'multiplayer',action:'partyToggle',title:'Multiplayer',text:'Two to four players, one party code, shared waves.'}),
]);

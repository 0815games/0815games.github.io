import {WAVE_COUNT,MAX_WAVE_MASK} from './combat.mjs?v=20261217-stormgate';
const validMode=mode=>mode==='solo'||mode==='coop';
export function waveFromMask(mask,block=0){if(!Number.isInteger(mask)||mask<=0||mask>MAX_WAVE_MASK||!Number.isSafeInteger(block)||block<0)return 0;const wave=block*WAVE_COUNT+32-Math.clz32(mask);return Number.isSafeInteger(wave)&&wave<=10000?wave:0;}
export function createLeaderboardService({db,auth,sdk}){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in required');const ref=p=>sdk.ref(db,p),check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Account changed');};
 const read=async p=>{check();const snap=await sdk.get(ref(p));check();return snap.val();};
 async function record(mode,wave,name){
  check();if(!validMode(mode)||!Number.isInteger(wave)||wave<1||wave>10000||typeof name!=='string')throw Error('Invalid score');
  const node=ref(`leaderboards/${mode}/${uid}`);let stop;try{
   await new Promise((resolve,reject)=>{stop=sdk.onValue(node,resolve,reject);});check();
   const result=await sdk.runTransaction(node,current=>{if(auth.currentUser?.uid!==uid)return;if(current&&current.wave>=wave)return;return {name,wave};},{applyLocally:false});check();
   const saved=result.snapshot.val();if(!saved||saved.wave<wave)throw Error('Score not saved');return saved;
  }finally{stop?.();}
 }
 async function friends(){
  const [incoming,outgoing]=await Promise.all([read(`friendships/${uid}`),read(`friendOutgoing/${uid}`)]),ids=new Set([uid]);
  for(const [id,edge] of Object.entries(incoming||{}))if(edge?.status==='accepted')ids.add(id);
  const edges=await Promise.all(Object.keys(outgoing||{}).map(async id=>[id,await read(`friendships/${id}/${uid}`)]));for(const [id,edge] of edges)if(edge?.status==='accepted')ids.add(id);return [...ids];
 }
 async function scores(mode,filter='all'){
  check();if(!validMode(mode)||!['all','friends'].includes(filter))throw Error('Invalid leaderboard');
  const ownPromise=read(`leaderboards/${mode}/${uid}`);let entries=[];
  if(filter==='friends'){const ids=await friends();entries=(await Promise.all(ids.map(async id=>({id,...(await read(`leaderboards/${mode}/${id}`))}))));}
  else {const snap=await sdk.get(sdk.query(ref(`leaderboards/${mode}`),sdk.orderByChild('wave'),sdk.limitToLast(50)));check();snap.forEach(child=>{entries.push({id:child.key,...child.val()});});}
  entries=entries.filter(x=>typeof x.name==='string'&&Number.isInteger(x.wave)&&x.wave>0).sort((a,b)=>b.wave-a.wave||a.id.localeCompare(b.id));return {entries,own:await ownPromise,uid};
 }
 return {record,scores};
}
// Coalesce snapshots and preserve pending high scores through temporary failures.
export function createScoreReporter({service,getName,onError=()=>{},onSuccess=()=>{},retryDelay=5000}){
 let closed=false;const states={solo:{best:0,pending:0,running:false,timer:null},coop:{best:0,pending:0,running:false,timer:null}};
 async function pump(mode){const state=states[mode];if(closed||state.running||state.pending<=state.best)return;state.running=true;const wave=state.pending;try{const saved=await service.record(mode,wave,getName());if(!closed){state.best=Math.max(state.best,saved.wave);onSuccess();}}catch(error){if(!closed){onError(error);state.timer=setTimeout(()=>{state.timer=null;void pump(mode);},retryDelay);state.timer.unref?.();}}finally{state.running=false;if(!closed&&!state.timer&&state.pending>state.best)void pump(mode);}}
 return {observe(mode,wave){if(closed||!validMode(mode)||!Number.isInteger(wave)||wave<1||wave>10000)return;const state=states[mode];state.pending=Math.max(state.pending,wave);if(!state.timer)void pump(mode);},close(){closed=true;for(const state of Object.values(states))if(state.timer)clearTimeout(state.timer);}};
}

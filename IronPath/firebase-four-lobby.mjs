// Staged four-player lobby adapter. Not wired to the UI. Firebase rules MUST
// enforce all actor, request, roster-lock and path constraints independently.
import {createPartyCode} from './party-code.mjs?v=20261101-shortcode1';
import {createFourLobby,transitionFourLobby} from './four-lobby.mjs?v=20261102-fourbase2';
const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const validParty=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
const validCode=code=>typeof code==='string'&&/^[0-9]{4}$/.test(code);
export function fourTeamRosters(manifest){if(!manifest||!Array.isArray(manifest.playerIds)||manifest.playerIds.length!==4||new Set(manifest.playerIds).size!==4||manifest.playerIds.some(id=>!validUid(id))||manifest.hostId!==manifest.playerIds[0]||!validConfig(manifest))throw Error('Invalid started roster');return [0,1].map(team=>manifest.playerIds.filter((_,i)=>manifest.teams[i]===team));}
function validConfig(config){return config&&['four-coop','two-vs-two'].includes(config.mode)&&Array.isArray(config.teams)&&config.teams.length===4&&config.teams.every(t=>t===0||t===1)&&config.teams.filter(t=>t===0).length===2;}
export function createFirebaseFourLobby({db,auth,sdk,crypto=globalThis.crypto}){
  if(!db||!auth||!sdk||!['ref','get','set','remove','runTransaction','onValue'].every(k=>typeof sdk[k]==='function')||typeof crypto?.getRandomValues!=='function')throw Error('Invalid four-player lobby configuration');
  const uid=auth.currentUser?.uid;if(!validUid(uid))throw Error('Sign in required');
  const check=()=>{if(auth.currentUser?.uid!==uid)throw Error('Party identity changed');};
  const ref=path=>sdk.ref(db,path),party=(id,path)=>{if(!validParty(id))throw Error('Invalid party');return ref(`fourParties/${id}/${path}`);};
  async function read(path){const value=(await sdk.get(path)).val();check();return value;}
  function code(){const bytes=new Uint32Array(1);do{crypto.getRandomValues(bytes);}while(bytes[0]>=4294960000);return String(bytes[0]%10000).padStart(4,'0');}
  function watch(path,callback,onError){check();if(typeof callback!=='function')throw Error('Callback required');return sdk.onValue(path,s=>{if(auth.currentUser?.uid===uid)callback(s.val());},onError);}
  return {
    async create(profile){
      check();createFourLobby(uid,profile);let partyId=null,inviteCode=null;
      try{
        for(let i=0;i<3;i++){const id=createPartyCode(crypto).partyId,result=await sdk.runTransaction(party(id,'hostId'),v=>v===null?uid:undefined,{applyLocally:false});check();if(result.committed){partyId=id;break;}}
        if(!partyId)throw Error('Could not reserve party');
        for(let i=0;i<40;i++){const candidate=code(),slot=ref(`fourCodes/${candidate}/hostId`);if(await read(slot)!==null)continue;try{const result=await sdk.runTransaction(slot,v=>v===null?uid:undefined,{applyLocally:false});check();if(result.committed){inviteCode=candidate;break;}}catch(error){check();if(await read(slot)!==null)continue;throw error;}}
        if(inviteCode===null)throw Error('No party code available');
        await sdk.set(party(partyId,'inviteCode'),inviteCode);check();await sdk.set(ref(`fourCodes/${inviteCode}/partyId`),partyId);check();
        await sdk.set(party(partyId,`profiles/${uid}`),profile);check();await sdk.set(party(partyId,'config'),{mode:'four-coop',teams:[0,0,1,1]});check();
        return {partyId,inviteCode,hostId:uid};
      }catch(error){if(inviteCode!==null)await sdk.remove(ref(`fourCodes/${inviteCode}`)).catch(()=>{});if(partyId)await sdk.remove(ref(`fourParties/${partyId}`)).catch(()=>{});throw error;}
    },
    async request(inviteCode,name){
      check();if(!validCode(inviteCode)||typeof name!=='string'||name.length<2||name.length>24)throw Error('Invalid request');
      const [hostId,partyId]=await Promise.all([read(ref(`fourCodes/${inviteCode}/hostId`)),read(ref(`fourCodes/${inviteCode}/partyId`))]);if(!validUid(hostId)||hostId===uid||!validParty(partyId))throw Error('Party unavailable');
      await sdk.set(ref(`fourCodes/${inviteCode}/requests/${uid}`),{name});check();return {partyId,inviteCode,hostId,uid};
    },
    async approve(partyId,inviteCode,guestId){
      check();if(!validCode(inviteCode)||!validUid(guestId)||guestId===uid)throw Error('Invalid approval');
      const [hostId,linked,started,request]=await Promise.all([read(party(partyId,'hostId')),read(ref(`fourCodes/${inviteCode}/partyId`)),read(party(partyId,'started')),read(ref(`fourCodes/${inviteCode}/requests/${guestId}`))]);
      if(hostId!==uid||linked!==partyId||started||!request)throw Error('Request unavailable');
      const result=await sdk.runTransaction(party(partyId,'slots'),current=>{
        const slots=current||{};if(Object.keys(slots).some(k=>!['one','two','three'].includes(k))||Object.values(slots).includes(guestId))return;
        const free=['one','two','three'].find(k=>!slots[k]);if(!free)return;return {...slots,[free]:guestId};
      },{applyLocally:false});check();if(!result.committed)throw Error('Roster full or changed');
      await sdk.remove(ref(`fourCodes/${inviteCode}/requests/${guestId}`));check();return true;
    },
    async publishProfile(partyId,profile){
      check();createFourLobby(uid,profile);const [hostId,slots,started]=await Promise.all([read(party(partyId,'hostId')),read(party(partyId,'slots')),read(party(partyId,'started'))]);
      if(started||hostId!==uid&&!Object.values(slots||{}).includes(uid))throw Error('Not an editable roster member');
      await sdk.set(party(partyId,`profiles/${uid}`),profile);check();
    },
    async configure(partyId,config){
      check();if(!validConfig(config)||(await read(party(partyId,'hostId')))!==uid||(await read(party(partyId,'started'))))throw Error('Cannot configure party');
      await sdk.set(party(partyId,'config'),{mode:config.mode,teams:[...config.teams]});check();
    },
    async start(partyId){
      check();const [hostId,slots,config,started]=await Promise.all([read(party(partyId,'hostId')),read(party(partyId,'slots')),read(party(partyId,'config')),read(party(partyId,'started'))]);
      const players=[hostId,slots?.one,slots?.two,slots?.three];if(hostId!==uid||started||!validConfig(config)||players.some(id=>!validUid(id))||new Set(players).size!==4)throw Error('Party is not ready');
      const profiles=await Promise.all(players.map(id=>read(party(partyId,`profiles/${id}`))));
      let model=createFourLobby(uid,profiles[0]);for(let i=1;i<4;i++){model=transitionFourLobby(model,uid,{type:'approve',uid:players[i]});model=model&&transitionFourLobby(model,players[i],{type:'profile',profile:profiles[i]});}model=model&&transitionFourLobby(model,uid,{type:'mode',mode:config.mode});model=model&&transitionFourLobby(model,uid,{type:'teams',teams:config.teams});model=model&&transitionFourLobby(model,uid,{type:'start'});if(!model)throw Error('Soldiers are not ready');
      const manifest={hostId,playerIds:players,mode:config.mode,teams:config.teams};
      // Rules must compare the manifest to the live slots/config/profiles at
      // commit time, otherwise a concurrent leave or approval can race this.
      const result=await sdk.runTransaction(party(partyId,'started'),value=>value===null?manifest:undefined,{applyLocally:false});check();if(!result.committed)throw Error('Party already started or changed');return {...manifest,teamRosters:fourTeamRosters(manifest),profiles};
    },
    async reconnect(partyId,inviteCode){
      check();if(!validCode(inviteCode)||(await read(ref(`fourCodes/${inviteCode}/partyId`)))!==partyId)throw Error('Party unavailable');const manifest=await read(party(partyId,'started'));if(!manifest||!Array.isArray(manifest.playerIds)||!manifest.playerIds.includes(uid))throw Error('Not in the started roster');return {...manifest,teamRosters:fourTeamRosters(manifest)};
    },
    async leave(partyId){
      check();const [hostId,slots,started]=await Promise.all([read(party(partyId,'hostId')),read(party(partyId,'slots')),read(party(partyId,'started'))]);if(hostId===uid||started)throw Error('Cannot leave locked roster');
      const slot=Object.keys(slots||{}).find(k=>slots[k]===uid);if(!slot)return false;
      const result=await sdk.runTransaction(party(partyId,`slots/${slot}`),value=>value===uid?null:undefined,{applyLocally:false});check();if(result.committed){await sdk.remove(party(partyId,`profiles/${uid}`));check();}return result.committed;
    },
    async reject(inviteCode,guestId){check();if(!validCode(inviteCode)||!validUid(guestId))throw Error('Invalid request');await sdk.remove(ref(`fourCodes/${inviteCode}/requests/${guestId}`));check();},
    async cancel(inviteCode){check();if(!validCode(inviteCode))throw Error('Invalid request');await sdk.remove(ref(`fourCodes/${inviteCode}/requests/${uid}`));check();},
    async close(partyId,inviteCode){check();if(!validCode(inviteCode)||(await read(party(partyId,'hostId')))!==uid)throw Error('Host required');await sdk.remove(ref(`fourCodes/${inviteCode}`));check();await sdk.remove(ref(`fourParties/${partyId}`));check();},
    watchSlots(partyId,callback,onError=()=>{}){return watch(party(partyId,'slots'),callback,onError);},
    watchStarted(partyId,callback,onError=()=>{}){return watch(party(partyId,'started'),callback,onError);},
    watchRequests(inviteCode,callback,onError=()=>{}){if(!validCode(inviteCode))throw Error('Invalid code');return watch(ref(`fourCodes/${inviteCode}/requests`),callback,onError);}
  };
}

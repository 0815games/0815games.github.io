// Pure four-player lobby state machine. A Firebase transaction/rules adapter
// must authenticate actors and verify requests; this is not authorization.
import {parseBuild,encodeBuild} from './skills.mjs?v=20261104-doctrines1';
const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const validProfile=p=>p&&typeof p.name==='string'&&p.name.length>=2&&p.name.length<=24&&['male','female'].includes(p.gender)&&Number.isInteger(p.level)&&p.level>=1&&p.level<=1000&&(p.loadout===undefined||/^([0-3],){2}(10|[0-9])(;[0-3],[0-3](;[0-3],[0-3])?)?$/.test(p.loadout))&&(p.skills===undefined||typeof p.skills==='string'&&encodeBuild(parseBuild(p.skills,p.level))===p.skills);
const clone=value=>JSON.parse(JSON.stringify(value));
export function createFourLobby(hostId,profile){
  if(!validUid(hostId)||!validProfile(profile))throw new Error('Invalid host profile');
  return {hostId,mode:'four-coop',slots:[{id:hostId,profile:clone(profile)},null,null,null],teams:[0,0,1,1],started:false};
}
// Return a detached next state, or null on rejection. Approval must additionally
// be tied to a pending authenticated join request in the eventual DB rules.
export function transitionFourLobby(current,actor,command){
  if(!current||!validUid(actor)||!command||typeof command.type!=='string'||!Array.isArray(current.slots)||current.slots.length!==4||!Array.isArray(current.teams)||current.teams.length!==4||!['four-coop','two-vs-two'].includes(current.mode)||typeof current.started!=='boolean'||current.slots[0]?.id!==current.hostId||!validUid(current.hostId))return null;
  const occupied=current.slots.filter(Boolean);if(occupied.some(p=>!validUid(p.id)||(p.profile!==null&&!validProfile(p.profile)))||new Set(occupied.map(p=>p.id)).size!==occupied.length||current.teams.some(t=>t!==0&&t!==1)||current.teams.filter(t=>t===0).length!==2)return null;
  const state=clone(current),host=actor===state.hostId,index=state.slots.findIndex(p=>p?.id===actor);
  switch(command.type){
    case 'approve': {
      if(!host||state.started||!validUid(command.uid)||state.slots.some(p=>p?.id===command.uid))return null;
      const free=state.slots.findIndex((p,i)=>i>0&&!p);if(free<0)return null;state.slots[free]={id:command.uid,profile:null};return state;
    }
    case 'profile':
      if(index<0||state.started||!validProfile(command.profile))return null;state.slots[index].profile=clone(command.profile);return state;
    case 'leave':
      if(index<1||state.started)return null;state.slots[index]=null;return state;
    case 'remove':
      if(!host||state.started||!validUid(command.uid))return null;{const slot=state.slots.findIndex((p,i)=>i>0&&p?.id===command.uid);if(slot<0)return null;state.slots[slot]=null;return state;}
    case 'mode':
      if(!host||state.started||!['four-coop','two-vs-two'].includes(command.mode))return null;state.mode=command.mode;return state;
    case 'teams':
      if(!host||state.started||!Array.isArray(command.teams)||command.teams.length!==4||command.teams.some(t=>t!==0&&t!==1)||command.teams.filter(t=>t===0).length!==2)return null;state.teams=[...command.teams];return state;
    case 'start':
      if(!host||state.started||state.slots.some(p=>!p||!validProfile(p.profile)))return null;state.started=true;return state;
    default:return null;
  }
}

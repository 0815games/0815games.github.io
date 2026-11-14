// Character deletion candidate. All discovered social data and the player are
// removed in ONE server-acknowledged, multi-location RTDB update. The companion
// social-cleanup Rules candidate is required; no Rules are deployed by this
// module. This cannot discover unindexed historical data or coordinate older
// tabs/devices. Do not describe it as an account-wide erasure guarantee.
const codePattern=/^[a-f0-9]{32}$/;
const keyPattern=/^(?:[a-f0-9]{2}){1,96}$/;
const validUid=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
function children(value){
 if(value===null)return {};
 if(typeof value!=='object')throw Error('Invalid stored social data');
 return value;
}
function ids(value,uid){
 const keys=Object.keys(children(value));
 if(keys.some(id=>!validUid(id)||id===uid))throw Error('Invalid stored social data');
 return keys;
}

export function createCharacterDeletion({db,auth,sdk,isCurrent=()=>true}={}){
 const uid=auth?.currentUser?.uid;
 if(!validUid(uid)||![sdk?.ref,sdk?.get,sdk?.update,isCurrent].every(fn=>typeof fn==='function'))throw Error('Invalid character deletion session');
 const ref=path=>sdk.ref(db,path),check=()=>{if(auth.currentUser?.uid!==uid||!isCurrent())throw Error('Account changed');};
 const read=async path=>{check();const snap=await sdk.get(ref(path));check();return snap.val();};
 return Object.freeze({
  async remove(expectedName){
   check();if(typeof expectedName!=='string'||expectedName.length<2||expectedName.length>24)throw Error('Invalid current soldier');
   const [player,privateValue,incomingValue,outgoingValue,inviteValue,presenceValue]=await Promise.all([
    read(`players/${uid}`),read(`friendPrivate/${uid}`),read(`friendships/${uid}`),
    read(`friendOutgoing/${uid}`),read(`coopInvites/${uid}`),read(`friendPresence/${uid}`)
   ]);
   if(!player||player.name!==expectedName)throw Error('Soldier changed');
   const privateData=children(privateValue),incoming=ids(incomingValue,uid),outgoing=ids(outgoingValue,uid),invites=ids(inviteValue,uid),presence=Object.keys(children(presenceValue));
   const {code,searchKey}=privateData;
   if((code!==undefined&&(!codePattern.test(code)||typeof code!=='string'))||
      (searchKey!==undefined&&(typeof searchKey!=='string'||!keyPattern.test(searchKey)))||
      presence.some(id=>!codePattern.test(id)))throw Error('Invalid stored social data');
   // Read only leaf edges: friendship deletion requires data.exists(), so do not
   // submit a delete for a missing edge. If a peer removes one between this
   // read and the atomic write, Rules reject the whole update and a retry is safe.
   const edges=[];
   for(let i=0;i<outgoing.length;i+=25){
    edges.push(...await Promise.all(outgoing.slice(i,i+25).map(async other=>[other,await read(`friendships/${other}/${uid}`)])));
   }
   const codeData=code===undefined?null:await read(`friendCodes/${code}`);
   if(codeData!==null&&codeData?.uid!==uid)throw Error('Invalid stored friend code');
   // Firebase's SDK expects Object.prototype.hasOwnProperty on the update map.
   // Every key has a fixed, slash-containing prefix, never a bare prototype key.
   const paths={},drop=path=>{paths[path]=null;};
   drop(`players/${uid}`);
   // The baseline leaderboard rules require the player to exist at evaluation
   // time, so scores and player must be deleted together, not afterwards.
   for(const mode of ['solo','coop'])drop(`leaderboards/${mode}/${uid}`);
   for(const other of incoming){drop(`friendships/${uid}/${other}`);drop(`friendOutgoing/${other}/${uid}`);}
   for(const [other,edge] of edges){drop(`friendOutgoing/${uid}/${other}`);if(edge!==null)drop(`friendships/${other}/${uid}`);}
   const peers=new Set([...incoming,...outgoing,...invites]);
   for(const other of peers){drop(`coopInvites/${uid}/${other}`);drop(`coopInvites/${other}/${uid}`);}
   if(searchKey!==undefined){drop(`friendNames/${searchKey}/${uid}`);drop(`friendPrivate/${uid}/searchKey`);}
   if(code!==undefined){if(codeData!==null)drop(`friendCodes/${code}`);drop(`friendPrivate/${uid}/code`);}
   for(const id of presence)drop(`friendPresence/${uid}/${id}`);
   check();await sdk.update(ref(),paths);check();
   return {incoming:incoming.length,outgoing:outgoing.length,invitations:invites.length};
  }
 });
}

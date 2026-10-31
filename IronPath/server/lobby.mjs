import { createHash, randomBytes } from 'node:crypto';

// In-memory lobby rules only. The caller MUST derive uid from verified authentication,
// keep finishMatch server-only, and add transport, rate limits and shared storage.
export function createLobbyRegistry({now=Date.now, waitingTtlMs=30*60_000, inviteTtlMs=5*60_000, maxLobbies=1000}={}) {
  if(typeof now!=='function'||!Number.isSafeInteger(waitingTtlMs)||waitingTtlMs<1||!Number.isSafeInteger(inviteTtlMs)||inviteTtlMs<1||!Number.isSafeInteger(maxLobbies)||maxLobbies<1)throw new Error('Invalid lobby configuration');
  const lobbies=new Map(),memberships=new Map(),invites=new Map(),matches=new Map();
  const fail=code=>{const error=new Error(code);error.code=code;throw error;};
  const validUid=uid=>typeof uid==='string'&&uid.length>0&&uid.length<=128;
  const token=()=>randomBytes(32).toString('base64url');
  const digest=value=>createHash('sha256').update(value).digest('hex');
  const view=lobby=>({id:lobby.id,ownerId:lobby.ownerId,players:[...lobby.players],status:lobby.status,expiresAt:lobby.expiresAt});
  function removeInvite(lobby){if(lobby.invite){invites.delete(lobby.invite.hash);lobby.invite=null;}}
  function remove(lobby){removeInvite(lobby);lobbies.delete(lobby.id);for(const uid of lobby.players)memberships.delete(uid);if(lobby.matchId)matches.delete(lobby.matchId);}
  function prune(){const time=now();for(const lobby of lobbies.values()){if(lobby.status==='waiting'&&time>=lobby.expiresAt)remove(lobby);else if(lobby.invite&&time>=lobby.invite.expiresAt)removeInvite(lobby);}}
  function identity(uid){if(!validUid(uid))fail('invalid-identity');}
  function member(uid){identity(uid);prune();const lobby=lobbies.get(memberships.get(uid));if(!lobby)fail('not-in-lobby');return lobby;}
  function owner(uid){const lobby=member(uid);if(lobby.ownerId!==uid)fail('not-owner');return lobby;}
  function waiting(lobby){if(lobby.status!=='waiting')fail('match-active');}
  function unique(map){let value;do{value=token();}while(map.has(value));return value;}
  return {
    create(uid){
      identity(uid);prune();if(memberships.has(uid))fail('already-in-lobby');if(lobbies.size>=maxLobbies)fail('capacity');
      const lobby={id:unique(lobbies),ownerId:uid,players:[uid],status:'waiting',expiresAt:now()+waitingTtlMs,invite:null,matchId:null};
      lobbies.set(lobby.id,lobby);memberships.set(uid,lobby.id);return view(lobby);
    },
    get(uid){return view(member(uid));},
    invite(uid){
      const lobby=owner(uid);waiting(lobby);if(lobby.players.length!==1)fail('lobby-full');
      removeInvite(lobby);let secret,hash;do{secret=token();hash=digest(secret);}while(invites.has(hash));
      const expiresAt=Math.min(lobby.expiresAt,now()+inviteTtlMs);lobby.invite={hash,expiresAt};invites.set(hash,lobby.id);
      return {secret,expiresAt};
    },
    revokeInvite(uid){const lobby=owner(uid);waiting(lobby);removeInvite(lobby);},
    join(uid,secret){
      identity(uid);prune();if(memberships.has(uid))fail('already-in-lobby');
      // All invalid, expired, revoked and consumed invitations have the same result.
      if(typeof secret!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(secret))fail('invalid-invite');
      const hash=digest(secret),lobby=lobbies.get(invites.get(hash));
      if(!lobby||lobby.status!=='waiting'||lobby.players.length!==1||lobby.invite?.hash!==hash)fail('invalid-invite');
      removeInvite(lobby);lobby.players.push(uid);memberships.set(uid,lobby.id);return view(lobby);
    },
    leave(uid){
      const lobby=member(uid);waiting(lobby);if(lobby.ownerId===uid){remove(lobby);return;}
      lobby.players=lobby.players.filter(player=>player!==uid);memberships.delete(uid);removeInvite(lobby);
    },
    start(uid){
      const lobby=owner(uid);waiting(lobby);if(lobby.players.length!==2)fail('need-two-players');
      removeInvite(lobby);lobby.status='active';lobby.expiresAt=null;lobby.matchId=unique(matches);matches.set(lobby.matchId,lobby.id);
      // This roster is for the trusted match allocator, not proof supplied by a client.
      return {matchId:lobby.matchId,players:[...lobby.players]};
    },
    // Trusted server lifecycle hook: call only after the match is actually stopped.
    finishMatch(matchId){const lobby=lobbies.get(matches.get(matchId));if(!lobby)return false;remove(lobby);return true;},
    prune
  };
}

// The soldier's face, carried across to the server - once.
//
// The face lives in its own optional profile field (`players/{uid}/avatar`),
// written when a soldier is enlisted. Every soldier who enlisted BEFORE that
// field existed - or before the published rules accepted it - keeps the face in
// the localStorage mirror and nowhere else: no second device, no friend list,
// no party roster can ever show it, and the mirror is deliberately NOT a
// cross-device record (it is a convenience, see avatar.mjs).
//
// So the profile listener hands the face over, and the decision is taken from
// the FIRST snapshot of the session:
//
//   * the server value, once it exists, is the truth and is never overwritten -
//     another device may have chosen a newer face, and that is the soldier's
//     business, not this session's;
//   * a face that disappears later in the same session (a purged field, a
//     cleanup) is NOT written back. The hand-over is a migration for soldiers
//     who never had one, not a claim that the field must always be filled;
//   * a refused write is NOT an error. Until the rules are published the field
//     does not exist, and a failed sync must never surface as a broken account,
//     a message or a retry loop - the mirror keeps the face and the next
//     session tries again;
//   * one attempt per session. A write that was refused today will be refused
//     the same way a minute from now.
//
// The profile listener delivers the new value on its own after a successful
// write, so nothing here mutates the profile in memory.
import {encodeAvatar,resolveAvatar} from './avatar.mjs?v=20261119-avatar3';

// A broken caller (no write, no session counter, no codec) is refused here and
// now, instead of failing later inside a profile listener where nobody would
// recognise the error.
export function createAvatarSync(options={}){
  const {write,storage=null,session=()=>0,encode=encodeAvatar,resolve=resolveAvatar}=options||{};
  if(typeof write!=='function')throw Error('Invalid avatar sync');
  if(typeof session!=='function')throw Error('Invalid avatar sync session');
  if([encode,resolve].some(fn=>typeof fn!=='function'))throw Error('Invalid avatar sync codec');
  let syncedSession=null;
  return Object.freeze({
    // 'written' - the server has the face now;
    // 'present' - it already had one, and that one wins;
    // 'refused' - the rules do not know the field (yet): the mirror keeps it;
    // 'skipped' - nothing to do in this session.
    async sync(profile){
      const version=session();
      // A new session (another account, a sign-out, a terminated session) gets a
      // fresh attempt; the same session never asks twice.
      if(syncedSession===version)return 'skipped';
      syncedSession=version;
      if(!profile)return 'skipped';
      if(typeof profile.avatar==='string'&&profile.avatar)return 'present';
      // The face this device shows: mirror first if the server has none, else
      // the gender's own default. Never the face of another profile.
      const encoded=encode(resolve(profile,storage));
      try{await write({avatar:encoded});}
      catch{return 'refused';}
      return 'written';
    },
    // Character deletion or a sign-out: the next session starts clean.
    reset(){syncedSession=null;},
    synced(){return syncedSession;}
  });
}

// A one-shot, non-identifying notice after a server-confirmed character
// deletion. sessionStorage survives the guarded runtime's full document
// replacement, but is scoped to this browser tab. No account ID is stored.
const KEY='ironpath:discharge-notice:v1';
const MARKER='confirmed';
export const DISCHARGE_MESSAGE='Your character has been discharged. Please sign in again.';

export function createDischargeNotice(storage=null){
 let armed=false,owner=null;
 function clear(){
  armed=false;owner=null;
  try{storage?.removeItem(KEY);}catch{/* In-memory fallback remains usable. */}
 }
 return Object.freeze({
  // Only call after the deletion update was acknowledged by the server.
  arm(user){
   if(!user||typeof user.uid!=='string'||!user.uid)throw Error('Invalid account');
   armed=true;owner=user;
   try{storage?.setItem(KEY,MARKER);}catch{/* No storage: use this document only. */}
  },
  cancel:clear,
  observe(user){
   if(user){
    // On a fresh document, a still-signed-in user means a pending notice did
    // not reach the login screen; never carry it into another account. During
    // the current sign-out, repeated notifications for the same user are safe.
    if(!armed||user!==owner)clear();
    return false;
   }
   let stored=false;try{stored=storage?.getItem(KEY)===MARKER;}catch{}
   const show=armed||stored;clear();return show;
  }
 });
}

// Handles sign-out AFTER an acknowledged deletion, separately from the
// deletion itself. A delayed rejection from an obsolete session must never
// cancel a later account's notice or update its UI.
export function createDischargeSignOut({auth,notice,logout,guarded=false,isCurrent,onFailure=()=>{}}={}){
 if(!auth||!notice||![notice.arm,notice.cancel,notice.observe,logout,isCurrent,onFailure].every(fn=>typeof fn==='function'))throw Error('Invalid discharge sign-out');
 let attempt=null;
 async function start(user,version){
  if(attempt?.busy)return false;
  if(!isCurrent(user,version)){if(attempt?.user===user&&attempt.version===version){attempt=null;notice.cancel();}return false;}
  const operation={user,version,busy:true};attempt=operation;notice.arm(user);
  try{
   await logout();
   // The guarded runtime destroys this document on logout. Normal Firebase
   // signOut must also have changed the actual Auth state when it resolves.
   if(!guarded&&auth.currentUser?.uid===user.uid)throw Error('Sign out not confirmed');
   if(attempt===operation)attempt=null;
   return true;
  }catch{
   if(attempt!==operation)return false;
   notice.cancel();
   if(isCurrent(user,version)){operation.busy=false;onFailure();}
   else attempt=null;
   return false;
  }
 }
 return Object.freeze({
  start,
  retry(){return attempt?start(attempt.user,attempt.version):Promise.resolve(false);},
  hasRetry(){return !!attempt;},
  observe(user){if(attempt&&user!==attempt.user)attempt=null;return notice.observe(user);}
 });
}

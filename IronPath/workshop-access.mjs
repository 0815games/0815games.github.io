// Who may open the workshop during the free-tier alpha.
//
// Two independent switches, both free to use:
//  1. A local opt-in (`?workshop=alpha`, remembered in localStorage) for the
//     owner's own devices. Nothing is deployed and no account data is exposed.
//  2. A server-side allow-list check against `workshopAlpha/<uid>` in the
//     database, so a tester can be enabled without shipping a new build. The
//     entry must be `true`; this read is owner-scoped in the candidate rules.
// The compile-time release gate still wins: if it is off, nobody gets in.
export const ACCESS_STORAGE_KEY='ironpath.workshop.access';

export function parseOptIn(search=''){
 try{const value=new URLSearchParams(search).get('workshop');return value===null?null:['alpha','1','on','true'].includes(value.toLowerCase());}catch{return null;}
}

function safeStorage(storage){try{return storage&&typeof storage.getItem==='function'?storage:null;}catch{return null;}}

// Returns the new remembered value (true/false), or null when storage is unusable.
export function rememberOptIn(storage,value){
 const target=safeStorage(storage);if(!target||typeof value!=='boolean')return null;
 try{value?target.setItem(ACCESS_STORAGE_KEY,'1'):target.removeItem(ACCESS_STORAGE_KEY);return value;}catch{return null;}
}
export function rememberedOptIn(storage){
 const target=safeStorage(storage);if(!target)return false;
 try{return target.getItem(ACCESS_STORAGE_KEY)==='1';}catch{return false;}
}

// Reads the allow-list entry once. Any error or missing value means "not allowed";
// this is a test switch, never an authorization decision for rewards.
export async function allowListed(sdk,db,uid){
 if(!sdk||typeof sdk.get!=='function'||!uid||typeof uid!=='string')return false;
 try{const snapshot=await sdk.get(sdk.ref(db,`workshopAlpha/${uid}`));return snapshot?.val?.()===true;}catch{return false;}
}

export function accessReason({releaseReady=false,optIn=false,allowListed=false}={}){
 if(!releaseReady)return 'release-gate';
 if(allowListed)return 'allow-list';
 if(optIn)return 'local-opt-in';
 return 'closed';
}
export const accessGranted=options=>accessReason(options)!=='closed'&&accessReason(options)!=='release-gate';

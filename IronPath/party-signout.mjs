// Optional host sign-out after a *confirmed* party close. Nothing here treats
// an end request, a timer or a local snapshot as proof that guests are done.
// The immediate sign-out choice remains available for a shared-device user.
export function createPartySignOut({isSessionCurrent,isPartyCurrent,canSignOutAfterClose,requestEnd,signOut,onState=()=>{}}){
  if(![isSessionCurrent,isPartyCurrent,canSignOutAfterClose,requestEnd,signOut,onState].every(fn=>typeof fn==='function'))throw Error('Invalid party sign-out configuration');
  let pending=null,generation=0;
  const status=value=>{try{onState(value);}catch{/* Feedback cannot change sign-out safety. */}};
  const current=scope=>{try{return isSessionCurrent(scope)===true;}catch{return false;}};
  const sameParty=scope=>{try{return isPartyCurrent(scope)===true;}catch{return false;}};
  function reset(){generation++;pending=null;status('idle');}
  async function choose(scope,choice){
    if(!scope||!current(scope)||!sameParty(scope)){if(scope&&current(scope))status('changed');return false;}
    if(choice==='cancel'){
      if(pending!==scope)return false;
      reset();return true;
    }
    if(choice==='now'){
      reset();
      try{await signOut(scope);return true;}catch{if(current(scope))status('signout-failed');return false;}
    }
    if(choice!=='wait')return false;
    if(pending===scope)return true;
    const turn=++generation;pending=scope;status('waiting');let requested=false;
    try{requested=await requestEnd(scope)===true;}catch{/* Keep the session, not a false completion. */}
    if(turn!==generation||pending!==scope)return true;
    if(!current(scope)){pending=null;generation++;return false;}
    if(!sameParty(scope)){pending=null;generation++;status('changed');return false;}
    if(!requested){pending=null;generation++;status('failed');return false;}
    return true;
  }
  async function completed(scope){
    if(!scope||pending!==scope)return false;
    pending=null;generation++;
    if(!current(scope))return false;
    let safe=false;try{safe=canSignOutAfterClose(scope)===true;}catch{}
    if(!safe){status('changed');return false;}
    status('idle');
    try{await signOut(scope);return true;}catch{if(current(scope))status('signout-failed');return false;}
  }
  return {choose,completed,isWaiting:scope=>pending===scope,reset};
}

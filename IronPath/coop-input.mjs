// Serialize commands for the transport's one-in-flight rule. A direction change
// is coalesced so releasing a key cannot leave a soldier moving indefinitely.
const deferredVotes=new Set(['startWave','approveWave','declineWave','cancelWave','requestSpeed','approveSpeed','declineSpeed','cancelSpeed','slowSpeed']);
export function createCoopInput(client,onError=()=>{}){
  let busy=false,busyType=null,queuedDirection=null,queuedAction=null,enabled=false,epoch=0;
  function cancelQueued(reason){
    if(!queuedAction)return;const item=queuedAction;queuedAction=null;clearTimeout(item.timer);item.resolve({ok:false,reason});
  }
  function setEnabled(value){
    enabled=value;
    if(!value){queuedDirection=null;epoch++;cancelQueued('Command cancelled when a player disconnected.');}
  }
  function drain(){
    if(!enabled||busy)return;
    // Sending a key release first avoids leaving the soldier moving while a
    // deferred action awaits its own network receipt.
    if(queuedDirection){const next=queuedDirection;queuedDirection=null;void direction(next);return;}
    if(!queuedAction)return;
    const item=queuedAction;queuedAction=null;clearTimeout(item.timer);
    let valid=false;try{valid=item.epoch===epoch&&item.isCurrent();}catch{}
    if(!valid){item.resolve({ok:false,reason:item.staleReason});return;}
    void send(item.command).then(item.resolve);
  }
  async function send(command){
    busy=true;busyType=command?.type;const current=epoch;
    try{return await client.command(command);}catch(error){if(current===epoch)onError(error.message);return {ok:false,reason:error.message};}
    finally{busy=false;busyType=null;drain();}
  }
  async function execute(command,{waitForDirection=false,waitForTower=false,isCurrent=null,onQueued=()=>{},maxWaitMs=2000,staleReason='The request changed. Please try again.'}={}){
    if(!enabled)return {ok:false,reason:'Co-op connection is not ready.'};
    if(!busy)return send(command);
    // Only an explicitly guarded vote may wait behind movement. A guarded
    // upgrade may also wait behind movement or reservation cleanup, never a
    // purchase. All other discrete actions remain strictly one-at-a-time.
    const vote=waitForDirection&&deferredVotes.has(command?.type)&&busyType==='direction';
    const upgrade=waitForTower&&command?.type==='upgrade'&&['direction','releaseBuild'].includes(busyType);
    if((!vote&&!upgrade)||queuedAction||typeof isCurrent!=='function'||!Number.isFinite(maxWaitMs)||maxWaitMs<=0)return {ok:false,reason:'Wait for the previous action.'};
    return new Promise(resolve=>{
      const item={command:{...command},epoch,isCurrent,resolve,staleReason,timer:null};queuedAction=item;
      item.timer=setTimeout(()=>{if(queuedAction===item)cancelQueued('Wait for the previous action and try again.');},maxWaitMs);
      try{onQueued();}catch{/* Feedback must not break input serialization. */}
    });
  }
  async function direction(command){
    if(!enabled)return;
    if(busy){queuedDirection=command;return;}
    const current=epoch,result=await execute(command);if(!result.ok&&enabled&&current===epoch)onError(result.reason);
  }
  return {setEnabled,execute,direction};
}

// Serialize commands for the transport's one-in-flight rule. A direction change
// is coalesced so releasing a key cannot leave a soldier moving indefinitely.
export function createCoopInput(client,onError=()=>{}){
  let busy=false,queuedDirection=null,enabled=false,epoch=0;
  function setEnabled(value){enabled=value;if(!value){queuedDirection=null;epoch++;}}
  async function execute(command){
    if(!enabled)return {ok:false,reason:'Co-op connection is not ready.'};
    if(busy)return {ok:false,reason:'Wait for the previous action.'};
    busy=true;const current=epoch;
    try{return await client.command(command);}catch(error){if(current===epoch)onError(error.message);return {ok:false,reason:error.message};}
    finally{busy=false;if(enabled&&queuedDirection){const next=queuedDirection;queuedDirection=null;void direction(next);}}
  }
  async function direction(command){
    if(!enabled)return;
    if(busy){queuedDirection=command;return;}
    const result=await execute(command);if(!result.ok&&enabled)onError(result.reason);
  }
  return {setEnabled,execute,direction};
}

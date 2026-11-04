// Host-authoritative speed vote. A vote is bound to one active wave and all
// roster members, including opponents. Never trust a client's proposed speed.
export function createSpeedControl(match,restored=null){
 const ids=Object.keys((match.mode==='four-coop'||match.mode==='two-vs-two'?match.members:match.players)||{});
 let next=Number.isSafeInteger(restored?.next)&&restored.next>0?restored.next:1,speed=1,request=null;
 const fields=()=>match.mode==='four-coop'?[match.match]:match.mode==='two-vs-two'?match.lanes:match.mode==='versus'?Object.values(match.lanes):[match];
 const active=id=>(match.mode==='four-coop'||match.mode==='two-vs-two'?match.members[id]:match.players[id])?.active!==false;
 function wave(){const f=fields();return f.length&&f.every(x=>x.running&&!x.ended&&x.wave===f[0].wave)?f[0].wave:null;}
 function reset(){speed=1;request=null;}
 function reconcile(){const current=wave();if(current===null||request&&request.wave!==current||!ids.every(active))reset();}
 function command(id,cmd){
  if(!ids.includes(id)||!active(id))return {ok:false,reason:'Player is offline.'};
  reconcile();
  if(cmd.type==='slowSpeed'){reset();return {ok:true};}
  if(cmd.type==='requestSpeed'){
   const current=wave();if(current===null||!ids.every(active))return {ok:false,reason:'All players must be connected and in an active wave.'};
   if(speed!==1||request)return {ok:false,reason:'Speed is already active or awaiting approval.'};
   if(ids.length<2)return {ok:false,reason:'Multiplayer requires at least two players.'};
   request={id:next++,requester:id,wave:current,required:ids.filter(x=>x!==id),approved:[]};return {ok:true,requestId:request.id};
  }
  if(!request||cmd.requestId!==request.id)return {ok:false,reason:'No matching speed request.'};
  if(cmd.type==='cancelSpeed'){if(request.requester!==id)return {ok:false,reason:'Only the requester can cancel.'};request=null;return {ok:true};}
  if(!request.required.includes(id)||request.approved.includes(id))return {ok:false,reason:'No speed approval is due.'};
  if(cmd.type==='declineSpeed'){request=null;return {ok:true};}
  if(cmd.type==='approveSpeed'){request.approved.push(id);if(request.approved.length===request.required.length){speed=2;request=null;}return {ok:true};}
  return {ok:false,reason:'Invalid speed command.'};
 }
 return {command,reconcile,reset,snapshot:()=>({speed,request:request?{...request,required:[...request.required],approved:[...request.approved]}:null}),checkpoint:()=>({next})};
}

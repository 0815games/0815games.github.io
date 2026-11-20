import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand} from '../four-modes.mjs';
import {projectFourGameView} from '../four-game-view.mjs';
const ids=['a','b','c','d'],players=()=>ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
test('co-op view maps the guest requester and all pending approvals without mutating host state',()=>{
 const game=createFourCoop(players(),'a'),result=applyFourCommand(game,'c',{type:'startWave'}),snapshot={tick:1,match:game};
 assert.equal(projectFourGameView(snapshot,'a').match.pendingWave,1);assert.equal(projectFourGameView(snapshot,'b').match.waveRequestId,result.requestId);
 assert.equal(projectFourGameView(snapshot,'a').match.waveRequesterName,'c');assert.equal(projectFourGameView(snapshot,'a').match.waveRequest.requester,'c');
 applyFourCommand(game,'b',{type:'approveWave',requestId:result.requestId});const view=projectFourGameView(snapshot,'b').match;assert.equal(view.pendingWave,1);assert.equal(view.fourInfo.waitingForOthers,true);assert.equal(view.waveRequest.approved.length,1);assert.equal(game.match.pendingWave,undefined);assert.equal(projectFourGameView(snapshot,'c').match.pendingWave,1);
 assert.ok(applyFourCommand(game,'c',{type:'cancelWave',requestId:result.requestId}).ok);
 const after=projectFourGameView(snapshot,'b').match;assert.equal(after.pendingWave,0);assert.equal(after.waveRequestId,result.requestId,'the last ID survives cancellation even when no vote is visible');
});
test('2v2 projects only the recipient team field and reports winner',()=>{
 const game=createTwoVsTwo(players(),'a',[['a','b'],['c','d']]);game.lanes[1].hp=42;game.ended=true;game.winnerTeam=1;const snapshot={match:game,tick:3};const view=projectFourGameView(snapshot,'c').match;assert.equal(view.players.c.name,'c');assert.equal(view.players.a,undefined);assert.equal(view.hostId,'a');assert.equal(view.fourInfo.team,1);assert.equal(view.fourInfo.otherHealth,100);assert.equal(view.fourInfo.winnerTeam,1);assert.throws(()=>projectFourGameView(snapshot,'e'));
});
test('2v2 speed requests show the requester across teams without exposing the other field in players',()=>{
 const game=createTwoVsTwo(players(),'a',[['a','b'],['c','d']]);
 const snapshot={match:game,tick:1,speedControl:{speed:1,request:{id:1,requester:'d',wave:1,required:['a','b','c'],approved:[]}}};
 const host=projectFourGameView(snapshot,'a').match;
 assert.equal(host.speedRequesterName,'d');assert.equal(host.players.d,undefined);
 assert.equal(projectFourGameView(snapshot,'c').match.speedRequesterName,'d');
 const missing=projectFourGameView({...snapshot,speedControl:{speed:1,request:null}},'a').match;
 assert.equal(missing.speedRequesterName,null);
});
test('fourInfo.memberStates exposes active and departed status for four-coop and two-vs-two',()=>{
 const coop=createFourCoop(players(),'a');
 coop.members.b.active=false;
 assert.equal(applyFourCommand(coop,'c',{type:'leaveRun'}).ok,true);
 const coopView=projectFourGameView({match:coop,tick:2},'a').match;
 assert.deepEqual(coopView.fourInfo.memberStates,{
  a:{active:true,departed:false},
  b:{active:false,departed:false},
  c:{active:false,departed:true},
  d:{active:true,departed:false}
 });
 const duel=createTwoVsTwo(players(),'a',[['a','b'],['c','d']]);
 assert.equal(applyFourCommand(duel,'d',{type:'leaveRun'}).ok,true);
 const duelView=projectFourGameView({match:duel,tick:4},'b').match;
 assert.deepEqual(duelView.fourInfo.memberStates,{
  a:{active:true,departed:false},
  b:{active:true,departed:false},
  c:{active:true,departed:false},
  d:{active:true,departed:true}
 });
});

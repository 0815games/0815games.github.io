import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand} from '../four-modes.mjs';
import {projectFourGameView} from '../four-game-view.mjs';
const ids=['a','b','c','d'],players=()=>ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
test('co-op view maps pending approvals for host and each guest without mutating host state',()=>{
 const game=createFourCoop(players(),'a'),result=applyFourCommand(game,'a',{type:'startWave'}),snapshot={tick:1,match:game};
 assert.equal(projectFourGameView(snapshot,'a').match.pendingWave,1);assert.equal(projectFourGameView(snapshot,'b').match.waveRequestId,result.requestId);
 applyFourCommand(game,'b',{type:'approveWave',requestId:result.requestId});const view=projectFourGameView(snapshot,'b').match;assert.equal(view.pendingWave,0);assert.equal(view.fourInfo.waitingForOthers,true);assert.equal(game.match.pendingWave,undefined);assert.equal(projectFourGameView(snapshot,'c').match.pendingWave,1);
});
test('2v2 projects only the recipient team field and reports winner',()=>{
 const game=createTwoVsTwo(players(),'a',[['a','b'],['c','d']]);game.lanes[1].hp=42;game.ended=true;game.winnerTeam=1;const snapshot={match:game,tick:3};const view=projectFourGameView(snapshot,'c').match;assert.equal(view.players.c.name,'c');assert.equal(view.players.a,undefined);assert.equal(view.hostId,'a');assert.equal(view.fourInfo.team,1);assert.equal(view.fourInfo.otherHealth,100);assert.equal(view.fourInfo.winnerTeam,1);assert.throws(()=>projectFourGameView(snapshot,'e'));
});

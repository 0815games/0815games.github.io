// Offline-only test harness: four local soldiers, no accounts or rewards saved.
import {createPlayer} from './match.mjs?v=20261102-fourbase1';
import {createFourCoop,createTwoVsTwo,applyFourCommand,stepFour} from './four-modes.mjs?v=20261103-unified1';
const IDS=['p1','p2','p3','p4'];
export function createFourTestSession(mode){
  if(!['four-coop','two-vs-two'].includes(mode))throw Error('Invalid test mode');
  const players=IDS.map((id,i)=>createPlayer(id,{name:`Player ${i+1}`,gender:i%2?'male':'female',level:1},1220,270+i*60));
  const game=mode==='four-coop'?createFourCoop(players,'p1'):createTwoVsTwo(players,'p1',[['p1','p2'],['p3','p4']]);
  return {game,ids:[...IDS],field(id){if(!IDS.includes(id))throw Error('Invalid player');return mode==='four-coop'?game.match:game.lanes[game.teams.findIndex(team=>team.includes(id))];},command(id,command){return applyFourCommand(game,id,command);},step(){return stepFour(game);},
    startWave(){const result=applyFourCommand(game,'p1',{type:'startWave'});if(!result.ok||!result.waitingForPlayers)return result;for(const id of [...game.pending.required]){const approval=applyFourCommand(game,id,{type:'approveWave',requestId:result.requestId});if(!approval.ok)return approval;}return {ok:true};}
  };
}

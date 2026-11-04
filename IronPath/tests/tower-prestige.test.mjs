import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {towerDisplay,upgradeCost,towerUpgradeInvestment} from '../progression.mjs';
import {createPlayer,applyCommand,towerRefund} from '../match.mjs';
import {createMatch,getTowerRange} from '../simulation.mjs';
import {towerDamage} from '../combat.mjs';
import {createPartyHost,restorePartyHost} from '../party-host.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand} from '../four-modes.mjs';
const profile={name:'Test',gender:'female',level:10};
const p=id=>createPlayer(id,profile);
test('prestige cycles keep growing and investment is accurately refundable',()=>{
 const s=createMatch([p('a')]);s.money=20000;assert.ok(applyCommand(s,'a',{type:'build',pad:0,towerType:0}).ok);
 const tower=s.towers[0];let spent=50;
 for(let level=1;level<=18;level++){
  assert.deepEqual(towerDisplay(tower.level),{level:(level-1)%6+1,prestige:Math.floor((level-1)/6)});
  const cost=upgradeCost(level),before=s.money,branch=tower.branch,range=getTowerRange(tower),damage=towerDamage(0,level,branch??null,'infantry');
  assert.ok(applyCommand(s,'a',{type:'upgrade',pad:0,branch:1}).ok);spent+=cost;
  assert.equal(s.money,before-cost);assert.equal(towerRefund(tower),Math.floor(spent/2));assert.equal(towerUpgradeInvestment(tower.level),spent-50);
  assert.ok(towerDamage(0,tower.level,tower.branch??null,'infantry')>damage);if(level>=3){assert.equal(tower.branch,branch);assert.equal(getTowerRange(tower),range);}
 }
 assert.deepEqual(towerDisplay(7),{level:1,prestige:1});assert.deepEqual(towerDisplay(13),{level:1,prestige:2});
 assert.equal(applyCommand(s,'a',{type:'sell',pad:0}).refund,Math.floor(spent/2));
 assert.equal(upgradeCost(Number.MAX_SAFE_INTEGER),null);assert.equal(towerUpgradeInvestment(Number.MAX_SAFE_INTEGER),null);
});
test('prestige costs supplies and stale concurrent upgrades cannot cross cycles',()=>{
 const s=createMatch([p('a'),p('b')]);s.players.a.money=10000;assert.ok(applyCommand(s,'a',{type:'build',pad:0,towerType:0}).ok);
 for(let i=1;i<6;i++)assert.ok(applyCommand(s,'a',{type:'upgrade',pad:0,branch:0}).ok);
 const t=s.towers[0],cmd={type:'upgrade',pad:0,branch:0,expectedTowerId:t.id,expectedLevel:6};
 assert.equal(applyCommand(s,'b',cmd).ok,false);assert.equal(t.level,6);
 assert.ok(applyCommand(s,'a',cmd).ok);assert.equal(t.level,7);assert.equal(applyCommand(s,'a',cmd).ok,false);assert.equal(t.level,7);
});
test('four-player and 2v2 route prestige upgrades through shared rules',()=>{
 for(const mode of ['coop','2v2']){const ps=['a','b','c','d'].map(p),s=mode==='coop'?createFourCoop(ps,'a'):createTwoVsTwo(ps,'a',[['a','b'],['c','d']]);const field=mode==='coop'?s.match:s.lanes[0];field.players.a.money=10000;
 assert.ok(applyFourCommand(s,'a',{type:'build',pad:0,towerType:0}).ok);for(let i=1;i<=6;i++)assert.ok(applyFourCommand(s,'a',{type:'upgrade',pad:0,branch:0}).ok);assert.equal(field.towers[0].level,7);}
});
test('host snapshots and recovery preserve prestige and stale-level protection',()=>{
 const s=createMatch([p('a'),p('b')]);s.players.a.money=10000;const host=createPartyHost(s,{hostId:'a'});host.setPresence('a',true);host.setPresence('b',true);
 const send=(seq,command)=>{assert.equal(host.receive('a',{version:1,seq,command}).status,'queued');return host.advance().commands[0].result;};
 assert.ok(send(1,{type:'build',pad:0,towerType:0}).ok);for(let seq=2;seq<=7;seq++)assert.ok(send(seq,{type:'upgrade',pad:0,branch:0}).ok);
 const view=host.snapshotFor('a');assert.equal(view.match.towers[0].level,7);
 const restored=restorePartyHost(host.checkpoint(),{hostId:'a',playerIds:['a','b'],mode:'coop'});restored.setPresence('a',true);restored.setPresence('b',true);assert.deepEqual(towerDisplay(restored.snapshotFor('a').match.towers[0].level),{level:1,prestige:1});
 assert.equal(restored.receive('a',{version:1,seq:8,command:{type:'upgrade',pad:0,branch:0,expectedTowerId:view.match.towers[0].id,expectedLevel:6}}).status,'queued');assert.equal(restored.advance().commands[0].result.ok,false);
});

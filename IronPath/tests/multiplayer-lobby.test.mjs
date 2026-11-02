import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {availablePartyModes,canStartParty} from '../multiplayer-lobby.mjs';
test('one lobby offers modes based on the number of ready participants',()=>{
 assert.deepEqual(availablePartyModes(1),[]);assert.deepEqual(availablePartyModes(2),['coop','versus']);assert.deepEqual(availablePartyModes(3),['four-coop']);assert.deepEqual(availablePartyModes(4),['four-coop','two-vs-two']);assert.deepEqual(availablePartyModes(5),[]);
 const profiles={a:{},b:{},c:{},d:{}};const check=(playerIds,mode,teams)=>canStartParty({playerIds,profiles,mode,teams});
 for(const mode of ['coop','versus'])assert.equal(check(['a','b'],mode),true);
 assert.equal(check(['a','b','c'],'four-coop'),true);assert.equal(check(['a','b','c'],'two-vs-two'),false);assert.equal(check(['a','b','c','d'],'two-vs-two',[0,1,0,1]),true);assert.equal(check(['a','b','c','d'],'two-vs-two',[0,0,0,1]),false);assert.equal(check(['a','b','c','d'],'coop'),false);assert.equal(check(['a','b','c','c'],'four-coop'),false);assert.equal(canStartParty({playerIds:['a','b','c'],profiles:{a:{},b:{}},mode:'four-coop'}),false);
});
